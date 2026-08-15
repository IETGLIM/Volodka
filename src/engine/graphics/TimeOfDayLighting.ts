/** ─── Time-of-Day Lighting System ───
 *  Reads `exploration.timeOfDay` (0–24) from the game store and computes
 *  ambient color/intensity, directional light color/intensity, and a CSS
 *  color-wash class for the screen-space overlay.
 *
 *  Cycle: warm dawn (5–8) → bright noon (10–14) → amber dusk (17–20) →
 *  blue night (21–4). Transitions are smooth cosine interpolation between
 *  key-frames so there are no visible jumps.
 *
 *  Cyberpunk palette: dawn/dusk use amber tones, night uses deep blue-teal,
 *  noon uses neutral-cool white. Emerald accents during golden hours.
 */

'use client';

import { useMemo } from 'react';
import { Color } from 'three';

/** Time-of-day keyframe */
interface TimeKeyframe {
  hour: number;
  /** Color for ambient light */
  ambientColor: [number, number, number];
  ambientIntensity: number;
  /** Color for directional light */
  dirColor: [number, number, number];
  dirIntensity: number;
  /** CSS color for screen-space ambient wash overlay */
  cssWash: string;
  cssWashOpacity: number;
}

/** Keyframes ordered by hour — the system interpolates between adjacent pairs. */
const TIME_KEYFRAMES: TimeKeyframe[] = [
  // Deep night (0–4): cool blue-teal, very dim
  { hour: 0,  ambientColor: [0.05, 0.06, 0.12], ambientIntensity: 0.25, dirColor: [0.08, 0.10, 0.20], dirIntensity: 0.3, cssWash: '#0a0a2e', cssWashOpacity: 0.18 },
  // Pre-dawn (5): hint of warm amber at horizon
  { hour: 5,  ambientColor: [0.10, 0.08, 0.10], ambientIntensity: 0.35, dirColor: [0.30, 0.18, 0.12], dirIntensity: 0.6, cssWash: '#1a0e1e', cssWashOpacity: 0.10 },
  // Dawn (7): warm orange-pink, rising sun
  { hour: 7,  ambientColor: [0.18, 0.14, 0.10], ambientIntensity: 0.55, dirColor: [0.85, 0.55, 0.30], dirIntensity: 1.4, cssWash: '#2e1a0a', cssWashOpacity: 0.06 },
  // Morning (9): neutral warm, sun established
  { hour: 9,  ambientColor: [0.20, 0.20, 0.18], ambientIntensity: 0.70, dirColor: [0.95, 0.90, 0.80], dirIntensity: 1.8, cssWash: '#1a1a18', cssWashOpacity: 0.03 },
  // Noon (12): bright, slightly cool
  { hour: 12, ambientColor: [0.22, 0.22, 0.24], ambientIntensity: 0.85, dirColor: [1.00, 0.98, 0.92], dirIntensity: 2.2, cssWash: '#141418', cssWashOpacity: 0.02 },
  // Afternoon (15): warm neutral, sun descending
  { hour: 15, ambientColor: [0.20, 0.18, 0.14], ambientIntensity: 0.75, dirColor: [0.95, 0.85, 0.65], dirIntensity: 1.9, cssWash: '#1a1610', cssWashOpacity: 0.03 },
  // Golden hour (18): strong amber-orange
  { hour: 18, ambientColor: [0.18, 0.12, 0.08], ambientIntensity: 0.55, dirColor: [0.90, 0.50, 0.20], dirIntensity: 1.5, cssWash: '#2e1408', cssWashOpacity: 0.08 },
  // Dusk (20): deep amber fading to purple
  { hour: 20, ambientColor: [0.10, 0.08, 0.14], ambientIntensity: 0.40, dirColor: [0.40, 0.20, 0.35], dirIntensity: 0.8, cssWash: '#140a1e', cssWashOpacity: 0.12 },
  // Night (22): full blue-teal night
  { hour: 22, ambientColor: [0.06, 0.07, 0.14], ambientIntensity: 0.30, dirColor: [0.10, 0.12, 0.22], dirIntensity: 0.4, cssWash: '#0a0a24', cssWashOpacity: 0.16 },
];

/** Smooth cosine interpolation — avoids linear jumps between keyframes. */
function cosineInterp(a: number, b: number, t: number): number {
  const f = (1 - Math.cos(t * Math.PI)) * 0.5;
  return a * (1 - f) + b * f;
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    cosineInterp(a[0], b[0], t),
    cosineInterp(a[1], b[1], t),
    cosineInterp(a[2], b[2], t),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return cosineInterp(a, b, t);
}

/** Find the two bracketing keyframes and the interpolation factor. */
function findBracket(hour: number): [TimeKeyframe, TimeKeyframe, number] {
  const len = TIME_KEYFRAMES.length;
  // Wrap hour to handle midnight crossover (e.g. 23.5 → between 22 and 0)
  let h = ((hour % 24) + 24) % 24;

  for (let i = 0; i < len; i++) {
    const curr = TIME_KEYFRAMES[i];
    const next = TIME_KEYFRAMES[(i + 1) % len];
    let nextHour = next.hour;
    // Handle midnight wrap: if nextHour <= curr.hour, treat as nextHour + 24
    if (nextHour <= curr.hour) nextHour += 24;
    let currHour = curr.hour;
    // If hour is before the first keyframe (e.g. hour=1, first keyframe=0),
    // check if we need to wrap
    if (h < currHour) h += 24;

    if (h >= currHour && h <= nextHour) {
      const range = nextHour - currHour;
      const t = range > 0 ? (h - currHour) / range : 0;
      return [curr, next, Math.min(1, Math.max(0, t))];
    }
  }

  // Fallback: return last keyframe
  return [TIME_KEYFRAMES[len - 1], TIME_KEYFRAMES[0], 0];
}

