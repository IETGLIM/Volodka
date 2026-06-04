
/* ─── Volodka RPG – AutoSave Indicator ─── */
/* Brief cyberpunk notification that appears when the game auto-saves,
 * then collapses into a minimal persistent icon showing time since
 * last save. Listens on the EventBus `game:saved` event (with source
 * field 'auto' | 'manual') rather than separate events. */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check, Clock } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Types ─── */

type SaveSource = 'auto' | 'manual';
type Phase = 'idle' | 'saving' | 'saved';

/* ─── Constants ─── */

/** How long the full notification stays visible after saving completes */
const NOTIFICATION_DURATION_MS = 3000;
/** How long the "saving" spinner shows before switching to "saved" */
const SAVING_DURATION_MS = 800;
/** Interval for updating the relative time string */
const TICK_INTERVAL_MS = 5000;

/* ─── Helpers ─── */

/** Format a millisecond delta as a short Russian relative-time string */
function formatRelativeTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);

  if (seconds < 5) return 'только что';
  if (seconds < 60) return `${seconds}с назад`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}м назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ч назад`;

  const days = Math.floor(hours / 24);
  return `${days}д назад`;
}

/** Very short label for the collapsed mini-icon */
function formatShortTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}с`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}м`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ч`;
  const days = Math.floor(hours / 24);
  return `${days}д`;
}

/* ─── Accent colours ─── */

const ACCENT = {
  auto: {
    primary: '#22d3ee',     // cyan-400
    glow: 'rgba(0, 229, 255, 0.15)',
    border: 'rgba(34, 211, 238, 0.35)',
    bg: 'rgba(8, 20, 30, 0.82)',
    shadow: '0 0 12px rgba(0, 229, 255, 0.12)',
  },
  manual: {
    primary: '#fbbf24',     // amber-400
    glow: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
    bg: 'rgba(20, 16, 8, 0.82)',
    shadow: '0 0 12px rgba(251, 191, 36, 0.12)',
  },
} as const;

/* ─── Component ─── */

