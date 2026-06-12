import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { openLinkedStory } from '@/engine/interaction/narrativeOpenHelpers';
import {
  getPlayerRigidBody,
  isPlayerRigidBodyValid,
} from '@/engine/PlayerRigidBodyState';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { getGameStore } from '@/store/gameStore';
import type { SceneId } from '@/shared/types/game';

export interface VolodkaE2EPosition {
  x: number;
  y: number;
  z: number;
}

export interface VolodkaE2EBridge {
  setPlayerPosition: (x: number, y: number, z: number) => void;
  getPlayerPosition: () => VolodkaE2EPosition;
  interactTriggerZone: (zoneId: string) => void;
  /** Jump to a story node (localhost Playwright only). */
  visitStoryNode: (nodeId: string) => void;
  /** Skip Act I — open Act II entry beat with flags and act progression. */
  bootstrapAct2Entry: () => void;
  /** Mid–Act I office hub — diagnosis golden path (localhost Playwright only). */
  bootstrapMidActOffice: () => void;
}

declare global {
  interface Window {
    __volodka_e2e?: VolodkaE2EBridge;
  }
}

function whenSceneLoaded(sceneId: SceneId, onReady: () => void): void {
  const store = getGameStore();
  if (store.exploration.currentSceneId === sceneId) {
    onReady();
    return;
  }

  const unsub = eventBus.on('scene:loaded', (data) => {
    if (data.sceneId !== sceneId) return;
    unsub();
    onReady();
  });
  requestSceneTransition(sceneId);
}

/** Localhost-only hook for Playwright — not registered on production hosts. */
export function registerVolodkaE2EBridge(): void {
  if (typeof window === 'undefined') return;

  const host = window.location.hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') return;

  window.__volodka_e2e = {
    setPlayerPosition(x, y, z) {
      getGameStore().setPlayerPosition([x, y, z]);
      const rb = getPlayerRigidBody();
      if (isPlayerRigidBodyValid(rb)) {
        rb!.setTranslation({ x, y, z }, true);
      }
    },
    getPlayerPosition() {
      const rb = getPlayerRigidBody();
      if (isPlayerRigidBodyValid(rb)) {
        const t = rb!.translation();
        return { x: t.x, y: t.y, z: t.z };
      }
      const [px, py, pz] = getGameStore().exploration.playerPosition;
      return { x: px, y: py, z: pz };
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
      store.setIntroActive(false);
      store.setMainMenuOpen(false);
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      store.markCutsceneTriggered('act1_to_act2');
      closeNarrativeOverlay();
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'act2_transition' });
      dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: 'act2_transition' });
      whenSceneLoaded('street_night', () => {
        void openLinkedStory('act2_transition');
      });
    },
    bootstrapMidActOffice() {
      const store = getGameStore();
      store.setIntroActive(false);
      store.setMainMenuOpen(false);
      closeNarrativeOverlay();
      store.setFlag('agreed_help_alexander', true);
      store.setFlag('going_to_cafe', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'office_alexander' });
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'office_explore_mode' });
      dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: 'office_explore_mode' });
      whenSceneLoaded('office_day', () => {
        void openLinkedStory('office_explore_mode');
      });
    },
  };
}
