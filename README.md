# Observer Collapse

A tic-tac-toe laboratory for testing a custom symbolic framework called the **Observer Framework**.

This is not a tic-tac-toe game that tries to win. It is an instrument that plays a fixed symbolic rule (the Observer), records what happens, and surfaces patterns across many games.

## Getting started

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

## What it does

| Mode | What it's for |
|---|---|
| **Live** | Play against a human at a physical board. Enter each opponent move; the app returns the Observer's prediction, the cycle stage, the live threat readout, and the framework state. |
| **Lab** | Simulate up to 10,000 games against random, perfect, or mixed opponents in a Web Worker. Diff the standard rule against the variant rule side by side. |
| **Reconstruct** | Enter any final board; enumerate every legal history that produces it. Validates against the Theorem 3 figure of 1,728. |
| **Archive** | Every game logs to `localStorage`. Export as JSON or CSV, and compare lived games against the simulated distributions. |
| **What this is** | The honest statement of what the framework is and is not. |

## Intellectual honesty

Every claim in the app is sorted into one of three categories and styled distinctly:

- **Verified mathematics** — checkable and true independently of the framework. Asserted in the test suite.
- **Framework axiom** — a stipulated definition. Correct relative to the framework, not a discovery about the world.
- **Interpretation** — meaning the framework assigns to its own numbers.

The app states plainly that the framework does not describe physics, does not predict events outside the game, and does not outperform optimal play — the simulations show the Observer losing every game to a perfect opponent. Where a pattern has a mundane mechanical explanation, the app gives the mechanism.

## The constants, and where they're checked

Nothing in `src/data/known-results.ts` is trusted on its word; the suite recomputes it.

| Fact | Value | Checked in |
|---|---|---|
| Legal games | 255,168 | `tests/enumerate.test.ts` |
| Draws (move 9 only) | 46,080 | `tests/enumerate.test.ts` |
| Distinct reachable positions | 5,478 | `tests/enumerate.test.ts` |
| Terminal-square tiers | 40,464 / 27,348 / 14,808 | `tests/enumerate.test.ts` |
| T(n) = 3ⁿ · n!, T(9) | 7,142,567,040 | `tests/cycle.test.ts` |
| Theorem 3 histories | 1,728 | `tests/theorem3.test.ts` |
| Theorem 3 OSP-consistent | 0, in either role | `tests/theorem3.test.ts` |

The board's three tiers sum to exactly 209,088 — the decisive-game count — which is a useful self-check on the whole enumeration.

## Structure

```
src/
  engine/      board, cycle, OSP, minimax, threats, runner, enumeration, reconstruction
  data/        known results as fixtures; the honesty-tier model
  state/       live-game machine, localStorage archive
  workers/     off-thread simulation
  components/  board, cycle ring, readouts, and the validated chart set
  pages/       Live, Lab, Reconstruct, Archive, About
tests/         the arbiters for every constant above
```

## A note on OSP

`src/engine/osp.ts` never targets square 5 — its stage targets are 1, 3, 6, 9. **This is deliberate and must not be "fixed" into good strategy.** It is the source of most of the framework's observed behaviour. The minimax engine exists in this app only as a simulated opponent.

## Chart palette

The chart colors are validated rather than chosen by eye. The app's original UI trio failed on chroma (two tones read as gray) and on the normal-vision separation floor; the shipped series colors pass all six data-viz checks in dark mode on the chart surface. The reasoning is recorded in `src/components/charts/tokens.ts`.
