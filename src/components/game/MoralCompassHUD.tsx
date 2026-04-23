'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export const MoralCompassHUD = memo(function MoralCompassHUD() {
  const karma = useGameStore((s) => s.playerState.karma);
  const prev = useRef(karma);
  const [flash, setFlash] = useState<{ text: string; kind: 'good' | 'bad' } | null>(null);

  useEffect(() => {
    const delta = karma - prev.current;
    prev.current = karma;
    if (Math.abs(delta) < 0.75) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- краткая вспышка при изменении кармы из стора
    setFlash({
      text: delta > 0 ? 'Благородный поступок' : 'Жестокий выбор',
      kind: delta > 0 ? 'good' : 'bad',
    });
    const t = window.setTimeout(() => setFlash(null), 2200);
    return () => window.clearTimeout(t);
  }, [karma]);

  const needleRotate = -70 + (Math.max(0, Math.min(100, karma)) / 100) * 140;

  return (
    <div className="pointer-events-none fixed bottom-6 left-4 z-40 w-[min(92vw,220px)] select-none">
      <div className="game-critical-motion game-fm-layer game-fm-layer-promote intro-recall-frame rounded-lg border border-cyan-500/35 bg-black/75 px-3 py-2 shadow-lg backdrop-blur-md">
        <div className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
          <span className="bg-gradient-to-r from-cyan-200 via-cyan-300 to-emerald-400/90 bg-clip-text text-transparent">
            Карма
          </span>
          <span className="text-cyan-200/90">{Math.round(karma)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            😇
          </span>
          <div className="relative h-3 flex-1 rounded-full bg-slate-800">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300 via-slate-200 to-rose-600"
              initial={false}
              animate={{ width: `${karma}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-4 w-1 origin-bottom rounded-sm bg-cyan-200 shadow"
              initial={false}
              style={{ marginLeft: -2, marginTop: -14 }}
              animate={{ rotate: needleRotate }}
              transition={{ type: 'spring', stiffness: 140, damping: 16 }}
            />
          </div>
          <span className="text-lg" aria-hidden>
            😈
          </span>
        </div>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2 rounded-md border px-2 py-1 text-center font-mono text-[11px]"
            style={{
              borderColor: flash.kind === 'good' ? 'rgba(52, 211, 153, 0.45)' : 'rgba(248, 113, 113, 0.45)',
              background:
                flash.kind === 'good' ? 'rgba(6, 78, 59, 0.55)' : 'rgba(69, 10, 10, 0.55)',
              color: flash.kind === 'good' ? '#a7f3d0' : '#fecaca',
            }}
          >
            {flash.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
