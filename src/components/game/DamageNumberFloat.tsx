
/* ─── Volodka RPG – Damage Number Float ───
   Shows floating damage/heal/stress/XP numbers during combat and exploration.
   Listens on EventBus for combat:damage, combat:heal, and hooks into
   existing combat events (combat:hit, combat:victory, fx:xp_gain, fx:stat_change)
   for showing numbers. Queue system caps at 8 simultaneous numbers.
   Cyberpunk styling with glass-morphism, scan-line sweep, and type-colored glow.
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { useGamePhase } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Types ─── */

type DamageNumberType = 'damage' | 'heal' | 'stress' | 'xp' | 'critical';

interface DamageNumberEntry {
  id: string;
  text: string;
  type: DamageNumberType;
  value: number;
  /** Random horizontal offset to prevent stacking */
  offsetX: number;
  /** Starting vertical position (slightly randomized) */
  startY: number;
  createdAt: number;
}

/* ─── Constants ─── */

const MAX_NUMBERS = 8;
const NUMBER_LIFETIME_MS = 1500;

/* ─── Color map ─── */

const TYPE_COLORS: Record<DamageNumberType, string> = {
  damage: '#fb7185',     // rose-400
  heal: '#34d399',       // emerald-400
  stress: '#fbbf24',     // amber-400
  xp: 'var(--cyber-cyan)',         // cyan-400
  critical: '#fb7185',   // rose-400 (brighter effect)
};

const TYPE_GLOW: Record<DamageNumberType, string> = {
  damage: '0 0 12px rgba(251,113,133,0.6), 0 0 24px rgba(251,113,133,0.3)',
  heal: '0 0 12px rgba(52,211,153,0.5), 0 0 20px rgba(52,211,153,0.2)',
  stress: '0 0 12px rgba(251,191,36,0.5), 0 0 20px rgba(251,191,36,0.2)',
  xp: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.5), 0 0 20px rgb(var(--cyber-cyan-rgb) / 0.2)',
  critical: '0 0 18px rgba(251,113,133,0.8), 0 0 36px rgba(251,113,133,0.4), 0 0 54px rgba(251,113,133,0.2)',
};

/* ─── ID counter ─── */
let nextId = 0;

/* ─── Single damage number ─── */

