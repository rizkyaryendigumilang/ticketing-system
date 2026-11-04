import { pb, checkPbOnline } from './pbClient';
import { VPS_APPS } from '../config/vpsAppsConfig';
import type { AppSource, CrmUser, Ticket, TicketMessage } from '../types/crm';

// ── localStorage key helpers ────────────────────────────────────────────────
const LS = {
  apps: 'crm_apps',
  users: 'crm_users',
  tickets: 'crm_tickets',
  messages: 'crm_messages',
};

function lsGet<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
}

function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ── Seed Data ────────────────────────────────────────────────────────────────
const SEED_USERS: CrmUser[] = [
  { id: 'u-staff1', compositeKey: 'snackloop:staff1', appId: 'snackloop', externalUid: 'staff1', name: 'Staff Rekap', appRole: 'Staff Rekap & Transaksi Harian', systemRole: 'requester', createdAt: '2026-10-01T08:00:00Z', lastActiveAt: '2026-11-04T10:00:00Z' },
  { id: 'u-admin-kiky', compositeKey: 'snackloop:admin_kiky', appId: 'snackloop', externalUid: 'admin_kiky', name: 'Admin Kiky', appRole: 'Super Admin Owner', systemRole: 'requester', createdAt: '2026-10-01T08:00:00Z', lastActiveAt: '2026-11-04T09:00:00Z' },
  { id: 'u-employer', compositeKey: 'recruiter:employer@demo.com', appId: 'recruiter', externalUid: 'employer@demo.com', name: 'Employer UMKM', appRole: 'Employer UMKM', systemRole: 'requester', createdAt: '2026-10-05T09:00:00Z', lastActiveAt: '2026-11-03T14:00:00Z' },
  { id: 'u-kandidat', compositeKey: 'recruiter:kandidat@demo.com', appId: 'recruiter', externalUid: 'kandidat@demo.com', name: 'Kandidat Demo', appRole: 'Candidate', systemRole: 'requester', createdAt: '2026-10-10T10:00:00Z', lastActiveAt: '2026-11-02T11:00:00Z' },
  { id: 'u-wedding', compositeKey: 'wedding:admin@wedding.local', appId: 'wedding', externalUid: 'admin@wedding.local', name: 'Owner Wedding', appRole: 'Owner Web Acara', systemRole: 'requester', createdAt: '2026-10-15T08:00:00Z', lastActiveAt: '2026-11-04T08:00:00Z' },
  { id: 'u-kiky-lp', compositeKey: 'life-planner:kiky@lifeplanner.local', appId: 'life-planner', externalUid: 'kiky@lifeplanner.local', name: 'Kiky Life Planner', appRole: 'User / Superadmin', systemRole: 'requester', createdAt: '2026-10-20T09:00:00Z', lastActiveAt: '2026-11-04T07:00:00Z' },
  { id: 'u-kipchoge', compositeKey: 'ai-endurance:kipchoge@berlin.org', appId: 'ai-endurance', externalUid: 'kipchoge@berlin.org', name: 'Kipchoge', appRole: 'Athlete', systemRole: 'requester', createdAt: '2026-11-01T06:00:00Z', lastActiveAt: '2026-11-04T06:30:00Z' },
  { id: 'u-vault', compositeKey: 'kept:user@kept.local', appId: 'kept', externalUid: 'user@kept.local', name: 'Vault User', appRole: 'Vault User', systemRole: 'requester', createdAt: '2026-10-25T11:00:00Z', lastActiveAt: '2026-11-01T15:00:00Z' },
  { id: 'u-superadmin', compositeKey: 'system:admin', appId: 'system', externalUid: 'admin', name: 'Superadmin', email: 'admin@crm.local', appRole: 'CRM Administrator', systemRole: 'admin', createdAt: '2026-09-01T00:00:00Z', lastActiveAt: now() },
];

