import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Inbox,
  LayoutGrid,
  LogOut,
  TerminalSquare,
  Users,
} from 'lucide-react';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { SimulationTopbar } from './SimulationTopbar';

export function AdminCrmLayout() {
  const { currentUser, openCounts, stats, logout } = useCrm();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <SimulationTopbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Command Rail */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-rail-line bg-rail text-neutral-200">
          <div className="flex items-center justify-between border-b border-rail-line px-4 py-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white font-mono text-xs font-bold text-neutral-950">
                  H
                </span>
                <span className="text-sm font-semibold tracking-tight text-white">
                  VPS Helpdesk
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-neutral-400">
                7 Go-Live Apps · Internal CRM
              </p>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-0.5 px-2.5 py-3">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center justify-between rounded px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white/12 text-white'
                    : 'text-neutral-400 hover:bg-rail-hover hover:text-neutral-200'
                }`
              }
            >
              <span className="inline-flex items-center gap-2.5">
                <LayoutGrid className="h-4 w-4" />
                Peta Kesehatan Aplikasi
              </span>
            </NavLink>

            <NavLink
              to="/admin/tickets"
              className={({ isActive }) =>
                `flex items-center justify-between rounded px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white/12 text-white'
                    : 'text-neutral-400 hover:bg-rail-hover hover:text-neutral-200'
                }`
              }
            >
              <span className="inline-flex items-center gap-2.5">
                <Inbox className="h-4 w-4" />
                Unified Inbox & Kanban
              </span>
              {stats.open > 0 && (
                <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none text-white tabular-nums">
                  {stats.open}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/admin/contacts"
              className={({ isActive }) =>
                `flex items-center justify-between rounded px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white/12 text-white'
                    : 'text-neutral-400 hover:bg-rail-hover hover:text-neutral-200'
                }`
              }
            >
              <span className="inline-flex items-center gap-2.5">
                <Users className="h-4 w-4" />
                Direktori Kontak User
              </span>
            </NavLink>

            <NavLink
              to="/admin/integrations"
              className={({ isActive }) =>
                `flex items-center justify-between rounded px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white/12 text-white'
                    : 'text-neutral-400 hover:bg-rail-hover hover:text-neutral-200'
                }`
              }
            >
              <span className="inline-flex items-center gap-2.5">
                <TerminalSquare className="h-4 w-4" />
                Integrasi Tombol Help
              </span>
            </NavLink>
          </nav>

          {/* 7 Ecosystem Apps Quick Filter */}
          <div className="mt-2 flex-1 overflow-y-auto border-t border-rail-line px-3 py-3">
            <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-neutral-400">
              <span>Ekosistem Aplikasi (7)</span>
              <span className="font-mono">Open</span>
            </div>
            <div className="space-y-0.5">
              {VPS_APPS.map((app) => {
                const openCount = openCounts[app.id] ?? 0;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => navigate(`/admin/tickets?app=${app.id}`)}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-neutral-300 transition-colors hover:bg-rail-hover hover:text-white"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: openCount > 0 ? '#EF4444' : app.color,
                        }}
                      />
                      <span className="truncate">{app.name}</span>
                    </span>
                    <span
                      className={`ml-2 text-[11px] tabular-nums ${
                        openCount > 0
                          ? 'rounded bg-red-600 px-1.5 py-0.2 font-semibold text-white'
                          : 'text-neutral-500'
                      }`}
                    >
                      {openCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Superadmin Footer */}
          <div className="border-t border-rail-line p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">
                  {currentUser?.name ?? 'Superadmin VPS'}
                </p>
                <p className="truncate font-mono text-[11px] text-neutral-400">
                  {currentUser?.email ?? 'admin@crm.local'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar sesi"
                className="rounded p-1.5 text-neutral-400 hover:bg-rail-hover hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
