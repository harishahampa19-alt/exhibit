/**
 * Aggregation shared by Lab mode, the worker and the archive's aggregate view,
 * so lived games and simulated games are always reduced the same way.
 */

import { boardFromSequence, SQUARES, type Square } from './board';
import type { GameRecord, OpponentKind, Outcome } from './runner';
import type { OspRule } from './osp';

export interface Summary {
  games: number;
  label: string;
  opponent: OpponentKind | 'human' | 'mixed-sources';
  rule: OspRule | 'mixed';

  observerWins: number;
  opponentWins: number;
  draws: number;

  /** endMove -> counts by outcome. */
  byEndMove: Record<number, { observer: number; opponent: number; draw: number; total: number }>;
  /** Terminal square -> counts by outcome. */
  byTerminalSquare: Record<Square, { observer: number; opponent: number; draw: number; total: number }>;
  /** "endMove:square:outcome" -> count. */
  crossTab: Record<string, number>;

  /** Games in which the Observer walked past at least one win. */
  gamesWithDeclinedWins: number;
  totalDeclinedWins: number;
  /** Games in which the Observer ended up holding square 5. */
  centreHeld: number;
  /** Games in which the Observer ended up holding square 9. */
  terminalHeld: number;

  elapsedMs: number;
}

export const key = (endMove: number, sq: Square, outcome: Outcome): string =>
  `${endMove}:${sq}:${outcome}`;

const zeroOutcomes = () => ({ observer: 0, opponent: 0, draw: 0, total: 0 });

function emptySquareMap(): Record<Square, ReturnType<typeof zeroOutcomes>> {
  return SQUARES.reduce(
    (acc, s) => {
      acc[s] = zeroOutcomes();
      return acc;
    },
    {} as Record<Square, ReturnType<typeof zeroOutcomes>>,
  );
}

export function summarize(
  records: readonly GameRecord[],
  meta: { label: string; elapsedMs?: number } = { label: 'Summary' },
): Summary {
  const byEndMove: Summary['byEndMove'] = {};
  for (let m = 5; m <= 9; m++) byEndMove[m] = zeroOutcomes();

  const byTerminalSquare = emptySquareMap();
  const crossTab: Record<string, number> = {};

  let observerWins = 0;
  let opponentWins = 0;
  let draws = 0;
  let gamesWithDeclinedWins = 0;
  let totalDeclinedWins = 0;
  let centreHeld = 0;
  let terminalHeld = 0;

  for (const g of records) {
    if (g.outcome === 'observer') observerWins++;
    else if (g.outcome === 'opponent') opponentWins++;
    else draws++;

    const bucket = byEndMove[g.endMove] ?? (byEndMove[g.endMove] = zeroOutcomes());
    bucket[g.outcome]++;
    bucket.total++;

    const sqBucket = byTerminalSquare[g.terminalSquare];
    sqBucket[g.outcome]++;
    sqBucket.total++;

    const k = key(g.endMove, g.terminalSquare, g.outcome);
    crossTab[k] = (crossTab[k] ?? 0) + 1;

    if (g.declinedWins.length > 0) {
      gamesWithDeclinedWins++;
      totalDeclinedWins += g.declinedWins.length;
    }

    const final = boardFromSequence(g.sequence);
    if (final[4] === g.observerMark) centreHeld++;
    if (final[8] === g.observerMark) terminalHeld++;
  }

  const opponents = new Set(records.map((r) => r.opponent));
  const rules = new Set(records.map((r) => r.rule));

  return {
    games: records.length,
    label: meta.label,
    opponent:
      opponents.size === 1 ? ([...opponents][0] as Summary['opponent']) : 'mixed-sources',
    rule: rules.size === 1 ? ([...rules][0] as OspRule) : 'mixed',
    observerWins,
    opponentWins,
    draws,
    byEndMove,
    byTerminalSquare,
    crossTab,
    gamesWithDeclinedWins,
    totalDeclinedWins,
    centreHeld,
    terminalHeld,
    elapsedMs: meta.elapsedMs ?? 0,
  };
}

/** Top (endMove, square, outcome) signatures by share, for the results table. */
export function topSignatures(
  summary: Summary,
  limit = 8,
): { endMove: number; square: Square; outcome: Outcome; count: number; share: number }[] {
  return Object.entries(summary.crossTab)
    .map(([k, count]) => {
      const [endMove, square, outcome] = k.split(':');
      return {
        endMove: Number(endMove),
        square: Number(square) as Square,
        outcome: outcome as Outcome,
        count,
        share: summary.games === 0 ? 0 : count / summary.games,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export const pct = (n: number, total: number): string =>
  total === 0 ? '—' : `${((n / total) * 100).toFixed(1)}%`;
