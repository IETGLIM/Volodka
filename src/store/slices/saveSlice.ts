/* ─── Volodka RPG – Save Slice ─── */
/* Save/load/reset orchestration across independent slice stores. */

import type { StateCreator } from 'zustand';
import { emitAppEvent } from '@/shared/events/appEventBus';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import type { GameStoreState } from '../types';
import {
  createDefaultResetState,
  pickSavePayload,
  storePatchFromSave,
} from '../persistedState';
import { applyCombinedPatch } from '../patchState';
import { getCombinedGameState } from '../storeBindings';
import { resetGuidedStoryFromStore, resetEngineRuntimeFromStore } from '../storeEngineHost';
import { resetPlayerXpBatch } from '../playerXpBatch';
import { clearAutoCloseTimers } from '@/shared/explorationAutoCloseTimers';
import { resolveSaveFromStorage, writeSaveToLocalStorage } from './saveStorage';

export interface SaveSliceState {
  // lastSaveTimestamp lives in UISlice, not here — but save actions need it
}

export interface SaveSliceActions {
  resetGame: () => void;
  saveGame: (options?: { source?: 'auto' | 'manual' }) => void;
  loadGame: () => void;
}

export type SaveSlice = SaveSliceState & SaveSliceActions;

export const createSaveSlice: StateCreator<GameStoreState, [], [], SaveSlice> = () => ({
  resetGame: () => {
    resetPlayerXpBatch();
    dispatchGameAction({ type: 'poem/clearAllEffects' });
    clearAutoCloseTimers();
    applyCombinedPatch(createDefaultResetState());
    resetGuidedStoryFromStore();
    resetEngineRuntimeFromStore();
  },

  saveGame: (options) => {
    const state = getCombinedGameState();
    const source = options?.source ?? 'manual';
    const payload = pickSavePayload(state);
    const payloadWithVersion = { ...payload, saveVersion: SAVE_VERSION };

    let json: string;
    try {
      json = JSON.stringify(payloadWithVersion);
    } catch (err) {
      console.error('[saveGame] Failed to serialize save payload:', err);
      emitAppEvent('game:system_alert', {
        kind: 'save_failed',
        message: 'Не удалось подготовить данные сохранения.',
      });
      return;
    }

    try {
      if (!writeSaveToLocalStorage(json)) {
        emitAppEvent('game:system_alert', {
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
      emitAppEvent('game:saved', { timestamp, source });
    } catch {
      console.error('[saveGame] Failed to write save to localStorage');
      emitAppEvent('game:system_alert', {
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
          emitAppEvent('game:system_alert', {
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
      applyCombinedPatch(storePatchFromSave(resolved.data));
      resetGuidedStoryManager();
      resetEngineModuleRuntimeState();

      if (resolved.status === 'recovered-from-backup') {
        emitAppEvent('game:system_alert', {
          kind: 'load_recovered',
          message: 'Основное сохранение повреждено — загружена резервная копия.',
        });
      }

      emitAppEvent('game:loaded', {} as Record<string, never>);
    } catch (err) {
      console.error('[loadGame] Unexpected error:', err);
      emitAppEvent('game:system_alert', {
        kind: 'load_failed',
        message: 'Ошибка загрузки сохранения.',
      });
    }
  },
});