const SEED_TICKETS: Ticket[] = [
  {
    id: 't-snk-001', ticketNumber: 'SNK-001', appId: 'snackloop',
    requesterId: 'u-staff1', requesterName: 'Staff Rekap', requesterUid: 'staff1', requesterRole: 'Staff Rekap & Transaksi Harian',
    subject: 'Rekap harian tidak tersimpan setelah klik Simpan',
    description: 'Setiap kali saya klik tombol Simpan di halaman Rekap Harian, data tidak tersimpan dan halaman kembali kosong. Sudah dicoba 3 kali dengan data yang berbeda. Browser: Chrome 130.',
    category: 'bug_error', priority: 'high', status: 'open',
    sourcePageUrl: 'https://43.156.236.102/snackloop/rekap-harian',
    attachments: [], createdAt: '2026-11-04T07:30:00Z', updatedAt: '2026-11-04T07:30:00Z',
  },
  {
    id: 't-snk-002', ticketNumber: 'SNK-002', appId: 'snackloop',
    requesterId: 'u-admin-kiky', requesterName: 'Admin Kiky', requesterUid: 'admin_kiky', requesterRole: 'Super Admin Owner',
    subject: 'Export laporan CSV kosong padahal data ada',
    description: 'Ketika saya klik Export CSV di halaman Laporan Bulanan Oktober 2026, file yang didownload kosong (hanya header kolom). Padahal data transaksi sudah ada lebih dari 300 baris.',
    category: 'data_transaction', priority: 'medium', status: 'in_progress',
    sourcePageUrl: 'https://43.156.236.102/snackloop/laporan',
    attachments: [], createdAt: '2026-11-03T14:00:00Z', updatedAt: '2026-11-04T09:00:00Z',
  },
  {
    id: 't-rec-001', ticketNumber: 'REC-001', appId: 'recruiter',
    requesterId: 'u-employer', requesterName: 'Employer UMKM', requesterUid: 'employer@demo.com', requesterRole: 'Employer UMKM',
    subject: 'Tombol "Post Job" tidak muncul di dashboard employer',
    description: 'Saya tidak bisa menemukan tombol untuk membuat lowongan pekerjaan baru. Dashboard saya hanya menampilkan daftar pelamar lama tapi tombol Post Job hilang sejak update kemarin.',
    category: 'bug_error', priority: 'urgent', status: 'open',
    sourcePageUrl: 'https://43.156.236.102/recruiter/dashboard',
    attachments: [], createdAt: '2026-11-04T08:00:00Z', updatedAt: '2026-11-04T08:00:00Z',
  },
  {
    id: 't-rec-002', ticketNumber: 'REC-002', appId: 'recruiter',
    requesterId: 'u-kandidat', requesterName: 'Kandidat Demo', requesterUid: 'kandidat@demo.com', requesterRole: 'Candidate',
    subject: 'Upload CV gagal — file PDF ditolak sistem',
    description: 'Saya mencoba upload CV dalam format PDF (ukuran 2.3MB) tapi sistem menampilkan error "File type not supported". Padahal sebelumnya bisa upload PDF.',
    category: 'account_login', priority: 'medium', status: 'solved',
    sourcePageUrl: 'https://43.156.236.102/recruiter/profile/upload',
    attachments: [], resolutionSummary: 'Batas ukuran file sudah dinaikkan menjadi 10MB dan validasi format PDF diperbaiki. Silakan coba upload kembali.',
    createdAt: '2026-11-02T10:00:00Z', updatedAt: '2026-11-03T16:00:00Z', solvedAt: '2026-11-03T16:00:00Z',
  },
  {
    id: 't-wed-001', ticketNumber: 'WED-001', appId: 'wedding',
    requesterId: 'u-wedding', requesterName: 'Owner Wedding', requesterUid: 'admin@wedding.local', requesterRole: 'Owner Web Acara',
    subject: 'Kalender acara tidak sync dengan Google Calendar',
    description: 'Saya sudah connect Google Calendar tapi acara yang saya buat di Wedding Planner tidak muncul di Google Calendar saya. Sudah coba disconnect dan reconnect tapi masih sama.',
    category: 'feature_question', priority: 'high', status: 'open',
    sourcePageUrl: 'https://43.156.236.102/wedding/kalender',
    attachments: [], createdAt: '2026-11-04T06:00:00Z', updatedAt: '2026-11-04T06:00:00Z',
  },
  {
    id: 't-lfp-001', ticketNumber: 'LFP-001', appId: 'life-planner',
    requesterId: 'u-kiky-lp', requesterName: 'Kiky Life Planner', requesterUid: 'kiky@lifeplanner.local', requesterRole: 'User / Superadmin',
    subject: 'Habit tracker tidak menghitung streak dengan benar',
    description: 'Streak habit "Olahraga Pagi" saya seharusnya 15 hari berturut-turut tapi aplikasi menampilkan 3 hari. Ini terjadi sejak update v2.1 minggu lalu.',
    category: 'bug_error', priority: 'medium', status: 'in_progress',
    sourcePageUrl: 'https://43.156.236.102/life-planner/habits',
    attachments: [], createdAt: '2026-11-03T07:00:00Z', updatedAt: '2026-11-04T10:00:00Z',
  },
  {
    id: 't-aie-001', ticketNumber: 'AIE-001', appId: 'ai-endurance',
    requesterId: 'u-kipchoge', requesterName: 'Kipchoge', requesterUid: 'kipchoge@berlin.org', requesterRole: 'Athlete',
    subject: 'Data lari minggu lalu hilang setelah update aplikasi',
    description: 'Setelah update ke versi terbaru, semua data lari saya dari tanggal 28 Oktober - 3 November hilang. Total 6 sesi latihan dengan data pace, jarak, dan heart rate. Ini sangat krusial untuk persiapan lomba.',
    category: 'data_transaction', priority: 'urgent', status: 'open',
    sourcePageUrl: 'https://43.156.236.102:8445/dashboard',
    attachments: [], createdAt: '2026-11-04T05:00:00Z', updatedAt: '2026-11-04T05:00:00Z',
  },
  {
    id: 't-kpt-001', ticketNumber: 'KPT-001', appId: 'kept',
    requesterId: 'u-vault', requesterName: 'Vault User', requesterUid: 'user@kept.local', requesterRole: 'Vault User',
    subject: 'Password vault tidak bisa dibuka di Firefox 131',
    description: 'Di Chrome vault bisa dibuka normal tapi di Firefox 131 (Windows 11) layar loading terus menerus dan vault tidak pernah terbuka. Sudah clear cache dan disable semua extension.',
    category: 'bug_error', priority: 'low', status: 'solved',
    sourcePageUrl: 'https://43.156.236.102/kept/',
    attachments: [], resolutionSummary: 'Ditemukan konflik dengan CSS animation di Firefox. Sudah diperbaiki dengan vendor prefix. Silakan refresh halaman.',
    createdAt: '2026-11-01T14:00:00Z', updatedAt: '2026-11-02T11:00:00Z', solvedAt: '2026-11-02T11:00:00Z',
  },
];

