/* ─── Volodka RPG – Floating text numbers/effects ───
   Shows floating +XP, +Karma, +Skill, damage numbers, item gained
   Pool system with framer-motion for smooth physics.
   Color-coded: green for gains, red for losses, gold for XP, cyan for karma.
*/

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import {
  floatingTextPool as pool,
  floatingTextListeners as listeners,
  TEXT_LIFETIME,
  TYPE_COLORS,
  TYPE_GLOW,
  TYPE_PREFIX,
  spawnFloatingText,
  floatXP,
  floatKarma,
  floatSkill,
  floatDamage,
  floatItem,
  floatCredits,
  notifyFloatingTextListeners,
} from './floatingTextApi';

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
        notifyFloatingTextListeners();
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
    }, EventBusPriority.FX));

    unsubs.push(eventBus.on('combat:victory', (payload) => {
      floatXP(payload.xpGained);
      if (payload.karmaGained > 0) {
        setTimeout(() => floatKarma(payload.karmaGained), 300);
      }
      if (payload.creditsGained > 0) {
        setTimeout(() => floatCredits(payload.creditsGained), 450);
      }
      if (payload.lootItemId) {
        const lootId = payload.lootItemId;
        setTimeout(() => floatItem(lootId), 600);
      }
    }, EventBusPriority.FX));

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
  const latestEntry = pool.length > 0 ? pool[pool.length - 1] : null;
  const latestLiveMessage = latestEntry
    ? `${TYPE_PREFIX[latestEntry.type]}${latestEntry.text}`
    : '';

  return (
    <>
      <AriaLiveRegion message={latestLiveMessage} priority="assertive" />
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: UI_LAYERS.TOASTS + 1 }}
        aria-hidden="true"
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
    </>
  );
}
