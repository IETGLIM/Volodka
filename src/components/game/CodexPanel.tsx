
/* ─── Volodka RPG – Codex Panel (Lore Encyclopedia) ───
   Two-column layout: entry list (2/5) + entry detail (3/5).
   Category tabs with discovery counts, rarity badges,
   typewriter effect for entry body, related entries links,
   progress bar, and PanelWrapper integration.
*/

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked, BookOpen, Search, Lock, MapPin,
  ChevronRight, Star, Link2,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { LoreEntry, LoreCategory, LoreRarity } from '@/store/gameStore';
import { INITIAL_LORE_ENTRIES, LORE_CATEGORY_META, LORE_RARITY_META } from '@/data/loreEntries';
import { SCENE_CONFIG } from '@/config/scenes';
import { PanelWrapper } from './PanelWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { SceneId } from '@/shared/types/game';

/* ─── Types ─── */

interface CodexPanelProps {
  open: boolean;
  onClose: () => void;
}

type FilterMode = 'all' | 'discovered' | 'undiscovered';

/* ─── Helpers ─── */

function getSceneName(sceneId: string): string {
  const config = SCENE_CONFIG[sceneId as SceneId];
  return config?.name ?? sceneId;
}

/* ─── Typewriter Hook ─── */

function useTypewriter(text: string, speed = 18, enabled = true) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      // Defer to avoid synchronous setState in effect
      const t = setTimeout(() => setDisplayed(text), 0);
      return () => clearTimeout(t);
    }
    const t0 = setTimeout(() => setDisplayed(''), 0);
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);
    return () => {
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, [text, speed, enabled]);

  return displayed;
}

/* ─── Rarity Badge ─── */

function RarityBadge({ rarity }: { rarity: LoreRarity }) {
  const meta = LORE_RARITY_META[rarity];
  if (!meta) return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded ${meta.color}`}
      style={{ textShadow: meta.glow || 'none' }}
    >
      <Star className="size-2.5" />
      {meta.label}
    </span>
  );
}

/* ─── Entry List Item ─── */

function EntryListItem({
  entry,
  isSelected,
  onClick,
}: {
  entry: LoreEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  const rarityColor = entry.rarity === 'legendary'
    ? 'border-amber-500/20'
    : entry.rarity === 'rare'
      ? 'border-cyan-500/20'
      : entry.rarity === 'uncommon'
        ? 'border-emerald-500/20'
        : 'border-transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'border-amber-700/40 bg-amber-950/20'
          : `border-transparent hover:border-slate-700/30 hover:bg-slate-800/30 ${rarityColor}`
      }`}
    >
      <div className="flex items-center gap-2">
        {entry.discovered ? (
          <BookOpen className="size-3.5 text-amber-400/60 shrink-0" />
        ) : (
          <Lock className="size-3.5 text-slate-600 shrink-0" />
        )}
        <span
          className={`text-xs font-medium truncate flex-1 ${
            entry.discovered ? 'text-slate-200' : 'text-slate-600 italic'
          }`}
        >
          {entry.discovered ? entry.title : '???'}
        </span>
        {entry.discovered && entry.rarity !== 'common' && (
          <RarityBadge rarity={entry.rarity} />
        )}
        {isSelected && (
          <ChevronRight className="size-3 text-amber-400/50 ml-auto shrink-0" />
        )}
      </div>
    </button>
  );
}

/* ─── Entry Detail ─── */

