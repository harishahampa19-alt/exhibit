import { describe, expect, it } from 'vitest';
import {
  CYCLE,
  E_O,
  T,
  TBig,
  branchingFactor,
  nextStage,
  psi,
  ratio,
  stage,
  STAGE_PARTITION,
  type Stage,
} from '../src/engine/cycle';
import { digitalRoot } from '../src/engine/board';
import { ENUMERATION, THEOREM_1, T_TABLE } from '../src/data/known-results';

describe('the core cycle', () => {
  it('is the five-state ring 0 → 1 → 3 → 6 → 9 → 0', () => {
    expect(CYCLE).toEqual([0, 1, 3, 6, 9]);
    expect(nextStage(0)).toBe(1);
    expect(nextStage(1)).toBe(3);
    expect(nextStage(3)).toBe(6);
    expect(nextStage(6)).toBe(9);
    expect(nextStage(9)).toBe(0);
  });

  it('returns to its origin after exactly five applications', () => {
    let s: Stage = 0;
    for (let i = 0; i < 5; i++) s = nextStage(s);
    expect(s).toBe(0);
  });

  it('is closed under +3 on {3, 6, 9} (Theorem 2)', () => {
    for (const s of [3, 6, 9] as const) {
      const plus3 = ((s + 3 - 1) % 9) + 1; // wrap 9 + 3 -> 3
      expect([3, 6, 9]).toContain(plus3);
    }
    // Reaching state 1 requires the 9 -> 0 reset; no member of {3,6,9} maps to 1.
    expect([3, 6, 9].map((s) => nextStage(s as Stage))).not.toContain(1);
  });
});

describe('stage()', () => {
  it('maps move numbers exactly as specified', () => {
    expect(stage(0)).toBe(0);
    expect(stage(-4)).toBe(0);
    expect(stage(1)).toBe(1);
    expect(stage(2)).toBe(3);
    expect(stage(3)).toBe(3);
    expect(stage(4)).toBe(6);
    expect(stage(5)).toBe(6);
    expect(stage(6)).toBe(6);
    expect(stage(7)).toBe(9);
    expect(stage(8)).toBe(9);
    expect(stage(9)).toBe(9);
  });

  it('has the (1, 2, 3, 3) growth signature', () => {
    const sizes = ([1, 3, 6, 9] as const).map((s) => STAGE_PARTITION[s].length);
    expect(sizes).toEqual([1, 2, 3, 3]);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(9);
  });

  it('agrees with STAGE_PARTITION for every move of a full game', () => {
    for (const s of [1, 3, 6, 9] as const) {
      for (const n of STAGE_PARTITION[s]) expect(stage(n)).toBe(s);
    }
  });
});

describe('Equation 1 — T(n) = 3^n · n!', () => {
  it('matches the reference table for n = 1..9', () => {
    for (const [n, expected] of Object.entries(T_TABLE)) {
      expect(T(Number(n))).toBe(expected);
    }
  });

  it('agrees with the product form ∏(k=1..n) 3k', () => {
    for (let n = 0; n <= 12; n++) {
      let product = 1;
      for (let k = 1; k <= n; k++) product *= 3 * k;
      expect(T(n)).toBe(product);
    }
  });

  it('agrees with the exact bigint form', () => {
    for (let n = 0; n <= 9; n++) expect(TBig(n)).toBe(BigInt(T(n)));
  });

  it('keeps T(9) inside float64’s exact-integer range', () => {
    expect(T(9)).toBe(7_142_567_040);
    expect(T(9)).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('gives T(9) / 9! = 3^9 = 19,683', () => {
    const factorial9 = 362_880;
    expect(T(9) / factorial9).toBe(ENUMERATION.branchingQuotient);
    expect(branchingFactor(9)).toBe(19_683);
  });
});

describe('Equations 2 and 3', () => {
  it('E_O(n) = 1 for every n (axiom)', () => {
    for (let n = 0; n <= 9; n++) expect(E_O(n)).toBe(1);
  });

  it('Ψ(n) = T(n) − 1', () => {
    for (let n = 0; n <= 9; n++) expect(psi(n)).toBe(T(n) - 1);
    expect(psi(9)).toBe(7_142_567_039);
  });

  it('R(n) = 1 / T(n)', () => {
    for (let n = 1; n <= 9; n++) expect(ratio(n)).toBeCloseTo(1 / T(n), 20);
  });

  it('E_O + Ψ accounts for the whole possibility space', () => {
    for (let n = 1; n <= 9; n++) expect(E_O(n) + psi(n)).toBe(T(n));
  });
});

describe('Theorem 1 — conservation of full collapse', () => {
  it('sums a nine-move game to 45 with digital root 9', () => {
    const total = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((a, b) => a + b, 0);
    expect(total).toBe(THEOREM_1.sum);
    expect(digitalRoot(total)).toBe(THEOREM_1.digitalRoot);
  });

  it('computes digital roots correctly', () => {
    expect(digitalRoot(0)).toBe(0);
    expect(digitalRoot(9)).toBe(9);
    expect(digitalRoot(18)).toBe(9);
    expect(digitalRoot(45)).toBe(9);
    expect(digitalRoot(10)).toBe(1);
    expect(digitalRoot(38)).toBe(2);
  });

  it('leaves interrupted games in residue (any root is reachable)', () => {
    // A game ending early cannot use all nine squares, so its root varies.
    const roots = new Set<number>();
    for (let end = 5; end <= 9; end++) {
      roots.add(digitalRoot([1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, end).reduce((a, b) => a + b, 0)));
    }
    expect(roots.has(9)).toBe(true);
    expect(roots.size).toBeGreaterThan(1);
  });
});
