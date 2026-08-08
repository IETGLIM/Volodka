import { useEffect, useRef, type Dispatch } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from '@/engine/events';
import { photoModeActive } from '@/engine/photo/photoModeState';
import {
  applyEscapeDismissAction,
  resolveEscapeDismissAction,
} from '@/engine/input/escapeDismissAction';
import type { MinigamePanelSetters } from '@/shared/constants/minigames';
import type { PanelType } from './types';
import { blocksPanelShortcuts, type GamePhase } from '@/shared/gamePhase';

interface MinigameOpenFlags {
  codebreakerOpen: boolean;
  openstackTerminalOpen: boolean;
  bashTerminalOpen: boolean;
  poetryGameOpen: boolean;
  hackingGameOpen: boolean;
  memoryGameOpen: boolean;
  quizGameOpen: boolean;
  rhythmGameOpen: boolean;
}

export interface KeyboardShortcutManagerOptions extends MinigameOpenFlags {
  activePanel: PanelType;
  panelStackLength: number;
  examineOpen: boolean;
  mode: GamePhase;
  dispatchPanel: Dispatch<PanelType>;
  closePanel: () => void;
  closeAllPanels: () => void;
  minigameSetters: MinigamePanelSetters;
  skipActiveCutscene: () => boolean;
  resetExamine: () => void;
  clearPendingTriggerZone: () => void;
}

/** Global keydown handler — stable listener via refs, no dependency churn. */
export function useKeyboardShortcutManager({
  activePanel,
  panelStackLength,
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
  closePanel,
  closeAllPanels,
  minigameSetters,
  skipActiveCutscene,
  resetExamine,
  clearPendingTriggerZone,
}: KeyboardShortcutManagerOptions) {
  const panelStateRef = useRef({
    activePanel,
    panelStackLength,
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
  });
  const minigameSettersRef = useRef(minigameSetters);
  const skipCutsceneRef = useRef(skipActiveCutscene);
  const closePanelRef = useRef(closePanel);
  const closeAllPanelsRef = useRef(closeAllPanels);
  const dispatchPanelRef = useRef(dispatchPanel);

  useEffect(() => {
    panelStateRef.current = {
      activePanel,
      panelStackLength,
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
    };
    minigameSettersRef.current = minigameSetters;
    skipCutsceneRef.current = skipActiveCutscene;
    closePanelRef.current = closePanel;
    closeAllPanelsRef.current = closeAllPanels;
    dispatchPanelRef.current = dispatchPanel;
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const ps = panelStateRef.current;

      if (e.code === 'Escape') {
        if (skipCutsceneRef.current()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        // Photo mode is NOT part of the panel stack, so the escape-dismiss chain
        // below doesn't know about it. Without this guard, Escape falls through to
        // `toggle_pause_menu` and the player is stuck in photo mode with a pause
        // menu on top. Close photo mode first, before any other escape handling.
        if (photoModeActive.current) {
          e.preventDefault();
          e.stopImmediatePropagation();
          eventBus.emit(PHOTO_EVENTS.inactive, PHOTO_EMPTY_PAYLOAD);
          return;
        }

        const action = resolveEscapeDismissAction(ps);
        if (action.type === 'noop') return;

        e.preventDefault();
        e.stopImmediatePropagation();

        applyEscapeDismissAction(action, {
          resetExamine,
          clearPendingTriggerZone,
          minigameSetters: minigameSettersRef.current,
          minigameFlags: ps,
          closePanel: () => closePanelRef.current(),
          dispatchPanel: (panel) => dispatchPanelRef.current(panel),
        });
        return;
      }

      // Movement / look keys + Shift (run): 3D input owns these. Exit before the
      // panel switchboard so WASD/arrow/Shift bursts don't walk dozens of checks.
      // Shift+S still opens stats below.
      if (
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'Space' ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight' ||
        (e.code === 'KeyS' && !e.shiftKey)
      ) {
        return;
      }

      // Auto-repeat on letter keys shouldn't open panels / save.
      if (e.repeat) return;

      const panelShortcutsBlocked = blocksPanelShortcuts(ps.mode);

      if (panelShortcutsBlocked) return;

      if (e.code === 'KeyJ') {
        if (ps.activePanel !== 'journal') closeAllPanelsRef.current();
        dispatchPanel('journal');
      }
      if (e.code === 'KeyQ') dispatchPanel('quests');
      if (e.code === 'KeyI') {
        e.preventDefault();
        dispatchPanel('inventory');
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        dispatchPanel('worldMap');
      }
      // Poems are the game's core theme (the README documents P = Стихи).
      // P opens the poetry book; Shift+P toggles photo mode (secondary feature).
      if (e.code === 'KeyP' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        dispatchPanel('poetry');
      }
      if (e.code === 'KeyP' && e.shiftKey) {
        e.preventDefault();
        eventBus.emit(PHOTO_EVENTS.toggle, PHOTO_EMPTY_PAYLOAD);
      }
      if (e.code === 'KeyM') dispatchPanel('worldMap');
      if (e.code === 'KeyN') dispatchPanel('npcRelation');
      if (e.code === 'KeyC') dispatchPanel('characterProfile');
      if (e.code === 'KeyK') dispatchPanel('codex');
      if (e.code === 'KeyL') dispatchPanel('dialogueHistory');
      if (e.code === 'KeyH') dispatchPanel('achievements');
      if (e.code === 'KeyT' && !e.shiftKey) dispatchPanel('skillTree');
      if (e.code === 'KeyG') dispatchPanel('crafting');
      if (e.code === 'KeyF') dispatchPanel('fastTravel');
      if (e.code === 'KeyV') dispatchPanel('perks');
      if (e.code === 'KeyB') dispatchPanel('questBoard');
      if (e.code === 'KeyY') dispatchPanel('karmaPoem');
      if (e.code === 'KeyS' && e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        dispatchPanel('stats');
      }
      if (e.shiftKey && e.code === 'KeyT') {
        e.preventDefault();
        dispatchPanel('trading');
      }
      if (e.code === 'KeyR') {
        const store = useGameStore.getState();
        if (
          store.exploration.currentSceneId === 'volodka_room' ||
          store.exploration.currentSceneId === 'home_evening'
        ) {
          dispatchPanel('rest');
        }
      }
      if (e.code === 'F1' || (e.code === 'Slash' && e.shiftKey)) {
        e.preventDefault();
        dispatchPanel('shortcuts');
      }
      if (e.code === 'Slash' && !e.shiftKey) {
        e.preventDefault();
        dispatchPanel('shortcuts');
      }
      // Quick save — F5. Defer serialize/localStorage off the keydown critical path.
      if (e.code === 'F5') {
        e.preventDefault();
        queueMicrotask(() => {
          try {
            useGameStore.getState().saveGame({ source: 'manual' });
            void import('sonner').then(({ toast }) => {
              toast.success('Игра сохранена', {
                description: 'Прогресс записан (F5).',
                duration: 2500,
              });
            });
          } catch {
            /* store not ready — ignore */
          }
        });
      }
      // Quick load — F9. Defer deserialize/patch off the keydown critical path.
      if (e.code === 'F9') {
        e.preventDefault();
        queueMicrotask(() => {
          try {
            useGameStore.getState().loadGame();
            void import('sonner').then(({ toast }) => {
              toast.success('Игра загружена', {
                description: 'Последнее сохранение восстановлено (F9).',
                duration: 2500,
              });
            });
          } catch {
            /* store not ready — ignore */
          }
        });
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [
    dispatchPanel,
    closePanel,
    closeAllPanels,
    resetExamine,
    clearPendingTriggerZone,
  ]);
}
