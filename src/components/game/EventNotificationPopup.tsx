
/* ─── Volodka RPG – Event Notification Popup ─── */
/* Dramatic in-game event notifications with cyberpunk styling.
 * Listens on EventBus for game:notification and other game events
 * (scene:enter, combat:start, combat:victory, quest:completed, achievement:unlocked)
 * and displays dramatic popups that slide in from the right, stack vertically
 * with stagger, and auto-dismiss after 3 seconds. */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Map, Trophy, Scroll, Info } from 'lucide-react';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { explorationEventToastTopPx } from '@/shared/constants/hudLayout';
import { sanitizePlainText } from '@/shared/utils/sanitizePlainText';
import { useGamePhase } from '@/store/selectors';
import { useSuppressGameplayToasts } from '@/hooks/useSuppressGameplayToasts';

/* ─── Types ─── */

type NotificationType = 'combat' | 'scene' | 'achievement' | 'quest' | 'info';

interface NotificationEntry {
  id: string;
  title: string;
  subtitle?: string;
  type: NotificationType;
  createdAt: number;
}

/* ─── Constants ─── */

/** How long a notification stays visible before auto-dismissing */
const NOTIFICATION_DURATION_MS = 3000;
/** Maximum number of stacked notifications */
const MAX_NOTIFICATIONS = 5;
/** Stagger delay between stacked notifications (ms) */
const STAGGER_DELAY_MS = 120;

/* ─── Accent colour map ─── */

const ACCENT_MAP: Record<NotificationType, {
  primary: string;
  glow: string;
  border: string;
  bg: string;
  shadow: string;
  iconBg: string;
}> = {
  combat: {
    primary: '#fb7185',     // rose-400
    glow: 'rgba(251, 113, 133, 0.15)',
    border: 'rgba(251, 113, 133, 0.35)',
    bg: 'rgba(30, 12, 16, 0.82)',
    shadow: '0 0 12px rgba(251, 113, 133, 0.12)',
    iconBg: 'rgba(251, 113, 133, 0.12)',
  },
  scene: {
    primary: 'var(--cyber-cyan)',     // cyan-400
    glow: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
    border: 'rgb(var(--cyber-cyan-rgb) / 0.35)',
    bg: 'rgba(8, 20, 30, 0.82)',
    shadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.12)',
    iconBg: 'rgb(var(--cyber-cyan-rgb) / 0.12)',
  },
  achievement: {
    primary: '#fbbf24',     // amber-400
    glow: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
    bg: 'rgba(20, 16, 8, 0.82)',
    shadow: '0 0 12px rgba(251, 191, 36, 0.12)',
    iconBg: 'rgba(251, 191, 36, 0.12)',
  },
  quest: {
    primary: '#34d399',     // emerald-400
    glow: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
    bg: 'rgba(8, 24, 18, 0.82)',
    shadow: '0 0 12px rgba(52, 211, 153, 0.12)',
    iconBg: 'rgba(52, 211, 153, 0.12)',
  },
  info: {
    primary: '#94a3b8',     // slate-400
    glow: 'rgba(148, 163, 184, 0.10)',
    border: 'rgba(148, 163, 184, 0.25)',
    bg: 'rgba(15, 18, 24, 0.82)',
    shadow: '0 0 12px rgba(148, 163, 184, 0.08)',
    iconBg: 'rgba(148, 163, 184, 0.10)',
  },
};

/* ─── ID counter ─── */
let nextId = 0;

/* ─── Single notification card ─── */