const SEED_MESSAGES: TicketMessage[] = [
  { id: 'msg-1', ticketId: 't-snk-002', senderId: 'u-superadmin', senderName: 'Superadmin', senderRole: 'admin', body: 'Halo, terima kasih atas laporannya. Kami sedang menginvestigasi masalah export CSV ini. Sementara itu, bisa konfirmasi filter tanggal apa yang digunakan saat export?', attachments: [], isInternalNote: false, createdAt: '2026-11-04T09:00:00Z' },
  { id: 'msg-2', ticketId: 't-snk-002', senderId: 'u-superadmin', senderName: 'Superadmin', senderRole: 'admin', body: 'Internal: Cek query di endpoint /api/reports/export — kemungkinan bug di filter date range timezone offset.', attachments: [], isInternalNote: true, createdAt: '2026-11-04T09:05:00Z' },
  { id: 'msg-3', ticketId: 't-snk-002', senderId: 'u-admin-kiky', senderName: 'Admin Kiky', senderRole: 'requester', body: 'Filter yang dipakai: 1 Oktober - 31 Oktober 2026. Timezone WIB (UTC+7).', attachments: [], isInternalNote: false, createdAt: '2026-11-04T09:30:00Z' },
  { id: 'msg-4', ticketId: 't-lfp-001', senderId: 'u-superadmin', senderName: 'Superadmin', senderRole: 'admin', body: 'Sudah diidentifikasi bug pada kalkulasi streak saat user melewati hari tanpa check-in. Sedang diperbaiki di versi 2.1.1.', attachments: [], isInternalNote: false, createdAt: '2026-11-04T10:00:00Z' },
  { id: 'msg-5', ticketId: 't-rec-002', senderId: 'u-superadmin', senderName: 'Superadmin', senderRole: 'admin', body: 'Batas ukuran file sudah dinaikkan menjadi 10MB dan validasi format PDF diperbaiki. Silakan coba upload kembali.', attachments: [], isInternalNote: false, createdAt: '2026-11-03T16:00:00Z' },
  { id: 'msg-6', ticketId: 't-rec-002', senderId: 'system', senderName: 'System', senderRole: 'system', body: 'Tiket ditandai sebagai Solved pada 2026-11-03T16:00:00Z', attachments: [], isInternalNote: false, createdAt: '2026-11-03T16:00:00Z' },
  { id: 'msg-7', ticketId: 't-kpt-001', senderId: 'u-superadmin', senderName: 'Superadmin', senderRole: 'admin', body: 'Ditemukan konflik dengan CSS animation di Firefox. Sudah diperbaiki dengan vendor prefix. Silakan refresh halaman.', attachments: [], isInternalNote: false, createdAt: '2026-11-02T11:00:00Z' },
  { id: 'msg-8', ticketId: 't-kpt-001', senderId: 'system', senderName: 'System', senderRole: 'system', body: 'Tiket ditandai sebagai Solved pada 2026-11-02T11:00:00Z', attachments: [], isInternalNote: false, createdAt: '2026-11-02T11:00:00Z' },
];

