/* ─── Volodka RPG – Save storage (localStorage access layer) ─── */
/* Two-phase write with rollback, plus load-time recovery: when the primary
 * save fails parsing/validation we fall back to the backup key so a corrupt
 * primary save doesn't wipe the player's progress. Corrupt keys are never
 * removed here — they stay readable for manual recovery until the next
 * successful save overwrites them. */

import { subscribeGameSaved } from '../storeEffects';
import {
  validateSaveData,
  type SavePayload,
} from '@/shared/validation/saveSchema';
import {
  clearAllPersistedGameData as clearPersistedGameData,
  removePersistedKeys as removePersistedStorageKeys,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  type PersistedStorage,
} from '@/shared/persistence/persistedStorageOps';
import { migrateSaveData } from './saveMigrations';

export {
  SAVE_KEY,
  SAVE_BACKUP_KEY,
  SAVE_SLOT_COUNT,
  type PersistedStorage,
} from '@/shared/persistence/persistedStorageOps';

const savePresenceListeners = new Set<() => void>();
let savePresenceHooksInstalled = false;
let unsubGameSaved: (() => void) | undefined;

/** Whether a primary save exists in localStorage (for menu continue button). */
export function getSavePresence(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

/** Notify React subscribers that SAVE_KEY may have changed. */
export function notifySavePresenceChange(): void {
  for (const listener of savePresenceListeners) listener();
}

function onSaveStorageEvent(e: StorageEvent): void {
  if (e.key === SAVE_KEY || e.key === null) notifySavePresenceChange();
}

function installSavePresenceHooks(): void {
  if (savePresenceHooksInstalled) return;
  savePresenceHooksInstalled = true;
  window.addEventListener('storage', onSaveStorageEvent);
  unsubGameSaved = subscribeGameSaved(notifySavePresenceChange);
}

function uninstallSavePresenceHooks(): void {
  if (savePresenceListeners.size > 0) return;
  savePresenceHooksInstalled = false;
  window.removeEventListener('storage', onSaveStorageEvent);
  unsubGameSaved?.();
  unsubGameSaved = undefined;
}

/** useSyncExternalStore subscribe — storage events + game:saved in this tab. */
export function subscribeSavePresence(onStoreChange: () => void): () => void {
  savePresenceListeners.add(onStoreChange);
  installSavePresenceHooks();
  return () => {
    savePresenceListeners.delete(onStoreChange);
    uninstallSavePresenceHooks();
  };
}

/** Two-phase save: backup current → write → validate → rollback on failure. */
export function writeSaveToLocalStorage(json: string): boolean {
  const current = localStorage.getItem(SAVE_KEY);
  // Only promote the current save to backup when it is itself valid —
  // otherwise a corrupt primary would destroy the last good backup.
  if (current && validateSaveData(current).success) {
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

  notifySavePresenceChange();
  return true;
}

/* ─── Load-time resolution with backup fallback ─── */

export type ResolvedSave =
  | { status: 'empty' }
  | { status: 'ok'; data: SavePayload }
  | { status: 'recovered-from-backup'; data: SavePayload; primaryError: string }
  | { status: 'corrupt'; primaryError: string; backupError: string };

/**
 * Reads the save from localStorage, falling back to the backup key when the
 * primary save is corrupt. Never deletes either key: if both are corrupt the
 * raw data stays in localStorage so it can be extracted manually.
 */
export function resolveSaveFromStorage(): ResolvedSave {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw === null) return { status: 'empty' };

  let parsed: unknown;
  try {
    parsed = migrateSaveData(JSON.parse(raw));
  } catch {
    parsed = null;
  }

  const primary = validateSaveData(
    parsed !== null ? JSON.stringify(parsed) : raw,
  );
  if (primary.success) {
    return { status: 'ok', data: primary.data };
  }

  const backupRaw = localStorage.getItem(SAVE_BACKUP_KEY);
  if (backupRaw !== null) {
    let backupParsed: unknown;
    try {
      backupParsed = migrateSaveData(JSON.parse(backupRaw));
    } catch {
      backupParsed = null;
    }
    const backup = validateSaveData(
      backupParsed !== null ? JSON.stringify(backupParsed) : backupRaw,
    );
    if (backup.success) {
      return {
        status: 'recovered-from-backup',
        data: backup.data,
        primaryError: primary.error,
      };
    }
    return {
      status: 'corrupt',
      primaryError: primary.error,
      backupError: backup.error,
    };
  }

  return {
    status: 'corrupt',
    primaryError: primary.error,
    backupError: 'Резервная копия отсутствует.',
  };
}

/** Remove primary save, backup, and manual save slots. */
export function clearAllPersistedGameData(
  storage: PersistedStorage | null = typeof localStorage !== 'undefined' ? localStorage : null,
): void {
  clearPersistedGameData(storage);
  notifySavePresenceChange();
}

/** Remove arbitrary persisted keys (settings, accessibility, etc.). */
export function removePersistedKeys(
  storage: PersistedStorage | null,
  keys: readonly string[],
): void {
  removePersistedStorageKeys(storage, keys);
}
