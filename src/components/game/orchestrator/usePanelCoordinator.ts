import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
} from 'react';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';
import { isPoemRevealBusy } from '@/engine/poemReveal/poemRevealOrchestrator';
import { abortPoemReadingIfPending } from '@/engine/poemReading/poemReadingOrchestrator';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { getActQuote } from '@/engine/GuidedStoryManager';
import { getQuoteByTrigger } from '@/data/matrixQuotes';
import {
  isQuestCompletionFlowBusy,
  shouldDeferQuestAcceptDialog,
  shouldFlushGatedFirstReadingCelebration,
  shouldGateFirstReadingCelebration,
  type QuestAcceptPayload,
} from '@/engine/quest/questAcceptDeferral';
import { emitFirstReadingCompletionFeedback } from '@/engine/quest/questCompletionFeedback';
import { usesCinematicQuestCelebration } from '@/engine/quest/questPresentation';
import {
  setFirstReadingCelebrationInterstitialActive,
  setMatrixQuoteInterstitialActive,
} from '@/engine/presentation/cinematicInterstitialPresentation';
import type {
  MatrixQuoteState,
  PanelType,
  QuestChainUnlockState,
  QuestDialogState,
} from './types';
import {
  getTopPanel,
  panelStackReducer,
  type NonNullPanelType,
  type PanelStackAction,
} from './panelStackReducer';
import { PANEL_IDS } from './types';

export interface UsePanelCoordinatorOptions {
  /** Called when a panel opens — closes examine UI in one setState. */
  onPanelOpened?: () => void;
}

export interface PanelCoordinatorResult {
  /** Top of the panel stack (focused panel). */
  activePanel: PanelType;
  /** Full open-panel stack (bottom → top) — single source of truth for open state. */
  panelStack: NonNullPanelType[];
  /** Toggle a panel on/off, or push if not open. Pass null to clear the stack. */
  dispatchPanel: Dispatch<PanelType>;
  /** Close the topmost panel (Escape / back). */
  closePanel: () => void;
  /** Remove a specific panel from the stack. */
  closePanelByType: (panel: NonNullPanelType) => void;
  closeAllPanels: () => void;
  questAccept: QuestDialogState;
  setQuestAccept: (value: QuestDialogState) => void;
  questComplete: QuestDialogState;
  setQuestComplete: (value: QuestDialogState) => void;
  /** Close quest-complete dialog and flush any queued accept dialog. */
  dismissQuestComplete: () => void;
  questChainUnlock: QuestChainUnlockState | null;
  setQuestChainUnlock: (value: QuestChainUnlockState | null) => void;
  matrixQuote: MatrixQuoteState;
  setMatrixQuote: (value: MatrixQuoteState) => void;
  /** Dismiss matrix quote; flushes deferred quest-complete dialog if queued. */
  dismissMatrixQuote: () => void;
  firstReadingCelebration: boolean;
  dismissFirstReadingCelebration: () => void;
  handleOpenQuests: () => void;
  handleOpenInventory: () => void;
  handleOpenPoetry: () => void;
  handleOpenPoetryBook: () => void;
  handleOpenJournal: () => void;
  handleToggleTutorials: () => void;
  handleOpenMenu: () => void;
}

