import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  MessageSquare,
  Monitor,
  PenLine,
  Send,
  Sparkles,
  UserCheck,
  Users,
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
import { SlaBadge } from '../common/SlaBadge';
import { MessageToolbar } from '../common/MessageToolbar';
import { FormattedMessage } from '../common/FormattedMessage';
import { TicketTimeline } from '../common/TicketTimeline';
import { CannedResponsePicker } from './CannedResponsePicker';
import { CustomerProfileCard } from './CustomerProfileCard';
import { useToast } from '../../context/ToastContext';
import { useCrm } from '../../context/CrmContext';
import {
  pingPresence,
  leavePresence,
  getTicketViewers,
  subscribePresence,
  type AgentPresence,
} from '../../services/presenceService';

interface Props {
  ticket: Ticket;
  messages: TicketMessage[];
  requester: CrmUser | null;
  requesterHistory: Ticket[];
  onStatusChange: (status: TicketStatus) => void;
  onPriorityChange: (priority: TicketPriority) => void;
  onCategoryChange: (category: TicketCategory) => void;
  onAssignTicket?: (assignee: { id?: string; name?: string; role?: string } | null) => void;
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
  onAssignTicket,
  onSendMessage,
  onSolveTicket,
}: Props) {
  const { adminActor, cannedResponses } = useCrm();
  const toast = useToast();
  const [composerMode, setComposerMode] = useState<'public' | 'internal'>('public');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Presence & Collision detection state
  const [otherViewers, setOtherViewers] = useState<AgentPresence[]>([]);

  // Slash commands state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  // Heartbeat presence: broadcasts every 4s and unmounts cleanly
  useEffect(() => {
    pingPresence(ticket.id, adminActor, false);
    setOtherViewers(getTicketViewers(ticket.id, adminActor.id));

    const interval = setInterval(() => {
      pingPresence(ticket.id, adminActor, body.trim().length > 0);
      setOtherViewers(getTicketViewers(ticket.id, adminActor.id));
    }, 4000);

    const unsubscribe = subscribePresence(() => {
      setOtherViewers(getTicketViewers(ticket.id, adminActor.id));
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      leavePresence(ticket.id, adminActor.id);
    };
  }, [ticket.id, adminActor, body]);

  // Global keyboard shortcut 'r' to focus reply composer
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

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

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBody(val);

    // Detect slash command at current cursor position
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursorPos);
    const match = textBefore.match(/\/([a-zA-Z0-9_-]*)$/);
    if (match) {
      setSlashQuery(match[1].toLowerCase());
      setSlashMenuOpen(true);
      setSlashIndex(0);
    } else {
      setSlashMenuOpen(false);
    }
  };

  const filteredCanned = useMemo(() => {
    if (!slashMenuOpen) return [];
    const q = slashQuery.trim().toLowerCase();
    if (!q) return cannedResponses.slice(0, 6);
    return cannedResponses
      .filter((cr) => cr.title.toLowerCase().includes(q) || cr.content.toLowerCase().includes(q))
      .slice(0, 6);
  }, [slashMenuOpen, slashQuery, cannedResponses]);

  const selectCanned = (crText: string) => {
    const cursorPos = textareaRef.current?.selectionStart ?? body.length;
    const textBefore = body.slice(0, cursorPos);
    const match = textBefore.match(/\/([a-zA-Z0-9_-]*)$/);
    if (match && match.index !== undefined) {
      const prefix = body.slice(0, match.index);
      const suffix = body.slice(cursorPos);
      const nextBody = `${prefix}${crText}${suffix}`;
      setBody(nextBody);
      setSlashMenuOpen(false);
      toast.info('Template balasan cepat disisipkan');
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = prefix.length + crText.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 50);
    } else {
      handleInsertCanned(crText);
      setSlashMenuOpen(false);
    }
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
      setSlashMenuOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashMenuOpen && filteredCanned.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % filteredCanned.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex((prev) => (prev - 1 + filteredCanned.length) % filteredCanned.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectCanned(filteredCanned[slashIndex].content);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }

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
      {/* ═══ LEFT COLUMN: Ticket Properties (order-2 on mobile, order-1 on desktop) ═══ */}
      <div className="space-y-4 lg:col-span-3 order-2 lg:order-1">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <span className="text-[11px] font-medium text-ink-muted">Nomor Tiket</span>
              <div className="font-mono text-base font-bold text-ink tracking-tight">
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
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-900 transition-all hover:bg-amber-500/25 active:scale-95 shadow-xs"
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

            {/* Target SLA */}
            <div className="flex items-center justify-between border-t border-line/60 pt-2.5">
              <span className="text-[11px] font-medium text-ink-muted">Target SLA</span>
              <SlaBadge ticket={ticket} />
            </div>

            {/* Petugas PIC */}
            <div className="border-t border-line/60 pt-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-ink-muted">Petugas (PIC)</label>
                {onAssignTicket && (
                  ticket.assignedTo !== adminActor.id ? (
                    <button
                      type="button"
                      onClick={() => onAssignTicket({ id: adminActor.id, name: adminActor.name, role: adminActor.role })}
                      className="text-[10px] font-semibold text-ink hover:underline"
                    >
                      Tugaskan ke Saya
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAssignTicket(null)}
                      className="text-[10px] text-red-600 hover:underline"
                    >
                      Lepas Tugas
                    </button>
                  )
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 rounded border border-line bg-canvas px-2.5 py-1.5 text-xs">
                <span className={`h-2 w-2 rounded-full ${ticket.assignedTo ? 'bg-emerald-600' : 'bg-neutral-400'}`} />
                <span className="font-medium text-ink truncate">
                  {ticket.assignedToName || 'Belum ditugaskan'}
                </span>
              </div>
            </div>

            <div className="border-t border-line pt-3 space-y-1.5 text-[11px] text-ink-muted">
              <div className="flex justify-between">
                <span>Dilaporkan</span>
                <span className="text-ink tabular-nums">
                  {timeAgo(ticket.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Diperbarui</span>
                <span className="text-ink tabular-nums">
                  {timeAgo(ticket.updatedAt)}
                </span>
              </div>
              {ticket.solvedAt && (
                <div className="flex justify-between text-emerald-800">
                  <span>Diselesaikan</span>
                  <span className="font-medium text-emerald-800 tabular-nums">
                    {timeAgo(ticket.solvedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Solved Summary Card */}
        {ticket.resolutionSummary && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs shadow-card">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              Ringkasan Solusi
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-emerald-950 leading-relaxed font-sans">
              {ticket.resolutionSummary}
            </p>
          </div>
        )}

        {/* Ticket Audit Timeline */}
        <TicketTimeline ticket={ticket} messages={messages} />
      </div>

      {/* ═══ CENTER COLUMN: Complaint, Messages & Composer (order-1 on mobile, order-2 on desktop) ═══ */}
      <div className="space-y-4 lg:col-span-6 order-1 lg:order-2">
        {/* Agent Collision Warning Banner */}
        {otherViewers.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-900 shadow-xs animate-fadeIn">
            <div className="flex min-w-0 items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
              <div className="truncate">
                <span className="font-semibold">Peringatan Kolaborasi:</span>{' '}
                <span>
                  {otherViewers.map((v) => v.actorName).join(', ')} juga sedang melihat tiket ini.
                </span>
                {otherViewers.some((v) => v.isTyping) && (
                  <span className="ml-2 inline-flex items-center gap-1 font-semibold text-amber-800">
                    <PenLine className="h-3 w-3 animate-bounce" />
                    sedang mengetik...
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-900 shadow-xs">
              Agen Aktif
            </span>
          </div>
        )}

        {/* Initial Report Card */}
        <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-ink tracking-tight">
              {ticket.subject}
            </h2>
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="font-semibold text-ink">{ticket.requesterName}</span>
            <span>·</span>
            <span className="font-mono text-[11px]">{ticket.requesterUid}</span>
            <span>·</span>
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium text-ink-muted">{ticket.requesterRole}</span>
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
        <div className="rounded-2xl border border-line bg-panel shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-subtle/60 px-4 py-2.5 text-xs font-semibold text-ink">
            <span>Riwayat Percakapan & Catatan Internal</span>
            <span className="rounded-full bg-subtle px-2.5 py-0.5 text-[11px] font-medium text-ink-muted tabular-nums">
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
                      className="bg-subtle/40 px-4 py-2 text-center text-[11px] text-ink-muted tabular-nums"
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
                        ? 'bg-amber-500/[0.04] border-l-2 border-l-amber-500'
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
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                            <Lock className="h-2.5 w-2.5" />
                            Internal Admin Note (Rahasia)
                          </span>
                        ) : isAdminMsg ? (
                          <span className="rounded-full border border-line bg-subtle px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                            Superadmin
                          </span>
                        ) : (
                          <span className="rounded-full border border-line bg-subtle px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                            Pelapor ({ticket.requesterRole})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-faint tabular-nums">
                        {timeAgo(m.createdAt)}
                      </span>
                    </div>

                    <div className="mt-2.5 pl-8 text-xs leading-relaxed text-ink">
                      <FormattedMessage text={m.body} />
                    </div>

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
          className={`rounded-2xl border p-5 shadow-card transition-colors ${
            composerMode === 'internal'
              ? 'border-amber-500/30 bg-amber-500/[0.03]'
              : 'border-line bg-panel'
          }`}
        >
          {/* Composer Mode Tabs & Canned Picker */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setComposerMode('public')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  composerMode === 'public'
                    ? 'bg-ink text-white shadow-xs'
                    : 'text-ink-muted hover:bg-subtle hover:text-ink'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Balasan ke Pelapor
              </button>
              <button
                type="button"
                onClick={() => setComposerMode('internal')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  composerMode === 'internal'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-ink-muted hover:bg-subtle hover:text-ink'
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
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-900">
              <Lock className="h-3.5 w-3.5 shrink-0 text-amber-800" />
              <span>
                <strong>Catatan Internal:</strong> Catatan ini hanya tersimpan di CRM dan <strong>tidak dapat dilihat</strong> oleh pelapor.
              </span>
            </div>
          )}

          {/* Text Area with Formatting Toolbar & Slash Autocomplete */}
          <div className="relative mt-3 overflow-visible">
            {/* Slash Command Autocomplete Popover */}
            {slashMenuOpen && filteredCanned.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-80 max-h-56 overflow-y-auto rounded-lg border border-line bg-panel p-1.5 shadow-xl z-30">
                <div className="flex items-center justify-between border-b border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  <span>Template Balasan Cepat</span>
                  <span className="font-mono text-[9px]">↑/↓ navigasi · Enter</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {filteredCanned.map((cr, idx) => (
                    <button
                      key={cr.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectCanned(cr.content);
                      }}
                      className={`w-full rounded px-2.5 py-1.5 text-left text-xs transition-colors flex flex-col ${
                        idx === slashIndex
                          ? 'bg-ink text-white font-medium'
                          : 'text-ink hover:bg-subtle'
                      }`}
                    >
                      <span className="font-semibold">{cr.title}</span>
                      <span
                        className={`truncate text-[11px] ${
                          idx === slashIndex ? 'text-white/80' : 'text-ink-muted'
                        }`}
                      >
                        {cr.content}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded border border-line focus-within:border-ink">
              <MessageToolbar
                textareaRef={textareaRef}
                value={body}
                onChange={setBody}
              />
              <textarea
                ref={textareaRef}
                rows={4}
                value={body}
                onChange={handleBodyChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  composerMode === 'internal'
                    ? 'Tulis catatan internal untuk tim admin... Ketik "/" untuk template cepat, Ctrl+Enter untuk menyimpan.'
                    : 'Tulis balasan untuk pelapor... Ketik "/" untuk template cepat, Ctrl+Enter untuk mengirim.'
                }
                className="w-full bg-canvas p-3 text-xs leading-relaxed text-ink placeholder:text-ink-faint focus:bg-panel focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-2.5">
            <ScreenshotUploader
              attachments={attachments}
              onChange={setAttachments}
            />
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting || (!body.trim() && attachments.length === 0)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-4 py-2 text-xs font-semibold text-ink hover:bg-line disabled:opacity-40 shadow-xs active:scale-95 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                {composerMode === 'internal'
                  ? 'Simpan Catatan Internal'
                  : 'Kirim Balasan'}
              </button>
              <span className="hidden text-[10px] text-ink-faint sm:inline">
                (Ctrl+Enter)
              </span>
            </div>

            <button
              type="button"
              onClick={handleSolveClick}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Kirim Solusi & Selesaikan
            </button>
          </div>
        </form>
      </div>

      {/* ═══ RIGHT COLUMN: Customer CRM Card ═══ */}
      <div className="lg:col-span-3 order-3">
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