// ── Seed initializer ─────────────────────────────────────────────────────────
export function seedIfEmpty(): void {
  if (lsGet(LS.apps).length === 0) {
    lsSet(LS.apps, VPS_APPS.map(app => ({ ...app })));
  }
  if (lsGet(LS.users).length === 0) {
    lsSet(LS.users, SEED_USERS);
  }
  if (lsGet(LS.tickets).length === 0) {
    lsSet(LS.tickets, SEED_TICKETS);
  }
  if (lsGet(LS.messages).length === 0) {
    lsSet(LS.messages, SEED_MESSAGES);
  }
}

// ── Generic PocketBase → localStorage adapters ───────────────────────────────

// APPS
export async function getApps(): Promise<AppSource[]> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const records = await pb.collection('apps').getFullList({ sort: 'name' });
      return records.map(r => ({
        id: r['slug'] as string,
        name: r['name'] as string,
        prefix: r['prefix'] as string,
        appUrl: r['app_url'] as string,
        adminDbUrl: r['admin_db_url'] as string | undefined,
        color: r['color'] as string,
        description: r['description'] as string,
      }));
    } catch {
      // fall through
    }
  }
  const local = lsGet<AppSource>(LS.apps);
  return local.length > 0 ? local : VPS_APPS;
}

// CRM USERS
export async function getUsers(): Promise<CrmUser[]> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const records = await pb.collection('crm_users').getFullList({ sort: '-created' });
      return records.map(r => ({
        id: r['id'] as string,
        compositeKey: r['composite_key'] as string,
        appId: r['app_id'] as string,
        externalUid: r['external_uid'] as string,
        name: r['name'] as string,
        email: r['email'] as string | undefined,
        appRole: r['app_role'] as string,
        systemRole: r['system_role'] as 'admin' | 'requester',
        createdAt: r['created'] as string,
        lastActiveAt: r['updated'] as string,
      }));
    } catch {
      // fall through
    }
  }
  return lsGet<CrmUser>(LS.users);
}

