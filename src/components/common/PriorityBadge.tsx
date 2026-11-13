import { PRIORITY_LABEL } from '../../config/vpsAppsConfig';
import type { TicketPriority } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';

const LEVEL: Record<TicketPriority, number> = { low: 1, medium: 2, high: 3, urgent: 4 };

/** Signal bars: the number of filled bars is the priority level. */
export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const urgent = priority === 'urgent';
  let label = PRIORITY_LABEL[priority];
  try {
    const crm = useCrm();
    if (crm?.priorityLabel) {
      label = crm.priorityLabel(priority);
    }
  } catch {
    // fallback to static label if rendered outside CrmProvider
  }

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${urgent ? 'font-semibold text-red-700' : 'text-ink-muted'}`}>
      <span className="flex items-end gap-px" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`w-[3px] rounded-sm ${n <= LEVEL[priority] ? 'bg-current' : 'bg-line'}`}
            style={{ height: 3 + n * 2 }}
          />
        ))}
      </span>
      {label}
    </span>
  );
}
