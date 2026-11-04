import PocketBase from 'pocketbase';
import { fromPbRecord, toPbRecord, type CollectionName } from '../config/pbSchema';

const rawUrl = (import.meta.env as Record<string, string | undefined>).VITE_PB_URL?.trim();
export const PB_URL = rawUrl && rawUrl.length > 0 ? rawUrl : 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

let _online = false;
let _lastCheck = 0;
const _listeners = new Set<(online: boolean) => void>();

function setOnline(next: boolean) {
  if (_online !== next) {
    _online = next;
    _listeners.forEach((fn) => fn(_online));
  }
}

export function isPbOnline(): boolean {
  return _online;
}

export function onPbStatusChange(listener: (online: boolean) => void): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

export async function checkPbOnline(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && now - _lastCheck < 8_000) return _online;
  _lastCheck = now;
  try {
    const res = await fetch(`${pb.baseUrl}/api/health`, {
      signal: AbortSignal.timeout(1800),
    });
    setOnline(res.ok);
  } catch {
    setOnline(false);
  }
  return _online;
}

export function resolvePbFileUrl(rec: Record<string, unknown>, filename: string): string {
  try {
    return pb.files.getURL(rec as never, filename);
  } catch {
    return filename;
  }
}

export function mapRecord<T>(collection: CollectionName, rec: Record<string, unknown>): T {
  return fromPbRecord(collection, rec, resolvePbFileUrl) as unknown as T;
}

export function prepareRecord(collection: CollectionName, obj: Record<string, unknown>): Record<string, unknown> {
  return toPbRecord(collection, obj);
}

/**
 * Subscribe to PocketBase realtime events for `tickets` and `ticket_messages`.
 * Returns an unsubscribe cleanup function safe to call in `useEffect`.
 */
export function subscribePbRealtime(onEvent: () => void): () => void {
  let active = true;
  let subscribed = false;

  checkPbOnline().then((online) => {
    if (!active || !online) return;
    subscribed = true;
    pb.collection('tickets').subscribe('*', () => {
      if (active) onEvent();
    }).catch(() => {});
    pb.collection('ticket_messages').subscribe('*', () => {
      if (active) onEvent();
    }).catch(() => {});
  });

  return () => {
    active = false;
    if (subscribed) {
      pb.collection('tickets').unsubscribe('*').catch(() => {});
      pb.collection('ticket_messages').unsubscribe('*').catch(() => {});
    }
  };
}

// Initial background check + periodic health poll so offline -> online transition triggers sync
checkPbOnline().catch(() => {});
if (typeof window !== 'undefined') {
  window.setInterval(() => {
    checkPbOnline(true).catch(() => {});
  }, 15_000);
}
