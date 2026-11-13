// Pure CRM rules. No runtime imports, so `node --test` and the PocketBase seeder can use it directly.
import type { HandoffParams, Ticket, TicketCategory, TicketMessage, TicketPriority, TicketStatus } from '../types/crm';

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

  const rawSubject = sanitize(search.get('subject') ?? '').slice(0, 200);
  const rawDesc = sanitize(search.get('description') ?? '').slice(0, 4000);
  const rawCat = search.get('category')?.trim();
  const validCat = (['bug_error', 'account_login', 'data_transaction', 'feature_question', 'other'] as const).includes(rawCat as any)
    ? (rawCat as any)
    : undefined;
  const rawPriority = search.get('priority')?.trim();
  const validPriority = (['urgent', 'high', 'medium', 'low'] as const).includes(rawPriority as any)
    ? (rawPriority as any)
    : undefined;

  return {
    ok: true,
    params: {
      app,
      uid: cleanUid,
      name: rawName.slice(0, 120) || cleanUid,
      role: rawRole.slice(0, 120) || 'User',
      fromUrl: safeHttpUrl(search.get('from_url')),
      newTicket: search.get('new') === '1',
      autoSubmit: search.get('auto_submit') === '1',
      subject: rawSubject || undefined,
      description: rawDesc || undefined,
      category: validCat,
      priority: validPriority,
    },
  };
}

export function handoffPath(p: HandoffParams, openForm = false): string {
  const q = new URLSearchParams({ app: p.app, uid: p.uid, name: p.name, role: p.role });
  if (p.fromUrl) q.set('from_url', p.fromUrl);
  if (openForm || p.newTicket) q.set('new', '1');
  if (p.autoSubmit) q.set('auto_submit', '1');
  if (p.subject) q.set('subject', p.subject);
  if (p.description) q.set('description', p.description);
  if (p.category) q.set('category', p.category);
  if (p.priority) q.set('priority', p.priority);
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
  messages?: TicketMessage[];
  assignedFilter?: 'all' | 'me' | 'unassigned';
  currentAdminId?: string;
}

export function filterTickets(tickets: Ticket[], f: TicketFilter): Ticket[] {
  const q = f.search?.trim().toLowerCase();
  return tickets.filter(
    (t) =>
      (!f.appId || f.appId === 'all' || t.appId === f.appId) &&
      (!f.status || f.status === 'all' || (f.status === 'active' ? ACTIVE_STATUSES.includes(t.status) : t.status === f.status)) &&
      (!f.priority || f.priority === 'all' || t.priority === f.priority) &&
      (!f.assignedFilter || f.assignedFilter === 'all' ||
        (f.assignedFilter === 'unassigned'
          ? !t.assignedTo
          : f.currentAdminId
          ? t.assignedTo === f.currentAdminId
          : Boolean(t.assignedTo))) &&
      (!q ||
        [t.ticketNumber, t.subject, t.description, t.requesterName, t.requesterUid, t.assignedToName].some((v) =>
          (v ?? '').toLowerCase().includes(q),
        ) ||
        Boolean(f.messages?.some((m) => m.ticketId === t.id && m.body.toLowerCase().includes(q)))),
  );
}

export type SlaStatus = 'on_track' | 'warning' | 'breached' | 'achieved';

export interface SlaInfo {
  deadline: number;
  durationMs: number;
  remainingMs: number;
  status: SlaStatus;
  label: string;
}

export const SLA_DURATIONS: Record<TicketPriority, number> = {
  urgent: 2 * 3600 * 1000,   // 2 jam
  high: 6 * 3600 * 1000,     // 6 jam
  medium: 24 * 3600 * 1000,  // 24 jam
  low: 48 * 3600 * 1000,     // 48 jam
};

