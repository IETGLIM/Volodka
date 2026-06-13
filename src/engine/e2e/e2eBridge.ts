import { ensureStoryNode, getStoryNodes } from '@/data/gameDataLoader';
import { loadSceneExploreHubs } from '@/data/narrative/narrativePackRegistry';
import { getCutsceneForNode } from '@/data/cutscenes';
import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { openLinkedStory } from '@/engine/interaction/narrativeOpenHelpers';
import {
  getPlayerRigidBody,
  isPlayerRigidBodyValid,
} from '@/engine/PlayerRigidBodyState';
import { closeNarrativeOverlay, openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import { resolveSceneSpawn, requestSceneTransition } from '@/engine/scene/sceneTransition';
import { getGameStore, useGameStore } from '@/store/gameStore';
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
  visitStoryNode: (nodeId: string) => Promise<void>;
  forceStoryBeat: (nodeId: string, sceneId: SceneId) => Promise<void>;
  bootstrapAct2Entry: () => Promise<void>;
  bootstrapMidActOffice: () => Promise<void>;
  bootstrapStartDiagnosis: () => Promise<void>;
  bootstrapAct2AlbertHint: () => Promise<void>;
  bootstrapFixSuccess: () => Promise<void>;
  bootstrapAct2MariaMeeting: () => Promise<void>;
  bootstrapAct2DmitryOffice: () => Promise<void>;
  bootstrapAct2CafeSafehouse: () => Promise<void>;
  bootstrapAct2VaultGuildFragment: () => Promise<void>;
  bootstrapAct2PoetrySmugglingLibrary: () => Promise<void>;
  bootstrapAct2PierBasement: () => Promise<void>;
  bootstrapAct3ParkHub: () => Promise<void>;
  bootstrapAct3LibraryHub: () => Promise<void>;
  bootstrapAct4StreetWinterHub: () => Promise<void>;
  bootstrapAct4RooftopHub: () => Promise<void>;
  bootstrapAct5FactoryHub: () => Promise<void>;
  bootstrapAct6ChkHub: () => Promise<void>;
  bootstrapAct7LibraryHub: () => Promise<void>;
  bootstrapAct7DreamHub: () => Promise<void>;
  promoteClosedOverlayHub: (hubId: string, sceneId: SceneId) => Promise<void>;
  ensureStoryOverlay: (nodeId: string) => Promise<void>;
  isStoryOverlayReady: (expectedNodeId?: string) => boolean;
}

declare global {
  interface Window {
    __volodka_e2e?: VolodkaE2EBridge;
  }
}

async function waitForScene(sceneId: SceneId): Promise<void> {
  const deadline = Date.now() + 45_000;

  const sceneReady = () => getGameStore().exploration.currentSceneId === sceneId;

  if (sceneReady()) return;

  await new Promise<void>((resolve, reject) => {
    const unsub = eventBus.on('scene:loaded', (data) => {
      if (data.sceneId !== sceneId) return;
      unsub();
      resolve();
    });

    requestSceneTransition(sceneId, resolveSceneSpawn(sceneId));

    if (sceneReady()) {
      unsub();
      resolve();
      return;
    }

    const poll = () => {
      if (sceneReady()) {
        unsub();
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        unsub();
        reject(new Error(`[e2eBridge] waitForScene timeout for ${sceneId}`));
        return;
      }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  });
}

function suppressCutsceneForStoryNode(nodeId: string): void {
  const cutscene = getCutsceneForNode(nodeId);
  if (cutscene) {
    getGameStore().markCutsceneTriggered(cutscene.id);
  }
}

/** Mid-game e2e bootstraps skip Act I — don't let deferred first-play tutorial steal input. */
function dismissFirstPlayTutorialForBootstrap(): void {
  const { tutorialFlags } = getGameStore();
  useGameStore.setState({
    tutorialFlags: {
      ...tutorialFlags,
      tutorialsCompleted: true,
      tutorial_seen_movement: true,
      tutorial_seen_interact: true,
      tutorial_seen_controls: true,
    },
  });
}

async function waitForStoryOverlayReady(nodeId: string): Promise<boolean> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const store = getGameStore();
    if (
      store.showStoryOverlay &&
      store.currentNodeId === nodeId &&
      Boolean(getStoryNodes()[nodeId])
    ) {
      return true;
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
  return false;
}

async function jumpToStoryBeat(nodeId: string, sceneId: SceneId): Promise<void> {
  await ensureStoryNode(nodeId);
  const store = getGameStore();
  store.setIntroActive(false);
  store.setMainMenuOpen(false);
  dismissFirstPlayTutorialForBootstrap();
  closeNarrativeOverlay();
  if (store.activeCutsceneId) {
    store.setCutscene(null, []);
  }
  suppressCutsceneForStoryNode(nodeId);
  dispatchGameAction({ type: 'story/visitNode', nodeId });
  dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId });
  await waitForScene(sceneId);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  openNarrativeOverlay(nodeId, 'story');
  let ready = await waitForStoryOverlayReady(nodeId);
  if (!ready) {
    openNarrativeOverlay(nodeId, 'story');
    ready = await waitForStoryOverlayReady(nodeId);
  }
  if (!ready) {
    throw new Error(`[e2eBridge] story overlay not ready for ${nodeId}`);
  }
}

