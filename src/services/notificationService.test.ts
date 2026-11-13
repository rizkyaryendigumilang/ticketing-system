import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addNotification,
  clearNotifications,
  getNotifications,
  markAllAsRead,
  markAsRead,
  syncTicketAlerts,
} from './notificationService.ts';
import type { Ticket } from '../types/crm.ts';

test('notificationService records, marks read, and clears notifications', () => {
  clearNotifications();
  assert.equal(getNotifications().length, 0);

  const notif = addNotification({
    type: 'system',
    title: 'Backup Sistem Selesai',
    message: 'Snapshot SQLite berhasil disimpan ke server VPS.',
    severity: 'info',
  });

  assert.equal(getNotifications().length, 1);
  assert.equal(notif.read, false);

  markAsRead(notif.id);
  assert.equal(getNotifications()[0].read, true);

  addNotification({
    type: 'alert_urgent',
    title: 'Tiket Baru Darurat',
    message: 'Kasir SnackLoop mati total.',
    severity: 'critical',
  });

  assert.equal(getNotifications().length, 2);
  markAllAsRead();
  assert.ok(getNotifications().every((n) => n.read));

  clearNotifications();
  assert.equal(getNotifications().length, 0);
});

test('syncTicketAlerts synthesizes urgent ticket alerts and follow-up reminders', () => {
  clearNotifications();

  const mockTickets: Ticket[] = [
    {
      id: 'tkt_urgent_01',
      ticketNumber: 'SNK-001',
      appId: 'snackloop',
      requesterId: 'usr-1',
      requesterUid: 'staff1',
      subject: 'Server POS Error 500',
      description: 'Laporan kasir tidak bisa dibuka',
      category: 'bug_error',
      priority: 'urgent',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tkt_waiting_old',
      ticketNumber: 'REC-002',
      appId: 'recruiter',
      requesterId: 'usr-2',
      requesterUid: 'cand1',
      subject: 'Pertanyaan format resume',
      description: 'Apakah bisa unggah format PDF 10MB?',
      category: 'feature_question',
      priority: 'low',
      status: 'waiting_on_user',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    },
  ];

  const notifs = syncTicketAlerts(mockTickets);
  assert.equal(notifs.length, 2);

  const urgentAlert = notifs.find((n) => n.type === 'alert_urgent');
  assert.ok(urgentAlert);
  assert.equal(urgentAlert.ticketId, 'tkt_urgent_01');
  assert.equal(urgentAlert.severity, 'critical');

  const reminder = notifs.find((n) => n.type === 'reminder_followup');
  assert.ok(reminder);
  assert.equal(reminder.ticketId, 'tkt_waiting_old');
  assert.equal(reminder.severity, 'warning');
});
