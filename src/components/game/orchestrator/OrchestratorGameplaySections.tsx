import { memo, Suspense, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import {
  isExplorationHudProfile,
  isMotionFxProfile,
  shouldMountSceneTransitionFx,
  useGameplayPresentationProfile,
} from '@/hooks/useGameplayPresentationProfile';
import { useCinematicNarrativePresentation } from '@/hooks/useCinematicNarrativePresentation';
import {
  CinematicShell,
  CinematicTitleCard,
  resolveSceneLocationPresentation,
} from '@/components/game/cinematic';
import type { SceneBannerPresentation } from '@/engine/world/worldAmbiencePresentation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  useActiveCutsceneId,
  useOrchestratorShell,
  useOrchestratorNarrativeOverlay,
} from '@/store/selectors';
import { usePanelStack } from './PanelStackContext';
import type { MinigamePanelSetters } from '@/shared/constants/minigames';
import type { ExamineData } from '@/shared/types/game';
import { LootNotification } from '../LootNotification';
import { NotificationToasts } from '../NotificationToasts';
import { ExaminePanel } from '../ExaminePanel';
import { InteractionHintPopup } from '../InteractionHintPopup';
import { MoralCompassHUD } from '../MoralCompassHUD';
import { TutorialOverlay } from '../TutorialOverlay';
import { FirstPlayTutorial } from '../FirstPlayTutorial';
import { StressIndicator } from '../StressIndicator';
import { QuickAccessToolbar } from '../QuickAccessToolbar';
import { AutoSaveIndicator } from '../AutoSaveIndicator';
import { AmbientSoundMixer } from '../AmbientSoundMixer';
import { SceneTransitionProgress } from '../SceneTransitionProgress';
import { SceneTransitionFailureBanner } from '../SceneTransitionFailureBanner';
import { NarrativeWorldDim } from '../NarrativeWorldDim';
import { QuickUseBar } from '../QuickUseBar';
import { EventNotificationPopup } from '../EventNotificationPopup';
import { LoreDiscoveryToast } from '../LoreDiscoveryToast';
import { WeatherAlertNotification } from '../WeatherAlertNotification';
import { CraftingDiscoveryToast } from '../CraftingDiscoveryToast';
import { GameSystemToast } from '../GameSystemToast';
import { CompassHUD } from '../CompassHUD';
import { ExplorationMobileHud } from '../ExplorationMobileHud';
import { SceneTransitionOverlay } from '../SceneTransitionOverlay';
import { WeatherIndicator } from '../WeatherIndicator';
import { AmbientAtmosphereCaption } from '../AmbientAtmosphereCaption';
import { DayNightCycleIndicator } from '../DayNightCycleIndicator';
import { FloatingTextLayer } from '../FloatingText';
import { ScreenEffects } from '../ScreenEffects';
import { CutsceneOverlay } from '@/components/game/CutsceneOverlay';
import { IntroWakeOverlay } from '@/components/game/IntroWakeOverlay';
import { PoetryPowerBar } from '@/components/game/PoetryPowerBar';
import { PoemPowerEffect } from '@/components/game/PoemPowerEffect';
import { PoemWorldEffect } from '@/components/game/poemWorldEffect/PoemWorldEffect';
import { DirectionalDamageIndicator } from '@/components/game/DirectionalDamageIndicator';
import { DamageNumberFloat } from '@/components/game/DamageNumberFloat';
import { LevelUpSummary } from '../LevelUpSummary';
import { AchievementNotification } from '../AchievementNotification';
import {
  LazyStoryRenderer,
  LazyDialogueRenderer,
  LazyCombatUI,
  LazyHUD,
  LazyMiniMap,
  LazyQuestNotificationSystem,
  LazyStoryGuidanceHUD,
  LazyLevelUpEffect,
  LazyPhotoMode,
} from './lazyPanels';
import { OrchestratorMinigameOverlays } from './OrchestratorMinigameOverlays';
import { EncounterBeatOverlay } from '../EncounterBeatOverlay';
import { OrchestratorStatsPanel } from './OrchestratorPanelSlots';
import { useMobileDetection } from './useMobileDetection';
import type { PanelCloseHandlers } from './useStablePanelClosers';
import type { HudSecondaryPanelOpeners } from './useStableHudPanelOpeners';

export type GameplayHudPanelOpeners = {
  onOpenQuests: () => void;
  onOpenInventory: () => void;
  onOpenPoetry: () => void;
  onOpenJournal: () => void;
  onToggleTutorials: () => void;
  onOpenMenu: () => void;
};

