import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { VPS_APPS } from '../config/vpsAppsConfig';
import {
  getCurrentUser,
  loginAsAdmin,
  loginAsDemo,
  logout as authLogout,
  processHandoff,
  switchToSuperadmin,
  type HandoffParams,
} from '../services/authHandoffService';
import {
  checkPbOnline,
  isPbOnline,
  onPbStatusChange,
  subscribePbRealtime,
} from '../services/pbClient';
import { getUsers, resetSeedData, seedIfEmpty } from '../services/storageService';
import {
  createTicket,
  getAllTickets,
  getDashboardStats,
  getOpenCountByApp,
  getStatusMatrixByApp,
  getTicketById,
  getTicketMessages,
  getTicketsByRequester,
  markTicketSolvedByUser,
  sendMessage,
  solveTicket,
  updateTicketCategory,
  updateTicketPriority,
  updateTicketStatus,
  type CreateTicketInput,
  type StatusCounts,
  type TicketFilter,
} from '../services/ticketCrmService';
import type { AppSource, CrmUser, Ticket, TicketMessage } from '../types/crm';

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  waitingOnUser: number;
  solvedToday: number;
  solved: number;
  avgResolutionHours: number;
}

interface CrmContextValue {
  // Auth & Session
  currentUser: CrmUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  pbOnline: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<CrmUser>;
  switchToAdmin: () => Promise<CrmUser>;
  loginAsDemo: (compositeKey: string) => Promise<CrmUser>;
  processHandoff: (params: HandoffParams) => Promise<CrmUser>;
  logout: () => void;

  // Ecosystem Apps
  apps: AppSource[];

  // Tickets & Metrics
  tickets: Ticket[];
  openCounts: Record<string, number>;
  appMatrix: Record<string, StatusCounts>;
  stats: DashboardStats;
  refreshTickets: () => Promise<void>;
  getTicket: (id: string) => Promise<Ticket | null>;
  getUserTickets: (requesterId: string, compositeKey?: string) => Promise<Ticket[]>;
  createTicket: (input: CreateTicketInput) => Promise<Ticket>;
  updateStatus: (id: string, status: Ticket['status']) => Promise<void>;
  updatePriority: (id: string, priority: Ticket['priority']) => Promise<void>;
  updateCategory: (id: string, category: Ticket['category']) => Promise<void>;
  solveTicket: (id: string, resolution: string, attachments?: string[]) => Promise<void>;
  markSolvedByUser: (id: string) => Promise<void>;
  filterTickets: (filters: TicketFilter) => Promise<Ticket[]>;

  // Conversation & Notes
  getMessages: (ticketId: string) => Promise<TicketMessage[]>;
  sendMessage: (
    ticketId: string,
    body: string,
    isInternalNote: boolean,
    attachments?: string[],
    nextStatus?: Ticket['status'],
  ) => Promise<TicketMessage>;

  // Contacts
  contacts: CrmUser[];
  refreshContacts: () => Promise<void>;

