/* ─── Volodka RPG – exploration slice selectors ─── */

import type { ExplorationState } from '@/shared/types/game';
import { getGameStore } from '../gameStore';
import { useGameSelector, useGamePrimitive } from './hooks';

/* ─── Plain getters ─── */

export const selectExploration = (s = getGameStore()): ExplorationState => s.exploration;

export const selectCurrentSceneId = (s = getGameStore()) => s.exploration.currentSceneId;

export const selectTimeOfDay = (s = getGameStore()) => s.exploration.timeOfDay;

export const selectPlayerPosition = (s = getGameStore()) => s.exploration.playerPosition;

export const selectNpcStates = (s = getGameStore()) => s.exploration.npcStates;

export const selectDiscoveredScenes = (s = getGameStore()) => s.discoveredScenes;

/* ─── React hooks ─── */

export function useExploration(): ExplorationState {
  return useGameSelector((s) => s.exploration);
}

export function useCurrentSceneId() {
  return useGamePrimitive((s) => s.exploration.currentSceneId);
}

export function useTimeOfDay() {
  return useGamePrimitive((s) => s.exploration.timeOfDay);
}

export function usePlayerPosition() {
  return useGameSelector((s) => s.exploration.playerPosition);
}

export function usePlayerRotation() {
  return useGamePrimitive((s) => s.exploration.playerRotation);
}

export function useNpcStates() {
  return useGameSelector((s) => s.exploration.npcStates);
}

export function useDiscoveredScenes() {
  return useGameSelector((s) => s.discoveredScenes);
}

/** Weather fields — top-level store (persisted); scene/clock from exploration. */
export function useWeatherState() {
  return useGameSelector((s) => ({
    weatherEnabled: s.weatherEnabled,
    rainIntensity: s.rainIntensity,
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
  }));
}

/** Mini-map position bundle. */
export function useMiniMapState() {
  return useGameSelector((s) => ({
    currentSceneId: s.exploration.currentSceneId,
    playerPos: s.exploration.playerPosition,
    playerRotation: s.exploration.playerRotation,
    npcStates: s.exploration.npcStates,
  }));
}