export type GameplayExamineProps = {
  open: boolean;
  data: ExamineData | null;
  hasLinkedContent: boolean;
  onContinue: () => void;
  onReset: () => void;
  onClearPendingTriggerZone: () => void;
};

export type GameplayMinigameProps = {
  codebreakerOpen: boolean;
  openstackTerminalOpen: boolean;
  bashTerminalOpen: boolean;
  poetryGameOpen: boolean;
  hackingGameOpen: boolean;
  memoryGameOpen: boolean;
  quizGameOpen: boolean;
  rhythmGameOpen: boolean;
  minigameSetters: MinigamePanelSetters;
};

function isAnyMinigameOpen(props: GameplayMinigameProps): boolean {
  return (
    props.codebreakerOpen
    || props.openstackTerminalOpen
    || props.bashTerminalOpen
    || props.poetryGameOpen
    || props.hackingGameOpen
    || props.memoryGameOpen
    || props.quizGameOpen
    || props.rhythmGameOpen
  );
}

/** Exploration-only notification toasts and guidance. */
export const GameplayExplorationNotifications = memo(function GameplayExplorationNotifications() {
  const profile = useGameplayPresentationProfile();
  if (!isExplorationHudProfile(profile)) return null;

  return (
    <>
      <NotificationToasts />
      <Suspense fallback={null}>
        <LazyQuestNotificationSystem />
      </Suspense>
      <Suspense fallback={null}>
        <LazyStoryGuidanceHUD />
      </Suspense>
      <WeatherAlertNotification />
      <CraftingDiscoveryToast />
      <GameSystemToast />
      {/* MUST stay mounted during exploration: listens for ui:loot_notification on EventBus. */}
      <LootNotification />
    </>
  );
});

/** EventBus-driven toasts — must stay mounted during gameplay to receive payloads. */
export const GameplayEventNotifications = memo(function GameplayEventNotifications() {
  return (
    <>
      <EventNotificationPopup />
      <LoreDiscoveryToast />
      <AchievementNotification />
    </>
  );
});

/** Level-up full-screen effects — exploration and combat only (not encounter/transition beats). */
export const GameplayLevelUpEffects = memo(function GameplayLevelUpEffects() {
  const profile = useGameplayPresentationProfile();
  if (!isMotionFxProfile(profile)) return null;

  return (
    <>
      <LevelUpSummary />
      <Suspense fallback={null}>
        <LazyLevelUpEffect />
      </Suspense>
    </>
  );
});

/** Floating combat/exploration numbers and edge flashes. */
export const GameplayCombatVisualFx = memo(function GameplayCombatVisualFx() {
  const profile = useGameplayPresentationProfile();
  if (!isMotionFxProfile(profile)) return null;

  return (
    <>
      <FloatingTextLayer />
      <DirectionalDamageIndicator />
      <DamageNumberFloat />
    </>
  );
});

/** FX flash/shake/vignette — all gameplay modes (cutscene drama, combat hits). */
export const GameplayScreenEffectsLayer = memo(function GameplayScreenEffectsLayer() {
  return <ScreenEffects />;
});

/** Intro wake cinematic letterbox — only during intro_wakeup cutscene. */
export const GameplayIntroWakeOverlay = memo(function GameplayIntroWakeOverlay() {
  const cutsceneId = useActiveCutsceneId();
  if (cutsceneId !== 'intro_wakeup') return null;

  return <IntroWakeOverlay />;
});

/**
 * Cutscene text overlay — mounted while a cutscene is active.
 * MUST stay mounted for the full cutscene: listens on cutscene:overlay EventBus.
 */
export const GameplayCutsceneOverlay = memo(function GameplayCutsceneOverlay() {
  const { mode } = useOrchestratorShell();
  const cutsceneId = useActiveCutsceneId();
  if (mode !== 'cutscene' && cutsceneId == null) return null;

  return <CutsceneOverlay />;
});

/** Scene transition progress bar and wipe overlay. */
export const GameplaySceneTransitionFx = memo(function GameplaySceneTransitionFx() {
  const profile = useGameplayPresentationProfile();
  if (!shouldMountSceneTransitionFx(profile)) return null;

  return (
    <>
      <SceneTransitionProgress />
      <SceneTransitionFailureBanner />
      <SceneTransitionOverlay />
    </>
  );
});

