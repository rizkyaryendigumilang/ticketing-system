import test from 'node:test';
import assert from 'node:assert/strict';
import { findSuggestedSolutions, checkDuplicateTicket } from './deflectionService.ts';
import type { Ticket } from '../types/crm.ts';

test('findSuggestedSolutions finds matching articles for printer issues', () => {
  const suggestions = findSuggestedSolutions('snackloop', 'Printer POS kasir error tidak respon');
  assert.ok(suggestions.length > 0);
  assert.equal(suggestions[0].article.id, 'kb-snk-01');
  assert.ok(suggestions[0].relevanceScore > 20);
});

test('findSuggestedSolutions returns empty for unrelated queries', () => {
  const suggestions = findSuggestedSolutions('snackloop', 'xyzabc123 tidak ada arti');
  assert.equal(suggestions.length, 0);
});

test('checkDuplicateTicket detects similar active ticket within 24 hours', () => {
  const tickets: Ticket[] = [
    {
      id: 'tkt-dup-1',
      ticketNumber: 'SNK-001',
      appId: 'snackloop',
      requesterId: 'user-1',
      requesterUid: 'staff1',
      requesterName: 'Staff 1',
      requesterRole: 'Staff Kasir',
      subject: 'Printer bluetooth kasir mati mendadak',
      description: 'Printer tidak bisa cetak',
      category: 'bug_error',
      priority: 'high',
      status: 'open',
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const duplicate = checkDuplicateTicket(tickets, 'snackloop', 'staff1', 'Printer bluetooth kasir bermasalah');
  assert.ok(duplicate);
  assert.equal(duplicate?.id, 'tkt-dup-1');

  // Should ignore tickets from a different user or solved tickets
  const otherUser = checkDuplicateTicket(tickets, 'snackloop', 'staff2', 'Printer bluetooth kasir bermasalah');
  assert.equal(otherUser, null);
});
