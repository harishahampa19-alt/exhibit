/**
 * These tests re-derive the "derived laws" of section 2.3 from scratch rather
 * than trusting the recorded percentages. The percentages themselves are
 * sampling results and are not asserted; the structural claims are.
 */

import { describe, expect, it } from 'vitest';
import { boardFromSequence, winnerOf } from '../src/engine/board';
import { runEqualGame, runGame, type GameRecord } from '../src/engine/runner';
import { mulberry32 } from '../src/engine/rng';

function batch(opponent: 'random' | 'perfect', games: number, seed = 12345): GameRecord[] {
  const rng = mulberry32(seed);
  return Array.from({ length: games }, () => runGame({ observerMark: 'O', opponent, rng }));
}

const vsRandom = batch('random', 2_000);
const vsPerfect = batch('perfect', 2_000, 999);

describe('every generated game is a legal game', () => {
  const all = [...vsRandom, ...vsPerfect];

  it('plays distinct squares only', () => {
    for (const g of all) expect(new Set(g.sequence).size).toBe(g.sequence.length);
  });

  it('ends between move 5 and move 9', () => {
    for (const g of all) {
      expect(g.endMove).toBeGreaterThanOrEqual(5);
      expect(g.endMove).toBeLessThanOrEqual(9);
    }
  });

  it('stops exactly when the game is decided', () => {
    for (const g of all) {
      const final = boardFromSequence(g.sequence);
      const win = winnerOf(final);
      if (win) {
        expect(g.winner).toBe(win.mark);
        // No earlier prefix may already contain a win.
        const prefix = boardFromSequence(g.sequence.slice(0, -1));
        expect(winnerOf(prefix)).toBeNull();
      } else {
        expect(g.endMove).toBe(9);
        expect(g.outcome).toBe('draw');
      }
    }
  });

  it('records the terminal square as the last square played', () => {
    for (const g of all) expect(g.terminalSquare).toBe(g.sequence[g.sequence.length - 1]);
  });

  it('gives every full game digital root 9 (Theorem 1)', () => {
    for (const g of all.filter((x) => x.endMove === 9)) {
      expect(g.squareSum).toBe(45);
      expect(g.digitalRoot).toBe(9);
    }
  });
});

describe('the Observer’s derived laws', () => {
  const wins = vsRandom.filter((g) => g.outcome === 'observer');

  /* -- provable, so asserted strictly -------------------------------------- */

  it('can only win on an even move, because O needs three marks', () => {
    expect(wins.length).toBeGreaterThan(0);
    for (const g of wins) expect([6, 8]).toContain(g.endMove);
  });

  it('never wins at move 7 — the odd moves belong to X', () => {
    const atSeven = vsRandom.filter((g) => g.endMove === 7);
    expect(atSeven.length).toBeGreaterThan(0);
    for (const g of atSeven) expect(g.outcome).toBe('opponent');
  });

  it('cannot beat a perfect opponent even once', () => {
    expect(vsPerfect.some((g) => g.outcome === 'observer')).toBe(false);
  });

  /* -- empirical, so asserted as dominance rather than exclusivity ---------- */

  it('wins overwhelmingly on (6,5), (8,9) and (8,5)', () => {
    // The recorded run found exactly these three shapes. They are not the only
    // ones OSP can reach — at move 8 the rule falls back from square 9 to
    // square 8, so an (8,8) win is structurally possible — so this is a
    // dominance claim, not an exclusivity one. Asserting exclusivity would
    // make the suite fail on a reseed rather than on a bug.
    const recorded = new Set(['6:5', '8:9', '8:5']);
    const inRecorded = wins.filter((g) => recorded.has(`${g.endMove}:${g.terminalSquare}`));
    expect(inRecorded.length / wins.length).toBeGreaterThan(0.95);
  });

  it('wins on the centre or the terminal number in almost every case', () => {
    const onCentreOrNine = wins.filter((g) => g.terminalSquare === 5 || g.terminalSquare === 9);
    expect(onCentreOrNine.length / wins.length).toBeGreaterThan(0.95);
  });

  it('ends games against a perfect opponent only at moves 5, 7 or 9', () => {
    const endMoves = new Set(vsPerfect.map((g) => g.endMove));
    for (const m of endMoves) expect([5, 7, 9]).toContain(m);
  });

  it('loses the overwhelming majority against a perfect opponent', () => {
    const lost = vsPerfect.filter((g) => g.outcome === 'opponent').length;
    expect(lost / vsPerfect.length).toBeGreaterThan(0.9);
  });
});

describe('declining wins', () => {
  it('walks past winnable squares, because OSP is a rule and not a strategy', () => {
    const declined = vsRandom.filter((g) => g.declinedWins.length > 0);
    expect(declined.length).toBeGreaterThan(0);
  });

  it('logs a declined win only on a move the Observer actually made', () => {
    for (const g of vsRandom) {
      for (const n of g.declinedWins) {
        const move = g.moves.find((m) => m.n === n)!;
        expect(move.mark).toBe(g.observerMark);
        expect(move.hadWin).toBe(true);
      }
    }
  });
});

describe('the equal-player control', () => {
  it('draws every game at move 9 under perfect play on both sides', () => {
    const rng = mulberry32(2024);
    for (let i = 0; i < 50; i++) {
      const g = runEqualGame(rng);
      expect(g.outcome).toBe('draw');
      expect(g.endMove).toBe(9);
    }
  });
});

describe('the variant rule changes the outcome distribution', () => {
  it('stops the Observer from ceding the centre', () => {
    const rng = mulberry32(77);
    const variant = Array.from({ length: 500 }, () =>
      runGame({ observerMark: 'O', opponent: 'random', rule: 'variant', rng }),
    );
    const rngB = mulberry32(77);
    const standard = Array.from({ length: 500 }, () =>
      runGame({ observerMark: 'O', opponent: 'random', rule: 'standard', rng: rngB }),
    );

    const heldCentre = (gs: GameRecord[]) =>
      gs.filter((g) => {
        const b = boardFromSequence(g.sequence);
        return b[4] === g.observerMark;
      }).length;

    expect(heldCentre(variant)).toBeGreaterThan(heldCentre(standard));
  });
});