/** Poem world-event ambient layer — tint, epigraph, letterbox (below power title FX). */
export const GameplayPoemWorldFx = memo(function GameplayPoemWorldFx() {
  const profile = useGameplayPresentationProfile();
  if (!isMotionFxProfile(profile)) return null;

  return <PoemWorldEffect />;
});

/** Poem power activation VFX — exploration and combat. */
export const GameplayPoemPowerFx = memo(function GameplayPoemPowerFx() {
  const profile = useGameplayPresentationProfile();
  if (!isMotionFxProfile(profile)) return null;

  return <PoemPowerEffect />;
});

/** Photo mode viewfinder — exploration only (Ctrl+P / HUD button). */
export const GameplayPhotoMode = memo(function GameplayPhotoMode() {
  const profile = useGameplayPresentationProfile();
  if (!isExplorationHudProfile(profile)) return null;

  return (
    <Suspense fallback={null}>
      <LazyPhotoMode />
    </Suspense>
  );
});

/** Cross-mode HUD effects — conditionally mounted sub-layers. */
export const GameplaySharedEffects = memo(function GameplaySharedEffects() {
  return (
    <>
      <GameplayLevelUpEffects />
      <GameplayEventNotifications />
      <GameplayCombatVisualFx />
      <GameplayScreenEffectsLayer />
      <GameplayIntroWakeOverlay />
      <EncounterBeatOverlay />
      <GameplayCutsceneOverlay />
      <GameplaySceneTransitionFx />
      <GameplayPoemWorldFx />
      <GameplayPoemPowerFx />
      <GameplayPhotoMode />
    </>
  );
});

