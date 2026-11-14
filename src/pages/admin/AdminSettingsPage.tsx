import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  Clock,
  Database,
  Globe,
  HelpCircle,
  History,
  Info,
  MessageSquareQuote,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { TranslationKey } from '../../i18n/translations';
import { AccountTab } from '../../components/crm-admin/settings/AccountTab';
import { PreferencesTab } from '../../components/crm-admin/settings/PreferencesTab';
import { AppearanceTab } from '../../components/crm-admin/settings/AppearanceTab';
import { NotificationsTab } from '../../components/crm-admin/settings/NotificationsTab';
import { SecurityTab } from '../../components/crm-admin/settings/SecurityTab';
import { IntegrationsTab } from '../../components/crm-admin/settings/IntegrationsTab';
import { StorageTab } from '../../components/crm-admin/settings/StorageTab';
import { AutomationsTab } from '../../components/crm-admin/settings/AutomationsTab';
import { CannedResponsesTab } from '../../components/crm-admin/settings/CannedResponsesTab';
import { AboutSystemTab } from '../../components/crm-admin/settings/AboutSystemTab';
import { TeamTab } from '../../components/crm-admin/settings/TeamTab';
import { ContactsTab } from '../../components/crm-admin/settings/ContactsTab';
import { SupportTab } from '../../components/crm-admin/settings/SupportTab';
import { AuditLogTab } from '../../components/crm-admin/settings/AuditLogTab';

export type TabKey =
  | 'account'
  | 'preferences'
  | 'appearance'
  | 'notifications'
  | 'team'
  | 'contacts'
  | 'security'
  | 'audit'
  | 'integrations'
  | 'storage'
  | 'automation'
  | 'canned'
  | 'support'
  | 'about';

interface NavItemDef {
  key: TabKey;
  labelKey: TranslationKey;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavGroupDef {
  titleKey: TranslationKey;
  defaultTitle: string;
  items: NavItemDef[];
}

export function AdminSettingsPage() {
  const { settings, t } = useCrm();
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
        titleKey: 'settings.groupTeam',
        defaultTitle: 'Tim & Pelapor',
        items: [
          {
            key: 'team',
            labelKey: 'settings.tabTeam',
            defaultLabel: 'Tim & Otoritas',
            icon: UserCheck,
            description: 'Operator helpdesk, hak akses RBAC, dan undangan',
          },
          {
            key: 'contacts',
            labelKey: 'settings.tabContacts',
            defaultLabel: 'Kontak Pelapor',
            icon: Users,
            description: 'Daftar pelapor terdaftar dari 7 aplikasi ekosistem',
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
            key: 'audit',
            labelKey: 'settings.tabAudit',
            defaultLabel: 'Log Audit & Kepatuhan',
            icon: History,
            description: 'Riwayat mutasi status tiket, peran tim, dan ekspor data',
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
        defaultTitle: 'Operasional & Bantuan',
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
            key: 'support',
            labelKey: 'settings.tabSupport',
            defaultLabel: 'Bantuan & FAQ',
            icon: HelpCircle,
            description: 'Tanya jawab umum, panduan solusi, dan eskalasi',
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

      {/* Mobile Horizontal Pill Navigation (lg:hidden) */}
      <div className="lg:hidden w-full overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        <div className="flex gap-1.5 min-w-max">
          {navGroups.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            const label = t(item.labelKey) || item.defaultLabel;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabChange(item.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? 'bg-ink text-white font-semibold shadow-xs'
                    : 'bg-panel border border-line text-ink-muted hover:text-ink hover:bg-subtle'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SaaS Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Settings Sidebar Navigation (Desktop only) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-4">
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
                  {t(group.titleKey) || group.defaultTitle}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    const label = t(item.labelKey) || item.defaultLabel;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleTabChange(item.key)}
                        className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all duration-150 active:scale-[0.98] ${
                          isActive
                            ? 'bg-ink font-semibold text-white shadow-xs'
                            : 'text-ink-muted hover:bg-subtle hover:text-ink'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                              isActive ? 'text-white' : 'text-ink-muted group-hover:text-ink'
                            }`}
                          />
                          <span className="truncate">{label}</span>
                        </div>
                        {item.key === 'notifications' && settings.telegramEnabled && (
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

        {/* Right Column: Dynamic Settings Tab Content */}
        <div className="flex-1 min-w-0 w-full">
          {activeTab === 'account' && <AccountTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'contacts' && <ContactsTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'audit' && <AuditLogTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'storage' && <StorageTab />}
          {activeTab === 'automation' && <AutomationsTab />}
          {activeTab === 'canned' && <CannedResponsesTab />}
          {activeTab === 'support' && <SupportTab />}
          {activeTab === 'about' && <AboutSystemTab />}
        </div>
      </div>
    </div>
  );
}
