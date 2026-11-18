import { useNavigate } from 'react-router-dom';
import { getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { UserTicketList } from '../../components/user-portal/UserTicketList';
import { PortalNoSessionGuide } from '../../components/user-portal/PortalNoSessionGuide';
import { SelfServiceDeflectionWidget } from '../../components/widgets/SelfServiceDeflectionWidget';

export function PortalHomePage() {
  const { data, requester, t } = useCrm();
  const navigate = useNavigate();

  if (!requester) {
    return <PortalNoSessionGuide />;
  }

  const app = getApp(requester.appId);
  const myTickets = data.tickets.filter(
    (t) =>
      t.requesterId === requester.id ||
      (t.appId === requester.appId && t.requesterUid === requester.externalUid),
  );

  const openCount = myTickets.filter((t) => t.status === 'open').length;
  const inProgressCount = myTickets.filter(
    (t) => t.status === 'in_progress' || t.status === 'waiting_on_user',
  ).length;
  const solvedCount = myTickets.filter(
    (t) => t.status === 'solved' || t.status === 'closed',
  ).length;

  return (
    <div className="space-y-5">
      {/* Summary Header */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-panel p-4 shadow-card hover:border-line-strong transition-all duration-150">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">{t('dash.newTickets')}</span>
            <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
          </div>
          <div className="mt-2 font-sans text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {openCount}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-card hover:border-line-strong transition-all duration-150">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">{t('dash.inProgress')}</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          </div>
          <div className="mt-2 font-sans text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {inProgressCount}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-card hover:border-line-strong transition-all duration-150">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">{t('status.solved')}</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
          <div className="mt-2 font-sans text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {solvedCount}
          </div>
        </div>
      </div>

      {/* Self-Service Instant Solutions Widget */}
      <SelfServiceDeflectionWidget appId={requester.appId} />

      {/* User's Ticket List */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">
          {t('portal.myTickets')}
        </h2>
        <UserTicketList
          tickets={myTickets}
          onTicketClick={(id) => navigate(`/portal/ticket/${id}`)}
          onCreateNew={() => navigate('/portal/new')}
        />
      </div>
    </div>
  );
}
