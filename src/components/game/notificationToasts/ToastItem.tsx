import { memo, useEffect, useRef, useState } from 'react';
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
  const [elapsed, setElapsed] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(performance.now());
  const pausedAtRef = useRef<number>(0);

  const icon = NOTIFICATION_TOAST_ICONS[toast.type];
  const deltaStr = formatToastDelta(toast.delta);
  const motionProps = getToastItemMotion(reducedMotion);

  /* Countdown timer: ticks progress bar. Pauses on hover. */
  useEffect(() => {
    if (hovered) {
      pausedAtRef.current = elapsed;
      return;
    }

    const tick = (now: number) => {
      const delta = now - startRef.current - pausedAtRef.current;
      setElapsed(delta);
      if (delta < NOTIFICATION_TOAST_AUTO_DISMISS_MS) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss(toast.id);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [hovered, toast.id, onDismiss, elapsed]);

  /* Reset timer when toast changes */
  useEffect(() => {
    startRef.current = performance.now();
    setElapsed(0);
    pausedAtRef.current = 0;
  }, [toast.id]);

  const progressPct = Math.min(100, (elapsed / NOTIFICATION_TOAST_AUTO_DISMISS_MS) * 100);

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
      className="notification-toast-card notification-toast-card--enhanced hud-filmic-notification-slide pointer-events-auto w-full max-w-[320px] cursor-pointer"
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

      {/* Auto-dismiss progress bar */}
      {!reducedMotion && (
        <div
          className="notification-toast-progress-track"
          aria-hidden="true"
        >
          <div
            className="notification-toast-progress-fill"
            style={{
              width: `${100 - progressPct}%`,
              background: 'var(--toast-border-color)',
              transition: hovered ? 'none' : 'width 100ms linear',
            }}
          />
        </div>
      )}
    </motion.div>
  );
});
