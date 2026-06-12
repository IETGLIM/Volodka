import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { openLinkedStory } from '@/engine/interaction/narrativeOpenHelpers';
import { getGameStore } from '@/store/gameStore';
import type { SceneId } from '@/shared/types/game';

export interface VolodkaE2EBridge {
  setPlayerPosition: (x: number, y: number, z: number) => void;
  interactTriggerZone: (zoneId: string) => void;
  /** Jump to a story node (localhost Playwright only). */
  visitStoryNode: (nodeId: string) => void;
  /** Skip Act I — open Act II entry beat with flags and act progression. */
  bootstrapAct2Entry: () => void;
}

declare global {
  interface Window {
    __volodka_e2e?: VolodkaE2EBridge;
  }
}

/** Localhost-only hook for Playwright — not registered on production hosts. */
export function registerVolodkaE2EBridge(): void {
  if (typeof window === 'undefined') return;

  const host = window.location.hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') return;

  window.__volodka_e2e = {
    setPlayerPosition(x, y, z) {
      getGameStore().setPlayerPosition([x, y, z]);
    },
    interactTriggerZone(zoneId) {
      const sceneId = getGameStore().exploration.currentSceneId as SceneId;
      eventBus.emit('object:interact', {
        objectId: zoneId,
        sceneId,
        triggerZoneId: zoneId,
      });
    },
    visitStoryNode(nodeId) {
      void openLinkedStory(nodeId);
    },
    bootstrapAct2Entry() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'act2_transition' });
      dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: 'act2_transition' });
      void openLinkedStory('act2_transition');
    },
  };
}
