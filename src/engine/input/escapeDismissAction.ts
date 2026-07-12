import type { GamePhase } from '@/shared/gamePhase';
import { closeOpenMinigame, type MinigamePanelSetters } from '@/shared/constants/minigames';

export type EscapeDismissAction =
  | { type: 'close_examine' }
  | { type: 'close_minigame' }
  | { type: 'pop_panel' }
  | { type: 'toggle_pause_menu' }
  | { type: 'noop' };

export interface EscapeDismissMinigameFlags {
  codebreakerOpen: boolean;
  openstackTerminalOpen: boolean;
  bashTerminalOpen: boolean;
  poetryGameOpen: boolean;
  hackingGameOpen: boolean;
  memoryGameOpen: boolean;
  quizGameOpen: boolean;
  rhythmGameOpen: boolean;
}

export interface EscapeDismissContext extends EscapeDismissMinigameFlags {
  mode: GamePhase;
  panelStackLength: number;
  examineOpen: boolean;
}

/**
 * Single priority chain for Escape — used by useKeyboardShortcutManager (capture phase).
 * Cutscene skip is handled separately via skipActiveCutscene before this resolver runs.
 */
export function resolveEscapeDismissAction(ctx: EscapeDismissContext): EscapeDismissAction {
  if (ctx.examineOpen) return { type: 'close_examine' };
  if (hasOpenMinigame(ctx)) return { type: 'close_minigame' };
  if (ctx.panelStackLength > 0) return { type: 'pop_panel' };
  if (ctx.mode === 'exploration') return { type: 'toggle_pause_menu' };
  return { type: 'noop' };
}

export function hasOpenMinigame(flags: EscapeDismissMinigameFlags): boolean {
  return (
    flags.codebreakerOpen
    || flags.openstackTerminalOpen
    || flags.bashTerminalOpen
    || flags.poetryGameOpen
    || flags.hackingGameOpen
    || flags.memoryGameOpen
    || flags.quizGameOpen
    || flags.rhythmGameOpen
  );
}

export function applyEscapeDismissAction(
  action: EscapeDismissAction,
  handlers: {
    resetExamine: () => void;
    clearPendingTriggerZone: () => void;
    minigameSetters: MinigamePanelSetters;
    minigameFlags: EscapeDismissMinigameFlags;
    closePanel: () => void;
    dispatchPanel: (panel: 'menu') => void;
  },
): void {
  switch (action.type) {
    case 'close_examine':
      handlers.resetExamine();
      handlers.clearPendingTriggerZone();
      break;
    case 'close_minigame':
      closeOpenMinigame(handlers.minigameFlags, handlers.minigameSetters);
      break;
    case 'pop_panel':
      handlers.closePanel();
      break;
    case 'toggle_pause_menu':
      handlers.dispatchPanel('menu');
      break;
    case 'noop':
      break;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
