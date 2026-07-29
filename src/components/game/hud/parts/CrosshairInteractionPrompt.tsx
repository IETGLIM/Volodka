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
            className="hud-filmic-caption min-w-[7rem]"
          >
            <div className="hud-filmic-rule" aria-hidden />
            <div className="flex items-baseline gap-2 px-1">
              <span className="hud-filmic-kicker">{promptKey}</span>
              {label ? (
                <span className="hud-filmic-body text-[11px] max-w-[9rem] truncate" style={{ fontStyle: 'italic' }}>
                  {label}
                </span>
              ) : null}
            </div>
            <div className="hud-filmic-rule hud-filmic-rule--soft" aria-hidden />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
