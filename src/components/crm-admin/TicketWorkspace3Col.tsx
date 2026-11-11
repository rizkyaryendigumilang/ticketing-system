import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  MessageSquare,
  Monitor,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  CATEGORY_LABEL,
  getApp,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
} from '../../config/vpsAppsConfig';
import { timeAgo } from '../../services/crmLogic';
import type {
  CrmUser,
  Ticket,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from '../../types/crm';
import { AppBadge } from '../common/AppBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ScreenshotUploader } from '../common/ScreenshotUploader';
import { StatusBadge } from '../common/StatusBadge';
import { CannedResponsePicker } from './CannedResponsePicker';
import { CustomerProfileCard } from './CustomerProfileCard';
import { useToast } from '../../context/ToastContext';

interface Props {
  ticket: Ticket;
  messages: TicketMessage[];
  requester: CrmUser | null;
  requesterHistory: Ticket[];
  onStatusChange: (status: TicketStatus) => void;
  onPriorityChange: (priority: TicketPriority) => void;
  onCategoryChange: (category: TicketCategory) => void;
  onSendMessage: (body: string, isInternalNote: boolean, attachments: string[], nextStatus?: TicketStatus) => void;
  onSolveTicket: (resolution: string, attachments: string[]) => void;
}

const CATEGORIES: TicketCategory[] = [
  'bug_error',
  'account_login',
  'data_transaction',
  'feature_question',
  'other',
];

export function TicketWorkspace3Col({
  ticket,
  messages,
  requester,
  requesterHistory,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onSendMessage,
  onSolveTicket,
}: Props) {
  const toast = useToast();
  const [composerMode, setComposerMode] = useState<'public' | 'internal'>('public');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  React.useEffect(() => {
    if (!lightboxImg) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImg(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightboxImg]);

  const app = getApp(ticket.appId);

  const handleInsertCanned = (text: string) => {
    setBody((prev) => (prev.trim() ? `${prev}\n\n${text}` : text));
    toast.info('Template balasan cepat dimasukkan ke kolom teks');
  };

  const handleStatusSelect = (st: TicketStatus) => {
    onStatusChange(st);
    toast.success(`Status tiket diubah menjadi: ${STATUS_LABEL[st]}`);
  };

  const handlePrioritySelect = (pr: TicketPriority) => {
    onPriorityChange(pr);
    toast.info(`Prioritas tiket diubah menjadi: ${PRIORITY_LABEL[pr]}`);
  };

  const handleCategorySelect = (cat: TicketCategory) => {
    onCategoryChange(cat);
    toast.info(`Kategori masalah diubah menjadi: ${CATEGORY_LABEL[cat]}`);
  };

  const handleReplySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!body.trim() && attachments.length === 0) return;
    setSubmitting(true);
    try {
      const isInternal = composerMode === 'internal';
      const nextStatus: TicketStatus | undefined =
        !isInternal && ticket.status === 'open' ? 'waiting_on_user' : undefined;
      onSendMessage(body, isInternal, attachments, nextStatus);
      toast.success(
        isInternal
          ? 'Catatan internal rahasia berhasil disimpan'
          : 'Balasan terkirim ke pelapor',
      );
      setBody('');
      setAttachments([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleReplySubmit();
    }
  };

  const handleSolveClick = () => {
    const resolution =
      body.trim() ||
      'Kendala telah diperiksa dan diperbaiki oleh Superadmin. Silakan muat ulang halaman aplikasi dan coba kembali.';
    setSubmitting(true);
    try {
      onSolveTicket(resolution, attachments);
      toast.success(`Tiket #${ticket.ticketNumber} berhasil diselesaikan`);
      setBody('');
      setAttachments([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* ═══ LEFT COLUMN: Ticket Properties ═══ */}
      <div className="space-y-4 lg:col-span-3">
        <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <span className="text-[11px] font-medium text-ink-muted">Nomor Tiket</span>
              <div className="font-mono text-base font-bold text-ink">
                {ticket.ticketNumber}
              </div>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          {/* Quick Action Button for Open Ticket */}
          {ticket.status === 'open' && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => handleStatusSelect('in_progress')}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-amber-500/15 border border-amber-400/40 px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-500/25"
              >
                <Clock className="h-3.5 w-3.5 text-amber-700" />
                Mulai Kerjakan
              </button>
            </div>
          )}

          <div className="mt-3.5 space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted">
                Aplikasi Asal
              </label>
              <div className="mt-1">
                <AppBadge appId={ticket.appId} />
              </div>
            </div>

            <div>
              <label
                htmlFor="ticket-status"
                className="block text-[11px] font-medium text-ink-muted"
              >
                Status Tiket
              </label>
              <select
                id="ticket-status"
                value={ticket.status}
                onChange={(e) => handleStatusSelect(e.target.value as TicketStatus)}
                className="mt-1 w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink focus:border-ink focus:outline-none"
              >
                {STATUS_ORDER.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABEL[st]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-priority"
                className="block text-[11px] font-medium text-ink-muted"
              >
                Prioritas
              </label>
              <select
                id="ticket-priority"
                value={ticket.priority}
                onChange={(e) =>
                  handlePrioritySelect(e.target.value as TicketPriority)
                }
                className="mt-1 w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink focus:border-ink focus:outline-none"
              >
                {PRIORITY_ORDER.map((pr) => (
                  <option key={pr} value={pr}>
                    {PRIORITY_LABEL[pr]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-category"
                className="block text-[11px] font-medium text-ink-muted"
              >
                Kategori Masalah
              </label>
              <select
                id="ticket-category"
                value={ticket.category}
                onChange={(e) =>
                  handleCategorySelect(e.target.value as TicketCategory)
                }
                className="mt-1 w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink focus:border-ink focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABEL[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-line pt-3 space-y-1.5 text-[11px] text-ink-muted">
              <div className="flex justify-between">
                <span>Dilaporkan</span>
                <span className="font-mono text-ink">
                  {timeAgo(ticket.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Diperbarui</span>
                <span className="font-mono text-ink">
                  {timeAgo(ticket.updatedAt)}
                </span>
              </div>
              {ticket.solvedAt && (
                <div className="flex justify-between text-emerald-800">
                  <span>Diselesaikan</span>
                  <span className="font-mono font-medium">
                    {timeAgo(ticket.solvedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Solved Summary Card */}
        {ticket.resolutionSummary && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50/80 p-3.5 text-xs shadow-sm">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              Catatan Solusi Penyelesaian
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-emerald-950 leading-relaxed font-sans">
              {ticket.resolutionSummary}
            </p>
          </div>
        )}
      </div>

      {/* ═══ CENTER COLUMN: Complaint, Messages & Composer ═══ */}
      <div className="space-y-4 lg:col-span-6">
        {/* Initial Report Card */}
        <div className="rounded-lg border border-line bg-panel p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-ink">
              {ticket.subject}
            </h2>
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="font-semibold text-ink">{ticket.requesterName}</span>
            <span>·</span>
            <span className="font-mono text-[11px]">{ticket.requesterUid}</span>
            <span>·</span>
            <span className="rounded bg-subtle px-1.5 py-0.5 text-[10px]">{ticket.requesterRole}</span>
          </div>

          <div className="mt-3.5 rounded border border-line bg-canvas p-3.5 text-xs leading-relaxed text-ink whitespace-pre-wrap font-sans">
            {ticket.description}
          </div>

          {(ticket.sourcePageUrl || ticket.deviceInfo) && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              {ticket.sourcePageUrl && (
                <a
                  href={ticket.sourcePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-800 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {ticket.sourcePageUrl}
                </a>
              )}
              {ticket.deviceInfo && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <Monitor className="h-3 w-3" />
                  {ticket.deviceInfo}
                </span>
              )}
            </div>
          )}

          {ticket.attachments.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-2 text-xs font-medium text-ink-muted">
                Lampiran Screenshot ({ticket.attachments.length})
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ticket.attachments.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxImg(src)}
                    className="overflow-hidden rounded border border-line bg-subtle hover:border-ink transition-colors"
                  >
                    <img
                      src={src}
                      alt={`Screenshot ${idx + 1}`}
                      className="h-24 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversation Thread */}
        <div className="rounded-lg border border-line bg-panel shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-subtle/60 px-4 py-2.5 text-xs font-semibold text-ink">
            <span>Riwayat Percakapan & Catatan Internal</span>
            <span className="rounded-full bg-subtle px-2 py-0.5 font-mono text-[11px] text-ink-muted">
              {messages.length} pesan
            </span>
          </div>

          <div className="divide-y divide-line">
            {messages.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-ink-muted">
                Belum ada pesan balasan pada tiket ini. Tulis balasan atau catatan internal menggunakan form di bawah.
              </div>
            ) : (
              messages.map((m) => {
                if (m.senderRole === 'system') {
                  return (
                    <div
                      key={m.id}
                      className="bg-subtle/40 px-4 py-2 text-center font-mono text-[11px] text-ink-muted"
                    >
                      {m.body} · {timeAgo(m.createdAt)}
                    </div>
                  );
                }

                const isInternal = m.isInternalNote;
                const isAdminMsg = m.senderRole === 'admin';

                return (
                  <div
                    key={m.id}
                    className={`p-4 transition-colors ${
                      isInternal
                        ? 'bg-amber-50/60 border-l-2 border-l-amber-500'
                        : isAdminMsg
                          ? 'bg-panel'
                          : 'bg-canvas/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Avatar initials */}
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                            isInternal
                              ? 'bg-amber-200 text-amber-900'
                              : isAdminMsg
                                ? 'bg-ink text-white'
                                : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {m.senderName.slice(0, 2).toUpperCase()}
                        </span>

                        <span className="font-semibold text-ink">
                          {m.senderName}
                        </span>

                        {isInternal ? (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                            <Lock className="h-2.5 w-2.5" />
                            Internal Admin Note (Rahasia)
                          </span>
                        ) : isAdminMsg ? (
                          <span className="rounded border border-line bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                            Superadmin
                          </span>
                        ) : (
                          <span className="rounded border border-line bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                            Pelapor ({ticket.requesterRole})
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-ink-faint">
                        {timeAgo(m.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2.5 whitespace-pre-wrap text-xs leading-relaxed text-ink pl-8">
                      {m.body}
                    </p>

                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2.5 pl-8 flex flex-wrap gap-2">
                        {m.attachments.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setLightboxImg(src)}
                            className="overflow-hidden rounded border border-line hover:border-ink transition-colors"
                          >
                            <img
                              src={src}
                              alt={`Lampiran ${i + 1}`}
                              className="h-16 w-24 object-cover"
                            />
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

        {/* Reply & Solve Composer */}
        <form
          onSubmit={handleReplySubmit}
          className={`rounded-lg border p-4 shadow-sm transition-colors ${
            composerMode === 'internal'
              ? 'border-amber-300/80 bg-amber-50/40'
              : 'border-line bg-panel'
          }`}
        >
          {/* Composer Mode Tabs & Canned Picker */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setComposerMode('public')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  composerMode === 'public'
                    ? 'bg-ink text-white'
                    : 'text-ink-muted hover:bg-subtle'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Balasan ke Pelapor
              </button>
              <button
                type="button"
                onClick={() => setComposerMode('internal')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  composerMode === 'internal'
                    ? 'bg-amber-600 text-white'
                    : 'text-ink-muted hover:bg-subtle'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Catatan Internal
              </button>
            </div>

            <CannedResponsePicker onSelect={handleInsertCanned} />
          </div>

          {/* Internal Note Banner Warning */}
          {composerMode === 'internal' && (
            <div className="mt-2.5 flex items-center gap-2 rounded bg-amber-100/80 border border-amber-300/80 px-3 py-1.5 text-[11px] text-amber-900">
              <Lock className="h-3.5 w-3.5 shrink-0 text-amber-800" />
              <span>
                <strong>Catatan Internal:</strong> Catatan ini hanya tersimpan di CRM dan <strong>tidak dapat dilihat</strong> oleh pelapor.
              </span>
            </div>
          )}

          {/* Text Area */}
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              composerMode === 'internal'
                ? 'Tulis catatan teknis rahasia (hanya terlihat oleh Superadmin di CRM)... Tekan Ctrl+Enter untuk menyimpan.'
                : 'Tulis balasan atau instruksi untuk pelapor... Tekan Ctrl+Enter untuk mengirim.'
            }
            className="mt-3 w-full rounded border border-line bg-canvas p-3 text-xs leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
          />

          <div className="mt-2.5">
            <ScreenshotUploader
              attachments={attachments}
              onChange={setAttachments}
            />
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/60">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting || (!body.trim() && attachments.length === 0)}
                className="inline-flex items-center gap-1.5 rounded border border-line-strong bg-subtle px-3.5 py-2 text-xs font-semibold text-ink hover:bg-line disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                {composerMode === 'internal'
                  ? 'Simpan Catatan Internal'
                  : 'Kirim Balasan'}
              </button>
              <span className="hidden font-mono text-[10px] text-ink-faint sm:inline">
                (Ctrl+Enter)
              </span>
            </div>

            <button
              type="button"
              onClick={handleSolveClick}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Kirim Solusi & Selesaikan
            </button>
          </div>
        </form>
      </div>

      {/* ═══ RIGHT COLUMN: Customer CRM Card ═══ */}
      <div className="lg:col-span-3">
        <CustomerProfileCard
          user={requester}
          currentTicket={ticket}
          app={app}
          ticketHistory={requesterHistory}
        />
      </div>

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
