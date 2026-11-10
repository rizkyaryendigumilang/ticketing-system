import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { STATUS_LABEL } from '../../config/vpsAppsConfig';
import { timeAgo } from '../../services/crmLogic';
import type { Ticket, TicketStatus } from '../../types/crm';
import { AppBadge } from '../common/AppBadge';
import { PriorityBadge } from '../common/PriorityBadge';

const COLUMNS: { status: TicketStatus; accent: string; next?: TicketStatus }[] = [
  { status: 'open', accent: 'border-t-red-600', next: 'in_progress' },
  { status: 'in_progress', accent: 'border-t-amber-500', next: 'waiting_on_user' },
  { status: 'waiting_on_user', accent: 'border-t-purple-600', next: 'solved' },
  { status: 'solved', accent: 'border-t-emerald-600', next: 'closed' },
  { status: 'closed', accent: 'border-t-slate-500' },
];

interface Props {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  onTicketClick: (ticketId: string) => void;
}

export function TicketKanbanBoard({
  tickets,
  onStatusChange,
  onTicketClick,
}: Props) {
  const [dragOverCol, setDragOverCol] = useState<TicketStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const ticketId = e.dataTransfer.getData('text/plain');
    if (ticketId) {
      onStatusChange(ticketId, status);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {COLUMNS.map((col) => {
        const items = tickets.filter((t) => t.status === col.status);
        const isOver = dragOverCol === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.status);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`flex min-h-[460px] flex-col rounded border border-t-4 bg-subtle/50 transition-colors ${
              col.accent
            } ${isOver ? 'border-ink bg-subtle' : 'border-line'}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-line bg-panel px-3.5 py-2.5">
              <span className="text-xs font-semibold text-ink">
                {STATUS_LABEL[col.status]}
              </span>
              <span className="rounded bg-subtle px-2 py-0.5 font-mono text-xs font-semibold text-ink tabular-nums">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2.5 p-2.5">
              {items.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded border border-dashed border-line text-xs text-ink-faint">
                  Tarik tiket ke kolom ini
                </div>
              ) : (
                items.map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    onClick={() => onTicketClick(ticket.id)}
                    className="cursor-grab rounded border border-line bg-panel p-3 transition-shadow hover:border-line-strong hover:shadow-sm active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-ink">
                        {ticket.ticketNumber}
                      </span>
                      <PriorityBadge priority={ticket.priority} />
                    </div>

                    <p className="mt-1.5 text-xs font-medium text-ink line-clamp-2">
                      {ticket.subject}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <AppBadge appId={ticket.appId} />
                      <span className="font-mono text-[10px] text-ink-faint">
                        {timeAgo(ticket.createdAt)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2 text-[11px] text-ink-muted">
                      <span className="truncate">{ticket.requesterName}</span>
                      {col.next && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(ticket.id, col.next!);
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded border border-line bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink hover:border-line-strong"
                        >
                          {col.next === 'solved' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                              Tandai Selesai
                            </>
                          ) : col.next === 'closed' ? (
                            <>
                              Tandai Ditutup
                              <ArrowRight className="h-2.5 w-2.5" />
                            </>
                          ) : (
                            <>
                              {STATUS_LABEL[col.next]}
                              <ArrowRight className="h-2.5 w-2.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
