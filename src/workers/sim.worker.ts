/// <reference lib="webworker" />

/**
 * Lab-mode simulation, off the main thread.
 *
 * The minimax transposition map is module-level and persists across every game
 * in a run, so a 10,000-game sweep against a perfect opponent solves the tree
 * once and then replays it.
 */

import type { Mark } from '../engine/board';
import type { OspRule } from '../engine/osp';
import { type GameRecord, type OpponentKind, runGame } from '../engine/runner';
import { mulberry32 } from '../engine/rng';
import { summarize, type Summary } from '../engine/summary';

export interface SimRequest {
  type: 'run';
  games: number;
  opponent: OpponentKind;
  observerMark: Mark;
  /** When two rules are given, both are run so the distributions can be diffed. */
  rules: OspRule[];
  seed: number;
  /** Keep the raw records so they can be pushed into the archive. */
  keepRecords: boolean;
}

export type SimResponse =
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; summaries: Summary[]; records: GameRecord[]; elapsedMs: number }
  | { type: 'error'; message: string };

const PROGRESS_EVERY = 200;

/**
 * `self` inside a module worker is a DedicatedWorkerGlobalScope, but the app's
 * tsconfig also pulls in the DOM lib, where `self` is typed as a Window. The
 * Worker interface carries the same postMessage/onmessage shape, so this cast
 * gives the correct signatures without splitting tsconfigs.
 */
const ctx = self as unknown as Worker;
const post = (message: SimResponse): void => ctx.postMessage(message);

ctx.onmessage = (event: MessageEvent<SimRequest>) => {
  const req = event.data;
  if (req.type !== 'run') return;

  try {
    const start = Date.now();
    const total = req.games * req.rules.length;
    let done = 0;

    const summaries: Summary[] = [];
    const kept: GameRecord[] = [];

    for (const rule of req.rules) {
      const rng = mulberry32(req.seed);
      const batch: GameRecord[] = [];
      const runStart = Date.now();

      for (let i = 0; i < req.games; i++) {
        batch.push(
          runGame({ observerMark: req.observerMark, opponent: req.opponent, rule, rng }),
        );
        done++;
        if (done % PROGRESS_EVERY === 0) post({ type: 'progress', done, total });
      }

      summaries.push(
        summarize(batch, {
          label: rule === 'standard' ? 'Standard OSP' : 'Variant OSP',
          elapsedMs: Date.now() - runStart,
        }),
      );
      if (req.keepRecords) kept.push(...batch);
    }

    post({ type: 'done', summaries, records: kept, elapsedMs: Date.now() - start });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
