import type { SceneId, NPCRelation, QuestState, TrainablePlayerSkill, InventoryItem } from '@/shared/types/game';
import type { GameNotification } from './shared';
import type { GameStoreState } from './types';
import type { RewardBatchDraft, RewardBatchSideEffects } from './rewardBatchHelpers';
import { getExplorationStore, getPlayerStore, getWorldStore } from './storeBindings';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';
export interface PlayerReadsFromExploration { currentSceneId: SceneId; timeOfDay: number; }
export interface PlayerReadsFromWorld { npcRelations: NPCRelation[]; npcAffinity: Record<string, number>; quests: QuestState[]; }
export interface WorldReadsFromExploration { timeOfDay: number; }
export interface WorldReadsFromPlayer { notifications: GameNotification[]; }
export interface UIReadsFromExploration { currentSceneId: SceneId; }
export interface ExplorationReadsFromPlayer { flags: Record<string, boolean>; }
export type SaveReadsSnapshot = GameStoreState;
export interface PlayerCoreCrossActions { advanceTime: (hours: number) => void; }
export interface PlayerNotificationCrossActions { pushNotification: (type: GameNotification['type'], text: string) => void; }
export interface PlayerRewardBatchCrossActions { applyPlayerRewardBatch: (apply: (draft: RewardBatchDraft, sideEffects: RewardBatchSideEffects) => void) => RewardBatchSideEffects; }
export interface PlayerQuestRewardsCrossActions extends PlayerNotificationCrossActions { completeQuest: (questId: string) => void; setNpcRelation: (npcId: string, delta: number) => void; adjustNpcAffinity: (npcId: string, delta: number) => void; addSkill: (skill: TrainablePlayerSkill, amount: number) => void; addKarma: (amount: number) => void; addXp: (amount: number) => void; addEnergy: (amount: number) => void; addStress: (amount: number) => void; addItem: (item: InventoryItem) => boolean; setFlag: (key: string, value: boolean) => void; }
export type WorldCrossActions = PlayerNotificationCrossActions;
export type PlayerEconomyCrossActions = PlayerNotificationCrossActions;
export type ThoughtCabinetCrossActions = PlayerNotificationCrossActions;
export function readPlayerFromExploration(state?: GameStoreState): PlayerReadsFromExploration { if (state) return { currentSceneId: state.exploration.currentSceneId, timeOfDay: state.exploration.timeOfDay }; const ex = getExplorationStore().exploration; return { currentSceneId: ex.currentSceneId, timeOfDay: ex.timeOfDay }; }
export function readPlayerFromWorld(state?: GameStoreState): PlayerReadsFromWorld { if (state) return { npcRelations: state.npcRelations, npcAffinity: state.npcAffinity, quests: state.quests }; const world = getWorldStore(); return { npcRelations: world.npcRelations, npcAffinity: world.npcAffinity, quests: world.quests }; }
export function readWorldFromExploration(state?: GameStoreState): WorldReadsFromExploration { if (state) return { timeOfDay: state.exploration.timeOfDay }; return { timeOfDay: getExplorationStore().exploration.timeOfDay }; }
export function readWorldFromPlayer(state?: GameStoreState): WorldReadsFromPlayer { if (state) return { notifications: state.notifications }; return { notifications: getPlayerStore().notifications }; }
export function readUIFromExploration(state?: GameStoreState): UIReadsFromExploration { if (state) return { currentSceneId: state.exploration.currentSceneId }; return { currentSceneId: getExplorationStore().exploration.currentSceneId }; }
export function readExplorationFromPlayer(state?: GameStoreState): ExplorationReadsFromPlayer { if (state) return { flags: state.playerState.flags }; return { flags: getPlayerStore().playerState.flags }; }
export function readNpcRelationValue(npcId: string): number;
export function readNpcRelationValue(state: GameStoreState, npcId: string): number;
export function readNpcRelationValue(stateOrNpcId: GameStoreState | string, npcId?: string): number {
  const readValue = (relations: NPCRelation[], id: string) => {
    const canonical = resolveCanonicalNpcId(id);
    const match = relations.find((r) => resolveCanonicalNpcId(r.npcId) === canonical);
    return match?.value ?? 50;
  };
  if (typeof stateOrNpcId === 'string') {
    return readValue(getWorldStore().npcRelations, stateOrNpcId);
  }
  return readValue(stateOrNpcId.npcRelations, npcId!);
}
export function pickPlayerCoreCrossActions(_get?: () => GameStoreState): PlayerCoreCrossActions { return { advanceTime: getExplorationStore().advanceTime }; }
export function pickWorldCrossActions(_get?: () => GameStoreState): WorldCrossActions { return { pushNotification: getPlayerStore().pushNotification }; }
export function pickPlayerEconomyCrossActions(_get?: () => GameStoreState): PlayerEconomyCrossActions { return { pushNotification: getPlayerStore().pushNotification }; }
export function pickPlayerRewardBatchActions(_get?: () => GameStoreState): PlayerRewardBatchCrossActions { return { applyPlayerRewardBatch: getPlayerStore().applyPlayerRewardBatch }; }
export function pickPlayerQuestRewardsCrossActions(_get?: () => GameStoreState): PlayerQuestRewardsCrossActions { const player = getPlayerStore(); const world = getWorldStore(); return { pushNotification: player.pushNotification, completeQuest: world.completeQuest, setNpcRelation: world.setNpcRelation, adjustNpcAffinity: world.adjustNpcAffinity, addSkill: player.addSkill, addKarma: player.addKarma, addXp: player.addXp, addEnergy: player.addEnergy, addStress: player.addStress, addItem: player.addItem, setFlag: player.setFlag }; }
export function pickThoughtCabinetCrossActions(_get?: () => GameStoreState): ThoughtCabinetCrossActions { return { pushNotification: getPlayerStore().pushNotification }; }
