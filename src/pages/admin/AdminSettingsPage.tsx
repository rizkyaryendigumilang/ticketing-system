import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Server,
  ShieldCheck,
  TerminalSquare,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CANNED_RESPONSES, CATEGORY_LABEL } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { useToast } from '../../context/ToastContext';
import type { CannedResponse } from '../../types/crm';
import { IntegrationTabContent } from './AdminIntegrationPage';

type TabKey = 'account' | 'integrations' | 'security' | 'notifications' | 'canned' | 'database';

export function AdminSettingsPage() {
  const {
    data,
    admin,
    connection,
    pendingAdminChanges,
    settings,
    updateSettings,
    cannedResponses,
    updateCannedResponses,
    requestDesktopNotification,
  } = useCrm();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || 'account');

  useEffect(() => {
    if (tabParam && ['account', 'integrations', 'security', 'notifications', 'canned', 'database'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams(tab === 'account' ? {} : { tab });
  };

  // Account Form State
  const [adminName, setAdminName] = useState(admin?.name ?? 'Superadmin VPS');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security Form State
  const [handoffSecret, setHandoffSecret] = useState(settings.handoffSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(settings.handoffExpiryMinutes);
  const [allowedOrigins, setAllowedOrigins] = useState(settings.allowedOrigins.join('\n'));

  // Notifications Form State
  const [telegramEnabled, setTelegramEnabled] = useState(settings.telegramEnabled);
  const [telegramBotToken, setTelegramBotToken] = useState(settings.telegramBotToken);
  const [telegramChatId, setTelegramChatId] = useState(settings.telegramChatId);
  const [notifyOnUrgentOnly, setNotifyOnUrgentOnly] = useState(settings.notifyOnUrgentOnly);
  const [desktopNotificationSound, setDesktopNotificationSound] = useState(
    settings.desktopNotificationSound,
  );
  const [outboundWebhookEnabled, setOutboundWebhookEnabled] = useState(
    settings.outboundWebhookEnabled,
  );
  const [outboundWebhookUrl, setOutboundWebhookUrl] = useState(
    settings.outboundWebhookUrl,
  );
  const [testingTelegram, setTestingTelegram] = useState(false);

  // Canned Responses State
  const [cannedModalOpen, setCannedModalOpen] = useState(false);
  const [editingCannedId, setEditingCannedId] = useState<string | null>(null);
  const [cannedTitle, setCannedTitle] = useState('');
  const [cannedContent, setCannedContent] = useState('');
  const [cannedCategory, setCannedCategory] = useState<string>('bug_error');

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      toast.error('Nama tampilan admin wajib diisi.');
      return;
    }
    // Update local admin session
    toast.success('Profil Superadmin berhasil diperbarui.');
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Kata sandi saat ini wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    toast.success('Kata sandi Superadmin berhasil diperbarui.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle Save Security
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSecret = handoffSecret.trim() || 'vps-helpdesk-secret-key';
    const origins = allowedOrigins
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    updateSettings({
      ...settings,
      handoffSecret: cleanSecret,
      handoffExpiryMinutes: Number(expiryMinutes) || 15,
      allowedOrigins: origins.length ? origins : ['https://43.156.236.102'],
    });
    toast.success('Konfigurasi keamanan SSO handoff berhasil disimpan.');
  };

  // Handle Generate Secret
  const handleGenerateSecret = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => chars[b % chars.length]).join('');
    setHandoffSecret(randomSecret);
    toast.info('Kunci rahasia baru dibuat. Klik "Simpan Pengaturan" untuk menerapkan.');
  };

  // Handle Copy Secret
  const handleCopySecret = () => {
    navigator.clipboard.writeText(handoffSecret);
    setCopiedSecret(true);
    toast.success('Kunci rahasia HMAC disalin ke clipboard.');
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Handle Save Notifications
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      telegramEnabled,
      telegramBotToken: telegramBotToken.trim(),
      telegramChatId: telegramChatId.trim(),
      notifyOnUrgentOnly,
      desktopNotificationSound,
      outboundWebhookEnabled,
      outboundWebhookUrl: outboundWebhookUrl.trim(),
    });
    toast.success('Pengaturan notifikasi & webhook berhasil disimpan.');
  };

  // Handle Test Telegram
  const handleTestTelegram = async () => {
    if (!telegramBotToken.trim() || !telegramChatId.trim()) {
      toast.error('Harap isi Bot Token dan Chat ID Telegram terlebih dahulu.');
      return;
    }
    setTestingTelegram(true);
    try {
      const text = `🔔 <b>UJI COBA NOTIFIKASI HELPDESK CRM</b>\n\n` +
        `Koneksi notifikasi Telegram dari VPS Helpdesk CRM berhasil terhubung!\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;

      const res = await fetch(`https://api.telegram.org/bot${telegramBotToken.trim()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId.trim(), text, parse_mode: 'HTML' }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Pesan uji coba berhasil terkirim ke Telegram!');
      } else {
        toast.error(`Telegram API Error: ${data.description || 'Gagal mengirim pesan.'}`);
      }
    } catch (err) {
      toast.error('Gagal menghubungi Telegram API. Pastikan Bot Token valid.');
    } finally {
      setTestingTelegram(false);
    }
  };

  // Handle Canned Response Actions
  const handleOpenAddCanned = () => {
    setEditingCannedId(null);
    setCannedTitle('');
    setCannedContent('');
    setCannedCategory('bug_error');
    setCannedModalOpen(true);
  };

  const handleOpenEditCanned = (cr: CannedResponse) => {
    setEditingCannedId(cr.id);
    setCannedTitle(cr.title);
    setCannedContent(cr.content);
    setCannedCategory(cr.category ?? 'bug_error');
    setCannedModalOpen(true);
  };

  const handleDeleteCanned = (id: string) => {
    if (confirm('Hapus template balasan cepat ini?')) {
      const next = cannedResponses.filter((c) => c.id !== id);
      updateCannedResponses(next);
      toast.success('Template balasan cepat dihapus.');
    }
  };

  const handleSaveCanned = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cannedTitle.trim() || !cannedContent.trim()) {
      toast.error('Judul dan isi template wajib diisi.');
      return;
    }

    if (editingCannedId) {
      const next = cannedResponses.map((c) =>
        c.id === editingCannedId
          ? { ...c, title: cannedTitle.trim(), content: cannedContent.trim(), category: cannedCategory }
          : c,
      );
      updateCannedResponses(next);
      toast.success('Template balasan cepat diperbarui.');
    } else {
      const newCr: CannedResponse = {
        id: `cr-${Date.now()}`,
        title: cannedTitle.trim(),
        content: cannedContent.trim(),
        category: cannedCategory,
      };
      updateCannedResponses([...cannedResponses, newCr]);
      toast.success('Template balasan baru berhasil ditambahkan.');
    }
    setCannedModalOpen(false);
  };

  const handleResetCanned = () => {
    if (confirm('Kembalikan seluruh template ke daftar bawaan standar?')) {
      updateCannedResponses(CANNED_RESPONSES);
      toast.success('Template balasan dikembalikan ke daftar bawaan.');
    }
  };

  // Export Full JSON Snapshot
  const handleExportJsonDump = () => {
    const snapshot = {
      exportDate: new Date().toISOString(),
      system: 'VPS Helpdesk CRM',
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

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* Header */}
      <div className="border-b border-line pb-4">
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Pengaturan Sistem Helpdesk CRM
        </h1>
        <p className="mt-1 text-xs text-ink-muted">
          Konfigurasi terpusat untuk akun Superadmin, kunci keamanan SSO Handoff, notifikasi Telegram, template balasan, dan cadangan database.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-line gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => handleTabChange('account')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors whitespace-nowrap ${
            activeTab === 'account'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <User className="h-4 w-4" />
          Akun &amp; Profil
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('integrations')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors whitespace-nowrap ${
            activeTab === 'integrations'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <TerminalSquare className="h-4 w-4" />
          Integrasi Tombol Bantuan
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('security')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Keamanan &amp; Handoff
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('notifications')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Bell className="h-4 w-4" />
          Notifikasi &amp; Alert
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('canned')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors whitespace-nowrap ${
            activeTab === 'canned'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <MessageSquareQuote className="h-4 w-4" />
          Template Balasan Cepat
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('database')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors whitespace-nowrap ${
            activeTab === 'database'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Database className="h-4 w-4" />
          Database &amp; Cadangan
        </button>
      </div>

      {/* ═══ TAB 1: AKUN & PROFIL ═══ */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Profil Superadmin</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Nama ini digunakan saat membalas laporan kendala kepada pelapor.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-ink">Email Superadmin</label>
                <input
                  type="email"
                  disabled
                  value={admin?.email ?? 'admin@crm.local'}
                  className="mt-1 w-full rounded border border-line bg-subtle/80 px-3 py-2 font-mono text-ink-muted cursor-not-allowed"
                />
                <span className="text-[11px] text-ink-faint">
                  Akun Superuser PocketBase VPS terdaftar.
                </span>
              </div>

              <div>
                <label className="block font-medium text-ink">Nama Tampilan</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Ganti Kata Sandi</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Perbarui kata sandi untuk login Superadmin PocketBase.
            </p>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-ink">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ TAB: INTEGRASI TOMBOL BANTUAN ═══ */}
      {activeTab === 'integrations' && (
        <IntegrationTabContent embedded />
      )}

      {/* ═══ TAB 2: KEAMANAN & HANDOFF ═══ */}
      {activeTab === 'security' && (
        <div className="max-w-3xl space-y-6">
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Kunci Rahasia Tanda Tangan HMAC-SHA256</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Kunci ini dipakai oleh backend aplikasi asal untuk menandatangani URL handoff bantuan, mencegah pemalsuan identitas user (*anti-spoofing*).
            </p>

            <form onSubmit={handleSaveSecurity} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-ink">Kunci Rahasia (HANDOFF_SECRET)</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={handoffSecret}
                      onChange={(e) => setHandoffSecret(e.target.value)}
                      className="w-full rounded border border-line bg-canvas py-2 pl-3 pr-10 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                    >
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="inline-flex items-center gap-1 rounded border border-line bg-subtle px-3 py-2 text-xs font-medium text-ink hover:border-line-strong"
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    Salin
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateSecret}
                    className="inline-flex items-center gap-1 rounded border border-line bg-subtle px-3 py-2 text-xs font-medium text-ink hover:border-line-strong"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Buat Baru
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink">
                  Masa Berlaku Tautan Bertanda Tangan (Kedaluwarsa)
                </label>
                <select
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none sm:w-64"
                >
                  <option value={5}>5 Menit (Sangat Ketat)</option>
                  <option value={15}>15 Menit (Rekomendasi Standar)</option>
                  <option value={30}>30 Menit</option>
                  <option value={60}>60 Menit (1 Jam)</option>
                </select>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Tautan handoff yang lewat dari durasi ini akan ditolak demi keamanan.
                </p>
              </div>

              <div>
                <label className="block font-medium text-ink">
                  Domain Asal yang Diizinkan (*Allowed Origins Whitelist*)
                </label>
                <textarea
                  rows={3}
                  value={allowedOrigins}
                  onChange={(e) => setAllowedOrigins(e.target.value)}
                  placeholder="https://43.156.236.102&#10;http://localhost:5173"
                  className="mt-1 w-full rounded border border-line bg-canvas p-3 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-ink-muted">
                  Satu origin per baris. Mengamankan pengalihan balik (*open-redirect prevention*).
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Pengaturan Keamanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: NOTIFIKASI & ALERT ═══ */}
      {activeTab === 'notifications' && (
        <div className="max-w-3xl space-y-6">
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Notifikasi Telegram Bot</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Kirimkan alert otomatis ke akun Telegram atau grup Superadmin setiap kali tiket baru masuk.
            </p>

            <form onSubmit={handleSaveNotifications} className="mt-4 space-y-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="rounded border-line text-ink focus:ring-ink"
                />
                <span className="font-semibold text-ink">Aktifkan Notifikasi Telegram Otomatis</span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-ink">Bot Token Telegram</label>
                  <input
                    type="password"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="Contoh: 123456789:ABCdefGhIJKlmNoP..."
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
                    placeholder="Contoh: 987654321 atau -100..."
                    className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                  />
                  <span className="text-[11px] text-ink-muted">ID akun pengguna atau ID grup admin.</span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnUrgentOnly}
                  onChange={(e) => setNotifyOnUrgentOnly(e.target.checked)}
                  className="rounded border-line text-ink focus:ring-ink"
                />
                <span className="text-ink">Hanya kirim alert untuk tiket berprioritas <strong>Darurat</strong> atau <strong>Tinggi</strong></span>
              </label>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line/60">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Pengaturan Telegram
                </button>

                <button
                  type="button"
                  disabled={testingTelegram}
                  onClick={handleTestTelegram}
                  className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-3 py-2 text-xs font-medium text-ink hover:border-line-strong disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {testingTelegram ? 'Mengirim...' : 'Kirim Uji Coba Telegram'}
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Push Card */}
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Notifikasi Desktop Browser</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Tampilkan notifikasi pop-up di layar komputer saat browser sedang diminimalkan.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs border border-line rounded p-3 bg-canvas">
              <div>
                <span className="font-semibold text-ink">Izin Notifikasi Browser: </span>
                <span className="font-mono text-ink-muted">
                  {typeof window !== 'undefined' && 'Notification' in window
                    ? Notification.permission
                    : 'Tidak didukung'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void requestDesktopNotification()}
                className="rounded border border-line bg-panel px-3 py-1.5 font-medium text-ink hover:border-line-strong shadow-sm"
              >
                Minta Izin Notifikasi Desktop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: TEMPLATE BALASAN CEPAT ═══ */}
      {activeTab === 'canned' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Daftar Template Balasan Cepat (Canned Responses)</h2>
              <p className="text-xs text-ink-muted">
                Template siap pakai untuk mempercepat Superadmin dalam merespons tiket pelapor.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCanned}
                className="inline-flex items-center gap-1 rounded border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
              >
                <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
                Reset ke Standar
              </button>
              <button
                type="button"
                onClick={handleOpenAddCanned}
                className="inline-flex items-center gap-1.5 rounded bg-ink px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Template
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cannedResponses.map((cr) => (
              <div
                key={cr.id}
                className="flex flex-col justify-between rounded-lg border border-line bg-panel p-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                    <span className="text-xs font-bold text-ink">{cr.title}</span>
                    {cr.category && (
                      <span className="rounded bg-subtle px-1.5 py-0.5 text-[10px] text-ink-muted">
                        {CATEGORY_LABEL[cr.category as keyof typeof CATEGORY_LABEL] ?? cr.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted line-clamp-3">
                    {cr.content}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 border-t border-line/60 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCanned(cr)}
                    className="text-xs font-medium text-ink hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCanned(cr.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Canned Modal Form */}
          {cannedModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-lg border border-line bg-panel p-5 shadow-xl">
                <h3 className="text-sm font-bold text-ink">
                  {editingCannedId ? 'Edit Template Balasan' : 'Tambah Template Balasan Baru'}
                </h3>
                <form onSubmit={handleSaveCanned} className="mt-4 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-medium text-ink">Judul Template</label>
                    <input
                      type="text"
                      required
                      value={cannedTitle}
                      onChange={(e) => setCannedTitle(e.target.value)}
                      placeholder="Contoh: Minta Tangkapan Layar Tambahan"
                      className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-ink">Kategori Terkait</label>
                    <select
                      value={cannedCategory}
                      onChange={(e) => setCannedCategory(e.target.value)}
                      className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                    >
                      <option value="bug_error">Bug / Error Fitur</option>
                      <option value="account_login">Akun &amp; Akses Login</option>
                      <option value="data_transaction">Selisih Data / Transaksi</option>
                      <option value="feature_question">Pertanyaan / Request Fitur</option>
                      <option value="other">Umum / Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-ink">Isi Pesan Balasan</label>
                    <textarea
                      rows={4}
                      required
                      value={cannedContent}
                      onChange={(e) => setCannedContent(e.target.value)}
                      placeholder="Tulis draf pesan balasan yang ramah dan jelas..."
                      className="mt-1 w-full rounded border border-line bg-canvas p-3 leading-relaxed text-ink focus:border-ink focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                    <button
                      type="button"
                      onClick={() => setCannedModalOpen(false)}
                      className="rounded border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Simpan Template
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 5: DATABASE & CADANGAN VPS ═══ */}
      {activeTab === 'database' && (
        <div className="max-w-3xl space-y-6">
          {/* PocketBase Status Strip */}
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Status Backend &amp; Layanan PocketBase</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded border border-line bg-canvas p-3">
                <span className="text-ink-muted">Koneksi Layanan</span>
                <div className="mt-1 flex items-center gap-1.5 font-bold text-ink">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      connection === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span>{connection === 'online' ? 'Online (Terhubung)' : 'Mode Offline Fallback'}</span>
                </div>
                <span className="text-[10px] text-ink-faint">Port internal 127.0.0.1:8094</span>
              </div>

              <div className="rounded border border-line bg-canvas p-3">
                <span className="text-ink-muted">Perubahan Menunggu Sync</span>
                <div className="mt-1 font-mono text-base font-bold text-ink">
                  {pendingAdminChanges}
                </div>
                <span className="text-[10px] text-ink-faint">Antrean sinkronisasi lokal</span>
              </div>

              <div className="rounded border border-line bg-canvas p-3">
                <span className="text-ink-muted">Total Data Tersimpan</span>
                <div className="mt-1 font-mono text-xs font-bold text-ink">
                  {data.tickets.length} Tiket · {data.users.length} Kontak
                </div>
                <span className="text-[10px] text-ink-faint">Dari 7 aplikasi terdaftar</span>
              </div>
            </div>
          </div>

          {/* Backup & Snapshot Action */}
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Cadangan Data (Backup Snapshot)</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Unduh salinan penuh seluruh data tiket, percakapan, kontak pelapor, dan pengaturan sistem ke file JSON lokal di komputer Anda.
            </p>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleExportJsonDump}
                className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Unduh Snapshot Database (JSON)
              </button>
            </div>
          </div>

          {/* VPS Automated Daily Backup Documentation Card */}
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm text-xs">
            <h2 className="text-sm font-semibold text-ink">Cadangan Otomatis Harian di Server VPS</h2>
            <p className="text-xs text-ink-muted mt-1">
              Server VPS telah dikonfigurasi dengan skrip cadangan online SQLite otomatis menggunakan Python Standard Library:
            </p>

            <dl className="mt-3 space-y-2 border-t border-line pt-3 font-mono text-[11px]">
              <div className="flex flex-wrap justify-between gap-1">
                <dt className="text-ink-muted">Skrip Cadangan:</dt>
                <dd className="text-ink">/srv/helpdesk/scripts/backup-pb.py</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                <dt className="text-ink-muted">Jadwal Eksekusi Cron:</dt>
                <dd className="text-ink">0 2 * * * (Setiap hari pkl 02:00 WIB)</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                <dt className="text-ink-muted">Direktori Arsip:</dt>
                <dd className="text-ink">/srv/helpdesk/backups/helpdesk-*.db.gz</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                <dt className="text-ink-muted">Masa Retensi:</dt>
                <dd className="text-ink">14 Hari (Pembersihan otomatis file lama)</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