export async function getUserByCompositeKey(compositeKey: string): Promise<CrmUser | null> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const record = await pb.collection('crm_users').getFirstListItem(`composite_key="${compositeKey}"`);
      return {
        id: record['id'] as string,
        compositeKey: record['composite_key'] as string,
        appId: record['app_id'] as string,
        externalUid: record['external_uid'] as string,
        name: record['name'] as string,
        email: record['email'] as string | undefined,
        appRole: record['app_role'] as string,
        systemRole: record['system_role'] as 'admin' | 'requester',
        createdAt: record['created'] as string,
        lastActiveAt: record['updated'] as string,
      };
    } catch {
      // fall through
    }
  }
  const users = lsGet<CrmUser>(LS.users);
  return users.find(u => u.compositeKey === compositeKey) ?? null;
}

export async function upsertUser(data: Omit<CrmUser, 'id' | 'createdAt' | 'lastActiveAt'>): Promise<CrmUser> {
  const online = await checkPbOnline();
  const existing = await getUserByCompositeKey(data.compositeKey);
  
  if (online) {
    try {
      const payload = {
        composite_key: data.compositeKey,
        app_id: data.appId,
        external_uid: data.externalUid,
        name: data.name,
        email: data.email ?? '',
        app_role: data.appRole,
        system_role: data.systemRole,
      };
      if (existing) {
        const r = await pb.collection('crm_users').update(existing.id, payload);
        return { ...existing, lastActiveAt: r['updated'] as string };
      } else {
        const r = await pb.collection('crm_users').create(payload);
        return {
          id: r['id'] as string,
          compositeKey: r['composite_key'] as string,
          appId: r['app_id'] as string,
          externalUid: r['external_uid'] as string,
          name: r['name'] as string,
          email: r['email'] as string | undefined,
          appRole: r['app_role'] as string,
          systemRole: r['system_role'] as 'admin' | 'requester',
          createdAt: r['created'] as string,
          lastActiveAt: r['updated'] as string,
        };
      }
    } catch {
      // fall through
    }
  }
  
  // localStorage fallback
  const users = lsGet<CrmUser>(LS.users);
  if (existing) {
    const updated = { ...existing, ...data, lastActiveAt: now() };
    lsSet(LS.users, users.map(u => u.id === existing.id ? updated : u));
    return updated;
  } else {
    const newUser: CrmUser = { ...data, id: uid(), createdAt: now(), lastActiveAt: now() };
    lsSet(LS.users, [...users, newUser]);
    return newUser;
  }
}

// TICKETS
export async function getTickets(): Promise<Ticket[]> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const records = await pb.collection('tickets').getFullList({ sort: '-created' });
      return records.map(mapPbToTicket);
    } catch {
      // fall through
    }
  }
  return lsGet<Ticket>(LS.tickets).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const r = await pb.collection('tickets').getOne(id);
      return mapPbToTicket(r);
    } catch {
      // fall through
    }
  }
  const tickets = lsGet<Ticket>(LS.tickets);
  return tickets.find(t => t.id === id) ?? null;
}

export async function createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const r = await pb.collection('tickets').create({
        ticket_number: data.ticketNumber,
        app_id: data.appId,
        requester_id: data.requesterId,
        requester_name: data.requesterName,
        requester_uid: data.requesterUid,
        requester_role: data.requesterRole,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        source_page_url: data.sourcePageUrl ?? '',
        device_info: data.deviceInfo ?? '',
        attachments: data.attachments,
        resolution_summary: data.resolutionSummary ?? '',
      });
      return mapPbToTicket(r);
    } catch {
      // fall through
    }
  }
  const ticket: Ticket = { ...data, id: uid(), createdAt: now(), updatedAt: now() };
  const tickets = lsGet<Ticket>(LS.tickets);
  lsSet(LS.tickets, [ticket, ...tickets]);
  return ticket;
}

