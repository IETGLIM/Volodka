'use client';

/* ─── Volodka RPG – Gamepad Indicator ───
 * Shows connected gamepad name, connection status, and button mapping reference.
 * Only renders when a gamepad is actually connected.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveGamepad, GAMEPAD } from '@/engine/input/gamepad';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/** Explainer labels for standard gamepad buttons. */
const BUTTON_LABELS: Record<number, string> = {
  [GAMEPAD.A]: 'Взаимодействие',
  [GAMEPAD.B]: 'Отмена / Прыжок',
  [GAMEPAD.X]: 'Задания',
  [GAMEPAD.Y]: 'Инвентарь',
  [GAMEPAD.LB]: 'Бег',
  [GAMEPAD.RB]: 'След. стих',
  [GAMEPAD.START]: 'Меню / Пауза',
  [GAMEPAD.SELECT]: 'Журнал',
};

/** Button letter/icon for each button index. */
const BUTTON_ICONS: Record<number, string> = {
  [GAMEPAD.A]: 'A',
  [GAMEPAD.B]: 'B',
  [GAMEPAD.X]: 'X',
  [GAMEPAD.Y]: 'Y',
  [GAMEPAD.LB]: 'LB',
  [GAMEPAD.RB]: 'RB',
  [GAMEPAD.START]: '▶',
  [GAMEPAD.SELECT]: '◁',
};

type Props = {
  className?: string;
};

export function GamepadIndicator({ className = '' }: Props) {
  const [connected, setConnected] = useState(false);
  const [gamepadName, setGamepadName] = useState('');
  const [showMapping, setShowMapping] = useState(false);
  const reducedMotion = useEffectiveReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const pad = getActiveGamepad();
      setConnected(Boolean(pad));
      if (pad) {
        setGamepadName(pad.id.split('(')[0].trim().substring(0, 32));
      }
    };

    update();
    window.addEventListener('gamepadconnected', update);
    window.addEventListener('gamepaddisconnected', update);
    return () => {
      window.removeEventListener('gamepadconnected', update);
      window.removeEventListener('gamepaddisconnected', update);
    };
  }, []);

  const toggleMapping = useCallback(() => {
    setShowMapping((prev) => !prev);
  }, []);

  // Dismiss mapping on Escape
  useEffect(() => {
    if (!showMapping) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMapping(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showMapping]);

  if (!connected) return null;

  const fadeMotion = reducedMotion ? {} : { transition: { duration: 0.2 } };

  return (
    <div ref={containerRef} className={`gamepad-indicator ${className}`}>
      {/* Status chip — bottom-left HUD */}
      <motion.div
        className="gamepad-indicator-chip"
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        {...fadeMotion}
      >
        <button
          type="button"
          onClick={toggleMapping}
          className="gamepad-indicator-toggle"
          aria-label={
            showMapping
              ? 'Скрыть схему геймпада'
              : `Геймпад подключён: ${gamepadName}. Нажмите для схемы.`
          }
          aria-expanded={showMapping}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="gamepad-indicator-icon"
            aria-hidden="true"
          >
            <rect x="2" y="6" width="20" height="12" rx="4" />
            <circle cx="8" cy="12" r="1.5" />
            <circle cx="16" cy="10" r="1.5" />
            <circle cx="16" cy="14" r="1.5" />
          </svg>
          <span className="gamepad-indicator-label">{gamepadName || 'Геймпад'}</span>
          <span className="gamepad-indicator-status" aria-label="Подключён" />
        </button>
      </motion.div>

      {/* Mapping reference panel */}
      <AnimatePresence>
        {showMapping && (
          <motion.div
            className="gamepad-indicator-mapping"
            role="dialog"
            aria-label="Схема управления геймпадом"
            aria-modal="false"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <div className="gamepad-indicator-mapping-header">
              <span className="gamepad-indicator-mapping-title">
                Управление геймпадом
              </span>
              <button
                type="button"
                onClick={() => setShowMapping(false)}
                className="gamepad-indicator-mapping-close"
                aria-label="Закрыть схему"
              >
                ✕
              </button>
            </div>

            <div className="gamepad-indicator-mapping-grid" role="list">
              {Object.entries(BUTTON_LABELS).map(([idx, label]) => (
                <div key={idx} role="listitem" className="gamepad-indicator-mapping-row">
                  <kbd className="gamepad-indicator-key">
                    {BUTTON_ICONS[Number(idx)] ?? `B${idx}`}
                  </kbd>
                  <span className="gamepad-indicator-mapping-desc">{label}</span>
                </div>
              ))}
            </div>

            <div className="gamepad-indicator-mapping-footer">
              <div className="gamepad-indicator-mapping-row">
                <kbd className="gamepad-indicator-key" style={{ width: 'auto', padding: '0 6px' }}>
                  Стики
                </kbd>
                <span className="gamepad-indicator-mapping-desc">
                  Левый — движение, Правый — камера
                </span>
              </div>
              <div className="gamepad-indicator-mapping-row">
                <kbd className="gamepad-indicator-key" style={{ width: 'auto', padding: '0 6px' }}>
                  D-pad
                </kbd>
                <span className="gamepad-indicator-mapping-desc">
                  Навигация по меню
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
