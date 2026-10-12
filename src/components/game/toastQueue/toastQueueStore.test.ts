import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dismissAllLootToasts,
  dismissToastQueueEntry,
  enqueueCraftingToast,
  enqueueLootToast,
  enqueueSystemAlert,
  getToastQueueState,
  resetToastQueueForTests,
  subscribeToastQueue,
} from '@/components/game/toastQueue/toastQueueStore';
import { LOOT_NOTIFICATION_DISMISS_MS } from '@/engine/loot/lootNotificationConstants';

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

  /* ─── Фаза 2 (v4.48.6): канал loot ─── */

  it('лут-тост попадает в очередь и истекает по LOOT_NOTIFICATION_DISMISS_MS', () => {
    const listener = vi.fn();
    const unsub = subscribeToastQueue(listener);

    enqueueLootToast({ type: 'item', label: 'Ключ', detail: 'Инвентарь: I', rarity: 'rare' });

    const loot = getToastQueueState().loot;
    expect(loot).toHaveLength(1);
    expect(loot[0]!.channel).toBe('loot');
    expect(loot[0]!.payload.label).toBe('Ключ');
    expect(loot[0]!.durationMs).toBe(LOOT_NOTIFICATION_DISMISS_MS);
    expect(listener).toHaveBeenCalled();

    vi.advanceTimersByTime(LOOT_NOTIFICATION_DISMISS_MS);
    expect(getToastQueueState().loot).toHaveLength(0);
    unsub();
  });

  it('лут-очередь держит максимум 5 карточек, старейшая вытесняется', () => {
    for (let i = 1; i <= 6; i += 1) {
      enqueueLootToast({ type: 'item', label: `Предмет ${i}` });
      vi.advanceTimersByTime(100);
    }

    const loot = getToastQueueState().loot;
    expect(loot).toHaveLength(5);
    expect(loot.map((entry) => entry.payload.label)).toEqual([
      'Предмет 2', 'Предмет 3', 'Предмет 4', 'Предмет 5', 'Предмет 6',
    ]);

    // Вытесненная карточка не воскресает: живые истекают по своим срокам.
    // t в цикле = 600мс; истечения живых: 3100…3500 (созданы в 100…500).
    vi.advanceTimersByTime(2400); // t=3000 — все 5 живы
    expect(getToastQueueState().loot).toHaveLength(5);
    vi.advanceTimersByTime(400); // t=3400 — ушли 3100…3400, остался «Предмет 6» (3500)
    expect(getToastQueueState().loot).toHaveLength(1);
    expect(getToastQueueState().loot[0]!.payload.label).toBe('Предмет 6');
  });

  it('dismissAllLootToasts снимает все лут-карточки и их таймеры (Escape-семантика)', () => {
    enqueueLootToast({ type: 'xp', label: '+10 опыта' });
    vi.advanceTimersByTime(100);
    enqueueLootToast({ type: 'item', label: 'Кружка' });
    expect(getToastQueueState().loot).toHaveLength(2);

    dismissAllLootToasts();
    expect(getToastQueueState().loot).toHaveLength(0);

    vi.advanceTimersByTime(5000);
    expect(getToastQueueState().loot).toHaveLength(0);
  });

  it('dismissAllLootToasts не трогает крафт и системные алерты', () => {
    enqueueCraftingToast({ recipeId: 'r1', recipeName: 'Тёплый код', rarity: 'common' });
    enqueueSystemAlert({ kind: 'save_failed', message: 'Диск переполнен' });
    enqueueLootToast({ type: 'item', label: 'Кружка' });

    dismissAllLootToasts();

    expect(getToastQueueState().loot).toHaveLength(0);
    expect(getToastQueueState().crafting).toHaveLength(1);
    expect(getToastQueueState().system).toHaveLength(1);
  });
});