function NotificationCard({ entry, index }: { entry: NotificationEntry; index: number }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accent = ACCENT_MAP[entry.type];

  useEffect(() => {
    // Auto-dismiss after duration
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, NOTIFICATION_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {!exiting && (
        <motion.div
          layout
          key={entry.id}
          className="event-notification-popup hud-filmic-toast pointer-events-auto relative overflow-hidden"
          style={{
            background: accent.bg,
            borderColor: accent.border,
            minWidth: '220px',
            maxWidth: '320px',
          }}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{
            duration: 0.32,
            delay: index * (STAGGER_DELAY_MS / 1000),
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* ── Content ── */}
          <div className="relative z-10 flex items-center gap-3">
            {/* Icon */}
            <div
              className="event-notification-icon flex items-center justify-center w-6 h-6 shrink-0"
              style={{
                color: accent.primary,
              }}
            >
              {entry.type === 'combat' && <Shield className="size-3.5" />}
              {entry.type === 'scene' && <Map className="size-3.5" />}
              {entry.type === 'achievement' && <Trophy className="size-3.5" />}
              {entry.type === 'quest' && <Scroll className="size-3.5" />}
              {entry.type === 'info' && <Info className="size-3.5" />}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span
                className="hud-filmic-kicker truncate"
                style={{ color: accent.primary }}
              >
                {entry.title}
              </span>
              {entry.subtitle && (
                <span
                  className="hud-filmic-body text-[11px] truncate"
                  style={{ textAlign: 'left' }}
                >
                  {entry.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* ── Bottom accent bar ── */}
          <motion.div
            className="absolute bottom-0 left-0 h-px"
            style={{ background: accent.primary, opacity: 0.45 }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: NOTIFICATION_DURATION_MS / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main component ─── */

export function EventNotificationPopup() {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  // High-priority slot claim — event popups preempt loot/crafting/etc.
  const slotGranted = useNotificationSlot('event', NOTIFY_PRIORITY.event, notifications.length > 0);
  const timersMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const timers = timersMap.current;

  /** Add a notification to the queue */
  const addNotification = useCallback((entry: Omit<NotificationEntry, 'id' | 'createdAt'>) => {
    const id = `evt-notif-${++nextId}`;
    const newEntry: NotificationEntry = {
      ...entry,
      id,
      createdAt: Date.now(),
    };

    setNotifications((prev) => {
      // Keep only the most recent MAX_NOTIFICATIONS
      const updated = [...prev, newEntry].slice(-MAX_NOTIFICATIONS);
      return updated;
    });

    // Auto-remove after duration + exit animation time
    const removeTimer = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      delete timers[id];
    }, NOTIFICATION_DURATION_MS + 500); // extra 500ms for exit animation

    timers[id] = removeTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, []);

  /* ── Listen for game:notification events ── */
  useEffect(() => {
    const unsub = eventBus.on('game:notification', (payload) => {
      addNotification({
        title: sanitizePlainText(payload.title),
        subtitle: payload.subtitle ? sanitizePlainText(payload.subtitle) : undefined,
        type: payload.type,
      });
    });
    return unsub;
  }, [addNotification]);

  /* ── Diegetic exploration toasts from 3D triggers / poem powers ── */
  useEffect(() => {
    const unsub = eventBus.on('ui:exploration_message', (payload) => {
      addNotification({
        title: sanitizePlainText(payload.text),
        type: 'info',
      });
    }, EventBusPriority.UI);
    return unsub;
  }, [addNotification]);

  /* scene:enter — handled by center scene banner in GameOrchestrator (no duplicate toast) */

  /* combat:start — handled by CombatUI intro overlay (emoji + enemy name).
     Previously duplicated here as a toast — removed to avoid double-display. */

  /* combat:victory — handled by DamageNumberFloat (floating "+X ОД" number)
     and CombatUI combat log. Previously duplicated here as a toast — removed. */

  /* quest:completed / achievement:unlocked — QuestNotificationSystem & AchievementNotification */

  /* ── Cleanup all timers on unmount ── */
  useEffect(() => {
    return () => {
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
        delete timers[key];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, []);

  const mode = useGamePhase();
  const suppressToasts = useSuppressGameplayToasts();
  if (mode === 'menu' || mode === 'intro') return null;
  if (suppressToasts) return null;
  if (!slotGranted) return null;

  /* ── Render ── */
  return (
    <div
      className="fixed right-3 sm:right-4 pointer-events-none flex flex-col gap-2"
      data-exploration-ui
      style={{ top: explorationEventToastTopPx(), zIndex: UI_LAYERS.TOASTS }}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((entry, index) => (
          <NotificationCard
            key={entry.id}
            entry={entry}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
