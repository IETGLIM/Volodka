/**
 * Procedural audio catalog — scene moods, character leitmotifs, poem motifs,
 * and emotional transitions as synth parameters (intervals, rootMidi, stingers).
 * No bundled audio file paths; playback is procedural via MusicEngine / SfxEngine.
 */

import type { SceneId } from '@/config/sceneDefinitions';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';

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

/** Per-act mood override — the same scene sounds subtly different as the story darkens.
 *  Key format: `${sceneId}:${actNumber}`. Missing entries fall back to the base
 *  SCENE_AUDIO_PROFILES mood. */
export interface ActMoodOverride {
  /** Overridden mood for this scene in this act */
  mood: MusicMood;
  /** Low-pass filter cutoff (Hz) — lower = darker, muffled */
  filterCutoff: number;
  /** Wet/dry reverb mix (0–1) — higher = more distant, hollow */
  reverbMix: number;
}

/** Scene → reverb + mood (extends inline map from useAudioOrchestrator) */
export const SCENE_AUDIO_PROFILES: Partial<Record<SceneId, SceneAudioProfile>> = {
  solnysh_room: { sceneId: 'solnysh_room', reverbPreset: 'small_room', musicMood: 'cozy_indoor' },
  factory_basement: { sceneId: 'factory_basement', reverbPreset: 'large_space', musicMood: 'tension', enterStinger: 'tension' },
  river_pier: { sceneId: 'river_pier', reverbPreset: 'large_space', musicMood: 'noir_street', enterStinger: 'mystery', ambientCrossfadeMs: 2800 },
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
  abandoned_factory: { sceneId: 'abandoned_factory', reverbPreset: 'corridor', musicMood: 'tension', enterStinger: 'tension' },
  battle: { sceneId: 'battle', reverbPreset: 'corridor', musicMood: 'combat' },
  sleep_dream: { sceneId: 'sleep_dream', reverbPreset: 'dream', musicMood: 'dream' },
  chk_forest_zorge: { sceneId: 'chk_forest_zorge', reverbPreset: 'nature', musicMood: 'nature', enterStinger: 'mystery' },
  // Extension scenes — mood/reverb aligned with SCENE_DERIVED_FROM parent + scene ambience
  chk_campfire_night: { sceneId: 'chk_campfire_night', reverbPreset: 'nature', musicMood: 'nature', enterStinger: 'mystery' },
  pier_evening: { sceneId: 'pier_evening', reverbPreset: 'large_space', musicMood: 'noir_street', enterStinger: 'mystery' },
  factory_roof: { sceneId: 'factory_roof', reverbPreset: 'large_space', musicMood: 'tension', enterStinger: 'tension' },
  library_basement: { sceneId: 'library_basement', reverbPreset: 'corridor', musicMood: 'cozy_indoor' },
  city_square: { sceneId: 'city_square', reverbPreset: 'large_space', musicMood: 'noir_street', enterStinger: 'mystery' },
  underground_bunker: { sceneId: 'underground_bunker', reverbPreset: 'large_space', musicMood: 'tension', enterStinger: 'tension' },
  guild_mainframe: { sceneId: 'guild_mainframe', reverbPreset: 'corridor', musicMood: 'tension' },
  zarema_room: { sceneId: 'zarema_room', reverbPreset: 'small_room', musicMood: 'cozy_indoor' },
  albert_backroom: { sceneId: 'albert_backroom', reverbPreset: 'corridor', musicMood: 'cozy_indoor', enterStinger: 'discovery' },
  /** Procedural AAA showcase — street-adjacent noir bed for dev / hero scene */
  procedural_aaa: { sceneId: 'procedural_aaa', reverbPreset: 'large_space', musicMood: 'noir_street', enterStinger: 'mystery' },
};

const MOTIF_STUB = (
  npcId: string,
  intervals: number[],
  rootMidi: number,
  stinger: CharacterMotif['stinger'],
  dialogueRootMidi?: number,
): CharacterMotif => ({
  npcId,
  intervals,
  rootMidi,
  stinger,
  ...(dialogueRootMidi !== undefined ? { dialogueRootMidi } : {}),
});

/**
 * Hand-authored procedural leitmotifs. Golden-path NPCs are prioritized;
 * ambient / side characters fall back to {@link deriveCharacterMotifFromNpcId}.
 */
