'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { STORY_NODES } from '@/data/storyNodes';
import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { getItemDefinition } from '@/data/items';
import { notifyItemReceived } from '@/components/game/LootNotification';
import { applyEffects } from '@/shared/utils/applyEffects';
import type { EnemyType } from '@/shared/types/game';
import { getInteractionState, isInteractionLocked } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';

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
  const [examineOpen, setExamineOpen] = useState(false);
  const [examineData, setExamineData] = useState<import('@/shared/types/game').ExamineData | null>(null);
  const [examineHasLinkedContent, setExamineHasLinkedContent] = useState(false);
  // ── Pending trigger zone: stored when ExaminePanel is shown with linked content ──
  // When the user presses E or clicks "Continue" in ExaminePanel, this zone's
  // linked content (dialogue/story/minigame) will be triggered.
  const pendingTriggerZoneRef = useRef<typeof TRIGGER_ZONES[number] | null>(null);

  // ── Stable callback ref for applyEffects callbacks ──
  const startCombatRef = useRef(startCombatFromStory);
  useEffect(() => {
    startCombatRef.current = startCombatFromStory;
  }, [startCombatFromStory]);

  // ── Apply effects helper using unified applyEffects ──
  const applyInteractionEffects = useCallback((effects: import('@/shared/types/game').StoryEffect[]) => {
    applyEffects(effects, {
      onItemAdded: (itemId: string, _quantity: number) => {
        // Show loot notification
        const def = getItemDefinition(itemId);
        notifyItemReceived(def?.name ?? itemId, def?.rarity);
      },
      startCombat: (enemyType: EnemyType) => {
        startCombatRef.current(enemyType);
      },
    });
  }, []);

  // ── EventBus subscriptions for interactions ──
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // ── Handle E-key interaction from trigger zones ──
    unsubs.push(
      eventBus.on('object:interact', ({ triggerZoneId }) => {
        if (!triggerZoneId) return;

        const zone = TRIGGER_ZONES.find((z) => z.id === triggerZoneId);
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
          // G7: Declarative mini-game dispatch — replaces hardcoded ID checks
          if (z.linkedMinigame) {
            eventBus.emit('minigame:open', { gameType: z.linkedMinigame });
            return;
          }

          // Priority: dialogue > story (dialogue is more specific)
          const currentStore = useGameStore.getState();
          if (z.linkedDialogueNodeId && DIALOGUE_NODES[z.linkedDialogueNodeId]) {
            currentStore.setMode('visual-novel');
            currentStore.setCurrentNodeId(z.linkedDialogueNodeId);
          } else if (z.linkedStoryNodeId && STORY_NODES[z.linkedStoryNodeId]) {
            currentStore.setMode('visual-novel');
            currentStore.setCurrentNodeId(z.linkedStoryNodeId);
            currentStore.setShowStoryOverlay(true);
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
        const npcDef = NPC_DEFINITIONS.find((n) => n.id === npcId);
        if (!npcDef) return;

        // Find trigger zone linked to this NPC
        const npcZone = TRIGGER_ZONES.find((z) => {
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
        if (npcDef.dialogueNodeId && DIALOGUE_NODES[npcDef.dialogueNodeId]) {
          store.setMode('visual-novel');
          store.setCurrentNodeId(npcDef.dialogueNodeId);
        } else if (npcZone?.linkedDialogueNodeId && DIALOGUE_NODES[npcZone.linkedDialogueNodeId]) {
          store.setMode('visual-novel');
          store.setCurrentNodeId(npcZone.linkedDialogueNodeId);
        } else if (npcZone?.linkedStoryNodeId && STORY_NODES[npcZone.linkedStoryNodeId]) {
          store.setMode('visual-novel');
          store.setCurrentNodeId(npcZone.linkedStoryNodeId);
          store.setShowStoryOverlay(true);
        }

        // Emit npc:talked event
        eventBus.emit('npc:talked', { npcId, dialogueNodeId: npcDef.dialogueNodeId });
      }),
    );

    // ── Handle mini-game open/close events ──
    unsubs.push(
      eventBus.on('minigame:open', ({ gameType }) => {
        if (gameType === 'codebreaker') {
          setCodebreakerOpen(true);
        } else if (gameType === 'openstack_terminal') {
          setOpenstackTerminalOpen(true);
        } else if (gameType === 'bash_terminal') {
          setBashTerminalOpen(true);
        } else if (gameType === 'poetry') {
          setPoetryGameOpen(true);
        } else if (gameType === 'hacking') {
          setHackingGameOpen(true);
        } else if (gameType === 'memory') {
          setMemoryGameOpen(true);
        } else if (gameType === 'quiz') {
          setQuizGameOpen(true);
        } else if (gameType === 'rhythm') {
          setRhythmGameOpen(true);
        }
      }),
    );

    unsubs.push(
      eventBus.on('minigame:complete', ({ gameType }) => {
        // Auto-close mini-game after a brief delay so player sees the result
        setTimeout(() => {
          if (gameType === 'codebreaker') setCodebreakerOpen(false);
          else if (gameType === 'openstack_terminal') setOpenstackTerminalOpen(false);
          else if (gameType === 'bash_terminal') setBashTerminalOpen(false);
          else if (gameType === 'poetry') setPoetryGameOpen(false);
          else if (gameType === 'hacking') setHackingGameOpen(false);
          else if (gameType === 'memory') setMemoryGameOpen(false);
          else if (gameType === 'quiz') setQuizGameOpen(false);
          else if (gameType === 'rhythm') setRhythmGameOpen(false);
          else setCodebreakerOpen(false);
        }, 2000);
      }),
    );

    // ── When dialogue/story closes, emit interaction:end ──
    // Handles ALL interaction states (not just Dialogue) to ensure
    // the interaction system is always cleaned up when returning to exploration.
    // This prevents the player from being permanently frozen if the interaction
    // was interrupted before reaching the Dialogue state.
    unsubs.push(
      useGameStore.subscribe((state, prev) => {
        // When mode transitions FROM visual-novel back to exploration
        // AND we're in an active interaction, end the interaction
        if (
          prev.mode === 'visual-novel' &&
          state.mode === 'exploration'
        ) {
          // Always emit interaction:end when returning to exploration from visual-novel
          // This handles ALL cases: stuck Approach, Cutscene, Align, Lock, Dialogue states
          const interactionState = getInteractionState();
          if (interactionState !== InteractionState.Idle) {
            eventBus.emit('interaction:end', {});
          }
          // SAFETY: Also directly force-reset the interaction state if it's stuck
          // This handles the case where interaction:end doesn't fully reset
          if (isInteractionLocked()) {
            // Force reset via a small delay to avoid race conditions
            setTimeout(() => {
              if (isInteractionLocked()) {
                eventBus.emit('interaction:end', {});
              }
            }, 100);
          }
        }
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [applyInteractionEffects]);

  // ── Handle ExaminePanel "Continue" action ──
  // Triggers the linked content (dialogue/story/minigame) for the pending trigger zone,
  // then closes the ExaminePanel. Called when the user presses E or clicks "Continue"
  // while ExaminePanel is open with linked content.
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
    if (zone.linkedDialogueNodeId && DIALOGUE_NODES[zone.linkedDialogueNodeId]) {
      store.setMode('visual-novel');
      store.setCurrentNodeId(zone.linkedDialogueNodeId);
    } else if (zone.linkedStoryNodeId && STORY_NODES[zone.linkedStoryNodeId]) {
      store.setMode('visual-novel');
      store.setCurrentNodeId(zone.linkedStoryNodeId);
      store.setShowStoryOverlay(true);
    }
  }, []);

  // ── Clear pending trigger zone (called when ExaminePanel is closed without continuing) ──
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
