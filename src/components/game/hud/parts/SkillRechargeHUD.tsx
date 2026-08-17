/* ─────────────────────────────────────────────────────────────
   Volodka RPG – Skill Recharge HUD
   
   Elegant skill cooldown display component for the game HUD.
   Shows up to 4 skills with cooldown overlays, key bindings,
   and cyberpunk-themed visual effects.
   
   Features:
   - Horizontal/vertical orientation support
   - Compact mode for minimal UI
   - Ready/OnCooldown/AlmostReady states
   - Active skill border glow animation
   - Reduced motion support
   - Fully memoized for performance
   ───────────────────────────────────────────────────────────── */

import { useState, useCallback, memo } from 'react';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* Import enhanced quick slot styles */
import '@/styles/hud-round12.css';

/* ─── Type Definitions ─── */

/**
 * Represents a single skill slot in the recharge HUD.
 * Contains all data needed to render skill state and interactions.
 */
export interface SkillSlot {
  /** Unique identifier for this skill */
  id: string;
  /** Display name (localized, typically Russian) */
  name: string;
  /** ReactNode icon element for visual representation */
  icon: React.ReactNode;
  /** Keyboard shortcut binding displayed in hint */
  keyBinding: string;
  /** Remaining cooldown time in milliseconds (0 = ready) */
  cooldownRemaining: number;
  /** Total cooldown duration in milliseconds */
  totalCooldown: number;
  /** Whether this skill is currently being used */
  isActive?: boolean;
  /** Whether this skill is available to use (override for special states) */
  isReady?: boolean;
}

/**
 * Props for the SkillRechargeHUD component.
 */
export interface SkillRechargeHUDProps {
  /** Array of skill slots to display (max 4 shown) */
  skills: SkillSlot[];
  /** Position preset for the HUD panel */
  position?: 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** If true, shows only icons without extra details */
  compact?: boolean;
  /** Layout direction for skill slots */
  orientation?: 'horizontal' | 'vertical';
  /** Controls visibility of the entire HUD element */
  visible?: boolean;
  /** Callback when a skill slot is clicked/tapped */
  onSkillClick?: (skillId: string) => void;
}

/* ─── Constants ─── */

/** Maximum number of skill slots to display */
const MAX_SKILLS = 4;

/** Threshold for "almost ready" flash state (in ms) */
const ALMOST_READY_THRESHOLD = 500;

/** Slot sizes in pixels */
const SLOT_SIZE_NORMAL = 48;
const SLOT_SIZE_COMPACT = 36;

/** Animation timing constants */
const ANIMATION = {
  /** Entry stagger delay between slots */
  staggerDelay: 0.06,
  /** Initial entry duration */
  entryDuration: 0.35,
  /** Exit duration */
  exitDuration: 0.2,
  /** Pulse duration for ready state */
  pulseDuration: 2,
  /** Glow rotation duration for active state */
  glowRotationDuration: 3,
  /** Flash interval for almost-ready state */
  flashInterval: 400,
} as const;

/** Cyberpunk color palette for skill states */
const COLORS = {
  /** Primary cyan for ready/glow effects */
  cyan: 'var(--cyber-cyan, #00f0ff)',
  /** Amber for warnings/almost-ready */
  amber: 'var(--cyber-amber, #ffb800)',
  /** Dark overlay for cooldown */
  darkOverlay: 'rgba(0, 0, 0, 0.75)',
  /** Semi-transparent background */
  bgPanel: 'rgba(10, 12, 18, 0.85)',
  /** Border color for inactive slots */
  borderInactive: 'rgba(100, 120, 140, 0.3)',
  /** Border color for active slots */
  borderActive: 'rgba(0, 240, 255, 0.8)',
} as const;

/* ─── Utility Functions ─── */

/**
 * Calculates cooldown progress as a value between 0 and 1.
 * @param remaining - Remaining cooldown in milliseconds
 * @param total - Total cooldown duration in milliseconds
 * @returns Progress value where 0 = just started, 1 = complete
 */
