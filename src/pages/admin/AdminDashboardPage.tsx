import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Inbox, Star, TerminalSquare } from 'lucide-react';
import { CATEGORY_LABEL, VPS_APPS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { computeStats, countByApp, formatDuration, timeAgo } from '../../services/crmLogic';
import { AppBadge } from '../../components/common/AppBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppHealthMatrix } from '../../components/crm-admin/AppHealthMatrix';

export function AdminDashboardPage() {
  const { data } = useCrm();
  const navigate = useNavigate();

  const stats = computeStats(data.tickets);
  const appMatrix = countByApp(data.tickets, VPS_APPS.map((a) => a.id));
  const contacts = data.users.filter((u) => u.systemRole === 'requester');
  const openQueue = data.tickets.filter((t) => t.status === 'open');
  const appsWithOpenIssues = VPS_APPS.filter((a) => (appMatrix[a.id]?.open ?? 0) > 0).length;

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Peta Kesehatan 7 Aplikasi
          </h1>
          <p className="mt-0.5 text-xs text-ink-muted">
            Pantau aplikasi mana yang sedang memiliki kendala aktif dan selesaikan laporan yang baru masuk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/settings?tab=integrations"
            className="inline-flex items-center gap-1.5 rounded border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong active:scale-95 transition-[border-color,transform] duration-100"
          >
            <TerminalSquare className="h-3.5 w-3.5 text-ink-muted" />
            Generator Tombol Bantuan
          </Link>
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-[opacity,transform] duration-100"
          >
            <Inbox className="h-3.5 w-3.5" />
            Buka Unified Inbox ({stats.open} Open)
          </Link>
        </div>
      </div>

      {/* Operational Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-red-200 bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">Baru Masuk (Open)</span>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-red-600 tabular-nums">{stats.open}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">
            Pada {appsWithOpenIssues} dari {VPS_APPS.length} aplikasi
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">Sedang Dikerjakan</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-ink tabular-nums">{stats.inProgress}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">
            +{stats.waiting} menunggu respons user
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">Selesai Minggu Ini</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-emerald-800 tabular-nums">
            {stats.solvedThisWeek}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-muted">
            Dari total {data.tickets.length} tiket tercatat
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="text-xs font-medium text-ink-muted">Rata-rata Penyelesaian</div>
          <div className="mt-1.5 text-2xl font-bold text-ink tabular-nums">
            {stats.avgResolutionMs > 0 ? formatDuration(stats.avgResolutionMs) : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-muted">Dari tiket masuk hingga Solved</div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">Kepuasan (CSAT)</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-ink tabular-nums">
            {stats.avgCsat > 0 ? `${stats.avgCsat} / 5` : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-muted">
            {stats.totalRated > 0 ? `Dari ${stats.totalRated} ulasan` : 'Belum ada penilaian'}
          </div>
        </div>

        <div className="col-span-2 rounded-lg border border-line bg-panel p-4 shadow-sm sm:col-span-1">
          <div className="text-xs font-medium text-ink-muted">Pelapor Terdaftar</div>
          <div className="mt-1.5 text-2xl font-bold text-ink tabular-nums">{contacts.length}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">Terkumpul otomatis via Handoff</div>
        </div>
      </div>

      {/* App Health Matrix */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">App Issue Matrix (7 Aplikasi Go-Live)</h2>
            <p className="text-xs text-ink-muted">
              Kartu menyala merah jika aplikasi memiliki tiket berstatus Open. Klik kartu untuk memfilter tiket aplikasi tersebut.
            </p>
          </div>
        </div>
        <AppHealthMatrix
          apps={VPS_APPS}
          matrix={appMatrix}
          onSelectApp={(appId) => navigate(`/admin/tickets?app=${appId}`)}
        />
      </section>

      {/* Priority Open Queue */}
      <section className="rounded-lg border border-line bg-panel shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-subtle/40">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            <h2 className="text-base font-semibold text-ink">
              Antrean Prioritas Baru Masuk ({openQueue.length} Open)
            </h2>
          </div>
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
          >
            Lihat semua tiket ({data.tickets.length})
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {openQueue.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-ink-muted">
            Semua tiket berstatus Open sudah ditangani.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {openQueue.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-subtle/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">{ticket.ticketNumber}</span>
                    <AppBadge appId={ticket.appId} />
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                    <span className="text-[11px] text-ink-muted">· {CATEGORY_LABEL[ticket.category]}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-ink">{ticket.subject}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Pelapor: <span className="font-medium text-ink">{ticket.requesterName}</span>{' '}
                    (<span className="font-mono">{ticket.requesterUid}</span> · {ticket.requesterRole})
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[11px] text-ink-muted">{timeAgo(ticket.createdAt)}</span>
                  <span className="rounded border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-ink">
                    Tangani Tiket →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
