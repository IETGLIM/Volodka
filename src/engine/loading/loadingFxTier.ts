import type { DeviceTier } from '@/hooks/useDeviceTier';

export type LoadingScreenFx = {
  matrixRain: boolean;
  filmGrain: boolean;
  hexDump: boolean;
  bootText: boolean;
  breathingGlow: boolean;
  crtSweep: boolean;
  cornerDecor: boolean;
  cinematicBars: boolean;
  glitchTitle: boolean;
  tipRotation: boolean;
  contentMotion: boolean;
  spinnerPulse: boolean;
};

const MINIMAL_FX: LoadingScreenFx = {
  matrixRain: false,
  filmGrain: false,
  hexDump: false,
  bootText: false,
  breathingGlow: false,
  crtSweep: false,
  cornerDecor: false,
  cinematicBars: false,
  glitchTitle: false,
  tipRotation: false,
  contentMotion: false,
  spinnerPulse: false,
};

/** Tier-aware loading screen FX — disable heavy layers on low-end devices. */
export function getLoadingScreenFx(
  tier: DeviceTier,
  reduceMotion: boolean,
  loadingFxDisabled: boolean,
): LoadingScreenFx {
  if (reduceMotion || loadingFxDisabled) {
    return MINIMAL_FX;
  }

  switch (tier) {
    case 'low':
      return {
        ...MINIMAL_FX,
        bootText: true,
        cinematicBars: true,
        tipRotation: true,
      };
    case 'medium':
      return {
        matrixRain: true,
        filmGrain: false,
        hexDump: false,
        bootText: true,
        breathingGlow: true,
        crtSweep: true,
        cornerDecor: true,
        cinematicBars: true,
        glitchTitle: true,
        tipRotation: true,
        contentMotion: true,
        spinnerPulse: true,
      };
    case 'high':
      return {
        matrixRain: true,
        filmGrain: true,
        hexDump: true,
        bootText: true,
        breathingGlow: true,
        crtSweep: true,
        cornerDecor: true,
        cinematicBars: true,
        glitchTitle: true,
        tipRotation: true,
        contentMotion: true,
        spinnerPulse: true,
      };
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}
