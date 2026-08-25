/**
 * Cross-tab: ending move × terminal square × winner.
 *
 * Three dimensions do not fit one plot cleanly, so this is a matrix — cells
 * shaded sequentially by count, with the outcome carried by a labeled dot
 * rather than by the cell hue. Counts are printed in every non-empty cell.
 */

import { SQUARES, type Square } from '../../engine/board';
import type { Outcome } from '../../engine/runner';
import { key, type Summary, topSignatures } from '../../engine/summary';
import { ChartFrame, DataTable, Legend, Tooltip, useTooltip } from './ChartFrame';
import { CHROME, fmtPct, rampStep, SERIES, SERIES_LABEL } from './tokens';

const MOVES = [5, 6, 7, 8, 9];
const OUTCOMES: readonly Outcome[] = ['observer', 'opponent', 'draw'];

interface Cell {
  total: number;
  dominant: Outcome | null;
  byOutcome: Record<Outcome, number>;
}

function buildCell(summary: Summary, move: number, sq: Square): Cell {
  const byOutcome = { observer: 0, opponent: 0, draw: 0 } as Record<Outcome, number>;
  for (const o of OUTCOMES) byOutcome[o] = summary.crossTab[key(move, sq, o)] ?? 0;
  const total = OUTCOMES.reduce((a, o) => a + byOutcome[o], 0);
  const dominant =
    total === 0 ? null : OUTCOMES.reduce((a, b) => (byOutcome[b] > byOutcome[a] ? b : a));
  return { total, dominant, byOutcome };
}

export function CrossTab({ summary }: { summary: Summary }) {
  const cells = MOVES.map((m) => SQUARES.map((sq) => buildCell(summary, m, sq)));
  const max = Math.max(1, ...cells.flat().map((c) => c.total));
  const { tip, show, hide } = useTooltip();

  const signatures = topSignatures(summary, 8);

  return (
    <ChartFrame
      title="End move × terminal square × winner"
      subtitle="Cell shade is magnitude; the dot names the winner"
      legend={<Legend />}
      chart={
        <>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-[2px]">
              <thead>
                <tr>
                  <th className="w-14" />
                  {SQUARES.map((sq) => (
                    <th
                      key={sq}
                      className="tnum w-11 pb-1 text-[10px] font-normal"
                      style={{ color: CHROME.muted }}
                    >
                      {sq}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOVES.map((m, mi) => (
                  <tr key={m}>
                    <th
                      className="tnum pr-2 text-right text-[10px] font-normal"
                      style={{ color: CHROME.muted }}
                    >
                      move {m}
                    </th>
                    {SQUARES.map((sq, si) => {
                      const cell = cells[mi][si];
                      const strong = cell.total > max * 0.5;
                      return (
                        <td key={sq}>
                          <div
                            onMouseEnter={(e) =>
                              cell.total > 0 &&
                              show(
                                e.nativeEvent.offsetX,
                                e.nativeEvent.offsetY,
                                <CellTip move={m} sq={sq} cell={cell} games={summary.games} />,
                              )
                            }
                            onMouseLeave={hide}
                            className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-sm border border-rule/60 ${
                              cell.total > 0 ? 'cursor-pointer' : ''
                            }`}
                            style={{
                              background: cell.total === 0 ? CHROME.surface : rampStep(cell.total, max),
                            }}
                          >
                            {cell.total > 0 && (
                              <>
                                <span
                                  className="tnum text-[10px] leading-none"
                                  style={{ color: strong ? '#08090b' : CHROME.ink }}
                                >
                                  {cell.total.toLocaleString()}
                                </span>
                                {cell.dominant && (
                                  <span
                                    className="mt-1 h-1.5 w-1.5 rounded-full"
                                    style={{ background: SERIES[cell.dominant] }}
                                    aria-label={SERIES_LABEL[cell.dominant]}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Tooltip tip={tip} />

          {signatures.length > 0 && (
            <div className="mt-3 border-t border-rule pt-2.5">
              <div className="label mb-1.5">Top terminal signatures</div>
              <div className="space-y-1">
                {signatures.map((s) => (
                  <div key={`${s.endMove}-${s.square}-${s.outcome}`} className="flex items-center gap-2 text-[11px]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ background: SERIES[s.outcome] }}
                    />
                    <span className="tnum text-inkdim">
                      move {s.endMove} · square {s.square}
                    </span>
                    <span className="text-inkfaint">{SERIES_LABEL[s.outcome]}</span>
                    <span className="tnum ml-auto text-ink">{fmtPct(s.count, summary.games)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      }
      table={
        <DataTable
          head={['End move', 'Square', 'Winner', 'Games', 'Share']}
          rows={topSignatures(summary, 40).map((s) => [
            s.endMove,
            s.square,
            SERIES_LABEL[s.outcome],
            s.count.toLocaleString(),
            fmtPct(s.count, summary.games),
          ])}
        />
      }
    />
  );
}

function CellTip({
  move,
  sq,
  cell,
  games,
}: {
  move: number;
  sq: Square;
  cell: Cell;
  games: number;
}) {
  return (
    <>
      <div className="text-inkdim">
        move <span className="tnum text-ink">{move}</span> · square{' '}
        <span className="tnum text-ink">{sq}</span>
      </div>
      <div className="tnum mt-0.5 text-ink">
        {cell.total.toLocaleString()} · {fmtPct(cell.total, games)}
      </div>
      <div className="mt-1 space-y-0.5">
        {OUTCOMES.filter((o) => cell.byOutcome[o] > 0).map((o) => (
          <div key={o} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SERIES[o] }} />
            <span className="text-inkdim">{SERIES_LABEL[o]}</span>
            <span className="tnum ml-auto text-ink">{cell.byOutcome[o].toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}
