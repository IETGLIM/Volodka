import { writeFileSync } from 'fs';

writeFileSync('src/store/crossSliceReads.ts', `import type { SceneId, NPCRelation, QuestState, TrainablePlayerSkill, InventoryItem } from '@/shared/types/game';
import type { GameNotification } from './shared';
import type { GameStoreState } from './types';
import type { RewardBatchDraft, RewardBatchSideEffects } from './rewardBatchHelpers';
import { getExplorationStore, getPlayerStore, getWorldStore } from './storeBindings';
export interface PlayerReadsFromExploration { currentSceneId: SceneId; }
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
export function readPlayerFromExploration(state?: GameStoreState): PlayerReadsFromExploration { if (state) return { currentSceneId: state.exploration.currentSceneId }; return { currentSceneId: getExplorationStore().exploration.currentSceneId }; }
export function readPlayerFromWorld(state?: GameStoreState): PlayerReadsFromWorld { if (state) return { npcRelations: state.npcRelations, npcAffinity: state.npcAffinity, quests: state.quests }; const world = getWorldStore(); return { npcRelations: world.npcRelations, npcAffinity: world.npcAffinity, quests: world.quests }; }
export function readWorldFromExploration(state?: GameStoreState): WorldReadsFromExploration { if (state) return { timeOfDay: state.exploration.timeOfDay }; return { timeOfDay: getExplorationStore().exploration.timeOfDay }; }
export function readWorldFromPlayer(state?: GameStoreState): WorldReadsFromPlayer { if (state) return { notifications: state.notifications }; return { notifications: getPlayerStore().notifications }; }
export function readUIFromExploration(state?: GameStoreState): UIReadsFromExploration { if (state) return { currentSceneId: state.exploration.currentSceneId }; return { currentSceneId: getExplorationStore().exploration.currentSceneId }; }
export function readExplorationFromPlayer(state?: GameStoreState): ExplorationReadsFromPlayer { if (state) return { flags: state.playerState.flags }; return { flags: getPlayerStore().playerState.flags }; }
export function readNpcRelationValue(npcId: string): number;
export function readNpcRelationValue(state: GameStoreState, npcId: string): number;
export function readNpcRelationValue(stateOrNpcId: GameStoreState | string, npcId?: string): number { if (typeof stateOrNpcId === 'string') return getWorldStore().npcRelations.find((r) => r.npcId === stateOrNpcId)?.value ?? 50; return stateOrNpcId.npcRelations.find((r) => r.npcId === npcId!)?.value ?? 50; }
export function pickPlayerCoreCrossActions(_get?: () => GameStoreState): PlayerCoreCrossActions { return { advanceTime: getExplorationStore().advanceTime }; }
export function pickWorldCrossActions(_get?: () => GameStoreState): WorldCrossActions { return { pushNotification: getPlayerStore().pushNotification }; }
export function pickPlayerEconomyCrossActions(_get?: () => GameStoreState): PlayerEconomyCrossActions { return { pushNotification: getPlayerStore().pushNotification }; }
export function pickPlayerRewardBatchActions(_get?: () => GameStoreState): PlayerRewardBatchCrossActions { return { applyPlayerRewardBatch: getPlayerStore().applyPlayerRewardBatch }; }
export function pickPlayerQuestRewardsCrossActions(_get?: () => GameStoreState): PlayerQuestRewardsCrossActions { const player = getPlayerStore(); const world = getWorldStore(); return { pushNotification: player.pushNotification, completeQuest: world.completeQuest, setNpcRelation: world.setNpcRelation, adjustNpcAffinity: world.adjustNpcAffinity, addSkill: player.addSkill, addKarma: player.addKarma, addXp: player.addXp, addEnergy: player.addEnergy, addStress: player.addStress, addItem: player.addItem, setFlag: player.setFlag }; }
`);

