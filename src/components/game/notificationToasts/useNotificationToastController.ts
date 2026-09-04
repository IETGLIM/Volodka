import { useCallback, useEffect, useRef, useState } from 'react';
import { toastManager } from '@/engine/ToastManager';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { playSfx } from '@/engine/audio/interactionSfx';
import { getUIStoreState } from '@/store/stores/uiStore';
import {
  appendToastIfNew,
  buildCombatDefeatToastMessage,
  buildPoemPowerToastMessage,
  canAcceptNotificationToasts,
  shouldSuppressStoreNotificationToast,
  storeNotificationToVisible,
  toastMessageToVisible,
  trimPrevStoreNotificationIds,
  type VisibleNotificationToast,
} from '@/engine/toast/notificationToastPresentation';
import { NOTIFICATION_TOAST_MAX_VISIBLE } from '@/engine/toast/notificationToastConstants';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { useCinematicInterstitialActive } from '@/hooks/useCinematicInterstitialActive';
import { useGamePhase, useNotifications } from '@/store/selectors';

export function useNotificationToastController() {
  const mode = useGamePhase();
  const { phase: transitionPhase } = useTransitionDirector();
  const exclusiveInterstitialActive = useCinematicInterstitialActive();
  const notifications = useNotifications();
  const [toasts, setToasts] = useState<VisibleNotificationToast[]>([]);
  const shownIdsRef = useRef(new Set<string>());
  const prevNotifIdsRef = useRef(new Set<string>());
  const acceptNewRef = useRef(true);

  const acceptNew = canAcceptNotificationToasts(mode, transitionPhase, {
    exclusiveInterstitialActive,
  });
  acceptNewRef.current = acceptNew;

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    return toastManager.subscribe((msg) => {
      // Persist to notification history (non-reactive, outside React lifecycle)
      getUIStoreState().addNotificationHistory({
        id: msg.id,
        type: msg.type,
        message: msg.message,
        delta: msg.delta,
        timestamp: msg.timestamp,
      });

      setToasts((prev) => {
        const next = appendToastIfNew(
          prev,
          toastMessageToVisible(msg),
          shownIdsRef.current,
          acceptNewRef.current,
        );
        // Play notification ping when a new toast is actually added
        if (next !== prev) {
          playSfx('notification');
        }
        return next;
      });
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

        // Quest → QuestNotificationSystem; poem collect → PoemRevealHost.
        // Mirror toasts here duplicate the dedicated channel (see registry).
        if (shouldSuppressStoreNotificationToast(notification.type)) continue;

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
      // quest:reward_applied — removed. QuestNotificationSystem already shows
      // a rich "★ Квест выполнен!" card with rewards via useQuests() watcher.
      // This toastManager.addToast('quest', ...) was duplicating it with a
      // plain text toast "Награда за X: ...". See notificationChannelRegistry.
      // ui:loot_notification — 'Получен предмет: [название]' toast
      eventBus.on('ui:loot_notification', (payload) => {
        if (payload.type === 'item') {
          toastManager.addToast('item', `Получен предмет: ${payload.label}`);
        }
      }),
      // quest:objective_updated — 'Квест обновлён' toast
      eventBus.on('quest:objective_updated', (payload) => {
        toastManager.addToast('quest', `Квест обновлён: ${payload.questId}`);
      }),
      // FIX (dedup): achievement:unlocked тост убран — достижение уже
      // показывает угловой попап (AchievementNotification) с названием,
      // описанием и звуком; для трофеев — полноэкранная кат-сцена.
      // Текстовый тост был третьим дублирующим каналом.
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const visibleToasts = toasts.slice(-NOTIFICATION_TOAST_MAX_VISIBLE);

  return {
    mode,
    transitionPhase,
    exclusiveInterstitialActive,
    acceptNew,
    visibleToasts,
    dismissToast,
  };
}
