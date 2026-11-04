// Pure CRM rules. No imports with runtime side effects, so `node --test` can run it directly.
import type { HandoffParams, Ticket, TicketMessage, TicketPriority, TicketStatus } from '../types/crm';

export const compositeKeyOf = (appId: string, externalUid: string) => `${appId}:${externalUid.trim()}`;

/** Accepts only absolute http(s) URLs. Blocks javascript:/data: links coming from query strings or forms. */
export function safeHttpUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export type HandoffResult = { ok: true; params: HandoffParams } | { ok: false; error: string };

export function parseHandoff(search: URLSearchParams, knownAppIds: string[]): HandoffResult {
  const app = (search.get('app') ?? '').trim();
  const uid = (search.get('uid') ?? '').trim();
  if (!app) return { ok: false, error: 'Link bantuan tidak menyertakan parameter app.' };
  if (!knownAppIds.includes(app)) {
    return { ok: false, error: `Aplikasi "${app}" belum terdaftar di helpdesk. Slug yang dikenal: ${knownAppIds.join(', ')}.` };
  }
  if (!uid) return { ok: false, error: 'Link bantuan tidak menyertakan parameter uid (username atau email di aplikasi asal).' };
  if (uid.length > 200) return { ok: false, error: 'Parameter uid terlalu panjang (maksimal 200 karakter).' };
  return {
    ok: true,
    params: {
      app,
      uid,
      name: (search.get('name') ?? '').trim().slice(0, 120) || uid,
      role: (search.get('role') ?? '').trim().slice(0, 120) || 'User',
      fromUrl: safeHttpUrl(search.get('from_url')),
    },
  };
}

/** Next number after the highest existing one for this prefix, so deleted tickets never cause reuse. */
export function nextTicketNumber(prefix: string, existing: string[]): string {
  let max = 0;
  for (const number of existing) {
    const [p, n] = number.split('-');
    if (p === prefix && /^\d+$/.test(n ?? '')) max = Math.max(max, Number(n));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function visibleMessages(messages: TicketMessage[], viewer: 'admin' | 'requester'): TicketMessage[] {
  return viewer === 'admin' ? messages : messages.filter((m) => !m.isInternalNote);
}

const STATUS_RANK: Record<TicketStatus, number> = { open: 0, in_progress: 1, waiting_on_user: 2, solved: 3, closed: 4 };
const PRIORITY_RANK: Record<TicketPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Queue order: open first, then by priority, then newest. */
export function sortQueue(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

export const ACTIVE_STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting_on_user'];

export interface TicketFilter {
  appId?: string;
  status?: TicketStatus | 'active' | 'all';
  priority?: TicketPriority | 'all';
  search?: string;
}

export function filterTickets(tickets: Ticket[], f: TicketFilter): Ticket[] {
  const q = f.search?.trim().toLowerCase();
  return tickets.filter(
    (t) =>
      (!f.appId || f.appId === 'all' || t.appId === f.appId) &&
      (!f.status || f.status === 'all' || (f.status === 'active' ? ACTIVE_STATUSES.includes(t.status) : t.status === f.status)) &&
      (!f.priority || f.priority === 'all' || t.priority === f.priority) &&
      (!q ||
        [t.ticketNumber, t.subject, t.requesterName, t.requesterUid].some((v) => v.toLowerCase().includes(q))),
  );
}

export type StatusCounts = Record<TicketStatus, number>;

export function countByApp(tickets: Ticket[], appIds: string[]): Record<string, StatusCounts> {
  const out: Record<string, StatusCounts> = {};
  for (const id of appIds) out[id] = { open: 0, in_progress: 0, waiting_on_user: 0, solved: 0, closed: 0 };
  for (const t of tickets) if (out[t.appId]) out[t.appId][t.status] += 1;
  return out;
}

/** A requester reply reopens a ticket that was waiting on them or already solved. */
export function statusAfterRequesterReply(status: TicketStatus): TicketStatus {
  return status === 'waiting_on_user' || status === 'solved' ? 'open' : status;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDuration(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} mnt`;
  if (hours < 48) return `${hours.toFixed(1).replace('.', ',')} jam`;
  return `${Math.round(hours / 24)} hari`;
}

/** 15-char [a-z0-9] id, the PocketBase record id format, so offline records keep their id after sync. */
export function newId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
