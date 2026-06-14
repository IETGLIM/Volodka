import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const root = join('src', 'store');

writeFileSync(join(root, 'gameStore.ts'), `/* Volodka RPG – facade over independent slice stores */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getGamePhase } from '@/shared/gamePhase';
import type { InventoryItem } from '@/shared/types/game';
export type { NotificationType, GameNotification, JournalTab, LoreEntry, LoreCategory, LoreRarity, ConversationLogEntry } from './shared';
export type { UnlockedAchievement } from './slices/worldSlice';
export { useGameSelector, useGamePrimitive } from './selectors/hooks';
export { usePlayerStore, useExplorationStore, useWorldStore, useUIStore, useCutsceneStore, useSaveStore } from './stores';
import { wrapStoreSubscribe } from '@/engine/frame/frameProfilerCounters';
import { registerGameActionBridge, type GameSnapshotSubscribeOptions, type GameStoreSnapshot } from '@/engine/GameActionDispatcher';
import type { GameStoreState } from './types';
export type { GameStoreState, CrossSliceReads } from './types';
import { getCombinedGameState, subscribeAllStores } from './combinedState';
import { applyCombinedPatch } from './patchState';
import { reduceGameState } from './reduceGameState';

export const useGameStore = create<GameStoreState>()(subscribeWithSelector(() => getCombinedGameState()));
const facadeSetState = useGameStore.setState.bind(useGameStore);
subscribeAllStores(() => { facadeSetState(getCombinedGameState(), true); });
useGameStore.setState = ((partial, replace) => {
  const patch = typeof partial === 'function' ? partial(getCombinedGameState()) : partial;
  applyCombinedPatch(patch as Partial<GameStoreState>);
}) as typeof useGameStore.setState;
if (import.meta.env?.DEV) {
  const baseSubscribe = useGameStore.subscribe.bind(useGameStore);
  useGameStore.subscribe = wrapStoreSubscribe(baseSubscribe) as typeof useGameStore.subscribe;
}
export function getGameStore(): GameStoreState { return getCombinedGameState(); }

const gameSnapshotCache = new WeakMap<GameStoreState, GameStoreSnapshot>();
function buildGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  return {
    mode: getGamePhase({ mainMenuOpen: state.mainMenuOpen, introActive: state.introActive, combatActive: state.combatActive, activeCutsceneId: state.activeCutsceneId }),
    currentNodeId: state.currentNodeId,
    showStoryOverlay: state.showStoryOverlay,
    exploration: { currentSceneId: state.exploration.currentSceneId, playerPosition: state.exploration.playerPosition, timeOfDay: state.exploration.timeOfDay, interactiveObjectStates: state.interactiveObjectStates },
    playerState: { flags: state.playerState.flags, inventory: state.playerState.inventory, skills: state.playerState.skills, energy: state.playerState.energy, karma: state.playerState.karma, stress: state.playerState.stress, visitedNodes: state.playerState.visitedNodes, progression: { level: state.playerState.progression?.level ?? 1, currentAct: state.playerState.progression?.currentAct ?? 1, skillPoints: state.playerState.progression?.skillPoints ?? 0, unlockedSkills: state.playerState.progression?.unlockedSkills ?? [] } },
    collectedPoems: state.collectedPoems, quests: state.quests, activeTTLFlags: state.activeTTLFlags ?? {}, poemPowers: state.poemPowers, npcRelations: state.npcRelations, unlockedAchievements: state.unlockedAchievements, achievementProgress: state.achievementProgress,
  };
}
function toGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  const cached = gameSnapshotCache.get(state);
  if (cached) return cached;
  const snapshot = buildGameSnapshot(state);
  gameSnapshotCache.set(state, snapshot);
  return snapshot;
}
function subscribeGameBridge(listener: (snapshot: GameStoreSnapshot) => void): () => void;
function subscribeGameBridge<T>(listener: (selected: T) => void, options: GameSnapshotSubscribeOptions<T>): () => void;
function subscribeGameBridge<T>(listener: ((snapshot: GameStoreSnapshot) => void) | ((selected: T) => void), options?: GameSnapshotSubscribeOptions<T>): () => void {
  if (!options) {
    const fullListener = listener as (snapshot: GameStoreSnapshot) => void;
    return subscribeAllStores(() => { fullListener(toGameSnapshot(getCombinedGameState())); });
  }
  const { selector, equalityFn } = options;
  const selectedListener = listener as (selected: T) => void;
  let prevSelected = selector(toGameSnapshot(getCombinedGameState()));
  return subscribeAllStores(() => {
    const selected = selector(toGameSnapshot(getCombinedGameState()));
    if (equalityFn(prevSelected, selected)) return;
    prevSelected = selected;
    selectedListener(selected);
  });
}
registerGameActionBridge({
  dispatch(action) { reduceGameState(getCombinedGameState(), action); },
  getSnapshot() { return toGameSnapshot(getCombinedGameState()); },
  subscribe: subscribeGameBridge,
  tryAddItem(item: InventoryItem) { return getCombinedGameState().addItem(item); },
  tryActivatePoemPower(poemId: string) { return getCombinedGameState().activatePoemPower(poemId); },
});
`, 'utf8');

