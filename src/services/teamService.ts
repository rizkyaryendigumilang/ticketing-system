import type { TeamMember, PermissionDefinition, InvitationInput, UserRole } from '../types/team';

const TEAM_KEY = 'vps-crm:team_members';

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'team-01',
    name: 'Kiky (Superadmin VPS)',
    email: 'admin@crm.local',
    role: 'superadmin',
    assignedApps: ['all'],
    status: 'active',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'team-02',
    name: 'Ahmad Fauzi (Support POS)',
    email: 'support.pos@crm.local',
    role: 'agent',
    assignedApps: ['snackloop'],
    status: 'active',
    lastActiveAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'team-03',
    name: 'Ratih Kusuma (HR Supervisor)',
    email: 'hr.lead@crm.local',
    role: 'supervisor',
    assignedApps: ['recruiter'],
    status: 'active',
    lastActiveAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'team-04',
    name: 'Bambang Wijaya',
    email: 'bambang.ops@crm.local',
    role: 'agent',
    assignedApps: ['wedding', 'life-planner', 'kept'],
    status: 'active',
    lastActiveAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
];

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'tickets.view_all',
    category: 'Tiket & Antrean',
    label: 'Akses Seluruh Tiket Ekosistem',
    description: 'Dapat melihat antrean tiket dari seluruh 7 aplikasi VPS tanpa batasan divisi.',
    allowedRoles: ['superadmin', 'supervisor'],
  },
  {
    key: 'tickets.reply',
    category: 'Tiket & Antrean',
    label: 'Balas Tiket Pelapor',
    description: 'Dapat mengirim tanggapan dan draf solusi ke pelapor.',
    allowedRoles: ['superadmin', 'supervisor', 'agent'],
  },
  {
    key: 'tickets.internal_note',
    category: 'Tiket & Antrean',
    label: 'Tulis Catatan Internal',
    description: 'Dapat membuat catatan teknis rahasia yang tidak tampak oleh pelapor.',
    allowedRoles: ['superadmin', 'supervisor', 'agent'],
  },
  {
    key: 'tickets.solve',
    category: 'Tiket & Antrean',
    label: 'Selesaikan & Tutup Tiket',
    description: 'Dapat mengubah status tiket menjadi Selesai atau Ditutup.',
    allowedRoles: ['superadmin', 'supervisor', 'agent'],
  },
  {
    key: 'team.invite',
    category: 'Tim & Otoritas',
    label: 'Undang Anggota Tim Baru',
    description: 'Dapat mengirim undangan email ke operator helpdesk baru.',
    allowedRoles: ['superadmin', 'supervisor'],
  },
  {
    key: 'settings.manage',
    category: 'Konfigurasi & Keamanan',
    label: 'Kelola Pengaturan & Kunci HMAC',
    description: 'Dapat mengubah pengaturan sistem, bot Telegram, dan secret key handoff.',
    allowedRoles: ['superadmin'],
  },
  {
    key: 'data.export',
    category: 'Konfigurasi & Keamanan',
    label: 'Ekspor Data CRM & Snapshot',
    description: 'Dapat mengunduh snapshot JSON database dan ekspor laporan CSV.',
    allowedRoles: ['superadmin'],
  },
  {
    key: 'billing.view',
    category: 'Infrastruktur & Kuota',
    label: 'Kelola Kuota & Atribusi VPS',
    description: 'Dapat memantau penggunaan storage, RAM, dan alokasi biaya per aplikasi.',
    allowedRoles: ['superadmin'],
  },
];

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
  } catch {
    return false;
  }
}

function readTeam(): TeamMember[] {
  try {
    if (!hasLocalStorage()) return INITIAL_TEAM;
    const raw = localStorage.getItem(TEAM_KEY);
    return raw ? (JSON.parse(raw) as TeamMember[]) : INITIAL_TEAM;
  } catch {
    return INITIAL_TEAM;
  }
}

function writeTeam(team: TeamMember[]): void {
  try {
    if (hasLocalStorage()) {
      localStorage.setItem(TEAM_KEY, JSON.stringify(team));
    }
  } catch (err) {
    console.warn('Gagal menyimpan daftar tim ke localStorage', err);
  }
}

let teamCache: TeamMember[] = readTeam();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function subscribeTeam(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getTeamMembers(): TeamMember[] {
  return teamCache;
}

export function addTeamMember(input: InvitationInput): TeamMember {
  const newMember: TeamMember = {
    id: `team-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    assignedApps: input.assignedApps.length ? input.assignedApps : ['all'],
    status: 'invited',
    lastActiveAt: new Date().toISOString(),
  };

  teamCache = [...teamCache, newMember];
  writeTeam(teamCache);
  notify();
  return newMember;
}

export function updateMemberRole(id: string, role: UserRole): void {
  teamCache = teamCache.map((m) => (m.id === id ? { ...m, role } : m));
  writeTeam(teamCache);
  notify();
}

export function removeTeamMember(id: string): void {
  teamCache = teamCache.filter((m) => m.id !== id);
  writeTeam(teamCache);
  notify();
}

export function resetTeamToInitial(): void {
  teamCache = INITIAL_TEAM;
  writeTeam(teamCache);
  notify();
}
