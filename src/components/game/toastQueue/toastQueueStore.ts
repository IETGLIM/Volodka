/* ─── Volodka RPG – Transient toast queue (single store) ───
 * FIX (v4.48.5, консолидация тостов — фаза 1): крафт-открытия и системные
 * алерты (сейв/лоад) раньше жили в двух независимых компонентах с собственным
 * useState, таймерами и дедупликацией. Теперь обе «очереди» — один модульный
 * стор (useSyncExternalStore), один набор таймеров, один принцип обрезки:
 *
 *   - crafting: максимум 3 карточки (старейшая вытесняется) — как раньше;
 *   - system:   один активный алерт, новый заменяет предыдущий — как раньше.
 *
 * Рендер — TransientToastStack (единственный потребитель). Слот-арбитр
 * useNotificationSlot остаётся прежним (crafting=30, system=58 critical) —
 * поведение арбитража не меняется, меняется только владение состоянием.
 */

import type { ItemRarity } from '@/data/items';
import {
  getSystemAlertDurationMs,
  type SystemAlertKind,
} from '@/engine/system/systemPresentation';

/* ─── Types ─── */

export type ToastQueueCraftingEntry = {
  id: string;
  channel: 'crafting';
  recipeId: string;
  recipeName: string;
  rarity: ItemRarity;
  createdAt: number;
  durationMs: number;
};

export type ToastQueueSystemEntry = {
  id: string;
  channel: 'system';
  kind: SystemAlertKind;
  message: string;
  createdAt: number;
  durationMs: number;
};

export type ToastQueueEntry = ToastQueueCraftingEntry | ToastQueueSystemEntry;

export interface ToastQueueState {
  crafting: ToastQueueCraftingEntry[];
  system: ToastQueueSystemEntry[];
}

/* ─── Constants ─── */

const CRAFTING_TOAST_DURATION_MS = 3500;
const CRAFTING_MAX_ENTRIES = 3;

/* ─── Module singleton store ─── */

let sequence = 0;
let state: ToastQueueState = { crafting: [], system: [] };
const listeners = new Set<() => void>();
const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

function emitChange(): void {
  for (const listener of listeners) listener();
}

function removeEntry(id: string): void {
  if (!state.crafting.some((entry) => entry.id === id) && !state.system.some((entry) => entry.id === id)) {
    return;
  }
  state = {
    crafting: state.crafting.filter((entry) => entry.id !== id),
    system: state.system.filter((entry) => entry.id !== id),
  };
  emitChange();
}

function scheduleExpiry(entry: ToastQueueEntry): void {
  const existing = expiryTimers.get(entry.id);
  if (existing) clearTimeout(existing);
  expiryTimers.set(
    entry.id,
    setTimeout(() => {
      expiryTimers.delete(entry.id);
      removeEntry(entry.id);
    }, entry.durationMs),
  );
}

/** Крафт-открытие: вытесняет старейшую карточку сверх лимита 3. */
export function enqueueCraftingToast(payload: {
  recipeId: string;
  recipeName: string;
  rarity: ItemRarity;
}): void {
  sequence += 1;
  const entry: ToastQueueCraftingEntry = {
    id: `crafting-toast-${sequence}`,
    channel: 'crafting',
    recipeId: payload.recipeId,
    recipeName: payload.recipeName,
    rarity: payload.rarity,
    createdAt: Date.now(),
    durationMs: CRAFTING_TOAST_DURATION_MS,
  };
  const merged = [...state.crafting, entry];
  const trimmed = merged.slice(Math.max(0, merged.length - CRAFTING_MAX_ENTRIES));
  for (const evicted of merged.slice(0, merged.length - trimmed.length)) {
    const timer = expiryTimers.get(evicted.id);
    if (timer) {
      clearTimeout(timer);
      expiryTimers.delete(evicted.id);
    }
  }
  state = { ...state, crafting: trimmed };
  scheduleExpiry(entry);
  emitChange();
}

/** Системный алерт (сейв/лоад): один активный, новый заменяет предыдущий. */
export function enqueueSystemAlert(payload: { kind: SystemAlertKind; message: string }): void {
  sequence += 1;
  for (const previous of state.system) {
    const timer = expiryTimers.get(previous.id);
    if (timer) {
      clearTimeout(timer);
      expiryTimers.delete(previous.id);
    }
  }
  const entry: ToastQueueSystemEntry = {
    id: `system-alert-${sequence}`,
    channel: 'system',
    kind: payload.kind,
    message: payload.message,
    createdAt: Date.now(),
    durationMs: getSystemAlertDurationMs(payload.kind),
  };
  state = { ...state, system: [entry] };
  scheduleExpiry(entry);
  emitChange();
}

export function dismissToastQueueEntry(id: string): void {
  const timer = expiryTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    expiryTimers.delete(id);
  }
  removeEntry(id);
}

export function subscribeToastQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastQueueState(): ToastQueueState {
  return state;
}

/** Тестовый сброс (таймеры + состояние + счётчик). */
export function resetToastQueueForTests(): void {
  for (const timer of expiryTimers.values()) clearTimeout(timer);
  expiryTimers.clear();
  state = { crafting: [], system: [] };
  sequence = 0;
}