export interface TimeOfDayLightingState {
  /** Pre-built Color for the ambient light */
  ambientColor: Color;
  ambientIntensity: number;
  /** Pre-built Color for the directional light */
  dirColor: Color;
  dirIntensity: number;
  /** CSS class name for the screen-space ambient wash overlay */
  cssWashClass: string;
  /** Raw CSS color for the overlay */
  cssWashColor: string;
  cssWashOpacity: number;
  /** Human-readable time period name (Russian) */
  periodName: string;
}

function getTimePeriodName(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 8) return 'Рассвет';
  if (h >= 8 && h < 12) return 'Утро';
  if (h >= 12 && h < 16) return 'Полдень';
  if (h >= 16 && h < 19) return 'Закат';
  if (h >= 19 && h < 22) return 'Сумерки';
  return 'Ночь';
}

/**
 * React hook: computes time-of-day lighting state from the game clock.
 * Returns memoized state — no per-frame allocation.
 *
 * @param timeOfDay - Hour value (0–24) from `exploration.timeOfDay`
 */
export function useTimeOfDayLighting(timeOfDay: number): TimeOfDayLightingState {
  return useMemo(() => {
    const [a, b, t] = findBracket(timeOfDay);

    const ambientRgb = lerpColor(a.ambientColor, b.ambientColor, t);
    const dirRgb = lerpColor(a.dirColor, b.dirColor, t);
    const ambientIntensity = lerp(a.ambientIntensity, b.ambientIntensity, t);
    const dirIntensity = lerp(a.dirIntensity, b.dirIntensity, t);
    const cssWashOpacity = lerp(a.cssWashOpacity, b.cssWashOpacity, t);

    // Interpolate CSS wash color (parse hex → lerp → hex)
    const ac = parseHex(a.cssWash);
    const bc = parseHex(b.cssWash);
    const washR = Math.round(cosineInterp(ac[0], bc[0], t));
    const washG = Math.round(cosineInterp(ac[1], bc[1], t));
    const washB = Math.round(cosineInterp(ac[2], bc[2], t));
    const cssWashColor = `#${toHex2(washR)}${toHex2(washG)}${toHex2(washB)}`;

    const periodName = getTimePeriodName(timeOfDay);
    const cssWashClass = `tod-wash-${periodName.toLowerCase()}`;

    return {
      ambientColor: new Color(ambientRgb[0], ambientRgb[1], ambientRgb[2]),
      ambientIntensity,
      dirColor: new Color(dirRgb[0], dirRgb[1], dirRgb[2]),
      dirIntensity,
      cssWashClass,
      cssWashColor,
      cssWashOpacity,
      periodName,
    };
  }, [timeOfDay]);
}

/**
 * Non-hook version for use outside React (e.g. in useFrameTick callbacks).
 * Avoids React dependency — just pure math.
 */
export function computeTimeOfDayLighting(timeOfDay: number): Omit<TimeOfDayLightingState, 'ambientColor' | 'dirColor'> & {
  ambientColor: [number, number, number];
  dirColor: [number, number, number];
} {
  const [a, b, t] = findBracket(timeOfDay);

  const ambientRgb = lerpColor(a.ambientColor, b.ambientColor, t);
  const dirRgb = lerpColor(a.dirColor, b.dirColor, t);
  const ambientIntensity = lerp(a.ambientIntensity, b.ambientIntensity, t);
  const dirIntensity = lerp(a.dirIntensity, b.dirIntensity, t);
  const cssWashOpacity = lerp(a.cssWashOpacity, b.cssWashOpacity, t);

  const ac = parseHex(a.cssWash);
  const bc = parseHex(b.cssWash);
  const washR = Math.round(cosineInterp(ac[0], bc[0], t));
  const washG = Math.round(cosineInterp(ac[1], bc[1], t));
  const washB = Math.round(cosineInterp(ac[2], bc[2], t));
  const cssWashColor = `#${toHex2(washR)}${toHex2(washG)}${toHex2(washB)}`;

  return {
    ambientColor: ambientRgb,
    ambientIntensity,
    dirColor: dirRgb,
    dirIntensity,
    cssWashClass: `tod-wash-${getTimePeriodName(timeOfDay).toLowerCase()}`,
    cssWashColor,
    cssWashOpacity,
    periodName: getTimePeriodName(timeOfDay),
  };
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex2(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
}

/** Shadow map resolution per quality tier. */
export const SHADOW_MAP_RESOLUTIONS = {
  low: 0,     // Shadows disabled on low
  medium: 512,
  high: 1024,
  ultra: 2048,
} as const;

export type ShadowQualityTier = keyof typeof SHADOW_MAP_RESOLUTIONS;

/** Returns the shadow map resolution for a given quality preset id. */
export function getShadowMapResolution(presetId: ShadowQualityTier): number {
  return SHADOW_MAP_RESOLUTIONS[presetId];
}
