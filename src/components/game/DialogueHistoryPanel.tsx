'use client';

/* ─── Volodka RPG – Dialogue History Panel (Enhanced) ───
   Two-column layout: NPC list (2/5) + conversation log (3/5).
   Rich entries with emotion tags, branch indicators, poem reveals,
   chapter grouping, and full-text search. */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import {
  X, MessageCircle, Search, ChevronRight, ChevronDown,
  User, Clock, GitBranch, BookOpen, Zap, Eye,
  Filter,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { findNpcById } from '@/data/allNpcDefinitions';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationLogEntry } from '@/store/shared';
import { NPCPortrait, NPC_PORTRAIT_COLORS } from './shared/NPCPortrait';

/* ══════════════════════════════════════════════════════════════
   Types & Constants
   ══════════════════════════════════════════════════════════════ */

/** Emotion tag categories for dialogue colour-coding */
type EmotionTag = 'neutral' | 'tense' | 'warm' | 'mysterious' | 'poem_reveal';

const EMOTION_CONFIG: Record<EmotionTag, { label: string; color: string; bg: string; border: string }> = {
  neutral:      { label: 'Нейтрально',  color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
  tense:        { label: 'Напряжённо', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.25)' },
  warm:         { label: 'Тепло',       color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)' },
  mysterious:   { label: 'Таинственно', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
  poem_reveal:  { label: 'Стих',        color: '#00e5ff', bg: 'rgba(0,229,255,0.08)',   border: 'rgba(0,229,255,0.25)' },
};

/** Scene → Act mapping for Russian chapter grouping */
const SCENE_ACT_MAP: Record<string, string> = {
  volodka_room: 'Акт 1',
  home_evening: 'Акт 1',
  street_morning: 'Акт 2',
  cafe: 'Акт 2',
  office_main: 'Акт 2',
  library: 'Акт 3',
  albert_backroom: 'Акт 3',
  factory_basement: 'Акт 4',
  street_night: 'Акт 5',
  pier: 'Акт 6',
  chk_forest_zorge: 'Акт 7',
  resistance_hq: 'Акт 7',
};

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatTimestampFull(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${day}.${month} ${h}:${m}`;
}

function getActLabel(sceneId: string): string {
  return SCENE_ACT_MAP[sceneId] ?? 'Неизвестный акт';
}

/** Detect emotion from dialogue text (keyword heuristics) */
function detectEmotion(text: string): EmotionTag {
  const lower = text.toLowerCase();
  if (lower.includes('стих') || lower.includes('поэ') || lower.includes('ритм') || lower.includes('строка')) {
    return 'poem_reveal';
  }
  const tenseWords = ['опасн', 'угроз', 'страх', 'бежать', 'паник', 'вирус', 'атак', 'тревог', 'смерт', 'убить'];
  for (const w of tenseWords) {
    if (lower.includes(w)) return 'tense';
  }
  const warmWords = ['спасибо', 'друг', 'рад', 'тепл', 'улыб', 'обня', 'люб', 'забот', 'помощ'];
  for (const w of warmWords) {
    if (lower.includes(w)) return 'warm';
  }
  const mysteryWords = ['тайн', 'загадк', 'странн', 'неизвестн', 'сигнал', 'код', 'шифр', 'иногд', 'мгновен'];
  for (const w of mysteryWords) {
    if (lower.includes(w)) return 'mysterious';
  }
  return 'neutral';
}

/** Determine if a speaker name is the player (vs NPC) */
function isPlayerSpeaker(speaker: string): boolean {
  const lower = speaker.toLowerCase();
  return lower === 'владимир' || lower === 'володька' || lower === 'player' || lower === 'вы';
}

/** Detect if text looks like a skill check result */
function isSkillCheckText(text: string): boolean {
  return /(?:проверк|бросок|успех|провал|навык|скилл)/i.test(text);
}

/** Detect if text looks like a choice the player made */
function isChoiceText(text: string): boolean {
  return /^\s*[►▸→]/.test(text) || /^(?:выбрал|выбрала)\s/i.test(text);
}

/** Extract poem line from poem_reveal entries */
function extractPoemLine(text: string): string | null {
  const match = text.match(/стих[:\s]*"(.+?)"/i) ?? text.match(/поэм[аеу][:\s]*(.+?)(?:\.|$)/i);
  return match ? match[1] : null;
}

/* ══════════════════════════════════════════════════════════════
   Emotion Tag Badge
   ══════════════════════════════════════════════════════════════ */

function EmotionBadge({ emotion }: { emotion: EmotionTag }) {
  const cfg = EMOTION_CONFIG[emotion];
  if (emotion === 'neutral') return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-medium whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {emotion === 'poem_reveal' && <BookOpen className="size-2" />}
      {cfg.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   Branch Indicator
   ══════════════════════════════════════════════════════════════ */

function BranchIndicator({ isPlayerChoice, branchPath, altPaths }: {
  isPlayerChoice: boolean;
  branchPath?: string;
  altPaths?: string[];
}) {
  if (!isPlayerChoice) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <GitBranch className="size-2.5 text-cyan-500/60 shrink-0" />
      <span className="text-[9px] font-mono text-cyan-500/70">{branchPath ?? 'Выбор сделан'}</span>
      {altPaths && altPaths.length > 0 && (
        <span className="text-[8px] text-slate-600 font-mono" title={altPaths.join('\n')}>
          +{altPaths.length} альт.
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NPC List Item
   ══════════════════════════════════════════════════════════════ */

function NPCListItem({
  npcId,
  name,
  entries,
  isSelected,
  onClick,
  searchQuery,
}: {
  npcId: string;
  name: string;
  entries: ConversationLogEntry[];
  isSelected: boolean;
  onClick: () => void;
  searchQuery: string;
}) {
  const colors = NPC_PORTRAIT_COLORS[npcId];
  const lastEntry = entries[entries.length - 1];
  const lastTime = lastEntry ? formatTimestamp(lastEntry.timestamp) : '';

  // Highlight matching text in search
  const highlightMatch = searchQuery.trim().length > 0 &&
    entries.some((e) => e.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'border-emerald-700/40 bg-emerald-950/20'
          : 'border-transparent hover:border-slate-700/30 hover:bg-slate-800/30'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <NPCPortrait npcId={npcId} size="mini" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs font-medium truncate"
              style={{ color: colors?.primary ?? '#94a3b8' }}
            >
              {name}
            </span>
            {isSelected && (
              <ChevronRight className="size-3 text-emerald-400/50 shrink-0" />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            {lastTime && (
              <span className="text-[10px] text-slate-500">{lastTime}</span>
            )}
            <div className="flex items-center gap-1.5">
              {highlightMatch && (
                <span className="relative" title="Найдено совпадение"><Eye className="size-2.5 text-cyan-500/60" /></span>
              )}
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[9px] font-mono font-medium"
                style={{
                  background: colors ? `${colors.primary}20` : 'rgba(52,211,153,0.15)',
                  color: colors?.primary ?? '#34d399',
                  border: `1px solid ${colors ? colors.primary + '30' : 'rgba(52,211,153,0.2)'}`,
                }}
              >
                {entries.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   Conversation Entry (Enhanced)
   ══════════════════════════════════════════════════════════════ */

function ConversationEntry({
  entry,
  npcId,
  index,
  showFullText,
  onToggleFullText,
}: {
  entry: ConversationLogEntry;
  npcId: string;
  index: number;
  showFullText: boolean;
  onToggleFullText: () => void;
}) {
  const isPlayer = isPlayerSpeaker(entry.speaker);
  const npcColors = NPC_PORTRAIT_COLORS[npcId];
  const emotion = detectEmotion(entry.text);
  const isSkillCheck = isSkillCheckText(entry.text);
  const isChoice = isChoiceText(entry.text);
  const isPoemReveal = emotion === 'poem_reveal';
  const poemLine = isPoemReveal ? extractPoemLine(entry.text) : null;
  const emotionCfg = EMOTION_CONFIG[emotion];

  const accentColor = isPlayer
    ? 'var(--cyber-cyan)'
    : (npcColors?.primary ?? '#34d399');

  const accentBg = isPlayer
    ? 'rgb(var(--cyber-cyan-rgb) / 0.08)'
    : (npcColors ? `${npcColors.primary}12` : 'rgba(52,211,153,0.08)');

  const accentBorder = isPlayer
    ? 'rgb(var(--cyber-cyan-rgb) / 0.25)'
    : (npcColors ? `${npcColors.primary}30` : 'rgba(52,211,153,0.25)');

  // Use emotion-based styling for the entry border when not neutral
  const entryBorder = emotion !== 'neutral' ? emotionCfg.border : accentBorder;
  const entryBg = emotion !== 'neutral'
    ? `linear-gradient(135deg, ${emotionCfg.bg} 0%, transparent 100%)`
    : `linear-gradient(135deg, ${accentBg} 0%, transparent 100%)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={`rounded-lg border px-3 py-2 ${isPoemReveal ? 'poem-reveal-entry' : ''} ${isSkillCheck ? 'skill-check-entry' : ''}`}
      style={{ borderColor: entryBorder, background: entryBg }}
    >
      <div className="flex items-start gap-2">
        {/* Speaker indicator */}
        <div className="flex flex-col items-center gap-1 pt-0.5">
          {isPlayer ? (
            <User className="size-3.5 shrink-0" style={{ color: accentColor }} />
          ) : (
            <MessageCircle className="size-3.5 shrink-0" style={{ color: accentColor }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[11px] font-medium" style={{ color: accentColor }}>
              {entry.speaker}
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
              {formatTimestampFull(entry.timestamp)}
            </span>
            {isChoice && (
              <span className="text-[8px] font-mono text-cyan-500/60 bg-cyan-500/10 px-1 py-0.5 rounded">
                ВЫБОР
              </span>
            )}
            {isSkillCheck && (
              <span className="text-[8px] font-mono text-amber-400/60 bg-amber-400/10 px-1 py-0.5 rounded">
                <Zap className="size-2 inline" /> ПРОВЕРКА
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300/80 leading-relaxed">
            {showFullText ? entry.text : (entry.text.length > 120 ? entry.text.slice(0, 120) + '…' : entry.text)}
          </p>

          {entry.text.length > 120 && (
            <button
              type="button"
              onClick={onToggleFullText}
              className="flex items-center gap-0.5 mt-1 text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showFullText ? (
                <><ChevronDown className="size-2.5" /> Свернуть</>
              ) : (
                <><ChevronRight className="size-2.5" /> Подробнее</>
              )}
            </button>
          )}

          {/* Branch indicator for player choices */}
          <BranchIndicator
            isPlayerChoice={isPlayer}
          />

          {/* Emotion tag */}
          <div className="mt-1">
            <EmotionBadge emotion={emotion} />
          </div>

          {/* Poem reveal highlight */}
          {isPoemReveal && poemLine && (
            <div className="mt-1.5 px-2 py-1.5 rounded border border-cyan-500/20 bg-cyan-950/30">
              <p className="text-[10px] font-serif italic text-cyan-300/80 leading-relaxed">
                «{poemLine}»
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Act Group Header
   ══════════════════════════════════════════════════════════════ */

function ActGroupHeader({ actLabel, count }: { actLabel: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <div className="h-px flex-1 bg-slate-700/40" />
      <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
        {actLabel}
      </span>
      <span className="text-[9px] font-mono text-slate-600">({count})</span>
      <div className="h-px flex-1 bg-slate-700/40" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

interface DialogueHistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function DialogueHistoryPanel({ open, onClose }: DialogueHistoryPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const conversationLog = useGameStore((s) => s.conversationLog);
  const dialogueHistory = useGameStore((s) => s.dialogueHistory);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [searchScope, setSearchScope] = useState<'npc' | 'full'>('npc');

  const toggleExpanded = useCallback((key: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Build list of NPCs with conversation history
  const npcList = useMemo(() => {
    const npcIds = Object.keys(conversationLog).filter(
      (id) => conversationLog[id] && conversationLog[id].length > 0,
    );

    return npcIds
      .map((npcId) => {
        const def = findNpcById(npcId);
        const name = def?.name ?? npcId;
        const entries = conversationLog[npcId];
        return { npcId, name, entries };
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        if (searchScope === 'npc') {
          return item.name.toLowerCase().includes(q) || item.npcId.toLowerCase().includes(q);
        }
        // Full-text search: also check entry text
        return item.name.toLowerCase().includes(q) ||
          item.npcId.toLowerCase().includes(q) ||
          item.entries.some((e) => e.text.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const aLast = a.entries[a.entries.length - 1]?.timestamp ?? 0;
        const bLast = b.entries[b.entries.length - 1]?.timestamp ?? 0;
        return bLast - aLast;
      });
  }, [conversationLog, searchQuery, searchScope]);

  // Selected NPC's conversation entries, filtered by search in full mode
  const selectedEntries = useMemo(() => {
    const raw = selectedNpcId ? (conversationLog[selectedNpcId] ?? []) : [];
    if (searchScope === 'npc' || !searchQuery.trim()) return raw;
    const q = searchQuery.toLowerCase();
    return raw.filter((e) => e.text.toLowerCase().includes(q));
  }, [conversationLog, selectedNpcId, searchQuery, searchScope]);

  // Group entries by act
  const groupedEntries = useMemo(() => {
    const groups: { act: string; entries: Array<ConversationLogEntry & { _key: string }> }[] = [];
    let currentAct = '';
    for (let i = 0; i < selectedEntries.length; i++) {
      const entry = selectedEntries[i];
      // Derive a scene context from the dialogueHistory if possible
      const dhEntry = dialogueHistory.find((d) =>
        d.text === entry.text && Math.abs(d.timestamp - entry.timestamp) < 5000,
      );
      const sceneId = dhEntry?.sceneId ?? '';
      const act = getActLabel(sceneId);
      const key = `${entry.timestamp}-${i}`;

      if (act !== currentAct) {
        groups.push({ act, entries: [{ ...entry, _key: key }] });
        currentAct = act;
      } else {
        groups[groups.length - 1].entries.push({ ...entry, _key: key });
      }
    }
    return groups;
  }, [selectedEntries, dialogueHistory]);

  // Selected NPC definition
  const selectedNpcDef = selectedNpcId ? findNpcById(selectedNpcId) : null;

  const hasConversations = npcList.length > 0;

  // Keyboard handler: [L] or Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.code === 'KeyL') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Auto-select first NPC when opened
  useEffect(() => {
    if (open && !selectedNpcId && npcList.length > 0) {
      setTimeout(() => {
        setSelectedNpcId(npcList[0].npcId);
      }, 0);
    }
  }, [open, selectedNpcId, npcList]);

  // Reset selection when panel closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedNpcId(null);
        setSearchQuery('');
        setSearchScope('npc');
        setExpandedEntries(new Set());
      }, 0);
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
          className="fixed top-0 right-0 bottom-0 w-full sm:w-[42rem]"
          {...dialogProps}
          style={{
            zIndex: UI_LAYERS.PANEL,
            background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)',
            borderLeft: '1px solid rgba(52,211,153,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '-20px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 rgba(52,211,153,0.08)',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-900/20">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-emerald-400" />
                <h2 {...titleProps} className="text-lg font-semibold text-slate-100">
                  История диалогов
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 hidden sm:inline">[L] закрыть</span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-9 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-accent/50 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Search bar with scope toggle */}
            <div className="px-4 py-2 border-b border-slate-800/40">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/30 bg-slate-900/40">
                <Search className="size-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchScope === 'full' ? 'Поиск по тексту всех диалогов…' : 'Поиск по имени NPC…'}
                  className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
                  aria-label="Поиск по логу диалогов"
                />
                <button
                  type="button"
                  onClick={() => setSearchScope((s) => s === 'npc' ? 'full' : 'npc')}
                  className="shrink-0 p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  title={searchScope === 'npc' ? 'Искать по тексту диалогов' : 'Искать по имени NPC'}
                >
                  <Filter className="size-3" />
                </button>
              </div>
              {searchScope === 'full' && (
                <div className="mt-1 flex items-center gap-1.5 text-[9px] text-cyan-500/60">
                  <Eye className="size-2.5" />
                  Полный поиск по тексту
                </div>
              )}
            </div>

            {/* Two-column layout */}
            {hasConversations ? (
              <div className="flex flex-1 min-h-0">
                {/* Left: NPC list (2/5) */}
                <div className="w-2/5 border-r border-slate-800/30">
                  <ScrollArea className="h-full">
                    <div className="p-2 flex flex-col gap-1">
                      {npcList.map((item) => (
                        <NPCListItem
                          key={item.npcId}
                          npcId={item.npcId}
                          name={item.name}
                          entries={item.entries}
                          isSelected={selectedNpcId === item.npcId}
                          onClick={() => setSelectedNpcId(item.npcId)}
                          searchQuery={searchQuery}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Conversation log (3/5) */}
                <div className="w-3/5">
                  <ScrollArea className="h-full">
                    {selectedNpcId && selectedEntries.length > 0 ? (
                      <div className="p-3">
                        {/* NPC header */}
                        {selectedNpcDef && (
                          <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-800/30">
                            <NPCPortrait npcId={selectedNpcId} size="mini" />
                            <div>
                              <span
                                className="text-sm font-medium"
                                style={{ color: NPC_PORTRAIT_COLORS[selectedNpcId]?.primary ?? '#94a3b8' }}
                              >
                                {selectedNpcDef.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock className="size-2.5 text-slate-600" />
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {selectedEntries.length} сообщений
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Grouped by act */}
                        <div className="flex flex-col gap-2">
                          {groupedEntries.map((group) => (
                            <div key={group.act}>
                              <ActGroupHeader actLabel={group.act} count={group.entries.length} />
                              <div className="flex flex-col gap-1.5 mt-1">
                                {group.entries.map((entry, i) => (
                                  <ConversationEntry
                                    key={entry._key}
                                    entry={entry}
                                    npcId={selectedNpcId}
                                    index={i}
                                    showFullText={expandedEntries.has(entry._key)}
                                    onToggleFullText={() => toggleExpanded(entry._key)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : selectedNpcId ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageCircle className="size-8 text-slate-700 mb-2" />
                        <p className="text-xs text-slate-500">
                          {searchQuery ? 'Ничего не найдено' : 'Нет записей разговора'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageCircle className="size-8 text-slate-700 mb-2" />
                        <p className="text-xs text-slate-500">Выберите NPC</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="flex flex-col items-center text-center"
                >
                  <MessageCircle className="size-12 text-slate-700/50 mb-4" />
                  <p className="text-slate-500 text-sm mb-1">Нет записей разговоров</p>
                  <p className="text-slate-600 text-xs max-w-[220px]">
                    Общайтесь с персонажами, чтобы сохранить историю диалогов
                  </p>
                </motion.div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2 border-t border-emerald-900/15 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-mono">
                  volodka://history
                </span>
                {hasConversations && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Object.keys(conversationLog).reduce((sum, id) => sum + (conversationLog[id]?.length ?? 0), 0)} сообщений
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}
