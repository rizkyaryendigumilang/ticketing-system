import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Inbox,
  ShieldAlert,
  Star,
  TerminalSquare,
  TrendingUp,
} from 'lucide-react';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import {
  computeTrendMetrics,
  countByApp,
  downloadTicketsCsv,
  formatDuration,
  timeAgo,
} from '../../services/crmLogic';
import type { TicketCategory, TicketPriority } from '../../types/crm';
import { AppBadge } from '../../components/common/AppBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppHealthMatrix } from '../../components/crm-admin/AppHealthMatrix';
import { TicketTrendChart } from '../../components/crm-admin/TicketTrendChart';
import { DashboardBreakdown } from '../../components/crm-admin/DashboardBreakdown';

type TimeRange = '7d' | '14d' | '30d' | 'all';

export function AdminDashboardPage() {
  const { data, t, categoryLabel, statusLabel, priorityLabel } = useCrm();
  const navigate = useNavigate();

  // Interactive Filter States
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedAppId, setSelectedAppId] = useState<string>('all');
  const [trendViewMode, setTrendViewMode] = useState<'line' | 'bar'>('line');

  // Filtered tickets based on selected application
  const filteredTickets = useMemo(() => {
    if (selectedAppId === 'all') return data.tickets;
    return data.tickets.filter((t) => t.appId === selectedAppId);
  }, [data.tickets, selectedAppId]);

  // Analytics computation
  const daysWindow = useMemo(() => {
    switch (timeRange) {
      case '7d':
        return 7;
      case '14d':
        return 14;
      case '30d':
        return 30;
      case 'all':
        return 60;
    }
  }, [timeRange]);

  const metrics = useMemo(() => {
    return computeTrendMetrics(filteredTickets, daysWindow);
  }, [filteredTickets, daysWindow]);

  const appMatrix = useMemo(() => {
    return countByApp(data.tickets, VPS_APPS.map((a) => a.id));
  }, [data.tickets]);

  // Priority Queue: Open / In Progress tickets sorted by priority urgency
  const priorityQueue = useMemo(() => {
    const priorityWeight: Record<TicketPriority, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...filteredTickets]
      .filter((t) => t.status === 'open' || t.status === 'in_progress')
      .sort((a, b) => {
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      })
      .slice(0, 6);
  }, [filteredTickets]);

  const handleExportCsv = () => {
    downloadTicketsCsv(
      filteredTickets,
      `helpdesk-report-${selectedAppId}-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const handleCategoryClick = (category: TicketCategory) => {
    navigate(`/admin/tickets?search=${encodeURIComponent(categoryLabel(category))}`);
  };

  const handlePriorityClick = (priority: TicketPriority) => {
    navigate(`/admin/tickets?priority=${priority}`);
  };

  return (
    <div className="space-y-6 p-5 sm:p-6 max-w-7xl mx-auto">
      {/* ═══ Page Header & Interactive Controls ═══ */}
      <div className="flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {t('dash.title')}
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            {t('dash.subtitle')}
          </p>
        </div>

        {/* Global Dashboard Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* App Selector Filter */}
          <div className="relative">
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink shadow-xs focus:border-ink focus:outline-none"
            >
              <option value="all">{t('dash.allApps')} (7)</option>
              {VPS_APPS.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.prefix} — {app.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-md border border-line bg-subtle p-0.5 text-xs font-medium">
            {(['7d', '14d', '30d', 'all'] as const).map((r) => {
              const label =
                r === '7d'
                  ? t('dash.timeRange7d')
                  : r === '14d'
                  ? t('dash.timeRange14d')
                  : r === '30d'
                  ? t('dash.timeRange30d')
                  : t('dash.timeRangeAll');
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`rounded px-2.5 py-1 transition-colors ${
                    timeRange === r
                      ? 'bg-panel font-semibold text-ink shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            title={t('dash.exportCsv')}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink shadow-xs hover:border-line-strong active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-ink-muted" />
            <span className="hidden sm:inline">{t('dash.exportCsv')}</span>
          </button>

          {/* Inbox Link */}
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>{t('dash.inboxBtn')}</span>
            <span className="ml-0.5 rounded bg-white/20 px-1 py-0.2 text-[10px] tabular-nums">
              {metrics.openCount}
            </span>
          </Link>
        </div>
      </div>

      {/* ═══ Informative KPI Metrics Strip ═══ */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Total Inflow */}
        <div className="rounded-lg border border-line bg-panel p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">{t('dash.totalTickets')}</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">
            {metrics.totalTickets}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            {metrics.openCount} {statusLabel('open').toLowerCase()}
          </div>
        </div>

        {/* 2. Active Backlog */}
        <div className="rounded-lg border border-line bg-panel p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">{t('dash.activeBacklog')}</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">
            {metrics.activeCount}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            {metrics.inProgressCount} {statusLabel('in_progress').toLowerCase()} · {metrics.waitingCount} {statusLabel('waiting_on_user').toLowerCase()}
          </div>
        </div>

        {/* 3. Resolution Rate */}
        <div className="rounded-lg border border-line bg-panel p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">{t('dash.resolutionRate')}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
            {metrics.resolutionRatePct}%
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            {metrics.solvedCount + metrics.closedCount} dari {metrics.totalTickets} terselesaikan
          </div>
        </div>

        {/* 4. MTTR */}
        <div className="rounded-lg border border-line bg-panel p-4 shadow-xs">
          <div className="text-xs font-medium text-ink-muted">{t('dash.avgResolutionTime')}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">
            {metrics.avgResolutionMs > 0 ? formatDuration(metrics.avgResolutionMs) : '—'}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            Dihitung dari tiket selesai
          </div>
        </div>

        {/* 5. CSAT */}
        <div className="rounded-lg border border-line bg-panel p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">{t('dash.csat')}</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">
            {metrics.avgCsat > 0 ? `${metrics.avgCsat} / 5` : '—'}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            {metrics.totalRated} ulasan pelapor
          </div>
        </div>

        {/* 6. Critical & Urgent Alert */}
        <div className={`rounded-lg border p-4 shadow-xs ${
          metrics.urgentOpenCount > 0
            ? 'border-red-300 bg-red-50/40'
            : 'border-line bg-panel'
        }`}>
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">{t('dash.urgentAlert')}</span>
            <ShieldAlert className={`h-4 w-4 ${metrics.urgentOpenCount > 0 ? 'text-red-600' : 'text-ink-muted'}`} />
          </div>
          <div className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${
            metrics.urgentOpenCount > 0 ? 'text-red-600' : 'text-ink'
          }`}>
            {metrics.urgentOpenCount}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            Prioritas Darurat & Tinggi aktif
          </div>
        </div>
      </div>

      {/* ═══ Interactive Charts Section ═══ */}
      <section className="space-y-4">
        {/* Main Trend Line / Bar Chart */}
        <TicketTrendChart
          dailyTrends={metrics.dailyTrends}
          viewMode={trendViewMode}
          onViewModeChange={setTrendViewMode}
          t={t}
        />

        {/* Secondary Breakdowns: Category & Priority */}
        <DashboardBreakdown
          categoryBreakdown={metrics.categoryBreakdown}
          priorityBreakdown={metrics.priorityBreakdown}
          totalTickets={metrics.totalTickets}
          onSelectCategory={handleCategoryClick}
          onSelectPriority={handlePriorityClick}
          categoryLabel={categoryLabel}
          priorityLabel={priorityLabel}
          t={t}
        />
      </section>

      {/* ═══ Application Ecosystem Health Matrix ═══ */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('dash.matrixTitle')}</h2>
            <p className="text-xs text-ink-muted">
              Monitoring langsung antrean kendala pada 7 aplikasi VPS terintegrasi.
            </p>
          </div>

          <Link
            to="/admin/settings?tab=integrations"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:underline"
          >
            <TerminalSquare className="h-3.5 w-3.5 text-ink-muted" />
            <span>{t('dash.integrationsBtn')}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <AppHealthMatrix
          apps={VPS_APPS}
          matrix={appMatrix}
          onSelectApp={(appId) => navigate(`/admin/tickets?app=${appId}`)}
        />
      </section>

      {/* ═══ Actionable Priority Queue ═══ */}
      <section className="rounded-lg border border-line bg-panel shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-subtle/40">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            <h2 className="text-sm font-semibold text-ink">
              {t('dash.openQueueTitle')} ({priorityQueue.length})
            </h2>
          </div>
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
          >
            {t('dash.viewTickets')} ({filteredTickets.length})
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {priorityQueue.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-ink-muted">
            {t('dash.emptyQueue')}
          </div>
        ) : (
          <div className="divide-y divide-line">
            {priorityQueue.map((ticket) => (
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
                    <span className="text-[11px] text-ink-muted">· {categoryLabel(ticket.category)}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-ink">{ticket.subject}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    {t('tickets.colRequester')}: <span className="font-medium text-ink">{ticket.requesterName}</span>{' '}
                    (<span className="font-mono">{ticket.requesterUid}</span> · {ticket.requesterRole})
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[11px] text-ink-muted">{timeAgo(ticket.createdAt)}</span>
                  <span className="rounded border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-ink">
                    {t('dash.viewTickets')} →
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
