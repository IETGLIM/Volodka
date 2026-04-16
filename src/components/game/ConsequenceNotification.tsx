'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';

// ============================================
// ТИПЫ
// ============================================

type ConsequenceType = 'stat' | 'flag' | 'npc' | 'quest' | 'other';

interface ConsequenceNotification {
  id: string;
  message: string;
  type: ConsequenceType;
  timestamp: number;
}

// ============================================
// ЦВЕТОВАЯ СХЕМА ПО ТИПУ ПОСЛЕДСТВИЯ
// ============================================

const TYPE_COLORS: Record<ConsequenceType, {
  text: string;
  bg: string;
  border: string;
  glow: string;
  icon: string;
}> = {
  stat: {
    text: 'text-cyan-300',
    bg: 'rgba(0, 255, 255, 0.08)',
    border: 'rgba(0, 255, 255, 0.3)',
    glow: '0 0 12px rgba(0, 255, 255, 0.15)',
    icon: '◈',
  },
  flag: {
    text: 'text-green-300',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.3)',
    glow: '0 0 12px rgba(34, 197, 94, 0.15)',
    icon: '✦',
  },
  npc: {
    text: 'text-amber-300',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
    glow: '0 0 12px rgba(245, 158, 11, 0.15)',
    icon: '⟐',
  },
  quest: {
    text: 'text-purple-300',
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.3)',
    glow: '0 0 12px rgba(168, 85, 247, 0.15)',
    icon: '◆',
  },
  other: {
    text: 'text-slate-300',
    bg: 'rgba(148, 163, 184, 0.08)',
    border: 'rgba(148, 163, 184, 0.25)',
    glow: '0 0 12px rgba(148, 163, 184, 0.1)',
    icon: '◇',
  },
};

// ============================================
// ОПРЕДЕЛЕНИЕ ТИПА ПО ЭФФЕКТУ
// ============================================

function classifyEffect(effectStr: string): ConsequenceType {
  const lower = effectStr.toLowerCase();

  // Статы — числа, характеристики
  if (
    lower.includes('mood') ||
    lower.includes('creativity') ||
    lower.includes('stability') ||
    lower.includes('energy') ||
    lower.includes('karma') ||
    lower.includes('selfesteem') ||
    lower.includes('stress') ||
    lower.includes('stat_change') ||
    lower.includes('самооценк') ||
    lower.includes('стресс') ||
    lower.includes('настроени')
  ) {
    return 'stat';
  }

  // Флаги
  if (
    lower.includes('flag') ||
    lower.includes('unlock') ||
    lower.includes('разблокирован')
  ) {
    return 'flag';
  }

  // NPC
  if (
    lower.includes('npc') ||
    lower.includes('relation') ||
    lower.includes('марий') ||
    lower.includes('алексей') ||
    lower.includes('вер') ||
    lower.includes('отношен')
  ) {
    return 'npc';
  }

  // Квесты
  if (
    lower.includes('quest') ||
    lower.includes('квест')
  ) {
    return 'quest';
  }

  return 'other';
}

// ============================================
// КОМПОНЕНТ
// ============================================

export default function ConsequenceNotification() {
  const [notifications, setNotifications] = useState<ConsequenceNotification[]>([]);

  // Подписка на событие последствий
  useEffect(() => {
    const unsub = eventBus.on('consequence:triggered', (payload) => {
      // Каждое сообщение в effects — отдельное уведомление
      const messages = payload.effects;

      messages.forEach((effectStr, index) => {
        const id = `${payload.consequenceId}-${Date.now()}-${index}`;
        const type = classifyEffect(effectStr);

        // Используем сообщение из payload, если есть осмысленное
        const message = effectStr === 'stat_change'
          ? 'Изменение характеристик'
          : effectStr;

        setNotifications(prev => {
          // Ограничиваем до 4 уведомлений на экране
          const next = [...prev.slice(-3), { id, message, type, timestamp: Date.now() }];
          return next;
        });

        // Авто-удаление через 3 секунды
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
      });
    });

    return () => unsub();
  }, []);

  return (
    <div className="fixed top-14 right-4 z-50 flex flex-col gap-2 pointer-events-none select-none">
      <AnimatePresence>
        {notifications.map((notif) => {
          const colors = TYPE_COLORS[notif.type];
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="px-4 py-2 backdrop-blur-md border"
              style={{
                background: colors.bg,
                borderColor: colors.border,
                boxShadow: colors.glow,
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            >
              <div className="flex items-center gap-2">
                {/* Иконка типа */}
                <span
                  className={`${colors.text} text-sm font-mono`}
                  style={{ textShadow: `0 0 6px currentColor` }}
                >
                  {colors.icon}
                </span>

                {/* Текст уведомления */}
                <span
                  className={`${colors.text} text-xs font-mono tracking-wide`}
                  style={{
                    textShadow: `0 0 8px currentColor`,
                  }}
                >
                  {notif.message}
                </span>
              </div>

              {/* Линия прогресса (таймер исчезновения) */}
              <motion.div
                className={`mt-1 h-px ${colors.text.replace('text-', 'bg-')} opacity-30`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
