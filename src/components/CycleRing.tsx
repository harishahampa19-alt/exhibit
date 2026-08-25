/**
 * The cycle ring: 0 → 1 → 3 → 6 → 9 → 0.
 *
 * TIER: FRAMEWORK AXIOM. The ring is a stipulated state grammar, animated here
 * so the current stage is readable at a glance during live play.
 */

import { CYCLE, STAGE_MEANINGS, STAGE_NAMES, type Stage } from '../engine/cycle';

const R = 68;
const CX = 100;
const CY = 100;
const CIRCUMFERENCE = 2 * Math.PI * R;

function nodePosition(index: number): { x: number; y: number } {
  const angle = ((-90 + index * 72) * Math.PI) / 180;
  return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
}

export function CycleRing({
  stage,
  size = 200,
  showCaption = true,
}: {
  stage: Stage;
  size?: number;
  showCaption?: boolean;
}) {
  const activeIndex = CYCLE.indexOf(stage);
  const progress = activeIndex / CYCLE.length;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label={`Cycle stage ${stage}: ${STAGE_NAMES[stage]}`}
      >
        {/* Dim track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e232a" strokeWidth={1.5} />

        {/* Progress arc, animated as the stage advances */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="#e0a340"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          transform={`rotate(-90 ${CX} ${CY})`}
          opacity={0.55}
          style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {CYCLE.map((s, i) => {
          const { x, y } = nodePosition(i);
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;

          return (
            <g key={s} style={{ transition: 'opacity 400ms' }}>
              {isActive && (
                <circle cx={x} cy={y} r={20} fill="#e0a340" opacity={0.12} className="animate-breathe" />
              )}
              <circle
                cx={x}
                cy={y}
                r={14}
                fill={isActive ? '#e0a340' : '#0e1013'}
                stroke={isActive ? '#e0a340' : isPast ? '#7a5a24' : '#24404b'}
                strokeWidth={1.5}
                style={{ transition: 'fill 400ms, stroke 400ms' }}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontFamily="ui-monospace, monospace"
                fill={isActive ? '#08090b' : isPast ? '#e0a340' : '#3f6d80'}
                style={{ transition: 'fill 400ms' }}
              >
                {s}
              </text>
            </g>
          );
        })}

        {/* Centre readout */}
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          fontSize={9}
          letterSpacing={2}
          fontFamily="ui-monospace, monospace"
          fill="#4c545f"
        >
          STAGE
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          fontSize={26}
          fontFamily="ui-monospace, monospace"
          fill="#e0a340"
        >
          {stage}
        </text>
      </svg>

      {showCaption && (
        <div className="mt-1 max-w-[240px] text-center">
          <div className="text-xs text-realized">{STAGE_NAMES[stage]}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-inkfaint">
            {STAGE_MEANINGS[stage]}
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact horizontal version for headers. */
export function CycleStrip({ stage }: { stage: Stage }) {
  const activeIndex = CYCLE.indexOf(stage);
  return (
    <div className="flex items-center gap-1">
      {CYCLE.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span
            className={`tnum flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-colors ${
              i === activeIndex
                ? 'border-realized bg-realized text-void'
                : i < activeIndex
                  ? 'border-realizedDim text-realized'
                  : 'border-chaosDim text-chaos'
            }`}
          >
            {s}
          </span>
          {i < CYCLE.length - 1 && <span className="text-[9px] text-inkfaint">→</span>}
        </span>
      ))}
    </div>
  );
}
