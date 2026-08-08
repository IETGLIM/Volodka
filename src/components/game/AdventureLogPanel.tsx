"use client";

/* ─── Volodka RPG – Adventure Log / Journal Panel ───
   Chronological event log with category filters, importance levels,
   linked entries, and statistics summary.
   Russian UI with cyberpunk palette. */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, BookOpen, Swords, MessageSquare,
  Compass, ScrollText, ChevronRight, ChevronDown, Star,
  MapPin, Users, Feather, BarChart3,
} from 'lucide-react';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGameSelector } from '@/store/selectors/hooks';
import type { QuestState } from '@/shared/types/state/quest';

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

type EventCategory = 'all' | 'combat' | 'social' | 'exploration' | 'lore';

type EventImportance = 'major' | 'minor';

interface AdventureLogEntry {
  id: string;
  timestamp: number;
  category: Exclude<EventCategory, 'all'>;
  importance: EventImportance;
  title: string;
  description: string;
  linkedQuestId?: string;
  linkedNpcId?: string;
  linkedLocationId?: string;
}

/* ══════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════ */

const CATEGORY_FILTERS: { key: EventCategory; label: string; icon: typeof BookOpen }[] = [
  { key: 'all',         label: 'Все',          icon: BookOpen },
  { key: 'combat',      label: 'Бой',          icon: Swords },
  { key: 'social',      label: 'Общение',      icon: MessageSquare },
  { key: 'exploration', label: 'Исследование', icon: Compass },
  { key: 'lore',        label: 'Лор',          icon: ScrollText },
];

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  combat:      { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.25)' },
  social:      { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)' },
  exploration: { color: '#00e5ff', bg: 'rgba(0,229,255,0.08)',   border: 'rgba(0,229,255,0.25)' },
  lore:        { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
};

const SCENE_ACT_MAP: Record<string, string> = {
  volodka_room: 'Акт 1', home_evening: 'Акт 1',
  street_morning: 'Акт 2', cafe: 'Акт 2', office_main: 'Акт 2',
  library: 'Акт 3', albert_backroom: 'Акт 3',
  factory_basement: 'Акт 4',
  street_night: 'Акт 5',
  pier: 'Акт 6',
  chk_forest_zorge: 'Акт 7', resistance_hq: 'Акт 7',
};

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function getActLabel(sceneId: string): string {
  return SCENE_ACT_MAP[sceneId] ?? 'Неизвестный акт';
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${day}.${month} ${h}:${m}`;
}

/* ══════════════════════════════════════════════════════════════
   Event Log Builder
   ══════════════════════════════════════════════════════════════ */

function buildAdventureEntries(state: {
  dialogueHistory: ReadonlyArray<{ id: string; speaker: string; text: string; timestamp: number; sceneId: string; isPlayerChoice?: boolean }>;
  visitedNodes: readonly string[];
  visitedNodeTimestamps: Readonly<Record<string, number>>;
  collectedPoems: readonly string[];
  quests: readonly QuestState[];
  npcRelations: Readonly<Record<string, number>>;
  notifications: ReadonlyArray<{ type: string; text: string; timestamp: number }>;
  combatEncounterSeq: number;
}): AdventureLogEntry[] {
  const entries: AdventureLogEntry[] = [];
  let seq = 0;

  for (const dh of state.dialogueHistory) {
    if (dh.isPlayerChoice) {
      entries.push({
        id: `adv_${++seq}_${dh.timestamp}`,
        timestamp: dh.timestamp,
        category: 'social' as const,
        importance: 'minor' as const,
        title: `Выбор: ${dh.speaker}`,
        description: dh.text,
        linkedNpcId: dh.speaker.toLowerCase().replace(/\s+/g, '_'),
      });
    }
  }

  for (const nodeId of state.visitedNodes) {
    const ts = state.visitedNodeTimestamps[nodeId] ?? 0;
    if (SCENE_ACT_MAP[nodeId]) {
      entries.push({
        id: `adv_${++seq}_${ts}`,
        timestamp: ts,
        category: 'exploration' as const,
        importance: 'major' as const,
        title: `Место обнаружено: ${nodeId}`,
        description: `Посещение локации — ${getActLabel(nodeId)}`,
        linkedLocationId: nodeId,
      });
    }
  }

  for (const poemId of state.collectedPoems) {
    entries.push({
      id: `adv_${++seq}_poem_${poemId}`,
      timestamp: 0,
      category: 'lore' as const,
      importance: 'major' as const,
      title: `Стих собран: ${poemId}`,
      description: 'Новое стихотворение добавлено в книгу стихов',
    });
  }

  for (const q of state.quests) {
    if (q.status === 'completed') {
      entries.push({
        id: `adv_${++seq}_quest_${q.questId}`,
        timestamp: 0,
        category: q.questId.includes('combat') || q.questId.includes('fight') ? 'combat' as const : 'social' as const,
        importance: 'major' as const,
        title: `Квест выполнен: ${q.questId}`,
        description: `Задание ${q.questId} завершено`,
        linkedQuestId: q.questId,
      });
    } else if (q.status === 'active') {
      entries.push({
        id: `adv_${++seq}_qactive_${q.questId}`,
        timestamp: 0,
        category: 'exploration' as const,
        importance: 'minor' as const,
        title: `Квест принят: ${q.questId}`,
        description: 'Новое задание получено',
        linkedQuestId: q.questId,
      });
    }
  }

  if (state.combatEncounterSeq > 0) {
    for (let c = 1; c <= state.combatEncounterSeq; c++) {
      entries.push({
        id: `adv_${++seq}_combat_${c}`,
        timestamp: 0,
        category: 'combat' as const,
        importance: 'major' as const,
        title: `Бой #${c}`,
        description: 'Произошло боевое столкновение',
      });
    }
  }

  for (const n of state.notifications) {
    if (n.type === 'lore' || n.type === 'discover') {
      entries.push({
        id: `adv_${++seq}_notif_${n.timestamp}`,
        timestamp: n.timestamp,
        category: 'lore' as const,
        importance: 'minor' as const,
        title: 'Обнаружено',
        description: n.text,
      });
    }
  }

  for (const [npcId, relation] of Object.entries(state.npcRelations)) {
    if (relation > 0) {
      entries.push({
        id: `adv_${++seq}_npc_${npcId}`,
        timestamp: 0,
        category: 'social' as const,
        importance: 'minor' as const,
        title: `Знакомство: ${npcId}`,
        description: `Установлен контакт — отношение ${relation}`,
        linkedNpcId: npcId,
      });
    }
  }

  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

