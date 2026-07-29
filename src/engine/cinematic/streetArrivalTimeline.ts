/**
 * Session 5 — street arrival staging beat.
 * Actor in frame + neon light surge + mystery sting — not camera waypoints alone.
 */

import type { CinematicTimelineDef } from './cinematicTimelineTypes';

export const STREET_ARRIVAL_TIMELINE: CinematicTimelineDef = {
  id: 'street_arrival',
  fallbackMs: 14_500,
  phases: [
    {
      id: 'neon_reveal',
      duration: 2.8,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.01, 2.2], facingY: Math.PI },
          { t: 1, position: [0, 0.01, 2.2], facingY: Math.PI },
        ],
      },
      camera: {
        mode: 'hold',
        at: {
          position: [3.8, 2.6, 6.5],
          lookAt: [0.2, 1.4, -2.0],
          fov: 46,
          duration: 2.8,
        },
      },
      audioCue: 'mystery',
      lightCue: 'neon_surge',
      overlay: {
        text: 'Ночной квартал. Неон дышит — как и ты.',
        letterboxStyle: 'thin',
        accentColor: '#44ffff',
      },
    },
    {
      id: 'alley_glance',
      duration: 2.0,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.01, 2.2], facingY: Math.PI * 0.85 },
          { t: 1, position: [0.3, 0.01, 1.6], facingY: Math.PI * 0.7 },
        ],
      },
      camera: {
        mode: 'waypoint',
        to: {
          position: [-2.5, 2.8, 4.0],
          lookAt: [-8.0, 3.5, -4.0],
          fov: 48,
          duration: 2.0,
        },
      },
      lightCue: 'dim_hold',
      overlay: {
        text: 'Переулок справа. Не торопись.',
        letterboxStyle: 'thin',
        accentColor: '#aa88ff',
      },
    },
    {
      id: 'settle_bench',
      duration: 2.2,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0.3, 0.01, 1.6], facingY: 0 },
          { t: 1, position: [0, 0.01, 0.4], facingY: 0 },
        ],
      },
      camera: {
        mode: 'handoff',
        target: {
          position: [0, 2.2, 5.5],
          lookAt: [0, 1.4, 0],
          fov: 54,
          duration: 2.2,
        },
      },
      lightCue: 'warm_practical',
      audioCue: 'notify',
    },
  ],
};
