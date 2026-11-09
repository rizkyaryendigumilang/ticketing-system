import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Database, ExternalLink, Globe, KeyRound, Shield, User } from 'lucide-react';
import { timeAgo } from '../../services/crmLogic';
import type { AppSource, CrmUser, Ticket } from '../../types/crm';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';

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
  const toast = useToast();
  const [copiedKey, setCopiedKey] = useState(false);

  const compositeKey =
    user?.compositeKey ?? `${currentTicket.appId}:${currentTicket.requesterUid}`;
  const displayName = user?.name ?? currentTicket.requesterName;
  const uid = user?.externalUid ?? currentTicket.requesterUid;
  const role = user?.appRole ?? currentTicket.requesterRole;
  const otherTickets = ticketHistory.filter((t) => t.id !== currentTicket.id);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(compositeKey);
    setCopiedKey(true);
    toast.success(`Composite ID disalin: ${compositeKey}`);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Customer Identity Card */}
      <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-sm font-bold shadow-sm"
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
            <span className="mt-1 inline-block rounded bg-subtle px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-ink-muted">
              {role}
            </span>
          </div>
        </div>

        <dl className="mt-4 space-y-2.5 border-t border-line pt-3 text-xs">
          {/* Composite ID with Copy Button */}
          <div className="flex items-center justify-between gap-2">
            <dt className="inline-flex items-center gap-1.5 text-ink-muted">
              <KeyRound className="h-3.5 w-3.5 text-ink-muted" />
              Composite ID
            </dt>
            <dd>
              <button
                type="button"
                onClick={handleCopyKey}
                title="Klik untuk salin Composite ID"
                className="group inline-flex items-center gap-1 rounded bg-subtle px-2 py-0.5 font-mono text-[11px] text-ink transition-colors hover:bg-line-strong/40"
              >
                <span>{compositeKey}</span>
                {copiedKey ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3 text-ink-faint group-hover:text-ink" />
                )}
              </button>
            </dd>
          </div>

          <div className="flex items-center justify-between gap-2">
            <dt className="inline-flex items-center gap-1.5 text-ink-muted">
              <Shield className="h-3.5 w-3.5 text-ink-muted" />
              Role Aplikasi
            </dt>
            <dd className="font-medium text-ink text-right">{role}</dd>
          </div>

          <div className="flex items-center justify-between gap-2">
            <dt className="inline-flex items-center gap-1.5 text-ink-muted">
              <User className="h-3.5 w-3.5 text-ink-muted" />
              Aplikasi Asal
            </dt>
            <dd className="flex items-center gap-1.5 font-medium text-ink">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: app?.color ?? '#888' }}
              />
              <span>{app?.name ?? currentTicket.appId}</span>
            </dd>
          </div>

          {currentTicket.sourcePageUrl && (
            <div className="pt-1">
              <dt className="inline-flex items-center gap-1.5 text-ink-muted">
                <Globe className="h-3.5 w-3.5 text-ink-muted" />
                Halaman Saat Error
              </dt>
              <dd className="mt-1">
                <a
                  href={currentTicket.sourcePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate rounded border border-line bg-subtle px-2.5 py-1 font-mono text-[11px] text-sky-800 hover:underline"
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
              <span className="flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
                Buka Web {app.name}
              </span>
              <span className="font-mono text-[10px] text-ink-faint">
                {app.prefix}
              </span>
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
                  Buka Admin PocketBase
                </span>
                <ExternalLink className="h-3 w-3 text-ink-muted" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Previous Ticket History */}
      <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <h4 className="text-xs font-semibold text-ink">
            Riwayat Tiket Pelapor ({ticketHistory.length})
          </h4>
          <span className="font-mono text-[10px] text-ink-muted">
            {otherTickets.length} tiket lain
          </span>
        </div>

        {otherTickets.length === 0 ? (
          <p className="mt-3 text-xs text-ink-muted">
            Ini adalah tiket pertama dari <strong className="text-ink">{displayName}</strong>.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {otherTickets.map((t) => (
              <Link
                key={t.id}
                to={`/admin/tickets/${t.id}`}
                className="block py-2.5 transition-colors hover:bg-subtle/50 -mx-2 px-2 rounded"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-ink">
                    {t.ticketNumber}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-medium text-ink">
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
