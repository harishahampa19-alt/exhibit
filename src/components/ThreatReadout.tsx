import type { Mark } from '../engine/board';
import type { ThreatReading } from '../engine/threats';

const STATUS_STYLE = {
  complete: 'border-realized text-realized',
  'one-away': 'border-alarm/60 text-alarm',
  dead: 'border-rule text-inkfaint line-through decoration-inkfaint/50',
  open: 'border-rule2 text-inkdim',
} as const;

export function ThreatReadout({
  reading,
  observerMark,
}: {
  reading: ThreatReading;
  observerMark: Mark;
}) {
  const opponentMark: Mark = observerMark === 'X' ? 'O' : 'X';

  return (
    <div className="space-y-3">
      {/* The signal that matters most in real play. */}
      {reading.decliningWin && (
        <div className="rounded border border-realized/60 bg-realized/10 p-2.5">
          <div className="text-[11px] uppercase tracking-wider text-realized">
            Declinable win
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink">
            The Observer can win now on{' '}
            <span className="tnum text-realized">{reading.declinedSquares.join(', ')}</span> — and
            OSP is not taking it. Following the prediction forfeits the win.
          </p>
        </div>
      )}

      {reading.unblockedThreat && (
        <div className="rounded border border-alarm/60 bg-alarm/10 p-2.5">
          <div className="text-[11px] uppercase tracking-wider text-alarm">Unblocked threat</div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink">
            The opponent wins next move on{' '}
            <span className="tnum text-alarm">{reading.unblockedSquares.join(', ')}</span>. The
            prediction does not block it.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded border border-rule bg-panel2 p-2">
          <div className="label">Square 5 · centre</div>
          <div
            className={`tnum text-sm ${
              reading.centreHolder === null
                ? 'text-chaos'
                : reading.centreHolder === observerMark
                  ? 'text-observer'
                  : 'text-opponent'
            }`}
          >
            {reading.centreHolder ?? 'open'}
          </div>
        </div>
        <div className="rounded border border-rule bg-panel2 p-2">
          <div className="label">Square 9 · terminal</div>
          <div
            className={`tnum text-sm ${
              reading.terminalHolder === null
                ? 'text-chaos'
                : reading.terminalHolder === observerMark
                  ? 'text-observer'
                  : 'text-opponent'
            }`}
          >
            {reading.terminalHolder ?? 'open'}
          </div>
        </div>
      </div>

      <div>
        <div className="label mb-1.5">
          Lines · {reading.deadCount} dead / {reading.liveCount} live
        </div>
        <div className="grid grid-cols-2 gap-1">
          {reading.lines.map((l) => (
            <div
              key={l.line.join('')}
              className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${STATUS_STYLE[l.status]}`}
            >
              <span className="tnum">
                {l.line.join('-')}
                {l.isResonance && <span className="ml-1 text-realized" title="Resonance line">◆</span>}
                {l.isAttractor && <span className="ml-1 text-chaos" title="Attractor line">◇</span>}
              </span>
              <span className="text-[10px] uppercase tracking-wide">
                {l.status === 'one-away'
                  ? `${l.owner === observerMark ? 'obs' : 'opp'} → ${l.completingSquare}`
                  : l.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 text-[11px] text-inkfaint">
        <span>
          Observer ({observerMark}) wins on:{' '}
          <span className="tnum text-observer">
            {reading.observerWins.length ? reading.observerWins.join(', ') : '—'}
          </span>
        </span>
        <span>
          Opponent ({opponentMark}) wins on:{' '}
          <span className="tnum text-opponent">
            {reading.opponentWins.length ? reading.opponentWins.join(', ') : '—'}
          </span>
        </span>
      </div>
    </div>
  );
}
