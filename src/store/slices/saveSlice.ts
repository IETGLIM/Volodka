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

import { devWarn } from '@/shared/utils/devLog';
export interface SaveSliceState {
  // lastSaveTimestamp lives in UISlice, not here — but save actions need it
}

/* ─── Типизированные результаты (v4.8.6) ───
 * Раньше saveGame/loadGame возвращали void, и вызывающие (F5/F9, меню паузы,
 * мобильный HUD) не могли понять, сохранилось ли что-то на самом деле:
 * F5 показывал «Игра сохранена» даже когда saveGame молча пропускал запись
 * (кат-сцена/бой/диалог) или падал. Теперь действие возвращает исход, а
 * engine/save/quickSaveLoad.ts превращает его в честный русский тост.
 * Существующие вызовы, игнорирующие результат, не ломаются. */
export type SaveGameOutcome =
  | { status: 'saved'; timestamp: number }
  | { status: 'skipped'; reason: 'cutscene' | 'combat' | 'interaction' }
  | { status: 'failed'; reason: 'serialize' | 'storage_unavailable' | 'write' };

export type LoadGameOutcome =
  | { status: 'loaded'; recoveredFromBackup: boolean }
  | { status: 'empty' }
  | { status: 'failed'; reason: 'corrupt' | 'unexpected' };

export interface SaveSliceActions {
  resetGame: () => void;
  resetForNewPlaythrough: (options?: NewPlaythroughResetOptions) => void;
  saveGame: (options?: { source?: 'auto' | 'manual' }) => SaveGameOutcome;
  loadGame: () => LoadGameOutcome;
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
      devWarn('[saveGame] Skipping save during cutscene');
      return { status: 'skipped', reason: 'cutscene' } as const;
    }
    if (state.combatActive) {
      devWarn('[saveGame] Skipping save during combat');
      return { status: 'skipped', reason: 'combat' } as const;
    }
    if (isInteractionLockedFromStore()) {
      devWarn('[saveGame] Skipping save during NPC interaction');
      return { status: 'skipped', reason: 'interaction' } as const;
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
      return { status: 'failed', reason: 'serialize' } as const;
    }

    try {
      if (!writeSaveToLocalStorage(json)) {
        emitGameSystemAlert({
          kind: 'save_failed',
          message: 'Нет доступа к локальному хранилищу.',
        });
        return { status: 'failed', reason: 'storage_unavailable' } as const;
      }

      const timestamp = Date.now();
      applyCombinedPatch({
        lastSaveTimestamp: timestamp,
        ...(source === 'auto' ? { lastAutoSaveTimestamp: timestamp } : {}),
      });
      emitGameSaved(timestamp, source);
      return { status: 'saved', timestamp } as const;
    } catch {
      console.error('[saveGame] Failed to write save to localStorage');
      emitGameSystemAlert({
        kind: 'save_failed',
        message: 'Запись сохранения прервана.',
      });
      return { status: 'failed', reason: 'write' } as const;
    }
  },

  loadGame: () => {
    try {
      const resolved = resolveSaveFromStorage();

      switch (resolved.status) {
        case 'empty':
          return { status: 'empty' } as const;

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
          return { status: 'failed', reason: 'corrupt' } as const;

        case 'recovered-from-backup':
          devWarn(
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

      const recoveredFromBackup = resolved.status === 'recovered-from-backup';
      if (recoveredFromBackup) {
        emitGameSystemAlert({
          kind: 'load_recovered',
          message: 'Основное сохранение повреждено — загружена резервная копия.',
        });
      }

      emitGameLoaded();
      return { status: 'loaded', recoveredFromBackup } as const;
    } catch (err) {
      console.error('[loadGame] Unexpected error:', err);
      emitGameSystemAlert({
        kind: 'load_failed',
        message: 'Ошибка загрузки сохранения.',
      });
      return { status: 'failed', reason: 'unexpected' } as const;
    }
  },
});