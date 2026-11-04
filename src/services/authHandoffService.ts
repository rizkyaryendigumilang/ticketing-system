import { VPS_APPS } from '../config/vpsAppsConfig';
import { upsertUser, getUserByCompositeKey } from './storageService';
import type { CrmUser } from '../types/crm';

const SESSION_KEY = 'crm_session';

export interface HandoffParams {
  app: string;
  uid: string;
  name: string;
  role: string;
  from_url?: string;
}

export function getCurrentUser(): CrmUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CrmUser;
  } catch {
    return null;
  }
}

export function saveSession(user: CrmUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function loginAsAdmin(email: string, password: string): Promise<CrmUser> {
  // Hardcoded superadmin — in production this would validate against PocketBase auth
  if (email === 'admin@crm.local' && password === 'Admin@CRM123!') {
    const admin: CrmUser = {
      id: 'u-superadmin',
      compositeKey: 'system:admin',
      appId: 'system',
      externalUid: 'admin',
      name: 'Superadmin',
      email: 'admin@crm.local',
      appRole: 'CRM Administrator',
      systemRole: 'admin',
      createdAt: '2026-09-01T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
    };
    saveSession(admin);
    return admin;
  }
  throw new Error('Email atau password salah');
}

export async function processHandoff(params: HandoffParams): Promise<CrmUser> {
  const { app, uid, name, role, from_url } = params;

  // Validate app slug
  const appSource = VPS_APPS.find(a => a.id === app);
  if (!appSource) {
    throw new Error(`Unknown app slug: "${app}". Valid slugs: ${VPS_APPS.map(a => a.id).join(', ')}`);
  }

  if (!uid || uid.trim() === '') {
    throw new Error('Parameter uid tidak boleh kosong');
  }

  const compositeKey = `${app}:${uid}`;

  // Check existing user
  const existing = await getUserByCompositeKey(compositeKey);

  const userData = {
    compositeKey,
    appId: app,
    externalUid: uid,
    name: name || uid,
    appRole: role || 'User',
    systemRole: 'requester' as const,
    ...(from_url ? { lastSeenUrl: from_url } : {}),
  };

  let user: CrmUser;
  if (existing) {
    // Update lastActiveAt
    user = await upsertUser({ ...userData, name: existing.name || name, email: existing.email });
  } else {
    // JIT provisioning — create new user
    user = await upsertUser(userData);
  }

  saveSession(user);
  return user;
}

// Quick login as a demo account (for simulation bar)
export async function loginAsDemo(compositeKey: string): Promise<CrmUser | null> {
  const user = await getUserByCompositeKey(compositeKey);
  if (user) {
    saveSession(user);
    return user;
  }
  return null;
}
