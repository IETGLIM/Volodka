/**
 * Morning Sync urgency — показывает, что синк скоро, добавляет легкую виньетку.
 * Функционально: игрок понимает, что после чтения надо идти к терминалу.
 * Оптимизировано: только когда first_reading завершен и morning_sync активен.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameSelector } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export function MorningSyncUrgency() {
  const show = useGameSelector((s) => {
    const fr = s.quests.find((q) => q.questId === 'first_reading');
    const ms = s.quests.find((q) => q.questId === 'morning_sync');
    return fr?.status === 'completed' && ms?.status === 'active';
  });

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [show]);

  if (!show) return null;

  const minutes = Math.floor(elapsed / 60);
  const urgency = elapsed > 120 ? 0.18 : 0.08; // через 2 минуты усиливаем

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: urgency }}
        className="fixed inset-0 pointer-events-none z-20 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(255,80,40,0.22)_100%)] mix-blend-soft-light"
        aria-hidden
      />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed left-1/2 -translate-x-1/2 bottom-[22vh] z-30 pointer-events-none"
          style={{ zIndex: UI_LAYERS.HUD }}
        >
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-[14px] border border-amber-500/20 shadow-[0_0_24px_rgba(255,120,40,0.15)]">
            <div className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse shadow-[0_0_8px_rgba(255,180,80,0.8)]" />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-amber-200/80">
              Синк через {5 - minutes}м • Терминал в углу комнаты
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
