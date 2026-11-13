import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';

export function AutomationsTab() {
  const { settings, updateSettings, t } = useCrm();
  const toast = useToast();

  const [autoCloseEnabled, setAutoCloseEnabled] = useState(settings.autoCloseEnabled ?? true);
  const [autoCloseDays, setAutoCloseDays] = useState(settings.autoCloseDays ?? 7);

  const handleSaveAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      autoCloseEnabled,
      autoCloseDays: Number(autoCloseDays) || 7,
    });
    toast.success('Konfigurasi otomasi tiket berhasil disimpan.');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Clock className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.autoCloseTitle')}</h2>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          {t('settings.autoCloseDesc')}
        </p>

        <form onSubmit={handleSaveAutomation} className="mt-4 space-y-4 text-xs max-w-md">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoCloseEnabled}
              onChange={(e) => setAutoCloseEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-line text-ink"
            />
            <span className="font-semibold text-ink">Aktifkan Penutupan Tiket Otomatis</span>
          </label>

          <div>
            <label className="block font-medium text-ink">{t('settings.autoCloseDaysLabel')}</label>
            <input
              type="number"
              min={1}
              max={90}
              value={autoCloseDays}
              onChange={(e) => setAutoCloseDays(Number(e.target.value))}
              className="mt-1 w-28 rounded border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-ink-muted">Standar industri: 7 hari.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              {t('settings.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      {/* Status Cycle Rule Explanation */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs text-xs space-y-2">
        <h3 className="font-semibold text-ink">Aturan Siklus Tiket Otomatis</h3>
        <ul className="list-disc pl-4 space-y-1 text-ink-muted">
          <li>
            Balasan dari pelapor pada tiket berstatus{' '}
            <strong className="text-ink">Menunggu Balasan</strong> atau{' '}
            <strong className="text-ink">Selesai</strong> otomatis membuka kembali tiket ke status{' '}
            <strong className="text-ink">Diproses</strong>.
          </li>
          <li>
            Tiket dengan status <strong className="text-ink">Ditutup</strong> tidak menerima tanggapan
            balasan baru dan diarsipkan permanen.
          </li>
        </ul>
      </div>
    </div>
  );
}
