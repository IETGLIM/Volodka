/* ─── Volodka RPG – multi-slice composite selectors ─── */
/* Bundles fields from multiple slices into one shallow-stable subscription. */

import { useGameSelector } from './hooks';

/** FollowCamera: scene + mode + cutscene state. */
export function useFollowCameraState() {
  return useGameSelector((s) => ({
    sceneId: s.exploration.currentSceneId,
    gameMode: s.mode,
    activeCutsceneId: s.activeCutsceneId,
    cutsceneWaypoints: s.cutsceneWaypoints,
    currentNodeId: s.currentNodeId,
  }));
}

/** QuestWaypoints: quest navigation bundle. */
export function useQuestWaypointState() {
  return useGameSelector((s) => ({
    quests: s.quests,
    currentSceneId: s.exploration.currentSceneId,
    playerFlags: s.playerState.flags,
    playerKarma: s.playerState.karma,
  }));
}

/** SceneExitIndicator: exit gate checks. */
export function useSceneExitState() {
  return useGameSelector((s) => ({
    sceneId: s.exploration.currentSceneId,
    playerFlags: s.playerState.flags,
    playerKarma: s.playerState.karma,
  }));
}

/** ExplorationPostFX: scene + noir toggle. */
export function usePostFxSceneState() {
  return useGameSelector((s) => ({
    sceneId: s.exploration.currentSceneId,
    noirMode: s.noirMode,
  }));
}

/** NoirOverlay: noir atmosphere inputs. */
export function useNoirOverlayState() {
  return useGameSelector((s) => ({
    sceneId: s.exploration.currentSceneId,
    noirMode: s.noirMode,
    stress: s.playerState.stress,
  }));
}

/** Fast travel panel inputs. */
export function useFastTravelState() {
  return useGameSelector((s) => ({
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
    discoveredScenes: s.discoveredScenes,
    playerFlags: s.playerState.flags,
  }));
}

/** HUD exploration weather bundle. */
export function useHUDExploration() {
  return useGameSelector((s) => ({
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
    weatherEnabled: s.exploration.weatherEnabled,
    rainIntensity: s.exploration.rainIntensity,
  }));
}

/** HUD player vitals + progression summary. */
export function useHUDPlayerVitals() {
  return useGameSelector((s) => ({
    karma: s.playerState.karma,
    energy: s.playerState.energy,
    stress: s.playerState.stress,
    level: s.playerState.progression.level,
    xp: s.playerState.progression.xp,
    xpToNextLevel: s.playerState.progression.xpToNextLevel,
    unlockedPerks: s.playerState.progression.unlockedPerks,
  }));
}

/** GameOrchestrator + IntroAutoSkip overlay state. */
export function useOrchestratorOverlay() {
  return useGameSelector((s) => ({
    mode: s.mode,
    showStoryOverlay: s.showStoryOverlay,
    currentNodeId: s.currentNodeId,
    introSeen: s.introSeen,
  }));
}

/** InteractiveTriggers — scene + overlay blocking. */
export function useInteractionOverlay() {
  return useGameSelector((s) => ({
    sceneId: s.exploration.currentSceneId,
    gameMode: s.mode,
    showStoryOverlay: s.showStoryOverlay,
  }));
}

/** DialogueRenderer narrative context. */
export function useDialogueContext() {
  return useGameSelector((s) => ({
    mode: s.mode,
    showStoryOverlay: s.showStoryOverlay,
    currentNodeId: s.currentNodeId,
    playerState: s.playerState,
    npcRelations: s.npcRelations,
    timeOfDay: s.exploration.timeOfDay,
  }));
}

/** StoryRenderer narrative context. */
export function useStoryContext() {
  return useGameSelector((s) => ({
    showStoryOverlay: s.showStoryOverlay,
    mode: s.mode,
    currentNodeId: s.currentNodeId,
    playerState: s.playerState,
    currentAct: s.playerState.progression.currentAct,
  }));
}

/** StatusEffectsBar + PlayerStatsPanel weather context. */
export function useStatusEffectsContext() {
  return useGameSelector((s) => ({
    playerState: s.playerState,
    weatherEnabled: s.exploration.weatherEnabled,
    rainIntensity: s.exploration.rainIntensity,
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
  }));
}

/** useWeatherEffects hook inputs (top-level weather fields). */
export function useWeatherEffectsInput() {
  return useGameSelector((s) => ({
    weatherEnabled: s.weatherEnabled,
    rainIntensity: s.rainIntensity,
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
  }));
}

/** JournalPanel shell state. */
export function useJournalShell() {
  return useGameSelector((s) => ({
    journalOpen: s.journalOpen,
    journalTab: s.journalTab,
    loreEntries: s.loreEntries,
  }));
}

/** Alias for FollowCamera — prefer useFollowCameraState in new code. */
export const useCameraFollowState = useFollowCameraState;
