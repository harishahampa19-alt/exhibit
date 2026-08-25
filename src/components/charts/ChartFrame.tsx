/**
 * Shared chart chrome: legend, hover tooltip, and the chart/table toggle.
 *
 * An HTML chart is interactive by default, so every chart here ships a hover
 * tooltip; and every chart has a table view, so identity and magnitude are
 * never color-alone.
 */

import { type ReactNode, useCallback, useState } from 'react';
import { CHROME, SERIES, SERIES_LABEL, SERIES_ORDER, type SeriesKey } from './tokens';

export function Legend({
  keys = SERIES_ORDER,
  counts,
}: {
  keys?: readonly SeriesKey[];
  counts?: Partial<Record<SeriesKey, string>>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {keys.map((k) => (
        <span key={k} className="flex items-center gap-1.5 text-[11px] text-inkdim">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: SERIES[k] }}
            aria-hidden
          />
          {SERIES_LABEL[k]}
          {counts?.[k] && <span className="tnum text-inkfaint">{counts[k]}</span>}
        </span>
      ))}
    </div>
  );
}

export interface TooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

export function useTooltip() {
  const [tip, setTip] = useState<TooltipState | null>(null);
  const show = useCallback((x: number, y: number, content: ReactNode) => setTip({ x, y, content }), []);
  const hide = useCallback(() => setTip(null), []);
  return { tip, show, hide };
}

export function Tooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-30 max-w-[240px] rounded border border-rule2 bg-panel2 px-2 py-1.5 text-[11px] leading-snug text-ink shadow-lg"
      style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, calc(-100% - 10px))' }}
      role="tooltip"
    >
      {tip.content}
    </div>
  );
}

/** Wraps a chart with a title, legend slot and a chart/table switch. */
export function ChartFrame({
  title,
  subtitle,
  legend,
  chart,
  table,
  className = '',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  legend?: ReactNode;
  chart: ReactNode;
  table: ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <div className={`rounded border border-rule bg-panel ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-rule px-3 py-2">
        <div className="min-w-0">
          <h3 className="label">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-inkfaint">{subtitle}</p>}
        </div>
        <div className="inline-flex rounded border border-rule2 p-0.5">
          {(['chart', 'table'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${
                view === v ? 'bg-realized/15 text-realized' : 'text-inkdim hover:text-ink'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <div className="p-3">
        {view === 'chart' ? (
          <>
            {legend && <div className="mb-2.5">{legend}</div>}
            <div className="relative">{chart}</div>
          </>
        ) : (
          <div className="overflow-x-auto">{table}</div>
        )}
      </div>
    </div>
  );
}

export function DataTable({
  head,
  rows,
}: {
  head: readonly ReactNode[];
  rows: readonly (readonly ReactNode[])[];
}) {
  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="border-b border-rule">
          {head.map((h, i) => (
            <th
              key={i}
              className={`py-1.5 pr-3 font-normal uppercase tracking-wider ${
                i === 0 ? 'text-left' : 'text-right'
              }`}
              style={{ color: CHROME.muted }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-rule/50 last:border-0">
            {r.map((c, j) => (
              <td
                key={j}
                className={`tnum py-1 pr-3 ${j === 0 ? 'text-left text-inkdim' : 'text-right text-ink'}`}
              >
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
