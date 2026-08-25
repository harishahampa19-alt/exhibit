/**
 * The board. Square numbers are always visible — the framework speaks in
 * square numbers, not coordinates, so the numerals are load-bearing UI.
 */

import {
  ATTRACTOR_LINE,
  type Board as BoardType,
  type Line,
  type Mark,
  RESONANCE_LINE,
  SQUARES,
  type Square,
} from '../engine/board';

export type LineOverlay = 'none' | 'cycle';

export interface BoardProps {
  board: BoardType;
  observerMark?: Mark;
  /** The square OSP is currently pointing at. */
  prediction?: Square | null;
  winningLine?: Line | null;
  /** Move number that filled each square, for replaying the sequence. */
  moveNumbers?: Partial<Record<Square, number>>;
  /** Squares to flag as an opponent threat. */
  threats?: readonly Square[];
  /** Squares the Observer could win on but is walking past. */
  declined?: readonly Square[];
  overlay?: LineOverlay;
  onSquare?: (sq: Square) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { cell: 'h-14 w-14', mark: 'text-2xl', num: 'text-[9px]', ghost: 'text-lg' },
  md: { cell: 'h-20 w-20', mark: 'text-3xl', num: 'text-[10px]', ghost: 'text-2xl' },
  lg: { cell: 'h-24 w-24 sm:h-28 sm:w-28', mark: 'text-4xl', num: 'text-[11px]', ghost: 'text-3xl' },
};

export function BoardGrid({
  board,
  observerMark = 'O',
  prediction = null,
  winningLine = null,
  moveNumbers,
  threats = [],
  declined = [],
  overlay = 'none',
  onSquare,
  interactive = false,
  size = 'lg',
}: BoardProps) {
  const s = SIZES[size];

  return (
    <div className="inline-grid grid-cols-3 gap-1.5">
      {SQUARES.map((sq) => {
        const cell = board[sq - 1];
        const isObserver = cell !== null && cell === observerMark;
        const inWin = winningLine?.includes(sq) ?? false;
        const isPrediction = prediction === sq && cell === null;
        const isThreat = threats.includes(sq);
        const isDeclined = declined.includes(sq);
        const onResonance = overlay === 'cycle' && RESONANCE_LINE.includes(sq);
        const onAttractor = overlay === 'cycle' && ATTRACTOR_LINE.includes(sq);

        const clickable = interactive && cell === null && !!onSquare;

        return (
          <button
            key={sq}
            type="button"
            disabled={!clickable}
            onClick={clickable ? () => onSquare?.(sq) : undefined}
            aria-label={`Square ${sq}${cell ? `, ${cell}` : ', empty'}`}
            className={[
              'relative flex items-center justify-center rounded border transition-all duration-200',
              s.cell,
              cell === null ? 'bg-panel' : 'bg-panel2',
              inWin
                ? 'border-realized glow-realized'
                : isPrediction
                  ? 'border-realized/70 glow-realized'
                  : isDeclined
                    ? 'border-realized/40'
                    : isThreat
                      ? 'border-alarm/60 glow-alarm'
                      : 'border-rule',
              clickable ? 'cursor-pointer hover:border-inkfaint hover:bg-panel2' : 'cursor-default',
            ].join(' ')}
          >
            {/* Square number — always present. */}
            <span className={`absolute left-1 top-1 tnum ${s.num} text-inkfaint`}>{sq}</span>

            {/* Cycle-line markers. */}
            {onResonance && (
              <span
                title="Resonance line 3-6-9"
                className="absolute right-1 top-1 h-1 w-1 rounded-full bg-realized/60"
              />
            )}
            {onAttractor && (
              <span
                title="Attractor line 1-5-9"
                className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-chaos"
              />
            )}

            {/* The mark, or a ghost numeral when empty. */}
            {cell ? (
              <span
                className={`${s.mark} leading-none ${isObserver ? 'text-observer' : 'text-opponent'}`}
              >
                {cell}
              </span>
            ) : isPrediction ? (
              <span className={`${s.ghost} animate-breathe leading-none text-realized`}>{sq}</span>
            ) : (
              <span className={`${s.ghost} leading-none text-white/[0.045]`}>{sq}</span>
            )}

            {/* Which move filled this square. */}
            {cell && moveNumbers?.[sq] !== undefined && (
              <span className="absolute bottom-1 left-1 tnum text-[9px] text-inkfaint">
                #{moveNumbers[sq]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Small read-only board for archive rows and chart tooltips. */
export function MiniBoard({
  board,
  observerMark = 'O',
  winningLine = null,
}: {
  board: BoardType;
  observerMark?: Mark;
  winningLine?: Line | null;
}) {
  return (
    <div className="inline-grid grid-cols-3 gap-px rounded bg-rule p-px">
      {SQUARES.map((sq) => {
        const cell = board[sq - 1];
        const inWin = winningLine?.includes(sq) ?? false;
        return (
          <div
            key={sq}
            className={`flex h-4 w-4 items-center justify-center text-[8px] leading-none ${
              inWin ? 'bg-realized/20' : 'bg-panel'
            } ${
              cell === null
                ? 'text-inkfaint/40'
                : cell === observerMark
                  ? 'text-observer'
                  : 'text-opponent'
            }`}
          >
            {cell ?? sq}
          </div>
        );
      })}
    </div>
  );
}
