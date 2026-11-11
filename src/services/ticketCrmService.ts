// Ticket actions. Each one writes to the local store immediately and queues the change for PocketBase.
import { getApp, STATUS_LABEL } from '../config/vpsAppsConfig.ts';
import { describeDevice, newId, nextTicketNumber, safeHttpUrl, statusAfterRequesterReply } from './crmLogic.ts';
import { saveRecord } from './pbClient.ts';
import { getData } from './storageService.ts';
import type { CrmUser, Ticket, TicketCategory, TicketMessage, TicketPriority, TicketStatus } from '../types/crm';

/** Who performs an action. Admin actions need a PocketBase superuser session to sync. */
export interface Actor {
  id: string;
  name: string;
  role: 'admin' | 'requester';
}

const now = () => new Date().toISOString();

function postMessage(ticketId: string, actor: Actor | 'system', body: string, extra: Partial<TicketMessage> = {}) {
  const sender =
    actor === 'system'
      ? { senderId: 'system', senderName: 'Sistem', senderRole: 'system' as const }
      : { senderId: actor.id, senderName: actor.name, senderRole: actor.role };
  const message: TicketMessage = {
    id: newId(),
    ticketId,
    ...sender,
    body: body.trim(),
    attachments: [],
    isInternalNote: false,
    createdAt: now(),
    ...extra,
  };
  saveRecord('ticket_messages', message, undefined, actor !== 'system' && actor.role === 'admin');
}

function patchTicket(ticket: Ticket, patch: Partial<Ticket>, actor: Actor) {
  const full = { ...patch, updatedAt: now() };
  saveRecord('tickets', { ...ticket, ...full }, full, actor.role === 'admin');
}

export interface NewTicketInput {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  sourcePageUrl?: string;
  attachments: string[];
}

export function createTicket(user: CrmUser, input: NewTicketInput): Ticket {
  const prefix = getApp(user.appId)?.prefix ?? 'TKT';
  const ts = now();
  const ticket: Ticket = {
    id: newId(),
    ticketNumber: nextTicketNumber(prefix, getData().tickets.map((t) => t.ticketNumber)),
    appId: user.appId,
    requesterId: user.id,
    requesterName: user.name,
    requesterUid: user.externalUid,
    requesterRole: user.appRole,
    subject: (input.subject || 'Laporan Kendala Baru').trim(),
    description: (input.description || input.subject || 'Tidak ada deskripsi tambahan.').trim(),
    category: input.category,
    priority: input.priority,
    status: 'open',
    sourcePageUrl: safeHttpUrl(input.sourcePageUrl),
    deviceInfo: describeDevice(navigator.userAgent),
    attachments: input.attachments,
    createdAt: ts,
    updatedAt: ts,
  };
  saveRecord('tickets', ticket);
  return ticket;
}

/** Admin edits from the properties panel, the inbox table and the Kanban board. */
export function changeTicket(ticket: Ticket, patch: Partial<Pick<Ticket, 'status' | 'priority' | 'category'>>, actor: Actor) {
  const statusChanged = patch.status && patch.status !== ticket.status;
  patchTicket(ticket, statusChanged && patch.status === 'solved' ? { ...patch, solvedAt: now() } : patch, actor);
  if (statusChanged) postMessage(ticket.id, 'system', `${actor.name} mengubah status ke ${STATUS_LABEL[patch.status!]}.`);
}

export function replyToTicket(
  ticket: Ticket,
  actor: Actor,
  body: string,
  options: { internal?: boolean; attachments?: string[]; nextStatus?: TicketStatus } = {},
) {
  const internal = actor.role === 'admin' && Boolean(options.internal);
  postMessage(ticket.id, actor, body, { isInternalNote: internal, attachments: options.attachments ?? [] });
  if (internal) return;

  if (actor.role === 'requester') {
    // Guests may only touch a ticket's status, so send an update only when the reply reopens it.
    const status = statusAfterRequesterReply(ticket.status);
    if (status !== ticket.status) patchTicket(ticket, { status }, actor);
    return;
  }
  const status = options.nextStatus ?? ticket.status;
  patchTicket(ticket, status === ticket.status ? {} : { status }, actor);
}

export function solveTicket(ticket: Ticket, actor: Actor, resolution: string, attachments: string[] = []) {
  postMessage(ticket.id, actor, resolution, { attachments });
  patchTicket(ticket, { status: 'solved', solvedAt: now(), resolutionSummary: resolution.trim() }, actor);
  postMessage(ticket.id, 'system', `${actor.name} menyelesaikan tiket ini.`);
}

export function markSolvedByRequester(ticket: Ticket, actor: Actor) {
  patchTicket(ticket, { status: 'solved', solvedAt: now() }, actor);
  postMessage(ticket.id, 'system', `${actor.name} menandai masalah sudah selesai.`);
}

export function submitSatisfactionFeedback(ticket: Ticket, actor: Actor, rating: number, comment?: string) {
  const boundedRating = Math.max(1, Math.min(5, Math.round(rating)));
  const cleanComment = comment?.trim();
  patchTicket(
    ticket,
    {
      satisfactionRating: boundedRating,
      satisfactionComment: cleanComment || undefined,
    },
    actor,
  );
  postMessage(
    ticket.id,
    'system',
    `${actor.name} memberi penilaian kepuasan: ${boundedRating}/5 bintang${cleanComment ? ` ("${cleanComment}")` : ''}.`,
  );
}
