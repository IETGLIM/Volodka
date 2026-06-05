/* ─── Volodka RPG – engine→store action bridge ─── */
/* Engine modules dispatch typed actions here instead of importing gameStore.
 * The store registers a handler at startup (see gameStore.ts). */

import type { SceneId } from '@/config/sceneDefinitions';
import type { QuestState } from '@/shared/types/game';

/** Read-only snapshot for engine systems that observe game state. */
export interface GameStoreSnapshot {
  exploration: {
    currentSceneId: SceneId;
    timeOfDay: number;
  };
  playerState: {
    flags: Record<string, boolean>;
    inventory: Array<{ id: string }>;
  };
  collectedPoems: string[];
  quests: QuestState[];
  activeTTLFlags: Array<{ key: string; poemId: string; expiryTimestamp: number }>;
}

/** Typed mutations engine may request from the store. Extend incrementally. */
export type GameAction =
  | { type: 'quest/completeObjective'; questId: string; objectiveId: string }
  | { type: 'quest/complete'; questId: string }
  | { type: 'quest/fail'; questId: string };

export interface GameActionBridge {
  dispatch(action: GameAction): void;
  getSnapshot(): GameStoreSnapshot;
  subscribe(listener: (snapshot: GameStoreSnapshot) => void): () => void;
}

let bridge: GameActionBridge | null = null;

export function registerGameActionBridge(next: GameActionBridge): void {
  bridge = next;
}

export function dispatchGameAction(action: GameAction): void {
  if (!bridge) {
    if (import.meta.env.DEV) {
      console.warn('[GameActionDispatcher] No bridge registered — action dropped:', action.type);
    }
    return;
  }
  bridge.dispatch(action);
}

export function getGameSnapshot(): GameStoreSnapshot {
  if (!bridge) {
    throw new Error('[GameActionDispatcher] No bridge registered');
  }
  return bridge.getSnapshot();
}

export function subscribeGameSnapshot(
  listener: (snapshot: GameStoreSnapshot) => void,
): () => void {
  if (!bridge) {
    throw new Error('[GameActionDispatcher] No bridge registered');
  }
  return bridge.subscribe(listener);
}

/** Test helper — reset bridge between unit tests. */
export function resetGameActionBridge(): void {
  bridge = null;
}
