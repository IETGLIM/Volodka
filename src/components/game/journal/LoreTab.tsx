import { memo, useCallback, useMemo, useState } from 'react';
import { BookOpen, Lock, MapPin, Link2, Filter } from 'lucide-react';
import { SCENE_CONFIG } from '@/config/scenes';
import { LORE_CATEGORY_META, LORE_RARITY_META } from '@/data/loreEntries';
import { journalTelemetry } from '@/engine/journal/journalTelemetry';
import { DualPaneList } from '@/components/game/journal/DualPaneList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLoreEntries } from '@/store/selectors';
import type { LoreEntry } from '@/store/gameStore';
import type { LoreCategory } from '@/shared/types/lore';
import type { SceneId } from '@/shared/types/game';

interface LoreTabProps {
  searchQuery: string;
}

type CategoryFilter = LoreCategory | 'all';

const CATEGORY_FILTER_OPTIONS: Array<{ value: CategoryFilter; label: string; icon: string }> = [
  { value: 'all', label: 'Все', icon: '📚' },
  { value: 'history', label: 'История', icon: '📜' },
  { value: 'factions', label: 'Фракции', icon: '⚔️' },
  { value: 'technology', label: 'Технологии', icon: '⚙️' },
  { value: 'culture', label: 'Культура', icon: '🎭' },
  { value: 'mysteries', label: 'Тайны', icon: '🔮' },
];

