
import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus, bindEventBusScope } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import {
  CLOSED_MINIGAME_PANEL_STATE,
  type MinigamePanelSetters,
  type MinigamePanelState,
} from '@/shared/constants/minigames';
import type { TriggerZone } from '@/data/triggerZones';
import type { EnemyType, ExamineData } from '@/shared/types/game';
import { InteractionController } from '@/engine/interaction/InteractionController';
import {
  setExamineOverlayAssetGate,
  setStoryOverlayAssetGate,
} from '@/engine/assets/gltfPreloadOverlayGate';

export type ExamineUiState = {
  open: boolean;
  data: ExamineData | null;
  hasLinkedContent: boolean;
};

const CLOSED_EXAMINE_STATE: ExamineUiState = {
  open: false,
  data: null,
  hasLinkedContent: false,
};

export type ContainerLootUiState = {
  open: boolean;
  zoneId: string | null;
  contents: Array<{ itemId: string; quantity: number }>;
  lockedKeyId: string | undefined;
  lootedFlag: string | undefined;
};

const CLOSED_CONTAINER_STATE: ContainerLootUiState = {
  open: false,
  zoneId: null,
  contents: [],
  lockedKeyId: undefined,
  lootedFlag: undefined,
};

/**
 * Sub-orchestrator — UI state + EventBus wiring.
 * Domain logic lives in InteractionController.
 */
