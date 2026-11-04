/**
 * Creates the 4 helpdesk collections in PocketBase and seeds the 7 VPS apps plus demo tickets.
 * Usage: npm run pb:init
 *
 * Needs PocketBase >= 0.23 running and a superuser account. Create one with:
 *   ./pocketbase superuser upsert admin@crm.local "Admin@CRM123!"
 * Credentials are read from .env (PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD).
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import PocketBase from 'pocketbase';
import { COLLECTIONS, toPbRecord } from '../src/config/pbSchema.ts';
import { SEED_APPS, buildSeed } from '../src/config/seedData.ts';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
const env = { ...process.env };
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PB_URL = env.VITE_PB_URL || 'http://127.0.0.1:8090';
const EMAIL = env.PB_SUPERUSER_EMAIL || 'admin@crm.local';
const PASSWORD = env.PB_SUPERUSER_PASSWORD || 'Admin@CRM123!';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

console.log(`PocketBase: ${PB_URL}`);

try {
  await pb.health.check();
} catch {
  fail(`PocketBase tidak bisa dihubungi di ${PB_URL}.`, 'Jalankan dulu: ./pocketbase serve');
}

try {
  await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
  console.log(`✓ Login superuser ${EMAIL}`);
} catch (e) {
  fail(
    `Login superuser ${EMAIL} gagal (${e.status || 'network'}).`,
    `Buat akunnya: ./pocketbase superuser upsert ${EMAIL} "<password>" lalu isi PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD di .env`,
  );
}

for (const schema of COLLECTIONS) {
  try {
    await pb.collections.getOne(schema.name);
    console.log(`· Collection ${schema.name} sudah ada, dilewati`);
  } catch (e) {
    if (e.status !== 404) fail(`Gagal mengecek collection ${schema.name}: ${e.message}`);
    try {
      await pb.collections.create(schema);
      console.log(`✓ Collection ${schema.name} dibuat`);
    } catch (err) {
      fail(`Gagal membuat collection ${schema.name}: ${JSON.stringify(err.response?.data ?? err.message)}`);
    }
  }
}

async function seedIfEmpty(collection, items, label) {
  const existing = await pb.collection(collection).getList(1, 1);
  if (existing.totalItems > 0) {
    console.log(`· ${collection} sudah berisi ${existing.totalItems} data, seed dilewati`);
    return;
  }
  for (const item of items) {
    try {
      await pb.collection(collection).create(toPbRecord(collection, item));
    } catch (err) {
      console.warn(`  ! ${label(item)}: ${JSON.stringify(err.response?.data ?? err.message)}`);
    }
  }
  console.log(`✓ ${items.length} ${collection} di-seed`);
}

const seed = buildSeed();
await seedIfEmpty('apps', SEED_APPS, (a) => a.id);
await seedIfEmpty('crm_users', seed.users, (u) => u.compositeKey);
await seedIfEmpty('tickets', seed.tickets, (t) => t.ticketNumber);
await seedIfEmpty('ticket_messages', seed.messages, (m) => m.id);

console.log('\nSelesai. Jalankan: npm run dev');
