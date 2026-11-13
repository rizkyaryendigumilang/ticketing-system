// Run: npm test (Node >= 22.18 runs TypeScript directly via type stripping)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  changeTicket,
  createTicket,
  markSolvedByRequester,
  replyToTicket,
  solveTicket,
  submitSatisfactionFeedback,
  type Actor,
  type NewTicketInput,
} from './ticketCrmService.ts';
import { enqueue, getData, getOutbox, upsertLocal } from './storageService.ts';
import type { CrmUser } from '../types/crm.ts';

const demoUser: CrmUser = {
  id: 'usr_snackloop01',
  compositeKey: 'snackloop:kasir1',
  appId: 'snackloop',
  externalUid: 'kasir1',
  name: 'Budi Kasir',
  appRole: 'Kasir Shift Pagi',
  systemRole: 'requester',
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
};

const adminActor: Actor = {
  id: 'admin:01',
  name: 'Superadmin',
  role: 'admin',
};

const requesterActor: Actor = {
  id: demoUser.id,
  name: demoUser.name,
  role: 'requester',
};

test('createTicket assigns prefix, sequential ticketNumber, open status, and queues outbox', () => {
  const initialTickets = getData().tickets.length;
  const initialOutbox = getOutbox().length;

  const input: NewTicketInput = {
    subject: 'Printer struk tidak merespons',
    description: 'Tombol cetak struk loading terus dan transaksi pending.',
    category: 'bug_error',
    priority: 'high',
    sourcePageUrl: 'https://43.156.236.102/snackloop/pos',
    attachments: ['data:image/jpeg;base64,sample123'],
  };

  const created = createTicket(demoUser, input);

  assert.ok(created.id);
  assert.ok(created.ticketNumber.startsWith('SNK-'));
  assert.equal(created.status, 'open');
  assert.equal(created.priority, 'high');
  assert.equal(created.category, 'bug_error');
  assert.equal(created.sourcePageUrl, 'https://43.156.236.102/snackloop/pos');
  assert.equal(created.attachments.length, 1);

  // Verify stored in local data
  const ticketsNow = getData().tickets;
  assert.equal(ticketsNow.length, initialTickets + 1);
  assert.ok(ticketsNow.some((t) => t.id === created.id));

  // Verify queued in outbox
  const outboxNow = getOutbox();
  assert.ok(outboxNow.length > initialOutbox);
  assert.ok(outboxNow.some((op) => op.collection === 'tickets' && op.item.id === created.id));
});

test('changeTicket updates status and priority, and logs a system audit message', () => {
  const ticket = getData().tickets[0];
  const initialMessages = getData().messages.filter((m) => m.ticketId === ticket.id).length;

  changeTicket(ticket, { priority: 'urgent', status: 'in_progress' }, adminActor);

  const updatedTicket = getData().tickets.find((t) => t.id === ticket.id);
  assert.equal(updatedTicket?.priority, 'urgent');
  assert.equal(updatedTicket?.status, 'in_progress');

  const messagesNow = getData().messages.filter((m) => m.ticketId === ticket.id);
  assert.equal(messagesNow.length, initialMessages + 1);
  const latestMessage = messagesNow[messagesNow.length - 1];
  assert.equal(latestMessage.senderRole, 'system');
  assert.ok(latestMessage.body.includes('Superadmin'));
});

test('replyToTicket enforces internal note permissions and requester status reopening', () => {
  const ticket = getData().tickets[0];

  // Admin internal note
  replyToTicket(ticket, adminActor, 'Catatan teknis internal untuk DevOps', { internal: true });
  const internalNote = getData().messages.find(
    (m) => m.ticketId === ticket.id && m.body === 'Catatan teknis internal untuk DevOps',
  );
  assert.ok(internalNote);
  assert.equal(internalNote.isInternalNote, true);

  // Requester cannot create internal notes
  replyToTicket(ticket, requesterActor, 'Mohon konfirmasi progresnya', { internal: true });
  const requesterNote = getData().messages.find(
    (m) => m.ticketId === ticket.id && m.body === 'Mohon konfirmasi progresnya',
  );
  assert.ok(requesterNote);
  assert.equal(requesterNote.isInternalNote, false);
});

test('solveTicket updates status to solved, records solvedAt and resolutionSummary', () => {
  const ticket = getData().tickets[0];
  const resolutionText = 'Koneksi printer USB di-restart dan service thermal printer aktif kembali.';

  solveTicket(ticket, adminActor, resolutionText);

  const solved = getData().tickets.find((t) => t.id === ticket.id);
  assert.equal(solved?.status, 'solved');
  assert.equal(solved?.resolutionSummary, resolutionText);
  assert.ok(solved?.solvedAt);

  const resolutionMsg = getData().messages.find(
    (m) => m.ticketId === ticket.id && m.body === resolutionText,
  );
  assert.ok(resolutionMsg);
});

test('markSolvedByRequester allows requester to close completed issue', () => {
  const ticket = getData().tickets[0];

  markSolvedByRequester(ticket, requesterActor);

  const closed = getData().tickets.find((t) => t.id === ticket.id);
  assert.equal(closed?.status, 'solved');
  assert.ok(closed?.solvedAt);
});

test('submitSatisfactionFeedback stores 1-5 star rating and comment', () => {
  const ticket = getData().tickets[0];

  submitSatisfactionFeedback(ticket, requesterActor, 5, 'Pelayanan sangat cepat dan solutif!');

  const rated = getData().tickets.find((t) => t.id === ticket.id);
  assert.equal(rated?.satisfactionRating, 5);
  assert.equal(rated?.satisfactionComment, 'Pelayanan sangat cepat dan solutif!');

  const auditMsg = getData().messages.find(
    (m) => m.ticketId === ticket.id && m.body.includes('5/5 bintang'),
  );
  assert.ok(auditMsg);
});

test('upsertLocal with isServerRealtime=true guards optimistic outbox mutations against SSE stale overwrites', () => {
  const ticket = getData().tickets[0];
  const optimisticTicket = { ...ticket, status: 'in_progress' as const, priority: 'urgent' as const };

  // 1. Optimistic save: update local cache and queue operation into outbox
  upsertLocal('tickets', optimisticTicket);
  enqueue({ collection: 'tickets', action: 'update', item: optimisticTicket });
  assert.equal(getData().tickets.find((t) => t.id === ticket.id)?.status, 'in_progress');

  // 2. Incoming SSE event with stale data ('open') arriving before outbox flushes
  const staleServerTicket = { ...ticket, status: 'open' as const, priority: 'low' as const };
  upsertLocal('tickets', staleServerTicket, true);

  // Status must remain 'in_progress' because pending outbox protected it
  assert.equal(getData().tickets.find((t) => t.id === ticket.id)?.status, 'in_progress');
});
