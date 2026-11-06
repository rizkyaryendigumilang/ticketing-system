import { Lock } from 'lucide-react';
import { timeAgo } from '../../services/crmLogic';
import type { TicketMessage } from '../../types/crm';
import { AttachmentGrid } from './AttachmentGrid';

interface Props {
  messages: TicketMessage[];
  /** Messages from this sender are labelled "Anda". */
  selfId?: string;
  emptyText: string;
}

/** Conversation shared by the admin workspace and the requester portal. Callers filter internal notes. */
export function MessageThread({ messages, selfId, emptyText }: Props) {
  if (messages.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-ink-muted">{emptyText}</p>;
  }

  return (
    <ol className="divide-y divide-line">
      {messages.map((m) =>
        m.senderRole === 'system' ? (
          <li key={m.id} className="flex justify-between gap-4 px-5 py-2 text-xs text-ink-muted">
            <span>{m.body}</span>
            <time dateTime={m.createdAt}>{timeAgo(m.createdAt)}</time>
          </li>
        ) : (
          <li key={m.id} className={`px-5 py-4 ${m.isInternalNote ? 'bg-amber-50' : ''}`}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm">
                <span className="font-semibold">{m.senderId === selfId ? 'Anda' : m.senderName}</span>
                <span className="ml-2 text-xs text-ink-muted">
                  {m.isInternalNote ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                      <Lock className="h-3 w-3" />
                      Catatan internal, tidak terlihat pelapor
                    </span>
                  ) : m.senderRole === 'admin' ? (
                    'Superadmin'
                  ) : (
                    'Pelapor'
                  )}
                </span>
              </p>
              <time dateTime={m.createdAt} className="shrink-0 text-xs text-ink-faint">
                {timeAgo(m.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 max-w-prose whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
            {m.attachments && m.attachments.length > 0 && (
              <div className="mt-2">
                <AttachmentGrid urls={m.attachments} size="sm" />
              </div>
            )}
          </li>
        ),
      )}
    </ol>
  );
}
