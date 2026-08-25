/**
 * The archive: every game the instrument has recorded, in localStorage.
 *
 * Lived games and simulated games share one shape so the aggregate view can
 * put them on the same axes — seeing where real data sits inside the
 * possibility space is the point of the app.
 */

import { useCallback, useEffect, useState } from 'react';
import type { GameRecord } from '../engine/runner';

const KEY = 'observer-collapse.archive.v1';

export function loadArchive(): GameRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GameRecord[]) : [];
  } catch {
    // A corrupt archive should not brick the app; start fresh in memory and
    // leave the bad payload on disk for the user to inspect.
    return [];
  }
}

function persist(records: GameRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // Quota exceeded — silently keep the in-memory copy.
  }
}

export function useArchive() {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRecords(loadArchive());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) persist(records);
  }, [records, loaded]);

  const append = useCallback((game: GameRecord) => {
    setRecords((prev) => [game, ...prev]);
  }, []);

  const appendMany = useCallback((games: GameRecord[]) => {
    setRecords((prev) => [...games, ...prev]);
  }, []);

  const remove = useCallback((id: string) => {
    setRecords((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const setNotes = useCallback((id: string, notes: string) => {
    setRecords((prev) => prev.map((g) => (g.id === id ? { ...g, notes } : g)));
  }, []);

  const clear = useCallback(() => setRecords([]), []);

  return { records, loaded, append, appendMany, remove, setNotes, clear };
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export function toJson(records: readonly GameRecord[]): string {
  return JSON.stringify(records, null, 2);
}

const CSV_COLUMNS = [
  'id',
  'timestamp',
  'iso',
  'source',
  'observerMark',
  'opponent',
  'rule',
  'sequence',
  'endMove',
  'terminalSquare',
  'winner',
  'outcome',
  'squareSum',
  'digitalRoot',
  'stage1',
  'stage3',
  'stage6',
  'stage9',
  'declinedWins',
  'interference',
  'notes',
] as const;

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(records: readonly GameRecord[]): string {
  const rows = records.map((g) =>
    [
      g.id,
      g.timestamp,
      new Date(g.timestamp).toISOString(),
      g.source,
      g.observerMark,
      g.opponent,
      g.rule,
      g.sequence.join('-'),
      g.endMove,
      g.terminalSquare,
      g.winner ?? 'draw',
      g.outcome,
      g.squareSum,
      g.digitalRoot,
      g.stagePartition[1].join(' '),
      g.stagePartition[3].join(' '),
      g.stagePartition[6].join(' '),
      g.stagePartition[9].join(' '),
      g.declinedWins.join(' '),
      g.interference.map((i) => `${i.model}@${i.move}:${i.predicted}→${i.played}`).join(' '),
      g.notes ?? '',
    ]
      .map(csvCell)
      .join(','),
  );

  return [CSV_COLUMNS.join(','), ...rows].join('\n');
}

export function download(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
