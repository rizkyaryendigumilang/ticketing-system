// Shared seed data, imported by both the web app (offline fallback) and scripts/init-pocketbase.mjs.
// IDs use the PocketBase record id format (15 chars of [a-z0-9]), so the same records live in
// localStorage and PocketBase without remapping. Explicit .ts extension so Node can import it too.
import { userIdFor } from '../services/crmLogic.ts';
import type { AppSource, CrmUser, Ticket, TicketMessage } from '../types/crm';

export const SEED_APPS: AppSource[] = [
  {
    id: 'recruiter',
    name: 'Recruiter Portal',
    prefix: 'REC',
    appUrl: 'https://43.156.236.102/recruiter/login',
    adminDbUrl: 'https://43.156.236.102/recruiter-pb/_/',
    color: '#2459B3',
    description: 'Lowongan kerja UMKM dan lamaran kandidat',
  },
  {
    id: 'snackloop',
    name: 'Snackloop-ERP',
    prefix: 'SNK',
    appUrl: 'https://43.156.236.102/snackloop/',
    color: '#8B5A2B',
    description: 'Produksi, stok, dan rekap transaksi harian',
  },
  {
    id: 'wedding',
    name: 'Wedding Planner Web',
    prefix: 'WED',
    appUrl: 'https://43.156.236.102/wedding/login',
    adminDbUrl: 'https://43.156.236.102/_/',
    color: '#B4337A',
    description: 'Undangan, daftar tamu, dan jadwal acara',
  },
  {
    id: 'life-planner',
    name: 'Life Planner Web',
    prefix: 'LFP',
    appUrl: 'https://43.156.236.102/life-planner/',
    adminDbUrl: 'https://43.156.236.102/life-planner-pb/_/',
    color: '#0F766E',
    description: 'Target hidup, kebiasaan, dan jurnal',
  },
  {
    id: 'ai-endurance',
    name: 'AI Endurance Platform',
    prefix: 'AIE',
    appUrl: 'https://43.156.236.102:8445/login.html',
    color: '#6A7B16',
    description: 'Program latihan lari dengan analisis AI',
  },
  {
    id: 'kept',
    name: 'Kept Password Vault',
    prefix: 'KPT',
    appUrl: 'https://43.156.236.102/kept/',
    color: '#3D4A5C',
    description: 'Brankas kata sandi pribadi',
  },
  {
    id: 'diskon-bot',
    name: 'Diskon Bot Web',
    prefix: 'BOT',
    appUrl: 'https://43.156.236.102/diskon-bot/',
    color: '#0284A8',
    description: 'Bot Telegram pemantau harga dan promo',
  },
];

const id15 = (seed: string): string => (seed + '000000000000000').slice(0, 15);

/** senderId used for every message written by the Superadmin. */
export const ADMIN_SENDER_ID = 'system:admin';