function EntryDetail({
  entry,
  allEntries,
  onSelectRelated,
}: {
  entry: LoreEntry;
  allEntries: LoreEntry[];
  onSelectRelated: (id: string) => void;
}) {
  const [showFull, setShowFull] = useState(false);

  // Reset showFull when entry changes (deferred to avoid sync setState)
  useEffect(() => {
    const t = setTimeout(() => setShowFull(false), 0);
    return () => clearTimeout(t);
  }, [entry.id]);

  const displayedBody = useTypewriter(entry.body, 16, !showFull);

  if (!entry.discovered) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock className="size-10 text-slate-700 mb-3 mx-auto" />
        </motion.div>
        <p
          className="text-sm text-slate-600 italic"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Запись ещё не обнаружена
        </p>
        <p className="text-[10px] text-slate-700 mt-1">
          Исследуйте мир, чтобы открыть эту запись
        </p>
        {entry.discoveryCondition && (
          <p className="text-[10px] text-amber-500/50 mt-2">
            Условие: {entry.discoveryCondition}
          </p>
        )}
      </div>
    );
  }

  const relatedEntries = (entry.relatedEntries ?? [])
    .map((id) => allEntries.find((e) => e.id === id))
    .filter(Boolean) as LoreEntry[];

  const categoryMeta = LORE_CATEGORY_META[entry.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-4"
    >
      {/* Title + Rarity */}
      <div className="flex items-start gap-2 mb-3">
        <h3
          className="text-base font-semibold text-slate-100 leading-tight flex-1"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {entry.title}
        </h3>
        <RarityBadge rarity={entry.rarity} />
      </div>

      {/* Meta tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categoryMeta && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md border border-amber-800/30 bg-amber-950/20 text-amber-400/70">
            {categoryMeta.icon} {categoryMeta.label}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md border border-slate-700/30 bg-slate-800/30 text-slate-400">
          <MapPin className="size-2.5" />
          {getSceneName(entry.sceneId)}
        </span>
      </div>

      {/* Body with typewriter effect */}
      <div
        className="text-sm text-slate-300 leading-relaxed whitespace-pre-line"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {displayedBody}
      </div>

      {/* Skip typewriter button */}
      {displayedBody.length < entry.body.length && (
        <button
          type="button"
          onClick={() => setShowFull(true)}
          className="mt-2 text-[10px] text-amber-400/60 hover:text-amber-400/90 transition-colors"
        >
          Пропустить ▸
        </button>
      )}

      {/* Related entries */}
      {relatedEntries.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-2">
            <Link2 className="size-3" />
            Связанные записи
          </div>
          <div className="flex flex-wrap gap-1.5">
            {relatedEntries.map((related) => (
              <button
                key={related.id}
                type="button"
                onClick={() => onSelectRelated(related.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border transition-colors duration-150 ${
                  related.discovered
                    ? 'border-amber-700/30 bg-amber-950/10 text-amber-300/70 hover:bg-amber-950/20 hover:text-amber-300'
                    : 'border-slate-700/30 bg-slate-800/10 text-slate-600 italic'
                }`}
              >
                {related.discovered ? (
                  <BookOpen className="size-2.5" />
                ) : (
                  <Lock className="size-2.5" />
                )}
                {related.discovered ? related.title : '???'}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Component ─── */

export function CodexPanel({ open, onClose }: CodexPanelProps) {
  const storeLoreEntries = useGameStore((s) => s.loreEntries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [activeCategory, setActiveCategory] = useState<LoreCategory | 'all'>('all');

  // Merge INITIAL_LORE_ENTRIES with store entries (store entries take precedence)
  const allEntries = useMemo(() => {
    const storeMap = new Map<string, LoreEntry>();
    for (const entry of storeLoreEntries) {
      storeMap.set(entry.id, entry);
    }
    return INITIAL_LORE_ENTRIES.map((initial) => {
      const storeEntry = storeMap.get(initial.id);
      return storeEntry ?? initial;
    });
  }, [storeLoreEntries]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; discovered: number }> = {};
    for (const cat of Object.keys(LORE_CATEGORY_META)) {
      counts[cat] = { total: 0, discovered: 0 };
    }
    for (const entry of allEntries) {
      if (!counts[entry.category]) {
        counts[entry.category] = { total: 0, discovered: 0 };
      }
      counts[entry.category].total += 1;
      if (entry.discovered) counts[entry.category].discovered += 1;
    }
    return counts;
  }, [allEntries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let result = allEntries;

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter((e) => e.category === activeCategory);
    }

    // Discovery filter
    if (filterMode === 'discovered') {
      result = result.filter((e) => e.discovered);
    } else if (filterMode === 'undiscovered') {
      result = result.filter((e) => !e.discovered);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e.discovered && e.title.toLowerCase().includes(q)) ||
          (e.discovered && e.body.toLowerCase().includes(q)),
      );
    }

    // Sort: discovered first, then by rarity
    const rarityOrder: Record<string, number> = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
    result = [...result].sort((a, b) => {
      if (a.discovered !== b.discovered) return a.discovered ? -1 : 1;
      return (rarityOrder[a.rarity] ?? 3) - (rarityOrder[b.rarity] ?? 3);
    });

    return result;
  }, [allEntries, activeCategory, filterMode, searchQuery]);

  const discoveredCount = allEntries.filter((e) => e.discovered).length;
  const totalCount = allEntries.length;
  const discoveredPct = totalCount > 0 ? Math.round((discoveredCount / totalCount) * 100) : 0;

  const selectedEntry = allEntries.find((e) => e.id === selectedId) ?? null;

  // Handle related entry selection
  const handleSelectRelated = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Auto-select first entry when category/filter changes (deferred to avoid sync setState)
  useEffect(() => {
    const t = setTimeout(() => {
      if (filteredEntries.length > 0) {
        const firstId = filteredEntries[0].id;
        setSelectedId((prev) => (prev === firstId ? prev : firstId));
      } else {
        setSelectedId(null);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [activeCategory, filterMode, filteredEntries]);

  // Footer for PanelWrapper
  const footer = (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-slate-600 font-mono">
        volodka://codex
      </span>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-500 font-mono">
          {discoveredCount}/{totalCount} записей
        </span>
        <span className="text-[10px] text-amber-400/60 font-mono">
          {discoveredPct}%
        </span>
      </div>
    </div>
  );

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title="Кодекс"
      accentColor="amber"
      layout="sidebar"
      icon={<BookMarked className="size-5 text-amber-400" />}
      shortcutLabel="K"
      urlPath="volodka://codex"
      footer={footer}
    >
      <div className="flex flex-col h-full">
        {/* Search + Filter bar */}
        <div className="px-4 py-2 border-b border-slate-800/40 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/30 bg-slate-900/40">
            <Search className="size-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-[10px] ${filterMode === 'all' ? 'text-amber-400 bg-amber-950/20' : 'text-slate-500'}`}
              onClick={() => setFilterMode('all')}
            >
              Все
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-[10px] ${filterMode === 'discovered' ? 'text-emerald-400 bg-emerald-950/20' : 'text-slate-500'}`}
              onClick={() => setFilterMode('discovered')}
            >
              Открытые
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-[10px] ${filterMode === 'undiscovered' ? 'text-rose-400 bg-rose-950/20' : 'text-slate-500'}`}
              onClick={() => setFilterMode('undiscovered')}
            >
              <Lock className="size-3 mr-1" />
              Скрытые
            </Button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-4 py-2 border-b border-slate-800/40 flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors duration-150 ${
              activeCategory === 'all'
                ? 'bg-amber-950/30 text-amber-400 border border-amber-700/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            Все ({discoveredCount}/{totalCount})
          </button>
          {Object.entries(LORE_CATEGORY_META).map(([key, meta]) => {
            const counts = categoryCounts[key];
            if (!counts) return null;
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key as LoreCategory)}
                className={`shrink-0 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors duration-150 flex items-center gap-1 ${
                  isActive
                    ? 'bg-amber-950/30 text-amber-400 border border-amber-700/30'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="text-[8px] opacity-60">({counts.discovered}/{counts.total})</span>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="px-4 py-1.5 border-b border-slate-800/40">
          <div className="h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-600/70 to-amber-400/70"
              initial={false}
              animate={{ width: `${totalCount > 0 ? (discoveredCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                boxShadow: '0 0 6px rgba(251,191,36,0.3)',
              }}
            />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Entry list (2/5) */}
          <div className="w-2/5 border-r border-slate-800/30">
            <ScrollArea className="h-full">
              <div className="p-2 flex flex-col gap-1">
                {filteredEntries.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-8">
                    Ничего не найдено
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <EntryListItem
                      key={entry.id}
                      entry={entry}
                      isSelected={selectedId === entry.id}
                      onClick={() => setSelectedId(entry.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Entry detail (3/5) */}
          <div className="w-3/5">
            <ScrollArea className="h-full">
              {selectedEntry ? (
                <EntryDetail
                  entry={selectedEntry}
                  allEntries={allEntries}
                  onSelectRelated={handleSelectRelated}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <BookOpen className="size-10 text-slate-700 mb-3" />
                  <p
                    className="text-sm text-slate-500"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    Выберите запись
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}
