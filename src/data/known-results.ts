/**
 * Established results, baked in as fixtures.
 *
 * Everything tagged `math` is asserted against a live computation in
 * tests/ — if the engine ever drifts, the suite fails rather than the app
 * quietly reporting a stale number.
 *
 * Everything tagged `sim` came from a finite sampled run and is reproducible
 * only up to sampling noise; the app shows it as a reference band, never as an
 * exact target.
 */

import type { Square } from '../engine/board';
import type { Tier } from './honesty';

/* -------------------------------------------------------------------------- */
/* 1. The Canonical Observer Equations                                        */
/* -------------------------------------------------------------------------- */

/** T(n) = prod(k=1..n) 3k = 3^n * n!. Asserted in tests/cycle.test.ts. */
export const T_TABLE: Readonly<Record<number, number>> = {
  1: 3,
  2: 18,
  3: 162,
  4: 1_944,
  5: 29_160,
  6: 524_880,
  7: 11_022_480,
  8: 264_539_520,
  9: 7_142_567_040,
};

export const EQUATIONS = [
  {
    id: 'T',
    tier: 'math' as Tier,
    name: 'Equation 1 — Possibility space',
    formula: 'T(n) = ∏(k=1..n) 3k = 3ⁿ · n!',
    note: 'The branching law 3, 6, 9, … expanded. T(9) = 7,142,567,040.',
  },
  {
    id: 'E',
    tier: 'axiom' as Tier,
    name: 'Equation 2 — Observer’s realization',
    formula: 'E_O(n) = 1',
    note: 'Exactly one branch realizes. Stipulated, not derived.',
  },
  {
    id: 'psi',
    tier: 'axiom' as Tier,
    name: 'Equation 3 — Chaos remainder',
    formula: 'Ψ(n) = T(n) − 1',
    note: 'Everything the observer did not collapse into. Follows from Equation 2 being an axiom.',
  },
  {
    id: 'R',
    tier: 'math' as Tier,
    name: 'Corollary — Observer ratio',
    formula: 'R(n) = 1 / (3ⁿ · n!)',
    note: 'The realized share of possibility space.',
  },
] as const;

/**
 * Display-only historical sigil. This was an earlier decorative notation and
 * is NOT a well-formed equation. It is kept for provenance and labelled as such
 * wherever it appears.
 */
export const HISTORICAL_SIGIL = 'ℱ_O(1, 0^∞) · ∏(3k)';

/* -------------------------------------------------------------------------- */
/* 2. Full enumeration of all legal games (255,168)                           */
/* -------------------------------------------------------------------------- */

export interface EndMoveRow {
  endMove: number;
  outcome: 'X' | 'O' | 'draw';
  games: number;
}

export const ENUMERATION_ROWS: readonly EndMoveRow[] = [
  { endMove: 5, outcome: 'X', games: 1_440 },
  { endMove: 6, outcome: 'O', games: 5_328 },
  { endMove: 7, outcome: 'X', games: 47_952 },
  { endMove: 8, outcome: 'O', games: 72_576 },
  { endMove: 9, outcome: 'X', games: 81_792 },
  { endMove: 9, outcome: 'draw', games: 46_080 },
];

export const ENUMERATION = {
  total: 255_168,
  xWins: 131_184, // 1,440 + 47,952 + 81,792
  oWins: 77_904, // 5,328 + 72,576
  draws: 46_080,
  decisive: 209_088, // total − draws
  reachablePositions: 5_478,
  rawOrderings: 362_880, // 9!
  /** T(9) / 9! = 3^9. */
  branchingQuotient: 19_683,
  /** Draws are 18.1% of all games and occur only at move 9. */
  drawShare: 46_080 / 255_168,
  /** The earliest possible win is move 5 — 0.6% of all games. */
  earliestWinMove: 5,
  earliestWinShare: 1_440 / 255_168,
} as const;

/**
 * Terminal (winning) square across the 209,088 decisive games — exactly three
 * tiers. These sum to 209,088, which is a useful self-check.
 */
export const TERMINAL_SQUARE_COUNTS: Readonly<Record<Square, number>> = {
  1: 27_348,
  2: 14_808,
  3: 27_348,
  4: 14_808,
  5: 40_464,
  6: 14_808,
  7: 27_348,
  8: 14_808,
  9: 27_348,
};

export const TIER_COUNTS = {
  centre: 40_464,
  corner: 27_348,
  edge: 14_808,
} as const;

/* -------------------------------------------------------------------------- */
/* 3. Equal-player control (perfect play, random tie-break, 50 games)         */
/* -------------------------------------------------------------------------- */

export const EQUAL_PLAY = {
  games: 50,
  drawsAtMove9: 50,
  /** Move 2 went to the centre in 26 of 50 games; no other square above 20%. */
  move2CentreCount: 26,
  move2CentreShare: 26 / 50,
  signature: 'Corners early, centre contested immediately, edges absorb the endgame.',
} as const;

/* -------------------------------------------------------------------------- */
/* 4. OSP Observer playing O (second), 2,000 games per opponent type          */
/* -------------------------------------------------------------------------- */

export interface TerminalSignature {
  endMove: number;
  terminalSquare: Square;
  winner: 'observer' | 'opponent';
  share: number;
}

export const OSP_VS_RANDOM = {
  games: 2_000,
  observerWinShare: 0.393,
  opponentWinShare: 0.594,
  drawShare: 0.014,
  top: [
    { endMove: 8, terminalSquare: 9, winner: 'observer', share: 0.153 },
    { endMove: 6, terminalSquare: 5, winner: 'observer', share: 0.15 },
    { endMove: 9, terminalSquare: 1, winner: 'opponent', share: 0.133 },
    { endMove: 8, terminalSquare: 5, winner: 'observer', share: 0.086 },
    { endMove: 7, terminalSquare: 1, winner: 'opponent', share: 0.073 },
    { endMove: 7, terminalSquare: 9, winner: 'opponent', share: 0.068 },
  ] as readonly TerminalSignature[],
} as const;

