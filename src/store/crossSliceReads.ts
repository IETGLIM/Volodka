/* ─── Volodka RPG – narrow cross-slice read contracts ─── */
/* Slices must read other domains only through these typed accessors,
 * not via raw get().<otherSlice>.* on GameStoreState.
 * Intentionally does NOT import ./selectors to avoid gameStore cycles. */

import type { SceneId, NPCRelation, TrainablePlayerSkill, InventoryItem } from '@/shared/types/game';
import type { GameNotification } from './shared';
import type { GameStoreState } from './types';

/* ─── Per-slice read contracts (document allowed cross-slice surface) ─── */

/** Player slices → exploration */
export interface PlayerReadsFromExploration {
  currentSceneId: SceneId;
}

/** Player slices → world */
export interface PlayerReadsFromWorld {
  npcRelations: NPCRelation[];
  npcAffinity: Record<string, number>;
}

/** World slice → exploration */
export interface WorldReadsFromExploration {
  timeOfDay: number;
}

/** World slice → player */
export interface WorldReadsFromPlayer {
  notifications: GameNotification[];
}

/** UI slice → exploration */
export interface UIReadsFromExploration {
  currentSceneId: SceneId;
}

/** Exploration slice → player */
export interface ExplorationReadsFromPlayer {
  flags: Record<string, boolean>;
}

/** Save slice intentionally reads a wide snapshot — see saveSlice.ts */
export type SaveReadsSnapshot = GameStoreState;

/* ─── Cross-slice action bundles (narrow write surface between slices) ─── */

export interface PlayerCoreCrossActions {
  advanceTime: (hours: number) => void;
}

export interface PlayerQuestRewardsCrossActions {
  pushNotification: (type: GameNotification['type'], text: string) => void;
  completeQuest: (questId: string) => void;
  addSkill: (skill: TrainablePlayerSkill, amount: number) => void;
  addKarma: (amount: number) => void;
  addXp: (amount: number) => void;
  addEnergy: (amount: number) => void;
  addStress: (amount: number) => void;
  addItem: (item: InventoryItem) => boolean;
  setFlag: (key: string, value: boolean) => void;
}

/* ─── Read accessors ─── */

export function readPlayerFromExploration(state: GameStoreState): PlayerReadsFromExploration {
  return { currentSceneId: state.exploration.currentSceneId };
}

export function readPlayerFromWorld(state: GameStoreState): PlayerReadsFromWorld {
  return {
    npcRelations: state.npcRelations,
    npcAffinity: state.npcAffinity,
  };
}

export function readWorldFromExploration(state: GameStoreState): WorldReadsFromExploration {
  return { timeOfDay: state.exploration.timeOfDay };
}

export function readWorldFromPlayer(state: GameStoreState): WorldReadsFromPlayer {
  return { notifications: state.notifications };
}

export function readUIFromExploration(state: GameStoreState): UIReadsFromExploration {
  return { currentSceneId: state.exploration.currentSceneId };
}

export function readExplorationFromPlayer(state: GameStoreState): ExplorationReadsFromPlayer {
  return { flags: state.playerState.flags };
}

export function readNpcRelationValue(state: GameStoreState, npcId: string): number {
  return state.npcRelations.find((r) => r.npcId === npcId)?.value ?? 50;
}

/* ─── Action pickers (for orchestration between slices) ─── */

export function pickPlayerCoreCrossActions(get: () => GameStoreState): PlayerCoreCrossActions {
  const { advanceTime } = get();
  return { advanceTime };
}

export function pickPlayerQuestRewardsCrossActions(get: () => GameStoreState): PlayerQuestRewardsCrossActions {
  const s = get();
  return {
    pushNotification: s.pushNotification,
    completeQuest: s.completeQuest,
    addSkill: s.addSkill,
    addKarma: s.addKarma,
    addXp: s.addXp,
    addEnergy: s.addEnergy,
    addStress: s.addStress,
    addItem: s.addItem,
    setFlag: s.setFlag,
  };
}
