/* eslint-disable react-refresh/only-export-components */
'use client';

import { memo, useMemo, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ─── Type Definitions ────────────────────────────────────────────────── */

export type DamageType = 'physical' | 'fire' | 'ice' | 'electric' | 'poison' | 'heal' | 'true' | 'status';
export type HitType = 'normal' | 'critical' | 'miss' | 'resist' | 'block' | 'evade' | 'weak';

/**
 * Represents a single damage/heal event to display as floating text.
 * Events are created externally and pushed into the system.
 */
export interface DamageEvent {
  /** Unique identifier for this event */
  id: string;
  /** Damage or heal value (0 for text-only events like MISS) */
  value: number;
  /** Type of damage for color coding */
  type: DamageType;
  /** How the hit landed (affects size and animation) */
  hitType: HitType;
  /** Screen position as percentage (0-100%) */
  position: { x: number; y: number };
  /** Timestamp when event was created (Date.now()) */
  timestamp: number;
  /** Override display text (e.g., "BURNING", "LEVEL UP!") */
  text?: string;
  /** Optional combo total for multi-hit attacks */
  comboTotal?: number;
  /** Whether this is a kill shot (triggers special effect) */
  isKillShot?: boolean;
}

/** Props for the DamageFloatSystem component */
export interface DamageFloatSystemProps {
  /** Array of active damage events to display */
  events: DamageEvent[];
  /** Duration each event stays visible in milliseconds (default: 1500) */
  displayDuration?: number;
  /** Whether the system is enabled and rendering */
  enabled?: boolean;
  /** Maximum simultaneous floating texts (default: 20) */
  maxSimultaneous?: number;
}

/* ─── Constants ───────────────────────────────────────────────────────── */

/** Default display duration in milliseconds */
const DEFAULT_DURATION = 1500;

/** Maximum supported simultaneous floating texts */
const MAX_SIMULTANEOUS = 20;

/** Random offset range to prevent stacking (pixels) */
const RANDOM_OFFSET_RANGE = 15;

/** Float distance upward in pixels */
const FLOAT_DISTANCE = -60;

/** Fade start time as ratio of lifetime (0-1) */
const FADE_START_RATIO = 0.7;

/* ─── Color Configuration ─────────────────────────────────────────────── */

interface DamageColorConfig {
  main: string;
  glow: string;
  shadow: string;
}

/** Color mapping for each damage type */
const DAMAGE_COLORS: Record<DamageType, DamageColorConfig> = {
  physical: {
    main: '#e8e8e8',
    glow: 'rgba(232, 232, 232, 0.7)',
    shadow: '0 0 6px rgba(232, 232, 232, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  fire: {
    main: '#ff6633',
    glow: 'rgba(255, 102, 51, 0.85)',
    shadow: '0 0 8px rgba(255, 102, 51, 0.9), 0 0 16px rgba(255, 68, 0, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  ice: {
    main: '#44ddff',
    glow: 'rgba(68, 221, 255, 0.85)',
    shadow: '0 0 8px rgba(68, 221, 255, 0.9), 0 0 16px rgba(68, 221, 255, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  electric: {
    main: '#aaeeff',
    glow: 'rgba(170, 238, 255, 0.85)',
    shadow: '0 0 10px rgba(170, 238, 255, 1), 0 0 20px rgba(100, 200, 255, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  poison: {
    main: '#44ff66',
    glow: 'rgba(68, 255, 102, 0.75)',
    shadow: '0 0 6px rgba(68, 255, 102, 0.7), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  heal: {
    main: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.8)',
    shadow: '0 0 8px rgba(0, 255, 136, 0.9), 0 0 16px rgba(0, 255, 136, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  true: {
    main: '#dd44ff',
    glow: 'rgba(221, 68, 255, 0.85)',
    shadow: '0 0 10px rgba(221, 68, 255, 1), 0 0 20px rgba(180, 0, 255, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  status: {
    main: '#ffaa00',
    glow: 'rgba(255, 170, 0, 0.75)',
    shadow: '0 0 6px rgba(255, 170, 0, 0.7), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
};

/** Special colors for specific text variants */
const SPECIAL_COLORS: Record<string, DamageColorConfig> = {
  critical: {
    main: '#ffdd00',
    glow: 'rgba(255, 221, 0, 1)',
    shadow: '0 0 12px rgba(255, 221, 0, 1), 0 0 24px rgba(255, 180, 0, 0.6), 0 0 36px rgba(255, 150, 0, 0.3), 3px 3px 4px rgba(0, 0, 0, 0.7)',
  },
  miss: {
    main: '#888888',
    glow: 'rgba(136, 136, 136, 0.4)',
    shadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  },
  resist: {
    main: '#cccccc',
    glow: 'rgba(204, 204, 204, 0.5)',
    shadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  },
  block: {
    main: '#4488ff',
    glow: 'rgba(68, 136, 255, 0.7)',
    shadow: '0 0 8px rgba(68, 136, 255, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  evade: {
    main: '#aaaaaa',
    glow: 'rgba(170, 170, 170, 0.5)',
    shadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  },
  weak: {
    main: '#999999',
    glow: 'rgba(153, 153, 153, 0.4)',
    shadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  },
  levelup: {
    main: '#ffd700',
    glow: 'rgba(255, 215, 0, 1)',
    shadow: '0 0 15px rgba(255, 215, 0, 1), 0 0 30px rgba(255, 180, 0, 0.7), 0 0 45px rgba(255, 150, 0, 0.4), 3px 3px 4px rgba(0, 0, 0, 0.7)',
  },
  xp: {
    main: '#00ffee',
    glow: 'rgba(0, 255, 238, 0.8)',
    shadow: '0 0 8px rgba(0, 255, 238, 0.9), 2px 2px 4px rgba(0, 0, 0, 0.7)',
  },
  killshot: {
    main: '#ff2222',
    glow: 'rgba(255, 34, 34, 1)',
    shadow: '0 0 15px rgba(255, 34, 34, 1), 0 0 30px rgba(255, 0, 0, 0.7), 0 0 45px rgba(255, 0, 0, 0.4), 3px 3px 4px rgba(0, 0, 0, 0.8)',
  },
};

/** Font sizes based on hit type */
const FONT_SIZES: Record<HitType | 'status' | 'levelup', number> = {
  normal: 24,
  critical: 36,
  miss: 16,
  resist: 14,
  block: 18,
  evade: 16,
  weak: 14,
  status: 12,
  levelup: 28,
};

/* ─── Status Effect Colors ────────────────────────────────────────────── */

interface StatusEffectConfig {
  text: string;
  color: DamageColorConfig;
}

/** Configuration for status effect displays */
const STATUS_EFFECTS: Record<string, StatusEffectConfig> = {
  burning: { text: 'ГОРЕНИЕ', color: { main: '#ff4400', glow: 'rgba(255, 68, 0, 0.8)', shadow: '0 0 8px rgba(255, 68, 0, 0.9), 1px 1px 2px rgba(0,0,0,0.6)' } },
  frozen: { text: 'ОМОРОЖЕНИЕ', color: { main: '#88ffff', glow: 'rgba(136, 255, 255, 0.8)', shadow: '0 0 8px rgba(136, 255, 255, 0.9), 1px 1px 2px rgba(0,0,0,0.6)' } },
  stunned: { text: 'ОГЛУШЕНИЕ', color: { main: '#ffff00', glow: 'rgba(255, 255, 0, 0.8)', shadow: '0 0 8px rgba(255, 255, 0, 0.9), 1px 1px 2px rgba(0,0,0,0.6)' } },
  poisoned: { text: 'ОТРАВЛЕНИЕ', color: { main: '#44ff44', glow: 'rgba(68, 255, 68, 0.8)', shadow: '0 0 8px rgba(68, 255, 68, 0.9), 1px 1px 2px rgba(0,0,0,0.6)' } },
  bleeding: { text: 'КРОВОТЕЧЕНИЕ', color: { main: '#cc2222', glow: 'rgba(204, 34, 34, 0.8)', shadow: '0 0 8px rgba(204, 34, 34, 0.9), 1px 1px 2px rgba(0,0,0,0.6)' } },
  shocked: { text: 'ПОРАЖЕНИЕ', color: { main: '#aaddff', glow: 'rgba(170, 221, 255, 0.9)', shadow: '0 0 10px rgba(170, 221, 255, 1), 1px 1px 2px rgba(0,0,0,0.6)' } },
};

/* ─── Helper Functions ───────────────────────────────────────────────── */

/** Simple counter for generating unique IDs */
let idCounter = 0;

/**
 * Generate a unique ID for damage events.
 * @returns Unique string identifier
 */
function generateId(): string {
  idCounter = (idCounter + 1) % 1000000;
  return `dmg-${Date.now()}-${idCounter}`;
}

/**
 * Create a new damage event with all required properties.
 * This is the primary API for external code to push damage events.
 * 
 * @param value - Damage/heal amount (0 for text-only events)
 * @param type - Damage type for color coding
 * @param hitType - How the hit landed
 * @param position - Screen position as percentage (0-100%)
 * @param options - Optional overrides (text, comboTotal, isKillShot)
 * @returns Complete DamageEvent object
 * 
 * @example
 * // Normal physical hit
 * createDamageEvent(150, 'physical', 'normal', { x: 50, y: 40 });
 * 
 * // Critical fire hit
 * createDamageEvent(999, 'fire', 'critical', { x: 45, y: 35 });
 * 
 * // Heal event
 * createDamageEvent(200, 'heal', 'normal', { x: 70, y: 60 });
 * 
 * // Miss
 * createDamageEvent(0, 'physical', 'miss', { x: 30, y: 45 });
 */
export function createDamageEvent(
  value: number,
  type: DamageType,
  hitType: HitType,
  position: { x: number; y: number },
  options?: {
    text?: string;
    comboTotal?: number;
    isKillShot?: boolean;
  }
): DamageEvent {
  return {
    id: generateId(),
    value,
    type,
    hitType,
    position: {
      x: Math.max(0, Math.min(100, position.x)),
      y: Math.max(0, Math.min(100, position.y)),
    },
    timestamp: Date.now(),
    ...options,
  };
}

/**
 * Create a status effect floating text event.
 * 
 * @param statusKey - Key from STATUS_EFFECTS (e.g., 'burning', 'frozen')
 * @param position - Screen position as percentage
 * @returns DamageEvent configured as status text
 */
export function createStatusEvent(
  statusKey: string,
  position: { x: number; y: number }
): DamageEvent {
  const config = STATUS_EFFECTS[statusKey.toLowerCase()] || { text: statusKey.toUpperCase(), color: STATUS_EFFECTS.stunned!.color };
  
  return createDamageEvent(0, 'status', 'normal', position, {
    text: config.text,
  });
}

/**
 * Create a level up floating text event.
 * 
 * @param position - Screen position (usually near character)
 * @returns DamageEvent configured for level up display
 */
export function createLevelUpEvent(position: { x: number; y: number }): DamageEvent {
  return createDamageEvent(0, 'physical', 'critical', position, {
    text: 'УРОВЕНЬ!',
  });
}

/**
 * Create an XP gain floating text event.
 * 
 * @param xpAmount - XP gained
 * @param position - Screen position
 * @returns DamageEvent configured for XP display
 */
export function createXPEvent(
  xpAmount: number,
  position: { x: number; y: number }
): DamageEvent {
  return createDamageEvent(xpAmount, 'heal', 'weak', position, {
    text: `+${xpAmount} OP`,
  });
}

/**
 * Check if an event has expired based on its timestamp and duration.
 * 
 * @param event - The damage event to check
 * @param duration - Display duration in ms
 * @returns True if event should no longer be displayed
 */
export function isEventExpired(event: DamageEvent, duration: number = DEFAULT_DURATION): boolean {
  return Date.now() - event.timestamp > duration;
}

/**
 * Filter out expired events from an array.
 * 
 * @param events - Array of damage events
 * @param duration - Display duration in ms
 * @returns Array of non-expired events
 */
export function filterActiveEvents(events: DamageEvent[], duration: number = DEFAULT_DURATION): DamageEvent[] {
  const now = Date.now();
  return events.filter((event) => now - event.timestamp <= duration);
}

/* ─── Animation Variants ─────────────────────────────────────────────── */

/** Entry/exit animation variants for normal damage numbers */
// Note: Using 'any' because framer-motion Variants type doesn't support function-based animate with custom prop
const floatVariants: Record<string, any> = {
  initial: {
    scale: 0.5,
    opacity: 0,
    y: 0,
  },
  animate: (duration: number) => ({
    scale: 1,
    opacity: [0, 1, 1, 0] as any,
    y: FLOAT_DISTANCE,
    transition: {
      duration: duration / 1000,
      ease: [0.25, 0.46, 0.45, 0.94] as any,
      times: [0, 0.1, FADE_START_RATIO, 1],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
};

/** Entry/exit animation variants for critical hits (includes shake) */
const critVariants: Record<string, any> = {
  initial: {
    scale: 0.3,
    opacity: 0,
    y: 0,
    rotate: -5,
  },
  animate: (duration: number) => ({
    scale: [0.3, 1.2, 1, 1.05, 1] as any,
    opacity: [0, 1, 1, 1, 0] as any,
    y: FLOAT_DISTANCE * 1.2,
    rotate: [ -5, 5, -3, 3, 0 ] as any,
    transition: {
      duration: duration / 1000,
      ease: [0.25, 0.46, 0.45, 0.94] as any,
      times: [0, 0.15, 0.3, FADE_START_RATIO, 1],
    },
  }),
  exit: {
    opacity: 0,
    scale: 1.1,
    transition: { duration: 0.25 },
  },
};

/** Animation variants for miss/evade (quick fade) */
const quickFadeVariants: Record<string, any> = {
  initial: {
    scale: 0.8,
    opacity: 0,
    y: 0,
  },
  animate: (duration: number) => ({
    scale: 1,
    opacity: [0, 0.8, 0] as any,
    y: FLOAT_DISTANCE * 0.6,
    transition: {
      duration: (duration * 0.8) / 1000,
      ease: 'easeOut' as any,
      times: [0, 0.2, 1],
    },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/** Kill shot explosion effect */
const killShotVariants: Record<string, any> = {
  initial: {
    scale: 0,
    opacity: 0,
    y: 0,
  },
  animate: (duration: number) => ({
    scale: [0, 1.5, 1.2, 1] as any,
    opacity: [0, 1, 1, 0] as any,
    y: FLOAT_DISTANCE * 0.8,
    transition: {
      duration: duration / 1000,
      ease: [0.175, 0.885, 0.32, 1.275] as any,
      times: [0, 0.1, 0.5, 1],
    },
  }),
  exit: {
    opacity: 0,
    scale: 1.2,
    transition: { duration: 0.3 },
  },
};

/* ─── Sub-Components ──────────────────────────────────────────────────── */

interface DamageFloatItemProps {
  event: DamageEvent;
  duration: number;
  reducedMotion: boolean;
}

/** Individual floating damage number/text component */
const DamageFloatItem = memo(function DamageFloatItem({
  event,
  duration,
  reducedMotion,
}: DamageFloatItemProps) {
  /** Get display text for the event */
  const displayText = useMemo((): string => {
    if (event.text) return event.text;

    switch (event.hitType) {
      case 'miss':
        return 'PROMAX!';
      case 'resist':
        return 'COПPOTИВЛЕНИЕ';
      case 'block':
        return 'БЛОК';
      case 'evade':
        return 'УВОРОТ!';
      case 'weak':
        return `${event.value} (слабый...)`;
      case 'critical':
        return `${event.value} КРИТ!`;
      default:
        if (event.type === 'heal') {
          return `+${event.value}`;
        }
        return String(Math.round(event.value));
    }
  }, [event.text, event.value, event.hitType, event.type]);

  /** Determine which color configuration to use */
  const colorConfig = useMemo((): DamageColorConfig => {
    // Special cases override damage type colors
    if (event.isKillShot || event.text?.toUpperCase().includes('ELIMINATED') || event.text?.toUpperCase().includes('УНИЧТОЖЕН')) {
      return SPECIAL_COLORS.killshot;
    }
    if (event.text?.toUpperCase().includes('УРОВЕНЬ') || event.text?.toUpperCase().includes('LEVEL')) {
      return SPECIAL_COLORS.levelup;
    }
    if (event.text?.startsWith('+') && (event.text.includes('OP') || event.text.includes('XP'))) {
      return SPECIAL_COLORS.xp;
    }
    if (event.hitType === 'critical' && !event.text) {
      return SPECIAL_COLORS.critical;
    }
    if (event.hitType === 'miss') {
      return SPECIAL_COLORS.miss;
    }
    if (event.hitType === 'resist') {
      return SPECIAL_COLORS.resist;
    }
    if (event.hitType === 'block') {
      return SPECIAL_COLORS.block;
    }
    if (event.hitType === 'evade') {
      return SPECIAL_COLORS.evade;
    }
    if (event.hitType === 'weak') {
      return SPECIAL_COLORS.weak;
    }
    
    return DAMAGE_COLORS[event.type] || DAMAGE_COLORS.physical;
  }, [event]);

  /** Calculate font size based on hit type and content */
  const fontSize = useMemo((): number => {
    if (event.isKillShot) return 32;
    if (event.text?.toUpperCase().includes('УРОВЕНЬ') || event.text?.toUpperCase().includes('LEVEL')) {
      return FONT_SIZES.levelup;
    }
    if (event.type === 'status' && event.hitType === 'normal') {
      return FONT_SIZES.status;
    }
    return FONT_SIZES[event.hitType] || FONT_SIZES.normal;
  }, [event]);

  /** Select animation variants based on hit type */
  const variants = useMemo(() => {
    if (reducedMotion) {
      return quickFadeVariants;
    }
    if (event.isKillShot) {
      return killShotVariants;
    }
    if (event.hitType === 'critical') {
      return critVariants;
    }
    if (event.hitType === 'miss' || event.hitType === 'evade' || event.hitType === 'weak' || event.hitType === 'resist') {
      return quickFadeVariants;
    }
    return floatVariants;
  }, [event.hitType, event.isKillShot, reducedMotion]);

  /** Calculate random X offset to prevent exact stacking */
  const randomOffsetX = useMemo(() => {
    return (Math.random() - 0.5) * 2 * RANDOM_OFFSET_RANGE;
  }, []);

  /** Position style (percentage-based) */
  const positionStyle: CSSProperties = useMemo(() => ({
    left: `${event.position.x}%`,
    top: `${event.position.y}%`,
    transform: `translate(-50%, ${reducedMotion ? '-50%' : '0'}) translateX(${randomOffsetX}px)`,
  }), [event.position.x, event.position.y, randomOffsetX, reducedMotion]);

  /** Text style combining font size and color */
  const textStyle: CSSProperties = useMemo(() => ({
    fontFamily: "'Courier New', 'Fira Code', monospace",
    fontWeight: event.hitType === 'critical' || event.isKillShot ? 900 : 700,
    fontSize: `${fontSize}px`,
    color: colorConfig.main,
    textShadow: colorConfig.shadow,
    letterSpacing: event.type === 'status' ? '0.15em' : '0.02em',
    ...(event.isKillShot ? { WebkitTextStroke: '1px rgba(255,100,100,0.5)' } : {}),
    ...(event.hitType === 'critical' ? { WebkitTextStroke: '0.5px rgba(255,200,0,0.3)' } : {}),
  }), [fontSize, colorConfig, event.hitType, event.type, event.isKillShot]);

  /** Combo total display */
  const showComboTotal = event.comboTotal !== undefined && event.comboTotal > event.value;

  return (
    <motion.div
      className="damage-number-float absolute pointer-events-none select-none z-[var(--z-combat)] whitespace-nowrap"
      style={positionStyle}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={duration}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Main text */}
      <span
        className="inline-block hud-filmic-damage-rise-fade"
        style={textStyle}
      >
        {displayText}
      </span>
      
      {/* Combo total subtext */}
      {showComboTotal && (
        <motion.span
          className="block text-center mt-[-2px]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          style={{
            fontFamily: "'Courier New', monospace",
            fontWeight: 600,
            fontSize: `${Math.max(fontSize - 8, 10)}px`,
            color: 'rgba(255,255,255,0.7)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          ИТОГО: {event.comboTotal}
        </motion.span>
      )}

      {/* Critical indicator ring */}
      {(event.hitType === 'critical' || event.isKillShot) && !reducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: colorConfig.glow,
            transform: 'scale(1.4)',
          }}
          initial={{ opacity: 0.8, scale: 1.6 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          aria-hidden="true"
        />
      )}

      {/* Kill shot explosion particles */}
      {event.isKillShot && !reducedMotion && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 rounded-full pointer-events-none"
              style={{
                backgroundColor: colorConfig.main,
                left: '50%',
                top: '50%',
                boxShadow: `0 0 4px ${colorConfig.glow}`,
              }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{
                opacity: 0,
                scale: 0,
                x: Math.cos((i * Math.PI * 2) / 6) * 40,
                y: Math.sin((i * Math.PI * 2) / 6) * 40,
              }}
              transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
              aria-hidden="true"
            />
          ))}
        </>
      )}
    </motion.div>
  );
});

/* ─── Main Component ──────────────────────────────────────────────────── */

/**
 * DamageFloatSystem - Displays floating damage numbers and combat text feedback.
 * 
 * This component renders animated floating text that appears when damage is dealt,
 * healing occurs, or combat events happen. It supports various damage types,
 * critical hits, misses, status effects, and special events like level ups.
 * 
 * ## Usage Example:
 * ```tsx
 * const [damageEvents, setDamageEvents] = useState<DamageEvent[]>([]);
 * 
 * // When dealing damage:
 * setDamageEvents(prev => [
 *   ...prev,
 *   createDamageEvent(150, 'fire', 'critical', { x: 45, y: 35 })
 * ]);
 * 
 * // In render:
 * <DamageFloatSystem events={damageEvents} />
 * ```
 * 
 * ## Features:
 * - Floating damage numbers with color-coded damage types
 * - Critical hits with enhanced animations (shake + scale + glow)
 * - Miss/resist/block/evade indicators
 * - Status effect text (BURNING, FROZEN, etc.)
 * - Level up and XP gain displays
 * - Kill shot celebration effects
 * - Multi-hit combo totals
 * - Respects reduced motion preferences
 * - Auto-cleanup of expired events
 * - Supports up to 20 simultaneous floating texts
 * 
 * @see {@link createDamageEvent} for creating damage events
 * @see {@link createStatusEvent} for status effects
 * @see {@link createLevelUpEvent} for level up displays
 * @see {@link createXPEvent} for XP gain displays
 */
export const DamageFloatSystem = memo(function DamageFloatSystem({
  events,
  displayDuration = DEFAULT_DURATION,
  enabled = true,
  maxSimultaneous = MAX_SIMULTANEOUS,
}: DamageFloatSystemProps) {
  const reducedMotion = useEffectiveReducedMotion();

  /**
   * Filter and sort active events:
   * 1. Remove expired events
   * 2. Limit to maximum simultaneous count
   * 3. Sort by Y position (lower Y = higher on screen = render first)
   */
  const activeEvents = useMemo((): DamageEvent[] => {
    if (!enabled) return [];

    const now = Date.now();
    
    return events
      .filter((event) => now - event.timestamp <= displayDuration)
      .slice(-maxSimultaneous)
      .sort((a, b) => b.position.y - a.position.y);
  }, [events, displayDuration, enabled, maxSimultaneous]);

  /** Count of currently visible events (for debugging/accessibility) */
  const visibleCount = activeEvents.length;

  if (!enabled || visibleCount === 0) {
    return null;
  }

  return (
    <div
      className="damage-float-system fixed inset-0 overflow-hidden pointer-events-none z-[var(--z-combat-overlay)]"
      role="log"
      aria-label={`Всплывающий урон: ${visibleCount} активных событий`}
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {activeEvents.map((event) => (
          <DamageFloatItem
            key={event.id}
            event={event}
            duration={
              event.hitType === 'miss' || event.hitType === 'evade'
                ? displayDuration * 0.8
                : displayDuration
            }
            reducedMotion={reducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

/* ─── Default Export ──────────────────────────────────────────────────── */

export default DamageFloatSystem;

/* ─── Additional Exports for External Use ─────────────────────────────── */

/**
 * Pre-configured hook-like utility for managing damage events.
 * Can be used with useState to maintain an event array.
 */
export const DamageEventUtils = {
  /** Create any damage event */
  create: createDamageEvent,
  /** Create status effect event */
  createStatus: createStatusEvent,
  /** Create level up event */
  createLevelUp: createLevelUpEvent,
  /** Create XP event */
  createXP: createXPEvent,
  /** Check if event is expired */
  isExpired: isEventExpired,
  /** Filter active events */
  filterActive: filterActiveEvents,
  /** Remove expired events from state */
  cleanupExpired: (events: DamageEvent[], duration?: number) => filterActiveEvents(events, duration),
  /** Clear all events */
  clearAll: (): DamageEvent[] => [],
} as const;

/** All available status effect keys */
export const STATUS_EFFECT_KEYS = Object.keys(STATUS_EFFECTS) as (keyof typeof STATUS_EFFECTS)[];
