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
import { getConnection, startSync, subscribeConnection, type Connection } from '../services/pbClient';
import { getData, getOutbox, resetToSeed, subscribeStore, type CrmData } from '../services/storageService';
const ADMIN_SENDER_ID = 'system:admin';
import type { Actor } from '../services/ticketCrmService';
import type { CrmUser, HandoffParams } from '../types/crm';

interface CrmContextValue {
  data: CrmData;
  connection: Connection;
  /** Admin changes waiting for a PocketBase superuser login. */
  pendingAdminChanges: number;
  admin: AdminSession | null;
  adminActor: Actor;
  requester: CrmUser | null;
  requesterActor: Actor | null;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => void;
  handoff: (params: HandoffParams) => Promise<CrmUser>;
  logoutRequester: () => void;
  resetDemo: () => void;
  notify: (message: string) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void startSync();
  }, []);

  const data = useSyncExternalStore(subscribeStore, getData);
  const outbox = useSyncExternalStore(subscribeStore, getOutbox);
  const connection = useSyncExternalStore(subscribeConnection, getConnection);
  const [admin, setAdmin] = useState(getAdminSession);
  const [requesterId, setRequesterId] = useState(getRequesterId);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Tell the Superadmin when a ticket arrives that was not in the store before (realtime or another tab).
  const knownTickets = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(data.tickets.map((t) => t.id));
    if (knownTickets.current && admin) {
      const fresh = data.tickets.find((t) => !knownTickets.current!.has(t.id) && t.status === 'open');
      if (fresh) notify(`Tiket baru ${fresh.ticketNumber} dari ${getApp(fresh.appId)?.name ?? fresh.appId}: ${fresh.subject}`);
    }
    knownTickets.current = ids;
  }, [data.tickets, admin, notify]);

  const requester = data.users.find((u) => u.id === requesterId) ?? null;

  const value: CrmContextValue = {
    data,
    connection,
    pendingAdminChanges: outbox.filter((op) => op.asAdmin).length,
    admin,
    adminActor: { id: ADMIN_SENDER_ID, name: admin?.name ?? 'Superadmin', role: 'admin' },
    requester,
    requesterActor: requester ? { id: requester.id, name: requester.name, role: 'requester' } : null,
    loginAdmin: async (email, password) => setAdmin(await runLoginAdmin(email, password)),
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
  };

  return (
    <CrmContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-md border border-line bg-ink px-4 py-3 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </CrmContext.Provider>
  );
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used inside CrmProvider');
  return ctx;
}
