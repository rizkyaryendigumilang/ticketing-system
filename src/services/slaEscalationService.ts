import type { Ticket } from '../types/crm.ts';
import { computeTicketSla } from './crmLogic.ts';
import { changeTicket, type Actor } from './ticketCrmService.ts';
import { recordAuditLog } from './auditLogService.ts';

export interface SlaEscalationResult {
  escalatedTicketIds: string[];
  autoClosedTicketIds: string[];
}

export const SLA_DAEMON_ACTOR: Actor = {
  id: 'system-sla-daemon',
  name: 'Sistem Otomasi SLA',
  role: 'admin',
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Evaluates tickets for SLA breaches and inactive solved states.
 * - Automatically escalates breached open/in_progress tickets to 'urgent' priority.
 * - Automatically closes 'solved' tickets inactive for > 72 hours.
 */
export function runSlaAutomation(
  tickets: Ticket[],
  now = Date.now(),
  autoCloseThresholdMs = THREE_DAYS_MS,
): SlaEscalationResult {
  const result: SlaEscalationResult = {
    escalatedTicketIds: [],
    autoClosedTicketIds: [],
  };

  for (const ticket of tickets) {
    // 1. SLA Breach Escalation
    if (ticket.status === 'open' || ticket.status === 'in_progress') {
      const sla = computeTicketSla(ticket, now);
      if (sla.status === 'breached' && ticket.priority !== 'urgent') {
        changeTicket(ticket, { priority: 'urgent' }, SLA_DAEMON_ACTOR);
        ticket.priority = 'urgent';
        recordAuditLog({
          action: 'sla_breached',
          actorId: SLA_DAEMON_ACTOR.id,
          actorName: SLA_DAEMON_ACTOR.name,
          actorRole: 'system',
          target: `Tiket #${ticket.ticketNumber}`,
          details: `Tiket #${ticket.ticketNumber} melewati tenggat SLA dan otomatis dieskalasi ke Darurat (Urgent).`,
        });
        result.escalatedTicketIds.push(ticket.id);
      }
    }

    // 2. Auto-Close Inactive Solved Tickets
    if (ticket.status === 'solved') {
      const solvedMs = ticket.solvedAt
        ? Date.parse(ticket.solvedAt)
        : Date.parse(ticket.updatedAt || ticket.createdAt);

      if (!isNaN(solvedMs) && now - solvedMs >= autoCloseThresholdMs) {
        changeTicket(ticket, { status: 'closed' }, SLA_DAEMON_ACTOR);
        ticket.status = 'closed';
        recordAuditLog({
          action: 'auto_closed',
          actorId: SLA_DAEMON_ACTOR.id,
          actorName: SLA_DAEMON_ACTOR.name,
          actorRole: 'system',
          target: `Tiket #${ticket.ticketNumber}`,
          details: `Tiket #${ticket.ticketNumber} ditutup otomatis setelah 3 hari berstatus selesai tanpa komplain lanjutan.`,
        });
        result.autoClosedTicketIds.push(ticket.id);
      }
    }
  }

  return result;
}
