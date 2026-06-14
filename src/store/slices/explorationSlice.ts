/* ─── Volodka RPG – Exploration Slice ─── */
/* Scene navigation, player position, time of day, weather,
 * rain intensity, interactive object states, and fast travel. */

import type { StateCreator } from 'zustand';
import type { ExplorationState, SceneId } from '@/shared/types/game';
import { sanitizeExplorationSceneId, SCENE_CONFIG } from '@/config/scenes';
import { clamp, createDefaultExploration } from '../shared';
import type { GameStoreState } from '../types';
import { getCombinedGameState } from '../storeBindings';
import { readExplorationFromPlayer } from '../crossSliceReads';
import { emitSoundPlay, scheduleWorldHourChanged } from '../storeEffects';
import { buildNPCStatesForTime } from '@/shared/schedule/ScheduleEngine';
import { requestSceneTransitionFromStore } from '../storeEngineHost';
import { buildScheduleContext } from '@/shared/scheduleContext';
import { isSceneGateOpen } from '@/shared/sceneGates';
import {
  clearAutoCloseTimer,
  clearAutoCloseTimers,
  deleteAutoCloseTimer,
  getAutoCloseGeneration,
  isAutoCloseSchedulingSuspended,
  trackAutoCloseTimer,
} from '@/shared/explorationAutoCloseTimers';

export { clearAutoCloseTimers } from '@/shared/explorationAutoCloseTimers';

/* ─── Travel time cost per scene (hours) — based on distance from city center ─── */
const TRAVEL_TIME: Partial<Record<SceneId, number>> = {
  volodka_room: 0,
  volodka_corridor: 0,
  home_evening: 0,
  zarema_albert_room: 0,
  solnysh_room: 0,
  street_night: 0.5,
  street_winter: 0.5,
  cafe_evening: 0.5,
  office_day: 0.5,
  park_day: 0.75,
  chk_forest_zorge: 1.0,
  library_day: 0.75,
  rooftop_edge: 1.0,
  river_pier: 1.0,
  factory_basement: 1.0,
  abandoned_factory: 1.0,
  battle: 0,
  sleep_dream: 0,
};

/* ─── Slice types ─── */

export interface ExplorationSliceState {
  exploration: ExplorationState;
  weatherEnabled: boolean;
  rainIntensity: number;
  interactiveObjectStates: Record<string, boolean>;
  /** Scene IDs the player has visited at least once (for fast travel discovery) */
  discoveredScenes: string[];
}

export interface ExplorationSliceActions {
  setExplorationScene: (sceneId: SceneId) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPlayerRotation: (rot: number) => void;
  advanceTime: (hours: number) => void;
  toggleWeather: () => void;
  setRainIntensity: (intensity: number) => void;
  toggleInteractiveObject: (id: string) => void;
  /** Mark a scene as discovered (called when player enters a scene) */
  discoverScene: (sceneId: SceneId) => void;
  /** Fast travel to a discovered scene. Checks discovery + flag gates. Advances time. */
  fastTravelTo: (sceneId: SceneId) => void;
  /** Set time of day directly (used by WorldClock) */
  setExplorationTimeOfDay: (hour: number) => void;
  /** Set NPC states directly (used by WorldClock) */
  setExplorationNPCStates: (npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>) => void;
}

export type ExplorationSlice = ExplorationSliceState & ExplorationSliceActions;

/* ─── Slice creator ─── */

export const createExplorationSlice: StateCreator<
  GameStoreState,
  [],
  [],
  ExplorationSlice
