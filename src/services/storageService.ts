import { pb, checkPbOnline, mapRecord, prepareRecord, onPbStatusChange } from './pbClient';
import { VPS_APPS } from '../config/vpsAppsConfig';
import { buildSeed } from '../config/seedData';
import { newId, sortQueue } from './crmLogic';
import type { AppSource, CrmUser, Ticket, TicketMessage } from '../types/crm';

const LS = {
  apps: 'crm_v2_apps',
  users: 'crm_v2_users',
  tickets: 'crm_v2_tickets',
  messages: 'crm_v2_messages',
};

function lsGet<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function lsSet<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

const nowIso = (): string => new Date().toISOString();

export function seedIfEmpty(): void {
  const hasTickets = lsGet<Ticket>(LS.tickets).length > 0;
  const hasUsers = lsGet<CrmUser>(LS.users).length > 0;
  if (hasTickets && hasUsers) return;

  const seed = buildSeed();
  lsSet(LS.apps, VPS_APPS);
  if (!hasUsers) lsSet(LS.users, seed.users);
  if (!hasTickets) {
    lsSet(LS.tickets, seed.tickets);
    lsSet(LS.messages, seed.messages);
  }
}

export function resetSeedData(): void {
  const seed = buildSeed();
  lsSet(LS.apps, VPS_APPS);
  lsSet(LS.users, seed.users);
  lsSet(LS.tickets, seed.tickets);
  lsSet(LS.messages, seed.messages);
}

/**
 * When PocketBase becomes online, push any local records that aren't in PocketBase yet.
 */
export async function syncLocalToPocketBase(): Promise<void> {
  const online = await checkPbOnline();
  if (!online) return;

  try {
    const localUsers = lsGet<CrmUser>(LS.users);
    const remoteUsers = await pb.collection('crm_users').getFullList();
    const remoteUserKeys = new Set(remoteUsers.map((r) => r['composite_key'] as string));
    for (const u of localUsers) {
      if (u.systemRole === 'admin') continue;
      if (!remoteUserKeys.has(u.compositeKey)) {
        await pb
          .collection('crm_users')
          .create(prepareRecord('crm_users', u as unknown as Record<string, unknown>))
          .catch(() => {});
      }
    }

    const localTickets = lsGet<Ticket>(LS.tickets);
    const remoteTickets = await pb.collection('tickets').getFullList();
    const remoteNumbers = new Set(remoteTickets.map((r) => r['ticket_number'] as string));
    for (const t of localTickets) {
      if (!remoteNumbers.has(t.ticketNumber)) {
        await pb
          .collection('tickets')
          .create(prepareRecord('tickets', t as unknown as Record<string, unknown>))
          .catch(() => {});
      }
    }
  } catch {
    // Silent: PocketBase collections may not be initialized yet via npm run pb:init
  }
}

onPbStatusChange((online) => {
  if (online) {
    syncLocalToPocketBase().catch(() => {});
  }
});

// ── APPS ─────────────────────────────────────────────────────────────────────
export async function getApps(): Promise<AppSource[]> {
  if (await checkPbOnline()) {
    try {
      const records = await pb.collection('apps').getFullList({ sort: 'name' });
      if (records.length > 0) {
        const mapped = records.map((r) => mapRecord<AppSource>('apps', r));
        lsSet(LS.apps, mapped);
        return mapped;
      }
    } catch {
      // fall through to local
    }
  }
  const local = lsGet<AppSource>(LS.apps);
  return local.length > 0 ? local : VPS_APPS;
}

// ── CRM USERS ────────────────────────────────────────────────────────────────
export async function getUsers(): Promise<CrmUser[]> {
  seedIfEmpty();
  if (await checkPbOnline()) {
    try {
      const records = await pb.collection('crm_users').getFullList({ sort: '-created_at' });
      if (records.length > 0) {
        const mapped = records.map((r) => mapRecord<CrmUser>('crm_users', r));
        lsSet(LS.users, mapped);
        return mapped;
      }
    } catch {
      // fall through
    }
  }
  return lsGet<CrmUser>(LS.users).sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
}

