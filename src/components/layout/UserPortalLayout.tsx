import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, LogOut, Plus, ShieldCheck } from 'lucide-react';
import { getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';

export function UserPortalLayout() {
  const { data, admin, requester, logoutRequester, t } = useCrm();
  const navigate = useNavigate();

  const app = getApp(requester?.appId);
  const returnUrl = requester?.lastSeenUrl ?? app?.appUrl;

  const userTickets = data.tickets.filter(
    (t) =>
      t.requesterId === requester?.id ||
      (t.appId === requester?.appId && t.requesterUid === requester?.externalUid),
  );
  const activeCount = userTickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_user',
  ).length;

  const handleLogout = () => {
    logoutRequester();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-panel shadow-sm">
        {/* App identity color stripe */}
        <div className="h-1 w-full" style={{ backgroundColor: app?.color ?? '#141413' }} />

        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold shadow-sm"
              style={{
                backgroundColor: `${app?.color ?? '#141413'}14`,
                borderColor: `${app?.color ?? '#141413'}35`,
                color: app?.color ?? '#141413',
              }}
            >
              {app?.prefix ?? 'APP'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Link to="/portal" className="text-base font-bold tracking-tight text-ink hover:underline">
                  Pusat Bantuan {app?.name ?? 'Aplikasi'}
                </Link>
                {activeCount > 0 && (
                  <span className="rounded-full bg-red-100 text-red-700 font-mono text-[10px] font-bold px-2 py-0.5 shadow-sm">
                    {activeCount} aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted">
                Pelapor: <span className="font-semibold text-ink">{requester?.name}</span>{' '}
                (<span className="font-mono text-[11px]">{requester?.externalUid}</span> ·{' '}
                <span className="text-ink">{requester?.appRole}</span>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {admin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
                title="Buka Meja Kerja Superadmin CRM"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Meja Kerja Admin
              </Link>
            )}

            {returnUrl && (
              <a
                href={returnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line-strong hover:bg-line/40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke {app?.name ?? 'Aplikasi'}
                <ExternalLink className="h-3 w-3 text-ink-muted" />
              </a>
            )}

            <button
              type="button"
              onClick={() => navigate('/portal/new')}
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-[opacity,transform] hover:opacity-90 active:scale-95"
              style={{ backgroundColor: app?.color ?? '#141413' }}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('portal.newTicket')}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title={t('portal.logout')}
              className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink hover:bg-subtle"
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
