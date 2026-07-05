/**
 * StateDispatcher — Engine→Store callback contract (shared layer).
 * Engine dispatches typed state actions; store registers the handler at bootstrap.
 *
 * [roadmap:ARCH-01] DEPRECATED — use `@/engine/GameActionDispatcher` or
 * `@/shared/gameBridge/gameActionBridge` directly. This file is kept as a
 * thin re-export for backward compatibility with 5 existing importers.
 * New code should NOT import from this file.
 *
 * Migration: replace `from '@/shared/gameBridge/stateDispatcher'` with
 * `from '@/engine/GameActionDispatcher'` (canonical re-export).
 */

export {
  registerGameActionBridge as registerStateDispatcher,
  dispatchGameAction as dispatchStateAction,
  getGameSnapshot,
  subscribeGameSnapshot,
  tryAddInventoryItem,
  tryActivatePoemPower,
  resetGameActionBridge as resetStateDispatcherForTests,
  type GameAction as StateAction,
  type GameStoreSnapshot,
  type GameSnapshotSubscribeOptions,
  type GameActionBridge as StateDispatcher,
  type ActiveTTLFlagSnapshot,
  type AchievementProgressSnapshot,
} from './gameActionBridge';
