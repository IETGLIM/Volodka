'use client';

/* ─── Level Up Notification — XP gain floating toasts ───
 *
 * Listens to `fx:xp_gain` on EventBus and shows brief "+X XP" floating
 * text at the bottom-right corner. The full-screen level-up celebration
 * is handled by the existing LevelUpEffect / LevelUpBanner components.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Types ─── */

interface XpGainEntry {
  id: string;
  amount: number;
  source?: string;
}

/* ─── Constants ─── */

const XP_TOAST_DURATION_MS = 2000;

let entryCounter = 0;

/* ─── Component ─── */

export function LevelUpNotification() {
  const reducedMotion = useEffectiveReducedMotion();
  const [xpGains, setXpGains] = useState<XpGainEntry[]>([]);
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Listen for fx:xp_gain events
  useEffect(() => {
    const unsub = eventBus.on('fx:xp_gain', (payload) => {
      const id = `xp-${Date.now()}-${++entryCounter}`;
      const entry: XpGainEntry = { id, amount: payload.amount, source: payload.source };

      setXpGains((prev) => [...prev.slice(-4), entry]);

      const timer = setTimeout(() => {
        setXpGains((prev) => prev.filter((e) => e.id !== id));
        dismissTimers.current.delete(id);
      }, reducedMotion ? 800 : XP_TOAST_DURATION_MS);
      dismissTimers.current.set(id, timer);
    });

    return () => {
      unsub();
      for (const timer of dismissTimers.current.values()) clearTimeout(timer);
      dismissTimers.current.clear();
    };
  }, [reducedMotion]);

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col-reverse items-end gap-2 pointer-events-none"
      style={{ zIndex: UI_LAYERS.TOASTS + 2 }}
      aria-live="polite"
      aria-label="Опыт"
    >
      <AnimatePresence mode="popLayout">
        {xpGains.map((entry) => (
          <motion.div
            key={entry.id}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, x: 10 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.4, ease: 'easeOut' }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-cyan-500/30
                       bg-black/70 backdrop-blur-sm"
            style={{
              boxShadow: '0 0 12px rgba(0,200,255,0.15)',
            }}
          >
            <span
              className="text-sm font-mono font-bold text-cyan-400"
              style={{ textShadow: '0 0 8px rgba(0,200,255,0.5)' }}
            >
              +{entry.amount} XP
            </span>
            {entry.source && (
              <span className="text-[10px] font-mono text-cyan-500/50">
                {entry.source}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}