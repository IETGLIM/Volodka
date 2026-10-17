'use client';

/* ─── Inner Monologue Overlay — Volodka's thought bubble ─── */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import {
  getImmersiveVoiceOwner,
  onImmersiveVoiceFreed,
  onImmersiveVoiceThoughtPreempted,
  releaseImmersiveVoiceChannel,
  requestImmersiveVoiceChannel,
} from '@/engine/presentation/immersiveVoiceChannel';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useHudFocusMode } from '@/hooks/useHudFocusMode';
import { useTypewriter } from '@/hooks/useTypewriter';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** Z-index above DIALOGUE (30) but below EXAMINE (38). */
const THOUGHT_Z_INDEX = UI_LAYERS.DIALOGUE + 2;

/** Default display duration in ms before auto-dismiss. */
const DEFAULT_DURATION_MS = 4000;

/** Typewriter speed — slightly faster than dialogue for internal thoughts. */
const THOUGHT_TYPEWRITER_SPEED = 22;

/** v4.48.13: bounded FIFO — a burst of scene-entry thoughts never stacks
 *  more than this many behind an active voice line / another thought. */
const MAX_PENDING_THOUGHTS = 3;

interface ThoughtState {
  text: string;
  duration: number;
  key: number;
}

/**
 * Floating overlay that renders Volodka's inner monologue as a translucent
 * "thought bubble" card.  Listens to `volodka:thought` on the EventBus and
 * auto-dismisses after the configured duration (default 4 s).
 *
 * v4.48.13: thoughts and the Голос voice-line subtitles share ONE immersive
 * presentation lane (see immersiveVoiceChannel.ts) — a thought waits (FIFO,
 * max 3) while a voice line plays, and a playing thought is preempted when
 * the Голос starts, then re-shown. No more simultaneous inner-voice texts.
 *
 * Демо-мысль («Ещё один день…», +2с после маунта) удалена в v4.48.19:
 * единственная первая мысль — входная мысль сцены из sceneEntryThoughts.
 */
export function InnerMonologueOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  /* v4.57.0 («Тихий HUD»): мысль не спорит с осмотром/наррацией/катсценой —
   * не презентуется, пока экран занят; очередь FIFO продолжает жить. */
  const focusMode = useHudFocusMode();
  const [thought, setThought] = useState<ThoughtState | null>(null);
  const keyCounter = useRef(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX v4.48.19: initialThoughtShown + демо-мысль удалены. Захардкоженная
  // «Ещё один день... нужно собрать себя.» срабатывала через 2с после маунта
  // и дублировала настоящую входную мысль сцены из sceneEntryThoughts (3.5с) —
  // две мысли подряд на первой минуте. Единственная первая мысль — входная
  // мысль сцены из данных, не костыль в компоненте.
  const pendingRef = useRef<ThoughtState[]>([]);
  /** Mirror of the on-screen thought — sync refs without render dependency. */
  const presentingRef = useRef<ThoughtState | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current != null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const tryPresentNext = useCallback(() => {
    if (presentingRef.current) return; // already showing a thought
    if (pendingRef.current.length === 0) return;
    // Channel busy (voice or another presenter) — stay queued.
    if (!requestImmersiveVoiceChannel('thought')) return;
    const next = pendingRef.current.shift()!;
    keyCounter.current += 1;
    const presented = { ...next, key: keyCounter.current };
    presentingRef.current = presented;
    setThought(presented);
  }, []);

  const dismiss = useCallback(() => {
    clearDismissTimer();
    presentingRef.current = null;
    setThought(null);
    // Free the lane — the freed-listener surfaces the next queued thought.
    releaseImmersiveVoiceChannel('thought');
  }, [clearDismissTimer]);

  const showThought = useCallback(
    (text: string, duration: number) => {
      // Dedup: identical thought already on screen — do not restart it.
      if (presentingRef.current?.text === text) return;
      const queue = pendingRef.current;
      const last = queue[queue.length - 1];
      // Dedup back-to-back identical queued thoughts (idle system can re-emit).
      if (last?.text === text) return;
      if (queue.length >= MAX_PENDING_THOUGHTS) queue.shift();
      queue.push({ text, duration, key: 0 });
      tryPresentNext();
    },
    [tryPresentNext],
  );

  /* ── Auto-dismiss after duration ── */
  useEffect(() => {
    if (!thought) return;

    dismissTimerRef.current = setTimeout(dismiss, thought.duration);
    return () => clearDismissTimer();
  }, [thought, thought?.key, dismiss, clearDismissTimer]);

  /* ── Listen to EventBus ── */
  useEffect(() => {
    const unsub = eventBus.on('volodka:thought', (payload) => {
      showThought(payload.text, payload.duration ?? DEFAULT_DURATION_MS);
    });
    return unsub;
  }, [showThought]);

  /* ── Immersive voice lane: retry queue when the Голос frees the channel,
        and re-queue the current thought when the Голос preempts it ── */
  useEffect(() => {
    const unsubFreed = onImmersiveVoiceFreed(() => tryPresentNext());
    const unsubPreempted = onImmersiveVoiceThoughtPreempted(() => {
      clearDismissTimer();
      const current = presentingRef.current;
      if (current) {
        pendingRef.current.unshift({ text: current.text, duration: current.duration, key: 0 });
        presentingRef.current = null;
        setThought(null);
      }
    });
    return () => {
      unsubFreed();
      unsubPreempted();
    };
  }, [tryPresentNext, clearDismissTimer]);

  /* ── Unmount hygiene: never leave the lane held by a dead overlay ── */
  useEffect(() => {
    return () => {
      if (getImmersiveVoiceOwner() === 'thought') {
        releaseImmersiveVoiceChannel('thought');
      }
      pendingRef.current = [];
    };
  }, []);

  /* ── Typewriter ── */
  const { displayed, done } = useTypewriter(
    thought?.text ?? '',
    thought ? THOUGHT_TYPEWRITER_SPEED : 0,
  );

  return (
    <AnimatePresence mode="wait">
      {thought && !focusMode && (
        <motion.div
          key={`thought-${thought.key}`}
          data-testid="inner-monologue-overlay"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }}
          className="fixed left-0 right-0 flex justify-center pointer-events-none px-4"
          style={{ zIndex: THOUGHT_Z_INDEX, bottom: 120 }}
          aria-hidden
        >
          <div
            className="thought-overlay thought-pulse relative w-full max-w-[480px] rounded-lg p-4"
            role="status"
            aria-label="Мысли Володьки"
          >
            {/* ── Corner bracket decorations ── */}
            <span className="corner-bracket-sm corner-bracket-sm-tl" />
            <span className="corner-bracket-sm corner-bracket-sm-tr" />
            <span className="corner-bracket-sm corner-bracket-sm-bl" />
            <span className="corner-bracket-sm corner-bracket-sm-br" />

            {/* ── Header ── */}
            <p className="text-xs font-mono tracking-wider text-purple-400/60 mb-2 flex items-center gap-1.5">
              <span aria-hidden>💭</span>
              ВОЛОДЬКА (мысли)
            </p>

            {/* ── Thought text ── */}
            <p className="cyber-text-gradient thought-text text-typing-cursor text-sm sm:text-base font-mono leading-relaxed text-slate-300">
              {displayed}
              {!done && !reducedMotion ? (
                <span className="animate-pulse text-purple-400/70">▌</span>
              ) : null}
            </p>
          </div>

          {/* Accessibility live region */}
          <AriaLiveRegion
            message={done ? `Мысли: ${thought.text}` : ''}
            priority="polite"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}