export function buildSeed(now = Date.now()): {
  users: CrmUser[];
  tickets: Ticket[];
  messages: TicketMessage[];
} {
  const ago = (hours: number) => new Date(now - hours * 3_600_000).toISOString();

  const user = (
    appId: string,
    externalUid: string,
    name: string,
    appRole: string,
    createdHoursAgo: number,
    lastSeenUrl?: string,
  ): CrmUser => ({
    id: userIdFor(`${appId}:${externalUid}`),
    compositeKey: `${appId}:${externalUid}`,
    appId,
    externalUid,
    name,
    email: externalUid.includes('@') ? externalUid : undefined,
    appRole,
    systemRole: 'requester',
    lastSeenUrl,
    createdAt: ago(createdHoursAgo),
    lastActiveAt: ago(Math.min(createdHoursAgo, 2)),
  });

  const users: CrmUser[] = [
    user('snackloop', 'staff1', 'Rina (Staff Rekap)', 'Staff Rekap & Transaksi Harian', 720, 'https://43.156.236.102/snackloop/rekap-harian'),
    user('snackloop', 'admin_kiky', 'Kiky', 'Super Admin Owner', 900, 'https://43.156.236.102/snackloop/laporan'),
    user('recruiter', 'employer@demo.com', 'CV Sumber Rejeki', 'Employer UMKM', 400, 'https://43.156.236.102/recruiter/employer/dashboard'),
    user('recruiter', 'kandidat@demo.com', 'Dimas Pratama', 'Candidate', 300, 'https://43.156.236.102/recruiter/profile/cv'),
    user('wedding', 'admin@wedding.local', 'Sekar Ayu', 'Owner Web Acara', 500, 'https://43.156.236.102/wedding/guests'),
    user('life-planner', 'kiky@lifeplanner.local', 'Kiky', 'User / Superadmin', 600, 'https://43.156.236.102/life-planner/habits'),
    user('ai-endurance', 'kipchoge@berlin.org', 'Eliud Kipchoge', 'Athlete', 200, 'https://43.156.236.102:8445/dashboard.html'),
  ];
  const u = Object.fromEntries(users.map((x) => [x.externalUid, x]));

  const ticket = (
    key: string,
    number: string,
    appId: string,
    requester: CrmUser,
    fields: Omit<Ticket, 'id' | 'ticketNumber' | 'appId' | 'requesterId' | 'requesterName' | 'requesterUid' | 'requesterRole' | 'attachments'>,
  ): Ticket => ({
    id: id15('tkt' + key),
    ticketNumber: number,
    appId,
    requesterId: requester.id,
    requesterName: requester.name,
    requesterUid: requester.externalUid,
    requesterRole: requester.appRole,
    attachments: [],
    ...fields,
  });

  const tickets: Ticket[] = [
    ticket('snk001', 'SNK-001', 'snackloop', u['staff1'], {
      subject: 'Rekap harian tidak tersimpan setelah klik Simpan',
      description:
        'Setiap klik Simpan di halaman Rekap Harian, muncul loading sebentar lalu form kosong lagi. Data penjualan 4 outlet hari ini belum masuk sama sekali. Sudah dicoba 3 kali.',
      category: 'bug_error', priority: 'high', status: 'open',
      sourcePageUrl: 'https://43.156.236.102/snackloop/rekap-harian',
      deviceInfo: 'Chrome 130 · Windows',
      createdAt: ago(2), updatedAt: ago(2),
    }),
    ticket('snk002', 'SNK-002', 'snackloop', u['admin_kiky'], {
      subject: 'Export laporan Oktober ke CSV hanya berisi header',
      description:
        'Laporan Bulanan Oktober 2026 punya 312 transaksi di layar, tapi file CSV hasil export hanya berisi baris judul kolom.',
      category: 'data_transaction', priority: 'medium', status: 'in_progress',
      sourcePageUrl: 'https://43.156.236.102/snackloop/laporan',
      deviceInfo: 'Edge 130 · Windows',
      createdAt: ago(26), updatedAt: ago(20),
    }),
    ticket('rec001', 'REC-001', 'recruiter', u['employer@demo.com'], {
      subject: 'Tombol Pasang Lowongan hilang dari dashboard',
      description:
        'Sejak kemarin sore tombol untuk membuat lowongan baru tidak ada. Hanya muncul daftar pelamar lama. Kami perlu buka lowongan kasir minggu ini.',
      category: 'bug_error', priority: 'urgent', status: 'open',
      sourcePageUrl: 'https://43.156.236.102/recruiter/employer/dashboard',
      deviceInfo: 'Safari 18 · macOS',
      createdAt: ago(1.5), updatedAt: ago(1.5),
    }),
    ticket('rec002', 'REC-002', 'recruiter', u['kandidat@demo.com'], {
      subject: 'Upload CV PDF ditolak: format tidak didukung',
      description: 'CV saya PDF 2,3 MB. Muncul pesan "File type not supported" padahal minggu lalu bisa.',
      category: 'account_login', priority: 'medium', status: 'solved',
      sourcePageUrl: 'https://43.156.236.102/recruiter/profile/cv',
      deviceInfo: 'Chrome 129 · Android',
      resolutionSummary: 'Validasi tipe file diperbaiki dan batas ukuran dinaikkan ke 10 MB. Silakan upload ulang CV-nya.',
      createdAt: ago(52), updatedAt: ago(30), solvedAt: ago(30),
    }),
    ticket('wed001', 'WED-001', 'wedding', u['admin@wedding.local'], {
      subject: 'Export daftar tamu RSVP ke Excel gagal',
      description:
        'Klik Export Excel di halaman Daftar Tamu, file terunduh tapi tidak bisa dibuka ("file rusak"). Ada 418 tamu. Acaranya Sabtu ini.',
      category: 'data_transaction', priority: 'high', status: 'open',
      sourcePageUrl: 'https://43.156.236.102/wedding/guests',
      deviceInfo: 'Chrome 130 · Windows',
      createdAt: ago(4), updatedAt: ago(4),
    }),
    ticket('wed002', 'WED-002', 'wedding', u['admin@wedding.local'], {
      subject: 'Bisa tambah template undangan tema adat Jawa?',
      description: 'Klien minta undangan digital nuansa adat Jawa (gunungan, batik parang). Apakah bisa ditambahkan ke pilihan template?',
      category: 'feature_question', priority: 'low', status: 'waiting_on_user',
      sourcePageUrl: 'https://43.156.236.102/wedding/invitations/templates',
      createdAt: ago(75), updatedAt: ago(48),
    }),
    ticket('lfp001', 'LFP-001', 'life-planner', u['kiky@lifeplanner.local'], {
      subject: 'Streak kebiasaan reset padahal check-in tiap hari',
      description: 'Streak "Olahraga pagi" harusnya 15 hari, tampil 3 hari. Mulai terjadi setelah update minggu lalu.',
      category: 'bug_error', priority: 'medium', status: 'in_progress',
      sourcePageUrl: 'https://43.156.236.102/life-planner/habits',
      deviceInfo: 'Firefox 131 · Windows',
      createdAt: ago(30), updatedAt: ago(6),
    }),
    ticket('aie001', 'AIE-001', 'ai-endurance', u['kipchoge@berlin.org'], {
      subject: 'Enam sesi latihan hilang setelah sinkronisasi Garmin',
      description:
        'Sesi 28 Oktober sampai 3 November (pace, jarak, detak jantung) hilang dari riwayat setelah sinkron ulang. Rencana latihan AI jadi menurunkan volume minggu ini.',
      category: 'data_transaction', priority: 'urgent', status: 'open',
      sourcePageUrl: 'https://43.156.236.102:8445/dashboard.html',
      deviceInfo: 'Chrome 130 · macOS',
      createdAt: ago(5), updatedAt: ago(5),
    }),
  ];
  const t = Object.fromEntries(tickets.map((x) => [x.ticketNumber, x]));

  const ADMIN = { senderId: ADMIN_SENDER_ID, senderName: 'Superadmin', senderRole: 'admin' as const };
  let n = 0;
  const msg = (
    tk: Ticket,
    sender: { senderId: string; senderName: string; senderRole: 'admin' | 'requester' | 'system' },
    body: string,
    hoursAgo: number,
    isInternalNote = false,
  ): TicketMessage => ({
    id: id15('msg' + String(++n).padStart(4, '0')),
    ticketId: tk.id,
    ...sender,
    body,
    attachments: [],
    isInternalNote,
    createdAt: ago(hoursAgo),
  });
  const from = (usr: CrmUser) => ({ senderId: usr.id, senderName: usr.name, senderRole: 'requester' as const });

  const messages: TicketMessage[] = [
    msg(t['SNK-002'], ADMIN, 'Terima kasih, sedang kami cek. Filter tanggal yang dipakai saat export apa ya?', 24),
    msg(t['SNK-002'], ADMIN, 'Kemungkinan filter tanggal di /api/reports/export masih UTC, data WIB tanggal 31 jatuh ke luar rentang. Cek juga limit query.', 23.8, true),
    msg(t['SNK-002'], from(u['admin_kiky']), '1 Oktober sampai 31 Oktober 2026.', 20),
    msg(t['REC-002'], ADMIN, 'Validasi tipe file diperbaiki dan batas ukuran dinaikkan ke 10 MB. Silakan upload ulang CV-nya.', 30),
    msg(t['REC-002'], { senderId: 'system', senderName: 'Sistem', senderRole: 'system' }, 'Superadmin mengubah status ke Solved.', 30),
    msg(t['WED-002'], ADMIN, 'Bisa. Boleh kirim 2–3 contoh referensi desain dari klien supaya kami sesuaikan palet dan ornamennya?', 48),
    msg(t['LFP-001'], ADMIN, 'Sudah ketemu penyebabnya: perhitungan streak memakai zona waktu server. Perbaikan sedang diuji.', 6),
    msg(t['LFP-001'], ADMIN, 'Fix di habitStreak.ts: pakai tanggal lokal user (Asia/Jakarta). Perlu migrasi ulang streak lama.', 5.9, true),
  ];

  return { users, tickets, messages };
}
