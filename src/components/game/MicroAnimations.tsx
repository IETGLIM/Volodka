
/* ─── Volodka RPG – MicroAnimations ───
 *  A collection of micro-interaction components for stat changes,
 *  item gains, XP bars, karma shifts, and level-up banners.
 *  All UI text in Russian. CSS-first animations where possible.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  statChangePool,
  statChangeListeners,
  notifyStatChangePoolListeners,
  itemGainedPool,
  itemGainedListeners,
  notifyItemGainedPoolListeners,
} from './microAnimationsApi';

/* ══════════════════════════════════════════════════════════════
   STAT CHANGE INDICATOR — Shows "+5 Код" floating up
   ══════════════════════════════════════════════════════════════ */
interface StatChangeProps {
  statName: string;
  value: number;
  color?: string;
}

export function StatChangeIndicator({ statName, value, color }: StatChangeProps) {
  const isPositive = value > 0;
  const resolvedColor = color ?? (isPositive ? '#34d399' : '#f43f5e');
  const sign = isPositive ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.8 }}
      animate={{ opacity: 0, y: -40, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="absolute pointer-events-none select-none font-mono font-bold text-sm whitespace-nowrap"
      style={{
        color: resolvedColor,
        textShadow: `0 0 8px ${resolvedColor}60, 0 0 16px ${resolvedColor}30`,
      }}
    >
      {sign}{value} {statName}
    </motion.div>
  );
}

