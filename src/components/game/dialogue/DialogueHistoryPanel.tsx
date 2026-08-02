/* ─── Volodka RPG – Dialogue History Overlay Panel ───
   Lightweight overlay accessible from DialogueRenderer's toolbar.
   Shows last 100 dialogue entries with search, color-coded speakers,
   relative timestamps. */

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, MessageCircle, User, ScrollText } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { NPC_PORTRAIT_COLORS } from '../shared/NPCPortrait';
import type { DialogueHistoryEntry } from '@/store/slices/dialogueHistorySlice';

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

const MAX_DISPLAY_CHARS = 200;

/** Russian-language relative timestamp */
function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 5) return 'только что';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}м назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const remMins = mins % 60;
    return remMins > 0 ? `${hours}ч ${remMins}м назад` : `${hours}ч назад`;
  }
  const days = Math.floor(hours / 24);
  return `${days}д назад`;
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function isPlayerSpeaker(speaker: string): boolean {
  const lower = speaker.toLowerCase();
  return lower === 'владимир' || lower === 'володька' || lower === 'player' || lower === 'вы';
}

function isNarratorSpeaker(speaker: string): boolean {
  const lower = speaker.toLowerCase();
  return lower === 'голос' || lower === 'нарратор' || lower === 'повествование' || lower === 'narrator';
}

/** Resolve NPC ID from speaker name — match against NPC_PORTRAIT_COLORS keys */
function resolveNpcColor(speaker: string): string {
  const lower = speaker.toLowerCase().replace(/\s+/g, '_');
  if (NPC_PORTRAIT_COLORS[lower]) return NPC_PORTRAIT_COLORS[lower].primary;
  // Partial match: try first word
  const firstWord = lower.split('_')[0];
  for (const [key, colors] of Object.entries(NPC_PORTRAIT_COLORS)) {
    if (key.startsWith(firstWord)) return colors.primary;
  }
  // Fallback: slate
  return '#94a3b8';
}

function getSpeakerColor(entry: DialogueHistoryEntry): string {
  if (entry.isPlayerChoice) return 'var(--cyber-cyan, #22d3ee)';
  if (isPlayerSpeaker(entry.speaker)) return 'var(--cyber-cyan, #22d3ee)';
  if (isNarratorSpeaker(entry.speaker)) return '#ffffff';
  return resolveNpcColor(entry.speaker);
}

/* ══════════════════════════════════════════════════════════════
   Entry row
   ══════════════════════════════════════════════════════════════ */

function HistoryEntryRow({ entry, index: _index }: { entry: DialogueHistoryEntry; index: number }) {
  const speakerColor = getSpeakerColor(entry);
  const isPlayer = entry.isPlayerChoice || isPlayerSpeaker(entry.speaker);
  const isNarrator = !isPlayer && isNarratorSpeaker(entry.speaker);

  return (
    <div
      className="flex gap-2.5 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] cyber-hover-lift transition-colors"
    >
      {/* Icon */}
      <div className="shrink-0 pt-0.5">
        {isPlayer ? (
          <User className="size-3.5" style={{ color: speakerColor }} />
        ) : isNarrator ? (
          <ScrollText className="size-3.5 text-white/60" />
        ) : (
          <MessageCircle className="size-3.5" style={{ color: speakerColor }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-medium" style={{ color: speakerColor }}>
            {entry.speaker}
          </span>
          <span
            className="data-badge inline-flex items-center gap-0.5 text-[9px] text-slate-500 font-mono"
          >
            <Clock className="size-2" />
            {formatRelativeTime(entry.timestamp)}
          </span>
        </div>
        <p className="text-xs text-slate-300/80 leading-relaxed">
          {truncateText(entry.text, MAX_DISPLAY_CHARS)}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

export interface DialogueHistoryOverlayProps {
  open: boolean;
  onClose: () => void;
  entries: DialogueHistoryEntry[];
}

export function DialogueHistoryPanel({ open, onClose, entries }: DialogueHistoryOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset search when closed
  useEffect(() => {
    if (!open) setSearchQuery('');
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Filtered + reversed entries (newest first)
  const displayEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = entries;
    if (q) {
      filtered = entries.filter(
        (e) =>
          e.speaker.toLowerCase().includes(q) ||
          e.text.toLowerCase().includes(q) ||
          e.sceneId.toLowerCase().includes(q),
      );
    }
    // Newest first
    return [...filtered].reverse();
  }, [entries, searchQuery]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
          style={{ zIndex: UI_LAYERS.DIALOGUE + 10 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="w-full max-w-lg max-h-[70vh] flex flex-col rounded-xl border border-white/10 bg-black/85 backdrop-blur-xl shadow-2xl glass-panel cyber-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  Лог диалогов
                </h2>
                <span className="data-badge text-[9px] font-mono text-slate-500">
                  {entries.length}/100
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Закрыть"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b border-white/5">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.03]">
                <Search className="size-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по тексту или имени..."
                  className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 scrollbar-cyber"
            >
              {displayEntries.length > 0 ? (
                displayEntries.map((entry, i) => (
                  <HistoryEntryRow key={entry.id} entry={entry} index={i} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="size-8 text-slate-700/50 mb-2" />
                  <p className="text-xs text-slate-500">
                    {searchQuery ? 'Ничего не найдено' : 'Нет записей диалогов'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
