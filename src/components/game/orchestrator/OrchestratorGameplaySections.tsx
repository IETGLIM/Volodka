import { memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useSceneTransitionOverlayController } from '@/hooks/useSceneTransitionOverlayController';
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
import { NpcNoDialogueBark } from '../NpcNoDialogueBark';
import { MoralCompassHUD } from '../MoralCompassHUD';
import { TutorialOverlay } from '../TutorialOverlay';
import { FirstPlayTutorial } from '../FirstPlayTutorial';
import { StressIndicator } from '../StressIndicator';
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
import { SceneEntryTextOverlay } from '../SceneEntryTextOverlay';
import '@/engine/audio/transitionSound';
import { WeatherIndicator } from '../WeatherIndicator';
import { AmbientAtmosphereCaption } from '../AmbientAtmosphereCaption';
import { SceneDiscoveryCelebration } from '@/components/game/hud/parts/SceneDiscoveryCelebration';
import { HUDBootSequence } from '@/components/game/hud/parts/HUDBootSequence';
import { HUDNotificationFeed } from '@/components/game/hud/parts/HUDNotificationFeed';
import { DayNightCycleIndicator } from '../DayNightCycleIndicator';
import { FloatingTextLayer } from '../FloatingText';
import { ScreenEffects } from '../ScreenEffects';
import { CutsceneOverlay } from '@/components/game/CutsceneOverlay';
// FIX-C1: IntroWakeOverlay import removed — CutsceneOverlay now handles
// the intro_wakeup cutscene's letterbox + skip + per-phase text. The
// standalone IntroWakeOverlay component was deleted as dead code.
import { PoetryPowerBar } from '@/components/game/PoetryPowerBar';
import { PoemActiveEffectsHud } from '@/components/game/poemActiveEffects/PoemActiveEffectsHud';
import { ItemGainedPopupLayer } from '@/components/game/microAnimations/ItemGainedPopupLayer';
import { StatChangeLayer } from '@/components/game/microAnimations/StatChangeLayer';
import { KarmaShiftLayer } from '@/components/game/microAnimations/KarmaShiftLayer';
import { FloatingActionIndicator } from '@/components/game/hud/parts/FloatingActionIndicator';
import { EmergencyHelpButton } from '@/components/game/hud/parts/EmergencyHelpButton';
import { ActiveQuestMiniTracker } from '@/components/game/hud/parts/ActiveQuestMiniTracker';
import { SceneTopBarHud } from '@/components/game/hud/SceneTopBarHud';
import { PoemPowerEffect } from '@/components/game/PoemPowerEffect';
import { PoemWorldEffect } from '@/components/game/poemWorldEffect/PoemWorldEffect';
import { PoemRevealHost } from '@/components/game/poemReveal/PoemRevealHost';
import { DirectionalDamageIndicator } from '@/components/game/DirectionalDamageIndicator';
import { DamageNumberFloat } from '@/components/game/DamageNumberFloat';
import { LevelUpSummary } from '../LevelUpSummary';
import { AchievementNotification } from '../AchievementNotification';
import {
  LazyStoryRenderer,
  LazyDialogueRenderer,
  LazyCombatUI,
  LazyHUD,
  LazyQuestNotificationSystem,
  LazyStoryGuidanceHUD,
  LazyPlayerLostHintToast,
  LazyLevelUpEffect,
  LazyPhotoMode,
} from './lazyPanels';
import { OrchestratorMinigameOverlays } from './OrchestratorMinigameOverlays';
import { DiegeticDialogueHud } from '@/components/game/diegetic/DiegeticDialogueHud';
import { InnerMonologueOverlay } from '@/components/game/InnerMonologueOverlay';
import { DataTerminalOverlay } from '@/components/game/DataTerminalOverlay';
import { LevelUpNotification } from '@/components/game/LevelUpNotification';
import { EncounterBeatOverlay } from '../EncounterBeatOverlay';
import { ProximityWhisperOverlay } from '@/components/game/ProximityWhisperOverlay';
import { QuickInventoryBar } from '@/components/hud/QuickInventoryBar';
import { ScenePoiCompass } from '@/components/hud/ScenePoiCompass';
import { AchievementPopup } from '@/components/game/hud/parts/AchievementPopup';
import EnvironmentalEffectsOverlay from '@/components/game/hud/parts/EnvironmentalEffectsOverlay';
import BuffDebuffTracker from '@/components/game/hud/parts/BuffDebuffTracker';
import { SkillRechargeHUD } from '@/components/game/hud/parts/SkillRechargeHUD';
import { useTrophyAchievementWatcher } from '@/engine/achievements/achievementWatcher';
import { OrchestratorStatsPanel } from './OrchestratorPanelSlots';
import { useMobileDetection } from './useMobileDetection';
import { useGameStore } from '@/store/gameStore';
import {
  useEnvironmentalEffectsOverlayProps,
  useActiveEffects,
  useIsInitialHudFocus,
  useSkillSlots,
} from '@/store/selectors/hudMountSelectors';
import { isAct1DiegeticScene } from '@/engine/narrative/narrativePresentationPolicy';
import type { PanelCloseHandlers } from './useStablePanelClosers';
import type { HudSecondaryPanelOpeners } from './useStableHudPanelOpeners';

