import { clampNumericAccessibilitySetting } from '@/engine/accessibility/accessibilityConstraints';
import type { CSSProperties } from 'react';

/** Shared narrative overlay typewriter speed from accessibility settings. */

export const NARRATIVE_BASE_TYPEWRITER_MS = 28;

export function resolveNarrativeTypewriterSpeed(
  reducedMotion: boolean,
  subtitleScale: number,
  baseMs = NARRATIVE_BASE_TYPEWRITER_MS,
  textSpeed = 1,
): number {
  if (reducedMotion) return 0;
  const fontScale = clampNumericAccessibilitySetting('subtitleScale', subtitleScale);
  const speedMul = clampNumericAccessibilitySetting('textSpeed', textSpeed);
  return Math.round(baseMs / (fontScale * speedMul));
}

/** CSS font-size multiplier for dialogue/story body text. */
export function narrativeSubtitleStyle(): CSSProperties {
  return {
    fontSize: 'calc(0.875rem * var(--subtitle-scale, 1))',
    lineHeight: 1.625,
  };
}
