import test from 'node:test';
import assert from 'node:assert/strict';
import {
  translations,
  translate,
  getLocalizedStatus,
  getLocalizedPriority,
  getLocalizedCategory,
} from './translations.ts';

test('translations dictionary has matching keys for id and en', () => {
  const idKeys = Object.keys(translations.id).sort();
  const enKeys = Object.keys(translations.en).sort();

  assert.deepEqual(idKeys, enKeys, 'All keys in Indonesian must exist in English and vice-versa');
});

test('translate correctly returns localized string and replaces parameters', () => {
  assert.equal(translate('id', 'nav.brand'), 'Helpdesk App');
  assert.equal(translate('en', 'nav.brand'), 'Helpdesk App');

  assert.equal(translate('id', 'tickets.title'), 'Kotak Masuk Tiket');
  assert.equal(translate('en', 'tickets.title'), 'Ticket Inbox');

  assert.equal(translate('id', 'dash.openActiveTickets', { count: 5 }), 'Buka 5 tiket aktif');
  assert.equal(translate('en', 'dash.openActiveTickets', { count: 5 }), 'Open 5 active tickets');
});

test('getLocalizedStatus returns localized labels', () => {
  assert.equal(getLocalizedStatus('id', 'open'), 'Baru');
  assert.equal(getLocalizedStatus('en', 'open'), 'Open');

  assert.equal(getLocalizedStatus('id', 'in_progress'), 'Diproses');
  assert.equal(getLocalizedStatus('en', 'in_progress'), 'In Progress');

  assert.equal(getLocalizedStatus('id', 'solved'), 'Selesai');
  assert.equal(getLocalizedStatus('en', 'solved'), 'Solved');
});

test('getLocalizedPriority and getLocalizedCategory return localized labels', () => {
  assert.equal(getLocalizedPriority('id', 'urgent'), 'Darurat');
  assert.equal(getLocalizedPriority('en', 'urgent'), 'Urgent');

  assert.equal(getLocalizedCategory('id', 'bug_error'), 'Bug / error fitur');
  assert.equal(getLocalizedCategory('en', 'bug_error'), 'Bug / Feature Error');
});
