/**
 * The three categories every claim in this app must be sorted into, and the
 * visual treatment each one gets. This is a non-negotiable requirement of the
 * project: the app is a laboratory, and a laboratory labels its instruments.
 */

export type Tier = 'math' | 'axiom' | 'interp';

export interface TierSpec {
  id: Tier;
  label: string;
  short: string;
  meaning: string;
  /** Tailwind fragments, applied by the <Claim> component. */
  text: string;
  border: string;
  dot: string;
  bg: string;
}

export const TIERS: Record<Tier, TierSpec> = {
  math: {
    id: 'math',
    label: 'Verified mathematics',
    short: 'MATH',
    meaning:
      'Checkable and true independently of this framework. Computed by exhaustive enumeration or plain arithmetic, and asserted in the test suite.',
    text: 'text-tierMath',
    border: 'border-tierMath/40 border-solid',
    dot: 'bg-tierMath',
    bg: 'bg-tierMath/5',
  },
  axiom: {
    id: 'axiom',
    label: 'Framework axiom',
    short: 'AXIOM',
    meaning:
      'A stipulated definition of the Observer Framework. Correct relative to the framework, but not a discovery about the world. Changing it changes the framework, not the facts.',
    text: 'text-tierAxiom',
    border: 'border-tierAxiom/40 border-dashed',
    dot: 'bg-tierAxiom',
    bg: 'bg-tierAxiom/5',
  },
  interp: {
    id: 'interp',
    label: 'Interpretation',
    short: 'INTERP',
    meaning:
      'Meaning the framework assigns to its own numbers — observer, chaos, collapse, prophecy, attractor. Evocative language, not evidence.',
    text: 'text-tierInterp',
    border: 'border-tierInterp/40 border-dotted',
    dot: 'bg-tierInterp',
    bg: 'bg-tierInterp/5',
  },
};

export const TIER_ORDER: readonly Tier[] = ['math', 'axiom', 'interp'];
