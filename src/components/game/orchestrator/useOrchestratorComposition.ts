import { useMemo } from 'react';
import type { ComponentProps } from 'react';
import { useOrchestratorRuntime } from './useOrchestratorRuntime';
import type { OrchestratorCanvasLayer } from './OrchestratorCanvasLayer';
import type { OrchestratorGameplayLayer } from './OrchestratorGameplayLayer';
import type { OrchestratorPanelLayer } from './OrchestratorPanelSlots';
import type { OrchestratorPauseMenu } from './OrchestratorPauseMenu';
import type { OrchestratorQuestOverlays } from './OrchestratorQuestOverlays';

export type OrchestratorCanvasProps = ComponentProps<typeof OrchestratorCanvasLayer>;
export type OrchestratorGameplayProps = ComponentProps<typeof OrchestratorGameplayLayer>;
export type OrchestratorPanelProps = ComponentProps<typeof OrchestratorPanelLayer>;
export type OrchestratorPauseMenuProps = ComponentProps<typeof OrchestratorPauseMenu>;
export type OrchestratorQuestOverlayProps = ComponentProps<typeof OrchestratorQuestOverlays>;

/** Stable, layer-scoped prop bundles for the game orchestrator tree. */
export function useOrchestratorComposition() {
  const runtime = useOrchestratorRuntime();
  const {
    panels,
    panelClosers,
    hudSecondaryOpeners,
    pauseDialog,
    gameDataReady,
    mode,
    introSeen,
    devToolsArmed,
    devPanelStartOpen,
    canvasMounted,
    canvasReady,
    isTransitioning,
    fadeOutMs,
    sceneBanner,
    interaction,
    showGameplayPanels,
    matrixQuote,
    dismissMatrixQuote,
  } = runtime;

  const {
    handleOpenQuests,
    handleOpenInventory,
    handleOpenPoetry,
    handleOpenJournal,
    handleToggleTutorials,
    handleOpenMenu,
    handleOpenPoetryBook,
    dispatchPanel,
    closeAllPanels,
    closePanelByType,
    questAccept,
    setQuestAccept,
    questComplete,
    dismissQuestComplete,
    firstReadingCelebration,
    dismissFirstReadingCelebration,
    questChainUnlock,
    setQuestChainUnlock,
    panelStack,
  } = panels;

  const canvasProps = useMemo(
    (): OrchestratorCanvasProps => ({
      mode,
      introSeen,
      gameDataReady,
      canvasMounted,
      canvasReady,
      isTransitioning,
      fadeOutMs,
      matrixQuote,
      onDismissMatrixQuote: dismissMatrixQuote,
    }),
    [
      mode,
      introSeen,
      gameDataReady,
      canvasMounted,
      canvasReady,
      isTransitioning,
      fadeOutMs,
      matrixQuote,
      dismissMatrixQuote,
    ],
  );

  const gameplayPanelHandlers = useMemo(
    () => ({
      handleOpenQuests,
      handleOpenInventory,
      handleOpenPoetry,
      handleOpenJournal,
      handleToggleTutorials,
      handleOpenMenu,
    }),
    [
      handleOpenQuests,
      handleOpenInventory,
      handleOpenPoetry,
      handleOpenJournal,
      handleToggleTutorials,
      handleOpenMenu,
    ],
  );

  const gameplayProps = useMemo(
    (): OrchestratorGameplayProps => ({
      gameDataReady,
      sceneBanner,
      interaction,
      panels: gameplayPanelHandlers,
      panelClosers,
      hudSecondaryOpeners,
    }),
    [
      gameDataReady,
      sceneBanner,
      interaction,
      gameplayPanelHandlers,
      panelClosers,
      hudSecondaryOpeners,
    ],
  );

  const panelProps = useMemo(
    (): OrchestratorPanelProps => ({
      showGameplayPanels,
      onClose: panelClosers,
      onOpenPoetryBook: handleOpenPoetryBook,
      devToolsArmed,
      devPanelStartOpen,
    }),
    [
      showGameplayPanels,
      panelClosers,
      handleOpenPoetryBook,
      devToolsArmed,
      devPanelStartOpen,
    ],
  );

  const pausePanelHandlers = useMemo(
    () => ({
      dispatchPanel,
      closeAllPanels,
      closePanelByType,
    }),
    [dispatchPanel, closeAllPanels, closePanelByType],
  );

  const pauseProps = useMemo(
    (): OrchestratorPauseMenuProps => ({
      pauseDialog,
      panels: pausePanelHandlers,
      onClose: panelClosers,
    }),
    [pauseDialog, pausePanelHandlers, panelClosers],
  );

  const questProps = useMemo(
    (): OrchestratorQuestOverlayProps => ({
      questAccept,
      setQuestAccept,
      questComplete,
      dismissQuestComplete,
      firstReadingCelebration,
      dismissFirstReadingCelebration,
      questChainUnlock,
      setQuestChainUnlock,
    }),
    [
      questAccept,
      setQuestAccept,
      questComplete,
      dismissQuestComplete,
      firstReadingCelebration,
      dismissFirstReadingCelebration,
      questChainUnlock,
      setQuestChainUnlock,
    ],
  );

  return {
    canvasProps,
    gameplayProps,
    panelProps,
    pauseProps,
    questProps,
    panelStack,
  };
}
