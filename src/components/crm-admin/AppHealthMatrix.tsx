import { Database, ExternalLink, ArrowUpRight } from 'lucide-react';
import type { AppSource } from '../../types/crm';
import type { StatusCounts } from '../../services/crmLogic';
import { useCrm } from '../../context/CrmContext';

interface Props {
  apps: AppSource[];
  matrix: Record<string, StatusCounts>;
  onSelectApp: (appId: string) => void;
}

export function AppHealthMatrix({ apps, matrix, onSelectApp }: Props) {
  const { t } = useCrm();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {apps.map((app) => {
        const counts = matrix[app.id] ?? {
          open: 0,
          in_progress: 0,
          waiting_on_user: 0,
          solved: 0,
          closed: 0,
        };
        const hasOpen = counts.open > 0;
        const activeCount = counts.open + counts.in_progress + counts.waiting_on_user;

        return (
          <div
            key={app.id}
            className={`group flex flex-col justify-between rounded-lg border bg-panel shadow-sm transition-colors ${
              hasOpen
                ? 'border-red-300 ring-1 ring-red-500/20'
                : 'border-line hover:border-line-strong hover:shadow'
            }`}
          >
            <div>
              {/* Top bar */}
              <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex rounded px-1.5 py-0.5 font-mono text-[11px] font-bold"
                      style={{
                        backgroundColor: `${app.color}15`,
                        color: app.color,
                      }}
                    >
                      {app.prefix}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectApp(app.id)}
                      className="truncate text-sm font-semibold text-ink hover:underline"
                    >
                      {app.name}
                    </button>
                  </div>
                </div>

                {/* Health status indicator */}
                {hasOpen ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white tabular-nums shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {counts.open} Baru
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Normal
                  </span>
                )}
              </div>

              {/* Ticket Breakdown */}
              <div className="grid grid-cols-4 divide-x divide-line border-b border-line text-center">
                <button
                  type="button"
                  onClick={() => onSelectApp(app.id)}
                  className="py-2 hover:bg-subtle/60"
                >
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      counts.open > 0 ? 'text-red-600' : 'text-ink-faint'
                    }`}
                  >
                    {counts.open}
                  </div>
                  <div className="text-[10px] text-ink-muted">Baru</div>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectApp(app.id)}
                  className="py-2 hover:bg-subtle/60"
                >
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      counts.in_progress > 0 ? 'text-amber-700' : 'text-ink-faint'
                    }`}
                  >
                    {counts.in_progress}
                  </div>
                  <div className="text-[10px] text-ink-muted">Diproses</div>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectApp(app.id)}
                  className="py-2 hover:bg-subtle/60"
                >
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      counts.waiting_on_user > 0 ? 'text-purple-700' : 'text-ink-faint'
                    }`}
                  >
                    {counts.waiting_on_user}
                  </div>
                  <div className="text-[10px] text-ink-muted">Menunggu</div>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectApp(app.id)}
                  className="py-2 hover:bg-subtle/60"
                >
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      counts.solved > 0 ? 'text-emerald-700' : 'text-ink-faint'
                    }`}
                  >
                    {counts.solved}
                  </div>
                  <div className="text-[10px] text-ink-muted">Selesai</div>
                </button>
              </div>
            </div>

            {/* Footer Shortcuts */}
            <div className="flex items-center justify-between gap-2 bg-subtle/40 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <a
                  href={app.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-ink-muted hover:text-ink"
                  title={app.appUrl}
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('dash.webApp')}
                </a>
                {app.adminDbUrl && (
                  <a
                    href={app.adminDbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-ink-muted hover:text-ink"
                    title={app.adminDbUrl}
                  >
                    <Database className="h-3 w-3" />
                    {t('dash.database')}
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectApp(app.id)}
                className="inline-flex items-center gap-0.5 font-medium text-ink hover:underline"
              >
                {activeCount > 0
                  ? t('dash.openActiveTickets', { count: activeCount })
                  : t('dash.viewTickets')}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
