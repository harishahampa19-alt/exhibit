import { useMemo, useState } from 'react';
import { boardFromSequence } from '../engine/board';
import { summarize, type Summary } from '../engine/summary';
import { download, toCsv, toJson, type useArchive } from '../state/archive';
import { MiniBoard } from '../components/Board';
import { Button, Panel, Stat } from '../components/Panel';
import { Claim } from '../components/Claim';
import { GameReading } from '../components/GameReading';
import { EndMoveChart } from '../components/charts/EndMoveChart';
import { SquareHeatmap } from '../components/charts/SquareHeatmap';
import { WinnerSplit } from '../components/charts/WinnerSplit';
import { DataTable } from '../components/charts/ChartFrame';
import { fmtPct } from '../components/charts/tokens';

type SourceFilter = 'all' | 'live' | 'sim';

export function ArchivePage({
  archive,
  labSummaries,
}: {
  archive: ReturnType<typeof useArchive>;
  labSummaries: Summary[];
}) {
  const [source, setSource] = useState<SourceFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () => archive.records.filter((g) => source === 'all' || g.source === source),
    [archive.records, source],
  );

  const summary = useMemo(
    () => summarize(filtered, { label: `Archive · ${source}` }),
    [filtered, source],
  );

  const liveCount = archive.records.filter((g) => g.source === 'live').length;
  const simCount = archive.records.length - liveCount;

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  return (
    <div className="space-y-4">
      <Panel
        title="Archive"
        right={
          <div className="flex flex-wrap gap-1">
            <Button
              onClick={() => download(`observer-collapse-${stamp}.json`, toJson(filtered), 'application/json')}
              disabled={filtered.length === 0}
            >
              Export JSON
            </Button>
            <Button
              onClick={() => download(`observer-collapse-${stamp}.csv`, toCsv(filtered), 'text/csv')}
              disabled={filtered.length === 0}
            >
              Export CSV
            </Button>
            <Button
              tone="danger"
              onClick={() => {
                if (confirm(`Delete all ${archive.records.length} logged games? This cannot be undone.`)) {
                  archive.clear();
                }
              }}
              disabled={archive.records.length === 0}
            >
              Clear
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Games logged" value={archive.records.length.toLocaleString()} />
          <Stat label="Live" value={liveCount.toLocaleString()} hint="played at a real board" />
          <Stat label="Simulated" value={simCount.toLocaleString()} />
          <Stat
            label="Declined wins"
            value={summary.totalDeclinedWins.toLocaleString()}
            hint={`in ${summary.gamesWithDeclinedWins} games`}
            tone="alarm"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="label">Filter</span>
          {(['all', 'live', 'sim'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                source === s
                  ? 'border-realized/50 bg-realized/10 text-realized'
                  : 'border-rule2 text-inkdim hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Panel>

      {archive.records.length === 0 ? (
        <Claim tier="interp" title="Nothing logged yet">
          <p>
            Play a game in Live mode, or run a simulation with “append every simulated game to the
            archive” enabled. The point of this page is to see where lived data sits inside the
            possibility space — which needs lived data.
          </p>
        </Claim>
      ) : (
        <>
          {filtered.length > 0 && (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <WinnerSplit summary={summary} />
                {labSummaries.length > 0 ? (
                  <ComparisonPanel archive={summary} reference={labSummaries[0]} />
                ) : (
                  <Claim tier="interp" title="No simulated baseline yet">
                    <p>
                      Run a simulation in Lab mode and this panel will compare your logged games
                      against it, measure for measure.
                    </p>
                  </Claim>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <EndMoveChart summary={summary} title="End-move distribution · archive" />
                <SquareHeatmap summary={summary} title="Terminal square · archive" />
              </div>
            </>
          )}

          <Panel title={`Games · ${filtered.length}`}>
            <div className="space-y-1">
              {filtered.map((g) => (
                <div key={g.id} className="rounded border border-rule bg-panel2">
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                    className="flex w-full flex-wrap items-center gap-3 px-2.5 py-2 text-left hover:bg-panel"
                  >
                    <MiniBoard
                      board={boardFromSequence(g.sequence)}
                      observerMark={g.observerMark}
                      winningLine={g.winningLine}
                    />
                    <span className="tnum text-[11px] text-inkdim">
                      {g.sequence.join('-')}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                        g.outcome === 'observer'
                          ? 'bg-realized/15 text-realized'
                          : g.outcome === 'draw'
                            ? 'bg-chaos/15 text-chaos'
                            : 'bg-panel text-inkdim'
                      }`}
                    >
                      {g.outcome}
                    </span>
                    <span className="tnum text-[11px] text-inkfaint">
                      move {g.endMove} · sq {g.terminalSquare}
                    </span>
                    {g.declinedWins.length > 0 && (
                      <span className="text-[10px] uppercase tracking-wider text-alarm">
                        declined {g.declinedWins.length}
                      </span>
                    )}
                    {g.interference.length > 0 && (
                      <span className="text-[10px] uppercase tracking-wider text-tierAxiom">
                        model {g.interference[0].model}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-inkfaint">
                      {g.source} · {new Date(g.timestamp).toLocaleString()}
                    </span>
                  </button>

                  {expanded === g.id && (
                    <div className="border-t border-rule px-2.5 py-3">
                      <GameReading game={g} />
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          value={g.notes ?? ''}
                          onChange={(e) => archive.setNotes(g.id, e.target.value)}
                          placeholder="Notes"
                          className="flex-1 rounded border border-rule bg-panel px-2 py-1 text-[12px] text-ink outline-none placeholder:text-inkfaint focus:border-rule2"
                        />
                        <Button tone="danger" onClick={() => archive.remove(g.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function ComparisonPanel({ archive, reference }: { archive: Summary; reference: Summary }) {
  const rows = [
    ['Observer wins', archive.observerWins / archive.games, reference.observerWins / reference.games],
    ['Opponent wins', archive.opponentWins / archive.games, reference.opponentWins / reference.games],
    ['Draws', archive.draws / archive.games, reference.draws / reference.games],
    ['Held square 5', archive.centreHeld / archive.games, reference.centreHeld / reference.games],
    ['Held square 9', archive.terminalHeld / archive.games, reference.terminalHeld / reference.games],
  ] as const;

  return (
    <Panel title="Lived data vs the simulated baseline">
      <DataTable
        head={['Measure', `Archive (${archive.games})`, `${reference.label} (${reference.games})`, 'Δ']}
        rows={rows.map(([label, a, b]) => [
          label,
          `${(a * 100).toFixed(1)}%`,
          `${(b * 100).toFixed(1)}%`,
          <span
            key={label}
            className={Math.abs((a - b) * 100) < 0.05 ? 'text-inkfaint' : a > b ? 'text-tierMath' : 'text-alarm'}
          >
            {Math.abs((a - b) * 100) < 0.05
              ? '—'
              : `${a > b ? '+' : ''}${((a - b) * 100).toFixed(1)} pp`}
          </span>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-inkfaint">
        With {archive.games} logged game{archive.games === 1 ? '' : 's'}, the sampling error on
        every figure above is large. A handful of real games cannot confirm or refute a
        distribution measured over thousands; this table is for noticing surprises, not for
        settling them.
      </p>
      <p className="mt-1.5 text-[11px] text-inkfaint">
        Archive terminal-square spread: {fmtPct(archive.byTerminalSquare[5].total, archive.games)} on
        square 5, {fmtPct(archive.byTerminalSquare[9].total, archive.games)} on square 9.
      </p>
    </Panel>
  );
}