function calculateCooldownProgress(remaining: number, total: number): number {
  if (total <= 0) return 1;
  if (remaining <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remaining / total));
}

/**
 * Formats milliseconds into a human-readable countdown string.
 * @param ms - Time in milliseconds
 * @returns Formatted string (e.g., "2.3s" or "0.5")
 */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '';
  const seconds = ms / 1000;
  if (seconds >= 10) return `${Math.ceil(seconds)}s`;
  return `${seconds.toFixed(1)}s`;
}

/**
 * Determines if skill is in "almost ready" state (< 500ms remaining).
 * @param remaining - Remaining cooldown in milliseconds
 */
function isAlmostReady(remaining: number): boolean {
  return remaining > 0 && remaining < ALMOST_READY_THRESHOLD;
}

/**
 * Determines if skill is ready to use.
 * @param skill - The skill slot to check
 */
function isSkillReady(skill: SkillSlot): boolean {
  // Explicit override takes precedence
  if (skill.isReady !== undefined) return skill.isReady;
  // Otherwise check if cooldown has elapsed
  return skill.cooldownRemaining <= 0;
}

/* ─── Sub-Components ─── */

interface SkillSlotProps {
  skill: SkillSlot;
  compact: boolean;
  reducedMotion: boolean;
  onClick: (skillId: string) => void;
}

/**
 * Individual skill slot renderer with all visual states.
 * Handles cooldown overlay, glow effects, and interaction feedback.
 */
