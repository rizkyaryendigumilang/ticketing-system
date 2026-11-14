import React, { useState } from 'react';
import { Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';

export function AutomationsTab() {
  const { settings, updateSettings, t } = useCrm();
  const toast = useToast();

  const [autoCloseEnabled, setAutoCloseEnabled] = useState(settings.autoCloseEnabled ?? true);
  const [autoCloseDays, setAutoCloseDays] = useState(settings.autoCloseDays ?? 7);
  const [autoEscalateSla, setAutoEscalateSla] = useState(settings.autoEscalateSla ?? true);

  const handleSaveAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      autoCloseEnabled,
      autoCloseDays: Number(autoCloseDays) || 7,
      autoEscalateSla,
    });
    toast.success('Konfigurasi otomasi tiket & SLA berhasil disimpan.');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line/60 bg-panel/70 backdrop-blur-md p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line/60 pb-3">
          <Clock className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.autoCloseTitle')}</h2>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          {t('settings.autoCloseDesc')}
        </p>

        <form onSubmit={handleSaveAutomation} className="mt-5 space-y-5 text-xs max-w-lg">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={autoCloseEnabled}
              onChange={(e) => setAutoCloseEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-ink focus:ring-accent"
            />
            <div>
              <span className="font-semibold text-ink group-hover:text-accent transition-colors">
                Aktifkan Penutupan Tiket Otomatis
              </span>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Tiket dengan status Selesai akan otomatis diarsipkan menjadi Ditutup jika tidak ada tanggapan pelapor.
              </p>
            </div>
          </label>

          <div>
            <label className="block font-medium text-ink">{t('settings.autoCloseDaysLabel')}</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={90}
                value={autoCloseDays}
                onChange={(e) => setAutoCloseDays(Number(e.target.value))}
                className="w-24 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
              />
              <span className="text-ink-muted">hari setelah ditandai Selesai</span>
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">Rekomendasi standar: 3 - 7 hari.</p>
          </div>

          <div className="border-t border-line/50 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-semibold text-ink">Eskalasi SLA Otomatis</h3>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={autoEscalateSla}
                onChange={(e) => setAutoEscalateSla(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line text-ink focus:ring-accent"
              />
              <div>
                <span className="font-semibold text-ink group-hover:text-accent transition-colors">
                  Eskalasi Otomatis Tiket Melewati SLA ke Darurat (Urgent)
                </span>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Jika tiket aktif melampaui tenggat SLA (Darurat: 2j, Tinggi: 6j, Sedang: 24j, Rendah: 48j), daemon otomatis meningkatkan prioritas ke Darurat dan mencatat audit log.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-medium text-canvas shadow-xs hover:bg-ink/90 active:scale-95 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t('settings.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      {/* Status Cycle Rule Explanation */}
      <div className="rounded-2xl border border-line/60 bg-panel/50 p-5 shadow-xs text-xs space-y-2">
        <h3 className="font-semibold text-ink">Aturan Siklus & Matriks SLA Tiket</h3>
        <ul className="list-disc pl-4 space-y-1.5 text-ink-muted">
          <li>
            <strong className="text-ink">Matriks SLA:</strong> Darurat (2 Jam), Tinggi (6 Jam), Sedang (24 Jam), Rendah (48 Jam).
          </li>
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
