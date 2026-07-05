import { useGamepadInput } from '@/hooks/useGamepadInput';
import { sharedVirtualControlsRef } from '@/engine/VirtualControlsState';
import { useKeyboardShortcutManager } from './useKeyboardShortcutManager';
import type { MinigamePanelSetters } from '@/shared/constants/minigames';
import type { GamePhase } from '@/shared/gamePhase';
import type { PanelType } from './types';

export interface OrchestratorInputOptions {
  mode: GamePhase;
  activePanel: PanelType | null;
  panelStackLength: number;
  codebreakerOpen: boolean;
  openstackTerminalOpen: boolean;
  bashTerminalOpen: boolean;
  poetryGameOpen: boolean;
  hackingGameOpen: boolean;
  memoryGameOpen: boolean;
  quizGameOpen: boolean;
  rhythmGameOpen: boolean;
  examineOpen: boolean;
  dispatchPanel: (panel: PanelType) => void;
  closePanel: () => void;
  closeAllPanels: () => void;
  minigameSetters: MinigamePanelSetters;
  skipActiveCutscene: () => boolean;
  resetExamine: () => void;
  clearPendingTriggerZone: () => void;
  setExamineOpen: (v: boolean) => void;
}

/** Keyboard shortcuts + gamepad input for gameplay orchestrator. */
export function useOrchestratorInput(options: OrchestratorInputOptions): void {
  useKeyboardShortcutManager({
    activePanel: options.activePanel,
    panelStackLength: options.panelStackLength,
    codebreakerOpen: options.codebreakerOpen,
    openstackTerminalOpen: options.openstackTerminalOpen,
    bashTerminalOpen: options.bashTerminalOpen,
    poetryGameOpen: options.poetryGameOpen,
    hackingGameOpen: options.hackingGameOpen,
    memoryGameOpen: options.memoryGameOpen,
    quizGameOpen: options.quizGameOpen,
    rhythmGameOpen: options.rhythmGameOpen,
    examineOpen: options.examineOpen,
    mode: options.mode,
    dispatchPanel: options.dispatchPanel,
    closePanel: options.closePanel,
    closeAllPanels: options.closeAllPanels,
    minigameSetters: options.minigameSetters,
    skipActiveCutscene: options.skipActiveCutscene,
    resetExamine: options.resetExamine,
    clearPendingTriggerZone: options.clearPendingTriggerZone,
  });

  useGamepadInput({
    virtualControlsRef: sharedVirtualControlsRef,
    panelStackLength: options.panelStackLength,
    dispatchPanel: options.dispatchPanel,
    closePanel: options.closePanel,
    skipActiveCutscene: options.skipActiveCutscene,
  });
}
