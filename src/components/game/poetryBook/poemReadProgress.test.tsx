import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  POETRY_READ_STORAGE_KEY,
  readStoredPoemReadIds,
  withPoemMarkedRead,
  writeStoredPoemReadIds,
} from './poemReadProgress';

/* Прогресс чтения живёт в localStorage — тесты в jsdom-проекте (components). */
describe('poemReadProgress', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('returns an empty list when nothing is stored', () => {
    expect(readStoredPoemReadIds()).toEqual([]);
  });

  it('round-trips written ids', () => {
    writeStoredPoemReadIds(['poem_1', 'poem_2']);
    expect(readStoredPoemReadIds()).toEqual(['poem_1', 'poem_2']);
  });

  it('survives corrupted JSON', () => {
    window.localStorage.setItem(POETRY_READ_STORAGE_KEY, '{not json');
    expect(readStoredPoemReadIds()).toEqual([]);
  });

  it('rejects non-array JSON payloads', () => {
    window.localStorage.setItem(POETRY_READ_STORAGE_KEY, JSON.stringify({ id: 'poem_1' }));
    expect(readStoredPoemReadIds()).toEqual([]);
  });

  it('rejects payloads with non-string entries (foreign/corrupted data) and dedupes', () => {
    // Массив пишем только мы; чужие/битые данные отбрасываем целиком,
    // а валидный список дедуплицируем.
    window.localStorage.setItem(
      POETRY_READ_STORAGE_KEY,
      JSON.stringify(['poem_1', 42, null, 'poem_1', 'poem_2']),
    );
    expect(readStoredPoemReadIds()).toEqual([]);

    window.localStorage.setItem(
      POETRY_READ_STORAGE_KEY,
      JSON.stringify(['poem_1', 'poem_1', 'poem_2']),
    );
    expect(readStoredPoemReadIds()).toEqual(['poem_1', 'poem_2']);
  });

  it('marks a poem read idempotently', () => {
    const once = withPoemMarkedRead(['poem_1'], 'poem_2');
    expect(once).toEqual(['poem_1', 'poem_2']);

    const twice = withPoemMarkedRead(once, 'poem_2');
    expect(twice).toEqual(['poem_1', 'poem_2']);
    expect(twice).not.toBe(once); // новый массив — для честного обновления стейта
  });
});
