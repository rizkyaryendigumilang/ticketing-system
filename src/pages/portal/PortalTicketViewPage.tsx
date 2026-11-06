import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { CATEGORY_LABEL, STATUS_LABEL } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { timeAgo, visibleMessages } from '../../services/crmLogic';
import { markSolvedByRequester, replyToTicket } from '../../services/ticketCrmService';
import { useParams } from 'react-router-dom';
import type { TicketStatus } from '../../types/crm';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ScreenshotUploader } from '../../components/common/ScreenshotUploader';
import { StatusBadge } from '../../components/common/StatusBadge';

const STEPS: TicketStatus[] = ['open', 'in_progress', 'waiting_on_user', 'solved'];

export function PortalTicketViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, requester, requesterActor } = useCrm();

  const [replyBody, setReplyBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const ticket = data.tickets.find((t) => t.id === id) ?? null;

  // Security: requester can only view their own ticket
  if (!ticket || !requester || (ticket.requesterId !== requester.id && ticket.requesterUid !== requester.externalUid)) {
    return (
      <div className="rounded border border-line bg-panel p-6 text-center">
        <p className="text-sm font-semibold text-ink">Tiket tidak ditemukan.</p>
        <Link
          to="/portal"
          className="mt-3 inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Portal
        </Link>
      </div>
    );
  }

  const messages = visibleMessages(
    data.messages.filter((m) => m.ticketId === ticket.id),
    'requester',
  );

  const isSolved = ticket.status === 'solved' || ticket.status === 'closed';
  const currentStepIdx = ticket.status === 'closed' ? 3 : Math.max(0, STEPS.indexOf(ticket.status));

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() && attachments.length === 0) return;
    if (!requesterActor) return;
    setSubmitting(true);
    replyToTicket(ticket, requesterActor, replyBody, { attachments });
    setReplyBody('');
    setAttachments([]);
    setSubmitting(false);
  };

  const handleMarkSolved = () => {
    if (!requesterActor) return;
    markSolvedByRequester(ticket, requesterActor);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/portal"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Daftar Tiket Saya
        </Link>

        {!isSolved && (
          <button
            type="button"
            disabled={submitting}
            onClick={handleMarkSolved}
            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Tandai Masalah Sudah Selesai
          </button>
        )}
      </div>

      {/* Progress Tracker */}
      <div className="rounded border border-line bg-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-ink">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs text-ink-muted">· {CATEGORY_LABEL[ticket.category]}</span>
          </div>
          <span className="font-mono text-xs text-ink-muted">Dilaporkan {timeAgo(ticket.createdAt)}</span>
        </div>

        {/* 4-Step Lifecycle Indicator */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {STEPS.map((step, idx) => {
            const reached = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step} className="space-y-1">
                <div
                  className={`h-1.5 w-full rounded-full ${
                    reached ? (step === 'solved' || isSolved ? 'bg-emerald-600' : 'bg-ink') : 'bg-line'
                  }`}
                />
                <div
                  className={`text-[11px] ${
                    isCurrent ? 'font-semibold text-ink' : reached ? 'text-ink-muted' : 'text-ink-faint'
                  }`}
                >
                  {STATUS_LABEL[step]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolution Banner */}
      {ticket.resolutionSummary && (
        <div className="rounded border border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            Solusi Penyelesaian dari Superadmin
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-emerald-950">
            {ticket.resolutionSummary}
          </p>
        </div>
      )}

      {/* Initial Complaint */}
      <div className="rounded border border-line bg-panel p-4">
        <h1 className="text-base font-semibold text-ink">{ticket.subject}</h1>
        <p className="mt-2 whitespace-pre-wrap rounded border border-line bg-canvas p-3.5 text-xs leading-relaxed text-ink">
          {ticket.description}
        </p>

        {ticket.sourcePageUrl && (
          <div className="mt-2.5 text-xs">
            <span className="text-ink-muted">Halaman terkait: </span>
            <a
              href={ticket.sourcePageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-800 hover:underline"
            >
              {ticket.sourcePageUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {ticket.attachments.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 text-xs font-medium text-ink-muted">
              Screenshot Terlampir ({ticket.attachments.length})
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ticket.attachments.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxImg(src)}
                  className="overflow-hidden rounded border border-line bg-subtle"
                >
                  <img src={src} alt={`Screenshot ${idx + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Public Conversation Thread */}
      <div className="rounded border border-line bg-panel">
        <div className="border-b border-line bg-subtle/60 px-4 py-2.5 text-xs font-semibold text-ink">
          Riwayat Diskusi dengan Superadmin ({messages.length})
        </div>

        <div className="divide-y divide-line">
          {messages.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-ink-muted">
              Belum ada balasan. Anda dapat menambahkan keterangan atau screenshot di bawah.
            </div>
          ) : (
            messages.map((m) => {
              if (m.senderRole === 'system') {
                return (
                  <div key={m.id} className="bg-subtle/40 px-4 py-2 font-mono text-[11px] text-ink-muted">
                    {m.body} · {timeAgo(m.createdAt)}
                  </div>
                );
              }
              const isFromAdmin = m.senderRole === 'admin';
              return (
                <div key={m.id} className={`p-4 ${isFromAdmin ? 'bg-sky-50/40' : 'bg-panel'}`}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{m.senderName}</span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                          isFromAdmin
                            ? 'border-sky-200 bg-sky-100 text-sky-900'
                            : 'border-line bg-subtle text-ink-muted'
                        }`}
                      >
                        {isFromAdmin ? 'Superadmin Support' : requester.appRole}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-ink-faint">{timeAgo(m.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink">{m.body}</p>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightboxImg(src)}
                          className="overflow-hidden rounded border border-line"
                        >
                          <img src={src} alt={`Lampiran ${i + 1}`} className="h-16 w-24 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reply Form */}
      <form onSubmit={handleReply} className="space-y-3 rounded border border-line bg-panel p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="portal-reply" className="text-xs font-semibold text-ink">
            {isSolved
              ? 'Masih ada kendala? Balas untuk membuka kembali tiket ini'
              : 'Balas Pesan / Tambah Info Tambahan'}
          </label>
        </div>

        <textarea
          id="portal-reply"
          rows={3}
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Tulis balasan untuk Superadmin..."
          className="w-full rounded border border-line bg-canvas p-3 text-xs leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
        />

        <ScreenshotUploader attachments={attachments} onChange={setAttachments} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || (!replyBody.trim() && attachments.length === 0)}
            className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            {isSolved ? 'Kirim & Buka Kembali Tiket' : 'Kirim Balasan'}
          </button>
        </div>
      </form>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Lampiran diperbesar"
            className="max-h-[88vh] max-w-full rounded border border-white/20 object-contain"
          />
        </div>
      )}
    </div>
  );
}
