/**
 * Engine-facing re-export — StateDispatcher lives in @/shared/gameBridge.
 *
 * [roadmap:ARCH-01] DEPRECATED — use `@/engine/GameActionDispatcher` (the
 * canonical re-export) directly. This file is kept for backward compatibility
 * with 4 existing importers. New code should NOT import from this file.
 *
 * Migration: replace `from '@/engine/StateDispatcher'` with
 * `from '@/engine/GameActionDispatcher'`.
 */

export {
  registerStateDispatcher,
  dispatchStateAction,
  getGameSnapshot,
  subscribeGameSnapshot,
  tryAddInventoryItem,
  tryActivatePoemPower,
  resetStateDispatcherForTests,
  type StateAction,
  type GameStoreSnapshot,
  type GameSnapshotSubscribeOptions,
  type StateDispatcher,
  type ActiveTTLFlagSnapshot,
  type AchievementProgressSnapshot,
} from '@/shared/gameBridge/stateDispatcher';
