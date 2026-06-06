
import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import {
  closeMinigame,
  isKnownMinigameId,
  openMinigame,
  type MinigamePanelSetters,
} from '@/shared/constants/minigames';
import { audioEngine } from '@/engine/AudioEngine';
import type { TriggerZone } from '@/data/triggerZones';
import {
  getStoryNodes,
  getDialogueNodes,
  getTriggerZones,
  findNpcById,
  getItemDefinition,
} from '@/data/gameDataLoader';
import { notifyItemReceived } from '@/components/game/LootNotification';
import { applyEffects } from '@/shared/utils/applyEffects';
import { requestSceneTransition, requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import type { EnemyType, SceneId } from '@/shared/types/game';
import { getInteractionState, isInteractionLocked } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';

/** Open exploration dialogue with scene sync and revisit skip (door fast-travel). */
function openLinkedDialogue(nodeId: string): void {
  const dlgNode = getDialogueNodes()[nodeId];
  if (!dlgNode) return;

  const store = useGameStore.getState();
  const alreadyVisited = store.playerState.visitedNodes.includes(nodeId);
  if (alreadyVisited && dlgNode.sceneId) {
    requestSceneTransition(dlgNode.sceneId as SceneId);
    return;
  }

  if (dlgNode.sceneId) {
    requestSceneTransitionForStoryNode(nodeId, dlgNode.sceneId);
  }
  openNarrativeOverlay(nodeId, 'dialogue');
}

/**
 * Sub-orchestrator that handles all interaction-related logic:
 * - E-key object interactions (trigger zones → examine + linked content)
 * - NPC staged interactions (dialogue/story)
 * - Mini-game open/close lifecycle
 * - Interaction:end emission when dialogue closes
 * - Loot notification logic (via unified applyEffects callback)
 * - Examine panel state management
 * - Mini-game panel state management
 */
export function useInteractionOrchestrator(
  startCombatFromStory: (enemyType: EnemyType) => void,
) {
  // ── Panel states ──
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
  // ── Pending trigger zone: stored when ExaminePanel is shown with linked content ──
  // When the user presses E or clicks "Continue" in ExaminePanel, this zone's
  // linked content (dialogue/story/minigame) will be triggered.
  const pendingTriggerZoneRef = useRef<TriggerZone | null>(null);
  // Guard: emit interaction:end at most once per overlay-close / interaction session
  const interactionEndEmittedRef = useRef(false);

  // ── Apply effects helper using unified applyEffects ──
  const applyInteractionEffects = useCallback((effects: import('@/shared/types/game').StoryEffect[]) => {
    applyEffects(effects, {
      onItemAdded: (itemId: string, _quantity: number) => {
        // Show loot notification
        const def = getItemDefinition(itemId);
        notifyItemReceived(def?.name ?? itemId, def?.rarity);
      },
      startCombat: startCombatFromStory,
    });
  }, [startCombatFromStory]);

  // ── EventBus subscriptions for interactions ──
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const scheduleTimer = (fn: () => void, ms: number) => {
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);
        fn();
      }, ms);
      pendingTimers.add(timer);
      return timer;
    };

    const cleanup = () => {
      try {
        for (const unsub of unsubs) {
          try {
            unsub();
          } catch (err) {
            console.error('[useInteractionOrchestrator] Unsubscribe error:', err);
          }
        }
      } finally {
        for (const timer of pendingTimers) {
          clearTimeout(timer);
        }
        pendingTimers.clear();
      }
    };

    try {
    // ── Handle E-key interaction from trigger zones ──
    unsubs.push(
      eventBus.on('object:interact', ({ triggerZoneId }) => {
        if (!triggerZoneId) return;

        const zone = getTriggerZones().find((z) => z.id === triggerZoneId);
        if (!zone) return;

        const store = useGameStore.getState();

        // Only interact in exploration mode
        if (store.mode !== 'exploration') return;

        // Act gating: skip interaction if player hasn't reached the required act
        if (zone.requiredAct && store.playerState.progression.currentAct < zone.requiredAct) {
          return;
        }

        // G8: Check if one-time trigger has already been used
        if (zone.isOneTime && store.interactiveObjectStates[triggerZoneId]) {
          return; // Already used — skip interaction
        }

        // Apply trigger-level effects
        if (zone.effects && zone.effects.length > 0) {
          applyInteractionEffects(zone.effects);
        }

        // Mark one-time trigger as used
        if (zone.isOneTime) {
          store.toggleInteractiveObject(triggerZoneId);
        }

        // Activate linked quest
        if (zone.linkedQuestId) {
          store.activateQuest(zone.linkedQuestId);
        }

        // ── Helper: trigger the linked content (dialogue/story/minigame) for a zone ──
        const triggerLinkedContent = (z: typeof zone) => {
          if (z.linkedMinigame) {
            eventBus.emit('minigame:open', { gameType: z.linkedMinigame });
            return;
          }

          const currentStore = useGameStore.getState();

          if (z.linkedStoryNodeId && getStoryNodes()[z.linkedStoryNodeId]) {
            const storyNode = getStoryNodes()[z.linkedStoryNodeId];
            const alreadyVisited = currentStore.playerState.visitedNodes.includes(z.linkedStoryNodeId);
            if (alreadyVisited && storyNode.sceneId) {
              requestSceneTransition(storyNode.sceneId as SceneId);
              return;
            }
            requestSceneTransitionForStoryNode(z.linkedStoryNodeId, storyNode.sceneId);
            openNarrativeOverlay(z.linkedStoryNodeId, 'story');
          } else if (z.linkedDialogueNodeId && getDialogueNodes()[z.linkedDialogueNodeId]) {
            openLinkedDialogue(z.linkedDialogueNodeId);
          }
        };

        // ── Show ExaminePanel, then wait for user to press "Continue" (G10 fix) ──
        const hasLinkedContent = !!(zone.linkedDialogueNodeId || zone.linkedStoryNodeId || zone.linkedMinigame);

        if (zone.examineData) {
          // Show ExaminePanel and wait for explicit user confirmation
          setExamineData(zone.examineData);
          setExamineOpen(true);
          setExamineHasLinkedContent(hasLinkedContent);
          audioEngine.playStinger('discovery');

          // G10 fix: Store the trigger zone so the "Continue" action can trigger
          // the linked content (dialogue/story/minigame) when the user presses E
          // or clicks the "Continue" button in ExaminePanel.
          if (hasLinkedContent) {
            pendingTriggerZoneRef.current = zone;
          } else {
            pendingTriggerZoneRef.current = null;
          }
        } else {
          // No examineData — trigger linked content immediately
          triggerLinkedContent(zone);
        }
      }),
    );

    // ── Handle staged NPC interaction ──
    unsubs.push(
      eventBus.on('npc:interact_staged', ({ npcId }) => {
        const store = useGameStore.getState();
        if (store.mode !== 'exploration') return;

        // Find NPC definition
        const npcDef = findNpcById(npcId);
        if (!npcDef) return;

        // Find trigger zone linked to this NPC
        const npcZone = getTriggerZones().find((z) => {
          // Check if the zone's dialogue/story links match this NPC
          if (z.linkedDialogueNodeId && npcDef.dialogueNodeId && z.linkedDialogueNodeId === npcDef.dialogueNodeId) {
            return true;
          }
          // Also match by NPC ID patterns in zone IDs
          const zoneBaseName = z.id.replace(/^(cafe|office|street|home|corridor|room|park|library|factory|rooftop)_/, '');
          return zoneBaseName.includes(npcId.replace('office_', ''));
        });

        // Apply trigger zone effects
        if (npcZone) {
          if (npcZone.effects && npcZone.effects.length > 0) {
            applyInteractionEffects(npcZone.effects);
          }
          if (npcZone.linkedQuestId) {
            store.activateQuest(npcZone.linkedQuestId);
          }
        }

        // Open dialogue or story for this NPC
        // ── World Director: stay in exploration, show narrative as overlay ──
        if (npcDef.dialogueNodeId && getDialogueNodes()[npcDef.dialogueNodeId]) {
          openNarrativeOverlay(npcDef.dialogueNodeId, 'dialogue');
        } else if (npcZone?.linkedDialogueNodeId && getDialogueNodes()[npcZone.linkedDialogueNodeId]) {
          openNarrativeOverlay(npcZone.linkedDialogueNodeId, 'dialogue');
        } else if (npcZone?.linkedStoryNodeId && getStoryNodes()[npcZone.linkedStoryNodeId]) {
          const storyNode = getStoryNodes()[npcZone.linkedStoryNodeId];
          requestSceneTransitionForStoryNode(npcZone.linkedStoryNodeId, storyNode.sceneId);
          openNarrativeOverlay(npcZone.linkedStoryNodeId, 'story');
        }

        // Emit npc:talked event
        eventBus.emit('npc:talked', { npcId, dialogueNodeId: npcDef.dialogueNodeId });
      }),
    );

    // ── Handle mini-game open/close events ──
    unsubs.push(
      eventBus.on('minigame:open', ({ gameType }) => {
        if (!isKnownMinigameId(gameType)) return;
        openMinigame(gameType, minigameSetters);
      }),
    );

    unsubs.push(
      eventBus.on('minigame:complete', ({ gameType }) => {
        // Auto-close mini-game after a brief delay so player sees the result
        scheduleTimer(() => {
          if (!isKnownMinigameId(gameType)) return;
          closeMinigame(gameType, minigameSetters);
        }, 2000);
      }),
    );

    const endInteraction = () => {
      if (interactionEndEmittedRef.current) return;
      const interactionState = getInteractionState();
      if (interactionState === InteractionState.Idle && !isInteractionLocked()) return;
      interactionEndEmittedRef.current = true;
      eventBus.emit('interaction:end', {});
    };

    // Reset guard when a new narrative session or NPC interaction begins
    unsubs.push(
      eventBus.on('interaction:start', () => {
        interactionEndEmittedRef.current = false;
      }),
    );

    // ── When narrative overlay closes, emit interaction:end ──
    // World Director: since we stay in exploration mode, we detect
    // narrative closing by watching showStoryOverlay instead of mode changes.
    unsubs.push(
      useGameStore.subscribe(
        (state) => ({
          showStoryOverlay: state.showStoryOverlay,
          mode: state.mode,
        }),
        (selected, prev) => {
          if (!prev.showStoryOverlay && selected.showStoryOverlay) {
            interactionEndEmittedRef.current = false;
            return;
          }

          // When showStoryOverlay transitions from true to false
          // AND we're in exploration mode, end the interaction (once)
          if (
            prev.showStoryOverlay &&
            !selected.showStoryOverlay &&
            selected.mode === 'exploration'
          ) {
            // Defer until overlay + node id are fully committed
            queueMicrotask(() => {
              endInteraction();
              if (isInteractionLocked()) {
                scheduleTimer(() => endInteraction(), 100);
              }
            });
          }
        },
        { equalityFn: shallow },
      ),
    );
    } catch (err) {
      cleanup();
      throw err;
    }

    return cleanup;
  }, [applyInteractionEffects, minigameSetters]);

  // ── Handle ExaminePanel "Continue" action ──
  // Triggers the linked content (dialogue/story/minigame) for the pending trigger zone,
  // then closes the ExaminePanel. Called when the user presses E or clicks "Continue"
  // while ExaminePanel is open with linked content.
  // Ref object is stable; [] deps is intentional — we read pendingTriggerZoneRef.current at invoke time.
  const handleExamineContinue = useCallback(() => {
    const zone = pendingTriggerZoneRef.current;
    if (!zone) return;

    // Close the ExaminePanel first
    setExamineOpen(false);
    setExamineData(null);
    setExamineHasLinkedContent(false);
    pendingTriggerZoneRef.current = null;

    // Trigger the linked content
    if (zone.linkedMinigame) {
      eventBus.emit('minigame:open', { gameType: zone.linkedMinigame });
      return;
    }

    const store = useGameStore.getState();
    // ── World Director: stay in exploration, show narrative as overlay ──
    // VN-skip: if the linked story node has already been visited and has a
    // sceneId, skip the VN overlay and just transition to the scene directly.
    // This prevents re-triggering the VN every time the player uses a door
    // they've already been through.
    if (zone.linkedStoryNodeId && getStoryNodes()[zone.linkedStoryNodeId]) {
      const storyNode = getStoryNodes()[zone.linkedStoryNodeId];
      const alreadyVisited = store.playerState.visitedNodes.includes(zone.linkedStoryNodeId);
      if (alreadyVisited && storyNode.sceneId) {
        requestSceneTransition(storyNode.sceneId as SceneId);
        return;
      }
      requestSceneTransitionForStoryNode(zone.linkedStoryNodeId, storyNode.sceneId);
      openNarrativeOverlay(zone.linkedStoryNodeId, 'story');
    } else if (zone.linkedDialogueNodeId && getDialogueNodes()[zone.linkedDialogueNodeId]) {
      openLinkedDialogue(zone.linkedDialogueNodeId);
    }
  }, []);

  // ── Clear pending trigger zone (called when ExaminePanel is closed without continuing) ──
  // Ref object is stable; [] deps is intentional — we write pendingTriggerZoneRef.current at invoke time.
  const clearPendingTriggerZone = useCallback(() => {
    pendingTriggerZoneRef.current = null;
  }, []);

  return {
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
