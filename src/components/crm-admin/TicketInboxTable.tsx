import { FileDown, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
  VPS_APPS,
} from '../../config/vpsAppsConfig';
import { downloadTicketsCsv, filterTickets, sortQueue, timeAgo } from '../../services/crmLogic';
import type { Ticket, TicketMessage, TicketPriority, TicketStatus } from '../../types/crm';
import { AppBadge } from '../common/AppBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { useCrm } from '../../context/CrmContext';

interface Props {
  tickets: Ticket[];
  messages?: TicketMessage[];
  selectedApp: string;
  selectedStatus: TicketStatus | 'active' | 'all';
  selectedPriority: TicketPriority | 'all';
  searchQuery: string;
  onAppChange: (appId: string) => void;
  onStatusChange: (status: TicketStatus | 'active' | 'all') => void;
  onPriorityChange: (priority: TicketPriority | 'all') => void;
  onSearchChange: (q: string) => void;
  onTicketClick: (ticketId: string) => void;
  onQuickStatusChange?: (ticketId: string, status: TicketStatus) => void;
}

export function TicketInboxTable({
  tickets,
  messages,
  selectedApp,
  selectedStatus,
  selectedPriority,
  searchQuery,
  onAppChange,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onTicketClick,
  onQuickStatusChange,
}: Props) {
  const { t, statusLabel, priorityLabel, categoryLabel } = useCrm();

  const filtered = sortQueue(
    filterTickets(tickets, {
      appId: selectedApp,
      status: selectedStatus,
      priority: selectedPriority,
      search: searchQuery,
      messages,
    }),
  );

  const hasActiveFilter =
    selectedApp !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    onAppChange('all');
    onStatusChange('all');
    onPriorityChange('all');
    onSearchChange('');
  };

  return (
    <div className="rounded border border-line bg-panel">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line p-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('tickets.searchPlaceholder')}
              className="w-full rounded border border-line bg-canvas py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="hidden items-center gap-1 text-ink-muted sm:inline-flex">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </span>

            <select
              value={selectedApp}
              onChange={(e) => onAppChange(e.target.value)}
              className="rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
            >
              <option value="all">{t('tickets.filterAllApps')} (7)</option>
              {VPS_APPS.map((app) => (
                <option key={app.id} value={app.id}>
                  [{app.prefix}] {app.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) =>
                onStatusChange(e.target.value as TicketStatus | 'active' | 'all')
              }
              className="rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
            >
              <option value="all">{t('tickets.filterAllStatus')}</option>
              <option value="active">{t('tickets.filterActiveOnly')}</option>
              {STATUS_ORDER.map((st) => (
                <option key={st} value={st}>
                  {statusLabel(st)}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) =>
                onPriorityChange(e.target.value as TicketPriority | 'all')
              }
              className="rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
            >
              <option value="all">{t('tickets.filterAllPriority')}</option>
              {PRIORITY_ORDER.map((pr) => (
                <option key={pr} value={pr}>
                  {priorityLabel(pr)}
                </option>
              ))}
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded border border-line px-2 py-1.5 text-xs text-ink-muted hover:border-line-strong hover:text-ink"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => downloadTicketsCsv(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-ink hover:border-line-strong active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-[border-color,transform]"
            title="Download CSV"
          >
            <FileDown className="h-3.5 w-3.5 text-ink-muted" />
            {t('tickets.exportCsv')}
          </button>
          <div className="font-mono text-xs text-ink-muted tabular-nums">
            {filtered.length} / {tickets.length}
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">
            {t('tickets.empty')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-subtle/70 text-[11px] font-semibold text-ink-muted">
                <th className="py-2.5 pl-4 pr-2">{t('tickets.colTicket')}</th>
                <th className="px-2 py-2.5">{t('tickets.colApp')}</th>
                <th className="px-2 py-2.5">{t('tickets.colSubject')}</th>
                <th className="px-2 py-2.5">{t('tickets.colRequester')}</th>
                <th className="px-2 py-2.5">{t('tickets.colPriority')}</th>
                <th className="px-2 py-2.5">{t('tickets.colStatus')}</th>
                <th className="py-2.5 pl-2 pr-4 text-right">{t('tickets.colTime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((ticket) => {
                const isOpen = ticket.status === 'open';
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onTicketClick(ticket.id)}
                    className={`cursor-pointer transition-colors ${
                      isOpen
                        ? 'bg-red-50/35 hover:bg-red-50/70'
                        : 'hover:bg-subtle/60'
                    }`}
                  >
                    <td className="whitespace-nowrap py-3 pl-4 pr-2 font-mono font-semibold text-ink">
                      <div className="flex items-center gap-1.5">
                        {isOpen && (
                          <span
                            className="h-2 w-2 rounded-full bg-red-600"
                            title="Open"
                          />
                        )}
                        <span>{ticket.ticketNumber}</span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-2 py-3">
                      <AppBadge appId={ticket.appId} />
                    </td>

                    <td className="max-w-md px-2 py-3">
                      <div className="font-medium text-ink line-clamp-1">
                        {ticket.subject}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-muted">
                        <span>{categoryLabel(ticket.category)}</span>
                        {ticket.sourcePageUrl && (
                          <>
                            <span>·</span>
                            <span className="truncate font-mono text-[10px] text-ink-faint max-w-[200px]">
                              {ticket.sourcePageUrl}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-2 py-3">
                      <div className="font-medium text-ink">
                        {ticket.requesterName}
                      </div>
                      <div className="font-mono text-[11px] text-ink-muted">
                        {ticket.requesterUid} · {ticket.requesterRole}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-2 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    <td
                      className="whitespace-nowrap px-2 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onQuickStatusChange ? (
                        <div className="inline-flex items-center gap-1.5">
                          <StatusBadge status={ticket.status} />
                          <select
                            aria-label={`Ubah status ${ticket.ticketNumber}`}
                            value={ticket.status}
                            onChange={(e) =>
                              onQuickStatusChange(
                                ticket.id,
                                e.target.value as TicketStatus,
                              )
                            }
                            className="rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-ink-muted hover:border-line-strong focus:outline-none"
                          >
                            {STATUS_ORDER.map((st) => (
                              <option key={st} value={st}>
                                {STATUS_LABEL[st]}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <StatusBadge status={ticket.status} />
                      )}
                    </td>

                    <td className="whitespace-nowrap py-3 pl-2 pr-4 text-right font-mono text-[11px] text-ink-muted tabular-nums">
                      {timeAgo(ticket.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
