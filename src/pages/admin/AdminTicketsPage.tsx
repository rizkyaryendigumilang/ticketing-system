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
  const { data, adminActor } = useCrm();
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const appParam = searchParams.get('app');
    setSelectedApp(appParam ?? 'all');
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
      toast.success(`Tiket #${ticket.ticketNumber} diubah ke: ${STATUS_LABEL[status]}`);
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
          <h1 className="text-xl font-bold tracking-tight text-ink">Unified Ticket Inbox & Kanban</h1>
          <p className="mt-0.5 text-xs text-ink-muted">
            Kelola seluruh laporan dari 7 aplikasi. Tiket berstatus Open otomatis ditempatkan paling atas.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded border border-line bg-panel p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-medium ${
              viewMode === 'table' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            Tabel Inbox
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-medium ${
              viewMode === 'kanban' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Kanban Board
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
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-line bg-panel p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink-muted">Filter Aplikasi:</span>
              <select
                value={selectedApp}
                onChange={(e) => handleAppChange(e.target.value)}
                className="rounded border border-line bg-canvas px-2.5 py-1 text-xs text-ink"
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
              Tarik kartu antar kolom atau klik tombol status di pojok kanan bawah kartu.
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
