/* ─── Volodka RPG – Floating Action Indicator ───
 * Small animated icons that float up from the bottom center
 * of the screen when the player performs key actions.
 * Uses existing typed events for type safety.
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface FloatingAction {
  id: string;
  icon: string;
  label: string;
  color: string;
}

const MAX_ACTIONS = 4;
const ACTION_LIFETIME_MS = 2500;

export function FloatingActionIndicator() {
  const [actions, setActions] = useState<FloatingAction[]>([]);
  const reducedMotion = useEffectiveReducedMotion();

  const addAction = useCallback((icon: string, label: string, color: string) => {
    const id = `action-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setActions((prev) => [...prev.slice(-(MAX_ACTIONS - 1)), { id, icon, label, color }]);
  }, []);

  useEffect(() => {
    // FIX (dedup): fx:xp_gain-чип убран — XP уже показывается числом у прицела
    // (DamageNumberFloat) и в ambient-ленте (HUDNotificationFeed); четвертый
    // канал внизу-центра создавал «спам» из 4–5 одновременных « +X XP ».

    // Listen for quest events
    const unsubQuest = eventBus.on('quest:completed', () => {
      addAction('✓', 'Задание выполнено', '#34d399');
    });

    // Listen for choice events with karma changes
    const unsubChoice = eventBus.on('choice:made', (payload) => {
      if (payload.karmaChange !== 0) {
        const d = payload.karmaChange;
        addAction(
          d > 0 ? '🕊' : '⚠',
          d > 0 ? `Карма +${d}` : `Карма ${d}`,
          d > 0 ? '#34d399' : '#fb7185',
        );
      }
    });

    return () => {
      unsubQuest();
      unsubChoice();
    };
  }, [addAction]);

  if (actions.length === 0) return null;

  return (
    <div
      className="fixed bottom-28 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col-reverse items-center gap-2 hud-filmic-float-bob"
      style={{ zIndex: UI_LAYERS.HUD + 3 }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.8 }}
            animate={reducedMotion ? { opacity: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.6 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
              opacity: { duration: ACTION_LIFETIME_MS / 1000, delay: 0.3 },
              y: { duration: ACTION_LIFETIME_MS / 1000, ease: 'easeOut' },
              scale: { duration: ACTION_LIFETIME_MS / 1000 },
              filter: { duration: ACTION_LIFETIME_MS / 1000 },
            }}
            className="floating-action-item flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md"
            style={{
              background: 'rgba(2, 6, 23, 0.8)',
              borderColor: `${action.color}30`,
              boxShadow: `0 0 12px ${action.color}15, 0 2px 8px rgba(0,0,0,0.4)`,
            }}
          >
            <span className="text-xs" style={{ filter: `drop-shadow(0 0 4px ${action.color}80)` }}>
              {action.icon}
            </span>
            <span
              className="text-[10px] font-mono whitespace-nowrap"
              style={{ color: action.color, textShadow: `0 0 4px ${action.color}40` }}
            >
              {action.label}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}