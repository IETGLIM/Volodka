import type { TargetAndTransition, Transition } from 'framer-motion';
import { JOURNAL_SKILL_BAR_MAX } from '@/components/game/journal/journalConstants';
import {
  PLAYER_STATS_SKILL_BAR_MAX,
  PLAYER_STATS_VITALS_MAX,
} from '@/engine/playerStats/playerStatsPanelConstants';

export const PLAYER_STATS_COLORS = {
  cyan: 'var(--cyber-cyan)',
  rose: '#fb7185',
  emerald: '#34d399',
  amber: '#fbbf24',
  violet: '#a78bfa',
  slate: '#94a3b8',
} as const;

export const PLAYER_STATS_SKILL_COLORS: Record<string, string> = {
  logic: PLAYER_STATS_COLORS.cyan,
  coding: PLAYER_STATS_COLORS.amber,
  empathy: PLAYER_STATS_COLORS.emerald,
  persuasion: PLAYER_STATS_COLORS.rose,
  intuition: PLAYER_STATS_COLORS.violet,
  writing: PLAYER_STATS_COLORS.cyan,
};

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function computeXpProgressPct(xp: number, xpToNextLevel: number): number {
  if (xpToNextLevel <= 0) return 0;
  return Math.min(100, (xp / xpToNextLevel) * 100);
}

export function getKarmaRingColor(karma: number): string {
  if (karma >= 70) return PLAYER_STATS_COLORS.emerald;
  if (karma >= 30) return PLAYER_STATS_COLORS.cyan;
  return PLAYER_STATS_COLORS.rose;
}

export function getEnergyColor(energy: number): string {
  return energy <= 25 ? PLAYER_STATS_COLORS.rose : PLAYER_STATS_COLORS.cyan;
}

export function getStressColor(stress: number): string {
  return stress >= 70 ? PLAYER_STATS_COLORS.rose : PLAYER_STATS_COLORS.violet;
}

export function getSkillBarFillPct(value: number, max = PLAYER_STATS_SKILL_BAR_MAX): number {
  const effectiveMax = max > 0 ? max : JOURNAL_SKILL_BAR_MAX;
  return Math.min(100, (value / effectiveMax) * 100);
}

export function getVitalBarFillPct(value: number, max = PLAYER_STATS_VITALS_MAX): number {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function isVitalLowWarning(value: number, lowThreshold = 25): boolean {
  return value <= lowThreshold;
}

export function isVitalHighWarning(value: number, highThreshold = 70): boolean {
  return value >= highThreshold;
}

export function getPanelSlideTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { type: 'spring', stiffness: 300, damping: 30 };
}

export function getBarFillTransition(reducedMotion: boolean, delay = 0): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { duration: 0.5, ease: EASE_OUT, delay };
}

export function getSkillBarTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { duration: 0.4, ease: EASE_OUT, delay: 0.1 };
}

export function getKarmaRingTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { duration: 0.8, ease: EASE_OUT };
}

export function getEffectRowTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { duration: 0.2, ease: EASE_OUT };
}

export function getBreathingGlowAnimate(
  reducedMotion: boolean,
  color: string,
): TargetAndTransition | undefined {
  if (reducedMotion) return undefined;
  return {
    boxShadow: [
      `0 0 8px ${color}10`,
      `0 0 16px ${color}20`,
      `0 0 8px ${color}10`,
    ],
  };
}

export function getBorderGlowAnimate(
  reducedMotion: boolean,
  color: string,
): TargetAndTransition | undefined {
  if (reducedMotion) return undefined;
  return {
    boxShadow: [
      `inset -1px 0 12px ${color}08`,
      `inset -1px 0 20px ${color}15`,
      `inset -1px 0 12px ${color}08`,
    ],
  };
}

export function getWarningPulseAnimate(
  reducedMotion: boolean,
  color: string,
): TargetAndTransition | undefined {
  if (reducedMotion) return undefined;
  return {
    boxShadow: [
      `inset 0 0 4px ${color}00`,
      `inset 0 0 8px ${color}30`,
      `inset 0 0 4px ${color}00`,
    ],
  };
}

export function getEffectRowMotion(reducedMotion: boolean): {
  initial: false | { opacity: number; x: number };
  animate: { opacity: number; x: number };
} {
  if (reducedMotion) {
    return { initial: false, animate: { opacity: 1, x: 0 } };
  }
  return { initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 } };
}
