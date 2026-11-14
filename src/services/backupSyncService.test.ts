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
});