function DamageNumber({ entry }: { entry: DamageNumberEntry }) {
  const color = TYPE_COLORS[entry.type];
  const glow = TYPE_GLOW[entry.type];
  const isDamage = entry.type === 'damage' || entry.type === 'critical';
  const isCritical = entry.type === 'critical';

  // Prefix logic
  let displayText = '';
  switch (entry.type) {
    case 'damage':
      displayText = `-${entry.value}`;
      break;
    case 'critical':
      displayText = `-${entry.value}!`;
      break;
    case 'heal':
      displayText = `+${entry.value}`;
      break;
    case 'stress':
      displayText = `\u26A1${entry.value}`;
      break;
    case 'xp':
      displayText = `+${entry.value} XP`;
      break;
  }

  // Animation variants based on type
  const animationProps = isDamage
    ? {
        // Damage: shake + float up
        initial: { opacity: 1, y: 0, scale: isCritical ? 1.3 : 1.1, x: entry.offsetX },
        animate: {
          opacity: 0,
          y: -80,
          scale: isCritical ? 1.6 : 1,
          x: entry.offsetX,
        },
      }
    : entry.type === 'stress'
      ? {
          // Stress: shake slightly + float
          initial: { opacity: 1, y: 0, scale: 1.05, x: entry.offsetX },
          animate: {
            opacity: 0,
            y: -70,
            scale: 1,
            x: entry.offsetX,
          },
        }
      : {
          // Heal/XP: gentle float
          initial: { opacity: 1, y: 0, scale: 1, x: entry.offsetX },
          animate: {
            opacity: 0,
            y: -90,
            scale: 1.05,
            x: entry.offsetX,
          },
        };

  return (
    <motion.div
      className="absolute pointer-events-none select-none damage-number-float"
      style={{
        left: '50%',
        top: `${entry.startY}%`,
        transform: 'translateX(-50%)',
      }}
      {...animationProps}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        duration: NUMBER_LIFETIME_MS / 1000,
        ease: 'easeOut',
      }}
    >
      <div
        className="relative px-3 py-1 rounded-md"
        style={{
          background: isDamage
            ? 'rgba(251,113,133,0.08)'
            : 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          border: `1px solid ${color}25`,
        }}
      >
        {/* Scan-line sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-md overflow-hidden"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${color}15 50%, transparent 100%)`,
            backgroundSize: '100% 300%',
          }}
          initial={{ backgroundPosition: '0% 0%' }}
          animate={{ backgroundPosition: '0% 100%' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Text */}
        <span
          className="font-mono font-bold text-2xl relative z-10"
          style={{
            color,
            textShadow: glow,
            letterSpacing: '0.03em',
          }}
        >
          {displayText}
        </span>

        {/* Damage shake animation overlay */}
        {isDamage && (
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            animate={{
              x: [0, -3, 3, -2, 2, -1, 0],
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
            style={{
              border: `1px solid ${color}40`,
              boxShadow: `0 0 8px ${color}30`,
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main component ─── */

export function DamageNumberFloat() {
  const [numbers, setNumbers] = useState<DamageNumberEntry[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const mode = useGamePhase();

  /** Add a damage number to the queue */
  const addNumber = useCallback((type: DamageNumberType, value: number) => {
    const id = `dmg-num-${++nextId}`;
    const offsetX = (Math.random() - 0.5) * 160; // -80 to +80px offset
    const startY = 30 + (Math.random() - 0.5) * 20; // 20-40% from top

    const entry: DamageNumberEntry = {
      id,
      text: '',
      type,
      value,
      offsetX,
      startY,
      createdAt: Date.now(),
    };

    setNumbers((prev) => {
      // If at max, remove oldest entries
      const updated = [...prev, entry];
      if (updated.length > MAX_NUMBERS) {
        // Remove oldest — mark them for fast fade
        const toRemove = updated.length - MAX_NUMBERS;
        const removed = updated.slice(0, toRemove);
        // Clear timers for removed entries
        for (const r of removed) {
          const t = timersRef.current[r.id];
          if (t) {
            clearTimeout(t);
            delete timersRef.current[r.id];
          }
        }
        return updated.slice(toRemove);
      }
      return updated;
    });

    // Auto-remove after lifetime
    const timer = setTimeout(() => {
      setNumbers((prev) => prev.filter((n) => n.id !== id));
      delete timersRef.current[id];
    }, NUMBER_LIFETIME_MS + 200); // extra 200ms for exit animation

    timersRef.current[id] = timer;
  }, []);

  /* ── Listen for combat:damage (authoritative float channel; combat:hit is FX-only) ── */
  useEffect(() => {
    const unsub = eventBus.on('combat:damage', (payload) => {
      const type: DamageNumberType = payload.critical ? 'critical' : 'damage';
      addNumber(type, payload.amount);
    }, EventBusPriority.FX);
    return unsub;
  }, [addNumber]);

  /* ── Listen for combat:heal ── */
  useEffect(() => {
    const unsub = eventBus.on('combat:heal', (payload) => {
      addNumber('heal', payload.amount);
    }, EventBusPriority.FX);
    return unsub;
  }, [addNumber]);

  /* ── FIX (dedup): combat:victory XP-число убрано — CombatSystem после
     victory диспетчит addXp → батчер эмитит fx:xp_gain, и старый листенер
     combat:victory рисовал ВТОРОЕ одинаковое число у прицела.
     Канонический эмиттер XP для UI — батчер (fx:xp_gain). ── */

  /* ── Listen for fx:xp_gain ── */
  useEffect(() => {
    const unsub = eventBus.on('fx:xp_gain', (payload) => {
      if (payload.amount > 0) {
        addNumber('xp', payload.amount);
      }
    });
    return unsub;
  }, [addNumber]);

  /* ── Listen for fx:stat_change (energy/stress changes) ── */
  useEffect(() => {
    const unsub = eventBus.on('fx:stat_change', (payload) => {
      const absVal = Math.abs(payload.delta);
      if (absVal === 0) return;

      if (payload.stat === 'energy') {
        addNumber(payload.type === 'negative' ? 'damage' : 'heal', absVal);
      } else if (payload.stat === 'stress') {
        if (payload.type === 'positive' || payload.delta > 0) {
          addNumber('stress', absVal);
        }
      }
    });
    return unsub;
  }, [addNumber]);

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

  /* ── Only visible during combat or exploration ── */
  const isVisible = mode === 'combat' || mode === 'exploration';

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: UI_LAYERS.COMBAT }}
    >
      <AnimatePresence>
        {numbers.map((entry) => (
          <DamageNumber key={entry.id} entry={entry} />
        ))}
      </AnimatePresence>
    </div>
  );
}
