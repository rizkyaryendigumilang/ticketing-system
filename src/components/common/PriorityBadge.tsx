import { PRIORITY_LABEL } from '../../config/vpsAppsConfig';
import type { TicketPriority } from '../../types/crm';

const PRIORITY_STYLES: Record<TicketPriority, { pill: string; bar: string }> = {
  low: {
    pill: 'text-ink-muted bg-subtle border-line',
    bar: 'bg-neutral-400',
  },
  medium: {
    pill: 'text-sky-800 bg-sky-50 border-sky-200',
    bar: 'bg-sky-600',
  },
  high: {
    pill: 'text-orange-800 bg-orange-50 border-orange-200',
    bar: 'bg-orange-600',
  },
  urgent: {
    pill: 'text-red-800 bg-red-100/80 border-red-300 font-semibold',
    bar: 'bg-red-600',
  },
};

interface Props {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: Props) {
  const style = PRIORITY_STYLES[priority];
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border leading-tight ${pad} ${style.pill}`}
    >
      <span className={`h-2 w-0.5 rounded-full ${style.bar}`} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
