/* ─── Volodka RPG – HUD Notification Feed ───
   A small, non-intrusive slide-in feed on the left side of the HUD
   that shows recent game events (XP gain, quest updates, karma shifts).
   Shows the last 3 events, auto-dismisses after 5s each.
   Uses eventBus for real-time updates — only subscribes to valid typed events.
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { explorationLootTopPx } from '@/shared/constants/hudLayout';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface NotificationFeedItem {
  id: string;
  icon: string;
  text: string;
  color: string;
  timestamp: number;
}

const MAX_ITEMS = 3;
const ITEM_LIFETIME_MS = 5000;

export function HUDNotificationFeed() {
  const reducedMotion = useEffectiveReducedMotion();
  const quietStyle = useHudQuietStyle();
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const cleanupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addItem = useCallback((icon: string, text: string, color: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => {
      const next = [...prev, { id, icon, text, color, timestamp: Date.now() }];
      return next.slice(-MAX_ITEMS);
    });
  }, []);

  // Listen for typed events
  useEffect(() => {
    const unsubXp = eventBus.on('fx:xp_gain', (payload) => {
      addItem('⬆', `+${payload.amount} XP`, 'rgb(var(--cyber-cyan-rgb))');
    });

    const unsubQuestAccepted = eventBus.on('quest:accepted', (payload) => {
      addItem('📜', `Задание: ${payload.questTitle ?? 'Новое'}`, '#00d4e0');
    });

    const unsubQuestCompleted = eventBus.on('quest:completed', (payload) => {
      addItem('✓', `Выполнено: ${payload.questId}`, '#34d399');
    });

    const unsubChoice = eventBus.on('choice:made', (payload) => {
      if (payload.karmaChange !== 0) {
        const d = payload.karmaChange;
        addItem(
          d > 0 ? '🕊' : '⚠',
          d > 0 ? `Карма +${d}` : `Карма ${d}`,
          d > 0 ? '#34d399' : '#fb7185',
        );
      }
    });

    const unsubToast = eventBus.on('toast:add', (payload) => {
      if (payload.type === 'karma' || payload.type === 'poem' || payload.type === 'quest') {
        addItem('📋', payload.message, '#fbbf24');
      }
    });

    return () => {
      unsubXp();
      unsubQuestAccepted();
      unsubQuestCompleted();
      unsubChoice();
      unsubToast();
    };
  }, [addItem]);

  // Auto-cleanup old items
  useEffect(() => {
    cleanupRef.current = setInterval(() => {
      const now = Date.now();
      setItems((prev) => prev.filter((item) => now - item.timestamp < ITEM_LIFETIME_MS));
    }, 1000);
    return () => {
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed left-3 pointer-events-none"
      style={{
        top: explorationLootTopPx(),
        zIndex: UI_LAYERS.HUD + 2,
        ...quietStyle,
      }}
      aria-label="Лента уведомлений"
      role="log"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 20, maxWidth: 0 }}
            animate={{ opacity: 1, x: 0, maxWidth: 200 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -10, maxWidth: 0, marginBottom: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mb-1"
          >
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border backdrop-blur-sm"
              style={{
                background: 'rgba(2, 6, 23, 0.8)',
                borderColor: `${item.color}30`,
                boxShadow: `0 0 8px ${item.color}15`,
              }}
            >
              <span className="text-xs shrink-0" aria-hidden="true">{item.icon}</span>
              <span
                className="text-[10px] font-mono leading-tight truncate"
                style={{ color: item.color, textShadow: `0 0 4px ${item.color}40` }}
              >
                {item.text}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}