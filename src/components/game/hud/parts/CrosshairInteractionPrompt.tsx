/* ─── Volodka RPG – Crosshair Interaction Prompt ───
 * Filmic diegetic caption near crosshair — show-don't-tell, not neon keycap spam.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { formatInteractionHintKey } from '@/engine/exploration/explorationUxPresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

function truncateLabel(label: string, max = 22): string {
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
        transform: 'translate(-50%, 36px)',
        zIndex: UI_LAYERS.HUD,
      }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-1.5 min-w-[7rem]"
          >
            {/* Thin film rule */}
            <div
              className="w-10 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(220,230,240,0.55), transparent)' }}
            />
            <div className="flex items-baseline gap-2 px-1">
              <span
                className="font-mono text-[10px] tracking-[0.28em] uppercase"
                style={{ color: 'rgba(210,230,235,0.88)' }}
              >
                {promptKey}
              </span>
              {label ? (
                <span
                  className="font-serif text-[11px] tracking-wide italic max-w-[9rem] truncate"
                  style={{ color: 'rgba(190,205,215,0.72)' }}
                >
                  {label}
                </span>
              ) : null}
            </div>
            <div
              className="w-10 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(220,230,240,0.35), transparent)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
