// PocketBase adapter with offline fallback.
// Writes land in the local store + outbox first; when PocketBase answers, the outbox is sent,
// fresh data is pulled, and realtime events keep the store current.
import PocketBase, { ClientResponseError, type RecordModel } from 'pocketbase';
import { fromPbRecord, toPbRecord, type CollectionName } from '../config/pbSchema.ts';
import { nextTicketNumber } from './crmLogic.ts';
import {
  enqueue,
  getOutbox,
  removeLocal,
  replaceAll,
  setOutbox,
  upsertLocal,
  type Collection,
  type OutboxOp,
} from './storageService.ts';
import type { AppSource, CrmUser, Ticket, TicketMessage } from '../types/crm';

function resolvePbUrl(): string {
  const raw = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PB_URL)?.trim();
  if (raw) {
    if (raw.startsWith('/') && typeof window !== 'undefined') {
      return `${window.location.origin}${raw}`;
    }
    return raw;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `${window.location.origin}/helpdesk-pb`;
  }
  return 'http://127.0.0.1:8090';
}

export const PB_URL = resolvePbUrl();
export const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

export type Connection = 'checking' | 'online' | 'offline';
let connection: Connection = 'checking';
const connectionListeners = new Set<() => void>();

export type SyncErrorHandler = (message: string, op: OutboxOp) => void;
const syncErrorListeners = new Set<SyncErrorHandler>();

export function onSyncError(fn: SyncErrorHandler) {
  syncErrorListeners.add(fn);
  return () => {
    syncErrorListeners.delete(fn);
  };
}

export const getConnection = () => connection;
export function subscribeConnection(fn: () => void) {
  connectionListeners.add(fn);
  return () => {
    connectionListeners.delete(fn);
  };
}
function setConnection(next: Connection) {
  if (next === connection) return;
  connection = next;
  connectionListeners.forEach((fn) => fn());
}

export const isSuperuser = () => pb.authStore.isValid && pb.authStore.isSuperuser;

const fromPb = <T>(collection: CollectionName, rec: RecordModel) =>
  fromPbRecord(collection, rec, (r, name) => pb.files.getURL(r as RecordModel, name)) as T;

const statusOf = (e: unknown) => (e instanceof ClientResponseError ? e.status : 0);

/** Write locally, queue for PocketBase, try to send right away. */
export function saveRecord(collection: Collection, item: OutboxOp['item'], patch?: Record<string, unknown>, asAdmin = false) {
  upsertLocal(collection, item);
  enqueue({ collection, item, patch, asAdmin });
  void flush();
}

async function send(op: OutboxOp) {
  const col = pb.collection(op.collection);
  if (op.patch) {
    await col.update(op.item.id, toPbRecord(op.collection, op.patch));
    return;
  }
  try {
    await col.create(toPbRecord(op.collection, op.item as never));
  } catch (e) {
    if (statusOf(e) !== 400) throw e;
    const fields = (e as ClientResponseError).response?.data ?? {};
    if (fields.id) {
      // Same id already exists: a retry after a lost response, or a known user arriving from another device.
      if (op.collection === 'crm_users') {
        const { name, appRole, lastSeenUrl, lastActiveAt } = op.item as CrmUser;
        await col.update(op.item.id, toPbRecord('crm_users', { name, appRole, lastSeenUrl, lastActiveAt }));
      }
      return;
    }
    if (op.collection === 'tickets' && fields.ticket_number) {
      // Someone else took this number meanwhile: take the next free one and retry once.
      const ticket = op.item as Ticket;
      const prefix = ticket.ticketNumber.split('-')[0];
      const taken = await col.getFullList({ fields: 'ticket_number', filter: pb.filter('ticket_number ~ {:p}', { p: `${prefix}-` }) });
      const fixed = { ...ticket, ticketNumber: nextTicketNumber(prefix, taken.map((r) => r.ticket_number as string)) };
      upsertLocal('tickets', fixed);
      await col.create(toPbRecord('tickets', fixed as never));
      return;
    }
    throw e;
  }
}

