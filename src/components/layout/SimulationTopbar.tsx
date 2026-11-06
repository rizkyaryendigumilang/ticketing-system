import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Crown, RotateCcw, Users } from 'lucide-react';
import { DEMO_ACCOUNTS, getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { compositeKeyOf } from '../../services/crmLogic';

export function SimulationTopbar() {
  const { admin, requester, connection, resetDemo } = useCrm();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const inAdminView = location.pathname.startsWith('/admin');
  const pbOnline = connection === 'online';

  const handleHandoff = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setOpen(false);
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

  // Which demo account is currently active (if any)
  const activeDemo = DEMO_ACCOUNTS.find(
    (d) => !inAdminView && requester?.compositeKey === compositeKeyOf(d.app, d.uid),
  );
  const activeApp = activeDemo ? getApp(activeDemo.app) : null;

  return (
    <div className="sticky top-0 z-40 flex h-9 w-full shrink-0 items-center justify-between gap-3 border-b border-rail-line bg-[#0E0F12] px-3 text-xs text-neutral-300">
      {/* LEFT: mode label + superadmin + user picker */}
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="shrink-0 font-mono text-[11px] text-neutral-500">SIMULASI</span>

        {/* Superadmin button */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors ${
            inAdminView && admin
              ? 'bg-amber-400 text-neutral-950'
              : 'bg-neutral-800 text-amber-300 hover:bg-neutral-700'
          }`}
        >
          <Crown className="h-3.5 w-3.5" />
          Superadmin CRM
        </button>

        <span className="h-3.5 w-px shrink-0 bg-neutral-800" />

        {/* Compact user-picker dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] transition-colors ${
              activeDemo
                ? 'border-white/40 bg-white/10 font-semibold text-white'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
            }`}
          >
            {activeDemo && activeApp ? (
              <>
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: activeApp.color }}
                />
                <span className="font-mono">[{activeApp.prefix}]</span>
                <span className="max-w-[120px] truncate">{activeDemo.uid}</span>
              </>
            ) : (
              <>
                <Users className="h-3 w-3" />
                <span>Pilih User</span>
              </>
            )}
            <ChevronDown
              className={`h-3 w-3 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded border border-neutral-800 bg-[#13161C] shadow-xl">
                <div className="border-b border-neutral-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                  Simulasi Klik Tombol Help
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {DEMO_ACCOUNTS.map((demo) => {
                    const app = getApp(demo.app);
                    const isCurrent = requester?.compositeKey === compositeKeyOf(demo.app, demo.uid);
                    return (
                      <button
                        key={`${demo.app}:${demo.uid}`}
                        type="button"
                        onClick={() => handleHandoff(demo)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] transition-colors hover:bg-neutral-800 ${
                          isCurrent ? 'bg-neutral-800/60' : ''
                        }`}
                      >
                        {/* App color dot + prefix */}
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                          style={{
                            backgroundColor: `${app?.color ?? '#888'}25`,
                            color: app?.color ?? '#888',
                          }}
                        >
                          {app?.prefix ?? demo.app}
                        </span>

                        {/* Identity */}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-neutral-200">
                            {demo.name}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-500">
                            {demo.uid} · {demo.role}
                          </span>
                        </span>

                        {/* Active indicator */}
                        {isCurrent && (
                          <span className="shrink-0 rounded bg-emerald-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                            Aktif
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT: PocketBase status + Reset */}
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="hidden items-center gap-1.5 font-mono text-[11px] sm:inline-flex"
          title={
            pbOnline
              ? 'Terhubung ke server PocketBase'
              : 'Mode Fallback Aktif — data tersimpan lokal, sinkron otomatis saat PocketBase menyala'
          }
        >
          <span className={`h-1.5 w-1.5 rounded-full ${pbOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-neutral-500">{pbOnline ? 'PB Online' : 'PB Fallback'}</span>
        </span>

        <button
          type="button"
          onClick={resetDemo}
          title="Kembalikan tiket & user ke data awal (seed)"
          className="inline-flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>
    </div>
  );
}
