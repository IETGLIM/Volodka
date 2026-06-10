/* ─── Volodka RPG – HUD hot-path composite selectors ─── */

import { selectScheduleContext } from '@/shared/scheduleContext';
import { useGameSelector } from './hooks';
import type { GameStoreState } from '../types';

/** useHUDController — single shallow subscription for exploration + vitals + poems. */
export function useHUDControllerState() {
  return useGameSelector((s) => ({
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
    weatherEnabled: s.exploration.weatherEnabled,
    rainIntensity: s.exploration.rainIntensity,
    karma: s.playerState.karma,
    energy: s.playerState.energy,
    stress: s.playerState.stress,
    level: s.playerState.progression.level,
    xp: s.playerState.progression.xp,
    xpToNextLevel: s.playerState.progression.xpToNextLevel,
    unlockedPerks: s.playerState.progression.unlockedPerks,
    collectedPoems: s.collectedPoems,
  }));
}

/** WeatherIndicator — scene + clock. */
export function useWeatherIndicatorState() {
  return useGameSelector((s) => ({
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
  }));
}

/** WeatherAlertNotification — tracks exploration weather fields. */
export { useWeatherState as useWeatherAlertState } from './explorationSelectors';

/** KarmaPoemInfoPanel — karma, act, poems, notifications, powers. */
export function useKarmaPoemInfoPanelState() {
  return useGameSelector((s) => ({
    karma: s.playerState.karma,
    collectedPoems: s.collectedPoems,
    notifications: s.notifications,
    poemPowers: s.poemPowers,
  }));
}

/** AutoSaveIndicator — save timestamps in one subscription. */
export function useAutoSaveTimestamps() {
  return useGameSelector((s) => ({
    lastSaveTimestamp: s.lastSaveTimestamp,
    lastAutoSaveTimestamp: s.lastAutoSaveTimestamp,
  }));
}

/** NPC schedule context — shallow-stable via module cache in selectScheduleContext. */
export function useScheduleContext() {
  return useGameSelector(selectScheduleContext);
}

/** MatrixRain overlay — story block + scene. */
export function useMatrixRainOverlayState() {
  return useGameSelector((s: GameStoreState) => ({
    showStoryOverlay: s.showStoryOverlay,
    sceneId: s.exploration.currentSceneId,
  }));
}
