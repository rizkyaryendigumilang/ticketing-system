// Single source of truth for the PocketBase schema and field mapping.
// Imported by the web app (src/services/pbClient.ts) and by scripts/init-pocketbase.mjs.

export type CollectionName = 'apps' | 'crm_users' | 'tickets' | 'ticket_messages';

/** camelCase app field -> snake_case PocketBase field */
export const FIELD_MAP: Record<CollectionName, Record<string, string>> = {
  apps: {
    id: 'slug', name: 'name', prefix: 'prefix', appUrl: 'app_url', adminDbUrl: 'admin_db_url',
    color: 'color', description: 'description',
  },
  crm_users: {
    id: 'id', compositeKey: 'composite_key', appId: 'app_slug', externalUid: 'external_uid', name: 'name',
    email: 'email', appRole: 'app_role', systemRole: 'system_role', lastSeenUrl: 'last_seen_url',
    createdAt: 'created_at', lastActiveAt: 'last_active_at',
  },
  tickets: {
    id: 'id', ticketNumber: 'ticket_number', appId: 'app_id', requesterId: 'requester_id',
    requesterName: 'requester_name', requesterUid: 'requester_uid', requesterRole: 'requester_role',
    subject: 'subject', description: 'description', category: 'category', priority: 'priority', status: 'status',
    sourcePageUrl: 'source_page_url', deviceInfo: 'device_info', attachments: 'attachments',
    resolutionSummary: 'resolution_summary', satisfactionRating: 'satisfaction_rating', satisfactionComment: 'satisfaction_comment',
    createdAt: 'created_at', updatedAt: 'updated_at', solvedAt: 'solved_at',
  },
  ticket_messages: {
    id: 'id', ticketId: 'ticket_id', senderId: 'sender_id', senderName: 'sender_name', senderRole: 'sender_role',
    body: 'body', attachments: 'attachments', isInternalNote: 'is_internal_note', createdAt: 'created_at',
  },
};

function dataUrlToFile(dataUrl: string, index: number): File | string {
  if (!dataUrl.startsWith('data:') || typeof File === 'undefined') return dataUrl;
  const [header, base64] = dataUrl.split(',');
  if (!header || !base64) return dataUrl;
  const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/png';
  const ext = mime.split('/')[1] ?? 'png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], `screenshot-${index + 1}.${ext}`, { type: mime });
}

export function toPbRecord(collection: CollectionName, obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(FIELD_MAP[collection])) {
    const val = obj[key];
    if (val === undefined) continue;
    if (field === 'attachments' && Array.isArray(val)) {
      if (val.length === 0) continue;
      out[field] = val.map((item, i) => (typeof item === 'string' ? dataUrlToFile(item, i) : item));
    } else {
      out[field] = val;
    }
  }
  return out;
}

/** PocketBase returns "2026-11-04 10:00:00.000Z"; the app uses ISO strings. */
const normalizeDate = (v: unknown): string | undefined =>
  typeof v === 'string' && v ? new Date(v.replace(' ', 'T')).toISOString() : undefined;

export function fromPbRecord(
  collection: CollectionName,
  rec: Record<string, unknown>,
  fileUrlResolver?: (rec: Record<string, unknown>, filename: string) => string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(FIELD_MAP[collection])) {
    const v = rec[field];
    if (field.endsWith('_at')) {
      out[key] = normalizeDate(v) ?? normalizeDate(rec[field === 'created_at' ? 'created' : 'updated']);
    } else if (field === 'attachments') {
      const list = Array.isArray(v) ? (v as string[]) : [];
      out[key] = list.map((f) =>
        f.startsWith('data:') || f.startsWith('http://') || f.startsWith('https://')
          ? f
          : fileUrlResolver
            ? fileUrlResolver(rec, f)
            : f,
      );
    } else if (v === '' || v === null) {
      out[key] = undefined;
    } else {
      out[key] = v;
    }
  }
  return out;
}

const STATUS = ['open', 'in_progress', 'waiting_on_user', 'solved', 'closed'];
const PRIORITY = ['low', 'medium', 'high', 'urgent'];
const CATEGORY = ['bug_error', 'account_login', 'data_transaction', 'feature_question', 'other'];
const IMAGE_FILE = {
  type: 'file', maxSelect: 5, maxSize: 5 * 1024 * 1024,
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
};

