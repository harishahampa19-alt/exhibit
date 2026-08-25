/**
 * OSP — the Observer Selection Principle.
 *
 * TIER: FRAMEWORK AXIOM. This is a stipulated rule, not a strategy.
 *
 * The Observer picks the empty square whose number matches the current cycle
 * stage (*resonant collapse*). If that square is taken it picks the nearest
 * empty square by absolute numeric distance, breaking ties toward the larger
 * square (toward 9, toward terminal collapse).
 *
 * CRITICAL PROPERTY — DO NOT "FIX" THIS:
 * OSP never targets square 5. Its stage targets are 1, 3, 6, 9. Square 5 is
 * reachable only as a fallback. This is the source of most of the framework's
 * observed behaviour; replacing OSP with minimax would destroy the experiment.
 * Minimax exists in this app only as a simulated *opponent*.
 */

import { CENTRE, type Square, type Board, empties as emptiesOf } from './board';
import { stage, type Stage } from './cycle';

export type OspRule = 'standard' | 'variant';

export const OSP_RULE_LABEL: Record<OspRule, string> = {
  standard: 'Standard OSP',
  variant: 'Variant OSP (stage 6 → centre-adjacency)',
};

export const OSP_RULE_BLURB: Record<OspRule, string> = {
  standard:
    'Numeric distance at every stage. Structurally cedes square 5, because 5 is never a stage target.',
  variant:
    'At stage 6 only, rank by centre-adjacency instead of numeric distance, so the Observer contests square 5. The framework’s key open experiment.',
};

/** Stage 6 fallback ordering for the variant rule: centre, then centre-adjacent, then corners. */
function centreAdjacencyRank(sq: Square): number {
  if (sq === CENTRE) return 0;
  if (sq === 2 || sq === 4 || sq === 6 || sq === 8) return 1;
  return 2;
}

/**
 * The rule itself. `moveNumber` is the *effective* move number — under
 * interference Model A this counts from the reset point, not from the true
 * move number (see `effectiveMoveNumber`).
 */
export function osp(empties: readonly Square[], moveNumber: number, rule: OspRule = 'standard'): Square {
  const s = stage(moveNumber);

  if (rule === 'variant' && s === 6) {
    return [...empties].sort(
      (a, b) => centreAdjacencyRank(a) - centreAdjacencyRank(b) || b - a,
    )[0];
  }

  return [...empties].sort((a, b) => Math.abs(a - s) - Math.abs(b - s) || b - a)[0];
}

/** Convenience wrapper that reads the empties straight off a board. */
export function ospForBoard(board: Board, moveNumber: number, rule: OspRule = 'standard'): Square {
  return osp(emptiesOf(board), moveNumber, rule);
}

export interface OspCandidate {
  square: Square;
  distance: number;
  rank: number;
  chosen: boolean;
}

export interface OspExplanation {
  square: Square;
  stage: Stage;
  /** Effective move number used by the rule. */
  moveNumber: number;
  rule: OspRule;
  /** The stage's own square, when the stage names a real square (1, 3, 6, 9). */
  target: Square | null;
  /** True when the stage square was free and taken directly — a resonant collapse. */
  resonant: boolean;
  /** True when two or more squares tied and the tie was broken toward 9. */
  tieBroken: boolean;
  candidates: OspCandidate[];
  /** Human-readable trace, e.g. "stage 6; square 6 taken; distances 4→2, 8→2; tie broken toward 9 → 8". */
  text: string;
}

/**
 * Runs OSP and reports *why*. The live-mode prediction panel renders this;
 * the reasoning is the point of the instrument, not a debug aid.
 */
export function ospExplain(
  empties: readonly Square[],
  moveNumber: number,
  rule: OspRule = 'standard',
): OspExplanation | null {
  if (empties.length === 0) return null;

  const s = stage(moveNumber);
  const square = osp(empties, moveNumber, rule);
  const target: Square | null = s === 0 ? null : (s as Square);
  const resonant = target !== null && empties.includes(target) && square === target;

  const useVariant = rule === 'variant' && s === 6;

  const candidates: OspCandidate[] = [...empties]
    .map((sq) => ({
      square: sq,
      distance: Math.abs(sq - s),
      rank: useVariant ? centreAdjacencyRank(sq) : Math.abs(sq - s),
      chosen: sq === square,
    }))
    .sort((a, b) => a.rank - b.rank || b.square - a.square);

  const bestRank = candidates[0].rank;
  const tied = candidates.filter((c) => c.rank === bestRank);
  const tieBroken = tied.length > 1;

  const text = buildText({ s, target, square, resonant, tieBroken, tied, useVariant, empties });

  return { square, stage: s, moveNumber, rule, target, resonant, tieBroken, candidates, text };
}

function buildText(args: {
  s: Stage;
  target: Square | null;
  square: Square;
  resonant: boolean;
  tieBroken: boolean;
  tied: OspCandidate[];
  useVariant: boolean;
  empties: readonly Square[];
}): string {
  const { s, target, square, resonant, tieBroken, tied, useVariant, empties } = args;
  const parts: string[] = [`stage ${s}`];

  if (resonant) {
    parts.push(`square ${target} free`);
    parts.push('resonant collapse');
    return `${parts.join('; ')} → ${square}`;
  }

  if (target !== null && !empties.includes(target)) parts.push(`square ${target} taken`);

  if (useVariant) {
    parts.push('centre-adjacency ordering');
    if (tieBroken) parts.push(`tie at rank ${tied[0].rank}; broken toward 9`);
    return `${parts.join('; ')} → ${square}`;
  }

  // Printed in ascending square order so the trace reads like the board.
  const shown = (tieBroken ? tied : tied.slice(0, 1)).slice().sort((a, b) => a.square - b.square);
  parts.push(`distances ${shown.map((c) => `${c.square}→${c.distance}`).join(', ')}`);
  if (tieBroken) parts.push('tie broken toward 9');

  return `${parts.join('; ')} → ${square}`;
}

/* -------------------------------------------------------------------------- */
/* Interference operators (section 1.6)                                       */
/* -------------------------------------------------------------------------- */

/**
 * Model A — Reset. `R(terminal) = 0'`. The board is unchanged; the cycle
 * counter restarts from 0 at the override position, so later `stage()` calls
 * count from the reset point.
 *
 * Model B — Exception. The override is recorded as a marker `I` in the realized
 * sequence. No reset; the cycle continues on the true move number.
 */
export type InterferenceModel = 'A' | 'B';

export const INTERFERENCE_LABEL: Record<InterferenceModel, string> = {
  A: 'Model A — Reset (R)',
  B: 'Model B — Exception (I)',
};

export const INTERFERENCE_BLURB: Record<InterferenceModel, string> = {
  A: 'Board unchanged; the cycle counter restarts from 0 at the override. Later stages count from the reset point.',
  B: 'Logged as marker I in the realized sequence. No reset — the cycle continues on the true move number.',
};

export interface InterferenceEvent {
  /** True move number at which the override fired. */
  move: number;
  model: InterferenceModel;
  /** What OSP predicted. */
  predicted: Square;
  /** What was played instead. */
  played: Square;
}

/**
 * Translates a true move number into the move number the cycle sees.
 * `resetAt` is the true move number of the most recent Model A reset, or null.
 */
export function effectiveMoveNumber(trueMoveNumber: number, resetAt: number | null): number {
  return resetAt === null ? trueMoveNumber : trueMoveNumber - resetAt;
}
