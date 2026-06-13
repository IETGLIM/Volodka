
/* ─── Volodka RPG – Lore / Codex discovery toast ───
 * Queued toasts when a codex entry is first discovered.
 * Click opens the codex (K) focused on the entry.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, BookOpen, Sparkles, Star } from 'lucide-react';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { explorationLoreToastTopPx } from '@/shared/constants/hudLayout';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamePhase } from '@/store/selectors';
import type { LoreRarity } from '@/store/shared';
import {
  getLoreToastDurationMs,
  getLoreToastSubtitle,
  getLoreToastVisual,
  parseLoreRarity,
} from '@/hooks/loreDiscoveryPresentation';

interface LoreToastData {
  id: string;
  loreId: string;
  title: string;
  rarity: LoreRarity;
  category?: string;
  createdAt: number;
}

const MAX_TOASTS = 3;
const STAGGER_MS = 140;
const QUEUE_DELAY_MS = 120;

let nextToastId = 0;

function RarityIcon({ rarity, className, style }: { rarity: LoreRarity; className?: string; style?: React.CSSProperties }) {
  switch (rarity) {
    case 'common':
      return <BookOpen className={className} style={style} />;
    case 'uncommon':
      return <BookMarked className={className} style={style} />;
    case 'rare':
      return <Sparkles className={className} style={style} />;
    case 'legendary':
      return <Star className={className} style={style} />;
    default: {
      const _exhaustive: never = rarity;
      return _exhaustive;
    }
  }
}

function LoreToastCard({
  toast,
  index,
  reducedMotion,
  onOpenCodex,
  onDismiss,
}: {
  toast: LoreToastData;
  index: number;
  reducedMotion: boolean;
  onOpenCodex: (loreId: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accent = getLoreToastVisual(toast.rarity);
  const durationMs = getLoreToastDurationMs(toast.rarity);
  const subtitle = getLoreToastSubtitle(
    toast.rarity,
    toast.category as Parameters<typeof getLoreToastSubtitle>[1],
  );

  useEffect(() => {
    timerRef.current = setTimeout(() => setExiting(true), durationMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [durationMs]);

  const handleClick = useCallback(() => {
    onOpenCodex(toast.loreId);
    onDismiss(toast.id);
  }, [onDismiss, onOpenCodex, toast.id, toast.loreId]);

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {!exiting && (
        <motion.button
          type="button"
          layout
          key={toast.id}
          onClick={handleClick}
          aria-label={`Открыть запись кодекса: ${toast.title}. Нажмите K.`}
          className="lore-discovery-toast pointer-events-auto relative overflow-hidden text-left cursor-pointer"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            borderRadius: '8px',
            boxShadow: accent.shadow,
            minWidth: '220px',
            maxWidth: '320px',
            fontFamily: "'Geist Mono', monospace",
          }}
          initial={reducedMotion ? false : { opacity: 0, x: -60, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, x: -40, scale: 0.92 }}
          transition={{
            duration: reducedMotion ? 0 : 0.35,
            delay: reducedMotion ? 0 : index * (STAGGER_MS / 1000),
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {!reducedMotion && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${accent.primary}18 45%, ${accent.primary}40 50%, ${accent.primary}18 55%, transparent 100%)`,
                backgroundSize: '300% 100%',
              }}
              initial={{ backgroundPosition: '100% 0%' }}
              animate={{ backgroundPosition: '-100% 0%' }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          )}

          <div className="relative z-10 flex items-center gap-3 px-4 py-3">
            <div
              className="flex items-center justify-center w-9 h-9 shrink-0 rounded"
              style={{ background: accent.iconBg, boxShadow: `0 0 8px ${accent.glow}` }}
            >
              <RarityIcon rarity={toast.rarity} className="size-4.5" style={{ color: accent.primary }} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span
                className="text-sm font-mono font-bold tracking-wide truncate"
                style={{ color: accent.textColor, textShadow: `0 0 8px ${accent.glow}` }}
              >
                {toast.title}
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wide truncate">
                {subtitle}
              </span>
              <span className="text-[9px] font-mono text-slate-600 tracking-wide">
                Нажмите, чтобы открыть кодекс · K
              </span>
            </div>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 h-[2px]"
            style={{ background: accent.countdownBg, boxShadow: `0 0 6px ${accent.glow}` }}
            initial={{ width: '100%' }}
            animate={{ width: reducedMotion ? '0%' : '0%' }}
            transition={{ duration: reducedMotion ? 0 : durationMs / 1000, ease: 'linear' }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function LoreDiscoveryToast() {
  const [toasts, setToasts] = useState<LoreToastData[]>([]);
  const reducedMotion = useEffectiveReducedMotion();
  const slotGranted = useNotificationSlot('lore', NOTIFY_PRIORITY.lore, toasts.length > 0);
  const timersMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const timers = timersMap.current;
  const queueRef = useRef<Omit<LoreToastData, 'id' | 'createdAt'>[]>([]);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mode = useGamePhase();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers[id]) {
      clearTimeout(timers[id]);
      delete timers[id];
    }
  }, []);

  const enqueueToast = useCallback((payload: Omit<LoreToastData, 'id' | 'createdAt'>) => {
    const id = `lore-toast-${++nextToastId}`;
    const newToast: LoreToastData = { ...payload, id, createdAt: Date.now() };

    setToasts((prev) => [...prev, newToast].slice(-MAX_TOASTS));

    const durationMs = getLoreToastDurationMs(payload.rarity);
    timers[id] = setTimeout(() => {
      removeToast(id);
    }, durationMs + 600);
  }, [removeToast]);

  const flushQueue = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) return;
    enqueueToast(next);
    if (queueRef.current.length > 0) {
      queueTimerRef.current = setTimeout(flushQueue, QUEUE_DELAY_MS);
    }
  }, [enqueueToast]);

  const scheduleToast = useCallback((payload: Omit<LoreToastData, 'id' | 'createdAt'>) => {
    queueRef.current.push(payload);
    if (!queueTimerRef.current) {
      queueTimerRef.current = setTimeout(() => {
        queueTimerRef.current = null;
        flushQueue();
      }, QUEUE_DELAY_MS);
    }
  }, [flushQueue]);

  const openCodex = useCallback((loreId: string) => {
    eventBus.emit('ui:open_panel', { panel: 'codex', loreId });
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('lore:discovered', (payload) => {
      scheduleToast({
        loreId: payload.id,
        title: payload.title,
        rarity: parseLoreRarity(payload.rarity),
        category: payload.category,
      });
    }, EventBusPriority.UI);
    return unsub;
  }, [scheduleToast]);

  useEffect(() => {
    return () => {
      if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
        delete timers[key];
      }
    };
  }, []);

  if (mode === 'menu' || mode === 'intro') return null;
  if (!slotGranted) return null;

  return (
    <div
      className="fixed left-3 sm:left-4 pointer-events-none flex flex-col gap-2"
      data-exploration-ui
      data-testid="lore-discovery-toast"
      style={{ top: explorationLoreToastTopPx(), zIndex: UI_LAYERS.TOASTS }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <LoreToastCard
            key={toast.id}
            toast={toast}
            index={index}
            reducedMotion={reducedMotion}
            onOpenCodex={openCodex}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
