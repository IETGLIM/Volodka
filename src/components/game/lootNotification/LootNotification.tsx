import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LootToastCard } from '@/components/game/lootNotification/LootToastCard';
import { useLootNotifications } from '@/components/game/lootNotification/useLootNotifications';
import { buildLootAnnouncement } from '@/engine/loot/lootNotificationPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';

export const LootNotification = memo(function LootNotification() {
  const reducedMotion = useEffectiveReducedMotion();
  const { notifications } = useLootNotifications();
  const slotGranted = useNotificationSlot('loot', NOTIFY_PRIORITY.loot, notifications.length > 0);

  const liveAnnouncement = notifications.length > 0
    ? buildLootAnnouncement(notifications[notifications.length - 1]!)
    : '';

  return (
    /* FIX (v4.48, overlap): убрана fixed-позиция (top 66 — тот же якорь,
     * что у HUDNotificationFeed: лут рисовался поверх фида, z 35 против 12).
     * Теперь лут — flex-ребёнок нижне-левого стека транзиентных тостов. */
    <div
      className="flex flex-col items-start gap-2 pointer-events-none"
      data-exploration-ui
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{liveAnnouncement}</span>

      <AnimatePresence>
        {slotGranted && notifications.map((notification) => (
          <LootToastCard
            key={notification.id}
            notification={notification}
            reducedMotion={reducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
