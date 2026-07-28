/* ─── Volodka RPG – Enhanced Notification System v2.0 ───
   Система уведомлений с:
   – Киберпанк стилизацией (neon glow, holographic panels)
   – Типизированными нотификациями (success, warning, error, info, achievement)
   – Stack-able уведомлениями с auto-dismiss
   – Sound integration hooks
   – Priority levels и persistence
   – Smooth enter/exit анимациями
*/

import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Trophy,
  Star,
  Zap,
  BookOpen,
  Gift,
  Target,
  Sparkles,
  X,
} from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Types ─── */
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'quest' | 'loot' | 'karma' | 'poem' | 'levelup' | 'combat';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface EnhancedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  icon?: React.ReactNode;
  duration?: number; // ms, default based on priority
  priority?: NotificationPriority;
  persistent?: boolean; // requires manual dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number; // 0-1 for progress-type notifications
  timestamp?: number;
}

interface EnhancedNotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxVisible?: number;
  stackSpacing?: number;
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
}

/* ─── Type Configuration ─── */
const typeConfig: Record<NotificationType, {
  icon: React.ReactNode;
  color: string;
  rgb: string;
  borderGlow: string;
  bgGradient: string;
}> = {
  info: {
    icon: <Info className="size-full" />,
    color: '#00e5ff',
    rgb: '0, 229, 255',
    borderGlow: 'rgba(0, 229, 255, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08), transparent)',
  },
  success: {
    icon: <CheckCircle className="size-full" />,
    color: '#39ff14',
    rgb: '57, 255, 20',
    borderGlow: 'rgba(57, 255, 20, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(57, 255, 20, 0.08), transparent)',
  },
  warning: {
    icon: <AlertTriangle className="size-full" />,
    color: '#ffab00',
    rgb: '255, 171, 0',
    borderGlow: 'rgba(255, 171, 0, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 171, 0, 0.1), transparent)',
  },
  error: {
    icon: <XCircle className="size-full" />,
    color: '#ff1744',
    rgb: '255, 23, 68',
    borderGlow: 'rgba(255, 23, 68, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 23, 68, 0.12), transparent)',
  },
  achievement: {
    icon: <Trophy className="size-full" />,
    color: '#ffd700',
    rgb: '255, 215, 0',
    borderGlow: 'rgba(255, 215, 0, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 171, 0, 0.05))',
  },
  quest: {
    icon: <Target className="size-full" />,
    color: '#a78bfa',
    rgb: '167, 139, 250',
    borderGlow: 'rgba(167, 139, 250, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1), transparent)',
  },
  loot: {
    icon: <Gift className="size-full" />,
    color: '#34d399',
    rgb: '52, 211, 153',
    borderGlow: 'rgba(52, 211, 153, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1), transparent)',
  },
  karma: {
    icon: <Sparkles className="size-full" />,
    color: '#f472b6',
    rgb: '244, 114, 182',
    borderGlow: 'rgba(244, 114, 182, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.1), transparent)',
  },
  poem: {
    icon: <BookOpen className="size-full" />,
    color: '#ffab00',
    rgb: '255, 171, 0',
    borderGlow: 'rgba(255, 171, 0, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 171, 0, 0.12), rgba(255, 215, 0, 0.05))',
  },
  levelup: {
    icon: <Star className="size-full" />,
    color: '#00e5ff',
    rgb: '0, 229, 255',
    borderGlow: 'rgba(0, 229, 255, 0.7)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 255, 100, 0.08))',
  },
  combat: {
    icon: <Zap className="size-full" />,
    color: '#ff1744',
    rgb: '255, 23, 68',
    borderGlow: 'rgba(255, 23, 68, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 23, 68, 0.15), transparent)',
  },
};

/* ─── Default Duration by Priority ─── */
const defaultDuration: Record<NotificationPriority, number> = {
  low: 3000,
  medium: 4500,
  high: 6000,
  critical: 8000,
};

