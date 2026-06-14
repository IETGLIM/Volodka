import type { Transition, Variants } from 'framer-motion';
import { JOURNAL_THEME_COLORS } from '@/components/game/journal/journalConstants';
import { POEM_THEME_LABELS } from '@/engine/poetryBook/poetryBookConstants';

const PAGE_TURN_EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function resolvePoemThemeLabel(theme: string): string {
  return POEM_THEME_LABELS[theme] ?? theme;
}

export function getPoemThemeClass(theme: string): string {
  return JOURNAL_THEME_COLORS[theme] ?? 'bg-slate-800/60 text-slate-300 border-slate-600/40';
}

export function getPageTurnVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    enter: (direction: number) => ({
      opacity: 0,
      rotateY: direction > 0 ? 15 : -15,
      x: direction > 0 ? 40 : -40,
    }),
    center: {
      opacity: 1,
      rotateY: 0,
      x: 0,
    },
    exit: (direction: number) => ({
      opacity: 0,
      rotateY: direction > 0 ? -15 : 15,
      x: direction > 0 ? -40 : 40,
    }),
  };
}

export function getPageTurnTransition(reducedMotion: boolean, duration = 0.35): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { duration, ease: PAGE_TURN_EASE };
}

export function getPoemLineClass(line: string): string {
  if (line === '') return 'h-4';
  if (line.startsWith('___')) return 'text-amber-500/40 text-sm tracking-widest';
  if (line.startsWith('-')) return 'text-amber-200/50 text-sm italic';
  return 'text-amber-100/85 italic text-[15px]';
}

export function getCooldownProgress(cooldownMs: number, totalMs: number): number {
  if (totalMs <= 0) return 0;
  return (cooldownMs / totalMs) * 100;
}