export async function getUserByCompositeKey(compositeKey: string): Promise<CrmUser | null> {
  seedIfEmpty();
  if (await checkPbOnline()) {
    try {
      const escaped = compositeKey.replace(/"/g, '\\"');
      const r = await pb.collection('crm_users').getFirstListItem(`composite_key="${escaped}"`);
      return mapRecord<CrmUser>('crm_users', r);
    } catch {
      // fall through
    }
  }
  const users = lsGet<CrmUser>(LS.users);
  return users.find((u) => u.compositeKey === compositeKey) ?? null;
}

export async function upsertUser(
  data: Omit<CrmUser, 'id' | 'createdAt' | 'lastActiveAt'>,
): Promise<CrmUser> {
  seedIfEmpty();
  const existing = await getUserByCompositeKey(data.compositeKey);
  const ts = nowIso();

  if (await checkPbOnline()) {
    try {
      if (existing) {
        const updatePayload = prepareRecord('crm_users', {
          name: data.name || existing.name,
          email: data.email ?? existing.email,
          appRole: data.appRole || existing.appRole,
          lastSeenUrl: data.lastSeenUrl ?? existing.lastSeenUrl,
          lastActiveAt: ts,
        });
        const r = await pb.collection('crm_users').update(existing.id, updatePayload);
        const mapped = mapRecord<CrmUser>('crm_users', r);
        syncUserToLocal(mapped);
        return mapped;
      } else {
        const full: CrmUser = {
          ...data,
          id: newId(),
          createdAt: ts,
          lastActiveAt: ts,
        };
        const r = await pb
          .collection('crm_users')
          .create(prepareRecord('crm_users', full as unknown as Record<string, unknown>));
        const mapped = mapRecord<CrmUser>('crm_users', r);
        syncUserToLocal(mapped);
        return mapped;
      }
    } catch {
      // fall through to localStorage
    }
  }

  const users = lsGet<CrmUser>(LS.users);
  if (existing) {
    const updated: CrmUser = {
      ...existing,
      ...data,
      name: data.name || existing.name,
      appRole: data.appRole || existing.appRole,
      lastSeenUrl: data.lastSeenUrl ?? existing.lastSeenUrl,
      lastActiveAt: ts,
    };
    lsSet(
      LS.users,
      users.map((u) => (u.compositeKey === existing.compositeKey ? updated : u)),
    );
    return updated;
  }

  const created: CrmUser = {
    ...data,
    id: newId(),
    createdAt: ts,
    lastActiveAt: ts,
  };
  lsSet(LS.users, [created, ...users]);
  return created;
}

function syncUserToLocal(user: CrmUser) {
  const users = lsGet<CrmUser>(LS.users);
  const exists = users.some((u) => u.compositeKey === user.compositeKey);
  lsSet(
    LS.users,
    exists ? users.map((u) => (u.compositeKey === user.compositeKey ? user : u)) : [user, ...users],
  );
}

// ── TICKETS ──────────────────────────────────────────────────────────────────
export async function getTickets(): Promise<Ticket[]> {
  seedIfEmpty();
  if (await checkPbOnline()) {
    try {
      const records = await pb.collection('tickets').getFullList({ sort: '-created_at' });
      if (records.length > 0) {
        const mapped = records.map((r) => mapRecord<Ticket>('tickets', r));
        lsSet(LS.tickets, mapped);
        return sortQueue(mapped);
      }
    } catch {
      // fall through
    }
  }
  return sortQueue(lsGet<Ticket>(LS.tickets));
}

export async function getTicket(id: string): Promise<Ticket | null> {
  seedIfEmpty();
  if (await checkPbOnline()) {
    try {
      const r = await pb.collection('tickets').getOne(id);
      return mapRecord<Ticket>('tickets', r);
    } catch {
      // fall through
    }
  }
  const tickets = lsGet<Ticket>(LS.tickets);
  return tickets.find((t) => t.id === id || t.ticketNumber === id) ?? null;
}

export async function createTicket(
  data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Ticket> {
  seedIfEmpty();
  const ts = nowIso();
  const ticket: Ticket = {
    ...data,
    id: newId(),
    createdAt: ts,
    updatedAt: ts,
  };

  if (await checkPbOnline()) {
    try {
      const r = await pb
        .collection('tickets')
        .create(prepareRecord('tickets', ticket as unknown as Record<string, unknown>));
      const mapped = mapRecord<Ticket>('tickets', r);
      const local = lsGet<Ticket>(LS.tickets);
      lsSet(LS.tickets, [mapped, ...local]);
      return mapped;
    } catch {
      // fall through
    }
  }

  const tickets = lsGet<Ticket>(LS.tickets);
  lsSet(LS.tickets, [ticket, ...tickets]);
  return ticket;
}

export async function updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket> {
  seedIfEmpty();
  const ts = nowIso();
  const fullPatch: Partial<Ticket> = { ...patch, updatedAt: ts };

  if (await checkPbOnline()) {
    try {
      const r = await pb
        .collection('tickets')
        .update(id, prepareRecord('tickets', fullPatch as unknown as Record<string, unknown>));
      const mapped = mapRecord<Ticket>('tickets', r);
      const local = lsGet<Ticket>(LS.tickets);
      lsSet(
        LS.tickets,
        local.map((t) => (t.id === id ? { ...t, ...mapped } : t)),
      );
      return mapped;
    } catch {
      // fall through
    }
  }

  const tickets = lsGet<Ticket>(LS.tickets);
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`Tiket ${id} tidak ditemukan`);
  const updated: Ticket = { ...tickets[idx], ...fullPatch };
  tickets[idx] = updated;
  lsSet(LS.tickets, tickets);
  return updated;
}

// ── MESSAGES ─────────────────────────────────────────────────────────────────
export async function getMessages(ticketId: string): Promise<TicketMessage[]> {
  seedIfEmpty();
  if (await checkPbOnline()) {
    try {
      const escaped = ticketId.replace(/"/g, '\\"');
      const records = await pb.collection('ticket_messages').getFullList({
        filter: `ticket_id="${escaped}"`,
        sort: 'created_at',
      });
      if (records.length > 0) {
        return records.map((r) => mapRecord<TicketMessage>('ticket_messages', r));
      }
    } catch {
      // fall through
    }
  }
  return lsGet<TicketMessage>(LS.messages)
    .filter((m) => m.ticketId === ticketId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addMessage(
  data: Omit<TicketMessage, 'id' | 'createdAt'>,
): Promise<TicketMessage> {
  seedIfEmpty();
  const msg: TicketMessage = {
    ...data,
    attachments: data.attachments ?? [],
    id: newId(),
    createdAt: nowIso(),
  };

  if (await checkPbOnline()) {
    try {
      const r = await pb
        .collection('ticket_messages')
        .create(prepareRecord('ticket_messages', msg as unknown as Record<string, unknown>));
      const mapped = mapRecord<TicketMessage>('ticket_messages', r);
      const local = lsGet<TicketMessage>(LS.messages);
      lsSet(LS.messages, [...local, mapped]);
      return mapped;
    } catch {
      // fall through
    }
  }

  const messages = lsGet<TicketMessage>(LS.messages);
  lsSet(LS.messages, [...messages, msg]);
  return msg;
}
