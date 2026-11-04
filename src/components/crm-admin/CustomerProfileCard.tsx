import { Link } from 'react-router-dom';
import { Database, ExternalLink, Globe, KeyRound, Shield, User } from 'lucide-react';
import { timeAgo } from '../../services/crmLogic';
import type { AppSource, CrmUser, Ticket } from '../../types/crm';
import { StatusBadge } from '../common/StatusBadge';

interface Props {
  user: CrmUser | null;
  currentTicket: Ticket;
  app?: AppSource;
  ticketHistory: Ticket[];
}

export function CustomerProfileCard({
  user,
  currentTicket,
  app,
  ticketHistory,
}: Props) {
  const compositeKey =
    user?.compositeKey ?? `${currentTicket.appId}:${currentTicket.requesterUid}`;
  const displayName = user?.name ?? currentTicket.requesterName;
  const uid = user?.externalUid ?? currentTicket.requesterUid;
  const role = user?.appRole ?? currentTicket.requesterRole;
  const otherTickets = ticketHistory.filter((t) => t.id !== currentTicket.id);

  return (
    <div className="space-y-4">
      {/* Customer Identity Card */}
      <div className="rounded border border-line bg-panel p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded border font-mono text-sm font-bold"
            style={{
              backgroundColor: `${app?.color ?? '#141413'}15`,
              borderColor: `${app?.color ?? '#141413'}35`,
              color: app?.color ?? '#141413',
            }}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-ink">
              {displayName}
            </h3>
            <p className="truncate font-mono text-xs text-ink-muted">{uid}</p>
          </div>
        </div>

        <dl className="mt-4 space-y-2.5 border-t border-line pt-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="inline-flex items-center gap-1.5 text-ink-muted">
              <KeyRound className="h-3.5 w-3.5" />
              Composite ID
            </dt>
            <dd className="truncate rounded bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-ink">
              {compositeKey}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-2">
            <dt className="inline-flex items-center gap-1.5 text-ink-muted">
              <Shield className="h-3.5 w-3.5" />
              Role Aplikasi
            </dt>
            <dd className="font-medium text-ink text-right">{role}</dd>
          </div>

          <div className="flex items-center justify-between gap-2">
            <dt className="inline-flex items-center gap-1.5 text-ink-muted">
              <User className="h-3.5 w-3.5" />
              Aplikasi Asal
            </dt>
            <dd className="font-medium text-ink">{app?.name ?? currentTicket.appId}</dd>
          </div>

          {currentTicket.sourcePageUrl && (
            <div className="pt-1">
              <dt className="inline-flex items-center gap-1.5 text-ink-muted">
                <Globe className="h-3.5 w-3.5" />
                Halaman Saat Error
              </dt>
              <dd className="mt-1">
                <a
                  href={currentTicket.sourcePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate rounded border border-line bg-subtle px-2 py-1 font-mono text-[11px] text-sky-800 hover:underline"
                  title={currentTicket.sourcePageUrl}
                >
                  {currentTicket.sourcePageUrl}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {/* Quick App & DB Shortcuts */}
        {app && (
          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-line pt-3">
            <a
              href={app.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between rounded border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
            >
              <span>Buka {app.name}</span>
              <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
            </a>

            {app.adminDbUrl && (
              <a
                href={app.adminDbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between rounded border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-ink-muted" />
                  Buka Database Admin
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Previous Ticket History */}
      <div className="rounded border border-line bg-panel p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-ink">
            Riwayat Tiket Pelapor ({ticketHistory.length})
          </h4>
        </div>

        {otherTickets.length === 0 ? (
          <p className="mt-2.5 text-xs text-ink-muted">
            Ini adalah tiket pertama dari {displayName}.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-line">
            {otherTickets.map((t) => (
              <Link
                key={t.id}
                to={`/admin/tickets/${t.id}`}
                className="block py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-ink">
                    {t.ticketNumber}
                  </span>
                  <StatusBadge status={t.status} size="sm" />
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-ink-muted">
                  {t.subject}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                  {timeAgo(t.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
