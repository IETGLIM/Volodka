/** Engine-facing re-export — StateDispatcher lives in @/shared/gameBridge. */
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
