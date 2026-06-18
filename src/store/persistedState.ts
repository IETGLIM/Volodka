/* ─── Volodka RPG – persisted store state registry ─── */
/* Single source of truth for save/load/reset field lists and defaults.
 *
 * Adding a new persisted field:
 * 1. Add the field to SavePayloadSchema in shared/validation/saveSchema.ts
 * 2. Add its default in createDefaultPersistedState() below
 * saveGame / loadGame pick keys from the schema automatically. */

import { sanitizeExplorationSceneId } from '@/config/scenes';
import { isClosedOverlayExploreHub } from '@/shared/sceneExploreHubRegistry';
import {
  SavePayloadSchema,
  type SavePayload,
  parseNpcStatesFromSave,
} from '@/shared/validation/saveSchema';
import { normalizeInventoryItem } from '@/store/inventoryHelpers';
import { BOOT_PHASE_FLAGS, phaseFlagsFromLegacyMode } from '@/shared/gamePhase';
import {
  createDefaultExploration,
  createDefaultPlayerState,
  createDefaultTutorialFlags,
} from './shared';
import { createEmptyActiveTTLFlagMap } from './activeTTLFlags';
import type { ActiveTTLFlagMap } from '@/shared/activeTTLFlags';
import {
  ttlExpiryFromPersisted,
  ttlExpiryToPersisted,
} from '@/shared/ttlClock';
import type { GameStoreState } from './types';
import { getCombinedGameState } from './storeBindings';

/** Persisted fields only — validated before localStorage write. */
const PickSavePayloadSchema = SavePayloadSchema.omit({ saveVersion: true });

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

/** Progress-based play-time estimate for save-slot metadata (not game state). */
export function estimatePlayTimeSeconds(state: GameStoreState): number {
  const visitedCount = state.playerState.visitedNodes.length;
  const level = state.playerState.progression.level;
  // Rough estimate: ~2 min per visited node + 10 min base per level
  return Math.max(0, visitedCount * 120 + (level - 1) * 600);
}

/** Defaults for fields that survive save/load. */
export function createDefaultPersistedState(): Pick<GameStoreState, PersistedStoreKey> {
  return {
    mode: 'exploration',
    ...BOOT_PHASE_FLAGS,
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
    activeTTLFlags: createEmptyActiveTTLFlagMap(),
    journalTab: 'notes',
    weatherEnabled: true,
    rainIntensity: 0.7,
    musicEnabled: true,
    musicVolume: 0.5,
    introSeen: false,
    showStoryOverlay: false,
    narrativeKind: null,
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
      goodKarmaStreak: 0,
      badKarmaStreak: 0,
    },
  };
}

/** Ephemeral session fields reset on new game (not written to save files). */
export function createDefaultSessionState(): Partial<GameStoreState> {
  return {
    lastSaveTimestamp: null,
    lastAutoSaveTimestamp: null,
    notifications: [],
    lastUsedPoemId: null,
    lastUsedPoemTimestamp: null,
    pendingPoemReadingId: null,
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

/** Meta flags that survive a new playthrough (achievements, completion markers). */
export const META_PLAYTHROUGH_FLAGS = ['game_completed'] as const;

export type MetaPlaythroughFlag = (typeof META_PLAYTHROUGH_FLAGS)[number];

export interface NewPlaythroughCarry {
  unlockedAchievements: GameStoreState['unlockedAchievements'];
  achievementProgress: GameStoreState['achievementProgress'];
  metaFlags: Partial<Record<MetaPlaythroughFlag, boolean>>;
}

export interface NewPlaythroughResetOptions {
  /** Keep unlocked achievements and meta completion flags (default true). */
  preserveAchievements?: boolean;
  /** Skip matrix intro — used when restarting from in-game story endings. */
  skipIntro?: boolean;
}

/** Snapshot meta-progress to carry into the next playthrough. */
export function captureNewPlaythroughCarry(
  state: GameStoreState,
  options: Pick<NewPlaythroughResetOptions, 'preserveAchievements'> = {},
): NewPlaythroughCarry | null {
  if (options.preserveAchievements === false) return null;

  const metaFlags: Partial<Record<MetaPlaythroughFlag, boolean>> = {};
  for (const flag of META_PLAYTHROUGH_FLAGS) {
    if (state.playerState.flags[flag]) {
      metaFlags[flag] = true;
    }
  }

  return {
    unlockedAchievements: state.unlockedAchievements,
    achievementProgress: state.achievementProgress,
    metaFlags,
  };
}

/** Build reset patch, optionally merging carried meta-progress. */
export function createNewPlaythroughResetPatch(
  carry: NewPlaythroughCarry | null,
  options: Pick<NewPlaythroughResetOptions, 'skipIntro'> = {},
): Partial<GameStoreState> {
  const patch = createDefaultResetState();

  if (carry) {
    patch.unlockedAchievements = carry.unlockedAchievements;
    patch.achievementProgress = carry.achievementProgress;
    if (Object.keys(carry.metaFlags).length > 0) {
      patch.playerState = {
        ...patch.playerState!,
        flags: { ...patch.playerState!.flags, ...carry.metaFlags },
      };
    }
  }

  if (options.skipIntro) {
    patch.introActive = false;
    patch.introSeen = true;
    patch.mainMenuOpen = false;
  }

  return patch;
}

/** Convert in-memory monotonic TTL expiries to epoch for localStorage. */
function activeTTLFlagsForSave(map: ActiveTTLFlagMap): ActiveTTLFlagMap {
  const out: ActiveTTLFlagMap = {};
  for (const flag of Object.values(map)) {
    out[flag.key] = {
      ...flag,
      expiryTimestamp: ttlExpiryToPersisted(flag.expiryTimestamp),
    };
  }
  return out;
}

/** Restore monotonic TTL expiries from persisted epoch on load. */
function activeTTLFlagsFromSave(map: ActiveTTLFlagMap): ActiveTTLFlagMap {
  const out: ActiveTTLFlagMap = {};
  for (const flag of Object.values(map)) {
    out[flag.key] = {
      ...flag,
      expiryTimestamp: ttlExpiryFromPersisted(flag.expiryTimestamp),
    };
  }
  return out;
}

/** Build the localStorage payload from live store state. */
export function pickSavePayload(
  state: GameStoreState,
): Omit<SavePayload, 'saveVersion'> {
  const payload: Record<string, unknown> = {};
  for (const key of getPersistedStateKeys()) {
    if (key === 'activeTTLFlags') {
      payload[key] = activeTTLFlagsForSave(state.activeTTLFlags ?? createEmptyActiveTTLFlagMap());
      continue;
    }
    payload[key] = state[key];
  }
  // Overlay close used to clear currentNodeId; schema requires non-empty string.
  const nodeId = state.currentNodeId?.trim();
  payload.currentNodeId = nodeId || 'start';
  payload.savedAt = Date.now();
  payload.playTimeSeconds = estimatePlayTimeSeconds(state);

  const result = PickSavePayloadSchema.safeParse(payload);
  if (!result.success) {
    const summary = result.error.issues
      .slice(0, 5)
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `${path}: ${issue.message}`;
      })
      .join('; ');
    throw new Error(`[pickSavePayload] Invalid save snapshot: ${summary}`);
  }

  return result.data;
}

