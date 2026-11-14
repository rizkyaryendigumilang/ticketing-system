/**
 * Security & Input Sanitization Utilities.
 * Protects against XSS injection, malicious HTML tags, control character exploits,
 * and unsafe redirect schemes (e.g. javascript:).
 */

export function stripControlCharacters(input: string): string {
  if (typeof input !== 'string') return '';
  // Removes ASCII control characters \x00-\x1F\x7F while preserving newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = stripControlCharacters(url.trim());
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    // Relative safe paths
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
    return null;
  }
}

export function sanitizeTicketInput(text: string): string {
  return stripControlCharacters(text).trim();
}
