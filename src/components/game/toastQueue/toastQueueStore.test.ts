import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dismissToastQueueEntry,
  enqueueCraftingToast,
  enqueueSystemAlert,
  getToastQueueState,
  resetToastQueueForTests,
  subscribeToastQueue,
} from '@/components/game/toastQueue/toastQueueStore';

describe('toastQueueStore — единая очередь транзиентных тостов (v4.48.5)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetToastQueueForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('крафт-тост попадает в очередь и истекает по durationMs', () => {
    const listener = vi.fn();
    const unsub = subscribeToastQueue(listener);

    enqueueCraftingToast({ recipeId: 'r1', recipeName: 'Тёплый код', rarity: 'rare' });

    expect(getToastQueueState().crafting).toHaveLength(1);
    expect(getToastQueueState().crafting[0]!.recipeName).toBe('Тёплый код');
    expect(listener).toHaveBeenCalled();

    vi.advanceTimersByTime(3500);

    expect(getToastQueueState().crafting).toHaveLength(0);
    unsub();
  });

  it('крафт-очередь держит максимум 3 карточки, старейшая вытесняется', () => {
    enqueueCraftingToast({ recipeId: 'r1', recipeName: 'А', rarity: 'common' });
    vi.advanceTimersByTime(100);
    enqueueCraftingToast({ recipeId: 'r2', recipeName: 'Б', rarity: 'common' });
    vi.advanceTimersByTime(100);
    enqueueCraftingToast({ recipeId: 'r3', recipeName: 'В', rarity: 'common' });
    vi.advanceTimersByTime(100);
    enqueueCraftingToast({ recipeId: 'r4', recipeName: 'Г', rarity: 'legendary' });

    const crafting = getToastQueueState().crafting;
    expect(crafting).toHaveLength(3);
    expect(crafting.map((entry) => entry.recipeName)).toEqual(['Б', 'В', 'Г']);

    // Вытесненная карточка не воскресает по своему таймеру (таймер снят),
    // живые истекают строго по своим срокам: Б(3600) и В(3700) уходят,
    // Г(3800) ещё жива.
    vi.advanceTimersByTime(3000);
    expect(getToastQueueState().crafting).toHaveLength(3);
    vi.advanceTimersByTime(400);
    expect(getToastQueueState().crafting).toHaveLength(1);
    expect(getToastQueueState().crafting[0]!.recipeName).toBe('Г');
  });

  it('системный алерт один: новый заменяет предыдущий', () => {
    enqueueSystemAlert({ kind: 'save_failed', message: 'Диск переполнен' });
    enqueueSystemAlert({ kind: 'load_recovered', message: 'Восстановлено из резерва' });

    const system = getToastQueueState().system;
    expect(system).toHaveLength(1);
    expect(system[0]!.kind).toBe('load_recovered');
    // load_recovered живёт 5000 мс (против 4500 у остальных).
    expect(system[0]!.durationMs).toBe(5000);

    vi.advanceTimersByTime(5000);
    expect(getToastQueueState().system).toHaveLength(0);
  });

  it('dismiss снимает и таймер истечения (карточка не resurrect)', () => {
    enqueueCraftingToast({ recipeId: 'r1', recipeName: 'А', rarity: 'common' });
    const id = getToastQueueState().crafting[0]!.id;

    dismissToastQueueEntry(id);
    expect(getToastQueueState().crafting).toHaveLength(0);

    vi.advanceTimersByTime(5000);
    expect(getToastQueueState().crafting).toHaveLength(0);
  });
});
