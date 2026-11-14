import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Globe, LogOut, Plus, ShieldCheck } from 'lucide-react';
import { getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';

export function UserPortalLayout() {
  const { data, admin, requester, logoutRequester, t, lang, setLanguage } = useCrm();
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
      <header className="sticky top-0 z-30 border-b border-line/80 bg-panel/85 backdrop-blur-md shadow-xs">
        {/* App identity color stripe */}
        <div className="h-1 w-full" style={{ backgroundColor: app?.color ?? '#0F172A' }} />

        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border font-mono text-xs font-bold shadow-xs select-none"
              style={{
                backgroundColor: `${app?.color ?? '#0F172A'}14`,
                borderColor: `${app?.color ?? '#0F172A'}30`,
                color: app?.color ?? '#0F172A',
              }}
            >
              {app?.prefix ?? 'APP'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Link to="/portal" className="text-sm sm:text-base font-bold tracking-tight text-ink hover:text-ink/80 transition-colors">
                  {requester ? (lang === 'en' ? `Help Center · ${app?.name ?? 'App'}` : `Pusat Bantuan ${app?.name ?? 'Aplikasi'}`) : 'VPS Helpdesk'}
                </Link>
                {activeCount > 0 && (
                  <span className="rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 text-[10px] font-semibold px-2 py-0.5 tabular-nums">
                    {activeCount} {lang === 'en' ? 'active' : 'aktif'}
                  </span>
                )}
              </div>
              {requester ? (
                <p className="text-[11px] sm:text-xs text-ink-muted">
                  {lang === 'en' ? 'Requester: ' : 'Pelapor: '}<span className="font-semibold text-ink">{requester.name}</span>{' '}
                  (<span className="font-mono text-[10px] sm:text-[11px]">{requester.externalUid}</span> ·{' '}
                  <span className="text-ink">{requester.appRole}</span>)
                </p>
              ) : (
                <p className="text-[11px] sm:text-xs text-ink-muted">
                  {lang === 'en' ? 'Unified Support Hub for 7 VPS Apps' : 'Layanan Bantuan Terpadu 7 Aplikasi VPS (43.156.236.102)'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(lang === 'id' ? 'en' : 'id')}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2 py-1 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-subtle active:scale-95 transition-all shadow-2xs"
              title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
              aria-label={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
              <Globe className="h-3 w-3 text-ink-faint" />
              <span className="font-mono text-[10px] uppercase font-bold text-ink">{lang}</span>
            </button>

            {admin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-all hover:bg-neutral-800 active:scale-[0.98]"
                title="Buka Meja Kerja Superadmin CRM"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                {lang === 'en' ? 'Admin Workspace' : 'Meja Kerja Admin'}
              </Link>
            )}

            {returnUrl && (
              <a
                href={returnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-subtle/80 px-3 py-1.5 text-xs font-medium text-ink shadow-xs transition-all hover:border-line-strong hover:bg-subtle active:scale-[0.98]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {lang === 'en' ? 'Back to' : 'Kembali ke'} {app?.name ?? 'Aplikasi'}
                <ExternalLink className="h-3 w-3 text-ink-muted" />
              </a>
            )}

            {requester ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/portal/new')}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: app?.color ?? '#0F172A' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('portal.newTicket')}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  title={t('portal.logout')}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink hover:bg-subtle active:scale-95"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-all active:scale-[0.98]"
              >
                {t('login.submit')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
