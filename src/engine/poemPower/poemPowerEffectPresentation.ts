import type { Transition } from 'framer-motion';
import type { PoemPower } from '@/engine/PoemPowerSystem';
import {
  POEM_POWER_COLOR_THEMES,
  POEM_POWER_EFFECT_CYRILLIC_CHARS,
  POEM_POWER_EFFECT_LABELS,
  POEM_POWER_EFFECT_MATRIX_COLUMN_COUNT,
  POEM_POWER_EFFECT_PARTICLE_COUNT,
  type PoemPowerAct,
  type PoemPowerColorTheme,
} from '@/engine/poemPower/poemPowerEffectConstants';

export type PoemPowerEffectMeta = {
  color: string;
  actLabel: string;
  act: PoemPowerAct;
  colorTheme: PoemPowerColorTheme;
};

export type MatrixRainColumn = {
  id: number;
  x: string;
  chars: string[];
  charCount: number;
  duration: number;
  delay: number;
  color: string;
};

export type PowerParticle = {
  id: number;
  angle: number;
  distance: number;
  delay: number;
  size: number;
};

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function parsePoemNumber(poemId: string): number | null {
  const num = parseInt(poemId.replace('poem_', ''), 10);
  return Number.isNaN(num) ? null : num;
}

export function inferPoemPowerAct(poemId: string): PoemPowerAct {
  const num = parsePoemNumber(poemId);
  if (num === null || num <= 7) return 1;
  if (num <= 13) return 2;
  return 3;
}

export function inferPoemPowerColorTheme(poemId: string): PoemPowerColorTheme {
  const num = parsePoemNumber(poemId);
  if (num === null) return 'act1';
  if (num === 10) return 'defense';
  if (num === 5 || num === 6 || num === 8) return 'combat';
  if (num >= 1 && num <= 7) return 'act1';
  if (num >= 8 && num <= 13) return 'act2';
  return 'act3';
}

export function resolvePoemPowerActLabel(act: PoemPowerAct): string {
  switch (act) {
    case 1:
      return POEM_POWER_EFFECT_LABELS.act1;
    case 2:
      return POEM_POWER_EFFECT_LABELS.act2;
    case 3:
      return POEM_POWER_EFFECT_LABELS.act3;
    default: {
      const _exhaustive: never = act;
      return _exhaustive;
    }
  }
}

export function resolvePoemPowerColor(theme: PoemPowerColorTheme): string {
  return POEM_POWER_COLOR_THEMES[theme];
}

export function resolvePoemPowerEffectMeta(power: PoemPower): PoemPowerEffectMeta {
  const act = power.act ?? inferPoemPowerAct(power.poemId);
  const colorTheme = power.colorTheme ?? inferPoemPowerColorTheme(power.poemId);
  return {
    act,
    colorTheme,
    actLabel: resolvePoemPowerActLabel(act),
    color: resolvePoemPowerColor(colorTheme),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateMatrixRainColumns(color: string, count = POEM_POWER_EFFECT_MATRIX_COLUMN_COUNT): MatrixRainColumn[] {
  return Array.from({ length: count }, (_, i) => {
    const charCount = 8 + Math.floor(Math.random() * 14);
    return {
      id: i,
      x: `${(i / count) * 100}%`,
      chars: Array.from({ length: charCount }, () =>
        POEM_POWER_EFFECT_CYRILLIC_CHARS[Math.floor(Math.random() * POEM_POWER_EFFECT_CYRILLIC_CHARS.length)]!,
      ),
      charCount,
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.8,
      color,
    };
  });
}

export function generatePowerParticles(count = POEM_POWER_EFFECT_PARTICLE_COUNT): PowerParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (Math.random() - 0.5) * 15;
    const distance = 80 + (i % 4) * 60 + Math.random() * 40;
    return {
      id: i,
      angle,
      distance,
      delay: i * 0.018,
      size: 2 + (i % 6),
    };
  });
}

export function getOverlayEnterTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' };
}

export function getTitleMotion(reducedMotion: boolean): {
  initial: false | { scale: number; opacity: number; y: number };
  animate: { scale?: number | number[]; opacity: number | number[]; y?: number | number[] };
  exit: { scale: number; opacity: number; y: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { scale: 1, opacity: 0, y: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { scale: 0.4, opacity: 0, y: 20 },
    animate: {
      scale: [0.4, 1.15, 1],
      opacity: [0, 1, 1],
      y: [20, 0, 0],
    },
    exit: { scale: 0.95, opacity: 0, y: -10 },
    transition: { duration: 0.6, ease: EASE_OUT },
  };
}

export function getSubtitleMotion(reducedMotion: boolean, delay: number): {
  initial: false | { opacity: number; y: number };
  animate: { opacity: number; y: number };
  exit: { opacity: number; y: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: delay <= 0.1 ? 10 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -5 },
    transition: { duration: 0.3, delay },
  };
}

export function getDecorativeLineMotion(reducedMotion: boolean): {
  initial: false | { width: number };
  animate: { width: number };
  exit: { width: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { width: 250 },
      exit: { width: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { width: 0 },
    animate: { width: 250 },
    exit: { width: 0 },
    transition: { duration: 0.5, delay: 0.3 },
  };
}

export function buildActivatedAnnouncement(powerName: string): string {
  return POEM_POWER_EFFECT_LABELS.activatedAnnouncement(powerName);
}
