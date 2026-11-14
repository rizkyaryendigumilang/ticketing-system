import { type ComponentType, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChevronDown,
  ExternalLink,
  Globe,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { computeStats, countByApp } from '../../services/crmLogic';
import { flush, isSuperuser } from '../../services/pbClient';
import { getNotifications, subscribeNotifications, syncTicketAlerts } from '../../services/notificationService';
import { NotificationCenterDrawer } from '../notifications/NotificationCenterDrawer';
import { CommandPalette } from '../common/CommandPalette';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';

type NavItem = {
  to: string;
  end: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badgeKey?: 'open';
};

export function AdminCrmLayout() {
  const { data, admin, logoutAdmin, pendingAdminChanges, connection, t, lang, setLanguage } = useCrm();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [appsExpanded, setAppsExpanded] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => getNotifications().filter((n) => !n.read).length);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    syncTicketAlerts(data.tickets);
    setUnreadCount(getNotifications().filter((n) => !n.read).length);
    return subscribeNotifications(() => {
      setUnreadCount(getNotifications().filter((n) => !n.read).length);
    });
  }, [data.tickets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems: NavItem[] = [
    { to: '/admin', end: true, icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/admin/tickets', end: false, icon: Inbox, label: t('nav.tickets'), badgeKey: 'open' },
    { to: '/admin/analytics', end: false, icon: BarChart3, label: t('nav.analytics') },
    { to: '/admin/settings', end: false, icon: Settings, label: t('nav.settings') },
  ];

  const handleTriggerSync = async () => {
    if (isSuperuser()) {
      toast.info(t('nav.syncTrigger'));
      await flush();
    } else {
      toast.info(t('nav.syncNotAdmin'));
    }
  };

  const stats = computeStats(data.tickets);
  const appMatrix = countByApp(data.tickets, VPS_APPS.map((a) => a.id));
  const openCounts = Object.fromEntries(VPS_APPS.map((a) => [a.id, appMatrix[a.id]?.open ?? 0]));
  const badgeFor = { open: stats.open > 0 ? stats.open : null } as const;

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login');
  };

  const portalUrl = `${(import.meta.env.BASE_URL || '/').replace(/\/+$/, '')}/portal`;

  // Initials from admin name, e.g. "Super Admin" → "SA"
  const initials = (admin?.name ?? 'Superadmin')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'SA';

  const pageTitle = (() => {
    const p = location.pathname;
    if (p === '/admin') return t('nav.dashboard');
    if (p.startsWith('/admin/tickets')) return t('nav.tickets');
    if (p.startsWith('/admin/analytics')) return t('nav.analytics');
    if (p.startsWith('/admin/settings')) return t('nav.settings');
    return t('nav.crm');
  })();

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* ═══ PRIMARY ICON RAIL (hidden on mobile, visible md:flex, ~52px wide) ═══ */}
      <aside className="hidden md:flex w-13 shrink-0 flex-col items-center border-r border-rail-line bg-rail py-3 gap-1.5 select-none">
          {/* Logo tile - Apple squircle */}
          <div
            title="Helpdesk App"
            className="mb-2 flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-b from-white to-neutral-200 text-xs font-bold text-neutral-950 shadow-xs transition-transform active:scale-95"
          >
            H
          </div>

          {/* Nav icons */}
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-xs font-semibold'
                    : 'text-neutral-400 hover:bg-rail-hover hover:text-neutral-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
            </NavLink>
          ))}

          {/* Quick link to Customer Portal */}
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Portal Pelapor (Tab Baru)"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-emerald-400 transition-all hover:bg-rail-hover hover:text-emerald-300 active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          <div className="flex-1" />

          {/* Sidebar collapse toggle */}
          <button
            type="button"
            title={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-all hover:bg-rail-hover hover:text-neutral-200 active:scale-95"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>

          {/* Admin avatar + logout */}
          <button
            type="button"
            title={`${admin?.name ?? 'Superadmin'} · Keluar`}
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-800 border border-white/10 text-[11px] font-semibold text-white transition-all hover:border-red-500/50 hover:bg-red-600 active:scale-95"
          >
            {initials}
          </button>
        </aside>

        {/* ═══ SECONDARY TEXT SIDEBAR (desktop only, collapsible) ═══ */}
        {sidebarOpen && (
          <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-rail-line bg-rail overflow-hidden select-none">
            {/* Brand */}
            <div className="border-b border-rail-line px-4 py-3.5">
              <p className="text-sm font-semibold tracking-tight text-white">{t('nav.brand')}</p>
              <p className="mt-0.5 text-[11px] font-medium text-neutral-400">{t('nav.crm')}</p>
            </div>

            {/* Primary nav */}
            <nav className="space-y-1 px-2.5 py-2.5">
              {navItems.map(({ to, end, icon: Icon, label, badgeKey }) => {
                const badge = badgeKey ? badgeFor[badgeKey] : null;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-white/12 text-white font-semibold shadow-xs'
                          : 'text-neutral-400 hover:bg-rail-hover hover:text-neutral-100'
                      }`
                    }
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </span>
                    {badge != null && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold leading-none text-white tabular-nums shadow-xs">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={t('nav.portalTooltip')}
                className="mt-1 flex items-center justify-between rounded-lg border border-rail-line bg-white/[0.04] px-2.5 py-2 text-xs font-medium text-emerald-400 transition-all hover:bg-white/[0.08] hover:text-emerald-300"
              >
                <span className="inline-flex items-center gap-2.5">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {t('nav.portal')}
                </span>
                <span className="text-[10px] opacity-75">↗</span>
              </a>
            </nav>

            {/* 7 Ecosystem Apps — collapsible */}
            <div className="flex-1 overflow-y-auto no-scrollbar border-t border-rail-line">
              <button
                type="button"
                onClick={() => setAppsExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <span>{t('nav.ecosystem')}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${appsExpanded ? '' : '-rotate-90'}`}
                />
              </button>

              {appsExpanded && (
                <div className="space-y-0.5 px-2 pb-3">
                  {VPS_APPS.map((app) => {
                    const count = openCounts[app.id] ?? 0;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => navigate(`/admin/tickets?app=${app.id}`)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-neutral-400 transition-all duration-150 hover:bg-rail-hover hover:text-neutral-100"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: count > 0 ? '#EF4444' : app.color }}
                          />
                          <span className="truncate">{app.name}</span>
                        </span>
                        <span
                          className={`ml-2 shrink-0 text-[10px] tabular-nums ${
                            count > 0
                              ? 'rounded-full bg-red-500/90 px-1.5 py-0.5 font-semibold text-white'
                              : 'text-neutral-500'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin footer */}
            <div className="border-t border-rail-line p-3">
              <PwaInstallPrompt />
              <div className="mb-2">
                <SyncStatusIndicator />
              </div>
              {pendingAdminChanges > 0 && (
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  className="mb-2 w-full text-left rounded bg-amber-500/15 hover:bg-amber-500/25 px-2 py-1 text-[11px] text-amber-300 transition-colors flex items-center justify-between gap-1 group"
                  title="Klik untuk mencoba sinkronisasi antrean ke PocketBase"
                >
                  <span className="truncate">{pendingAdminChanges} {t('nav.pendingSync')}</span>
                  <RefreshCw className="h-3 w-3 shrink-0 text-amber-400 group-hover:rotate-180 transition-transform duration-300" />
                </button>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-medium text-white">
                      {admin?.name ?? t('nav.adminTitle')}
                    </p>
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        connection === 'online' ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                      title={`Koneksi PocketBase: ${connection}`}
                    />
                  </div>
                  <p className="truncate font-mono text-[11px] text-neutral-500">
                    {admin?.email ?? 'admin@crm.local'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title={t('nav.logout')}
                  className="rounded p-1.5 text-neutral-500 hover:bg-rail-hover hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ═══ MOBILE SLIDE-OVER DRAWER (md:hidden) ═══ */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              className="w-72 max-w-[82vw] h-full bg-rail text-white flex flex-col shadow-2xl animate-slide-right select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / Brand */}
              <div className="flex items-center justify-between border-b border-rail-line px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-to-b from-white to-neutral-200 text-xs font-bold text-neutral-950">
                    H
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-tight text-white">{t('nav.brand')}</p>
                    <p className="text-[10px] text-neutral-400">{t('nav.crm')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                  aria-label="Tutup Menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav list */}
              <nav className="flex-1 overflow-y-auto space-y-1 p-3">
                {navItems.map(({ to, end, icon: Icon, label, badgeKey }) => {
                  const badge = badgeKey ? badgeFor[badgeKey] : null;
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-neutral-400 hover:bg-rail-hover hover:text-white'
                        }`
                      }
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                      </span>
                      {badge != null && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}

                {/* Ecosystem Apps in Mobile Drawer */}
                <div className="pt-3 border-t border-rail-line/60 mt-3">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2 px-1">
                    {t('nav.ecosystem')}
                  </span>
                  <div className="space-y-1">
                    {VPS_APPS.map((app) => {
                      const count = openCounts[app.id] ?? 0;
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => {
                            navigate(`/admin/tickets?app=${app.id}`);
                            setMobileDrawerOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-neutral-400 hover:bg-rail-hover hover:text-neutral-100"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: count > 0 ? '#EF4444' : app.color }}
                            />
                            <span className="truncate">{app.name}</span>
                          </span>
                          {count > 0 && (
                            <span className="rounded-full bg-red-500/90 px-1.5 py-0.2 text-[9px] font-semibold text-white">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </nav>

              {/* Mobile Footer */}
              <div className="border-t border-rail-line p-3 space-y-2">
                <PwaInstallPrompt />
                <SyncStatusIndicator />
                <div className="flex items-center justify-between pt-1">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">{admin?.name ?? 'Admin'}</p>
                    <p className="truncate font-mono text-[10px] text-neutral-400">{admin?.email ?? 'admin@crm.local'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg p-1.5 text-neutral-400 hover:text-red-400"
                    title="Keluar"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ MAIN WORKSPACE WITH MODERN APPLE TOP TOOLBAR ═══ */}
        <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Header Toolbar */}
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel/85 px-4 sm:px-6 backdrop-blur-md shadow-xs select-none">
            {/* Left: Mobile hamburger or Context Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink hover:bg-subtle active:scale-95 transition-all shadow-2xs"
                title="Buka Menu"
                aria-label="Buka Menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Desktop sidebar toggle when collapsed */}
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="hidden md:flex mr-1 h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:border-line-strong hover:text-ink hover:bg-subtle transition-all active:scale-95 shadow-2xs"
                  title="Buka sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              )}
              <span className="text-xs font-medium text-ink-muted/80 hidden sm:inline">Helpdesk CRM</span>
              <span className="text-ink-faint hidden sm:inline">/</span>
              <span className="text-xs font-semibold text-ink tracking-tight truncate">{pageTitle}</span>
            </div>

            {/* Center: Global Spotlight Search Bar (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group mx-2 flex h-9 w-48 sm:w-72 md:w-88 max-w-sm items-center justify-between rounded-xl border border-line bg-subtle/80 px-3 text-xs text-ink-muted shadow-2xs hover:border-line-strong hover:bg-panel transition-all duration-150 active:scale-[0.99]"
              title="Cari tiket atau perintah (Ctrl+K)"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Search className="h-3.5 w-3.5 text-ink-faint group-hover:text-ink transition-colors shrink-0" />
                <span className="truncate text-ink-faint group-hover:text-ink-muted transition-colors">
                  {t('nav.searchPlaceholder')}
                </span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-medium text-ink-muted shadow-2xs shrink-0">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {/* Right: Notifications & Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Notification Center Trigger */}
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel text-ink-muted shadow-2xs hover:border-line-strong hover:bg-subtle hover:text-ink active:scale-95 transition-all duration-150"
                title={`Notifikasi ${unreadCount > 0 ? `(${unreadCount} baru)` : ''}`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-xs tabular-nums">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Theme Mode Toggle (Light / Dark) */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel text-ink-muted shadow-2xs hover:border-line-strong hover:bg-subtle hover:text-ink active:scale-95 transition-all duration-150"
                title={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
                aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Quick Language Toggle Button (ID / EN) */}
              <button
                type="button"
                onClick={() => setLanguage(lang === 'id' ? 'en' : 'id')}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-panel px-2.5 text-xs font-semibold text-ink-muted shadow-2xs hover:border-line-strong hover:bg-subtle hover:text-ink active:scale-95 transition-all duration-150"
                title={lang === 'id' ? 'Switch interface to English' : 'Ganti antarmuka ke Bahasa Indonesia'}
                aria-label={lang === 'id' ? 'Switch interface to English' : 'Ganti antarmuka ke Bahasa Indonesia'}
              >
                <Globe className="h-3.5 w-3.5 text-ink-faint" />
                <span className="font-mono text-[11px] font-bold text-ink uppercase">{lang}</span>
              </button>

              {/* Quick Link to Portal */}
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Portal Pelapor di Tab Baru"
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/20 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/30 active:scale-95 transition-all duration-150 shadow-2xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{t('nav.portalShort')}</span>
              </a>

              {/* Admin Avatar Chip */}
              <div className="flex items-center gap-2 pl-2 border-l border-line">
                <div
                  title={`${admin?.name ?? 'Superadmin'} (${admin?.email ?? 'admin@crm.local'})`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-[11px] font-semibold text-white shadow-xs cursor-default select-none"
                >
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {/* Main Workspace Body */}
          <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation Bar (md:hidden) */}
          <nav
            aria-label="Navigasi Bawah"
            className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-panel/95 backdrop-blur-xl border-t border-line safe-bottom flex items-center justify-around px-1 select-none shadow-lg pt-1"
          >
            {navItems.map(({ to, end, icon: Icon, label, badgeKey }) => {
              const badge = badgeKey ? badgeFor[badgeKey] : null;
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-[10px] font-medium transition-colors ${
                      isActive ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink'
                    }`
                  }
                >
                  <div className="relative">
                    <Icon className="h-4 w-4" />
                    {badge != null && (
                      <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white tabular-nums">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="truncate max-w-[64px]">{label.split(' ')[0]}</span>
                </NavLink>
              );
            })}
            {/* 5th item: More / Ecosystem menu */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-[10px] font-medium text-ink-muted hover:text-ink transition-colors"
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </button>
          </nav>
        </div>

        {/* Global Command Palette */}
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

        {/* In-app Notification Center Drawer */}
        <NotificationCenterDrawer
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
    </div>
  );
}