export const OSP_VS_PERFECT = {
  games: 2_000,
  observerWinShare: 0,
  opponentWinShare: 0.99,
  drawShare: 0.01,
  /** Games end only at moves 5, 7 and 9. */
  endMoves: [5, 7, 9] as readonly number[],
  top: [
    { endMove: 7, terminalSquare: 5, winner: 'opponent', share: 0.175 },
    { endMove: 9, terminalSquare: 1, winner: 'opponent', share: 0.131 },
    { endMove: 7, terminalSquare: 1, winner: 'opponent', share: 0.126 },
    { endMove: 5, terminalSquare: 7, winner: 'opponent', share: 0.102 },
  ] as readonly TerminalSignature[],
} as const;

/** Laws derived from the runs above, for display in the app. */
export const DERIVED_LAWS = [
  {
    tier: 'math' as Tier,
    text: 'The Observer’s only winning shapes are (move 6, square 5), (move 8, square 9) and (move 8, square 5). It wins on the centre or on the terminal number, nowhere else.',
  },
  {
    tier: 'math' as Tier,
    text: 'Move 7 is the graveyard: the most common ending move overall, and it always belongs to the opponent. OSP never wins at move 7.',
  },
  {
    tier: 'math' as Tier,
    text: 'Hold square 5 and games end at 6 or 8; lose square 5 and they funnel to (7 or 9, terminal square 1).',
  },
  {
    tier: 'math' as Tier,
    text: 'Mechanism: OSP structurally cedes the centre, because 5 is never a stage target — and the centre is tier 1 of the board’s three-tier value structure. That is the whole explanation for the “terminal square 1 attractor”. No numerology is required.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/* 5. Theorems                                                                */
/* -------------------------------------------------------------------------- */

export const THEOREM_1 = {
  tier: 'math' as Tier,
  name: 'Theorem 1 — Conservation of full collapse',
  claim: 'Any nine-move game sums to 1+…+9 = 45, digital root 9. Interrupted games land in residue.',
  caveat:
    'The arithmetic is true and trivial: every full game uses every square exactly once. The *interpretation* of the digital root as “completion” is framework-internal.',
  sum: 45,
  digitalRoot: 9,
} as const;

export const THEOREM_2 = {
  tier: 'axiom' as Tier,
  name: 'Theorem 2 — Closure of the structure set',
  claim:
    'From any state in {3, 6, 9}, adding 3 stays in {3, 6, 9}. Returning to state 1 requires passing through the reset 9 → 0, so the cycle must be traversed in order and cannot shortcut.',
  caveat:
    'Closure under +3 mod 9 on {3,6,9} is ordinary arithmetic; the claim that this *forces* anything is a property of the stipulated transition function, not of the board.',
} as const;

/**
 * Theorem 3 — The Resonance Paradox.
 *
 * Hand-check: the winner holds five squares, so the winner is X. X's only line
 * is 3-6-9. A history is legal iff X's final move completes that trio, i.e.
 * X's last move is one of {3,6,9}: 3 × 4! = 72 X-orderings, times 4! = 24
 * O-orderings = 1,728.
 */
export const THEOREM_3 = {
  tier: 'math' as Tier,
  name: 'Theorem 3 — The Resonance Paradox',
  winnerSquares: [2, 3, 4, 6, 9] as readonly Square[],
  loserSquares: [1, 5, 7, 8] as readonly Square[],
  winningLine: [3, 6, 9] as readonly Square[],
  totalHistories: 1_728,
  finalMoveCounts: { 3: 576, 6: 576, 9: 576 } as Readonly<Record<number, number>>,
  openingCounts: { 2: 432, 4: 432, 3: 288, 6: 288, 9: 288 } as Readonly<Record<number, number>>,
  ospConsistentAsX: 0,
  ospConsistentAsO: 0,
  claim: 'Zero of the 1,728 histories are OSP-consistent, in either role.',
  mechanism:
    'As X: OSP’s move-1 prediction is always square 1, and square 1 belongs to the loser on this board. As O: square 3 is the stage-3 target at move 2, but O never holds 3 — and when X opens on 3, OSP resolves to square 4, which O does not hold either.',
  interpretation: 'The Observer cannot produce its own perfect terminal.',
} as const;

/* -------------------------------------------------------------------------- */
/* 6. Board geometry                                                          */
/* -------------------------------------------------------------------------- */

export const CYCLE_LINES = {
  tier: 'axiom' as Tier,
  resonance: [3, 6, 9] as readonly Square[],
  attractor: [1, 5, 9] as readonly Square[],
  sharedSquare: 9 as Square,
  note: 'Exactly two lines on the board are built entirely from cycle-significant squares, and they share square 9. Every recorded game has been a contest over which one realizes, decided by who anchors squares 5 and 9.',
} as const;

/* -------------------------------------------------------------------------- */
/* 7. Terminal windows                                                        */
/* -------------------------------------------------------------------------- */

export const TERMINAL_WINDOW = {
  tier: 'axiom' as Tier,
  default: [6, 7, 8, 9] as readonly number[],
  statement:
    'Termination expected at move 6 or 7, extended to 8, with 9 reserved for draws.',
  correction:
    'On a real board the earliest possible win is move 5 — 1,440 games, 0.6% of the 255,168 total. And move 9 is not reserved for draws: 81,792 games end at move 9 with a first-player win, against 46,080 draws. The window is a display overlay only; it never alters play.',
} as const;
