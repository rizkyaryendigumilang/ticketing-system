import { STATUS_LABEL } from '../../config/vpsAppsConfig';
import type { TicketStatus } from '../../types/crm';

/** Lifecycle colours from the spec: open red, in progress yellow, waiting purple, solved green, closed grey. */
export const STATUS_COLOR: Record<TicketStatus, string> = {
  open: '#D7263D',
  in_progress: '#C98A04',
  waiting_on_user: '#7A3FC7',
  solved: '#1F8A4C',
  closed: '#8A949E',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
      {STATUS_LABEL[status]}
    </span>
  );
}
