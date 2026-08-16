import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface CyberStatBarProps {
  value: number;
  max?: number;
  color: string;
  /** Optional explicit gradient string. If provided, overrides the auto-generated gradient from `color`. */
  gradient?: string;
  glowColor: string;
  showSegments?: boolean;
  shimmer?: boolean;
}

/* ─── Damage preview configuration ─── */

/** Damage delta below this (in raw stat units) is treated as noise — no preview. */
const DAMAGE_PREVIEW_THRESHOLD = 0.5;
/** How long the pending-damage ghost segment takes to drain to zero (ms). */
const DAMAGE_PREVIEW_DURATION_MS = 500;
/** When damage occurs, the main bar drops quickly so the ghost is visible. */
const MAIN_BAR_DAMAGE_DURATION_S = 0.15;
/** Normal main-bar animation duration (heals, etc.). */
const MAIN_BAR_NORMAL_DURATION_S = 0.8;
/** Ratio below which the low-HP heartbeat pulse kicks in. */
const LOW_HP_HEARTBEAT_RATIO = 0.25;

interface PendingDamage {
  /** Width of the ghost segment as a percentage of the bar (0–100). */
  pct: number;
  /** Left offset (as a percentage of the bar) where the ghost starts. */
  left: number;
  /** Monotonic key — bumping it forces framer-motion to re-mount the segment. */
  key: number;
}

export function CyberStatBar({
  value,
  max = 100,
  color,
  gradient: explicitGradient,
  glowColor: _glowColor,
  showSegments = true,
  shimmer = false,
}: CyberStatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const ratio = value / max;
  const isLow = ratio < 0.3;
  const isCritical = ratio < 0.15;
  const isHeartbeat = ratio < LOW_HP_HEARTBEAT_RATIO;

  /* Detect if `color` is already a gradient (starts with 'linear' or 'radial') */
  const isGradientColor = /^linear|^radial|^conic/.test(color.trim());

  /* Low-bar visual class:
   *  - < 25% → low-hp-heartbeat (red box-shadow pulse, 0.8s)
   *  - < 30% → existing low-bar-pulse / low-bar-pulse-amber
   *  The heartbeat overrides the slow pulse so we don't have two
   *  animations fighting over `box-shadow`. */
  const lowClass = isHeartbeat
    ? 'low-hp-heartbeat'
    : isLow
      ? color.includes('#ef4444') || color.includes('red') || color.includes('#f87171')
        ? 'low-bar-pulse'
        : 'low-bar-pulse-amber'
      : '';

  /* Use explicit gradient if provided, or auto-generate from hex color */
  const gradientFill = explicitGradient
    ? explicitGradient
    : isGradientColor
      ? color
      : `linear-gradient(90deg, ${color}cc 0%, ${color} 40%, ${color}ee 100%)`;

  /* ── Damage preview: track previous value, detect drops ── */
  const prevValueRef = useRef(value);
  const damageKeyRef = useRef(0);
  const [pendingDamage, setPendingDamage] = useState<PendingDamage | null>(null);

  /* Synchronous damage detection — runs during render so the main bar's
   * transition can switch to the fast variant on the same paint as the
   * value change (otherwise the slow 0.8s animation would hide the ghost). */
  const prevValueForRender = prevValueRef.current;
  const isDamageThisRender = value < prevValueForRender - DAMAGE_PREVIEW_THRESHOLD;

  useEffect(() => {
    const prev = prevValueRef.current;
    if (value < prev - DAMAGE_PREVIEW_THRESHOLD) {
      const newPct = Math.min(100, Math.max(0, (value / max) * 100));
      const damagePct = Math.min(100, Math.max(0, ((prev - value) / max) * 100));
      damageKeyRef.current += 1;
      setPendingDamage({ pct: damagePct, left: newPct, key: damageKeyRef.current });
    } else if (value > prev + DAMAGE_PREVIEW_THRESHOLD) {
      // Heal: no preview needed — clear any pending ghost.
      setPendingDamage(null);
    }
    prevValueRef.current = value;
  }, [value, max]);

  /* Main-bar transition: fast on damage (so the ghost is visible), normal
   * on heal or steady-state. */
  const mainBarTransition = isDamageThisRender
    ? { duration: MAIN_BAR_DAMAGE_DURATION_S, ease: 'easeOut' as const }
    : { duration: MAIN_BAR_NORMAL_DURATION_S, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  return (
    <div
      className={`relative h-2.5 bg-slate-800/80 rounded-full overflow-hidden hud-filmic-stat-fill ${lowClass} ${shimmer ? 'stat-shimmer' : ''} stat-bar-shimmer-effect`}
      style={{
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.35)',
      }}
    >
      {showSegments && (
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="absolute top-0 bottom-0 w-px bg-slate-700/50 stat-bar-segment-glow"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
      )}
      {/* Pending-damage ghost segment (Dark-Souls-style).
       *  Rendered BEHIND the main bar so it's only visible in the area
       *  no longer covered by the main fill. The `key` forces remount on
       *  each damage event so framer-motion replays initial→animate. */}
      {pendingDamage && (
        <motion.div
          key={pendingDamage.key}
          className="absolute inset-y-0 rounded-full pointer-events-none"
          style={{
            left: `${pendingDamage.left}%`,
            /* bg-red-300/40 — lighter than the main bar, drains over 500ms */
            background: 'rgba(252, 165, 165, 0.40)',
            boxShadow: 'inset 0 0 4px rgba(255, 80, 80, 0.25)',
          }}
          initial={{ width: `${pendingDamage.pct}%`, opacity: 1 }}
          animate={{ width: '0%', opacity: 0.6 }}
          transition={{ duration: DAMAGE_PREVIEW_DURATION_MS / 1000, ease: 'easeOut' }}
          onAnimationComplete={() => {
            // Clear the ghost once it has fully drained. We compare the
            // key to avoid clearing a newer ghost if a second hit landed
            // before the first finished draining.
            setPendingDamage((current) => (current && current.key === pendingDamage.key ? null : current));
          }}
        />
      )}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full hud-filmic-status-pulse hud-filmic-stat-bar-fill"
        style={{
          background: gradientFill,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.35)',
        }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={mainBarTransition}
      />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
        animate={{ width: `${pct}%` }}
        transition={mainBarTransition}
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2.5, ease: 'linear' }}
        />
      </motion.div>
      {/* Critical state: red edge glow (static — the heartbeat class on the
          container handles the pulsing glow at < 25%). */}
      {isCritical && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 6px rgba(255,50,50,0.3), 0 0 8px rgba(255,50,50,0.15)',
          }}
        />
      )}
      {/* Top highlight line with enhanced glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-full pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}
