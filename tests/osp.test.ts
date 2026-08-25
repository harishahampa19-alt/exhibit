import { describe, expect, it } from 'vitest';
import { SQUARES, type Square } from '../src/engine/board';
import { stage } from '../src/engine/cycle';
import { effectiveMoveNumber, osp, ospExplain } from '../src/engine/osp';

const ALL = [...SQUARES];

describe('OSP — the Observer Selection Principle', () => {
  it('takes the resonant square when it is free', () => {
    expect(osp(ALL, 1)).toBe(1); // stage 1
    expect(osp(ALL, 2)).toBe(3); // stage 3
    expect(osp(ALL, 3)).toBe(3);
    expect(osp(ALL, 4)).toBe(6); // stage 6
    expect(osp(ALL, 6)).toBe(6);
    expect(osp(ALL, 7)).toBe(9); // stage 9
    expect(osp(ALL, 9)).toBe(9);
  });

  it('NEVER targets square 5 — the stage targets are 1, 3, 6, 9', () => {
    for (let n = 1; n <= 9; n++) {
      expect(stage(n)).not.toBe(5);
      expect(osp(ALL, n)).not.toBe(5);
    }
  });

  it('reaches square 5 only as a forced fallback', () => {
    expect(osp([5], 4)).toBe(5);
    // stage 6, with 6 and 7 gone, 5 is the nearest survivor.
    expect(osp([1, 2, 5], 4)).toBe(5);
  });

  it('breaks ties toward the larger square (toward 9)', () => {
    expect(osp([4, 8], 4)).toBe(8); // stage 6: |4−6| = |8−6| = 2
    expect(osp([2, 4], 2)).toBe(4); // stage 3: |2−3| = |4−3| = 1
    expect(osp([5, 7], 5)).toBe(7); // stage 6: |5−6| = |7−6| = 1
    expect(osp([3, 9], 6)).toBe(9); // stage 6: |3−6| = |9−6| = 3
  });

  it('has no ties to break at stages 1 and 9 — every distance is distinct', () => {
    for (const s of [1, 9]) {
      const distances = ALL.filter((q) => q !== s).map((q) => Math.abs(q - s));
      expect(new Set(distances).size).toBe(distances.length);
    }
  });

  it('reproduces the worked example from the spec', () => {
    // stage 6; square 6 taken; distances 4→2, 8→2; tie broken toward 9 → 8
    const empties: Square[] = [1, 2, 4, 8, 9];
    const chosen = osp(empties, 5);
    expect(chosen).toBe(8);

    const explained = ospExplain(empties, 5)!;
    expect(explained.stage).toBe(6);
    expect(explained.square).toBe(8);
    expect(explained.resonant).toBe(false);
    expect(explained.tieBroken).toBe(true);
    expect(explained.text).toContain('stage 6');
    expect(explained.text).toContain('square 6 taken');
    expect(explained.text).toContain('tie broken toward 9');
    expect(explained.text).toContain('→ 8');
  });

  it('always predicts square 1 on the opening move', () => {
    // This is the fact Theorem 3 turns on.
    expect(osp(ALL, 1)).toBe(1);
    const explained = ospExplain(ALL, 1)!;
    expect(explained.resonant).toBe(true);
  });

  it('only ever returns an empty square', () => {
    const subsets: Square[][] = [
      [2, 5, 7],
      [1],
      [4, 9],
      [1, 2, 3, 7, 8],
      [5, 6],
    ];
    for (const empties of subsets) {
      for (let n = 1; n <= 9; n++) expect(empties).toContain(osp(empties, n));
    }
  });

  it('is deterministic — the same inputs always give the same square', () => {
    for (let n = 1; n <= 9; n++) {
      const a = osp([1, 3, 5, 7, 9], n);
      const b = osp([9, 7, 5, 3, 1], n); // input order must not matter
      expect(a).toBe(b);
    }
  });
});

describe('the variant rule (stage 6 → centre-adjacency)', () => {
  it('contests square 5 where the standard rule cedes it', () => {
    expect(osp(ALL, 4, 'standard')).toBe(6);
    expect(osp(ALL, 4, 'variant')).toBe(5);
    expect(osp(ALL, 5, 'variant')).toBe(5);
    expect(osp(ALL, 6, 'variant')).toBe(5);
  });

  it('leaves every other stage untouched', () => {
    for (const n of [1, 2, 3, 7, 8, 9]) {
      expect(osp(ALL, n, 'variant')).toBe(osp(ALL, n, 'standard'));
    }
  });

  it('falls back to centre-adjacent squares, then corners', () => {
    expect(osp([1, 3, 8, 9], 4, 'variant')).toBe(8); // 8 is centre-adjacent
    expect(osp([1, 3, 7, 9], 4, 'variant')).toBe(9); // corners only; tie → larger
  });
});

describe('interference — effective move numbers', () => {
  it('passes the true move number through when nothing has fired', () => {
    for (let n = 1; n <= 9; n++) expect(effectiveMoveNumber(n, null)).toBe(n);
  });

  it('restarts the cycle counter from the reset point under Model A', () => {
    // Reset at move 4: move 5 becomes effective move 1, so stage 1 → square 1.
    expect(effectiveMoveNumber(5, 4)).toBe(1);
    expect(stage(effectiveMoveNumber(5, 4))).toBe(1);
    expect(effectiveMoveNumber(7, 4)).toBe(3);
    expect(stage(effectiveMoveNumber(7, 4))).toBe(3);
  });

  it('makes the reset move itself stage 0', () => {
    expect(stage(effectiveMoveNumber(4, 4))).toBe(0);
  });
});
