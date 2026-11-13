import React from 'react';
import type { TicketCategory, TicketPriority } from '../../types/crm';
import type { TranslationKey } from '../../i18n/translations';
import { CATEGORY_LABEL } from '../../config/vpsAppsConfig';

interface Props {
  categoryBreakdown: Record<TicketCategory, number>;
  priorityBreakdown: Record<TicketPriority, number>;
  totalTickets: number;
  onSelectCategory: (cat: TicketCategory) => void;
  onSelectPriority: (pri: TicketPriority) => void;
  categoryLabel: (cat: TicketCategory) => string;
  priorityLabel: (pri: TicketPriority) => string;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const CATEGORY_COLORS: Record<TicketCategory, { bg: string; fill: string; text: string }> = {
  bug_error: { bg: 'bg-red-500', fill: '#ef4444', text: 'text-red-700' },
  account_login: { bg: 'bg-amber-500', fill: '#f59e0b', text: 'text-amber-700' },
  data_transaction: { bg: 'bg-purple-500', fill: '#a855f7', text: 'text-purple-700' },
  feature_question: { bg: 'bg-blue-500', fill: '#3b82f6', text: 'text-blue-700' },
  other: { bg: 'bg-neutral-500', fill: '#737373', text: 'text-neutral-700' },
};

const PRIORITY_COLORS: Record<TicketPriority, { bg: string; border: string; text: string }> = {
  urgent: { bg: 'bg-red-600', border: 'border-red-200', text: 'text-red-700' },
  high: { bg: 'bg-orange-500', border: 'border-orange-200', text: 'text-orange-700' },
  medium: { bg: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700' },
  low: { bg: 'bg-slate-400', border: 'border-slate-200', text: 'text-slate-700' },
};

export function DashboardBreakdown({
  categoryBreakdown,
  priorityBreakdown,
  totalTickets,
  onSelectCategory,
  onSelectPriority,
  categoryLabel,
  priorityLabel,
  t,
}: Props) {
  const categories = Object.keys(CATEGORY_LABEL) as TicketCategory[];
  const priorities: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 1. Category Distribution Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h3 className="text-sm font-semibold text-ink">{t('dash.categoryDist')}</h3>
            <span className="text-xs text-ink-muted">
              {totalTickets} {t('tickets.colTicket').toLowerCase()}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {categories.map((cat) => {
              const count = categoryBreakdown[cat] || 0;
              const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
              const colors = CATEGORY_COLORS[cat];

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className="group w-full text-left"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${colors.bg}`} />
                      <span className="font-medium text-ink group-hover:underline">
                        {categoryLabel(cat)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="text-ink font-semibold">{count}</span>
                      <span className="text-ink-muted text-[11px] w-9 text-right">{pct}%</span>
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${colors.bg}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-ink-muted border-t border-line pt-2.5">
          Klik salah satu kategori untuk memfilter daftar tiket terkait.
        </p>
      </div>

      {/* 2. Priority & Load Distribution Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h3 className="text-sm font-semibold text-ink">{t('dash.priorityDist')}</h3>
            <span className="text-xs text-ink-muted">Tingkat Urgensi</span>
          </div>

          {/* Stacked Ratio Bar */}
          <div className="mt-4">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-subtle">
              {priorities.map((pri) => {
                const count = priorityBreakdown[pri] || 0;
                const pct = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={pri}
                    style={{ width: `${pct}%` }}
                    className={`${PRIORITY_COLORS[pri].bg} transition-all duration-300`}
                    title={`${priorityLabel(pri)}: ${count} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Priority Cards List */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {priorities.map((pri) => {
              const count = priorityBreakdown[pri] || 0;
              const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
              const config = PRIORITY_COLORS[pri];

              return (
                <button
                  key={pri}
                  type="button"
                  onClick={() => onSelectPriority(pri)}
                  className="flex items-center justify-between rounded-md border border-line bg-subtle/40 p-2.5 text-left transition-colors hover:border-line-strong hover:bg-subtle"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${config.bg}`} />
                    <span className="text-xs font-medium text-ink">{priorityLabel(pri)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-ink tabular-nums">{count}</span>
                    <span className="ml-1 text-[10px] text-ink-muted">({pct}%)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-ink-muted border-t border-line pt-2.5">
          Klik salah satu prioritas untuk langsung menuju antrean tiket terkait.
        </p>
      </div>
    </div>
  );
}
