import { STATUS_LABEL } from '../../config/vpsAppsConfig';
import type { TicketStatus } from '../../types/crm';

const STATUS_STYLES: Record<TicketStatus, { pill: string; dot: string }> = {
  open: {
    pill: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-600',
  },
  in_progress: {
    pill: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  waiting_on_user: {
    pill: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-600',
  },
  solved: {
    pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  closed: {
    pill: 'bg-neutral-100 text-neutral-600 border-neutral-300',
    dot: 'bg-neutral-400',
  },
};

interface Props {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const style = STATUS_STYLES[status];
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-medium leading-tight ${pad} ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
