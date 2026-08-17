/**
 * City square hero arrival staging.
 * Plaza gets a slow civic reveal before exploration handoff.
 */

import type { CinematicTimelineDef } from './cinematicTimelineTypes';

export const CITY_SQUARE_ARRIVAL_TIMELINE: CinematicTimelineDef = {
  id: 'city_square_arrival',
  fallbackMs: 15_000,
  phases: [
    {
      id: 'plaza_wide_reveal',
      duration: 3.0,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.02, 5.2], facingY: Math.PI },
          { t: 1, position: [0, 0.02, 5.0], facingY: Math.PI },
        ],
      },
      camera: {
        mode: 'hold',
        at: {
          position: [7.8, 4.1, 10.5],
          lookAt: [0, 2.2, 0.2],
          fov: 40,
          duration: 3.0,
        },
      },
      audioCue: 'mystery',
      lightCue: 'dim_hold',
      overlay: {
        text: 'Площадь раскрывается мокрым камнем и холодным светом.',
        letterboxStyle: 'thin',
        accentColor: '#88aacc',
        fadeInMs: 420,
        fadeOutMs: 720,
      },
    },
    {
      id: 'obelisk_orbit',
      duration: 2.7,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.02, 5.0], facingY: Math.PI * 0.85 },
          { t: 1, position: [-0.35, 0.02, 4.25], facingY: Math.PI * 0.62 },
        ],
      },
      camera: {
        mode: 'waypoint',
        to: {
          position: [-4.6, 3.2, 7.4],
          lookAt: [0.2, 2.8, 0],
          fov: 43,
          duration: 2.7,
        },
      },
      lightCue: 'neon_surge',
      overlay: {
        text: 'У обелиска шевелится неон. Город смотрит первым.',
        letterboxStyle: 'thin',
        accentColor: '#44ffff',
        fadeInMs: 320,
        fadeOutMs: 620,
      },
    },
    {
      id: 'handoff_to_square',
      duration: 2.4,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [-0.35, 0.02, 4.25], facingY: 0 },
          { t: 1, position: [0, 0.02, 3.2], facingY: 0 },
        ],
      },
      camera: {
        mode: 'handoff',
        target: {
          position: [0, 2.35, 7.0],
          lookAt: [0, 1.45, 3.2],
          fov: 52,
          duration: 2.4,
        },
      },
      lightCue: 'warm_practical',
      audioCue: 'notify',
    },
  ],
};
