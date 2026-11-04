import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { CrmUser, Ticket, TicketMessage, TicketStatus } from '../../types/crm';
import { TicketWorkspace3Col } from '../../components/crm-admin/TicketWorkspace3Col';

export function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    tickets,
    contacts,
    getTicket,
    getMessages,
    updateStatus,
    updatePriority,
    updateCategory,
    sendMessage,
    solveTicket,
  } = useCrm();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    const t = await getTicket(id);
    setTicket(t);
    if (t) {
      const msgs = await getMessages(t.id);
      setMessages(msgs);
    }
    setLoading(false);
  }, [id, getTicket, getMessages]);

  useEffect(() => {
    setLoading(true);
    loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <div className="p-6 text-xs text-ink-muted">
        Memuat meja kerja tiket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="rounded border border-line bg-panel p-6 text-center">
          <p className="text-sm font-semibold text-ink">
            Tiket tidak ditemukan.
          </p>
          <Link
            to="/admin/tickets"
            className="mt-3 inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Inbox
          </Link>
        </div>
      </div>
    );
  }

  const requester: CrmUser | null =
    contacts.find(
      (c) =>
        c.id === ticket.requesterId ||
        c.compositeKey === `${ticket.appId}:${ticket.requesterUid}`,
    ) ?? null;

  const requesterHistory = tickets.filter(
    (t) =>
      t.requesterId === ticket.requesterId ||
      (t.appId === ticket.appId && t.requesterUid === ticket.requesterUid),
  );

  const currentIdx = tickets.findIndex((t) => t.id === ticket.id);
  const prevTicket = currentIdx > 0 ? tickets[currentIdx - 1] : null;
  const nextTicket =
    currentIdx >= 0 && currentIdx < tickets.length - 1
      ? tickets[currentIdx + 1]
      : null;

  const handleStatusChange = async (status: TicketStatus) => {
    await updateStatus(ticket.id, status);
    await loadDetail();
  };

  const handlePriorityChange = async (priority: Ticket['priority']) => {
    await updatePriority(ticket.id, priority);
    await loadDetail();
  };

  const handleCategoryChange = async (category: Ticket['category']) => {
    await updateCategory(ticket.id, category);
    await loadDetail();
  };

  const handleSendMessage = async (
    body: string,
    isInternalNote: boolean,
    attachments: string[],
    nextStatus?: TicketStatus,
  ) => {
    await sendMessage(ticket.id, body, isInternalNote, attachments, nextStatus);
    await loadDetail();
  };

  const handleSolveTicket = async (
    resolution: string,
    attachments: string[],
  ) => {
    await solveTicket(ticket.id, resolution, attachments);
    await loadDetail();
  };

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
            Unified Inbox
          </Link>
          <span className="text-ink-faint">/</span>
          <span className="font-mono font-bold text-ink">
            {ticket.ticketNumber}
          </span>
          <span className="hidden text-ink-muted sm:inline">
            — {ticket.subject}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            disabled={!prevTicket}
            onClick={() =>
              prevTicket && navigate(`/admin/tickets/${prevTicket.id}`)
            }
            className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2 py-1 text-ink disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={!nextTicket}
            onClick={() =>
              nextTicket && navigate(`/admin/tickets/${nextTicket.id}`)
            }
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
        onSendMessage={handleSendMessage}
        onSolveTicket={handleSolveTicket}
      />
    </div>
  );
}
