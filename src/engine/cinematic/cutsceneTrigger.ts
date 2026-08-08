/**
 * Volodka RPG – Cutscene Trigger Infrastructure
 *
 * Decides which preset cutscene should play when the player enters a scene.
 * Tracks already-played cutscenes in localStorage so each fires only once.
 * Does NOT modify the scene manager — callers check `shouldTriggerCutscene()`
 * and launch the cinematic themselves via `startCinematicTimeline()`.
 *
 * Russian text for labels. Cyberpunk palette.
 */

import type { SceneId } from '@/config/sceneDefinitions';
import { SCENE_CONFIG } from '@/config/scenes';

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

/** Weather context passed by the caller (store or HUD controller). */
export interface WeatherContext {
  /** Whether weather effects are enabled */
  weatherEnabled: boolean;
  /** Rain intensity 0–1 */
  rainIntensity: number;
}

/** Result returned by `shouldTriggerCutscene`. */
export interface CutsceneTriggerResult {
  /** Cutscene definition ID (key in PRESET_CUTSCENES) */
  cutsceneId: string;
  /** Human-readable description (Russian) */
  description: string;
}

/* ══════════════════════════════════════════════════════════════
   localStorage persistence
   ══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'volodka_cutscenes_played';

interface PlayedSet {
  [cutsceneId: string]: true;
}

function loadPlayedSet(): PlayedSet {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PlayedSet;
  } catch {
    // Corrupted JSON — start fresh
  }
  return {};
}

function savePlayedSet(set: PlayedSet): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(set));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

/** Mark a cutscene as played so it won't trigger again. */
export function markCutscenePlayed(cutsceneId: string): void {
  const set = loadPlayedSet();
  set[cutsceneId] = true;
  savePlayedSet(set);
}

/** Check whether a specific cutscene has already played. */
export function hasCutscenePlayed(cutsceneId: string): boolean {
  return loadPlayedSet()[cutsceneId] === true;
}

/** Reset all played cutscenes (useful for debug / new game). */
export function resetCutscenePlayedHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/* ══════════════════════════════════════════════════════════════
   Scene visit tracking (in-memory, resets on page reload —
   first-visit detection only needs to work within a session)
   ══════════════════════════════════════════════════════════════ */

const visitedScenes = new Set<string>();

/** Record that the player has entered a scene. Call before shouldTriggerCutscene. */
export function recordSceneVisit(sceneId: SceneId): void {
  visitedScenes.add(sceneId);
}

/** Check if this is the first time the player visits a scene this session. */
function isFirstVisit(sceneId: SceneId): boolean {
  return !visitedScenes.has(sceneId);
}

/* ══════════════════════════════════════════════════════════════
   Scene type helpers
   ══════════════════════════════════════════════════════════════ */

/** Scenes that are outdoor (no ceiling) — used for weather-triggered cutscenes. */
function isOutdoorScene(sceneId: SceneId): boolean {
  const config = SCENE_CONFIG[sceneId];
  return config ? !config.hasCeiling : false;
}

/** Guild-related scene IDs. */
const GUILD_SCENE_IDS: ReadonlySet<string> = new Set([
  'guild_mainframe',
]);

function isGuildScene(sceneId: SceneId): boolean {
  return GUILD_SCENE_IDS.has(sceneId);
}

/* ══════════════════════════════════════════════════════════════
   Cutscene trigger rules
   ══════════════════════════════════════════════════════════════ */

interface TriggerRule {
  cutsceneId: string;
  description: string;
  /** Check if this rule should fire for the given scene and weather */
  check: (sceneId: SceneId, weather: WeatherContext) => boolean;
}

/**
 * Ordered list of trigger rules. First matching rule wins.
 *
 * 1. room_awakening  — first time player enters volodka_room
 * 2. street_first_steps — first time player enters street_night
 * 3. guild_arrival — first time player enters any guild scene
 * 4. rain_moment — weather enabled + rain + outdoor scene (one-shot)
 */
const TRIGGER_RULES: TriggerRule[] = [
  {
    cutsceneId: 'room_awakening',
    description: 'Пробуждение — первая сцена в комнате Володьки',
    check: (sceneId) => sceneId === 'volodka_room' && isFirstVisit(sceneId),
  },
  {
    cutsceneId: 'street_first_steps',
    description: 'Первые шаги — первый выход на улицу ночью',
    check: (sceneId) => sceneId === 'street_night' && isFirstVisit(sceneId),
  },
  {
    cutsceneId: 'guild_arrival',
    description: 'Прибытие в гильдию — первый вход в IT-гильдию',
    check: (sceneId) => isGuildScene(sceneId) && isFirstVisit(sceneId),
  },
  {
    cutsceneId: 'rain_moment',
    description: 'Дождливый момент — дождь на открытой локации',
    check: (sceneId, weather) =>
      isOutdoorScene(sceneId) &&
      weather.weatherEnabled &&
      weather.rainIntensity > 0.3,
  },
];

/* ══════════════════════════════════════════════════════════════
   Public API
   ══════════════════════════════════════════════════════════════ */

/**
 * Evaluate whether a cutscene should trigger on entering the given scene.
 *
 * @param sceneId  The scene the player just entered.
 * @param weather  Current weather context from the store.
 * @returns CutsceneTriggerResult if a cutscene should play, or `null`.
 *
 * Usage:
 * ```ts
 * const result = shouldTriggerCutscene(sceneId, { weatherEnabled, rainIntensity });
 * if (result) {
 *   markCutscenePlayed(result.cutsceneId);
 *   const def = getPresetCutscene(result.cutsceneId);
 *   if (def) startCinematicTimeline(presetCutsceneToTimeline(def));
 * }
 * ```
 */
export function shouldTriggerCutscene(
  sceneId: SceneId,
  weather: WeatherContext,
): CutsceneTriggerResult | null {
  const played = loadPlayedSet();

  for (const rule of TRIGGER_RULES) {
    // Skip if already played (persisted across sessions)
    if (played[rule.cutsceneId]) continue;

    if (rule.check(sceneId, weather)) {
      return {
        cutsceneId: rule.cutsceneId,
        description: rule.description,
      };
    }
  }

  return null;
}

/**
 * Get the list of all cutscene trigger rules (for debug/UI display).
 * Each entry includes whether it has been played.
 */
export function getCutsceneTriggerRules(): Array<{
  cutsceneId: string;
  description: string;
  played: boolean;
}> {
  const played = loadPlayedSet();
  return TRIGGER_RULES.map((rule) => ({
    cutsceneId: rule.cutsceneId,
    description: rule.description,
    played: played[rule.cutsceneId] === true,
  }));
}
