
/* ─── Volodka RPG – Directional Damage Indicator ───
   Shows a directional red flash on the screen edge when the player takes damage,
   and an emerald/green flash when the player heals.
   Listens on `combat:hit` (with optional direction) and `player:heal` EventBus events.
   Multiple hits stack (don't cancel previous flash).
   Heavy damage (>30) triggers a glitch displacement effect.
   Cyberpunk styling with scan-line overlay, radial gradients, and Framer Motion.
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus } from '@/engine/EventBus';

/* ─── Types ─── */

type DamageDirection = 'left' | 'right' | 'front' | 'back';

interface DamageFlashEntry {
  id: number;
  direction?: DamageDirection;
  damage: number;
  isHeavy: boolean;
  createdAt: number;
}

interface HealFlashEntry {
  id: number;
  amount: number;
  createdAt: number;
}

/* ─── Constants ─── */

const DAMAGE_FLASH_DURATION = 500;
const HEAL_FLASH_DURATION = 400;
const HEAVY_DAMAGE_THRESHOLD = 30;

/* ─── ID counter ─── */
let nextId = 0;

/* ─── Direction gradient definitions ─── */

function getDamageGradient(direction: DamageDirection, intensity: number): string {
  const alpha = Math.min(0.7, intensity);
  const alphaInner = Math.min(0.15, intensity * 0.2);

  switch (direction) {
    case 'left':
      return `radial-gradient(ellipse at 0% 50%, rgba(255,40,40,${alpha}) 0%, rgba(255,40,40,${alphaInner}) 40%, transparent 70%)`;
    case 'right':
      return `radial-gradient(ellipse at 100% 50%, rgba(255,40,40,${alpha}) 0%, rgba(255,40,40,${alphaInner}) 40%, transparent 70%)`;
    case 'front':
      return `radial-gradient(ellipse at 50% 0%, rgba(255,40,40,${alpha}) 0%, rgba(255,40,40,${alphaInner}) 40%, transparent 70%)`;
    case 'back':
      return `radial-gradient(ellipse at 50% 100%, rgba(255,40,40,${alpha}) 0%, rgba(255,40,40,${alphaInner}) 40%, transparent 70%)`;
  }
}

function getFullDamageGradient(intensity: number): string {
  const alpha = Math.min(0.4, intensity * 0.6);
  return `radial-gradient(ellipse at 50% 50%, rgba(255,40,40,${alpha}) 0%, rgba(255,40,40,${alpha * 0.3}) 40%, transparent 70%)`;
}

function getHealGradient(amount: number): string {
  const alpha = Math.min(0.35, (amount / 50) * 0.35);
  return `radial-gradient(ellipse at 50% 50%, rgba(52,211,153,${alpha}) 0%, rgba(52,211,153,${alpha * 0.3}) 40%, transparent 65%)`;
}

/* ─── Scan-line overlay ─── */

function ScanLineOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,40,40,0.03) 2px, rgba(255,40,40,0.03) 4px)',
        animation: 'damage-edge-flash 0.15s linear infinite',
      }}
    />
  );
}

/* ─── Glitch displacement overlay ─── */

function GlitchOverlay({ intensity }: { intensity: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        animation: `damage-glitch ${0.1 + intensity * 0.05}s steps(2) infinite`,
        '--glitch-offset': `${2 + intensity * 0.5}px`,
      } as React.CSSProperties}
    >
      {/* Red channel shift */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(255,0,0,0.05)',
          mixBlendMode: 'screen',
          transform: `translateX(${2 + intensity * 0.3}px)`,
        }}
      />
      {/* Cyan channel shift */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,255,255,0.03)',
          mixBlendMode: 'screen',
          transform: `translateX(-${2 + intensity * 0.3}px)`,
        }}
      />
    </div>
  );
}

/* ─── Single damage flash ─── */

