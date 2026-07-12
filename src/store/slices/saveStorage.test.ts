import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import { createDefaultPersistedState } from '@/store/persistedState';
import {
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  resolveSaveFromStorage,
  writeSaveToLocalStorage,
} from './saveStorage';

function buildValidSaveJson(savedAt = Date.now()): string {
  return JSON.stringify({
    saveVersion: SAVE_VERSION,
    savedAt,
    ...createDefaultPersistedState(),
  });
}

function createLocalStorageStub(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageStub());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolveSaveFromStorage', () => {
  it('returns empty when no save exists', () => {
    expect(resolveSaveFromStorage()).toEqual({ status: 'empty' });
  });

  it('returns ok for a valid primary save', () => {
    localStorage.setItem(SAVE_KEY, buildValidSaveJson(111));

    const resolved = resolveSaveFromStorage();
    expect(resolved.status).toBe('ok');
    if (resolved.status === 'ok') {
      expect(resolved.data.savedAt).toBe(111);
    }
  });

  it('falls back to a valid backup when the primary save is corrupt JSON', () => {
    localStorage.setItem(SAVE_KEY, '{corrupt json!!!');
    localStorage.setItem(SAVE_BACKUP_KEY, buildValidSaveJson(222));

    const resolved = resolveSaveFromStorage();
    expect(resolved.status).toBe('recovered-from-backup');
    if (resolved.status === 'recovered-from-backup') {
      expect(resolved.data.savedAt).toBe(222);
      expect(resolved.primaryError).toContain('Сохранение повреждено');
    }
  });

  it('falls back to backup when the primary save fails schema validation', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ saveVersion: SAVE_VERSION, savedAt: 1 }),
    );
    localStorage.setItem(SAVE_BACKUP_KEY, buildValidSaveJson(333));

    const resolved = resolveSaveFromStorage();
    expect(resolved.status).toBe('recovered-from-backup');
    if (resolved.status === 'recovered-from-backup') {
      expect(resolved.data.savedAt).toBe(333);
    }
  });

  it('reports corrupt (fresh game) when both keys are corrupt, without deleting them', () => {
    localStorage.setItem(SAVE_KEY, '{corrupt json!!!');
    localStorage.setItem(SAVE_BACKUP_KEY, 'also not json');

    const resolved = resolveSaveFromStorage();
    expect(resolved.status).toBe('corrupt');
    if (resolved.status === 'corrupt') {
      expect(resolved.primaryError).toContain('Сохранение повреждено');
      expect(resolved.backupError).toContain('Сохранение повреждено');
    }

    // Raw data must stay in localStorage for manual recovery.
    expect(localStorage.getItem(SAVE_KEY)).toBe('{corrupt json!!!');
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBe('also not json');
  });

  it('reports corrupt when the primary is corrupt and no backup exists', () => {
    localStorage.setItem(SAVE_KEY, '{corrupt json!!!');

    const resolved = resolveSaveFromStorage();
    expect(resolved.status).toBe('corrupt');
    expect(localStorage.getItem(SAVE_KEY)).toBe('{corrupt json!!!');
  });
});

describe('writeSaveToLocalStorage', () => {
  it('promotes a valid current save to the backup key', () => {
    const oldSave = buildValidSaveJson(444);
    localStorage.setItem(SAVE_KEY, oldSave);

    const newSave = buildValidSaveJson(555);
    expect(writeSaveToLocalStorage(newSave)).toBe(true);

    expect(localStorage.getItem(SAVE_KEY)).toBe(newSave);
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBe(oldSave);
  });

  it('does not overwrite a valid backup with a corrupt primary save', () => {
    const goodBackup = buildValidSaveJson(666);
    localStorage.setItem(SAVE_KEY, '{corrupt json!!!');
    localStorage.setItem(SAVE_BACKUP_KEY, goodBackup);

    const newSave = buildValidSaveJson(777);
    expect(writeSaveToLocalStorage(newSave)).toBe(true);

    expect(localStorage.getItem(SAVE_KEY)).toBe(newSave);
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBe(goodBackup);
  });
});
