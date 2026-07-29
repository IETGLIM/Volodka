import type { DeviceTier } from '@/hooks/useDeviceTier';
import { MENU_PARTICLE_COUNTS } from '@/engine/menu/menuConstants';

export type MenuScreenFx = {
  matrixRain: boolean;
  menuParticles: boolean;
  particleSystem: boolean;
  fogLayers: boolean;
  asciiDecoration: boolean;
  dataStream: boolean;
  circuitGridLines: boolean;
  fullScreenScanLine: boolean;
  crtSweep: boolean;
  atmosphericPan: boolean;
  pulsingVignette: boolean;
  filmGrain: boolean;
  cinematicBars: boolean;
  terminalCorners: boolean;
  systemStatus: boolean;
  dustField: boolean;
  cornerPulse: boolean;
  titleParallax: boolean;
  titleGlitch: boolean;
  contentMotion: boolean;
};

/** Filmic title card — photographic plate + letterbox; no matrix/ASCII/CRT soup. */
const FILMIC_TITLE_FX: MenuScreenFx = {
  matrixRain: false,
  menuParticles: false,
  particleSystem: false,
  fogLayers: false,
  asciiDecoration: false,
  dataStream: false,
  circuitGridLines: false,
  fullScreenScanLine: false,
  crtSweep: false,
  atmosphericPan: true,
  pulsingVignette: true,
  filmGrain: true,
  cinematicBars: true,
  terminalCorners: false,
  systemStatus: false,
  dustField: false,
  cornerPulse: false,
  titleParallax: true,
  titleGlitch: false,
  contentMotion: true,
};

const STATIC_FX: MenuScreenFx = {
  matrixRain: false,
  menuParticles: false,
  particleSystem: false,
  fogLayers: false,
  asciiDecoration: false,
  dataStream: false,
  circuitGridLines: false,
  fullScreenScanLine: false,
  crtSweep: false,
  atmosphericPan: true,
  pulsingVignette: false,
  filmGrain: false,
  cinematicBars: true,
  terminalCorners: false,
  systemStatus: false,
  dustField: false,
  cornerPulse: false,
  titleParallax: false,
  titleGlitch: false,
  contentMotion: false,
};

/** Tier-aware menu FX — filmic plate first; soup disabled on medium/high. */
export function getMenuScreenFx(tier: DeviceTier, reducedMotion: boolean): MenuScreenFx {
  if (reducedMotion) return STATIC_FX;

  switch (tier) {
    case 'low':
      return {
        ...STATIC_FX,
        pulsingVignette: true,
        contentMotion: true,
      };
    case 'medium':
      return {
        ...FILMIC_TITLE_FX,
        filmGrain: false,
        titleParallax: false,
      };
    case 'high':
      return FILMIC_TITLE_FX;
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export function getMenuParticleCounts(tier: DeviceTier) {
  return MENU_PARTICLE_COUNTS[tier];
}
