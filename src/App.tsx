import { useState } from 'react';
import { useArchive } from './state/archive';
import type { Summary } from './engine/summary';
import { LiveMode } from './pages/LiveMode';
import { LabMode } from './pages/LabMode';
import { ReconstructPage } from './pages/Reconstruct';
import { ArchivePage } from './pages/Archive';
import { AboutPage } from './pages/About';
import { HISTORICAL_SIGIL } from './data/known-results';

const TABS = [
  { id: 'live', label: 'Live' },
  { id: 'lab', label: 'Lab' },
  { id: 'reconstruct', label: 'Reconstruct' },
  { id: 'archive', label: 'Archive' },
  { id: 'about', label: 'What this is' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const [tab, setTab] = useState<TabId>('live');
  const archive = useArchive();
  // Held at the top so the Archive page can compare lived games against the
  // most recent simulated baseline without re-running it.
  const [labSummaries, setLabSummaries] = useState<Summary[]>([]);

  return (
    <div className="chassis flex min-h-full flex-col bg-void">
      <header className="sticky top-0 z-20 border-b border-rule bg-void/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-sm uppercase tracking-[0.22em] text-realized">Observer Collapse</h1>
            <span className="hidden text-[11px] text-inkfaint sm:inline">
              a tic-tac-toe laboratory
            </span>
          </div>

          <nav className="flex flex-1 flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                  tab === t.id
                    ? 'bg-realized/15 text-realized'
                    : 'text-inkdim hover:bg-panel hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <span className="tnum text-[11px] text-inkfaint">
            {archive.records.length} game{archive.records.length === 1 ? '' : 's'} logged
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5">
        {tab === 'live' && <LiveMode archive={archive} />}
        {tab === 'lab' && (
          <LabMode archive={archive} summaries={labSummaries} setSummaries={setLabSummaries} />
        )}
        {tab === 'reconstruct' && <ReconstructPage />}
        {tab === 'archive' && <ArchivePage archive={archive} labSummaries={labSummaries} />}
        {tab === 'about' && <AboutPage />}
      </main>

      <footer className="border-t border-rule px-4 py-3">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 text-[10px] text-inkfaint">
          <span>
            A designed symbolic system and an instrument for exploring it. It does not describe
            physics and does not outperform optimal play.
          </span>
          <span className="tnum" title="Historical notation — not a well-formed equation.">
            {HISTORICAL_SIGIL} · historical
          </span>
        </div>
      </footer>
    </div>
  );
}
