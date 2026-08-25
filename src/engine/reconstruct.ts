/**
 * Reconstruction: given a final board, enumerate every legal move history that
 * could have produced it.
 *
 * TIER: VERIFIED MATHEMATICS. The counts are exhaustive, not sampled.
 *
 * The reference case is Theorem 3 (section 2.4): winner holds {2,3,4,6,9} and
 * wins on the 3-6-9 column, loser holds {1,5,7,8}. Expected: 1,728 histories,
 * final move 3/6/9 at 576 each, openings 2 and 4 at 432 each against 288 each
 * for 3, 6 and 9 — and zero OSP-consistent histories in either role.
 */

import {
  type Board,
  emptyBoard,
  type Line,
  linesFor,
  type Mark,
  place,
  SQUARES,
  type Square,
  winnerOf,
} from './board';
import { osp, type OspRule } from './osp';

export interface ReconstructionResult {
  ok: boolean;
  error?: string;

  endMove: number;
  winner: Mark | null;
  winningLines: Line[];
  xSquares: Square[];
  oSquares: Square[];

  /** Total legal histories producing this exact final board. */
  total: number;
  /** Distribution of move 1 (always an X move). */
  openingCounts: Record<Square, number>;
  /** Distribution of the final move. */
  finalMoveCounts: Record<Square, number>;

  /** Histories in which *every* X move matches OSP. */
  ospConsistentAsX: number;
  /** Histories in which *every* O move matches OSP. */
  ospConsistentAsO: number;
  /** Histories OSP-consistent in at least one role. */
  ospConsistentEither: number;

  /** A handful of real histories, for display. */
  samples: Square[][];
  elapsedMs: number;
}

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

function* permutations<T>(items: readonly T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield [...items];
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) yield [items[i], ...p];
  }
}

/** Swap every X for an O and vice versa — the "mirrored universe" view. */
export function swapMarks(board: Board): Board {
  return board.map((c) => (c === 'X' ? 'O' : c === 'O' ? 'X' : null));
}

export function boardFromSets(xSquares: readonly Square[], oSquares: readonly Square[]): Board {
  let b = emptyBoard();
  for (const s of xSquares) b = place(b, s, 'X');
  for (const s of oSquares) b = place(b, s, 'O');
  return b;
}

function validate(board: Board): { error?: string; endMove: number; winner: Mark | null; lines: Line[] } {
  const xSquares = SQUARES.filter((s) => board[s - 1] === 'X');
  const oSquares = SQUARES.filter((s) => board[s - 1] === 'O');
  const nx = xSquares.length;
  const no = oSquares.length;
  const endMove = nx + no;

  if (nx !== no && nx !== no + 1) {
    return {
      error: `Illegal mark counts: X has ${nx}, O has ${no}. X moves first, so X must have the same number as O or exactly one more.`,
      endMove,
      winner: null,
      lines: [],
    };
  }

  const xLines = linesFor(board, 'X');
  const oLines = linesFor(board, 'O');

  if (xLines.length > 0 && oLines.length > 0) {
    return { error: 'Both players hold a completed line — unreachable.', endMove, winner: null, lines: [] };
  }

  if (xLines.length > 0) {
    if (nx !== no + 1) {
      return { error: 'X holds the winning line but did not play the last move.', endMove, winner: 'X', lines: xLines };
    }
    return { endMove, winner: 'X', lines: xLines };
  }

  if (oLines.length > 0) {
    if (nx !== no) {
      return { error: 'O holds the winning line but did not play the last move.', endMove, winner: 'O', lines: oLines };
    }
    return { endMove, winner: 'O', lines: oLines };
  }

  if (endMove !== 9) {
    return {
      error: `No winner and only ${endMove} squares filled — this is not a final board. Drawn games always run to move 9.`,
      endMove,
      winner: null,
      lines: [],
    };
  }

  return { endMove, winner: null, lines: [] };
}

/**
 * Replays one candidate ordering and reports whether it is legal — i.e. no
 * line completes before the final move — plus which roles were OSP-consistent.
 */
function inspectHistory(
  history: readonly Square[],
  rule: OspRule,
): { legal: boolean; ospX: boolean; ospO: boolean } {
  let board: Board = emptyBoard();
  let ospX = true;
  let ospO = true;
  const last = history.length;

  for (let i = 0; i < history.length; i++) {
    const n = i + 1;
    const sq = history[i];
    const mark: Mark = n % 2 === 1 ? 'X' : 'O';

    const free = SQUARES.filter((s) => board[s - 1] === null);
    const predicted = osp(free, n, rule);
    if (mark === 'X') {
      if (sq !== predicted) ospX = false;
    } else if (sq !== predicted) {
      ospO = false;
    }

    board = place(board, sq, mark);

    const win = winnerOf(board);
    if (win && n < last) return { legal: false, ospX: false, ospO: false };
  }

  return { legal: true, ospX, ospO };
}

export function reconstruct(
  board: Board,
  opts: { rule?: OspRule; sampleLimit?: number } = {},
): ReconstructionResult {
  const rule = opts.rule ?? 'standard';
  const sampleLimit = opts.sampleLimit ?? 8;
  const start = Date.now();

  const xSquares = SQUARES.filter((s) => board[s - 1] === 'X');
  const oSquares = SQUARES.filter((s) => board[s - 1] === 'O');
  const check = validate(board);

  const base: ReconstructionResult = {
    ok: !check.error,
    error: check.error,
    endMove: check.endMove,
    winner: check.winner,
    winningLines: check.lines,
    xSquares,
    oSquares,
    total: 0,
    openingCounts: zeroSquares(),
    finalMoveCounts: zeroSquares(),
    ospConsistentAsX: 0,
    ospConsistentAsO: 0,
    ospConsistentEither: 0,
    samples: [],
    elapsedMs: 0,
  };

  if (check.error) return { ...base, elapsedMs: Date.now() - start };

  const openingCounts = zeroSquares();
  const finalMoveCounts = zeroSquares();
  const samples: Square[][] = [];
  let total = 0;
  let ospX = 0;
  let ospO = 0;
  let ospEither = 0;

  const oOrders = [...permutations(oSquares)];

  for (const xOrder of permutations(xSquares)) {
    for (const oOrder of oOrders) {
      // X takes the odd move numbers, O the even ones.
      const history: Square[] = [];
      let xi = 0;
      let oi = 0;
      for (let n = 1; n <= check.endMove; n++) {
        history.push(n % 2 === 1 ? xOrder[xi++] : oOrder[oi++]);
      }

      const verdict = inspectHistory(history, rule);
      if (!verdict.legal) continue;

      total++;
      openingCounts[history[0]]++;
      finalMoveCounts[history[history.length - 1]]++;
      if (verdict.ospX) ospX++;
      if (verdict.ospO) ospO++;
      if (verdict.ospX || verdict.ospO) ospEither++;
      if (samples.length < sampleLimit) samples.push(history);
    }
  }

  return {
    ...base,
    total,
    openingCounts,
    finalMoveCounts,
    ospConsistentAsX: ospX,
    ospConsistentAsO: ospO,
    ospConsistentEither: ospEither,
    samples,
    elapsedMs: Date.now() - start,
  };
}

/** The Theorem 3 board, ready to load into the reconstruction tool. */
export const THEOREM_3_BOARD: Board = boardFromSets([2, 3, 4, 6, 9], [1, 5, 7, 8]);
