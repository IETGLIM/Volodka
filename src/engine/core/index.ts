export {
  registerGlobalCleanup,
  runGlobalCleanup,
  runGlobalSceneUnload,
  runGlobalCombatEnd,
  runGlobalUnmountCleanup,
  resetGlobalCleanupRegistry,
  type GlobalCleanupContext,
  type GlobalCleanupHandler,
  type GlobalCleanupReason,
} from './GlobalCleanupService';

export {
  isSceneTransitionInProgress,
  performSceneTransition,
  resetSceneTransitionGuard,
  type SceneTransitionPayload,
} from './SceneTransitionManager';

export {
  clearDeferredCombatStart,
  flushDeferredCombatStart,
  resetCombatStartGate,
} from './combatStartGate';
