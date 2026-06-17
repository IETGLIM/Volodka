import { emitPoemResetAllEffects } from './storeEffects';
import type { GameAction } from '@/shared/gameBridge/gameActionBridge';
import type { GameStoreState } from './types';
import type { ActiveTTLFlag } from './activeTTLFlags';
import { getPlayerStoreState } from './stores/playerStore';
import { getExplorationStoreState } from './stores/explorationStore';
import { getWorldStoreState } from './stores/worldStore';
import { getUIStoreState } from './stores/uiStore';
import { getCutsceneStoreState } from './stores/cutsceneStore';
import { getSaveStoreState } from './stores/saveStore';
export function applyGameAction(_state: GameStoreState, action: GameAction): Partial<GameStoreState> {
  const player = getPlayerStoreState();
  const exploration = getExplorationStoreState();
  const world = getWorldStoreState();
  const ui = getUIStoreState();
  switch (action.type) {
    case 'quest/completeObjective': world.completeQuestObjective(action.questId, action.objectiveId); break;
    case 'quest/complete':
    case 'quest/completeAndApplyRewards':
      player.completeQuestAndApplyRewards(action.questId);
      break;
    case 'quest/fail': world.failQuest(action.questId, action.reason); break;
    case 'quest/retry': world.retryQuest(action.questId); break;
    case 'game/newGamePlus':
      getSaveStoreState().resetForNewPlaythrough({ preserveAchievements: true });
      break;
    case 'quest/activate': world.activateQuest(action.questId); break;
    case 'quest/setHoursElapsed': world.setQuestHoursElapsed(action.questId, action.hoursElapsed); break;
    case 'quest/syncWallClockAnchors': world.syncActiveQuestWallClocks(); break;
    case 'player/addSkill': player.addSkill(action.skill, action.amount); break;
    case 'player/addEnergy': player.addEnergy(action.amount); break;
    case 'player/addStress': player.addStress(action.amount); break;
    case 'player/addKarma': player.addKarma(action.amount); break;
    case 'player/addXp': player.addXp(action.amount); break;
    case 'player/addCredits': player.addCredits(action.amount); break;
    case 'player/setFlag': player.setFlag(action.key, action.value); break;
    case 'player/setRngSeed': player.setRngSeed(action.seed); break;
    case 'player/bumpCombatEncounterSeq': player.bumpCombatEncounterSeq(); break;
    case 'player/setNpcRelation': world.setNpcRelation(action.npcId, action.delta); break;
    case 'poem/upsertTTLFlag': player.upsertActiveTTLFlag(action.flag); break;
    case 'poem/upsertTTLFlags': player.upsertActiveTTLFlags(action.flags); break;
    case 'poem/removeTTLFlags': player.removeActiveTTLFlags(action.keys); break;
    case 'poem/recordLastUsed': player.recordLastUsedPoem(action.poemId, action.timestamp); break;
    case 'poem/setPendingReading': player.setPendingPoemReadingId(action.poemId); break;
    case 'poem/clearAllEffects': { const flags = player.activeTTLFlags ?? {}; for (const f of Object.values(flags) as ActiveTTLFlag[]) player.setFlag(f.key, false); player.clearActiveTTLFlags(); emitPoemResetAllEffects(); break; }
    case 'story/setCombatActive': ui.setCombatActive(action.active); break;
    case 'story/setIntroActive': ui.setIntroActive(action.active); break;
    case 'story/setMainMenuOpen': ui.setMainMenuOpen(action.open); break;
    case 'story/setCurrentNodeId': if (action.nodeId != null) ui.setCurrentNodeId(action.nodeId); break;
    case 'story/setShowStoryOverlay': ui.setShowStoryOverlay(action.show); break;
    case 'story/openNarrativeOverlay': ui.openNarrativeOverlay(action.nodeId, action.kind ?? ui.narrativeKind ?? 'story'); break;
    case 'story/closeNarrativeOverlay': ui.closeNarrativeOverlay(); break;
    case 'story/openDiegeticNarrative': ui.openDiegeticNarrative(action.nodeId, action.kind ?? ui.narrativeKind ?? 'story'); break;
    case 'story/closeDiegeticNarrative': ui.closeDiegeticNarrative(); break;
    case 'story/visitNode': player.visitNode(action.nodeId); break;
    case 'story/advanceAct': player.advanceAct(); break;
    case 'inventory/addItem': player.addItem(action.item); break;
    case 'inventory/removeItem': player.removeItem(action.itemId, action.quantity ?? 1); break;
    case 'world/collectPoem': world.collectPoem(action.poemId); break;
    case 'world/upsertHintFlag': player.upsertHintFlagWithTTL(action.flag); break;
    case 'lore/discover': ui.discoverLoreEntry(action.entryId); break;
    case 'achievement/unlock': world.unlockAchievement(action.achievementId); break;
    case 'achievement/trackSceneVisit': world.trackSceneVisit(action.sceneId); break;
    case 'achievement/trackNightHour': world.trackNightHour(); break;
    case 'achievement/trackCombatVictory': world.trackCombatVictory(action.enemyType, action.combo); break;
    case 'achievement/resetConsecutiveVictories': world.resetConsecutiveVictories(); break;
    case 'achievement/trackMaxCombo': world.trackMaxCombo(action.comboCount); break;
    case 'achievement/trackCriticalHit': world.trackCriticalHit(); break;
    case 'achievement/trackPoemPowerInCombat': world.trackPoemPowerInCombat(); break;
    case 'achievement/trackKarmaChoice': world.trackKarmaChoice(action.karmaDelta); break;
    case 'achievement/batchCheckProgress': world.batchCheckAchievementProgress({ sceneVisit: action.sceneVisit, trackNightHour: action.trackNightHour }); break;
    case 'skill/unlockTreeNode': player.unlockSkillTreeNode(action.skillId); break;
    case 'notification/push': player.pushNotification(action.notificationType, action.text); break;
    case 'notification/dismiss': player.dismissNotification(action.id); break;
    case 'exploration/toggleInteractiveObject': exploration.toggleInteractiveObject(action.objectId); break;
    case 'exploration/applySceneTransition': exploration.setExplorationScene(action.targetScene); exploration.setPlayerPosition(action.spawnAt); exploration.discoverScene(action.targetScene); player.autoRegenBetweenScenes(); break;
    case 'cutscene/clear': getCutsceneStoreState().setCutscene(null, []); break;
    case 'phase/clearGameplayFlags': ui.setMainMenuOpen(false); ui.setIntroActive(false); ui.setCombatActive(false); break;
    default: { const _exhaustive: never = action; return _exhaustive; }
  }
  return {};
}