writeFileSync(join(root, 'reduceGameState.ts'), `import { eventBus } from '@/engine/EventBus';
import type { GameAction } from '@/engine/GameActionDispatcher';
import type { GameStoreState } from './types';
import type { ActiveTTLFlag } from './activeTTLFlags';
import { getPlayerStoreState } from './stores/playerStore';
import { getExplorationStoreState } from './stores/explorationStore';
import { getWorldStoreState } from './stores/worldStore';
import { getUIStoreState } from './stores/uiStore';
export function reduceGameState(_state: GameStoreState, action: GameAction): Partial<GameStoreState> {
  const player = getPlayerStoreState();
  const exploration = getExplorationStoreState();
  const world = getWorldStoreState();
  const ui = getUIStoreState();
  switch (action.type) {
    case 'quest/completeObjective': world.completeQuestObjective(action.questId, action.objectiveId); break;
    case 'quest/complete': world.completeQuest(action.questId); break;
    case 'quest/completeAndApplyRewards': player.completeQuestAndApplyRewards(action.questId); break;
    case 'quest/fail': world.failQuest(action.questId); break;
    case 'quest/activate': world.activateQuest(action.questId); break;
    case 'player/addSkill': player.addSkill(action.skill, action.amount); break;
    case 'player/addEnergy': player.addEnergy(action.amount); break;
    case 'player/addStress': player.addStress(action.amount); break;
    case 'player/addKarma': player.addKarma(action.amount); break;
    case 'player/addXp': player.addXp(action.amount); break;
    case 'player/addCredits': player.addCredits(action.amount); break;
    case 'player/setFlag': player.setFlag(action.key, action.value); break;
    case 'player/setNpcRelation': world.setNpcRelation(action.npcId, action.delta); break;
    case 'poem/upsertTTLFlag': player.upsertActiveTTLFlag(action.flag); break;
    case 'poem/upsertTTLFlags': player.upsertActiveTTLFlags(action.flags); break;
    case 'poem/removeTTLFlags': player.removeActiveTTLFlags(action.keys); break;
    case 'poem/clearAllEffects': { const flags = player.activeTTLFlags ?? {}; for (const f of Object.values(flags) as ActiveTTLFlag[]) player.setFlag(f.key, false); player.clearActiveTTLFlags(); eventBus.emit('poem:reset_all_effects', {}); break; }
    case 'story/setCombatActive': ui.setCombatActive(action.active); break;
    case 'story/setIntroActive': ui.setIntroActive(action.active); break;
    case 'story/setMainMenuOpen': ui.setMainMenuOpen(action.open); break;
    case 'story/setCurrentNodeId': if (action.nodeId != null) ui.setCurrentNodeId(action.nodeId); break;
    case 'story/setShowStoryOverlay': ui.setShowStoryOverlay(action.show); break;
    case 'story/openNarrativeOverlay': ui.openNarrativeOverlay(action.nodeId, action.kind ?? ui.narrativeKind ?? 'story'); break;
    case 'story/closeNarrativeOverlay': ui.closeNarrativeOverlay(); break;
    case 'story/visitNode': player.visitNode(action.nodeId); break;
    case 'story/advanceAct': player.advanceAct(); break;
    case 'inventory/addItem': player.addItem(action.item); break;
    case 'achievement/unlock': world.unlockAchievement(action.achievementId); break;
    case 'achievement/trackSceneVisit': world.trackSceneVisit(action.sceneId); break;
    case 'achievement/trackNightHour': world.trackNightHour(); break;
    case 'achievement/trackCombatVictory': world.trackCombatVictory(action.enemyType, action.combo); break;
    case 'achievement/resetConsecutiveVictories': world.resetConsecutiveVictories(); break;
    case 'achievement/trackMaxCombo': world.trackMaxCombo(action.comboCount); break;
    case 'achievement/trackCriticalHit': world.trackCriticalHit(); break;
    case 'achievement/trackPoemPowerInCombat': world.trackPoemPowerInCombat(); break;
    case 'skill/unlockTreeNode': player.unlockSkillTreeNode(action.skillId); break;
    case 'notification/push': player.pushNotification(action.notificationType, action.text); break;
    case 'notification/dismiss': player.dismissNotification(action.id); break;
    case 'exploration/toggleInteractiveObject': exploration.toggleInteractiveObject(action.objectId); break;
    case 'exploration/applySceneTransition': exploration.setExplorationScene(action.targetScene); exploration.setPlayerPosition(action.spawnAt); exploration.discoverScene(action.targetScene); player.autoRegenBetweenScenes(); break;
    default: { const _exhaustive: never = action; return _exhaustive; }
  }
  return {};
}
`, 'utf8');

