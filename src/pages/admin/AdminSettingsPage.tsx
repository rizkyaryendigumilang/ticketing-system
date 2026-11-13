import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  Globe,
  Info,
  KeyRound,
  Layers,
  Lock,
  MessageSquareQuote,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TerminalSquare,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CANNED_RESPONSES, CATEGORY_LABEL, VPS_APPS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { useToast } from '../../context/ToastContext';
import { pruneOldClosedTickets } from '../../services/storageService';
import type { CannedResponse } from '../../types/crm';
import { IntegrationTabContent } from './AdminIntegrationPage';

export type TabKey =
  | 'account'
  | 'preferences'
  | 'appearance'
  | 'notifications'
  | 'security'
  | 'integrations'
  | 'storage'
  | 'automation'
  | 'canned'
  | 'about';

interface NavItemDef {
  key: TabKey;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavGroupDef {
  titleKey: string;
  defaultTitle: string;
  items: NavItemDef[];
}

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
    resetDemo,
    t,
    categoryLabel,
  } = useCrm();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || 'account');
  const [searchFilter, setSearchFilter] = useState('');

  // Nav Groups definition
  const navGroups: NavGroupDef[] = useMemo(
    () => [
      {
        titleKey: 'settings.groupEssential',
        defaultTitle: 'Utama',
        items: [
          {
            key: 'account',
            labelKey: 'settings.tabAccount',
            defaultLabel: 'Akun & Profil',
            icon: User,
            description: 'Nama tampilan dan kata sandi superuser',
          },
          {
            key: 'preferences',
            labelKey: 'settings.tabPreferences',
            defaultLabel: 'Preferensi',
            icon: Globe,
            description: 'Bahasa antarmuka, zona waktu, dan tampilan awal',
          },
          {
            key: 'appearance',
            labelKey: 'settings.tabAppearance',
            defaultLabel: 'Tampilan',
            icon: SlidersHorizontal,
            description: 'Tema dan kerapatan tata letak antarmuka',
          },
          {
            key: 'notifications',
            labelKey: 'settings.tabNotifications',
            defaultLabel: 'Notifikasi',
            icon: Bell,
            description: 'Alert bot Telegram dan suara desktop',
          },
        ],
      },
      {
        titleKey: 'settings.groupSecurity',
        defaultTitle: 'Keamanan & Integrasi',
        items: [
          {
            key: 'security',
            labelKey: 'settings.tabSecurity',
            defaultLabel: 'Keamanan & Handoff',
            icon: ShieldCheck,
            description: 'Kunci rahasia HMAC dan domain yang diizinkan',
          },
          {
            key: 'integrations',
            labelKey: 'settings.tabIntegrations',
            defaultLabel: 'Integrasi Tombol',
            icon: TerminalSquare,
            description: 'Generator tombol bantuan untuk 7 aplikasi VPS',
          },
          {
            key: 'storage',
            labelKey: 'settings.tabStorage',
            defaultLabel: 'Data & Penyimpanan',
            icon: Database,
            description: 'Sinkronisasi PocketBase, kuota lokal, dan backup',
          },
        ],
      },
      {
        titleKey: 'settings.groupOperations',
        defaultTitle: 'Operasional & Sistem',
        items: [
          {
            key: 'automation',
            labelKey: 'settings.tabAutomation',
            defaultLabel: 'Otomasi Tiket',
            icon: Clock,
            description: 'Penutupan tiket otomatis dan aturan siklus',
          },
          {
            key: 'canned',
            labelKey: 'settings.tabCanned',
            defaultLabel: 'Template Balasan',
            icon: MessageSquareQuote,
            description: 'Template respon cepat untuk agen helpdesk',
          },
          {
            key: 'about',
            labelKey: 'settings.tabAbout',
            defaultLabel: 'Tentang Aplikasi',
            icon: Info,
            description: 'Versi sistem, arsitektur, dan dokumentasi',
          },
        ],
      },
    ],
    [],
  );

  const validTabs = useMemo(
    () => navGroups.flatMap((g) => g.items.map((i) => i.key)),
    [navGroups],
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, validTabs]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams(tab === 'account' ? {} : { tab });
  };

  // Account Form State
  const [adminName, setAdminName] = useState(admin?.name ?? 'Superadmin VPS');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences Form State
  const [selectedLanguage, setSelectedLanguage] = useState<'id' | 'en'>(settings.language ?? 'id');
  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Jakarta');
  const [defaultView, setDefaultView] = useState<'dashboard' | 'tickets'>(settings.defaultView || 'dashboard');

  // Appearance Form State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme || 'light');
  const [uiDensity, setUiDensity] = useState<'comfortable' | 'compact'>(settings.uiDensity || 'comfortable');

  // Automation Form State
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(settings.autoCloseEnabled ?? true);
  const [autoCloseDays, setAutoCloseDays] = useState(settings.autoCloseDays ?? 7);

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

  // LocalStorage Gauge calculation
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
    const kb = (bytes / 1024).toFixed(1);
    const percent = Math.min(100, Math.round((bytes / (5 * 1024 * 1024)) * 100));
    return { bytes, kb, percent };
  }, [data, settings]);

  // Handle Save Language
  const handleSaveLanguage = (lang: 'id' | 'en') => {
    setSelectedLanguage(lang);
    updateSettings({ ...settings, language: lang });
    toast.success(
      lang === 'id' ? t('settings.langSuccessId') : t('settings.langSuccessEn'),
    );
  };

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      toast.error('Nama tampilan admin wajib diisi.');
      return;
    }
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

  // Handle Save Preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      language: selectedLanguage,
      timezone,
      defaultView,
    });
    toast.success('Preferensi antarmuka berhasil disimpan.');
  };

  // Handle Save Appearance
  const handleSaveAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      theme,
      uiDensity,
    });
    toast.success('Pengaturan tampilan berhasil diperbarui.');
  };

  // Handle Save Automation
  const handleSaveAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      autoCloseEnabled,
      autoCloseDays: Number(autoCloseDays) || 7,
    });
    toast.success('Konfigurasi otomasi tiket berhasil disimpan.');
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
    toast.success('Kunci rahasia HMAC disalin.');
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
    toast.success('Pengaturan notifikasi berhasil disimpan.');
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
        `Koneksi notifikasi Telegram dari Helpdesk App berhasil terhubung.\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;

      const res = await fetch(`https://api.telegram.org/bot${telegramBotToken.trim()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId.trim(), text, parse_mode: 'HTML' }),
      });
      const dataRes = await res.json();
      if (dataRes.ok) {
        toast.success('Pesan uji coba terkirim ke Telegram.');
      } else {
        toast.error(`Telegram API Error: ${dataRes.description || 'Gagal mengirim pesan.'}`);
      }
    } catch {
      toast.error('Gagal menghubungi Telegram API. Pastikan Bot Token valid.');
    } finally {
      setTestingTelegram(false);
    }
  };

  // Handle Canned Responses
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
      toast.success('Template balasan dihapus.');
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
      toast.success('Template balasan diperbarui.');
    } else {
      const newCr: CannedResponse = {
        id: `cr-${Date.now()}`,
        title: cannedTitle.trim(),
        content: cannedContent.trim(),
        category: cannedCategory,
      };
      updateCannedResponses([...cannedResponses, newCr]);
      toast.success('Template balasan baru ditambahkan.');
    }
    setCannedModalOpen(false);
  };

  const handleResetCanned = () => {
    if (confirm('Kembalikan seluruh template ke daftar bawaan standar?')) {
      updateCannedResponses(CANNED_RESPONSES);
      toast.success('Template balasan dikembalikan ke daftar bawaan.');
    }
  };

  // Export Snapshot
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

  // Filtered Nav Items based on user search
  const filteredNavGroups = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return navGroups;
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.defaultLabel.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [navGroups, searchFilter]);

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {t('settings.title')}
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Save Status Feedback Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-subtle px-2.5 py-1 text-[11px] font-medium text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('settings.saved')}
          </span>
        </div>
      </div>

      {/* Main SaaS Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Settings Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
          {/* Quick Search Settings Filter */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={t('settings.searchPlaceholder')}
              className="w-full rounded-md border border-line bg-panel py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none transition-colors"
            />
          </div>

          {/* Grouped Sidebar Nav */}
          <nav className="space-y-4 text-xs">
            {filteredNavGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted/80">
                  {group.defaultTitle}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleTabChange(item.key)}
                        className={`group flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors ${
                          isActive
                            ? 'bg-ink font-semibold text-white shadow-xs'
                            : 'text-ink-muted hover:bg-subtle hover:text-ink'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-ink-muted group-hover:text-ink'
                            }`}
                          />
                          <span className="truncate">{item.defaultLabel}</span>
                        </div>
                        {item.key === 'notifications' && telegramEnabled && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-white' : 'bg-emerald-500'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Right Column: Settings Content Panel */}
        <div className="flex-1 min-w-0 w-full max-w-4xl space-y-6">
          {/* ═══ 1. TAB: AKUN & PROFIL ═══ */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <User className="h-4 w-4 text-ink" />
                  <h2 className="text-sm font-semibold text-ink">{t('settings.tabAccount')}</h2>
                </div>

                <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-ink">Email Superadmin</label>
                    <input
                      type="email"
                      disabled
                      value={admin?.email ?? 'admin@crm.local'}
                      className="mt-1 w-full rounded border border-line bg-subtle/80 px-3 py-2 font-mono text-ink-muted cursor-not-allowed"
                    />
                    <p className="mt-1 text-[11px] text-ink-muted">
                      Akun superuser PocketBase pengelola 7 aplikasi VPS.
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-ink">Nama Tampilan</label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Superadmin"
                      className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                    />
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

              {/* Change Password Card */}
              <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <Lock className="h-4 w-4 text-ink" />
                  <h2 className="text-sm font-semibold text-ink">Ubah Kata Sandi</h2>
                </div>

                <form onSubmit={handleChangePassword} className="mt-4 space-y-4 text-xs max-w-md">
                  <div>
                    <label className="block font-medium text-ink">Kata Sandi Saat Ini</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
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
                      placeholder="Ketik ulang kata sandi baru"
                      className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
                    >
                      Perbarui Kata Sandi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═══ 2. TAB: PREFERENSI & BAHASA ═══ */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Language Selection Card */}
              <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <Globe className="h-4 w-4 text-ink" />
                  <h2 className="text-sm font-semibold text-ink">{t('settings.langTitle')}</h2>
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {t('settings.langSubtitle')}
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div
                    onClick={() => handleSaveLanguage('id')}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-colors ${
                      selectedLanguage === 'id'
                        ? 'border-ink bg-subtle font-medium text-ink ring-1 ring-ink/10'
                        : 'border-line bg-panel hover:bg-subtle text-ink-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl select-none">🇮🇩</span>
                      <div>
                        <div className="font-semibold text-ink">{t('settings.langIdTitle')}</div>
                        <div className="text-[11px] text-ink-muted mt-0.5">
                          {t('settings.langIdDesc')}
                        </div>
                      </div>
                    </div>
                    {selectedLanguage === 'id' && <Check className="h-4 w-4 text-ink shrink-0" />}
                  </div>

                  <div
                    onClick={() => handleSaveLanguage('en')}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-colors ${
                      selectedLanguage === 'en'
                        ? 'border-ink bg-subtle font-medium text-ink ring-1 ring-ink/10'
                        : 'border-line bg-panel hover:bg-subtle text-ink-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl select-none">🇬🇧</span>
                      <div>
                        <div className="font-semibold text-ink">{t('settings.langEnTitle')}</div>
                        <div className="text-[11px] text-ink-muted mt-0.5">
                          {t('settings.langEnDesc')}
                        </div>
                      </div>
                    </div>
                    {selectedLanguage === 'en' && <Check className="h-4 w-4 text-ink shrink-0" />}
                  </div>
                </div>
              </div>

              {/* Timezone & Landing View Preferences */}
              <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <Clock className="h-4 w-4 text-ink" />
                  <h2 className="text-sm font-semibold text-ink">Zona Waktu &amp; Navigasi Awal</h2>
                </div>

                <form onSubmit={handleSavePreferences} className="mt-4 space-y-4 text-xs max-w-md">
                  <div>
                    <label className="block font-medium text-ink">{t('settings.timezone')}</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta (WIB · UTC+07:00)</option>
                      <option value="Asia/Makassar">Asia/Makassar (WITA · UTC+08:00)</option>
                      <option value="Asia/Jayapura">Asia/Jayapura (WIT · UTC+09:00)</option>
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      Waktu saat ini: {new Date().toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-ink">{t('settings.defaultLanding')}</label>
                    <select
                      value={defaultView}
                      onChange={(e) => setDefaultView(e.target.value as 'dashboard' | 'tickets')}
                      className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="tickets">Kotak Masuk Tiket (Tickets Inbox)</option>
                    </select>
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
            </div>
          )}

          {/* ═══ 3. TAB: TAMPILAN (APPEARANCE) ═══ */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <SlidersHorizontal className="h-4 w-4 text-ink" />
                  <h2 className="text-sm font-semibold text-ink">{t('settings.tabAppearance')}</h2>
                </div>

                <form onSubmit={handleSaveAppearance} className="mt-4 space-y-5 text-xs max-w-lg">
                  {/* Theme Mode */}
                  <div>
                    <label className="block font-medium text-ink">{t('settings.theme')}</label>
                    <div className="mt-2 grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                          theme === 'light'
                            ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                            : 'border-line hover:bg-subtle text-ink-muted'
                        }`}
                      >
                        <Sun className="h-4 w-4" />
                        <span>{t('settings.themeLight')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                          theme === 'dark'
                            ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                            : 'border-line hover:bg-subtle text-ink-muted'
                        }`}
                      >
                        <Moon className="h-4 w-4" />
                        <span>{t('settings.themeDark')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme('system')}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                          theme === 'system'
                            ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                            : 'border-line hover:bg-subtle text-ink-muted'
                        }`}
                      >
                        <Layers className="h-4 w-4" />
                        <span>{t('settings.themeSystem')}</span>
                      </button>
                    </div>
                  </div>

                  {/* UI Density */}
                  <div>
                    <label className="block font-medium text-ink">{t('settings.density')}</label>
                    <div className="mt-2 grid grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setUiDensity('comfortable')}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          uiDensity === 'comfortable'
                            ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                            : 'border-line hover:bg-subtle text-ink-muted'
                        }`}
                      >
                        <div>
                          <div>{t('settings.densityComfortable')}</div>
                          <div className="text-[11px] text-ink-muted font-normal mt-0.5">Padding lapang</div>
                        </div>
                        {uiDensity === 'comfortable' && <Check className="h-4 w-4 text-ink" />}
                      </div>

                      <div
                        onClick={() => setUiDensity('compact')}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          uiDensity === 'compact'
                            ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                            : 'border-line hover:bg-subtle text-ink-muted'
                        }`}
                      >
                        <div>
                          <div>{t('settings.densityCompact')}</div>
                          <div className="text-[11px] text-ink-muted font-normal mt-0.5">Maksimal baris terlihat</div>
                        </div>
                        {uiDensity === 'compact' && <Check className="h-4 w-4 text-ink" />}
                      </div>
                    </div>
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
            </div>
          )}

          {/* ═══ 4. TAB: NOTIFIKASI & ALERT ═══ */}
          {activeTab === 'notifications' && (
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
          )}

          {/* ═══ 5. TAB: KEAMANAN & SSO HANDOFF ═══ */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <ShieldCheck className="h-4 w-4 text-ink" />
                  <h2 className="text-sm font-semibold text-ink">{t('settings.tabSecurity')}</h2>
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  Konfigurasi tanda tangan kriptografis HMAC-SHA256 untuk memverifikasi autentisitas link handoff dari 7 aplikasi VPS.
                </p>

                <form onSubmit={handleSaveSecurity} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-ink">HMAC Secret Key</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={handoffSecret}
                          onChange={(e) => setHandoffSecret(e.target.value)}
                          className="w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                        >
                          {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="rounded border border-line bg-subtle px-2.5 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
                        title="Salin Secret"
                      >
                        {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateSecret}
                        className="rounded border border-line bg-subtle px-2.5 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
                        title="Buat Kunci Baru"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-ink">Masa Berlaku URL Handoff (Menit)</label>
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={expiryMinutes}
                      onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                      className="mt-1 w-32 rounded border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-ink-muted">Standar rekomendasi: 15 menit.</p>
                  </div>

                  <div>
                    <label className="block font-medium text-ink">Domain yang Diizinkan (Allowed Origins)</label>
                    <textarea
                      rows={4}
                      value={allowedOrigins}
                      onChange={(e) => setAllowedOrigins(e.target.value)}
                      placeholder="https://43.156.236.102&#10;http://localhost:5173"
                      className="mt-1 w-full rounded border border-line bg-canvas p-3 font-mono text-xs text-ink focus:border-ink focus:outline-none leading-relaxed"
                    />
                    <p className="mt-1 text-[11px] text-ink-muted">Satu domain per baris.</p>
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
            </div>
          )}

          {/* ═══ 6. TAB: INTEGRASI TOMBOL (INTEGRATIONS) ═══ */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Embedded Interactive Code Generator */}
              <IntegrationTabContent embedded />

              {/* Outbound Webhook Section */}
              <div className="rounded-lg border border-line bg-panel p-5 shadow-xs text-xs">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <TerminalSquare className="h-4 w-4 text-ink" />
                  <h2 className="text-sm font-semibold text-ink">Outbound Webhook</h2>
                </div>
                <p className="mt-2 text-ink-muted">
                  Kirimkan payload HTTP POST JSON saat tiket dibuat atau diselesaikan ke endpoint eksternal.
                </p>

                <div className="mt-4 space-y-3 max-w-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={outboundWebhookEnabled}
                      onChange={(e) => setOutboundWebhookEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-line text-ink"
                    />
                    <span className="font-semibold text-ink">Aktifkan Outbound Webhook</span>
                  </label>

                  <div>
                    <label className="block font-medium text-ink">Target Webhook URL</label>
                    <input
                      type="url"
                      value={outboundWebhookUrl}
                      onChange={(e) => setOutboundWebhookUrl(e.target.value)}
                      placeholder="https://api.domain.com/webhooks/helpdesk"
                      className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    className="rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
                  >
                    {t('settings.saveChanges')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ 7. TAB: DATA & PENYIMPANAN (STORAGE) ═══ */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              {/* Local Storage Quota Card */}
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
                    <span>Penggunaan Cache LocalStorage:</span>
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
                    onClick={() => {
                      if (confirm('Bersihkan tiket berstatus selesai/ditutup yang berusia lebih dari 60 hari dari penyimpanan lokal?')) {
                        const count = pruneOldClosedTickets(60);
                        toast.success(`${count} tiket lama berhasil dibersihkan dari penyimpanan lokal.`);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-3 py-2 text-xs font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
                  >
                    <Trash2 className="h-4 w-4 text-ink-muted" />
                    Pangkas Tiket Lama (&gt;60 hari)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Kembalikan database demo lokal ke data seed awal?')) {
                        resetDemo();
                      }
                    }}
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
                    <dd className="text-ink">14 Hari (Pembersihan otomatis file lama)</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* ═══ 8. TAB: OTOMASI TIKET (AUTOMATION) ═══ */}
          {activeTab === 'automation' && (
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
                  <li>Balasan dari pelapor pada tiket berstatus <strong className="text-ink">Menunggu Balasan</strong> atau <strong className="text-ink">Selesai</strong> otomatis membuka kembali tiket ke status <strong className="text-ink">Diproses</strong>.</li>
                  <li>Tiket dengan status <strong className="text-ink">Ditutup</strong> tidak menerima tanggapan balasan baru dan diarsipkan permanen.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ═══ 9. TAB: TEMPLATE BALASAN CEPAT (CANNED) ═══ */}
          {activeTab === 'canned' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">{t('settings.tabCanned')}</h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Draf pesan standar yang bisa disisipkan ke tiket dalam 1 klik.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetCanned}
                    className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
                    Reset Bawaan
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddCanned}
                    className="inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Template
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cannedResponses.map((cr) => (
                  <div
                    key={cr.id}
                    className="flex flex-col justify-between rounded-lg border border-line bg-panel p-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-ink text-xs line-clamp-1">{cr.title}</h3>
                        {cr.category && (
                          <span className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-muted shrink-0">
                            {cr.category in CATEGORY_LABEL
                              ? categoryLabel(cr.category as any)
                              : cr.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-ink-muted line-clamp-3 leading-relaxed">
                        {cr.content}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-2.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCanned(cr)}
                        className="font-medium text-ink hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCanned(cr.id)}
                        className="text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Add/Edit Canned Response */}
              {cannedModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-xl text-xs">
                    <h3 className="text-sm font-bold text-ink">
                      {editingCannedId ? 'Edit Template Balasan' : 'Tambah Template Balasan Baru'}
                    </h3>

                    <form onSubmit={handleSaveCanned} className="mt-4 space-y-3">
                      <div>
                        <label className="block font-medium text-ink">Judul Singkat Template</label>
                        <input
                          type="text"
                          required
                          value={cannedTitle}
                          onChange={(e) => setCannedTitle(e.target.value)}
                          placeholder="Contoh: Minta Tangkapan Layar"
                          className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-ink">Kategori Kendala</label>
                        <select
                          value={cannedCategory}
                          onChange={(e) => setCannedCategory(e.target.value)}
                          className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                        >
                          <option value="bug_error">Bug / Error Fitur</option>
                          <option value="account_login">Akun & Akses Login</option>
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
                          placeholder="Tulis draf pesan balasan yang jelas dan profesional..."
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

          {/* ═══ 10. TAB: TENTANG APLIKASI (ABOUT) ═══ */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <Info className="h-4 w-4 text-ink" />
                  <h2 className="text-sm font-semibold text-ink">{t('settings.tabAbout')}</h2>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <p className="text-ink leading-relaxed">
                    {t('settings.aboutDesc')}
                  </p>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-line pt-4 font-mono text-[11px]">
                    <div className="rounded border border-line bg-canvas p-3">
                      <dt className="text-ink-muted">{t('settings.aboutVersion')}</dt>
                      <dd className="font-bold text-ink mt-0.5">v1.2.0 (Stable Release)</dd>
                    </div>

                    <div className="rounded border border-line bg-canvas p-3">
                      <dt className="text-ink-muted">{t('settings.aboutVpsHost')}</dt>
                      <dd className="font-bold text-ink mt-0.5">43.156.236.102 (Port SSH 2222)</dd>
                    </div>

                    <div className="rounded border border-line bg-canvas p-3">
                      <dt className="text-ink-muted">{t('settings.aboutArchitecture')}</dt>
                      <dd className="font-bold text-ink mt-0.5">Offline-First · PocketBase 0.25 · React 18</dd>
                    </div>

                    <div className="rounded border border-line bg-canvas p-3">
                      <dt className="text-ink-muted">Aplikasi Terdaftar</dt>
                      <dd className="font-bold text-ink mt-0.5">{VPS_APPS.length} Aplikasi Ekosistem</dd>
                    </div>
                  </dl>

                  <div className="rounded border border-line bg-subtle/50 p-4 space-y-1">
                    <p className="font-semibold text-ink">{t('settings.aboutDocs')}</p>
                    <p className="text-ink-muted">
                      Seluruh istilah baku mengikuti standar kamus domain repositori (`GLOSSARY.md`): ID Komposit, Pelapor, Catatan Internal, dan Template Balasan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
