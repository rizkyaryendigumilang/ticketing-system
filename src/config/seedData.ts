// Shared seed data, imported by both the web app (offline fallback) and scripts/init-pocketbase.mjs.
// Registered apps configuration for the 7 VPS applications.
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
    adminDbUrl: 'https://43.156.236.102/wedding-pb/_/',
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

/** senderId used for every message written by the Superadmin. */
export const ADMIN_SENDER_ID = 'system:admin';

/** Returns empty initial records. All tickets, messages, and users are created organically through app handoffs. */
export function buildSeed(): {
  users: CrmUser[];
  tickets: Ticket[];
  messages: TicketMessage[];
} {
  return { users: [], tickets: [], messages: [] };
}