/** Trophy achievement layer: mounts the watcher hook + popup. */
function TrophyAchievementLayer() {
  useTrophyAchievementWatcher();
  return <AchievementPopup />;
}

/** Environmental effects overlay — wrapper that calls hooks at the top level. */
function MountedEnvironmentalEffectsOverlay() {
  const overlayProps = useEnvironmentalEffectsOverlayProps();
  return <EnvironmentalEffectsOverlay {...overlayProps} />;
}

/** Buff/debuff tracker — wrapper that calls hooks at the top level. */
function MountedBuffDebuffTracker() {
  const effects = useActiveEffects();
  return <BuffDebuffTracker effects={effects} position="top-right" showTimers />;
}

/** Skill recharge HUD — wrapper that calls hooks at the top level. */
function MountedSkillRechargeHUD() {
  const skills = useSkillSlots();
  return <SkillRechargeHUD skills={skills} orientation="horizontal" compact />;
}

/** HUD boot sequence — once-per-session guard so the boot animation only plays
 *  on the first exploration-HUD mount and does NOT replay on every combat-exit.
 *  Uses sessionStorage so a refresh re-runs it (intentional — a fresh session
 *  should feel like a fresh boot), but in-app navigations between combat and
 *  exploration do not. */
function MountedHUDBootSequence() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('volodka:hud:boot:seen');
  });
  const seen = useRef(false);
  useEffect(() => {
    if (seen.current) return;
    seen.current = true;
    if (sessionStorage.getItem('volodka:hud:boot:seen')) {
      setShow(false);
      return;
    }
    sessionStorage.setItem('volodka:hud:boot:seen', '1');
  }, []);
  if (!show) return null;
  return <HUDBootSequence />;
}

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
      <Suspense fallback={null}>
        <LazyPlayerLostHintToast />
      </Suspense>
      <WeatherAlertNotification />
      <CraftingDiscoveryToast />
      <GameSystemToast />
      {/* MUST stay mounted during exploration: listens for ui:loot_notification on EventBus. */}
      <LootNotification />
      {/* Session 9: item pickup popups (rarity-colored) — listens for showItemGained() calls. */}
      <ItemGainedPopupLayer />
      {/* Localized stat-change pips (karma/energy/stress/XP) — pool-based, TTL-bounded.
          Complements the FloatingText layer with anchor-positioned, color-coded feedback. */}
      <StatChangeLayer />
      {/* Floating XP/quest/karma acknowledgement chips — EventBus-driven, auto-dismissing.
          Pure show-don't-tell feedback: the player senses progression without opening a journal. */}
      <FloatingActionIndicator />
    </>
  );
});

