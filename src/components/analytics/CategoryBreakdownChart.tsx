import React from 'react';
import type { CategoryMetric, AppMetric } from '../../types/analytics';
import { VPS_APPS } from '../../config/vpsAppsConfig';

interface CategoryBreakdownChartProps {
  categories: CategoryMetric[];
  apps: AppMetric[];
}

export function CategoryBreakdownChart({ categories, apps }: CategoryBreakdownChartProps) {
  const getCategoryColor = (idx: number) => {
    const palette = ['#141413', '#2563EB', '#16A34A', '#D97706', '#9333EA', '#DC2626'];
    return palette[idx % palette.length];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Category Distribution */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Distribusi Kategori Kendala</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Komposisi jenis permasalahan yang dilaporkan pengguna
          </p>

          {/* Progress Multi-Bar */}
          <div className="mt-4 h-3 w-full rounded-full overflow-hidden flex bg-subtle">
            {categories.map((c, i) => (
              <div
                key={c.category}
                style={{
                  width: `${c.percentage}%`,
                  backgroundColor: getCategoryColor(i),
                }}
                className="h-full transition-all"
                title={`${c.category}: ${c.count} (${c.percentage}%)`}
              />
            ))}
          </div>

          {/* Category List */}
          <div className="mt-4 space-y-2">
            {categories.map((c, i) => (
              <div
                key={c.category}
                className="flex items-center justify-between text-xs py-1 border-b border-line/40 last:border-none"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getCategoryColor(i) }}
                  />
                  <span className="font-medium text-ink">{c.category}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-ink-muted">
                  <span className="text-ink font-semibold">{c.count} tiket</span>
                  <span className="w-10 text-right">{c.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Volume & SLA Performance per Application */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-ink">Performa Tiket per Aplikasi VPS</h3>
        <p className="text-xs text-ink-muted mt-0.5">
          Volume tiket masuk dan rata-rata durasi penyelesaian per layanan
        </p>

        <div className="mt-4 space-y-3">
          {apps.map((appMetric) => {
            const app = VPS_APPS.find((a) => a.id === appMetric.appId);
            return (
              <div
                key={appMetric.appId}
                className="rounded border border-line bg-canvas p-3 text-xs flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded font-mono text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${app?.color ?? '#888'}15`,
                      borderColor: `${app?.color ?? '#888'}40`,
                      color: app?.color ?? '#141413',
                    }}
                  >
                    {app?.prefix ?? 'APP'}
                  </span>
                  <div>
                    <h4 className="font-semibold text-ink">{app?.name ?? appMetric.appName}</h4>
                    <span className="font-mono text-[10px] text-ink-muted">
                      {appMetric.ticketCount} total tiket
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono">
                  {appMetric.slaBreachedCount > 0 ? (
                    <span className="text-red-600 font-semibold">
                      {appMetric.slaBreachedCount} lewat batas SLA
                    </span>
                  ) : (
                    <span className="text-emerald-600">SLA 100% tepat</span>
                  )}
                  <span className="text-ink font-bold">
                    ~{appMetric.avgResolutionHours.toFixed(1)} jam
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
