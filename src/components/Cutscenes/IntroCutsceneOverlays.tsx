'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useGamePhaseStore } from '@/state/gamePhaseStore';

/**
 * Подписи и оверлей лифта поверх 3D-канваса во время `intro_cutscene`.
 */
export function IntroCutsceneOverlays() {
  const caption = useGamePhaseStore((s) => s.introCaption);
  const elevator = useGamePhaseStore((s) => s.introElevatorOverlay);

  return (
    <>
      <AnimatePresence>
        {caption ? (
          <motion.div
            key={caption}
            className="pointer-events-none fixed inset-x-0 bottom-[min(18vh,140px)] z-[96] flex justify-center px-4 font-[family-name:var(--font-geist-mono)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.35 }}
          >
            <div className="max-w-xl rounded border border-emerald-500/35 bg-black/88 px-4 py-2.5 text-center text-sm leading-snug text-emerald-100/95 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
              {caption}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {elevator ? (
          <motion.div
            key="elevator"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black font-[family-name:var(--font-geist-mono)] text-emerald-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-[11px] uppercase tracking-[0.35em] text-orange-400/90">VOLODKA_OS // LIFT.EXE</p>
            <p className="mt-6 text-4xl font-bold tabular-nums tracking-tight text-emerald-300 [text-shadow:0_0_20px_rgba(52,211,153,0.45)]">
              10 → 3
            </p>
            <p className="mt-4 max-w-sm px-6 text-center text-xs leading-relaxed text-slate-400">
              Панелька. Металл гудит. Кто-то на девятом уже ругается в голос — а ты просто считаешь этажи, как версии
              патчей.
            </p>
            <div className="mt-10 h-1 w-48 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-600 to-orange-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.2, ease: 'linear' }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
