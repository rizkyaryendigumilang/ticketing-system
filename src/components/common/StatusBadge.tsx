import { STATUS_LABEL } from '../../config/vpsAppsConfig';
import type { TicketStatus } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';

/** Lifecycle colours from the spec: open red, in progress yellow, waiting purple, solved green, closed grey. */
export const STATUS_COLOR: Record<TicketStatus, string> = {
  open: '#D7263D',
  in_progress: '#C98A04',
  waiting_on_user: '#7A3FC7',
  solved: '#1F8A4C',
  closed: '#8A949E',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  let label = STATUS_LABEL[status];
  try {
    const crm = useCrm();
    if (crm?.statusLabel) {
      label = crm.statusLabel(status);
    }
  } catch {
    // fallback to static label if rendered outside CrmProvider
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
      {label}
    </span>
  );
}
