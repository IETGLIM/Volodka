/* ─── AAA Procedural Mood Tables — free, no paid stems ───
 * Defines per-act sonic identity: harmonic tint, tempo, reverb, LFO.
 * Integrated into MusicEngine via applyActMusicTint extension.
 */

import type { SceneId } from '@/shared/types/game';

export interface ActMood {
  name: string;
  description: string;
  rootSemitoneDelta: number; // how many semitones to shift root
  tempoMult: number;
  padFilterMult: number;
  reverbMult: number;
  lfoMult: number;
  scaleFlavor?: 'darker' | 'brighter' | 'neutral';
}

export const AAA_ACT_MOODS: Record<number, ActMood> = {
  1: {
    name: 'Пробуждение',
    description: 'Тихое утро, мониторы гудят, кофе остывает. C minor pentatonic, slow.',
    rootSemitoneDelta: 0,
    tempoMult: 1.0,
    padFilterMult: 1.0,
    reverbMult: 1.0,
    lfoMult: 1.0,
    scaleFlavor: 'neutral',
  },
  2: {
    name: 'ЧК и город',
    description: 'Ночной дождь, неон, ЧК. Natural minor, чуть быстрее, больше реверба.',
    rootSemitoneDelta: 2,
    tempoMult: 1.04,
    padFilterMult: 0.85,
    reverbMult: 1.25,
    lfoMult: 0.85,
    scaleFlavor: 'darker',
  },
  3: {
    name: 'Кибер-расследование',
    description: 'Тень Заремы, архив, тревога. Phrygian, медленнее, густой фильтр.',
    rootSemitoneDelta: -1,
    tempoMult: 0.96,
    padFilterMult: 0.75,
    reverbMult: 1.4,
    lfoMult: 0.9,
    scaleFlavor: 'darker',
  },
  4: {
    name: 'Сопротивление',
    description: 'Крыши, рация, шепот. Lydian bright, быстрее, LFO дрожит.',
    rootSemitoneDelta: 3,
    tempoMult: 1.08,
    padFilterMult: 1.1,
    reverbMult: 0.95,
    lfoMult: 1.25,
    scaleFlavor: 'brighter',
  },
  5: {
    name: 'Подвал и память',
    description: 'Заря-М гудит, память всплывает. Низкий phrygian drone, медленно, реверб — пещера.',
    rootSemitoneDelta: -3,
    tempoMult: 0.88,
    padFilterMult: 0.62,
    reverbMult: 1.65,
    lfoMult: 0.6,
    scaleFlavor: 'darker',
  },
  6: {
    name: 'Взлом системы',
    description: 'Надзор, битва, адреналин. Square phrygian, быстро, резкий фильтр.',
    rootSemitoneDelta: 5,
    tempoMult: 1.15,
    padFilterMult: 1.25,
    reverbMult: 0.8,
    lfoMult: 1.6,
    scaleFlavor: 'brighter',
  },
  7: {
    name: 'Апокалипсис и поэзия',
    description: 'Тишина после. Lydian major с minor вкраплениями, медленно, широко, реверб — собор.',
    rootSemitoneDelta: 0,
    tempoMult: 0.84,
    padFilterMult: 0.92,
    reverbMult: 1.8,
    lfoMult: 0.55,
    scaleFlavor: 'neutral',
  },
};

export function getActMood(act: number): ActMood {
  return AAA_ACT_MOODS[act] ?? AAA_ACT_MOODS[1];
}

/* ── Scene-specific mood overrides — some scenes have their own color even within act ── */
export const SCENE_MOOD_OVERRIDE: Partial<Record<SceneId, Partial<ActMood>>> = {
  volodka_room: { padFilterMult: 1.15, reverbMult: 0.85, scaleFlavor: 'neutral' },
  cafe_evening: { padFilterMult: 1.2, reverbMult: 0.75, tempoMult: 1.06, scaleFlavor: 'brighter' },
  river_pier: { padFilterMult: 1.0, reverbMult: 1.3, tempoMult: 0.94, scaleFlavor: 'neutral' },
  sleep_dream: { padFilterMult: 0.82, reverbMult: 1.95, tempoMult: 0.78, scaleFlavor: 'brighter' },
  factory_basement: { padFilterMult: 0.55, reverbMult: 1.85, tempoMult: 0.82, scaleFlavor: 'darker' },
  chk_forest_zorge: { padFilterMult: 0.88, reverbMult: 1.45, tempoMult: 0.92, scaleFlavor: 'darker' },
  chk_campfire_night: { padFilterMult: 1.1, reverbMult: 0.9, tempoMult: 1.0, scaleFlavor: 'neutral' },
  city_square: { padFilterMult: 0.9, reverbMult: 1.2, tempoMult: 1.02, scaleFlavor: 'darker' },
  rooftop_edge: { padFilterMult: 0.88, reverbMult: 1.35, tempoMult: 0.98, scaleFlavor: 'darker' },
};
