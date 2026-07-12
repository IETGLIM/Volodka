import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ENEMY_TEMPLATES } from '@/engine/combat/enemies';
import {
  CinematicShell,
  CinematicTitleCard,
  resolveExaminePresentation,
} from '@/components/game/cinematic';
import type { EncounterContext } from '@/engine/combat/encounterTypes';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/** Brief AAA clash card before turn-based combat UI opens. */
export const EncounterBeatOverlay = memo(function EncounterBeatOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const [ctx, setCtx] = useState<EncounterContext | null>(null);

  useEffect(() => {
    const unsubStart = eventBus.on('encounter:presentation_start', (payload) => {
      setCtx(payload);
    });
    const unsubEnd = eventBus.on('encounter:presentation_end', () => {
      setCtx(null);
    });
    return () => {
      unsubStart();
      unsubEnd();
    };
  }, []);

  const template = ctx ? ENEMY_TEMPLATES[ctx.enemyType] : null;
  const title = ctx?.encounterName ?? template?.name ?? '';
  const subtitle = template ? `${template.emoji}  ${template.name}` : undefined;
  const presentation = resolveExaminePresentation('#ff6688');

  return (
    <AnimatePresence>
      {ctx && title && (
        <motion.div
          key={`encounter-${ctx.enemyType}-${title}`}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: UI_LAYERS.DIALOGUE - 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
        >
          <CinematicShell presentation={presentation}>
            <CinematicTitleCard
              title={title}
              subtitle={subtitle}
              accentColor={presentation.accentColor}
              type="revelation"
              reducedMotion={reducedMotion}
              size="location"
            />
          </CinematicShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
