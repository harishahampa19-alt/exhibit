/**
 * Live mode's state machine.
 *
 * The user is the Observer. The opponent sits across a physical board; after
 * each of their moves the user enters the square here and the instrument
 * returns a prediction. The user may follow it, or override it once per game.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  type Board,
  emptyBoard,
  empties as emptiesOf,
  immediateWins,
  isFull,
  type Mark,
  markToMove,
  occupied,
  place,
  type Square,
  winnerOf,
} from '../engine/board';
import { stage } from '../engine/cycle';
import {
  effectiveMoveNumber,
  type InterferenceEvent,
  type InterferenceModel,
  ospExplain,
  type OspRule,
} from '../engine/osp';
import { finalizeRecord, type GameRecord, type MoveRecord } from '../engine/runner';
import { readThreats } from '../engine/threats';

export interface LiveConfig {
  /** The Observer's symbol. X moves first by convention, so this also fixes the seat. */
  observerMark: Mark;
  interferenceModel: InterferenceModel;
  rule: OspRule;
  /** Display-only overlay; never alters play. */
  windowEnabled: boolean;
  terminalWindow: number[];
}

export const DEFAULT_CONFIG: LiveConfig = {
  observerMark: 'O',
  interferenceModel: 'A',
  rule: 'standard',
  windowEnabled: true,
  terminalWindow: [6, 7, 8, 9],
};

interface Snapshot {
  board: Board;
  moves: MoveRecord[];
  resetAt: number | null;
  interference: InterferenceEvent[];
}

const INITIAL: Snapshot = {
  board: emptyBoard(),
  moves: [],
  resetAt: null,
  interference: [],
};

export function useLiveGame(config: LiveConfig, onComplete?: (game: GameRecord) => void) {
  const [snap, setSnap] = useState<Snapshot>(INITIAL);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [finished, setFinished] = useState<GameRecord | null>(null);

  const { board, moves, resetAt, interference } = snap;

  const trueMoveNumber = moves.length + 1;
  const effectiveN = effectiveMoveNumber(trueMoveNumber, resetAt);
  const currentStage = stage(effectiveN);
  const toMove = markToMove(board);
  const isObserverTurn = toMove === config.observerMark;
  const over = finished !== null;

  const explanation = useMemo(() => {
    if (over || !isObserverTurn) return null;
    return ospExplain(emptiesOf(board), effectiveN, config.rule);
  }, [board, effectiveN, config.rule, isObserverTurn, over]);

  const prediction = explanation?.square ?? null;

  const threats = useMemo(
    () => readThreats(board, config.observerMark, prediction),
    [board, config.observerMark, prediction],
  );

  const realized = useMemo(() => moves.map((m) => m.square), [moves]);

  /** Core commit: play `square` for whoever is to move. */
  const commit = useCallback(
    (square: Square, override: { model: InterferenceModel } | null) => {
      if (over) return;
      if (board[square - 1] !== null) return;

      setHistory((h) => [...h, snap]);

      const mark = markToMove(board);
      const observerTurn = mark === config.observerMark;
      const winsAvailable = observerTurn ? immediateWins(board, config.observerMark) : [];
      const predicted = observerTurn
        ? ospExplain(emptiesOf(board), effectiveN, config.rule)?.square ?? null
        : null;

      const move: MoveRecord = {
        n: trueMoveNumber,
        square,
        mark,
        stage: currentStage,
        prediction: predicted,
        followedPrediction: observerTurn && predicted === square,
        hadWin: winsAvailable.length > 0,
        declinedWin: winsAvailable.length > 0 && !winsAvailable.includes(square),
      };

      const nextBoard = place(board, square, mark);
      const nextMoves = [...moves, move];

      const nextInterference =
        override && predicted !== null
          ? [
              ...interference,
              { move: trueMoveNumber, model: override.model, predicted, played: square },
            ]
          : interference;

      // Model A restarts the cycle counter at the override position.
      const nextResetAt = override?.model === 'A' ? trueMoveNumber : resetAt;

      const next: Snapshot = {
        board: nextBoard,
        moves: nextMoves,
        resetAt: nextResetAt,
        interference: nextInterference,
      };
      setSnap(next);

      if (winnerOf(nextBoard) || isFull(nextBoard)) {
        const record = finalizeRecord({
          moves: nextMoves,
          observerMark: config.observerMark,
          opponent: 'human',
          rule: config.rule,
          source: 'live',
          interference: nextInterference,
        });
        setFinished(record);
        onComplete?.(record);
      }
    },
    [board, moves, snap, over, config, effectiveN, trueMoveNumber, currentStage, interference, resetAt, onComplete],
  );

  const follow = useCallback(() => {
    if (prediction !== null) commit(prediction, null);
  }, [prediction, commit]);

  const override = useCallback(
    (square: Square) => commit(square, { model: config.interferenceModel }),
    [commit, config.interferenceModel],
  );

  /** The opponent's move, entered by the user. */
  const opponentMove = useCallback((square: Square) => commit(square, null), [commit]);

  const undo = useCallback(() => {
    // Kept flat: a state updater must stay pure, so it cannot drive the other
    // two setters from inside itself (StrictMode runs updaters twice).
    if (history.length === 0) return;
    setSnap(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setFinished(null);
  }, [history]);

  const reset = useCallback(() => {
    setSnap(INITIAL);
    setHistory([]);
    setFinished(null);
  }, []);

  const interferenceUsed = interference.length > 0;

  /** Flags a game that ended outside the declared terminal window. */
  const windowBreach =
    finished !== null &&
    config.windowEnabled &&
    !config.terminalWindow.includes(finished.endMove);

  return {
    // state
    board,
    moves,
    realized,
    occupiedSquares: occupied(board),
    resetAt,
    interference,
    interferenceUsed,
    finished,
    over,
    windowBreach,

    // derived
    trueMoveNumber,
    effectiveN,
    currentStage,
    toMove,
    isObserverTurn,
    explanation,
    prediction,
    threats,
    canUndo: history.length > 0,

    // actions
    follow,
    override,
    opponentMove,
    play: commit,
    undo,
    reset,
  };
}
