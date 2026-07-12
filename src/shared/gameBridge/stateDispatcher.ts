/**
 * StateDispatcher — Engine→Store callback contract (shared layer).
 * Engine dispatches typed state actions; store registers the handler at bootstrap.
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
