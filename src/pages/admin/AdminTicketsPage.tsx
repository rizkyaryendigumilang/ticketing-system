import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Columns3, Table2 } from 'lucide-react';
import { STATUS_LABEL, VPS_APPS } from '../../config/vpsAppsConfig';
import { filterTickets, sortQueue } from '../../services/crmLogic';
import { changeTicket } from '../../services/ticketCrmService';
import { useCrm } from '../../context/CrmContext';
import { useToast } from '../../context/ToastContext';
import type { TicketPriority, TicketStatus } from '../../types/crm';
import { TicketInboxTable } from '../../components/crm-admin/TicketInboxTable';
import { TicketKanbanBoard } from '../../components/crm-admin/TicketKanbanBoard';

export function AdminTicketsPage() {
  const { data, adminActor, t, statusLabel } = useCrm();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(
    searchParams.get('view') === 'kanban' ? 'kanban' : 'table',
  );
  const [selectedApp, setSelectedApp] = useState<string>(searchParams.get('app') ?? 'all');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'active' | 'all'>(
    (searchParams.get('status') as TicketStatus | 'active' | 'all') ?? 'all',
  );
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'all'>('all');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'me' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || searchParams.get('search') || '',
  );

  useEffect(() => {
    const appParam = searchParams.get('app');
    setSelectedApp(appParam ?? 'all');
    const qParam = searchParams.get('q') || searchParams.get('search');
    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  const handleAppChange = (appId: string) => {
    setSelectedApp(appId);
    const next = new URLSearchParams(searchParams);
    if (appId === 'all') next.delete('app');
    else next.set('app', appId);
    setSearchParams(next, { replace: true });
  };

  const handleStatusChange = (ticketId: string, status: TicketStatus) => {
    const ticket = data.tickets.find((t) => t.id === ticketId);
    if (ticket) {
      changeTicket(ticket, { status }, adminActor);
      toast.success(`Tiket #${ticket.ticketNumber} → ${statusLabel(status)}`);
    }
  };

  const kanbanTickets = sortQueue(
    filterTickets(data.tickets, {
      appId: selectedApp,
      priority: selectedPriority,
      search: searchQuery,
      messages: data.messages,
    }),
  );

  return (
    <div className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">{t('tickets.title')}</h1>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl border border-line bg-subtle/80 p-0.5 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all active:scale-95 ${
              viewMode === 'table'
                ? 'bg-panel text-ink font-semibold shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            {t('tickets.viewTable')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all active:scale-95 ${
              viewMode === 'kanban'
                ? 'bg-panel text-ink font-semibold shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Columns3 className="h-3.5 w-3.5" />
            {t('tickets.viewKanban')}
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <TicketInboxTable
          tickets={data.tickets}
          messages={data.messages}
          selectedApp={selectedApp}
          selectedStatus={selectedStatus}
          selectedPriority={selectedPriority}
          assignedFilter={assignedFilter}
          onAssignedFilterChange={setAssignedFilter}
          searchQuery={searchQuery}
          onAppChange={handleAppChange}
          onStatusChange={setSelectedStatus}
          onPriorityChange={setSelectedPriority}
          onSearchChange={setSearchQuery}
          onTicketClick={(id) => navigate(`/admin/tickets/${id}`)}
          onQuickStatusChange={handleStatusChange}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-panel p-3 text-xs shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink-muted">Filter Aplikasi:</span>
              <select
                value={selectedApp}
                onChange={(e) => handleAppChange(e.target.value)}
                className="rounded-lg border border-line bg-canvas px-2.5 py-1 text-xs text-ink focus:border-ink focus:outline-none"
              >
                <option value="all">Semua Aplikasi (7)</option>
                {VPS_APPS.map((app) => (
                  <option key={app.id} value={app.id}>
                    [{app.prefix}] {app.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-ink-muted">
              Tarik kartu antarkolom atau klik tombol status di pojok kanan bawah kartu.
            </span>
          </div>

          <TicketKanbanBoard
            tickets={kanbanTickets}
            onStatusChange={handleStatusChange}
            onTicketClick={(id) => navigate(`/admin/tickets/${id}`)}
          />
        </div>
      )}
    </div>
  );
}
