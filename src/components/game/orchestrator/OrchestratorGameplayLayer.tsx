import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LootNotification } from '../LootNotification';
import { NotificationToasts } from '../NotificationToasts';
import { ExaminePanel } from '../ExaminePanel';
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
import { PoetryPowerBar } from '@/components/game/PoetryPowerBar';
import { PoemPowerEffect } from '@/components/game/PoemPowerEffect';
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
import { OrchestratorStatsPanel } from './OrchestratorPanelSlots';
import { useDeferredHudChrome } from './useDeferredHudChrome';
import type { PanelCloseHandlers } from './useStablePanelClosers';
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
};

/** Exploration / cutscene / combat HUD, narrative overlays, minigames. */
export function OrchestratorGameplayLayer({
  mode,
  gameDataReady,
  sceneBanner,
  isMobile,
  isStoryActive,
  isDialogueActive,
  interaction,
  panels,
  panelClosers,
}: Props) {
  const isGameplayMode = mode === 'exploration' || mode === 'cutscene' || mode === 'combat';
  // Hook must run unconditionally (rules-of-hooks); enabled flag gates the timer.
  const deferredChrome = useDeferredHudChrome(mode === 'exploration' && gameDataReady);

  if (!isGameplayMode) return null;

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

  const {
    dispatchPanel,
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

      <StressIndicator />
      <QuickUseBar />
      <QuickAccessToolbar />
      <AutoSaveIndicator />
      {mode === 'exploration' && <AmbientSoundMixer />}
      <SceneTransitionProgress />
      <CompassHUD />

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
              onOpenMiniGames={() => dispatchPanel('miniGameHub')}
              onOpenCharacterProfile={() => dispatchPanel('characterProfile')}
              onOpenNPCRelations={() => dispatchPanel('npcRelation')}
              onOpenCodex={() => dispatchPanel('codex')}
              onOpenDialogueHistory={() => dispatchPanel('dialogueHistory')}
              onOpenAchievements={() => dispatchPanel('achievements')}
              onOpenSkillTree={() => dispatchPanel('skillTree')}
              onOpenCrafting={() => dispatchPanel('crafting')}
              onOpenTrading={() => dispatchPanel('trading')}
              onOpenFastTravel={() => dispatchPanel('fastTravel')}
              onOpenPerks={() => dispatchPanel('perks')}
              onOpenQuestBoard={() => dispatchPanel('questBoard')}
              onOpenStats={() => dispatchPanel('stats')}
            />
          </Suspense>
          <Suspense fallback={null}>
            <LazyMiniMap />
          </Suspense>
          {/* MoralCompassHUD lives inside LazyHUD — avoid duplicate mount */}
          <FirstPlayTutorial />
          <PoetryPowerBar />
          {deferredChrome && (
            <>
              <WeatherIndicator />
              <DayNightCycleIndicator />
              <TutorialOverlay />
            </>
          )}
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

      {isStoryActive && (
        <ErrorBoundary name="story">
          <Suspense fallback={null}>
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
          <Suspense fallback={null}>
            <LazyCombatUI />
          </Suspense>
        </ErrorBoundary>
      )}

      <ExaminePanel
        open={examineOpen}
        data={examineData}
        hasLinkedContent={examineHasLinkedContent}
        onContinue={handleExamineContinue}
        onClose={() => {
          resetExamine();
          clearPendingTriggerZone();
        }}
      />

      <SceneTransitionOverlay />
      <AchievementNotification />
    </>
  );
}
