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
import { PlayerCoordinatesDisplay } from '@/components/game/hud/parts/PlayerCoordinatesDisplay';
import { KarmaTierBadge } from '@/components/game/hud/parts/KarmaTierBadge';
import { KarmaRing } from '@/components/game/hud/parts/KarmaRing';
import { LevelBadge } from '@/components/game/hud/parts/LevelBadge';
import { CompassIndicator } from '@/components/game/hud/parts/CompassIndicator';
import { StatPulse } from '@/components/game/hud/parts/StatPulse';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { usePlayerKarma } from '@/store/selectors/playerSelectors';
import { usePlayerEnergy, usePlayerStress } from '@/store/selectors/playerSelectors';
import { useHUDControllerState } from '@/store/selectors';

export const SceneTopBarHud = memo(function SceneTopBarHud() {
  const quietStyle = useHudQuietStyle();
  const reducedMotion = useEffectiveReducedMotion();
  const karma = usePlayerKarma();
  const energy = usePlayerEnergy();
  const stress = usePlayerStress();
  const isLowEnergy = energy <= 30;
  const isHighStress = stress >= 70;
  // Compact-widget data: level + XP + perk count from the shared HUD controller state.
  // (justLeveled is left false here — the LevelBadge internally animates the XP bar
  //  width on every prop change, so the pulse is purely a bonus, not a correctness gap.)
  const { level, xp, xpToNextLevel: xpToNext, unlockedPerks } = useHUDControllerState();
  const perkCount = unlockedPerks?.length ?? 0;

  return (
    <div
      data-exploration-ui
      data-testid="scene-top-bar-hud"
      className="fixed left-0 right-0 top-0 pointer-events-none"
      style={{ zIndex: UI_LAYERS.HUD + 1, ...quietStyle }}
      role="region"
      aria-label="Верхняя панель интерфейса: сцена, уровень, опыт, компас и время"
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

      {/* Top-right: karma tier badge + karma ring + level badge + compass indicator +
          exploration progress ring + environment mood bar.
          Compact widgets (KarmaRing / LevelBadge / CompassIndicator) are wrapped in
          `hidden sm:flex` so they only appear on wider viewports — keeps mobile top-bar
          uncluttered and avoids overlap with the CompassHUD strip (top: ~58px). */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-2 right-2 flex items-start gap-2"
      >
        <KarmaTierBadge karma={karma} />
        <div className="hidden sm:flex items-center gap-2">
          <KarmaRing karma={karma} />
          <LevelBadge
            level={level}
            perkCount={perkCount}
            xp={xp}
            xpToNext={xpToNext}
            justLeveled={false}
          />
          <CompassIndicator />
        </div>
        <div className="relative">
          <EnvironmentMoodIndicator />
          <StatPulse active={isLowEnergy || isHighStress} color={isHighStress ? 'rose' : 'amber'} />
        </div>
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
        <PlayerCoordinatesDisplay />
      </motion.div>
    </div>
  );
});