export function AutoSaveIndicator() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [source, setSource] = useState<SaveSource>('auto');
  const [lastSaveAt, setLastSaveAt] = useState<number | null>(null);
  const [relativeLabel, setRelativeLabel] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Seed from store on mount ── */
  const storeLastSave = useGameStore((s) => s.lastSaveTimestamp);
  const storeLastAutoSave = useGameStore((s) => s.lastAutoSaveTimestamp);

  useEffect(() => {
    if (storeLastSave) {
      queueMicrotask(() => {
        setLastSaveAt(storeLastSave);
        setSource(storeLastAutoSave === storeLastSave ? 'auto' : 'manual');
      });
    }
  }, [storeLastSave, storeLastAutoSave]); // seed once on mount

  /* ── Listen for game:saved events ── */
  useEffect(() => {
    const unsub = eventBus.on('game:saved', (payload) => {
      const src: SaveSource = payload.source === 'manual' ? 'manual' : 'auto';
      setSource(src);
      setLastSaveAt(payload.timestamp);
      setPhase('saving');

      // Clear any pending timers
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

      // After brief spinner → show "saved"
      saveTimeoutRef.current = setTimeout(() => {
        setPhase('saved');

        // After full notification duration → collapse to mini-icon
        hideTimeoutRef.current = setTimeout(() => {
          setPhase('idle');
        }, NOTIFICATION_DURATION_MS);
      }, SAVING_DURATION_MS);
    });

    return () => {
      unsub();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  /* ── Tick: update relative time label ── */
  const updateLabel = useCallback(() => {
    if (lastSaveAt) {
      setRelativeLabel(formatRelativeTime(Date.now() - lastSaveAt));
    }
  }, [lastSaveAt]);

  useEffect(() => {
    queueMicrotask(() => updateLabel()); // initial
    tickRef.current = setInterval(updateLabel, TICK_INTERVAL_MS);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [updateLabel]);

  /* ── Derived ── */
  const accent = ACCENT[source];
  const shortTime = lastSaveAt ? formatShortTime(Date.now() - lastSaveAt) : null;

  /* ── Render ── */
  return (
    <div
      className="fixed bottom-4 right-4 pointer-events-none"
      style={{ zIndex: UI_LAYERS.TOASTS }}
    >
      <AnimatePresence mode="wait">
        {/* ── Full notification (saving / saved) ── */}
        {phase !== 'idle' && (
          <motion.div
            key="autosave-notification"
            className="pointer-events-auto relative overflow-hidden"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: accent.bg,
              border: `1px solid ${accent.border}`,
              borderRadius: '8px',
              boxShadow: accent.shadow,
              minWidth: '180px',
            }}
            initial={{ opacity: 0, x: 40, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Scan-line sweep animation */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, transparent 40%, ' +
                  `${accent.primary}15 50%, transparent 60%, transparent 100%)`,
                backgroundSize: '100% 200%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '0% 200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            />

            {/* Neon border glow pulse */}
            <motion.div
              className="absolute inset-0 rounded-[8px] pointer-events-none"
              animate={{
                boxShadow: [
                  `0 0 6px ${accent.glow}, inset 0 0 3px ${accent.glow}`,
                  `0 0 14px ${accent.glow}, inset 0 0 6px ${accent.glow}`,
                  `0 0 6px ${accent.glow}, inset 0 0 3px ${accent.glow}`,
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Content */}
            <div className="relative z-20 flex items-center gap-2.5 px-3.5 py-2.5">
              {/* Icon */}
              <div className="flex items-center justify-center w-6 h-6 shrink-0">
                {phase === 'saving' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Save
                      className="size-4"
                      style={{ color: accent.primary }}
                    />
                  </motion.div>
                ) : (
                  <Check
                    className="size-4"
                    style={{ color: accent.primary }}
                  />
                )}
              </div>

              {/* Text */}
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-xs font-mono font-semibold tracking-wide"
                  style={{ color: accent.primary }}
                >
                  {phase === 'saving'
                    ? 'Сохранение...'
                    : source === 'auto'
                      ? 'Автосохранение'
                      : 'Сохранено'}
                </span>
                {phase === 'saved' && (
                  <motion.span
                    className="text-[10px] font-mono"
                    style={{ color: 'rgba(148, 163, 184, 0.7)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {relativeLabel ?? 'только что'}
                  </motion.span>
                )}
              </div>

              {/* Subtle timestamp badge */}
              {phase === 'saved' && lastSaveAt && (
                <motion.span
                  className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    color: accent.primary,
                    background: `${accent.primary}10`,
                    border: `1px solid ${accent.primary}20`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {new Date(lastSaveAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </motion.span>
              )}
            </div>

            {/* Bottom progress bar (saving phase only) */}
            {phase === 'saving' && (
              <motion.div
                className="absolute bottom-0 left-0 h-[2px] rounded-b"
                style={{ background: accent.primary }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: SAVING_DURATION_MS / 1000, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        )}

        {/* ── Collapsed mini-icon (idle, has previous save) ── */}
        {phase === 'idle' && lastSaveAt && shortTime && (
          <motion.div
            key="autosave-mini"
            className="pointer-events-auto group relative flex items-center justify-center"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(8, 12, 18, 0.65)',
              border: `1px solid ${accent.border}`,
              boxShadow: accent.shadow,
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            title={
              source === 'auto'
                ? `Автосохранение: ${relativeLabel ?? '—'}`
                : `Ручное сохранение: ${relativeLabel ?? '—'}`
            }
          >
            {/* Icon */}
            <Clock
              className="size-3.5"
              style={{ color: accent.primary, opacity: 0.7 }}
            />

            {/* Time badge below the circle */}
            <span
              className="absolute -bottom-4 text-[8px] font-mono whitespace-nowrap"
              style={{ color: accent.primary, opacity: 0.6 }}
            >
              {shortTime}
            </span>

            {/* Hover expansion: show relative label */}
            <motion.div
              className="absolute right-full mr-2 whitespace-nowrap px-2 py-1 rounded text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                background: accent.bg,
                border: `1px solid ${accent.border}`,
                color: accent.primary,
                backdropFilter: 'blur(8px)',
              }}
            >
              {source === 'auto' ? 'Авто' : 'Ручное'}: {relativeLabel ?? '—'}
            </motion.div>

            {/* Subtle breathing glow */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
              }}
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
