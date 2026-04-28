import { useCallback, useState } from 'react';
import type { UiPriority } from '@/engine/EventBus';

export type EffectNotifType = 'poem' | 'stat' | 'quest' | 'flag' | 'energy' | 'system';

/** Визуальный вес от `UiPriority` в `showEffectNotif`. */
export type EffectNotifDisplayStyle = 'strong' | 'subtle' | 'normal';

export interface EffectNotification {
  id: string;
  text: string;
  type: EffectNotifType;
  displayStyle: EffectNotifDisplayStyle;
}

export function useEffectNotifications(maxVisible = 5, defaultTimeoutMs = 3000) {
  const [notifications, setNotifications] = useState<EffectNotification[]>([]);

  const showEffectNotif = useCallback(
    (
      text: string,
      type: EffectNotifType,
      durationMs: number = defaultTimeoutMs,
      priority: UiPriority = 'normal',
    ) => {
      let ms = durationMs;
      if (priority === 'high') {
        ms = Math.max(ms, 1200);
      }
      const displayStyle: EffectNotifDisplayStyle =
        priority === 'high' ? 'strong' : priority === 'low' ? 'subtle' : 'normal';
      const id = Date.now().toString();
      setNotifications((prev) => [
        ...prev.slice(-(maxVisible - 1)),
        { id, text, type, displayStyle },
      ]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      }, ms);
    },
    [maxVisible, defaultTimeoutMs],
  );

  return {
    notifications,
    showEffectNotif,
  };
}
