import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBackupConfig,
  saveBackupConfig,
  generateLatestBackup,
} from './backupSyncService.ts';

test('backupSyncService manages auto-sync config correctly', () => {
  const initial = getBackupConfig();
  assert.equal(typeof initial.autoSyncEnabled, 'boolean');

  const updated = saveBackupConfig({ autoSyncEnabled: false, intervalMinutes: 30 });
  assert.equal(updated.autoSyncEnabled, false);
  assert.equal(updated.intervalMinutes, 30);

  // Restore
  saveBackupConfig({ autoSyncEnabled: true, intervalMinutes: 15 });
});

test('generateLatestBackup produces valid CSV and JSON for all and personal scopes', async () => {
  // Test CSV export (all)
  const csvAll = await generateLatestBackup({ scope: 'all', format: 'csv' });
  assert.ok(csvAll.filename.endsWith('.csv'));
  assert.equal(csvAll.format, 'csv');
  assert.equal(csvAll.scope, 'all');
  assert.ok(csvAll.blob.size > 0);
  const buf = new Uint8Array(await csvAll.blob.arrayBuffer());
  assert.equal(buf[0], 0xef, 'First byte of UTF-8 BOM must be 0xEF');
  assert.equal(buf[1], 0xbb, 'Second byte of UTF-8 BOM must be 0xBB');
  assert.equal(buf[2], 0xbf, 'Third byte of UTF-8 BOM must be 0xBF');

  // Test CSV export (personal)
  const csvPersonal = await generateLatestBackup({
    scope: 'personal',
    format: 'csv',
    adminId: 'non-existent-pic',
  });
  assert.equal(csvPersonal.count, 0);

  // Test JSON export (all)
  const jsonAll = await generateLatestBackup({ scope: 'all', format: 'json' });
  assert.ok(jsonAll.filename.endsWith('.json'));
  assert.equal(jsonAll.format, 'json');
  assert.ok(jsonAll.count >= 0);

  // Test JSON export (personal by requester) - must NEVER leak internal notes
  const jsonPersonal = await generateLatestBackup({
    scope: 'personal',
    format: 'json',
    requesterId: 'kasir1',
    appId: 'snackloop',
  });
  const jsonPayload = JSON.parse(await jsonPersonal.blob.text());
  if (jsonPayload.messages && jsonPayload.messages.length > 0) {
    const hasInternal = jsonPayload.messages.some((m: { isInternalNote?: boolean }) => m.isInternalNote);
    assert.equal(hasInternal, false, 'Personal export by requester must not leak internal notes');
  }
});
