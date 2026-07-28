
/* ─── Volodka RPG – AAA+ Journal/Codex Panel (v2) ───
   Full-screen overlay with tabs: Записи (Notes), Навыки (Skills), Стихи (Poems), Лор (Lore).
   Dark glass-morphism, cyberpunk borders, search/filter, framer-motion animations.
*/

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePanelExitComplete } from '@/components/game/orchestrator/usePanelExitComplete';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  X,
  BookOpen,
  Feather,
  Swords,
  Clock,
  Sparkles,
  Eye,
  MapPin,
  Search,
  ScrollText,
  Zap,
  Lock,
  ChevronLeft,
  FileText,
} from 'lucide-react';
import type { JournalTab } from '@/store/gameStore';
import {
  useAddLoreEntry,
  useCollectedPoems,
  useJournalShell,
  useLoreEntries,
  usePlayerState,
  useSetJournalOpen,
  useSetJournalTab,
  useVisitedNodes,
} from '@/store/selectors';
import { POEMS, getMainPoems, getHiddenPoems } from '@/data/poems';
import { getPoemPower, canUsePower, activatePoemPowerById, getCooldownRemaining } from '@/engine/PoemPowerSystem';
import { SCENE_CONFIG } from '@/config/scenes';
import { getStoryNodes, isNarrativeGameDataLoaded, ensureNarrativeNodeIds } from '@/data/gameDataLoader';
import { devWarn } from '@/shared/utils/devLog';
import { audioEngine } from '@/engine/AudioEngine';
import { INITIAL_LORE_ENTRIES } from '@/data/loreEntries';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import type { SceneId } from '@/shared/types/game';

/* ── Tab config ── */
const TABS: { id: JournalTab; label: string; icon: typeof FileText }[] = [
  { id: 'notes', label: 'Записи', icon: FileText },
  { id: 'skills', label: 'Навыки', icon: Swords },
  { id: 'poems', label: 'Стихи', icon: Feather },
  { id: 'lore', label: 'Лор', icon: BookOpen },
];

/* ── Skill labels ── */
const SKILL_LABELS: Record<TrainablePlayerSkill, { name: string; color: string; description: string }> = {
  logic: { name: 'Логика', color: 'from-cyan-600 to-cyan-400', description: 'Аналитическое мышление, решение головоломок' },
  coding: { name: 'Кодинг', color: 'from-emerald-600 to-emerald-400', description: 'Программирование, работа с терминалами' },
  empathy: { name: 'Эмпатия', color: 'from-rose-600 to-rose-400', description: 'Понимание чужих чувств, поддержка' },
  persuasion: { name: 'Убеждение', color: 'from-amber-600 to-amber-400', description: 'Дипломатия, переговоры, влияние' },
  intuition: { name: 'Интуиция', color: 'from-purple-600 to-purple-400', description: 'Чутьё на скрытое, предчувствие' },
  writing: { name: 'Письмо', color: 'from-pink-600 to-pink-400', description: 'Сила поэтического слова, творчество' },
  rhythm: { name: 'Ритм', color: 'from-orange-600 to-orange-400', description: 'Музыкальность, чувство ритма, координация' },
};