async function jumpToClosedOverlayHub(hubId: string, sceneId: SceneId): Promise<void> {
  await loadSceneExploreHubs();
  await ensureStoryNode(hubId);
  const store = getGameStore();
  store.setIntroActive(false);
  store.setMainMenuOpen(false);
  dismissFirstPlayTutorialForBootstrap();
  closeNarrativeOverlay();
  if (store.activeCutsceneId) {
    store.setCutscene(null, []);
  }
  await waitForScene(sceneId);
  enterSceneFreeExplorationHub(hubId);
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
      return openLinkedStory(nodeId).then(() => undefined);
    },
    forceStoryBeat(nodeId, sceneId) {
      return jumpToStoryBeat(nodeId, sceneId);
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
      await jumpToClosedOverlayHub('office_explore_mode', 'office_day');
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
    async bootstrapFixSuccess() {
      const store = getGameStore();
      store.setFlag('agreed_help_alexander', true);
      store.setFlag('started_decryption', true);
      store.markCutsceneTriggered('poem_revelation');
      await jumpToStoryBeat('fix_success', 'office_day');
    },
    async bootstrapAct2MariaMeeting() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      store.setFlag('maria_introduced', true);
      store.markCutsceneTriggered('act1_to_act2');
      await jumpToStoryBeat('act2_maria_meeting_place', 'street_night');
    },
    async bootstrapAct2DmitryOffice() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      store.setFlag('network_joined', true);
      store.setFlag('dmitry_meeting_agreed', true);
      store.setFlag('contacted_dmitry_network', true);
      store.markCutsceneTriggered('act1_to_act2');
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'office_alexander' });
      await jumpToClosedOverlayHub('office_explore_mode', 'office_day');
    },
    async bootstrapAct2CafeSafehouse() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      store.setFlag('network_joined', true);
      store.setFlag('vault_protect_vowed', true);
      store.markCutsceneTriggered('act1_to_act2');
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'cafe_enter' });
      await jumpToClosedOverlayHub('cafe_explore_mode', 'cafe_evening');
    },
    async bootstrapAct2VaultGuildFragment() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      store.setFlag('network_joined', true);
      store.setFlag('vault_access_granted', true);
      store.setFlag('vault_protect_vowed', true);
      store.markCutsceneTriggered('act1_to_act2');
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'office_alexander' });
      await jumpToClosedOverlayHub('office_explore_mode', 'office_day');
    },
    async bootstrapAct2PoetrySmugglingLibrary() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      store.setFlag('cafe_safehouse_established', true);
      store.markCutsceneTriggered('act1_to_act2');
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'library_entrance' });
      await jumpToClosedOverlayHub('library_explore_mode', 'library_day');
    },
    async bootstrapAct2PierBasement() {
      const store = getGameStore();
      if (store.playerState.progression.currentAct < 2) {
        store.advanceAct();
      }
      store.setFlag('act2_started', true);
      store.setFlag('advanced_to_act2', true);
      store.setFlag('visited_river_pier', true);
      store.setFlag('pier_portwine_taken', true);
      store.markCutsceneTriggered('act1_to_act2');
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'pier_arrival' });
      await jumpToClosedOverlayHub('pier_explore_mode', 'river_pier');
    },
    async bootstrapAct3ParkHub() {
      while (getGameStore().playerState.progression.currentAct < 3) {
        getGameStore().advanceAct();
      }
      const store = getGameStore();
      store.setFlag('act3_started', true);
      store.setFlag('advanced_to_act3', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'park_entrance' });
      await jumpToClosedOverlayHub('park_explore_mode', 'park_day');
    },
    async bootstrapAct3LibraryHub() {
      while (getGameStore().playerState.progression.currentAct < 3) {
        getGameStore().advanceAct();
      }
      const store = getGameStore();
      store.setFlag('act3_started', true);
      store.setFlag('advanced_to_act3', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'library_entrance' });
      await jumpToClosedOverlayHub('library_explore_mode', 'library_day');
    },
    async bootstrapAct4StreetWinterHub() {
      while (getGameStore().playerState.progression.currentAct < 4) {
        getGameStore().advanceAct();
      }
      const store = getGameStore();
      store.setFlag('act4_started', true);
      store.setFlag('public_speech_done', true);
      await jumpToClosedOverlayHub('street_winter_explore_mode', 'street_winter');
    },
    async bootstrapAct4RooftopHub() {
      while (getGameStore().playerState.progression.currentAct < 4) {
        getGameStore().advanceAct();
      }
      const store = getGameStore();
      store.setFlag('act4_started', true);
      store.setFlag('broadcast_ready', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'act4_rooftop_broadcast' });
      await jumpToClosedOverlayHub('rooftop_explore_mode', 'rooftop_edge');
    },
    async bootstrapAct5FactoryHub() {
      while (getGameStore().playerState.progression.currentAct < 5) {
        getGameStore().advanceAct();
      }
      const store = getGameStore();
      store.setFlag('act5_started', true);
      store.setFlag('factory_unlocked', true);
      store.setFlag('basement_key_found', true);
      store.setFlag('entered_factory_basement', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'abandoned_workshop' });
      await jumpToClosedOverlayHub('factory_explore_mode', 'abandoned_factory');
    },
    async bootstrapAct6ChkHub() {
      while (getGameStore().playerState.progression.currentAct < 6) {
        getGameStore().advanceAct();
      }
      const store = getGameStore();
      store.setFlag('act5_started', true);
      store.setFlag('act6_started', true);
      store.setFlag('chk_forest_unlocked', true);
      store.setFlag('tolpa_act5_blessing', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'chk_act5_campfire_dawn' });
      await jumpToClosedOverlayHub('chk_explore_mode', 'chk_forest_zorge');
    },
    async bootstrapAct7LibraryHub() {
      while (getGameStore().playerState.progression.currentAct < 7) {
        getGameStore().advanceAct();
      }
      const store = getGameStore();
      store.setFlag('act7_started', true);
      store.setFlag('new_council_elected', true);
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'act7_charter_drafting' });
      await jumpToClosedOverlayHub('library_explore_mode', 'library_day');
    },
    async bootstrapAct7DreamHub() {
      while (getGameStore().playerState.progression.currentAct < 7) {
        getGameStore().advanceAct();
      }
      const store = getGameStore();
      store.setFlag('act7_started', true);
      store.setFlag('dream_poem_seen', false);
      await jumpToClosedOverlayHub('dream_explore_mode', 'sleep_dream');
    },
    async promoteClosedOverlayHub(hubId, sceneId) {
      await jumpToClosedOverlayHub(hubId, sceneId);
    },
    async ensureStoryOverlay(nodeId) {
      await ensureStoryNode(nodeId);
      const storyNode = getStoryNodes()[nodeId];
      if (!storyNode?.sceneId) {
        throw new Error(`[e2eBridge] ensureStoryOverlay: missing scene for ${nodeId}`);
      }
      await jumpToStoryBeat(nodeId, storyNode.sceneId as SceneId);
    },
    isStoryOverlayReady(expectedNodeId) {
      const store = getGameStore();
      if (!store.showStoryOverlay) return false;
      if (expectedNodeId && store.currentNodeId !== expectedNodeId) return false;
      return Boolean(getStoryNodes()[store.currentNodeId]);
    },
  };
}
