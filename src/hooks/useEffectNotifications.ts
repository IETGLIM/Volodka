import { useCallback, useState } from 'react';
import type { UiPriority } from '@/engine/EventBus';

export type EffectNotifType = 'poem' | 'stat' | 'quest' | 'flag' | 'energy' | 'system';

export interface EffectNotification {
  id: string;
  text: string;
  type: EffectNotifType;
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
      const id = Date.now().toString();
      setNotifications((prev) => [...prev.slice(-(maxVisible - 1)), { id, text, type }]);
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
