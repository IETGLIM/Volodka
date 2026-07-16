'use client';

/* ─── Inner Monologue Overlay — Volodka's thought bubble ─── */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** Z-index above DIALOGUE (30) but below EXAMINE (38). */
const THOUGHT_Z_INDEX = UI_LAYERS.DIALOGUE + 2;

/** Default display duration in ms before auto-dismiss. */
const DEFAULT_DURATION_MS = 4000;

/** Typewriter speed — slightly faster than dialogue for internal thoughts. */
const THOUGHT_TYPEWRITER_SPEED = 22;

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
 * On mount, shows a sample thought after 2 s to demonstrate the system.
 */
export function InnerMonologueOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const [thought, setThought] = useState<ThoughtState | null>(null);
  const keyCounter = useRef(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialThoughtShown = useRef(false);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current != null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDismissTimer();
    setThought(null);
  }, [clearDismissTimer]);

  const showThought = useCallback(
    (text: string, duration: number) => {
      clearDismissTimer();
      keyCounter.current += 1;
      setThought({ text, duration, key: keyCounter.current });
    },
    [clearDismissTimer],
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

  /* ── Sample thought on first scene entry only (respects React strict-mode double-mount) ── */
  useEffect(() => {
    if (initialThoughtShown.current) return;
    initialThoughtShown.current = true;
    const timer = setTimeout(() => {
      showThought('Ещё один день... нужно собрать себя.', DEFAULT_DURATION_MS);
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Typewriter ── */
  const { displayed, done } = useTypewriter(
    thought?.text ?? '',
    thought ? THOUGHT_TYPEWRITER_SPEED : 0,
  );

  return (
    <AnimatePresence>
      {thought && (
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