/** Scene title banner on location change — AAA cinematic card. */
export const GameplaySceneBanner = memo(function GameplaySceneBanner({
  sceneBanner,
}: {
  sceneBanner: SceneBannerPresentation | null;
}) {
  const reducedMotion = useEffectiveReducedMotion();
  const presentation = resolveSceneLocationPresentation('#88aacc');
  const visible = sceneBanner != null;
  useCinematicNarrativePresentation(visible);

  return (
    <AnimatePresence>
      {sceneBanner && (
        <motion.div
          key={sceneBanner.bannerKey}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: UI_LAYERS.SCENE_BANNER }}
          data-testid="scene-banner"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
        >
          <CinematicShell presentation={presentation} backdropVariant="transition">
            <CinematicTitleCard
              title={sceneBanner.title}
              subtitle={sceneBanner.subtitle ?? undefined}
              accentColor={presentation.accentColor}
              reducedMotion={reducedMotion}
              size="location"
            />
          </CinematicShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/** Stress, compass, quick-use — exploration only (widgets no-op in cutscene). */
export const GameplayAmbientExplorationHud = memo(function GameplayAmbientExplorationHud() {
  const profile = useGameplayPresentationProfile();
  if (!isExplorationHudProfile(profile)) return null;

  return (
    <>
      <StressIndicator />
      <QuickUseBar />
      <QuickAccessToolbar />
      <AutoSaveIndicator />
      <CompassHUD />
    </>
  );
});

/** Primary exploration HUD — gated on game data preload. */
export const GameplayExplorationHud = memo(function GameplayExplorationHud({
  gameDataReady,
  panelOpeners,
  hudSecondaryOpeners,
}: {
  gameDataReady: boolean;
  panelOpeners: GameplayHudPanelOpeners;
  hudSecondaryOpeners: HudSecondaryPanelOpeners;
}) {
  const profile = useGameplayPresentationProfile();
  if (!isExplorationHudProfile(profile) || !gameDataReady) return null;

  return (
    <>
      <AmbientSoundMixer />
      <Suspense fallback={null}>
        <LazyHUD
          onOpenQuests={panelOpeners.onOpenQuests}
          onOpenInventory={panelOpeners.onOpenInventory}
          onOpenPoetry={panelOpeners.onOpenPoetry}
          onOpenJournal={panelOpeners.onOpenJournal}
          onToggleTutorials={panelOpeners.onToggleTutorials}
          onOpenMenu={panelOpeners.onOpenMenu}
          {...hudSecondaryOpeners}
        />
      </Suspense>
      <Suspense fallback={null}>
        <LazyMiniMap />
      </Suspense>
      <MoralCompassHUD />
      <InteractionHintPopup />
      <WeatherIndicator />
      <AmbientAtmosphereCaption />
      <DayNightCycleIndicator />
      <TutorialOverlay />
      <FirstPlayTutorial />
      <PoetryPowerBar />
    </>
  );
});

/** Stack-driven stats panel slot — mount only while stats panel is open. */
export const GameplayStatsPanel = memo(function GameplayStatsPanel({
  onClose,
}: {
  onClose: PanelCloseHandlers;
}) {
  const { isPanelOpen } = usePanelStack();
  if (!isPanelOpen('stats')) return null;

  return <OrchestratorStatsPanel onClose={onClose} />;
});

/** Touch-first exploration controls. */
export const GameplayMobileExplorationHud = memo(function GameplayMobileExplorationHud({
  onOpenInventory,
}: {
  onOpenInventory: () => void;
}) {
  const profile = useGameplayPresentationProfile();
  const isMobile = useMobileDetection();
  if (!isMobile || !isExplorationHudProfile(profile)) return null;

  return <ExplorationMobileHud onOpenInventory={onOpenInventory} />;
});

/** Story and dialogue overlays — store selectors avoid stale narrative flags. */
export const GameplayNarrativeOverlay = memo(function GameplayNarrativeOverlay() {
  const { mode } = useOrchestratorShell();
  const { showStoryOverlay, narrativeKind } = useOrchestratorNarrativeOverlay();

  const cinematicActive =
    mode !== 'combat' &&
    showStoryOverlay &&
    (narrativeKind === 'story' || narrativeKind === 'dialogue');
  useCinematicNarrativePresentation(cinematicActive);

  if (mode === 'combat') return null;

  const isStoryActive = showStoryOverlay && narrativeKind === 'story';
  const isDialogueActive = showStoryOverlay && narrativeKind === 'dialogue';
  const isResolvingNarrativeKind = showStoryOverlay && narrativeKind == null;

  return (
    <>
      <NarrativeWorldDim />
      {isResolvingNarrativeKind && (
        <div
          className="fixed inset-0 flex items-end justify-center pb-28 pointer-events-none"
          style={{ zIndex: UI_LAYERS.DIALOGUE }}
          aria-busy="true"
          aria-live="polite"
          data-testid="narrative-kind-recovery"
        >
          <span className="text-xs font-mono tracking-widest text-cyan-300/60 animate-pulse">
            Загрузка сцены…
          </span>
        </div>
      )}
      {isStoryActive && (
        <ErrorBoundary name="story">
          <Suspense
            fallback={
              <div
                className="fixed inset-0 flex items-end justify-center pb-28 pointer-events-none"
                style={{ zIndex: UI_LAYERS.DIALOGUE }}
                aria-hidden
              >
                <span className="text-xs font-mono tracking-widest text-cyan-300/60 animate-pulse">
                  Загрузка сцены…
                </span>
              </div>
            }
          >
            <LazyStoryRenderer />
          </Suspense>
        </ErrorBoundary>
      )}
      {isDialogueActive && (
        <ErrorBoundary name="dialogue">
          <Suspense fallback={null}>
            <LazyDialogueRenderer />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
});

/** Minigame overlay stack — mount only while a minigame panel is open. */
export const GameplayMinigameLayer = memo(function GameplayMinigameLayer(props: GameplayMinigameProps) {
  if (!isAnyMinigameOpen(props)) return null;

  return <OrchestratorMinigameOverlays {...props} />;
});

/** Combat UI shell. */
export const GameplayCombatLayer = memo(function GameplayCombatLayer() {
  const { mode } = useOrchestratorShell();
  if (mode !== 'combat') return null;

  return (
    <ErrorBoundary name="combat">
      <Suspense fallback={null}>
        <LazyCombatUI />
      </Suspense>
    </ErrorBoundary>
  );
});

/** Examine interaction — cinematic object beat. */
export const GameplayExamineOverlay = memo(function GameplayExamineOverlay({
  open,
  data,
  hasLinkedContent,
  onContinue,
  onReset,
  onClearPendingTriggerZone,
}: GameplayExamineProps) {
  useCinematicNarrativePresentation(open);

  const handleClose = useCallback(() => {
    onReset();
    onClearPendingTriggerZone();
  }, [onReset, onClearPendingTriggerZone]);

  if (!open) return null;

  return (
    <ExaminePanel
      open={open}
      data={data}
      hasLinkedContent={hasLinkedContent}
      onContinue={onContinue}
      onClose={handleClose}
    />
  );
});
