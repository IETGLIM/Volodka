'use client';

/* ─── Volodka RPG – Floating text numbers/effects ───
   Shows floating +XP, +Karma, +Skill, damage numbers, item gained
   Pool system with framer-motion for smooth physics.
   Color-coded: green for gains, red for losses, gold for XP, cyan for karma.
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus } from '@/engine/EventBus';

/* ── Types ── */
export type FloatingTextType = 'xp' | 'karma' | 'skill' | 'damage' | 'heal' | 'item' | 'stress' | 'energy' | 'levelup' | 'custom';

export interface FloatingTextEntry {
  id: number;
  text: string;
  type: FloatingTextType;
  x: number;
  y: number;
  createdAt: number;
  /** Pre-computed random X offset to avoid Math.random() in render (hydration) */
  animateOffsetX: number;
}

/* ── Color map ── */
const TYPE_COLORS: Record<FloatingTextType, string> = {
  xp: '#fbbf24',          // amber-400
  karma: '#22d3ee',        // cyan-400
  skill: '#a78bfa',        // violet-400
  damage: '#f43f5e',       // rose-400
  heal: '#34d399',         // emerald-400
  item: '#f59e0b',         // amber-500
  stress: '#fb923c',       // orange-400
  energy: '#4ade80',       // green-400
  levelup: '#fbbf24',      // amber-400 (with extra glow)
  custom: '#94a3b8',       // slate-400
};

const TYPE_GLOW: Record<FloatingTextType, string> = {
  xp: '0 0 12px rgba(251,191,36,0.6)',
  karma: '0 0 12px rgba(34,211,238,0.6)',
  skill: '0 0 12px rgba(167,139,250,0.6)',
  damage: '0 0 12px rgba(244,63,94,0.6)',
  heal: '0 0 12px rgba(52,211,153,0.6)',
  item: '0 0 12px rgba(245,158,11,0.6)',
  stress: '0 0 12px rgba(251,146,60,0.6)',
  energy: '0 0 12px rgba(74,222,128,0.6)',
  levelup: '0 0 20px rgba(251,191,36,0.8), 0 0 40px rgba(251,191,36,0.4)',
  custom: '0 0 8px rgba(148,163,184,0.4)',
};

const TYPE_PREFIX: Record<FloatingTextType, string> = {
  xp: '+',
  karma: '+',
  skill: '+',
  damage: '-',
  heal: '+',
  item: '📦 ',
  stress: '+',
  energy: '+',
  levelup: '⬆ ',
  custom: '',
};

/* ── Pool management ── */
const MAX_POOL_SIZE = 15;
const TEXT_LIFETIME = 1800; // ms

let nextId = 0;
const pool: FloatingTextEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const fn of listeners) fn();
}

export function spawnFloatingText(
  text: string,
  type: FloatingTextType = 'custom',
  x?: number,
  y?: number,
) {
  const entry: FloatingTextEntry = {
    id: nextId++,
    text,
    type,
    x: x ?? (window.innerWidth / 2 + (Math.random() - 0.5) * 120),
    y: y ?? (window.innerHeight * 0.35 + (Math.random() - 0.5) * 60),
    createdAt: Date.now(),
    animateOffsetX: (Math.random() - 0.5) * 20,
  };

  pool.push(entry);

  // Trim pool if too large
  while (pool.length > MAX_POOL_SIZE) {
    pool.shift();
  }

  notifyListeners();
}

/** Convenience helpers */
export const floatXP = (amount: number) => spawnFloatingText(`${amount} XP`, 'xp');
export const floatKarma = (amount: number) => spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Карма`, 'karma');
export const floatSkill = (skill: string, amount: number) => spawnFloatingText(`${skill} +${amount}`, 'skill');
export const floatDamage = (amount: number) => spawnFloatingText(`${amount}`, 'damage');
export const floatHeal = (amount: number) => spawnFloatingText(`+${amount}`, 'heal');
export const floatItem = (name: string) => spawnFloatingText(name, 'item');
export const floatStress = (amount: number) => spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Стресс`, 'stress');
export const floatEnergy = (amount: number) => spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Энергия`, 'energy');
export const floatLevelUp = (level: number) => spawnFloatingText(`Уровень ${level}!`, 'levelup');

/* ── Component ── */
export function FloatingTextLayer() {
  const [, forceUpdate] = useState(0);
  const cleanupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to pool changes
  useEffect(() => {
    const onUpdate = () => forceUpdate((n) => n + 1);
    listeners.add(onUpdate);

    // Periodic cleanup of expired entries
    cleanupRef.current = setInterval(() => {
      const now = Date.now();
      const before = pool.length;
      // Remove expired entries from the front
      while (pool.length > 0 && now - pool[0].createdAt > TEXT_LIFETIME) {
        pool.shift();
      }
      if (pool.length !== before) {
        notifyListeners();
      }
    }, 200);

    return () => {
      listeners.delete(onUpdate);
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, []);

  // Listen to EventBus events for automatic floating text
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(eventBus.on('combat:hit', (payload) => {
      if (payload.isPlayerHit) {
        floatDamage(payload.damage);
      } else {
        floatDamage(payload.damage);
      }
    }));

    unsubs.push(eventBus.on('combat:victory', (payload) => {
      floatXP(payload.xpGained);
      if (payload.karmaGained > 0) {
        setTimeout(() => floatKarma(payload.karmaGained), 300);
      }
      if (payload.lootItemId) {
        const lootId = payload.lootItemId;
        setTimeout(() => floatItem(lootId), 600);
      }
    }));

    unsubs.push(eventBus.on('skill:level_up', (payload) => {
      floatSkill(payload.skill, payload.level);
    }));

    unsubs.push(eventBus.on('loot:reward', (payload) => {
      floatItem(payload.name);
    }));

    unsubs.push(eventBus.on('poem:collected', () => {
      spawnFloatingText('Стих собран!', 'karma');
    }));

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  const now = Date.now();

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: UI_LAYERS.TOASTS + 1 }}
    >
      <AnimatePresence>
        {pool.map((entry) => {
          const age = now - entry.createdAt;
          if (age > TEXT_LIFETIME) return null;

          const color = TYPE_COLORS[entry.type];
          const glow = TYPE_GLOW[entry.type];
          const prefix = TYPE_PREFIX[entry.type];
          const isLevelUp = entry.type === 'levelup';

          return (
            <motion.div
              key={entry.id}
              initial={{
                opacity: 1,
                y: 0,
                scale: isLevelUp ? 0.5 : 1,
                x: entry.x,
              }}
              animate={{
                opacity: 0,
                y: isLevelUp ? -120 : -70,
                scale: isLevelUp ? 1.3 : 1,
                x: entry.x + entry.animateOffsetX,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: isLevelUp ? 2.2 : 1.5,
                ease: 'easeOut',
              }}
              className="absolute pointer-events-none select-none"
              style={{
                left: 0,
                top: entry.y,
                color,
                textShadow: glow,
                fontFamily: 'monospace',
                fontWeight: isLevelUp ? 900 : 700,
                fontSize: isLevelUp ? '20px' : entry.type === 'damage' ? '18px' : '14px',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              {isLevelUp && (
                <motion.span
                  initial={{ scale: 2, opacity: 0.5 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="absolute inset-0 flex items-center justify-center text-amber-400/30"
                  style={{ textShadow: '0 0 30px rgba(251,191,36,0.5)' }}
                >
                  ⬆
                </motion.span>
              )}
              {prefix}{entry.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
