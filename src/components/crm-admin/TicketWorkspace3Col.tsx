import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Lock,
  MessageSquare,
  Monitor,
  Send,
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

interface Props {
  ticket: Ticket;
  messages: TicketMessage[];
  requester: CrmUser | null;
  requesterHistory: Ticket[];
  onStatusChange: (status: TicketStatus) => Promise<void>;
  onPriorityChange: (priority: TicketPriority) => Promise<void>;
  onCategoryChange: (category: TicketCategory) => Promise<void>;
  onSendMessage: (
    body: string,
    isInternalNote: boolean,
    attachments: string[],
    nextStatus?: TicketStatus,
  ) => Promise<void>;
  onSolveTicket: (resolution: string, attachments: string[]) => Promise<void>;
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
  const [composerMode, setComposerMode] = useState<'public' | 'internal'>('public');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const app = getApp(ticket.appId);

  const handleInsertCanned = (text: string) => {
    setBody((prev) => (prev.trim() ? `${prev}\n\n${text}` : text));
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && attachments.length === 0) return;
    setSubmitting(true);
    try {
      const isInternal = composerMode === 'internal';
      const nextStatus: TicketStatus | undefined =
        !isInternal && ticket.status === 'open' ? 'waiting_on_user' : undefined;
      await onSendMessage(body, isInternal, attachments, nextStatus);
      setBody('');
      setAttachments([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSolveClick = async () => {
    const resolution =
      body.trim() ||
      'Kendala telah diperbaiki oleh Superadmin. Silakan muat ulang halaman aplikasi dan coba kembali.';
    setSubmitting(true);
    try {
      await onSolveTicket(resolution, attachments);
      setBody('');
      setAttachments([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* LEFT COLUMN: Ticket Properties */}
      <div className="space-y-4 lg:col-span-3">
        <div className="rounded border border-line bg-panel p-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <span className="text-[11px] text-ink-muted">Nomor Tiket</span>
              <div className="font-mono text-base font-bold text-ink">
                {ticket.ticketNumber}
              </div>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="mt-3 space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted">
                Aplikasi Asal
              </label>
              <div className="mt-1">
                <AppBadge appId={ticket.appId} showPrefix />
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
                onChange={(e) => onStatusChange(e.target.value as TicketStatus)}
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
                  onPriorityChange(e.target.value as TicketPriority)
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
                  onCategoryChange(e.target.value as TicketCategory)
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

        {ticket.resolutionSummary && (
          <div className="rounded border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              Catatan Penyelesaian (Solved)
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-emerald-900/90 leading-relaxed">
              {ticket.resolutionSummary}
            </p>
          </div>
        )}
      </div>

      {/* CENTER COLUMN: Complaint, Attachments, Conversation & Solve Composer */}
      <div className="space-y-4 lg:col-span-6">
        {/* Initial Report */}
        <div className="rounded border border-line bg-panel p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-ink">
              {ticket.subject}
            </h2>
            <PriorityBadge priority={ticket.priority} size="sm" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="font-medium text-ink">{ticket.requesterName}</span>
            <span>·</span>
            <span className="font-mono text-[11px]">{ticket.requesterUid}</span>
            <span>·</span>
            <span>{ticket.requesterRole}</span>
          </div>

          <div className="mt-3 rounded border border-line bg-canvas p-3.5 text-sm leading-relaxed text-ink whitespace-pre-wrap">
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
                    className="overflow-hidden rounded border border-line bg-subtle hover:border-ink"
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
        <div className="rounded border border-line bg-panel">
          <div className="border-b border-line bg-subtle/60 px-4 py-2.5 text-xs font-semibold text-ink">
            Riwayat Percakapan & Catatan Internal ({messages.length})
          </div>

          <div className="divide-y divide-line">
            {messages.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-ink-muted">
                Belum ada balasan pada tiket ini. Gunakan form di bawah untuk membalas pelapor atau menulis catatan internal.
              </div>
            ) : (
              messages.map((m) => {
                if (m.senderRole === 'system') {
                  return (
                    <div
                      key={m.id}
                      className="bg-subtle/40 px-4 py-2 font-mono text-[11px] text-ink-muted"
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
                    className={`p-4 ${
                      isInternal
                        ? 'bg-amber-50/70'
                        : isAdminMsg
                          ? 'bg-panel'
                          : 'bg-canvas/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">
                          {m.senderName}
                        </span>
                        {isInternal ? (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                            <Lock className="h-2.5 w-2.5" />
                            Internal Admin Note
                          </span>
                        ) : isAdminMsg ? (
                          <span className="rounded border border-line bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                            Superadmin
                          </span>
                        ) : (
                          <span className="rounded border border-line bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                            Pelapor
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-ink-faint">
                        {timeAgo(m.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink">
                      {m.body}
                    </p>

                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.attachments.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setLightboxImg(src)}
                            className="overflow-hidden rounded border border-line"
                          >
                            <img
                              src={src}
                              alt={`Lampiran pesan ${i + 1}`}
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
          className={`rounded border p-4 ${
            composerMode === 'internal'
              ? 'border-amber-300 bg-amber-50/40'
              : 'border-line bg-panel'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setComposerMode('public')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${
                  composerMode === 'public'
                    ? 'bg-ink text-white'
                    : 'text-ink-muted hover:bg-subtle'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Public Reply (Terlihat oleh User)
              </button>
              <button
                type="button"
                onClick={() => setComposerMode('internal')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${
                  composerMode === 'internal'
                    ? 'bg-amber-600 text-white'
                    : 'text-ink-muted hover:bg-subtle'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Internal Admin Note (Rahasia)
              </button>
            </div>

            <CannedResponsePicker onSelect={handleInsertCanned} />
          </div>

          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              composerMode === 'internal'
                ? 'Tulis catatan teknis rahasia (hanya terlihat oleh Superadmin di CRM)...'
                : 'Tulis balasan atau penjelasan solusi untuk pelapor...'
            }
            className="mt-3 w-full rounded border border-line bg-canvas p-3 text-xs leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
          />

          <div className="mt-2.5">
            <ScreenshotUploader
              attachments={attachments}
              onChange={setAttachments}
              compact
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
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

            <button
              type="button"
              onClick={handleSolveClick}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              ✅ Kirim Solusi & Tandai Solved
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: Customer CRM Card */}
      <div className="lg:col-span-3">
        <CustomerProfileCard
          user={requester}
          currentTicket={ticket}
          app={app}
          ticketHistory={requesterHistory}
        />
      </div>

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
