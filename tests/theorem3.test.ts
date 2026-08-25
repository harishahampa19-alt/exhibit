/**
 * Theorem 3 — The Resonance Paradox, verified by exhaustive enumeration.
 *
 * The board: winner holds {2,3,4,6,9} and wins on the 3-6-9 column — the
 * Observer's own resonance line — while the loser holds {1,5,7,8}.
 */

import { describe, expect, it } from 'vitest';
import { boardFromSets, reconstruct, swapMarks, THEOREM_3_BOARD } from '../src/engine/reconstruct';
import { linesFor } from '../src/engine/board';
import { THEOREM_3 } from '../src/data/known-results';

const result = reconstruct(THEOREM_3_BOARD);

describe('the Theorem 3 board is well formed', () => {
  it('gives the winner exactly one line, the 3-6-9 column', () => {
    const xLines = linesFor(THEOREM_3_BOARD, 'X');
    expect(xLines).toHaveLength(1);
    expect(xLines[0]).toEqual([3, 6, 9]);
  });

  it('leaves the loser with no line at all', () => {
    expect(linesFor(THEOREM_3_BOARD, 'O')).toHaveLength(0);
  });

  it('is a full nine-move game won by the five-square player', () => {
    expect(result.ok).toBe(true);
    expect(result.endMove).toBe(9);
    expect(result.winner).toBe('X');
    expect(result.xSquares).toEqual(THEOREM_3.winnerSquares);
    expect(result.oSquares).toEqual(THEOREM_3.loserSquares);
  });
});

describe('history reconstruction', () => {
  it('finds exactly 1,728 legal histories', () => {
    expect(result.total).toBe(THEOREM_3.totalHistories);
  });

  it('agrees with the closed form 3 · 4! · 4!', () => {
    // The winner's last move must complete 3-6-9, so it is one of three
    // squares; the other four winner-moves and all four loser-moves are free.
    expect(3 * 24 * 24).toBe(1_728);
    expect(result.total).toBe(3 * 24 * 24);
  });

  it('always ends on 3, 6 or 9 — 576 histories each', () => {
    expect(result.finalMoveCounts[3]).toBe(576);
    expect(result.finalMoveCounts[6]).toBe(576);
    expect(result.finalMoveCounts[9]).toBe(576);
    for (const sq of [1, 2, 4, 5, 7, 8] as const) {
      expect(result.finalMoveCounts[sq]).toBe(0);
    }
  });

  it('opens on 2 or 4 in 432 histories each, against 288 each for 3, 6 and 9', () => {
    expect(result.openingCounts[2]).toBe(432);
    expect(result.openingCounts[4]).toBe(432);
    expect(result.openingCounts[3]).toBe(288);
    expect(result.openingCounts[6]).toBe(288);
    expect(result.openingCounts[9]).toBe(288);
  });

  it('never opens on a square the loser holds', () => {
    for (const sq of THEOREM_3.loserSquares) expect(result.openingCounts[sq]).toBe(0);
  });

  it('accounts for every history in both distributions', () => {
    const opens = Object.values(result.openingCounts).reduce((a, b) => a + b, 0);
    const finals = Object.values(result.finalMoveCounts).reduce((a, b) => a + b, 0);
    expect(opens).toBe(THEOREM_3.totalHistories);
    expect(finals).toBe(THEOREM_3.totalHistories);
  });
});

describe('the paradox itself', () => {
  it('finds ZERO OSP-consistent histories in either role', () => {
    expect(result.ospConsistentAsX).toBe(THEOREM_3.ospConsistentAsX);
    expect(result.ospConsistentAsO).toBe(THEOREM_3.ospConsistentAsO);
    expect(result.ospConsistentEither).toBe(0);
  });

  it('fails as the winner because OSP always opens on square 1', () => {
    // Square 1 belongs to the loser on this board, so no history can start
    // the way OSP requires.
    expect(result.xSquares).not.toContain(1);
    expect(result.openingCounts[1]).toBe(0);
  });

  it('fails as the loser too — the mirrored universe is no better', () => {
    const mirrored = reconstruct(swapMarks(THEOREM_3_BOARD));
    // Swapping marks makes the board illegal: the five-square side must move
    // first and therefore must be X.
    expect(mirrored.ok).toBe(false);
    // The O-role check on the legal board is the meaningful one.
    expect(result.ospConsistentAsO).toBe(0);
  });

  it('holds regardless of which OSP rule is used', () => {
    const variant = reconstruct(THEOREM_3_BOARD, { rule: 'variant' });
    expect(variant.total).toBe(THEOREM_3.totalHistories);
    expect(variant.ospConsistentEither).toBe(0);
  });
});

describe('reconstruction on other boards', () => {
  it('rejects a board where both players hold a line', () => {
    const bad = boardFromSets([1, 2, 3], [4, 5, 6]);
    expect(reconstruct(bad).ok).toBe(false);
  });

  it('rejects impossible mark counts', () => {
    const bad = boardFromSets([1, 2, 3, 7, 8], [9]);
    expect(reconstruct(bad).ok).toBe(false);
  });

  it('rejects an unfinished board with no winner', () => {
    const bad = boardFromSets([1, 2], [4, 5]);
    expect(reconstruct(bad).ok).toBe(false);
  });

  it('counts histories for a fast X win at move 5', () => {
    // X takes the top row; O takes two squares that block nothing.
    const board = boardFromSets([1, 2, 3], [4, 5]);
    const r = reconstruct(board);
    expect(r.ok).toBe(true);
    expect(r.endMove).toBe(5);
    expect(r.winner).toBe('X');
    // X holds exactly the winning line, so the line completes on X's third
    // move whatever the order: all 3! orderings are legal, times 2! for O.
    expect(r.total).toBe(6 * 2);
    expect(r.total).toBe(12);
  });

  it('finds every sample history it reports to be legal and complete', () => {
    for (const history of result.samples) {
      expect(history).toHaveLength(9);
      expect(new Set(history).size).toBe(9);
      expect([3, 6, 9]).toContain(history[8]);
    }
  });
});
