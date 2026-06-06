/* ─── Volodka RPG – Main game orchestrator (thin coordinator) ─── */

import {
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useOrchestratorOverlay } from '@/store/selectors';
import { STORY_NODES } from '@/data/storyNodes';
import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  closeMinigame,
  type MinigamePanelSetters,
} from '@/shared/constants/minigames';
import { VirtualControlsContext, sharedVirtualControlsRef } from '@/engine/VirtualControlsState';

import { useCombatOrchestrator } from '@/hooks/useCombatOrchestrator';
import { useAudioOrchestrator } from '@/hooks/useAudioOrchestrator';
import { useInteractionOrchestrator } from '@/hooks/useInteractionOrchestrator';
import { useLoreDiscovery } from '@/hooks/useLoreDiscovery';
import { useQuestTracker } from '@/hooks/useQuestTracker';
import { useMinigameForQuest } from './MinigameQuestBridge';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';
import { useWorldClock } from '@/hooks/useWorldClock';

import { LootNotification } from './LootNotification';
import { LoadingScreen } from './LoadingScreen';
import { NotificationToasts } from './NotificationToasts';
import { ExaminePanel } from './ExaminePanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HUD } from './HUD';
import { MiniMap } from './MiniMap';
import { MoralCompassHUD } from './MoralCompassHUD';
import { TutorialOverlay } from './TutorialOverlay';
import { FirstPlayTutorial } from './FirstPlayTutorial';
import { StressIndicator } from './StressIndicator';
import { QuickAccessToolbar } from './QuickAccessToolbar';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { AmbientSoundMixer } from './AmbientSoundMixer';
import { SceneTransitionProgress } from './SceneTransitionProgress';
import { QuickUseBar } from './QuickUseBar';
import { EventNotificationPopup } from './EventNotificationPopup';
import { WeatherAlertNotification } from './WeatherAlertNotification';
import { CraftingDiscoveryToast } from './CraftingDiscoveryToast';
import { CompassHUD } from './CompassHUD';
import { ExplorationMobileHud } from './ExplorationMobileHud';
import { AchievementNotification } from './AchievementNotification';
import { SceneTransitionOverlay } from './SceneTransitionOverlay';
import { WeatherIndicator } from './WeatherIndicator';
import { DayNightCycleIndicator } from './DayNightCycleIndicator';
import { FloatingTextLayer } from './FloatingText';
import { InteractionHintPopup } from './InteractionHintPopup';
import { ScreenEffects } from './ScreenEffects';
import { CutsceneOverlay } from '@/components/game/CutsceneOverlay';
import { PoetryPowerBar } from '@/components/game/PoetryPowerBar';
import { PoemPowerEffect } from '@/components/game/PoemPowerEffect';
import { DirectionalDamageIndicator } from '@/components/game/DirectionalDamageIndicator';
import { DamageNumberFloat } from '@/components/game/DamageNumberFloat';
import { QuestNotificationSystem } from './QuestNotificationSystem';
import { StoryGuidanceHUD } from './StoryGuidanceHUD';
import { LevelUpSummary } from './LevelUpSummary';
import { CyberpunkThemeProvider } from './CyberpunkTheme';

import { IntroAutoSkip } from './orchestrator/IntroAutoSkip';
import { useCanvasTransitionManager } from './orchestrator/useCanvasTransitionManager';
import { useCutsceneController } from './orchestrator/useCutsceneController';
import { usePanelCoordinator } from './orchestrator/usePanelCoordinator';
import { useKeyboardShortcutManager } from './orchestrator/useKeyboardShortcutManager';
import { useGameLifecycleManager } from './orchestrator/useGameLifecycleManager';
import { useMobileDetection } from './orchestrator/useMobileDetection';
import {
  LazyPanelSlot,
  RPGGameCanvas,
  LazyQuestsPanel,
  LazyInventory,
  LazyPoetryBook,
  LazyJournalPanel,
  LazyRestPanel,
  LazySaveSlotManager,
  LazyMiniGameHub,
  LazyNPCRelationshipPanel,
  LazyCharacterProfilePanel,
  LazyCodexPanel,
  LazyDialogueHistoryPanel,
  LazyAchievementDetailsPanel,
  LazySkillTreePanel,
  LazyFastTravelPanel,
  LazyPerksPanel,
  LazyQuestBoardPanel,
  LazyPlayerStatsPanel,
  LazyCraftingPanel,
  LazyTradingPanel,
  LazyDevPanel,
  LazyShortcutsOverlay,
  LazyCodeBreakerGame,
  LazyOpenStackTerminalGame,
  LazyBashTerminalGame,
  LazyPoetryCompositionGame,
  LazyHackingGame,
  LazyMemoryPuzzleGame,
  LazyQuizGame,
  LazyRhythmGame,
  LazyMenuScreen,
  LazyIntroScreen,
  LazyStoryRenderer,
  LazyDialogueRenderer,
  LazyCombatUI,
  LazySettingsPanel,
  LazyQuestAcceptDialog,
  LazyQuestCompleteDialog,
  LazyKarmaPoemInfoPanel,
  LazyMatrixRainQuote,
  LazyLevelUpEffect,
  LazyPhotoMode,
} from './orchestrator/lazyPanels';