export function useInteractionOrchestrator(
  startCombatFromStory: (enemyType: EnemyType) => void,
) {
  const [minigameOpen, setMinigameOpen] = useState<MinigamePanelState>(CLOSED_MINIGAME_PANEL_STATE);
  const minigameSetters = useMemo<MinigamePanelSetters>(
    () => ({
      setCodebreakerOpen: (open) =>
        setMinigameOpen((state) => ({ ...state, codebreakerOpen: open })),
      setOpenstackTerminalOpen: (open) =>
        setMinigameOpen((state) => ({ ...state, openstackTerminalOpen: open })),
      setBashTerminalOpen: (open) =>
        setMinigameOpen((state) => ({ ...state, bashTerminalOpen: open })),
      setPoetryGameOpen: (open) =>
        setMinigameOpen((state) => ({ ...state, poetryGameOpen: open })),
      setHackingGameOpen: (open) =>
        setMinigameOpen((state) => ({ ...state, hackingGameOpen: open })),
      setMemoryGameOpen: (open) =>
        setMinigameOpen((state) => ({ ...state, memoryGameOpen: open })),
      setQuizGameOpen: (open) =>
        setMinigameOpen((state) => ({ ...state, quizGameOpen: open })),
      setRhythmGameOpen: (open) =>
        setMinigameOpen((state) => ({ ...state, rhythmGameOpen: open })),
    }),
    [],
  );

  const [examine, setExamine] = useState<ExamineUiState>(CLOSED_EXAMINE_STATE);
  const [containerLoot, setContainerLoot] = useState<ContainerLootUiState>(CLOSED_CONTAINER_STATE);

  useEffect(() => {
    setExamineOverlayAssetGate(examine.open);
    return () => setExamineOverlayAssetGate(false);
  }, [examine.open]);

  const setExamineOpen = useCallback((open: boolean) => {
    setExamine((state) => ({ ...state, open }));
  }, []);

  const setExamineData = useCallback((data: ExamineData | null) => {
    setExamine((state) => ({ ...state, data }));
  }, []);

  const setExamineHasLinkedContent = useCallback((hasLinkedContent: boolean) => {
    setExamine((state) => ({ ...state, hasLinkedContent }));
  }, []);

  const resetExamine = useCallback(() => {
    setExamine(CLOSED_EXAMINE_STATE);
  }, []);

  const dismissForNarrativeOverlay = useCallback(() => {
    setExamine(CLOSED_EXAMINE_STATE);
    setMinigameOpen(CLOSED_MINIGAME_PANEL_STATE);
    setContainerLoot(CLOSED_CONTAINER_STATE);
  }, []);

  const openContainerLoot = useCallback(
    (zone: TriggerZone) => {
      if (!zone.containerContents) return;
      setExamine(CLOSED_EXAMINE_STATE);
      setMinigameOpen(CLOSED_MINIGAME_PANEL_STATE);
      setContainerLoot({
        open: true,
        zoneId: zone.id,
        contents: [...zone.containerContents],
        lockedKeyId: zone.lockedKeyId,
        lootedFlag: zone.lootedFlag,
      });
    },
    [],
  );

  const closeContainerLoot = useCallback(() => {
    setContainerLoot(CLOSED_CONTAINER_STATE);
  }, []);

  const takeItemFromContainer = useCallback(
    (itemId: string, quantity: number) => {
      setContainerLoot((state) => {
        if (!state.open) return state;
        const updated = state.contents
          .map((entry) => {
            if (entry.itemId !== itemId) return entry;
            const remaining = Math.max(0, entry.quantity - quantity);
            return { ...entry, quantity: remaining };
          })
          .filter((entry) => entry.quantity > 0);
        return { ...state, contents: updated };
      });
    },
    [],
  );

  const pendingTriggerZoneRef = useRef<TriggerZone | null>(null);
  const controllerRef = useRef<InteractionController | null>(null);

  useEffect(() => {
    const controller = new InteractionController({
      startCombatFromStory,
      minigameSetters,
      ui: {
        setExamineOpen,
        setExamineData,
        setExamineHasLinkedContent,
      },
      getPendingTriggerZone: () => pendingTriggerZoneRef.current,
      setPendingTriggerZone: (zone) => {
        pendingTriggerZoneRef.current = zone;
      },
      openContainerLoot,
    });
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [startCombatFromStory, minigameSetters, setExamineOpen, setExamineData, setExamineHasLinkedContent, openContainerLoot]);

  useEffect(() => {
    return withHmrCleanup(
      bindEventBusScope(eventBus, (scope) => {
        scope.on('object:interact', ({ triggerZoneId }) => {
          controllerRef.current?.handleObjectInteract(triggerZoneId);
        });

        scope.on('npc:interact_staged', ({ npcId }) => {
          controllerRef.current?.handleNpcInteractStaged(npcId);
        });

        scope.on('minigame:open', ({ gameType }) => {
          controllerRef.current?.handleMinigameOpen(gameType);
        });

        scope.on('minigame:complete', ({ gameType }) => {
          controllerRef.current?.handleMinigameComplete(gameType);
        });

        scope.on('interaction:start', () => {
          controllerRef.current?.onInteractionStart();
        });

        scope.add(
          useGameStore.subscribe(
            (state) => ({
              showStoryOverlay: state.showStoryOverlay,
              diegeticNarrative: state.diegeticNarrative,
              currentNodeId: state.currentNodeId,
              mode: readGamePhase(state),
            }),
            (selected, prev) => {
              setStoryOverlayAssetGate(selected.showStoryOverlay);

              const controller = controllerRef.current;
              if (!controller || controller.isDisposed()) return;

              const anyOverlayOpen = selected.showStoryOverlay || !!selected.diegeticNarrative;
              const prevAnyOverlayOpen = prev.showStoryOverlay || !!prev.diegeticNarrative;

              const overlaySessionStarted =
                anyOverlayOpen &&
                (!prevAnyOverlayOpen || prev.currentNodeId !== selected.currentNodeId);

              if (overlaySessionStarted) {
                controller.onNarrativeOverlayOpened();
                return;
              }

              if (
                prevAnyOverlayOpen &&
                !anyOverlayOpen &&
                selected.mode === 'exploration'
              ) {
                controller.onNarrativeOverlayClosedInExploration();
              }
            },
            { equalityFn: shallow },
          ),
        );
      }),
    );
  }, []);

  const handleExamineContinue = useCallback(() => {
    controllerRef.current?.handleExamineContinue();
  }, []);

  const clearPendingTriggerZone = useCallback(() => {
    controllerRef.current?.clearPendingTriggerZone();
  }, []);

  return {
    minigameSetters,
    codebreakerOpen: minigameOpen.codebreakerOpen,
    setCodebreakerOpen: minigameSetters.setCodebreakerOpen,
    openstackTerminalOpen: minigameOpen.openstackTerminalOpen,
    setOpenstackTerminalOpen: minigameSetters.setOpenstackTerminalOpen,
    bashTerminalOpen: minigameOpen.bashTerminalOpen,
    setBashTerminalOpen: minigameSetters.setBashTerminalOpen,
    poetryGameOpen: minigameOpen.poetryGameOpen,
    setPoetryGameOpen: minigameSetters.setPoetryGameOpen,
    hackingGameOpen: minigameOpen.hackingGameOpen,
    setHackingGameOpen: minigameSetters.setHackingGameOpen,
    memoryGameOpen: minigameOpen.memoryGameOpen,
    setMemoryGameOpen: minigameSetters.setMemoryGameOpen,
    quizGameOpen: minigameOpen.quizGameOpen,
    setQuizGameOpen: minigameSetters.setQuizGameOpen,
    rhythmGameOpen: minigameOpen.rhythmGameOpen,
    setRhythmGameOpen: minigameSetters.setRhythmGameOpen,
    examineOpen: examine.open,
    setExamineOpen,
    examineData: examine.data,
    setExamineData,
    examineHasLinkedContent: examine.hasLinkedContent,
    setExamineHasLinkedContent,
    resetExamine,
    dismissForNarrativeOverlay,
    handleExamineContinue,
    clearPendingTriggerZone,
    containerLootOpen: containerLoot.open,
    containerLootContents: containerLoot.contents,
    containerLootZoneId: containerLoot.zoneId,
    containerLootLockedKeyId: containerLoot.lockedKeyId,
    containerLootLootedFlag: containerLoot.lootedFlag,
    openContainerLoot,
    closeContainerLoot,
    takeItemFromContainer,
  };
}
