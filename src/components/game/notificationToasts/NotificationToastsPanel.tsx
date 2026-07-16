import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastItem } from '@/components/game/notificationToasts/ToastItem';
import { useNotificationToastController } from '@/components/game/notificationToasts/useNotificationToastController';
import { shouldHideNotificationToastContainer } from '@/engine/toast/notificationToastPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { explorationStatToastTopPx } from '@/shared/constants/hudLayout';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

function NotificationToastsPanelInner() {
  const reducedMotion = useEffectiveReducedMotion();
  const { mode, transitionPhase, visibleToasts, dismissToast } = useNotificationToastController();
  const slotGranted = useNotificationSlot(
    'toast',
    NOTIFY_PRIORITY.toast,
    visibleToasts.length > 0,
  );
  const hidden = shouldHideNotificationToastContainer(mode, transitionPhase, slotGranted);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={hidden}
      data-exploration-ui
      className="notification-toast-container fixed right-3 flex flex-col items-end gap-2 sm:right-4 backdrop-blur-[4px] rounded-lg p-0.5"
      style={{
        top: explorationStatToastTopPx(),
        zIndex: UI_LAYERS.TOASTS,
        opacity: hidden ? 0 : 1,
        visibility: hidden ? 'hidden' : 'visible',
        pointerEvents: hidden ? 'none' : 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            reducedMotion={reducedMotion}
            onDismiss={dismissToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function NotificationToastsPanel() {
  return (
    <ErrorBoundary name="NotificationToasts">
      <NotificationToastsPanelInner />
    </ErrorBoundary>
  );
}