/* ── Component ── */
export function GameOrchestrator() {
  const { mode, showStoryOverlay, currentNodeId, introSeen } = useOrchestratorOverlay();

  // Compute which overlay is active to enforce mutual exclusivity
  // ── World Director pattern: visual-novel is DEPRECATED ──
  // Narrative is now an overlay ON TOP of exploration mode, not a separate mode.
  // isDialogueActive checks for dialogue regardless of mode (was: mode === 'visual-novel')
  const isDialogueActive = !!DIALOGUE_NODES[currentNodeId] && showStoryOverlay;
  const isStoryActive = showStoryOverlay && !!STORY_NODES[currentNodeId];
  const isOverlayActive = isDialogueActive || isStoryActive;

  // ── Sub-orchestrators ──
  const { startCombatFromStory } = useCombatOrchestrator();
  useAudioOrchestrator();
  const interaction = useInteractionOrchestrator(startCombatFromStory);
  useLoreDiscovery();
  useQuestTracker();
  useMinigameForQuest();
  useAchievementChecker();
  // ── World Clock: single pulse for NPC schedules, weather, quests ──
  useWorldClock();

  const {
    codebreakerOpen, setCodebreakerOpen,
    openstackTerminalOpen, setOpenstackTerminalOpen,
    bashTerminalOpen, setBashTerminalOpen,
    poetryGameOpen, setPoetryGameOpen,
    hackingGameOpen, setHackingGameOpen,
    memoryGameOpen, setMemoryGameOpen,
    quizGameOpen, setQuizGameOpen,
    rhythmGameOpen, setRhythmGameOpen,
    examineOpen, setExamineOpen,
    examineData, setExamineData,
    examineHasLinkedContent, setExamineHasLinkedContent,
    handleExamineContinue,
    clearPendingTriggerZone,
  } = interaction;

  const minigameSetters = useMemo<MinigamePanelSetters>(
    () => ({
      setCodebreakerOpen,
      setOpenstackTerminalOpen,
      setBashTerminalOpen,
      setPoetryGameOpen,
      setHackingGameOpen,
      setMemoryGameOpen,
      setQuizGameOpen,
      setRhythmGameOpen,
    }),
    [
      setCodebreakerOpen,
      setOpenstackTerminalOpen,
      setBashTerminalOpen,
      setPoetryGameOpen,
      setHackingGameOpen,
      setMemoryGameOpen,
      setQuizGameOpen,
      setRhythmGameOpen,
    ],
  );

  const { canvasReady, isTransitioning } = useCanvasTransitionManager(mode);
  const { skipActiveCutscene } = useCutsceneController(currentNodeId);
  const { sceneBanner } = useGameLifecycleManager(mode);
  const isMobile = useMobileDetection();

  const panels = usePanelCoordinator({
    isOverlayActive,
    minigameSetters,
    setExamineOpen,
    setExamineData,
    setExamineHasLinkedContent,
  });

  const {
    activePanel,
    dispatchPanel,
    closePanel,
    questsOpen,
    inventoryOpen,
    poetryOpen,
    menuOpen,
    restOpen,
    shortcutsOpen,
    settingsOpen,
    saveSlotOpen,
    miniGameHubOpen,
    npcRelationOpen,
    characterProfileOpen,
    codexOpen,
    dialogueHistoryOpen,
    achievementsOpen,
    skillTreeOpen,
    craftingOpen,
    tradingOpen,
    fastTravelOpen,
    perksOpen,
    questBoardOpen,
    statsOpen,
    karmaPoemOpen,
    questAcceptId,
    questAcceptNpcId,
    setQuestAcceptId,
    setQuestAcceptNpcId,
    questCompleteId,
    questCompleteNpcId,
    setQuestCompleteId,
    setQuestCompleteNpcId,
    questChainUnlock,
    setQuestChainUnlock,
    matrixQuote,
    setMatrixQuote,
    handleOpenQuests,
    handleOpenInventory,
    handleOpenPoetry,
    handleOpenPoetryBook,
    handleToggleTutorials,
    handleOpenMenu,
  } = panels;

  useKeyboardShortcutManager({
    activePanel,
    codebreakerOpen,
    openstackTerminalOpen,
    bashTerminalOpen,
    poetryGameOpen,
    hackingGameOpen,
    memoryGameOpen,
    quizGameOpen,
    rhythmGameOpen,
    examineOpen,
    mode,
    dispatchPanel,
    minigameSetters,
    skipActiveCutscene,
    setExamineOpen,
    setExamineData,
    setExamineHasLinkedContent,
    clearPendingTriggerZone,
  });

    // Panel states (local to orchestrator — coordinate between sub-orchestrators)
  const inventoryPanelProps = useMemo(
    () => ({ onOpenPoetryBook: handleOpenPoetryBook }),
    [handleOpenPoetryBook],
  );

  const statsPanelSlot = useMemo(
    () => <LazyPanelSlot Panel={LazyPlayerStatsPanel} open={statsOpen} onClose={closePanel} />,
    [statsOpen, closePanel],
  );

  const lazyPanelsBeforeMenu = useMemo(
    () => (
      <>
        {questsOpen && (
          <LazyPanelSlot Panel={LazyQuestsPanel} open={questsOpen} onClose={closePanel} />
        )}
        {inventoryOpen && (
          <ErrorBoundary name="inventory">
            <LazyPanelSlot
              Panel={LazyInventory}
              open={inventoryOpen}
              onClose={closePanel}
              panelProps={inventoryPanelProps}
            />
          </ErrorBoundary>
        )}
        {poetryOpen && (
          <LazyPanelSlot Panel={LazyPoetryBook} open={poetryOpen} onClose={closePanel} />
        )}
        <LazyPanelSlot Panel={LazyCraftingPanel} open={craftingOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyTradingPanel} open={tradingOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyFastTravelPanel} open={fastTravelOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyRestPanel} open={restOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyJournalPanel} />
      </>
    ),
    [activePanel, closePanel, inventoryPanelProps],
  );

  const lazyPanelsAfterSettings = useMemo(
    () => (
      <>
        <LazyPanelSlot Panel={LazySaveSlotManager} open={saveSlotOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyMiniGameHub} open={miniGameHubOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyNPCRelationshipPanel} open={npcRelationOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyCharacterProfilePanel} open={characterProfileOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyCodexPanel} open={codexOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyAchievementDetailsPanel} open={achievementsOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazySkillTreePanel} open={skillTreeOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyPerksPanel} open={perksOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyQuestBoardPanel} open={questBoardOpen} onClose={closePanel} />
        <LazyPanelSlot Panel={LazyDialogueHistoryPanel} open={dialogueHistoryOpen} onClose={closePanel} />
      </>
    ),
    [activePanel, closePanel],
  );

  const devPanelSlot = useMemo(
    () => <LazyPanelSlot Panel={LazyDevPanel} />,
    [],
  );

  const shortcutsPanelSlot = useMemo(
    () => <LazyPanelSlot Panel={LazyShortcutsOverlay} open={shortcutsOpen} onClose={closePanel} />,
    [shortcutsOpen, closePanel],
  );

  // ── Mobile interact callback ──
  // When the mobile interact button is pressed, advance dialogue/story if active,
  // otherwise let the synthetic KeyE and EventBus handle the interaction.
  const handleMobileInteract = useCallback(() => {
    const store = useGameStore.getState();
    // If story overlay is showing, advance dialogue/story
    // (StoryRenderer/DialogueRenderer listen for KeyE keydown to advance)
    // The synthetic KeyE from ExplorationMobileHud will handle this.
    // No additional action needed here — the narrative overlay works on top of exploration.
    void store; // suppress unused warning
  }, []);

  // ── Render ──
  return (
    <VirtualControlsContext.Provider value={sharedVirtualControlsRef}>
    <CyberpunkThemeProvider>
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ touchAction: 'none' }}>
      <>
          {/* ── Mode transition overlay — persistent black backdrop that ONLY fades
              when the 3D canvas has rendered its first valid frame ── */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                key="mode-transition"
                className="fixed inset-0 bg-black"
                style={{ zIndex: UI_LAYERS.LOADING }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>

          {/* ── Menu mode ── */}
          {mode === 'menu' && (
            <Suspense fallback={null}>
              <LazyMenuScreen />
            </Suspense>
          )}

          {/* ── Initial loading — canvas warming up ── */}
          {/* P6-FIX: Use canvasReady STATE instead of canvasReadyRef.current.
              The ref doesn't trigger re-renders, so the LoadingScreen was
              blocking the menu forever. Also add pointer-events: none as a
              safety net — even if briefly visible, it won't block clicks. */}
          {mode === 'menu' && !canvasReady && (
            <div style={{ pointerEvents: 'none' }}>
              <LoadingScreen showTitle={true} message="Инициализация..." />
            </div>
          )}

          {/* ── Intro mode — skip if already seen ── */}
          {mode === 'intro' && !introSeen && (
            <Suspense fallback={null}>
              <LazyIntroScreen />
            </Suspense>
          )}
          {mode === 'intro' && introSeen && (
            <div className="fixed inset-0 bg-black" style={{ zIndex: UI_LAYERS.LOADING }} />
          )}
          {/* ── Intro auto-skip effect ── */}
          <IntroAutoSkip />

          {/* ── 3D Canvas — ALWAYS MOUNTED, hidden with CSS when not needed ──
              CRITICAL: We must NOT conditionally render RPGGameCanvas, because
              unmounting destroys the WebGL context, and remounting creates a new one.
              This causes white screen: old context is gone, new one may fail to
              initialize (race condition with EffectComposer, postprocessing, etc.).
              Instead, we use CSS visibility/opacity to hide the canvas when not
              in exploration/combat/cutscene/visual-novel mode. The Canvas keeps
              its WebGL context alive across mode transitions.

              NOTE: Canvas is also visible during 'intro' mode so that the
              PhaseWaking cutscene can reveal the 3D scene through its fading
              overlay WITHOUT switching mode to 'cutscene'. Previously, switching
              to cutscene unmounted IntroScreen, which cleared PhaseWaking's
              stage-5 timer — the game got stuck forever in cutscene mode. ── */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: UI_LAYERS.CANVAS,
              visibility: (mode === 'exploration' || mode === 'cutscene' || mode === 'combat' || mode === 'intro') ? 'visible' : 'hidden',
              pointerEvents: (mode === 'exploration' || mode === 'cutscene' || mode === 'combat') ? 'auto' : 'none',
            }}
          >
            <Suspense fallback={<div className="fixed inset-0 bg-black" style={{ zIndex: 100 }} />}>
              <RPGGameCanvas />
            </Suspense>
          </div>


          {/* ── Matrix Rain Quote overlay (act transitions) ── */}
          <AnimatePresence>
            {matrixQuote && (
              <Suspense fallback={null}>
                <LazyMatrixRainQuote
                  text={matrixQuote.text}
                  actNumber={matrixQuote.actNumber}
                  onDismiss={() => setMatrixQuote(null)}
                />
              </Suspense>
            )}
          </AnimatePresence>

          {/* ── Exploration / visual-novel / cutscene / combat UI layers ── */}
          {(mode === 'exploration' || mode === 'cutscene' || mode === 'combat') && (
            <>
              {/* ── Global notification toasts ── */}
              <NotificationToasts />

              {/* ── Quest notification system (auto-triggers on quest events) ── */}
              <QuestNotificationSystem />

              {/* ── Story guidance HUD (top-center, shows current objective) ── */}
              <StoryGuidanceHUD />

              {/* ── Level-up summary overlay (auto-triggers on level-up) ── */}
              <LevelUpSummary />

              {/* ── Event notification popups (combat, scene, quest, achievement) ── */}
              <EventNotificationPopup />

              {/* ── Weather alert notifications ── */}
              <WeatherAlertNotification />

              {/* ── Crafting discovery toast ── */}
              <CraftingDiscoveryToast />

              {/* ── Floating text numbers (XP, karma, damage, etc.) ── */}
              <FloatingTextLayer />

              {/* ── Interaction hint popup (contextual action hints near interactive objects) ── */}
              <InteractionHintPopup />

              {/* ── Screen effects (flash, shake, vignette, chromatic aberration) ── */}
              <ScreenEffects />


              {/* Cutscene text overlay — shows act transition text during cutscenes */}
              <CutsceneOverlay />

              {/* Scene name banner — animated fade in/out */}
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
                      {/* Decorative line below scene name */}
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

              {/* Stress indicator */}
              <StressIndicator />

              {/* Quick use bar — consumable slots above toolbar */}
              <QuickUseBar />

              {/* Quick access toolbar — compact stat bars at bottom center */}
              <QuickAccessToolbar />

              {/* Auto-save indicator — bottom-right corner */}
              <AutoSaveIndicator />

              {/* Ambient sound mixer — above AutoSaveIndicator, exploration only */}
              {mode === 'exploration' && <AmbientSoundMixer />}

              {/* Scene transition progress bar — top of screen */}
              <SceneTransitionProgress />

              {/* Compass HUD — top center, exploration only */}
              <CompassHUD />

              {/* HUD — always visible during exploration, even when story/dialogue overlays are active */}
              {mode === 'exploration' && (
                <>
                  <HUD
                    onOpenQuests={handleOpenQuests}
                    onOpenInventory={handleOpenInventory}
                    onOpenPoetry={handleOpenPoetry}
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
                  <MiniMap />
                  <MoralCompassHUD />
                  <WeatherIndicator />
                  <DayNightCycleIndicator />
                  <TutorialOverlay />
                  {/* First-play progressive tutorial — blocks gameplay until completed */}
                  <FirstPlayTutorial />
                  {/* Poetry Power quick-bar — action bar for poem powers */}
                  <PoetryPowerBar />
                </>
              )}

              {/* Player stats panel — slide-in from left (toggle with S key) */}
              {statsPanelSlot}

              {/* Poem power visual effects — visible in all game modes */}
              <PoemPowerEffect />

              {/* Level-up full-screen effect — visible in all game modes */}
              <Suspense fallback={null}>
                <LazyLevelUpEffect />
              </Suspense>

              {/* Directional damage/heal indicators — red flash on damage, emerald on heal */}
              <DirectionalDamageIndicator />

              {/* Photo mode — screenshot capture with viewfinder overlay */}
              <Suspense fallback={null}>
                <LazyPhotoMode />
              </Suspense>

              {/* Floating damage/heal numbers — combat & exploration */}
              <DamageNumberFloat />

              {/* Mobile controls — visible during ALL gameplay modes on touch devices
                  (player needs D-pad to move + interact button to advance/interact) */}
              {isMobile && <ExplorationMobileHud onInteractPress={handleMobileInteract} onOpenInventory={handleOpenInventory} />}

              {/* Story overlay — mutually exclusive with dialogue */}
              {!isDialogueActive && (
                <ErrorBoundary name="story">
                  <Suspense fallback={null}>
                    <LazyStoryRenderer />
                  </Suspense>
                </ErrorBoundary>
              )}

              {/* Dialogue overlay — mutually exclusive with story */}
              {!isStoryActive && (
                <ErrorBoundary name="dialogue">
                  <Suspense fallback={null}>
                    <LazyDialogueRenderer />
                  </Suspense>
                </ErrorBoundary>
              )}

              {/* Loot notifications */}
              <LootNotification />

              {/* Mini-games */}
              <AnimatePresence>
                {codebreakerOpen && (
                  <Suspense fallback={null}>
                    <LazyCodeBreakerGame onClose={() => closeMinigame('codebreaker', minigameSetters)} />
                  </Suspense>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {openstackTerminalOpen && (
                  <Suspense fallback={null}>
                    <LazyOpenStackTerminalGame onClose={() => closeMinigame('openstack_terminal', minigameSetters)} />
                  </Suspense>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {bashTerminalOpen && (
                  <Suspense fallback={null}>
                    <LazyBashTerminalGame onClose={() => closeMinigame('bash_terminal', minigameSetters)} />
                  </Suspense>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {poetryGameOpen && (
                  <Suspense fallback={null}>
                    <LazyPoetryCompositionGame onClose={() => closeMinigame('poetry', minigameSetters)} />
                  </Suspense>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {hackingGameOpen && (
                  <Suspense fallback={null}>
                    <LazyHackingGame onClose={() => closeMinigame('hacking', minigameSetters)} />
                  </Suspense>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {memoryGameOpen && (
                  <Suspense fallback={null}>
                    <LazyMemoryPuzzleGame onClose={() => closeMinigame('memory', minigameSetters)} />
                  </Suspense>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {quizGameOpen && (
                  <Suspense fallback={null}>
                    <LazyQuizGame onClose={() => closeMinigame('quiz', minigameSetters)} />
                  </Suspense>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {rhythmGameOpen && (
                  <Suspense fallback={null}>
                    <LazyRhythmGame onClose={() => closeMinigame('rhythm', minigameSetters)} />
                  </Suspense>
                )}
              </AnimatePresence>

              {/* Combat UI overlay */}
              <ErrorBoundary name="combat">
                <Suspense fallback={null}>
                  <LazyCombatUI />
                </Suspense>
              </ErrorBoundary>

              {/* Examine Panel */}
              <ExaminePanel
                open={examineOpen}
                data={examineData}
                hasLinkedContent={examineHasLinkedContent}
                onContinue={handleExamineContinue}
                onClose={() => {
                  setExamineOpen(false); setExamineData(null); setExamineHasLinkedContent(false);
                  // Clear pending trigger zone so it doesn't trigger later
                  clearPendingTriggerZone();
                }}
              />
            </>
          )}

          {/* ── Panels (memoized — see lazyPanelsBeforeMenu) ── */}
          {lazyPanelsBeforeMenu}

          {/* ── Pause menu ── */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 flex items-center justify-center"
                style={{ zIndex: UI_LAYERS.MENU }}
              >
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => dispatchPanel(null)} />
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 w-80 bg-slate-950/95 border border-cyan-500/20 p-0 backdrop-blur-md overflow-hidden"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                    boxShadow: '0 0 40px rgba(0, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  {/* Header with terminal style */}
                  <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-4 py-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                    <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                    <span className="h-2 w-2 rounded-full bg-red-500/80" />
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://pause</span>
                  </div>

                  <div className="p-5 flex flex-col gap-2.5">
                    <h2 className="text-lg font-semibold text-slate-100 mb-1 font-mono tracking-wide">ПАУЗА</h2>
                    <button
                      onClick={() => {
                        useGameStore.getState().saveGame({ source: 'manual' });
                        dispatchPanel(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-cyan-800/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-cyan-500">💾</span> Быстрое сохранение
                    </button>
                    <button
                      onClick={() => {
                        dispatchPanel('saveSlot');
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-cyan-800/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-cyan-500">📂</span> Управление сохранениями
                    </button>
                    <button
                      onClick={() => {
                        useGameStore.getState().loadGame();
                        dispatchPanel(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-700/40 bg-slate-900/30 text-slate-300 hover:bg-slate-800/30 hover:border-slate-600/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-slate-400">📂</span> Загрузить
                    </button>
                    <button
                      onClick={() => {
                        dispatchPanel('characterProfile');
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-emerald-800/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-emerald-500">👤</span> Профиль персонажа
                    </button>
                    <button
                      onClick={() => {
                        dispatchPanel('npcRelation');
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-violet-800/40 bg-violet-950/30 text-violet-300 hover:bg-violet-900/30 hover:border-violet-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-violet-500">👥</span> Отношения
                    </button>
                    <button
                      onClick={() => {
                        dispatchPanel('settings');
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-amber-800/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/30 hover:border-amber-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-amber-500">⚙</span> Настройки
                    </button>
                    <div className="h-px bg-slate-800/50 my-1" />
                    <button
                      onClick={() => {
                        useGameStore.getState().resetGame();
                        dispatchPanel(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-rose-800/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/30 hover:border-rose-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-rose-500">⏻</span> В главное меню
                    </button>
                    <button
                      onClick={() => dispatchPanel(null)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-700/30 bg-slate-900/20 text-slate-500 hover:bg-slate-800/30 hover:text-slate-300 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-slate-600">✕</span> Закрыть
                    </button>
                    <span className="text-[10px] text-slate-600 font-mono mt-1 text-center">ESC — закрыть</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Settings Panel ── */}
          <LazyPanelSlot Panel={LazySettingsPanel} open={settingsOpen} onClose={closePanel} />

          {/* ── Save Slot / Hub / Profile panels (memoized) ── */}
          {lazyPanelsAfterSettings}

          {/* ── Scene Transition Overlay ── */}
          <SceneTransitionOverlay />

          {/* ── Dev Panel (F3) ── */}
          {devPanelSlot}

          {/* ── Achievement Notifications ── */}
          <AchievementNotification />

          {/* ── Keyboard Shortcuts Help ── */}
          {shortcutsPanelSlot}

          {/* ── Quest Accept Dialog (Warcraft-style with portrait) ── */}
          {questAcceptId && (
            <Suspense fallback={null}>
              <LazyQuestAcceptDialog
                questId={questAcceptId}
                npcId={questAcceptNpcId}
                onClose={() => { setQuestAcceptId(null); setQuestAcceptNpcId(undefined); }}
                onAccept={(qid) => {
                  useGameStore.getState().activateQuest(qid);
                  setQuestAcceptId(null);
                  setQuestAcceptNpcId(undefined);
                }}
              />
            </Suspense>
          )}

          {/* ── Quest Complete Dialog (reward display) ── */}
          {questCompleteId && (
            <Suspense fallback={null}>
              <LazyQuestCompleteDialog
                questId={questCompleteId}
                npcId={questCompleteNpcId}
                onClose={() => { setQuestCompleteId(null); setQuestCompleteNpcId(undefined); }}
              />
            </Suspense>
          )}

          {/* ── Quest Chain Unlock Notification ── */}
          {/* Prominent notification when completing a golden path quest unlocks the next */}
          <AnimatePresence>
            {questChainUnlock && (
              <motion.div
                key="quest-chain-unlock"
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
                style={{ zIndex: UI_LAYERS.TOASTS + 3 }}
                onClick={() => setQuestChainUnlock(null)}
              >
                <div
                  className="flex items-center gap-4 px-6 py-4 rounded-xl border backdrop-blur-md cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,16,8,0.95) 0%, rgba(0,40,30,0.92) 50%, rgba(0,16,8,0.88) 100%)',
                    borderColor: 'rgba(0,255,238,0.4)',
                    boxShadow: '0 0 40px rgba(0,255,238,0.15), 0 0 15px rgba(0,255,238,0.08), 0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-lg text-xl"
                    style={{
                      background: 'rgba(0,255,238,0.12)',
                      border: '1px solid rgba(0,255,238,0.3)',
                      boxShadow: '0 0 12px rgba(0,255,238,0.15)',
                    }}
                  >
                    ⚑
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono tracking-wider font-bold"
                        style={{
                          color: '#00ffee',
                          textShadow: '0 0 8px rgba(0,255,238,0.4)',
                        }}
                      >
                        НОВОЕ ЗАДАНИЕ ДОСТУПНО
                      </span>
                      {questChainUnlock.nextQuestType === 'main' && (
                        <span
                          className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            color: '#ff6644',
                            background: 'rgba(255,102,68,0.1)',
                            border: '1px solid rgba(255,102,68,0.3)',
                          }}
                        >
                          ОСНОВНОЕ
                        </span>
                      )}
                    </div>
                    {/* Quest title */}
                    <span
                      className="text-sm font-mono font-bold"
                      style={{
                        color: '#e0f8f8',
                        textShadow: '0 0 6px rgba(0,255,238,0.2)',
                      }}
                    >
                      {questChainUnlock.nextQuestTitle}
                    </span>
                    {/* Context */}
                    <span className="text-[11px] font-mono" style={{ color: '#88aaaa' }}>
                      После «{questChainUnlock.completedQuestTitle}»
                      {questChainUnlock.actNumber > 1 && ` · Акт ${questChainUnlock.actNumber}`}
                    </span>
                  </div>
                  {/* Dismiss hint */}
                  <span className="text-[9px] font-mono ml-2" style={{ color: 'rgba(0,255,238,0.3)' }}>
                    ✕
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Karma & Poem Info Panel ── */}
          <LazyPanelSlot Panel={LazyKarmaPoemInfoPanel} open={karmaPoemOpen} onClose={() => dispatchPanel(null)} />
      </>
    </div>
    </CyberpunkThemeProvider>
    </VirtualControlsContext.Provider>
  );
}
