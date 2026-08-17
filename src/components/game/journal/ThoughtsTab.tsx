/* ─── Volodka RPG – Thoughts Tab (Journal) ─── */
/* Shows the last 15 thought history entries in reverse chronological order
 * with relative timestamps and scene names. */

import { useMemo } from 'react';
import { useThoughtHistory } from '@/store/selectors/uiSelectors';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import type { ThoughtHistoryEntry } from '@/store/shared';

/** Maximum entries shown in the journal panel. */
const VISIBLE_ENTRIES = 15;

/** Format a timestamp into a relative Russian string. */
function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'только что';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

/** Resolve scene name from sceneId. */
function getSceneName(sceneId: string): string {
  const def = (SCENE_DEFINITIONS as Record<string, { name?: string; displayName?: string }>)[sceneId];
  return def?.displayName ?? def?.name ?? sceneId;
}

/** Filter thought entries by search query. */
function filterByQuery(entries: ThoughtHistoryEntry[], query: string): ThoughtHistoryEntry[] {
  if (!query.trim()) return entries;
  const lower = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.text.toLowerCase().includes(lower) ||
      e.sceneId.toLowerCase().includes(lower),
  );
}

export function ThoughtsTab({ searchQuery }: { searchQuery: string }) {
  const thoughtHistory = useThoughtHistory();

  const visibleEntries = useMemo(() => {
    const filtered = filterByQuery(thoughtHistory, searchQuery);
    // Reverse chronological — newest first, capped at VISIBLE_ENTRIES
    return filtered.slice(-VISIBLE_ENTRIES).reverse();
  }, [thoughtHistory, searchQuery]);

  if (visibleEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <div
          className="text-3xl mb-3 opacity-30"
          aria-hidden
          style={{ color: '#a855f7' }}
        >
          💭
        </div>
        <p className="text-sm text-slate-500 font-mono">
          {searchQuery
            ? 'Ничего не найдено по запросу...'
            : 'Мысли пока не записаны. Исследуйте мир — Володька поделится размышлениями.'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto custom-scrollbar-thin px-4 py-3 space-y-2"
      role="list"
      aria-label="История мыслей"
    >
      {visibleEntries.map((entry, idx) => (
        <ThoughtEntryCard key={entry.id} entry={entry} index={idx} />
      ))}
    </div>
  );
}

function ThoughtEntryCard({ entry, index }: { entry: ThoughtHistoryEntry; index: number }) {
  const sceneName = getSceneName(entry.sceneId);
  const relativeTime = formatRelativeTime(entry.timestamp);

  return (
    <div
      role="listitem"
      className="cyber-fade-in-stagger group relative rounded-lg p-3 transition-colors duration-200"
      style={{
        background: 'rgba(88, 28, 135, 0.06)',
        border: '1px solid rgba(168, 85, 247, 0.1)',
        '--stagger-index': index,
      } as React.CSSProperties}
    >
      {/* Purple left accent bar */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ background: 'rgba(168, 85, 247, 0.4)' }}
        aria-hidden
      />

      {/* Meta row: scene + time */}
      <div className="flex items-center justify-between mb-1.5 pl-2">
        <span
          className="text-[10px] font-mono tracking-wider uppercase"
          style={{ color: 'rgba(168, 85, 247, 0.6)' }}
        >
          {sceneName}
        </span>
        <span
          className="text-[9px] font-mono tabular-nums"
          style={{ color: 'rgba(148, 163, 184, 0.5)' }}
        >
          {relativeTime}
        </span>
      </div>

      {/* Thought text */}
      <p
        className="text-xs sm:text-[13px] font-mono leading-relaxed pl-2"
        style={{ color: 'rgba(226, 232, 240, 0.85)' }}
      >
        {entry.text}
      </p>
    </div>
  );
}