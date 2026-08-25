/**
 * Winner split — one stacked bar plus direct-labeled tiles.
 *
 * Three numbers do not need a plot of their own; the bar carries the
 * proportion and the tiles carry the values.
 */

import type { Summary } from '../../engine/summary';
import { DataTable } from './ChartFrame';
import { CHROME, fmtPct, SERIES, SERIES_LABEL, SERIES_ORDER, type SeriesKey } from './tokens';

export function WinnerSplit({ summary }: { summary: Summary }) {
  const values: Record<SeriesKey, number> = {
    observer: summary.observerWins,
    opponent: summary.opponentWins,
    draw: summary.draws,
  };
  const total = Math.max(1, summary.games);

  return (
    <div className="rounded border border-rule bg-panel p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="label">Outcome split</h3>
        <span className="tnum text-[11px]" style={{ color: CHROME.muted }}>
          {summary.games.toLocaleString()} games
        </span>
      </div>

      {/* One bar, 2px surface gaps between segments. */}
      <div className="flex h-3 gap-[2px] overflow-hidden rounded">
        {SERIES_ORDER.map((k) =>
          values[k] === 0 ? null : (
            <div
              key={k}
              title={`${SERIES_LABEL[k]} ${values[k].toLocaleString()} (${fmtPct(values[k], total)})`}
              style={{ background: SERIES[k], width: `${(values[k] / total) * 100}%` }}
            />
          ),
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {SERIES_ORDER.map((k) => (
          <div key={k}>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SERIES[k] }} />
              <span className="label">{SERIES_LABEL[k]}</span>
            </div>
            <div className="tnum mt-0.5 text-lg leading-tight text-ink">
              {fmtPct(values[k], total)}
            </div>
            <div className="tnum text-[11px]" style={{ color: CHROME.muted }}>
              {values[k].toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-inkfaint hover:text-inkdim">
          Table
        </summary>
        <div className="mt-2">
          <DataTable
            head={['Outcome', 'Games', 'Share']}
            rows={SERIES_ORDER.map((k) => [
              SERIES_LABEL[k],
              values[k].toLocaleString(),
              fmtPct(values[k], total),
            ])}
          />
        </div>
      </details>
    </div>
  );
}
