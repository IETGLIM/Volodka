/* ─── Volodka RPG – persisted store state registry ─── */
/* Single source of truth for save/load/reset field lists and defaults.
 *
 * Adding a new persisted field:
 * 1. Add the field to SavePayloadSchema in shared/validation/saveSchema.ts
 * 2. Add its default in createDefaultPersistedState() below
 * saveGame / loadGame pick keys from the schema automatically. */

import { sanitizeExplorationSceneId } from '@/config/scenes';
import {
  SavePayloadSchema,
  type SavePayload,
  parseNpcStatesFromSave,
} from '@/shared/validation/saveSchema';
import {
  createDefaultExploration,
  createDefaultPlayerState,
  createDefaultTutorialFlags,
} from './shared';
import type { GameStoreState } from './types';

/** Store keys written to / restored from localStorage (derived from Zod schema). */
export type PersistedStoreKey = Exclude<
  keyof SavePayload,
  'saveVersion' | 'savedAt' | 'playTimeSeconds'
>;

const SAVE_META_KEYS = new Set(['saveVersion', 'savedAt', 'playTimeSeconds']);

export function getPersistedStateKeys(): PersistedStoreKey[] {
  return Object.keys(SavePayloadSchema.shape).filter(
    (key): key is PersistedStoreKey => !SAVE_META_KEYS.has(key),
  );
}

/** Defaults for fields that survive save/load. */
export function createDefaultPersistedState(): Pick<GameStoreState, PersistedStoreKey> {
  return {
    mode: 'menu',
    currentNodeId: 'start',
    playerState: createDefaultPlayerState(),
    exploration: createDefaultExploration(),
    quests: [],
    collectedPoems: [],
    npcRelations: [],
    tutorialFlags: createDefaultTutorialFlags(),
    interactiveObjectStates: {},
    loreEntries: [],
    conversationLog: {},
    poemPowers: {},
    activeTTLFlags: [],
    journalTab: 'notes',
    weatherEnabled: true,
    rainIntensity: 0.7,
    musicEnabled: true,
    musicVolume: 0.5,
    introSeen: false,
    showStoryOverlay: false,
    unlockedAchievements: [],
    discoveredScenes: ['volodka_room'],
    triggeredCutscenes: [],
    npcAffinity: {},
    acceptedDailyMissions: [],
    lastDailyReset: 0,
    achievementProgress: {
      visitedScenes: [],
      combatVictories: 0,
      consecutiveVictories: 0,
      maxComboAchieved: 0,
      hasCriticalHit: false,
      defeatedEnemyTypes: [],
      nightTimeHours: 0,
      poemPowerUsedInCombat: false,
    },
  };
}

/** Ephemeral session fields reset on new game (not written to save files). */
export function createDefaultSessionState(): Partial<GameStoreState> {
  return {
    lastSaveTimestamp: null,
    lastAutoSaveTimestamp: null,
    notifications: [],
    activeCutsceneId: null,
    cutsceneWaypoints: [],
    matrixRainEnabled: true,
    glitchIntensity: 0,
    noirMode: false,
    journalOpen: false,
  };
}

/** Full store patch for resetGame — persisted + session defaults. */
export function createDefaultResetState(): Partial<GameStoreState> {
  return {
    ...createDefaultPersistedState(),
    ...createDefaultSessionState(),
  };
}

/** Build the localStorage payload from live store state. */
export function pickSavePayload(
  state: GameStoreState,
): Omit<SavePayload, 'saveVersion'> {
  const payload = {} as Record<string, unknown>;
  for (const key of getPersistedStateKeys()) {
    payload[key] = state[key];
  }
  // Overlay close used to clear currentNodeId; schema requires non-empty string.
  const nodeId = state.currentNodeId?.trim();
  payload.currentNodeId = nodeId || 'start';
  payload.savedAt = Date.now();
  return payload as Omit<SavePayload, 'saveVersion'>;
}

/** Merge validated save data over defaults for loadGame. */
export function storePatchFromSave(payload: SavePayload): Partial<GameStoreState> {
  const defaults = createDefaultPersistedState();
  const patch: Partial<GameStoreState> = {
    lastSaveTimestamp: payload.savedAt,
    playerState: {
      ...defaults.playerState,
      ...payload.playerState,
    },
    exploration: {
      ...defaults.exploration,
      ...payload.exploration,
      currentSceneId: sanitizeExplorationSceneId(payload.exploration.currentSceneId),
      npcStates: parseNpcStatesFromSave(payload.exploration.npcStates),
    },
    achievementProgress: {
      ...defaults.achievementProgress,
      ...payload.achievementProgress,
    },
  };

  for (const key of getPersistedStateKeys()) {
    if (key === 'playerState' || key === 'exploration' || key === 'achievementProgress') {
      continue;
    }
    (patch as Record<string, unknown>)[key] = payload[key];
  }

  return patch;
}
