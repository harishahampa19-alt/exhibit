import { Claim, TierLegend } from '../components/Claim';
import { Panel, Stat } from '../components/Panel';
import { DataTable } from '../components/charts/ChartFrame';
import {
  CYCLE_LINES,
  DERIVED_LAWS,
  ENUMERATION,
  ENUMERATION_ROWS,
  HISTORICAL_SIGIL,
  OSP_VS_PERFECT,
  TERMINAL_WINDOW,
  THEOREM_1,
  THEOREM_2,
  THEOREM_3,
  TIER_COUNTS,
  T_TABLE,
} from '../data/known-results';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section>
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-realized">What this is</h2>
        <div className="space-y-3 text-[13px] leading-relaxed text-inkdim">
          <p>
            Observer Collapse is a laboratory for a designed symbolic system called the Observer
            Framework. The framework defines a five-state cycle, a selection rule, and a small set
            of equations; the app plays that rule against real and simulated opponents, records
            what happens, and shows the resulting distributions.
          </p>
          <p className="text-ink">
            It does not describe physics. It does not predict events outside the game. It does not
            outperform optimal play — in{' '}
            <span className="tnum">{OSP_VS_PERFECT.games.toLocaleString()}</span> simulated games
            against a perfect opponent, the Observer won{' '}
            <span className="tnum text-alarm">zero</span> of them.
          </p>
          <p>
            Its value is as a decision-notation, as a design system, and as an instrument for
            learning how formal systems are built and tested — how you state an axiom, derive a
            consequence, and then check it against exhaustive enumeration rather than against
            intuition.
          </p>
          <p>
            Where a pattern has a mundane mechanical explanation, this app states the mechanism
            rather than leaving the pattern mysterious. The framework's most striking observation —
            that games funnel toward terminal square 1 — is not a resonance. It is a consequence of
            the selection rule never targeting square 5, and square 5 being the single most
            valuable square on the board.
          </p>
        </div>
      </section>

      <section>
        <h3 className="label mb-2">Every claim in this app is sorted into one of three categories</h3>
        <TierLegend />
      </section>

      <Panel title="The possibility space">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Legal games" value={ENUMERATION.total.toLocaleString()} />
          <Stat label="Distinct positions" value={ENUMERATION.reachablePositions.toLocaleString()} />
          <Stat label="Raw orderings 9!" value={ENUMERATION.rawOrderings.toLocaleString()} />
          <Stat label="T(9) / 9! = 3⁹" value={ENUMERATION.branchingQuotient.toLocaleString()} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="label mb-1.5">Games by ending move</div>
            <DataTable
              head={['End move', 'Outcome', 'Games']}
              rows={ENUMERATION_ROWS.map((r) => [
                r.endMove,
                r.outcome === 'draw' ? 'Draw' : `${r.outcome} wins`,
                r.games.toLocaleString(),
              ])}
            />
          </div>
          <div>
            <div className="label mb-1.5">T(n) = 3ⁿ · n!</div>
            <DataTable
              head={['n', 'T(n)']}
              rows={Object.entries(T_TABLE).map(([n, v]) => [n, v.toLocaleString()])}
            />
          </div>
        </div>

        <Claim tier="math" title="The board has exactly three tiers" className="mt-4">
          <p>
            Across the {ENUMERATION.decisive.toLocaleString()} decisive games, the winning square is
            the centre <span className="tnum text-tierMath">{TIER_COUNTS.centre.toLocaleString()}</span>{' '}
            times, each corner{' '}
            <span className="tnum text-tierMath">{TIER_COUNTS.corner.toLocaleString()}</span> times,
            and each edge <span className="tnum text-tierMath">{TIER_COUNTS.edge.toLocaleString()}</span>{' '}
            times. Those nine numbers sum to exactly {ENUMERATION.decisive.toLocaleString()} — a
            useful self-check, and the reason the centre matters so much.
          </p>
        </Claim>
      </Panel>

      <Panel title="Theorems">
        <div className="space-y-3">
          <Claim tier={THEOREM_1.tier} title={THEOREM_1.name}>
            <p>{THEOREM_1.claim}</p>
            <p className="mt-1.5 text-inkfaint">{THEOREM_1.caveat}</p>
          </Claim>

          <Claim tier={THEOREM_2.tier} title={THEOREM_2.name}>
            <p>{THEOREM_2.claim}</p>
            <p className="mt-1.5 text-inkfaint">{THEOREM_2.caveat}</p>
          </Claim>

          <Claim tier={THEOREM_3.tier} title={THEOREM_3.name}>
            <p>
              For the board where the winner holds{' '}
              {'{' + THEOREM_3.winnerSquares.join(', ') + '}'} and wins on the 3-6-9 column, there
              are exactly{' '}
              <span className="tnum text-tierMath">
                {THEOREM_3.totalHistories.toLocaleString()}
              </span>{' '}
              legal move histories. The final move is always 3, 6 or 9 (576 each); the opening is 2
              or 4 in 432 histories each, against 288 each for 3, 6 and 9.{' '}
              <span className="text-tierMath">{THEOREM_3.claim}</span>
            </p>
            <p className="mt-1.5">{THEOREM_3.mechanism}</p>
            <p className="mt-1.5 italic text-tierInterp">{THEOREM_3.interpretation}</p>
            <p className="mt-1.5 text-inkfaint">
              Verify it yourself on the Reconstruct page — the numbers are computed live, not read
              from a table.
            </p>
          </Claim>
        </div>
      </Panel>

      <Panel title="What the runs showed">
        <div className="space-y-2">
          {DERIVED_LAWS.map((law, i) => (
            <Claim key={i} tier={law.tier}>
              {law.text}
            </Claim>
          ))}
        </div>
      </Panel>

      <Panel title="Board geometry">
        <Claim tier={CYCLE_LINES.tier} title="The two cycle lines">
          <p>{CYCLE_LINES.note}</p>
          <div className="mt-2 flex gap-4 text-[12px]">
            <span className="text-realized">◆ resonance {CYCLE_LINES.resonance.join('-')}</span>
            <span className="text-chaos">◇ attractor {CYCLE_LINES.attractor.join('-')}</span>
            <span className="text-inkfaint">shared square {CYCLE_LINES.sharedSquare}</span>
          </div>
        </Claim>
      </Panel>

      <Panel title="Terminal windows">
        <Claim tier={TERMINAL_WINDOW.tier} title="The declared window">
          <p>{TERMINAL_WINDOW.statement}</p>
        </Claim>
        <Claim tier="math" title="The honest correction" className="mt-2">
          <p>{TERMINAL_WINDOW.correction}</p>
        </Claim>
      </Panel>

      <Panel title="Provenance">
        <div className="space-y-2 text-[12px] leading-relaxed text-inkdim">
          <p>
            The framework's equations replaced an earlier decorative notation,{' '}
            <span className="tnum text-inkfaint">{HISTORICAL_SIGIL}</span>, which was not a
            well-formed equation. It survives in this app only as a labelled sigil in the footer;
            nothing computes from it.
          </p>
          <p>
            The Observer Selection Principle is deliberately left alone. It is a fixed symbolic
            rule, not a strategy, and it loses — that is the finding. Replacing it with better play
            would destroy the experiment, so the minimax engine here exists only as an opponent.
          </p>
        </div>
      </Panel>
    </div>
  );
}
