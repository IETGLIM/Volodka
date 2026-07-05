import type { CutsceneDef } from '@/data/cutscenes';
import type { NarrativeKind } from '@/store/slices/uiSlice';

export type CinematicBeatType = NonNullable<CutsceneDef['type']> | 'dialogue';

export interface CinematicNarrativePresentation {
  type: CinematicBeatType;
  accentColor: string;
  letterboxStyle: NonNullable<CutsceneDef['letterboxStyle']>;
  showEmbers: boolean;
  glitchIntensity: number;
}

export function getCinematicTypeStyles(type: CinematicBeatType = 'story_moment') {
  switch (type) {
    case 'character_intro':
    case 'dialogue':
      return {
        titleSize: 'text-3xl sm:text-4xl md:text-5xl',
        titleWeight: 'font-light',
        titleTracking: 'tracking-[0.1em]',
        bodySize: 'text-base sm:text-lg md:text-xl',
        fadeInDuration: 1.2,
        titleDelay: 0.25,
        bodyDelay: 0.65,
      };
    case 'revelation':
      return {
        titleSize: 'text-3xl sm:text-5xl md:text-6xl',
        titleWeight: 'font-bold',
        titleTracking: 'tracking-[0.15em]',
        bodySize: 'text-base sm:text-lg md:text-xl italic',
        fadeInDuration: 1.6,
        titleDelay: 0.4,
        bodyDelay: 0.9,
      };
    case 'act_transition':
      return {
        titleSize: 'text-4xl sm:text-6xl md:text-7xl',
        titleWeight: 'font-bold',
        titleTracking: 'tracking-[0.22em]',
        bodySize: 'text-sm sm:text-base md:text-lg',
        fadeInDuration: 1.5,
        titleDelay: 0.35,
        bodyDelay: 0.85,
      };
    case 'story_moment':
    default:
      return {
        titleSize: 'text-2xl sm:text-3xl md:text-4xl',
        titleWeight: 'font-normal',
        titleTracking: 'tracking-[0.06em]',
        bodySize: 'text-base sm:text-lg md:text-xl',
        fadeInDuration: 1.0,
        titleDelay: 0.2,
        bodyDelay: 0.55,
      };
  }
}

export function resolveCinematicNarrativePresentation(
  nodeId: string,
  kind: NarrativeKind,
  speaker: string | undefined,
  accentColor?: string,
): CinematicNarrativePresentation {
  const isNarrator = !speaker || speaker === 'narrator';
  const lower = nodeId.toLowerCase();

  if (lower.includes('act') && lower.includes('transition')) {
    return {
      type: 'act_transition',
      accentColor: accentColor ?? '#00ffaa',
      letterboxStyle: 'full',
      showEmbers: true,
      glitchIntensity: 0.25,
    };
  }

  if (
    lower.includes('final') ||
    lower.includes('truth') ||
    lower.includes('revelation') ||
    lower.includes('virus')
  ) {
    return {
      type: 'revelation',
      accentColor: accentColor ?? '#ff6688',
      letterboxStyle: 'full',
      showEmbers: true,
      glitchIntensity: 0.15,
    };
  }

  if (kind === 'dialogue' && !isNarrator) {
    return {
      type: 'dialogue',
      accentColor: accentColor ?? '#88ccff',
      letterboxStyle: 'thin',
      showEmbers: false,
      glitchIntensity: 0,
    };
  }

  if (!isNarrator) {
    return {
      type: 'character_intro',
      accentColor: accentColor ?? '#ccaa88',
      letterboxStyle: 'thin',
      showEmbers: false,
      glitchIntensity: 0,
    };
  }

  return {
    type: 'story_moment',
    accentColor: accentColor ?? '#66ddcc',
    letterboxStyle: 'thin',
    showEmbers: false,
    glitchIntensity: 0.08,
  };
}

export function resolveExaminePresentation(accentColor = '#66ddcc'): CinematicNarrativePresentation {
  return {
    type: 'story_moment',
    accentColor,
    letterboxStyle: 'thin',
    showEmbers: false,
    glitchIntensity: 0.04,
  };
}

export function resolveSceneLocationPresentation(accentColor = '#88aacc'): CinematicNarrativePresentation {
  return {
    type: 'story_moment',
    accentColor,
    letterboxStyle: 'thin',
    showEmbers: false,
    glitchIntensity: 0.05,
  };
}

export function resolvePoemPresentation(accentColor = '#66ffaa'): CinematicNarrativePresentation {
  return {
    type: 'revelation',
    accentColor,
    letterboxStyle: 'full',
    showEmbers: true,
    glitchIntensity: 0.12,
  };
}