export const CHARACTER_MOTIFS: Record<string, CharacterMotif> = {
  volodka: MOTIF_STUB('volodka', [0, 4, 7, 11], 48, 'discovery', 48),
  zarema: MOTIF_STUB('zarema', [0, 3, 7, 10], 55, 'emotional', 53),
  albert: MOTIF_STUB('albert', [0, 5, 7], 50, 'mystery'),
  // Legacy id — canonical CHK elder is chk_ru
  chk_tolpa_elder: MOTIF_STUB('chk_tolpa_elder', [0, 2, 7, 9], 45, 'mystery'),
  chk_ru: MOTIF_STUB('chk_ru', [0, 2, 7, 9], 45, 'mystery'),
  solnysh: MOTIF_STUB('solnysh', [0, 4, 7], 58, 'emotional', 56),
  lyonya: MOTIF_STUB('lyonya', [0, 4, 7, 10], 52, 'discovery'),
  maria: MOTIF_STUB('maria', [0, 3, 6, 9], 52, 'mystery', 50),
  cafe_barista: MOTIF_STUB('cafe_barista', [0, 5, 7, 10], 47, 'discovery'),
  office_alexander: MOTIF_STUB('office_alexander', [0, 2, 5, 7], 44, 'tension'),
  office_colleague: MOTIF_STUB('office_colleague', [0, 4, 7], 51, 'mystery'),
  office_dmitry: MOTIF_STUB('office_dmitry', [0, 1, 6, 8], 43, 'tension'),
  chk_based: MOTIF_STUB('chk_based', [0, 5, 7], 46, 'discovery'),
  chk_elis: MOTIF_STUB('chk_elis', [0, 3, 7, 12], 54, 'emotional'),
  chk_stalker: MOTIF_STUB('chk_stalker', [0, 2, 7], 42, 'tension'),
  anya: MOTIF_STUB('anya', [0, 4, 7, 11], 56, 'discovery'),
  maxim: MOTIF_STUB('maxim', [0, 5, 7, 10], 49, 'tension'),
  zeka: MOTIF_STUB('zeka', [0, 3, 7], 41, 'mystery'),
  sergey: MOTIF_STUB('sergey', [0, 4, 7], 50, 'discovery'),
  kate: MOTIF_STUB('kate', [0, 2, 5, 9], 57, 'emotional'),
};

/**
 * Story NPC registry ids without a dedicated entry in {@link CHARACTER_MOTIFS}.
 * These receive a deterministic hash-derived procedural stub via getCharacterMotif.
 */
export const STORY_NPCS_WITHOUT_DEDICATED_MOTIFS = [
  'chk_smert',
  'chk_ritka',
  'fisherman_trofim',
  'baba_zina',
  'guild_defector',
  'marat_echo',
  'street_poet',
] as const satisfies readonly string[];

export type StoryNpcWithoutDedicatedMotif = (typeof STORY_NPCS_WITHOUT_DEDICATED_MOTIFS)[number];

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

const NEUTRAL_CHARACTER_MOTIF: CharacterMotif = {
  npcId: '_neutral',
  intervals: [0, 4, 7],
  rootMidi: 50,
  stinger: 'discovery',
};

const DERIVED_INTERVAL_SETS: readonly (readonly number[])[] = [
  [0, 4, 7],
  [0, 3, 7],
  [0, 5, 7],
  [0, 2, 7, 9],
];

const DERIVED_STINGERS: readonly CharacterMotif['stinger'][] = [
  'discovery',
  'emotional',
  'mystery',
  'tension',
];