  // Demo helpers
  resetDemo: () => Promise<void>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CrmUser | null>(() => getCurrentUser());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  const [appMatrix, setAppMatrix] = useState<Record<string, StatusCounts>>({});
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingOnUser: 0,
    solvedToday: 0,
    solved: 0,
    avgResolutionHours: 0,
  });
  const [contacts, setContacts] = useState<CrmUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pbOnline, setPbOnline] = useState<boolean>(() => isPbOnline());

  const isAdmin = currentUser?.systemRole === 'admin';

  const refreshTickets = useCallback(async () => {
    try {
      const [all, counts, matrix, dashStats] = await Promise.all([
        getAllTickets(),
        getOpenCountByApp(),
        getStatusMatrixByApp(),
        getDashboardStats(),
      ]);
      setTickets(all);
      setOpenCounts(counts);
      setAppMatrix(matrix);
      setStats(dashStats);
    } catch (e) {
      console.error('refreshTickets error:', e);
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      const users = await getUsers();
      setContacts(users.filter((u) => u.systemRole !== 'admin'));
    } catch (e) {
      console.error('refreshContacts error:', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoading(true);
      try {
        seedIfEmpty();
        const online = await checkPbOnline(true);
        if (mounted) setPbOnline(online);
        const existingUser = getCurrentUser();
        if (mounted && existingUser) {
          setCurrentUser(existingUser);
        }
        await Promise.all([refreshTickets(), refreshContacts()]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    init();

    const unsubStatus = onPbStatusChange((online) => {
      if (mounted) setPbOnline(online);
    });
    const unsubRealtime = subscribePbRealtime(() => {
      if (mounted) {
        refreshTickets();
        refreshContacts();
      }
    });

    return () => {
      mounted = false;
      unsubStatus();
      unsubRealtime();
    };
  }, [refreshTickets, refreshContacts]);

  const handleLoginAsAdmin = async (email: string, password: string) => {
    const user = await loginAsAdmin(email, password);
    setCurrentUser(user);
    await Promise.all([refreshTickets(), refreshContacts()]);
    return user;
  };

  const handleSwitchToAdmin = async () => {
    const user = switchToSuperadmin();
    setCurrentUser(user);
    await Promise.all([refreshTickets(), refreshContacts()]);
    return user;
  };

  const handleLoginAsDemo = async (compositeKey: string) => {
    const user = await loginAsDemo(compositeKey);
    setCurrentUser(user);
    await Promise.all([refreshTickets(), refreshContacts()]);
    return user;
  };

  const handleProcessHandoff = async (params: HandoffParams): Promise<CrmUser> => {
    const user = await processHandoff(params);
    setCurrentUser(user);
    await Promise.all([refreshTickets(), refreshContacts()]);
    return user;
  };

  const handleLogout = () => {
    authLogout();
    setCurrentUser(null);
  };

  const handleUpdateStatus = async (id: string, status: Ticket['status']) => {
    await updateTicketStatus(id, status, currentUser?.name);
    await refreshTickets();
  };

  const handleUpdatePriority = async (id: string, priority: Ticket['priority']) => {
    await updateTicketPriority(id, priority);
    await refreshTickets();
  };

  const handleUpdateCategory = async (id: string, category: Ticket['category']) => {
    await updateTicketCategory(id, category);
    await refreshTickets();
  };

  const handleSolveTicket = async (id: string, resolution: string, attachments?: string[]) => {
    const actorId = currentUser?.id ?? 'usrsuperadmin00';
    const actorName = currentUser?.name ?? 'Superadmin';
    await solveTicket(id, resolution, actorId, actorName, attachments);
    await refreshTickets();
  };

  const handleMarkSolvedByUser = async (id: string) => {
    await markTicketSolvedByUser(id, currentUser?.name ?? 'Pelapor');
    await refreshTickets();
  };

  const handleCreateTicket = async (input: CreateTicketInput): Promise<Ticket> => {
    const ticket = await createTicket(input);
    await Promise.all([refreshTickets(), refreshContacts()]);
    return ticket;
  };

  const handleSendMessage = async (
    ticketId: string,
    body: string,
    isInternalNote: boolean,
    attachments?: string[],
    nextStatus?: Ticket['status'],
  ): Promise<TicketMessage> => {
    const senderId = currentUser?.id ?? 'usrsuperadmin00';
    const senderName = currentUser?.name ?? 'Superadmin';
    const senderRole = currentUser?.systemRole === 'admin' ? 'admin' : 'requester';
    const msg = await sendMessage(
      ticketId,
      senderId,
      senderName,
      senderRole,
      body,
      isInternalNote,
      attachments,
      nextStatus,
    );
    await refreshTickets();
    return msg;
  };

  const handleResetDemo = async () => {
    resetSeedData();
    await Promise.all([refreshTickets(), refreshContacts()]);
  };

  const value: CrmContextValue = {
    currentUser,
    isAdmin,
    isLoading,
    pbOnline,
    loginAsAdmin: handleLoginAsAdmin,
    switchToAdmin: handleSwitchToAdmin,
    loginAsDemo: handleLoginAsDemo,
    processHandoff: handleProcessHandoff,
    logout: handleLogout,
    apps: VPS_APPS,
    tickets,
    openCounts,
    appMatrix,
    stats,
    refreshTickets,
    getTicket: getTicketById,
    getUserTickets: getTicketsByRequester,
    createTicket: handleCreateTicket,
    updateStatus: handleUpdateStatus,
    updatePriority: handleUpdatePriority,
    updateCategory: handleUpdateCategory,
    solveTicket: handleSolveTicket,
    markSolvedByUser: handleMarkSolvedByUser,
    filterTickets: getAllTickets,
    getMessages: getTicketMessages,
    sendMessage: handleSendMessage,
    contacts,
    refreshContacts,
    resetDemo: handleResetDemo,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used inside CrmProvider');
  return ctx;
}
