import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';

export function NotificationsTab() {
  const { settings, updateSettings, requestDesktopNotification, t } = useCrm();
  const toast = useToast();

  const [telegramEnabled, setTelegramEnabled] = useState(settings.telegramEnabled);
  const [telegramBotToken, setTelegramBotToken] = useState(settings.telegramBotToken);
  const [telegramChatId, setTelegramChatId] = useState(settings.telegramChatId);
  const [notifyOnUrgentOnly, setNotifyOnUrgentOnly] = useState(settings.notifyOnUrgentOnly);
  const [desktopNotificationSound, setDesktopNotificationSound] = useState(settings.desktopNotificationSound);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      telegramEnabled,
      telegramBotToken,
      telegramChatId,
      notifyOnUrgentOnly,
      desktopNotificationSound,
    });
    toast.success(t('settings.saved'));
  };

  const handleTestTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      toast.error('Isi Bot Token dan Chat ID Telegram terlebih dahulu');
      return;
    }
    setTestingTelegram(true);
    try {
      const text = `🔔 *Helpdesk App — Pesan Uji Coba*\n\nKoneksi notifikasi Telegram dari Helpdesk CRM berhasil terhubung dengan sukses!\n\nWaktu: ${new Date().toLocaleString('id-ID')}`;
      const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Pesan uji coba berhasil terkirim ke Telegram');
      } else {
        toast.error(`Telegram API error: ${data.description || 'Gagal'}`);
      }
    } catch (err) {
      toast.error('Gagal mengirim ke Telegram API (cek koneksi/token)');
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Telegram Bot Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Bell className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">Notifikasi Telegram Bot</h2>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Kirimkan alert otomatis ke Telegram Superadmin setiap kali tiket baru masuk dari pelapor.
        </p>

        <form onSubmit={handleSaveNotifications} className="mt-4 space-y-4 text-xs">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={telegramEnabled}
              onChange={(e) => setTelegramEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-line text-ink focus:ring-ink"
            />
            <span className="font-semibold text-ink">Aktifkan Notifikasi Telegram Otomatis</span>
          </label>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block font-medium text-ink">Bot Token Telegram</label>
              <input
                type="password"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="Contoh: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
              />
              <span className="text-[11px] text-ink-muted">Dibuat melalui @BotFather di Telegram.</span>
            </div>

            <div>
              <label className="block font-medium text-ink">Chat ID Telegram</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Contoh: 987654321 atau -100123456789 (grup)"
                className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={notifyOnUrgentOnly}
                onChange={(e) => setNotifyOnUrgentOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-line text-ink"
              />
              <span className="text-ink-muted">Hanya kirim notifikasi untuk tiket Darurat (Urgent & High)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={desktopNotificationSound}
                onChange={(e) => setDesktopNotificationSound(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-line text-ink"
              />
              <span className="text-ink-muted">Bunyikan audio saat tiket baru masuk di meja kerja</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
            <button
              type="submit"
              className="rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              {t('settings.saveChanges')}
            </button>

            <button
              type="button"
              disabled={testingTelegram}
              onClick={handleTestTelegram}
              className="rounded border border-line bg-subtle px-3 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all disabled:opacity-50"
            >
              {testingTelegram ? 'Mengirim...' : 'Kirim Uji Coba Telegram'}
            </button>

            <button
              type="button"
              onClick={() => void requestDesktopNotification()}
              className="rounded border border-line bg-subtle px-3 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
            >
              Izinkan Notifikasi Desktop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