export function computeTicketSla(ticket: Ticket, now = Date.now()): SlaInfo {
  const durationMs = SLA_DURATIONS[ticket.priority] || SLA_DURATIONS.medium;
  const createdMs = Date.parse(ticket.createdAt);
  const deadline = createdMs + durationMs;

  // If already solved or closed, check if solved within deadline
  if (ticket.status === 'solved' || ticket.status === 'closed') {
    const solvedMs = ticket.solvedAt ? Date.parse(ticket.solvedAt) : Date.parse(ticket.updatedAt || ticket.createdAt);
    const achieved = solvedMs <= deadline;
    return {
      deadline,
      durationMs,
      remainingMs: 0,
      status: achieved ? 'achieved' : 'breached',
      label: achieved ? 'SLA Tercapai' : 'SLA Terlewat',
    };
  }

  const remainingMs = deadline - now;
  if (remainingMs <= 0) {
    const overdueMinutes = Math.abs(Math.round(remainingMs / 60_000));
    return {
      deadline,
      durationMs,
      remainingMs,
      status: 'breached',
      label: overdueMinutes < 60 ? `Lewat ${overdueMinutes}m` : `Lewat ${Math.round(overdueMinutes / 60)}j`,
    };
  }

  const warningThreshold = Math.min(30 * 60_000, durationMs * 0.2);
  const isWarning = remainingMs <= warningThreshold;
  const remMinutes = Math.round(remainingMs / 60_000);

  return {
    deadline,
    durationMs,
    remainingMs,
    status: isWarning ? 'warning' : 'on_track',
    label: remMinutes < 60 ? `${remMinutes}m tersisa` : `${Math.floor(remMinutes / 60)}j ${remMinutes % 60}m`,
  };
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
  const rated = tickets.filter((t) => typeof t.satisfactionRating === 'number' && t.satisfactionRating > 0);
  const avgCsat = rated.length
    ? Number((rated.reduce((sum, t) => sum + (t.satisfactionRating ?? 0), 0) / rated.length).toFixed(1))
    : 0;

  return {
    open: count('open'),
    inProgress: count('in_progress'),
    waiting: count('waiting_on_user'),
    solvedThisWeek: solved.filter((t) => Date.parse(t.solvedAt!) >= weekAgo).length,
    avgResolutionMs: solved.length
      ? solved.reduce((sum, t) => sum + (Date.parse(t.solvedAt!) - Date.parse(t.createdAt)), 0) / solved.length
      : 0,
    avgCsat,
    totalRated: rated.length,
  };
}

export interface DailyTrendPoint {
  dateKey: string;      // "2026-11-13"
  label: string;        // "13 Nov"
  fullDate: string;     // "13 Nov 2026"
  created: number;
  solved: number;
}

export interface DashboardAnalytics {
  totalTickets: number;
  openCount: number;
  inProgressCount: number;
  waitingCount: number;
  solvedCount: number;
  closedCount: number;
  activeCount: number;
  resolutionRatePct: number;
  avgResolutionMs: number;
  avgCsat: number;
  totalRated: number;
  urgentOpenCount: number;
  dailyTrends: DailyTrendPoint[];
  categoryBreakdown: Record<TicketCategory, number>;
  priorityBreakdown: Record<TicketPriority, number>;
}

export function computeTrendMetrics(
  tickets: Ticket[],
  days: number = 7,
  now: number = Date.now(),
): DashboardAnalytics {
  const count = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;
  const openCount = count('open');
  const inProgressCount = count('in_progress');
  const waitingCount = count('waiting_on_user');
  const solvedCount = count('solved');
  const closedCount = count('closed');
  const activeCount = openCount + inProgressCount + waitingCount;

  const totalTickets = tickets.length;
  const resolutionRatePct = totalTickets > 0 ? Math.round(((solvedCount + closedCount) / totalTickets) * 100) : 0;

  const solvedTickets = tickets.filter((t) => t.solvedAt);
  const avgResolutionMs = solvedTickets.length
    ? solvedTickets.reduce((sum, t) => sum + (Date.parse(t.solvedAt!) - Date.parse(t.createdAt)), 0) / solvedTickets.length
    : 0;

  const rated = tickets.filter((t) => typeof t.satisfactionRating === 'number' && t.satisfactionRating > 0);
  const avgCsat = rated.length
    ? Number((rated.reduce((sum, t) => sum + (t.satisfactionRating ?? 0), 0) / rated.length).toFixed(1))
    : 0;

  const urgentOpenCount = tickets.filter(
    (t) => (t.priority === 'urgent' || t.priority === 'high') && (t.status === 'open' || t.status === 'in_progress'),
  ).length;

  const pointsCount = Math.min(Math.max(days, 1), 60);
  const dailyTrends: DailyTrendPoint[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = pointsCount - 1; i >= 0; i--) {
    const targetMs = now - i * 86_400_000;
    const d = new Date(targetMs);
    const dateKey = d.toISOString().slice(0, 10);
    const dayNum = d.getDate();
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    const created = tickets.filter((t) => t.createdAt && t.createdAt.slice(0, 10) === dateKey).length;
    const solved = tickets.filter((t) => t.solvedAt && t.solvedAt.slice(0, 10) === dateKey).length;

    dailyTrends.push({
      dateKey,
      label: `${dayNum} ${month}`,
      fullDate: `${dayNum} ${month} ${year}`,
      created,
      solved,
    });
  }

  const categoryBreakdown: Record<TicketCategory, number> = {
    bug_error: 0,
    account_login: 0,
    data_transaction: 0,
    feature_question: 0,
    other: 0,
  };
  for (const t of tickets) {
    if (categoryBreakdown[t.category] !== undefined) {
      categoryBreakdown[t.category] += 1;
    } else {
      categoryBreakdown.other += 1;
    }
  }

  const priorityBreakdown: Record<TicketPriority, number> = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const t of tickets) {
    if (priorityBreakdown[t.priority] !== undefined) {
      priorityBreakdown[t.priority] += 1;
    }
  }

  return {
    totalTickets,
    openCount,
    inProgressCount,
    waitingCount,
    solvedCount,
    closedCount,
    activeCount,
    resolutionRatePct,
    avgResolutionMs,
    avgCsat,
    totalRated: rated.length,
    urgentOpenCount,
    dailyTrends,
    categoryBreakdown,
    priorityBreakdown,
  };
}

