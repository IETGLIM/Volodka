/* ─── Volodka RPG – diegetic exploration HUD ───
 * Ultra-minimal overlay: no radar, coordinates, pedometer, boot spam, or icon farm.
 * OTS aids: quest bearing arrow, ambient vignette, NPC proximity whisper.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useContextualHints } from '@/hooks/useContextualHints';
import { useHudProximityFxActive } from '@/hooks/useHudProximityFxActive';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useHUDController } from '@/components/game/hud/useHUDController';
import type { HUDProps } from '@/components/game/hud/hudTypes';
import { CombatPreEngagementWarning } from '@/components/game/hud/parts/CombatPreEngagementWarning';
import { ContextualHint } from '@/components/game/hud/parts/ContextualHint';
import { CrosshairInteractionPrompt } from '@/components/game/hud/parts/CrosshairInteractionPrompt';
import { DynamicCrosshair } from '@/components/game/hud/parts/DynamicCrosshair';
import { HUDChromaticEdge } from '@/components/game/hud/parts/HUDChromaticEdge';
import { InteractionCooldownRing } from '@/components/game/hud/parts/InteractionCooldownRing';
import { InteractionDistanceRing } from '@/components/game/hud/parts/InteractionDistanceRing';
import { InteractionProximityGlow } from '@/components/game/hud/parts/InteractionProximityGlow';
import { InteractionRadarPulse } from '@/components/game/hud/parts/InteractionRadarPulse';
import { NPCProximityIndicator } from '@/components/game/hud/parts/NPCProximityIndicator';
import { LootProximityIndicator } from '@/components/game/hud/parts/LootProximityIndicator';
import { PhysicsDegradedDevBadge } from '@/components/game/hud/parts/PhysicsDegradedDevBadge';
import { QuestDirectionArrow } from '@/components/game/hud/parts/QuestDirectionArrow';
import { RainScreenEffect } from '@/components/game/hud/parts/RainScreenEffect';
import { SceneAmbientVignette } from '@/components/game/hud/parts/SceneAmbientVignette';
import { SceneTopBarHud } from '@/components/game/hud/SceneTopBarHud';
import { AmbientParticles } from '@/components/game/hud/parts/AmbientParticles';
import { SprintDrainOverlay } from '@/components/game/hud/parts/SprintDrainOverlay';
import { AaaImmersiveGuide } from '@/components/game/hud/parts/AaaImmersiveGuide';
import { AaaWorldMarkerSystem } from '@/components/game/hud/parts/AaaWorldMarkerSystem';

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
      <div className="hud-filmic-caption px-4 glow-line-bottom">
        <div className="hud-filmic-rule hud-filmic-rule--wide" aria-hidden />
        <p className="hud-filmic-body text-[12px] stat-label" style={{ color: 'var(--hud-filmic-danger)' }}>
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
  const reducedMotion = useEffectiveReducedMotion();

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
      className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ease-out hud-element-mounted hud-ambient-pulse hud-filmic-mood-vignette ${hudMounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex: UI_LAYERS.HUD, '--hud-filmic-mood-tint': 'var(--hud-filmic-glow-cool)' } as React.CSSProperties}
    >
      {/* Atmospheric scan line — subtle living feel */}
      {!reducedMotion && (
        <div className="hud-atmosphere-scan" aria-hidden="true" />
      )}
      {/* CSS-only ambient dust motes — activates the .hud-ambient-particles
          pseudo-elements in hud-filmic-ambient.css. Reduced-motion-gated
          in CSS (no animation under prefers-reduced-motion: reduce). */}
      <div className="hud-ambient-particles" aria-hidden="true" />
      {/* Corner accents for diegetic HUD frame */}
      <div className="hud-corner-accent hud-corner-accent-tl" aria-hidden="true" />
      <div className="hud-corner-accent hud-corner-accent-tr" aria-hidden="true" />
      <div className="hud-corner-accent hud-corner-accent-bl" aria-hidden="true" />
      <div className="hud-corner-accent hud-corner-accent-br" aria-hidden="true" />

      <SceneAmbientVignette />
      <SceneTopBarHud />
      <AmbientParticles />
      <RainScreenEffect />
      <SprintDrainOverlay />
      <CombatPreEngagementWarning />

      {/* Stress-reactive chromatic edge fringing — wraps the screen edges with
          subtle color separation when energy is low or stress is high. Pure
          selector-driven (energy/stress), reduced-motion-gated. */}
      <HUDChromaticEdge />

      <DynamicCrosshair />
      {/* Breathing crosshair aura + interaction-activate edge glow. Show-don't-tell
          affordance: the player senses interactables before reading any prompt. */}
      <InteractionProximityGlow />
      {/* Distance ring — sits visually inside the proximity glow but outside the
          cooldown sweep. Scales based on proximity to interactive objects; tick
          marks appear when within interaction range. EventBus-driven. */}
      <InteractionDistanceRing />
      {/* Cooldown sweep over the crosshair after each interaction — visual
          feedback for the interaction cooldown so the player knows when they
          can interact again. EventBus-driven (interaction:start/end). */}
      <InteractionCooldownRing />
      {/* Radar pulse emanating from the crosshair while moving — sonar-like
          feedback that interactables are nearby. EventBus-driven
          (exploration:footstep). Decays between steps. */}
      <InteractionRadarPulse />
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
            className="absolute right-4 top-4 hud-filmic-toast autosave-indicator rounded-sm flex items-center gap-2 px-3 py-2"
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
      <AaaImmersiveGuide />
      <AaaWorldMarkerSystem />
      <QuestDirectionArrow />
      <NPCProximityIndicator />
      <LootProximityIndicator />
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
              className="hud-warning-flash-left"
              aria-hidden="true"
            />
            <motion.div
              key="warn-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="hud-warning-flash-right"
              aria-hidden="true"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
