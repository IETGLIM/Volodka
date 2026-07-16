/* ─── Volodka RPG – Combat Pre-Engagement Warning ───
   Full-screen HUD flash shown when the encounter presentation
   beat starts, immediately BEFORE the combat UI mounts.

   Cyberpunk terminal aesthetic: red vignette, pulsing warning text,
   proximity danger bar. Respects prefers-reduced-motion.
*/

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { EncounterContext } from '@/engine/combat/encounterTypes';
import type { SceneId } from '@/shared/types/game';

/** Payload for the encounter:presentation_start event. */
interface EncounterPresentationStartPayload extends EncounterContext {
  sceneId: SceneId;
}

const WARNING_DURATION_MS = 1200;

export function CombatPreEngagementWarning() {
  const [warning, setWarning] = useState(false);
  const [enemyName, setEnemyName] = useState('');
  const reducedMotion = useEffectiveReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const unsubEncounter = eventBus.on(
      'encounter:presentation_start',
      (data: EncounterPresentationStartPayload) => {
        setEnemyName(data.encounterName ?? data.enemyType ?? '');
        setWarning(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setWarning(false), WARNING_DURATION_MS);
      },
    );

    const unsubCombatStart = eventBus.on('combat:start', () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setWarning(false);
    });

    return () => {
      unsubEncounter();
      unsubCombatStart();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="absolute inset-0 pointer-events-none z-50"
          aria-hidden="true"
        >
          {/* Red edge vignette */}
          <div className="combat-preengagement-vignette" />

          {/* Warning text — top center */}
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 flex flex-col items-center">
            <motion.div
              animate={
                reducedMotion
                  ? {}
                  : { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }
              }
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              className="combat-preengagement-pulse"
            >
              ⚠ ВНИМАНИЕ
            </motion.div>

            {enemyName && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.3 }}
                className="text-red-300/80 text-xs font-mono mt-1 tracking-wider"
              >
                {enemyName}
              </motion.div>
            )}
          </div>

          {/* Proximity danger bar — bottom area */}
          <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2">
            <div className="combat-preengagement-bar" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}