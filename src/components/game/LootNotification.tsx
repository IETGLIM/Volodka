'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';

type LootPayload = { itemId: string; name: string; rarity: string };
type SkillPayload = { skill: string; level: number };

const RARITY_STYLE: Record<string, string> = {
  common: 'text-slate-200 border-slate-500/40',
  uncommon: 'text-emerald-200 border-emerald-400/40',
  rare: 'text-sky-200 border-sky-400/45',
  epic: 'text-fuchsia-200 border-fuchsia-400/45',
  legendary: 'text-amber-200 border-amber-400/50',
};

export const LootNotification = memo(function LootNotification() {
  const [loot, setLoot] = useState<LootPayload | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return eventBus.on('loot:reward', (p) => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      setLoot(p);
      eventBus.emit('sound:play', { type: 'loot' });
      hideTimer.current = window.setTimeout(() => setLoot(null), 3200);
    });
  }, []);

  return (
    <AnimatePresence>
      {loot && (
        <motion.div
          key={loot.itemId}
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: -120, scale: 0.85, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className={`max-w-sm rounded-xl border-2 bg-black/85 px-8 py-6 text-center shadow-2xl backdrop-blur-md ${
              RARITY_STYLE[loot.rarity] ?? RARITY_STYLE.common
            }`}
          >
            <div className="mb-2 text-4xl">🎁</div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Награда</div>
            <div className="mt-2 font-semibold text-lg">{loot.name}</div>
            <div className="mt-1 text-xs opacity-80">{loot.rarity}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const SkillUpNotification = memo(function SkillUpNotification() {
  const [skill, setSkill] = useState<SkillPayload | null>(null);

  useEffect(() => {
    return eventBus.on('skill:level_up', (p) => {
      setSkill(p);
      eventBus.emit('sound:play', { type: 'loot' });
      window.setTimeout(() => setSkill(null), 2800);
    });
  }, []);

  return (
    <AnimatePresence>
      {skill && (
        <motion.div
          key={`${skill.skill}-${skill.level}`}
          className="pointer-events-none fixed top-24 left-1/2 z-[99] -translate-x-1/2"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="rounded-lg border border-cyan-500/40 bg-slate-950/90 px-6 py-3 text-center shadow-xl backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/90">Навык</div>
            <div className="mt-1 text-sm font-semibold text-cyan-100">{skill.skill}</div>
            <div className="mt-2 flex justify-center gap-1">
              {Array.from({ length: Math.min(5, Math.max(1, skill.level)) }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="text-amber-300"
                >
                  ★
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
