import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Download,
  FileSpreadsheet,
  FileJson,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  User,
  Users,
} from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';
import {
  getBackupConfig,
  saveBackupConfig,
  subscribeBackupConfig,
  generateLatestBackup,
  downloadBackupFile,
} from '../../../services/backupSyncService';
import { timeAgo } from '../../../services/crmLogic';

export function StorageTab() {
  const { data, connection, pendingAdminChanges, settings, resetDemo, adminActor, t } = useCrm();
  const toast = useToast();

  const [backupConfig, setBackupConfig] = useState(getBackupConfig);
  const [scope, setScope] = useState<'all' | 'personal'>('all');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    return subscribeBackupConfig(() => {
      setBackupConfig(getBackupConfig());
    });
  }, []);

  const storageUsage = useMemo(() => {
    let bytes = 0;
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('vps-crm:')) {
            bytes += (localStorage.getItem(key)?.length || 0) * 2;
          }
        }
      }
    } catch {
      // fallback
    }
    const kb = Number((bytes / 1024).toFixed(1));
    const percent = Math.min(100, Math.round((bytes / (5 * 1024 * 1024)) * 100));
    return { bytes, kb, percent };
  }, [data, settings]);

  const personalTicketsCount = useMemo(() => {
    return data.tickets.filter((t) => t.assignedTo === adminActor.id).length;
  }, [data.tickets, adminActor.id]);

  const handleToggleAutoSync = () => {
    const updated = saveBackupConfig({
      autoSyncEnabled: !backupConfig.autoSyncEnabled,
    });
    toast.success(
      updated.autoSyncEnabled
        ? 'Auto-Sync Backup diaktifkan'
        : 'Auto-Sync Backup dinonaktifkan',
    );
  };

  const handleSyncAndDownload = async () => {
    setSyncing(true);
    try {
      const res = await generateLatestBackup({
        scope,
        format,
        adminId: adminActor.id,
      });
      downloadBackupFile(res);
      toast.success(
        `Backup ${format.toUpperCase()} ${scope === 'personal' ? 'Tiket Pribadi' : 'Semua Data'} (${res.count} tiket) berhasil disinkronkan dan diunduh.`,
      );
    } catch (e) {
      toast.error('Gagal membuat backup otomatis: ' + (e instanceof Error ? e.message : 'Kesalahan jaringan'));
    } finally {
      setSyncing(false);
    }
  };

  const handleResetDemo = () => {
    if (confirm('Kembalikan database demo lokal ke data seed awal?')) {
      resetDemo();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Storage Status Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Database className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.tabStorage')}</h2>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded border border-line bg-canvas p-3">
            <span className="text-ink-muted">Koneksi PocketBase</span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-ink">
              <span
                className={`h-2 w-2 rounded-full ${
                  connection === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span>{connection === 'online' ? 'Online' : 'Offline'}</span>
            </div>
            <span className="text-[10px] text-ink-muted font-mono">127.0.0.1:8094</span>
          </div>

          <div className="rounded border border-line bg-canvas p-3">
            <span className="text-ink-muted">Perubahan Menunggu Sync</span>
            <div className="mt-1 font-mono text-base font-bold text-ink">
              {pendingAdminChanges}
            </div>
            <span className="text-[10px] text-ink-muted">Antrean outbox browser</span>
          </div>

          <div className="rounded border border-line bg-canvas p-3">
            <span className="text-ink-muted">Total Data CRM</span>
            <div className="mt-1 font-mono text-xs font-bold text-ink">
              {data.tickets.length} Tiket · {data.users.length} Kontak
            </div>
            <span className="text-[10px] text-ink-muted">Dari 7 aplikasi VPS</span>
          </div>
        </div>

        {/* LocalStorage usage progress */}
        <div className="mt-4 pt-3 border-t border-line text-xs">
          <div className="flex justify-between items-center text-ink-muted">
            <span>Penyimpanan Offline LocalStorage:</span>
            <span className="font-mono font-semibold text-ink">
              {storageUsage.kb} KB / ~5,120 KB ({storageUsage.percent}%)
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-subtle overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                storageUsage.percent > 80 ? 'bg-red-600' : 'bg-ink'
              }`}
              style={{ width: `${Math.max(2, storageUsage.percent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Auto-Sync Backup & Data Export Hub */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink">Pusat Backup & Auto-Sync CRM</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Sinkronkan snapshot data terbaru secara otomatis dan unduh backup dalam format CSV atau JSON.
            </p>
          </div>

          {/* Auto-Sync Live Status Pill */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                backupConfig.autoSyncEnabled
                  ? 'border border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'border border-line bg-subtle text-ink-muted'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  backupConfig.autoSyncEnabled ? 'bg-emerald-500' : 'bg-neutral-400'
                }`}
              />
              <span>
                {backupConfig.autoSyncEnabled
                  ? `Auto-Sync Aktif · Sinkron: ${backupConfig.lastBackupAt ? timeAgo(new Date(backupConfig.lastBackupAt).toISOString()) : 'Baru saja'}`
                  : 'Auto-Sync Dinonaktifkan'}
              </span>
            </span>

            <button
              type="button"
              onClick={handleToggleAutoSync}
              className="text-xs font-semibold text-ink underline hover:text-ink-muted"
            >
              {backupConfig.autoSyncEnabled ? 'Matikan' : 'Aktifkan'}
            </button>
          </div>
        </div>

        {/* Backup Scope and Format Selection */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Scope selection */}
          <div className="rounded-lg border border-line bg-canvas p-3.5">
            <span className="block font-semibold text-ink mb-2">1. Cakupan Data Backup</span>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="backup-scope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="mt-0.5 text-ink focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-ink flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-ink-muted" />
                    Semua Data Sistem ({data.tickets.length} Tiket)
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Mencakup tiket dari seluruh 7 aplikasi VPS, data kontak, dan seluruh riwayat.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="backup-scope"
                  checked={scope === 'personal'}
                  onChange={() => setScope('personal')}
                  className="mt-0.5 text-ink focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-ink flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-ink-muted" />
                    Khusus Tiket Pribadi ({personalTicketsCount} Tiket)
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Hanya mencadangkan tiket yang ditugaskan ke Anda ({adminActor.name}).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Format selection */}
          <div className="rounded-lg border border-line bg-canvas p-3.5">
            <span className="block font-semibold text-ink mb-2">2. Format Berkas Cadangan</span>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="backup-format"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="mt-0.5 text-ink focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-ink flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    CSV (Format Spreadsheet / Excel)
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Tabel tabular kolom rapi, mudah dibuka langsung di Microsoft Excel atau Google Sheets.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="backup-format"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                  className="mt-0.5 text-ink focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-ink flex items-center gap-1.5">
                    <FileJson className="h-3.5 w-3.5 text-amber-600" />
                    JSON (Full Database Snapshot)
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Snapshot teknis lengkap terstruktur beserta pesan, riwayat balasan, dan metadata.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line">
          <div className="text-[11px] text-ink-muted flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sistem akan otomatis memastikan antrean data terbaru tersinkronisasi sebelum diunduh.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncAndDownload}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>
                {syncing
                  ? 'Menyinkronkan Data...'
                  : `Sinkronkan & Unduh Backup ${format.toUpperCase()} (${scope === 'personal' ? 'Pribadi' : 'Lengkap'})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-3 py-2 text-xs font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
              title="Reset data demo"
            >
              <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
              <span>Reset Data Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Server-side SQLite Backup Documentation */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs text-xs">
        <h2 className="text-sm font-semibold text-ink">Cadangan Otomatis Harian di Server VPS</h2>
        <dl className="mt-3 space-y-2 border-t border-line pt-3 font-mono text-[11px]">
          <div className="flex justify-between gap-1">
            <dt className="text-ink-muted">Skrip Cadangan:</dt>
            <dd className="text-ink">/srv/helpdesk/scripts/backup-pb.py</dd>
          </div>
          <div className="flex justify-between gap-1">
            <dt className="text-ink-muted">Jadwal Cron:</dt>
            <dd className="text-ink">0 2 * * * (Setiap hari pkl 02:00 WIB)</dd>
          </div>
          <div className="flex justify-between gap-1">
            <dt className="text-ink-muted">Masa Retensi:</dt>
            <dd className="text-ink">14 Hari (Rotasi file backup otomatis)</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