let flushing: Promise<void> | null = null;

export function flush(): Promise<void> {
  if (connection !== 'online') return Promise.resolve();
  flushing ??= runFlush().finally(() => {
    flushing = null;
  });
  return flushing;
}

async function runFlush() {
  const ops = getOutbox();
  const kept: OutboxOp[] = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op.asAdmin && !isSuperuser()) {
      kept.push(op); // waits until the Superadmin signs in to PocketBase
      continue;
    }
    try {
      await send(op);
    } catch (e) {
      if (statusOf(e) === 0) {
        // Network gone: keep this op and everything after it (including ops queued during the flush).
        setOutbox([...kept, ...getOutbox().slice(i)]);
        setConnection('offline');
        return;
      }
      console.warn('PocketBase menolak perubahan ini, dilewati:', op, e);
      // Revert newly created phantom item from local store to prevent ghost records
      if (!op.patch) {
        removeLocal(op.collection, op.item.id);
      }
      const rawMsg =
        e instanceof ClientResponseError
          ? e.message || 'Perubahan ditolak server'
          : e instanceof Error
            ? e.message
            : 'Perubahan ditolak oleh server.';
      const errMsg = `Sinkronisasi gagal (${op.collection}): ${rawMsg}`;
      syncErrorListeners.forEach((fn) => fn(errMsg, op));
    }
  }
  setOutbox([...kept, ...getOutbox().slice(ops.length)]);
}

async function pull() {
  const [apps, users, tickets, messages] = await Promise.all([
    pb.collection('apps').getFullList(),
    pb.collection('crm_users').getFullList(),
    pb.collection('tickets').getFullList(),
    pb.collection('ticket_messages').getFullList({ sort: 'created_at' }),
  ]);
  replaceAll({
    apps: apps.map((r) => fromPb<AppSource>('apps', r)),
    users: users.map((r) => fromPb<CrmUser>('crm_users', r)),
    tickets: tickets.map((r) => fromPb<Ticket>('tickets', r)),
    messages: messages.map((r) => fromPb<TicketMessage>('ticket_messages', r)),
  });
}

const REALTIME: Collection[] = ['crm_users', 'tickets', 'ticket_messages'];

async function subscribeRealtime() {
  await pb.realtime.unsubscribe();
  await Promise.all(
    REALTIME.map((c) =>
      pb.collection(c).subscribe('*', (e) => {
        if (e.action === 'delete') removeLocal(c, e.record.id);
        else upsertLocal(c, fromPb(c, e.record));
      }),
    ),
  );
}

async function probe() {
  try {
    await pb.collection('tickets').getList(1, 1, { skipTotal: true, signal: AbortSignal.timeout(2500) });
    return true;
  } catch {
    return false;
  }
}

/** Send queued changes, reload everything, (re)subscribe. Run on reconnect and after login/logout. */
async function resync() {
  try {
    await flush();
    await pull();
    await subscribeRealtime();
  } catch (e) {
    console.warn('Sinkronisasi PocketBase gagal:', e);
  }
}

async function check() {
  const online = await probe();
  if (online && connection !== 'online') {
    setConnection('online');
    await resync();
  } else if (!online && connection !== 'offline') {
    setConnection('offline');
    pb.realtime.unsubscribe().catch(() => {});
  }
}

let ready: Promise<void> | null = null;

/** Starts the connection watcher once. Resolves after the first PocketBase check (max ~2.5 s). */
export function startSync(): Promise<void> {
  if (ready) return ready;
  ready = check();
  setInterval(check, 10_000);
  if (typeof window !== 'undefined') window.addEventListener('online', check);
  pb.authStore.onChange(() => {
    if (connection === 'online') void resync();
  });
  return ready;
}