/** EventBus-driven toasts — must stay mounted during gameplay to receive payloads. */
export const GameplayEventNotifications = memo(function GameplayEventNotifications() {
  const profile = useGameplayPresentationProfile();
  const suppressNarrativeToasts = profile === 'narrative';

  return (
    <>
      <EventNotificationPopup />
      {!suppressNarrativeToasts && (
        <>
          <LoreDiscoveryToast />
          <AchievementNotification />
        </>
      )}
      <DataTerminalOverlay />
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

// FIX-C1 (Phase 7.2 — Prologue/IntroWake duplicate-frame cleanup):
// GameplayIntroWakeOverlay REMOVED. It was a pre-timeline standalone
// overlay that rendered 7dvh letterbox bars + hardcoded "03:47 — писк
// терминала" text + an ESC skip button during the intro_wakeup cutscene.
// When CinematicTimelineRunner was added, CutsceneOverlay became the
// generic handler for cutscene:overlay events and already renders 4dvh
// 'thin' letterbox bars + the timeline's sparse text beats + a "Пропустить"
// skip button. Both overlays were mounted simultaneously during the entire
// 29s intro_wakeup cutscene, producing the visible "double-thick letterbox +
// duplicate skip button" the user reported as "duplicate frames in the
// prologue". The IntroWakeOverlay file itself is also deleted as dead code.

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
      <SceneEntryTextOverlay />
    </>
  );
});

/** Unified poem reveal — discovery | power_ritual | explicit_read (one shell, FIFO). */
export const GameplayPoemReveal = memo(function GameplayPoemReveal() {
  return <PoemRevealHost />;
});

/** @deprecated Prefer GameplayPoemReveal */
export const GameplayPoemReadingCutscene = GameplayPoemReveal;
/** @deprecated Prefer GameplayPoemReveal */
export const GameplayPoemDiscoveryReveal = GameplayPoemReveal;

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
      <LevelUpNotification />
      <GameplayEventNotifications />
      <GameplayCombatVisualFx />
      <GameplayScreenEffectsLayer />
      {/* FIX-C1: <GameplayIntroWakeOverlay /> removed — CutsceneOverlay
          below already handles the intro_wakeup letterbox + skip + text. */}
      <EncounterBeatOverlay />
      <GameplayCutsceneOverlay />
      <GameplayPoemReveal />
      <GameplaySceneTransitionFx />
      <GameplayPoemWorldFx />
      <GameplayPoemPowerFx />
      <GameplayPhotoMode />
    </>
  );
});

/** Scene title banner on location change — AAA cinematic card.
 *  Suppressed while SceneTransitionOverlay is active to prevent overlap. */