/* ─── Individual Notification Card ─── */
const NotificationCard = memo(function NotificationCard({
  notification,
  onDismiss,
  onAction,
}: {
  notification: EnhancedNotification;
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const config = typeConfig[notification.type];
  const duration = notification.duration ?? defaultDuration[notification.priority || 'medium'];

  /* Auto-dismiss timer */
  useEffect(() => {
    if (notification.persistent || isHovered) return;

    timerRef.current = setTimeout(() => {
      onDismiss(notification.id);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification.id, notification.persistent, isHovered, duration, onDismiss]);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onDismiss(notification.id);
  }, [notification.id, onDismiss]);

  const handleAction = useCallback(() => {
    notification.action?.onClick();
    onAction(notification.id);
  }, [notification, onAction]);

  /* Special styling for achievements and level-ups */
  const isSpecial = notification.type === 'achievement' || notification.type === 'levelup';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: -40,
        scale: 0.95,
        transition: { duration: 0.25 },
      }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative w-[340px] rounded-lg overflow-hidden cursor-pointer select-none
        ${isSpecial ? 'border-2' : 'border'}
        backdrop-blur-xl
      `}
      style={{
        background: `linear-gradient(
          145deg,
          rgba(2, 6, 23, 0.97),
          rgba(15, 23, 42, 0.94)
        )`,
        borderColor: config.color + '80',
        boxShadow: isSpecial
          ? `0 0 30px ${config.borderGlow}, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 0 16px ${config.borderGlow}20, 0 8px 24px rgba(0,0,0,0.4)`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = isSpecial
          ? `0 0 40px ${config.borderGlow}, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 0 24px ${config.borderGlow}, 0 8px 24px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = isSpecial
          ? `0 0 30px ${config.borderGlow}, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 0 16px ${config.borderGlow}20, 0 8px 24px rgba(0,0,0,0.4)`;
      }}
    >
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: config.bgGradient }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(
            90deg,
            transparent,
            ${config.color},
            transparent
          )`,
          opacity: 0.8,
        }}
      />

      {/* Progress bar for timed notifications */}
      {!notification.persistent && !isHovered && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
          style={{ backgroundColor: config.color }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}

      {/* Content */}
      <div className={`relative p-3 ${isSpecial ? 'pb-4' : ''}`}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex-shrink-0 size-8 flex items-center justify-center rounded-md mt-0.5"
            style={{
              backgroundColor: `${config.color}18`,
              color: config.color,
              filter: `drop-shadow(0 0 4px ${config.color}60)`,
            }}
          >
            {notification.icon || config.icon}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-semibold truncate"
              style={{ color: config.color }}
            >
              {notification.title}
            </h4>
            {notification.message && (
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {notification.message}
              </p>
            )}

            {/* Action button */}
            {notification.action && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction();
                }}
                className="mt-2 text-xs font-mono px-2 py-1 rounded border transition-colors hover:bg-white/10"
                style={{
                  borderColor: `${config.color}50`,
                  color: config.color,
                }}
              >
                {notification.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="flex-shrink-0 p-1 rounded opacity-40 hover:opacity-100 hover:bg-white/10 transition-all"
            aria-label="Закрыть"
          >
            <X className="size-4 text-slate-300" />
          </button>
        </div>

        {/* Achievement/Level-up special footer */}
        {(notification.type === 'achievement' || notification.type === 'levelup') && (
          <div className="mt-2 flex items-center justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="size-3"
                style={{
                  color: i < 3 ? config.color : 'rgba(255,255,255,0.2)',
                  filter: i < 3 ? `drop-shadow(0 0 4px ${config.color})` : undefined,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scanline effect for special types */}
      {isSpecial && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(${config.rgb}, 0.03) 2px,
              rgba(${config.rgb}, 0.03) 4px
            )`,
          }}
        />
      )}
    </motion.div>
  );
});

