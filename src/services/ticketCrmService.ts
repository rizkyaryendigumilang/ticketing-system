import {
  getTickets,
  getTicket,
  createTicket as storageCreate,
  updateTicket as storageUpdate,
  getMessages,
  addMessage,
} from './storageService';
import { VPS_APPS } from '../config/vpsAppsConfig';
import type { Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory } from '../types/crm';

export interface TicketFilters {
  appId?: string;
  status?: TicketStatus | 'all';
  priority?: TicketPriority | 'all';
  search?: string;
}

export interface CreateTicketInput {
  appId: string;
  requesterId: string;
  requesterName: string;
  requesterUid: string;
  requesterRole: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  sourcePageUrl?: string;
  deviceInfo?: string;
  attachments?: string[];
}

async function getNextTicketNumber(appId: string): Promise<string> {
  const app = VPS_APPS.find(a => a.id === appId);
  const prefix = app?.prefix ?? 'TKT';
  const tickets = await getTickets();
  const appTickets = tickets.filter(t => t.appId === appId);
  const next = appTickets.length + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const ticketNumber = await getNextTicketNumber(input.appId);
  return storageCreate({
    ticketNumber,
    appId: input.appId,
    requesterId: input.requesterId,
    requesterName: input.requesterName,
    requesterUid: input.requesterUid,
    requesterRole: input.requesterRole,
    subject: input.subject,
    description: input.description,
    category: input.category,
    priority: input.priority,
    status: 'open',
    sourcePageUrl: input.sourcePageUrl,
    deviceInfo: input.deviceInfo,
    attachments: input.attachments ?? [],
  });
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
  return storageUpdate(id, { status });
}

export async function updateTicketPriority(id: string, priority: TicketPriority): Promise<Ticket> {
  return storageUpdate(id, { priority });
}

export async function updateTicketCategory(id: string, category: TicketCategory): Promise<Ticket> {
  return storageUpdate(id, { category });
}

export async function solveTicket(
  id: string,
  resolutionSummary: string,
  adminId: string,
  adminName: string
): Promise<Ticket> {
  const solvedAt = new Date().toISOString();
  const ticket = await storageUpdate(id, {
    status: 'solved',
    solvedAt,
    resolutionSummary,
  });

  // Add system message
  await addMessage({
    ticketId: id,
    senderId: adminId,
    senderName: adminName,
    senderRole: 'admin',
    body: resolutionSummary,
    attachments: [],
    isInternalNote: false,
  });

  await addMessage({
    ticketId: id,
    senderId: 'system',
    senderName: 'System',
    senderRole: 'system',
    body: `Tiket ditandai sebagai Solved pada ${solvedAt}`,
    attachments: [],
    isInternalNote: false,
  });

  return ticket;
}

export async function getAllTickets(filters?: TicketFilters): Promise<Ticket[]> {
  let tickets = await getTickets();

  if (filters?.appId && filters.appId !== 'all') {
    tickets = tickets.filter(t => t.appId === filters.appId);
  }
  if (filters?.status && filters.status !== 'all') {
    tickets = tickets.filter(t => t.status === filters.status);
  }
  if (filters?.priority && filters.priority !== 'all') {
    tickets = tickets.filter(t => t.priority === filters.priority);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    tickets = tickets.filter(
      t =>
        t.subject.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q) ||
        t.requesterUid.toLowerCase().includes(q)
    );
  }

  return tickets;
}

export async function getTicketsByRequester(requesterId: string): Promise<Ticket[]> {
  const tickets = await getTickets();
  return tickets.filter(t => t.requesterId === requesterId);
}

export async function getTicketsByApp(appId: string): Promise<Ticket[]> {
  const tickets = await getTickets();
  return tickets.filter(t => t.appId === appId);
}

export async function getOpenCountByApp(): Promise<Record<string, number>> {
  const tickets = await getTickets();
  const counts: Record<string, number> = {};
  for (const app of VPS_APPS) {
    counts[app.id] = 0;
  }
  for (const t of tickets) {
    if (t.status === 'open') {
      counts[t.appId] = (counts[t.appId] ?? 0) + 1;
    }
  }
  return counts;
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  return getTicket(id);
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  return getMessages(ticketId);
}

export async function sendMessage(
  ticketId: string,
  senderId: string,
  senderName: string,
  senderRole: 'admin' | 'requester',
  body: string,
  isInternalNote: boolean,
  attachments?: string[]
): Promise<TicketMessage> {
  return addMessage({
    ticketId,
    senderId,
    senderName,
    senderRole,
    body,
    attachments: attachments ?? [],
    isInternalNote,
  });
}

export async function markTicketClosedByUser(ticketId: string): Promise<Ticket> {
  return storageUpdate(ticketId, { status: 'closed' });
}

// Dashboard KPIs
export async function getDashboardStats() {
  const tickets = await getTickets();
  const today = new Date().toISOString().slice(0, 10);

  const total = tickets.length;
  const open = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in_progress').length;
  const solvedToday = tickets.filter(
    t => t.status === 'solved' && t.solvedAt?.slice(0, 10) === today
  ).length;
  const solved = tickets.filter(t => t.status === 'solved' || t.status === 'closed').length;

  // Average resolution time in hours
  const resolvedTickets = tickets.filter(t => t.solvedAt);
  const avgResolutionHours =
    resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const solvedTime = new Date(t.solvedAt!).getTime();
          return sum + (solvedTime - created) / (1000 * 60 * 60);
        }, 0) / resolvedTickets.length
      : 0;

  return { total, open, inProgress, solvedToday, solved, avgResolutionHours };
}
