/* ─── Volodka RPG – Crosshair Interaction Prompt ───
 * Animated key prompt shown near the crosshair when
 * the player is near an interactive object.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { formatInteractionHintKey } from '@/engine/exploration/explorationUxPresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

function truncateLabel(label: string, max = 18): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function CrosshairInteractionPrompt() {
  const [visible, setVisible] = useState(false);
  const [promptKey, setPromptKey] = useState('E');
  const [label, setLabel] = useState<string | null>(null);
  const reducedMotion = useEffectiveReducedMotion();
  const gamepadConnected = useGamepadConnected();
  const isTouchDevice = useTouchDevice();

  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', (payload) => {
      setPromptKey(formatInteractionHintKey(payload.key, {
        gamepadConnected,
        touchDevice: isTouchDevice,
      }));
      setLabel(payload.label ? truncateLabel(payload.label) : null);
      setVisible(true);
    });
    const unsubEnd = eventBus.on('interaction:end', () => setVisible(false));
    const unsubStart = eventBus.on('interaction:start', () => setVisible(false));
    return () => {
      unsubHint();
      unsubEnd();
      unsubStart();
    };
  }, [gamepadConnected, isTouchDevice]);

  return (
    <div
      className="absolute top-1/2 left-1/2 pointer-events-none"
      style={{
        transform: 'translate(-50%, 24px)',
        zIndex: UI_LAYERS.HUD,
      }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.85 }}
            animate={reducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  boxShadow: [
                    '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.2), 0 2px 8px rgba(0,0,0,0.6)',
                    '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.4), 0 2px 12px rgba(0,0,0,0.6)',
                    '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.2), 0 2px 8px rgba(0,0,0,0.6)',
                  ],
                }
            }
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
            transition={
              reducedMotion
                ? { duration: 0.15 }
                : {
                    opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                    y: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
                    scale: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
                    boxShadow: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                  }
            }
            className="flex items-center gap-1.5 min-w-8 min-h-[44px] sm:min-h-8 h-auto px-1.5 py-1 rounded-md"
            style={{
              background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.98) 100%)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.5)',
              boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.2), 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Key cap top highlight */}
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-md"
              style={{
                background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.3) 50%, transparent)',
              }}
            />
            <span
              className="text-sm font-bold font-mono select-none shrink-0"
              style={{
                color: 'var(--cyber-cyan)',
                textShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.6)',
              }}
            >
              {promptKey}
            </span>
            {label ? (
              <span
                className="text-[10px] font-mono tracking-wide max-w-[7.5rem] truncate"
                style={{ color: '#9ad8d8' }}
              >
                {label}
              </span>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
