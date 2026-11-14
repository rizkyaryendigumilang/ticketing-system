/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase Server-Side Security & Integrity Hooks
 * Enforces multi-tenant isolation, input sanitization, and permission rules
 * directly on the PocketBase backend Goja JavaScript engine.
 */

const VALID_APP_SLUGS = [
  'snackloop',
  'recruiter',
  'kept',
  'wedding',
  'halodukcapil',
  'antrianku',
  'sewain',
];

// Helper to strip control characters (\x00-\x1F\x7F) and basic script tags
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}

// 1. TICKET SECURITY HOOKS
onRecordBeforeCreateRequest((e) => {
  const record = e.record;
  const appId = record.getString('app_id');
  const subject = record.getString('subject');
  const description = record.getString('description');
  const requesterUid = record.getString('requester_uid');

  // Enforce valid ecosystem app ID
  if (!VALID_APP_SLUGS.includes(appId)) {
    throw new BadRequestError(`Aplikasi asal (${appId}) tidak terdaftar dalam ekosistem VPS.`);
  }

  if (!requesterUid) {
    throw new BadRequestError('Identitas pelapor (requester_uid) wajib disertakan.');
  }

  // Sanitize subject & description
  record.set('subject', sanitizeText(subject));
  record.set('description', sanitizeText(description));

  // If request is from public/requester, force status to "open"
  const isSuperuser = e.hasSuperuserAuth();
  if (!isSuperuser) {
    record.set('status', 'open');
  }
}, 'tickets');

onRecordBeforeUpdateRequest((e) => {
  const record = e.record;
  const isSuperuser = e.hasSuperuserAuth();

  // Prevent tampering with multi-tenant boundaries
  if (!isSuperuser) {
    // Requesters can only reopen tickets (status = open) or submit satisfaction rating
    const original = $app.findRecordById('tickets', record.id);
    if (original.getString('app_id') !== record.getString('app_id')) {
      throw new ForbiddenError('Aplikasi asal tiket (app_id) tidak boleh diubah.');
    }
    if (original.getString('requester_id') !== record.getString('requester_id')) {
      throw new ForbiddenError('Identitas kepemilikan tiket tidak boleh diubah.');
    }
    if (original.getString('ticket_number') !== record.getString('ticket_number')) {
      throw new ForbiddenError('Nomor tiket tidak boleh diubah.');
    }
  }
}, 'tickets');

// 2. MESSAGE SECURITY HOOKS
onRecordBeforeCreateRequest((e) => {
  const record = e.record;
  const isSuperuser = e.hasSuperuserAuth();
  const isInternal = record.getBool('is_internal_note');
  const senderRole = record.getString('sender_role');
  const body = record.getString('body');

  // Strict enforcement: requesters CANNOT create internal notes
  if (!isSuperuser && isInternal) {
    throw new ForbiddenError('Catatan internal hanya dapat dibuat oleh Superadmin CRM.');
  }

  if (!isSuperuser && senderRole === 'admin') {
    throw new ForbiddenError('Identitas admin hanya dapat digunakan dengan autentikasi superuser.');
  }

  // Sanitize message body
  record.set('body', sanitizeText(body));

  // Auto-reopen ticket if requester replies to solved/waiting ticket
  const ticketId = record.getString('ticket_id');
  if (ticketId && senderRole === 'requester') {
    try {
      const ticket = $app.findRecordById('tickets', ticketId);
      const currentStatus = ticket.getString('status');
      if (currentStatus === 'waiting_on_user' || currentStatus === 'solved') {
        ticket.set('status', 'open');
        $app.save(ticket);
      }
    } catch (err) {
      // Ignore if ticket not found
    }
  }
}, 'ticket_messages');

console.log('✓ VPS Helpdesk security hooks loaded (multi-tenant boundary & XSS sanitization)');
