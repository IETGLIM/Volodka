import { emitPoemResetAllEffects } from './storeEffects';
import type { GameAction } from '@/shared/gameBridge/gameActionBridge';
import type { GameStoreState } from './types';
import type { ActiveTTLFlag } from './activeTTLFlags';
import { getPlayerStoreState } from './stores/playerStore';
import { scaleStressWithPoemEffects } from '@/shared/poemEffects/poemStressScaling';
import { getExplorationStoreState } from './stores/explorationStore';
import { getWorldStoreState } from './stores/worldStore';
import { getUIStoreState } from './stores/uiStore';
import { getCutsceneStoreState } from './stores/cutsceneStore';
import { getSaveStoreState } from './stores/saveStore';
/**
 * Apply a game action by routing to the appropriate independent slice store.
 *
 * ⚠ NON-TRANSACTIONAL: Each slice mutation triggers its own subscribers immediately.
 * If two actions are dispatched synchronously (e.g., quest completion → reward + flag + XP),
 * the second action reads stale combined state from the facade. Each individual slice
 * is internally consistent, but cross-slice reads within a synchronous batch may see
 * intermediate states.
 *
 * For multi-action dispatches, use `batchGameActions()` to coalesce mutations before
 * the facade flushes.
 */
export function applyGameAction(_state: GameStoreState, action: GameAction): void {
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
    case 'game/resetForNewPlaythrough':
      getSaveStoreState().resetForNewPlaythrough({
        preserveAchievements: action.preserveAchievements ?? false,
        skipIntro: action.skipIntro,
      });
      break;
    case 'game/save':
      getSaveStoreState().saveGame({ source: action.source });
      break;
    case 'quest/activate': world.activateQuest(action.questId); break;
    case 'quest/setHoursElapsed': world.setQuestHoursElapsed(action.questId, action.hoursElapsed); break;
    case 'quest/syncWallClockAnchors': world.syncActiveQuestWallClocks(); break;
    case 'player/addSkill': player.addSkill(action.skill, action.amount); break;
    case 'player/addEnergy': player.addEnergy(action.amount); break;
    case 'player/addStress': {
      const scaled = scaleStressWithPoemEffects(
        action.amount,
        getPlayerStoreState().activeTTLFlags,
      );
      player.addStress(scaled);
      break;
    }
    case 'player/addKarma': player.addKarma(action.amount); break;
    case 'player/addXp': player.addXp(action.amount); break;
    case 'player/addCredits': player.addCredits(action.amount); break;
    case 'player/setFlag': player.setFlag(action.key, action.value); break;
    case 'player/setRngSeed': player.setRngSeed(action.seed); break;
    case 'player/bumpCombatEncounterSeq': player.bumpCombatEncounterSeq(); break;
    case 'player/setNpcRelation':
      world.setNpcRelation(action.npcId, action.delta);
      break;
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
    case 'exploration/applySceneTransition': {
      // Player-side regen MUST run before mutating the exploration store.
      // autoRegenBetweenScenes calls readPlayerFromExploration() which reads
      // the *current* exploration state.  If we set the scene first, the
      // cross-slice read would see the post-transition exploration state
      // (e.g. a different timeOfDay / currentSceneId), producing
      // inconsistent regen calculations.  React 19 auto-batches the
      // subsequent exploration mutations into a single re-render.
      player.autoRegenBetweenScenes();
      exploration.setExplorationScene(action.targetScene);
      exploration.setPlayerPosition(action.spawnAt);
      exploration.discoverScene(action.targetScene);
      break;
    }
    case 'cutscene/clear': getCutsceneStoreState().setCutscene(null, []); break;
    case 'phase/clearGameplayFlags': ui.setMainMenuOpen(false); ui.setIntroActive(false); ui.setCombatActive(false); break;
    case 'journal/addThought': ui.addThought(action.text, action.sceneId); break;
    case 'thoughtCabinet/acquire': player.acquireThought(action.thoughtId); break;
    case 'thoughtCabinet/equip': player.equipThought(action.thoughtId); break;
    case 'thoughtCabinet/unequip': player.unequipThought(action.thoughtId); break;
    default: { const _exhaustive: never = action; return; }
  }
}

/** Batch-apply multiple game actions before the facade flushes.
 *  This reduces intermediate re-renders when a single event triggers
 *  several actions (e.g. quest completion → XP + karma + flag + achievement). */
export function batchGameActions(state: GameStoreState, actions: GameAction[]): void {
  for (const action of actions) {
    applyGameAction(state, action);
  }
}
