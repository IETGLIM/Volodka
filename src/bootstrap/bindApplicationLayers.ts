/**
 * Bootstrap wiring — binds store↔engine host callbacks once at app startup.
 * Import from main entry so module init order is explicit (not via slice imports).
 */

import { bindStoreEngineHost } from '@/store/storeEngineHost';
import { bindStoreSubscribeProfiler } from '@/store/dev/storeSubscribeProfiler';
import { bindStoreLifecycleHost } from '@/shared/gameBridge/storeLifecycleHost';
import { resetPlayerXpBatch } from '@/store/playerXpBatch';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { resetGuidedStoryManager, canStartQuest } from '@/engine/GuidedStoryManager';
import { resetEngineModuleRuntimeState } from '@/engine/engineRuntimeReset';
import { bindStoreMusicEvents } from '@/engine/audio/bindStoreMusicEvents';
import { registerDifficultySliceMultiplierGetter } from '@/engine/combat/combatDifficulty';
import { getDifficultyStore } from '@/store/storeBindings';
import { eventBus } from '@/engine/EventBus';
import { bindAppEventBus, resetAppEventBusForTests } from '@/shared/events/appEventBus';
import { registerRelationMilestoneBridge } from '@/engine/npc/npcRelationMilestones';
import { bindSceneTransitionBridge, resetSceneTransitionBridgeForTests } from '@/shared/gameBridge/sceneTransitionBridge';
import { wrapStoreSubscribe } from '@/engine/frame/frameProfilerCounters';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { cancelPendingSceneLoaded } from '@/engine/core/sceneLoadedGate';

let bound = false;

export function bindApplicationLayers(): void {
  if (bound) return;
  bound = true;

  bindStoreEngineHost({
    requestSceneTransition,
    resetGuidedStoryManager,
    resetEngineModuleRuntimeState,
    canStartQuest,
    isInteractionLocked,
    resetSceneLoadedGate: cancelPendingSceneLoaded,
  });

  bindStoreLifecycleHost({ resetPlayerXpBatch });
  bindStoreSubscribeProfiler(wrapStoreSubscribe);
  bindSceneTransitionBridge(requestSceneTransition);

  bindAppEventBus({
    emit: (event, payload) => {
      eventBus.emit(event, payload as never);
    },
    on: (event, handler) => eventBus.on(event, handler as never),
  });

  bindStoreMusicEvents();

  // Wire store→engine milestone bridge: the store emits
  // `store:npc_relation_changed` via appEventBus; the engine listens and runs
  // `checkRelationMilestones` to emit `npc:relation_milestone` for any
  // threshold crossed. Kept out of the store to keep `@/engine/**` imports
  // out of store slices.
  registerRelationMilestoneBridge();

  // Wire the user-facing 5-level difficulty (difficultySlice) into the combat
  // damage scaler so the player's chosen difficulty affects ALL enemy damage
  // (basic attacks AND boss specials). Previously boss specials bypassed it.
  registerDifficultySliceMultiplierGetter(
    () => getDifficultyStore().difficultySettings.enemyDamageMultiplier,
  );
}

/** Test helper — allow re-bind between cases. */
export function resetApplicationLayerBindingsForTests(): void {
  bound = false;
  // Unregister the difficulty multiplier getter so unit tests of
  // scaleEnemyDamageByDifficulty fall back to the safe default (1.0) instead of
  // reading a possibly-unbound difficulty store.
  registerDifficultySliceMultiplierGetter(null);
  resetAppEventBusForTests();
  resetSceneTransitionBridgeForTests();
}