export const GameplaySceneBanner = memo(function GameplaySceneBanner({
  sceneBanner,
}: {
  sceneBanner: SceneBannerPresentation | null;
}) {
  const reducedMotion = useEffectiveReducedMotion();
  const accentColor = sceneBanner?.accentColor ?? '#88aacc';
  const presentation = resolveSceneLocationPresentation(accentColor);
  /** Don't show banner while cinematic transition overlay is active — prevents title overlap. */
  const { isActive: transitionActive } = useSceneTransitionOverlayController();
  const visible = sceneBanner != null && !transitionActive;
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
  const initialHudFocus = useIsInitialHudFocus();
  if (!isExplorationHudProfile(profile)) return null;

  return (
    <>
      <AutoSaveIndicator />
      {/* Proximity whispers */}
      <ProximityWhisperOverlay />
      {!initialHudFocus ? (
        <>
          <StressIndicator />
          <QuickUseBar />
          <QuickInventoryBar />
          <CompassHUD />
          {/* Cohesive top-bar cluster: scene context · data ticker · exploration progress · mood. */}
          <SceneTopBarHud />
          <MountedSkillRechargeHUD />
        </>
      ) : null}
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
  const initialHudFocus = useIsInitialHudFocus();
  if (!isExplorationHudProfile(profile) || !gameDataReady) return null;

  return (
    <>
      <AmbientSoundMixer />
      {/* HUD boot sequence — once-per-session intro animation. Wrapper gates on
          sessionStorage so it only plays on the very first exploration-HUD
          mount of a session (refresh re-plays; combat-exit does NOT). */}
      <MountedHUDBootSequence />
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
      {/* Ambient slide-in feed (left side) — recent XP gains, quest updates, karma
          shifts, poems collected, lore discovered. Self-positions `fixed left-3`.
          Complements NotificationToasts (which shows poem:power_used + combat:defeat);
          the two subscribe to disjoint event sets — no overlap. MoralCompassHUD and
          KarmaShiftLayer were moved inside <LazyHUD> by the progressive-reveal
          refactor (commit 3c92c50); HUDNotificationFeed stays outside so it remains
          always-visible ambient context. */}
      <HUDNotificationFeed />
      <InteractionHintPopup />
      <NpcNoDialogueBark />
      <AmbientAtmosphereCaption />
      {/* Filmic scene-discovery celebration — replaces the older neon SceneDiscoveryToast.
          Subscribes to exploration:scene_discovered, renders a {count}/{total} kicker
          with hud-filmic-caption styling. DayNightCycleIndicator was moved inside
          <LazyHUD> by the progressive-reveal refactor (commit 3c92c50). */}
      <SceneDiscoveryCelebration />
      <TutorialOverlay />
      <FirstPlayTutorial />
      <TrophyAchievementLayer />
      {/* Emergency help button — self-contained popover with current objective +
          nearby zones + reset-interaction. Idle-pulses after 15s of no input to
          draw attention. Show-don't-tell guidance: no tutorial popups, just a
          discrete '?' button bottom-right that the player can ignore or tap. */}
      <EmergencyHelpButton />
      {/* Active quest mini-tracker — self-gating: renders nothing on desktop
          (line 204: `if (!isTouchDevice) return null;`). Only activates on touch
          devices, giving mobile players a pinnable quest tracker with cycle /
          expand / show-on-map actions that desktop gets via StoryGuidanceHUD. */}
      <ActiveQuestMiniTracker />
      {!initialHudFocus ? (
        <>
          <MoralCompassHUD />
          <KarmaShiftLayer />
          <WeatherIndicator />
          <ScenePoiCompass />
          <DayNightCycleIndicator />
          <PoetryPowerBar />
          <PoemActiveEffectsHud />
          <MountedEnvironmentalEffectsOverlay />
          <MountedBuffDebuffTracker />
        </>
      ) : null}
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
  onOpenJournal,
}: {
  onOpenInventory: () => void;
  onOpenJournal: () => void;
}) {
  const profile = useGameplayPresentationProfile();
  const isMobile = useMobileDetection();
  const { diegeticNarrative } = useOrchestratorNarrativeOverlay();
  if (!isMobile || !isExplorationHudProfile(profile) || diegeticNarrative != null) return null;

  return <ExplorationMobileHud onOpenInventory={onOpenInventory} onOpenJournal={onOpenJournal} />;
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
          {/* Visible skeleton placeholder + screen-reader text so assistive tech
              announces *what* is loading (the bare skeleton announces only "busy"). */}
          <span className="sr-only">Загрузка диалога…</span>
          <span className="text-xs font-mono tracking-widest text-cyan-300/55 cyber-loading-skeleton inline-block w-32 h-3.5"></span>
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
                <span className="cyber-loading-skeleton inline-block w-40 h-4"></span>
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
      <DiegeticDialogueHud />
      <InnerMonologueOverlay />
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
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const diegeticExamine = isAct1DiegeticScene(sceneId);
  useCinematicNarrativePresentation(open, { preserveExplorationCamera: diegeticExamine });

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
