import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  Key,
} from 'lucide-react';
import {
  getAuditLogs,
  clearAuditLogs,
  exportAuditLogs,
  type AuditLogEntry,
  type AuditAction,
} from '../../../services/auditLogService';

const ACTION_LABELS: Record<AuditAction, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  ticket_status_change: { label: 'Status Tiket', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Clock },
  ticket_assignment: { label: 'Penugasan Tiket', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: UserCheck },
  ticket_resolution: { label: 'Penyelesaian Tiket', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  sla_breached: { label: 'SLA Terlewat', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: AlertTriangle },
  auto_closed: { label: 'Ditutup Otomatis', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', icon: Clock },
  api_key_created: { label: 'Kunci API Dibuat', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', icon: Key },
  api_key_revoked: { label: 'Kunci API Dicabut', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: Trash2 },
  team_invite: { label: 'Undangan Tim', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: UserCheck },
  team_role_change: { label: 'Perubahan Peran', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: ShieldCheck },
  settings_change: { label: 'Pengaturan', color: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30', icon: Filter },
  backup_export: { label: 'Ekspor Cadangan', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30', icon: Database },
  system_sync: { label: 'Sinkronisasi', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', icon: Database },
};

export function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        log.actorName.toLowerCase().includes(lower) ||
        log.target.toLowerCase().includes(lower) ||
        log.details.toLowerCase().includes(lower) ||
        log.action.toLowerCase().includes(lower)
      );
    });
  }, [logs, filterAction, searchTerm]);

  const handleExport = (format: 'csv' | 'json') => {
    const result = exportAuditLogs(format);
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh rekaman log audit lokal?')) {
      clearAuditLogs();
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Log Audit & Kepatuhan Tim
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            Transparansi seluruh riwayat mutasi status tiket, penugasan agen, perubahan hak akses peran, dan aktivitas ekspor data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-subtle disabled:opacity-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-500" />
            Ekspor CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('json')}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-subtle disabled:opacity-50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            JSON
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={logs.length === 0}
            title="Bersihkan log lokal"
            className="inline-flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama aktor, nomor tiket, atau detail aktivitas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-line bg-surface pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Semua Jenis Aksi ({logs.length})</option>
            <option value="ticket_status_change">Perubahan Status Tiket</option>
            <option value="ticket_assignment">Penugasan Agen</option>
            <option value="ticket_resolution">Penyelesaian Masalah</option>
            <option value="team_invite">Undangan Anggota Tim</option>
            <option value="team_role_change">Perubahan Peran & Hak Akses</option>
            <option value="backup_export">Ekspor Cadangan Data</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-line bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-line bg-subtle/50 text-[11px] font-medium text-ink-muted uppercase">
            <tr>
              <th className="px-3 py-2.5">Waktu</th>
              <th className="px-3 py-2.5">Aktor</th>
              <th className="px-3 py-2.5">Jenis Aksi</th>
              <th className="px-3 py-2.5">Target</th>
              <th className="px-3 py-2.5">Rincian Aktivitas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-ink-muted">
                  Belum ada aktivitas tercatat pada log audit atau tidak ada hasil yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const actionMeta = ACTION_LABELS[log.action] || {
                  label: log.action,
                  color: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30',
                  icon: Clock,
                };
                const ActionIcon = actionMeta.icon;
                return (
                  <tr key={log.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap text-ink-muted font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-medium text-ink">{log.actorName}</div>
                      <span className="text-[10px] text-ink-muted font-mono uppercase">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${actionMeta.color}`}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {actionMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono font-medium text-ink">
                      {log.target}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
