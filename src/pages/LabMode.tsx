import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { Mark } from '../engine/board';
import { OPPONENT_LABEL, type OpponentKind } from '../engine/runner';
import { OSP_RULE_BLURB, type OspRule } from '../engine/osp';
import type { Summary } from '../engine/summary';
import type { SimRequest, SimResponse } from '../workers/sim.worker';
import type { useArchive } from '../state/archive';
import { Button, Panel, Stat, Toggle } from '../components/Panel';
import { Claim } from '../components/Claim';
import { CrossTab } from '../components/charts/CrossTab';
import { EndMoveChart } from '../components/charts/EndMoveChart';
import { SquareHeatmap } from '../components/charts/SquareHeatmap';
import { WinnerSplit } from '../components/charts/WinnerSplit';
import { DataTable } from '../components/charts/ChartFrame';
import { fmtPct, SERIES, SERIES_LABEL } from '../components/charts/tokens';
import { OSP_VS_PERFECT, OSP_VS_RANDOM } from '../data/known-results';

type RuleChoice = OspRule | 'both';

export function LabMode({
  archive,
  summaries,
  setSummaries,
}: {
  archive: ReturnType<typeof useArchive>;
  summaries: Summary[];
  setSummaries: (s: Summary[]) => void;
}) {
  const [games, setGames] = useState(2000);
  const [opponent, setOpponent] = useState<OpponentKind>('random');
  const [observerMark, setObserverMark] = useState<Mark>('O');
  const [ruleChoice, setRuleChoice] = useState<RuleChoice>('standard');
  const [seed, setSeed] = useState(12345);
  const [keepRecords, setKeepRecords] = useState(false);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => workerRef.current?.terminate();
  }, []);

  const run = () => {
    workerRef.current?.terminate();
    setRunning(true);
    setProgress(0);
    setError(null);
    setElapsed(null);

    const worker = new Worker(new URL('../workers/sim.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<SimResponse>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        setProgress(msg.done / msg.total);
      } else if (msg.type === 'done') {
        setSummaries(msg.summaries);
        setElapsed(msg.elapsedMs);
        if (keepRecords && msg.records.length) archive.appendMany(msg.records);
        setRunning(false);
        setProgress(1);
        worker.terminate();
      } else {
        setError(msg.message);
        setRunning(false);
        worker.terminate();
      }
    };

    worker.onerror = (e) => {
      setError(e.message || 'Worker failed');
      setRunning(false);
    };

    const request: SimRequest = {
      type: 'run',
      games,
      opponent,
      observerMark,
      rules: ruleChoice === 'both' ? ['standard', 'variant'] : [ruleChoice],
      seed,
      keepRecords,
    };
    worker.postMessage(request);
  };

  const reference = opponent === 'perfect' ? OSP_VS_PERFECT : opponent === 'random' ? OSP_VS_RANDOM : null;

  return (
    <div className="space-y-4">
      <Panel title="Simulation">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="label">Games per rule</span>
                <span className="tnum text-sm text-realized">{games.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={100}
                max={10000}
                step={100}
                value={games}
                onChange={(e) => setGames(Number(e.target.value))}
                disabled={running}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label">Opponent</span>
              <Toggle
                value={opponent}
                onChange={setOpponent}
                options={(['random', 'perfect', 'mixed'] as const).map((v) => ({
                  value: v,
                  label: OPPONENT_LABEL[v].split(' ')[0],
                  title: OPPONENT_LABEL[v],
                }))}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label">Observer plays</span>
              <Toggle
                value={observerMark}
                onChange={setObserverMark}
                options={[
                  { value: 'X' as const, label: 'X · first' },
                  { value: 'O' as const, label: 'O · second' },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label">Selection rule</span>
              <Toggle
                value={ruleChoice}
                onChange={setRuleChoice}
                options={[
                  { value: 'standard' as const, label: 'Standard', title: OSP_RULE_BLURB.standard },
                  { value: 'variant' as const, label: 'Variant', title: OSP_RULE_BLURB.variant },
                  { value: 'both' as const, label: 'Both · diff', title: 'Run both and compare' },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label">Seed</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                disabled={running}
                className="tnum w-28 rounded border border-rule bg-panel2 px-2 py-1 text-[12px] text-ink outline-none focus:border-rule2"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-inkdim">
              <input
                type="checkbox"
                checked={keepRecords}
                onChange={(e) => setKeepRecords(e.target.checked)}
                disabled={running}
                className="accent-realized"
              />
              Append every simulated game to the archive
              {keepRecords && games > 2000 && (
                <span className="text-alarm">— {games.toLocaleString()} records is a lot for localStorage</span>
              )}
            </label>

            <div className="flex items-center gap-3">
              <Button tone="primary" onClick={run} disabled={running}>
                {running ? 'Running…' : 'Run simulation'}
              </Button>
              {running && (
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded bg-rule">
                    <div
                      className="h-full bg-realized transition-[width] duration-150"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <span className="tnum text-[11px] text-inkfaint">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
              )}
              {elapsed !== null && !running && (
                <span className="tnum text-[11px] text-inkfaint">{elapsed} ms</span>
              )}
            </div>

            {error && (
              <div className="rounded border border-alarm/50 bg-alarm/10 p-2 text-[11px] text-alarm">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {reference && (
              <Claim tier="math" title="Recorded reference run">
                <p>
                  {reference.games.toLocaleString()} games, Observer as O:{' '}
                  <span className="tnum text-tierMath">
                    {(reference.observerWinShare * 100).toFixed(1)}%
                  </span>{' '}
                  Observer /{' '}
                  <span className="tnum text-tierMath">
                    {(reference.opponentWinShare * 100).toFixed(1)}%
                  </span>{' '}
                  opponent /{' '}
                  <span className="tnum text-tierMath">
                    {(reference.drawShare * 100).toFixed(1)}%
                  </span>{' '}
                  draws.
                </p>
                <p className="mt-1.5 text-inkfaint">
                  A finite sampled run, reproducible only up to sampling noise. Your run will land
                  near these numbers, not on them.
                </p>
              </Claim>
            )}
            <Claim tier="axiom" title="The open experiment">
              <p>{OSP_RULE_BLURB.variant}</p>
            </Claim>
          </div>
        </div>
      </Panel>

      {summaries.length > 0 && (
        <>
          {summaries.length === 2 && <RuleDiff a={summaries[0]} b={summaries[1]} />}

          {summaries.map((s) => (
            <div key={s.label} className="space-y-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-xs uppercase tracking-[0.18em] text-realized">{s.label}</h2>
                <span className="tnum text-[11px] text-inkfaint">
                  {s.games.toLocaleString()} games · {s.elapsedMs} ms
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <WinnerSplit summary={s} />
                <ObserverFacts summary={s} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <EndMoveChart summary={s} />
                <SquareHeatmap summary={s} />
              </div>

              <CrossTab summary={s} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ObserverFacts({ summary }: { summary: Summary }) {
  const wins = Object.entries(summary.crossTab)
    .filter(([k]) => k.endsWith(':observer'))
    .map(([k, v]) => {
      const [endMove, square] = k.split(':');
      return { shape: `${endMove}·${square}`, count: v };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="rounded border border-rule bg-panel p-3">
      <h3 className="label mb-2">Observer behaviour</h3>
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Held square 5"
          value={fmtPct(summary.centreHeld, summary.games)}
          hint={`${summary.centreHeld.toLocaleString()} games`}
        />
        <Stat
          label="Held square 9"
          value={fmtPct(summary.terminalHeld, summary.games)}
          hint={`${summary.terminalHeld.toLocaleString()} games`}
        />
        <Stat
          label="Games declining a win"
          value={fmtPct(summary.gamesWithDeclinedWins, summary.games)}
          hint={`${summary.totalDeclinedWins.toLocaleString()} declines total`}
          tone="alarm"
        />
        <Stat
          label="Winning shapes"
          value={wins.length}
          hint={wins.length ? wins.slice(0, 3).map((w) => w.shape).join(', ') : 'none'}
        />
      </div>

      {wins.length > 0 && (
        <div className="mt-3 border-t border-rule pt-2">
          <div className="label mb-1">Every shape the Observer won on</div>
          <div className="flex flex-wrap gap-1">
            {wins.map((w) => (
              <span
                key={w.shape}
                className="tnum rounded border border-rule2 px-1.5 py-0.5 text-[11px] text-ink"
                title={`${w.count.toLocaleString()} games`}
              >
                move {w.shape.split('·')[0]} · sq {w.shape.split('·')[1]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RuleDiff({ a, b }: { a: Summary; b: Summary }) {
  const rows: (readonly ReactNode[])[] = [
    ['Observer wins', fmtPct(a.observerWins, a.games), fmtPct(b.observerWins, b.games), delta(a.observerWins / a.games, b.observerWins / b.games)],
    ['Opponent wins', fmtPct(a.opponentWins, a.games), fmtPct(b.opponentWins, b.games), delta(a.opponentWins / a.games, b.opponentWins / b.games)],
    ['Draws', fmtPct(a.draws, a.games), fmtPct(b.draws, b.games), delta(a.draws / a.games, b.draws / b.games)],
    ['Held square 5', fmtPct(a.centreHeld, a.games), fmtPct(b.centreHeld, b.games), delta(a.centreHeld / a.games, b.centreHeld / b.games)],
    ['Held square 9', fmtPct(a.terminalHeld, a.games), fmtPct(b.terminalHeld, b.games), delta(a.terminalHeld / a.games, b.terminalHeld / b.games)],
    ['Games declining a win', fmtPct(a.gamesWithDeclinedWins, a.games), fmtPct(b.gamesWithDeclinedWins, b.games), delta(a.gamesWithDeclinedWins / a.games, b.gamesWithDeclinedWins / b.games)],
  ];

  return (
    <Panel title="Standard vs variant — the open experiment">
      <DataTable head={['Measure', a.label, b.label, 'Δ']} rows={rows} />
      <p className="mt-2 text-[11px] leading-relaxed text-inkfaint">
        Both runs used the same seed and the same opponent, so the difference is the selection rule
        alone. The variant contests square 5 at stage 6; the standard rule never does, because 5 is
        not a stage target.
      </p>
      <div className="mt-2 flex gap-3">
        {(['observer', 'opponent', 'draw'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[10px] text-inkfaint">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SERIES[k] }} />
            {SERIES_LABEL[k]}
          </span>
        ))}
      </div>
    </Panel>
  );
}

function delta(a: number, b: number): ReactNode {
  const d = (b - a) * 100;
  if (Math.abs(d) < 0.05) return <span className="text-inkfaint">—</span>;
  return (
    <span className={d > 0 ? 'text-tierMath' : 'text-alarm'}>
      {d > 0 ? '+' : ''}
      {d.toFixed(1)} pp
    </span>
  );
}
