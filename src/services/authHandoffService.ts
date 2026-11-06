// Sessions and SSO handoff. The Superadmin session and the requester session are stored separately,
// so the simulation bar can switch between both views with one click.
import { DEMO_ADMIN, getApp } from '../config/vpsAppsConfig';
import { compositeKeyOf, userIdFor } from './crmLogic';
import { getConnection, pb, saveRecord, startSync } from './pbClient';
import { getData } from './storageService';
import type { CrmUser, HandoffParams } from '../types/crm';

const ADMIN_KEY = 'vps-crm:admin-session';
const REQUESTER_KEY = 'vps-crm:requester-id';

export interface AdminSession {
  name: string;
  email: string;
  /** 'demo' = signed in while PocketBase was offline; admin changes wait until a real login. */
  mode: 'pocketbase' | 'demo';
}

export function getAdminSession(): AdminSession | null {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) ?? 'null') as AdminSession | null;
  } catch {
    return null;
  }
}

export const getRequesterId = () => localStorage.getItem(REQUESTER_KEY);

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  await startSync();
  const cleanEmail = email.trim().toLowerCase();
  let session: AdminSession;
  if (getConnection() === 'online') {
    try {
      await pb.collection('_superusers').authWithPassword(cleanEmail, password);
    } catch {
      throw new Error('Email atau kata sandi superuser PocketBase salah.');
    }
    session = { name: 'Superadmin', email: cleanEmail, mode: 'pocketbase' };
  } else {
    if (cleanEmail !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
      throw new Error(`PocketBase belum aktif. Mode demo hanya menerima ${DEMO_ADMIN.email} dengan kata sandi demo.`);
    }
    session = { name: 'Superadmin', email: cleanEmail, mode: 'demo' };
  }
  localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
  return session;
}

export function logoutAdmin() {
  pb.authStore.clear();
  localStorage.removeItem(ADMIN_KEY);
}

/** Just-in-time provisioning: find the user by "{app}:{uid}", create it if missing, then sign in. */
export async function handoff(params: HandoffParams): Promise<CrmUser> {
  await startSync(); // load PocketBase data first, so a known user is updated instead of re-created
  const compositeKey = compositeKeyOf(params.app, params.uid);
  const existing = getData().users.find((u) => u.compositeKey === compositeKey);
  const lastSeenUrl = params.fromUrl ?? existing?.lastSeenUrl ?? getApp(params.app)?.appUrl;
  const ts = new Date().toISOString();

  let user: CrmUser;
  if (existing) {
    const patch = { name: params.name, appRole: params.role, lastSeenUrl, lastActiveAt: ts };
    user = { ...existing, ...patch };
    saveRecord('crm_users', user, patch);
  } else {
    user = {
      id: userIdFor(compositeKey),
      compositeKey,
      appId: params.app,
      externalUid: params.uid,
      name: params.name,
      email: params.uid.includes('@') ? params.uid : undefined,
      appRole: params.role,
      systemRole: 'requester',
      lastSeenUrl,
      createdAt: ts,
      lastActiveAt: ts,
    };
    saveRecord('crm_users', user);
  }
  localStorage.setItem(REQUESTER_KEY, user.id);
  return user;
}

export function logoutRequester() {
  localStorage.removeItem(REQUESTER_KEY);
}
