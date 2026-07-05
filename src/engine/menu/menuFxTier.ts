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
  atmosphericPan: false,
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

/** Tier-aware menu FX — disable heavy layers on low-end devices and reduced motion. */
export function getMenuScreenFx(tier: DeviceTier, reducedMotion: boolean): MenuScreenFx {
  if (reducedMotion) return STATIC_FX;

  switch (tier) {
    case 'low':
      return {
        ...STATIC_FX,
        matrixRain: true,
        pulsingVignette: true,
        titleGlitch: true,
        contentMotion: true,
      };
    case 'medium':
      return {
        matrixRain: true,
        menuParticles: true,
        particleSystem: false,
        fogLayers: false,
        asciiDecoration: false,
        dataStream: false,
        circuitGridLines: true,
        fullScreenScanLine: false,
        crtSweep: true,
        atmosphericPan: false,
        pulsingVignette: true,
        filmGrain: false,
        cinematicBars: true,
        terminalCorners: true,
        systemStatus: true,
        dustField: false,
        cornerPulse: true,
        titleParallax: false,
        titleGlitch: true,
        contentMotion: true,
      };
    case 'high':
      return {
        matrixRain: true,
        menuParticles: true,
        particleSystem: true,
        fogLayers: true,
        asciiDecoration: true,
        dataStream: true,
        circuitGridLines: true,
        fullScreenScanLine: true,
        crtSweep: true,
        atmosphericPan: true,
        pulsingVignette: true,
        filmGrain: true,
        cinematicBars: true,
        terminalCorners: true,
        systemStatus: true,
        dustField: true,
        cornerPulse: true,
        titleParallax: true,
        titleGlitch: true,
        contentMotion: true,
      };
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export function getMenuParticleCounts(tier: DeviceTier) {
  return MENU_PARTICLE_COUNTS[tier];
}
