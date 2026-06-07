import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
} from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { getActQuote } from '@/engine/GuidedStoryManager';
import {
  closeAllMinigames,
  type MinigamePanelSetters,
} from '@/shared/constants/minigames';
import type {
  MatrixQuoteState,
  PanelFlags,
  PanelType,
  QuestChainUnlockState,
} from './types';
import {
  derivePanelFlags,
  getTopPanel,
  panelStackReducer,
  type NonNullPanelType,
  type PanelStackAction,
} from './panelStackReducer';

export interface PanelCoordinatorOverlayHandlers {
  setExamineOpen: (open: boolean) => void;
  setExamineData: (data: null) => void;
  setExamineHasLinkedContent: (has: boolean) => void;
}

export interface UsePanelCoordinatorOptions extends PanelCoordinatorOverlayHandlers {
  isOverlayActive: boolean;
  minigameSetters: MinigamePanelSetters;
}

export interface PanelCoordinatorResult extends PanelFlags {
  /** Top of the panel stack (focused panel). */
  activePanel: PanelType;
  /** Full open-panel stack (bottom → top). */
  panelStack: NonNullPanelType[];
  /** Toggle a panel on/off, or push if not open. Pass null to clear the stack. */
  dispatchPanel: Dispatch<PanelType>;
  /** Close the topmost panel (Escape / back). */
  closePanel: () => void;
  /** Remove a specific panel from the stack. */
  closePanelByType: (panel: NonNullPanelType) => void;
  closeAllPanels: () => void;
  questAcceptId: string | null;
  questAcceptNpcId: string | undefined;
  setQuestAcceptId: (id: string | null) => void;
  setQuestAcceptNpcId: (id: string | undefined) => void;
  questCompleteId: string | null;
  questCompleteNpcId: string | undefined;
  setQuestCompleteId: (id: string | null) => void;
  setQuestCompleteNpcId: (id: string | undefined) => void;
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
  isOverlayActive,
  minigameSetters,
  setExamineOpen,
  setExamineData,
  setExamineHasLinkedContent,
}: UsePanelCoordinatorOptions): PanelCoordinatorResult {
  const [panelStack, dispatchStack] = useReducer(panelStackReducer, [] as NonNullPanelType[]);
  const activePanel = getTopPanel(panelStack);
  const panelFlags = derivePanelFlags(panelStack);

  const [questAcceptId, setQuestAcceptId] = useState<string | null>(null);
  const [questAcceptNpcId, setQuestAcceptNpcId] = useState<string | undefined>(undefined);
  const [questCompleteId, setQuestCompleteId] = useState<string | null>(null);
  const [questCompleteNpcId, setQuestCompleteNpcId] = useState<string | undefined>(undefined);
  const [questChainUnlock, setQuestChainUnlock] = useState<QuestChainUnlockState | null>(null);
  const [matrixQuote, setMatrixQuote] = useState<MatrixQuoteState>(null);
  const questChainUnlockTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const scope = eventBus.createScope();

    scope.on('story:quest_available', (data) => {
      setQuestAcceptId(data.questId);
      setQuestAcceptNpcId(data.npcId);
    });
    scope.on('quest:completed', (data) => {
      setQuestCompleteId(data.questId);
      setQuestCompleteNpcId(data.npcId);
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
    const journalInStack = panelStack.includes('journal');
    const storeOpen = useGameStore.getState().journalOpen;
    if (journalInStack !== storeOpen) {
      useGameStore.getState().setJournalOpen(journalInStack);
    }
  }, [panelStack]);

  useEffect(() => {
    if (isOverlayActive) {
      setExamineOpen(false);
      setExamineData(null);
      setExamineHasLinkedContent(false);
      closeAllMinigames(minigameSetters);
      closeAllPanels();
    }
  }, [isOverlayActive, closeAllPanels, minigameSetters, setExamineOpen, setExamineData, setExamineHasLinkedContent]);

  useEffect(() => {
    if (panelStack.length > 0) {
      setExamineOpen(false);
      setExamineData(null);
      setExamineHasLinkedContent(false);
    }
  }, [panelStack.length, setExamineOpen, setExamineData, setExamineHasLinkedContent]);

  const closeJournalIfOpen = useCallback(() => {
    if (panelStack.includes('journal')) {
      dispatchStackAction({ type: 'remove', panel: 'journal' });
    }
  }, [panelStack, dispatchStackAction]);

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
    ...panelFlags,
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
    handleOpenJournal,
    handleToggleTutorials,
    handleOpenMenu,
  };
}
