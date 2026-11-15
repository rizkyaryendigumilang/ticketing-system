import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { computeTicketSla } from '../../services/crmLogic';
import { AppBadge } from '../common/AppBadge';
import { PriorityBadge } from '../common/PriorityBadge';

export function SlaRadarWidget() {
  const { data, t, lang } = useCrm();
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<'critical' | 'all'>('critical');

  const now = Date.now();

  // Active tickets with their computed SLA
  const radarItems = useMemo(() => {
    const active = data.tickets.filter(
      (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_user',
    );

    const items = active.map((ticket) => {
      const sla = computeTicketSla(ticket, now);
      const totalDuration = sla.durationMs || 1;
      const elapsed = Math.max(0, totalDuration - Math.max(0, sla.remainingMs));
      const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

      return {
        ticket,
        sla,
        percent,
      };
    });

    // Sort: breached first (most overdue first), then warning, then on_track
    items.sort((a, b) => {
      if (a.sla.status === 'breached' && b.sla.status !== 'breached') return -1;
      if (b.sla.status === 'breached' && a.sla.status !== 'breached') return 1;
      return a.sla.remainingMs - b.sla.remainingMs;
    });

    return items;
  }, [data.tickets, now]);

  const breachedCount = radarItems.filter((i) => i.sla.status === 'breached').length;
  const warningCount = radarItems.filter((i) => i.sla.status === 'warning').length;

  const displayedItems = useMemo(() => {
    if (filterMode === 'critical') {
      return radarItems.filter((i) => i.sla.status === 'breached' || i.sla.status === 'warning');
    }
    return radarItems.slice(0, 8);
  }, [radarItems, filterMode]);

  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-card transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-ink">
              {lang === 'en' ? 'SLA Radar & Early Warning' : 'Radar Batas Waktu SLA'}
            </h3>
            <p className="text-[11px] text-ink-muted">
              {breachedCount > 0 ? (
                <span className="font-semibold text-rose-600">
                  {breachedCount} {lang === 'en' ? 'breached' : 'terlewat batas'}
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {lang === 'en' ? '0 breaches' : 'Semua target aman'}
                </span>
              )}
              {warningCount > 0 && ` · ${warningCount} mendekati batas`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode('critical')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterMode === 'critical'
                ? 'bg-rose-500/15 font-semibold text-rose-700 dark:text-rose-300'
                : 'text-ink-muted hover:bg-subtle'
            }`}
          >
            {lang === 'en' ? 'Critical Only' : 'Kritis & Mendekati'} ({breachedCount + warningCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-ink text-white font-semibold'
                : 'text-ink-muted hover:bg-subtle'
            }`}
          >
            {lang === 'en' ? 'All Active' : 'Semua Aktif'} ({radarItems.length})
          </button>
        </div>
      </div>

      <div className="mt-3.5 space-y-2">
        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/80 mb-2" />
            <p className="text-xs font-semibold text-ink">
              {lang === 'en' ? 'No SLA Breaches or Warnings' : 'Tidak Ada Tiket Terancam SLA'}
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              {lang === 'en'
                ? 'All active tickets are comfortably within resolution time targets.'
                : 'Seluruh tiket aktif berada dalam rentang target waktu aman.'}
            </p>
          </div>
        ) : (
          displayedItems.map(({ ticket, sla, percent }) => {
            const isBreached = sla.status === 'breached';
            const isWarning = sla.status === 'warning';

            return (
              <div
                key={ticket.id}
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                className={`content-auto group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 transition-colors cursor-pointer hover:border-line-strong ${
                  isBreached
                    ? 'border-rose-500/30 bg-rose-500/[0.03] hover:bg-rose-500/[0.06]'
                    : isWarning
                    ? 'border-amber-500/30 bg-amber-500/[0.03] hover:bg-amber-500/[0.06]'
                    : 'border-line bg-subtle/40 hover:bg-subtle/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">
                      #{ticket.ticketNumber}
                    </span>
                    <AppBadge appId={ticket.appId} />
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-[11px] text-ink-muted truncate">
                      {ticket.requesterName}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-ink truncate">
                    {ticket.subject}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="w-28 sm:w-32 space-y-1 text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold tabular-nums ${
                        isBreached
                          ? 'text-rose-600 dark:text-rose-400'
                          : isWarning
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-ink-muted'
                      }`}
                    >
                      {isBreached && <ShieldAlert className="h-3 w-3 shrink-0" />}
                      {isWarning && <AlertCircle className="h-3 w-3 shrink-0" />}
                      {sla.label}
                    </span>
                    {/* Visual Progress Meter */}
                    <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isBreached
                            ? 'bg-rose-600'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-ink-faint group-hover:text-ink transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
