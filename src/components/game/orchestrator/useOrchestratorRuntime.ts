import { useEffect, useState } from 'react';
import { useOrchestratorShell, useOrchestratorNarrativeOverlay, useArmDevTools } from '@/store/selectors';
import { sharedVirtualControlsRef } from '@/engine/VirtualControlsState';
import { useCombatOrchestrator } from '@/hooks/useCombatOrchestrator';
import { useAudioOrchestrator } from '@/hooks/useAudioOrchestrator';
import { useInteractionOrchestrator } from '@/hooks/useInteractionOrchestrator';
import { useLoreDiscovery } from '@/hooks/useLoreDiscovery';
import { useQuestTracker } from '@/hooks/useQuestTracker';
import { useMinigameForQuest } from '../MinigameQuestBridge';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';
import { useWorldClock } from '@/hooks/useWorldClock';
import { useWorldStream } from '@/hooks/useWorldStream';
import { useGameDataPreload } from '@/hooks/useGameDataPreload';
import { markOrchestratorMount } from '@/engine/performance/LoadingTimeline';
import { disposeGameEngine, reviveGameEngine } from '@/engine/disposeGameEngine';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { useCanvasTransitionManager } from './useCanvasTransitionManager';
import { useCutsceneController } from './useCutsceneController';
import { usePanelCoordinator } from './usePanelCoordinator';
import { useKeyboardShortcutManager } from './useKeyboardShortcutManager';
import { useGamepadInput } from '@/hooks/useGamepadInput';
import { useGameLifecycleManager } from './useGameLifecycleManager';
import { useNarrativeKindRecovery } from './useNarrativeKindRecovery';
import { useMobileDetection } from './useMobileDetection';
import { useStablePanelClosers } from './useStablePanelClosers';
import { useGameIntegrityGuard } from '@/hooks/useGameIntegrityGuard';

/** Bundles orchestrator hooks — GameOrchestrator stays a thin render coordinator. */
export function useOrchestratorRuntime() {
  const gameDataReady = useGameDataPreload();

  useEffect(() => {
    reviveGameEngine();
    markOrchestratorMount();
    return () => disposeGameEngine();
  }, []);

  const { mode, introSeen, mainMenuOpen, devToolsArmed } = useOrchestratorShell();
  const { showStoryOverlay, narrativeKind } = useOrchestratorNarrativeOverlay();
  const [canvasMounted, setCanvasMounted] = useState(!mainMenuOpen);

  useEffect(() => {
    if (!mainMenuOpen) setCanvasMounted(true);
  }, [mainMenuOpen]);

  const pauseDialog = usePanelDialog();
  const armDevTools = useArmDevTools();
  const [devPanelStartOpen, setDevPanelStartOpen] = useState(false);

  useNarrativeKindRecovery();

  useEffect(() => {
    if (devToolsArmed) return;
    const handleF3 = (event: KeyboardEvent) => {
      if (event.code === 'F3') {
        setDevPanelStartOpen(true);
        armDevTools();
      }
    };
    window.addEventListener('keydown', handleF3);
    return () => window.removeEventListener('keydown', handleF3);
  }, [devToolsArmed, armDevTools]);

  const isStoryActive = showStoryOverlay && narrativeKind === 'story';
  const isDialogueActive = showStoryOverlay && narrativeKind === 'dialogue';
  const isOverlayActive = isDialogueActive || isStoryActive;

  const { startCombatFromStory } = useCombatOrchestrator();
  useAudioOrchestrator();
  const interaction = useInteractionOrchestrator(startCombatFromStory);
  useLoreDiscovery();
  useQuestTracker();
  useMinigameForQuest();
  useAchievementChecker();
  useWorldClock();
  useWorldStream(!mainMenuOpen && mode !== 'intro');

  const { canvasReady, isTransitioning, fadeOutMs } = useCanvasTransitionManager(mode);
  const { skipActiveCutscene } = useCutsceneController();
  const { sceneBanner } = useGameLifecycleManager(mode);
  useGameIntegrityGuard(devToolsArmed);
  const isMobile = useMobileDetection();

  const panels = usePanelCoordinator({
    isOverlayActive,
    minigameSetters: interaction.minigameSetters,
    setExamineOpen: interaction.setExamineOpen,
    setExamineData: interaction.setExamineData,
    setExamineHasLinkedContent: interaction.setExamineHasLinkedContent,
  });

  const panelClosers = useStablePanelClosers(panels.closePanelByType);

  useKeyboardShortcutManager({
    activePanel: panels.activePanel,
    panelStackLength: panels.panelStack.length,
    codebreakerOpen: interaction.codebreakerOpen,
    openstackTerminalOpen: interaction.openstackTerminalOpen,
    bashTerminalOpen: interaction.bashTerminalOpen,
    poetryGameOpen: interaction.poetryGameOpen,
    hackingGameOpen: interaction.hackingGameOpen,
    memoryGameOpen: interaction.memoryGameOpen,
    quizGameOpen: interaction.quizGameOpen,
    rhythmGameOpen: interaction.rhythmGameOpen,
    examineOpen: interaction.examineOpen,
    mode,
    dispatchPanel: panels.dispatchPanel,
    closePanel: panels.closePanel,
    closeAllPanels: panels.closeAllPanels,
    minigameSetters: interaction.minigameSetters,
    skipActiveCutscene,
    setExamineOpen: interaction.setExamineOpen,
    setExamineData: interaction.setExamineData,
    setExamineHasLinkedContent: interaction.setExamineHasLinkedContent,
    clearPendingTriggerZone: interaction.clearPendingTriggerZone,
  });

  useGamepadInput({
    virtualControlsRef: sharedVirtualControlsRef,
    panelStackLength: panels.panelStack.length,
    dispatchPanel: panels.dispatchPanel,
    closePanel: panels.closePanel,
    skipActiveCutscene,
  });

  return {
    gameDataReady,
    mode,
    introSeen,
    mainMenuOpen,
    devToolsArmed,
    devPanelStartOpen,
    isStoryActive,
    isDialogueActive,
    canvasMounted,
    canvasReady,
    isTransitioning,
    fadeOutMs,
    sceneBanner,
    isMobile,
    interaction,
    panels,
    panelClosers,
    pauseDialog,
    matrixQuote: panels.matrixQuote,
    setMatrixQuote: panels.setMatrixQuote,
    showGameplayPanels: !mainMenuOpen && mode !== 'intro',
  };
}

export type OrchestratorRuntime = ReturnType<typeof useOrchestratorRuntime>;
