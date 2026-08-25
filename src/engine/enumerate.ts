/**
 * Exhaustive enumeration of every legal tic-tac-toe game.
 *
 * TIER: VERIFIED MATHEMATICS. Nothing here is framework-specific — this is the
 * possibility space the Observer is being measured against.
 *
 * There are 255,168 legal games. The walk uses a mutable cell array with
 * undo and only checks the four lines through the square just played, which
 * keeps a full sweep well under a second.
 */

import { LINES, type Square } from './board';

export type EnumOutcome = 'X' | 'O' | 'draw';

export interface EnumerationResult {
  total: number;
  xWins: number;
  oWins: number;
  draws: number;
  /** Games grouped by the move on which they ended. */
  byEndMove: Record<number, { X: number; O: number; draw: number; total: number }>;
  /** Terminal (winning) square across the 209,088 decisive games. */
  terminalSquare: Record<Square, number>;
  /** Terminal square counted separately for X wins and O wins. */
  terminalSquareByWinner: { X: Record<Square, number>; O: Record<Square, number> };
  /** endMove -> terminalSquare -> outcome -> count. */
  crossTab: Record<string, number>;
  /** Distinct positions reachable in legal play, including the empty board. */
  reachablePositions: number;
  elapsedMs: number;
}

/** Lines through each square, precomputed as flat index triples. */
const LINES_THROUGH: number[][][] = (() => {
  const out: number[][][] = Array.from({ length: 9 }, () => []);
  for (const line of LINES) {
    const idx = line.map((s) => s - 1);
    for (const i of idx) out[i].push(idx);
  }
  return out;
})();

const zeroSquares = (): Record<Square, number> => ({
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
});

export const crossTabKey = (endMove: number, sq: Square, outcome: EnumOutcome): string =>
  `${endMove}:${sq}:${outcome}`;

export function enumerateAllGames(opts: { trackPositions?: boolean } = {}): EnumerationResult {
  const trackPositions = opts.trackPositions ?? true;
  const start = Date.now();

  // 0 = empty, 1 = X, 2 = O
  const cells = new Int8Array(9);

  const byEndMove: EnumerationResult['byEndMove'] = {};
  for (let m = 5; m <= 9; m++) byEndMove[m] = { X: 0, O: 0, draw: 0, total: 0 };

  const terminalSquare = zeroSquares();
  const terminalSquareByWinner = { X: zeroSquares(), O: zeroSquares() };
  const crossTab: Record<string, number> = {};
  const positions = trackPositions ? new Set<string>() : null;

  let total = 0;
  let xWins = 0;
  let oWins = 0;
  let draws = 0;

  const key = (): string => {
    let s = '';
    for (let i = 0; i < 9; i++) s += cells[i];
    return s;
  };

  const completes = (i: number, player: number): boolean => {
    for (const line of LINES_THROUGH[i]) {
      if (cells[line[0]] === player && cells[line[1]] === player && cells[line[2]] === player) {
        return true;
      }
    }
    return false;
  };

  const record = (endMove: number, outcome: EnumOutcome, sq: Square): void => {
    total++;
    byEndMove[endMove].total++;
    byEndMove[endMove][outcome]++;
    crossTab[crossTabKey(endMove, sq, outcome)] =
      (crossTab[crossTabKey(endMove, sq, outcome)] ?? 0) + 1;

    if (outcome === 'draw') {
      draws++;
    } else {
      if (outcome === 'X') xWins++;
      else oWins++;
      terminalSquare[sq]++;
      terminalSquareByWinner[outcome][sq]++;
    }
  };

  const walk = (moveCount: number): void => {
    if (positions) positions.add(key());

    const player = moveCount % 2 === 0 ? 1 : 2; // X on move 1 (moveCount 0)
    const nextCount = moveCount + 1;

    for (let i = 0; i < 9; i++) {
      if (cells[i] !== 0) continue;
      cells[i] = player;

      const sq = (i + 1) as Square;
      if (completes(i, player)) {
        record(nextCount, player === 1 ? 'X' : 'O', sq);
        if (positions) positions.add(key());
      } else if (nextCount === 9) {
        record(9, 'draw', sq);
        if (positions) positions.add(key());
      } else {
        walk(nextCount);
      }

      cells[i] = 0;
    }
  };

  walk(0);

  return {
    total,
    xWins,
    oWins,
    draws,
    byEndMove,
    terminalSquare,
    terminalSquareByWinner,
    crossTab,
    reachablePositions: positions ? positions.size : -1,
    elapsedMs: Date.now() - start,
  };
}

/** Cached so the UI can enumerate once per session and reuse the result. */
let cached: EnumerationResult | null = null;
export function enumerationOnce(): EnumerationResult {
  if (!cached) cached = enumerateAllGames();
  return cached;
}
