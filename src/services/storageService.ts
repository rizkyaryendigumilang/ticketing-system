// Local store: the UI always reads from here. PocketBase sync lives in pbClient.ts.
import { buildSeed, SEED_APPS } from '../config/seedData.ts';
import { CANNED_RESPONSES } from '../config/vpsAppsConfig.ts';
import type { AppSource, CannedResponse, CrmUser, Ticket, TicketMessage } from '../types/crm';

export interface SystemSettings {
  handoffSecret: string;
  handoffExpiryMinutes: number;
  allowedOrigins: string[];
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  notifyOnUrgentOnly: boolean;
  desktopNotificationSound: boolean;
  outboundWebhookEnabled: boolean;
  outboundWebhookUrl: string;
  autoCloseDays: number;
  autoCloseEnabled: boolean;
  language: 'id' | 'en';
  timezone: string;
  uiDensity: 'comfortable' | 'compact';
  defaultView: 'dashboard' | 'tickets';
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_SETTINGS: SystemSettings = {
  handoffSecret: 'vps-helpdesk-secret-key',
  handoffExpiryMinutes: 15,
  allowedOrigins: ['https://43.156.236.102', 'http://localhost:5173'],
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  notifyOnUrgentOnly: false,
  desktopNotificationSound: true,
  outboundWebhookEnabled: false,
  outboundWebhookUrl: '',
  autoCloseDays: 7,
  autoCloseEnabled: true,
  language: 'id',
  timezone: 'Asia/Jakarta',
  uiDensity: 'comfortable',
  defaultView: 'dashboard',
  theme: 'light',
};

export interface CrmData {
  apps: AppSource[];
  users: CrmUser[];
  tickets: Ticket[];
  messages: TicketMessage[];
}

export type Collection = 'crm_users' | 'tickets' | 'ticket_messages';
type Item = CrmUser | Ticket | TicketMessage;

const LIST: Record<Collection, 'users' | 'tickets' | 'messages'> = {
  crm_users: 'users',
  tickets: 'tickets',
  ticket_messages: 'messages',
};

/** A change made locally that PocketBase has not confirmed yet. */
export interface OutboxOp {
  collection: Collection;
  item: Item; // full record after the change
  patch?: Record<string, unknown>; // present for updates: only the changed fields
  asAdmin: boolean; // needs a PocketBase superuser session to be accepted
}

const DATA_KEY = 'vps-crm:data:v4';
const OUTBOX_KEY = 'vps-crm:outbox:v4';
const SETTINGS_KEY = 'vps-crm:settings:v1';
const CANNED_KEY = 'vps-crm:canned:v1';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
  } catch {
    return false;
  }
}

function read<T>(key: string, fallback: () => T): T {
  try {
    const raw = hasLocalStorage() ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback();
  } catch {
    return fallback();
  }
}

function write(key: string, value: unknown) {
  try {
    if (hasLocalStorage()) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    // shortcut: screenshots are base64 in localStorage (~5 MB quota); past it, changes live in memory until reload.
    console.warn('Penyimpanan browser penuh, perubahan hanya ada di memori sampai PocketBase aktif.', e);
  }
}

const seed = (): CrmData => ({ apps: SEED_APPS, ...buildSeed() });

let data = read<CrmData>(DATA_KEY, seed);
let outbox = read<OutboxOp[]>(OUTBOX_KEY, () => []);
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const getData = () => data;
export const getOutbox = () => outbox;

export function subscribeStore(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function commit(next: CrmData) {
  data = next;
  write(DATA_KEY, data);
  notify();
}

export function upsertLocal(collection: Collection, item: Item) {
  const key = LIST[collection];
  const list = data[key] as Item[];
  const exists = list.some((x) => x.id === item.id);
  commit({ ...data, [key]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item] });
}

export function removeLocal(collection: Collection, id: string) {
  const key = LIST[collection];
  commit({ ...data, [key]: (data[key] as Item[]).filter((x) => x.id !== id) });
}

/** Replace everything with what PocketBase returned, then re-apply changes it has not accepted yet. */
export function replaceAll(next: CrmData) {
  const merged = { ...next, apps: next.apps.length ? next.apps : data.apps };
  for (const op of outbox) {
    const key = LIST[op.collection];
    const list = merged[key] as Item[];
    merged[key] = [...list.filter((x) => x.id !== op.item.id), op.item] as never;
  }
  commit(merged);
}

export function setOutbox(next: OutboxOp[]) {
  outbox = next;
  write(OUTBOX_KEY, outbox);
  notify();
}

export const enqueue = (op: OutboxOp) => setOutbox([...outbox, op]);

export function resetToSeed() {
  setOutbox([]);
  commit(seed());
}

let settings = read<SystemSettings>(SETTINGS_KEY, () => DEFAULT_SETTINGS);
export const getSettings = () => settings;
export function saveSettings(next: SystemSettings) {
  settings = next;
  write(SETTINGS_KEY, settings);
  notify();
}

let cannedList = read<CannedResponse[]>(CANNED_KEY, () => CANNED_RESPONSES);
export const getCannedList = () => cannedList;
export function saveCannedList(next: CannedResponse[]) {
  cannedList = next;
  write(CANNED_KEY, cannedList);
  notify();
}
