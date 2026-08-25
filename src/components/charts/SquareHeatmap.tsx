/**
 * Terminal-square heat map, laid out as the board itself.
 *
 * Sequential encoding — one hue, light→dark by magnitude. Every cell carries a
 * visible count and share, so magnitude is never color-alone.
 */

import { SQUARES, type Square } from '../../engine/board';
import type { Summary } from '../../engine/summary';
import { ChartFrame, DataTable, Tooltip, useTooltip } from './ChartFrame';
import { CHROME, fmtPct, rampStep, SEQUENTIAL, SERIES, SERIES_LABEL, SERIES_ORDER } from './tokens';

export function SquareHeatmap({
  summary,
  title = 'Terminal square',
}: {
  summary: Summary;
  title?: string;
}) {
  const counts = SQUARES.map((s) => summary.byTerminalSquare[s].total);
  const max = Math.max(1, ...counts);
  const { tip, show, hide } = useTooltip();

  return (
    <ChartFrame
      title={title}
      subtitle="The square the final move landed on"
      legend={<RampLegend max={max} />}
      chart={
        <>
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-1.5">
              {SQUARES.map((sq) => {
                const cell = summary.byTerminalSquare[sq];
                const fill = rampStep(cell.total, max);
                const strong = cell.total > max * 0.5;

                return (
                  <div
                    key={sq}
                    onMouseEnter={(e) =>
                      show(
                        e.nativeEvent.offsetX,
                        e.nativeEvent.offsetY,
                        <CellTip sq={sq} cell={cell} games={summary.games} />,
                      )
                    }
                    onMouseLeave={hide}
                    className="relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded border border-rule transition-transform hover:scale-[1.03]"
                    style={{ background: fill }}
                  >
                    <span
                      className="absolute left-1.5 top-1 tnum text-[10px]"
                      style={{ color: strong ? 'rgba(8,9,11,0.65)' : CHROME.muted }}
                    >
                      {sq}
                    </span>
                    <span
                      className="tnum text-base leading-none"
                      style={{ color: strong ? '#08090b' : CHROME.ink }}
                    >
                      {cell.total.toLocaleString()}
                    </span>
                    <span
                      className="tnum mt-0.5 text-[10px]"
                      style={{ color: strong ? 'rgba(8,9,11,0.7)' : CHROME.muted }}
                    >
                      {fmtPct(cell.total, summary.games)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <Tooltip tip={tip} />
        </>
      }
      table={
        <DataTable
          head={['Square', 'Observer', 'Opponent', 'Draw', 'Total', 'Share']}
          rows={SQUARES.map((sq) => {
            const c = summary.byTerminalSquare[sq];
            return [
              sq,
              c.observer.toLocaleString(),
              c.opponent.toLocaleString(),
              c.draw.toLocaleString(),
              c.total.toLocaleString(),
              fmtPct(c.total, summary.games),
            ];
          })}
        />
      }
    />
  );
}

function CellTip({
  sq,
  cell,
  games,
}: {
  sq: Square;
  cell: { observer: number; opponent: number; draw: number; total: number };
  games: number;
}) {
  return (
    <>
      <div className="text-inkdim">
        Square <span className="tnum text-ink">{sq}</span> ·{' '}
        <span className="tnum text-ink">{cell.total.toLocaleString()}</span> ({fmtPct(cell.total, games)})
      </div>
      <div className="mt-1 space-y-0.5">
        {SERIES_ORDER.map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SERIES[k] }} />
            <span className="text-inkdim">{SERIES_LABEL[k]}</span>
            <span className="tnum ml-auto text-ink">{cell[k].toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function RampLegend({ max }: { max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="tnum text-[10px]" style={{ color: CHROME.muted }}>
        0
      </span>
      <div className="flex h-2.5 overflow-hidden rounded-sm">
        {SEQUENTIAL.map((c) => (
          <span key={c} className="h-full w-6" style={{ background: c }} />
        ))}
      </div>
      <span className="tnum text-[10px]" style={{ color: CHROME.muted }}>
        {max.toLocaleString()}
      </span>
    </div>
  );
}
