import { memo, Suspense, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import { QuickUseBar } from '../QuickUseBar';
import { EventNotificationPopup } from '../EventNotificationPopup';
import { WeatherAlertNotification } from '../WeatherAlertNotification';
import { CraftingDiscoveryToast } from '../CraftingDiscoveryToast';
import { CompassHUD } from '../CompassHUD';
import { ExplorationMobileHud } from '../ExplorationMobileHud';
import { SceneTransitionOverlay } from '../SceneTransitionOverlay';
import { WeatherIndicator } from '../WeatherIndicator';
import { DayNightCycleIndicator } from '../DayNightCycleIndicator';
import { FloatingTextLayer } from '../FloatingText';
import { ScreenEffects } from '../ScreenEffects';
import { CutsceneOverlay } from '@/components/game/CutsceneOverlay';
import { IntroWakeOverlay } from '@/components/game/IntroWakeOverlay';
import { CombatUI } from '@/components/game/CombatUI';
import { PoetryPowerBar } from '@/components/game/PoetryPowerBar';
import { PoemPowerEffect } from '@/components/game/PoemPowerEffect';
import { DirectionalDamageIndicator } from '@/components/game/DirectionalDamageIndicator';
import { DamageNumberFloat } from '@/components/game/DamageNumberFloat';
import { LevelUpSummary } from '../LevelUpSummary';
import { AchievementNotification } from '../AchievementNotification';
import {
  LazyStoryRenderer,
  LazyDialogueRenderer,
  LazyHUD,
  LazyMiniMap,
  LazyQuestNotificationSystem,
  LazyStoryGuidanceHUD,
  LazyLevelUpEffect,
  LazyPhotoMode,
} from './lazyPanels';
import { OrchestratorMinigameOverlays } from './OrchestratorMinigameOverlays';
import { OrchestratorStatsPanel } from './OrchestratorPanelSlots';
import type { PanelCloseHandlers } from './useStablePanelClosers';
import type { HudSecondaryPanelOpeners } from './useStableHudPanelOpeners';
import type { OrchestratorRuntime } from './useOrchestratorRuntime';
import type { GamePhase } from '@/shared/gamePhase';

type Props = {
  mode: GamePhase;
  gameDataReady: boolean;
  sceneBanner: string | null;
  isMobile: boolean;
  isStoryActive: boolean;
  isDialogueActive: boolean;
  interaction: OrchestratorRuntime['interaction'];
  panels: OrchestratorRuntime['panels'];
  panelClosers: PanelCloseHandlers;
  hudSecondaryOpeners: HudSecondaryPanelOpeners;
};

function areGameplayLayerPropsEqual(prev: Props, next: Props): boolean {
  if (
    prev.mode !== next.mode ||
    prev.gameDataReady !== next.gameDataReady ||
    prev.sceneBanner !== next.sceneBanner ||
    prev.isMobile !== next.isMobile ||
    prev.isStoryActive !== next.isStoryActive ||
    prev.isDialogueActive !== next.isDialogueActive ||
    prev.panelClosers !== next.panelClosers ||
    prev.hudSecondaryOpeners !== next.hudSecondaryOpeners
  ) {
    return false;
  }

  const pi = prev.interaction;
  const ni = next.interaction;
  if (
    pi.codebreakerOpen !== ni.codebreakerOpen ||
    pi.openstackTerminalOpen !== ni.openstackTerminalOpen ||
    pi.bashTerminalOpen !== ni.bashTerminalOpen ||
    pi.poetryGameOpen !== ni.poetryGameOpen ||
    pi.hackingGameOpen !== ni.hackingGameOpen ||
    pi.memoryGameOpen !== ni.memoryGameOpen ||
    pi.quizGameOpen !== ni.quizGameOpen ||
    pi.rhythmGameOpen !== ni.rhythmGameOpen ||
    pi.examineOpen !== ni.examineOpen ||
    pi.examineData !== ni.examineData ||
    pi.examineHasLinkedContent !== ni.examineHasLinkedContent ||
    pi.minigameSetters !== ni.minigameSetters ||
    pi.handleExamineContinue !== ni.handleExamineContinue ||
    pi.resetExamine !== ni.resetExamine ||
    pi.clearPendingTriggerZone !== ni.clearPendingTriggerZone
  ) {
    return false;
  }

  const pp = prev.panels;
  const np = next.panels;
  return (
    pp.handleOpenQuests === np.handleOpenQuests &&
    pp.handleOpenInventory === np.handleOpenInventory &&
    pp.handleOpenPoetry === np.handleOpenPoetry &&
    pp.handleOpenJournal === np.handleOpenJournal &&
    pp.handleToggleTutorials === np.handleToggleTutorials &&
    pp.handleOpenMenu === np.handleOpenMenu
  );
}

/** Exploration / cutscene / combat HUD, narrative overlays, minigames. */
export const OrchestratorGameplayLayer = memo(function OrchestratorGameplayLayer({
  mode,
  gameDataReady,
  sceneBanner,
  isMobile,
  isStoryActive,
  isDialogueActive,
  interaction,
  panels,
  panelClosers,
  hudSecondaryOpeners,
}: Props) {
  const isGameplayMode = mode === 'exploration' || mode === 'cutscene' || mode === 'combat';
  if (!isGameplayMode) return null;

  const showAmbientExplorationHud = mode === 'exploration' || mode === 'cutscene';
  const showNarrativeOverlay = mode !== 'combat';

  const {
    minigameSetters,
    codebreakerOpen,
    openstackTerminalOpen,
    bashTerminalOpen,
    poetryGameOpen,
    hackingGameOpen,
    memoryGameOpen,
    quizGameOpen,
    rhythmGameOpen,
    examineOpen,
    examineData,
    examineHasLinkedContent,
    handleExamineContinue,
    resetExamine,
    clearPendingTriggerZone,
  } = interaction;

  const handleExamineClose = useCallback(() => {
    resetExamine();
    clearPendingTriggerZone();
  }, [resetExamine, clearPendingTriggerZone]);

  const {
    handleOpenQuests,
    handleOpenInventory,
    handleOpenPoetry,
    handleOpenJournal,
    handleToggleTutorials,
    handleOpenMenu,
  } = panels;

  return (
    <>
      {mode === 'exploration' && <NotificationToasts />}

      {mode === 'exploration' && (
        <Suspense fallback={null}>
          <LazyQuestNotificationSystem />
        </Suspense>
      )}

      {mode === 'exploration' && (
        <Suspense fallback={null}>
          <LazyStoryGuidanceHUD />
        </Suspense>
      )}

      <LevelUpSummary />
      <EventNotificationPopup />

      {mode === 'exploration' && (
        <>
          <WeatherAlertNotification />
          <CraftingDiscoveryToast />
        </>
      )}

      <FloatingTextLayer />
      <ScreenEffects />
      <IntroWakeOverlay />
      <CutsceneOverlay />

      <AnimatePresence>
        {sceneBanner && (
          <motion.div
            key={sceneBanner}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: UI_LAYERS.SCENE_BANNER }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="px-12 py-6 rounded-lg"
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                background: 'rgba(0, 0, 0, 0.35)',
              }}
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wider text-center"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: 'rgba(220, 230, 250, 0.9)',
                  textShadow: '0 0 30px rgba(150, 180, 255, 0.3), 0 0 60px rgba(100, 130, 200, 0.15)',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {sceneBanner}
              </motion.h2>
              <motion.div
                className="mt-3 mx-auto w-24 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(150, 180, 255, 0.4), transparent)',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAmbientExplorationHud && (
        <>
          <StressIndicator />
          <QuickUseBar />
          <QuickAccessToolbar />
          <AutoSaveIndicator />
          <CompassHUD />
        </>
      )}
      {mode === 'exploration' && <AmbientSoundMixer />}
      <SceneTransitionProgress />

      {mode === 'exploration' && gameDataReady && (
        <>
          <Suspense fallback={null}>
            <LazyHUD
              onOpenQuests={handleOpenQuests}
              onOpenInventory={handleOpenInventory}
              onOpenPoetry={handleOpenPoetry}
              onOpenJournal={handleOpenJournal}
              onToggleTutorials={handleToggleTutorials}
              onOpenMenu={handleOpenMenu}
              {...hudSecondaryOpeners}
            />
          </Suspense>
          <Suspense fallback={null}>
            <LazyMiniMap />
          </Suspense>
          <MoralCompassHUD />
          <InteractionHintPopup />
          <WeatherIndicator />
          <DayNightCycleIndicator />
          <TutorialOverlay />
          <FirstPlayTutorial />
          <PoetryPowerBar />
        </>
      )}

      <OrchestratorStatsPanel onClose={panelClosers} />
      <PoemPowerEffect />
      <Suspense fallback={null}>
        <LazyLevelUpEffect />
      </Suspense>
      <DirectionalDamageIndicator />
      <Suspense fallback={null}>
        <LazyPhotoMode />
      </Suspense>
      <DamageNumberFloat />

      {isMobile && mode === 'exploration' && (
        <ExplorationMobileHud onOpenInventory={handleOpenInventory} />
      )}

      {showNarrativeOverlay && isStoryActive && (
        <ErrorBoundary name="story">
          <Suspense fallback={null}>
            <LazyStoryRenderer />
          </Suspense>
        </ErrorBoundary>
      )}
      {showNarrativeOverlay && isDialogueActive && (
        <ErrorBoundary name="dialogue">
          <Suspense fallback={null}>
            <LazyDialogueRenderer />
          </Suspense>
        </ErrorBoundary>
      )}

      {mode === 'exploration' && <LootNotification />}

      <OrchestratorMinigameOverlays
        codebreakerOpen={codebreakerOpen}
        openstackTerminalOpen={openstackTerminalOpen}
        bashTerminalOpen={bashTerminalOpen}
        poetryGameOpen={poetryGameOpen}
        hackingGameOpen={hackingGameOpen}
        memoryGameOpen={memoryGameOpen}
        quizGameOpen={quizGameOpen}
        rhythmGameOpen={rhythmGameOpen}
        minigameSetters={minigameSetters}
      />

      {mode === 'combat' && (
        <ErrorBoundary name="combat">
          <CombatUI />
        </ErrorBoundary>
      )}

      <ExaminePanel
        open={examineOpen}
        data={examineData}
        hasLinkedContent={examineHasLinkedContent}
        onContinue={handleExamineContinue}
        onClose={handleExamineClose}
      />

      <SceneTransitionOverlay />
      <AchievementNotification />
    </>
  );
}, areGameplayLayerPropsEqual);
