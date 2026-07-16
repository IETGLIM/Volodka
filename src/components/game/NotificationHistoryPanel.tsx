/* ─── Volodka RPG – Notification History Panel ───
   Shows a log of recent game notifications/toasts in reverse chronological order.
   Cyberpunk glass-morphism with color-coded left border by notification type.
*/

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { usePanelExitComplete } from '@/components/game/orchestrator/PanelExitContext';
import {
  X, Bell, Search, Trash2,
  Flame, Zap, Brain, Cpu, Feather, Scroll,
  Hammer, Package, Swords, ArrowUpCircle, Monitor, BookOpen, Award,
} from 'lucide-react';
import { useUIStore } from '@/store/stores/uiStore';
import type { NotificationHistoryEntry } from '@/store/slices/uiSlice';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ══════════════════════════════════════════════════════════════
   Constants & Helpers
   ══════════════════════════════════════════════════════════════ */

const MAX_DISPLAY = 30;

const TYPE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  karma:       { border: 'border-l-purple-500',   bg: 'bg-purple-500/10',   text: 'text-purple-400' },
  energy:      { border: 'border-l-green-500',    bg: 'bg-green-500/10',    text: 'text-green-400' },
  stress:      { border: 'border-l-red-500',      bg: 'bg-red-500/10',      text: 'text-red-400' },
  skill:       { border: 'border-l-cyan-500',     bg: 'bg-cyan-500/10',     text: 'text-cyan-400' },
  poem:        { border: 'border-l-amber-500',    bg: 'bg-amber-500/10',    text: 'text-amber-400' },
  quest:       { border: 'border-l-blue-500',     bg: 'bg-blue-500/10',     text: 'text-blue-400' },
  crafting:    { border: 'border-l-emerald-500/50',  bg: 'bg-emerald-500/5',  text: 'text-emerald-400' },
  loot:        { border: 'border-l-amber-500/50',   bg: 'bg-amber-500/5',   text: 'text-amber-400' },
  combat:      { border: 'border-l-rose-500/50',    bg: 'bg-rose-500/5',     text: 'text-rose-400' },
  levelup:     { border: 'border-l-yellow-400/50',   bg: 'bg-yellow-400/5',   text: 'text-yellow-300' },
  system:      { border: 'border-l-slate-400/50',    bg: 'bg-slate-400/5',    text: 'text-slate-300' },
  lore:        { border: 'border-l-violet-400/50',   bg: 'bg-violet-400/5',   text: 'text-violet-400' },
  achievement: { border: 'border-l-amber-300/50',   bg: 'bg-amber-300/5',   text: 'text-amber-200' },
};

const DEFAULT_COLORS = { border: 'border-l-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400' };

function getTypeColors(type: string) {
  return TYPE_COLORS[type] ?? DEFAULT_COLORS;
}

function getTypeIcon(type: string, className: string) {
  switch (type) {
    case 'karma':       return <Flame className={className} />;
    case 'energy':      return <Zap className={className} />;
    case 'stress':      return <Brain className={className} />;
    case 'skill':       return <Cpu className={className} />;
    case 'poem':        return <Feather className={className} />;
    case 'quest':       return <Scroll className={className} />;
    case 'crafting':    return <Hammer className={className} />;
    case 'loot':        return <Package className={className} />;
    case 'combat':      return <Swords className={className} />;
    case 'levelup':     return <ArrowUpCircle className={className} />;
    case 'system':      return <Monitor className={className} />;
    case 'lore':        return <BookOpen className={className} />;
    case 'achievement': return <Award className={className} />;
    default:            return <Bell className={className} />;
  }
}

function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diffMs = now - ts;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 5) return 'только что';
  if (diffSec < 60) return `${diffSec} сек назад`;
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffHr < 24) return `${diffHr} ч назад`;
  return `${Math.floor(diffHr / 24)} д назад`;
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

/* ══════════════════════════════════════════════════════════════
   History Entry Row
   ══════════════════════════════════════════════════════════════ */