export async function updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const payload: Record<string, unknown> = {};
      if (data.status !== undefined) payload['status'] = data.status;
      if (data.priority !== undefined) payload['priority'] = data.priority;
      if (data.category !== undefined) payload['category'] = data.category;
      if (data.resolutionSummary !== undefined) payload['resolution_summary'] = data.resolutionSummary;
      if (data.solvedAt !== undefined) payload['solved_at'] = data.solvedAt;
      const r = await pb.collection('tickets').update(id, payload);
      return mapPbToTicket(r);
    } catch {
      // fall through
    }
  }
  const tickets = lsGet<Ticket>(LS.tickets);
  const idx = tickets.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Ticket not found: ' + id);
  const updated: Ticket = { ...tickets[idx], ...data, updatedAt: now() };
  tickets[idx] = updated;
  lsSet(LS.tickets, tickets);
  return updated;
}

// MESSAGES
export async function getMessages(ticketId: string): Promise<TicketMessage[]> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const records = await pb.collection('ticket_messages').getFullList({
        filter: `ticket_id="${ticketId}"`,
        sort: 'created',
      });
      return records.map(mapPbToMessage);
    } catch {
      // fall through
    }
  }
  return lsGet<TicketMessage>(LS.messages)
    .filter(m => m.ticketId === ticketId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addMessage(data: Omit<TicketMessage, 'id' | 'createdAt'>): Promise<TicketMessage> {
  const online = await checkPbOnline();
  if (online) {
    try {
      const r = await pb.collection('ticket_messages').create({
        ticket_id: data.ticketId,
        sender_id: data.senderId,
        sender_name: data.senderName,
        sender_role: data.senderRole,
        body: data.body,
        attachments: data.attachments ?? [],
        is_internal_note: data.isInternalNote,
      });
      return mapPbToMessage(r);
    } catch {
      // fall through
    }
  }
  const msg: TicketMessage = { ...data, id: uid(), createdAt: now() };
  const messages = lsGet<TicketMessage>(LS.messages);
  lsSet(LS.messages, [...messages, msg]);
  return msg;
}

// ── PocketBase record mappers ─────────────────────────────────────────────────
function mapPbToTicket(r: Record<string, unknown>): Ticket {
  return {
    id: r['id'] as string,
    ticketNumber: r['ticket_number'] as string,
    appId: r['app_id'] as string,
    requesterId: r['requester_id'] as string,
    requesterName: r['requester_name'] as string,
    requesterUid: r['requester_uid'] as string,
    requesterRole: r['requester_role'] as string,
    subject: r['subject'] as string,
    description: r['description'] as string,
    category: r['category'] as Ticket['category'],
    priority: r['priority'] as Ticket['priority'],
    status: r['status'] as Ticket['status'],
    sourcePageUrl: r['source_page_url'] as string | undefined,
    deviceInfo: r['device_info'] as string | undefined,
    attachments: (r['attachments'] as string[]) ?? [],
    resolutionSummary: r['resolution_summary'] as string | undefined,
    createdAt: r['created'] as string,
    updatedAt: r['updated'] as string,
    solvedAt: r['solved_at'] as string | undefined,
  };
}

function mapPbToMessage(r: Record<string, unknown>): TicketMessage {
  return {
    id: r['id'] as string,
    ticketId: r['ticket_id'] as string,
    senderId: r['sender_id'] as string,
    senderName: r['sender_name'] as string,
    senderRole: r['sender_role'] as TicketMessage['senderRole'],
    body: r['body'] as string,
    attachments: (r['attachments'] as string[]) ?? [],
    isInternalNote: r['is_internal_note'] as boolean,
    createdAt: r['created'] as string,
  };
}

// Re-export types for convenience
export type { CrmUser, Ticket, TicketMessage };
