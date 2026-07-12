import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NOTIFICATION_TOAST_AUTO_DISMISS_MS } from '@/engine/toast/notificationToastConstants';
import {
  buildToastAccessibleLabel,
  formatToastDelta,
  getToastItemMotion,
  type VisibleNotificationToast,
} from '@/engine/toast/notificationToastPresentation';
import { NOTIFICATION_TOAST_ICONS } from '@/engine/toast/notificationToastConstants';

type ToastItemProps = {
  toast: VisibleNotificationToast;
  reducedMotion: boolean;
  onDismiss: (id: string) => void;
};

export const ToastItem = memo(function ToastItem({
  toast,
  reducedMotion,
  onDismiss,
}: ToastItemProps) {
  const [hovered, setHovered] = useState(false);
  const icon = NOTIFICATION_TOAST_ICONS[toast.type];
  const deltaStr = formatToastDelta(toast.delta);
  const motionProps = getToastItemMotion(reducedMotion);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), NOTIFICATION_TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      role="alert"
      aria-label={buildToastAccessibleLabel(toast.type, toast.message)}
      layout
      {...motionProps}
      onClick={() => onDismiss(toast.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onDismiss(toast.id);
        }
      }}
      tabIndex={0}
      data-toast-type={toast.type}
      data-hovered={hovered ? 'true' : 'false'}
      className="notification-toast-card pointer-events-auto w-full max-w-[320px] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <span className="notification-toast-icon" aria-hidden="true">
        {icon.icon}
      </span>

      <div className="notification-toast-body">
        <span className="notification-toast-message">{toast.message}</span>
        {deltaStr && <span className="notification-toast-delta">{deltaStr}</span>}
      </div>
    </motion.div>
  );
});