/* ── Pool-based StatChangeIndicator manager ── */
export function StatChangeLayer() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const onUpdate = () => forceUpdate((n) => n + 1);
    statChangeListeners.add(onUpdate);

    const timer = setInterval(() => {
      const now = Date.now();
      const before = statChangePool.length;
      while (statChangePool.length > 0 && now - statChangePool[0].createdAt > 1800) {
        statChangePool.shift();
      }
      if (statChangePool.length !== before) notifyStatChangePoolListeners();
    }, 200);

    return () => {
      statChangeListeners.delete(onUpdate);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: UI_LAYERS.TOASTS + 2 }}>
      <AnimatePresence>
        {statChangePool.map((entry) => {
          const age = Date.now() - entry.createdAt;
          if (age > 1800) return null;
          return (
            <StatChangeIndicator
              key={entry.id}
              statName={entry.statName}
              value={entry.value}
              color={entry.color}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ITEM GAINED POPUP — Brief popup when gaining an item
   ══════════════════════════════════════════════════════════════ */
export function ItemGainedPopupLayer() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const onUpdate = () => forceUpdate((n) => n + 1);
    itemGainedListeners.add(onUpdate);

    const timer = setInterval(() => {
      const now = Date.now();
      const before = itemGainedPool.length;
      while (itemGainedPool.length > 0 && now - itemGainedPool[0].createdAt > 2500) {
        itemGainedPool.shift();
      }
      if (itemGainedPool.length !== before) notifyItemGainedPoolListeners();
    }, 250);

    return () => {
      itemGainedListeners.delete(onUpdate);
      clearInterval(timer);
    };
  }, []);

  const rarityColors: Record<string, string> = {
    common: '#94a3b8',
    uncommon: '#34d399',
    rare: '#60a5fa',
    epic: '#a78bfa',
    legendary: '#fbbf24',
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none" style={{ zIndex: UI_LAYERS.TOASTS + 3 }}>
      <AnimatePresence>
        {itemGainedPool.map((entry) => {
          const age = Date.now() - entry.createdAt;
          if (age > 2500) return null;
          const color = rarityColors[entry.rarity ?? 'common'] ?? '#94a3b8';
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(15,23,42,0.8) 100%)',
                borderColor: `${color}40`,
                boxShadow: `0 0 20px ${color}15, 0 4px 16px rgba(0,0,0,0.4)`,
              }}
            >
              {entry.icon && <span className="text-lg">{entry.icon}</span>}
              <span className="text-sm font-medium font-mono" style={{ color, textShadow: `0 0 6px ${color}40` }}>
                {entry.name}
              </span>
              <span className="text-[10px] text-slate-500">получено</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   XP GAIN BAR — Animated XP bar that fills up when XP is gained
   ══════════════════════════════════════════════════════════════ */
interface XPGainBarProps {
  currentXP: number;
  xpToNext: number;
  previousXP: number;
}

export function XPGainBar({ currentXP, xpToNext, previousXP }: XPGainBarProps) {
  const [showGain, setShowGain] = useState(false);
  const [gainAmount, setGainAmount] = useState(0);
  const prevXPRef = useRef(previousXP);

  useEffect(() => {
    if (currentXP > prevXPRef.current) {
      setGainAmount(currentXP - prevXPRef.current);
      setShowGain(true);
      const timer = setTimeout(() => setShowGain(false), 2000);
      prevXPRef.current = currentXP;
      return () => clearTimeout(timer);
    }
    prevXPRef.current = currentXP;
  }, [currentXP]);

  const pct = Math.min(100, (currentXP / xpToNext) * 100);

  return (
    <div className="relative">
      <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #0891b2, var(--cyber-cyan))',
            boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
        />
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4, ease: 'linear' }}
          />
        </motion.div>
      </div>
      {/* XP gain text */}
      <AnimatePresence>
        {showGain && gainAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: -12 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold font-mono text-cyan-400 whitespace-nowrap"
            style={{ textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.6)' }}
          >
            +{gainAmount} XP
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-slate-500 font-mono">{currentXP}</span>
        <span className="text-[9px] text-slate-500 font-mono">{xpToNext} XP</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KARMA SHIFT INDICATOR — Shows karma shift with color
   ══════════════════════════════════════════════════════════════ */
interface KarmaShiftProps {
  delta: number;
  currentKarma: number;
}

export function KarmaShiftIndicator({ delta, currentKarma }: KarmaShiftProps) {
  const isPositive = delta > 0;
  const color = isPositive ? 'var(--cyber-cyan)' : '#fb7185';
  const label = isPositive
    ? (currentKarma >= 70 ? 'Свет' : 'Добро')
    : (currentKarma <= 30 ? 'Тьма' : 'Тень');

  return (
    <motion.div
      initial={{ opacity: 1, scale: 0.7 }}
      animate={{ opacity: 0, scale: 1.2, y: -30 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className="flex items-center gap-1.5 pointer-events-none select-none"
      style={{ color, textShadow: `0 0 10px ${color}60` }}
    >
      <span className="text-lg">☯</span>
      <span className="font-mono font-bold text-sm">
        {isPositive ? '+' : ''}{delta}
      </span>
      <span className="text-xs opacity-70">{label}</span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LEVEL UP BANNER — Full-width banner with particle effects
   ══════════════════════════════════════════════════════════════ */
interface LevelUpBannerProps {
  level: number;
  visible: boolean;
  onHide?: () => void;
}

function LevelUpParticle({ delay, color }: { delay: number; color: string }) {
  const angle = Math.random() * Math.PI * 2;
  const distance = 40 + Math.random() * 60;

  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full"
      style={{
        background: color,
        left: '50%',
        top: '50%',
        boxShadow: `0 0 4px ${color}`,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0.2,
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    />
  );
}

export function LevelUpBanner({ level, visible, onHide }: LevelUpBannerProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const visibleRef = useRef(visible);
  const onHideRef = useRef(onHide);

  // Keep refs up to date inside effects only
  useEffect(() => {
    visibleRef.current = visible;
    onHideRef.current = onHide;
  });

  useEffect(() => {
    if (visible) {
      // Use setTimeout to avoid synchronous setState in effect
      const showTimer = setTimeout(() => setInternalVisible(true), 0);
      const hideTimer = setTimeout(() => {
        setInternalVisible(false);
        onHideRef.current?.();
      }, 3000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {internalVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="fixed top-1/4 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: UI_LAYERS.TOASTS + 5 }}
        >
          <div
            className="relative flex flex-col items-center px-10 py-6 rounded-xl border backdrop-blur-md overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(0,0,0,0.9) 50%, rgba(251,191,36,0.1) 100%)',
              borderColor: 'rgba(251,191,36,0.5)',
              boxShadow: '0 0 50px rgba(251,191,36,0.2), 0 0 100px rgba(251,191,36,0.08), 0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {/* Decorative top line */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />

            {/* Particle effects */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <LevelUpParticle
                  key={i}
                  delay={0.1 + i * 0.05}
                  color={i % 2 === 0 ? '#fbbf24' : 'var(--cyber-cyan)'}
                />
              ))}
            </div>

            {/* Level up text */}
            <motion.span
              className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/70 mb-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Новый уровень
            </motion.span>

            <motion.div
              className="text-4xl font-black font-mono text-amber-300"
              style={{ textShadow: '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3)' }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            >
              {level}
            </motion.div>

            <motion.span
              className="text-xs font-mono text-amber-400/50 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              УРОВЕНЬ ДОСТИГНУТ
            </motion.span>

            {/* Decorative bottom line */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent)' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
