import { SQUARES, type Square } from '../engine/board';

/**
 * ρ (realized) and Ψ (chaos) as square sets.
 *
 * Note the deliberate overload: Ψ(n) in the equations is a *count* of
 * unrealized branches, while Ψ here is the *set* of squares not yet collapsed.
 * They are different objects sharing a letter; the label says so.
 */
export function SetChips({
  realized,
  className = '',
}: {
  realized: readonly Square[];
  className?: string;
}) {
  const chaos = SQUARES.filter((s) => !realized.includes(s));

  return (
    <div className={`space-y-2 ${className}`}>
      <div>
        <div className="label mb-1">
          ρ · realized <span className="normal-case tracking-normal">({realized.length})</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {realized.length === 0 && <span className="text-[11px] text-inkfaint">∅</span>}
          {realized.map((s, i) => (
            <span
              key={s}
              title={`move ${i + 1}`}
              className="tnum rounded border border-realized/40 bg-realized/10 px-1.5 py-0.5 text-[11px] text-realized"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="label mb-1">
          Ψ · chaos set <span className="normal-case tracking-normal">({chaos.length})</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {chaos.length === 0 && <span className="text-[11px] text-inkfaint">∅</span>}
          {chaos.map((s) => (
            <span
              key={s}
              className="tnum rounded border border-chaosDim bg-chaos/5 px-1.5 py-0.5 text-[11px] text-chaos"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
