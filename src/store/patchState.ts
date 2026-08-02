import type { GameStoreState } from './types';
import type { PlayerSlice } from './slices/playerSlice';
import type { ExplorationSlice } from './slices/explorationSlice';
import type { WorldSlice } from './slices/worldSlice';
import type { UISlice } from './slices/uiSlice';
import type { CutsceneSlice } from './slices/cutsceneSlice';
import type { SaveSlice } from './slices/saveSlice';
import type { DialogueHistorySlice } from './slices/dialogueHistorySlice';
import type { AchievementSlice } from './slices/achievementSlice';
import { usePlayerStore } from './stores/playerStore';
import { useExplorationStore } from './stores/explorationStore';
import { useWorldStore } from './stores/worldStore';
import { useUIStore } from './stores/uiStore';
import { useCutsceneStore } from './stores/cutsceneStore';
import { useSaveStore } from './stores/saveStore';
import { useDialogueHistoryStore } from './stores/dialogueHistoryStore';
import { useAchievementStore } from './stores/achievementStore';
const PLAYER_KEYS = new Set<keyof PlayerSlice>(['playerState','lastUsedPoemId','lastUsedPoemTimestamp','pendingPoemReadingId','notifications','activeTTLFlags','visitNode','addSkill','addKarma','addStress','addEnergy','setFlag','pushNotification','dismissNotification','restAtHome','autoRegenBetweenScenes','upsertActiveTTLFlag','upsertActiveTTLFlags','upsertHintFlagWithTTL','removeActiveTTLFlags','clearActiveTTLFlags','advanceAct','applyPlayerRewardBatch','addItem','removeItem','equipItem','unequipItem','addXp','addCredits','unlockSkillTreeNode','canUnlockSkill','acquirePerk','canAcquirePerk','getActivePerkEffects','craftItem','canCraft','buyItem','sellItem','canBuyItem','canSellItem','giftItemToNPC','completeQuestAndApplyRewards']);
const EXPLORATION_KEYS = new Set<keyof ExplorationSlice>(['exploration','weatherEnabled','rainIntensity','interactiveObjectStates','discoveredScenes','setExplorationScene','setPlayerPosition','setPlayerRotation','advanceTime','toggleWeather','setRainIntensity','toggleInteractiveObject','discoverScene','fastTravelTo','setExplorationTimeOfDay','setExplorationNPCStates']);
const WORLD_KEYS = new Set<keyof WorldSlice>(['quests','collectedPoems','npcRelations','poemPowers','unlockedAchievements','acceptedDailyMissions','lastDailyReset','npcAffinity','achievementProgress','activateQuest','retryQuest','completeQuestObjective','completeQuest','failQuest','setQuestHoursElapsed','collectPoem','setNpcRelation','activatePoemPower','getAvailablePowers','unlockAchievement','isAchievementUnlocked','getUnlockedAchievementIds','acceptDailyMission','abandonDailyMission','updateDailyMissionProgress','claimDailyMissionReward','checkDailyMissionResets','adjustNpcAffinity','getNpcAffinity','trackSceneVisit','trackNightHour','trackCombatVictory','resetConsecutiveVictories','trackMaxCombo','trackCriticalHit','trackPoemPowerInCombat','trackKarmaChoice','batchCheckAchievementProgress']);
const UI_KEYS = new Set<keyof UISlice>(['mode','mainMenuOpen','introActive','combatActive','currentNodeId','lastSaveTimestamp','lastAutoSaveTimestamp','showStoryOverlay','diegeticNarrative','narrativeKind','devToolsArmed','matrixRainEnabled','glitchIntensity','noirMode','tutorialFlags','musicVolume','musicEnabled','journalOpen','journalTab','loreEntries','conversationLog','thoughtHistory','notificationHistory','introSeen','hotbarSlots','inventorySortOption','inventoryFilterCategory','setMainMenuOpen','setIntroActive','setCombatActive','setCurrentNodeId','setShowStoryOverlay','openNarrativeOverlay','closeNarrativeOverlay','openDiegeticNarrative','closeDiegeticNarrative','setNarrativeKind','armDevTools','toggleMatrixRain','setGlitchIntensity','toggleNoirMode','setMusicVolume','toggleMusic','toggleJournal','setJournalTab','setJournalOpen','addLoreEntry','discoverLoreEntry','addConversationLog','addThought','addNotificationHistory','clearNotificationHistory','setIntroSeen','setHotbarSlot','setInventorySortOption','setInventoryFilterCategory']);
const CUTSCENE_KEYS = new Set<keyof CutsceneSlice>(['activeCutsceneId','cutsceneWaypoints','triggeredCutscenes','setCutscene','markCutsceneTriggered','isCutsceneTriggered']);
const SAVE_KEYS = new Set<keyof SaveSlice>(['resetGame','resetForNewPlaythrough','saveGame','loadGame']);
const DIALOGUE_HISTORY_KEYS = new Set<keyof DialogueHistorySlice>(['dialogueHistory','addDialogueEntry','clearDialogueHistory']);
const ACHIEVEMENT_KEYS = new Set<keyof AchievementSlice>(['trophyNotifications','trophyTracking','checkTrophies','dismissTrophyNotification','trackCraft','trackPoemPowerUse','trackHighStressWin']);
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
  const sp = pickPatch<SaveSlice>(patch, SAVE_KEYS); if (Object.keys(sp).length) useSaveStore.setState(sp);
  const dhp = pickPatch<DialogueHistorySlice>(patch, DIALOGUE_HISTORY_KEYS); if (Object.keys(dhp).length) useDialogueHistoryStore.setState(dhp);
  const ap = pickPatch<AchievementSlice>(patch, ACHIEVEMENT_KEYS); if (Object.keys(ap).length) useAchievementStore.setState(ap);
}
