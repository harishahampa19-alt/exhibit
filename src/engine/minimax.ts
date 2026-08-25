/**
 * Perfect play, written from scratch — the search space is 5,478 reachable
 * positions, so a plain memoised minimax solves the whole game instantly.
 *
 * This exists ONLY as a simulated opponent. The Observer never uses it.
 *
 * Scores are from X's perspective and depth-weighted (`10 - plies`), so a
 * perfect player prefers to win sooner and to lose later. Depth is derived
 * from the board itself, which keeps the transposition map sound.
 */

import {
  type Board,
  type Square,
  boardKey,
  empties,
  isFull,
  markToMove,
  place,
  plies,
  winnerOf,
} from './board';
import { pick, type Rng } from './rng';

/** Module-level transposition map, shared across every game in a run. */
const transpositions = new Map<string, number>();

export function clearTranspositions(): void {
  transpositions.clear();
}

export function transpositionCount(): number {
  return transpositions.size;
}

/** Game-theoretic value of `board` from X's perspective, under perfect play. */
export function solve(board: Board): number {
  const win = winnerOf(board);
  const depth = plies(board);
  if (win) return win.mark === 'X' ? 10 - depth : depth - 10;
  if (isFull(board)) return 0;

  const key = boardKey(board);
  const hit = transpositions.get(key);
  if (hit !== undefined) return hit;

  const mark = markToMove(board);
  let best = mark === 'X' ? -Infinity : Infinity;
  for (const sq of empties(board)) {
    const score = solve(place(board, sq, mark));
    best = mark === 'X' ? Math.max(best, score) : Math.min(best, score);
  }

  transpositions.set(key, best);
  return best;
}

/** Every move that achieves the optimal value for the side to move. */
export function bestMoves(board: Board): Square[] {
  const mark = markToMove(board);
  const options = empties(board).map((sq) => ({ sq, score: solve(place(board, sq, mark)) }));
  if (options.length === 0) return [];

  const best = options.reduce(
    (acc, o) => (mark === 'X' ? Math.max(acc, o.score) : Math.min(acc, o.score)),
    mark === 'X' ? -Infinity : Infinity,
  );
  return options.filter((o) => o.score === best).map((o) => o.sq);
}

/** Perfect play with a uniform random tie-break, as used in section 2.2. */
export function perfectMove(board: Board, rng: Rng): Square {
  return pick(bestMoves(board), rng);
}

/** Uniform random legal move. */
export function randomMove(board: Board, rng: Rng): Square {
  return pick(empties(board), rng);
}
