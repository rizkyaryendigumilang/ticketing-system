import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiKey, getApiKeys, revokeApiKey, validateApiKey } from './apiKeyService.ts';

test('createApiKey creates scoped API key with vps_live_ prefix', () => {
  const result = createApiKey({
    name: 'Backend ERP Sync',
    appId: 'snackloop',
    scopes: ['tickets:read', 'tickets:write'],
    actorName: 'Super Admin',
  });

  assert.equal(result.rawKey.startsWith('vps_live_'), true);
  assert.equal(result.record.name, 'Backend ERP Sync');
  assert.equal(result.record.appId, 'snackloop');
  assert.equal(result.record.scopes.includes('tickets:write'), true);
  assert.equal(result.record.isRevoked, false);

  const keys = getApiKeys();
  assert.equal(keys.some((k) => k.id === result.record.id), true);
});

test('validateApiKey verifies valid keys and rejects revoked keys', () => {
  const { record, rawKey } = createApiKey({
    name: 'Recruiter Service',
    appId: 'recruiter',
    scopes: ['tickets:read'],
    actorName: 'Admin',
  });

  const validRes = validateApiKey(rawKey);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.keyRecord?.id, record.id);

  // Revoke key
  const revoked = revokeApiKey(record.id, 'Admin');
  assert.equal(revoked, true);

  // Validate again -> must be false
  const invalidRes = validateApiKey(rawKey);
  assert.equal(invalidRes.valid, false);
});

test('validateApiKey rejects malformed or unknown key', () => {
  assert.equal(validateApiKey('invalid_token').valid, false);
  assert.equal(validateApiKey('vps_live_nonexistent').valid, false);
});
