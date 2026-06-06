/**
 * Directorial audio manifest — scene themes, character leitmotifs, poem motifs,
 * emotional transitions. Consumed by SceneAudioController and MusicEngine.
 */

import type { SceneId } from '@/config/sceneDefinitions';

/** Music mood category for procedural layering hints */
export type MusicMood =
  | 'cozy_indoor'
  | 'noir_street'
  | 'tension'
  | 'nature'
  | 'combat'
  | 'dream'
  | 'triumph';

export interface SceneAudioProfile {
  sceneId: SceneId;
  reverbPreset: string;
  musicMood: MusicMood;
  /** Crossfade ms when entering this scene's ambient bed */
  ambientCrossfadeMs?: number;
  /** Optional stinger on first enter (once per session handled by controller) */
  enterStinger?: 'discovery' | 'mystery' | 'tension' | 'emotional';
}

export interface CharacterMotif {
  npcId: string;
  /** Semitone intervals from root for a short leitmotif fragment */
  intervals: number[];
  rootMidi: number;
  /** Stinger type played when motif is triggered */
  stinger: 'discovery' | 'emotional' | 'mystery' | 'tension';
  /** Optional music root override while NPC is focal in dialogue */
  dialogueRootMidi?: number;
}

export interface PoemMotif {
  poemId: string;
  intervals: number[];
  rootMidi: number;
  stinger: 'discovery' | 'emotional';
}

export interface EmotionalTransition {
  from: MusicMood;
  to: MusicMood;
  crossfadeSec: number;
  stinger?: 'tension' | 'discovery' | 'danger' | 'emotional' | 'mystery';
}

/** Scene → reverb + mood (extends inline map from useAudioOrchestrator) */
export const SCENE_AUDIO_PROFILES: Partial<Record<SceneId, SceneAudioProfile>> = {
  volodka_room: { sceneId: 'volodka_room', reverbPreset: 'small_room', musicMood: 'cozy_indoor' },
  zarema_albert_room: { sceneId: 'zarema_albert_room', reverbPreset: 'small_room', musicMood: 'cozy_indoor' },
  home_evening: { sceneId: 'home_evening', reverbPreset: 'small_room', musicMood: 'cozy_indoor' },
  volodka_corridor: { sceneId: 'volodka_corridor', reverbPreset: 'corridor', musicMood: 'noir_street' },
  office_day: { sceneId: 'office_day', reverbPreset: 'corridor', musicMood: 'tension' },
  cafe_evening: { sceneId: 'cafe_evening', reverbPreset: 'corridor', musicMood: 'cozy_indoor', enterStinger: 'discovery' },
  library_day: { sceneId: 'library_day', reverbPreset: 'corridor', musicMood: 'cozy_indoor' },
  street_night: { sceneId: 'street_night', reverbPreset: 'large_space', musicMood: 'noir_street', enterStinger: 'mystery' },
  park_day: { sceneId: 'park_day', reverbPreset: 'large_space', musicMood: 'nature' },
  street_winter: { sceneId: 'street_winter', reverbPreset: 'large_space', musicMood: 'noir_street' },
  rooftop_edge: { sceneId: 'rooftop_edge', reverbPreset: 'large_space', musicMood: 'tension', enterStinger: 'tension' },
  abandoned_factory: { sceneId: 'abandoned_factory', reverbPreset: 'large_space', musicMood: 'tension' },
  battle: { sceneId: 'battle', reverbPreset: 'corridor', musicMood: 'combat' },
  sleep_dream: { sceneId: 'sleep_dream', reverbPreset: 'dream', musicMood: 'dream' },
  chk_forest_zorge: { sceneId: 'chk_forest_zorge', reverbPreset: 'large_space', musicMood: 'nature', enterStinger: 'mystery' },
};

/** Character leitmotifs — triggered on dialogue enter / quest beats */
export const CHARACTER_MOTIFS: Record<string, CharacterMotif> = {
  volodka: {
    npcId: 'volodka',
    intervals: [0, 4, 7, 11],
    rootMidi: 48,
    stinger: 'discovery',
    dialogueRootMidi: 48,
  },
  zarema: {
    npcId: 'zarema',
    intervals: [0, 3, 7, 10],
    rootMidi: 55,
    stinger: 'emotional',
    dialogueRootMidi: 53,
  },
  albert: {
    npcId: 'albert',
    intervals: [0, 5, 7],
    rootMidi: 50,
    stinger: 'mystery',
  },
  chk_tolpa_elder: {
    npcId: 'chk_tolpa_elder',
    intervals: [0, 2, 7, 9],
    rootMidi: 45,
    stinger: 'mystery',
  },
};

/** Poem collection motifs */
export const POEM_MOTIFS: Record<string, PoemMotif> = {
  default: {
    poemId: 'default',
    intervals: [0, 4, 7, 12],
    rootMidi: 60,
    stinger: 'discovery',
  },
  karma_dark: {
    poemId: 'karma_dark',
    intervals: [0, 3, 6, 9],
    rootMidi: 48,
    stinger: 'emotional',
  },
  karma_light: {
    poemId: 'karma_light',
    intervals: [0, 4, 7, 16],
    rootMidi: 62,
    stinger: 'discovery',
  },
};

/** Mood-to-mood transition cues */
export const EMOTIONAL_TRANSITIONS: EmotionalTransition[] = [
  { from: 'cozy_indoor', to: 'noir_street', crossfadeSec: 3, stinger: 'mystery' },
  { from: 'noir_street', to: 'tension', crossfadeSec: 2, stinger: 'tension' },
  { from: 'tension', to: 'combat', crossfadeSec: 1, stinger: 'danger' },
  { from: 'combat', to: 'triumph', crossfadeSec: 2.5, stinger: 'discovery' },
  { from: 'nature', to: 'dream', crossfadeSec: 4, stinger: 'emotional' },
  { from: 'cozy_indoor', to: 'dream', crossfadeSec: 5, stinger: 'emotional' },
];

export function getSceneAudioProfile(sceneId: string): SceneAudioProfile | undefined {
  return SCENE_AUDIO_PROFILES[sceneId as SceneId];
}

export function getSceneReverbPreset(sceneId: string): string | undefined {
  return getSceneAudioProfile(sceneId)?.reverbPreset;
}

export function getSceneMusicMood(sceneId: string): MusicMood | undefined {
  return getSceneAudioProfile(sceneId)?.musicMood;
}

export function getCharacterMotif(npcId: string): CharacterMotif | undefined {
  return CHARACTER_MOTIFS[npcId];
}

export function getPoemMotif(poemId: string): PoemMotif {
  return POEM_MOTIFS[poemId] ?? POEM_MOTIFS.default;
}

export function findEmotionalTransition(
  from: MusicMood,
  to: MusicMood,
): EmotionalTransition | undefined {
  return EMOTIONAL_TRANSITIONS.find((t) => t.from === from && t.to === to);
}
