import { logAuditEvent } from './auditLogService.ts';

export type ApiScope = 'tickets:read' | 'tickets:write' | 'kb:read' | 'stats:read';

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string; // First 12 chars: 'vps_live_xxxx'
  maskedKey: string; // 'vps_live_xxxx************************'
  keyHash: string; // Simple hash / stored token for verification
  appId?: string; // If restricted to specific app source
  scopes: ApiScope[];
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
  isRevoked: boolean;
}

const STORAGE_KEY = 'vps_helpdesk_api_keys';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
  } catch {
    return false;
  }
}

let memoryKeys: ApiKeyRecord[] = [];

export function getApiKeys(): ApiKeyRecord[] {
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return memoryKeys;
    }
  }
  return memoryKeys;
}

function saveApiKeys(keys: ApiKeyRecord[]): void {
  memoryKeys = keys;
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch {
      // Ignore
    }
  }
}

function generateRandomToken(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let str = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) {
      str += chars[arr[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      str += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return str;
}

export function createApiKey(input: {
  name: string;
  appId?: string;
  scopes: ApiScope[];
  actorName: string;
}): { record: ApiKeyRecord; rawKey: string } {
  const secret = generateRandomToken(32);
  const rawKey = `vps_live_${secret}`;
  const prefix = rawKey.slice(0, 13);
  const maskedKey = `${prefix}${'*'.repeat(24)}`;

  const record: ApiKeyRecord = {
    id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim() || 'API Key',
    prefix,
    maskedKey,
    keyHash: rawKey, // In browser CRM prototype, stored token
    appId: input.appId || undefined,
    scopes: input.scopes.length > 0 ? input.scopes : ['tickets:read'],
    createdAt: new Date().toISOString(),
    isRevoked: false,
  };

  const existing = getApiKeys();
  saveApiKeys([record, ...existing]);

  logAuditEvent({
    action: 'api_key_created',
    actorId: 'admin',
    actorName: input.actorName,
    actorRole: 'admin',
    target: record.name,
    details: `Kunci API "${record.name}" (${record.prefix}...) berhasil dibuat dengan izin: ${record.scopes.join(', ')}.`,
  });

  return { record, rawKey };
}

export function revokeApiKey(id: string, actorName: string): boolean {
  const keys = getApiKeys();
  const target = keys.find((k) => k.id === id);
  if (!target || target.isRevoked) return false;

  target.isRevoked = true;
  target.revokedAt = new Date().toISOString();
  saveApiKeys([...keys]);

  logAuditEvent({
    action: 'api_key_revoked',
    actorId: 'admin',
    actorName,
    actorRole: 'admin',
    target: target.name,
    details: `Kunci API "${target.name}" (${target.prefix}...) dicabut aksesnya secara permanen.`,
  });

  return true;
}

export function validateApiKey(rawKey: string): { valid: boolean; keyRecord?: ApiKeyRecord } {
  if (!rawKey || !rawKey.startsWith('vps_live_')) return { valid: false };
  const keys = getApiKeys();
  const found = keys.find((k) => k.keyHash === rawKey && !k.isRevoked);
  if (!found) return { valid: false };

  found.lastUsedAt = new Date().toISOString();
  saveApiKeys([...keys]);
  return { valid: true, keyRecord: found };
}
