/* ─── Volodka RPG – Save Slice ─── */
/* Save/load/reset orchestration across independent slice stores. */

import type { StateCreator } from 'zustand';
import {
  emitGameLoaded,
  emitGameSaved,
  emitGameSystemAlert,
  emitPlaythroughReset,
} from '../storeEffects';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import type { GameStoreState } from '../types';
import {
  captureNewPlaythroughCarry,
  createNewPlaythroughResetPatch,
  pickSavePayload,
  storePatchFromSave,
  type NewPlaythroughResetOptions,
} from '../persistedState';
import { applyCombinedPatch } from '../patchState';
import { getCombinedGameState, invalidateCombinedGameStateCache } from '../storeBindings';
import { resetGuidedStoryFromStore, resetEngineRuntimeFromStore } from '../storeEngineHost';
import { resetPlayerXpBatch } from '../playerXpBatch';
import { clearAutoCloseTimers } from '@/shared/explorationAutoCloseTimers';
import { resolveSaveFromStorage, writeSaveToLocalStorage } from './saveStorage';
import { isInteractionLockedFromStore, resetSceneLoadedGateFromStore } from '../storeEngineHost';

export interface SaveSliceState {
  // lastSaveTimestamp lives in UISlice, not here — but save actions need it
}

export interface SaveSliceActions {
  resetGame: () => void;
  resetForNewPlaythrough: (options?: NewPlaythroughResetOptions) => void;
  saveGame: (options?: { source?: 'auto' | 'manual' }) => void;
  loadGame: () => void;
}

export type SaveSlice = SaveSliceState & SaveSliceActions;

function executeNewPlaythroughReset(options: NewPlaythroughResetOptions = {}): void {
  const preserveAchievements = options.preserveAchievements !== false;
  const carry = preserveAchievements
    ? captureNewPlaythroughCarry(getCombinedGameState(), { preserveAchievements })
    : null;

  resetPlayerXpBatch();
  dispatchGameAction({ type: 'poem/clearAllEffects' });
  clearAutoCloseTimers();
  // Cancel any in-flight scene:loaded from the menu canvas stay-mounted path,
  // then notify React gates (useSceneLoadedGate) so same-scene New Game does
  // not keep loaded=true from the pre-menu preload through the wake cinematic.
  resetSceneLoadedGateFromStore();
  applyCombinedPatch(createNewPlaythroughResetPatch(carry, options));
  invalidateCombinedGameStateCache();
  resetGuidedStoryFromStore();
  resetEngineRuntimeFromStore();
  emitPlaythroughReset();
}

export const createSaveSlice: StateCreator<GameStoreState, [], [], SaveSlice> = () => ({
  resetGame: () => {
    // Always skip cold-boot matrix intro — New Game is chosen from the menu.
    executeNewPlaythroughReset({ skipIntro: true });
  },

  resetForNewPlaythrough: (options) => {
    executeNewPlaythroughReset({ skipIntro: true, ...options });
  },

  saveGame: (options) => {
    // Defense-in-depth: don't save during cutscenes, combat, or NPC interaction.
    // The autosave system already guards by phase, but manual saves (F5) or
    // programmatic saves could slip through.
    //
    // Cutscene: activeCutsceneId is not persisted — a mid-cutscene save would
    //   leave the player in a clean but confusing state on load.
    // Combat: combat runtime state (enemies, turns, HP) is never persisted.
    //   Saving combatActive=true without runtime state creates an unrecoverable
    //   stuck state on load where the UI thinks combat is active but no combat
    //   system is running.
    // Interaction: interaction session is module-level (not persisted). A
    //   mid-approach save leaves the player positioned at the NPC with no
    //   active interaction — confusing but not game-breaking.
    const state = getCombinedGameState();
    if (state.activeCutsceneId) {
      console.warn('[saveGame] Skipping save during cutscene');
      return;
    }
    if (state.combatActive) {
      console.warn('[saveGame] Skipping save during combat');
      return;
    }
    if (isInteractionLockedFromStore()) {
      console.warn('[saveGame] Skipping save during NPC interaction');
      return;
    }
    const source = options?.source ?? 'manual';
    const payload = pickSavePayload(state);
    const payloadWithVersion = { ...payload, saveVersion: SAVE_VERSION };

    let json: string;
    try {
      json = JSON.stringify(payloadWithVersion);
    } catch (err) {
      console.error('[saveGame] Failed to serialize save payload:', err);
      emitGameSystemAlert({
        kind: 'save_failed',
        message: 'Не удалось подготовить данные сохранения.',
      });
      return;
    }

    try {
      if (!writeSaveToLocalStorage(json)) {
        emitGameSystemAlert({
          kind: 'save_failed',
          message: 'Нет доступа к локальному хранилищу.',
        });
        return;
      }

      const timestamp = Date.now();
      applyCombinedPatch({
        lastSaveTimestamp: timestamp,
        ...(source === 'auto' ? { lastAutoSaveTimestamp: timestamp } : {}),
      });
      emitGameSaved(timestamp, source);
    } catch {
      console.error('[saveGame] Failed to write save to localStorage');
      emitGameSystemAlert({
        kind: 'save_failed',
        message: 'Запись сохранения прервана.',
      });
    }
  },

  loadGame: () => {
    try {
      const resolved = resolveSaveFromStorage();

      switch (resolved.status) {
        case 'empty':
          return;

        case 'corrupt':
          console.error(
            '[loadGame] Save validation failed:',
            resolved.primaryError,
            '| Backup also unusable:',
            resolved.backupError,
          );
          emitGameSystemAlert({
            kind: 'load_failed',
            message: resolved.primaryError,
          });
          return;

        case 'recovered-from-backup':
          console.warn(
            '[loadGame] Primary save corrupt, restored from backup:',
            resolved.primaryError,
          );
          break;

        case 'ok':
          break;

        default: {
          const _exhaustive: never = resolved;
          return _exhaustive;
        }
      }

      clearAutoCloseTimers();
      resetPlayerXpBatch();
      // Cancel any in-flight scene:loaded payload from a transition that was
      // running when the player loaded a save. Without this, the stale
      // payload fires for the OLD target scene after the save's scene is
      // already active — useSceneLoadedGate waits 3s fallback, the scene
      // entry overlay shows the wrong scene name, and asyncTransitionInProgress
      // stays true. (Task 3-B #3.)
      resetSceneLoadedGateFromStore();
      applyCombinedPatch(storePatchFromSave(resolved.data));
      resetGuidedStoryFromStore();
      resetEngineRuntimeFromStore();

      if (resolved.status === 'recovered-from-backup') {
        emitGameSystemAlert({
          kind: 'load_recovered',
          message: 'Основное сохранение повреждено — загружена резервная копия.',
        });
      }

      emitGameLoaded();
    } catch (err) {
      console.error('[loadGame] Unexpected error:', err);
      emitGameSystemAlert({
        kind: 'load_failed',
        message: 'Ошибка загрузки сохранения.',
      });
    }
  },
});