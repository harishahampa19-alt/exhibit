/**
 * Live threat readout.
 *
 * In real play the single most informative signal turned out to be the
 * *declinable win*: OSP is a fixed symbolic rule, so it will walk past a win
 * on the board if the win is not where the cycle stage points. Surfacing that
 * moment is the whole point of the panel — it is where the framework and the
 * game visibly disagree.
 */

import {
  ATTRACTOR_LINE,
  type Board,
  immediateWins,
  type Line,
  LINES,
  type Mark,
  RESONANCE_LINE,
  type Square,
} from './board';

export type LineStatus =
  | 'complete' // already won
  | 'dead' // both marks present; can never complete
  | 'one-away' // exactly one square from completing for someone
  | 'open'; // still live, more than one square needed

export interface LineReading {
  line: Line;
  status: LineStatus;
  owner: Mark | null; // who is one away / who completed it
  completingSquare: Square | null;
  xCount: number;
  oCount: number;
  emptyCount: number;
  isResonance: boolean; // 3-6-9, the Observer's own line
  isAttractor: boolean; // 1-5-9, the terminal attractor
}

export interface ThreatReading {
  lines: LineReading[];
  deadCount: number;
  liveCount: number;

  /** Squares that would immediately win for each side. */
  observerWins: Square[];
  opponentWins: Square[];

  /**
   * The Observer has a win on the board and OSP is not taking it.
   * This is the declinable-win signal.
   */
  decliningWin: boolean;
  declinedSquares: Square[];

  /** The opponent threatens to win next move and the prediction does not block it. */
  unblockedThreat: boolean;
  unblockedSquares: Square[];

  /** Who currently holds the two squares that decide which cycle line realizes. */
  centreHolder: Mark | null; // square 5
  terminalHolder: Mark | null; // square 9
}

function sameLine(a: Line, b: Line): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function readLine(board: Board, line: Line): LineReading {
  let xCount = 0;
  let oCount = 0;
  let emptySquare: Square | null = null;
  let emptyCount = 0;

  for (const sq of line) {
    const cell = board[sq - 1];
    if (cell === 'X') xCount++;
    else if (cell === 'O') oCount++;
    else {
      emptyCount++;
      emptySquare = sq;
    }
  }

  const base = {
    line,
    xCount,
    oCount,
    emptyCount,
    isResonance: sameLine(line, RESONANCE_LINE),
    isAttractor: sameLine(line, ATTRACTOR_LINE),
  };

  if (xCount === 3) return { ...base, status: 'complete', owner: 'X', completingSquare: null };
  if (oCount === 3) return { ...base, status: 'complete', owner: 'O', completingSquare: null };
  if (xCount > 0 && oCount > 0) return { ...base, status: 'dead', owner: null, completingSquare: null };
  if (xCount === 2 && emptyCount === 1)
    return { ...base, status: 'one-away', owner: 'X', completingSquare: emptySquare };
  if (oCount === 2 && emptyCount === 1)
    return { ...base, status: 'one-away', owner: 'O', completingSquare: emptySquare };

  return { ...base, status: 'open', owner: null, completingSquare: null };
}

/**
 * @param prediction the square OSP is currently pointing at, or null if the
 *        game is over / it is not the Observer's turn.
 */
export function readThreats(
  board: Board,
  observerMark: Mark,
  prediction: Square | null,
): ThreatReading {
  const opponentMark: Mark = observerMark === 'X' ? 'O' : 'X';
  const lines = LINES.map((l) => readLine(board, l));

  const observerWins = immediateWins(board, observerMark);
  const opponentWins = immediateWins(board, opponentMark);

  const decliningWin =
    prediction !== null && observerWins.length > 0 && !observerWins.includes(prediction);
  const declinedSquares = decliningWin ? observerWins : [];

  // Only meaningful if the Observer is not simply winning first.
  const unblockedSquares =
    prediction !== null && observerWins.length === 0
      ? opponentWins.filter((s) => s !== prediction)
      : [];
  const unblockedThreat = unblockedSquares.length > 0;

  return {
    lines,
    deadCount: lines.filter((l) => l.status === 'dead').length,
    liveCount: lines.filter((l) => l.status === 'open' || l.status === 'one-away').length,
    observerWins,
    opponentWins,
    decliningWin,
    declinedSquares,
    unblockedThreat,
    unblockedSquares,
    centreHolder: board[4] ?? null,
    terminalHolder: board[8] ?? null,
  };
}
