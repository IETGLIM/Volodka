import { devWarn } from '@/shared/utils/devLog';
export const SAVE_KEY = 'volodka_save';
export const SAVE_BACKUP_KEY = `${SAVE_KEY}_backup`;
export const SAVE_SLOT_COUNT = 3;

export type PersistedStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getSaveSlotKey(slot: number): string {
  return `volodka_save_slot_${slot}`;
}

/** Remove primary save, backup, and manual save slots. */
export function clearAllPersistedGameData(
  storage: PersistedStorage | null = typeof localStorage !== 'undefined' ? localStorage : null,
): void {
  if (!storage) return;

  try {
    storage.removeItem(SAVE_KEY);
    storage.removeItem(SAVE_BACKUP_KEY);
    for (let slot = 0; slot < SAVE_SLOT_COUNT; slot += 1) {
      storage.removeItem(getSaveSlotKey(slot));
    }
  } catch (error) {
    devWarn('[persistedStorageOps] clearAllPersistedGameData failed:', error);
  }
}

/** Remove arbitrary persisted keys (settings, accessibility, etc.). */
export function removePersistedKeys(
  storage: PersistedStorage | null,
  keys: readonly string[],
): void {
  if (!storage) return;

  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch (error) {
      devWarn(`[persistedStorageOps] Failed to remove "${key}":`, error);
    }
  }
}
