/**
 * The honesty layer. Every assertion the app makes is wrapped in one of these
 * so the reader can always see which of the three categories it belongs to.
 */

import type { ReactNode } from 'react';
import { type Tier, TIER_ORDER, TIERS } from '../data/honesty';

export function TierBadge({ tier, className = '' }: { tier: Tier; className?: string }) {
  const spec = TIERS[tier];
  return (
    <span
      title={spec.meaning}
      className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${spec.text} ${spec.bg} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${spec.dot}`} />
      {spec.short}
    </span>
  );
}

export function Claim({
  tier,
  children,
  title,
  className = '',
}: {
  tier: Tier;
  children: ReactNode;
  title?: ReactNode;
  className?: string;
}) {
  const spec = TIERS[tier];
  return (
    <div className={`rounded border ${spec.border} ${spec.bg} p-3 ${className}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <TierBadge tier={tier} />
        {title && <span className="text-xs text-ink">{title}</span>}
      </div>
      <div
        className={`text-[13px] leading-relaxed ${tier === 'interp' ? 'italic text-inkdim' : 'text-inkdim'}`}
      >
        {children}
      </div>
    </div>
  );
}

export function TierLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`grid gap-2 sm:grid-cols-3 ${className}`}>
      {TIER_ORDER.map((t) => {
        const spec = TIERS[t];
        return (
          <div key={t} className={`rounded border ${spec.border} ${spec.bg} p-2.5`}>
            <div className="mb-1 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${spec.dot}`} />
              <span className={`text-[11px] uppercase tracking-wider ${spec.text}`}>
                {spec.label}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-inkfaint">{spec.meaning}</p>
          </div>
        );
      })}
    </div>
  );
}
