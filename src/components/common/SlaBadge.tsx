import React from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { computeTicketSla } from '../../services/crmLogic';
import type { Ticket } from '../../types/crm';

interface Props {
  ticket: Ticket;
  className?: string;
  showIcon?: boolean;
}

export function SlaBadge({ ticket, className = '', showIcon = true }: Props) {
  const sla = computeTicketSla(ticket);

  let style = 'bg-subtle text-ink-muted border-line/80';
  let Icon = Clock;

  switch (sla.status) {
    case 'achieved':
      style = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      Icon = CheckCircle2;
      break;
    case 'warning':
      style = 'bg-amber-500/10 text-amber-700 border-amber-500/25 font-medium';
      Icon = AlertTriangle;
      break;
    case 'breached':
      style = 'bg-rose-500/10 text-rose-700 border-rose-500/25 font-medium';
      Icon = AlertTriangle;
      break;
    case 'on_track':
    default:
      style = 'bg-subtle text-ink-muted border-line/80';
      Icon = Clock;
      break;
  }

  const deadlineFormatted = new Date(sla.deadline).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <span
      title={`Target SLA: ${deadlineFormatted} (${ticket.priority.toUpperCase()})`}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums select-none transition-colors ${style} ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{sla.label}</span>
    </span>
  );
}