/** Converts a list of tickets into a formatted RFC-4180 CSV string. */
export function formatTicketsCsv(tickets: Ticket[]): string {
  const headers = [
    'Nomor Tiket',
    'Aplikasi',
    'Pelapor',
    'Role Pelapor',
    'Subjek',
    'Kategori',
    'Prioritas',
    'Status',
    'Tanggal Masuk',
    'Tanggal Solved',
    'Rating CSAT',
    'Ringkasan Solusi',
  ];

  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = tickets.map((t) => [
    escapeCell(t.ticketNumber),
    escapeCell(t.appId),
    escapeCell(t.requesterName),
    escapeCell(t.requesterRole),
    escapeCell(t.subject),
    escapeCell(t.category),
    escapeCell(t.priority),
    escapeCell(t.status),
    escapeCell(t.createdAt),
    escapeCell(t.solvedAt || ''),
    escapeCell(t.satisfactionRating ? `${t.satisfactionRating}/5` : ''),
    escapeCell(t.resolutionSummary || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/** Triggers a browser file download of tickets in CSV format. */
export function downloadTicketsCsv(tickets: Ticket[], filename = `helpdesk-tickets-${new Date().toISOString().slice(0, 10)}.csv`) {
  const csvContent = formatTicketsCsv(tickets);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8 support
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Computes an HMAC-SHA256 signature for SSO Handoff parameters.
 * Signature payload format: "${app}:${uid}:${timestamp}"
 */
export async function createHandoffSignature(app: string, uid: string, timestamp: number, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const payload = `${app.trim()}:${uid.trim()}:${timestamp}`;
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sigBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface VerifySignatureResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verifies an HMAC-SHA256 signature for SSO Handoff parameters.
 * Validates timestamp age (max 15 minutes) and matches signature.
 */
export async function verifyHandoffSignature(
  search: URLSearchParams,
  secret: string,
  now = Math.floor(Date.now() / 1000),
  maxAgeSeconds = 900,
): Promise<VerifySignatureResult> {
  const sig = search.get('sig')?.trim();
  const tsRaw = search.get('ts')?.trim();
  const app = search.get('app')?.trim();
  const uid = search.get('uid')?.trim();

  if (!sig || !tsRaw) {
    return { valid: false, reason: 'Parameter sig atau ts tidak ada.' };
  }
  if (!app || !uid) {
    return { valid: false, reason: 'Parameter app atau uid tidak ada.' };
  }

  const ts = Number(tsRaw);
  if (isNaN(ts) || ts <= 0) {
    return { valid: false, reason: 'Timestamp ts tidak valid.' };
  }

  if (Math.abs(now - ts) > maxAgeSeconds) {
    return { valid: false, reason: 'Tautan handoff sudah kedaluwarsa (> 15 menit).' };
  }

  const expectedSig = await createHandoffSignature(app, uid, ts, secret);
  if (sig.toLowerCase() !== expectedSig.toLowerCase()) {
    return { valid: false, reason: 'Tanda tangan digital sig tidak valid (mismatch).' };
  }

  return { valid: true };
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
