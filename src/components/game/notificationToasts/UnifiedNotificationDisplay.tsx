/* ─── Volodka RPG – Unified Notification Display ───
 *  Centralized component that renders notifications one at a time from
 *  the priority queue. Subscribes to all EventBus notification events,
 *  enqueues them with the correct priority, and displays the current item.
 *
 *  This component coexists with the per-channel components. The per-channel
 *  components still mount (they need to stay mounted for EventBus subscription
 *  lifecycle), but their rendering is suppressed when this display is active
 *  via the useNotificationSlot arbiter (MAX_VISIBLE=1).
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import {
  enqueue,
  dequeue,
  useNotificationPriorityQueue,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_DISPLAY_DURATION_MS,
  type QueuedNotification,
} from '@/engine/notifications/notificationPriorityQueue';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { explorationStatToastTopPx } from '@/shared/constants/hudLayout';
import { useGamePhase } from '@/store/selectors';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { Shield, Scroll, BookOpen, Info, Trophy, Cloud, FlaskConical, Backpack, Zap } from 'lucide-react';

/* ─── Channel → priority mapping ─── */

const CHANNEL_PRIORITY_MAP: Record<string, number> = {
  achievement: NOTIFICATION_PRIORITY.achievement,
  quest: NOTIFICATION_PRIORITY.quest,
  lore: NOTIFICATION_PRIORITY.lore,
  // Everything else is generic
  event: NOTIFICATION_PRIORITY.generic,
  toast: NOTIFICATION_PRIORITY.generic,
  system: NOTIFICATION_PRIORITY.generic,
  weather: NOTIFICATION_PRIORITY.generic,
  crafting: NOTIFICATION_PRIORITY.generic,
  loot: NOTIFICATION_PRIORITY.generic,
};

/* ─── Channel → visual config ─── */

interface ChannelVisualConfig {
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  label: string;
}

function getChannelVisual(channel: string): ChannelVisualConfig {
  switch (channel) {
    case 'achievement':
      return {
        icon: <Trophy className="size-4" />,
        accentColor: '#fbbf24',
        borderColor: 'rgba(251, 191, 36, 0.4)',
        label: 'Достижение',
      };
    case 'quest':
      return {
        icon: <Scroll className="size-4" />,
        accentColor: '#34d399',
        borderColor: 'rgba(52, 211, 153, 0.4)',
        label: 'Квест',
      };
    case 'lore':
      return {
        icon: <BookOpen className="size-4" />,
        accentColor: '#a78bfa',
        borderColor: 'rgba(167, 139, 250, 0.4)',
        label: 'Лор',
      };
    case 'combat':
    case 'event':
      return {
        icon: <Shield className="size-4" />,
        accentColor: '#fb7185',
        borderColor: 'rgba(251, 113, 133, 0.4)',
        label: 'Событие',
      };
    case 'weather':
      return {
        icon: <Cloud className="size-4" />,
        accentColor: '#60a5fa',
        borderColor: 'rgba(96, 165, 250, 0.4)',
        label: 'Погода',
      };
    case 'crafting':
      return {
        icon: <FlaskConical className="size-4" />,
        accentColor: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        label: 'Крафт',
      };
    case 'loot':
      return {
        icon: <Backpack className="size-4" />,
        accentColor: '#fbbf24',
        borderColor: 'rgba(251, 191, 36, 0.3)',
        label: 'Добыча',
      };
    case 'system':
      return {
        icon: <Zap className="size-4" />,
        accentColor: '#fb7185',
        borderColor: 'rgba(251, 113, 133, 0.35)',
        label: 'Система',
      };
    default:
      return {
        icon: <Info className="size-4" />,
        accentColor: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.25)',
        label: 'Уведомление',
      };
  }
}

/* ─── EventBus subscription: enqueue all notification events ─── */

let eventBusSubscribed = false;

