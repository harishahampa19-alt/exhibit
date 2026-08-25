/**
 * End-move distribution — stacked bars, one per ending move.
 *
 * Magnitude by category, split three ways by outcome. Single y-axis; a 2px
 * surface gap separates stacked segments; only the top of each stack is
 * rounded, so the baseline stays flat.
 */

import type { Summary } from '../../engine/summary';
import { ChartFrame, DataTable, Legend, Tooltip, useTooltip } from './ChartFrame';
import { CHROME, roundedTopRect, SERIES, SERIES_LABEL, SERIES_ORDER, fmtPct } from './tokens';

const W = 520;
const H = 240;
const PAD = { top: 14, right: 12, bottom: 30, left: 44 };
const SEGMENT_GAP = 2;

export function EndMoveChart({
  summary,
  title = 'End-move distribution',
}: {
  summary: Summary;
  title?: string;
}) {
  const moves = [5, 6, 7, 8, 9];
  const rows = moves.map((m) => summary.byEndMove[m] ?? { observer: 0, opponent: 0, draw: 0, total: 0 });
  const max = Math.max(1, ...rows.map((r) => r.total));

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const bandW = plotW / moves.length;
  const barW = Math.min(56, bandW * 0.56);

  const yOf = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));

  const { tip, show, hide } = useTooltip();

  return (
    <ChartFrame
      title={title}
      subtitle={`${summary.games.toLocaleString()} games · ${summary.label}`}
      legend={<Legend />}
      chart={
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
            {/* Recessive grid */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={yOf(t)}
                  y2={yOf(t)}
                  stroke={CHROME.grid}
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 6}
                  y={yOf(t)}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={9}
                  fill={CHROME.muted}
                  fontFamily="ui-monospace, monospace"
                >
                  {t.toLocaleString()}
                </text>
              </g>
            ))}

            {moves.map((m, i) => {
              const row = rows[i];
              const x = PAD.left + i * bandW + (bandW - barW) / 2;
              let cursor = 0;

              return (
                <g key={m}>
                  {SERIES_ORDER.map((k) => {
                    const value = row[k];
                    if (value === 0) return null;

                    const isTop =
                      SERIES_ORDER.slice(SERIES_ORDER.indexOf(k) + 1).every((rest) => row[rest] === 0);
                    const rawH = (value / max) * plotH;
                    const h = Math.max(1, rawH - SEGMENT_GAP);
                    const y = PAD.top + plotH - ((cursor + value) / max) * plotH;
                    cursor += value;

                    const content = (
                      <>
                        <div className="text-inkdim">
                          End move <span className="tnum text-ink">{m}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-sm"
                            style={{ background: SERIES[k] }}
                          />
                          <span>{SERIES_LABEL[k]}</span>
                        </div>
                        <div className="tnum mt-0.5 text-ink">
                          {value.toLocaleString()} · {fmtPct(value, summary.games)}
                        </div>
                      </>
                    );

                    return (
                      <path
                        key={k}
                        d={
                          isTop
                            ? roundedTopRect(x, y, barW, h, 4)
                            : `M ${x} ${y} h ${barW} v ${h} h ${-barW} Z`
                        }
                        fill={SERIES[k]}
                        onMouseEnter={(e) =>
                          show(e.nativeEvent.offsetX, e.nativeEvent.offsetY, content)
                        }
                        onMouseMove={(e) => show(e.nativeEvent.offsetX, e.nativeEvent.offsetY, content)}
                        onMouseLeave={hide}
                        style={{ cursor: 'pointer' }}
                      />
                    );
                  })}

                  {/* Selective direct label: the stack total, never every segment. */}
                  {row.total > 0 && (
                    <text
                      x={x + barW / 2}
                      y={yOf(row.total) - 6}
                      textAnchor="middle"
                      fontSize={9}
                      fill={CHROME.ink}
                      fontFamily="ui-monospace, monospace"
                    >
                      {fmtPct(row.total, summary.games)}
                    </text>
                  )}

                  <text
                    x={x + barW / 2}
                    y={H - PAD.bottom + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fill={CHROME.muted}
                    fontFamily="ui-monospace, monospace"
                  >
                    {m}
                  </text>
                </g>
              );
            })}

            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={PAD.top + plotH}
              y2={PAD.top + plotH}
              stroke={CHROME.axis}
              strokeWidth={1}
            />
            <text
              x={PAD.left + plotW / 2}
              y={H - 2}
              textAnchor="middle"
              fontSize={9}
              fill={CHROME.muted}
              fontFamily="ui-monospace, monospace"
            >
              ending move
            </text>
          </svg>
          <Tooltip tip={tip} />
        </>
      }
      table={
        <DataTable
          head={['End move', 'Observer', 'Opponent', 'Draw', 'Total', 'Share']}
          rows={moves.map((m, i) => {
            const r = rows[i];
            return [
              m,
              r.observer.toLocaleString(),
              r.opponent.toLocaleString(),
              r.draw.toLocaleString(),
              r.total.toLocaleString(),
              fmtPct(r.total, summary.games),
            ];
          })}
        />
      }
    />
  );
}
