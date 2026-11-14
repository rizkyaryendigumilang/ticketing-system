/**
 * Audit Log Service for Team Transparency, Compliance, and Security Governance.
 * Tracks administrative actions: ticket status mutations, assignee changes,
 * team role changes, settings modifications, and backup data exports.
 */

export type AuditAction =
  | 'ticket_status_change'
  | 'ticket_assignment'
  | 'ticket_resolution'
  | 'sla_breached'
  | 'auto_closed'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'team_invite'
  | 'team_role_change'
  | 'settings_change'
  | 'backup_export'
  | 'system_sync';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  actorId: string;
  actorName: string;
  actorRole: string; // 'superadmin' | 'admin' | 'system'
  action: AuditAction;
  target: string;
  details: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'helpdesk_crm_audit_logs';
const MAX_LOGS = 500;

let memoryLogs: AuditLogEntry[] = [];

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
  } catch {
    return false;
  }
}

export function getAuditLogs(): AuditLogEntry[] {
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return memoryLogs;
    }
  }
  return memoryLogs;
}

export function logAuditEvent(
  input: Omit<AuditLogEntry, 'id' | 'timestamp'>,
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...input,
  };

  const logs = getAuditLogs();
  const updated = [entry, ...logs].slice(0, MAX_LOGS);

  if (hasLocalStorage()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // LocalStorage quota safety
    }
  }
  memoryLogs = updated;

  return entry;
}

export const recordAuditLog = (
  input: Omit<AuditLogEntry, 'id' | 'timestamp'>,
): AuditLogEntry => logAuditEvent(input);

export function clearAuditLogs(): void {
  if (hasLocalStorage()) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  memoryLogs = [];
}

export function exportAuditLogs(format: 'json' | 'csv'): { blob: Blob; filename: string } {
  const logs = getAuditLogs();
  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'csv') {
    const headers = ['ID', 'Waktu (WIB)', 'Nama Aktor', 'Peran Aktor', 'Jenis Aksi', 'Target', 'Rincian'];
    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.timestamp).toLocaleString('id-ID')}"`,
      `"${(l.actorName || '').replace(/"/g, '""')}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${(l.target || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return {
      blob: new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
      filename: `audit-logs-${dateStr}.csv`,
    };
  }

  const jsonContent = JSON.stringify(logs, null, 2);
  return {
    blob: new Blob([jsonContent], { type: 'application/json' }),
    filename: `audit-logs-${dateStr}.json`,
  };
}
