import { useEffect, useState } from 'react';
import { useOrchestratorShell, useOrchestratorNarrativeOverlay, useArmDevTools } from '@/store/selectors';
import { useCombatOrchestrator } from '@/hooks/useCombatOrchestrator';
import { useAudioOrchestrator } from '@/hooks/useAudioOrchestrator';
import { useInteractionOrchestrator } from '@/hooks/useInteractionOrchestrator';
import { useLoreDiscovery } from '@/hooks/useLoreDiscovery';
import { useQuestTracker } from '@/hooks/useQuestTracker';
import { useMinigameForQuest } from '../MinigameQuestBridge';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';
import { useWorldClock } from '@/hooks/useWorldClock';
import { useWorldStream } from '@/hooks/useWorldStream';
import { disposeGameEngine, reviveGameEngine } from '@/engine/disposeGameEngine';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { useCutsceneController } from './useCutsceneController';
import { usePanelCoordinator } from './usePanelCoordinator';
import { useGameLifecycleManager } from './useGameLifecycleManager';
import { useNarrativeKindRecovery } from './useNarrativeKindRecovery';
import { useMobileDetection } from './useMobileDetection';
import { useStablePanelClosers } from './useStablePanelClosers';
import { useStableHudPanelOpeners } from './useStableHudPanelOpeners';
import { useGameIntegrityGuard } from '@/hooks/useGameIntegrityGuard';
import { registerVolodkaE2EBridge } from '@/engine/e2e/e2eBridge';
import { useOrchestratorLoading } from './useOrchestratorLoading';
import { useOrchestratorInput } from './useOrchestratorInput';
import {
  setAdaptiveQualityBridgeEnabled,
} from '@/engine/graphics/adaptiveQualityBridge';
import { setMusicIntensityLayer, resolveMusicIntensityLayer } from '@/engine/audio/musicIntensityLayers';

/** Bundles orchestrator hooks — GameOrchestrator stays a thin render coordinator. */
export function useOrchestratorRuntime() {
  const { mode, introSeen, mainMenuOpen, devToolsArmed } = useOrchestratorShell();
  const { showStoryOverlay, narrativeKind } = useOrchestratorNarrativeOverlay();

  const {
    gameDataReady,
    canvasMounted,
    canvasReady,
    isTransitioning,
    fadeOutMs,
  } = useOrchestratorLoading(mode);

  useEffect(() => {
    reviveGameEngine();
    registerVolodkaE2EBridge();
    return () => disposeGameEngine();
  }, []);

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
  const isResolvingNarrativeKind = showStoryOverlay && narrativeKind == null;
  const isOverlayActive = isDialogueActive || isStoryActive || isResolvingNarrativeKind;

  const { startCombatFromStory } = useCombatOrchestrator();
  useAudioOrchestrator();
  const interaction = useInteractionOrchestrator(startCombatFromStory);
  useLoreDiscovery();
  useQuestTracker();
  useMinigameForQuest();
  useAchievementChecker();
  useWorldClock();
  useWorldStream(!mainMenuOpen && mode !== 'intro');

  useEffect(() => {
    setAdaptiveQualityBridgeEnabled(!mainMenuOpen && mode !== 'menu');
  }, [mainMenuOpen, mode]);

  useEffect(() => {
    setMusicIntensityLayer(
      resolveMusicIntensityLayer(mode, { showStoryOverlay }),
    );
  }, [mode, showStoryOverlay]);

  const { skipActiveCutscene } = useCutsceneController();
  const { sceneBanner } = useGameLifecycleManager(mode);
  useGameIntegrityGuard(devToolsArmed);
  const isMobile = useMobileDetection();

  const panels = usePanelCoordinator({
    onPanelOpened: interaction.resetExamine,
  });

  useEffect(() => {
    if (!isOverlayActive) return;
    interaction.dismissForNarrativeOverlay();
    panels.closeAllPanels();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [isOverlayActive, interaction.dismissForNarrativeOverlay, panels.closeAllPanels]);

  useEffect(() => {
    if (!isOverlayActive || typeof document === 'undefined') return;
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [isOverlayActive]);

  const panelClosers = useStablePanelClosers(panels.closePanelByType);
  const hudSecondaryOpeners = useStableHudPanelOpeners(panels.dispatchPanel);

  useOrchestratorInput({
    mode,
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
    dispatchPanel: panels.dispatchPanel,
    closePanel: panels.closePanel,
    closeAllPanels: panels.closeAllPanels,
    minigameSetters: interaction.minigameSetters,
    setExamineOpen: interaction.setExamineOpen,
    skipActiveCutscene,
    resetExamine: interaction.resetExamine,
    clearPendingTriggerZone: interaction.clearPendingTriggerZone,
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
    hudSecondaryOpeners,
    pauseDialog,
    matrixQuote: panels.matrixQuote,
    setMatrixQuote: panels.setMatrixQuote,
    dismissMatrixQuote: panels.dismissMatrixQuote,
    showGameplayPanels: !mainMenuOpen && mode !== 'intro',
  };
}

export type OrchestratorRuntime = ReturnType<typeof useOrchestratorRuntime>;
