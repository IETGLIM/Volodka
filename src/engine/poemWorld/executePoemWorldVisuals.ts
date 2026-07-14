import type { PoemWorldEffectProfile } from '@/config/poemWorldEffects';
import {
  triggerChromaticAberration,
  triggerFlash,
  triggerShake,
  triggerVignette,
} from '@/engine/fx/screenFxTriggers';

export type PoemWorldVisualContext = {
  reducedMotion: boolean;
};

/** Fire ScreenEffects primitives for a poem world event (testable, no React). */
export function executePoemWorldVisuals(
  profile: PoemWorldEffectProfile,
  context: PoemWorldVisualContext,
): void {
  const { reducedMotion } = context;
  const tint = profile.worldTint ?? 'rgba(255,255,255,0.1)';

  switch (profile.visualPreset) {
    case 'letterbox_truth':
      triggerFlash(tint, reducedMotion ? 0.08 : 0.22, reducedMotion ? 100 : 500);
      if (!reducedMotion) triggerVignette(0.55, Math.min(profile.durationMs, 2200));
      break;
    case 'god_rays_gold':
      triggerFlash(tint, reducedMotion ? 0.1 : 0.28, reducedMotion ? 120 : 700);
      if (!reducedMotion) triggerVignette(0.35, Math.min(profile.durationMs, 2800));
      break;
    case 'storm_break':
      triggerFlash(tint, reducedMotion ? 0.1 : 0.32, reducedMotion ? 100 : 350);
      if (!reducedMotion) {
        triggerShake(10, 450);
        triggerChromaticAberration(4, 400);
      }
      break;
    case 'shield_pulse':
      triggerFlash(tint, reducedMotion ? 0.08 : 0.2, reducedMotion ? 100 : 600);
      if (!reducedMotion) triggerVignette(0.4, Math.min(profile.durationMs, 2000));
      break;
    case 'warm_echo':
      triggerFlash(tint, reducedMotion ? 0.07 : 0.18, reducedMotion ? 100 : 550);
      break;
    case 'matrix_pulse':
      triggerFlash(tint, reducedMotion ? 0.06 : 0.15, reducedMotion ? 80 : 400);
      if (!reducedMotion) triggerChromaticAberration(2, 350);
      break;
    default: {
      const _exhaustive: never = profile.visualPreset;
      triggerFlash(tint, 0.1, 300);
      return _exhaustive;
    }
  }
}
