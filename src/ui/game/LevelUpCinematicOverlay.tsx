'use client';

import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { RPG_MAX_CHARACTER_LEVEL, RPG_XP_SKILL_POINTS_PER_LEVEL } from '@/lib/rpgLeveling';

type LevelPayload = { newLevel: number; levelsGained: number; source?: string };

const HOLD_MS = 3600;

/**
 * Кинематографичный бит в стилистике смен / matrix-glitch: при `player:level_up`.
 * Нарратив: уровни = «годы» жизни героя, максимум 35 лет.
 */
export const LevelUpCinematicOverlay = memo(function LevelUpCinematicOverlay() {
  const [payload, setPayload] = useState<LevelPayload | null>(null);

  useEffect(() => {
    return eventBus.on('player:level_up', (p) => {
      setPayload({ newLevel: p.newLevel, levelsGained: p.levelsGained, source: p.source });
      audioEngine.playSfx('loot', 0.22);
    });
  }, []);

  useEffect(() => {
    if (!payload) return;
    const t = window.setTimeout(() => setPayload(null), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [payload]);

  const sp = payload ? payload.levelsGained * RPG_XP_SKILL_POINTS_PER_LEVEL : 0;
  const atMax = payload ? payload.newLevel >= RPG_MAX_CHARACTER_LEVEL : false;

  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          key="level-up-cine"
          className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="absolute inset-0 bg-[#020308]/88 backdrop-blur-sm"
            aria-hidden
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 255, 200, 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 200, 0.04) 1px, transparent 1px)
              `,
              backgroundSize: '18px 18px',
            }}
          />
          <motion.div
            className="relative max-w-md border border-cyan-500/40 bg-black/80 px-6 py-6 shadow-2xl shadow-cyan-500/10"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
            }}
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.04) 2px, rgba(0,255,200,0.04) 4px)',
              }}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-500/80">sync // life.grid</p>
            <h2
              className="mt-2 font-mono text-2xl font-bold tracking-tight text-cyan-100 sm:text-3xl"
              style={{ textShadow: '0 0 18px rgba(34, 211, 238, 0.35)' }}
            >
              {atMax ? 'Потолок жизни' : 'Новая ступень'}
            </h2>
            <p className="mt-3 font-mono text-4xl font-bold tabular-nums text-fuchsia-200/95 sm:text-5xl">
              {payload.newLevel} <span className="text-lg font-normal text-cyan-300/80 sm:text-2xl">лет</span>
            </p>
            {atMax && (
              <p className="mt-2 font-mono text-xs text-amber-200/80">Максимум сюжетного грида: {RPG_MAX_CHARACTER_LEVEL} лет.</p>
            )}
            <p className="mt-3 font-mono text-sm text-slate-300/90">
              {payload.levelsGained === 1
                ? `Опыт смены кристаллизовался в ещё один прожитый год.`
                : `+${payload.levelsGained} ступеней — как пакет ночных релизов подряд.`}
            </p>
            <p className="mt-2 font-mono text-xs text-violet-300/85">+{sp} оч. навыков (skill points)</p>
            {payload.source && (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-slate-500/90">· {payload.source}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
