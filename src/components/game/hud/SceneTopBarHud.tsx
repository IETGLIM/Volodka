/* ─── Volodka RPG – Scene Top Bar HUD ───
 * Cohesive top-bar cluster mounting orphaned-but-built widgets:
 *   - SceneContextChip     (top-left:  scene type · NPC count · exits)
 *   - TopBarDataTicker     (top-center: scrolling quest/poem/time ticker)
 *   - ExplorationProgressBadge + EnvironmentMoodIndicator (top-right)
 *
 * All widgets are existing built components — this wrapper only positions
 * them in a unified frame so they share the quiet-HUD fade behavior and
 * don't overlap with CompassHUD (which sits below at top: 58px) or the
 * AutoSaveIndicator (top-right toast).
 *
 * Pure additive: no state writes, no new data. Safe to mount during
 * exploration profile only.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SceneContextChip } from '@/components/game/hud/parts/SceneContextChip';
import { TopBarDataTicker } from '@/components/game/hud/parts/TopBarDataTicker';
import { ExplorationProgressBadge } from '@/components/game/hud/parts/ExplorationProgressBadge';
import { EnvironmentMoodIndicator } from '@/components/game/hud/parts/EnvironmentMoodIndicator';
import { FootstepPedometer } from '@/components/game/hud/parts/FootstepPedometer';
import { SessionPlayTimer } from '@/components/game/hud/parts/SessionPlayTimer';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export const SceneTopBarHud = memo(function SceneTopBarHud() {
  const quietStyle = useHudQuietStyle();
  const reducedMotion = useEffectiveReducedMotion();

  return (
    <div
      data-exploration-ui
      data-testid="scene-top-bar-hud"
      className="fixed left-0 right-0 top-0 pointer-events-none"
      style={{ zIndex: UI_LAYERS.HUD + 1, ...quietStyle }}
      aria-hidden="true"
    >
      {/* Top-left: scene context chip */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-2.5 left-2.5"
      >
        <SceneContextChip />
      </motion.div>

      {/* Top-center: scrolling data ticker (hidden on mobile — it has its own sm:block gate) */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-2.5 left-1/2 -translate-x-1/2"
      >
        <TopBarDataTicker />
      </motion.div>

      {/* Top-right: exploration progress ring + environment mood bar */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-2 right-2 flex items-start gap-2"
      >
        <EnvironmentMoodIndicator />
        <ExplorationProgressBadge />
      </motion.div>

      {/* Bottom-left: session pedometer + play timer */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-2 left-2.5 flex items-end gap-3"
      >
        <FootstepPedometer />
        <SessionPlayTimer />
      </motion.div>
    </div>
  );
});
