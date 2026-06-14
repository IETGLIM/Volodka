import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { LOOT_NOTIFICATION_EVENT } from '@/engine/loot/lootNotificationConstants';
import {
  LOOT_NOTIFICATION_DISMISS_MS,
  trimLootNotifications,
} from '@/engine/loot/lootNotificationPresentation';
import type { LootNotificationItem, LootNotificationPayload } from '@/engine/loot/lootNotificationTypes';

function createLootNotificationId(sequence: number): string {
  return `loot-${Date.now()}-${sequence}`;
}

export function useLootNotifications() {
  const [notifications, setNotifications] = useState<LootNotificationItem[]>([]);
  const sequenceRef = useRef(0);
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearDismissTimer = useCallback((id: string) => {
    const timer = dismissTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimersRef.current.delete(id);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    clearDismissTimer(id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, [clearDismissTimer]);

  const dismissAll = useCallback(() => {
    for (const timer of dismissTimersRef.current.values()) {
      clearTimeout(timer);
    }
    dismissTimersRef.current.clear();
    setNotifications([]);
  }, []);

  const enqueueNotification = useCallback((payload: LootNotificationPayload) => {
    sequenceRef.current += 1;
    const id = createLootNotificationId(sequenceRef.current);
    const item: LootNotificationItem = { ...payload, id };

    setNotifications((prev) => {
      const merged = trimLootNotifications([...prev, item]);
      const keptIds = new Set(merged.map((entry) => entry.id));
      for (const existingId of prev.map((entry) => entry.id)) {
        if (!keptIds.has(existingId)) {
          clearDismissTimer(existingId);
        }
      }
      return merged;
    });

    dismissTimersRef.current.set(
      id,
      setTimeout(() => removeNotification(id), LOOT_NOTIFICATION_DISMISS_MS),
    );
  }, [clearDismissTimer, removeNotification]);

  useEffect(() => {
    const unsub = eventBus.on(
      LOOT_NOTIFICATION_EVENT,
      (payload) => enqueueNotification(payload),
      EventBusPriority.UI,
    );
    return unsub;
  }, [enqueueNotification]);

  useEffect(() => {
    if (notifications.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismissAll();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [dismissAll, notifications.length]);

  useEffect(() => {
    const timers = dismissTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return {
    notifications,
    dismissAll,
  };
}
