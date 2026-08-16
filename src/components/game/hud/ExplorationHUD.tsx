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
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { useHUDController } from '@/components/game/hud/useHUDController';
import type { HUDProps } from '@/components/game/hud/hudTypes';
import { DifficultyIndicator } from '@/components/game/DifficultyIndicator';
import { CombatPreEngagementWarning } from '@/components/game/hud/parts/CombatPreEngagementWarning';
import { ContextualHint } from '@/components/game/hud/parts/ContextualHint';
import { EnhancedCrosshairPrompt } from '@/components/game/EnhancedCrosshairPrompt';
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
import { ObjectiveBeacon } from '@/components/game/hud/parts/ObjectiveBeacon';
import { InteractableSparkle } from '@/components/game/hud/parts/InteractableSparkle';
import { SceneEntryNudge } from '@/components/game/hud/parts/SceneEntryNudge';
import { QuestObjectiveCard } from '@/components/game/hud/parts/QuestObjectiveCard';
import { QuestChainUnlockToast } from '@/components/game/hud/parts/QuestChainUnlockToast';
import { ObjectiveCompleteVfx } from '@/components/game/hud/parts/ObjectiveCompleteVfx';
import { useActiveQuestCardData } from '@/components/game/hud/parts/questObjectiveCardAdapter';
import { useGamePhase } from '@/store/selectors/uiSelectors';

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
  const isMobile = useIsMobileVisual();
  const gamePhase = useGamePhase();

  /* ── QuestObjectiveCard data ──
     Adapts the active quest (lowest spineOrder wins) into the rich
     QuestData shape needed by QuestObjectiveCard. Hidden on mobile,
     in combat, in cutscenes, or when there is no active quest. */
  const activeQuestCardData = useActiveQuestCardData();
  const showQuestObjectiveCard =
    !isMobile
    && gamePhase === 'exploration'
    && activeQuestCardData !== null;

  /* ── Minimap data is no longer derived here.
     The rotating canvas minimap is mounted by OrchestratorGameplayLayer as
     <GameplayMinimap> (MinimapComponent), which reads player position and
     quest markers directly from the store. The duplicate CyberpunkMinimap
     that used this data was removed to avoid double rAF + visual overlap. */

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
      {/* Scene entry nudge — brief directional vignette on first visit. */}
      <SceneEntryNudge />
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
      {/* Subtle sparkle on nearby interactables — show-don't-tell
          affordance that draws the eye without a text prompt. */}
      <InteractableSparkle />
      {proximityFxActive ? <EnhancedCrosshairPrompt /> : null}

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

      {/* Quest chain unlock toast — top-center AAA card on story:quest_chain_unlock.
          Polished gold/cyan glow + NPC portrait + scene name. Auto-dismisses 4s
          or on click. Mounts its own AnimatePresence internally. */}
      <QuestChainUnlockToast />

      {/* Objective complete VFX — brief center-top checkmark + gold particle
          burst + soft gold flash on quest:complete_objective. ~1.5s lifetime. */}
      <ObjectiveCompleteVfx />

      <QuestDirectionArrow />
      {/* Subtle amber chevron at screen edge pointing toward objective —
          only shows after 15s of not finding the target. Show-don't-tell. */}
      <ObjectiveBeacon />
      <NPCProximityIndicator />
      <LootProximityIndicator />
      <PhysicsDegradedDevBadge />

      {/* Difficulty indicator — top-right. The main rotating canvas minimap is
          mounted separately by OrchestratorGameplayLayer as <GameplayMinimap>
          (MinimapComponent), so we do NOT render a second <CyberpunkMinimap>
          here to avoid duplicate rAF loops and visual overlap. */}
      {!isMobile && (
        <div
          className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-auto hud-filmic-glow-breathe"
          style={{ zIndex: UI_LAYERS.HUD + 1 }}
        >
          <DifficultyIndicator onClick={() => {}} />
        </div>
      )}

      {/* QuestObjectiveCard — orphan HUD mount. Surfaces the active quest
          (lowest spineOrder wins) with a compact objective checklist and
          progress bar. Desktop-only, hidden in combat/cutscene/photo mode
          and when no active quest is available. AnimatePresence handles
          the smooth fade + slide enter/exit. */}
      <AnimatePresence>
        {showQuestObjectiveCard && activeQuestCardData && (
          <motion.div
            key={`quest-objective-card-${activeQuestCardData.id}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-4 pointer-events-auto hud-filmic-glow-breathe"
            style={{ top: 'clamp(168px, 18vh, 196px)', zIndex: UI_LAYERS.HUD + 1, maxWidth: 300 }}
          >
            <QuestObjectiveCard
              quest={activeQuestCardData}
              compact={true}
              showRewards={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