/* ── Theme tag colors ── */
const THEME_COLORS: Record<string, string> = {
  смерть: 'bg-slate-800/60 text-slate-300 border-slate-600/40',
  любовь: 'bg-rose-950/50 text-rose-300 border-rose-700/30',
  отчаяние: 'bg-violet-950/50 text-violet-300 border-violet-700/30',
  надежда: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
  коррупция: 'bg-red-950/50 text-red-300 border-red-700/30',
  память: 'bg-cyan-950/50 text-cyan-300 border-cyan-700/30',
  культура: 'bg-indigo-950/50 text-indigo-300 border-indigo-700/30',
  путь: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
  душа: 'bg-purple-950/50 text-purple-300 border-purple-700/30',
  судьба: 'bg-teal-950/50 text-teal-300 border-teal-700/30',
  одиночество: 'bg-gray-950/50 text-gray-300 border-gray-700/30',
  рождество: 'bg-green-950/50 text-green-300 border-green-700/30',
  дружба: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
  море: 'bg-sky-950/50 text-sky-300 border-sky-700/30',
  поэзия: 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-700/30',
  ирония: 'bg-orange-950/50 text-orange-300 border-orange-700/30',
  детство: 'bg-lime-950/50 text-lime-300 border-lime-700/30',
  творчество: 'bg-pink-950/50 text-pink-300 border-pink-700/30',
  космос: 'bg-blue-950/50 text-blue-300 border-blue-700/30',
  город: 'bg-zinc-950/50 text-zinc-300 border-zinc-700/30',
  вечность: 'bg-stone-950/50 text-stone-300 border-stone-700/30',
  звёзды: 'bg-yellow-950/50 text-yellow-300 border-yellow-700/30',
  мечта: 'bg-sky-950/50 text-sky-300 border-sky-700/30',
  прощание: 'bg-rose-950/50 text-rose-300 border-rose-700/30',
  добро: 'bg-amber-950/50 text-amber-300 border-amber-700/30',
  клевета: 'bg-red-950/50 text-red-300 border-red-700/30',
  прощение: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
  семья: 'bg-orange-950/50 text-orange-300 border-orange-700/30',
  шут: 'bg-orange-950/50 text-orange-300 border-orange-700/30',
  лицемерие: 'bg-red-950/50 text-red-300 border-red-700/30',
  разрушение: 'bg-red-950/50 text-red-300 border-red-700/30',
  альтруизм: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/30',
};

/* ══════════════════════════════════════════════════════════════
   NOTES TAB — Discovered story nodes with timestamps
   ══════════════════════════════════════════════════════════════ */
