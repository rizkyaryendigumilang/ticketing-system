import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, ExternalLink, RotateCcw } from 'lucide-react';
import { DEMO_ACCOUNTS, getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { compositeKeyOf, handoffPath } from '../../services/crmLogic';

export function SimulationTopbar() {
  const { admin, requester, connection, resetDemo } = useCrm();
  const navigate = useNavigate();
  const location = useLocation();

  const inAdminView = location.pathname.startsWith('/admin');
  const pbOnline = connection === 'online';

  const handleOpenSuperadmin = () => navigate('/login');

  const handleHandoff = (demo: (typeof DEMO_ACCOUNTS)[number]) =>
    navigate(`/handoff?${new URLSearchParams({ app: demo.app, uid: demo.uid, name: demo.name, role: demo.role, from_url: demo.fromUrl ?? '' }).toString()}`);

  return (
    <div className="sticky top-0 z-40 flex h-9 w-full items-center justify-between gap-2 border-b border-rail-line bg-[#0E0F12] px-3 text-xs text-neutral-300">
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
        <span className="shrink-0 font-mono text-[11px] text-neutral-400">MODE SIMULASI:</span>

        <button
          type="button"
          onClick={handleOpenSuperadmin}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors ${
            inAdminView && admin
              ? 'bg-amber-400 text-neutral-950'
              : 'bg-neutral-800 text-amber-300 hover:bg-neutral-700'
          }`}
        >
          <Crown className="h-3.5 w-3.5" />
          Superadmin CRM
        </button>

        <span className="mx-1 h-3.5 w-px shrink-0 bg-neutral-800" />
        <span className="shrink-0 text-[11px] text-neutral-400">Klik tombol Help dari:</span>

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
              title={`Simulasi klik Help sebagai ${demo.uid} (${demo.role}) dari ${app?.name}`}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] transition-colors ${
                isCurrent
                  ? 'border-white/60 bg-white text-neutral-950 font-semibold'
                  : 'border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:border-neutral-600 hover:text-white'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: app?.color ?? '#888' }} />
              <span>{app?.prefix}</span>
              <span className="font-mono text-[10px] opacity-80">{demo.uid}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </button>
          );
        })}
      </div>

      <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[11px]"
          title={pbOnline ? 'Terhubung ke server PocketBase' : 'Mode Fallback Aktif (penyimpanan lokal otomatis sinkron saat PocketBase menyala)'}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${pbOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-neutral-400">{pbOnline ? 'PocketBase: Online' : 'PocketBase: Fallback Lokal'}</span>
        </span>

        <button
          type="button"
          onClick={resetDemo}
          title="Kembalikan tiket & user awal (seed)"
          className="inline-flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Seed
        </button>
      </div>
    </div>
  );
}