> = (set, get) => ({
  /* ── Initial state ── */
  exploration: createDefaultExploration(),
  weatherEnabled: true,
  rainIntensity: 0.7,
  interactiveObjectStates: {},
  discoveredScenes: ['volodka_room'], // Starting scene is pre-discovered

  /* ── Actions ── */

  setExplorationScene: (sceneId) =>
    set((state) => ({
      exploration: {
        ...state.exploration,
        currentSceneId: sanitizeExplorationSceneId(sceneId),
      },
    })),

  setPlayerPosition: (pos) =>
    set((state) => ({
      exploration: { ...state.exploration, playerPosition: pos },
    })),

  setPlayerRotation: (rot) =>
    set((state) => ({
      exploration: { ...state.exploration, playerRotation: rot },
    })),

  advanceTime: (hours) => {
    const previousHour = get().exploration.timeOfDay;
    let newTime = (previousHour + hours) % 24;
    if (newTime < 0) {
      newTime += 24;
    }

    const scheduleCtx = buildScheduleContext(getCombinedGameState());
    const npcStates = buildNPCStatesForTime(newTime, scheduleCtx);

    set((state) => ({
      exploration: {
        ...state.exploration,
        timeOfDay: newTime,
        npcStates,
      },
    }));

    scheduleWorldHourChanged({ hour: newTime, previousHour, npcStates });
  },

  toggleWeather: () => set((state) => ({ weatherEnabled: !state.weatherEnabled })),

  setRainIntensity: (intensity) =>
    set({ rainIntensity: clamp(intensity, 0, 1) }),

  toggleInteractiveObject: (id) => {
    const currentState = get().interactiveObjectStates[id] ?? false;
    const newState = !currentState;

    // Cancel any pending auto-close timer for this object
    const existingTimer = clearAutoCloseTimer(id);
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
    }

    set((state) => ({
      interactiveObjectStates: {
        ...state.interactiveObjectStates,
        [id]: newState,
      },
    }));

    if (id.includes('door') || id.includes('wardrobe')) {
      emitSoundPlay(newState ? 'door_open' : 'door_close');
    }

    // Auto-close after 5 seconds if opening
    if (newState && !isAutoCloseSchedulingSuspended()) {
      const capturedGeneration = getAutoCloseGeneration();
      const timer = setTimeout(() => {
        deleteAutoCloseTimer(id);
        if (capturedGeneration !== getAutoCloseGeneration()) return;
        const checkState = get().interactiveObjectStates[id];
        if (checkState) {
          set((state) => ({
            interactiveObjectStates: {
              ...state.interactiveObjectStates,
              [id]: false,
            },
          }));
          if (id.includes('door') || id.includes('wardrobe')) {
            emitSoundPlay('door_close');
          }
        }
      }, 5000);
      trackAutoCloseTimer(id, timer, capturedGeneration);
    }
  },

  discoverScene: (sceneId) =>
    set((state) => {
      if (state.discoveredScenes.includes(sceneId)) return state;
      return {
        discoveredScenes: [...state.discoveredScenes, sceneId],
      };
    }),

  fastTravelTo: (sceneId) => {
    const state = get();
    const currentSceneId = state.exploration.currentSceneId;

    // Can't travel to current scene
    if (sceneId === currentSceneId) return;

    // Must be discovered
    if (!state.discoveredScenes.includes(sceneId)) return;

    // Check story flag gate
    const { flags } = readExplorationFromPlayer();
    if (!isSceneGateOpen(sceneId, flags)) return;

    // Get target scene config for spawn point
    const targetConfig = SCENE_CONFIG[sceneId];
    if (!targetConfig) return;

    // Calculate travel time
    const travelHours = TRAVEL_TIME[sceneId] ?? 0.5;

    set((state) => ({
      exploration: {
        ...state.exploration,
        timeOfDay: ((state.exploration.timeOfDay + travelHours) % 24 + 24) % 24,
      },
    }));

    requestSceneTransitionFromStore(sceneId, [...targetConfig.spawnPoint] as [number, number, number]);
  },

  setExplorationTimeOfDay: (hour) =>
    set((state) => ({
      exploration: { ...state.exploration, timeOfDay: ((hour % 24) + 24) % 24 },
    })),

  setExplorationNPCStates: (npcStates) =>
    set((state) => ({
      exploration: { ...state.exploration, npcStates },
    })),
});
