'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const QUEST_NOTIFY_SRC = '/sounds/quest_notify.mp3';

function tryPlayQuestNotify(): void {
  if (typeof window === 'undefined') return;
  try {
    const a = new Audio(QUEST_NOTIFY_SRC);
    a.volume = 0.45;
    void a.play().catch(() => {});
  } catch {
    /* placeholder sound may be absent */
  }
}

export type QuestAcceptedGlitchToastProps = {
  open: boolean;
  title?: string;
  body: string;
  onDismiss: () => void;
  /** Автоскрытие, мс */
  autoHideMs?: number;
};

/**
 * Всплывающее «терминальное» окно принятия квеста (киберпанк / матрица).
 */
export function QuestAcceptedGlitchToast({
  open,
  title = '> QUEST_ACCEPTED.exe',
  body,
  onDismiss,
  autoHideMs = 5200,
}: QuestAcceptedGlitchToastProps) {
  const playedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      playedRef.current = false;
      return;
    }
    if (!playedRef.current) {
      playedRef.current = true;
      tryPlayQuestNotify();
    }
    const t = window.setTimeout(onDismiss, autoHideMs);
    return () => window.clearTimeout(t);
  }, [open, onDismiss, autoHideMs]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="quest-toast"
          className="pointer-events-none fixed left-1/2 top-[min(18vh,120px)] z-[60] w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 font-[family-name:var(--font-geist-mono)]"
          initial={{ opacity: 0, skewX: -6, scale: 0.94 }}
          animate={{ opacity: 1, skewX: 0, scale: 1 }}
          exit={{ opacity: 0, skewX: 4, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          <div
            className="border border-emerald-500/50 bg-black/92 px-4 py-3 shadow-[0_0_28px_rgba(16,185,129,0.35),0_0_48px_rgba(251,146,60,0.12)]"
            style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
          >
            <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-500/75">
              VOLODKA_OS v.1.3 // USER: root // CONN: SECURE
            </p>
            <p className="mt-1.5 text-sm font-semibold tracking-wide text-emerald-300 [text-shadow:0_0_12px_rgba(52,211,153,0.55)]">
              {title}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-orange-100/90 [text-shadow:0_0_10px_rgba(251,146,60,0.25)]">
              {body}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
