// Run: npm test  (Node >= 22.18 runs TypeScript directly via type stripping)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compositeKeyOf,
  computeTicketSla,
  computeTrendMetrics,
  createHandoffSignature,
  filterTickets,
  formatTicketsCsv,
  newId,
  nextTicketNumber,
  parseHandoff,
  safeHttpUrl,
  sortQueue,
  statusAfterRequesterReply,
  verifyHandoffSignature,
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
    params: {
      app: 'snackloop',
      uid: 'staff1',
      name: 'Rina',
      role: 'Staff',
      fromUrl: 'https://43.156.236.102/snackloop/rekap',
      newTicket: false,
      autoSubmit: false,
      subject: undefined,
      description: undefined,
      category: undefined,
      priority: undefined,
    },
  });
});

test('handoff parses auto_submit and prefilled problem fields', () => {
  const r = parseHandoff(
    new URLSearchParams(
      'app=snackloop&uid=admin&name=Admin+Snack&role=Owner&new=1&auto_submit=1&subject=Printer+thermal+mati&description=Tidak+bisa+print+struk&category=bug_error&priority=urgent',
    ),
    APPS,
  );
  assert.deepEqual(r, {
    ok: true,
    params: {
      app: 'snackloop',
      uid: 'admin',
      name: 'Admin Snack',
      role: 'Owner',
      fromUrl: undefined,
      newTicket: true,
      autoSubmit: true,
      subject: 'Printer thermal mati',
      description: 'Tidak bisa print struk',
      category: 'bug_error',
      priority: 'urgent',
    },
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

test('deep search finds tickets matching content inside reply messages', () => {
  const tickets = [
    t('TKT-01', 'open', 'low', '2026-11-04', { subject: 'Pertanyaan akun' }),
    t('TKT-02', 'in_progress', 'high', '2026-11-04', { subject: 'Laporan bug umum' }),
  ];
  const messages: TicketMessage[] = [
    {
      id: 'msg01',
      ticketId: 'TKT-02',
      senderId: 'user1',
      senderName: 'Budi',
      senderRole: 'requester',
      body: 'Error 500 terjadi pada saat export PDF tagihan #INV-9923',
      attachments: [],
      isInternalNote: false,
      createdAt: '2026-11-04',
    },
  ];

  // Searching by standard subject doesn't match TKT-01
  const normalSearch = filterTickets(tickets, { search: 'INV-9923' });
  assert.equal(normalSearch.length, 0);

  // Deep search with messages matches TKT-02
  const deepSearch = filterTickets(tickets, { search: 'INV-9923', messages });
  assert.equal(deepSearch.length, 1);
  assert.equal(deepSearch[0].id, 'TKT-02');
});

test('formatTicketsCsv produces properly escaped and formatted CSV', () => {
  const list = [
    t('SNK-101', 'solved', 'urgent', '2026-11-04', {
      subject: 'Rekap, "Khusus" Harian',
      requesterName: 'Rina (Kasir)',
      requesterRole: 'Staff',
      satisfactionRating: 5,
      resolutionSummary: 'Bug printer sudah fixed.',
    }),
  ];
  const csv = formatTicketsCsv(list);
  assert.ok(csv.includes('Nomor Tiket,Aplikasi,Pelapor,Role Pelapor'));
  assert.ok(csv.includes('"SNK-101"'));
  assert.ok(csv.includes('"Rekap, ""Khusus"" Harian"'));
  assert.ok(csv.includes('"5/5"'));
});

test('createHandoffSignature and verifyHandoffSignature enforce cryptographic authenticity and expiration', async () => {
  const secret = 'vps-super-secret-key-123';
  const now = 1731140000;
  const sig = await createHandoffSignature('snackloop', 'staff1', now, secret);
  assert.ok(sig && sig.length === 64);

  // Valid signature and timestamp
  const validParams = new URLSearchParams({
    app: 'snackloop',
    uid: 'staff1',
    ts: String(now),
    sig,
  });
  const validRes = await verifyHandoffSignature(validParams, secret, now);
  assert.equal(validRes.valid, true);

  // Tampered uid
  const tamperedParams = new URLSearchParams({
    app: 'snackloop',
    uid: 'hacker_admin',
    ts: String(now),
    sig,
  });
  const tamperedRes = await verifyHandoffSignature(tamperedParams, secret, now);
  assert.equal(tamperedRes.valid, false);
  assert.ok(tamperedRes.reason?.includes('mismatch'));

  // Expired timestamp (> 15 minutes)
  const expiredParams = new URLSearchParams({
    app: 'snackloop',
    uid: 'staff1',
    ts: String(now - 1200), // 20 minutes ago
    sig: await createHandoffSignature('snackloop', 'staff1', now - 1200, secret),
  });
  const expiredRes = await verifyHandoffSignature(expiredParams, secret, now);
  assert.equal(expiredRes.valid, false);
  assert.ok(expiredRes.reason?.includes('kedaluwarsa'));
});

test('requester ticket ownership isolation prevents cross-tenant access with identical externalUid', () => {
  const weddingUser = { id: 'usr_wedding_01', appId: 'wedding', externalUid: 'admin' };
  const snackloopUser = { id: 'usr_snackloop_02', appId: 'snackloop', externalUid: 'admin' };
  
  const snackloopTicket = t('SNK-010', 'open', 'high', '2026-11-10', {
    appId: 'snackloop',
    requesterId: snackloopUser.id,
    requesterUid: snackloopUser.externalUid,
  });

  const checkAccess = (ticket: Ticket, user: { id: string; appId: string; externalUid: string }) =>
    ticket.requesterId === user.id ||
    (ticket.appId === user.appId && ticket.requesterUid === user.externalUid);

  // Snackloop user can access snackloop ticket
  assert.equal(checkAccess(snackloopTicket, snackloopUser), true);

  // Wedding user with identical uid ('admin') CANNOT access snackloop ticket
  assert.equal(checkAccess(snackloopTicket, weddingUser), false);
});

test('computeTrendMetrics produces daily trends, breakdown by category and priority', () => {
  const fakeNow = Date.parse('2026-11-13T12:00:00.000Z');
  const sampleTickets: Ticket[] = [
    t('T1', 'open', 'urgent', '2026-11-13T08:00:00.000Z', { category: 'bug_error' }),
    t('T2', 'solved', 'high', '2026-11-12T10:00:00.000Z', { category: 'account_login', solvedAt: '2026-11-13T09:00:00.000Z' }),
    t('T3', 'in_progress', 'medium', '2026-11-11T14:00:00.000Z', { category: 'data_transaction' }),
  ];

  const metrics = computeTrendMetrics(sampleTickets, 7, fakeNow);
  assert.equal(metrics.totalTickets, 3);
  assert.equal(metrics.openCount, 1);
  assert.equal(metrics.solvedCount, 1);
  assert.equal(metrics.inProgressCount, 1);
  assert.equal(metrics.dailyTrends.length, 7);

  // Today (2026-11-13): 1 created (T1), 1 solved (T2)
  const todayPoint = metrics.dailyTrends[metrics.dailyTrends.length - 1];
  assert.equal(todayPoint.dateKey, '2026-11-13');
  assert.equal(todayPoint.created, 1);
  assert.equal(todayPoint.solved, 1);

  // Categories
  assert.equal(metrics.categoryBreakdown.bug_error, 1);
  assert.equal(metrics.categoryBreakdown.account_login, 1);
  assert.equal(metrics.categoryBreakdown.data_transaction, 1);

  // Urgent open count (urgent + high in open/in_progress) -> T1 is urgent open
  assert.equal(metrics.urgentOpenCount, 1);
});

test('computeTicketSla calculates on_track, warning, and breached states accurately', () => {
  const baseTime = Date.parse('2026-11-13T12:00:00.000Z');

  // Urgent ticket created 30 mins ago (deadline is +2h, remaining = 1.5h) -> on_track
  const urgentTicket = t('T-URGENT', 'open', 'urgent', new Date(baseTime - 30 * 60_000).toISOString());
  const slaUrgent = computeTicketSla(urgentTicket, baseTime);
  assert.equal(slaUrgent.status, 'on_track');
  assert.equal(slaUrgent.remainingMs, 90 * 60_000);

  // Urgent ticket created 105 mins ago (deadline +2h, remaining = 15m) -> warning (<24m for urgent)
  const warnTicket = t('T-WARN', 'open', 'urgent', new Date(baseTime - 105 * 60_000).toISOString());
  const slaWarn = computeTicketSla(warnTicket, baseTime);
  assert.equal(slaWarn.status, 'warning');

  // Urgent ticket created 3 hours ago -> breached
  const breachTicket = t('T-BREACH', 'open', 'urgent', new Date(baseTime - 180 * 60_000).toISOString());
  const slaBreach = computeTicketSla(breachTicket, baseTime);
  assert.equal(slaBreach.status, 'breached');
  assert.ok(slaBreach.label.includes('Lewat'));

  // Solved ticket within deadline -> achieved
  const solvedTicket = t('T-SOLVED', 'solved', 'urgent', new Date(baseTime - 60 * 60_000).toISOString(), {
    solvedAt: new Date(baseTime - 10 * 60_000).toISOString(),
  });
  const slaSolved = computeTicketSla(solvedTicket, baseTime);
  assert.equal(slaSolved.status, 'achieved');
});

test('filterTickets supports assignedFilter for me, unassigned, and all', () => {
  const tickets: Ticket[] = [
    t('T1', 'open', 'low', '1', { assignedTo: 'admin1', assignedToName: 'Budi' }),
    t('T2', 'open', 'low', '1', { assignedTo: 'admin2', assignedToName: 'Siti' }),
    t('T3', 'open', 'low', '1', { assignedTo: undefined }),
  ];

  // Unassigned filter
  const unassigned = filterTickets(tickets, { assignedFilter: 'unassigned' });
  assert.deepEqual(unassigned.map((x) => x.id), ['T3']);

  // Assigned to me (admin1)
  const myTickets = filterTickets(tickets, { assignedFilter: 'me', currentAdminId: 'admin1' });
  assert.deepEqual(myTickets.map((x) => x.id), ['T1']);
});
