/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import type { StatusEffectDef } from '@/data/statusEffects';
import {
  PLAYER_STATS_PANEL_LABELS,
} from '@/engine/playerStats/playerStatsPanelConstants';
import {
  getBarFillTransition,
  getBreathingGlowAnimate,
  getKarmaRingColor,
  getKarmaRingTransition,
  getSkillBarFillPct,
  getSkillBarTransition,
  getVitalBarFillPct,
  getWarningPulseAnimate,
  isVitalHighWarning,
  isVitalLowWarning,
  PLAYER_STATS_COLORS,
} from '@/engine/playerStats/playerStatsPanelPresentation';

export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <div
        aria-hidden="true"
        className="h-px flex-1 hud-filmic-divider-glow"
        style={{
          background: `linear-gradient(90deg, ${PLAYER_STATS_COLORS.cyan}60, transparent)`,
        }}
      />
      <span
        className="text-[10px] font-mono font-semibold tracking-widest uppercase"
        style={{ color: `${PLAYER_STATS_COLORS.cyan}cc`, textShadow: `0 0 6px ${PLAYER_STATS_COLORS.cyan}40` }}
      >
        {title}
      </span>
      <div
        aria-hidden="true"
        className="h-px flex-1 hud-filmic-divider-glow"
        style={{
          background: `linear-gradient(270deg, ${PLAYER_STATS_COLORS.cyan}60, transparent)`,
        }}
      />
    </div>
  );
}

export function StatBar({
  value,
  max,
  color,
  label,
  reducedMotion,
  lowWarning = false,
  highWarning = false,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  reducedMotion: boolean;
  lowWarning?: boolean;
  highWarning?: boolean;
}) {
  const pct = getVitalBarFillPct(value, max);
  const isCritical =
    (lowWarning && isVitalLowWarning(value)) ||
    (highWarning && isVitalHighWarning(value));
  const warningPulse = getWarningPulseAnimate(reducedMotion, PLAYER_STATS_COLORS.rose);

  /* Build an animated gradient from base color → lighter variant */
  const gradientFill = isCritical
    ? `linear-gradient(90deg, ${color}90, ${color}, ${PLAYER_STATS_COLORS.rose}, ${color})`
    : `linear-gradient(90deg, ${color}88, ${color}cc, ${color}, ${color}cc, ${color}88)`;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={`relative h-2.5 rounded-md overflow-hidden transition-shadow duration-500 ${
        isCritical && !reducedMotion ? 'stats-bar-glow-container' : ''
      }`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        ...(isCritical
          ? {
              '--stats-bar-glow-color': `${PLAYER_STATS_COLORS.rose}30`,
              '--stats-bar-glow-color-inner': `${PLAYER_STATS_COLORS.rose}15`,
              border: `1px solid ${PLAYER_STATS_COLORS.rose}30`,
            } as React.CSSProperties
          : { border: '1px solid rgba(255,255,255,0.06)' }),
      }}
    >
      <motion.div
        className={`h-full rounded-[3px] relative stats-panel-bar-fill ${!reducedMotion ? 'stats-panel-bar-fill--enhanced' : ''}`}
        style={{
          background: gradientFill,
          boxShadow: `0 0 8px ${color}40, 0 0 2px ${color}20`,
        }}
        initial={reducedMotion ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={getBarFillTransition(reducedMotion)}
      />
      {isCritical && !reducedMotion && (
        <div
          aria-hidden="true"
          className="stats-bar-critical-overlay"
        />
      )}
      {isCritical && warningPulse && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 rounded-md"
          animate={warningPulse}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

export function KarmaRing({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const offset = circumference * (1 - pct);
  const ringColor = getKarmaRingColor(value);
  const breathingGlow = getBreathingGlowAnimate(reducedMotion, ringColor);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 72, height: 72 }}
      role="img"
      aria-label={`${PLAYER_STATS_PANEL_LABELS.karma}: ${value}`}
    >
      <svg width="72" height="72" className="absolute" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
        />
        <motion.circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reducedMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={getKarmaRingTransition(reducedMotion)}
          style={{
            filter: `drop-shadow(0 0 4px ${ringColor}60)`,
          }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center">
        <Scale
          className="size-4"
          aria-hidden="true"
          style={{ color: ringColor, filter: `drop-shadow(0 0 4px ${ringColor}50)` }}
        />
        <span className="text-[10px] font-mono font-bold mt-0.5" style={{ color: ringColor }}>
          {value}
        </span>
      </div>
      {breathingGlow && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={breathingGlow}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

export function SkillMiniBar({
  value,
  color,
  label,
  reducedMotion,
}: {
  value: number;
  color: string;
  label: string;
  reducedMotion: boolean;
}) {
  const pct = getSkillBarFillPct(value);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={50}
      aria-label={label}
      className="h-1 rounded-full overflow-hidden flex-1"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 4px ${color}30`,
        }}
        initial={reducedMotion ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={getSkillBarTransition(reducedMotion)}
      />
    </div>
  );
}

export function StatusEffectRow({
  effect,
  remainingHours,
  stacks,
}: {
  effect: StatusEffectDef;
  remainingHours?: number;
  stacks?: number;
}) {
  const isPositive = effect.category === 'buff' || effect.category === 'perk';
  const isNegative = effect.category === 'debuff' || effect.category === 'weather';
  const color = isPositive
    ? PLAYER_STATS_COLORS.emerald
    : isNegative
      ? PLAYER_STATS_COLORS.rose
      : PLAYER_STATS_COLORS.slate;

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-md"
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}03)`,
        borderLeft: `2px solid ${color}60`,
      }}
    >
      <span className="text-sm leading-none" aria-hidden="true">
        {effect.icon}
      </span>
      <div className="flex-1 min-w-0">
        <span
          className="text-[10px] font-mono font-semibold block truncate"
          style={{ color, textShadow: `0 0 4px ${color}30` }}
        >
          {effect.name}
        </span>
      </div>
      {remainingHours !== undefined && (
        <span
          className="text-[9px] font-mono"
          style={{
            color: remainingHours < 1 ? PLAYER_STATS_COLORS.rose : PLAYER_STATS_COLORS.slate,
            textShadow: remainingHours < 1 ? `0 0 4px ${PLAYER_STATS_COLORS.rose}40` : 'none',
          }}
        >
          {PLAYER_STATS_PANEL_LABELS.hoursRemaining(remainingHours)}
        </span>
      )}
      {stacks !== undefined && stacks > 1 && (
        <span className="text-[9px] font-mono font-bold" style={{ color: PLAYER_STATS_COLORS.amber }}>
          ×{stacks}
        </span>
      )}
    </div>
  );
}

export function XpProgressBar({
  pct,
  reducedMotion,
}: {
  pct: number;
  reducedMotion: boolean;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Прогресс опыта"
      className="relative h-1.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <motion.div
        className="h-full rounded-full stats-panel-bar-fill"
        style={{
          background: `linear-gradient(90deg, ${PLAYER_STATS_COLORS.amber}cc, ${PLAYER_STATS_COLORS.amber})`,
          boxShadow: `0 0 6px ${PLAYER_STATS_COLORS.amber}30`,
        }}
        initial={reducedMotion ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={getBarFillTransition(reducedMotion)}
      />
    </div>
  );
}

export { getEffectRowTransition, getEffectRowMotion } from '@/engine/playerStats/playerStatsPanelPresentation';
