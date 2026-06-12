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
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { getActQuote } from '@/engine/GuidedStoryManager';
import { getQuoteByTrigger } from '@/data/matrixQuotes';
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
  questChainUnlock: QuestChainUnlockState | null;
  setQuestChainUnlock: (value: QuestChainUnlockState | null) => void;
  matrixQuote: MatrixQuoteState;
  setMatrixQuote: (value: MatrixQuoteState) => void;
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
  const activePanel = getTopPanel(panelStack);

  const [questAccept, setQuestAccept] = useState<QuestDialogState>(null);
  const [questComplete, setQuestComplete] = useState<QuestDialogState>(null);
  const [questChainUnlock, setQuestChainUnlock] = useState<QuestChainUnlockState | null>(null);
  const [matrixQuote, setMatrixQuote] = useState<MatrixQuoteState>(null);
  const questChainUnlockTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const scope = eventBus.createScope();

    scope.on('story:quest_available', (data) => {
      const phase = readGamePhase(useGameStore.getState());
      if (phase === 'intro' || phase === 'menu') return;
      setQuestAccept({ questId: data.questId, npcId: data.npcId });
    });
    scope.on('quest:completed', (data) => {
      const quote = getQuoteByTrigger(data.questId);
      if (quote) {
        setMatrixQuote({ text: quote.text, actNumber: quote.act });
      }
      setQuestComplete({ questId: data.questId, npcId: data.npcId });
    });
    scope.on('story:quest_chain_unlock', (data) => {
      setQuestChainUnlock({
        nextQuestTitle: data.nextQuestTitle,
        nextQuestType: data.nextQuestType,
        completedQuestTitle: data.completedQuestTitle,
        npcId: data.npcId,
        actNumber: data.actNumber,
      });
      if (questChainUnlockTimeout.current) clearTimeout(questChainUnlockTimeout.current);
      questChainUnlockTimeout.current = setTimeout(() => {
        setQuestChainUnlock(null);
        questChainUnlockTimeout.current = undefined;
      }, 8000);
    });
    scope.on('story:act_transition', (data) => {
      const quote = getActQuote(data.toAct);
      if (quote) {
        setMatrixQuote({ text: quote, actNumber: data.toAct });
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
    if (panelStack.length === 0) return;
    onPanelOpened?.();
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
    questChainUnlock,
    setQuestChainUnlock,
    matrixQuote,
    setMatrixQuote,
    handleOpenQuests,
    handleOpenInventory,
    handleOpenPoetry,
    handleOpenPoetryBook,
    handleOpenJournal,
    handleToggleTutorials,
    handleOpenMenu,
  };
}
