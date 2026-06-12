/* ─── Volodka RPG – multi-slice composite selectors ─── */
/* Bundles fields from multiple slices into one shallow-stable subscription. */

import { useGameSelector } from './hooks';
import { getGamePhase } from '@/shared/gamePhase';
import type { GameStoreState } from '../types';

function phaseFromStore(s: GameStoreState) {
  return getGamePhase({
    mainMenuOpen: s.mainMenuOpen,
    introActive: s.introActive,
    combatActive: s.combatActive,
    activeCutsceneId: s.activeCutsceneId,
  });
}

/** FollowCamera: scene + phase + cutscene state. */
export function useFollowCameraState() {
  return useGameSelector((s) => ({
    sceneId: s.exploration.currentSceneId,
    gameMode: phaseFromStore(s),
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

/** Mode / menu shell — stable during narrative node churn. */
export function useOrchestratorShell() {
  return useGameSelector((s) => ({
    mode: phaseFromStore(s),
    introSeen: s.introSeen,
    mainMenuOpen: s.mainMenuOpen,
    devToolsArmed: s.devToolsArmed,
  }));
}

/** Story overlay flags — without currentNodeId (cutscene/recovery subscribe separately). */
export function useOrchestratorNarrativeOverlay() {
  return useGameSelector((s) => ({
    showStoryOverlay: s.showStoryOverlay,
    narrativeKind: s.narrativeKind,
  }));
}

/** GameOrchestrator + IntroAutoSkip overlay state. */
export function useOrchestratorOverlay() {
  return useGameSelector((s) => ({
    mode: phaseFromStore(s),
    showStoryOverlay: s.showStoryOverlay,
    currentNodeId: s.currentNodeId,
    introSeen: s.introSeen,
    mainMenuOpen: s.mainMenuOpen,
    narrativeKind: s.narrativeKind,
    devToolsArmed: s.devToolsArmed,
  }));
}

/** QuickAccessToolbar — vitals + progression + music toggle. */
export function useQuickAccessToolbarState() {
  return useGameSelector((s) => ({
    energy: s.playerState.energy,
    stress: s.playerState.stress,
    karma: s.playerState.karma,
    level: s.playerState.progression.level,
    xp: s.playerState.progression.xp,
    xpToNextLevel: s.playerState.progression.xpToNextLevel,
    musicEnabled: s.musicEnabled,
    toggleMusic: s.toggleMusic,
  }));
}

/** ScreenEffects — low energy / high stress thresholds. */
export function useScreenEffectsVitals() {
  return useGameSelector((s) => ({
    energy: s.playerState.energy,
    stress: s.playerState.stress,
  }));
}

/** InteractiveTriggers — scene + overlay blocking. */
export function useInteractionOverlay() {
  return useGameSelector((s) => ({
    sceneId: s.exploration.currentSceneId,
    gameMode: phaseFromStore(s),
    showStoryOverlay: s.showStoryOverlay,
    currentNodeId: s.currentNodeId,
  }));
}

/* NOTE: selectors below MUST stay flat (no nested object literals).
   A nested literal is a fresh reference on every getSnapshot() call, which
   defeats useShallow, makes the snapshot unstable, and sends React's
   useSyncExternalStore into an infinite re-render loop (React #185).
   Plain selector functions are exported for the snapshot-stability test. */

/** DialogueRenderer narrative context (plain selector — keep shallow-stable). */
export function selectDialogueContext(s: GameStoreState) {
  return {
    mode: phaseFromStore(s),
    showStoryOverlay: s.showStoryOverlay,
    currentNodeId: s.currentNodeId,
    karma: s.playerState.karma,
    skills: s.playerState.skills,
    flags: s.playerState.flags,
    progression: s.playerState.progression,
    npcRelations: s.npcRelations,
    timeOfDay: s.exploration.timeOfDay,
    collectedPoems: s.collectedPoems,
  };
}

/** DialogueRenderer narrative context. */
export function useDialogueContext() {
  return useGameSelector(selectDialogueContext);
}

/** StoryRenderer narrative context (plain selector — keep shallow-stable). */
export function selectStoryContext(s: GameStoreState) {
  return {
    showStoryOverlay: s.showStoryOverlay,
    mode: phaseFromStore(s),
    currentNodeId: s.currentNodeId,
    karma: s.playerState.karma,
    skills: s.playerState.skills,
    flags: s.playerState.flags,
    progression: s.playerState.progression,
    collectedPoems: s.collectedPoems,
  };
}

/** StoryRenderer narrative context. */
export function useStoryContext() {
  return useGameSelector(selectStoryContext);
}

/** StatusEffectsBar + PlayerStatsPanel weather context. */
export function useStatusEffectsContext() {
  return useGameSelector((s) => ({
    karma: s.playerState.karma,
    energy: s.playerState.energy,
    stress: s.playerState.stress,
    unlockedPerks: s.playerState.progression.unlockedPerks,
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

/** MenuScreen — primary actions + music toggle. */
export function useMenuScreenActions() {
  return useGameSelector((s) => ({
    setMainMenuOpen: s.setMainMenuOpen,
    setIntroActive: s.setIntroActive,
    loadGame: s.loadGame,
    resetGame: s.resetGame,
    musicEnabled: s.musicEnabled,
    toggleMusic: s.toggleMusic,
  }));
}

/** MenuScreen — matrix rain / noir visual toggles. */
export function useMenuVisualToggles() {
  return useGameSelector((s) => ({
    matrixRainEnabled: s.matrixRainEnabled,
    toggleMatrixRain: s.toggleMatrixRain,
    noirMode: s.noirMode,
    toggleNoirMode: s.toggleNoirMode,
  }));
}

/** DevPanel scene tab — exploration snapshot. */
export function useDevPanelSceneTab() {
  return useGameSelector((s) => ({
    sceneId: s.exploration.currentSceneId,
    playerPos: s.exploration.playerPosition,
    playerRot: s.exploration.playerRotation,
    mode: phaseFromStore(s),
    storedMode: s.mode,
    timeOfDay: s.exploration.timeOfDay,
    npcStates: s.exploration.npcStates,
  }));
}

/** DevPanel state tab — player + quest snapshot. */
export function useDevPanelStateTab() {
  return useGameSelector((s) => ({
    karma: s.playerState.karma,
    stress: s.playerState.stress,
    energy: s.playerState.energy,
    mode: phaseFromStore(s),
    storedMode: s.mode,
    quests: s.quests,
    collectedPoems: s.collectedPoems,
    flags: s.playerState.flags,
    inventory: s.playerState.inventory,
    progression: s.playerState.progression,
    skills: s.playerState.skills,
  }));
}

/** PlayerStatsPanel — vitals, progression, skills, weather. */
export function usePlayerStatsPanelState() {
  return useGameSelector((s) => ({
    karma: s.playerState.karma,
    energy: s.playerState.energy,
    stress: s.playerState.stress,
    level: s.playerState.progression.level,
    xp: s.playerState.progression.xp,
    xpToNextLevel: s.playerState.progression.xpToNextLevel,
    skillPoints: s.playerState.progression.skillPoints,
    perkPoints: s.playerState.progression.perkPoints,
    unlockedPerks: s.playerState.progression.unlockedPerks,
    skills: s.playerState.skills,
    weatherEnabled: s.exploration.weatherEnabled,
    rainIntensity: s.exploration.rainIntensity,
    currentSceneId: s.exploration.currentSceneId,
    timeOfDay: s.exploration.timeOfDay,
  }));
}

/** TradingPanel — economy + trade actions. */
export function useTradingPanelState() {
  return useGameSelector((s) => ({
    credits: s.playerState.credits,
    inventory: s.playerState.inventory,
    npcRelations: s.npcRelations,
    buyItem: s.buyItem,
    sellItem: s.sellItem,
    canBuyItem: s.canBuyItem,
    canSellItem: s.canSellItem,
  }));
}