function ensureEventBusSubscriptions(): void {
  if (eventBusSubscribed) return;
  eventBusSubscribed = true;

  // Achievement events
  eventBus.on('achievement:unlocked', (payload) => {
    enqueue({
      id: `pq-ach-${payload.achievementId}-${Date.now()}`,
      channel: 'achievement',
      priority: NOTIFICATION_PRIORITY.achievement,
    });
  });

  // Quest events
  eventBus.on('story:quest_available', (payload) => {
    enqueue({
      id: `pq-quest-avail-${payload.questId}-${Date.now()}`,
      channel: 'quest',
      priority: NOTIFICATION_PRIORITY.quest,
    });
  });

  eventBus.on('quest:objective_updated', (payload) => {
    enqueue({
      id: `pq-quest-obj-${payload.questId}-${Date.now()}`,
      channel: 'quest',
      priority: NOTIFICATION_PRIORITY.quest,
    });
  });

  eventBus.on('quest:failed', (payload) => {
    enqueue({
      id: `pq-quest-fail-${payload.questId}-${Date.now()}`,
      channel: 'quest',
      priority: NOTIFICATION_PRIORITY.quest,
    });
  });

  // Lore events
  eventBus.on('lore:discovered', (payload) => {
    enqueue({
      id: `pq-lore-${payload.id}-${Date.now()}`,
      channel: 'lore',
      priority: NOTIFICATION_PRIORITY.lore,
    });
  });

  // Generic events
  eventBus.on('game:notification', (payload) => {
    enqueue({
      id: `pq-evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel: 'event',
      priority: NOTIFICATION_PRIORITY.generic,
    });
  });

  eventBus.on('ui:loot_notification', () => {
    enqueue({
      id: `pq-loot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel: 'loot',
      priority: NOTIFICATION_PRIORITY.generic,
    });
  });

  eventBus.on('weather:changed', () => {
    enqueue({
      id: `pq-weather-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel: 'weather',
      priority: NOTIFICATION_PRIORITY.generic,
    });
  });

  eventBus.on('crafting:discovered', () => {
    enqueue({
      id: `pq-craft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel: 'crafting',
      priority: NOTIFICATION_PRIORITY.generic,
    });
  });

  eventBus.on('game:system_alert', () => {
    enqueue({
      id: `pq-sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel: 'system',
      priority: NOTIFICATION_PRIORITY.generic,
    });
  });
}

/* ─── Single notification card ─── */

function UnifiedNotificationCard({ item, waitingCount }: { item: QueuedNotification; waitingCount: number }) {
  const visual = getChannelVisual(item.channel);
  const reducedMotion = useEffectiveReducedMotion();

  return (
    <motion.div
      layout
      initial={reducedMotion ? false : { x: 120, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { x: 80, opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', damping: 24, stiffness: 300 }}
      className="pointer-events-auto relative overflow-hidden max-w-[320px] w-full"
      style={{
        background: 'rgba(10, 10, 20, 0.9)',
        backdropFilter: 'blur(14px)',
        borderLeft: `3px solid ${visual.borderColor}`,
        borderRadius: 10,
        boxShadow: `0 0 16px ${visual.accentColor}33, 0 2px 8px rgba(0,0,0,0.4)`,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div
          className="flex items-center justify-center w-8 h-8 shrink-0 rounded"
          style={{
            background: `${visual.accentColor}18`,
            boxShadow: `0 0 8px ${visual.accentColor}25`,
            color: visual.accentColor,
          }}
        >
          {visual.icon}
        </div>
        {/* Label */}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-xs font-mono font-bold tracking-wide uppercase"
            style={{ color: visual.accentColor }}
          >
            {visual.label}
          </span>
          {waitingCount > 0 && (
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">
              +{waitingCount} в очереди
            </span>
          )}
        </div>
      </div>
      {/* Countdown bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ background: visual.accentColor, boxShadow: `0 0 6px ${visual.accentColor}40` }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: NOTIFICATION_DISPLAY_DURATION_MS / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* ─── Main component ─── */

export function UnifiedNotificationDisplay() {
  const mode = useGamePhase();
  const { current, queueLength } = useNotificationPriorityQueue();

  // Set up EventBus subscriptions once
  useEffect(() => {
    ensureEventBusSubscriptions();
  }, []);

  // Don't render in menu/intro
  if (mode === 'menu' || mode === 'intro') return null;
  if (!current) return null;

  return (
    <div
      className="fixed right-3 sm:right-4 pointer-events-none flex flex-col items-end gap-2"
      data-exploration-ui
      data-testid="unified-notification-display"
      style={{
        top: explorationStatToastTopPx(),
        zIndex: UI_LAYERS.TOASTS + 2,
      }}
    >
      <AnimatePresence mode="popLayout">
        <UnifiedNotificationCard
          key={current.id}
          item={current}
          waitingCount={queueLength}
        />
      </AnimatePresence>
    </div>
  );
}
