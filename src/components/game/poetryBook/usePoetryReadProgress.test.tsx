import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  POETRY_READ_CHANGED_EVENT,
  POETRY_READ_STORAGE_KEY,
} from './poemReadProgress';
import { usePoetryReadProgress } from './usePoetryReadProgress';

/* Хук чтения прогресса: localStorage + CustomEvent-синхронизация инстансов. */
describe('usePoetryReadProgress', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty without stored ids', () => {
    const { result } = renderHook(() => usePoetryReadProgress());
    expect(result.current.readPoemIds.size).toBe(0);
    expect(result.current.readPoemsCount).toBe(0);
  });

  it('loads stored ids on init', () => {
    window.localStorage.setItem(POETRY_READ_STORAGE_KEY, JSON.stringify(['poem_1', 'poem_3']));
    const { result } = renderHook(() => usePoetryReadProgress());
    expect(result.current.readPoemIds.has('poem_1')).toBe(true);
    expect(result.current.readPoemIds.has('poem_3')).toBe(true);
    expect(result.current.readPoemsCount).toBe(2);
  });

  it('marks a poem read and persists it', () => {
    const { result } = renderHook(() => usePoetryReadProgress());
    act(() => {
      result.current.markPoemRead('poem_2');
    });
    expect(result.current.readPoemIds.has('poem_2')).toBe(true);
    expect(window.localStorage.getItem(POETRY_READ_STORAGE_KEY)).toBe(JSON.stringify(['poem_2']));
  });

  it('is idempotent: a repeated mark does not duplicate or rewrite', () => {
    const { result } = renderHook(() => usePoetryReadProgress());
    act(() => {
      result.current.markPoemRead('poem_1');
    });
    const storedAfterFirst = window.localStorage.getItem(POETRY_READ_STORAGE_KEY);
    act(() => {
      result.current.markPoemRead('poem_1');
    });
    expect(result.current.readPoemsCount).toBe(1);
    expect(window.localStorage.getItem(POETRY_READ_STORAGE_KEY)).toBe(storedAfterFirst);
  });

  it('syncs a second hook instance through the changed event', () => {
    const first = renderHook(() => usePoetryReadProgress());
    const second = renderHook(() => usePoetryReadProgress());

    act(() => {
      first.result.current.markPoemRead('poem_5');
    });

    expect(second.result.current.readPoemIds.has('poem_5')).toBe(true);
    expect(second.result.current.readPoemsCount).toBe(1);
  });

  it('syncs from another browser tab through the storage event', () => {
    const { result } = renderHook(() => usePoetryReadProgress());

    act(() => {
      window.localStorage.setItem(POETRY_READ_STORAGE_KEY, JSON.stringify(['poem_9']));
      window.dispatchEvent(new StorageEvent('storage', { key: POETRY_READ_STORAGE_KEY }));
    });

    expect(result.current.readPoemIds.has('poem_9')).toBe(true);
  });

  it('dispatches the changed event when a new poem is marked', () => {
    const { result } = renderHook(() => usePoetryReadProgress());
    let events = 0;
    const listener = () => {
      events += 1;
    };
    window.addEventListener(POETRY_READ_CHANGED_EVENT, listener);
    try {
      act(() => {
        result.current.markPoemRead('poem_7');
      });
      // Повторная отметка — события больше не шлём (идемпотентность)
      act(() => {
        result.current.markPoemRead('poem_7');
      });
    } finally {
      window.removeEventListener(POETRY_READ_CHANGED_EVENT, listener);
    }
    expect(events).toBe(1);
  });
});
