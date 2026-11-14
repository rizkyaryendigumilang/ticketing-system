import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripControlCharacters,
  escapeHtml,
  safeHttpUrl,
  sanitizeTicketInput,
} from './sanitizer.ts';

test('stripControlCharacters removes ASCII control chars while preserving newlines & tabs', () => {
  const dirty = 'Hello\x00 World\x07!\nLine 2\tTabbed\x1F.';
  const clean = stripControlCharacters(dirty);
  assert.equal(clean, 'Hello World!\nLine 2\tTabbed.');
});

test('escapeHtml escapes dangerous HTML entities', () => {
  const input = '<script>alert("XSS & exploit\'s")</script>';
  const escaped = escapeHtml(input);
  assert.equal(escaped, '&lt;script&gt;alert(&quot;XSS &amp; exploit&#039;s&quot;)&lt;/script&gt;');
});

test('safeHttpUrl validates legitimate URLs and rejects malicious schemes', () => {
  assert.equal(safeHttpUrl('https://example.com/api'), 'https://example.com/api');
  assert.equal(safeHttpUrl('http://localhost:5173/portal'), 'http://localhost:5173/portal');
  assert.equal(safeHttpUrl('/portal/ticket/123'), '/portal/ticket/123');

  // Dangerous or invalid schemes
  assert.equal(safeHttpUrl('javascript:alert(1)'), null);
  assert.equal(safeHttpUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(safeHttpUrl('file:///etc/passwd'), null);
  assert.equal(safeHttpUrl('//evil.com/phish'), null);
  assert.equal(safeHttpUrl('   '), null);
  assert.equal(safeHttpUrl(null), null);
});

test('sanitizeTicketInput cleans user submissions properly', () => {
  const input = '  \x00Trouble logging in\x08  \nDetails here  ';
  assert.equal(sanitizeTicketInput(input), 'Trouble logging in  \nDetails here');
});
