/* ─── E2E test bridge — active when localStorage volodka_e2e=1 ─── */

import { getGameStore } from '@/store/gameStore';
import { SCENE_CONFIG } from '@/config/scenes';
import { createInventoryItem } from '@/data/gameDataLoader';
import type { SceneId } from '@/shared/types/game';
import type { EnemyType } from '@/engine/combat/types';
import { validateSaveData } from '@/shared/validation/saveSchema';
import { readGamePhase } from '@/shared/gamePhase';
import {
  disposeCombatSystem,
  getCombatState,
  playerFlee,
  startCombat,
} from '@/engine/CombatSystem';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { eventBus } from '@/engine/EventBus';

export interface VolodkaE2EBridge {
  getState: typeof getGameStore;
  getGamePhase: () => ReturnType<typeof readGamePhase>;
  skipToExploration: () => void;
  dismissOverlays: () => void;
  startCombat: (enemyType?: EnemyType) => void;
  fleeCombat: () => ReturnType<typeof playerFlee>;
  getCombatState: typeof getCombatState;
  transitionScene: (sceneId: SceneId) => void;
  saveToSlot: (slot: number) => void;
  loadFromSlot: (slot: number) => boolean;
  addInventoryItem: (itemId: string, quantity?: number) => void;
  completeQuest: (questId: string) => void;
}

declare global {
  interface Window {
    __volodkaE2E?: VolodkaE2EBridge;
  }
}

function dismissOverlays(): void {
  eventBus.emit('e2e:dismiss_overlays', {});
}

function skipToExploration(): void {
  const apply = (): void => {
    const store = getGameStore();
    store.setMainMenuOpen(false);
    store.setIntroActive(false);
    store.setIntroSeen(true);
    store.setCombatActive(false);
    store.setCutscene(null);
    store.closeNarrativeOverlay();
    store.setShowStoryOverlay(false);
    store.setNarrativeKind(null);
    store.setCurrentNodeId('start');

    dismissOverlays();
  };

  apply();
  // MenuScreen enables intro ~800ms after New Game; re-apply after that handler.
  setTimeout(apply, 100);
  setTimeout(apply, 500);
  setTimeout(apply, 900);
  setTimeout(apply, 1200);
}

function transitionScene(sceneId: SceneId): void {
  const config = SCENE_CONFIG[sceneId];
  if (!config) throw new Error(`Unknown scene: ${sceneId}`);
  requestSceneTransition(sceneId, config.spawnPoint as [number, number, number]);
}

function getSaveSlotKey(slot: number): string {
  return `volodka_save_slot_${slot}`;
}

function saveToSlot(slot: number): void {
  const store = getGameStore();
  store.saveGame({ source: 'manual' });
  const raw = localStorage.getItem('volodka_save');
  if (!raw) throw new Error('saveGame did not write volodka_save');

  const validation = validateSaveData(raw);
  if (!validation.success) throw new Error(validation.error);

  localStorage.setItem(
    getSaveSlotKey(slot),
    JSON.stringify({ ...validation.data, savedAt: Date.now() }),
  );
}

function loadFromSlot(slot: number): boolean {
  const raw = localStorage.getItem(getSaveSlotKey(slot));
  if (!raw) return false;

  const validation = validateSaveData(raw);
  if (!validation.success) return false;

  localStorage.setItem('volodka_save', raw);
  getGameStore().loadGame();
  return true;
}

function addInventoryItem(itemId: string, quantity = 1): void {
  const item = createInventoryItem(itemId, quantity);
  if (!item) throw new Error(`Unknown item: ${itemId}`);
  getGameStore().addItem(item);
}

function completeQuest(questId: string): void {
  getGameStore().completeQuest(questId);
}

function fleeCombatForced(): ReturnType<typeof playerFlee> {
  const savedRandom = Math.random;
  Math.random = () => 0;
  try {
    return playerFlee();
  } finally {
    Math.random = savedRandom;
  }
}

/** Expose store/combat/scene helpers for Playwright when volodka_e2e=1. */
export function installE2eTestBridge(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('volodka_e2e') !== '1') return;

  window.__volodkaE2E = {
    getState: getGameStore,
    getGamePhase: () => readGamePhase(getGameStore()),
    skipToExploration,
    dismissOverlays,
    startCombat: (enemyType: EnemyType = 'system_daemon') => {
      disposeCombatSystem();
      startCombat(enemyType);
      const store = getGameStore();
      store.setCombatActive(true);
      store.syncCombatSessionFromEngine();
    },
    fleeCombat: fleeCombatForced,
    getCombatState,
    transitionScene,
    saveToSlot,
    loadFromSlot,
    addInventoryItem,
    completeQuest,
  };
}
