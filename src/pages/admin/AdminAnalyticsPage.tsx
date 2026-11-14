import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { computeTrendMetrics, computeTicketSla } from '../../services/crmLogic';
import { AnalyticsKpiCards } from '../../components/analytics/AnalyticsKpiCards';
import { TicketVolumeTrendChart } from '../../components/analytics/TicketVolumeTrendChart';
import { CategoryBreakdownChart } from '../../components/analytics/CategoryBreakdownChart';
import { CsatAnalyticsCard } from '../../components/analytics/CsatAnalyticsCard';
import { ReportsExportPanel } from '../../components/analytics/ReportsExportPanel';
import type { TrendDataPoint, CategoryMetric, AppMetric } from '../../types/analytics';

export function AdminAnalyticsPage() {
  const { data } = useCrm();

  const metrics = useMemo(() => {
    const tickets = data.tickets;
    const activeCount = tickets.filter(
      (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_user',
    ).length;

    // SLA Calculation
    let breachedCount = 0;
    tickets.forEach((t) => {
      const sla = computeTicketSla(t);
      if (sla.status === 'breached') breachedCount++;
    });
    const slaPercent = tickets.length > 0
      ? Math.max(0, Math.round(((tickets.length - breachedCount) / tickets.length) * 100))
      : 100;

    // Average duration in hours for solved tickets
    const solvedTickets = tickets.filter((t) => t.status === 'solved' || t.status === 'closed');
    const totalHours = solvedTickets.reduce((acc, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = t.solvedAt ? new Date(t.solvedAt).getTime() : new Date(t.updatedAt).getTime();
      return acc + (end - start) / (1000 * 3600);
    }, 0);
    const avgHours = solvedTickets.length > 0 ? totalHours / solvedTickets.length : 1.2;

    // CSAT metrics
    const ratedTickets = tickets.filter((t) => t.satisfactionRating != null);
    const csatAverage = ratedTickets.length > 0
      ? ratedTickets.reduce((acc, t) => acc + (t.satisfactionRating ?? 5), 0) / ratedTickets.length
      : 5.0;

    // Trends calculation for last 14 days
    const trends: TrendDataPoint[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const dayTickets = tickets.filter((t) => t.createdAt.slice(0, 10) === dateStr);
      trends.push({
        date: dateStr,
        total: dayTickets.length,
        open: dayTickets.filter((t) => t.status === 'open').length,
        inProgress: dayTickets.filter((t) => t.status === 'in_progress' || t.status === 'waiting_on_user').length,
        solved: dayTickets.filter((t) => t.status === 'solved' || t.status === 'closed').length,
      });
    }

    // Categories Breakdown
    const catMap = new Map<string, number>();
    tickets.forEach((t) => {
      const count = catMap.get(t.category) || 0;
      catMap.set(t.category, count + 1);
    });

    const categoryLabels: Record<string, string> = {
      bug_error: 'Bug / Error Fitur',
      account_login: 'Akun & Akses Login',
      data_transaction: 'Selisih Data / Transaksi',
      feature_question: 'Pertanyaan Fitur',
      other: 'Umum / Lainnya',
    };

    const categories: CategoryMetric[] = Array.from(catMap.entries()).map(([cat, count]) => ({
      category: categoryLabels[cat] || cat,
      count,
      percentage: tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0,
    }));

    // Apps Performance
    const apps: AppMetric[] = VPS_APPS.map((app) => {
      const appTickets = tickets.filter((t) => t.appId === app.id);
      const appBreached = appTickets.filter((t) => computeTicketSla(t).status === 'breached').length;
      return {
        appId: app.id,
        appName: app.name,
        ticketCount: appTickets.length,
        slaBreachedCount: appBreached,
        avgResolutionHours: avgHours,
      };
    });

    return {
      totalTickets: tickets.length,
      activeTickets: activeCount,
      slaPercent,
      avgHours,
      csatAverage,
      csatCount: ratedTickets.length,
      trends,
      categories,
      apps,
    };
  }, [data.tickets]);

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Analitik & Laporan Performa
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Pantau metrik volume tiket, kepatuhan target SLA, tren penyelesaian, dan kepuasan pelapor.
          </p>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <AnalyticsKpiCards
        totalTickets={metrics.totalTickets}
        activeTickets={metrics.activeTickets}
        slaPercent={metrics.slaPercent}
        avgHours={metrics.avgHours}
        csatAverage={metrics.csatAverage}
        csatCount={metrics.csatCount}
      />

      {/* 2. Volume Trend Chart */}
      <TicketVolumeTrendChart data={metrics.trends} />

      {/* 3. Category & App Distribution */}
      <CategoryBreakdownChart categories={metrics.categories} apps={metrics.apps} />

      {/* 4. CSAT Customer Satisfaction Dashboard */}
      <CsatAnalyticsCard tickets={data.tickets} />

      {/* 5. Reports & Export */}
      <ReportsExportPanel tickets={data.tickets} />
    </div>
  );
}
