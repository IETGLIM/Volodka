/**
 * Session 7 — procedural_aaa arrival staging.
 * Longer holds + light cues + letterbox — stronger than idle+overlay craft.
 */

import type { CinematicTimelineDef } from './cinematicTimelineTypes';

export const PROCEDURAL_AAA_ARRIVAL_TIMELINE: CinematicTimelineDef = {
  id: 'procedural_aaa_arrival',
  fallbackMs: 16_000,
  phases: [
    {
      id: 'ruin_wide',
      duration: 3.2,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.02, 3.2], facingY: Math.PI },
          { t: 1, position: [0, 0.02, 3.0], facingY: Math.PI },
        ],
      },
      camera: {
        mode: 'hold',
        at: {
          position: [5.2, 3.4, 8.0],
          lookAt: [0.0, 2.0, -1.5],
          fov: 42,
          duration: 3.2,
        },
      },
      audioCue: 'mystery',
      lightCue: 'dim_hold',
      overlay: {
        text: 'Руины не спят. Математика стала камнем.',
        letterboxStyle: 'full',
        accentColor: '#88aacc',
      },
    },
    {
      id: 'arch_push',
      duration: 3.0,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.02, 3.0], facingY: Math.PI * 0.9 },
          { t: 1, position: [0.4, 0.02, 2.2], facingY: Math.PI * 0.75 },
        ],
      },
      camera: {
        mode: 'waypoint',
        to: {
          position: [-1.8, 2.4, 5.5],
          lookAt: [4.0, 2.2, -2.0],
          fov: 44,
          duration: 3.0,
        },
      },
      lightCue: 'neon_surge',
      overlay: {
        text: 'Арка. Мост. Чужой силуэт на гребне.',
        letterboxStyle: 'thin',
        accentColor: '#66e0ff',
      },
    },
    {
      id: 'character_settle',
      duration: 2.8,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0.4, 0.02, 2.2], facingY: 0 },
          { t: 1, position: [0, 0.02, 1.0], facingY: 0 },
        ],
      },
      camera: {
        mode: 'waypoint',
        to: {
          position: [1.2, 1.7, 3.8],
          lookAt: [0, 1.45, 1.0],
          fov: 48,
          duration: 2.8,
        },
      },
      lightCue: 'warm_practical',
      audioCue: 'notify',
      overlay: {
        text: 'Шаг. Дыхание. Земля держит.',
        letterboxStyle: 'thin',
        accentColor: '#c8b090',
      },
    },
    {
      id: 'handoff_explore',
      duration: 2.4,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.02, 1.0], facingY: 0 },
          { t: 1, position: [0, 0.02, 0.5], facingY: 0 },
        ],
      },
      camera: {
        mode: 'handoff',
        target: {
          position: [0, 2.3, 5.8],
          lookAt: [0, 1.4, 0],
          fov: 54,
          duration: 2.4,
        },
      },
      lightCue: 'neon_surge',
    },
  ],
};
