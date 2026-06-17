
/* ─── Volodka RPG – Achievement Notification ───
   Animated popup that appears when an achievement is unlocked.
   Subscribes to achievement:unlocked events from EventBus.
   Supports queue system for multiple simultaneous unlocks.
   Auto-dismisses after 4 seconds. Sound effect on unlock.
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamePhase } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { playAchievementUnlockSound } from '@/engine/achievementAudio';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { explorationAchievementTopPx, EXPLORATION_HUD_LAYOUT } from '@/shared/constants/hudLayout';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { CATEGORY_META, RARITY_META, type AchievementCategory } from '@/data/achievements';

/* ─── Notification State ─── */

interface AchievementNotif {
  id: string;
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  soundEffect?: string;
  accessibilityAnnounce: string;
  timestamp: number;
}

const DISPLAY_DURATION_MS = 4000;
const MAX_VISIBLE = 4;
const QUEUE_PROCESS_DELAY_MS = 600; // Stagger between queued items

/* ─── Keyframe CSS for shine + sound-wave (injected once) ─── */

let stylesInjected = false;

function injectAchievementStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'achievement-notification-styles';
  style.textContent = `
    @keyframes achievement-shine {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(300%) skewX(-15deg); }
    }
    @keyframes achievement-soundwave {
      0%, 100% { opacity: 0.4; transform: scaleY(1); }
      50% { opacity: 1; transform: scaleY(1.8); }
    }
    @keyframes achievement-border-pulse {
      0%, 100% { border-color: rgba(0,255,255,0.3); }
      50% { border-color: rgba(0,255,255,0.6); }
    }
    @keyframes achievement-glow-pulse {
      0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.1), 0 0 40px rgba(251,191,36,0.05); }
      50% { box-shadow: 0 0 25px rgba(251,191,36,0.2), 0 0 50px rgba(251,191,36,0.08); }
    }
    .ach-card-shine::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 40%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,0.08),
        rgba(251,191,36,0.12),
        rgba(255,255,255,0.08),
        transparent
      );
      animation: achievement-shine 1.2s ease-out forwards;
      pointer-events: none;
    }
    .ach-border-pulse {
      animation: achievement-border-pulse 1.5s ease-in-out infinite;
    }
    .ach-glow-pulse {
      animation: achievement-glow-pulse 1.5s ease-in-out infinite;
    }
    .ach-soundwave-bar {
      animation: achievement-soundwave 0.8s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

/* ─── Play achievement unlock sound ─── */

function playAchievementSound(soundEffect?: string) {
  playAchievementUnlockSound(soundEffect);
}

/* ─── Single Achievement Card ─── */

function AchievementCard({
  notification,
  onDismiss,
}: {
  notification: AchievementNotif;
  onDismiss: (id: string) => void;
}) {
  const { title, description, icon, category, rarity } = notification;
  const catMeta = CATEGORY_META[category as AchievementCategory];
  const rarityMeta = RARITY_META[rarity as keyof typeof RARITY_META];

  // Auto-dismiss after DISPLAY_DURATION_MS
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), DISPLAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  // Inject styles on first render
  useEffect(() => {
    injectAchievementStyles();
  }, []);

  return (
    <motion.div
      layout
      initial={{ x: 300, opacity: 0, scale: 0.92 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 300, opacity: 0, scale: 0.92 }}
      transition={{
        type: 'spring',
        damping: 22,
        stiffness: 260,
        mass: 0.8,
      }}
      className={`
        relative overflow-hidden
        bg-slate-950/90 backdrop-blur-md
        border rounded-lg
        ach-border-pulse ach-card-shine ach-glow-pulse
        cursor-pointer
      `}
      style={{
        width: 300,
        borderColor: `${catMeta?.color ?? '#fbbf24'}40`,
        boxShadow: `0 0 20px ${catMeta?.color ?? '#fbbf24'}15, 0 0 40px ${catMeta?.color ?? '#fbbf24'}08`,
      }}
      onClick={() => onDismiss(notification.id)}
    >
      {/* Sound-wave border effect — left edge bars */}
      <div
        className="absolute left-0 top-0 bottom-0 flex flex-col justify-around items-center"
        style={{ width: 3, overflow: 'hidden' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="ach-soundwave-bar rounded-full"
            style={{
              width: 2,
              height: 3,
              backgroundColor: `${catMeta?.color ?? '#fbbf24'}99`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex items-center gap-3 p-3 pl-5">
        {/* Icon */}
        <div
          className="flex items-center justify-center shrink-0 rounded-md"
          style={{
            width: 40,
            height: 40,
            background: `${catMeta?.color ?? '#fbbf24'}15`,
            fontSize: 20,
            boxShadow: `0 0 12px ${catMeta?.color ?? '#fbbf24'}25`,
          }}
        >
          {icon}
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-semibold leading-tight truncate"
              style={{ color: catMeta?.color ?? '#fbbf24' }}
            >
              {title}
            </span>
          </div>
          <span className="text-slate-400 text-xs leading-tight mt-0.5 truncate">
            {description}
          </span>
          <span
            className="text-[9px] font-mono mt-0.5 opacity-50"
            style={{ color: rarityMeta?.color ?? catMeta?.color ?? '#fbbf24' }}
          >
            {rarityMeta?.label ?? 'Обычное'} · {catMeta?.label}
          </span>
        </div>

        {/* Trophy badge */}
        <div
          className="shrink-0 ml-auto text-lg"
          style={{ filter: `drop-shadow(0 0 4px ${catMeta?.color ?? '#fbbf24'}80)` }}
        >
          🏆
        </div>
      </div>

      {/* Progress bar at bottom (auto-dismiss timer) */}
      <motion.div
        className="h-0.5"
        style={{
          background: `linear-gradient(90deg, ${catMeta?.color ?? '#fbbf24'}, transparent)`,
        }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: DISPLAY_DURATION_MS / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* ─── Main AchievementNotification Component ─── */

export function AchievementNotification() {
  const [notifications, setNotifications] = useState<AchievementNotif[]>([]);
  const [liveAnnounce, setLiveAnnounce] = useState('');
  const queueRef = useRef<AchievementNotif[]>([]);
  const processingRef = useRef(false);
  const shownAchievements = useRef(new Set<string>());

  /* ── Process queue with stagger ── */
  const processQueueRef = useRef<() => void>(() => {});

  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    if (queueRef.current.length === 0) return;

    processingRef.current = true;
    const next = queueRef.current.shift()!;

    setNotifications((prev) => {
      const updated = [...prev, next];
      return updated.slice(-MAX_VISIBLE);
    });

    // Play sound
    playAchievementSound(next.soundEffect);
    setLiveAnnounce(next.accessibilityAnnounce);

    // Wait before processing next
    setTimeout(() => {
      processingRef.current = false;
      processQueueRef.current();
    }, QUEUE_PROCESS_DELAY_MS);
  }, []);

  // Keep ref in sync
  useEffect(() => { processQueueRef.current = processQueue; }, [processQueue]);

  /* ── Add achievement to queue ── */
  const queueAchievement = useCallback((notif: AchievementNotif) => {
    if (shownAchievements.current.has(notif.achievementId)) return;
    shownAchievements.current.add(notif.achievementId);

    queueRef.current.push(notif);
    processQueue();
  }, [processQueue]);

  /* ── Dismiss handler ── */
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /* ── Subscribe to achievement:unlocked events from EventBus ── */
  useEffect(() => {
    const unsub = eventBus.on('achievement:unlocked', (payload) => {
      const notifId = `ach-${payload.achievementId}-${Date.now()}`;
      queueAchievement({
        id: notifId,
        achievementId: payload.achievementId,
        title: payload.title,
        description: payload.description,
        icon: payload.icon,
        category: payload.category,
        rarity: payload.rarity,
        soundEffect: payload.soundEffect,
        accessibilityAnnounce: payload.accessibilityAnnounce,
        timestamp: Date.now(),
      });
    });

    return unsub;
  }, [queueAchievement]);

  /* ── Also subscribe to fx:achievement for backward compat ── */
  useEffect(() => {
    const unsub = eventBus.on('fx:achievement', (_payload) => {
      // Only process if not already handled by achievement:unlocked
      // (achievement:unlocked is the primary, fx:achievement is the visual effect)
      // We don't double-queue here — the achievement:unlocked handler is sufficient
    });
    return unsub;
  }, []);

  const mode = useGamePhase();
  const slotGranted = useNotificationSlot(
    'achievement',
    NOTIFY_PRIORITY.achievement,
    notifications.length > 0,
  );

  /* ── Don't render in menu ── */
  if (mode !== 'exploration' && mode !== 'combat' && mode !== 'cutscene') return null;
  if (!slotGranted) return null;

  return (
    <>
      <AriaLiveRegion message={liveAnnounce} priority="assertive" />
      <div
      className="fixed flex flex-col items-end gap-2 pointer-events-none"
      data-exploration-ui
      style={{
        zIndex: UI_LAYERS.TOASTS + 1,
        top: explorationAchievementTopPx(),
        right: EXPLORATION_HUD_LAYOUT.RIGHT_INSET,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <AchievementCard
            key={notif.id}
            notification={notif}
            onDismiss={dismissNotification}
          />
        ))}
      </AnimatePresence>
    </div>
    </>
  );
}
