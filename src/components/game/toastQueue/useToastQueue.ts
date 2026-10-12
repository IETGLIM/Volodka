/* ─── Volodka RPG – React-подписка на транзиентную очередь тостов ───
 * Единая точка чтения очереди для TransientToastStack. Просроченные записи
 * (таб в фоне, троттлинг таймеров) отфильтровываются на чтении — стор
 * довыполнит свои таймеры, но UI не покажет мёртвую карточку. */

import { useCallback, useSyncExternalStore } from 'react';
import {
  dismissToastQueueEntry,
  getToastQueueState,
  subscribeToastQueue,
  type ToastQueueCraftingEntry,
  type ToastQueueSystemEntry,
} from '@/components/game/toastQueue/toastQueueStore';

/** Допуск на exit-анимацию после истечения durationMs. */
const EXIT_ANIMATION_GRACE_MS = 400;

export interface ToastQueueView {
  craftingEntries: ToastQueueCraftingEntry[];
  systemEntries: ToastQueueSystemEntry[];
  dismiss: (id: string) => void;
}

function isEntryLive(createdAt: number, durationMs: number, now: number): boolean {
  return now - createdAt <= durationMs + EXIT_ANIMATION_GRACE_MS;
}

export function useToastQueue(): ToastQueueView {
  const state = useSyncExternalStore(subscribeToastQueue, getToastQueueState, getToastQueueState);

  const dismiss = useCallback((id: string) => dismissToastQueueEntry(id), []);

  const now = Date.now();
  const craftingEntries = state.crafting.filter(
    (entry) => isEntryLive(entry.createdAt, entry.durationMs, now),
  );
  const systemEntries = state.system.filter(
    (entry) => isEntryLive(entry.createdAt, entry.durationMs, now),
  );

  return { craftingEntries, systemEntries, dismiss };
}
