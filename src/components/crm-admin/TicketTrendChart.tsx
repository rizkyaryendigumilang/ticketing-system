import React, { useState, useMemo, useRef } from 'react';
import { BarChart3, LineChart } from 'lucide-react';
import type { DailyTrendPoint } from '../../services/crmLogic';
import type { TranslationKey } from '../../i18n/translations';

interface Props {
  dailyTrends: DailyTrendPoint[];
  viewMode: 'line' | 'bar';
  onViewModeChange: (mode: 'line' | 'bar') => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export function TicketTrendChart({
  dailyTrends,
  viewMode,
  onViewModeChange,
  t,
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG canvas bounds
  const width = 700;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 36;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const totalPoints = dailyTrends.length;

  // Max value calculation with headroom
  const maxVal = useMemo(() => {
    let m = 0;
    for (const p of dailyTrends) {
      if (p.created > m) m = p.created;
      if (p.solved > m) m = p.solved;
    }
    return m;
  }, [dailyTrends]);

  const yMax = useMemo(() => {
    if (maxVal <= 3) return 4;
    if (maxVal <= 6) return 8;
    return Math.ceil(maxVal * 1.25);
  }, [maxVal]);

  const ticks = useMemo(() => {
    const step = yMax / 4;
    return [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), yMax];
  }, [yMax]);

  const getX = (i: number) => {
    if (totalPoints <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (i / (totalPoints - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / yMax) * chartHeight;
  };

  // Build SVG Paths for line chart
  const { createdLinePath, createdAreaPath, solvedLinePath, solvedAreaPath } = useMemo(() => {
    if (totalPoints === 0) {
      return { createdLinePath: '', createdAreaPath: '', solvedLinePath: '', solvedAreaPath: '' };
    }

    const baselineY = paddingTop + chartHeight;
    const cPoints = dailyTrends.map((p, i) => `${getX(i).toFixed(1)},${getY(p.created).toFixed(1)}`);
    const sPoints = dailyTrends.map((p, i) => `${getX(i).toFixed(1)},${getY(p.solved).toFixed(1)}`);

    const cLine = `M ${cPoints.join(' L ')}`;
    const sLine = `M ${sPoints.join(' L ')}`;

    const cArea = `${cLine} L ${getX(totalPoints - 1).toFixed(1)},${baselineY} L ${getX(0).toFixed(1)},${baselineY} Z`;
    const sArea = `${sLine} L ${getX(totalPoints - 1).toFixed(1)},${baselineY} L ${getX(0).toFixed(1)},${baselineY} Z`;

    return {
      createdLinePath: cLine,
      createdAreaPath: cArea,
      solvedLinePath: sLine,
      solvedAreaPath: sArea,
    };
  }, [dailyTrends, totalPoints, yMax]);

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || totalPoints === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relX = (clientX / rect.width) * width;
    const clampedX = Math.max(paddingLeft, Math.min(width - paddingRight, relX));
    const ratio = (clampedX - paddingLeft) / chartWidth;
    const idx = Math.round(ratio * (totalPoints - 1));
    setHoveredIdx(Math.max(0, Math.min(totalPoints - 1, idx)));
  };

  const activeHoverPoint = hoveredIdx !== null ? dailyTrends[hoveredIdx] : null;

  // Bar chart slot calculations
  const slotWidth = totalPoints > 0 ? chartWidth / totalPoints : 0;
  const barWidth = Math.min(16, Math.max(6, slotWidth * 0.32));

  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h2 className="text-sm font-semibold text-ink">{t('dash.trendTitle')}</h2>
          <p className="mt-0.5 text-xs text-ink-muted">{t('dash.trendSubtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden items-center gap-4 text-xs font-medium sm:flex">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span className="text-ink">{t('dash.trendInflow')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              <span className="text-ink">{t('dash.trendSolved')}</span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-md border border-line bg-subtle p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onViewModeChange('line')}
              title={t('dash.viewModeLine')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'line'
                  ? 'bg-panel text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <LineChart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('dash.viewModeLine')}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('bar')}
              title={t('dash.viewModeBar')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'bar'
                  ? 'bg-panel text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('dash.viewModeBar')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Hover Summary Strip */}
      <div className="mt-3 flex items-center justify-between rounded-md bg-subtle/50 px-3.5 py-2 text-xs">
        {activeHoverPoint ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">{activeHoverPoint.fullDate}</span>
              <span className="text-ink-muted">·</span>
              <span className="text-ink-muted">
                {t('dash.trendNet')}:{' '}
                <span
                  className={`font-semibold tabular-nums ${
                    activeHoverPoint.created - activeHoverPoint.solved > 0
                      ? 'text-red-600'
                      : activeHoverPoint.created - activeHoverPoint.solved < 0
                      ? 'text-emerald-700'
                      : 'text-ink'
                  }`}
                >
                  {activeHoverPoint.created - activeHoverPoint.solved > 0 ? '+' : ''}
                  {activeHoverPoint.created - activeHoverPoint.solved}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-medium text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                {t('dash.trendInflow')}: <strong className="tabular-nums">{activeHoverPoint.created}</strong>
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                {t('dash.trendSolved')}: <strong className="tabular-nums">{activeHoverPoint.solved}</strong>
              </span>
            </div>
          </>
        ) : (
          <div className="text-ink-muted flex items-center gap-2">
            <span>Arahkan kursor / sentuh grafik untuk melihat rincian harian.</span>
          </div>
        )}
      </div>

      {/* SVG Vector Chart */}
      <div className="relative mt-2 w-full select-none overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="90%" stopColor="#2563eb" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.20" />
              <stop offset="90%" stopColor="#059669" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines & Y labels */}
          {ticks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  className="fill-ink-muted"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* LINE CHART MODE */}
          {viewMode === 'line' && (
            <>
              {/* Areas */}
              {createdAreaPath && <path d={createdAreaPath} fill="url(#blueAreaGrad)" />}
              {solvedAreaPath && <path d={solvedAreaPath} fill="url(#emeraldAreaGrad)" />}

              {/* Strokes */}
              {createdLinePath && (
                <path
                  d={createdLinePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {solvedLinePath && (
                <path
                  d={solvedLinePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {dailyTrends.map((p, i) => {
                const cx = getX(i);
                const cyC = getY(p.created);
                const cyS = getY(p.solved);
                const isHovered = hoveredIdx === i;

                return (
                  <g key={p.dateKey}>
                    <circle
                      cx={cx}
                      cy={cyC}
                      r={isHovered ? 5.5 : 3}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth={isHovered ? 2.5 : 1.8}
                    />
                    <circle
                      cx={cx}
                      cy={cyS}
                      r={isHovered ? 5.5 : 3}
                      fill="#ffffff"
                      stroke="#059669"
                      strokeWidth={isHovered ? 2.5 : 1.8}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* BAR CHART MODE */}
          {viewMode === 'bar' && (
            <g>
              {dailyTrends.map((p, i) => {
                const centerX = paddingLeft + (i + 0.5) * slotWidth;
                const baselineY = paddingTop + chartHeight;
                const isHovered = hoveredIdx === i;

                const cHeight = (p.created / yMax) * chartHeight;
                const sHeight = (p.solved / yMax) * chartHeight;

                const cX = centerX - barWidth - 1.5;
                const cY = baselineY - cHeight;

                const sX = centerX + 1.5;
                const sY = baselineY - sHeight;

                return (
                  <g key={p.dateKey} opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}>
                    {/* Created Bar */}
                    <rect
                      x={cX}
                      y={cY}
                      width={barWidth}
                      height={Math.max(2, cHeight)}
                      rx="2"
                      fill="#2563eb"
                      className="transition-all duration-100"
                    />
                    {/* Solved Bar */}
                    <rect
                      x={sX}
                      y={sY}
                      width={barWidth}
                      height={Math.max(2, sHeight)}
                      rx="2"
                      fill="#059669"
                      className="transition-all duration-100"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Vertical Indicator on Hover */}
          {hoveredIdx !== null && (
            <line
              x1={viewMode === 'line' ? getX(hoveredIdx) : paddingLeft + (hoveredIdx + 0.5) * slotWidth}
              y1={paddingTop}
              x2={viewMode === 'line' ? getX(hoveredIdx) : paddingLeft + (hoveredIdx + 0.5) * slotWidth}
              y2={paddingTop + chartHeight}
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
          )}

          {/* X Axis Date Labels */}
          {dailyTrends.map((p, i) => {
            // Show label every N items depending on total points to prevent collision
            const skipStep = totalPoints > 14 ? 3 : totalPoints > 7 ? 2 : 1;
            if (i % skipStep !== 0 && i !== totalPoints - 1) return null;

            const x = viewMode === 'line' ? getX(i) : paddingLeft + (i + 0.5) * slotWidth;
            const isHovered = hoveredIdx === i;

            return (
              <text
                key={p.dateKey}
                x={x}
                y={paddingTop + chartHeight + 18}
                textAnchor="middle"
                fontSize="10"
                fontFamily="sans-serif"
                className={`transition-colors ${
                  isHovered ? 'fill-ink font-semibold' : 'fill-ink-muted'
                }`}
              >
                {p.label}
              </text>
            );
          })}
        </svg>

        {/* Empty state hint if completely flat */}
        {maxVal === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-panel/85 px-3 py-1 text-xs text-ink-muted border border-line shadow-xs">
              {t('dash.noTrendData')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
