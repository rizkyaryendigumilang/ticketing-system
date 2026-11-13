import React, { useMemo } from 'react';
import { Database, Download, RotateCcw } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';

export function StorageTab() {
  const { data, connection, pendingAdminChanges, settings, resetDemo, t } = useCrm();
  const toast = useToast();

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

  const handleExportJsonDump = () => {
    const snapshot = {
      exportDate: new Date().toISOString(),
      system: 'Helpdesk App',
      vpsHost: '43.156.236.102',
      counts: {
        tickets: data.tickets.length,
        users: data.users.length,
        messages: data.messages.length,
        apps: data.apps.length,
      },
      data,
      settings,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vps-helpdesk-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Snapshot database berhasil diunduh.');
  };

  const handleResetDemo = () => {
    if (confirm('Kembalikan database demo lokal ke data seed awal?')) {
      resetDemo();
    }
  };

  return (
    <div className="space-y-6">
      {/* Storage Status Card */}
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

      {/* Data Export & Backup Action */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-ink">Ekspor Data CRM (JSON Snapshot)</h2>
        <p className="text-xs text-ink-muted mt-1">
          Unduh salinan lengkap seluruh tiket, percakapan pesan, kontak pelapor, dan pengaturan ke file JSON.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportJsonDump}
            className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            Unduh Snapshot JSON
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-3 py-2 text-xs font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
          >
            <RotateCcw className="h-4 w-4 text-ink-muted" />
            Reset Data Lokal ke Seed
          </button>
        </div>
      </div>

      {/* Server-side SQLite Backup Documentation */}
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