const LoreListRow = memo(function LoreListRow({
  entry,
  isSelected,
  isFocused,
  onSelect,
}: {
  entry: LoreEntry;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (id: string) => void;
}) {
  const sceneConfig = SCENE_CONFIG[entry.sceneId as SceneId];
  const ring = isSelected || isFocused
    ? 'bg-cyan-950/40 border border-cyan-800/40 shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.08)] ring-1 ring-cyan-500/20'
    : 'hover:bg-slate-800/30 border border-transparent';

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      onClick={() => onSelect(entry.id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 ${ring}`}
    >
      <p className={`text-sm font-medium break-words ${isSelected ? 'text-cyan-200' : 'text-slate-300'}`}>
        {entry.title}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
        {LORE_CATEGORY_META[entry.category] && (
          <span className="text-[9px] text-slate-600">
            {LORE_CATEGORY_META[entry.category].icon}{' '}
            {LORE_CATEGORY_META[entry.category].label}
          </span>
        )}
        {entry.rarity !== 'common' && LORE_RARITY_META[entry.rarity] && (
          <span className={`text-[9px] ${LORE_RARITY_META[entry.rarity].color}`}>
            {LORE_RARITY_META[entry.rarity].label}
          </span>
        )}
        {sceneConfig && (
          <span className="text-[10px] text-slate-600 truncate">
            <MapPin className="size-2.5 inline mr-0.5" aria-hidden />
            {sceneConfig.name}
          </span>
        )}
      </div>
    </button>
  );
});

export function LoreTab({ searchQuery }: LoreTabProps) {
  const loreEntries = useLoreEntries();
  const [selectedLore, setSelectedLore] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const discoveredEntries = useMemo(
    () => loreEntries.filter((entry) => entry.discovered),
    [loreEntries],
  );
  const undiscoveredCount = loreEntries.length - discoveredEntries.length;

  // Build a lookup map for related entries navigation.
  const loreById = useMemo(() => {
    const map = new Map<string, LoreEntry>();
    for (const entry of discoveredEntries) {
      map.set(entry.id, entry);
    }
    return map;
  }, [discoveredEntries]);

  const filteredEntries = useMemo(() => {
    let result = discoveredEntries;
    if (categoryFilter !== 'all') {
      result = result.filter((entry) => entry.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (entry) => entry.title.toLowerCase().includes(query) || entry.body.toLowerCase().includes(query),
      );
    }
    return result;
  }, [discoveredEntries, categoryFilter, searchQuery]);

  const handleSelect = useCallback((id: string) => {
    setSelectedLore(id);
    journalTelemetry.track({ action: 'lore_view', itemId: id, tab: 'lore' });
  }, []);

  // Navigate to a related entry — used by the related-entries link list.
  const handleSelectRelated = useCallback((id: string) => {
    if (loreById.has(id)) {
      setSelectedLore(id);
      journalTelemetry.track({ action: 'lore_view', itemId: id, tab: 'lore' });
    }
  }, [loreById]);

  const renderListItem = useCallback(
    (entry: LoreEntry, state: { isSelected: boolean; isFocused: boolean }) => (
      <LoreListRow
        entry={entry}
        isSelected={state.isSelected}
        isFocused={state.isFocused}
        onSelect={handleSelect}
      />
    ),
    [handleSelect],
  );

  const listFooter = undiscoveredCount > 0 ? (
    <div className="pt-2 border-t border-cyan-900/15 mt-2 px-2 pb-2">
      <p className="text-[10px] text-slate-600 uppercase tracking-wider px-1 mb-1.5">
        Не обнаружено ({undiscoveredCount})
      </p>
      {loreEntries.filter((entry) => !entry.discovered).map((entry) => (
        <div key={entry.id} className="flex items-center gap-2 px-1 py-2 opacity-40">
          <Lock className="size-3 text-slate-600" aria-hidden />
          <span className="text-xs text-slate-600">???</span>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <DualPaneList
      items={filteredEntries}
      selectedId={selectedLore}
      onSelect={handleSelect}
      getItemId={(entry) => entry.id}
      listLabel="Записи лора"
      renderListItem={renderListItem}
      listHeader={
        // Category filter — quick toggle between lore categories.
        <div className="px-2 pt-2 pb-1 border-b border-cyan-900/15 mb-1">
          <div className="flex items-center gap-1 mb-1.5 px-1">
            <Filter className="size-3 text-slate-600" aria-hidden />
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Категория</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {CATEGORY_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategoryFilter(option.value)}
                className={`px-2 py-1 rounded text-[10px] transition-colors ${
                  categoryFilter === option.value
                    ? 'bg-cyan-900/50 text-cyan-200 border border-cyan-700/40'
                    : 'bg-slate-800/30 text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>
        </div>
      }
      listFooter={listFooter}
      emptyDetail={(
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BookOpen className="size-10 text-slate-700 mx-auto mb-3" aria-hidden />
            <p className="text-slate-500 text-sm">Выберите запись</p>
            {discoveredEntries.length === 0 && (
              <p className="text-slate-600 text-xs mt-1">Исследуйте мир, чтобы открыть лор</p>
            )}
          </div>
        </div>
      )}
      renderDetail={(entry) => {
        // Resolve related entries — only show discovered ones (locked entries
        // stay hidden so the player doesn't get spoilers).
        const related = (entry.relatedEntries ?? [])
          .map((id) => loreById.get(id))
          .filter((e): e is LoreEntry => e !== undefined);

        return (
          <ScrollArea className="h-full">
            <div className="p-5 font-serif cyber-journal-entry">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <BookOpen className="size-4 text-cyan-400/60" aria-hidden />
                <h3 className="text-lg font-semibold text-cyan-200 break-words">{entry.title}</h3>
                {entry.rarity !== 'common' && LORE_RARITY_META[entry.rarity] && (
                  <span className={`text-[10px] font-medium ${LORE_RARITY_META[entry.rarity].color}`}>
                    {LORE_RARITY_META[entry.rarity].label}
                  </span>
                )}
              </div>
              {LORE_CATEGORY_META[entry.category] && (
                <p className="text-[10px] text-slate-500 mb-2">
                  {LORE_CATEGORY_META[entry.category].icon} {LORE_CATEGORY_META[entry.category].label}
                </p>
              )}
              {SCENE_CONFIG[entry.sceneId as SceneId] && (
                <p className="text-xs text-slate-500 mb-4">
                  <MapPin className="size-3 inline mr-0.5" aria-hidden />
                  {SCENE_CONFIG[entry.sceneId as SceneId].name}
                </p>
              )}
              <div className="h-px bg-gradient-to-r from-cyan-800/30 to-transparent mb-4" />
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line break-words">
                {entry.body}
              </p>

              {/* Related entries — clickable links that navigate the lore network. */}
              {related.length > 0 && (
                <div className="mt-6 pt-4 border-t border-cyan-900/20">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Link2 className="size-3.5 text-cyan-500/60" aria-hidden />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Связанные записи ({related.length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {related.map((rel) => (
                      <button
                        key={rel.id}
                        type="button"
                        onClick={() => handleSelectRelated(rel.id)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-left
                          text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30
                          border border-transparent hover:border-cyan-800/30
                          transition-colors group"
                      >
                        {LORE_CATEGORY_META[rel.category] && (
                          <span className="text-[10px] opacity-60">
                            {LORE_CATEGORY_META[rel.category].icon}
                          </span>
                        )}
                        <span className="flex-1 truncate group-hover:text-cyan-300">{rel.title}</span>
                        {rel.rarity !== 'common' && LORE_RARITY_META[rel.rarity] && (
                          <span className={`text-[9px] ${LORE_RARITY_META[rel.rarity].color} opacity-70`}>
                            {LORE_RARITY_META[rel.rarity].label}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        );
      }}
    />
  );
}
