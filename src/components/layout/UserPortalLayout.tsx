import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, LogOut, Plus } from 'lucide-react';
import { getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { SimulationTopbar } from './SimulationTopbar';

export function UserPortalLayout() {
  const { requester, logoutRequester } = useCrm();
  const navigate = useNavigate();

  const app = getApp(requester?.appId);
  const returnUrl = requester?.lastSeenUrl ?? app?.appUrl;

  const handleLogout = () => {
    logoutRequester();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SimulationTopbar />

      <header className="border-b border-line bg-panel">
        <div className="h-1 w-full" style={{ backgroundColor: app?.color ?? '#141413' }} />
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border font-mono text-xs font-bold"
              style={{
                backgroundColor: `${app?.color ?? '#141413'}12`,
                borderColor: `${app?.color ?? '#141413'}35`,
                color: app?.color ?? '#141413',
              }}
            >
              {app?.prefix ?? 'APP'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Link to="/portal" className="text-base font-semibold tracking-tight text-ink hover:underline">
                  Pusat Bantuan {app?.name ?? 'Aplikasi'}
                </Link>
              </div>
              <p className="text-xs text-ink-muted">
                Masuk sebagai <span className="font-medium text-ink">{requester?.name}</span>{' '}
                (<span className="font-mono text-[11px]">{requester?.externalUid}</span> ·{' '}
                {requester?.appRole})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {returnUrl && (
              <a
                href={returnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke {app?.name ?? 'Aplikasi'}
                <ExternalLink className="h-3 w-3 text-ink-muted" />
              </a>
            )}

            <button
              type="button"
              onClick={() => navigate('/portal/new')}
              className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: app?.color ?? '#141413' }}
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Tiket Laporan
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Ganti akun"
              className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1.5 text-xs text-ink-muted hover:border-line-strong hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
