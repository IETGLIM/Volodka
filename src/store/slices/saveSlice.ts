/* ─── Volodka RPG – Save Slice ─── */
/* Save/load/reset game state. This slice has cross-cutting access
 * to the full store state for building save payloads and restoring
 * data across all slices. */

import type { StateCreator } from 'zustand';
import { eventBus } from '@/engine/EventBus';
import { validateSaveData, SAVE_VERSION } from '@/shared/validation/saveSchema';
import { pushNotification } from '../shared';
import type { GameStoreState } from '../types';
import { readWorldFromPlayer } from '../crossSliceReads';
import {
  createDefaultResetState,
  pickSavePayload,
  storePatchFromSave,
} from '../persistedState';
import { resetAllPoemEffects } from '@/engine/PoemPowerSystem';
import { clearAutoCloseTimers } from './explorationSlice';

/* ─── localStorage key ─── */
const SAVE_KEY = 'volodka_save';

/* ─── Slice types ─── */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
    resetAllPoemEffects();
    // Clear module-scoped interactive-object auto-close timers
    clearAutoCloseTimers();

    set(createDefaultResetState());
  },

  saveGame: (options) => {
    const state = get();
    const source = options?.source ?? 'manual';

    const payload = pickSavePayload(state);

    try {
      const payloadWithVersion = { ...payload, saveVersion: SAVE_VERSION };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payloadWithVersion));
      const timestamp = Date.now();

      set({
        lastSaveTimestamp: timestamp,
        ...(source === 'auto' ? { lastAutoSaveTimestamp: timestamp } : {}),
      });

      eventBus.emit('game:saved', { timestamp, source });
    } catch {
      // localStorage might be full or unavailable
      console.error('[saveGame] Failed to write save to localStorage');
      // Notify the user instead of silently failing
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
