import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LootToastCard } from '@/components/game/lootNotification/LootToastCard';
import { useLootNotifications } from '@/components/game/lootNotification/useLootNotifications';
import { buildLootAnnouncement } from '@/engine/loot/lootNotificationPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { explorationLootTopPx } from '@/shared/constants/hudLayout';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export const LootNotification = memo(function LootNotification() {
  const reducedMotion = useEffectiveReducedMotion();
  const { notifications } = useLootNotifications();
  const slotGranted = useNotificationSlot('loot', NOTIFY_PRIORITY.loot, notifications.length > 0);

  const liveAnnouncement = notifications.length > 0
    ? buildLootAnnouncement(notifications[notifications.length - 1]!)
    : '';

  return (
    <div
      className="fixed left-3 sm:left-4 flex flex-col gap-2 pointer-events-none"
      style={{ top: explorationLootTopPx(), zIndex: UI_LAYERS.TOASTS }}
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