/** Stacked panels + quest dialog state + overlay exclusivity. */
export function usePanelCoordinator({
  onPanelOpened,
}: UsePanelCoordinatorOptions = {}): PanelCoordinatorResult {
  const [panelStack, dispatchStack] = useReducer(panelStackReducer, [] as NonNullPanelType[]);
  const panelStackRef = useRef(panelStack);
  panelStackRef.current = panelStack;
  const prevPanelStackLengthRef = useRef(0);
  const activePanel = getTopPanel(panelStack);

  const [questAccept, setQuestAccept] = useState<QuestDialogState>(null);
  const [questComplete, setQuestComplete] = useState<QuestDialogState>(null);
  const [questChainUnlock, setQuestChainUnlock] = useState<QuestChainUnlockState | null>(null);
  const [matrixQuote, setMatrixQuote] = useState<MatrixQuoteState>(null);
  const [firstReadingCelebration, setFirstReadingCelebration] = useState(false);
  const pendingQuestCompleteRef = useRef<QuestDialogState>(null);
  const pendingQuestAcceptRef = useRef<QuestAcceptPayload | null>(null);
  const pendingQuestCompletionPresentationRef = useRef<QuestDialogState>(null);
  const pendingQuestChainUnlockRef = useRef<QuestChainUnlockState | null>(null);
  const matrixQuoteActiveRef = useRef(false);
  const questCompleteActiveRef = useRef(false);
  const firstReadingCelebrationActiveRef = useRef(false);
  const questChainUnlockTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    matrixQuoteActiveRef.current = matrixQuote !== null;
  }, [matrixQuote]);

  useEffect(() => {
    setMatrixQuoteInterstitialActive(matrixQuote !== null);
  }, [matrixQuote]);

  useEffect(() => {
    questCompleteActiveRef.current = questComplete !== null;
  }, [questComplete]);

  useEffect(() => {
    firstReadingCelebrationActiveRef.current = firstReadingCelebration;
  }, [firstReadingCelebration]);

  useEffect(() => {
    setFirstReadingCelebrationInterstitialActive(firstReadingCelebration);
  }, [firstReadingCelebration]);

  const isCompletionFlowBusy = useCallback((): boolean => {
    return isQuestCompletionFlowBusy({
      matrixQuoteActive: matrixQuoteActiveRef.current,
      questCompleteActive: questCompleteActiveRef.current,
      pendingQuestComplete: pendingQuestCompleteRef.current,
      cinematicCelebrationActive: firstReadingCelebrationActiveRef.current,
    });
  }, []);

  const flushPendingQuestChainUnlock = useCallback(() => {
    const chainUnlock = pendingQuestChainUnlockRef.current;
    if (!chainUnlock) return;
    pendingQuestChainUnlockRef.current = null;
    setQuestChainUnlock(chainUnlock);
    if (questChainUnlockTimeout.current) clearTimeout(questChainUnlockTimeout.current);
    questChainUnlockTimeout.current = setTimeout(() => {
      setQuestChainUnlock(null);
      questChainUnlockTimeout.current = undefined;
    }, 8000);
  }, []);

  const flushPendingQuestAccept = useCallback(() => {
    const pending = pendingQuestAcceptRef.current;
    if (!pending) return;
    if (isCompletionFlowBusy()) return;

    const sceneId = useGameStore.getState().exploration.currentSceneId;
    if (shouldDeferQuestAcceptDialog(pending.questId, sceneId)) return;

    pendingQuestAcceptRef.current = null;
    setQuestAccept(pending);
  }, [isCompletionFlowBusy]);

  const presentQuestCompleted = useCallback((data: NonNullable<QuestDialogState>) => {
    if (usesCinematicQuestCelebration(data.questId)) {
      setFirstReadingCelebration(true);
      return;
    }
    const quote = getQuoteByTrigger(data.questId);
    if (quote) {
      pendingQuestCompleteRef.current = data;
      setMatrixQuote({ text: quote.text, actNumber: quote.act });
      return;
    }
    setQuestComplete(data);
  }, []);

  const flushPendingQuestCompletionPresentation = useCallback(() => {
    const pending = pendingQuestCompletionPresentationRef.current;
    if (!pending) return;
    if (isCompletionFlowBusy()) return;
    // Wait for first-collect poem fragment reveal so celebration doesn't stack.
    if (isPoemRevealBusy()) return;

    const state = useGameStore.getState();
    if (
      shouldGateFirstReadingCelebration(pending.questId, state.exploration.currentSceneId) &&
      !shouldFlushGatedFirstReadingCelebration({
        sceneId: state.exploration.currentSceneId,
        showStoryOverlay: state.showStoryOverlay,
        currentNodeId: state.currentNodeId,
      })
    ) {
      return;
    }

    pendingQuestCompletionPresentationRef.current = null;
    presentQuestCompleted(pending);
    flushPendingQuestChainUnlock();
  }, [isCompletionFlowBusy, presentQuestCompleted, flushPendingQuestChainUnlock]);

  const queueOrShowQuestChainUnlock = useCallback((data: QuestChainUnlockState) => {
    if (pendingQuestCompletionPresentationRef.current) {
      pendingQuestChainUnlockRef.current = data;
      return;
    }
    setQuestChainUnlock(data);
    if (questChainUnlockTimeout.current) clearTimeout(questChainUnlockTimeout.current);
    questChainUnlockTimeout.current = setTimeout(() => {
      setQuestChainUnlock(null);
      questChainUnlockTimeout.current = undefined;
    }, 8000);
  }, []);

  const queueOrShowQuestAccept = useCallback(
    (payload: QuestAcceptPayload) => {
      const sceneId = useGameStore.getState().exploration.currentSceneId;
      if (shouldDeferQuestAcceptDialog(payload.questId, sceneId) || isCompletionFlowBusy()) {
        pendingQuestAcceptRef.current = payload;
        return;
      }
      setQuestAccept(payload);
    },
    [isCompletionFlowBusy],
  );

  const dismissMatrixQuote = useCallback(() => {
    setMatrixQuote(null);
    const pending = pendingQuestCompleteRef.current;
    if (pending) {
      pendingQuestCompleteRef.current = null;
      setQuestComplete(pending);
      return;
    }
    flushPendingQuestAccept();
  }, [flushPendingQuestAccept]);

  const dismissQuestComplete = useCallback(() => {
    const completed = questComplete;
    setQuestComplete(null);
    if (completed?.questId === 'first_reading') {
      emitFirstReadingCompletionFeedback();
    }
    flushPendingQuestAccept();
    flushPendingQuestChainUnlock();
  }, [questComplete, flushPendingQuestAccept, flushPendingQuestChainUnlock]);

  const dismissFirstReadingCelebration = useCallback(() => {
    setFirstReadingCelebration(false);
    emitFirstReadingCompletionFeedback();
    flushPendingQuestAccept();
    flushPendingQuestChainUnlock();
  }, [flushPendingQuestAccept, flushPendingQuestChainUnlock]);

  const queueOrShowQuestAcceptRef = useRef(queueOrShowQuestAccept);
  const presentQuestCompletedRef = useRef(presentQuestCompleted);
  const queueOrShowQuestChainUnlockRef = useRef(queueOrShowQuestChainUnlock);
  const flushPendingQuestCompletionPresentationRef = useRef(flushPendingQuestCompletionPresentation);

  queueOrShowQuestAcceptRef.current = queueOrShowQuestAccept;
  presentQuestCompletedRef.current = presentQuestCompleted;
  queueOrShowQuestChainUnlockRef.current = queueOrShowQuestChainUnlock;
  flushPendingQuestCompletionPresentationRef.current = flushPendingQuestCompletionPresentation;

  useEffect(() => {
    const scope = eventBus.createScope();

    scope.on('story:quest_available', (data) => {
      const phase = readGamePhase(useGameStore.getState());
      if (phase === 'intro' || phase === 'menu') return;
      queueOrShowQuestAcceptRef.current({ questId: data.questId, npcId: data.npcId });
    });
    scope.on('quest:completed', (data) => {
      const payload: NonNullable<QuestDialogState> = {
        questId: data.questId,
        npcId: data.npcId,
      };
      const sceneId = useGameStore.getState().exploration.currentSceneId;
      if (shouldGateFirstReadingCelebration(data.questId, sceneId)) {
        pendingQuestCompletionPresentationRef.current = payload;
        flushPendingQuestCompletionPresentationRef.current();
        return;
      }
      presentQuestCompletedRef.current(payload);
    });
    scope.on('story:quest_chain_unlock', (data) => {
      queueOrShowQuestChainUnlockRef.current({
        nextQuestTitle: data.nextQuestTitle,
        nextQuestType: data.nextQuestType,
        completedQuestTitle: data.completedQuestTitle,
        npcId: data.npcId,
        actNumber: data.actNumber,
      });
    });
    scope.on('story:act_transition', (data) => {
      const quote = getActQuote(data.toAct);
      setMatrixQuote({
        text: quote ?? '',
        actNumber: data.toAct,
        chapterTitle: data.chapterTitle,
      });
    });

    scope.on('ui:open_panel', (payload) => {
      const phase = readGamePhase(useGameStore.getState());
      if (phase === 'intro' || phase === 'menu') return;
      if (!(PANEL_IDS as readonly string[]).includes(payload.panel)) return;
      const panel = payload.panel as NonNullPanelType;
      dispatchStack({ type: 'ensureOpen', panel });
      if (payload.loreId) {
        eventBus.emit('codex:select_entry', { loreId: payload.loreId });
      }
      if (payload.questId) {
        eventBus.emit('quests:select_quest', { questId: payload.questId });
      }
      if (payload.sceneId && panel === 'worldMap') {
        eventBus.emit('worldmap:focus_scene', { sceneId: payload.sceneId });
      }
    });

    return withHmrCleanup(() => {
      scope.dispose();
      if (questChainUnlockTimeout.current) {
        clearTimeout(questChainUnlockTimeout.current);
        questChainUnlockTimeout.current = undefined;
      }
    });
  }, []);

  const flushPendingQuestAcceptRef = useRef(flushPendingQuestAccept);
  const flushPendingQuestCompletionPresentationStableRef = useRef(flushPendingQuestCompletionPresentation);
  flushPendingQuestAcceptRef.current = flushPendingQuestAccept;
  flushPendingQuestCompletionPresentationStableRef.current = flushPendingQuestCompletionPresentation;

  useEffect(() => {
    return useGameStore.subscribe((state, prevState) => {
      if (prevState.showStoryOverlay && !state.showStoryOverlay) {
        flushPendingQuestCompletionPresentationStableRef.current();
      }

      if (prevState.exploration.currentSceneId !== state.exploration.currentSceneId) {
        flushPendingQuestAcceptRef.current();
        if (state.exploration.currentSceneId !== 'volodka_room') {
          flushPendingQuestCompletionPresentationStableRef.current();
        }
      }
    });
  }, []);

  useEffect(() => {
    return eventBus.on('poem:discovery_reveal_end', () => {
      flushPendingQuestCompletionPresentationStableRef.current();
    });
  }, []);

  const dispatchStackAction = useCallback((action: PanelStackAction) => {
    dispatchStack(action);
  }, []);

  const dispatchPanel = useCallback((panel: PanelType) => {
    if (panel === null) {
      dispatchStackAction({ type: 'clear' });
      return;
    }
    dispatchStackAction({ type: 'toggle', panel });
  }, [dispatchStackAction]);

  const closeAllPanels = useCallback(() => {
    abortPoemReadingIfPending();
    dispatchStackAction({ type: 'clear' });
  }, [dispatchStackAction]);

  const closePanel = useCallback(() => {
    dispatchStackAction({ type: 'pop' });
  }, [dispatchStackAction]);

  const closePanelByType = useCallback(
    (panel: NonNullPanelType) => {
      dispatchStackAction({ type: 'remove', panel });
    },
    [dispatchStackAction],
  );

  useEffect(() => {
    return useGameStore.subscribe((state, prevState) => {
      if (!prevState.combatActive && state.combatActive) {
        abortPoemReadingIfPending();
        dispatchStackAction({ type: 'clear' });
      }
    });
  }, [dispatchStackAction]);

  useEffect(() => {
    if (panelStack.length > prevPanelStackLengthRef.current) {
      onPanelOpened?.();
    }
    prevPanelStackLengthRef.current = panelStack.length;
  }, [panelStack.length, onPanelOpened]);

  useEffect(() => {
    const journalInStack = panelStack.includes('journal');
    const store = useGameStore.getState();
    if (journalInStack !== store.journalOpen) {
      store.setJournalOpen(journalInStack);
    }
  }, [panelStack]);

  const closeJournalIfOpen = useCallback(() => {
    if (panelStackRef.current.includes('journal')) {
      dispatchStackAction({ type: 'remove', panel: 'journal' });
    }
  }, [dispatchStackAction]);

  const handleOpenQuests = useCallback(() => {
    closeJournalIfOpen();
    dispatchStackAction({ type: 'toggle', panel: 'quests' });
  }, [closeJournalIfOpen, dispatchStackAction]);

  const handleOpenInventory = useCallback(() => {
    closeJournalIfOpen();
    dispatchStackAction({ type: 'toggle', panel: 'inventory' });
  }, [closeJournalIfOpen, dispatchStackAction]);

  const handleOpenPoetry = useCallback(() => {
    closeJournalIfOpen();
    dispatchStackAction({ type: 'toggle', panel: 'poetry' });
  }, [closeJournalIfOpen, dispatchStackAction]);

  const handleOpenPoetryBook = useCallback(() => {
    closeJournalIfOpen();
    dispatchStackAction({ type: 'toggle', panel: 'poetry' });
  }, [closeJournalIfOpen, dispatchStackAction]);

  const handleOpenJournal = useCallback(() => {
    dispatchStackAction({ type: 'toggle', panel: 'journal' });
  }, [dispatchStackAction]);

  const handleToggleTutorials = useCallback(() => {
    const store = useGameStore.getState();
    store.setFlag('tutorialsDisabled', !store.tutorialFlags.tutorialsDisabled);
  }, []);

  const handleOpenMenu = useCallback(() => {
    dispatchStackAction({ type: 'toggle', panel: 'menu' });
  }, [dispatchStackAction]);

  return {
    activePanel,
    panelStack,
    dispatchPanel,
    closePanel,
    closePanelByType,
    closeAllPanels,
    questAccept,
    setQuestAccept,
    questComplete,
    setQuestComplete,
    dismissQuestComplete,
    questChainUnlock,
    setQuestChainUnlock,
    matrixQuote,
    setMatrixQuote,
    dismissMatrixQuote,
    firstReadingCelebration,
    dismissFirstReadingCelebration,
    handleOpenQuests,
    handleOpenInventory,
    handleOpenPoetry,
    handleOpenPoetryBook,
    handleOpenJournal,
    handleToggleTutorials,
    handleOpenMenu,
  };
}
