import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CrmUser, Ticket, TicketMessage, AppSource } from '../types/crm';
import { VPS_APPS } from '../config/vpsAppsConfig';
import { seedIfEmpty, getUsers } from '../services/storageService';
import {
  getCurrentUser,
  logout as authLogout,
  loginAsAdmin,
  processHandoff,
  loginAsDemo,
  type HandoffParams,
} from '../services/authHandoffService';
import {
  getAllTickets,
  getTicketById,
  getTicketsByRequester,
  getTicketMessages,
  sendMessage,
  solveTicket,
  updateTicketStatus,
  updateTicketPriority,
  updateTicketCategory,
  createTicket,
  getOpenCountByApp,
  getDashboardStats,
  markTicketClosedByUser,
  type CreateTicketInput,
  type TicketFilters,
} from '../services/ticketCrmService';

interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  solvedToday: number;
  solved: number;
  avgResolutionHours: number;
}

interface CrmContextValue {
  // Auth
  currentUser: CrmUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  loginAsDemo: (compositeKey: string) => Promise<void>;
  processHandoff: (params: HandoffParams) => Promise<CrmUser>;
  logout: () => void;

  // Apps
  apps: AppSource[];

  // Tickets
  tickets: Ticket[];
  openCounts: Record<string, number>;
  stats: DashboardStats;
  refreshTickets: () => Promise<void>;
  getTicket: (id: string) => Promise<Ticket | null>;
  getUserTickets: (requesterId: string) => Promise<Ticket[]>;
  createTicket: (input: CreateTicketInput) => Promise<Ticket>;
  updateStatus: (id: string, status: Ticket['status']) => Promise<void>;
  updatePriority: (id: string, priority: Ticket['priority']) => Promise<void>;
  updateCategory: (id: string, category: Ticket['category']) => Promise<void>;
  solveTicket: (id: string, resolution: string) => Promise<void>;
  closeTicket: (id: string) => Promise<void>;
  filterTickets: (filters: TicketFilters) => Promise<Ticket[]>;

  // Messages
  getMessages: (ticketId: string) => Promise<TicketMessage[]>;
  sendMessage: (
    ticketId: string,
    body: string,
    isInternalNote: boolean,
    attachments?: string[]
  ) => Promise<TicketMessage>;

  // Contacts
  contacts: CrmUser[];
  refreshContacts: () => Promise<void>;

  // Notifications
  errorMessage: string | null;
  clearError: () => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CrmUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, open: 0, inProgress: 0, solvedToday: 0, solved: 0, avgResolutionHours: 0,
  });
  const [contacts, setContacts] = useState<CrmUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.systemRole === 'admin';

  const refreshTickets = useCallback(async () => {
    try {
      const [all, counts, dashStats] = await Promise.all([
        getAllTickets(),
        getOpenCountByApp(),
        getDashboardStats(),
      ]);
      setTickets(all);
      setOpenCounts(counts);
      setStats(dashStats);
    } catch (e) {
      console.error('refreshTickets error:', e);
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      const users = await getUsers();
      setContacts(users.filter(u => u.systemRole !== 'admin'));
    } catch (e) {
      console.error('refreshContacts error:', e);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        seedIfEmpty();
        const user = getCurrentUser();
        setCurrentUser(user);
        await Promise.all([refreshTickets(), refreshContacts()]);
      } catch (e) {
        console.error('CRM init error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [refreshTickets, refreshContacts]);

  const handleLoginAsAdmin = async (email: string, password: string) => {
    const user = await loginAsAdmin(email, password);
    setCurrentUser(user);
    await refreshTickets();
  };

  const handleLoginAsDemo = async (compositeKey: string) => {
    const user = await loginAsDemo(compositeKey);
    if (user) {
      setCurrentUser(user);
      await refreshTickets();
    }
  };

  const handleProcessHandoff = async (params: HandoffParams): Promise<CrmUser> => {
    const user = await processHandoff(params);
    setCurrentUser(user);
    await refreshTickets();
    return user;
  };

  const handleLogout = () => {
    authLogout();
    setCurrentUser(null);
  };

  const handleUpdateStatus = async (id: string, status: Ticket['status']) => {
    await updateTicketStatus(id, status);
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

  const handleSolveTicket = async (id: string, resolution: string) => {
    if (!currentUser) throw new Error('Not authenticated');
    await solveTicket(id, resolution, currentUser.id, currentUser.name);
    await refreshTickets();
  };

  const handleCloseTicket = async (id: string) => {
    await markTicketClosedByUser(id);
    await refreshTickets();
  };

  const handleCreateTicket = async (input: CreateTicketInput): Promise<Ticket> => {
    const ticket = await createTicket(input);
    await refreshTickets();
    return ticket;
  };

  const handleSendMessage = async (
    ticketId: string,
    body: string,
    isInternalNote: boolean,
    attachments?: string[]
  ): Promise<TicketMessage> => {
    if (!currentUser) throw new Error('Not authenticated');
    return sendMessage(
      ticketId,
      currentUser.id,
      currentUser.name,
      currentUser.systemRole === 'admin' ? 'admin' : 'requester',
      body,
      isInternalNote,
      attachments
    );
  };

  const value: CrmContextValue = {
    currentUser,
    isAdmin,
    isLoading,
    loginAsAdmin: handleLoginAsAdmin,
    loginAsDemo: handleLoginAsDemo,
    processHandoff: handleProcessHandoff,
    logout: handleLogout,
    apps: VPS_APPS,
    tickets,
    openCounts,
    stats,
    refreshTickets,
    getTicket: getTicketById,
    getUserTickets: getTicketsByRequester,
    createTicket: handleCreateTicket,
    updateStatus: handleUpdateStatus,
    updatePriority: handleUpdatePriority,
    updateCategory: handleUpdateCategory,
    solveTicket: handleSolveTicket,
    closeTicket: handleCloseTicket,
    filterTickets: getAllTickets,
    getMessages: getTicketMessages,
    sendMessage: handleSendMessage,
    contacts,
    refreshContacts,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used inside CrmProvider');
  return ctx;
}
