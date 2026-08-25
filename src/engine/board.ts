/**
 * Board primitives.
 *
 * The framework speaks in square *numbers*, not coordinates, so every public
 * API here is in terms of squares 1-9 in reading order:
 *
 *     1 | 2 | 3
 *     4 | 5 | 6
 *     7 | 8 | 9
 *
 * Internally a board is a flat 9-cell array indexed 0-8; `sq - 1` is the only
 * place that conversion should ever happen.
 */

export type Square = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Mark = 'X' | 'O';
export type Cell = Mark | null;
export type Board = readonly Cell[];
export type Line = readonly [Square, Square, Square];

export const SQUARES: readonly Square[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** The eight winning lines: 123, 456, 789, 147, 258, 369, 159, 357. */
export const LINES: readonly Line[] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],
  [1, 5, 9],
  [3, 5, 7],
];

/**
 * The two "cycle lines" of section 2.5. They are the only lines built entirely
 * from cycle-significant squares, and they share square 9.
 */
export const RESONANCE_LINE: Line = [3, 6, 9]; // the Observer's own line
export const ATTRACTOR_LINE: Line = [1, 5, 9]; // the terminal attractor

/**
 * The board's three-tier value structure, as measured by how often each square
 * is the terminal (winning) square across all 209,088 decisive games. This is
 * an empirical property of tic-tac-toe, not a framework axiom.
 */
export type Tier = 'centre' | 'corner' | 'edge';
export const TIER: Record<Square, Tier> = {
  1: 'corner',
  2: 'edge',
  3: 'corner',
  4: 'edge',
  5: 'centre',
  6: 'edge',
  7: 'corner',
  8: 'edge',
  9: 'corner',
};

export const CENTRE: Square = 5;
export const CORNERS: readonly Square[] = [1, 3, 7, 9];
export const EDGES: readonly Square[] = [2, 4, 6, 8];

export const emptyBoard = (): Board => Object.freeze(Array(9).fill(null) as Cell[]);

export const at = (board: Board, sq: Square): Cell => board[sq - 1];

export const place = (board: Board, sq: Square, mark: Mark): Board => {
  const next = board.slice() as Cell[];
  next[sq - 1] = mark;
  return next;
};

export const empties = (board: Board): Square[] => SQUARES.filter((s) => board[s - 1] === null);

export const occupied = (board: Board): Square[] => SQUARES.filter((s) => board[s - 1] !== null);

/** How many moves have been played. The *next* move is number `plies(board) + 1`. */
export const plies = (board: Board): number => board.reduce<number>((n, c) => n + (c ? 1 : 0), 0);

/** X moves on odd move numbers, O on even. */
export const markToMove = (board: Board): Mark => (plies(board) % 2 === 0 ? 'X' : 'O');

export const isFull = (board: Board): boolean => plies(board) === 9;

export interface WinInfo {
  mark: Mark;
  line: Line;
}

export function winnerOf(board: Board): WinInfo | null {
  for (const line of LINES) {
    const a = board[line[0] - 1];
    if (a !== null && a === board[line[1] - 1] && a === board[line[2] - 1]) {
      return { mark: a, line };
    }
  }
  return null;
}

/** Every line `mark` already owns. A board can legally hold more than one. */
export function linesFor(board: Board, mark: Mark): Line[] {
  return LINES.filter((l) => l.every((s) => board[s - 1] === mark));
}

export const isTerminal = (board: Board): boolean => winnerOf(board) !== null || isFull(board);

/** Squares which would immediately complete a line for `mark`. */
export function immediateWins(board: Board, mark: Mark): Square[] {
  return empties(board).filter((s) => {
    for (const line of LINES) {
      if (!line.includes(s)) continue;
      if (line.every((t) => t === s || board[t - 1] === mark)) return true;
    }
    return false;
  });
}

/**
 * Digital root: repeated digit-sum until a single digit remains.
 * 45 -> 9. Used by Theorem 1 (conservation of full collapse).
 */
export function digitalRoot(n: number): number {
  const abs = Math.abs(Math.trunc(n));
  return abs === 0 ? 0 : 1 + ((abs - 1) % 9);
}

export const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

/** Compact key for memo tables: "XO..X...O". */
export const boardKey = (board: Board): string => board.map((c) => c ?? '.').join('');

export function boardFromKey(key: string): Board {
  return key.split('').map((c) => (c === 'X' || c === 'O' ? (c as Mark) : null));
}

/** Replay a sequence of squares as alternating X, O, X, ... starting with X. */
export function boardFromSequence(sequence: readonly Square[]): Board {
  let b = emptyBoard();
  sequence.forEach((sq, i) => {
    b = place(b, sq, i % 2 === 0 ? 'X' : 'O');
  });
  return b;
}
