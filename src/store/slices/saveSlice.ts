/* ─── Volodka RPG – Save Slice ─── */
/* Save/load/reset game state. This slice has cross-cutting access
 * to the full store state for building save payloads and restoring
 * data across all slices. */

import type { StateCreator } from 'zustand';
import { sanitizeExplorationSceneId } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { validateSaveData, SAVE_VERSION } from '@/shared/validation/saveSchema';
import {
  createDefaultPlayerState,
  createDefaultExploration,
  createDefaultTutorialFlags,
  pushNotification,
  type GameNotification,
} from '../shared';
import { resetAllPoemEffects } from '@/engine/PoemPowerSystem';

/* ─── localStorage key ─── */
const SAVE_KEY = 'volodka_save';

/* ─── Full store state needed for save/load ─── */
/**
 * This interface represents the minimum full-store shape that the
 * save slice needs to read from and write to. In the composed store,
 * all slice states are merged, so save/load can access everything.
 */
interface FullStoreForSave {
  /* Read fields for save payload */
  mode: string;
  currentNodeId: string;
  playerState: ReturnType<typeof createDefaultPlayerState>;
  exploration: ReturnType<typeof createDefaultExploration>;
  quests: unknown[];
  collectedPoems: string[];
  npcRelations: unknown[];
  tutorialFlags: ReturnType<typeof createDefaultTutorialFlags>;
  interactiveObjectStates: Record<string, boolean>;
  loreEntries: unknown[];
  conversationLog: Record<string, unknown[]>;
  poemPowers: Record<string, { lastUsed: number; cooldownMs: number }>;
  activeTTLFlags: Array<{ key: string; poemId: string; expiryTimestamp: number }>;
  showStoryOverlay: boolean;
  journalTab: string;
  weatherEnabled: boolean;
  rainIntensity: number;
  musicEnabled: boolean;
  musicVolume: number;
  lastSaveTimestamp: number | null;
  lastAutoSaveTimestamp: number | null;
  notifications: GameNotification[];
  introSeen: boolean;
  unlockedAchievements: Array<{ id: string; unlockedAt: number }>;
  discoveredScenes: string[];
  triggeredCutscenes: string[];
  npcAffinity: Record<string, number>;
  acceptedDailyMissions: unknown[];
  lastDailyReset: number;
  achievementProgress: {
    visitedScenes: string[];
    combatVictories: number;
    consecutiveVictories: number;
    maxComboAchieved: number;
    hasCriticalHit: boolean;
    defeatedEnemyTypes: string[];
    nightTimeHours: number;
    poemPowerUsedInCombat: boolean;
  };
}

/* ─── Slice types ─── */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SaveSliceState {
  // lastSaveTimestamp lives in UISlice, not here — but save actions need it
}

export interface SaveSliceActions {
  resetGame: () => void;
  saveGame: (options?: { source?: 'auto' | 'manual' }) => void;
  loadGame: () => void;
}

export type SaveSlice = SaveSliceState & SaveSliceActions;

/* ─── Slice creator ─── */

export const createSaveSlice: StateCreator<
  FullStoreForSave,
  [],
  [],
  SaveSlice
