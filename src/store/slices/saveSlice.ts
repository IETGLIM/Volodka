/* ─── Volodka RPG – Save Slice ─── */
/* Save/load/reset game state. This slice has cross-cutting access
 * to the full store state for building save payloads and restoring
 * data across all slices. */

import type { StateCreator } from 'zustand';
import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { validateSaveData, SAVE_VERSION } from '@/shared/validation/saveSchema';
import { pushNotification } from '../shared';
import type { GameStoreState } from '../types';
import { readWorldFromPlayer } from '../crossSliceReads';
import {
  createDefaultResetState,
  pickSavePayload,
  storePatchFromSave,
} from '../persistedState';
import { clearAutoCloseTimers } from './explorationSlice';

/* ─── localStorage key ─── */
const SAVE_KEY = 'volodka_save';
const SAVE_BACKUP_KEY = `${SAVE_KEY}_backup`;

/** Two-phase save: backup current → write → validate → rollback on failure. */
function writeSaveToLocalStorage(json: string): boolean {
  const current = localStorage.getItem(SAVE_KEY);
  if (current) {
    localStorage.setItem(SAVE_BACKUP_KEY, current);
  }

  localStorage.setItem(SAVE_KEY, json);

  const verification = validateSaveData(localStorage.getItem(SAVE_KEY) ?? '');
  if (!verification.success) {
    console.error('[saveGame] Post-write validation failed:', verification.error);
    if (current) {
      localStorage.setItem(SAVE_KEY, current);
    } else {
      localStorage.removeItem(SAVE_KEY);
    }
    return false;
  }

  return true;
}

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
    // GuidedStoryManager listens via bindGuidedStoryLifecycleListeners (boot binder).
    eventBus.emit('game:reset', {} as Record<string, never>);
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
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;

      // Validate save data with Zod schema
      const validation = validateSaveData(raw);

      if (!validation.success) {
        // Save is corrupted — notify the user explicitly
        console.error('[loadGame] Save validation failed:', validation.error);

        set({
          notifications: pushNotification(
            readWorldFromPlayer(get()).notifications,
            'quest',
            validation.error,
          ),
        });

        return;
      }

      clearAutoCloseTimers();
      set(storePatchFromSave(validation.data));
      // GuidedStoryManager resets on this event (bindGuidedStoryLifecycleListeners).
      eventBus.emit('game:loaded', {} as Record<string, never>);
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