writeFileSync('src/store/slices/saveSlice.ts', `import type { StateCreator } from 'zustand';
import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import { pushNotification } from '../shared';
import type { GameStoreState } from '../types';
import { readWorldFromPlayer } from '../crossSliceReads';
import { createDefaultResetState, pickSavePayload, storePatchFromSave } from '../persistedState';
import { applyCombinedPatch } from '../patchState';
import { getCombinedGameState } from '../storeBindings';
import { resetGuidedStoryManager } from '@/engine/GuidedStoryManager';
import { resetCinematicPresentation } from '@/engine/camera/cinematicPresentation';
import { clearAutoCloseTimers } from './explorationSlice';
import { resolveSaveFromStorage, writeSaveToLocalStorage } from './saveStorage';
export interface SaveSliceState {}
export interface SaveSliceActions { resetGame: () => void; saveGame: (options?: { source?: 'auto' | 'manual' }) => void; loadGame: () => void; }
export type SaveSlice = SaveSliceState & SaveSliceActions;
export const createSaveSlice: StateCreator<GameStoreState, [], [], SaveSlice> = () => ({
  resetGame: () => { dispatchGameAction({ type: 'poem/clearAllEffects' }); clearAutoCloseTimers(); applyCombinedPatch(createDefaultResetState()); resetGuidedStoryManager(); resetCinematicPresentation(); },
  saveGame: (options) => {
    const state = getCombinedGameState(); const source = options?.source ?? 'manual';
    const payload = pickSavePayload(state); const payloadWithVersion = { ...payload, saveVersion: SAVE_VERSION };
    let json: string;
    try { json = JSON.stringify(payloadWithVersion); } catch (err) { console.error('[saveGame] Failed to serialize save payload:', err); applyCombinedPatch({ notifications: pushNotification(readWorldFromPlayer().notifications, 'quest', 'Ошибка сохранения') }); return; }
    try {
      if (!writeSaveToLocalStorage(json)) { applyCombinedPatch({ notifications: pushNotification(readWorldFromPlayer().notifications, 'quest', 'Ошибка сохранения') }); return; }
      const timestamp = Date.now(); applyCombinedPatch({ lastSaveTimestamp: timestamp, ...(source === 'auto' ? { lastAutoSaveTimestamp: timestamp } : {}) }); eventBus.emit('game:saved', { timestamp, source });
    } catch { console.error('[saveGame] Failed to write save to localStorage'); applyCombinedPatch({ notifications: pushNotification(readWorldFromPlayer().notifications, 'quest', 'Ошибка сохранения') }); }
  },
  loadGame: () => {
    try {
      const resolved = resolveSaveFromStorage();
      switch (resolved.status) {
        case 'empty': return;
        case 'corrupt': console.error('[loadGame] Save validation failed:', resolved.primaryError, '| Backup also unusable:', resolved.backupError); applyCombinedPatch({ notifications: pushNotification(readWorldFromPlayer().notifications, 'quest', resolved.primaryError) }); return;
        case 'recovered-from-backup': console.warn('[loadGame] Primary save corrupt, restored from backup:', resolved.primaryError); break;
        case 'ok': break;
        default: { const _exhaustive: never = resolved; return _exhaustive; }
      }
      clearAutoCloseTimers(); applyCombinedPatch(storePatchFromSave(resolved.data)); resetGuidedStoryManager();
      if (resolved.status === 'recovered-from-backup') applyCombinedPatch({ notifications: pushNotification(readWorldFromPlayer().notifications, 'quest', 'Основное сохранение повреждено — загружена резервная копия.') });
      eventBus.emit('game:loaded', {} as Record<string, never>);
    } catch (err) { console.error('[loadGame] Unexpected error:', err); applyCombinedPatch({ notifications: pushNotification(readWorldFromPlayer().notifications, 'quest', 'Ошибка загрузки') }); }
  },
});
`);

console.log('wrote crossSliceReads and saveSlice');
