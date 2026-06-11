
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
import { useGamePhase } from '@/store/selectors';

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
          className="event-notification-popup pointer-events-auto relative overflow-hidden"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            borderRadius: '8px',
            boxShadow: accent.shadow,
            minWidth: '220px',
            maxWidth: '320px',
          }}
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.9 }}
          transition={{
            duration: 0.4,
            delay: index * (STAGGER_DELAY_MS / 1000),
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* ── Horizontal line sweep animation on entry ── */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${accent.primary}20 40%, ${accent.primary}50 50%, ${accent.primary}20 60%, transparent 100%)`,
              backgroundSize: '300% 100%',
            }}
            initial={{ backgroundPosition: '100% 0%' }}
            animate={{ backgroundPosition: '-100% 0%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* ── Hex-grid pattern overlay (subtle) ── */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(accent.primary)}' fill-opacity='0.015'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              opacity: 0.6,
            }}
          />

          {/* ── Neon border glow pulse ── */}
          <motion.div
            className="absolute inset-0 rounded-[8px] pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 6px ${accent.glow}, inset 0 0 3px ${accent.glow}`,
                `0 0 16px ${accent.glow}, inset 0 0 6px ${accent.glow}`,
                `0 0 6px ${accent.glow}, inset 0 0 3px ${accent.glow}`,
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Corner bracket decorations ── */}
          <div className="absolute top-0 left-0 w-3 h-3 pointer-events-none z-20" style={{ borderTop: `1px solid ${accent.primary}40`, borderLeft: `1px solid ${accent.primary}40` }} />
          <div className="absolute top-0 right-0 w-3 h-3 pointer-events-none z-20" style={{ borderTop: `1px solid ${accent.primary}40`, borderRight: `1px solid ${accent.primary}40` }} />
          <div className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none z-20" style={{ borderBottom: `1px solid ${accent.primary}40`, borderLeft: `1px solid ${accent.primary}40` }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none z-20" style={{ borderBottom: `1px solid ${accent.primary}40`, borderRight: `1px solid ${accent.primary}40` }} />

          {/* ── Content ── */}
          <div className="relative z-10 flex items-center gap-3 px-4 py-3">
            {/* Icon */}
            <div
              className="event-notification-icon flex items-center justify-center w-8 h-8 shrink-0 rounded"
              style={{
                background: accent.iconBg,
                boxShadow: `0 0 8px ${accent.glow}`,
              }}
            >
              {entry.type === 'combat' && <Shield className="size-4" style={{ color: accent.primary }} />}
              {entry.type === 'scene' && <Map className="size-4" style={{ color: accent.primary }} />}
              {entry.type === 'achievement' && <Trophy className="size-4" style={{ color: accent.primary }} />}
              {entry.type === 'quest' && <Scroll className="size-4" style={{ color: accent.primary }} />}
              {entry.type === 'info' && <Info className="size-4" style={{ color: accent.primary }} />}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span
                className="text-sm font-mono font-bold tracking-wide truncate"
                style={{ color: accent.primary }}
              >
                {entry.title}
              </span>
              {entry.subtitle && (
                <span
                  className="text-[11px] font-mono truncate"
                  style={{ color: 'rgba(148, 163, 184, 0.65)' }}
                >
                  {entry.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* ── Bottom accent bar ── */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px]"
            style={{ background: accent.primary, boxShadow: `0 0 6px ${accent.glow}` }}
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
  }, []);

  /* ── Listen for game:notification events ── */
  useEffect(() => {
    const unsub = eventBus.on('game:notification', (payload) => {
      addNotification({
        title: payload.title,
        subtitle: payload.subtitle,
        type: payload.type,
      });
    });
    return unsub;
  }, [addNotification]);

  /* scene:enter — handled by center scene banner in GameOrchestrator (no duplicate toast) */

  /* ── Listen for combat:start → "Бой начинается!" ── */
  useEffect(() => {
    const unsub = eventBus.on('combat:start', () => {
      addNotification({
        title: 'Бой начинается!',
        subtitle: 'Приготовьтесь к бою',
        type: 'combat',
      });
    }, EventBusPriority.UI);
    return unsub;
  }, [addNotification]);

  /* ── Listen for combat:victory → "Победа!" ── */
  useEffect(() => {
    const unsub = eventBus.on('combat:victory', (payload) => {
      addNotification({
        title: 'Победа!',
        subtitle: `+${payload.xpGained} ОД`,
        type: 'combat',
      });
    }, EventBusPriority.UI);
    return unsub;
  }, [addNotification]);

  /* quest:completed / achievement:unlocked — QuestNotificationSystem & AchievementNotification */

  /* ── Cleanup all timers on unmount ── */
  useEffect(() => {
    return () => {
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
        delete timers[key];
      }
    };
  }, []);

  const mode = useGamePhase();
  if (mode === 'menu' || mode === 'intro') return null;
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