export const COLLECTIONS = [
  {
    name: 'apps',
    type: 'base',
    listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: 'slug', type: 'text', required: true, max: 50 },
      { name: 'name', type: 'text', required: true, max: 100 },
      { name: 'prefix', type: 'text', required: true, max: 10 },
      { name: 'app_url', type: 'url', required: true },
      { name: 'admin_db_url', type: 'url' },
      { name: 'color', type: 'text', max: 20 },
      { name: 'description', type: 'text', max: 300 },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_apps_slug ON apps (slug)'],
  },
  {
    name: 'crm_users',
    type: 'base',
    listRule: '', viewRule: '', createRule: '@request.body.system_role = "requester"',
    updateRule: '@request.body.system_role:isset = false && @request.body.composite_key:isset = false',
    deleteRule: null,
    fields: [
      { name: 'composite_key', type: 'text', required: true, max: 260 },
      { name: 'app_slug', type: 'text', required: true, max: 50 },
      { name: 'external_uid', type: 'text', required: true, max: 200 },
      { name: 'name', type: 'text', required: true, max: 120 },
      { name: 'email', type: 'text', max: 200 },
      { name: 'app_role', type: 'text', max: 120 },
      { name: 'system_role', type: 'select', required: true, maxSelect: 1, values: ['admin', 'requester'] },
      { name: 'last_seen_url', type: 'text', max: 2000 },
      { name: 'created_at', type: 'date', required: true },
      { name: 'last_active_at', type: 'date' },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_crm_users_composite ON crm_users (composite_key)'],
  },
  {
    name: 'tickets',
    type: 'base',
    listRule: '', viewRule: '', createRule: '@request.body.status = "open"',
    updateRule:
      '(@request.body.status = "open" || @request.body.status = "solved" || @request.body.satisfaction_rating:isset = true) && ' +
      '@request.body.priority:isset = false && @request.body.category:isset = false && ' +
      '@request.body.requester_id:isset = false && @request.body.app_id:isset = false && ' +
      '@request.body.ticket_number:isset = false',
    deleteRule: null,
    fields: [
      { name: 'ticket_number', type: 'text', required: true, max: 20 },
      { name: 'app_id', type: 'text', required: true, max: 50 },
      { name: 'requester_id', type: 'text', required: true, max: 50 },
      { name: 'requester_name', type: 'text', required: true, max: 120 },
      { name: 'requester_uid', type: 'text', required: true, max: 200 },
      { name: 'requester_role', type: 'text', max: 120 },
      { name: 'subject', type: 'text', required: true, max: 200 },
      { name: 'description', type: 'text', required: true, max: 20000 },
      { name: 'category', type: 'select', required: true, maxSelect: 1, values: CATEGORY },
      { name: 'priority', type: 'select', required: true, maxSelect: 1, values: PRIORITY },
      { name: 'status', type: 'select', required: true, maxSelect: 1, values: STATUS },
      { name: 'source_page_url', type: 'text', max: 2000 },
      { name: 'device_info', type: 'text', max: 300 },
      { name: 'attachments', ...IMAGE_FILE },
      { name: 'resolution_summary', type: 'text', max: 20000 },
      { name: 'satisfaction_rating', type: 'number' },
      { name: 'satisfaction_comment', type: 'text', max: 2000 },
      { name: 'created_at', type: 'date', required: true },
      { name: 'updated_at', type: 'date' },
      { name: 'solved_at', type: 'date' },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_tickets_number ON tickets (ticket_number)',
      'CREATE INDEX idx_tickets_app_status ON tickets (app_id, status)',
      'CREATE INDEX idx_tickets_requester ON tickets (requester_id)',
    ],
  },
  {
    name: 'ticket_messages',
    type: 'base',
    listRule: 'is_internal_note = false', viewRule: 'is_internal_note = false',
    createRule: '@request.body.is_internal_note != true && @request.body.sender_role != "admin"',
    updateRule: null, deleteRule: null,
    fields: [
      { name: 'ticket_id', type: 'text', required: true, max: 50 },
      { name: 'sender_id', type: 'text', required: true, max: 50 },
      { name: 'sender_name', type: 'text', required: true, max: 120 },
      { name: 'sender_role', type: 'select', required: true, maxSelect: 1, values: ['admin', 'requester', 'system'] },
      { name: 'body', type: 'text', required: true, max: 20000 },
      { name: 'attachments', ...IMAGE_FILE },
      { name: 'is_internal_note', type: 'bool' },
      { name: 'created_at', type: 'date', required: true },
    ],
    indexes: ['CREATE INDEX idx_messages_ticket ON ticket_messages (ticket_id, created_at)'],
  },
];
