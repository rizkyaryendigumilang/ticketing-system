import { useNavigate } from 'react-router-dom';
import { getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { UserTicketList } from '../../components/user-portal/UserTicketList';

export function PortalHomePage() {
  const { data, requester } = useCrm();
  const navigate = useNavigate();

  if (!requester) return null;

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
        <div className="rounded border border-line bg-panel p-4">
          <div className="text-xs text-ink-muted">Baru Masuk (Open)</div>
          <div className="mt-1 font-sans text-2xl font-bold tracking-tight text-red-600 tabular-nums">{openCount}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">Menunggu antrean Superadmin</div>
        </div>

        <div className="rounded border border-line bg-panel p-4">
          <div className="text-xs text-ink-muted">Sedang Ditangani</div>
          <div className="mt-1 font-sans text-2xl font-bold tracking-tight text-amber-700 tabular-nums">{inProgressCount}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">Dalam pengecekan / menunggu balasan Anda</div>
        </div>

        <div className="rounded border border-line bg-panel p-4">
          <div className="text-xs text-ink-muted">Selesai (Solved)</div>
          <div className="mt-1 font-sans text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">{solvedCount}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">
            Kendala di {app?.name ?? 'aplikasi'} sudah teratasi
          </div>
        </div>
      </div>

      {/* User's Ticket List */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">
          Daftar Laporan Kendala Saya di {app?.name ?? requester.appId}
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
