import { getParticleCount } from '@/shared/utils/mobileParticleScale';

/** Rain configuration */
export interface RainConfig {
  count: number;
  boxSize: [number, number, number];
  fallSpeedRange: [number, number];
  windAngle: number;
  windStrength: number;
  dropLength: number;
  color: string;
  opacity: number;
}

export type RainLevel = 'light' | 'medium' | 'heavy';

const RAIN_BASE: Record<RainLevel, Omit<RainConfig, 'count'>> = {
  light: {
    boxSize: [30, 25, 30],
    fallSpeedRange: [10, 14],
    windAngle: 0.1,
    windStrength: 1.5,
    dropLength: 0.4,
    color: '#a8c0d8',
    opacity: 0.35,
  },
  medium: {
    boxSize: [40, 28, 40],
    fallSpeedRange: [12, 18],
    windAngle: 0.15,
    windStrength: 2.5,
    dropLength: 0.5,
    color: '#9ab4cc',
    opacity: 0.45,
  },
  heavy: {
    boxSize: [50, 30, 50],
    fallSpeedRange: [14, 22],
    windAngle: 0.2,
    windStrength: 3.5,
    dropLength: 0.6,
    color: '#88a8c4',
    opacity: 0.55,
  },
};

/** Desktop particle counts — medium rain: 5000 */
const DESKTOP_COUNTS: Record<RainLevel, number> = {
  light: 3000,
  medium: 5000,
  heavy: 7000,
};

/** Mobile particle counts — medium rain: 2000 */
const MOBILE_COUNTS: Record<RainLevel, number> = {
  light: 1200,
  medium: 2000,
  heavy: 2800,
};

export function resolveRainLevel(effectiveIntensity: number): RainLevel {
  if (effectiveIntensity < 0.33) return 'light';
  if (effectiveIntensity < 0.66) return 'medium';
  return 'heavy';
}

export function buildRainConfig(
  level: RainLevel,
  isMobile: boolean,
  visualLite: boolean,
  reducedMotion: boolean,
): RainConfig {
  const desktop = DESKTOP_COUNTS[level];
  const mobile = MOBILE_COUNTS[level];
  const base = isMobile ? mobile : desktop;
  const count = getParticleCount(base, isMobile, visualLite, 1, reducedMotion);

  return {
    ...RAIN_BASE[level],
    count,
  };
}

/** Max particle slots — heavy tier for the current visual profile. */
export function getMaxRainParticleCount(
  isMobile: boolean,
  visualLite: boolean,
  reducedMotion: boolean,
): number {
  return buildRainConfig('heavy', isMobile, visualLite, reducedMotion).count;
}