/* ══════════════════════════════════════════════════════════════
   Stats Summary
   ══════════════════════════════════════════════════════════════ */

function StatsSummary({ stats }: {
  stats: {
    totalCombats: number;
    npcsMet: number;
    locationsDiscovered: number;
    poemsCollected: number;
  };
}) {
  const items = [
    { icon: Swords,  label: 'Боев',           value: stats.totalCombats,          color: '#f43f5e' },
    { icon: Users,  label: 'NPC знакомств',  value: stats.npcsMet,              color: '#fbbf24' },
    { icon: MapPin, label: 'Локаций',        value: stats.locationsDiscovered,  color: '#00e5ff' },
    { icon: Feather, label: 'Стихов',         value: stats.poemsCollected,       color: '#a78bfa' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border bg-white/[0.02]"
          style={{ borderColor: `${item.color}20` }}
        >
          <item.icon className="size-3.5" style={{ color: item.color }} />
          <span className="text-sm font-mono font-bold" style={{ color: item.color }}>{item.value}</span>
          <span className="text-[8px] text-slate-500 font-mono">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Log Entry Row
   ══════════════════════════════════════════════════════════════ */

function LogEntryRow({ entry, index, isExpanded, onToggle }: {
  entry: AdventureLogEntry;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const catColors = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.exploration;
  const isMajor = entry.importance === 'major';

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
      className="rounded-lg border transition-all duration-200"
      style={{
        borderColor: isMajor ? catColors.border : 'rgba(255,255,255,0.05)',
        background: isMajor ? `linear-gradient(135deg, ${catColors.bg} 0%, transparent 100%)` : 'rgba(255,255,255,0.01)',
      }}
    >
      <button type="button" onClick={onToggle} className="w-full text-left px-3 py-2 flex items-start gap-2">
        <div className="pt-0.5 shrink-0">
          {isMajor ? (
            <Star className="size-3" style={{ color: catColors.color }} />
          ) : (
            <ChevronRight className={`size-3 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[11px] font-medium text-slate-200 truncate max-w-[200px]">{entry.title}</span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: catColors.color, background: catColors.bg, border: `1px solid ${catColors.border}` }}>
              {CATEGORY_FILTERS.find((f) => f.key === entry.category)?.label ?? entry.category}
            </span>
          </div>
          <span className="text-[9px] text-slate-600 font-mono">{entry.timestamp > 0 ? formatTimestamp(entry.timestamp) : '—'}</span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 pl-8">
              <p className="text-xs text-slate-400/80 leading-relaxed mb-1.5">{entry.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {entry.linkedQuestId && <span className="text-[8px] font-mono text-cyan-500/60 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">Квест: {entry.linkedQuestId}</span>}
                {entry.linkedNpcId && <span className="text-[8px] font-mono text-amber-400/60 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">NPC: {entry.linkedNpcId}</span>}
                {entry.linkedLocationId && <span className="text-[8px] font-mono text-emerald-400/60 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">Место: {entry.linkedLocationId}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

interface AdventureLogPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AdventureLogPanel({ open, onClose }: AdventureLogPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const logData = useGameSelector((s) => ({
    dialogueHistory: s.dialogueHistory,
    visitedNodes: s.playerState.visitedNodes,
    visitedNodeTimestamps: s.playerState.visitedNodeTimestamps ?? {},
    collectedPoems: s.collectedPoems,
    quests: s.quests,
    npcRelations: Object.fromEntries(
      (s.npcRelations as Array<{ npcId: string; value: number }>).map((r) => [r.npcId, r.value])
    ),
    currentAct: s.playerState.progression.currentAct,
    karma: s.playerState.karma,
    level: s.playerState.progression.level,
    notifications: s.notifications,
    combatEncounterSeq: s.playerState.combatEncounterSeq ?? 0,
  }));

  const allEntries = useMemo(() => buildAdventureEntries(logData), [logData]);

  const filteredEntries = useMemo(() => {
    let result = allEntries;
    if (activeCategory !== 'all') {
      result = result.filter((e) => e.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    return result;
  }, [allEntries, activeCategory, searchQuery]);

  const stats = useMemo(() => ({
    totalCombats: logData.combatEncounterSeq,
    npcsMet: Object.keys(logData.npcRelations).length,
    locationsDiscovered: logData.visitedNodes.filter((n) => SCENE_ACT_MAP[n]).length,
    poemsCollected: logData.collectedPoems.length,
  }), [logData]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => { setSearchQuery(''); setActiveCategory('all'); setExpandedIds(new Set()); }, 0);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <FocusTrap initialFocusRef={closeButtonRef}>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full sm:w-[40rem]"
          {...dialogProps}
          style={{ zIndex: UI_LAYERS.PANEL, background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)', borderLeft: '1px solid rgba(0,229,255,0.15)', backdropFilter: 'blur(20px)', boxShadow: '-20px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 rgba(0,229,255,0.08)' }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/20">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-cyan-400" />
                <h2 {...titleProps} className="text-lg font-semibold text-slate-100">Журнал приключений</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 hidden sm:inline">[Esc] закрыть</span>
                <button ref={closeButtonRef} type="button" onClick={onClose} className="inline-flex size-9 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-accent/50 transition-colors" aria-label="Закрыть"><X className="size-5" /></button>
              </div>
            </div>
            <div className="px-4 py-2 border-b border-slate-800/40 space-y-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/30 bg-slate-900/40">
                <Search className="size-3.5 text-slate-500 shrink-0" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по записям…" className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none" aria-label="Поиск по журналу" />
              </div>
              <div className="flex items-center gap-1.5">
                {CATEGORY_FILTERS.map((cat) => {
                  const isActive = activeCategory === cat.key;
                  return (
                    <button key={cat.key} type="button" onClick={() => setActiveCategory(cat.key)} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all duration-200 ${isActive ? 'text-cyan-300 bg-cyan-950/30 border border-cyan-700/30' : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700/30'}`}>
                      <cat.icon className="size-3" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-4 py-2 border-b border-slate-800/30">
              <button type="button" onClick={() => setShowStats((s) => !s)} className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-mono">
                <ChevronDown className={`size-3 transition-transform duration-200 ${showStats ? '' : '-rotate-90'}`} />
                СТАТИСТИКА
              </button>
              <AnimatePresence>
                {showStats && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden mt-2">
                    <StatsSummary stats={stats} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 flex flex-col gap-1.5">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry, i) => (
                    <LogEntryRow key={entry.id} entry={entry} index={i} isExpanded={expandedIds.has(entry.id)} onToggle={() => toggleExpanded(entry.id)} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="size-8 text-slate-700/50 mb-2" />
                    <p className="text-xs text-slate-500">{searchQuery || activeCategory !== 'all' ? 'Ничего не найдено' : 'Журнал пуст — начни своё приключение'}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="px-4 py-2 border-t border-cyan-900/15 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-mono">volodka://adventure-log</span>
                <span className="text-[10px] text-slate-500 font-mono">{filteredEntries.length} / {allEntries.length} записей</span>
              </div>
            </div>
          </div>
        </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}
