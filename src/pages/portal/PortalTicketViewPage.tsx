import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, MessageSquare, Send, Sparkles, Star } from 'lucide-react';
import { CATEGORY_LABEL, STATUS_LABEL } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { timeAgo, visibleMessages } from '../../services/crmLogic';
import { markSolvedByRequester, replyToTicket, submitSatisfactionFeedback } from '../../services/ticketCrmService';
import type { TicketStatus } from '../../types/crm';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ScreenshotUploader } from '../../components/common/ScreenshotUploader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';

const STEPS: TicketStatus[] = ['open', 'in_progress', 'waiting_on_user', 'solved'];

export function PortalTicketViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, requester, requesterActor } = useCrm();
  const toast = useToast();

  const [replyBody, setReplyBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [csatRating, setCsatRating] = useState<number>(0);
  const [csatComment, setCsatComment] = useState<string>('');

  const ticket = data.tickets.find((t) => t.id === id) ?? null;

  // Security check: requester can only view their own ticket
  if (!ticket || !requester || (ticket.requesterId !== requester.id && ticket.requesterUid !== requester.externalUid)) {
    return (
      <div className="rounded-lg border border-line bg-panel p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-ink">Tiket tidak ditemukan atau di luar hak akses akun Anda.</p>
        <Link
          to="/portal"
          className="mt-4 inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Tiket Saya
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

  const handleReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyBody.trim() && attachments.length === 0) return;
    if (!requesterActor) return;
    setSubmitting(true);
    try {
      replyToTicket(ticket, requesterActor, replyBody, { attachments });
      toast.success(
        isSolved
          ? 'Pesan terkirim, tiket Anda telah dibuka kembali'
          : 'Pesan balasan Anda telah terkirim ke Superadmin',
      );
      setReplyBody('');
      setAttachments([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleReply();
    }
  };

  const handleMarkSolved = () => {
    if (!requesterActor) return;
    markSolvedByRequester(ticket, requesterActor);
    toast.success('Terima kasih, tiket telah Anda tandai sebagai selesai');
  };

  const handleSubmitCsat = () => {
    if (!requesterActor || csatRating === 0) return;
    setSubmitting(true);
    try {
      submitSatisfactionFeedback(ticket, requesterActor, csatRating, csatComment);
      toast.success('Terima kasih banyak atas penilaian kepuasan Anda!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/portal"
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Daftar Tiket Saya
        </Link>

        {!isSolved && (
          <button
            type="button"
            disabled={submitting}
            onClick={handleMarkSolved}
            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Tandai Masalah Sudah Selesai
          </button>
        )}
      </div>

      {/* Progress Tracker Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-ink">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs text-ink-muted">· {CATEGORY_LABEL[ticket.category]}</span>
          </div>
          <span className="text-xs text-ink-muted">Dilaporkan {timeAgo(ticket.createdAt)}</span>
        </div>

        {/* 4-Step Lifecycle Indicator with Progress Nodes */}
        <div className="mt-4">
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step, idx) => {
              const reached = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step} className="space-y-1.5">
                  <div
                    className={`h-2 w-full rounded-full transition-colors ${
                      reached
                        ? step === 'solved' || isSolved
                          ? 'bg-emerald-600'
                          : 'bg-ink'
                        : 'bg-line'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] ${
                        isCurrent
                          ? 'font-bold text-ink'
                          : reached
                            ? 'font-medium text-ink-muted'
                            : 'text-ink-faint'
                      }`}
                    >
                      {STATUS_LABEL[step]}
                    </span>
                    {isCurrent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resolution Banner from Admin */}
      {ticket.resolutionSummary && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50/90 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            Solusi Penyelesaian dari Superadmin
          </div>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-emerald-950 font-sans">
            {ticket.resolutionSummary}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-800">
            <Sparkles className="h-3 w-3" />
            <span>Jika kendala masih terjadi, silakan kirim balasan di bawah untuk membuka kembali tiket ini secara otomatis.</span>
          </div>
        </div>
      )}

      {/* CSAT Satisfaction Feedback Card */}
      {isSolved && (
        <div className="rounded-lg border border-line bg-panel p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              Penilaian Layanan &amp; Kepuasan Solusi (CSAT)
            </span>
            {ticket.satisfactionRating ? (
              <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-xs font-bold text-amber-800 border border-amber-200">
                ⭐ {ticket.satisfactionRating} / 5 Bintang
              </span>
            ) : null}
          </div>

          {ticket.satisfactionRating ? (
            <div className="mt-3 text-xs text-ink-muted">
              <p>Terima kasih atas penilaian Anda terhadap penanganan tiket ini.</p>
              {ticket.satisfactionComment && (
                <p className="mt-1 italic text-ink">&ldquo;{ticket.satisfactionComment}&rdquo;</p>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-ink-muted">
                Bagaimana penilaian Anda terhadap kecepatan dan kejelasan solusi yang diberikan oleh Superadmin?
              </p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCsatRating(star)}
                    className="p-1 text-ink transition-transform hover:scale-110 active:scale-95"
                    aria-label={`Beri ${star} bintang`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (csatRating || 0)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-line-strong hover:text-amber-400'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono text-xs font-bold text-ink">
                  {csatRating > 0 ? `${csatRating}/5 Bintang` : 'Pilih bintang'}
                </span>
              </div>
              <input
                type="text"
                value={csatComment}
                onChange={(e) => setCsatComment(e.target.value)}
                placeholder="Tuliskan komentar tambahan (opsional)..."
                className="w-full rounded border border-line bg-canvas px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
              />
              <button
                type="button"
                disabled={csatRating === 0 || submitting}
                onClick={handleSubmitCsat}
                className="inline-flex items-center gap-1.5 rounded bg-ink px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-40 transition-[opacity,transform]"
              >
                Kirim Penilaian
              </button>
            </div>
          )}
        </div>
      )}

      {/* Initial Complaint Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
        <h1 className="text-base font-semibold text-ink">{ticket.subject}</h1>
        <div className="mt-2.5 whitespace-pre-wrap rounded border border-line bg-canvas p-3.5 text-xs leading-relaxed text-ink font-sans">
          {ticket.description}
        </div>

        {ticket.sourcePageUrl && (
          <div className="mt-3 text-xs">
            <span className="text-ink-muted">Halaman aplikasi saat error: </span>
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
          <div className="mt-3.5 border-t border-line pt-3">
            <p className="mb-2 text-xs font-medium text-ink-muted">
              Screenshot Terlampir ({ticket.attachments.length})
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ticket.attachments.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxImg(src)}
                  className="overflow-hidden rounded border border-line bg-subtle hover:border-ink transition-colors"
                >
                  <img src={src} alt={`Screenshot ${idx + 1}`} className="h-24 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Discussion Timeline */}
      <div className="rounded-lg border border-line bg-panel shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-subtle/60 px-4 py-3 text-xs font-semibold text-ink">
          <span>Riwayat Diskusi dengan Superadmin</span>
          <span className="rounded-full bg-subtle px-2 py-0.5 font-mono text-[11px] text-ink-muted">
            {messages.length} pesan
          </span>
        </div>

        <div className="divide-y divide-line">
          {messages.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-ink-muted">
              Belum ada pesan balasan. Anda dapat menambahkan keterangan atau screenshot di bawah.
            </div>
          ) : (
            messages.map((m) => {
              if (m.senderRole === 'system') {
                return (
                  <div key={m.id} className="bg-subtle/40 px-4 py-2 text-center font-mono text-[11px] text-ink-muted">
                    {m.body} · {timeAgo(m.createdAt)}
                  </div>
                );
              }
              const isFromAdmin = m.senderRole === 'admin';
              return (
                <div key={m.id} className={`p-4 transition-colors ${isFromAdmin ? 'bg-sky-50/40 border-l-2 border-l-sky-500' : 'bg-panel'}`}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          isFromAdmin ? 'bg-sky-700 text-white' : 'bg-neutral-800 text-white'
                        }`}
                      >
                        {m.senderName.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-semibold text-ink">{m.senderName}</span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                          isFromAdmin
                            ? 'border-sky-200 bg-sky-100 text-sky-900 font-semibold'
                            : 'border-line bg-subtle text-ink-muted'
                        }`}
                      >
                        {isFromAdmin ? 'Superadmin Support' : requester.appRole}
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-faint">{timeAgo(m.createdAt)}</span>
                  </div>
                  <p className="mt-2.5 pl-8 whitespace-pre-wrap text-xs leading-relaxed text-ink font-sans">{m.body}</p>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2.5 pl-8 flex flex-wrap gap-2">
                      {m.attachments.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightboxImg(src)}
                          className="overflow-hidden rounded border border-line hover:border-ink transition-colors"
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
      <form onSubmit={handleReply} className="space-y-3.5 rounded-lg border border-line bg-panel p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <label htmlFor="portal-reply" className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <MessageSquare className="h-3.5 w-3.5" />
            {isSolved
              ? 'Masih ada kendala? Balas untuk membuka kembali tiket ini'
              : 'Kirim Balasan / Info Tambahan ke Admin'}
          </label>
        </div>

        <textarea
          id="portal-reply"
          rows={3}
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis balasan untuk Superadmin... Tekan Ctrl+Enter untuk langsung mengirim."
          className="w-full rounded border border-line bg-canvas p-3 text-xs leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
        />

        <ScreenshotUploader attachments={attachments} onChange={setAttachments} />

        <div className="flex items-center justify-between pt-1 border-t border-line/60">
          <span className="hidden font-mono text-[10px] text-ink-faint sm:inline">
            (Bisa tekan Ctrl+Enter untuk kirim cepat)
          </span>
          <button
            type="submit"
            disabled={submitting || (!replyBody.trim() && attachments.length === 0)}
            className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-sm disabled:opacity-40 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
            {isSolved ? 'Kirim & Buka Kembali Tiket' : 'Kirim Balasan'}
          </button>
        </div>
      </form>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Lampiran diperbesar"
            className="max-h-[88vh] max-w-full rounded border border-white/20 object-contain shadow-xl"
          />
        </div>
      )}
    </div>
  );
}
