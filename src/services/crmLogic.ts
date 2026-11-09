// Pure CRM rules. No runtime imports, so `node --test` and the PocketBase seeder can use it directly.
import type { HandoffParams, Ticket, TicketMessage, TicketPriority, TicketStatus } from '../types/crm';

export const compositeKeyOf = (appId: string, externalUid: string) => `${appId}:${externalUid.trim()}`;

function cyrb53(str: string, seed: number): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Record id derived from the composite key, so the same person gets the same id on every device
 * and an offline-created user can never collide with the PocketBase copy.
 */
export function userIdFor(compositeKey: string): string {
  return (cyrb53(compositeKey, 1).toString(36) + cyrb53(compositeKey, 2).toString(36)).padStart(15, '0').slice(-15);
}

/** 15-char [a-z0-9] id, the PocketBase record id format, so offline records keep their id after sync. */
export function newId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(15)), (b) => alphabet[b % 36]).join('');
}

/** Accepts only absolute http(s) URLs. Blocks javascript:/data: links coming from query strings or forms. */
export function safeHttpUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const trimmed = raw.trim();
    // Block backslash bypasses (prevent open redirect via backslash bypass)
    if (trimmed.includes('\\')) return undefined;
    // Bound URL length to prevent memory consumption
    if (trimmed.length > 2048) return undefined;
    const url = new URL(trimmed);
    // Block embedded credentials (e.g. http://user:pass@evil.com)
    if (url.username || url.password) return undefined;
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

  // Sanitize strings: strip control characters (\0..\x1F, \x7F)
  const sanitize = (s: string) => s.replace(/[\x00-\x1F\x7F]/g, '').trim();
  const cleanUid = sanitize(uid);
  if (!cleanUid) return { ok: false, error: 'Parameter uid tidak valid.' };

  const rawName = sanitize(search.get('name') ?? '');
  const rawRole = sanitize(search.get('role') ?? '');

  return {
    ok: true,
    params: {
      app,
      uid: cleanUid,
      name: rawName.slice(0, 120) || cleanUid,
      role: rawRole.slice(0, 120) || 'User',
      fromUrl: safeHttpUrl(search.get('from_url')),
    },
  };
}

export function handoffPath(p: HandoffParams, openForm = false): string {
  const q = new URLSearchParams({ app: p.app, uid: p.uid, name: p.name, role: p.role });
  if (p.fromUrl) q.set('from_url', p.fromUrl);
  if (openForm) q.set('new', '1');
  return `/handoff?${q}`;
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
      (!q || [t.ticketNumber, t.subject, t.requesterName, t.requesterUid].some((v) => v.toLowerCase().includes(q))),
  );
}

export type StatusCounts = Record<TicketStatus, number>;

export function countByApp(tickets: Ticket[], appIds: string[]): Record<string, StatusCounts> {
  const out: Record<string, StatusCounts> = {};
  for (const id of appIds) out[id] = { open: 0, in_progress: 0, waiting_on_user: 0, solved: 0, closed: 0 };
  for (const t of tickets) if (out[t.appId]) out[t.appId][t.status] += 1;
  return out;
}

export function computeStats(tickets: Ticket[], now = Date.now()) {
  const count = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;
  const solved = tickets.filter((t) => t.solvedAt);
  const weekAgo = now - 7 * 86_400_000;
  return {
    open: count('open'),
    inProgress: count('in_progress'),
    waiting: count('waiting_on_user'),
    solvedThisWeek: solved.filter((t) => Date.parse(t.solvedAt!) >= weekAgo).length,
    avgResolutionMs: solved.length
      ? solved.reduce((sum, t) => sum + (Date.parse(t.solvedAt!) - Date.parse(t.createdAt)), 0) / solved.length
      : 0,
  };
}

/** A requester reply reopens a ticket that was waiting on them or already solved. */
export function statusAfterRequesterReply(status: TicketStatus): TicketStatus {
  return status === 'waiting_on_user' || status === 'solved' ? 'open' : status;
}

// Order matters: Edge's UA also contains "Chrome", Chrome's also contains "Safari".
const BROWSERS: [RegExp, string][] = [
  [/Edg\/(\d+)/, 'Edge'],
  [/Firefox\/(\d+)/, 'Firefox'],
  [/Chrome\/(\d+)/, 'Chrome'],
  [/Version\/(\d+).*Safari/, 'Safari'],
];
const SYSTEMS: [RegExp, string][] = [
  [/Windows/, 'Windows'],
  [/Android/, 'Android'],
  [/iPhone|iPad/, 'iOS'],
  [/Mac OS X/, 'macOS'],
  [/Linux/, 'Linux'],
];

export function describeDevice(ua: string): string {
  let browser = 'Browser lain';
  for (const [re, name] of BROWSERS) {
    const m = re.exec(ua);
    if (m) {
      browser = `${name} ${m[1]}`;
      break;
    }
  }
  const os = SYSTEMS.find(([re]) => re.test(ua))?.[1] ?? 'OS lain';
  return `${browser}, ${os}`;
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
