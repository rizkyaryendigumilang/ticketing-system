import { ADMIN_EMAIL, DEMO_ACCOUNTS, VPS_APPS } from '../config/vpsAppsConfig';
import { compositeKeyOf, parseHandoff, safeHttpUrl } from './crmLogic';
import { checkPbOnline, pb } from './pbClient';
import { getUserByCompositeKey, upsertUser } from './storageService';
import type { CrmUser, HandoffParams } from '../types/crm';

const SESSION_KEY = 'crm_v2_session';

export function getCurrentUser(): CrmUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CrmUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: CrmUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  try {
    pb.authStore.clear();
  } catch {
    // ignore
  }
}

export function buildSuperadminUser(email = ADMIN_EMAIL): CrmUser {
  return {
    id: 'usrsuperadmin00',
    compositeKey: 'system:admin',
    appId: 'system',
    externalUid: 'admin',
    name: 'Superadmin VPS',
    email,
    appRole: 'VPS Owner & Superadmin',
    systemRole: 'admin',
    createdAt: '2026-09-01T00:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
  };
}

export async function loginAsAdmin(email: string, password: string): Promise<CrmUser> {
  const trimmedEmail = email.trim().toLowerCase();
  if (await checkPbOnline()) {
    try {
      await pb.collection('_superusers').authWithPassword(trimmedEmail, password);
      const admin = buildSuperadminUser(trimmedEmail);
      saveSession(admin);
      return admin;
    } catch {
      // fall through to local credential check
    }
  }

  if (trimmedEmail === ADMIN_EMAIL && password === 'Admin@CRM123!') {
    const admin = buildSuperadminUser(trimmedEmail);
    saveSession(admin);
    return admin;
  }

  throw new Error('Email atau kata sandi Superadmin tidak sesuai.');
}

export function switchToSuperadmin(): CrmUser {
  const admin = buildSuperadminUser();
  saveSession(admin);
  return admin;
}

export function validateHandoffQuery(search: URLSearchParams) {
  return parseHandoff(
    search,
    VPS_APPS.map((a) => a.id),
  );
}

export async function processHandoff(params: HandoffParams): Promise<CrmUser> {
  const appId = params.app.trim();
  const externalUid = params.uid.trim();
  const appSource = VPS_APPS.find((a) => a.id === appId);
  if (!appSource) {
    throw new Error(
      `Aplikasi "${appId}" tidak terdaftar. Slug yang valid: ${VPS_APPS.map((a) => a.id).join(', ')}`,
    );
  }
  if (!externalUid) {
    throw new Error('Parameter uid wajib diisi.');
  }

  const compositeKey = compositeKeyOf(appId, externalUid);
  const existing = await getUserByCompositeKey(compositeKey);
  const cleanUrl = safeHttpUrl(params.fromUrl) ?? existing?.lastSeenUrl ?? appSource.appUrl;

  const user = await upsertUser({
    compositeKey,
    appId,
    externalUid,
    name: params.name?.trim() || existing?.name || externalUid,
    email: externalUid.includes('@') ? externalUid : existing?.email,
    appRole: params.role?.trim() || existing?.appRole || 'User',
    systemRole: 'requester',
    lastSeenUrl: cleanUrl,
  });

  saveSession(user);
  return user;
}

export async function loginAsDemo(compositeKey: string): Promise<CrmUser> {
  const demo = DEMO_ACCOUNTS.find((d) => d.compositeKey === compositeKey);
  if (demo) {
    return processHandoff({
      app: demo.appId,
      uid: demo.uid,
      name: demo.name,
      role: demo.role,
      fromUrl: demo.fromUrl,
    });
  }

  const existing = await getUserByCompositeKey(compositeKey);
  if (!existing) {
    throw new Error(`Akun demo ${compositeKey} tidak ditemukan.`);
  }
  saveSession(existing);
  return existing;
}

export type { HandoffParams };
