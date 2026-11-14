import React from 'react';
import { Activity, CheckCircle2, Clock, Star } from 'lucide-react';

interface AnalyticsKpiCardsProps {
  totalTickets: number;
  activeTickets: number;
  slaPercent: number;
  avgHours: number;
  csatAverage: number;
  csatCount: number;
}

export function AnalyticsKpiCards({
  totalTickets,
  activeTickets,
  slaPercent,
  avgHours,
  csatAverage,
  csatCount,
}: AnalyticsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Volume */}
      <div className="rounded-xl border border-line bg-panel p-4 shadow-card hover:border-line-strong transition-all duration-150">
        <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
          <span>Volume Tiket Masuk</span>
          <Activity className="h-4 w-4 text-ink-muted" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-sans text-2xl font-bold tracking-tight text-ink tabular-nums">
            {totalTickets}
          </span>
          <span className="text-xs text-ink-muted tabular-nums">
            ({activeTickets} aktif)
          </span>
        </div>
        <div className="mt-2 text-[11px] text-ink-muted">
          Akumulasi dari 7 aplikasi ekosistem VPS
        </div>
      </div>

      {/* 2. SLA Compliance */}
      <div className="rounded-xl border border-line bg-panel p-4 shadow-card hover:border-line-strong transition-all duration-150">
        <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
          <span>Kepatuhan Target SLA</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span
            className={`font-sans text-2xl font-bold tracking-tight tabular-nums ${
              slaPercent >= 90
                ? 'text-emerald-700'
                : slaPercent >= 75
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            {slaPercent}%
          </span>
          <span className="text-xs text-ink-muted tabular-nums">target 95%</span>
        </div>
        <div className="mt-2 text-[11px] text-ink-muted">
          Penyelesaian sebelum batas waktu respons
        </div>
      </div>

      {/* 3. Resolution Velocity */}
      <div className="rounded-xl border border-line bg-panel p-4 shadow-card hover:border-line-strong transition-all duration-150">
        <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
          <span>Kecepatan Penyelesaian</span>
          <Clock className="h-4 w-4 text-blue-600" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-sans text-2xl font-bold tracking-tight text-ink tabular-nums">
            {avgHours > 0 ? `${avgHours.toFixed(1)}j` : '< 1j'}
          </span>
          <span className="text-xs text-ink-muted">rata-rata durasi</span>
        </div>
        <div className="mt-2 text-[11px] text-ink-muted">
          Dari tiket dibuat hingga ditandai Selesai
        </div>
      </div>

      {/* 4. CSAT Customer Satisfaction */}
      <div className="rounded-xl border border-line bg-panel p-4 shadow-card hover:border-line-strong transition-all duration-150">
        <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
          <span>Kepuasan Pelapor (CSAT)</span>
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-sans text-2xl font-bold tracking-tight text-ink tabular-nums">
            {csatAverage > 0 ? csatAverage.toFixed(1) : '5.0'}
          </span>
          <span className="text-xs text-ink-muted tabular-nums">/ 5.0</span>
          <span className="text-xs text-ink-muted tabular-nums ml-1">
            ({csatCount} ulasan)
          </span>
        </div>
        <div className="mt-2 text-[11px] text-ink-muted">
          Umpan balik langsung dari portal pengguna
        </div>
      </div>
    </div>
  );
}
