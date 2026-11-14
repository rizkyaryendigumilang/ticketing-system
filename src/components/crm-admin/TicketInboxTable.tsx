import React, { useState, useEffect, useRef } from 'react';
import { Eye, FileDown, FileJson, Printer, Search, SlidersHorizontal, Tag, X } from 'lucide-react';
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
import { SlaBadge } from '../common/SlaBadge';
import { EmptyState } from '../common/EmptyState';
import { TicketPeekDrawer } from './TicketPeekDrawer';
import { useCrm } from '../../context/CrmContext';

interface Props {
  tickets: Ticket[];
  messages?: TicketMessage[];
  selectedApp: string;
  selectedStatus: TicketStatus | 'active' | 'all';
  selectedPriority: TicketPriority | 'all';
  searchQuery: string;
  assignedFilter?: 'all' | 'me' | 'unassigned';
  onAssignedFilterChange?: (filter: 'all' | 'me' | 'unassigned') => void;
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
  assignedFilter = 'all',
  onAssignedFilterChange,
  onAppChange,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onTicketClick,
  onQuickStatusChange,
}: Props) {
  const { t, statusLabel, priorityLabel, categoryLabel, adminActor } = useCrm();

  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [peekingTicket, setPeekingTicket] = useState<Ticket | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const myCount = tickets.filter((t) => t.assignedTo === adminActor.id).length;
  const unassignedCount = tickets.filter((t) => !t.assignedTo).length;

  const filtered = sortQueue(
    filterTickets(tickets, {
      appId: selectedApp,
      status: selectedStatus,
      priority: selectedPriority,
      search: searchQuery,
      assignedFilter,
      currentAdminId: adminActor.id,
      messages,
    }),
  );

  // Keyboard navigation shortcuts: j (down), k (up), Enter (open), / (search)
  useEffect(() => {
    const handleTableKeys = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (
        e.key === 'Enter' &&
        highlightedIndex >= 0 &&
        highlightedIndex < filtered.length
      ) {
        e.preventDefault();
        onTicketClick(filtered[highlightedIndex].id);
      } else if (
        e.key === ' ' &&
        highlightedIndex >= 0 &&
        highlightedIndex < filtered.length
      ) {
        e.preventDefault();
        setPeekingTicket(filtered[highlightedIndex]);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleTableKeys);
    return () => window.removeEventListener('keydown', handleTableKeys);
  }, [filtered, highlightedIndex, onTicketClick]);

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(filtered, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `helpdesk-tickets-backup-${new Date().toISOString().slice(0, 10)}.json`,
    );
    dlAnchor.click();
  };

  const handlePrintSummary = () => {
    window.print();
  };

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
    <div className="rounded border border-line bg-panel overflow-hidden">
      {/* Assignment Filter Tabs */}
      {onAssignedFilterChange && (
        <div className="flex items-center gap-1.5 border-b border-line bg-subtle/40 px-3 py-2 text-xs">
          <span className="font-semibold text-ink-muted text-[11px] mr-1">Penugasan:</span>
          <button
            type="button"
            onClick={() => onAssignedFilterChange('all')}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              assignedFilter === 'all'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-subtle'
            }`}
          >
            Semua ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => onAssignedFilterChange('me')}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              assignedFilter === 'me'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-subtle'
            }`}
          >
            Ditugaskan ke Saya ({myCount})
          </button>
          <button
            type="button"
            onClick={() => onAssignedFilterChange('unassigned')}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              assignedFilter === 'unassigned'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-subtle'
            }`}
          >
            Belum Ditugaskan ({unassignedCount})
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line p-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`${t('tickets.searchPlaceholder')} (Tekan /)`}
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
              className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-ink shadow-xs focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
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
              className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-ink shadow-xs focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
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
              className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-ink shadow-xs focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
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
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-ink-muted shadow-xs hover:border-line-strong hover:text-ink active:scale-95 transition-all"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => downloadTicketsCsv(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-ink shadow-xs hover:border-line-strong hover:bg-subtle active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Download CSV"
          >
            <FileDown className="h-3.5 w-3.5 text-ink-muted" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-ink shadow-xs hover:border-line-strong hover:bg-subtle active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Ekspor Backup JSON"
          >
            <FileJson className="h-3.5 w-3.5 text-ink-muted" />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button
            type="button"
            onClick={handlePrintSummary}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-ink shadow-xs hover:border-line-strong hover:bg-subtle active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Cetak Ringkasan Tiket"
          >
            <Printer className="h-3.5 w-3.5 text-ink-muted" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
          <div className="ml-1 text-xs font-medium text-ink-muted tabular-nums">
            {filtered.length} / {tickets.length}
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title={hasActiveFilter ? 'Tidak ada tiket yang cocok dengan filter' : t('tickets.empty')}
          description={
            hasActiveFilter
              ? 'Coba ubah kata kunci pencarian, filter aplikasi, atau status tiket.'
              : 'Semua tiket telah ditangani atau belum ada tiket baru yang masuk.'
          }
          action={
            hasActiveFilter
              ? {
                  label: 'Reset Filter',
                  onClick: resetFilters,
                }
              : undefined
          }
        />
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
                <th className="px-2 py-2.5">SLA</th>
                <th className="px-2 py-2.5">{t('tickets.colStatus')}</th>
                <th className="px-2 py-2.5">Petugas (PIC)</th>
                <th className="py-2.5 pl-2 pr-4 text-right">{t('tickets.colTime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filtered.map((ticket, idx) => {
                const isOpen = ticket.status === 'open';
                const isHighlighted = idx === highlightedIndex;
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onTicketClick(ticket.id)}
                    className={`group cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-ink/10 ring-1 ring-inset ring-ink/30'
                        : isOpen
                          ? 'bg-rose-500/[0.03] hover:bg-rose-500/[0.07]'
                          : 'hover:bg-subtle/50'
                    }`}
                  >
                    <td className="whitespace-nowrap py-3 pl-4 pr-2 font-mono font-semibold text-ink">
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"
                            title="Open"
                          />
                        ) : (
                          <span className="h-1.5 w-1.5 shrink-0" />
                        )}
                        <span>{ticket.ticketNumber}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPeekingTicket(ticket);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded hover:bg-subtle text-ink-muted hover:text-ink transition-opacity"
                          title="Pratinjau Cepat (Spasi)"
                          aria-label={`Pratinjau cepat ${ticket.ticketNumber}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-2 py-3">
                      <AppBadge appId={ticket.appId} />
                    </td>

                    <td className="max-w-md px-2 py-3">
                      <div className="font-medium text-ink line-clamp-1">
                        {ticket.subject}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
                        <span>{categoryLabel(ticket.category)}</span>
                        {ticket.sourcePageUrl && (
                          <>
                            <span>·</span>
                            <span className="truncate font-mono text-[10px] text-ink-faint max-w-[180px]">
                              {ticket.sourcePageUrl}
                            </span>
                          </>
                        )}
                        {ticket.tags && ticket.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 ml-1">
                            {ticket.tags.map((tg) => (
                              <span
                                key={tg}
                                className="inline-flex items-center rounded-sm bg-line/60 px-1.5 py-0 text-[10px] font-medium text-ink"
                              >
                                #{tg}
                              </span>
                            ))}
                          </div>
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

                    <td className="whitespace-nowrap px-2 py-3">
                      <SlaBadge ticket={ticket} />
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

                    <td className="whitespace-nowrap px-2 py-3">
                      {ticket.assignedToName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          {ticket.assignedToName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-faint italic">Belum ditugaskan</span>
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

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-line bg-subtle/30 px-4 py-2 text-[11px] text-ink-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink shadow-2xs">j</kbd>
            {' / '}
            <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink shadow-2xs">k</kbd> Navigasi baris
          </span>
          <span>
            <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink shadow-2xs">Spasi</kbd> Pratinjau cepat
          </span>
          <span>
            <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink shadow-2xs">Enter</kbd> Buka penuh
          </span>
          <span>
            <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink shadow-2xs">/</kbd> Cari tiket
          </span>
        </div>
        <span className="font-mono text-[10px] text-ink-faint">
          Pintasan Keyboard Aktif · {filtered.length} dari {tickets.length}
        </span>
      </div>

      {/* Quick Peek Drawer */}
      {peekingTicket && (
        <TicketPeekDrawer
          ticket={peekingTicket}
          onClose={() => setPeekingTicket(null)}
        />
      )}
    </div>
  );
}
