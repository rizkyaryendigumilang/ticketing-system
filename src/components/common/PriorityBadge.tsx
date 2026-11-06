import { PRIORITY_LABEL } from '../../config/vpsAppsConfig';
import type { TicketPriority } from '../../types/crm';

const LEVEL: Record<TicketPriority, number> = { low: 1, medium: 2, high: 3, urgent: 4 };

/** Signal bars: the number of filled bars is the priority level. */
export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const urgent = priority === 'urgent';
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
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
