
import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus, bindEventBusScope } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import type { MinigamePanelSetters } from '@/shared/constants/minigames';
import type { TriggerZone } from '@/data/triggerZones';
import type { EnemyType } from '@/shared/types/game';
import { InteractionController } from '@/engine/interaction/InteractionController';

/**
 * Sub-orchestrator — UI state + EventBus wiring.
 * Domain logic lives in InteractionController.
 */
export function useInteractionOrchestrator(
  startCombatFromStory: (enemyType: EnemyType) => void,
) {
  const [codebreakerOpen, setCodebreakerOpen] = useState(false);
  const [openstackTerminalOpen, setOpenstackTerminalOpen] = useState(false);
  const [bashTerminalOpen, setBashTerminalOpen] = useState(false);
  const [poetryGameOpen, setPoetryGameOpen] = useState(false);
  const [hackingGameOpen, setHackingGameOpen] = useState(false);
  const [memoryGameOpen, setMemoryGameOpen] = useState(false);
  const [quizGameOpen, setQuizGameOpen] = useState(false);
  const [rhythmGameOpen, setRhythmGameOpen] = useState(false);
  const minigameSetters = useMemo<MinigamePanelSetters>(
    () => ({
      setCodebreakerOpen,
      setOpenstackTerminalOpen,
      setBashTerminalOpen,
      setPoetryGameOpen,
      setHackingGameOpen,
      setMemoryGameOpen,
      setQuizGameOpen,
      setRhythmGameOpen,
    }),
    [],
  );
  const [examineOpen, setExamineOpen] = useState(false);
  const [examineData, setExamineData] = useState<import('@/shared/types/game').ExamineData | null>(null);
  const [examineHasLinkedContent, setExamineHasLinkedContent] = useState(false);
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
    });
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [startCombatFromStory, minigameSetters]);

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
              mode: readGamePhase(state),
            }),
            (selected, prev) => {
              const controller = controllerRef.current;
              if (!controller || controller.isDisposed()) return;

              if (!prev.showStoryOverlay && selected.showStoryOverlay) {
                controller.onNarrativeOverlayOpened();
                return;
              }

              if (
                prev.showStoryOverlay &&
                !selected.showStoryOverlay &&
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
    codebreakerOpen,
    setCodebreakerOpen,
    openstackTerminalOpen,
    setOpenstackTerminalOpen,
    bashTerminalOpen,
    setBashTerminalOpen,
    poetryGameOpen,
    setPoetryGameOpen,
    hackingGameOpen,
    setHackingGameOpen,
    memoryGameOpen,
    setMemoryGameOpen,
    quizGameOpen,
    setQuizGameOpen,
    rhythmGameOpen,
    setRhythmGameOpen,
    examineOpen,
    setExamineOpen,
    examineData,
    setExamineData,
    examineHasLinkedContent,
    setExamineHasLinkedContent,
    handleExamineContinue,
    clearPendingTriggerZone,
  };
}
