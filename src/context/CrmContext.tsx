import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getApp } from '../config/vpsAppsConfig';
import {
  getAdminSession,
  getRequesterId,
  handoff as runHandoff,
  loginAdmin as runLoginAdmin,
  logoutAdmin as runLogoutAdmin,
  logoutRequester as runLogoutRequester,
  type AdminSession,
} from '../services/authHandoffService';
import { getConnection, onSyncError, startSync, subscribeConnection, type Connection } from '../services/pbClient';
import {
  getCannedList,
  getData,
  getOutbox,
  getSettings,
  resetToSeed,
  saveCannedList,
  saveSettings,
  subscribeStore,
  type CrmData,
  type SystemSettings,
} from '../services/storageService';
import { useToast } from './ToastContext';
const ADMIN_SENDER_ID = 'system:admin';
import type { Actor } from '../services/ticketCrmService';
import type { CannedResponse, CrmUser, HandoffParams } from '../types/crm';

interface CrmContextValue {
  data: CrmData;
  connection: Connection;
  /** Admin changes waiting for a PocketBase superuser login. */
  pendingAdminChanges: number;
  admin: AdminSession | null;
  adminActor: Actor;
  requester: CrmUser | null;
  requesterActor: Actor | null;
  settings: SystemSettings;
  updateSettings: (next: SystemSettings) => void;
  cannedResponses: CannedResponse[];
  updateCannedResponses: (next: CannedResponse[]) => void;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => void;
  handoff: (params: HandoffParams) => Promise<CrmUser>;
  logoutRequester: () => void;
  resetDemo: () => void;
  notify: (message: string) => void;
  requestDesktopNotification: () => Promise<NotificationPermission | null>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void startSync();
  }, []);

  const data = useSyncExternalStore(subscribeStore, getData);
  const outbox = useSyncExternalStore(subscribeStore, getOutbox);
  const connection = useSyncExternalStore(subscribeConnection, getConnection);
  const settings = useSyncExternalStore(subscribeStore, getSettings);
  const cannedResponses = useSyncExternalStore(subscribeStore, getCannedList);
  const [admin, setAdmin] = useState(getAdminSession);
  const [requesterId, setRequesterId] = useState(getRequesterId);
  const toast = useToast();

  const updateSettings = useCallback((next: SystemSettings) => {
    saveSettings(next);
  }, []);

  const updateCannedResponses = useCallback((next: CannedResponse[]) => {
    saveCannedList(next);
  }, []);

  const notify = useCallback(
    (message: string) => {
      toast.info(message);
    },
    [toast],
  );

  // Hook sync errors from PocketBase client into toast notifications
  useEffect(() => {
    return onSyncError((errMsg) => {
      toast.error(errMsg);
    });
  }, [toast]);

  // Tell the Superadmin when a ticket arrives that was not in the store before (realtime or another tab).
  const knownTickets = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(data.tickets.map((t) => t.id));
    if (knownTickets.current && admin) {
      const fresh = data.tickets.find((t) => !knownTickets.current!.has(t.id) && t.status === 'open');
      if (fresh) {
        const appName = getApp(fresh.appId)?.name ?? fresh.appId;
        notify(`Tiket baru ${fresh.ticketNumber} dari ${appName}: ${fresh.subject}`);
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`Tiket Baru ${fresh.ticketNumber} [${appName}]`, {
              body: `${fresh.subject}\nPrioritas: ${fresh.priority.toUpperCase()}`,
            });
          } catch {
            // Notification failed or blocked in non-secure context
          }
        }

        // Forward to Telegram if enabled
        if (settings.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
          const isUrgent = fresh.priority === 'urgent' || fresh.priority === 'high';
          if (!settings.notifyOnUrgentOnly || isUrgent) {
            const text = `🚨 <b>TIKET BARU #${fresh.ticketNumber}</b>\n` +
              `📱 <b>Aplikasi:</b> ${appName}\n` +
              `👤 <b>Pelapor:</b> ${fresh.requesterName} (${fresh.requesterUid})\n` +
              `⚡ <b>Prioritas:</b> ${fresh.priority.toUpperCase()}\n` +
              `📝 <b>Subjek:</b> ${fresh.subject}\n` +
              `🔗 <a href="https://43.156.236.102/helpdesk/admin/tickets/${fresh.id}">Buka Meja Kerja CRM</a>`;
            void fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: settings.telegramChatId, text, parse_mode: 'HTML' }),
            }).catch(() => {});
          }
        }
      }
    }
    knownTickets.current = ids;
  }, [data.tickets, admin, notify, settings]);

  const requestDesktopNotification = useCallback(async (): Promise<NotificationPermission | null> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        toast.success('Notifikasi desktop aktif untuk tiket baru.');
      }
      return perm;
    } catch {
      return null;
    }
  }, [toast]);

  const requester = data.users.find((u) => u.id === requesterId) ?? null;

  const value: CrmContextValue = {
    data,
    connection,
    pendingAdminChanges: outbox.filter((op) => op.asAdmin).length,
    admin,
    adminActor: { id: ADMIN_SENDER_ID, name: admin?.name ?? 'Superadmin', role: 'admin' },
    requester,
    requesterActor: requester ? { id: requester.id, name: requester.name, role: 'requester' } : null,
    settings,
    updateSettings,
    cannedResponses,
    updateCannedResponses,
    loginAdmin: async (email, password) => {
      const s = await runLoginAdmin(email, password);
      setAdmin(s);
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission();
      }
    },
    logoutAdmin: () => {
      runLogoutAdmin();
      setAdmin(null);
    },
    handoff: async (params) => {
      const user = await runHandoff(params);
      setRequesterId(user.id);
      return user;
    },
    logoutRequester: () => {
      runLogoutRequester();
      setRequesterId(null);
    },
    resetDemo: () => {
      resetToSeed();
      notify('Data demo dikembalikan ke seed awal.');
    },
    notify,
    requestDesktopNotification,
  };

  return (
    <CrmContext.Provider value={value}>
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used inside CrmProvider');
  return ctx;
}