function NotesTab({ searchQuery }: { searchQuery: string }) {
  const visitedNodes = useVisitedNodes();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [notesVersion, setNotesVersion] = useState(0);

  useEffect(() => {
    if (!isNarrativeGameDataLoaded() || visitedNodes.length === 0) return;
    let cancelled = false;
    void ensureNarrativeNodeIds(visitedNodes)
      .then(() => {
        if (!cancelled) setNotesVersion((v) => v + 1);
      })
      .catch((err) => {
        devWarn('[JournalPanel] Failed to preload visited narrative nodes:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [visitedNodes]);

  // Build notes from visited story nodes
  const discoveredNotes = useMemo(() => {
    void notesVersion; // invalidate when notes pack hot-reloads
    const storyNodes = isNarrativeGameDataLoaded() ? getStoryNodes() : {};
    const notes: { id: string; text: string; speaker?: string; sceneId: string; timestamp: number }[] = [];
    for (const nodeId of visitedNodes) {
      const node = storyNodes[nodeId];
      if (node) {
        notes.push({
          id: nodeId,
          text: node.text,
          speaker: node.speaker,
          sceneId: node.sceneId,
          timestamp: Date.now() - Math.random() * 3600000, // Simulated timestamp
        });
      }
    }
    return notes.sort((a, b) => b.timestamp - a.timestamp);
  }, [visitedNodes, notesVersion]);

  // Filter by search
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return discoveredNotes;
    const q = searchQuery.toLowerCase();
    return discoveredNotes.filter(
      (n) =>
        n.text.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q) ||
        (n.speaker ?? '').toLowerCase().includes(q),
    );
  }, [discoveredNotes, searchQuery]);

  const selectedNote = filteredNotes.find((n) => n.id === selectedNodeId);

  if (discoveredNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <ScrollText className="size-12 text-slate-700 mb-4" />
        <p className="text-slate-500 text-sm mb-1">Нет записей</p>
        <p className="text-slate-600 text-xs">Исследуйте мир, чтобы записи появились здесь</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Notes list */}
      <div className="w-2/5 min-w-[160px] border-r border-cyan-900/20">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {filteredNotes.map((note) => {
              const sceneConfig = SCENE_CONFIG[note.sceneId as SceneId];
              const isSelected = selectedNodeId === note.id;
              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedNodeId(note.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isSelected
                      ? 'bg-cyan-950/40 border border-cyan-800/40 shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.08)]'
                      : 'hover:bg-slate-800/30 border border-transparent'
                  }`}
                >
                  <p className={`text-xs font-medium truncate ${isSelected ? 'text-cyan-200' : 'text-slate-300'}`}>
                    {note.text.slice(0, 60)}{note.text.length > 60 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {sceneConfig && (
                      <span className="text-[10px] text-slate-600">
                        <MapPin className="size-2.5 inline mr-0.5" />
                        {sceneConfig.name}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-700 ml-auto">
                      <Clock className="size-2.5 inline mr-0.5" />
                      {new Date(note.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredNotes.length === 0 && (
              <p className="text-center text-slate-600 text-xs py-4">Ничего не найдено</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Note detail */}
      <div className="flex-1 min-w-0">
        {selectedNote ? (
          <ScrollArea className="h-full">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="size-4 text-cyan-400/60" />
                <h3 className="text-sm font-semibold text-cyan-200">{selectedNote.id.replace(/_/g, ' ')}</h3>
              </div>
              {SCENE_CONFIG[selectedNote.sceneId as SceneId] && (
                <p className="text-xs text-slate-500 mb-4">
                  <MapPin className="size-3 inline mr-0.5" />
                  {SCENE_CONFIG[selectedNote.sceneId as SceneId].name}
                </p>
              )}
              <div className="h-px bg-gradient-to-r from-cyan-800/30 to-transparent mb-4" />
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedNote.text}
              </p>
              {selectedNote.speaker && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-slate-900/30 border border-cyan-900/20">
                  <p className="text-xs text-cyan-400/60">
                    Говорил: <span className="text-slate-300">{selectedNote.speaker}</span>
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="size-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Выберите запись</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SKILLS TAB
   ══════════════════════════════════════════════════════════════ */
function SkillsTab({ searchQuery }: { searchQuery: string }) {
  const playerState = usePlayerState();
  const { skills, progression } = playerState;

  const filteredSkills = useMemo(() => {
    const entries = Object.entries(skills) as [TrainablePlayerSkill, number][];
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(([skill]) => SKILL_LABELS[skill].name.toLowerCase().includes(q) || SKILL_LABELS[skill].description.toLowerCase().includes(q));
  }, [skills, searchQuery]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Progression header */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/40 border border-cyan-900/25 shadow-[inset_0_1px_0_rgb(var(--cyber-cyan-rgb) / 0.05)]">
          <div>
            <p className="text-sm text-slate-200 font-medium">Уровень {progression.level}</p>
            <p className="text-xs text-slate-500">
              {progression.xp} / {progression.xpToNextLevel} XP
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-cyan-400/80">
              {progression.skillPoints} очков навыков
            </p>
          </div>
        </div>

        {/* XP bar */}
        <div className="px-4">
          <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.3)]"
              style={{ width: `${(progression.xp / progression.xpToNextLevel) * 100}%` }}
            />
          </div>
        </div>

        {/* Skills list */}
        <div className="space-y-3">
          {filteredSkills.map(([skill, value]) => {
            const info = SKILL_LABELS[skill];
            return (
              <div key={skill} className="px-4 py-3.5 rounded-xl bg-slate-900/30 border border-cyan-900/15 hover:border-cyan-800/30 transition-colors shadow-[inset_0_1px_0_rgb(var(--cyber-cyan-rgb) / 0.03)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`size-2.5 rounded-full bg-gradient-to-r ${info.color} shadow-[0_0_6px_currentColor]`} />
                    <span className="text-sm text-slate-200 font-medium">{info.name}</span>
                  </div>
                  <span className="text-sm font-mono text-cyan-300">{value}</span>
                </div>
                <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden mb-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                  <div
                    className={`h-full bg-gradient-to-r ${info.color} rounded-full transition-all duration-500 shadow-[0_0_6px_rgb(var(--cyber-cyan-rgb) / 0.2)]`}
                    style={{ width: `${Math.min((value / 50) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-600">{info.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

/* ══════════════════════════════════════════════════════════════
   POEMS TAB
   ══════════════════════════════════════════════════════════════ */
function PoemsTab({ searchQuery }: { searchQuery: string }) {
  const collectedPoems = useCollectedPoems();
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);

  const mainPoems = getMainPoems();
  const hiddenPoems = getHiddenPoems();
  const collectedCount = collectedPoems.length;

  const selectedPoem = POEMS.find((p) => p.id === selectedPoemId);
  const power = selectedPoemId ? getPoemPower(selectedPoemId) : undefined;

  const [activating, setActivating] = useState(false);
  const [justUsed, setJustUsed] = useState(false);

  const handleActivate = useCallback(() => {
    if (!selectedPoemId || !power) return;
    const available = canUsePower(selectedPoemId);
    if (!available || activating) return;

    setActivating(true);
    const success = activatePoemPowerById(selectedPoemId);
    if (success) {
      audioEngine.playSfx('quest_complete');
      setJustUsed(true);
      setTimeout(() => setJustUsed(false), 2000);
    }
    setActivating(false);
  }, [selectedPoemId, power, activating]);

  // Filter poems by search
  const filteredMain = useMemo(() => {
    if (!searchQuery.trim()) return mainPoems;
    const q = searchQuery.toLowerCase();
    return mainPoems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.themes.some((t) => t.toLowerCase().includes(q)),
    );
  }, [mainPoems, searchQuery]);

  const filteredHidden = useMemo(() => {
    if (!searchQuery.trim()) return hiddenPoems;
    const q = searchQuery.toLowerCase();
    return hiddenPoems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.themes.some((t) => t.toLowerCase().includes(q)),
    );
  }, [hiddenPoems, searchQuery]);

  if (selectedPoem) {
    // Poem detail view
    const available = canUsePower(selectedPoem.id);
    const cooldownMs = getCooldownRemaining(selectedPoem.id);
    const cooldownSec = Math.ceil(cooldownMs / 1000);
    const onCooldown = cooldownMs > 0;

    return (
      <div className="h-full flex flex-col">
        <button
          onClick={() => setSelectedPoemId(null)}
          className="flex items-center gap-1.5 text-xs text-cyan-400/70 hover:text-cyan-300 px-5 py-3 transition-colors shrink-0"
        >
          <ChevronLeft className="size-3.5" />
          Назад к списку
        </button>

        <ScrollArea className="flex-1">
          <div className="px-5 pb-5">
            {/* Title */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-amber-200/90 mb-1 font-serif">
                {selectedPoem.title}
              </h3>
              <p className="text-xs text-slate-500">{selectedPoem.author}</p>
            </div>

            {/* Themes */}
            {selectedPoem.themes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {selectedPoem.themes.map((theme) => (
                  <span
                    key={theme}
                    className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${
                      THEME_COLORS[theme] ?? 'bg-slate-800/60 text-slate-300 border-slate-600/40'
                    }`}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            )}

            {/* Intro */}
            {selectedPoem.intro && (
              <div className="mb-4 px-3 py-2.5 rounded-lg border border-cyan-900/20 bg-slate-900/30">
                <p className="text-sm text-slate-400 italic leading-relaxed font-serif">
                  {selectedPoem.intro}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-700/30" />
              <Feather className="size-3 text-amber-600/40" />
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-700/30" />
            </div>

            {/* Poem lines */}
            <div className="space-y-0.5 max-w-md mx-auto">
              {selectedPoem.lines.map((line, i) => (
                <p
                  key={i}
                  className={`text-center leading-relaxed font-serif ${
                    line === ''
                      ? 'h-3'
                      : line.startsWith('___')
                        ? 'text-slate-500 text-sm tracking-widest'
                        : line.startsWith('-')
                          ? 'text-amber-200/60 text-sm italic'
                          : 'text-slate-200/90 italic text-[15px]'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Power section */}
            {power && (
              <div
                className={`mt-5 p-3 rounded-xl border transition-all duration-300 ${
                  justUsed
                    ? 'border-amber-400/60 bg-amber-950/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                    : available
                      ? 'border-cyan-800/40 bg-cyan-950/20'
                      : 'border-slate-800/30 bg-slate-900/20 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className={`size-4 ${justUsed ? 'text-amber-400' : available ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className={`text-sm font-medium ${justUsed ? 'text-amber-300' : available ? 'text-cyan-300' : 'text-slate-400'}`}>
                    {power.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{power.description}</p>
                {available ? (
                  <Button
                    onClick={handleActivate}
                    disabled={activating}
                    size="sm"
                    className="w-full bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-200 border border-cyan-700/30 text-xs"
                    variant="outline"
                  >
                    <Sparkles className="size-3 mr-1.5" />
                    {activating ? 'Активация...' : 'Активировать способность'}
                  </Button>
                ) : onCooldown ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="size-3" />
                    <span>Перезарядка: {cooldownSec}с</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Poem grid/list view
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500">
            <Feather className="size-3 inline mr-1 text-amber-400/60" />
            {collectedCount} из {POEMS.length} найдено
          </p>
          <Badge variant="outline" className="text-[10px] border-cyan-800/40 text-cyan-400/70">
            Стих — это сила
          </Badge>
        </div>

        {/* Main poems grid */}
        {filteredMain.length > 0 && (
          <div className="mb-5">
            <h4 className="text-[11px] font-medium text-amber-500/60 uppercase tracking-widest mb-3">
              Стихи Владимира
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {filteredMain.map((poem) => {
                const isCollected = collectedPoems.includes(poem.id);
                const poemPower = getPoemPower(poem.id);
                return (
                  <button
                    key={poem.id}
                    onClick={() => isCollected && setSelectedPoemId(poem.id)}
                    disabled={!isCollected}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                      isCollected
                        ? 'border-cyan-900/20 bg-slate-900/20 hover:bg-amber-950/15 hover:border-amber-800/25 cursor-pointer'
                        : 'border-slate-800/15 bg-slate-900/10 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {isCollected ? (
                        <Sparkles className="size-3 text-amber-500/40 shrink-0" />
                      ) : (
                        <Lock className="size-3 text-slate-600 shrink-0" />
                      )}
                      <span className={`text-sm truncate ${isCollected ? 'text-slate-200' : 'text-slate-600'}`}>
                        {isCollected ? poem.title : '???'}
                      </span>
                    </div>
                    {isCollected && (
                      <div className="flex items-center gap-1 ml-5">
                        {poemPower && (
                          <span className="text-[10px] text-cyan-500/60">⚡ {poemPower.name}</span>
                        )}
                      </div>
                    )}
                    {!isCollected && (
                      <p className="text-[10px] text-slate-700 ml-5 italic">Ещё не найдено</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hidden poems */}
        {filteredHidden.length > 0 && (
          <div className="mb-5">
            <h4 className="text-[11px] font-medium text-cyan-500/60 uppercase tracking-widest mb-3">
              Скрытые стихи
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {filteredHidden.map((poem) => {
                const isCollected = collectedPoems.includes(poem.id);
                return (
                  <button
                    key={poem.id}
                    onClick={() => isCollected && setSelectedPoemId(poem.id)}
                    disabled={!isCollected}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                      isCollected
                        ? 'border-cyan-900/20 bg-slate-900/20 hover:bg-cyan-950/15 hover:border-cyan-800/25 cursor-pointer'
                        : 'border-slate-800/15 bg-slate-900/10 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isCollected ? (
                        <Eye className="size-3 text-cyan-500/40 shrink-0" />
                      ) : (
                        <Lock className="size-3 text-slate-600 shrink-0" />
                      )}
                      <span className={`text-sm truncate ${isCollected ? 'text-slate-200' : 'text-slate-600'}`}>
                        {isCollected ? poem.title : '???'}
                      </span>
                    </div>
                    {!isCollected && (
                      <p className="text-[10px] text-slate-700 ml-5 italic">Скрытый стих</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {collectedCount === 0 && (
          <div className="text-center py-12">
            <Feather className="size-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-1">Стихотворения ещё не найдены</p>
            <p className="text-xs text-slate-600">Исследуйте мир, и стихи откроются вам</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

/* ══════════════════════════════════════════════════════════════
   LORE TAB
   ══════════════════════════════════════════════════════════════ */
function LoreTab({ searchQuery }: { searchQuery: string }) {
  const loreEntries = useLoreEntries();
  const [selectedLore, setSelectedLore] = useState<string | null>(null);

  const discoveredEntries = loreEntries.filter((e) => e.discovered);
  const undiscoveredCount = loreEntries.length - discoveredEntries.length;

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return discoveredEntries;
    const q = searchQuery.toLowerCase();
    return discoveredEntries.filter(
      (e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q),
    );
  }, [discoveredEntries, searchQuery]);

  const selected = loreEntries.find((e) => e.id === selectedLore);

  return (
    <div className="flex h-full">
      {/* Entry list */}
      <div className="w-2/5 min-w-[160px] border-r border-cyan-900/20">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {filteredEntries.map((entry) => {
              const sceneConfig = SCENE_CONFIG[entry.sceneId as SceneId];
              const isSelected = selectedLore === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedLore(entry.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isSelected
                      ? 'bg-cyan-950/40 border border-cyan-800/40 shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.08)]'
                      : 'hover:bg-slate-800/30 border border-transparent'
                  }`}
                >
                  <p className={`text-sm font-medium ${isSelected ? 'text-cyan-200' : 'text-slate-300'}`}>
                    {entry.title}
                  </p>
                  {sceneConfig && (
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      <MapPin className="size-2.5 inline mr-0.5" />
                      {sceneConfig.name}
                    </p>
                  )}
                </button>
              );
            })}

            {/* Undiscovered entries */}
            {undiscoveredCount > 0 && (
              <div className="pt-2 border-t border-cyan-900/15 mt-2">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider px-3 mb-1.5">
                  Не обнаружено ({undiscoveredCount})
                </p>
                {loreEntries.filter((e) => !e.discovered).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 px-3 py-2 opacity-40"
                  >
                    <Lock className="size-3 text-slate-600" />
                    <span className="text-xs text-slate-600">???</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Lore detail */}
      <div className="flex-1 min-w-0">
        {selected && selected.discovered ? (
          <ScrollArea className="h-full">
            <div className="p-5 font-serif">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="size-4 text-cyan-400/60" />
                <h3 className="text-lg font-semibold text-cyan-200">{selected.title}</h3>
              </div>
              {SCENE_CONFIG[selected.sceneId as SceneId] && (
                <p className="text-xs text-slate-500 mb-4">
                  <MapPin className="size-3 inline mr-0.5" />
                  {SCENE_CONFIG[selected.sceneId as SceneId].name}
                </p>
              )}
              <div className="h-px bg-gradient-to-r from-cyan-800/30 to-transparent mb-4" />
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {selected.body}
              </p>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="size-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Выберите запись</p>
              {discoveredEntries.length === 0 && (
                <p className="text-slate-600 text-xs mt-1">Исследуйте мир, чтобы открыть лор</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN JOURNAL PANEL
   ══════════════════════════════════════════════════════════════ */
export function JournalPanel({
  open: openProp,
  onClose: onCloseProp,
}: {
  open?: boolean;
  onClose?: () => void;
} = {}) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const { journalOpen: storeJournalOpen, journalTab } = useJournalShell();
  const journalOpen = openProp ?? storeJournalOpen;
  const notifyPanelExit = usePanelExitComplete();
  const setJournalTab = useSetJournalTab();
  const setJournalOpen = useSetJournalOpen();
  const addLoreEntry = useAddLoreEntry();

  const [searchQuery, setSearchQuery] = useState('');

  // Initialize lore entries on first render
  useEffect(() => {
    for (const entry of INITIAL_LORE_ENTRIES) {
      addLoreEntry(entry);
    }
  }, [addLoreEntry]);

  const handleClose = useCallback(() => {
    onCloseProp?.();
    setJournalOpen(false);
  }, [onCloseProp, setJournalOpen]);

  // Escape key handler
  useEffect(() => {
    if (!journalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [journalOpen, handleClose]);

  // Reset search when changing tabs
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(''), 0);
    return () => clearTimeout(t);
  }, [journalTab]);

  return (
    <AnimatePresence initial={false} onExitComplete={() => notifyPanelExit?.()}>
      {journalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.PANEL }}
        >
          {/* Backdrop with scanline effect */}
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={handleClose} aria-hidden="true" />

          {/* Scanlines overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgb(var(--cyber-cyan-rgb) / 0.15) 2px, rgb(var(--cyber-cyan-rgb) / 0.15) 4px)',
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
            }}
          />

          {/* Main panel — dark glass morphism with cyberpunk borders */}
          <FocusTrap initialFocusRef={closeButtonRef}>
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-[95vw] max-w-4xl h-[85vh] max-h-[700px] flex overflow-hidden rounded-xl shadow-2xl shadow-black/50"
            {...dialogProps}
            style={{
              background: 'linear-gradient(135deg, rgba(8,12,28,0.95) 0%, rgba(4,8,18,0.97) 100%)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.15)',
              boxShadow: '0 0 40px rgb(var(--cyber-cyan-rgb) / 0.05), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.08), 0 25px 50px -12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h2 {...titleProps} className="sr-only">Журнал</h2>
            {/* Decorative corner accents — cyberpunk style */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl pointer-events-none" />

            {/* ── Left sidebar: Tabs ── */}
            <div className="w-16 sm:w-20 flex flex-col border-r border-cyan-900/20 bg-slate-950/60 shrink-0 relative">
              {/* Header */}
              <div className="p-2 sm:p-3 border-b border-cyan-900/20">
                <BookOpen className="size-5 sm:size-6 text-cyan-400/70 mx-auto" />
                <p className="text-[8px] sm:text-[9px] text-cyan-400/50 text-center mt-1 font-medium tracking-wider uppercase hidden sm:block">
                  Журнал
                </p>
              </div>

              {/* Tab buttons */}
              <div className="flex-1 flex flex-col py-2 gap-0.5 px-1.5 sm:px-2">
                {TABS.map((tab) => {
                  const isActive = journalTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setJournalTab(tab.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-950/50 border border-cyan-800/40 shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb) / 0.08)]'
                          : 'hover:bg-slate-800/30 border border-transparent'
                      }`}
                      title={tab.label}
                    >
                      <Icon className={`size-4 sm:size-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className={`text-[8px] sm:text-[9px] ${isActive ? 'text-cyan-300' : 'text-slate-600'}`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Close button */}
              <div className="p-1.5 sm:p-2 border-t border-cyan-900/20">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={handleClose}
                  className="w-full flex items-center justify-center py-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                  title="Закрыть (Esc)"
                  aria-label="Закрыть журнал"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* ── Right content area ── */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Tab title bar + search */}
              <div className="px-5 py-3 border-b border-cyan-900/20 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const tabConfig = TABS.find((t) => t.id === journalTab);
                      if (!tabConfig) return null;
                      const Icon = tabConfig.icon;
                      return (
                        <>
                          <Icon className="size-4 text-cyan-400/70" />
                          <h2 className="text-base font-semibold text-slate-100">{tabConfig.label}</h2>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="text-[9px] text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded border border-cyan-900/20">
                      J
                    </kbd>
                    <span className="text-[10px] text-slate-600">закрыть</span>
                  </div>
                </div>

                {/* Search/filter bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск..."
                    className="w-full bg-slate-900/40 border border-cyan-900/20 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-700/40 focus:shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.1)] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={journalTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    {journalTab === 'notes' && <NotesTab searchQuery={searchQuery} />}
                    {journalTab === 'skills' && <SkillsTab searchQuery={searchQuery} />}
                    {journalTab === 'poems' && <PoemsTab searchQuery={searchQuery} />}
                    {journalTab === 'lore' && <LoreTab searchQuery={searchQuery} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
