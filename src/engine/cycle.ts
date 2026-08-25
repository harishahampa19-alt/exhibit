/**
 * The core cycle and the Canonical Observer Equations.
 *
 * TIER NOTE (see src/data/honesty.ts):
 *   - `T`, `psi`, `ratio`, `digitalRoot` arithmetic are VERIFIED MATHEMATICS.
 *   - The five-state cycle, the `stage` partition and `E_O(n) = 1` are
 *     FRAMEWORK AXIOMS — stipulated definitions, not discoveries.
 */

export type Stage = 0 | 1 | 3 | 6 | 9;

/** The state grammar: 0 -> 1 -> 3 -> 6 -> 9 -> 0. */
export const CYCLE: readonly Stage[] = [0, 1, 3, 6, 9];

export const STAGE_NAMES: Record<Stage, string> = {
  0: 'Chaos / Void',
  1: 'First collapse',
  3: 'First branching',
  6: 'Expansion',
  9: 'Terminal complexity',
};

export const STAGE_MEANINGS: Record<Stage, string> = {
  0: 'No realized possibility; all branches unformed',
  1: 'The single realized decision; the observer’s entry',
  3: 'Reality splits for the first time',
  6: 'Secondary branching layer',
  9: 'Outcome realized; cycle completes and returns to 0',
};

/** Transition function f: f(0)=1, f(1)=3, f(3)=6, f(6)=9, f(9)=0. */
export function nextStage(s: Stage): Stage {
  const i = CYCLE.indexOf(s);
  return CYCLE[(i + 1) % CYCLE.length];
}

/**
 * Maps a move number to its cycle stage.
 *
 * move 1 -> 1; moves 2-3 -> 3; moves 4-6 -> 6; moves 7-9 -> 9.
 * Partition sizes are therefore (1, 2, 3, 3) — the cycle's growth signature.
 */
export function stage(n: number): Stage {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n <= 3) return 3;
  if (n <= 6) return 6;
  return 9;
}

/** The move numbers belonging to each stage of a nine-move game. */
export const STAGE_PARTITION: Record<Exclude<Stage, 0>, readonly number[]> = {
  1: [1],
  3: [2, 3],
  6: [4, 5, 6],
  9: [7, 8, 9],
};

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

/**
 * Equation 1 — possibility space.
 *
 *     T(n) = prod(k=1..n) 3k = 3^n * n!
 *
 * T(9) = 7,142,567,040, comfortably inside float64's exact-integer range.
 */
export function T(n: number): number {
  if (n < 0) return 0;
  return Math.pow(3, n) * factorial(n);
}

/** Exact `T` for anyone who wants to push past n = 18. */
export function TBig(n: number): bigint {
  let out = 1n;
  for (let k = 1n; k <= BigInt(n); k++) out *= 3n * k;
  return out;
}

/** Equation 2 — the Observer's realization. An axiom: exactly one branch realizes. */
export const E_O = (_n: number): 1 => 1;

/** Equation 3 — chaos remainder: everything that did not realize. */
export function psi(n: number): number {
  return T(n) - 1;
}

/** Corollary — the Observer ratio R(n) = 1 / (3^n * n!). */
export function ratio(n: number): number {
  return 1 / T(n);
}

/** T(n) / n! = 3^n — the branching factor stripped of ordering. */
export function branchingFactor(n: number): number {
  return Math.pow(3, n);
}

export function formatBig(n: number): string {
  return n.toLocaleString('en-US');
}

/** Renders R(n) as "1 / 7,142,567,040" rather than an unreadable float. */
export function formatRatio(n: number): string {
  return `1 / ${formatBig(T(n))}`;
}
