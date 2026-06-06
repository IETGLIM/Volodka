import { useEffect, useRef, type Dispatch } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from '@/engine/events';
import {
  closeOpenMinigame,
  type MinigamePanelSetters,
} from '@/shared/constants/minigames';
import type { PanelType } from './types';

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
  mode: string;
  dispatchPanel: Dispatch<PanelType>;
  closePanel: () => void;
  closeAllPanels: () => void;
  minigameSetters: MinigamePanelSetters;
  skipActiveCutscene: () => boolean;
  setExamineOpen: (open: boolean) => void;
  setExamineData: (data: null) => void;
  setExamineHasLinkedContent: (has: boolean) => void;
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
  setExamineOpen,
  setExamineData,
  setExamineHasLinkedContent,
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
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const ps = panelStateRef.current;

      if (e.code === 'KeyJ') {
        const store = useGameStore.getState();
        if (!store.journalOpen) closeAllPanelsRef.current();
        store.toggleJournal();
      }
      if (e.code === 'KeyQ') dispatchPanel('quests');
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        dispatchPanel('inventory');
      }
      if (e.code === 'KeyP' && !e.ctrlKey && !e.shiftKey) {
        eventBus.emit(PHOTO_EVENTS.toggle, PHOTO_EMPTY_PAYLOAD);
      }
      if (e.code === 'KeyP' && e.shiftKey) {
        e.preventDefault();
        dispatchPanel('poetry');
      }
      if (e.code === 'KeyM') dispatchPanel('miniGameHub');
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
      if (e.code === 'Escape') {
        if (skipCutsceneRef.current()) return;

        const store = useGameStore.getState();
        if (ps.examineOpen) {
          setExamineOpen(false);
          setExamineData(null);
          setExamineHasLinkedContent(false);
          clearPendingTriggerZone();
          return;
        }
        if (closeOpenMinigame(ps, minigameSettersRef.current)) return;
        if (ps.panelStackLength > 0) {
          closePanelRef.current();
          return;
        }
        if (store.journalOpen) {
          store.setJournalOpen(false);
          return;
        }
        if (ps.mode === 'exploration') dispatchPanel('menu');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    dispatchPanel,
    closePanel,
    closeAllPanels,
    setExamineOpen,
    setExamineData,
    setExamineHasLinkedContent,
    clearPendingTriggerZone,
  ]);
}
