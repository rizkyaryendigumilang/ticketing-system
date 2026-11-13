import type { Ticket } from '../types/crm';
import type { AppNotification } from '../types/notification';

const NOTIFICATIONS_KEY = 'vps-crm:notifications';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
  } catch {
    return false;
  }
}

function readNotifications(): AppNotification[] {
  try {
    if (!hasLocalStorage()) return [];
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifs: AppNotification[]): void {
  try {
    if (hasLocalStorage()) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
    }
  } catch (err) {
    console.warn('Gagal menyimpan notifikasi ke localStorage', err);
  }
}

let cache: AppNotification[] = readNotifications();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function subscribeNotifications(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getNotifications(): AppNotification[] {
  return cache;
}

export function markAsRead(id: string): void {
  cache = cache.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeNotifications(cache);
  notify();
}

export function markAllAsRead(): void {
  cache = cache.map((n) => ({ ...n, read: true }));
  writeNotifications(cache);
  notify();
}

export function clearNotifications(): void {
  cache = [];
  writeNotifications(cache);
  notify();
}

export function addNotification(
  input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>,
): AppNotification {
  const newNotif: AppNotification = {
    ...input,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };

  cache = [newNotif, ...cache].slice(0, 50); // Keep max 50 items
  writeNotifications(cache);
  notify();
  return newNotif;
}

/**
 * Evaluates active tickets to synthesize system alerts & reminders:
 * - Urgent open tickets -> critical alert
 * - Inactive tickets in waiting_on_user > 3 days -> reminder
 */
export function syncTicketAlerts(tickets: Ticket[]): AppNotification[] {
  const existing = getNotifications();
  const generated: AppNotification[] = [];

  for (const ticket of tickets) {
    // 1. Urgent ticket alert
    if (ticket.priority === 'urgent' && ticket.status === 'open') {
      const exists = existing.some(
        (n) => n.type === 'alert_urgent' && n.ticketId === ticket.id,
      );
      if (!exists) {
        generated.push({
          id: `alert-urg-${ticket.id}`,
          type: 'alert_urgent',
          title: `Tiket Darurat: ${ticket.ticketNumber}`,
          message: ticket.subject,
          ticketId: ticket.id,
          appId: ticket.appId,
          read: false,
          createdAt: ticket.createdAt,
          actionUrl: `/admin/tickets/${ticket.id}`,
          severity: 'critical',
        });
      }
    }

    // 2. Follow-up reminder for waiting_on_user > 3 days
    if (ticket.status === 'waiting_on_user') {
      const updatedTime = new Date(ticket.updatedAt).getTime();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - updatedTime > threeDaysMs) {
        const exists = existing.some(
          (n) => n.type === 'reminder_followup' && n.ticketId === ticket.id,
        );
        if (!exists) {
          generated.push({
            id: `remind-${ticket.id}`,
            type: 'reminder_followup',
            title: `Pengingat Tindak Lanjut: ${ticket.ticketNumber}`,
            message: `Tiket menunggu balasan pelapor lebih dari 3 hari. Pertimbangkan untuk menutup tiket.`,
            ticketId: ticket.id,
            appId: ticket.appId,
            read: false,
            createdAt: new Date().toISOString(),
            actionUrl: `/admin/tickets/${ticket.id}`,
            severity: 'warning',
          });
        }
      }
    }
  }

  if (generated.length > 0) {
    cache = [...generated, ...cache].slice(0, 50);
    writeNotifications(cache);
    notify();
  }

  return cache;
}
