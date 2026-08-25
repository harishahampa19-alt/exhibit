import { useMemo, useState } from 'react';
import {
  type Board,
  type Cell,
  emptyBoard,
  SQUARES,
  type Square,
} from '../engine/board';
import { reconstruct, swapMarks, THEOREM_3_BOARD } from '../engine/reconstruct';
import { THEOREM_3 } from '../data/known-results';
import { Button, Panel, Stat } from '../components/Panel';
import { Claim } from '../components/Claim';
import { DataTable } from '../components/charts/ChartFrame';
import { CHROME } from '../components/charts/tokens';

export function ReconstructPage() {
  const [board, setBoard] = useState<Board>(THEOREM_3_BOARD);
  const result = useMemo(() => reconstruct(board), [board]);

  const cycle = (sq: Square) => {
    setBoard((b) => {
      const next = b.slice() as Cell[];
      next[sq - 1] = b[sq - 1] === null ? 'X' : b[sq - 1] === 'X' ? 'O' : null;
      return next;
    });
  };

  const isTheorem3 =
    result.ok &&
    result.xSquares.join() === THEOREM_3.winnerSquares.join() &&
    result.oSquares.join() === THEOREM_3.loserSquares.join();

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Panel
          title="Final board"
          right={
            <div className="flex gap-1">
              <Button tone="ghost" onClick={() => setBoard(THEOREM_3_BOARD)}>
                Theorem 3
              </Button>
              <Button tone="ghost" onClick={() => setBoard(swapMarks(board))} title="Mirrored universe">
                Swap X↔O
              </Button>
              <Button tone="ghost" onClick={() => setBoard(emptyBoard())}>
                Clear
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-3">
            <div className="grid grid-cols-3 gap-1.5">
              {SQUARES.map((sq) => {
                const cell = board[sq - 1];
                return (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => cycle(sq)}
                    className={`relative flex h-20 w-20 items-center justify-center rounded border bg-panel transition-colors hover:border-inkfaint ${
                      result.winningLines.some((l) => l.includes(sq))
                        ? 'border-realized/70'
                        : 'border-rule'
                    }`}
                  >
                    <span className="absolute left-1 top-1 tnum text-[10px] text-inkfaint">{sq}</span>
                    {cell ? (
                      <span
                        className={`text-3xl leading-none ${cell === 'X' ? 'text-observer' : 'text-opponent'}`}
                      >
                        {cell}
                      </span>
                    ) : (
                      <span className="text-2xl leading-none text-white/[0.045]">{sq}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-inkfaint">Click a square to cycle empty → X → O.</p>
          </div>
        </Panel>

        {!result.ok ? (
          <Claim tier="math" title="Not a reachable final board">
            <p>{result.error}</p>
          </Claim>
        ) : (
          <Panel title="Reading">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Legal histories" value={result.total.toLocaleString()} />
              <Stat label="End move" value={result.endMove} />
              <Stat
                label="Winner"
                value={result.winner ?? 'draw'}
                tone={result.winner ? 'realized' : 'chaos'}
              />
              <Stat
                label="OSP-consistent"
                value={result.ospConsistentEither.toLocaleString()}
                hint={`as X ${result.ospConsistentAsX} · as O ${result.ospConsistentAsO}`}
                tone={result.ospConsistentEither === 0 ? 'alarm' : 'realized'}
              />
            </div>
            <p className="mt-2 text-[11px] text-inkfaint">
              Computed exhaustively in {result.elapsedMs} ms — every ordering of both players'
              squares, filtered to those where no line completes early.
            </p>
          </Panel>
        )}
      </div>

      <div className="space-y-4">
        {isTheorem3 && (
          <Claim tier="math" title={THEOREM_3.name}>
            <p>
              The winner holds {'{' + THEOREM_3.winnerSquares.join(', ') + '}'} and wins on the
              3-6-9 column — the Observer's own resonance line — while the loser holds{' '}
              {'{' + THEOREM_3.loserSquares.join(', ') + '}'}.{' '}
              <span className="text-tierMath">{THEOREM_3.claim}</span>
            </p>
            <p className="mt-2">{THEOREM_3.mechanism}</p>
            <p className="mt-2 italic text-tierInterp">
              Interpretation: {THEOREM_3.interpretation}
            </p>
          </Claim>
        )}

        {result.ok && result.total > 0 && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Opening square">
                <Distribution counts={result.openingCounts} total={result.total} />
              </Panel>
              <Panel title="Final move">
                <Distribution counts={result.finalMoveCounts} total={result.total} />
              </Panel>
            </div>

            <Panel title="Sample histories">
              <div className="space-y-1">
                {result.samples.map((h, i) => (
                  <div key={i} className="tnum flex flex-wrap items-center gap-1 text-[11px]">
                    {h.map((sq, j) => (
                      <span key={j} className="flex items-center gap-1">
                        <span
                          className={`rounded border px-1.5 py-0.5 ${
                            j % 2 === 0
                              ? 'border-realized/40 bg-realized/10 text-realized'
                              : 'border-rule2 text-opponent'
                          }`}
                        >
                          {sq}
                        </span>
                        {j < h.length - 1 && <span className="text-inkfaint">→</span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-inkfaint">
                Warm squares are X's moves (odd move numbers), cool are O's.
              </p>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function Distribution({
  counts,
  total,
}: {
  counts: Record<Square, number>;
  total: number;
}) {
  const max = Math.max(1, ...SQUARES.map((s) => counts[s]));
  const present = SQUARES.filter((s) => counts[s] > 0);

  return (
    <div>
      <div className="space-y-1">
        {present.map((sq) => (
          <div key={sq} className="flex items-center gap-2">
            <span className="tnum w-4 text-[11px] text-inkdim">{sq}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-sm bg-rule/40">
              <div
                className="h-full rounded-sm"
                style={{ width: `${(counts[sq] / max) * 100}%`, background: '#c98500' }}
              />
            </div>
            <span className="tnum w-24 text-right text-[11px] text-ink">
              {counts[sq].toLocaleString()}
              <span className="ml-1" style={{ color: CHROME.muted }}>
                {((counts[sq] / total) * 100).toFixed(1)}%
              </span>
            </span>
          </div>
        ))}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-inkfaint hover:text-inkdim">
          Table
        </summary>
        <div className="mt-2">
          <DataTable
            head={['Square', 'Histories', 'Share']}
            rows={present.map((sq) => [
              sq,
              counts[sq].toLocaleString(),
              `${((counts[sq] / total) * 100).toFixed(1)}%`,
            ])}
          />
        </div>
      </details>
    </div>
  );
}
