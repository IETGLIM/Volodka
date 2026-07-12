/* ─── Volodka RPG – Level Up Effect ───
   Dramatic full-screen effect when the player levels up.
   Listens on EventBus for 'player:levelup' (batched XP emits one event per turn).
 */

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LevelUpAnimatedOverlay,
  LevelUpStaticOverlay,
} from '@/components/game/levelUp/LevelUpOverlayContent';
import { useLevelUpEffect } from '@/components/game/levelUp/useLevelUpEffect';
import {
  buildLevelUpAnnouncement,
  buildParticleSpecs,
  getParticleCountForTier,
} from '@/engine/levelUp/levelUpPresentation';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export function LevelUpEffect() {
  const { levelUp, reducedMotion, dismiss } = useLevelUpEffect();
  const deviceTier = useDeviceTier();
  const particleCount = getParticleCountForTier(deviceTier, reducedMotion);
  const particles = useMemo(() => buildParticleSpecs(particleCount), [particleCount]);

  return (
    <>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {levelUp ? buildLevelUpAnnouncement(levelUp) : ''}
      </span>

      <AnimatePresence mode="wait">
        {levelUp && reducedMotion && (
          <div
            key={levelUp.id}
            className="fixed inset-0 level-up-overlay cursor-default"
            style={{ zIndex: UI_LAYERS.LOADING }}
            onClick={() => dismiss(true)}
            role="status"
            aria-label={buildLevelUpAnnouncement(levelUp)}
          >
            <LevelUpStaticOverlay levelUp={levelUp} />
          </div>
        )}

        {levelUp && !reducedMotion && (
          <motion.div
            key={levelUp.id}
            className="fixed inset-0 level-up-overlay cursor-default"
            style={{ zIndex: UI_LAYERS.LOADING }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => dismiss(true)}
            role="status"
            aria-label={buildLevelUpAnnouncement(levelUp)}
          >
            <LevelUpAnimatedOverlay levelUp={levelUp} particles={particles} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
