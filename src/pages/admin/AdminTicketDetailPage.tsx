import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { sortQueue, visibleMessages } from '../../services/crmLogic';
import { changeTicket, replyToTicket, solveTicket, assignTicket } from '../../services/ticketCrmService';
import type { TicketStatus } from '../../types/crm';
import { TicketWorkspace3Col } from '../../components/crm-admin/TicketWorkspace3Col';

export function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, adminActor } = useCrm();

  const ticket = data.tickets.find((t) => t.id === id) ?? null;

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="rounded border border-line bg-panel p-6 text-center">
          <p className="text-sm font-semibold text-ink">Tiket tidak ditemukan.</p>
          <Link
            to="/admin/tickets"
            className="mt-3 inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Kotak Masuk
          </Link>
        </div>
      </div>
    );
  }

  const messages = visibleMessages(
    data.messages.filter((m) => m.ticketId === ticket.id),
    'admin',
  );

  const requester =
    data.users.find(
      (u) => u.id === ticket.requesterId || u.compositeKey === `${ticket.appId}:${ticket.requesterUid}`,
    ) ?? null;

  const requesterHistory = data.tickets.filter(
    (t) =>
      t.requesterId === ticket.requesterId ||
      (t.appId === ticket.appId && t.requesterUid === ticket.requesterUid),
  );

  const queue = sortQueue(data.tickets);
  const currentIdx = queue.findIndex((t) => t.id === ticket.id);
  const prevTicket = currentIdx > 0 ? queue[currentIdx - 1] : null;
  const nextTicket = currentIdx >= 0 && currentIdx < queue.length - 1 ? queue[currentIdx + 1] : null;

  const handleStatusChange = (status: TicketStatus) => changeTicket(ticket, { status }, adminActor);
  const handlePriorityChange = (priority: typeof ticket.priority) => changeTicket(ticket, { priority }, adminActor);
  const handleCategoryChange = (category: typeof ticket.category) => changeTicket(ticket, { category }, adminActor);
  const handleAssignTicket = (assignee: { id?: string; name?: string; role?: string } | null) =>
    assignTicket(ticket, assignee, adminActor);
  const handleSendMessage = (body: string, isInternalNote: boolean, attachments: string[], nextStatus?: TicketStatus) =>
    replyToTicket(ticket, adminActor, body, { internal: isInternalNote, attachments, nextStatus });
  const handleSolveTicket = (resolution: string, attachments: string[]) =>
    solveTicket(ticket, adminActor, resolution, attachments);

  return (
    <div className="space-y-4 p-5 sm:p-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 font-medium text-ink hover:border-line-strong"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kotak Masuk
          </Link>
          <span className="text-ink-faint">/</span>
          <span className="font-mono font-bold text-ink">{ticket.ticketNumber}</span>
          <span className="hidden text-ink-muted sm:inline">— {ticket.subject}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            disabled={!prevTicket}
            onClick={() => prevTicket && navigate(`/admin/tickets/${prevTicket.id}`)}
            className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2 py-1 text-ink disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={!nextTicket}
            onClick={() => nextTicket && navigate(`/admin/tickets/${nextTicket.id}`)}
            className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2 py-1 text-ink disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <TicketWorkspace3Col
        ticket={ticket}
        messages={messages}
        requester={requester}
        requesterHistory={requesterHistory}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onCategoryChange={handleCategoryChange}
        onAssignTicket={handleAssignTicket}
        onSendMessage={handleSendMessage}
        onSolveTicket={handleSolveTicket}
      />
    </div>
  );
}
