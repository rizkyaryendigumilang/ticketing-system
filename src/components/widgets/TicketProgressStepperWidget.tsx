import { CheckCircle2, Circle, Clock, MessageSquare, ShieldCheck } from 'lucide-react';
import type { Ticket, TicketMessage } from '../../types/crm';
import { timeAgo } from '../../services/crmLogic';

interface Props {
  ticket: Ticket;
  messages?: TicketMessage[];
}

export function TicketProgressStepperWidget({ ticket, messages = [] }: Props) {
  const isSolved = ticket.status === 'solved' || ticket.status === 'closed';
  const isInProgress = ticket.status === 'in_progress';
  const isWaitingUser = ticket.status === 'waiting_on_user';
  const isOpen = ticket.status === 'open';

  // Determine current active step index (0: Diterima, 1: Ditinjau, 2: Penanganan, 3: Selesai)
  let currentStep = 0;
  if (isSolved) {
    currentStep = 3;
  } else if (isWaitingUser) {
    currentStep = 2;
  } else if (isInProgress || ticket.assignedTo) {
    currentStep = 1;
  }

  const steps = [
    {
      index: 0,
      title: 'Tiket Diterima',
      subtitle: `Dilaporkan ${timeAgo(ticket.createdAt)}`,
      completed: true,
      current: currentStep === 0,
    },
    {
      index: 1,
      title: 'Ditinjau Operator',
      subtitle: ticket.assignedToName
        ? `Ditugaskan ke ${ticket.assignedToName}`
        : isInProgress
        ? 'Sedang dianalisis'
        : 'Menunggu alokasi operator',
      completed: currentStep > 1 || (currentStep === 1 && !isOpen),
      current: currentStep === 1,
    },
    {
      index: 2,
      title: 'Penanganan & Uji Coba',
      subtitle: isWaitingUser
        ? 'Menunggu balasan/konfirmasi Anda'
        : currentStep > 2
        ? 'Solusi telah disiapkan'
        : 'Perbaikan sedang diterapkan',
      completed: currentStep > 2,
      current: currentStep === 2,
    },
    {
      index: 3,
      title: 'Kendala Selesai',
      subtitle: isSolved
        ? `Selesai ${ticket.solvedAt ? timeAgo(ticket.solvedAt) : ''}`
        : 'Verifikasi akhir oleh pelapor',
      completed: isSolved,
      current: currentStep === 3,
    },
  ];

  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-card transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold tracking-tight text-ink">
            Status Progres Penyelesaian Tiket
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink-muted">
          <span>Status Terkini:</span>
          <span
            className={`font-semibold rounded-full px-2 py-0.5 text-[10px] ${
              isSolved
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : isWaitingUser
                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                : isInProgress
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
            }`}
          >
            {isSolved
              ? 'Selesai / Terverifikasi'
              : isWaitingUser
              ? 'Menunggu Balasan Anda'
              : isInProgress
              ? 'Sedang Ditangani'
              : 'Baru Diterima'}
          </span>
        </div>
      </div>

      {/* Stepper Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const isDone = step.completed;
          const isCurrent = step.current;

          return (
            <div key={step.index} className="flex sm:flex-col items-start gap-3 sm:gap-2 relative">
              {/* Step indicator node */}
              <div className="flex items-center sm:w-full">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-ink text-white ring-4 ring-ink/10'
                      : 'border border-line bg-subtle text-ink-faint'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Connecting connector line on desktop */}
                {idx < steps.length - 1 && (
                  <div
                    className={`hidden sm:block h-0.5 flex-1 ml-2 transition-colors ${
                      isDone ? 'bg-emerald-600/70' : 'bg-line'
                    }`}
                  />
                )}
              </div>

              {/* Step label */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-bold leading-tight ${
                    isCurrent
                      ? 'text-ink'
                      : isDone
                      ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-ink-muted'
                  }`}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-faint leading-normal truncate">
                  {step.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contextual User Guidance Box */}
      {isWaitingUser && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-purple-500/30 bg-purple-500/[0.04] p-3 text-xs text-purple-900 dark:text-purple-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              Operator membutuhkan konfirmasi atau rincian tambahan dari Anda untuk melanjutkan penanganan.
            </span>
          </div>
          <a
            href="#reply-form"
            className="shrink-0 rounded-lg bg-purple-700 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-purple-800 transition-colors"
          >
            Tulis Balasan
          </a>
        </div>
      )}
    </div>
  );
}
