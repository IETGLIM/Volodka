'use client';

import { memo, useMemo, type CSSProperties } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Flame, Zap, Trophy, Crown } from 'lucide-react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ─── Types ──────────────────────────────────────────────────────────── */

export interface ComboCounterProps {
  /** Current combo count (0 = hidden) */
  currentCombo: number;
  /** Time remaining in ms before combo resets */
  timeRemaining: number;
  /** Max combo time window in ms */
  maxTime: number;
  /** Position preset */
  position?: 'bottom-center' | 'left-side' | 'right-side' | 'top-center';
  /** Whether to show */
  visible?: boolean;
}

type ComboTier = 'low' | 'medium' | 'high' | 'legendary';

interface ComboTierConfig {
  tier: ComboTier;
  label: string;
  color: string;
  glowColor: string;
  icon: typeof Flame;
}

/* ─── Constants ──────────────────────────────────────────────────────── */

const COMBO_TIERS: Record<number, Omit<ComboTierConfig, 'tier'>> = {
  /* 2-3 */ 2: { label: 'ХОРОШО!', color: '#00e5ff', glowColor: 'rgba(0, 229, 255, 0.6)', icon: Flame },
  /* 4-6 */ 4: { label: 'ОТЛИЧНО!', color: '#ffab00', glowColor: 'rgba(255, 171, 0, 0.7)', icon: Zap },
  /* 7-10*/ 7: { label: 'ПРЕВОСХОДНО!', color: '#00ff64', glowColor: 'rgba(0, 255, 100, 0.65)', icon: Trophy },
  /* 11+ */ 11: { label: 'ЛЕГЕНДАРНО!', color: '#00ff64', glowColor: 'rgba(0, 255, 100, 0.9)', icon: Crown },
};

/** Position configurations mapping preset to CSS classes/properties */
const POSITION_STYLES: Record<NonNullable<ComboCounterProps['position']>, CSSProperties> = {
  'bottom-center': {
    bottom: '120px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  'left-side': {
    bottom: '40%',
    left: '24px',
    transform: 'translateY(50%)',
  },
  'right-side': {
    bottom: '40%',
    right: '24px',
    transform: 'translateY(50%)',
  },
  'top-center': {
    top: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
};

/* ─── Helper Functions ───────────────────────────────────────────────── */

/**
 * Compute the active combo tier based on the current combo count.
 * Returns a complete config object including the tier name.
 */
function getComboTier(combo: number): ComboTierConfig {
  if (combo >= 11) return { ...COMBO_TIERS[11]!, tier: 'legendary' };
  if (combo >= 7) return { ...COMBO_TIERS[7]!, tier: 'high' };
  if (combo >= 4) return { ...COMBO_TIERS[4]!, tier: 'medium' };
  return { ...COMBO_TIERS[2]!, tier: 'low' };
}

/**
 * Calculate SVG stroke-dashoffset for circular progress ring.
 * @param progress - Value between 0 (full) and 1 (empty)
 * @param circumference - Total ring circumference (default 2π·18 ≈ 113)
 */
function getProgressOffset(progress: number, circumference = 2 * Math.PI * 18): number {
  return circumference * (1 - Math.max(0, Math.min(1, progress)));
}

/* ─── Animation Variants ─────────────────────────────────────────────── */

const ENTRY_VARIANTS: Variants = {
  hidden: { scale: 0.3, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
      staggerChildren: 0.05,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: -30,
    transition: { duration: 0.35, ease: [0.4, 0, 1, 1] as any },
  },
};

const COUNT_VARIANTS: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { type: 'spring' as const, stiffness: 500, damping: 25 },
  },
};

const PULSE_VARIANTS: Variants = {
  pulse: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: 'easeInOut' as any,
    },
  },
};

const SHAKE_VARIANTS: Variants = {
  shake: {
    x: [0, -2, 2, -2, 2, -1, 1, 0],
    transition: {
      duration: 0.35,
      repeat: Infinity,
      repeatDelay: 1.5,
      ease: 'easeInOut' as any,
    },
  },
};

/* ─── Component ──────────────────────────────────────────────────────── */

