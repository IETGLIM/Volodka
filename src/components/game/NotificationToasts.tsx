
/* ─── Volodka RPG – AAA+ Floating Notification Toasts ───
   Beautiful animated toasts that appear when player stats change.
   Position: top-center, stacking downward. Auto-dismiss after 3s.
   Glass-morphism + colored left border + type-specific glow.
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { explorationStatToastTopPx } from '@/shared/constants/hudLayout';
import { toastManager, type ToastType, type ToastMessage } from '@/engine/ToastManager';
import type { NotificationType } from '@/store/gameStore';
import { useGamePhase, useNotifications } from '@/store/selectors';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import type { TrainablePlayerSkill } from '@/shared/types/game';

/* ─── Constants ─── */

const MAX_VISIBLE = 5;
const AUTO_DISMISS_MS = 4000;

/* ─── Toast type config: icon, colors, glow ─── */

interface ToastStyleConfig {
  icon: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  iconBg: string;
}

const TOAST_STYLES: Record<ToastType, ToastStyleConfig> = {
  karma: {
    icon: '☯',
    borderColor: '#d97706',    // amber-600
    glowColor: 'rgba(217,119,6,0.4)',
    textColor: '#fbbf24',      // amber-400
    iconBg: 'rgba(217,119,6,0.15)',
  },
  energy: {
    icon: '⚡',
    borderColor: '#16a34a',    // green-600
    glowColor: 'rgba(22,163,74,0.4)',
    textColor: '#4ade80',      // green-400
    iconBg: 'rgba(22,163,74,0.15)',
  },
  stress: {
    icon: '⚠',
    borderColor: '#dc2626',    // red-600
    glowColor: 'rgba(220,38,38,0.4)',
    textColor: '#f87171',      // red-400
    iconBg: 'rgba(220,38,38,0.15)',
  },
  skill: {
    icon: '✦',
    borderColor: '#0891b2',    // cyan-600
    glowColor: 'rgba(8,145,178,0.4)',
    textColor: '#22d3ee',      // cyan-400
    iconBg: 'rgba(8,145,178,0.15)',
  },
  poem: {
    icon: '✒',
    borderColor: '#7c3aed',    // violet-600
    glowColor: 'rgba(124,58,237,0.4)',
    textColor: '#a78bfa',      // violet-400
    iconBg: 'rgba(124,58,237,0.15)',
  },
  quest: {
    icon: '⚑',
    borderColor: '#ca8a04',    // yellow-600
    glowColor: 'rgba(202,138,4,0.4)',
    textColor: '#facc15',      // yellow-400
    iconBg: 'rgba(202,138,4,0.15)',
  },
};

/* ─── Map gameStore NotificationType → ToastType ─── */

function notificationTypeToToastType(type: NotificationType): ToastType {
  if (type === 'karma') return 'karma';
  if (type === 'energy') return 'energy';
  if (type === 'stress') return 'stress';
  if (type === 'skill') return 'skill';
  if (type === 'poem') return 'poem';
  if (type === 'quest') return 'quest';
  return 'quest'; // fallback
}

/* ─── Internal toast state ─── */

interface VisibleToast {
  id: string;
  type: ToastType;
  message: string;
  delta?: number;
  timestamp: number;
}

/* ─── Skill name mapping ─── */

const SKILL_NAMES: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Программирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

/* ─── Single Toast Component ─── */

