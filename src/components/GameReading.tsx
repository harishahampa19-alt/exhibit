/**
 * End-of-game report. Deliberately styled as an instrument reading, not a
 * result screen — no celebration, no confetti.
 */

import { boardFromSequence } from '../engine/board';
import type { GameRecord } from '../engine/runner';
import { Stat } from './Panel';
import { MiniBoard } from './Board';

export function GameReading({
  game,
  windowBreach = false,
  terminalWindow,
}: {
  game: GameRecord;
  windowBreach?: boolean;
  terminalWindow?: readonly number[];
}) {
  const board = boardFromSequence(game.sequence);
  const outcomeLabel =
    game.outcome === 'draw'
      ? 'Draw'
      : game.outcome === 'observer'
        ? 'Observer realized'
        : 'Opponent realized';

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <MiniBoard board={board} observerMark={game.observerMark} winningLine={game.winningLine} />
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="End move" value={game.endMove} />
          <Stat label="Terminal square" value={game.terminalSquare} />
          <Stat
            label="Outcome"
            value={outcomeLabel}
            tone={game.outcome === 'observer' ? 'realized' : game.outcome === 'draw' ? 'chaos' : 'ink'}
          />
          <Stat
            label="Digital root"
            value={game.digitalRoot}
            hint={`Σ = ${game.squareSum}`}
            tone={game.digitalRoot === 9 ? 'realized' : 'chaos'}
          />
        </div>
      </div>

      {windowBreach && terminalWindow && (
        <div className="rounded border border-dashed border-tierAxiom/50 bg-tierAxiom/5 p-2.5">
          <div className="text-[11px] uppercase tracking-wider text-tierAxiom">
            Outside the declared terminal window
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-inkdim">
            This game ended at move {game.endMove}; the declared window is{' '}
            {'{' + terminalWindow.join(', ') + '}'}. The window is a display overlay, not a rule —
            nothing about play was constrained. On a real board the earliest possible win is move 5.
          </p>
        </div>
      )}

      <div>
        <div className="label mb-1">Realized sequence</div>
        <div className="flex flex-wrap items-center gap-1">
          {game.moves.map((m) => {
            const isObserver = m.mark === game.observerMark;
            const overridden = game.interference.some((i) => i.move === m.n);
            return (
              <span key={m.n} className="flex items-center gap-1">
                <span
                  title={`move ${m.n} · stage ${m.stage} · ${m.mark}${
                    m.declinedWin ? ' · declined a win' : ''
                  }`}
                  className={`tnum relative rounded border px-1.5 py-0.5 text-[11px] ${
                    isObserver
                      ? 'border-realized/40 bg-realized/10 text-realized'
                      : 'border-rule2 text-opponent'
                  } ${m.declinedWin ? 'ring-1 ring-alarm/50' : ''}`}
                >
                  {m.square}
                  {overridden && <span className="ml-0.5 text-[9px] text-alarm">*</span>}
                </span>
                {m.n < game.moves.length && <span className="text-[9px] text-inkfaint">→</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <div className="label mb-1">Stage partition</div>
          <div className="space-y-0.5">
            {([1, 3, 6, 9] as const).map((s) => (
              <div key={s} className="flex items-center gap-2 text-[11px]">
                <span className="tnum w-4 text-realized">{s}</span>
                <span className="tnum text-inkdim">
                  {game.stagePartition[s].length ? game.stagePartition[s].join(', ') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {game.declinedWins.length > 0 && (
            <div>
              <div className="label mb-1">Declined wins</div>
              <p className="text-[11px] leading-snug text-inkdim">
                The Observer walked past a winnable square at move
                {game.declinedWins.length > 1 ? 's ' : ' '}
                <span className="tnum text-alarm">{game.declinedWins.join(', ')}</span>. OSP is a
                rule, not a strategy.
              </p>
            </div>
          )}

          {game.interference.length > 0 && (
            <div>
              <div className="label mb-1">Interference</div>
              {game.interference.map((i) => (
                <p key={i.move} className="text-[11px] leading-snug text-inkdim">
                  Model {i.model} at move <span className="tnum">{i.move}</span>: predicted{' '}
                  <span className="tnum text-realized">{i.predicted}</span>, played{' '}
                  <span className="tnum text-alarm">{i.played}</span>
                  {i.model === 'A' && ' — cycle counter reset to 0'}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