const SkillSlotItem = memo(function SkillSlotItem({
  skill,
  compact,
  reducedMotion,
  onClick,
}: SkillSlotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();

  /* Derived values */
  const ready = isSkillReady(skill);
  const almostReady = isAlmostReady(skill.cooldownRemaining);
  const progress = calculateCooldownProgress(skill.cooldownRemaining, skill.totalCooldown);
  const countdownText = formatCountdown(skill.cooldownRemaining);
  const slotSize = compact ? SLOT_SIZE_COMPACT : SLOT_SIZE_NORMAL;

  /* Click handler wrapped in useCallback for stability */
  const handleClick = useCallback(() => {
    if (ready) {
      onClick(skill.id);
    }
  }, [ready, onClick, skill.id]);

  /* Mouse event handlers */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!reducedMotion && ready) {
      controls.start({ scale: 1.08 });
    }
  }, [controls, ready, reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (!reducedMotion) {
      controls.start({ scale: 1 });
    }
  }, [controls, reducedMotion]);

  /* Determine state class names */
  const stateClasses = [
    'skill-slot-enhanced',
    ready ? 'skill-slot--ready' : 'skill-slot--cooldown',
    almostReady ? 'skill-slot--almost-ready' : '',
    skill.isActive ? 'skill-slot--active' : '',
    compact ? 'skill-slot--compact' : '',
    /* WS18-A: subtle cyan fill pulse while the skill is recharging.
       CSS class is reduced-motion gated — when prefers-reduced-motion
       is reduce, the animation is disabled and the class is a no-op. */
    !ready ? 'hud-filmic-skill-recharge-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  /* Cooldown overlay height based on progress */
  const overlayHeight = `${(1 - progress) * 100}%`;

  return (
    <motion.div
      className={stateClasses}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.7, y: 10 }}
      animate={controls}
      whileHover={ready && !reducedMotion ? { scale: 1.05 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      style={{
        width: slotSize,
        height: slotSize,
        position: 'relative',
        backgroundColor: COLORS.bgPanel,
        borderRadius: compact ? 8 : 10,
        border: `1px solid ${skill.isActive ? COLORS.borderActive : COLORS.borderInactive}`,
        cursor: ready ? 'pointer' : 'not-allowed',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        /* Active glow effect */
        ...(skill.isActive && !reducedMotion
          ? {
              boxShadow: `
                0 0 12px ${COLORS.cyan},
                0 0 24px ${COLORS.cyan}80,
                inset 0 0 8px ${COLORS.cyan}40
              `,
            }
          : {}),
        /* Ready state subtle glow */
        ...(ready && !skill.isActive
          ? {
              boxShadow: `0 0 6px ${COLORS.cyan}40`,
            }
          : {}),
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={ready ? 0 : -1}
      aria-label={`${skill.name}${!ready ? ` – на перезарядке: ${countdownText}` : ''}`}
      aria-disabled={!ready}
    >
      {/* Skill icon container */}
      <div
        className="skill-slot__icon-wrapper"
        style={{
          position: 'relative',
          zIndex: 2,
          opacity: ready ? 1 : 0.5,
          transition: reducedMotion ? 'none' : 'opacity 0.2s ease',
          filter: !ready ? 'grayscale(50%)' : 'none',
        }}
      >
        {skill.icon}
      </div>

      {/* Cooldown dark overlay (fills from bottom) */}
      {!ready && (
        <motion.div
          className="skill-slot__cooldown-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: overlayHeight,
            backgroundColor: COLORS.darkOverlay,
            zIndex: 1,
            transition: reducedMotion ? 'none' : 'height 0.1s linear',
          }}
        />
      )}

      {/* Glow line at edge of cooldown progress */}
      {!ready && (
        <motion.div
          className="skill-slot__glow-line"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `calc(${overlayHeight} - 2px)`,
            height: 2,
            backgroundColor: almostReady ? COLORS.amber : COLORS.cyan,
            boxShadow: `0 0 6px ${almostReady ? COLORS.amber : COLORS.cyan}, 0 0 12px ${almostReady ? COLORS.amber : COLORS.cyan}80`,
            zIndex: 3,
            transition: reducedMotion ? 'none' : 'bottom 0.1s linear',
          }}
          animate={
            almostReady && !reducedMotion
              ? { opacity: [1, 0.4, 1] }
              : { opacity: 1 }
          }
          transition={
            almostReady && !reducedMotion
              ? { duration: ANIMATION.flashInterval / 1000, repeat: Infinity }
              : undefined
          }
        />
      )}

      {/* Countdown numeric display */}
      {!ready && (
        <motion.span
          className="skill-slot__countdown"
          style={{
            position: 'absolute',
            zIndex: 4,
            fontSize: compact ? 10 : 12,
            fontWeight: 700,
            fontFamily: 'monospace',
            color: almostReady ? COLORS.amber : '#ffffff',
            textShadow: `0 0 4px ${almostReady ? COLORS.amber : COLORS.cyan}`,
            pointerEvents: 'none',
          }}
          animate={
            almostReady && !reducedMotion
              ? { scale: [1, 1.15, 1] }
              : { scale: 1 }
          }
          transition={
            almostReady && !reducedMotion
              ? { duration: ANIMATION.flashInterval / 1000, repeat: Infinity }
              : undefined
          }
        >
          {countdownText}
        </motion.span>
      )}

      {/* Key binding hint */}
      <span
        className="skill-slot__key-hint"
        style={{
          position: 'absolute',
          bottom: compact ? 1 : 2,
          right: compact ? 1 : 3,
          zIndex: 5,
          fontSize: compact ? 8 : 9,
          fontWeight: 600,
          fontFamily: 'monospace',
          color: ready ? `${COLORS.cyan}` : 'rgba(255,255,255,0.4)',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '1px 3px',
          borderRadius: 3,
          lineHeight: 1,
        }}
      >
        {skill.keyBinding}
      </span>

      {/* Active skill rotating border glow */}
      {skill.isActive && !reducedMotion && (
        <motion.div
          className="skill-slot__active-glow-ring"
          style={{
            position: 'absolute',
            inset: -1,
            borderRadius: compact ? 9 : 11,
            border: `2px solid transparent`,
            background: `linear-gradient(${COLORS.bgPanel}, ${COLORS.bgPanel}) padding-box,
                        linear-gradient(var(--rotation, 0deg), ${COLORS.cyan}, transparent, ${COLORS.cyan}) border-box`,
            zIndex: 0,
            pointerEvents: 'none',
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: ANIMATION.glowRotationDuration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Ready state pulse animation */}
      {ready && !skill.isActive && !reducedMotion && (
        <motion.div
          className="skill-slot__ready-pulse"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: compact ? 8 : 10,
            border: `1px solid ${COLORS.cyan}60`,
            pointerEvents: 'none',
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: ANIMATION.pulseDuration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Almost ready flash overlay */}
      {almostReady && (
        <motion.div
          className="skill-slot__flash-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: compact ? 8 : 10,
            backgroundColor: COLORS.amber,
            pointerEvents: 'none',
            zIndex: 3,
          }}
          animate={
            reducedMotion
              ? { opacity: 0.15 }
              : { opacity: [0.15, 0.3, 0.15] }
          }
          transition={
            (reducedMotion
              ? undefined
              : { duration: ANIMATION.flashInterval / 1000, repeat: Infinity }) as React.ComponentProps<typeof motion.div>['transition']
          }
        />
      )}

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="skill-slot__tooltip"
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              padding: '6px 10px',
              backgroundColor: 'rgba(5, 8, 15, 0.95)',
              border: `1px solid ${COLORS.cyan}40`,
              borderRadius: 6,
              whiteSpace: 'nowrap',
              zIndex: 100,
              pointerEvents: 'none',
              boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 8px ${COLORS.cyan}20`,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#ffffff',
                display: 'block',
                lineHeight: 1.3,
              }}
            >
              {skill.name}
            </span>
            <span
              style={{
                fontSize: 10,
                color: ready ? COLORS.cyan : COLORS.amber,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
              }}
            >
              {ready ? (
                <>
                  <Zap size={10} /> Готово
                </>
              ) : (
                <>
                  <Clock size={10} /> {countdownText}
                </>
              )}
            </span>
            {/* Tooltip arrow */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                border: '5px solid transparent',
                borderTopColor: 'rgba(5, 8, 15, 0.95)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled overlay for non-ready skills */}
      {!ready && (
        <div
          className="skill-slot__disabled-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            cursor: 'not-allowed',
          }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
});

/* ─── Main Component ─── */

/**
 * Skill Recharge HUD – Displays player skill cooldowns in an elegant,
 * compact HUD element. Supports horizontal and vertical layouts with
 * multiple visual states for each skill.
 *
 * @example
 * ```tsx
 * const skills: SkillSlot[] = [
 *   {
 *     id: 'dash',
 *     name: 'Рывок',
 *     icon: <Zap />,
 *     keyBinding: 'Q',
 *     cooldownRemaining: 1500,
 *     totalCooldown: 3000,
 *   },
 *   // ... more skills
 * ];
 *
 * <SkillRechargeHUD
 *   skills={skills}
 *   position="bottom-center"
 *   onSkillClick={(id) => activateSkill(id)}
 * />
 * ```
 */
export const SkillRechargeHUD = memo(function SkillRechargeHUD({
  skills = [],
  position = 'bottom-center',
  compact = false,
  orientation = 'horizontal',
  visible = true,
  onSkillClick,
}: SkillRechargeHUDProps) {
  /* Hooks */
  const reducedMotion = useEffectiveReducedMotion();

  /* Limit to max skills */
  const displaySkills = skills.slice(0, MAX_SKILLS);

  /* Stable click handler */
  const handleSkillClick = useCallback(
    (skillId: string) => {
      onSkillClick?.(skillId);
    },
    [onSkillClick]
  );

  /* Position styles mapping */
  const positionStyles: Record<string, { [key: string]: string | number }> = {
    'bottom-left': { left: 20, bottom: 20 },
    'bottom-center': { left: '50%', transform: 'translateX(-50%)', bottom: 20 },
    'bottom-right': { right: 20, bottom: 20 },
  };

  /* Orientation-based layout */
  const isHorizontal = orientation === 'horizontal';

  if (!visible || displaySkills.length === 0) {
    return null;
  }

  return (
    <div
      className={`quick-slot-enhanced skill-recharge-hud skill-recharge-hud--${position} skill-recharge-hud--${orientation} ${compact ? 'skill-recharge-hud--compact' : ''}`}
      role="toolbar"
      aria-label="Панель навыков"
      style={{
        position: 'fixed',
        ...positionStyles[position],
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        gap: compact ? 6 : 8,
        padding: compact ? 6 : 8,
        backgroundColor: COLORS.bgPanel,
        borderRadius: compact ? 10 : 14,
        border: `1px solid rgba(100, 120, 140, 0.2)`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: UI_LAYERS.COMBAT,
        /* Subtle shadow */
        boxShadow: `
          0 4px 24px rgba(0, 0, 0, 0.4),
          0 0 1px ${COLORS.cyan}30,
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      {/* Entry animations for each skill slot */}
      <AnimatePresence mode="popLayout">
        {displaySkills.map((skill, index) => (
          <motion.div
            key={skill.id}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, transition: { duration: ANIMATION.exitDuration } }}
            transition={{
              duration: ANIMATION.entryDuration,
              delay: index * ANIMATION.staggerDelay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <SkillSlotItem
              skill={skill}
              compact={compact}
              reducedMotion={reducedMotion}
              onClick={handleSkillClick}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Decorative corner accents (cyberpunk feel) */}
      <div
        className="skill-recharge-hud__accent skill-recharge-hud__accent--tl"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 12,
          height: 12,
          borderTop: `2px solid ${COLORS.cyan}50`,
          borderLeft: `2px solid ${COLORS.cyan}50`,
          borderTopLeftRadius: 14,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <div
        className="skill-recharge-hud__accent skill-recharge-hud__accent--br"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 12,
          height: 12,
          borderBottom: `2px solid ${COLORS.cyan}50`,
          borderRight: `2px solid ${COLORS.cyan}50`,
          borderBottomRightRadius: 14,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Skills count indicator (when fewer than max) */}
      {displaySkills.length > 0 && (
        <div
          className="skill-recharge-hud__counter"
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: 'rgba(10, 12, 18, 0.9)',
            border: `1px solid ${COLORS.cyan}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            fontFamily: 'monospace',
            color: COLORS.cyan,
            pointerEvents: 'none',
          }}
          aria-label={`${displaySkills.length} из ${MAX_SKILLS} навыков`}
        >
          {displaySkills.length}/{MAX_SKILLS}
        </div>
      )}
    </div>
  );
});

/* ─── Default Export ─── */

export default SkillRechargeHUD;

/* ─── Documentation ─── */

/**
 * @component SkillRechargeHUD
 * @description A cyberpunk-styled skill cooldown HUD for displaying up to 4 player skills.
 *
 * @remarks
 * This component uses CSS custom properties for theming:
 * - `--cyber-cyan`: Primary accent color (default: #00f0ff)
 * - `--cyber-amber`: Warning/highlight color (default: #ffb800)
 *
 * The component imports styles from `hud-round12.css` which contains:
 * - `.quick-slot-enhanced` base styles
 * - `.skill-slot-*` modifiers for various states
 *
 * @accessibility
 * - Supports `prefers-reduced-motion` media query
 * - Proper ARIA labels for screen readers
 * - Keyboard navigable when skills are ready
 * - Focus indicators for active elements
 *
 * @performance
 * - Wrapped in `React.memo` for render optimization
 * - Uses `useCallback` for stable handler references
 * - Efficient cooldown calculations (no unnecessary re-renders)
 */
