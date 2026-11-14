import React, { useState, useMemo } from 'react';
import { Star, MessageSquareQuote, ThumbsUp, HeartHandshake, Filter } from 'lucide-react';
import type { Ticket } from '../../types/crm';
import { VPS_APPS, getApp } from '../../config/vpsAppsConfig';
import { AppBadge } from '../common/AppBadge';
import { timeAgo } from '../../services/crmLogic';

interface Props {
  tickets: Ticket[];
}

export function CsatAnalyticsCard({ tickets }: Props) {
  const [selectedApp, setSelectedApp] = useState<string>('all');

  const ratedTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (t.satisfactionRating == null) return false;
      if (selectedApp !== 'all' && t.appId !== selectedApp) return false;
      return true;
    });
  }, [tickets, selectedApp]);

  const stats = useMemo(() => {
    const total = ratedTickets.length;
    if (total === 0) {
      return {
        avgRating: 5.0,
        totalReviews: 0,
        satisfiedPercent: 100,
        counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
      };
    }

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    let satisfied = 0;

    ratedTickets.forEach((t) => {
      const r = Math.min(5, Math.max(1, t.satisfactionRating ?? 5));
      counts[r] = (counts[r] || 0) + 1;
      sum += r;
      if (r >= 4) satisfied++;
    });

    return {
      avgRating: Number((sum / total).toFixed(1)),
      totalReviews: total,
      satisfiedPercent: Math.round((satisfied / total) * 100),
      counts,
    };
  }, [ratedTickets]);

  const recentFeedbacks = useMemo(() => {
    return ratedTickets
      .filter((t) => t.satisfactionComment && t.satisfactionComment.trim().length > 0)
      .slice(0, 6);
  }, [ratedTickets]);

  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5">
        <div className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-ink" />
          <h3 className="text-sm font-semibold text-ink">
            Kepuasan Pelapor & Ulasan (Customer Satisfaction Score)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-ink-muted" />
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="rounded border border-line bg-canvas px-2.5 py-1 text-xs text-ink focus:border-ink focus:outline-none"
          >
            <option value="all">Semua Aplikasi ({tickets.filter((t) => t.satisfactionRating != null).length} ulasan)</option>
            {VPS_APPS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CSAT Metric Summary Cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Average Score */}
        <div className="rounded-lg border border-line bg-canvas p-4 text-center sm:text-left flex flex-col justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Rata-rata Skor CSAT
          </span>
          <div className="my-2 flex items-baseline gap-2 justify-center sm:justify-start">
            <span className="text-3xl font-bold tracking-tight text-ink font-mono">
              {stats.avgRating}
            </span>
            <span className="text-xs text-ink-muted">/ 5.0</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(stats.avgRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-neutral-300'
                }`}
              />
            ))}
            <span className="ml-1 text-[11px] text-ink-muted">
              ({stats.totalReviews} penilaian)
            </span>
          </div>
        </div>

        {/* Satisfaction Rate */}
        <div className="rounded-lg border border-line bg-canvas p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Tingkat Kepuasan (Rating 4-5)
          </span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-emerald-600 font-mono">
              {stats.satisfiedPercent}%
            </span>
            <ThumbsUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-[11px] text-ink-muted">
            {stats.counts[5] + stats.counts[4]} dari {stats.totalReviews || 1} pelapor puas dengan solusi helpdesk.
          </p>
        </div>

        {/* Rating Distribution Bar */}
        <div className="rounded-lg border border-line bg-canvas p-4 space-y-1.5 text-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted block mb-1">
            Distribusi Bintang
          </span>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.counts[rating] || 0;
            const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-2 text-[11px]">
                <span className="w-5 font-mono text-ink-muted flex items-center gap-0.5">
                  {rating}★
                </span>
                <div className="flex-1 h-2 rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 font-mono text-right text-ink-muted tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Testimonials / Feedback List */}
      <div className="mt-5 border-t border-line pt-4">
        <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <MessageSquareQuote className="h-3.5 w-3.5 text-ink-muted" />
          Ulasan & Testimoni Pelapor Terbaru
        </h4>

        {recentFeedbacks.length === 0 ? (
          <p className="mt-2 text-xs italic text-ink-muted">
            Belum ada komentar ulasan tertulis dari pelapor.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentFeedbacks.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-line bg-canvas p-3.5 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-ink truncate">{t.requesterName}</span>
                      <AppBadge appId={t.appId} />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= (t.satisfactionRating ?? 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink leading-relaxed italic">
                    &ldquo;{t.satisfactionComment}&rdquo;
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-line/50 flex items-center justify-between text-[11px] text-ink-muted">
                  <span className="font-mono">Tiket #{t.ticketNumber}</span>
                  <span>{timeAgo(t.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
