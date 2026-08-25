/**
 * The game runner and the shared game-record shape.
 *
 * One record format serves both Live mode (a game played against a human in
 * the physical world) and Lab mode (a simulated game), so the archive can put
 * lived data and simulated data on the same axes. That comparison is the point
 * of the whole app.
 */

import {
  type Board,
  boardFromSequence,
  digitalRoot,
  empties,
  emptyBoard,
  immediateWins,
  isFull,
  type Line,
  type Mark,
  place,
  type Square,
  sum,
  winnerOf,
} from './board';
import { stage, type Stage } from './cycle';
import { perfectMove, randomMove } from './minimax';
import {
  effectiveMoveNumber,
  type InterferenceEvent,
  osp,
  type OspRule,
} from './osp';
import { pick, type Rng } from './rng';

export type OpponentKind = 'random' | 'perfect' | 'mixed';

export const OPPONENT_LABEL: Record<OpponentKind, string> = {
  random: 'Random',
  perfect: 'Perfect (minimax)',
  mixed: 'Mixed (50% perfect)',
};

export type Outcome = 'observer' | 'opponent' | 'draw';

export interface MoveRecord {
  /** True move number, 1-9. */
  n: number;
  square: Square;
  mark: Mark;
  /** Cycle stage at this move (effective — Model A resets shift this). */
  stage: Stage;
  /** What OSP predicted for this move, when it was the Observer's turn. */
  prediction: Square | null;
  followedPrediction: boolean;
  /** The Observer had a winning square available at this move. */
  hadWin: boolean;
  /** ...and did not play it. The declinable-win event. */
  declinedWin: boolean;
}

export interface GameRecord {
  id: string;
  timestamp: number;
  source: 'live' | 'sim';

  /** Squares in play order. Index 0 is move 1. */
  sequence: Square[];
  moves: MoveRecord[];

  observerMark: Mark;
  opponent: OpponentKind | 'human';
  rule: OspRule;

  endMove: number;
  terminalSquare: Square;
  winner: Mark | null;
  winningLine: Line | null;
  outcome: Outcome;

  /** Sum of realized squares and its digital root (Theorem 1). */
  squareSum: number;
  digitalRoot: number;
  /** Move numbers grouped by the stage they fell in. */
  stagePartition: Record<Exclude<Stage, 0>, number[]>;

  interference: InterferenceEvent[];
  /** Move numbers at which the Observer walked past a win. */
  declinedWins: number[];

  notes?: string;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

function partitionByStage(moves: readonly MoveRecord[]): Record<Exclude<Stage, 0>, number[]> {
  const out: Record<Exclude<Stage, 0>, number[]> = { 1: [], 3: [], 6: [], 9: [] };
  for (const m of moves) {
    if (m.stage === 0) continue;
    out[m.stage].push(m.n);
  }
  return out;
}

/**
 * Builds the derived half of a game record from the move list. Shared by the
 * simulator and by Live mode so both compute terminal data identically.
 */
export function finalizeRecord(args: {
  moves: MoveRecord[];
  observerMark: Mark;
  opponent: OpponentKind | 'human';
  rule: OspRule;
  source: 'live' | 'sim';
  interference?: InterferenceEvent[];
  notes?: string;
}): GameRecord {
  const { moves, observerMark, opponent, rule, source } = args;
  const sequence = moves.map((m) => m.square);
  const board = boardFromSequence(sequence);
  const win = winnerOf(board);

  const outcome: Outcome = !win ? 'draw' : win.mark === observerMark ? 'observer' : 'opponent';
  const squareSum = sum(sequence);

  return {
    id: nextId(),
    timestamp: Date.now(),
    source,
    sequence,
    moves,
    observerMark,
    opponent,
    rule,
    endMove: moves.length,
    terminalSquare: sequence[sequence.length - 1],
    winner: win ? win.mark : null,
    winningLine: win ? win.line : null,
    outcome,
    squareSum,
    digitalRoot: digitalRoot(squareSum),
    stagePartition: partitionByStage(moves),
    interference: args.interference ?? [],
    declinedWins: moves.filter((m) => m.declinedWin).map((m) => m.n),
    notes: args.notes,
  };
}

function opponentMove(board: Board, kind: OpponentKind, rng: Rng): Square {
  switch (kind) {
    case 'random':
      return randomMove(board, rng);
    case 'perfect':
      return perfectMove(board, rng);
    case 'mixed':
      return rng() < 0.5 ? perfectMove(board, rng) : randomMove(board, rng);
  }
}

/**
 * Plays one complete game: the Observer follows OSP without deviation, the
 * opponent follows `kind`. No interference — overrides are a Live-mode act.
 */
export function runGame(opts: {
  observerMark: Mark;
  opponent: OpponentKind;
  rule?: OspRule;
  rng: Rng;
}): GameRecord {
  const { observerMark, opponent, rng } = opts;
  const rule = opts.rule ?? 'standard';

  let board: Board = emptyBoard();
  const moves: MoveRecord[] = [];

  for (let n = 1; n <= 9; n++) {
    const mark: Mark = n % 2 === 1 ? 'X' : 'O';
    const isObserver = mark === observerMark;
    const free = empties(board);

    let square: Square;
    let prediction: Square | null = null;
    let hadWin = false;

    if (isObserver) {
      prediction = osp(free, n, rule);
      square = prediction;
      hadWin = immediateWins(board, observerMark).length > 0;
    } else {
      square = opponentMove(board, opponent, rng);
    }

    moves.push({
      n,
      square,
      mark,
      stage: stage(n),
      prediction,
      followedPrediction: prediction !== null,
      hadWin,
      declinedWin: hadWin && prediction !== null && !immediateWins(board, observerMark).includes(prediction),
    });

    board = place(board, square, mark);
    if (winnerOf(board) || isFull(board)) break;
  }

  return finalizeRecord({ moves, observerMark, opponent, rule, source: 'sim' });
}

/**
 * A control condition: both sides play perfectly with a random tie-break.
 * Section 2.2 reports all 50 such games drawing at move 9.
 */
export function runEqualGame(rng: Rng): GameRecord {
  let board: Board = emptyBoard();
  const moves: MoveRecord[] = [];

  for (let n = 1; n <= 9; n++) {
    const mark: Mark = n % 2 === 1 ? 'X' : 'O';
    const square = perfectMove(board, rng);
    moves.push({
      n,
      square,
      mark,
      stage: stage(n),
      prediction: null,
      followedPrediction: false,
      hadWin: false,
      declinedWin: false,
    });
    board = place(board, square, mark);
    if (winnerOf(board) || isFull(board)) break;
  }

  return finalizeRecord({
    moves,
    observerMark: 'O',
    opponent: 'perfect',
    rule: 'standard',
    source: 'sim',
  });
}

/** Effective move number helper re-exported for Live mode's convenience. */
export { effectiveMoveNumber, pick };
