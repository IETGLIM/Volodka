/* ─── Volodka RPG – diegetic exploration HUD ───
 * Ultra-minimal overlay: no radar, coordinates, pedometer, boot spam, or icon farm.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useContextualHints } from '@/hooks/useContextualHints';
import { useHudProximityFxActive } from '@/hooks/useHudProximityFxActive';
import { useHUDController } from '@/components/game/hud/useHUDController';
import type { HUDProps } from '@/components/game/hud/hudTypes';
import { CombatPreEngagementWarning } from '@/components/game/hud/parts/CombatPreEngagementWarning';
import { ContextualHint } from '@/components/game/hud/parts/ContextualHint';
import { CrosshairInteractionPrompt } from '@/components/game/hud/parts/CrosshairInteractionPrompt';
import { DynamicCrosshair } from '@/components/game/hud/parts/DynamicCrosshair';
import { PhysicsDegradedDevBadge } from '@/components/game/hud/parts/PhysicsDegradedDevBadge';
import { RainScreenEffect } from '@/components/game/hud/parts/RainScreenEffect';
import { SprintDrainOverlay } from '@/components/game/hud/parts/SprintDrainOverlay';

export type { HUDProps } from '@/components/game/hud/hudTypes';

function CriticalStatusWhisper({
  energy,
  stress,
  isLowEnergy,
  isHighStress,
}: {
  energy: number;
  stress: number;
  isLowEnergy: boolean;
  isHighStress: boolean;
}) {
  if (!isLowEnergy && !isHighStress) return null;

  const line = isLowEnergy && isHighStress
    ? `Силы на исходе · стресс ${stress}%`
    : isLowEnergy
      ? `Силы на исходе · ${energy}%`
      : `Дыхание сбито · стресс ${stress}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ bottom: 'clamp(118px, 16vh, 176px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="hud-filmic-caption px-4">
        <div className="hud-filmic-rule hud-filmic-rule--wide" aria-hidden />
        <p className="hud-filmic-body text-[12px]" style={{ color: 'var(--hud-filmic-danger)' }}>
          {line}
        </p>
      </div>
    </motion.div>
  );
}

export function ExplorationHUD(props: HUDProps) {
  const state = useHUDController(props);
  const proximityFxActive = useHudProximityFxActive();
  const { currentHint, dismissHint } = useContextualHints();

  const {
    photoModeOn,
    hudMounted,
    showSaveIndicator,
    energy,
    stress,
    isLowEnergy,
    isHighStress,
  } = state;

  if (photoModeOn) return null;

  return (
    <div
      data-exploration-ui
      data-testid="game-hud"
      className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ease-out ${hudMounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex: UI_LAYERS.HUD }}
    >
      <RainScreenEffect />
      <SprintDrainOverlay />
      <CombatPreEngagementWarning />

      <DynamicCrosshair />
      {proximityFxActive ? <CrosshairInteractionPrompt /> : null}

      <AnimatePresence>
        <CriticalStatusWhisper
          energy={energy}
          stress={stress}
          isLowEnergy={isLowEnergy}
          isHighStress={isHighStress}
        />
      </AnimatePresence>

      <AnimatePresence>
        {showSaveIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-4 top-4 hud-filmic-toast rounded-sm flex items-center gap-2 px-3 py-2"
            style={{ zIndex: UI_LAYERS.HUD + 2 }}
            role="status"
            aria-live="polite"
          >
            <Save className="size-3 text-stone-500" aria-hidden />
            <span className="hud-filmic-body text-[12px]">Запись сохранена</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ContextualHint hint={currentHint} onDismiss={dismissHint} />
      <PhysicsDegradedDevBadge />

      <AnimatePresence>
        {(isLowEnergy || isHighStress) && (
          <>
            <motion.div
              key="warn-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="hud-edge-warning-left"
              aria-hidden="true"
            />
            <motion.div
              key="warn-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="hud-edge-warning-right"
              aria-hidden="true"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
