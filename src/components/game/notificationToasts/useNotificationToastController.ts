import { useCallback, useEffect, useRef, useState } from 'react';
import { toastManager } from '@/engine/ToastManager';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import {
  appendToastIfNew,
  buildCombatDefeatToastMessage,
  buildPoemPowerToastMessage,
  buildQuestRewardToastMessage,
  canAcceptNotificationToasts,
  storeNotificationToVisible,
  toastMessageToVisible,
  trimPrevStoreNotificationIds,
  type VisibleNotificationToast,
} from '@/engine/toast/notificationToastPresentation';
import { NOTIFICATION_TOAST_MAX_VISIBLE } from '@/engine/toast/notificationToastConstants';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { useGamePhase, useNotifications } from '@/store/selectors';

export function useNotificationToastController() {
  const mode = useGamePhase();
  const { phase: transitionPhase } = useTransitionDirector();
  const notifications = useNotifications();
  const [toasts, setToasts] = useState<VisibleNotificationToast[]>([]);
  const shownIdsRef = useRef(new Set<string>());
  const prevNotifIdsRef = useRef(new Set<string>());
  const acceptNewRef = useRef(true);

  const acceptNew = canAcceptNotificationToasts(mode, transitionPhase);
  acceptNewRef.current = acceptNew;

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    return toastManager.subscribe((msg) => {
      setToasts((prev) =>
        appendToastIfNew(
          prev,
          toastMessageToVisible(msg),
          shownIdsRef.current,
          acceptNewRef.current,
        ),
      );
    });
  }, []);

  useEffect(() => {
    if (!acceptNew) return;

    setToasts((prev) => {
      let next = prev;
      let changed = false;

      for (const notification of notifications) {
        if (prevNotifIdsRef.current.has(notification.id)) continue;
        prevNotifIdsRef.current.add(notification.id);

        // Suppress quest notifications here — QuestNotificationSystem renders
        // a richer card (icon, progress bar, rewards link) for the same events
        // (quest accepted / objective complete / quest complete). Without this
        // filter, the player saw duplicate toasts: NotificationToasts showed
        // "Квест: Задание выполнено: X" + "Квест: Награда за X" at top-right,
        // while QuestNotificationSystem showed "★ Квест выполнен! X" at
        // bottom-right — three toasts for one quest completion.
        if (notification.type === 'quest') continue;

        const updated = appendToastIfNew(
          next,
          storeNotificationToVisible(notification),
          shownIdsRef.current,
          true,
        );
        if (updated !== next) {
          next = updated;
          changed = true;
        }
      }

      trimPrevStoreNotificationIds(prevNotifIdsRef.current);
      return changed ? next : prev;
    });
  }, [notifications, acceptNew]);

  useEffect(() => {
    const unsubs = [
      eventBus.on('poem:power_used', ({ powerName }) => {
        toastManager.addToast('poem', buildPoemPowerToastMessage(powerName));
      }),
      eventBus.on(
        'combat:defeat',
        ({ energyLost }) => {
          toastManager.addToast('stress', buildCombatDefeatToastMessage(energyLost));
        },
        EventBusPriority.UI,
      ),
      eventBus.on('quest:reward_applied', ({ questTitle, rewards }) => {
        toastManager.addToast('quest', buildQuestRewardToastMessage(questTitle, rewards));
      }),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const visibleToasts = toasts.slice(-NOTIFICATION_TOAST_MAX_VISIBLE);

  return {
    mode,
    transitionPhase,
    acceptNew,
    visibleToasts,
    dismissToast,
  };
}
