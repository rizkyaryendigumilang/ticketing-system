import React, { useState } from 'react';
import type { TrendDataPoint } from '../../types/analytics';

interface TicketVolumeTrendChartProps {
  data: TrendDataPoint[];
}

export function TicketVolumeTrendChart({ data }: TicketVolumeTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(5, ...data.map((d) => d.total));
  const height = 180;
  const paddingX = 35;
  const paddingBottom = 25;
  const paddingTop = 15;
  const chartHeight = height - paddingTop - paddingBottom;

  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Tren Volume Tiket Harian</h3>
          <p className="text-xs text-ink-muted">
            Fluktuasi tiket baru vs tiket selesai dalam 14 hari terakhir
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2.5 w-2.5 rounded-xs bg-ink" />
            <span>Total Tiket</span>
          </span>
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
            <span>Selesai</span>
          </span>
        </div>
      </div>

      <div className="mt-4 relative">
        <svg
          viewBox={`0 0 600 ${height}`}
          className="w-full h-44 overflow-visible select-none"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.5, 1].map((pct, i) => {
            const y = paddingTop + chartHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2="590"
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-line"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-ink-faint text-[9px] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bar Chart representation */}
          {data.map((d, i) => {
            const barWidth = 24;
            const step = (590 - paddingX) / data.length;
            const x = paddingX + i * step + (step - barWidth) / 2;
            const totalH = (d.total / maxVal) * chartHeight;
            const solvedH = (d.solved / maxVal) * chartHeight;
            const yTotal = paddingTop + chartHeight - totalH;
            const ySolved = paddingTop + chartHeight - solvedH;
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={d.date}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Background column highlight on hover */}
                {isHovered && (
                  <rect
                    x={paddingX + i * step}
                    y={paddingTop}
                    width={step}
                    height={chartHeight}
                    fill="currentColor"
                    className="text-subtle/50"
                  />
                )}

                {/* Total bar */}
                <rect
                  x={x}
                  y={yTotal}
                  width={barWidth}
                  height={Math.max(2, totalH)}
                  rx={2}
                  className={`transition-colors ${
                    isHovered ? 'fill-ink' : 'fill-ink/80'
                  }`}
                />

                {/* Solved overlay bar */}
                {solvedH > 0 && (
                  <rect
                    x={x}
                    y={ySolved}
                    width={barWidth}
                    height={Math.max(2, solvedH)}
                    rx={2}
                    className="fill-emerald-500/90"
                  />
                )}

                {/* Date Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className={`text-[9px] font-mono transition-colors ${
                    isHovered ? 'fill-ink font-bold' : 'fill-ink-muted'
                  }`}
                >
                  {d.date.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 right-4 rounded-md border border-line bg-canvas p-2.5 text-xs shadow-md space-y-1 font-mono pointer-events-none">
            <div className="font-bold text-ink">{data[hoveredIdx].date}</div>
            <div className="text-ink-muted flex justify-between gap-4">
              <span>Total Tiket:</span>
              <strong className="text-ink">{data[hoveredIdx].total}</strong>
            </div>
            <div className="text-emerald-600 flex justify-between gap-4">
              <span>Selesai:</span>
              <strong>{data[hoveredIdx].solved}</strong>
            </div>
            <div className="text-red-600 flex justify-between gap-4">
              <span>Belum Selesai:</span>
              <strong>{data[hoveredIdx].open + data[hoveredIdx].inProgress}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
