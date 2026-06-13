/* ─── Volodka RPG – Save Slice ─── */
/* Save/load/reset orchestration across independent slice stores. */

import type { StateCreator } from 'zustand';
import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import type { GameStoreState } from '../types';
import {
  createDefaultResetState,
  pickSavePayload,
  storePatchFromSave,
} from '../persistedState';
import { applyCombinedPatch } from '../patchState';
import { getCombinedGameState } from '../storeBindings';
import { resetGuidedStoryManager } from '@/engine/GuidedStoryManager';
import { resetCinematicPresentation } from '@/engine/camera/cinematicPresentation';
import { cancelEncounterPresentation } from '@/engine/combat/encounterPresentation';
import { clearAutoCloseTimers } from './explorationSlice';
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
    dispatchGameAction({ type: 'poem/clearAllEffects' });
    clearAutoCloseTimers();
    applyCombinedPatch(createDefaultResetState());
    resetGuidedStoryManager();
    resetCinematicPresentation();
    cancelEncounterPresentation();
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
      eventBus.emit('game:system_alert', {
        kind: 'save_failed',
        message: 'Не удалось подготовить данные сохранения.',
      });
      return;
    }

    try {
      if (!writeSaveToLocalStorage(json)) {
        eventBus.emit('game:system_alert', {
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
      eventBus.emit('game:saved', { timestamp, source });
    } catch {
      console.error('[saveGame] Failed to write save to localStorage');
      eventBus.emit('game:system_alert', {
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
          eventBus.emit('game:system_alert', {
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
      applyCombinedPatch(storePatchFromSave(resolved.data));
      resetGuidedStoryManager();
      resetCinematicPresentation();
      cancelEncounterPresentation();

      if (resolved.status === 'recovered-from-backup') {
        eventBus.emit('game:system_alert', {
          kind: 'load_recovered',
          message: 'Основное сохранение повреждено — загружена резервная копия.',
        });
      }

      eventBus.emit('game:loaded', {} as Record<string, never>);
    } catch (err) {
      console.error('[loadGame] Unexpected error:', err);
      eventBus.emit('game:system_alert', {
        kind: 'load_failed',
        message: 'Ошибка загрузки сохранения.',
      });
    }
  },
});
