import type { AppSource, CannedResponse, DemoAccount, TicketCategory, TicketPriority, TicketStatus } from '../types/crm';
import { SEED_APPS } from './seedData';

export const VPS_APPS: AppSource[] = SEED_APPS;

export const ADMIN_EMAIL = 'admin@crm.local';

export function getApp(appId: string | undefined): AppSource | undefined {
  return VPS_APPS.find((a) => a.id === appId);
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_on_user: 'Menunggu user',
  solved: 'Solved',
  closed: 'Closed',
};

export const STATUS_ORDER: TicketStatus[] = ['open', 'in_progress', 'waiting_on_user', 'solved', 'closed'];

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  urgent: 'Darurat',
};

export const PRIORITY_ORDER: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  bug_error: 'Bug / error fitur',
  account_login: 'Akun & akses login',
  data_transaction: 'Selisih data / transaksi',
  feature_question: 'Pertanyaan / request fitur',
  other: 'Lainnya',
};

export const CANNED_RESPONSES: CannedResponse[] = [
  {
    id: 'cr-ack',
    title: 'Sedang dicek',
    content: 'Halo, terima kasih laporannya. Kendala ini sedang kami cek dan kabarnya akan kami tulis di tiket ini.',
  },
  {
    id: 'cr-shot',
    title: 'Minta screenshot',
    content: 'Boleh kirim screenshot layar saat error muncul? Kalau ada pesan error berwarna merah, pastikan ikut terlihat.',
  },
  {
    id: 'cr-steps',
    title: 'Minta langkah reproduksi',
    content: 'Supaya bisa kami ulangi, tolong tuliskan langkahnya: menu apa yang dibuka, tombol apa yang ditekan, dan apa yang muncul setelahnya.',
  },
  {
    id: 'cr-cache',
    title: 'Hard refresh',
    content: 'Coba tekan Ctrl+Shift+R (atau Cmd+Shift+R di Mac) untuk memuat ulang tanpa cache, lalu ulangi langkahnya. Kabari kami hasilnya.',
    category: 'bug_error',
  },
  {
    id: 'cr-login',
    title: 'Reset kata sandi',
    content: 'Kata sandi akun Anda sudah kami reset. Silakan login ulang dan segera ganti kata sandinya dari menu Profil.',
    category: 'account_login',
  },
  {
    id: 'cr-data',
    title: 'Data sudah dikoreksi',
    content: 'Selisih datanya sudah kami koreksi langsung di database. Silakan buka ulang halamannya dan cocokkan angkanya.',
    category: 'data_transaction',
  },
  {
    id: 'cr-fixed',
    title: 'Sudah diperbaiki',
    content: 'Perbaikannya sudah kami pasang di server. Silakan coba lagi. Kalau masih terjadi, balas tiket ini dan kami buka kembali.',
  },
  {
    id: 'cr-feature',
    title: 'Masuk daftar fitur',
    content: 'Usulan ini kami catat di daftar pengembangan. Kami kabari di tiket ini begitu fiturnya tersedia.',
    category: 'feature_question',
  },
];

// Accounts used by the integration simulator and the simulation bar.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { compositeKey: 'snackloop:staff1', appId: 'snackloop', uid: 'staff1', name: 'Rina (Staff Rekap)', role: 'Staff Rekap & Transaksi Harian', label: 'staff1', fromUrl: 'https://43.156.236.102/snackloop/rekap-harian' },
  { compositeKey: 'snackloop:admin_kiky', appId: 'snackloop', uid: 'admin_kiky', name: 'Kiky', role: 'Super Admin Owner', label: 'admin_kiky', fromUrl: 'https://43.156.236.102/snackloop/laporan' },
  { compositeKey: 'recruiter:employer@demo.com', appId: 'recruiter', uid: 'employer@demo.com', name: 'CV Sumber Rejeki', role: 'Employer UMKM', label: 'employer@demo.com', fromUrl: 'https://43.156.236.102/recruiter/employer/dashboard' },
  { compositeKey: 'recruiter:kandidat@demo.com', appId: 'recruiter', uid: 'kandidat@demo.com', name: 'Dimas Pratama', role: 'Candidate', label: 'kandidat@demo.com', fromUrl: 'https://43.156.236.102/recruiter/profile/cv' },
  { compositeKey: 'wedding:admin@wedding.local', appId: 'wedding', uid: 'admin@wedding.local', name: 'Sekar Ayu', role: 'Owner Web Acara', label: 'admin@wedding.local', fromUrl: 'https://43.156.236.102/wedding/guests' },
  { compositeKey: 'life-planner:kiky@lifeplanner.local', appId: 'life-planner', uid: 'kiky@lifeplanner.local', name: 'Kiky', role: 'User / Superadmin', label: 'kiky@lifeplanner.local', fromUrl: 'https://43.156.236.102/life-planner/habits' },
  { compositeKey: 'ai-endurance:kipchoge@berlin.org', appId: 'ai-endurance', uid: 'kipchoge@berlin.org', name: 'Eliud Kipchoge', role: 'Athlete', label: 'kipchoge@berlin.org', fromUrl: 'https://43.156.236.102:8445/dashboard.html' },
  { compositeKey: 'kept:user@kept.local', appId: 'kept', uid: 'user@kept.local', name: 'Vault User', role: 'Vault User', label: 'user@kept.local', fromUrl: 'https://43.156.236.102/kept/' },
  { compositeKey: 'diskon-bot:8503838227', appId: 'diskon-bot', uid: '8503838227', name: 'Bot Member 8503838227', role: 'Bot Member', label: '8503838227', fromUrl: 'https://43.156.236.102/diskon-bot/' },
];