const patches = [
  ['src/store/persistedState.ts', [['import { getGameStore } from \'./gameStore\';', 'import { getCombinedGameState } from \'./storeBindings\';'], ['pickSavePayload(getGameStore())', 'pickSavePayload(getCombinedGameState())']]],
  ['src/store/slices/playerCoreSlice.ts', [['readPlayerFromExploration(get())', 'readPlayerFromExploration()'], ['pickPlayerCoreCrossActions(get)', 'pickPlayerCoreCrossActions()']]],
  ['src/store/slices/explorationSlice.ts', [["import type { GameStoreState } from '../types';", "import type { GameStoreState } from '../types';\nimport { getCombinedGameState } from '../storeBindings';"], ['buildScheduleContext(state)', 'buildScheduleContext(getCombinedGameState())'], ['readExplorationFromPlayer(get())', 'readExplorationFromPlayer()']]],
  ['src/store/slices/uiSlice.ts', [["import type { GameStoreState } from '../types';", "import type { GameStoreState } from '../types';\nimport { getPlayerStore } from '../storeBindings';"], ['readUIFromExploration(get())', 'readUIFromExploration()'], ['const crossState = get();\n        crossState.addXp(5);\n\n        // Grant +1 writing skill for rare/legendary entries\n        if (rarity === \'rare\' || rarity === \'legendary\') {\n          crossState.addSkill(\'writing\', 1);\n        }', 'const playerStore = getPlayerStore();\n        playerStore.addXp(5);\n        if (rarity === \'rare\' || rarity === \'legendary\') {\n          playerStore.addSkill(\'writing\', 1);\n        }']]],
  ['src/store/slices/worldSlice.ts', [["import type { GameStoreState } from '../types';", "import type { GameStoreState } from '../types';\nimport { getUIStore } from '../storeBindings';"], ['pickWorldCrossActions(get)', 'pickWorldCrossActions()'], ['pickPlayerRewardBatchActions(get)', 'pickPlayerRewardBatchActions()'], ['readWorldFromExploration(get())', 'readWorldFromExploration()'], ['state.lastSaveTimestamp', 'getUIStore().lastSaveTimestamp']]],
  ['src/store/slices/playerEconomySlice.ts', [['pickPlayerEconomyCrossActions(get)', 'pickPlayerEconomyCrossActions()'], ['readNpcRelationValue(state, npcId)', 'readNpcRelationValue(npcId)']]],
  ['src/store/slices/playerQuestRewardsSlice.ts', [['pickPlayerQuestRewardsCrossActions(get)', 'pickPlayerQuestRewardsCrossActions()']]],
];

for (const [file, reps] of patches) {
  let s = readFileSync(file, 'utf8');
  for (const [from, to] of reps) {
    if (!s.includes(from.split('\n')[0])) console.warn('missing pattern in', file, from.slice(0, 40));
    s = s.split(from).join(to);
  }
  writeFileSync(file, s, 'utf8');
  console.log('patched', file);
}

// crossSliceReads + saveSlice from templates on disk if present, else skip
console.log('finish-store-split done');
