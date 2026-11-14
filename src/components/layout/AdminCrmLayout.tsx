import { type ComponentType, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChevronDown,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
} from 'lucide-react';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { useToast } from '../../context/ToastContext';
import { computeStats, countByApp } from '../../services/crmLogic';
import { flush, isSuperuser } from '../../services/pbClient';
import { getNotifications, subscribeNotifications, syncTicketAlerts } from '../../services/notificationService';
import { NotificationCenterDrawer } from '../notifications/NotificationCenterDrawer';
import { CommandPalette } from '../common/CommandPalette';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';

type NavItem = {
  to: string;
  end: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badgeKey?: 'open';
};

export function AdminCrmLayout() {
  const { data, admin, logoutAdmin, pendingAdminChanges, connection, t } = useCrm();
  const toast = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appsExpanded, setAppsExpanded] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => getNotifications().filter((n) => !n.read).length);

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
    { to: '/admin/analytics', end: false, icon: BarChart3, label: 'Analitik & Laporan' },
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

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* ═══ PRIMARY ICON RAIL (always visible, ~48px wide) ═══ */}
      <aside className="flex w-12 shrink-0 flex-col items-center border-r border-rail-line bg-rail py-3 gap-1">
          {/* Logo tile */}
          <div
            title="Helpdesk App"
            className="mb-2 flex h-7 w-7 select-none items-center justify-center rounded bg-white font-mono text-xs font-bold text-neutral-950"
          >
            H
          </div>

          {/* Command Palette Trigger */}
          <button
            type="button"
            title="Pencarian & Perintah Cepat (Ctrl+K)"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-rail-hover hover:text-white"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notification Center Trigger */}
          <button
            type="button"
            title={`Pusat Notifikasi & Alert ${unreadCount > 0 ? `(${unreadCount} belum dibaca)` : ''}`}
            onClick={() => setNotificationsOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-rail-hover hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </button>

          {/* Nav icons */}
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `flex h-9 w-9 items-center justify-center rounded transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-neutral-500 hover:bg-rail-hover hover:text-neutral-200'
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
            className="flex h-9 w-9 items-center justify-center rounded text-emerald-400 transition-colors hover:bg-rail-hover hover:text-emerald-300"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          <div className="flex-1" />

          {/* Sidebar collapse toggle */}
          <button
            type="button"
            title={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-rail-hover hover:text-neutral-200"
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-bold text-white transition-colors hover:bg-red-600"
          >
            {initials}
          </button>
        </aside>

        {/* ═══ SECONDARY TEXT SIDEBAR (collapsible) ═══ */}
        {sidebarOpen && (
          <aside className="flex w-56 shrink-0 flex-col border-r border-rail-line bg-rail overflow-hidden">
            {/* Brand */}
            <div className="border-b border-rail-line px-4 py-3.5">
              <p className="text-sm font-semibold tracking-tight text-white">{t('nav.brand')}</p>
              <p className="mt-0.5 font-mono text-[11px] text-neutral-500">{t('nav.crm')}</p>
            </div>

            {/* Primary nav */}
            <nav className="space-y-0.5 px-2 py-2">
              {navItems.map(({ to, end, icon: Icon, label, badgeKey }) => {
                const badge = badgeKey ? badgeFor[badgeKey] : null;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded px-2.5 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-white/12 text-white'
                          : 'text-neutral-400 hover:bg-rail-hover hover:text-neutral-200'
                      }`
                    }
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {label}
                    </span>
                    {badge != null && (
                      <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-white tabular-nums">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="mt-1 flex w-full items-center justify-between rounded px-2.5 py-2 text-xs font-medium text-neutral-400 hover:bg-rail-hover hover:text-neutral-200 transition-colors"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Bell className="h-3.5 w-3.5 shrink-0" />
                  Notifikasi & Alert
                </span>
                {unreadCount > 0 && (
                  <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={t('nav.portalTooltip')}
                className="mt-1 flex items-center justify-between rounded border border-rail-line bg-white/5 px-2.5 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-white/10 hover:text-emerald-300"
              >
                <span className="inline-flex items-center gap-2.5">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {t('nav.portal')}
                </span>
                <span className="font-mono text-[10px] opacity-75">↗</span>
              </a>
            </nav>

            {/* 7 Ecosystem Apps — collapsible */}
            <div className="flex-1 overflow-y-auto no-scrollbar border-t border-rail-line">
              <button
                type="button"
                onClick={() => setAppsExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-[11px] font-medium text-neutral-400 hover:text-neutral-300"
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
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-neutral-400 transition-colors hover:bg-rail-hover hover:text-neutral-200"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: count > 0 ? '#EF4444' : app.color }}
                          />
                          <span className="truncate">{app.name}</span>
                        </span>
                        <span
                          className={`ml-2 shrink-0 font-mono text-[10px] tabular-nums ${
                            count > 0
                              ? 'rounded bg-red-600 px-1.5 py-0.5 font-semibold text-white'
                              : 'text-neutral-600'
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

        {/* ═══ MAIN WORKSPACE ═══ */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

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
