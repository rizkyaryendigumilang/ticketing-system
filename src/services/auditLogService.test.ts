import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAuditLogs,
  logAuditEvent,
  clearAuditLogs,
  exportAuditLogs,
} from './auditLogService.ts';

test('auditLogService records, retrieves, and clears audit logs', () => {
  clearAuditLogs();
  const initial = getAuditLogs();
  assert.equal(initial.length, 0);

  const entry = logAuditEvent({
    actorId: 'admin-1',
    actorName: 'Super Admin',
    actorRole: 'superadmin',
    action: 'ticket_status_change',
    target: 'TKT-101',
    details: 'Mengubah status tiket menjadi Selesai',
  });

  assert.ok(entry.id.startsWith('log-'));
  assert.equal(entry.target, 'TKT-101');
  assert.equal(entry.actorName, 'Super Admin');

  const logs = getAuditLogs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].id, entry.id);

  // Test CSV export
  const csv = exportAuditLogs('csv');
  assert.ok(csv.filename.endsWith('.csv'));
  assert.ok(csv.blob.size > 0);

  // Test JSON export
  const json = exportAuditLogs('json');
  assert.ok(json.filename.endsWith('.json'));
  assert.ok(json.blob.size > 0);

  // Cleanup
  clearAuditLogs();
  assert.equal(getAuditLogs().length, 0);
});
