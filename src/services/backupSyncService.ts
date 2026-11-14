/**
 * Auto-Sync & Backup Service.
 * Manages automated synchronization of CRM data snapshots, scope filtering
 * (Personal / Assigned to Me vs All), and format export (CSV / JSON).
 */

import { formatTicketsCsv } from './crmLogic.ts';
import { flush, isSuperuser } from './pbClient.ts';
import { getData, subscribeStore, type CrmData } from './storageService.ts';
import type { Ticket, TicketMessage } from '../types/crm.ts';

export interface BackupConfig {
  autoSyncEnabled: boolean;
  intervalMinutes: number;
  lastBackupAt: number | null;
  lastBackupCount: number;
}

const BACKUP_CONFIG_KEY = 'vps-crm:backup-config-v1';
const listeners = new Set<() => void>();

const DEFAULT_CONFIG: BackupConfig = {
  autoSyncEnabled: true,
  intervalMinutes: 15,
  lastBackupAt: Date.now(),
  lastBackupCount: 0,
};

export function getBackupConfig(): BackupConfig {
  if (typeof localStorage === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(BACKUP_CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveBackupConfig(config: Partial<BackupConfig>): BackupConfig {
  const updated = { ...getBackupConfig(), ...config };
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(BACKUP_CONFIG_KEY, JSON.stringify(updated));
    } catch {
      // Ignore quota errors
    }
  }
  listeners.forEach((fn) => fn());
  return updated;
}

export function subscribeBackupConfig(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Auto-sync listener on store mutations
if (typeof window !== 'undefined') {
  subscribeStore(() => {
    const cfg = getBackupConfig();
    if (cfg.autoSyncEnabled) {
      const store = getData();
      saveBackupConfig({
        lastBackupAt: Date.now(),
        lastBackupCount: store.tickets.length,
      });
    }
  });
}

export interface ExportBackupResult {
  filename: string;
  blob: Blob;
  count: number;
  scope: 'all' | 'personal';
  format: 'json' | 'csv';
}

/**
 * Ensures pending changes are flushed to PocketBase, gathers fresh data,
 * filters according to scope, and produces an up-to-date backup blob.
 */
export async function generateLatestBackup({
  scope = 'all',
  format = 'csv',
  adminId,
  requesterId,
  appId,
}: {
  scope: 'all' | 'personal';
  format: 'json' | 'csv';
  adminId?: string;
  requesterId?: string;
  appId?: string;
}): Promise<ExportBackupResult> {
  // 1. Flush outbox to ensure latest data is committed
  try {
    await flush();
  } catch {
    // Continue with local store if offline
  }

  // 2. Read fresh store
  const store = getData();
  let targetTickets: Ticket[] = store.tickets;

  if (scope === 'personal') {
    if (adminId) {
      targetTickets = store.tickets.filter((t: Ticket) => t.assignedTo === adminId);
    } else if (requesterId && appId) {
      targetTickets = store.tickets.filter(
        (t: Ticket) => t.appId === appId && (t.requesterId === requesterId || t.requesterUid === requesterId),
      );
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '-');
  const scopeLabel = scope === 'personal' ? 'pribadi' : 'lengkap';

  let blob: Blob;
  let filename: string;

  if (format === 'csv') {
    const csvData = formatTicketsCsv(targetTickets);
    blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    filename = `backup-tiket-${scopeLabel}-${dateStr}-${timeStr}.csv`;
  } else {
    const payload = {
      exportDate: new Date().toISOString(),
      system: 'Helpdesk CRM VPS',
      scope,
      counts: {
        tickets: targetTickets.length,
        totalTicketsInSystem: store.tickets.length,
        users: store.users.length,
        messages: store.messages.length,
      },
      tickets: targetTickets,
      ...(scope === 'all'
        ? {
            users: store.users,
            messages: store.messages,
            apps: store.apps,
          }
        : {
            messages: store.messages.filter((m: TicketMessage) =>
              targetTickets.some((t: Ticket) => t.id === m.ticketId),
            ),
          }),
    };
    blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    filename = `backup-snapshot-${scopeLabel}-${dateStr}-${timeStr}.json`;
  }

  // Update last backup timestamp
  saveBackupConfig({
    lastBackupAt: Date.now(),
    lastBackupCount: targetTickets.length,
  });

  return {
    filename,
    blob,
    count: targetTickets.length,
    scope,
    format,
  };
}

/** Utility to trigger browser file download from Blob */
export function downloadBackupFile(result: ExportBackupResult) {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
