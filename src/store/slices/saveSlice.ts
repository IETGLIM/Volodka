/* ─── Volodka RPG – Save Slice ─── */
/* Save/load/reset game state. This slice has cross-cutting access
 * to the full store state for building save payloads and restoring
 * data across all slices. */

import type { StateCreator } from 'zustand';
import { eventBus, EMPTY_EVENT_PAYLOAD } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import { pushNotification } from '../shared';
import type { GameStoreState } from '../types';
import { readWorldFromPlayer } from '../crossSliceReads';
import {
  createDefaultResetState,
  pickSavePayload,
  storePatchFromSave,
} from '../persistedState';
import { resetGuidedStoryManager } from '@/engine/GuidedStoryManager';
import { resetCinematicPresentation } from '@/engine/camera/cinematicPresentation';
import { clearAutoCloseTimers } from './explorationSlice';
import { resolveSaveFromStorage, writeSaveToLocalStorage } from './saveStorage';

/* ─── Slice types ─── */

 
export interface SaveSliceState {
  // lastSaveTimestamp lives in UISlice, not here — but save actions need it
}

export interface SaveSliceActions {
  resetGame: () => void;
  saveGame: (options?: { source?: 'auto' | 'manual' }) => void;
  loadGame: () => void;
}

export type SaveSlice = SaveSliceState & SaveSliceActions;

/* ─── Slice creator ─── */

export const createSaveSlice: StateCreator<
  GameStoreState,
  [],
  [],
  SaveSlice
> = (set, get) => ({
  /* ── No additional state — lastSaveTimestamp is in UISlice ── */

  resetGame: () => {
    // Clear module-scoped poem effects (activeEffects array + TTL flags)
    dispatchGameAction({ type: 'poem/clearAllEffects' });
    // Clear module-scoped interactive-object auto-close timers
    clearAutoCloseTimers();

    set(createDefaultResetState());
    resetGuidedStoryManager();
    resetCinematicPresentation();
  },

  saveGame: (options) => {
    const state = get();
    const source = options?.source ?? 'manual';

    const payload = pickSavePayload(state);
    const payloadWithVersion = { ...payload, saveVersion: SAVE_VERSION };

    let json: string;
    try {
      json = JSON.stringify(payloadWithVersion);
    } catch (err) {
      console.error('[saveGame] Failed to serialize save payload:', err);
      set({
        notifications: pushNotification(
          readWorldFromPlayer(get()).notifications,
          'quest',
          'Ошибка сохранения',
        ),
      });
      return;
    }

    try {
      if (!writeSaveToLocalStorage(json)) {
        set({
          notifications: pushNotification(
            readWorldFromPlayer(get()).notifications,
            'quest',
            'Ошибка сохранения',
          ),
        });
        return;
      }

      const timestamp = Date.now();

      set({
        lastSaveTimestamp: timestamp,
        ...(source === 'auto' ? { lastAutoSaveTimestamp: timestamp } : {}),
      });

      eventBus.emit('game:saved', { timestamp, source });
    } catch {
      // localStorage might be full or unavailable
      console.error('[saveGame] Failed to write save to localStorage');
      set({
        notifications: pushNotification(
          readWorldFromPlayer(get()).notifications,
          'quest',
          'Ошибка сохранения',
        ),
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
          // Both primary and backup are unreadable — keep the keys intact
          // (for manual recovery) and start fresh.
          console.error(
            '[loadGame] Save validation failed:',
            resolved.primaryError,
            '| Backup also unusable:',
            resolved.backupError,
          );
          set({
            notifications: pushNotification(
              readWorldFromPlayer(get()).notifications,
              'quest',
              resolved.primaryError,
            ),
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
      set(storePatchFromSave(resolved.data));
      resetGuidedStoryManager();

      if (resolved.status === 'recovered-from-backup') {
        set({
          notifications: pushNotification(
            readWorldFromPlayer(get()).notifications,
            'quest',
            'Основное сохранение повреждено — загружена резервная копия.',
          ),
        });
      }

      eventBus.emit('game:loaded', EMPTY_EVENT_PAYLOAD);
    } catch (err) {
      // Unexpected runtime error — also notify
      console.error('[loadGame] Unexpected error:', err);

      set({
        notifications: pushNotification(
          readWorldFromPlayer(get()).notifications,
          'quest',
          'Ошибка загрузки',
        ),
      });
    }
  },
});
