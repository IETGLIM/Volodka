import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoreToastCard } from '@/components/game/loreDiscovery/LoreToastCard';
import { useLoreDiscoveryToasts } from '@/components/game/loreDiscovery/useLoreDiscoveryToasts';
import { buildLoreToastAnnouncement } from '@/engine/lore/loreDiscoveryPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { useGamePhase } from '@/store/selectors';
import { explorationLoreToastTopPx } from '@/shared/constants/hudLayout';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

function LoreDiscoveryToastPanel() {
  const reducedMotion = useEffectiveReducedMotion();
  const mode = useGamePhase();
  const { toasts, removeToast, openCodex } = useLoreDiscoveryToasts();
  const slotGranted = useNotificationSlot('lore', NOTIFY_PRIORITY.lore, toasts.length > 0);

  if (mode === 'menu' || mode === 'intro') return null;
  if (!slotGranted) return null;

  const liveAnnouncement = toasts.length > 0
    ? buildLoreToastAnnouncement(toasts[toasts.length - 1]!)
    : '';

  return (
    <div
      className="fixed left-3 sm:left-4 pointer-events-none flex flex-col gap-2"
      data-exploration-ui
      data-testid="lore-discovery-toast"
      style={{ top: explorationLoreToastTopPx(), zIndex: UI_LAYERS.TOASTS }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{liveAnnouncement}</span>

      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <LoreToastCard
            key={toast.id}
            toast={toast}
            index={index}
            reducedMotion={reducedMotion}
            onOpenCodex={openCodex}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export const LoreDiscoveryToast = memo(function LoreDiscoveryToast() {
  return (
    <ErrorBoundary name="lore-discovery-toast" fallback={null}>
      <LoreDiscoveryToastPanel />
    </ErrorBoundary>
  );
});
