/* ─── GameAction → zustand setState reducer ─── */
/* Routes engine actions through slice methods on the live store state so each
 * action uses zustand set() internally instead of bypassing the update path. */

import { eventBus } from '@/engine/EventBus';
import type { GameAction } from '@/engine/GameActionDispatcher';
import type { GameStoreState } from './types';
import type { ActiveTTLFlag } from './activeTTLFlags';

/**
 * Apply a typed engine action via store actions (each uses zustand set internally).
 * Returns an empty patch when actions handle their own set(); the setState wrapper
 * ensures dispatch always enters zustand's update path.
 */
export function reduceGameState(
  state: GameStoreState,
  action: GameAction,
): Partial<GameStoreState> {
  switch (action.type) {
    case 'quest/completeObjective':
      state.completeQuestObjective(action.questId, action.objectiveId);
      break;
    case 'quest/complete':
      state.completeQuest(action.questId);
      break;
    case 'quest/completeAndApplyRewards':
      state.completeQuestAndApplyRewards(action.questId);
      break;
    case 'quest/fail':
      state.failQuest(action.questId);
      break;
    case 'quest/activate':
      state.activateQuest(action.questId);
      break;
    case 'player/addSkill':
      state.addSkill(action.skill, action.amount);
      break;
    case 'player/addEnergy':
      state.addEnergy(action.amount);
      break;
    case 'player/addStress':
      state.addStress(action.amount);
      break;
    case 'player/addKarma':
      state.addKarma(action.amount);
      break;
    case 'player/addXp':
      state.addXp(action.amount);
      break;
    case 'player/addCredits':
      state.addCredits(action.amount);
      break;
    case 'player/setFlag':
      state.setFlag(action.key, action.value);
      break;
    case 'player/setNpcRelation':
      state.setNpcRelation(action.npcId, action.delta);
      break;
    case 'poem/upsertTTLFlag':
      state.upsertActiveTTLFlag(action.flag);
      break;
    case 'poem/upsertTTLFlags':
      state.upsertActiveTTLFlags(action.flags);
      break;
    case 'poem/removeTTLFlags':
      state.removeActiveTTLFlags(action.keys);
      break;
    case 'poem/clearAllEffects': {
      const flags = state.activeTTLFlags ?? {};
      for (const f of Object.values(flags) as ActiveTTLFlag[]) {
        state.setFlag(f.key, false);
      }
      state.clearActiveTTLFlags();
      eventBus.emit('poem:reset_all_effects', {});
      break;
    }
    case 'story/setCombatActive':
      state.setCombatActive(action.active);
      break;
    case 'story/setIntroActive':
      state.setIntroActive(action.active);
      break;
    case 'story/setMainMenuOpen':
      state.setMainMenuOpen(action.open);
      break;
    case 'story/setCurrentNodeId':
      if (action.nodeId != null) state.setCurrentNodeId(action.nodeId);
      break;
    case 'story/setShowStoryOverlay':
      state.setShowStoryOverlay(action.show);
      break;
    case 'story/openNarrativeOverlay':
      state.openNarrativeOverlay(action.nodeId, action.kind ?? state.narrativeKind ?? 'story');
      break;
    case 'story/closeNarrativeOverlay':
      state.closeNarrativeOverlay();
      break;
    case 'story/visitNode':
      state.visitNode(action.nodeId);
      break;
    case 'story/advanceAct':
      state.advanceAct();
      break;
    case 'inventory/addItem':
      state.addItem(action.item);
      break;
    case 'achievement/unlock':
      state.unlockAchievement(action.achievementId);
      break;
    case 'achievement/trackSceneVisit':
      state.trackSceneVisit(action.sceneId);
      break;
    case 'achievement/trackNightHour':
      state.trackNightHour();
      break;
    case 'achievement/trackCombatVictory':
      state.trackCombatVictory(action.enemyType, action.combo);
      break;
    case 'achievement/resetConsecutiveVictories':
      state.resetConsecutiveVictories();
      break;
    case 'achievement/trackMaxCombo':
      state.trackMaxCombo(action.comboCount);
      break;
    case 'achievement/trackCriticalHit':
      state.trackCriticalHit();
      break;
    case 'achievement/trackPoemPowerInCombat':
      state.trackPoemPowerInCombat();
      break;
    case 'skill/unlockTreeNode':
      state.unlockSkillTreeNode(action.skillId);
      break;
    case 'notification/push':
      state.pushNotification(action.notificationType, action.text);
      break;
    case 'notification/dismiss':
      state.dismissNotification(action.id);
      break;
    case 'exploration/toggleInteractiveObject':
      state.toggleInteractiveObject(action.objectId);
      break;
    case 'exploration/applySceneTransition':
      state.setExplorationScene(action.targetScene);
      state.setPlayerPosition(action.spawnAt);
      state.discoverScene(action.targetScene);
      state.autoRegenBetweenScenes();
      break;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }

  return {};
}
