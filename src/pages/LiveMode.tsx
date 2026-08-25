import { type ReactNode, useState } from 'react';
import type { Square } from '../engine/board';
import { INTERFERENCE_BLURB, INTERFERENCE_LABEL, OSP_RULE_BLURB } from '../engine/osp';
import { DEFAULT_CONFIG, type LiveConfig, useLiveGame } from '../state/useLiveGame';
import type { useArchive } from '../state/archive';
import { BoardGrid } from '../components/Board';
import { CycleRing } from '../components/CycleRing';
import { EquationPanel } from '../components/EquationPanel';
import { GameReading } from '../components/GameReading';
import { PredictionPanel } from '../components/PredictionPanel';
import { Button, Panel, Toggle } from '../components/Panel';
import { SetChips } from '../components/SetChips';
import { ThreatReadout } from '../components/ThreatReadout';
import { TERMINAL_WINDOW } from '../data/known-results';
import { Claim } from '../components/Claim';

export function LiveMode({ archive }: { archive: ReturnType<typeof useArchive> }) {
  const [config, setConfig] = useState<LiveConfig>(DEFAULT_CONFIG);
  const [notes, setNotes] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);

  const game = useLiveGame(config, (record) => {
    archive.append(record);
    setLastId(record.id);
  });

  const locked = game.moves.length > 0;

  const handleSquare = (sq: Square) => {
    if (game.over) return;
    if (!game.isObserverTurn) {
      game.opponentMove(sq);
      return;
    }
    if (sq === game.prediction) {
      game.follow();
    } else if (!game.interferenceUsed) {
      game.override(sq);
    }
  };

  const newGame = () => {
    game.reset();
    setNotes('');
    setLastId(null);
  };

  const saveNotes = (value: string) => {
    setNotes(value);
    if (lastId) archive.setNotes(lastId, value);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ---------------------------------------------------------------- */}
      {/* Left: declaration, board, controls                                */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-4">
        <Panel
          title="Declaration"
          right={
            locked && (
              <span className="text-[10px] text-inkfaint">locked — reset to change</span>
            )
          }
        >
          <div className="space-y-3">
            <Row label="Observer plays">
              <Toggle
                value={config.observerMark}
                onChange={(v) => !locked && setConfig({ ...config, observerMark: v })}
                options={[
                  { value: 'X' as const, label: 'X · first', title: 'X moves first by convention' },
                  { value: 'O' as const, label: 'O · second' },
                ]}
              />
            </Row>

            <Row label="Selection rule">
              <Toggle
                value={config.rule}
                onChange={(v) => !locked && setConfig({ ...config, rule: v })}
                options={[
                  { value: 'standard' as const, label: 'Standard', title: OSP_RULE_BLURB.standard },
                  { value: 'variant' as const, label: 'Variant', title: OSP_RULE_BLURB.variant },
                ]}
              />
            </Row>

            <Row label="Interference model">
              <Toggle
                value={config.interferenceModel}
                onChange={(v) => !locked && setConfig({ ...config, interferenceModel: v })}
                options={[
                  { value: 'A' as const, label: 'A · reset', title: INTERFERENCE_BLURB.A },
                  { value: 'B' as const, label: 'B · exception', title: INTERFERENCE_BLURB.B },
                ]}
              />
            </Row>

            <Row label="Terminal window">
              <div className="flex items-center gap-2">
                <Toggle
                  value={config.windowEnabled ? 'on' : 'off'}
                  onChange={(v) => setConfig({ ...config, windowEnabled: v === 'on' })}
                  options={[
                    { value: 'on' as const, label: 'Overlay on' },
                    { value: 'off' as const, label: 'Off' },
                  ]}
                />
                <span className="tnum text-[11px] text-inkfaint">
                  {'{' + config.terminalWindow.join(', ') + '}'}
                </span>
              </div>
            </Row>

            <p className="text-[11px] leading-snug text-inkfaint">
              {INTERFERENCE_LABEL[config.interferenceModel]} —{' '}
              {INTERFERENCE_BLURB[config.interferenceModel]} One override per game.
            </p>
          </div>
        </Panel>

        <Panel
          title={
            game.over
              ? 'Board · closed'
              : game.isObserverTurn
                ? `Move ${game.trueMoveNumber} · Observer to place`
                : `Move ${game.trueMoveNumber} · awaiting opponent`
          }
          right={
            <div className="flex gap-1">
              <Button tone="ghost" onClick={game.undo} disabled={!game.canUndo}>
                Undo
              </Button>
              <Button tone="ghost" onClick={newGame}>
                New game
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-4">
            <BoardGrid
              board={game.board}
              observerMark={config.observerMark}
              prediction={game.prediction}
              winningLine={game.finished?.winningLine ?? null}
              moveNumbers={game.moves.reduce<Partial<Record<Square, number>>>((acc, m) => {
                acc[m.square] = m.n;
                return acc;
              }, {})}
              threats={game.threats.unblockedSquares}
              declined={game.threats.declinedSquares}
              overlay="cycle"
              interactive={!game.over}
              onSquare={handleSquare}
            />

            {!game.over && (
              <div className="flex flex-wrap justify-center gap-2">
                {game.isObserverTurn ? (
                  <>
                    <Button tone="primary" onClick={game.follow} disabled={game.prediction === null}>
                      Follow prediction · {game.prediction}
                    </Button>
                    <span className="self-center text-[11px] text-inkfaint">
                      {game.interferenceUsed
                        ? 'override spent'
                        : `or click any square to override (${config.interferenceModel === 'A' ? 'logs R' : 'logs I'})`}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-inkfaint">
                    Opponent moved — click the square they took.
                  </span>
                )}
              </div>
            )}
          </div>
        </Panel>

        {game.finished && (
          <Panel title="Reading">
            <GameReading
              game={game.finished}
              windowBreach={game.windowBreach}
              terminalWindow={config.terminalWindow}
            />
            <div className="mt-3">
              <div className="label mb-1">Notes</div>
              <textarea
                value={notes}
                onChange={(e) => saveNotes(e.target.value)}
                rows={2}
                placeholder="What happened at the table?"
                className="w-full resize-y rounded border border-rule bg-panel2 px-2 py-1.5 text-[12px] text-ink outline-none placeholder:text-inkfaint focus:border-rule2"
              />
            </div>
          </Panel>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Right: the instrument readouts                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-4">
        <Panel title="Observer prediction">
          <PredictionPanel
            explanation={game.explanation}
            trueMoveNumber={game.trueMoveNumber}
            resetAt={game.resetAt}
          />
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title="Cycle">
            <div className="flex justify-center">
              <CycleRing stage={game.currentStage} size={190} />
            </div>
          </Panel>

          <Panel title="Sets">
            <SetChips realized={game.realized} />
          </Panel>
        </div>

        <Panel title="Threat readout">
          <ThreatReadout reading={game.threats} observerMark={config.observerMark} />
        </Panel>

        <Panel title={`Equations · n = ${game.effectiveN}`}>
          <EquationPanel n={game.effectiveN} />
        </Panel>

        {config.windowEnabled && (
          <Claim tier="axiom" title="Terminal window">
            <p>{TERMINAL_WINDOW.statement}</p>
            <p className="mt-2 text-inkfaint">{TERMINAL_WINDOW.correction}</p>
          </Claim>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}
