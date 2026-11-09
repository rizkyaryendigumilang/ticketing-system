import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Crown, LogOut, RotateCcw, Settings, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { DEMO_ACCOUNTS, getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { compositeKeyOf } from '../../services/crmLogic';
import { useToast } from '../../context/ToastContext';

export function SimulationTopbar() {
  const { admin, requester, connection, resetDemo, logoutRequester } = useCrm();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const inAdminView = location.pathname.startsWith('/admin');
  const inPortalView = location.pathname.startsWith('/portal');
  const pbOnline = connection === 'online';

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleHandoff = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setOpen(false);
    toast.info(`Beralih simulasi ke user: ${demo.name} (${demo.role})`);
    navigate(
      `/handoff?${new URLSearchParams({
        app: demo.app,
        uid: demo.uid,
        name: demo.name,
        role: demo.role,
        from_url: demo.fromUrl ?? '',
      }).toString()}`,
    );
  };

  const handleReset = () => {
    resetDemo();
    toast.success('Data seed tiket dan user berhasil dikembalikan ke kondisi awal');
  };

  const handleLogoutUser = () => {
    setOpen(false);
    logoutRequester();
    toast.info('Sesi user telah ditutup');
    navigate('/login');
  };

  // Determine current active user details (works for demo accounts or dynamic JIT accounts)
  const isUserActive = !inAdminView && !!requester;
  const activeApp = requester ? getApp(requester.appId) : null;

  return (
    <div className="sticky top-0 z-40 flex h-9 w-full shrink-0 items-center justify-between gap-3 border-b border-rail-line bg-[#0E0F12] px-3 text-xs text-neutral-300">
      {/* LEFT: Simulation Mode Pill + Superadmin CRM Button + User Switcher */}
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="shrink-0 font-mono text-[10px] font-semibold tracking-wider text-neutral-500">
          SIMULASI
        </span>

        {/* Superadmin CRM Button */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors ${
            inAdminView && admin
              ? 'bg-amber-400 text-neutral-950 font-semibold shadow-sm'
              : 'bg-neutral-800/90 text-amber-300 hover:bg-neutral-700'
          }`}
          title="Buka Meja Kerja Superadmin (Owner VPS)"
        >
          <Crown className="h-3.5 w-3.5" />
          <span>Superadmin CRM</span>
        </button>

        <span className="h-3.5 w-px shrink-0 bg-neutral-800" />

        {/* User Switcher Dropdown */}
        <div ref={wrapperRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] transition-colors ${
              isUserActive
                ? 'border-neutral-600 bg-neutral-800 text-neutral-100 shadow-sm'
                : 'border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
            title="Pilih akun user untuk simulasi handoff tombol Help"
          >
            {isUserActive && activeApp ? (
              <>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: activeApp.color }}
                />
                <span className="font-mono font-semibold" style={{ color: activeApp.color }}>
                  [{activeApp.prefix}]
                </span>
                <span className="max-w-[140px] truncate font-medium">
                  {requester.name}
                </span>
                <span className="hidden font-mono text-[10px] text-neutral-400 sm:inline">
                  ({requester.externalUid})
                </span>
              </>
            ) : (
              <>
                <Users className="h-3.5 w-3.5 text-neutral-400" />
                <span>Simulasi User (7 Aplikasi)</span>
              </>
            )}
            <ChevronDown
              className={`h-3 w-3 shrink-0 text-neutral-400 transition-transform duration-150 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-lg border border-neutral-700/80 bg-[#14181F] shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-3 py-2 text-[11px]">
                <span className="font-semibold uppercase tracking-wider text-neutral-400">
                  Simulasi Klik Tombol Help (SSO)
                </span>
                <span className="font-mono text-[10px] text-neutral-500">
                  {DEMO_ACCOUNTS.length} Akun Demo
                </span>
              </div>

              {/* Active User Quick Status Banner */}
              {isUserActive && (
                <div className="flex items-center justify-between border-b border-neutral-800 bg-emerald-950/30 px-3 py-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-200">
                      Aktif: <strong className="font-medium text-white">{requester?.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoutUser}
                    className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300 hover:bg-red-950 hover:text-red-300"
                    title="Keluar dari sesi user ini"
                  >
                    <LogOut className="h-2.5 w-2.5" />
                    Logout
                  </button>
                </div>
              )}

              {/* User List */}
              <div className="max-h-80 divide-y divide-neutral-800/60 overflow-y-auto py-1">
                {DEMO_ACCOUNTS.map((demo) => {
                  const app = getApp(demo.app);
                  const isCurrent =
                    !inAdminView &&
                    requester?.compositeKey === compositeKeyOf(demo.app, demo.uid);

                  return (
                    <button
                      key={`${demo.app}:${demo.uid}`}
                      type="button"
                      onClick={() => handleHandoff(demo)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-neutral-800/80 ${
                        isCurrent ? 'bg-neutral-800/70' : ''
                      }`}
                    >
                      {/* App prefix badge */}
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                        style={{
                          backgroundColor: `${app?.color ?? '#888'}25`,
                          color: app?.color ?? '#888',
                        }}
                      >
                        {app?.prefix ?? demo.app}
                      </span>

                      {/* User identity & role */}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-semibold text-neutral-200">
                            {demo.name}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-500">
                            ({demo.uid})
                          </span>
                        </span>
                        <span className="block truncate text-[11px] text-neutral-400">
                          {app?.name} · {demo.role}
                        </span>
                      </span>

                      {/* Active indicator badge */}
                      {isCurrent && (
                        <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                          Aktif
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer action to go to integration page */}
              <div className="border-t border-neutral-800 bg-neutral-900/60 p-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/admin/integrations');
                  }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded py-1 text-center font-mono text-[11px] text-neutral-400 hover:text-white"
                >
                  <Settings className="h-3 w-3 text-neutral-400" />
                  <span>Buka Generator Tombol Help & Simulator JIT →</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: PocketBase status indicator + Reset Seed Button */}
      <div className="flex shrink-0 items-center gap-2.5">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[11px]"
          title={
            pbOnline
              ? 'Terhubung langsung ke server database PocketBase VPS (43.156.236.102)'
              : 'Mode Fallback Aktif — Data tersimpan otomatis di browser, sinkron ke PocketBase saat server tersedia'
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              pbOnline ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="hidden text-neutral-400 sm:inline">
            {pbOnline ? 'PB Online' : 'PB Fallback'}
          </span>
        </span>

        <span className="hidden h-3.5 w-px bg-neutral-800 sm:inline-block" />

        <button
          type="button"
          onClick={handleReset}
          title="Kembalikan tiket & user ke data awal (seed)"
          className="inline-flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-400 transition-colors hover:border-neutral-700 hover:text-neutral-200"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Seed</span>
        </button>
      </div>
    </div>
  );
}
