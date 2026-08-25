import type { OspExplanation } from '../engine/osp';
import { TierBadge } from './Claim';

export function PredictionPanel({
  explanation,
  trueMoveNumber,
  resetAt,
}: {
  explanation: OspExplanation | null;
  trueMoveNumber: number;
  resetAt: number | null;
}) {
  if (!explanation) {
    return (
      <div className="flex h-full items-center justify-center py-6 text-xs text-inkfaint">
        No prediction — the board is closed.
      </div>
    );
  }

  const shifted = resetAt !== null && explanation.moveNumber !== trueMoveNumber;

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className="label mb-1">Predicts</div>
          <div className="flex h-16 w-16 items-center justify-center rounded border border-realized/70 bg-realized/10 glow-realized">
            <span className="tnum text-4xl leading-none text-realized">{explanation.square}</span>
          </div>
          {explanation.resonant && (
            <div className="mt-1.5 text-[10px] uppercase tracking-wider text-realized">
              Resonant
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <TierBadge tier="axiom" />
            <span className="text-[11px] text-inkfaint">
              move {trueMoveNumber}
              {shifted && (
                <span className="text-realized">
                  {' '}
                  → effective {explanation.moveNumber} (reset at {resetAt})
                </span>
              )}
            </span>
          </div>

          <p className="text-[13px] leading-relaxed text-ink">{explanation.text}</p>

          <div className="mt-2.5">
            <div className="label mb-1">Candidates</div>
            <div className="flex flex-wrap gap-1">
              {explanation.candidates.map((c) => (
                <span
                  key={c.square}
                  title={
                    explanation.rule === 'variant' && explanation.stage === 6
                      ? `centre-adjacency rank ${c.rank}`
                      : `distance ${c.distance} from stage ${explanation.stage}`
                  }
                  className={`tnum rounded border px-1.5 py-0.5 text-[11px] ${
                    c.chosen
                      ? 'border-realized bg-realized/15 text-realized'
                      : 'border-rule text-inkdim'
                  }`}
                >
                  {c.square}
                  <span className="ml-1 text-inkfaint">
                    {explanation.rule === 'variant' && explanation.stage === 6 ? c.rank : c.distance}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