/** Capture a validated save payload from live store state (no localStorage write). */
export function saveGameSnapshot(): Omit<SavePayload, 'saveVersion'> {
  return pickSavePayload(getCombinedGameState());
}

/** Merge validated save data over defaults for loadGame. */
export function storePatchFromSave(payload: SavePayload): Partial<GameStoreState> {
  const defaults = createDefaultPersistedState();
  const migratedFlags = { ...defaults.playerState.flags, ...payload.playerState.flags };
  // Pre-4262626 saves: poem_2 from wake/menu without read_poem_2 flag.
  if (payload.collectedPoems.includes('poem_2') && !migratedFlags.read_poem_2) {
    migratedFlags.read_poem_2 = true;
  }

  const patch: Partial<GameStoreState> = {
    lastSaveTimestamp: payload.savedAt,
    playerState: {
      ...defaults.playerState,
      ...payload.playerState,
      flags: migratedFlags,
      progression: {
        ...defaults.playerState.progression,
        ...payload.playerState.progression,
      },
      inventory: payload.playerState.inventory.map((item) => normalizeInventoryItem(item)),
      equippedItems: {
        head: payload.playerState.equippedItems.head
          ? normalizeInventoryItem(payload.playerState.equippedItems.head)
          : null,
        body: payload.playerState.equippedItems.body
          ? normalizeInventoryItem(payload.playerState.equippedItems.body)
          : null,
        accessory: payload.playerState.equippedItems.accessory
          ? normalizeInventoryItem(payload.playerState.equippedItems.accessory)
          : null,
      },
      visitedNodeTimestamps: payload.playerState.visitedNodeTimestamps ?? {},
      rngSeed: payload.playerState.rngSeed ?? defaults.playerState.rngSeed,
      combatEncounterSeq:
        payload.playerState.combatEncounterSeq ?? defaults.playerState.combatEncounterSeq,
    },
    exploration: {
      ...defaults.exploration,
      ...payload.exploration,
      currentSceneId: sanitizeExplorationSceneId(payload.exploration.currentSceneId),
      npcStates: parseNpcStatesFromSave(payload.exploration.npcStates),
    },
    activeTTLFlags: activeTTLFlagsFromSave(payload.activeTTLFlags),
    achievementProgress: {
      ...defaults.achievementProgress,
      ...payload.achievementProgress,
    },
  };

  for (const key of getPersistedStateKeys()) {
    if (
      key === 'playerState' ||
      key === 'exploration' ||
      key === 'achievementProgress' ||
      key === 'activeTTLFlags' ||
      key === 'mode' ||
      key === 'mainMenuOpen' ||
      key === 'introActive' ||
      key === 'combatActive'
    ) {
      continue;
    }
    (patch as Record<string, unknown>)[key] = payload[key];
  }

  const hasPhaseFlags =
    payload.mainMenuOpen !== undefined ||
    payload.introActive !== undefined ||
    payload.combatActive !== undefined;

  const legacyPhase = hasPhaseFlags
    ? {
        mainMenuOpen: payload.mainMenuOpen ?? false,
        introActive: payload.introActive ?? false,
        combatActive: payload.combatActive ?? false,
      }
    : phaseFlagsFromLegacyMode(payload.mode);

  patch.mode = 'exploration';
  patch.mainMenuOpen = legacyPhase.mainMenuOpen;
  patch.introActive = legacyPhase.introActive;
  patch.combatActive = legacyPhase.combatActive;

  // Closed-overlay explore hubs never restore with VN panel open.
  if (isClosedOverlayExploreHub(payload.currentNodeId)) {
    patch.showStoryOverlay = false;
    patch.narrativeKind = null;
  }

  // Session fields are not persisted — reset before applying save so stale UI/runtime
  // state from the previous play session cannot leak (patch wins on overlap, e.g. lastSaveTimestamp).
  return {
    ...createDefaultSessionState(),
    ...patch,
  };
}
