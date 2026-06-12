import { ensureStoryNode } from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { openLinkedStory } from '@/engine/interaction/narrativeOpenHelpers';
import {
  getPlayerRigidBody,
  isPlayerRigidBodyValid,
} from '@/engine/PlayerRigidBodyState';
import { closeNarrativeOverlay, openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { resolveSceneSpawn } from '@/engine/scene/sceneTransition';
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
  visitStoryNode: (nodeId: string) => void;
  bootstrapAct2Entry: () => Promise<void>;
  bootstrapMidActOffice: () => Promise<void>;
  bootstrapStartDiagnosis: () => Promise<void>;
  bootstrapAct2AlbertHint: () => Promise<void>;
}

declare global {
  interface Window {
    __volodka_e2e?: VolodkaE2EBridge;
  }
}

async function jumpToStoryBeat(nodeId: string, sceneId: SceneId): Promise<void> {
  await ensureStoryNode(nodeId);
  const store = getGameStore();
  store.setIntroActive(false);
  store.setMainMenuOpen(false);
  closeNarrativeOverlay();
  dispatchGameAction({ type: 'story/visitNode', nodeId });
  dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId });
  dispatchGameAction({
    type: 'exploration/applySceneTransition',
    targetScene: sceneId,
    spawnAt: resolveSceneSpawn(sceneId),
  });
  openNarrativeOverlay(nodeId, 'story');
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
    async bootstrapAct2Entry() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      store.markCutsceneTriggered('act1_to_act2');
      await jumpToStoryBeat('act2_transition', 'street_night');
    },
    async bootstrapMidActOffice() {
      const store = getGameStore();
      store.setFlag('agreed_help_alexander', true);
      store.setFlag('going_to_cafe', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'office_alexander' });
      await jumpToStoryBeat('office_explore_mode', 'office_day');
    },
    async bootstrapStartDiagnosis() {
      const store = getGameStore();
      store.setFlag('agreed_help_alexander', true);
      store.setFlag('started_decryption', true);
      await jumpToStoryBeat('start_diagnosis', 'office_day');
    },
    async bootstrapAct2AlbertHint() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      await jumpToStoryBeat('act2_albert_hint', 'cafe_evening');
    },
  };
}
