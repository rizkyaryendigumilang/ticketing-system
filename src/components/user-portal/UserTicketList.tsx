import { useState } from 'react';
import { CheckCircle2, ChevronRight, Plus, Search, X } from 'lucide-react';
import { CATEGORY_LABEL } from '../../config/vpsAppsConfig';
import { timeAgo } from '../../services/crmLogic';
import type { Ticket } from '../../types/crm';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { useCrm } from '../../context/CrmContext';

interface Props {
  tickets: Ticket[];
  onTicketClick: (ticketId: string) => void;
  onCreateNew: () => void;
}

export function UserTicketList({
  tickets,
  onTicketClick,
  onCreateNew,
}: Props) {
  const { t, categoryLabel } = useCrm();
  const [filter, setFilter] = useState<'all' | 'active' | 'solved'>('all');
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();

  const visible = tickets.filter((t) => {
    // Status tab filter
    if (filter === 'active') {
      if (t.status !== 'open' && t.status !== 'in_progress' && t.status !== 'waiting_on_user') {
        return false;
      }
    } else if (filter === 'solved') {
      if (t.status !== 'solved' && t.status !== 'closed') {
        return false;
      }
    }

    // Search query filter
    if (q) {
      const matchNum = t.ticketNumber.toLowerCase().includes(q);
      const matchSub = t.subject.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = (CATEGORY_LABEL[t.category] ?? '').toLowerCase().includes(q);
      if (!matchNum && !matchSub && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  const activeCount = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_user',
  ).length;

  const solvedCount = tickets.filter(
    (t) => t.status === 'solved' || t.status === 'closed',
  ).length;

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-line bg-panel p-3 shadow-sm">
        {/* Filter tabs */}
        <div className="inline-flex rounded-md border border-line bg-canvas p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded px-3 py-1 font-medium transition-colors ${
              filter === 'all' ? 'bg-ink text-white font-semibold' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t('tickets.filterAllStatus')} ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`rounded px-3 py-1 font-medium transition-colors ${
              filter === 'active' ? 'bg-ink text-white font-semibold' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t('dash.inProgress')} ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('solved')}
            className={`rounded px-3 py-1 font-medium transition-colors ${
              filter === 'solved' ? 'bg-ink text-white font-semibold' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t('status.solved')} ({solvedCount})
          </button>
        </div>

        {/* Search bar */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('tickets.searchPlaceholder')}
            className="w-full rounded border border-line bg-canvas py-1.5 pl-8 pr-7 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Ticket List Cards */}
      {visible.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-ink">
            {search
              ? 'Tidak ada tiket yang cocok dengan kata kunci pencarian.'
              : 'Belum ada tiket laporan pada kategori ini.'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {search
              ? 'Coba ganti kata kunci atau bersihkan filter pencarian.'
              : 'Ada kendala di aplikasi? Buat laporan tiket baru agar tim support dapat segera mengecek dan membantu penyelesaiannya.'}
          </p>
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-3 rounded border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
            >
              Reset Pencarian
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-4 inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Tiket Laporan Baru
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-line rounded-lg border border-line bg-panel shadow-sm overflow-hidden">
          {visible.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onTicketClick(ticket.id)}
              className="flex cursor-pointer items-start justify-between gap-4 p-4 transition-colors hover:bg-subtle/60"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-ink">
                    {ticket.ticketNumber}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-xs text-ink-muted">
                    · {categoryLabel(ticket.category)}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-ink">
                  {ticket.subject}
                </h3>

                <p className="line-clamp-2 text-xs text-ink-muted leading-relaxed font-sans">
                  {ticket.description}
                </p>

                {ticket.resolutionSummary && (
                  <div className="mt-2 flex items-start gap-2 rounded border border-emerald-300 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-950">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                    <div>
                      <span className="font-semibold text-emerald-900">Solusi Admin: </span>
                      {ticket.resolutionSummary}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                <span className="font-mono text-[11px] text-ink-muted">
                  {timeAgo(ticket.createdAt)}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded border border-line bg-subtle px-2 py-1 text-xs font-medium text-ink hover:border-line-strong">
                  Buka Detail
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
