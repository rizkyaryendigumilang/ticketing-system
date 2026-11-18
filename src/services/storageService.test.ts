import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getData,
  getOutbox,
  upsertLocal,
  removeLocal,
  setOutbox,
  enqueue,
  replaceAll,
  pruneOldClosedTickets,
  resetToSeed,
  type OutboxOp,
} from './storageService.ts';
import type { Ticket } from '../types/crm';

test('storageService: upsertLocal inserts new ticket and updates existing ticket', () => {
  resetToSeed();
  const sampleTicket: Ticket = {
    id: 'test_ticket_001',
    ticketNumber: 'TST-101',
    appId: 'recruiter',
    requesterId: 'usr_001',
    requesterName: 'Budi Santoso',
    requesterUid: 'budi123',
    requesterRole: 'Kandidat',
    subject: 'Gagal unggah CV',
    description: 'Tombol upload tidak merespon saat diklik',
    category: 'bug_error',
    priority: 'high',
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  // 1. Insert new
  upsertLocal('tickets', sampleTicket);
  let found = getData().tickets.find((t) => t.id === 'test_ticket_001');
  assert.ok(found);
  assert.equal(found?.subject, 'Gagal unggah CV');
  assert.equal(found?.priority, 'high');

  // 2. Update existing
  const updatedTicket: Ticket = { ...sampleTicket, priority: 'urgent', status: 'in_progress' };
  upsertLocal('tickets', updatedTicket);
  found = getData().tickets.find((t) => t.id === 'test_ticket_001');
  assert.equal(found?.priority, 'urgent');
  assert.equal(found?.status, 'in_progress');

  // 3. Cleanup
  removeLocal('tickets', 'test_ticket_001');
  found = getData().tickets.find((t) => t.id === 'test_ticket_001');
  assert.equal(found, undefined);
});

test('storageService: upsertLocal with isServerRealtime=true preserves optimistic outbox changes', () => {
  resetToSeed();
  const localTicket: Ticket = {
    id: 'test_opt_002',
    ticketNumber: 'TST-102',
    appId: 'recruiter',
    requesterId: 'usr_002',
    requesterName: 'Dewi',
    requesterUid: 'dewi456',
    requesterRole: 'Pelamar',
    subject: 'Status lamaran',
    description: 'Lamaran belum direspon',
    category: 'feature_question',
    priority: 'urgent', // local optimistic priority
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  upsertLocal('tickets', localTicket);
  enqueue({ collection: 'tickets', item: localTicket, asAdmin: false });

  // Incoming stale server update with old priority 'low'
  const staleServerTicket: Ticket = { ...localTicket, priority: 'low' };
  upsertLocal('tickets', staleServerTicket, true);

  const current = getData().tickets.find((t) => t.id === 'test_opt_002');
  assert.equal(current?.priority, 'urgent', 'Optimistic outbox priority must not be overwritten by stale SSE update');

  // Cleanup
  setOutbox([]);
  removeLocal('tickets', 'test_opt_002');
});

test('storageService: replaceAll restores server state but overlays uncommitted outbox operations', () => {
  resetToSeed();
  const pendingTicket: Ticket = {
    id: 'test_replace_003',
    ticketNumber: 'TST-103',
    appId: 'wedding',
    requesterId: 'usr_003',
    requesterName: 'Rina',
    requesterUid: 'rina789',
    requesterRole: 'Tamu',
    subject: 'Konfirmasi kehadiran',
    description: 'QR Code rusak',
    category: 'bug_error',
    priority: 'urgent',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  };

  const op: OutboxOp = { collection: 'tickets', item: pendingTicket, asAdmin: false };
  setOutbox([op]);

  // Server returns state that does NOT have this ticket yet
  replaceAll({
    apps: getData().apps,
    users: getData().users,
    tickets: [],
    messages: [],
  });

  const merged = getData().tickets.find((t) => t.id === 'test_replace_003');
  assert.ok(merged, 'Uncommitted outbox operation must be re-applied after replaceAll');
  assert.equal(merged?.status, 'in_progress');

  // Cleanup
  setOutbox([]);
  resetToSeed();
});

test('storageService: pruneOldClosedTickets preserves tickets with pending outbox mutations', () => {
  resetToSeed();
  const oldCutoffDate = new Date(Date.now() - 90 * 86_400_000).toISOString();

  // 1. Old closed ticket without outbox -> should be pruned
  const oldClosedTicket: Ticket = {
    id: 'old_closed_001',
    ticketNumber: 'OLD-001',
    appId: 'recruiter',
    requesterId: 'usr_old',
    requesterName: 'Budi',
    requesterUid: 'budi_old',
    requesterRole: 'Pelamar',
    subject: 'Tiket lampau',
    description: 'Sudah selesai lama',
    category: 'other',
    priority: 'low',
    status: 'closed',
    createdAt: oldCutoffDate,
    updatedAt: oldCutoffDate,
  };
  upsertLocal('tickets', oldClosedTicket);

  // 2. Old closed ticket WITH pending outbox -> must be kept
  const oldPendingTicket: Ticket = {
    id: 'old_pending_002',
    ticketNumber: 'OLD-002',
    appId: 'recruiter',
    requesterId: 'usr_old2',
    requesterName: 'Andi',
    requesterUid: 'andi_old',
    requesterRole: 'Pelamar',
    subject: 'Tiket lampau dengan pending sync',
    description: 'Perlu sinkronisasi',
    category: 'other',
    priority: 'low',
    status: 'closed',
    createdAt: oldCutoffDate,
    updatedAt: oldCutoffDate,
  };
  upsertLocal('tickets', oldPendingTicket);
  enqueue({ collection: 'tickets', item: oldPendingTicket, asAdmin: false });

  const prunedCount = pruneOldClosedTickets(60);
  assert.equal(prunedCount, 1);

  const keptIds = getData().tickets.map((t) => t.id);
  assert.ok(!keptIds.includes('old_closed_001'), 'Old closed ticket must be pruned');
  assert.ok(keptIds.includes('old_pending_002'), 'Old ticket with pending outbox must not be pruned');

  // Cleanup
  setOutbox([]);
  resetToSeed();
});
