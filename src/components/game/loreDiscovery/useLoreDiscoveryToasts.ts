import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import {
  LORE_DISCOVERED_EVENT,
  LORE_TOAST_EXIT_BUFFER_MS,
  LORE_TOAST_MAX_VISIBLE,
  LORE_TOAST_QUEUE_DELAY_MS,
} from '@/engine/lore/loreDiscoveryConstants';
import {
  getLoreToastDurationMs,
  parseLoreRarity,
  trimLoreToasts,
} from '@/engine/lore/loreDiscoveryPresentation';
import type { LoreToastItem, LoreToastPayload } from '@/engine/lore/loreDiscoveryTypes';

function createLoreToastId(sequence: number): string {
  return `lore-toast-${Date.now()}-${sequence}`;
}

export function useLoreDiscoveryToasts() {
  const [toasts, setToasts] = useState<LoreToastItem[]>([]);
  const sequenceRef = useRef(0);
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const queueRef = useRef<LoreToastPayload[]>([]);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback((id: string) => {
    const timer = dismissTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimersRef.current.delete(id);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    clearDismissTimer(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, [clearDismissTimer]);

  const dismissAll = useCallback(() => {
    for (const timer of dismissTimersRef.current.values()) {
      clearTimeout(timer);
    }
    dismissTimersRef.current.clear();
    setToasts([]);
  }, []);

  const enqueueToast = useCallback((payload: LoreToastPayload) => {
    sequenceRef.current += 1;
    const id = createLoreToastId(sequenceRef.current);
    const item: LoreToastItem = { ...payload, id, createdAt: Date.now() };

    setToasts((prev) => {
      const merged = trimLoreToasts([...prev, item], LORE_TOAST_MAX_VISIBLE);
      const keptIds = new Set(merged.map((toast) => toast.id));
      for (const existing of prev) {
        if (!keptIds.has(existing.id)) {
          clearDismissTimer(existing.id);
        }
      }
      return merged;
    });

    const durationMs = getLoreToastDurationMs(payload.rarity);
    dismissTimersRef.current.set(
      id,
      setTimeout(() => removeToast(id), durationMs + LORE_TOAST_EXIT_BUFFER_MS),
    );
  }, [clearDismissTimer, removeToast]);

  const flushQueue = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) return;
    enqueueToast(next);
    if (queueRef.current.length > 0) {
      queueTimerRef.current = setTimeout(flushQueue, LORE_TOAST_QUEUE_DELAY_MS);
    } else {
      queueTimerRef.current = null;
    }
  }, [enqueueToast]);

  const scheduleToast = useCallback((payload: LoreToastPayload) => {
    queueRef.current.push(payload);
    if (!queueTimerRef.current) {
      queueTimerRef.current = setTimeout(() => {
        queueTimerRef.current = null;
        flushQueue();
      }, LORE_TOAST_QUEUE_DELAY_MS);
    }
  }, [flushQueue]);

  const openCodex = useCallback((loreId: string) => {
    eventBus.emit('ui:open_panel', { panel: 'codex', loreId });
  }, []);

  useEffect(() => {
    const unsub = eventBus.on(
      LORE_DISCOVERED_EVENT,
      (payload) => {
        scheduleToast({
          loreId: payload.id,
          title: payload.title,
          rarity: parseLoreRarity(payload.rarity),
          category: payload.category as LoreToastPayload['category'],
        });
      },
      EventBusPriority.UI,
    );
    return unsub;
  }, [scheduleToast]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismissAll();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [dismissAll, toasts.length]);

  useEffect(() => {
    const timers = dismissTimersRef.current;
    return () => {
      if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return {
    toasts,
    removeToast,
    openCodex,
    dismissAll,
  };
}
