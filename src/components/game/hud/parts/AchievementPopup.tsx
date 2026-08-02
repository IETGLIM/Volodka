import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { useGameStore } from '@/store/gameStore';
import type { TrophyNotification } from '@/store/slices/achievementSlice';

const NOTIFICATION_EXPIRY_MS = 5000;

export interface SkillAchievementNotice {
  title: string;
  description: string;
  icon?: string;
}

interface AchievementPopupProps {
  achievement?: SkillAchievementNotice | null;
}

export function AchievementPopup({ achievement: propAchievement }: AchievementPopupProps) {
  const trophyNotifications = useGameStore((s) => s.trophyNotifications);
  const dismissTrophyNotification = useGameStore((s) => s.dismissTrophyNotification);

  // Auto-expire trophy notifications after 5 seconds
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (trophyNotifications.length === 0) {
      setExpiredIds(new Set());
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const n of trophyNotifications) {
      if (expiredIds.has(n.id)) continue;
      const age = Date.now() - n.unlockedAt;
      const remaining = Math.max(0, NOTIFICATION_EXPIRY_MS - age);
      const timer = setTimeout(() => {
        setExpiredIds((prev) => new Set(prev).add(n.id));
        dismissTrophyNotification(n.id);
      }, remaining);
      timers.push(timer);
    }
    return () => { for (const t of timers) clearTimeout(t); };
  }, [trophyNotifications, expiredIds, dismissTrophyNotification]);

  const handleDismiss = useCallback((id: string) => {
    dismissTrophyNotification(id);
    setExpiredIds((prev) => new Set(prev).add(id));
  }, [dismissTrophyNotification]);

  // Filter out expired notifications for rendering
  const visibleTrophies = trophyNotifications.filter(
    (n) => !expiredIds.has(n.id),
  );

  // Also support legacy prop-based achievement
  const showLegacy = propAchievement != null;

  return (
    <>
      {visibleTrophies.map((n) => (
        <TrophyToast
          key={n.id}
          notification={n}
          onDismiss={() => handleDismiss(n.id)}
        />
      ))}
      {showLegacy && propAchievement && (
        <LegacyToast achievement={propAchievement} />
      )}
    </>
  );
}

/* ─── Internal Components ─── */

function TrophyToast({
  notification,
  onDismiss,
}: {
  notification: TrophyNotification;
  onDismiss: () => void;
}) {
  const { trophy } = notification;
  return (
    <>
      <AriaLiveRegion
        message={`Трофей: ${trophy.name}. ${trophy.description}`}
        priority="polite"
      />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed pointer-events-auto cursor-pointer cyber-fade-in-up"
        style={{
          zIndex: UI_LAYERS.TOASTS + 2,
          bottom: `calc(7rem + ${notification.id.charCodeAt(5) % 3} * 5rem)`,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        role="status"
        aria-live="polite"
        onClick={onDismiss}
      >
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md glass-panel-warm toast-scanline border-breathe trophy-celebration"
          style={{
            background:
              'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.85) 100%)',
            borderColor: 'rgba(251,191,36,0.4)',
            boxShadow:
              '0 0 30px rgba(251,191,36,0.15), 0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="size-10 rounded-lg flex items-center justify-center text-xl"
            style={{
              background: 'rgba(251,191,36,0.15)',
              boxShadow: '0 0 12px rgba(251,191,36,0.2)',
            }}
            aria-hidden="true"
          >
            {trophy.icon ?? <Star className="size-5 text-amber-400" />}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-amber-400/70 font-mono uppercase tracking-wider">
              Трофей
            </div>
            <div className="text-sm font-semibold text-amber-200 font-mono gradient-text-amber">
              {trophy.name}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {trophy.description}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function LegacyToast({ achievement }: { achievement: SkillAchievementNotice }) {
  return (
    <AnimatePresence>
      <>
        <AriaLiveRegion
          message={`${achievement.title}. ${achievement.description}`}
          priority="polite"
        />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 pointer-events-none toast-enhanced cyber-fade-in-up"
          style={{ zIndex: UI_LAYERS.TOASTS + 2 }}
          role="status"
          aria-live="polite"
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md glass-panel-warm toast-scanline"
            style={{
              background:
                'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.85) 100%)',
              borderColor: 'rgba(251,191,36,0.4)',
              boxShadow:
                '0 0 30px rgba(251,191,36,0.15), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="size-10 rounded-lg flex items-center justify-center text-xl glass-panel-warm"
              style={{
                background: 'rgba(251,191,36,0.15)',
                boxShadow: '0 0 12px rgba(251,191,36,0.2)',
              }}
              aria-hidden="true"
            >
              {achievement.icon ? achievement.icon : <Star className="size-5 text-amber-400" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-amber-200 font-mono gradient-text-amber">{achievement.title}</div>
              <div className="text-xs text-slate-400">{achievement.description}</div>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
