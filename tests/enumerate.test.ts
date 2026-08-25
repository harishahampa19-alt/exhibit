import { beforeAll, describe, expect, it } from 'vitest';
import { CORNERS, EDGES, SQUARES } from '../src/engine/board';
import { enumerateAllGames, type EnumerationResult } from '../src/engine/enumerate';
import {
  ENUMERATION,
  ENUMERATION_ROWS,
  TERMINAL_SQUARE_COUNTS,
  TIER_COUNTS,
} from '../src/data/known-results';

let result: EnumerationResult;

beforeAll(() => {
  result = enumerateAllGames();
});

describe('exhaustive enumeration of every legal game', () => {
  it('finds exactly 255,168 games', () => {
    expect(result.total).toBe(ENUMERATION.total);
  });

  it('splits into 131,184 X wins, 77,904 O wins and 46,080 draws', () => {
    expect(result.xWins).toBe(ENUMERATION.xWins);
    expect(result.oWins).toBe(ENUMERATION.oWins);
    expect(result.draws).toBe(ENUMERATION.draws);
    expect(result.xWins + result.oWins + result.draws).toBe(ENUMERATION.total);
  });

  it('matches the end-move table row for row', () => {
    for (const row of ENUMERATION_ROWS) {
      expect(result.byEndMove[row.endMove][row.outcome]).toBe(row.games);
    }
  });

  it('never ends before move 5', () => {
    for (let m = 0; m < 5; m++) expect(result.byEndMove[m]).toBeUndefined();
    expect(result.byEndMove[5].total).toBe(1_440);
  });

  it('draws only at move 9', () => {
    for (let m = 5; m <= 8; m++) expect(result.byEndMove[m].draw).toBe(0);
    expect(result.byEndMove[9].draw).toBe(ENUMERATION.draws);
  });

  it('puts draws at 18.1% of all games', () => {
    expect(result.draws / result.total).toBeCloseTo(0.1806, 4);
  });

  it('makes the earliest possible win move 5, at 0.6% of games', () => {
    expect(result.byEndMove[5].X).toBe(1_440);
    expect(result.byEndMove[5].O).toBe(0);
    expect(1_440 / result.total).toBeCloseTo(0.0056, 4);
  });

  it('shows move 9 is NOT reserved for draws — 81,792 games end there with an X win', () => {
    expect(result.byEndMove[9].X).toBe(81_792);
    expect(result.byEndMove[9].X).toBeGreaterThan(result.byEndMove[9].draw);
  });

  it('reaches 5,478 distinct positions', () => {
    expect(result.reachablePositions).toBe(ENUMERATION.reachablePositions);
  });
});

describe('the board’s three-tier value structure', () => {
  it('matches the terminal-square table exactly', () => {
    for (const sq of SQUARES) {
      expect(result.terminalSquare[sq]).toBe(TERMINAL_SQUARE_COUNTS[sq]);
    }
  });

  it('resolves into exactly three tiers', () => {
    expect(result.terminalSquare[5]).toBe(TIER_COUNTS.centre);
    for (const c of CORNERS) expect(result.terminalSquare[c]).toBe(TIER_COUNTS.corner);
    for (const e of EDGES) expect(result.terminalSquare[e]).toBe(TIER_COUNTS.edge);

    const distinct = new Set(SQUARES.map((s) => result.terminalSquare[s]));
    expect(distinct.size).toBe(3);
  });

  it('ranks centre > corner > edge', () => {
    expect(TIER_COUNTS.centre).toBeGreaterThan(TIER_COUNTS.corner);
    expect(TIER_COUNTS.corner).toBeGreaterThan(TIER_COUNTS.edge);
  });

  it('sums the terminal squares to the 209,088 decisive games', () => {
    const total = SQUARES.reduce((a, s) => a + result.terminalSquare[s], 0);
    expect(total).toBe(ENUMERATION.decisive);
    expect(total).toBe(ENUMERATION.total - ENUMERATION.draws);
    expect(TIER_COUNTS.centre + 4 * TIER_COUNTS.corner + 4 * TIER_COUNTS.edge).toBe(209_088);
  });

  it('splits terminal squares consistently between X and O wins', () => {
    for (const sq of SQUARES) {
      expect(result.terminalSquareByWinner.X[sq] + result.terminalSquareByWinner.O[sq]).toBe(
        result.terminalSquare[sq],
      );
    }
  });
});

describe('the possibility space against the raw orderings', () => {
  it('has 9! = 362,880 raw orderings', () => {
    let f = 1;
    for (let i = 2; i <= 9; i++) f *= i;
    expect(f).toBe(ENUMERATION.rawOrderings);
  });

  it('legal games are far fewer than raw orderings', () => {
    expect(result.total).toBeLessThan(ENUMERATION.rawOrderings);
  });
});
