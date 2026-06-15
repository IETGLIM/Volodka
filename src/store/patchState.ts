import type { GameStoreState } from './types';
import type { PlayerSlice } from './slices/playerSlice';
import type { ExplorationSlice } from './slices/explorationSlice';
import type { WorldSlice } from './slices/worldSlice';
import type { UISlice } from './slices/uiSlice';
import type { CutsceneSlice } from './slices/cutsceneSlice';
import { usePlayerStore } from './stores/playerStore';
import { useExplorationStore } from './stores/explorationStore';
import { useWorldStore } from './stores/worldStore';
import { useUIStore } from './stores/uiStore';
import { useCutsceneStore } from './stores/cutsceneStore';
const PLAYER_KEYS = new Set<keyof PlayerSlice>(['playerState','notifications','activeTTLFlags','visitNode','addSkill','addKarma','addStress','addEnergy','setFlag','pushNotification','dismissNotification','restAtHome','autoRegenBetweenScenes','upsertActiveTTLFlag','upsertActiveTTLFlags','removeActiveTTLFlags','clearActiveTTLFlags','advanceAct','applyPlayerRewardBatch','addItem','removeItem','equipItem','unequipItem','addXp','addCredits','unlockSkillTreeNode','canUnlockSkill','acquirePerk','canAcquirePerk','getActivePerkEffects','craftItem','canCraft','buyItem','sellItem','canBuyItem','canSellItem','giftItemToNPC','completeQuestAndApplyRewards']);
const EXPLORATION_KEYS = new Set<keyof ExplorationSlice>(['exploration','weatherEnabled','rainIntensity','interactiveObjectStates','discoveredScenes','setExplorationScene','setPlayerPosition','setPlayerRotation','advanceTime','toggleWeather','setRainIntensity','toggleInteractiveObject','discoverScene','fastTravelTo','setExplorationTimeOfDay','setExplorationNPCStates']);
const WORLD_KEYS = new Set<keyof WorldSlice>(['quests','collectedPoems','npcRelations','poemPowers','unlockedAchievements','acceptedDailyMissions','lastDailyReset','npcAffinity','achievementProgress','activateQuest','completeQuestObjective','completeQuest','failQuest','collectPoem','setNpcRelation','activatePoemPower','getAvailablePowers','unlockAchievement','isAchievementUnlocked','getUnlockedAchievementIds','acceptDailyMission','abandonDailyMission','updateDailyMissionProgress','claimDailyMissionReward','checkDailyMissionResets','adjustNpcAffinity','getNpcAffinity','trackSceneVisit','trackNightHour','trackCombatVictory','resetConsecutiveVictories','trackMaxCombo','trackCriticalHit','trackPoemPowerInCombat','trackKarmaChoice','batchCheckAchievementProgress']);
const UI_KEYS = new Set<keyof UISlice>(['mode','mainMenuOpen','introActive','combatActive','currentNodeId','lastSaveTimestamp','lastAutoSaveTimestamp','showStoryOverlay','narrativeKind','devToolsArmed','matrixRainEnabled','glitchIntensity','noirMode','tutorialFlags','musicVolume','musicEnabled','journalOpen','journalTab','loreEntries','conversationLog','introSeen','setMainMenuOpen','setIntroActive','setCombatActive','setCurrentNodeId','setShowStoryOverlay','openNarrativeOverlay','closeNarrativeOverlay','setNarrativeKind','armDevTools','toggleMatrixRain','setGlitchIntensity','toggleNoirMode','setMusicVolume','toggleMusic','toggleJournal','setJournalTab','setJournalOpen','addLoreEntry','discoverLoreEntry','addConversationLog','setIntroSeen']);
const CUTSCENE_KEYS = new Set<keyof CutsceneSlice>(['activeCutsceneId','cutsceneWaypoints','triggeredCutscenes','setCutscene','markCutsceneTriggered','isCutsceneTriggered']);
function pickPatch<T extends object>(patch: Partial<GameStoreState>, keys: Set<keyof T>): Partial<T> {
  const slicePatch: Partial<T> = {};
  for (const key of keys) if (key in patch) (slicePatch as Record<string, unknown>)[key as string] = patch[key as keyof GameStoreState];
  return slicePatch;
}
export function applyCombinedPatch(patch: Partial<GameStoreState>): void {
  const pp = pickPatch<PlayerSlice>(patch, PLAYER_KEYS); if (Object.keys(pp).length) usePlayerStore.setState(pp);
  const ep = pickPatch<ExplorationSlice>(patch, EXPLORATION_KEYS); if (Object.keys(ep).length) useExplorationStore.setState(ep);
  const wp = pickPatch<WorldSlice>(patch, WORLD_KEYS); if (Object.keys(wp).length) useWorldStore.setState(wp);
  const up = pickPatch<UISlice>(patch, UI_KEYS); if (Object.keys(up).length) useUIStore.setState(up);
  const cp = pickPatch<CutsceneSlice>(patch, CUTSCENE_KEYS); if (Object.keys(cp).length) useCutsceneStore.setState(cp);
}