export const ComboCounter = memo(function ComboCounter({
  currentCombo,
  timeRemaining,
  maxTime,
  position = 'bottom-center',
  visible = true,
}: ComboCounterProps) {
  const reducedMotion = useEffectiveReducedMotion();

  // Memoized tier computation
  const tierConfig: ComboTierConfig | null = useMemo(() => {
    if (currentCombo < 2) return null;
    return getComboTier(currentCombo);
  }, [currentCombo]);

  // Memoized progress calculation (0–1 range)
  const progress = useMemo(
    () => (maxTime > 0 ? Math.min(timeRemaining / maxTime, 1) : 0),
    [timeRemaining, maxTime]
  );

  // Memoized SVG dash offset
  const dashOffset = useMemo(() => getProgressOffset(progress), [progress]);

  // Determine animation state based on tier
  const shouldPulse = useMemo(
    () => tierConfig && (tierConfig.tier === 'medium' || tierConfig.tier === 'high'),
    [tierConfig]
  );
  const shouldShake = useMemo(
    () => tierConfig?.tier === 'legendary',
    [tierConfig]
  );

  // Don't render if no valid combo or not visible
  const isActive = visible && currentCombo >= 2 && tierConfig !== null;
  const Icon = tierConfig?.icon ?? Flame;

  // Position style
  const positionStyle = POSITION_STYLES[position];

  return (
    <AnimatePresence mode="wait">
      {isActive && tierConfig && (
        <motion.div
          className="combo-counter-display fixed z-[var(--z-combat)] pointer-events-none select-none"
          style={{
            ...positionStyle,
            left: position.includes('right') ? undefined : positionStyle.left,
            right: position.includes('left') ? undefined : positionStyle.right,
            top: position.includes('bottom') ? undefined : positionStyle.top,
            bottom: position.includes('top') ? undefined : positionStyle.bottom,
          }}
          variants={ENTRY_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="status"
          aria-live="polite"
          aria-label={`Комбо ${currentCombo}x — ${tierConfig.label}`}
        >
          {/* Main container with cyber styling */}
          <motion.div
            className="relative flex flex-col items-center gap-1"
            animate={shouldPulse ? 'pulse' : shouldShake ? 'shake' : undefined}
            variants={shouldShake ? SHAKE_VARIANTS : PULSE_VARIANTS}
          >
            {/* Icon + Count Row */}
            <div className="flex items-center gap-2">
              {/* Tier Icon */}
              <motion.div
                className="relative"
                variants={COUNT_VARIANTS}
                initial="hidden"
                animate="visible"
                key={`icon-${tierConfig.tier}`}
              >
                <Icon
                  size={28}
                  className="drop-shadow-[0_0_8px_currentColor]"
                  style={{ color: tierConfig.color }}
                  aria-hidden="true"
                />
              </motion.div>

              {/* Combo Count */}
              <motion.span
                variants={reducedMotion ? undefined : COUNT_VARIANTS}
                initial="hidden"
                animate="visible"
                key={`count-${currentCombo}`}
                className={`font-mono font-black text-5xl tracking-wider leading-none${reducedMotion ? '' : ' hud-filmic-combo-ramp'}`}
                style={{
                  color: tierConfig.color,
                  textShadow: `
                    0 0 10px ${tierConfig.glowColor},
                    0 0 20px ${tierConfig.glowColor},
                    0 0 40px ${tierConfig.glowColor},
                    0 2px 4px rgba(0,0,0,0.8)
                  `,
                  WebkitTextStroke: tierConfig.tier === 'legendary'
                    ? '1px rgba(255,255,255,0.3)'
                    : undefined,
                }}
              >
                {currentCombo}
                <span className="text-3xl ml-0.5 opacity-80">x</span>
              </motion.span>
            </div>

            {/* Label Text */}
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{
                color: tierConfig.color,
                textShadow: `0 0 8px ${tierConfig.glowColor}, 0 0 16px ${tierConfig.glowColor}`,
                fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
              }}
            >
              {tierConfig.label}
            </motion.span>

            {/* Circular Timer Ring */}
            <div className="relative mt-1" style={{ width: 36, height: 36 }}>
              <svg
                width="36"
                height="36"
                viewBox="0 0 40 40"
                className="-rotate-90"
                aria-hidden="true"
              >
                {/* Background track */}
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3"
                />
                {/* Progress arc */}
                <motion.circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke={tierConfig.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 0.15, ease: 'linear' }
                  }
                  style={{
                    filter: `drop-shadow(0 0 4px ${tierConfig.glowColor})`,
                  }}
                />
              </svg>
              {/* Center dot indicator when time is running low */}
              {progress < 0.3 && (
                <motion.div
                  className="absolute inset-0 m-auto rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    backgroundColor: tierConfig.color,
                    boxShadow: `0 0 8px ${tierConfig.glowColor}`,
                  }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Legendary tier: Screen shake indicator */}
            {tierConfig.tier === 'legendary' && !reducedMotion && (
              <motion.div
                className="absolute inset-0 rounded-xl border pointer-events-none"
                initial={false}
                animate={{
                  borderColor: [
                    'rgba(0, 255, 100, 0)',
                    'rgba(0, 255, 100, 0.5)',
                    'rgba(0, 255, 100, 0)',
                  ],
                  boxShadow: [
                    'inset 0 0 20px rgba(0, 255, 100, 0)',
                    'inset 0 0 30px rgba(0, 255, 100, 0.3)',
                    'inset 0 0 20px rgba(0, 255, 100, 0)',
                  ],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: 'calc(100% + 24px)',
                  height: 'calc(100% + 24px)',
                  margin: '-12px',
                }}
                aria-hidden="true"
              />
            )}

            {/* Medium+ tier: Warning pulse ring */}
            {(tierConfig.tier === 'medium' || tierConfig.tier === 'high') &&
              !reducedMotion && (
                <motion.div
                  className="absolute inset-0 rounded-xl border pointer-events-none"
                  animate={{
                    scale: [1, 1.05, 1],
                    borderColor: [
                      `${tierConfig.color}33`,
                      `${tierConfig.color}88`,
                      `${tierConfig.color}33`,
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: 'calc(100% + 16px)',
                    height: 'calc(100% + 16px)',
                    margin: '-8px',
                  }}
                  aria-hidden="true"
                />
              )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/* ─── Default Export ─────────────────────────────────────────────────── */

export default ComboCounter;
