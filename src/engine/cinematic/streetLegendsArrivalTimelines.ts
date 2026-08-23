/**
 * Street Legends arrival beats (v4.7.6).
 *
 * Режиссура входа для трёх ключевых локаций квест-пака «Уличные легенды»
 * (streetLegendsQuests.ts): парк «Свет в окне напротив», читальный зал
 * библиотеки «Тихий час» и заводской подвал «Крысиные бега».
 *
 * Стиль — эталонный STREET_ARRIVAL_TIMELINE: 3 фазы (establishing wide →
 * деталь окружения → handoff в exploration-фрейминг), actor in_place
 * ключевые кадры, light staging cues, русские overlay-строки.
 */

import type { CinematicTimelineDef } from './cinematicTimelineTypes';

/** Парк — «Свет в окне напротив»: рассветная тишь, скамья, далёкие окна. */
export const PARK_DAY_ARRIVAL_TIMELINE: CinematicTimelineDef = {
  id: 'park_day_arrival',
  fallbackMs: 12_000,
  phases: [
    {
      id: 'park_establishing',
      duration: 3.0,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.01, 1.8], facingY: Math.PI },
          { t: 1, position: [0, 0.01, 1.8], facingY: Math.PI * 0.95 },
        ],
      },
      camera: {
        mode: 'hold',
        at: {
          position: [4.5, 3.2, 7.0],
          lookAt: [-1.0, 1.6, -3.0],
          fov: 44,
          duration: 3.0,
        },
      },
      audioCue: 'mystery',
      lightCue: 'dim_hold',
      overlay: {
        text: 'Парк просыпается. Скамьи помнят всех, кто здесь сидел.',
        letterboxStyle: 'thin',
        accentColor: '#9fd8a8',
      },
    },
    {
      id: 'park_window_glance',
      duration: 2.4,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.01, 1.8], facingY: Math.PI * 0.7 },
          { t: 1, position: [0.4, 0.01, 1.2], facingY: Math.PI * 0.55 },
        ],
      },
      camera: {
        mode: 'waypoint',
        to: {
          position: [-3.0, 3.4, 4.6],
          lookAt: [-10.0, 6.0, -8.0],
          fov: 38,
          duration: 2.4,
        },
      },
      overlay: {
        text: 'Дом напротив. Третье окно слева — то самое.',
        letterboxStyle: 'thin',
        accentColor: '#ffe9a8',
      },
    },
    {
      id: 'park_settle',
      duration: 2.2,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0.4, 0.01, 1.2], facingY: Math.PI * 0.25 },
          { t: 1, position: [0, 0.01, 0.2], facingY: 0 },
        ],
      },
      camera: {
        mode: 'handoff',
        target: {
          position: [0, 2.2, 5.2],
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

/** Библиотека — «Тихий час»: пыль в луче света, стеллажи, тишина. */
export const LIBRARY_DAY_ARRIVAL_TIMELINE: CinematicTimelineDef = {
  id: 'library_day_arrival',
  fallbackMs: 12_000,
  phases: [
    {
      id: 'library_hush',
      duration: 2.8,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.01, 1.6], facingY: Math.PI },
          { t: 1, position: [0, 0.01, 1.6], facingY: Math.PI * 0.9 },
        ],
      },
      camera: {
        mode: 'hold',
        at: {
          position: [3.2, 2.4, 5.8],
          lookAt: [0.4, 1.5, -2.5],
          fov: 42,
          duration: 2.8,
        },
      },
      audioCue: 'mystery',
      overlay: {
        text: 'Читальный зал. Даже воздух здесь — страница.',
        letterboxStyle: 'thin',
        accentColor: '#d8c9a8',
      },
    },
    {
      id: 'library_stacks',
      duration: 2.2,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.01, 1.6], facingY: Math.PI * 0.75 },
          { t: 1, position: [0.5, 0.01, 1.0], facingY: Math.PI * 0.6 },
        ],
      },
      camera: {
        mode: 'waypoint',
        to: {
          position: [-2.2, 1.9, 3.4],
          lookAt: [-7.5, 1.2, -5.0],
          fov: 40,
          duration: 2.2,
        },
      },
      overlay: {
        text: 'Последний стеллаж. Кто-то оставил закладку на середине.',
        letterboxStyle: 'thin',
        accentColor: '#c9a86a',
      },
    },
    {
      id: 'library_settle',
      duration: 2.0,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0.5, 0.01, 1.0], facingY: Math.PI * 0.3 },
          { t: 1, position: [0, 0.01, 0.1], facingY: 0 },
        ],
      },
      camera: {
        mode: 'handoff',
        target: {
          position: [0, 2.1, 4.8],
          lookAt: [0, 1.4, 0],
          fov: 52,
          duration: 2.0,
        },
      },
      lightCue: 'warm_practical',
      audioCue: 'notify',
    },
  ],
};

/** Заводской подвал — «Крысиные бега»: темнота, гул, разряды тока. */
export const FACTORY_BASEMENT_ARRIVAL_TIMELINE: CinematicTimelineDef = {
  id: 'factory_basement_arrival',
  fallbackMs: 13_000,
  phases: [
    {
      id: 'basement_descent',
      duration: 2.6,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.01, 2.0], facingY: Math.PI },
          { t: 1, position: [0, 0.01, 1.4], facingY: Math.PI * 0.92 },
        ],
      },
      camera: {
        mode: 'hold',
        at: {
          position: [2.8, 2.0, 5.4],
          lookAt: [0, 1.3, -2.2],
          fov: 46,
          duration: 2.6,
        },
      },
      audioCue: 'mystery',
      lightCue: 'dim_hold',
      overlay: {
        text: 'Подвал «Прогресса-7». Гул труб — как чьё-то дыхание.',
        letterboxStyle: 'thin',
        accentColor: '#8ab4d8',
      },
    },
    {
      id: 'basement_spark',
      duration: 1.8,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0, 0.01, 1.4], facingY: Math.PI * 0.8 },
          { t: 1, position: [0.3, 0.01, 0.9], facingY: Math.PI * 0.65 },
        ],
      },
      camera: {
        mode: 'waypoint',
        to: {
          position: [-2.6, 1.7, 3.8],
          lookAt: [-6.5, 1.1, -4.5],
          fov: 38,
          duration: 1.8,
        },
      },
      cameraShake: { intensity: 0.25, frequency: 12 },
      overlay: {
        text: 'Электрощиток искрит. Кто-то был здесь. Совсем недавно.',
        letterboxStyle: 'thin',
        accentColor: '#a8d8ff',
        glitchIntensity: 0.15,
      },
    },
    {
      id: 'basement_settle',
      duration: 2.2,
      actor: {
        mode: 'in_place',
        clip: 'idle',
        keyframes: [
          { t: 0, position: [0.3, 0.01, 0.9], facingY: Math.PI * 0.25 },
          { t: 1, position: [0, 0.01, 0.2], facingY: 0 },
        ],
      },
      camera: {
        mode: 'handoff',
        target: {
          position: [0, 2.0, 4.6],
          lookAt: [0, 1.3, 0],
          fov: 54,
          duration: 2.2,
        },
      },
      lightCue: 'dim_hold',
      audioCue: 'notify',
    },
  ],
};
