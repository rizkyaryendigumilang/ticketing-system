import React from 'react';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Star,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import type { Ticket, TicketMessage } from '../../types/crm';
import { computeTicketSla, timeAgo } from '../../services/crmLogic';
import { getApp } from '../../config/vpsAppsConfig';

interface Props {
  ticket: Ticket;
  messages?: TicketMessage[];
}

export function TicketTimeline({ ticket, messages = [] }: Props) {
  const app = getApp(ticket.appId);
  const sla = computeTicketSla(ticket);
  const publicReplies = messages.filter((m) => !m.isInternalNote && m.senderRole !== 'system');

  return (
    <div className="rounded-lg border border-line bg-panel p-4 text-xs shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <Clock className="h-4 w-4 text-ink-muted" />
        <h3 className="font-semibold text-ink">Garis Waktu & Jejak Audit (Timeline)</h3>
      </div>

      <div className="mt-3.5 relative border-l border-line pl-4 ml-2 space-y-4">
        {/* Milestone 1: Tiket Dibuat */}
        <div className="relative">
          <span className="absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Tiket Dilaporkan</span>
              <span className="font-mono text-[10px] text-ink-muted">{timeAgo(ticket.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              Oleh <strong className="text-ink">{ticket.requesterName}</strong> ({ticket.requesterRole}) dari aplikasi{' '}
              <strong className="text-ink">{app?.name ?? ticket.appId}</strong>.
            </p>
          </div>
        </div>

        {/* Milestone 2: Penugasan Operator */}
        <div className="relative">
          <span
            className={`absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${
              ticket.assignedToName ? 'bg-sky-600 text-white' : 'bg-neutral-300 text-neutral-600'
            }`}
          >
            <UserCheck className="h-2 w-2" />
          </span>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Penugasan Operator</span>
            </div>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {ticket.assignedToName ? (
                <>
                  Ditugaskan ke <strong className="text-ink">{ticket.assignedToName}</strong>
                </>
              ) : (
                <span className="italic text-ink-faint">Menunggu penugasan operator helpdesk</span>
              )}
            </p>
          </div>
        </div>

        {/* Milestone 3: Interaksi Pesan */}
        {publicReplies.length > 0 && (
          <div className="relative">
            <span className="absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-white">
              <MessageSquare className="h-2 w-2" />
            </span>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Aktivitas Diskusi</span>
                <span className="font-mono text-[10px] text-ink-muted">
                  {timeAgo(publicReplies[publicReplies.length - 1].createdAt)}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {publicReplies.length} balasan tercatat dalam percakapan.
              </p>
            </div>
          </div>
        )}

        {/* Milestone 4: SLA & Target Penyelesaian */}
        <div className="relative">
          <span
            className={`absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${
              sla.status === 'breached'
                ? 'bg-red-600 text-white'
                : sla.status === 'warning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
            }`}
          >
            {sla.status === 'breached' ? (
              <AlertTriangle className="h-2 w-2" />
            ) : (
              <Clock className="h-2 w-2" />
            )}
          </span>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">
                Target SLA ({Math.round(sla.durationMs / 3600000)} Jam)
              </span>
              <span className="font-mono text-[10px] text-ink-muted">{sla.label}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {sla.status === 'achieved' && 'Penyelesaian tepat waktu sesuai standar SLA.'}
              {sla.status === 'on_track' && `Berjalan lancar sesuai target (${sla.label}).`}
              {sla.status === 'warning' && `Perhatian: Mendekati batas SLA (${sla.label}).`}
              {sla.status === 'breached' && `Batas waktu SLA terlampaui (${sla.label}).`}
            </p>
          </div>
        </div>

        {/* Milestone 5: Penyelesaian Tiket */}
        {(ticket.status === 'solved' || ticket.status === 'closed') && (
          <div className="relative">
            <span className="absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-2 w-2" />
            </span>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-800">Tiket Diselesaikan</span>
                {ticket.solvedAt && (
                  <span className="font-mono text-[10px] text-emerald-700">{timeAgo(ticket.solvedAt)}</span>
                )}
              </div>
              {ticket.resolutionSummary && (
                <p className="mt-1 rounded bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-950 font-sans leading-relaxed">
                  {ticket.resolutionSummary}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Milestone 6: Ulasan Kepuasan Pelapor (CSAT) */}
        {ticket.satisfactionRating && (
          <div className="relative">
            <span className="absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-amber-950">
              <Star className="h-2 w-2 fill-current" />
            </span>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Ulasan Kepuasan Pelapor</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${
                        s <= (ticket.satisfactionRating ?? 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {ticket.satisfactionComment && (
                <p className="mt-1 italic text-[11px] text-ink-muted">
                  &ldquo;{ticket.satisfactionComment}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
