'use client';

/* ══════════════════════════════════════════════════════════════════════════════
   Volodka RPG — Combat Damage Numbers
   Floating damage/heal/miss/status numbers with framer-motion animations
   ══════════════════════════════════════════════════════════════════════════════ */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type DamageNumberType =
  | 'damage'
  | 'critical'
  | 'heal'
  | 'miss'
  | 'poison'
  | 'burn'
  | 'freeze'
  | 'stun';

export interface DamageNumberEvent {
  id: string;
  type: DamageNumberType;
  value: number;
  /** World-space position hint (screen %). Falls back to container-relative random. */
  x?: number;
  y?: number;
}

export interface CombatDamageNumbersProps {
  events: DamageNumberEvent[];
  /** Container dimensions (width x height) for random spawn offsets */
  containerWidth?: number;
  containerHeight?: number;
  /** Called when an event animation finishes */
  onEventComplete?: (id: string) => void;
}

/* ── Variant config ────────────────────────────────────────────────────────── */

interface VariantConfig {
  color: string;
  fontSize: string;
  prefix: string;
  label?: string;
  duration: number;
  shadowColor: string;
}

const VARIANT_CONFIG: Record<DamageNumberType, VariantConfig> = {
  damage:   { color: '#f87171', fontSize: 'text-2xl', prefix: '-', duration: 1.2, shadowColor: 'rgba(248,113,113,0.7)' },
  critical: { color: '#facc15', fontSize: 'text-4xl', prefix: '-', duration: 1.85, shadowColor: 'rgba(250,204,21,0.8)', label: 'КРИТ' },
  heal:     { color: '#34d399', fontSize: 'text-2xl', prefix: '+', duration: 1.1, shadowColor: 'rgba(52,211,153,0.7)' },
  miss:     { color: '#94a3b8', fontSize: 'text-base', prefix: '',  duration: 0.9, shadowColor: 'rgba(148,163,184,0.3)', label: 'ПРОМАХ' },
  poison:   { color: '#4ade80', fontSize: 'text-sm',  prefix: '',  duration: 1.0, shadowColor: 'rgba(74,222,128,0.6)', label: 'ЯД' },
  burn:     { color: '#fb923c', fontSize: 'text-sm',  prefix: '',  duration: 1.0, shadowColor: 'rgba(251,146,60,0.6)', label: 'ГОРЕНИЕ' },
  freeze:   { color: '#22d3ee', fontSize: 'text-sm',  prefix: '',  duration: 1.0, shadowColor: 'rgba(34,211,238,0.6)', label: 'ОБМОРОЖЕНИЕ' },
  stun:     { color: '#c084fc', fontSize: 'text-sm',  prefix: '',  duration: 1.0, shadowColor: 'rgba(192,132,252,0.6)', label: 'ОГЛУШЕНИЕ' },
};

/* ── Single Number ─────────────────────────────────────────────────────────── */

interface SingleNumberProps {
  event: DamageNumberEvent;
  randomOffset: { x: number; y: number };
  onComplete: (id: string) => void;
}

const SingleNumber = memo(function SingleNumber({ event, randomOffset, onComplete }: SingleNumberProps) {
  const cfg = VARIANT_CONFIG[event.type];
  const isCritical = event.type === 'critical';
  const isMiss = event.type === 'miss';
  const isStatus = ['poison', 'burn', 'freeze', 'stun'].includes(event.type);

  const handleComplete = useCallback(() => {
    onComplete(event.id);
  }, [event.id, onComplete]);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none combat-dmg-number combat-dmg-number--${event.type} ${cfg.fontSize}`}
      style={{
        left: `calc(50% + ${randomOffset.x}px)`,
        top: `calc(40% + ${randomOffset.y}px)`,
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        zIndex: UI_LAYERS.DAMAGE_FLASH,
      }}
      initial={{
        opacity: 0,
        y: 0,
        scale: isCritical ? 0.6 : isMiss ? 0.9 : 0.8,
        rotate: isCritical ? -4 : isMiss ? 0 : 0,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -12, -40, isCritical ? -80 : -60],
        scale: isCritical
          ? [0.6, 1.5, 1.3, 1]
          : isMiss
            ? [0.9, 1, 1, 0.95]
            : [0.8, 1.1, 1, 0.95],
        rotate: isCritical ? [-4, 2, -1, 0] : 0,
        x: isMiss ? [0, 4, 8, 12] : 0,
      }}
      transition={{
        duration: cfg.duration,
        ease: [0.22, 1, 0.36, 1],
        times: isMiss
          ? [0, 0.15, 0.5, 1]
          : isCritical
            ? [0, 0.1, 0.2, 1]
            : [0, 0.15, 0.3, 1],
      }}
      onAnimationComplete={handleComplete}
    >
      {isMiss ? (
        <span className="tracking-[0.15em] uppercase">{cfg.label}</span>
      ) : isStatus ? (
        <span className="tracking-[0.08em]">
          {cfg.label}
          {event.value > 0 && (
            <span className="ml-1 opacity-70">-{event.value}</span>
          )}
        </span>
      ) : (
        <span>
          {cfg.prefix}{event.value}
          {isCritical && (
            <span className="ml-1.5 text-sm font-mono tracking-widest" style={{ color: '#fef08a' }}>
              {cfg.label}
            </span>
          )}
        </span>
      )}
    </motion.div>
  );
});

/* ── Screen shake overlay ──────────────────────────────────────────────────── */

function ScreenShake({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return (
    <motion.div
      key={trigger}
      className="fixed inset-0 pointer-events-none combat-micro-shake"
      style={{ zIndex: UI_LAYERS.DAMAGE_FLASH }}
      initial={{ x: 0, y: 0 }}
      animate={{
        x: [-2, 2, -1, 1, -2, 2, 0],
        y: [1, -1, 2, -2, 0, 1, 0],
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    />
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export function CombatDamageNumbers({
  events,
  onEventComplete,
}: CombatDamageNumbersProps) {
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const offsetsRef = useRef<Record<string, { x: number; y: number }>>({});

  /* Generate stable random offset per event ID */
  const getOffset = useCallback((id: string) => {
    if (!offsetsRef.current[id]) {
      offsetsRef.current[id] = {
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 30,
      };
    }
    return offsetsRef.current[id];
  }, []);

  /* Trigger screen shake on critical hits */
  useEffect(() => {
    const hasCrit = events.some((e) => e.type === 'critical');
    if (hasCrit) {
      setShakeTrigger((p) => p + 1);
    }
  }, [events]);

  /* Clean up old offsets */
  useEffect(() => {
    const ids = new Set(events.map((e) => e.id));
    for (const key of Object.keys(offsetsRef.current)) {
      if (!ids.has(key)) {
        delete offsetsRef.current[key];
      }
    }
  }, [events]);

  const handleComplete = useCallback((id: string) => {
    onEventComplete?.(id);
  }, [onEventComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: UI_LAYERS.DAMAGE_FLASH }}>
      <ScreenShake trigger={shakeTrigger} />
      <AnimatePresence>
        {events.map((event) => (
          <SingleNumber
            key={event.id}
            event={event}
            randomOffset={getOffset(event.id)}
            onComplete={handleComplete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
