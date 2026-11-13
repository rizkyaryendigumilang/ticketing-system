import React from 'react';
import { Database, HardDrive, Server } from 'lucide-react';
import type { AppQuota } from '../../types/billing';
import { VPS_APPS } from '../../config/vpsAppsConfig';

interface AppQuotaAllocationCardProps {
  quotas: AppQuota[];
}

export function AppQuotaAllocationCard({ quotas }: AppQuotaAllocationCardProps) {
  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <HardDrive className="h-4 w-4 text-ink" />
        <h3 className="text-sm font-semibold text-ink">Alokasi Kuota Storage & Tiket per Aplikasi VPS</h3>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Batas pemakaian memori lokal browser, penyimpanan basis data PocketBase, dan kuota tiket bulanan.
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotas.map((q) => {
          const app = VPS_APPS.find((a) => a.id === q.appId);
          const storagePercent = Math.min(100, Math.round((q.storageUsedKb / q.storageLimitKb) * 100));
          const ticketsPercent = Math.min(
            100,
            Math.round((q.monthlyTicketsCount / q.monthlyTicketsLimit) * 100),
          );

          return (
            <div
              key={q.appId}
              className="rounded-lg border border-line bg-canvas p-4 text-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
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
                    <h4 className="font-bold text-ink">{q.appName}</h4>
                    <span className="font-mono text-[10px] text-ink-muted">{q.appId}</span>
                  </div>
                </div>

                <span className="rounded bg-subtle px-2 py-0.5 font-mono text-[10px] font-semibold text-ink border border-line/60">
                  {q.tier === 'pro_sla' ? 'Pro SLA' : 'Internal'}
                </span>
              </div>

              {/* Storage bar */}
              <div>
                <div className="flex justify-between items-center text-[11px] text-ink-muted mb-1 font-mono">
                  <span>Storage Database & Attachment</span>
                  <span className="text-ink font-semibold">
                    {q.storageUsedKb} KB / {(q.storageLimitKb / 1024).toFixed(0)} MB
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full bg-ink rounded-full transition-all"
                    style={{ width: `${Math.max(2, storagePercent)}%` }}
                  />
                </div>
              </div>

              {/* Monthly tickets bar */}
              <div>
                <div className="flex justify-between items-center text-[11px] text-ink-muted mb-1 font-mono">
                  <span>Kuota Tiket Bulanan</span>
                  <span className="text-ink font-semibold">
                    {q.monthlyTicketsCount} / {q.monthlyTicketsLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${Math.max(2, ticketsPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