function hashNpcId(npcId: string): number {
  let hash = 0;
  for (let i = 0; i < npcId.length; i++) {
    hash = (hash * 31 + npcId.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic procedural stub when no hand-authored motif exists. */
export function deriveCharacterMotifFromNpcId(npcId: string): CharacterMotif {
  const hash = hashNpcId(npcId);
  return {
    npcId,
    intervals: [...DERIVED_INTERVAL_SETS[hash % DERIVED_INTERVAL_SETS.length]],
    rootMidi: NEUTRAL_CHARACTER_MOTIF.rootMidi + (hash % 18),
    stinger: DERIVED_STINGERS[hash % DERIVED_STINGERS.length],
  };
}

/** Direct catalog entry, or inherited profile from {@link resolveDerivedSceneId}. */
export function getSceneAudioProfile(sceneId: string): SceneAudioProfile | undefined {
  const id = sceneId as SceneId;
  const direct = SCENE_AUDIO_PROFILES[id];
  if (direct) return direct;

  const parentId = resolveDerivedSceneId(id);
  if (parentId === id) return undefined;

  const parent = SCENE_AUDIO_PROFILES[parentId];
  if (!parent) return undefined;

  return { ...parent, sceneId: id };
}

export function getSceneReverbPreset(sceneId: string): string | undefined {
  return getSceneAudioProfile(sceneId)?.reverbPreset;
}

export function getSceneMusicMood(sceneId: string): MusicMood | undefined {
  return getSceneAudioProfile(sceneId)?.musicMood;
}

/** Dedicated motif when authored; otherwise a stable hash-derived procedural stub. */
export function getCharacterMotif(npcId: string): CharacterMotif {
  const canonicalId = resolveCanonicalNpcId(npcId);
  return CHARACTER_MOTIFS[canonicalId] ?? CHARACTER_MOTIFS[npcId] ?? deriveCharacterMotifFromNpcId(canonicalId);
}

export function hasDedicatedCharacterMotif(npcId: string): boolean {
  const canonicalId = resolveCanonicalNpcId(npcId);
  return canonicalId in CHARACTER_MOTIFS || npcId in CHARACTER_MOTIFS;
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

/* ── Per-act mood overrides ── */

/** Per-act mood overrides — the same scene sounds subtly different as the story darkens.
 *  Key: `${sceneId}:${actNumber}` → overrides for that scene in that act.
 *  Missing entries fall back to the base SCENE_AUDIO_PROFILES mood.
 *
 *  Act 1 = base profile (no override needed). Acts 2–5 progressively darken. */
export const ACT_MOOD_OVERRIDES: Record<string, ActMoodOverride> = {
  // ── volodka_room ──
  // Act 2: Growing unease
  'volodka_room:2': { mood: 'cozy_indoor', filterCutoff: 1500, reverbMix: 0.2 },
  // Act 3: Betrayal, tension
  'volodka_room:3': { mood: 'tension', filterCutoff: 1200, reverbMix: 0.25 },
  // Act 4: Dark revelations
  'volodka_room:4': { mood: 'tension', filterCutoff: 1000, reverbMix: 0.3 },
  // Act 5: Climax
  'volodka_room:5': { mood: 'noir_street', filterCutoff: 900, reverbMix: 0.35 },

  // ── street_night ──
  // Act 2: Unsettling
  'street_night:2': { mood: 'noir_street', filterCutoff: 1800, reverbMix: 0.2 },
  // Act 3: Danger
  'street_night:3': { mood: 'tension', filterCutoff: 1400, reverbMix: 0.25 },
  // Act 4: Hostile
  'street_night:4': { mood: 'tension', filterCutoff: 1100, reverbMix: 0.3 },
  // Act 5: Desperate
  'street_night:5': { mood: 'tension', filterCutoff: 850, reverbMix: 0.35 },

  // ── home_evening ──
  // Act 2: Comfort fading
  'home_evening:2': { mood: 'cozy_indoor', filterCutoff: 1600, reverbMix: 0.18 },
  // Act 3: Unease at home
  'home_evening:3': { mood: 'cozy_indoor', filterCutoff: 1200, reverbMix: 0.25 },
  // Act 4: Home no longer safe
  'home_evening:4': { mood: 'tension', filterCutoff: 1000, reverbMix: 0.3 },
  // Act 5: Cold comfort
  'home_evening:5': { mood: 'noir_street', filterCutoff: 900, reverbMix: 0.35 },

  // ── factory_basement ──
  // Act 2: Industrial hum
  'factory_basement:2': { mood: 'tension', filterCutoff: 1400, reverbMix: 0.2 },
  // Act 3: Ominous
  'factory_basement:3': { mood: 'tension', filterCutoff: 1100, reverbMix: 0.28 },
  // Act 4: Dread
  'factory_basement:4': { mood: 'tension', filterCutoff: 850, reverbMix: 0.35 },
  // Act 5: Confrontation
  'factory_basement:5': { mood: 'combat', filterCutoff: 700, reverbMix: 0.4 },

  // ── library_day ──
  // Act 2: Quiet knowledge
  'library_day:2': { mood: 'cozy_indoor', filterCutoff: 1800, reverbMix: 0.15 },
  // Act 3: Unsettling truths
  'library_day:3': { mood: 'cozy_indoor', filterCutoff: 1400, reverbMix: 0.22 },
  // Act 4: Forbidden archives
  'library_day:4': { mood: 'tension', filterCutoff: 1100, reverbMix: 0.3 },
  // Act 5: Final revelation
  'library_day:5': { mood: 'tension', filterCutoff: 900, reverbMix: 0.38 },
};

/** Resolve the per-act mood override for a given scene + act.
 *  Returns `null` when no override exists (caller should fall back to base profile). */
export function resolveActMoodOverride(
  sceneId: string,
  act: number,
): ActMoodOverride | null {
  const key = `${sceneId}:${act}`;
  return ACT_MOOD_OVERRIDES[key] ?? null;
}
