/* ─── Volodka RPG – HUD hot-path composite selectors ─── */

import { countCollectedMainPoems } from '@/data/poemCollectionMeta';
import { selectScheduleContext } from '@/shared/scheduleContext';
import { useGameSelector } from './hooks';
import { selectGamePhase } from './uiSelectors';
import type { GameStoreState } from '../types';

/* Этап 100 (волна 1): прежний широкий 12-полевой бандл HUD-состояния удалён —
 * потребители переведены на узкие подписки (useHUDExploration /
 * useVitalStats / useProgressionSummary / useScreenEffectsVitals или
 * собственные бандлы ниже). Контракт-тест hudSelectors.test.ts следит,
 * чтобы «широкий» бандл не вернулся. */

/** Ambient overlay tint inputs (plain selector — keep shallow-stable). */
export function selectAmbientOverlayState(s: GameStoreState) {
  return {
    timeOfDay: s.exploration.timeOfDay,
    currentSceneId: s.exploration.currentSceneId,
    stress: s.playerState.stress,
  };
}

/** HudAmbientOverlay — scene/time/stress tints only. */
export function useAmbientOverlayState() {
  return useGameSelector(selectAmbientOverlayState);
}

/** Ambient caption inputs (plain selector — keep shallow-stable). */
export function selectAtmosphereCaptionState(s: GameStoreState) {
  return {
    sceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
    showStoryOverlay: s.showStoryOverlay,
    currentNodeId: s.currentNodeId,
    diegeticNarrative: s.diegeticNarrative,
  };
}

/** AmbientAtmosphereCaption — one shallow subscription instead of five. */
export function useAtmosphereCaptionState() {
  return useGameSelector(selectAtmosphereCaptionState);
}

/** Stats dashboard inputs (plain selector — keep shallow-stable). */
export function selectStatsDashboardState(s: GameStoreState) {
  return {
    karma: s.playerState.karma,
    collectedPoems: s.collectedPoems,
    quests: s.quests,
    npcRelations: s.npcRelations,
    visitedNodes: s.playerState.visitedNodes,
    unlockedAchievements: s.unlockedAchievements,
  };
}

/** GameStatsDashboard — one shallow subscription instead of six. */
export function useStatsDashboardState() {
  return useGameSelector(selectStatsDashboardState);
}

/** WeatherIndicator — scene + clock. */
export function useWeatherIndicatorState() {
  return useGameSelector((s) => ({
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
  }));
}

/** WeatherAlertNotification — top-level weather fields (persisted). */
export { useWeatherState as useWeatherAlertState } from './explorationSelectors';

/** KarmaPoemInfoPanel — karma, act, poems, notifications, powers. */
export function useKarmaPoemInfoPanelState() {
  return useGameSelector((s) => ({
    karma: s.playerState.karma,
    collectedPoems: s.collectedPoems,
    notifications: s.notifications,
    poemPowers: s.poemPowers,
    skills: s.playerState.skills,
    flags: s.playerState.flags,
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

/* ─── Этап 100 (волна 2): бандлы хотбара и миникарты ─── */

/**
 * QuickUseBar + MobileActionButtons — общий бандл хотбара.
 * Оба виджета используют ровно один набор полей: фаза, инвентарь, слоты
 * хотбара и онбординг-гейт (уровень + основные стихи). Раньше это были
 * 6 отдельных подписок на виджет (×2 виджета). Все поля — примитивы
 * либо ссылки из стора, поэтому селектор shallow-стабилен.
 */
export function selectQuickUseHotbarState(s: GameStoreState) {
  return {
    mode: selectGamePhase(s),
    inventory: s.playerState.inventory,
    hotbarSlots: s.hotbarSlots,
    level: s.playerState.progression?.level ?? 1,
    mainPoemCount: countCollectedMainPoems(s.collectedPoems),
  };
}

/** QuickUseBar / MobileActionButtons — one shallow subscription instead of six. */
export function useQuickUseHotbarState() {
  return useGameSelector(selectQuickUseHotbarState);
}

/**
 * MinimapComponent — один shallow-бандл вместо четырёх подписок
 * (useGamePhase + useMiniMapState + useNpcRelations + useActiveQuests).
 * Возвращает СЫРОЙ список quests: фильтрация активных — в компоненте через
 * useMemo, потому что фильтр внутри plain-селектора нарушил бы контракт
 * ссылочной стабильности (контракт-тест hudSelectors.test.ts).
 */
export function selectMinimapHudState(s: GameStoreState) {
  return {
    mode: selectGamePhase(s),
    currentSceneId: s.exploration.currentSceneId,
    playerPos: s.exploration.playerPosition,
    npcStates: s.exploration.npcStates,
    npcRelations: s.npcRelations,
    quests: s.quests,
  };
}

/** MinimapComponent — one shallow subscription instead of four. */
export function useMinimapHudState() {
  return useGameSelector(selectMinimapHudState);
}
