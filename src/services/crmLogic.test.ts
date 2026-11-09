// Run: npm test  (Node >= 22.18 runs TypeScript directly via type stripping)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compositeKeyOf,
  filterTickets,
  newId,
  nextTicketNumber,
  parseHandoff,
  safeHttpUrl,
  sortQueue,
  statusAfterRequesterReply,
  visibleMessages,
} from './crmLogic.ts';
import type { Ticket, TicketMessage } from '../types/crm';

const APPS = ['snackloop', 'wedding', 'recruiter'];

test('same username in two apps gives two different identities', () => {
  assert.equal(compositeKeyOf('snackloop', 'admin'), 'snackloop:admin');
  assert.notEqual(compositeKeyOf('snackloop', 'admin'), compositeKeyOf('wedding', 'admin'));
  assert.equal(compositeKeyOf('recruiter', ' employer@demo.com '), 'recruiter:employer@demo.com');
});

test('handoff accepts a complete link', () => {
  const r = parseHandoff(
    new URLSearchParams('app=snackloop&uid=staff1&name=Rina&role=Staff&from_url=https://43.156.236.102/snackloop/rekap'),
    APPS,
  );
  assert.deepEqual(r, {
    ok: true,
    params: { app: 'snackloop', uid: 'staff1', name: 'Rina', role: 'Staff', fromUrl: 'https://43.156.236.102/snackloop/rekap' },
  });
});

test('handoff rejects unknown app and missing uid, defaults name and role', () => {
  assert.equal(parseHandoff(new URLSearchParams('app=unknown&uid=x'), APPS).ok, false);
  assert.equal(parseHandoff(new URLSearchParams('app=snackloop'), APPS).ok, false);
  assert.equal(parseHandoff(new URLSearchParams(''), APPS).ok, false);
  const r = parseHandoff(new URLSearchParams('app=wedding&uid=admin'), APPS);
  assert.ok(r.ok && r.params.name === 'admin' && r.params.role === 'User');
});

test('only http(s) URLs survive and enforce strict security boundaries', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), undefined);
  assert.equal(safeHttpUrl('data:text/html,hi'), undefined);
  assert.equal(safeHttpUrl('not a url'), undefined);
  assert.equal(safeHttpUrl('https://example.com\\evil.com'), undefined);
  assert.equal(safeHttpUrl('https://admin:secret@example.com/login'), undefined);
  assert.equal(safeHttpUrl('https://example.com/' + 'a'.repeat(2100)), undefined);
  assert.equal(safeHttpUrl('https://a.b/c?d=1'), 'https://a.b/c?d=1');
  const r = parseHandoff(new URLSearchParams('app=wedding&uid=a&from_url=javascript:alert(1)'), APPS);
  assert.ok(r.ok && r.params.fromUrl === undefined);

  // Test control character stripping in handoff params
  const sanitized = parseHandoff(
    new URLSearchParams('app=wedding&uid=staff1\x00&name=Kiky\x07&role=Staff\r\n'),
    APPS,
  );
  assert.ok(sanitized.ok);
  assert.equal(sanitized.params.uid, 'staff1');
  assert.equal(sanitized.params.name, 'Kiky');
  assert.equal(sanitized.params.role, 'Staff');
});

test('ticket numbers continue after the highest number per prefix', () => {
  assert.equal(nextTicketNumber('SNK', []), 'SNK-001');
  assert.equal(nextTicketNumber('SNK', ['SNK-001', 'SNK-007', 'REC-020', 'SNK-x']), 'SNK-008');
  assert.equal(nextTicketNumber('REC', ['REC-999']), 'REC-1000');
});

test('requesters never see internal notes', () => {
  const m = (id: string, isInternalNote: boolean) => ({ id, isInternalNote }) as TicketMessage;
  const all = [m('a', false), m('b', true), m('c', false)];
  assert.deepEqual(visibleMessages(all, 'requester').map((x) => x.id), ['a', 'c']);
  assert.equal(visibleMessages(all, 'admin').length, 3);
});

const t = (id: string, status: Ticket['status'], priority: Ticket['priority'], createdAt: string, extra: Partial<Ticket> = {}) =>
  ({ id, status, priority, createdAt, ticketNumber: id, subject: '', requesterName: '', requesterUid: '', appId: 'snackloop', ...extra }) as Ticket;

test('queue puts open first, then priority, then newest', () => {
  const sorted = sortQueue([
    t('solved-urgent', 'solved', 'urgent', '2026-11-04'),
    t('open-low', 'open', 'low', '2026-11-04'),
    t('open-urgent-old', 'open', 'urgent', '2026-11-01'),
    t('open-urgent-new', 'open', 'urgent', '2026-11-03'),
    t('progress-high', 'in_progress', 'high', '2026-11-04'),
  ]);
  assert.deepEqual(sorted.map((x) => x.id), ['open-urgent-new', 'open-urgent-old', 'open-low', 'progress-high', 'solved-urgent']);
});

test('filters combine app, active status and search', () => {
  const list = [
    t('SNK-001', 'open', 'high', '1', { subject: 'Rekap gagal' }),
    t('SNK-002', 'solved', 'low', '1'),
    t('WED-001', 'waiting_on_user', 'low', '1', { appId: 'wedding' }),
  ];
  assert.deepEqual(filterTickets(list, { status: 'active' }).map((x) => x.id), ['SNK-001', 'WED-001']);
  assert.deepEqual(filterTickets(list, { appId: 'snackloop', search: 'rekap' }).map((x) => x.id), ['SNK-001']);
});

test('requester reply reopens waiting and solved tickets only', () => {
  assert.equal(statusAfterRequesterReply('waiting_on_user'), 'open');
  assert.equal(statusAfterRequesterReply('solved'), 'open');
  assert.equal(statusAfterRequesterReply('in_progress'), 'in_progress');
});

test('ids match the PocketBase id format', () => {
  assert.match(newId(), /^[a-z0-9]{15}$/);
});
