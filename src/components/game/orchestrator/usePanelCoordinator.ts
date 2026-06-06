import {
  useCallback,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
} from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
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

function panelReducer(prev: PanelType, next: PanelType): PanelType {
  return prev === next ? null : next;
}

function derivePanelFlags(activePanel: PanelType): PanelFlags {
  return {
    questsOpen: activePanel === 'quests',
    inventoryOpen: activePanel === 'inventory',
    poetryOpen: activePanel === 'poetry',
    menuOpen: activePanel === 'menu',
    restOpen: activePanel === 'rest',
    shortcutsOpen: activePanel === 'shortcuts',
    settingsOpen: activePanel === 'settings',
    saveSlotOpen: activePanel === 'saveSlot',
    miniGameHubOpen: activePanel === 'miniGameHub',
    npcRelationOpen: activePanel === 'npcRelation',
    characterProfileOpen: activePanel === 'characterProfile',
    codexOpen: activePanel === 'codex',
    dialogueHistoryOpen: activePanel === 'dialogueHistory',
    achievementsOpen: activePanel === 'achievements',
    skillTreeOpen: activePanel === 'skillTree',
    craftingOpen: activePanel === 'crafting',
    tradingOpen: activePanel === 'trading',
    fastTravelOpen: activePanel === 'fastTravel',
    perksOpen: activePanel === 'perks',
    questBoardOpen: activePanel === 'questBoard',
    statsOpen: activePanel === 'stats',
    karmaPoemOpen: activePanel === 'karmaPoem',
  };
}

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
  activePanel: PanelType;
  dispatchPanel: Dispatch<PanelType>;
  closePanel: () => void;
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
  handleToggleTutorials: () => void;
  handleOpenMenu: () => void;
}

/** Single panel at a time + quest dialog state + overlay exclusivity. */
export function usePanelCoordinator({
  isOverlayActive,
  minigameSetters,
  setExamineOpen,
  setExamineData,
  setExamineHasLinkedContent,
}: UsePanelCoordinatorOptions): PanelCoordinatorResult {
  const [activePanel, dispatchPanel] = useReducer(panelReducer, null as PanelType);
  const panelFlags = derivePanelFlags(activePanel);

  const [questAcceptId, setQuestAcceptId] = useState<string | null>(null);
  const [questAcceptNpcId, setQuestAcceptNpcId] = useState<string | undefined>(undefined);
  const [questCompleteId, setQuestCompleteId] = useState<string | null>(null);
  const [questCompleteNpcId, setQuestCompleteNpcId] = useState<string | undefined>(undefined);
  const [questChainUnlock, setQuestChainUnlock] = useState<QuestChainUnlockState | null>(null);
  const [matrixQuote, setMatrixQuote] = useState<MatrixQuoteState>(null);

  useEffect(() => {
    const unsubAvailable = eventBus.on('story:quest_available', (data) => {
      setQuestAcceptId(data.questId);
      setQuestAcceptNpcId(data.npcId);
    });
    const unsubComplete = eventBus.on('quest:completed', (data) => {
      setQuestCompleteId(data.questId);
      setQuestCompleteNpcId(data.npcId);
    });
    const unsubChainUnlock = eventBus.on('story:quest_chain_unlock', (data) => {
      setQuestChainUnlock({
        nextQuestTitle: data.nextQuestTitle,
        nextQuestType: data.nextQuestType,
        completedQuestTitle: data.completedQuestTitle,
        npcId: data.npcId,
        actNumber: data.actNumber,
      });
      setTimeout(() => setQuestChainUnlock(null), 8000);
    });
    return () => {
      unsubAvailable();
      unsubComplete();
      unsubChainUnlock();
    };
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('story:act_transition', (data) => {
      const quote = getActQuote(data.toAct);
      if (quote) {
        setMatrixQuote({ text: quote, actNumber: data.toAct });
      }
    });
    return unsub;
  }, []);

  const closeAllPanels = useCallback(() => {
    dispatchPanel(null);
    useGameStore.getState().setJournalOpen(false);
  }, []);

  const closePanel = useCallback(() => dispatchPanel(null), []);

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
    if (activePanel !== null || useGameStore.getState().journalOpen) {
      setExamineOpen(false);
      setExamineData(null);
      setExamineHasLinkedContent(false);
    }
  }, [activePanel, setExamineOpen, setExamineData, setExamineHasLinkedContent]);

  const handleOpenQuests = useCallback(() => {
    dispatchPanel('quests');
    useGameStore.getState().setJournalOpen(false);
  }, []);

  const handleOpenInventory = useCallback(() => {
    dispatchPanel('inventory');
    useGameStore.getState().setJournalOpen(false);
  }, []);

  const handleOpenPoetry = useCallback(() => {
    dispatchPanel('poetry');
    useGameStore.getState().setJournalOpen(false);
  }, []);

  const handleOpenPoetryBook = useCallback(() => {
    dispatchPanel('poetry');
    useGameStore.getState().setJournalOpen(false);
  }, []);

  const handleToggleTutorials = useCallback(() => {
    const store = useGameStore.getState();
    store.setFlag('tutorialsDisabled', !store.tutorialFlags.tutorialsDisabled);
  }, []);

  const handleOpenMenu = useCallback(() => dispatchPanel('menu'), []);

  return {
    activePanel,
    dispatchPanel,
    closePanel,
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
    handleToggleTutorials,
    handleOpenMenu,
  };
}
