import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import type { TriggerZone } from '@/data/triggerZones';
import {
  getStoryNodes,
  getDialogueNodes,
  getTriggerZones,
  findNpcById,
  getItemDefinition,
  ensureStoryNode,
  ensureDialogueNode,
} from '@/data/gameDataLoader';
import { notifyItemReceived } from '@/components/game/LootNotification';
import { applyEffects } from '@/shared/utils/applyEffects';
import { requestSceneTransition, requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import {
  closeMinigame,
  isKnownMinigameId,
  openMinigame,
  type MinigamePanelSetters,
} from '@/shared/constants/minigames';
import type { EnemyType, ExamineData, SceneId, StoryEffect } from '@/shared/types/game';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import {
  emitInteractionEndIfNeeded,
  resetInteractionEndDedup,
} from '@/engine/interaction/interactionEndDedup';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';

export interface InteractionControllerUi {
  setExamineOpen: (open: boolean) => void;
  setExamineData: (data: ExamineData | null) => void;
  setExamineHasLinkedContent: (has: boolean) => void;
}

export interface InteractionControllerDeps {
  startCombatFromStory: (enemyType: EnemyType) => void;
  ui: InteractionControllerUi;
  minigameSetters: MinigamePanelSetters;
  getPendingTriggerZone: () => TriggerZone | null;
  setPendingTriggerZone: (zone: TriggerZone | null) => void;
}

async function openLinkedDialogue(nodeId: string): Promise<void> {
  await ensureDialogueNode(nodeId);
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

async function triggerLinkedContent(zone: TriggerZone): Promise<void> {
  if (zone.linkedMinigame) {
    eventBus.emit('minigame:open', { gameType: zone.linkedMinigame });
    return;
  }

  const store = useGameStore.getState();

  if (zone.linkedStoryNodeId) {
    await ensureStoryNode(zone.linkedStoryNodeId);
    const storyNode = getStoryNodes()[zone.linkedStoryNodeId];
    if (!storyNode) return;

    const alreadyVisited = store.playerState.visitedNodes.includes(zone.linkedStoryNodeId);
    if (alreadyVisited && storyNode.sceneId) {
      requestSceneTransition(storyNode.sceneId as SceneId);
      return;
    }
    requestSceneTransitionForStoryNode(zone.linkedStoryNodeId, storyNode.sceneId);
    openNarrativeOverlay(zone.linkedStoryNodeId, 'story');
  } else if (zone.linkedDialogueNodeId) {
    await openLinkedDialogue(zone.linkedDialogueNodeId);
  }
}

function findNpcTriggerZone(npcId: string, dialogueNodeId?: string): TriggerZone | undefined {
  return getTriggerZones().find((z) => {
    if (z.linkedDialogueNodeId && dialogueNodeId && z.linkedDialogueNodeId === dialogueNodeId) {
      return true;
    }
    const zoneBaseName = z.id.replace(/^(cafe|office|street|home|corridor|room|park|library|factory|rooftop)_/, '');
    return zoneBaseName.includes(npcId.replace('office_', ''));
  });
}

/**
 * Domain logic for exploration interactions (trigger zones, NPC dialogue, minigames).
 * React hook useInteractionOrchestrator wires EventBus + UI state to this controller.
 */
export class InteractionController {
  private readonly session = new ControllerSession();

  constructor(private readonly deps: InteractionControllerDeps) {
    this.session.begin();
  }

  dispose(): void {
    this.session.dispose();
  }

  isDisposed(): boolean {
    return this.session.isDisposed();
  }

  private applyInteractionEffects(effects: StoryEffect[]): void {
    applyEffects(effects, {
      onItemAdded: (itemId: string, _quantity: number) => {
        const def = getItemDefinition(itemId);
        notifyItemReceived(def?.name ?? itemId, def?.rarity);
      },
      startCombat: this.deps.startCombatFromStory,
    });
  }

  onInteractionStart(): void {
    resetInteractionEndDedup();
  }

  onNarrativeOverlayOpened(): void {
    resetInteractionEndDedup();
  }

  onNarrativeOverlayClosedInExploration(): void {
    queueMicrotask(() => {
      if (this.session.isDisposed()) return;
      emitInteractionEndIfNeeded();
      if (isInteractionLocked()) {
        this.session.schedule(() => {
          if (this.session.isDisposed()) return;
          emitInteractionEndIfNeeded();
        }, 100);
      }
    });
  }

  handleObjectInteract(triggerZoneId: string | undefined): void {
    if (this.session.isDisposed()) return;
    if (!triggerZoneId) return;

    const zone = getTriggerZones().find((z) => z.id === triggerZoneId);
    if (!zone) return;

    const store = useGameStore.getState();
    if (readGamePhase(store) !== 'exploration') return;

    if (zone.requiredAct && store.playerState.progression.currentAct < zone.requiredAct) {
      return;
    }

    if (zone.isOneTime && store.interactiveObjectStates[triggerZoneId]) {
      return;
    }

    if (zone.effects && zone.effects.length > 0) {
      this.applyInteractionEffects(zone.effects);
    }

    if (zone.isOneTime) {
      store.toggleInteractiveObject(triggerZoneId);
    }

    if (zone.linkedQuestId) {
      store.activateQuest(zone.linkedQuestId);
    }

    const hasLinkedContent = !!(zone.linkedDialogueNodeId || zone.linkedStoryNodeId || zone.linkedMinigame);
    const { ui } = this.deps;

    if (zone.examineData) {
      ui.setExamineData(zone.examineData);
      ui.setExamineOpen(true);
      ui.setExamineHasLinkedContent(hasLinkedContent);
      audioEngine.playStinger('discovery');
      this.deps.setPendingTriggerZone(hasLinkedContent ? zone : null);
    } else {
      void triggerLinkedContent(zone);
    }
  }

  handleNpcInteractStaged(npcId: string): void {
    if (this.session.isDisposed()) return;
    const store = useGameStore.getState();
    if (readGamePhase(store) !== 'exploration') return;

    const npcDef = findNpcById(npcId);
    if (!npcDef) return;

    const npcZone = findNpcTriggerZone(npcId, npcDef.dialogueNodeId);

    if (npcZone) {
      if (npcZone.effects && npcZone.effects.length > 0) {
        this.applyInteractionEffects(npcZone.effects);
      }
      if (npcZone.linkedQuestId) {
        store.activateQuest(npcZone.linkedQuestId);
      }
    }

    let openedNarrative = false;
    void (async () => {
      if (npcDef.dialogueNodeId) {
        try {
          await ensureDialogueNode(npcDef.dialogueNodeId);
          if (getDialogueNodes()[npcDef.dialogueNodeId]) {
            openNarrativeOverlay(npcDef.dialogueNodeId, 'dialogue');
            openedNarrative = true;
          }
        } catch {
          /* pack missing — fall through */
        }
      } else if (npcZone?.linkedDialogueNodeId) {
        try {
          await ensureDialogueNode(npcZone.linkedDialogueNodeId);
          if (getDialogueNodes()[npcZone.linkedDialogueNodeId]) {
            openNarrativeOverlay(npcZone.linkedDialogueNodeId, 'dialogue');
            openedNarrative = true;
          }
        } catch {
          /* pack missing */
        }
      } else if (npcZone?.linkedStoryNodeId) {
        try {
          await ensureStoryNode(npcZone.linkedStoryNodeId);
          const storyNode = getStoryNodes()[npcZone.linkedStoryNodeId];
          if (storyNode) {
            requestSceneTransitionForStoryNode(npcZone.linkedStoryNodeId, storyNode.sceneId);
            openNarrativeOverlay(npcZone.linkedStoryNodeId, 'story');
            openedNarrative = true;
          }
        } catch {
          /* pack missing */
        }
      }

      if (!openedNarrative) {
        queueMicrotask(() => {
          if (this.session.isDisposed()) return;
          emitInteractionEndIfNeeded();
        });
      }
    })();

    eventBus.emit('npc:talked', { npcId, dialogueNodeId: npcDef.dialogueNodeId });
  }

  handleMinigameOpen(gameType: string): void {
    if (this.session.isDisposed()) return;
    if (!isKnownMinigameId(gameType)) return;
    openMinigame(gameType, this.deps.minigameSetters);
  }

  handleMinigameComplete(gameType: string): void {
    this.session.schedule(() => {
      if (this.session.isDisposed()) return;
      if (!isKnownMinigameId(gameType)) return;
      closeMinigame(gameType, this.deps.minigameSetters);
    }, 2000);
  }

  handleExamineContinue(): void {
    if (this.session.isDisposed()) return;
    const zone = this.deps.getPendingTriggerZone();
    if (!zone) return;

    const { ui } = this.deps;
    ui.setExamineOpen(false);
    ui.setExamineData(null);
    ui.setExamineHasLinkedContent(false);
    this.deps.setPendingTriggerZone(null);

    void triggerLinkedContent(zone);
  }

  clearPendingTriggerZone(): void {
    this.deps.setPendingTriggerZone(null);
  }
}
