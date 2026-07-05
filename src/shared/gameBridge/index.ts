/** Shared layer bridges — import from here instead of store/engine directly. */

export {
  registerStateDispatcher,
  dispatchStateAction,
  getGameSnapshot,
  subscribeGameSnapshot,
  tryAddInventoryItem,
  tryActivatePoemPower,
  resetStateDispatcherForTests,
  type StateAction,
  type StateDispatcher,
  type GameStoreSnapshot,
  type GameSnapshotSubscribeOptions,
} from './stateDispatcher';

export {
  registerGameActionBridge,
  dispatchGameAction,
  resetGameActionBridge,
  type GameAction,
  type GameActionBridge,
} from './gameActionBridge';

export {
  bindStoreLifecycleHost,
  resetPlayerXpBatchFromEngine,
  resetStoreLifecycleHostForTests,
  type StoreLifecycleHost,
} from './storeLifecycleHost';

export {
  bindSceneTransitionBridge,
  requestSceneTransitionFromBridge,
  resetSceneTransitionBridgeForTests,
} from './sceneTransitionBridge';

export { emitAppEvent, onAppEvent, bindAppEventBus, resetAppEventBusForTests } from '@/shared/events/appEventBus';

export type { ApplicationEventMap, ApplicationEventName } from '@/shared/events/applicationEventMap';
