/**
 * Первый хинт после пробуждения — появляется на 1.5s после handoff, до открытия 'start' ноды.
 * Делает старт функционально понятным: WASD + E + стихи.
 * Ошеломительно: появляется из пыли, с filmic divider.
 */

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function PrologueFirstWakeHint() {
  const reducedMotion = useEffectiveReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute bottom-[18vh] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 px-6"
      aria-hidden
    >
      <div className="w-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 py-2 rounded-full bg-black/35 backdrop-blur-[12px] border border-white/8">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-stone-300/70 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px]">WASD</span>
          движение
        </span>
        <span className="w-px h-3 bg-white/10 hidden sm:block" />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-stone-300/70 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px]">E</span>
          взаимодействие
        </span>
        <span className="w-px h-3 bg-white/10 hidden sm:block" />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-amber-200/60 hidden sm:flex items-center gap-1">
          стихи — сила
        </span>
      </div>
    </motion.div>
  );
}
