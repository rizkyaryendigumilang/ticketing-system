import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Clock,
  Info,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  clearNotifications,
  subscribeNotifications,
  syncTicketAlerts,
} from '../../services/notificationService';
import type { AppNotification, NotificationType } from '../../types/notification';
import { useCrm } from '../../context/CrmContext';

interface NotificationCenterDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationCenterDrawer({ open, onClose }: NotificationCenterDrawerProps) {
  const { data } = useCrm();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>(getNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts' | 'reminders'>('all');

  useEffect(() => {
    // Sync ticket alerts when tickets change
    syncTicketAlerts(data.tickets);
  }, [data.tickets]);

  useEffect(() => {
    setNotifications(getNotifications());
    return subscribeNotifications(() => {
      setNotifications(getNotifications());
    });
  }, []);

  if (!open) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return n.type === 'alert_urgent' || n.type === 'sla_warning';
    if (filter === 'reminders') return n.type === 'reminder_followup';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleItemClick = (n: AppNotification) => {
    markAsRead(n.id);
    if (n.actionUrl) {
      onClose();
      navigate(n.actionUrl);
    }
  };

  const getSeverityIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert_urgent':
      case 'sla_warning':
        return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
      case 'reminder_followup':
        return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'system':
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-md bg-panel border-l border-line h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-subtle p-1.5 text-ink">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Notifikasi</h2>
              <p className="text-[11px] text-ink-muted">
                {unreadCount > 0
                  ? `${unreadCount} belum dibaca`
                  : 'Semua sudah dibaca'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                title="Tandai semua telah dibaca"
                className="rounded p-1.5 text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Hapus seluruh riwayat notifikasi?')) {
                    clearNotifications();
                  }
                }}
                title="Hapus riwayat notifikasi"
                className="rounded p-1.5 text-ink-muted hover:text-red-500 hover:bg-subtle transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-line px-4 gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`py-2.5 px-2 border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`py-2.5 px-2 border-b-2 transition-colors ${
              filter === 'unread'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('alerts')}
            className={`py-2.5 px-2 border-b-2 transition-colors ${
              filter === 'alerts'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Mendesak
          </button>
          <button
            type="button"
            onClick={() => setFilter('reminders')}
            className={`py-2.5 px-2 border-b-2 transition-colors ${
              filter === 'reminders'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Pengingat
          </button>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto divide-y divide-line/60">
          {filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-ink-muted text-xs">
              <ShieldAlert className="h-8 w-8 mx-auto text-ink-faint mb-2" />
              <p className="font-medium text-ink">Tidak ada notifikasi</p>
              <p className="mt-1 text-[11px] text-ink-muted">
                Semua tiket dalam kondisi stabil dan terpantau.
              </p>
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-4 flex items-start gap-3 text-xs transition-colors cursor-pointer hover:bg-subtle/70 ${
                  !n.read ? 'bg-subtle/30 font-medium' : ''
                }`}
              >
                <div className="mt-0.5">{getSeverityIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink line-clamp-1">{n.title}</h3>
                    <span className="font-mono text-[10px] text-ink-muted shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-ink-muted text-[11px] leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                  {n.actionUrl && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-ink font-semibold">
                      <span>Buka Detail</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                </div>
                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