function DamageFlash({ entry }: { entry: DamageFlashEntry }) {
  const intensity = Math.min(1, entry.damage / 50);
  const gradient = entry.direction
    ? getDamageGradient(entry.direction, intensity)
    : getFullDamageGradient(intensity);

  return (
    <motion.div
      className="damage-indicator-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DAMAGE_FLASH_DURATION / 1000, ease: 'easeOut' }}
      style={{ background: gradient }}
    >
      {/* Scan-line effect */}
      <ScanLineOverlay />

      {/* Heavy damage glitch */}
      {entry.isHeavy && <GlitchOverlay intensity={entry.damage / 50} />}
    </motion.div>
  );
}

/* ─── Single heal flash ─── */

function HealFlash({ entry }: { entry: HealFlashEntry }) {
  const gradient = getHealGradient(entry.amount);

  return (
    <motion.div
      className="heal-indicator-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: HEAL_FLASH_DURATION / 1000, ease: 'easeOut' }}
      style={{ background: gradient }}
    >
      {/* Emerald pulse shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(52,211,153,0.08) 0%, transparent 60%)',
          animation: 'heal-pulse 0.4s ease-out',
        }}
      />
    </motion.div>
  );
}

/* ─── Main component ─── */

export function DirectionalDamageIndicator() {
  const [damageFlashes, setDamageFlashes] = useState<DamageFlashEntry[]>([]);
  const [healFlashes, setHealFlashes] = useState<HealFlashEntry[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /* ── Add damage flash ── */
  const addDamageFlash = useCallback((damage: number, direction?: DamageDirection) => {
    const id = ++nextId;
    const isHeavy = damage > HEAVY_DAMAGE_THRESHOLD;

    const entry: DamageFlashEntry = {
      id,
      direction,
      damage,
      isHeavy,
      createdAt: Date.now(),
    };

    setDamageFlashes((prev) => [...prev, entry]);

    // Auto-remove after duration + exit animation buffer
    const timer = setTimeout(() => {
      setDamageFlashes((prev) => prev.filter((f) => f.id !== id));
      delete timersRef.current[`dmg-${id}`];
    }, DAMAGE_FLASH_DURATION + 150);

    timersRef.current[`dmg-${id}`] = timer;
  }, []);

  /* ── Add heal flash ── */
  const addHealFlash = useCallback((amount: number) => {
    const id = ++nextId;

    const entry: HealFlashEntry = {
      id,
      amount,
      createdAt: Date.now(),
    };

    setHealFlashes((prev) => [...prev, entry]);

    // Auto-remove after duration + exit animation buffer
    const timer = setTimeout(() => {
      setHealFlashes((prev) => prev.filter((f) => f.id !== id));
      delete timersRef.current[`heal-${id}`];
    }, HEAL_FLASH_DURATION + 150);

    timersRef.current[`heal-${id}`] = timer;
  }, []);

  /* ── Listen for combat:hit ── */
  useEffect(() => {
    const unsub = eventBus.on('combat:hit', (payload) => {
      if (payload.isPlayerHit) {
        addDamageFlash(payload.damage, payload.direction);
      }
    });
    return unsub;
  }, [addDamageFlash]);

  /* ── Listen for player:heal ── */
  useEffect(() => {
    const unsub = eventBus.on('player:heal', (payload) => {
      addHealFlash(payload.amount);
    });
    return unsub;
  }, [addHealFlash]);

  /* ── Also listen for combat:heal as a fallback heal indicator ── */
  useEffect(() => {
    const unsub = eventBus.on('combat:heal', (payload) => {
      addHealFlash(payload.amount);
    });
    return unsub;
  }, [addHealFlash]);

  /* ── Cleanup all timers on unmount ── */
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
        delete timers[key];
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: UI_LAYERS.GLITCH }}
    >
      {/* Damage flashes — stack on top of each other */}
      <AnimatePresence>
        {damageFlashes.map((entry) => (
          <DamageFlash key={`dmg-${entry.id}`} entry={entry} />
        ))}
      </AnimatePresence>

      {/* Heal flashes — stack on top of each other */}
      <AnimatePresence>
        {healFlashes.map((entry) => (
          <HealFlash key={`heal-${entry.id}`} entry={entry} />
        ))}
      </AnimatePresence>
    </div>
  );
}
