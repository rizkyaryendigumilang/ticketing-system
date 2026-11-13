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

  let style = 'bg-subtle text-ink-muted border-line';
  let Icon = Clock;

  switch (sla.status) {
    case 'achieved':
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      break;
    case 'warning':
      style = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      Icon = AlertTriangle;
      break;
    case 'breached':
      style = 'bg-red-50 text-red-700 border-red-300 font-semibold';
      Icon = AlertTriangle;
      break;
    case 'on_track':
    default:
      style = 'bg-subtle text-ink-muted border-line';
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
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono tabular-nums select-none ${style} ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{sla.label}</span>
    </span>
  );
}
