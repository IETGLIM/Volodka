import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, FileText, MapPin, ScrollText } from 'lucide-react';
import { SCENE_CONFIG } from '@/config/scenes';
import { getStoryNodes, isNarrativeGameDataLoaded, ensureNarrativeNodeIds } from '@/data/gameDataLoader';
import {
  buildJournalNotes,
  filterJournalNotes,
  logNotesLoadFailure,
  type JournalNote,
} from '@/engine/journal/journalNotesPresentation';
import { journalTelemetry } from '@/engine/journal/journalTelemetry';
import { DualPaneList } from '@/components/game/journal/DualPaneList';
import { formatJournalNoteTime } from '@/components/game/journal/useJournalListNavigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVisitedNodeTimestamps, useVisitedNodes } from '@/store/selectors';
import type { SceneId } from '@/shared/types/game';

interface NotesTabProps {
  searchQuery: string;
}

const NoteListRow = memo(function NoteListRow({
  note,
  isSelected,
  isFocused,
  onSelect,
}: {
  note: JournalNote;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (id: string) => void;
}) {
  const sceneConfig = SCENE_CONFIG[note.sceneId as SceneId];
  const ring = isSelected || isFocused
    ? 'bg-cyan-950/40 border border-cyan-800/40 shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.08)] ring-1 ring-cyan-500/20'
    : 'hover:bg-slate-800/30 border border-transparent';

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      onClick={() => onSelect(note.id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 ${ring}`}
    >
      <p className={`text-xs font-medium truncate break-words ${isSelected ? 'text-cyan-200' : 'text-slate-300'}`}>
        {note.text.slice(0, 60)}{note.text.length > 60 ? '...' : ''}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {sceneConfig && (
          <span className="text-[10px] text-slate-600 truncate">
            <MapPin className="size-2.5 inline mr-0.5" aria-hidden />
            {sceneConfig.name}
          </span>
        )}
        <span className="text-[10px] text-slate-700 ml-auto shrink-0">
          <Clock className="size-2.5 inline mr-0.5" aria-hidden />
          {formatJournalNoteTime(note.timestamp)}
        </span>
      </div>
    </button>
  );
});

export function NotesTab({ searchQuery }: NotesTabProps) {
  const visitedNodes = useVisitedNodes();
  const timestamps = useVisitedNodeTimestamps();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [notesVersion, setNotesVersion] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isNarrativeGameDataLoaded() || visitedNodes.length === 0) return;
    let cancelled = false;
    void ensureNarrativeNodeIds(visitedNodes)
      .then(() => {
        if (!cancelled) {
          setLoadError(false);
          setNotesVersion((version) => version + 1);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(true);
          logNotesLoadFailure(error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [visitedNodes]);

  const discoveredNotes = useMemo(() => {
    if (!isNarrativeGameDataLoaded()) return [];
    return buildJournalNotes(visitedNodes, timestamps, getStoryNodes());
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [visitedNodes, timestamps, notesVersion]);

  const filteredNotes = useMemo(
    () => filterJournalNotes(discoveredNotes, searchQuery),
    [discoveredNotes, searchQuery],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedNodeId(id);
    journalTelemetry.track({ action: 'note_view', itemId: id, tab: 'notes' });
  }, []);

  const renderListItem = useCallback(
    (note: JournalNote, state: { isSelected: boolean; isFocused: boolean }) => (
      <NoteListRow
        note={note}
        isSelected={state.isSelected}
        isFocused={state.isFocused}
        onSelect={handleSelect}
      />
    ),
    [handleSelect],
  );

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
        <ScrollText className="size-12 text-rose-700/70 mb-4" aria-hidden />
        <p className="text-slate-400 text-sm mb-1">Не удалось загрузить записи</p>
        <p className="text-slate-600 text-xs break-words">Попробуйте закрыть и снова открыть журнал</p>
      </div>
    );
  }

  if (discoveredNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <ScrollText className="size-12 text-slate-700 mb-4" aria-hidden />
        <p className="text-slate-500 text-sm mb-1">Нет записей</p>
        <p className="text-slate-600 text-xs">Исследуйте мир, чтобы записи появились здесь</p>
      </div>
    );
  }

  return (
    <DualPaneList
      items={filteredNotes}
      selectedId={selectedNodeId}
      onSelect={handleSelect}
      getItemId={(note) => note.id}
      listLabel="Записи журнала"
      renderListItem={renderListItem}
      emptyList={<p className="text-center text-slate-600 text-xs py-4">Ничего не найдено</p>}
      emptyDetail={(
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileText className="size-10 text-slate-700 mx-auto mb-3" aria-hidden />
            <p className="text-slate-500 text-sm">Выберите запись</p>
          </div>
        </div>
      )}
      renderDetail={(note) => (
        <ScrollArea className="h-full">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="size-4 text-cyan-400/60" aria-hidden />
              <h3 className="text-sm font-semibold text-cyan-200 break-words">{note.id.replace(/_/g, ' ')}</h3>
            </div>
            {SCENE_CONFIG[note.sceneId as SceneId] && (
              <p className="text-xs text-slate-500 mb-4">
                <MapPin className="size-3 inline mr-0.5" aria-hidden />
                {SCENE_CONFIG[note.sceneId as SceneId].name}
              </p>
            )}
            <div className="h-px bg-gradient-to-r from-cyan-800/30 to-transparent mb-4" />
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line break-words">
              {note.text}
            </p>
            {note.speaker && (
              <div className="mt-4 px-3 py-2 rounded-lg bg-slate-900/30 border border-cyan-900/20">
                <p className="text-xs text-cyan-400/60">
                  Говорил: <span className="text-slate-300">{note.speaker}</span>
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    />
  );
}
