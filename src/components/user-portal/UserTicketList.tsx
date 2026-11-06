import { useState } from 'react';
import { CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { CATEGORY_LABEL } from '../../config/vpsAppsConfig';
import { timeAgo } from '../../services/crmLogic';
import type { Ticket } from '../../types/crm';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';

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
  const [filter, setFilter] = useState<'all' | 'active' | 'solved'>('all');

  const visible = tickets.filter((t) => {
    if (filter === 'active') {
      return t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_user';
    }
    if (filter === 'solved') {
      return t.status === 'solved' || t.status === 'closed';
    }
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded border border-line bg-panel p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded px-3 py-1 font-medium ${
              filter === 'all' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Semua ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`rounded px-3 py-1 font-medium ${
              filter === 'active' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Sedang Diproses (
            {
              tickets.filter(
                (t) =>
                  t.status === 'open' ||
                  t.status === 'in_progress' ||
                  t.status === 'waiting_on_user',
              ).length
            }
            )
          </button>
          <button
            type="button"
            onClick={() => setFilter('solved')}
            className={`rounded px-3 py-1 font-medium ${
              filter === 'solved' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Selesai (
            {
              tickets.filter((t) => t.status === 'solved' || t.status === 'closed')
                .length
            }
            )
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded border border-line bg-panel px-6 py-12 text-center">
          <p className="text-sm font-semibold text-ink">
            Belum ada tiket laporan pada kategori ini.
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Jika Anda mengalami kendala di aplikasi, buat laporan baru dan Superadmin akan menanganinya.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded bg-ink px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Tiket Laporan Baru
          </button>
        </div>
      ) : (
        <div className="divide-y divide-line rounded border border-line bg-panel">
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
                    · {CATEGORY_LABEL[ticket.category]}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-ink">
                  {ticket.subject}
                </h3>

                <p className="line-clamp-2 text-xs text-ink-muted">
                  {ticket.description}
                </p>

                {ticket.resolutionSummary && (
                  <div className="mt-2 flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                    <div>
                      <span className="font-semibold">Solusi Admin: </span>
                      {ticket.resolutionSummary}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                <span className="font-mono text-[11px] text-ink-muted">
                  {timeAgo(ticket.createdAt)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-ink">
                  Detail
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