/* ─── Main Notification System Container ─── */
export function EnhancedNotificationSystem({
  position = 'top-right',
  maxVisible = 5,
  _stackSpacing = 12,
  onDismiss,
  onAction,
}: EnhancedNotificationSystemProps) {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);

  /* Position styles */
  const positionStyles: Record<string, string> = {
    'top-right': 'fixed top-4 right-4 flex flex-col-reverse gap-2',
    'top-left': 'fixed top-4 left-4 flex flex-col-reverse gap-2',
    'bottom-right': 'fixed bottom-4 right-4 flex flex-col gap-2',
    'bottom-left': 'fixed bottom-4 left-4 flex flex-col gap-2',
    'top-center': 'fixed top-4 left-1/2 -translate-x-1/2 flex flex-col-reverse gap-2',
  };

  /* Public API methods */
  const addNotification = useCallback((notification: Omit<EnhancedNotification, 'id' | 'timestamp'>) => {
    const newNotification: EnhancedNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setNotifications((prev) => {
      const updated = [...prev, newNotification];
      // Limit to maxVisible
      if (updated.length > maxVisible) {
        return updated.slice(-maxVisible);
      }
      return updated;
    });
  }, [maxVisible]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    onDismiss?.(id);
  }, [onDismiss]);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearByType = useCallback((type: NotificationType) => {
    setNotifications((prev) => prev.filter((n) => n.type !== type));
  }, []);

  /* Expose API via ref or global (simplified here - would use imperative handle in production) */
  useEffect(() => {
    // Register globally for other components to use
    (window as unknown as Record<string, unknown>).__enhancedNotifications = {
      add: addNotification,
      dismiss: dismissNotification,
      dismissAll,
      clearByType,
    };

    return () => {
      delete (window as unknown as Record<string, unknown>).__enhancedNotifications;
    };
  }, [addNotification, dismissNotification, dismissAll, clearByType]);

  /* Render nothing if no notifications */
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`${positionStyles[position]}`}
      role="region"
      aria-label="Уведомления"
      style={{ zIndex: UI_LAYERS.TOASTS }}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
            onAction={(id) => {
              onAction?.(id);
              dismissNotification(id);
            }}
          />
        ))}
      </AnimatePresence>

      {/* Clear all button when many notifications */}
      {notifications.length > 3 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
          onClick={dismissAll}
          className="self-end text-[10px] font-mono text-slate-500 hover:text-cyan-400 px-2 py-1 transition-colors"
        >
          Очистить все ({notifications.length})
        </motion.button>
      )}
    </div>
  );
}

/* ─── Convenience functions ─── */

/** Show a success notification */
export function notifySuccess(title: string, message?: string) {
  (window as unknown as { __enhancedNotifications?: { add: (n: Omit<EnhancedNotification, 'id' | 'timestamp'>) => void } })?.__enhancedNotifications?.add?.({
    type: 'success',
    title,
    message,
  });
}

/** Show an error notification */
export function notifyError(title: string, message?: string) {
  (window as unknown as { __enhancedNotifications?: { add: (n: Omit<EnhancedNotification, 'id' | 'timestamp'>) => void } })?.__enhancedNotifications?.add?.({
    type: 'error',
    title,
    message,
    priority: 'high',
    persistent: true,
  });
}

/** Show an achievement notification */
export function notifyAchievement(title: string, description?: string) {
  (window as unknown as { __enhancedNotifications?: { add: (n: Omit<EnhancedNotification, 'id' | 'timestamp'>) => void } })?.__enhancedNotifications?.add?.({
    type: 'achievement',
    title: '🏆 Достижение!',
    message: description || title,
    priority: 'high',
    duration: 5000,
  });
}

/** Show a level up notification */
export function notifyLevelUp(newLevel: number, rewards?: string) {
  (window as unknown as { __enhancedNotifications?: { add: (n: Omit<EnhancedNotification, 'id' | 'timestamp'>) => void } })?.__enhancedNotifications?.add?.({
    type: 'levelup',
    title: `⬆ Уровень ${newLevel}!`,
    message: rewards,
    priority: 'high',
    duration: 6000,
  });
}

/** Show a quest update notification */
export function notifyQuestUpdate(title: string, objective?: string) {
  (window as unknown as { __enhancedNotifications?: { add: (n: Omit<EnhancedNotification, 'id' | 'timestamp'>) => void } })?.__enhancedNotifications?.add?.({
    type: 'quest',
    title,
    message: objective,
  });
}

/** Show a poem discovery notification */
export function notifyPoemDiscovered(poemTitle: string) {
  (window as unknown as { __enhancedNotifications?: { add: (n: Omit<EnhancedNotification, 'id' | 'timestamp'>) => void } })?.__enhancedNotifications?.add?.({
    type: 'poem',
    title: '📖 Стих найден!',
    message: poemTitle,
    priority: 'medium',
  });
}

/** Show a karma change notification */
export function notifyKarmaChange(amount: number, reason?: string) {
  const prefix = amount >= 0 ? '+' : '';
  (window as unknown as { __enhancedNotifications?: { add: (n: Omit<EnhancedNotification, 'id' | 'timestamp'>) => void } })?.__enhancedNotifications?.add?.({
    type: 'karma',
    title: `Карма ${prefix}${amount}`,
    message: reason,
  });
}

/** Show a combat notification */
export function notifyCombat(damage: number, targetName?: string) {
  (window as unknown as { __enhancedNotifications?: { add: (n: Omit<EnhancedNotification, 'id' | 'timestamp'>) => void } })?.__enhancedNotifications?.add?.({
    type: 'combat',
    title: `-${damage} урона`,
    message: targetName,
    priority: 'high',
    duration: 3500,
  });
}

export default EnhancedNotificationSystem;
