import { formatBig, psi, ratio, T } from '../engine/cycle';
import { EQUATIONS, HISTORICAL_SIGIL } from '../data/known-results';
import { TierBadge } from './Claim';

export function EquationPanel({ n }: { n: number }) {
  const safeN = Math.max(0, Math.min(9, n));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Readout label={`T(${safeN})`} value={formatBig(T(safeN))} hint="possibility space" />
        <Readout label={`Ψ(${safeN})`} value={formatBig(psi(safeN))} hint="chaos remainder" />
        <Readout
          label={`R(${safeN})`}
          value={safeN === 0 ? '1' : `1 / ${formatBig(T(safeN))}`}
          hint="observer ratio"
          small
        />
      </div>

      <div className="space-y-1.5">
        {EQUATIONS.map((e) => (
          <div key={e.id} className="flex items-start gap-2 rounded border border-rule bg-panel2 p-2">
            <TierBadge tier={e.tier} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="tnum text-[13px] text-ink">{e.formula}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-inkfaint">{e.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded border border-dotted border-rule2 bg-panel2/50 p-2">
        <div className="label mb-1">Historical sigil · display only</div>
        <div className="tnum text-[13px] text-inkfaint">{HISTORICAL_SIGIL}</div>
        <p className="mt-1 text-[10px] leading-snug text-inkfaint">
          An earlier decorative notation. It is not a well-formed equation and nothing in the app
          computes from it. Kept for provenance only; the canonical equations above replaced it.
        </p>
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  hint,
  small = false,
}: {
  label: string;
  value: string;
  hint: string;
  small?: boolean;
}) {
  return (
    <div className="rounded border border-rule bg-panel2 p-2">
      <div className="label">{label}</div>
      <div className={`tnum truncate text-realized ${small ? 'text-[11px]' : 'text-sm'}`} title={value}>
        {value}
      </div>
      <div className="mt-0.5 truncate text-[10px] text-inkfaint">{hint}</div>
    </div>
  );
}

export function ObserverRatioBar({ n }: { n: number }) {
  const r = ratio(Math.max(1, n));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="label">Realized share of possibility space</span>
        <span className="tnum text-[11px] text-realized">{r.toExponential(2)}</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded bg-chaosDim/40">
        {/* One realized branch against T(n) − 1 unrealized: visually, a hairline. */}
        <div className="absolute inset-y-0 left-0 w-px bg-realized" />
      </div>
      <p className="mt-1 text-[10px] leading-snug text-inkfaint">
        The warm hairline is E_O = 1. Everything else in the bar is Ψ.
      </p>
    </div>
  );
}
