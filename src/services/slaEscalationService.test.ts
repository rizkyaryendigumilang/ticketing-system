import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSlaAutomation } from './slaEscalationService.ts';
import type { Ticket } from '../types/crm.ts';

test('runSlaAutomation auto-escalates breached open tickets to urgent priority', () => {
  const now = Date.now();
  // high SLA is 6 hours; created 7 hours ago -> breached
  const breachedTicket: Ticket = {
    id: 'tkt_breached_1',
    ticketNumber: 101,
    prefix: 'IT',
    appId: 'app1',
    requesterId: 'req1',
    subject: 'Server CPU 100%',
    status: 'open',
    priority: 'high',
    category: 'teknis',
    messages: [],
    createdAt: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
  };

  // medium SLA is 24 hours; created 1 hour ago -> on-track
  const onTrackTicket: Ticket = {
    id: 'tkt_ontrack_2',
    ticketNumber: 102,
    prefix: 'IT',
    appId: 'app1',
    requesterId: 'req2',
    subject: 'Request mouse',
    status: 'open',
    priority: 'medium',
    category: 'permintaan',
    messages: [],
    createdAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
  };

  const result = runSlaAutomation([breachedTicket, onTrackTicket], now);
  assert.equal(result.escalatedTicketIds.includes('tkt_breached_1'), true);
  assert.equal(result.escalatedTicketIds.includes('tkt_ontrack_2'), false);
  assert.equal(breachedTicket.priority, 'urgent');
});

test('runSlaAutomation auto-closes solved tickets inactive for > 72 hours', () => {
  const now = Date.now();
  const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();

  const oldSolvedTicket: Ticket = {
    id: 'tkt_solved_old',
    ticketNumber: 103,
    prefix: 'IT',
    appId: 'app1',
    requesterId: 'req3',
    subject: 'Printer network',
    status: 'solved',
    priority: 'medium',
    category: 'teknis',
    messages: [],
    createdAt: fourDaysAgo,
    updatedAt: fourDaysAgo,
    solvedAt: fourDaysAgo,
  };

  const recentSolvedTicket: Ticket = {
    id: 'tkt_solved_recent',
    ticketNumber: 104,
    prefix: 'IT',
    appId: 'app1',
    requesterId: 'req4',
    subject: 'Monitor cable',
    status: 'solved',
    priority: 'medium',
    category: 'teknis',
    messages: [],
    createdAt: oneDayAgo,
    updatedAt: oneDayAgo,
    solvedAt: oneDayAgo,
  };

  const result = runSlaAutomation([oldSolvedTicket, recentSolvedTicket], now);
  assert.equal(result.autoClosedTicketIds.includes('tkt_solved_old'), true);
  assert.equal(result.autoClosedTicketIds.includes('tkt_solved_recent'), false);
  assert.equal(oldSolvedTicket.status, 'closed');
  assert.equal(recentSolvedTicket.status, 'solved');
});
