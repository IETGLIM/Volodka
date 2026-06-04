
/* ─── Volodka RPG – Dialogue History Panel ───
   Two-column layout: NPC list (2/5) + conversation log (3/5).
   Browse past dialogue conversations with NPCs.
   Cyberpunk dark glass morphism with emerald accent (dialogue color).
*/

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MessageCircle, Search, ChevronRight,
  User, Clock,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { ConversationLogEntry } from '@/store/shared';
import { NPCPortrait, NPC_PORTRAIT_COLORS } from './shared/NPCPortrait';

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

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

/** Determine if a speaker name is the player (vs NPC) */
function isPlayerSpeaker(speaker: string): boolean {
  const lower = speaker.toLowerCase();
  return lower === 'владимир' || lower === 'володька' || lower === 'player' || lower === 'вы';
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
}: {
  npcId: string;
  name: string;
  entries: ConversationLogEntry[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = NPC_PORTRAIT_COLORS[npcId];
  const lastEntry = entries[entries.length - 1];
  const lastTime = lastEntry ? formatTimestamp(lastEntry.timestamp) : '';

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
        {/* Mini portrait */}
        <NPCPortrait npcId={npcId} size="mini" />

        {/* Info */}
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
            {/* Last conversation time */}
            {lastTime && (
              <span className="text-[10px] text-slate-500">
                {lastTime}
              </span>
            )}
            {/* Message count badge */}
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
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   Conversation Entry
   ══════════════════════════════════════════════════════════════ */

function ConversationEntry({
  entry,
  npcId,
  index,
}: {
  entry: ConversationLogEntry;
  npcId: string;
  index: number;
}) {
  const isPlayer = isPlayerSpeaker(entry.speaker);
  const npcColors = NPC_PORTRAIT_COLORS[npcId];

  // Player choices: cyan accent; NPC responses: NPC-specific accent
  const accentColor = isPlayer
    ? '#22d3ee' // cyan-400
    : (npcColors?.primary ?? '#34d399'); // NPC color or emerald fallback

  const accentBg = isPlayer
    ? 'rgba(34,211,238,0.08)'
    : (npcColors ? `${npcColors.primary}12` : 'rgba(52,211,153,0.08)');

  const accentBorder = isPlayer
    ? 'rgba(34,211,238,0.25)'
    : (npcColors ? `${npcColors.primary}30` : 'rgba(52,211,153,0.25)');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="rounded-lg border px-3 py-2"
      style={{
        borderColor: accentBorder,
        background: `linear-gradient(135deg, ${accentBg} 0%, transparent 100%)`,
      }}
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
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-medium" style={{ color: accentColor }}>
              {entry.speaker}
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
              {formatTimestampFull(entry.timestamp)}
            </span>
          </div>
          <p className="text-xs text-slate-300/80 leading-relaxed">
            {truncateText(entry.text, 80)}
          </p>
        </div>
      </div>
    </motion.div>
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
  const conversationLog = useGameStore((s) => s.conversationLog);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Build list of NPCs with conversation history
  const npcList = useMemo(() => {
    const npcIds = Object.keys(conversationLog).filter(
      (id) => conversationLog[id] && conversationLog[id].length > 0,
    );

    // Map to NPC info
    return npcIds
      .map((npcId) => {
        const def = NPC_DEFINITIONS.find((n) => n.id === npcId);
        const name = def?.name ?? npcId;
        const entries = conversationLog[npcId];
        return { npcId, name, entries };
      })
      .filter((item) => {
        // Filter by search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.npcId.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // Sort by most recent conversation
        const aLast = a.entries[a.entries.length - 1]?.timestamp ?? 0;
        const bLast = b.entries[b.entries.length - 1]?.timestamp ?? 0;
        return bLast - aLast;
      });
  }, [conversationLog, searchQuery]);

  // Selected NPC's conversation entries
  const selectedEntries = selectedNpcId ? (conversationLog[selectedNpcId] ?? []) : [];

  // Selected NPC definition
  const selectedNpcDef = selectedNpcId ? NPC_DEFINITIONS.find((n) => n.id === selectedNpcId) : null;

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
      }, 0);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full sm:w-[38rem]"
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
                <h2 className="text-lg font-semibold text-slate-100">
                  История диалогов
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 hidden sm:inline">[L] закрыть</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-4 py-2 border-b border-slate-800/40">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/30 bg-slate-900/40">
                <Search className="size-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени NPC..."
                  className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
                />
              </div>
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

                        {/* Conversation entries */}
                        <div className="flex flex-col gap-1.5">
                          {selectedEntries.map((entry, i) => (
                            <ConversationEntry
                              key={`${entry.timestamp}-${i}`}
                              entry={entry}
                              npcId={selectedNpcId}
                              index={i}
                            />
                          ))}
                        </div>
                      </div>
                    ) : selectedNpcId ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageCircle className="size-8 text-slate-700 mb-2" />
                        <p className="text-xs text-slate-500">Нет записей разговора</p>
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
              /* Empty state */
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
      )}
    </AnimatePresence>
  );
}
