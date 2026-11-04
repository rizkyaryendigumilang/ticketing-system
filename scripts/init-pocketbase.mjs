/**
 * PocketBase auto-setup + seeder script
 * Usage: npm run pb:init
 * Requires PocketBase running at VITE_PB_URL (default: http://127.0.0.1:8090)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load .env if present
let PB_URL = 'http://127.0.0.1:8090';
let PB_EMAIL = 'superuser@example.com';
let PB_PASS = 'changeme1234!';

const envPath = join(root, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=').trim();
    if (key === 'VITE_PB_URL') PB_URL = value;
    if (key === 'VITE_PB_ADMIN_EMAIL') PB_EMAIL = value;
    if (key === 'VITE_PB_ADMIN_PASS') PB_PASS = value;
  }
}

console.log(`\n🚀 VPS Ticket CRM — PocketBase Initializer`);
console.log(`📡 Connecting to: ${PB_URL}\n`);

async function request(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${PB_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  return text ? JSON.parse(text) : {};
}

// Authenticate as PocketBase superuser
async function authenticate() {
  try {
    const data = await request('/api/admins/auth-with-password', 'POST', {
      identity: PB_EMAIL,
      password: PB_PASS,
    });
    return data.token;
  } catch (e1) {
    // Try newer PocketBase superuser endpoint
    try {
      const data = await request('/_/api/collections/_superusers/auth-with-password', 'POST', {
        identity: PB_EMAIL,
        password: PB_PASS,
      });
      return data.token;
    } catch (e2) {
      throw new Error(`Auth failed. Make sure PocketBase is running and credentials are correct.\nError: ${e1.message}`);
    }
  }
}

async function collectionExists(name, token) {
  try {
    await request(`/api/collections/${name}`, 'GET', null, token);
    return true;
  } catch {
    return false;
  }
}

async function createCollection(schema, token) {
  try {
    await request('/api/collections', 'POST', schema, token);
    console.log(`  ✅ Collection created: ${schema.name}`);
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('unique')) {
      console.log(`  ⏭️  Collection already exists: ${schema.name}`);
    } else {
      console.error(`  ❌ Failed to create ${schema.name}:`, e.message);
    }
  }
}

const COLLECTIONS = [
  {
    name: 'apps',
    type: 'base',
    fields: [
      { name: 'slug', type: 'text', required: true },
      { name: 'name', type: 'text', required: true },
      { name: 'prefix', type: 'text', required: true },
      { name: 'app_url', type: 'url', required: true },
      { name: 'admin_db_url', type: 'url', required: false },
      { name: 'color', type: 'text', required: true },
      { name: 'description', type: 'text', required: false },
    ],
  },
  {
    name: 'crm_users',
    type: 'base',
    fields: [
      { name: 'composite_key', type: 'text', required: true },
      { name: 'app_id', type: 'text', required: true },
      { name: 'external_uid', type: 'text', required: true },
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email', required: false },
      { name: 'app_role', type: 'text', required: false },
      { name: 'system_role', type: 'text', required: true },
    ],
  },
  {
    name: 'tickets',
    type: 'base',
    fields: [
      { name: 'ticket_number', type: 'text', required: true },
      { name: 'app_id', type: 'text', required: true },
      { name: 'requester_id', type: 'text', required: true },
      { name: 'requester_name', type: 'text', required: true },
      { name: 'requester_uid', type: 'text', required: true },
      { name: 'requester_role', type: 'text', required: false },
      { name: 'subject', type: 'text', required: true },
      { name: 'description', type: 'text', required: true },
      { name: 'category', type: 'text', required: true },
      { name: 'priority', type: 'text', required: true },
      { name: 'status', type: 'text', required: true },
      { name: 'source_page_url', type: 'text', required: false },
      { name: 'device_info', type: 'text', required: false },
      { name: 'attachments', type: 'json', required: false },
      { name: 'resolution_summary', type: 'text', required: false },
      { name: 'solved_at', type: 'text', required: false },
    ],
  },
  {
    name: 'ticket_messages',
    type: 'base',
    fields: [
      { name: 'ticket_id', type: 'text', required: true },
      { name: 'sender_id', type: 'text', required: true },
      { name: 'sender_name', type: 'text', required: true },
      { name: 'sender_role', type: 'text', required: true },
      { name: 'body', type: 'text', required: true },
      { name: 'attachments', type: 'json', required: false },
      { name: 'is_internal_note', type: 'bool', required: false },
    ],
  },
];

const SEED_APPS = [
  { slug: 'recruiter', name: 'Recruiter Portal', prefix: 'REC', app_url: 'https://43.156.236.102/recruiter/login', admin_db_url: 'https://43.156.236.102/recruiter-pb/_/', color: '#3B82F6', description: 'Platform rekrutmen UMKM dan kandidat kerja' },
  { slug: 'snackloop', name: 'Snackloop-ERP', prefix: 'SNK', app_url: 'https://43.156.236.102/snackloop/', admin_db_url: '', color: '#F59E0B', description: 'Sistem ERP manajemen produksi snack' },
  { slug: 'wedding', name: 'Wedding Planner Web', prefix: 'WED', app_url: 'https://43.156.236.102/wedding/login', admin_db_url: 'https://43.156.236.102/_/', color: '#EC4899', description: 'Platform perencanaan dan manajemen acara pernikahan' },
  { slug: 'life-planner', name: 'Life Planner Web', prefix: 'LFP', app_url: 'https://43.156.236.102/life-planner/', admin_db_url: 'https://43.156.236.102/life-planner-pb/_/', color: '#8B5CF6', description: 'Aplikasi perencanaan hidup dan habit tracker' },
  { slug: 'ai-endurance', name: 'AI Endurance Platform', prefix: 'AIE', app_url: 'https://43.156.236.102:8445/login.html', admin_db_url: '', color: '#10B981', description: 'Platform pelatihan lari berbasis AI untuk atlet' },
  { slug: 'kept', name: 'Kept Password Vault', prefix: 'KPT', app_url: 'https://43.156.236.102/kept/', admin_db_url: '', color: '#6366F1', description: 'Manajer dan vault kata sandi yang aman' },
  { slug: 'diskon-bot', name: 'Diskon Bot Web', prefix: 'BOT', app_url: 'https://43.156.236.102/diskon-bot/', admin_db_url: '', color: '#EF4444', description: 'Bot pencari diskon dan promo otomatis' },
];

async function seedCollection(collectionName, records, token) {
  for (const record of records) {
    try {
      await request(`/api/collections/${collectionName}/records`, 'POST', record, token);
    } catch (e) {
      if (!e.message.includes('unique')) {
        console.error(`    ⚠️  Seed error in ${collectionName}:`, e.message.slice(0, 100));
      }
    }
  }
}

async function main() {
  // Health check
  try {
    await fetch(`${PB_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    console.log('✅ PocketBase is reachable\n');
  } catch {
    console.error('❌ Cannot reach PocketBase at', PB_URL);
    console.error('   Make sure PocketBase is running: ./pocketbase serve');
    process.exit(1);
  }

  let token;
  try {
    token = await authenticate();
    console.log('✅ Authenticated as superuser\n');
  } catch (e) {
    console.error('❌ Authentication failed:', e.message);
    process.exit(1);
  }

  console.log('📦 Creating collections...');
  for (const schema of COLLECTIONS) {
    const exists = await collectionExists(schema.name, token);
    if (!exists) {
      await createCollection(schema, token);
    } else {
      console.log(`  ⏭️  Already exists: ${schema.name}`);
    }
  }

  console.log('\n🌱 Seeding data...');
  
  // Check if apps already seeded
  try {
    const existing = await request('/api/collections/apps/records?perPage=1', 'GET', null, token);
    if (existing.totalItems === 0) {
      await seedCollection('apps', SEED_APPS, token);
      console.log(`  ✅ Seeded ${SEED_APPS.length} apps`);
    } else {
      console.log(`  ⏭️  Apps already seeded (${existing.totalItems} records)`);
    }
  } catch (e) {
    console.error('  ⚠️  Seed check failed:', e.message);
  }

  console.log('\n🎉 PocketBase initialization complete!');
  console.log('   Run: npm run dev\n');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
