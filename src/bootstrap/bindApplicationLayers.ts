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
import { eventBus } from '@/engine/EventBus';
import { bindAppEventBus, resetAppEventBusForTests } from '@/shared/events/appEventBus';
import { bindSceneTransitionBridge, resetSceneTransitionBridgeForTests } from '@/shared/gameBridge/sceneTransitionBridge';
import { wrapStoreSubscribe } from '@/engine/frame/frameProfilerCounters';

let bound = false;

export function bindApplicationLayers(): void {
  if (bound) return;
  bound = true;

  bindStoreEngineHost({
    requestSceneTransition,
    resetGuidedStoryManager,
    resetEngineModuleRuntimeState,
    canStartQuest,
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
}

/** Test helper — allow re-bind between cases. */
export function resetApplicationLayerBindingsForTests(): void {
  bound = false;
  resetAppEventBusForTests();
  resetSceneTransitionBridgeForTests();
}