> = (set, get) => ({
  /* ── No additional state — lastSaveTimestamp is in UISlice ── */

  resetGame: () => {
    // Clear module-scoped poem effects (activeEffects array + TTL flags)
    resetAllPoemEffects();

    set({
      mode: 'menu',
      currentNodeId: 'start',
      playerState: createDefaultPlayerState(),
      exploration: createDefaultExploration(),
      quests: [],
      collectedPoems: [],
      npcRelations: [],
      tutorialFlags: createDefaultTutorialFlags(),
      lastSaveTimestamp: null,
      lastAutoSaveTimestamp: null,
      showStoryOverlay: false,
      matrixRainEnabled: true,
      glitchIntensity: 0,
      noirMode: false,
      poemPowers: {},
      notifications: [],
      activeTTLFlags: [],
      activeCutsceneId: null,
      cutsceneWaypoints: [],
      weatherEnabled: true,
      rainIntensity: 0.7,
      musicVolume: 0.5,
      musicEnabled: true,
      interactiveObjectStates: {},
      discoveredScenes: ['volodka_room'],
      triggeredCutscenes: [],
      npcAffinity: {},
      acceptedDailyMissions: [],
      lastDailyReset: 0,
      journalOpen: false,
      journalTab: 'notes',
      loreEntries: [],
      conversationLog: {},
      introSeen: false,
      unlockedAchievements: [],
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
    } as unknown as Partial<FullStoreForSave>);
  },

  saveGame: (options) => {
    const state = get();
    const source = options?.source ?? 'manual';

    // Build compact save payload from full store state
    const payload = {
      mode: state.mode,
      currentNodeId: state.currentNodeId,
      playerState: state.playerState,
      exploration: state.exploration,
      quests: state.quests,
      collectedPoems: state.collectedPoems,
      npcRelations: state.npcRelations,
      tutorialFlags: state.tutorialFlags,
      interactiveObjectStates: state.interactiveObjectStates,
      loreEntries: state.loreEntries,
      conversationLog: state.conversationLog,
      poemPowers: state.poemPowers,
      activeTTLFlags: state.activeTTLFlags,
      journalTab: state.journalTab,
      weatherEnabled: state.weatherEnabled,
      rainIntensity: state.rainIntensity,
      musicEnabled: state.musicEnabled,
      musicVolume: state.musicVolume,
      introSeen: state.introSeen,
      unlockedAchievements: state.unlockedAchievements,
      discoveredScenes: state.discoveredScenes,
      triggeredCutscenes: state.triggeredCutscenes ?? [],
      npcAffinity: state.npcAffinity ?? {},
      showStoryOverlay: state.showStoryOverlay ?? false,
      acceptedDailyMissions: state.acceptedDailyMissions ?? [],
      lastDailyReset: state.lastDailyReset ?? 0,
      achievementProgress: state.achievementProgress,
      savedAt: Date.now(),
    };

    try {
      const payloadWithVersion = { ...payload, saveVersion: SAVE_VERSION };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payloadWithVersion));
      const timestamp = Date.now();

      set({
        lastSaveTimestamp: timestamp,
        ...(source === 'auto' ? { lastAutoSaveTimestamp: timestamp } : {}),
      });

      eventBus.emit('game:saved', { timestamp, source });
    } catch {
      // localStorage might be full or unavailable
      console.error('[saveGame] Failed to write save to localStorage');
      // Notify the user instead of silently failing
      set({
        notifications: pushNotification(
          get().notifications,
          'quest',
          'Ошибка сохранения',
        ),
      });
    }
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;

      // Validate save data with Zod schema
      const validation = validateSaveData(raw);

      if (!validation.success) {
        // Save is corrupted — notify the user explicitly
        console.error('[loadGame] Save validation failed:', validation.error);

        set({
          notifications: pushNotification(
            get().notifications,
            'quest',
            validation.error,
          ),
        });

        return;
      }

      const payload = validation.data;

      // Sanitize the loaded scene ID (extra safety layer)
      const sanitizedSceneId = sanitizeExplorationSceneId(payload.exploration.currentSceneId);

      set({
        mode: payload.mode,
        currentNodeId: payload.currentNodeId,
        playerState: {
          ...payload.playerState,
          // Migration: ensure credits field exists for old saves
          credits: payload.playerState.credits ?? 100,
        },
        exploration: {
          ...payload.exploration,
          currentSceneId: sanitizedSceneId,
        },
        quests: payload.quests,
        collectedPoems: payload.collectedPoems,
        npcRelations: payload.npcRelations,
        tutorialFlags: payload.tutorialFlags,
        interactiveObjectStates: payload.interactiveObjectStates,
        loreEntries: payload.loreEntries,
        conversationLog: payload.conversationLog,
        poemPowers: payload.poemPowers,
        activeTTLFlags: payload.activeTTLFlags,
        journalTab: payload.journalTab,
        weatherEnabled: payload.weatherEnabled,
        rainIntensity: payload.rainIntensity,
        musicEnabled: payload.musicEnabled,
        musicVolume: payload.musicVolume,
        lastSaveTimestamp: payload.savedAt,
        introSeen: payload.introSeen,
        unlockedAchievements: payload.unlockedAchievements,
        discoveredScenes: payload.discoveredScenes,
        triggeredCutscenes: payload.triggeredCutscenes ?? [],
        npcAffinity: payload.npcAffinity ?? {},
        showStoryOverlay: payload.showStoryOverlay ?? false,
        acceptedDailyMissions: payload.acceptedDailyMissions ?? [],
        lastDailyReset: payload.lastDailyReset ?? 0,
        achievementProgress: payload.achievementProgress,
      } as unknown as Partial<FullStoreForSave>);

      eventBus.emit('game:loaded', {} as Record<string, never>);
    } catch (err) {
      // Unexpected runtime error — also notify
      console.error('[loadGame] Unexpected error:', err);

      set({
        notifications: pushNotification(
          get().notifications,
          'quest',
          'Ошибка загрузки',
        ),
      });
    }
  },
});
