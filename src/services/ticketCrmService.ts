import { VPS_APPS } from '../config/vpsAppsConfig';
import {
  countByApp,
  filterTickets,
  nextTicketNumber,
  safeHttpUrl,
  sortQueue,
  statusAfterRequesterReply,
  type StatusCounts,
  type TicketFilter,
} from './crmLogic';
import {
  addMessage,
  createTicket as storageCreateTicket,
  getMessages,
  getTicket,
  getTickets,
  updateTicket as storageUpdateTicket,
} from './storageService';
import type { Ticket, TicketCategory, TicketMessage, TicketPriority, TicketStatus } from '../types/crm';

export type { TicketFilter, StatusCounts };

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

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const app = VPS_APPS.find((a) => a.id === input.appId);
  const prefix = app?.prefix ?? 'TKT';
  const existing = await getTickets();
  const ticketNumber = nextTicketNumber(
    prefix,
    existing.map((t) => t.ticketNumber),
  );

  const defaultDevice =
    typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : undefined;

  return storageCreateTicket({
    ticketNumber,
    appId: input.appId,
    requesterId: input.requesterId,
    requesterName: input.requesterName.trim(),
    requesterUid: input.requesterUid.trim(),
    requesterRole: input.requesterRole.trim(),
    subject: input.subject.trim(),
    description: input.description.trim(),
    category: input.category,
    priority: input.priority,
    status: 'open',
    sourcePageUrl: safeHttpUrl(input.sourcePageUrl),
    deviceInfo: input.deviceInfo?.trim() || defaultDevice,
    attachments: input.attachments ?? [],
  });
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  actorName?: string,
): Promise<Ticket> {
  const patch: Partial<Ticket> = { status };
  if (status === 'solved') {
    patch.solvedAt = new Date().toISOString();
  }
  const updated = await storageUpdateTicket(id, patch);
  if (actorName) {
    await addMessage({
      ticketId: id,
      senderId: 'system',
      senderName: 'Sistem',
      senderRole: 'system',
      body: `Status diubah ke ${status.replace(/_/g, ' ')} oleh ${actorName}.`,
      attachments: [],
      isInternalNote: false,
    });
  }
  return updated;
}

export async function updateTicketPriority(id: string, priority: TicketPriority): Promise<Ticket> {
  return storageUpdateTicket(id, { priority });
}

export async function updateTicketCategory(id: string, category: TicketCategory): Promise<Ticket> {
  return storageUpdateTicket(id, { category });
}

export async function solveTicket(
  id: string,
  resolutionSummary: string,
  adminId: string,
  adminName: string,
  attachments: string[] = [],
): Promise<Ticket> {
  const solvedAt = new Date().toISOString();
  const summary = resolutionSummary.trim() || 'Kendala telah diperbaiki dan diverifikasi oleh Superadmin.';

  const ticket = await storageUpdateTicket(id, {
    status: 'solved',
    solvedAt,
    resolutionSummary: summary,
  });

  await addMessage({
    ticketId: id,
    senderId: adminId,
    senderName: adminName,
    senderRole: 'admin',
    body: summary,
    attachments,
    isInternalNote: false,
  });

  await addMessage({
    ticketId: id,
    senderId: 'system',
    senderName: 'Sistem',
    senderRole: 'system',
    body: `Tiket ditandai Solved oleh ${adminName}.`,
    attachments: [],
    isInternalNote: false,
  });

  return ticket;
}

export async function getAllTickets(filters?: TicketFilter): Promise<Ticket[]> {
  const tickets = await getTickets();
  return filters ? sortQueue(filterTickets(tickets, filters)) : sortQueue(tickets);
}

export async function getTicketsByRequester(requesterId: string, compositeKey?: string): Promise<Ticket[]> {
  const tickets = await getTickets();
  return sortQueue(
    tickets.filter(
      (t) =>
        t.requesterId === requesterId ||
        (compositeKey && `${t.appId}:${t.requesterUid}` === compositeKey),
    ),
  );
}

export async function getTicketsByApp(appId: string): Promise<Ticket[]> {
  const tickets = await getTickets();
  return sortQueue(tickets.filter((t) => t.appId === appId));
}

export async function getOpenCountByApp(): Promise<Record<string, number>> {
  const tickets = await getTickets();
  const byApp = countByApp(
    tickets,
    VPS_APPS.map((a) => a.id),
  );
  const out: Record<string, number> = {};
  for (const [appId, counts] of Object.entries(byApp)) {
    out[appId] = counts.open;
  }
  return out;
}

export async function getStatusMatrixByApp(): Promise<Record<string, StatusCounts>> {
  const tickets = await getTickets();
  return countByApp(
    tickets,
    VPS_APPS.map((a) => a.id),
  );
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
  attachments: string[] = [],
  nextStatus?: TicketStatus,
): Promise<TicketMessage> {
  const msg = await addMessage({
    ticketId,
    senderId,
    senderName,
    senderRole,
    body: body.trim(),
    attachments,
    isInternalNote: senderRole === 'admin' ? isInternalNote : false,
  });

  const ticket = await getTicket(ticketId);
  if (ticket && !isInternalNote) {
    if (senderRole === 'requester') {
      const reopened = statusAfterRequesterReply(ticket.status);
      if (reopened !== ticket.status) {
        await storageUpdateTicket(ticketId, { status: reopened });
      }
    } else if (nextStatus && nextStatus !== ticket.status) {
      await storageUpdateTicket(ticketId, { status: nextStatus });
    }
  }

  return msg;
}

export async function markTicketSolvedByUser(ticketId: string, userName: string): Promise<Ticket> {
  const solvedAt = new Date().toISOString();
  const updated = await storageUpdateTicket(ticketId, {
    status: 'solved',
    solvedAt,
  });
  await addMessage({
    ticketId,
    senderId: 'system',
    senderName: 'Sistem',
    senderRole: 'system',
    body: `${userName} mengonfirmasi masalah sudah selesai.`,
    attachments: [],
    isInternalNote: false,
  });
  return updated;
}

export async function getDashboardStats() {
  const tickets = await getTickets();
  const today = new Date().toISOString().slice(0, 10);

  const total = tickets.length;
  const open = tickets.filter((t) => t.status === 'open').length;
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
  const waitingOnUser = tickets.filter((t) => t.status === 'waiting_on_user').length;
  const solvedToday = tickets.filter(
    (t) => t.status === 'solved' && t.solvedAt?.slice(0, 10) === today,
  ).length;
  const solved = tickets.filter((t) => t.status === 'solved' || t.status === 'closed').length;

  const resolvedTickets = tickets.filter((t) => t.solvedAt);
  const avgResolutionHours =
    resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const solvedTime = new Date(t.solvedAt!).getTime();
          return sum + Math.max(0.1, (solvedTime - created) / 3_600_000);
        }, 0) / resolvedTickets.length
      : 0;

  return { total, open, inProgress, waitingOnUser, solvedToday, solved, avgResolutionHours };
}