function HistoryEntryRow({
  entry,
  index,
}: {
  entry: NotificationHistoryEntry;
  index: number;
}) {
  const colors = getTypeColors(entry.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.5), duration: 0.2 }}
      className={`flex items-start gap-2.5 px-3 py-2 rounded-r-lg border-l-2 ${colors.border} ${colors.bg} transition-colors`}
    >
      {/* Type icon */}
      <div className="shrink-0 pt-0.5">
        {getTypeIcon(entry.type, `size-3.5 ${colors.text}`)}
      </div>

      {/* Message + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300/90 leading-relaxed break-words">
          {entry.message}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-500 font-mono">
            {formatRelativeTime(entry.timestamp)}
          </span>
        </div>
      </div>

      {/* Delta badge */}
      {entry.delta != null && entry.delta !== 0 && (
        <span
          className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
            entry.delta > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}
        >
          {formatDelta(entry.delta)}
        </span>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

interface NotificationHistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationHistoryPanel({ open, onClose }: NotificationHistoryPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const notifyPanelExit = usePanelExitComplete();
  const notificationHistory = useUIStore((s) => s.notificationHistory);
  const clearNotificationHistory = useUIStore((s) => s.clearNotificationHistory);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered & reversed entries (newest first)
  const displayEntries = useMemo(() => {
    let entries = [...notificationHistory].reverse();
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((e) => e.message.toLowerCase().includes(q));
    }
    return entries.slice(0, MAX_DISPLAY);
  }, [notificationHistory, searchQuery]);

  const hasEntries = displayEntries.length > 0;

  // Reset search on close
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence onExitComplete={() => notifyPanelExit?.()}>
      {open && (
        <FocusTrap initialFocusRef={closeButtonRef}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[36rem] glass-panel-dark"
            {...dialogProps}
            style={{
              zIndex: UI_LAYERS.PANEL,
              background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)',
              borderLeft: '1px solid rgba(148,163,184,0.12)',
              backdropFilter: 'blur(20px)',
              boxShadow: '-20px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 rgba(148,163,184,0.06)',
            }}
          >
            <div className="flex flex-col h-full glass-panel-dark">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <Bell className="size-5 text-slate-400" />
                  <h2 {...titleProps} className="text-lg font-semibold text-slate-100">
                    История уведомлений
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {notificationHistory.length > 0 && (
                    <span className="text-[10px] text-slate-600 font-mono hidden sm:inline">
                      {notificationHistory.length} записей
                    </span>
                  )}
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

              {/* Search + Clear bar */}
              <div className="px-4 py-2 border-b border-slate-800/30 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/30 bg-slate-900/40">
                  <Search className="size-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по тексту..."
                    className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
                  />
                </div>
                {notificationHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={clearNotificationHistory}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-900/30 bg-red-950/20 text-red-400/80 text-xs hover:bg-red-950/40 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="size-3" />
                    <span className="hidden sm:inline">Очистить</span>
                  </button>
                )}
              </div>

              {/* Content */}
              {hasEntries ? (
                <ScrollArea className="flex-1">
                  <div className="p-3 flex flex-col gap-1.5">
                    {displayEntries.map((entry, i) => (
                      <HistoryEntryRow
                        key={entry.id}
                        entry={entry}
                        index={i}
                      />
                    ))}
                    {notificationHistory.length > MAX_DISPLAY && !searchQuery && (
                      <p className="text-center text-[10px] text-slate-600 py-2">
                        Показаны последние {MAX_DISPLAY} из {notificationHistory.length}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                /* Empty state */
                <div className="flex-1 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="flex flex-col items-center text-center"
                  >
                    <Bell className="size-12 text-slate-700/50 mb-4" />
                    <p className="text-slate-500 text-sm mb-1">
                      {searchQuery ? 'Ничего не найдено' : 'Уведомлений пока нет.'}
                    </p>
                    <p className="text-slate-600 text-xs max-w-[220px]">
                      {searchQuery
                        ? 'Попробуйте изменить поисковый запрос'
                        : 'События игры будут отображаться здесь'}
                    </p>
                  </motion.div>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2 border-t border-slate-800/20 bg-black/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 font-mono">
                    volodka://notifications
                  </span>
                  {hasEntries && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {displayEntries.length} / {notificationHistory.length}
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