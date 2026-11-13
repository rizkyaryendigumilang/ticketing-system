export type NotificationType =
  | 'alert_urgent'
  | 'sla_warning'
  | 'ticket_reply'
  | 'reminder_followup'
  | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  appId?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  severity: NotificationSeverity;
}