function ToastItem({ toast, onDismiss }: { toast: VisibleToast; onDismiss: (id: string) => void }) {
  const style = TOAST_STYLES[toast.type];

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  // Delta display
  const deltaStr = toast.delta !== undefined
    ? (toast.delta > 0 ? `+${toast.delta}` : `${toast.delta}`)
    : null;

  return (
    <motion.div
      layout
      initial={{ x: 120, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 80, opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      onClick={() => onDismiss(toast.id)}
      className="pointer-events-auto cursor-pointer w-full"
      style={{
        maxWidth: 320,
        background: 'rgba(10,10,20,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderLeft: `3px solid ${style.borderColor}`,
        borderRadius: 10,
        boxShadow: `0 0 16px ${style.glowColor}, 0 2px 8px rgba(0,0,0,0.4)`,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 24px ${style.glowColor}, 0 2px 12px rgba(0,0,0,0.5)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 16px ${style.glowColor}, 0 2px 8px rgba(0,0,0,0.4)`;
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 6,
          background: style.iconBg,
          color: style.textColor,
          fontSize: 14,
          flexShrink: 0,
          fontWeight: 700,
        }}
      >
        {style.icon}
      </span>

      {/* Message */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span
          style={{
            color: 'rgba(255,255,255,0.92)',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {toast.message}
        </span>
        {deltaStr && (
          <span
            style={{
              color: style.textColor,
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1.2,
              marginTop: 1,
            }}
          >
            {deltaStr}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main NotificationToasts Component ─── */

export function NotificationToasts() {
  const [toasts, setToasts] = useState<VisibleToast[]>([]);
  const shownIds = useRef(new Set<string>());

  /* ── Dismiss handler ── */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Add toast (deduped) ── */
  const addToast = useCallback((toast: VisibleToast) => {
    // Dedup: skip if already shown
    if (shownIds.current.has(toast.id)) return;
    shownIds.current.add(toast.id);

    setToasts((prev) => {
      const updated = [...prev, toast];
      // Keep only the most recent MAX_VISIBLE toasts
      return updated.slice(-MAX_VISIBLE);
    });
  }, []);

  /* ── Subscribe to ToastManager ── */
  useEffect(() => {
    const unsub = toastManager.subscribe((msg: ToastMessage) => {
      addToast({
        id: msg.id,
        type: msg.type,
        message: msg.message,
        delta: msg.delta,
        timestamp: msg.timestamp,
      });
    });
    return unsub;
  }, [addToast]);

  /* ── Watch gameStore notifications ── */
  // Track which notification IDs we've already shown as toasts
  const notifications = useNotifications();
  const prevNotifIds = useRef(new Set<string>());

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect (react-hooks/set-state-in-effect)
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const n of notifications) {
      if (prevNotifIds.current.has(n.id)) continue;
      prevNotifIds.current.add(n.id);

      const toastType = notificationTypeToToastType(n.type);
      const toastData = {
        id: `store-${n.id}`,
        type: toastType,
        message: n.text,
        timestamp: n.timestamp,
      };

      timers.push(setTimeout(() => addToast(toastData), 0));
    }

    // Clean up old IDs to prevent memory leak (keep last 20)
    if (prevNotifIds.current.size > 20) {
      const ids = Array.from(prevNotifIds.current);
      const keep = new Set(ids.slice(-20));
      prevNotifIds.current = keep;
    }

    return () => timers.forEach((t) => clearTimeout(t));
  }, [notifications, addToast]);

  /* ── Watch for EventBus events that should show toasts ── */
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Poem power used
    unsubs.push(
      eventBus.on('poem:power_used', ({ powerName }) => {
        toastManager.addToast('poem', `Способность: ${powerName}`);
      }),
    );

    // Combat victory — EventNotificationPopup handles this

    // Combat defeat
    unsubs.push(
      eventBus.on('combat:defeat', ({ energyLost }) => {
        toastManager.addToast('stress', `Поражение: -${energyLost} энергии`);
      }, EventBusPriority.UI),
    );

    // Auto-save — AutoSaveIndicator handles this

    // Quest accepted — QuestNotificationSystem handles this

    // Quest reward applied notification
    unsubs.push(
      eventBus.on('quest:reward_applied', ({ questTitle, rewards }) => {
        const rewardText = rewards.length > 0 ? rewards.join(', ') : 'нет';
        toastManager.addToast('quest', `Награда за «${questTitle}»: ${rewardText}`);
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  /* ── Render ── */
  // Only show toasts when game is active (not in menu/intro)
  const mode = useGamePhase();
  if (mode === 'menu' || mode === 'intro') return null;

  const visibleToasts = toasts.slice(-MAX_VISIBLE);

  return (
    <div
      className="fixed right-3 sm:right-4 flex flex-col items-end gap-2 pointer-events-none"
      style={{ top: explorationStatToastTopPx(), zIndex: UI_LAYERS.TOASTS, pointerEvents: 'none' }}
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Convenience helpers (can be imported from anywhere) ─── */

export function showKarmaToast(delta: number) {
  const sign = delta > 0 ? '+' : '';
  toastManager.addToast('karma', `Карма ${sign}${delta}`, delta);
}

export function showEnergyToast(delta: number) {
  const sign = delta > 0 ? '+' : '';
  toastManager.addToast('energy', `Энергия ${sign}${delta}`, delta);
}

export function showStressToast(delta: number) {
  const sign = delta > 0 ? '+' : '';
  toastManager.addToast('stress', `Стресс ${sign}${delta}`, delta);
}

export function showSkillToast(skill: TrainablePlayerSkill, delta: number) {
  const name = SKILL_NAMES[skill] ?? skill;
  const sign = delta > 0 ? '+' : '';
  toastManager.addToast('skill', `Навык: ${name} ${sign}${delta}`, delta);
}

export function showPoemToast(title: string) {
  toastManager.addToast('poem', `Стих собран: ${title}`);
}

export function showQuestToast(text: string) {
  toastManager.addToast('quest', text);
}
