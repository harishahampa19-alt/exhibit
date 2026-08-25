/**
 * Chart palette — validated, not eyeballed.
 *
 * Run against the data-viz six checks in dark mode on the chart surface
 * #0e1013, with the harder `--pairs all` pairlist:
 *
 *   Lightness band        PASS  all inside L 0.48–0.67
 *   Chroma floor          PASS  all >= 0.10
 *   CVD separation        PASS  worst aqua<->yellow ΔE 8.4 (protan)
 *   Normal-vision floor   PASS  worst aqua<->yellow ΔE 19.8 (>= 15)
 *   Contrast vs surface   PASS  all >= 3:1
 *
 * The app's original UI trio (amber #e0a340, slate #6f8fa8, teal #3f6d80) FAILED:
 * the two cool tones sit at chroma 0.052 / 0.059, below the 0.10 floor — they
 * read as gray and stop doing identity work — and their normal-vision ΔE of
 * 12.6 is under the hard floor of 15. #e0a340 is also L 0.756, outside the dark
 * band. Those values stay as *UI accents* (glyphs and rules, where letter shape
 * and position carry identity and only WCAG text contrast applies); charts use
 * the validated series colors below.
 *
 * All three hexes are documented steps from the reference palette's dark column.
 */

export const SERIES = {
  observer: '#c98500', // yellow — warm, "realized"
  opponent: '#3987e5', // blue — cool
  draw: '#199e70', // aqua
} as const;

export type SeriesKey = keyof typeof SERIES;

export const SERIES_ORDER: readonly SeriesKey[] = ['observer', 'opponent', 'draw'];

export const SERIES_LABEL: Record<SeriesKey, string> = {
  observer: 'Observer',
  opponent: 'Opponent',
  draw: 'Draw',
};

/**
 * Sequential ramp for the terminal-square heat map — magnitude, one hue,
 * light→dark. Validated for the sequential job: lightness monotone PASS,
 * adjacent ΔL >= 0.06 PASS, single hue (9° spread) PASS.
 *
 * The ordinal light-end floor (>= 2:1 vs surface) deliberately does NOT apply:
 * this is a continuous heat map, where the near-zero step is meant to recede
 * into the surface. Every cell also carries a visible numeric label, so
 * magnitude is never color-alone.
 */
export const SEQUENTIAL: readonly string[] = [
  '#2a1d0a',
  '#5a3f12',
  '#8a641c',
  '#b48a2b',
  '#d4a648',
  '#f0c87a',
];

/** Chart chrome. Text never wears a series color. */
export const CHROME = {
  surface: '#0e1013',
  grid: '#1e232a',
  axis: '#2a313a',
  muted: '#898781',
  ink: '#c9ced6',
  inkFaint: '#4c545f',
} as const;

/** Picks a ramp step for `value` against `max`. */
export function rampStep(value: number, max: number): string {
  if (max <= 0 || value <= 0) return SEQUENTIAL[0];
  const t = value / max;
  const i = Math.min(SEQUENTIAL.length - 1, Math.floor(t * SEQUENTIAL.length));
  return SEQUENTIAL[i];
}

/**
 * A rect rounded on its data end only, so a stacked bar keeps a flat baseline
 * and a 4px cap at the top of the stack.
 */
export function roundedTopRect(x: number, y: number, w: number, h: number, r = 4): string {
  const radius = Math.max(0, Math.min(r, h, w / 2));
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h}`,
    'Z',
  ].join(' ');
}

export const fmtPct = (n: number, total: number): string =>
  total === 0 ? '—' : `${((n / total) * 100).toFixed(1)}%`;
