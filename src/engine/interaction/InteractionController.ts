import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { TriggerZone } from '@/data/triggerZones';
import {
  getTriggerZones,
  findNpcById,
  getItemDefinition,
} from '@/data/gameDataLoader';
import {
  findTriggerZoneByDialogueNodeId,
  findTriggerZoneByNpcId,
} from '@/data/triggerZones';
import {
  openLinkedDialogue,
  openLinkedStory,
  tryOpenDialogue,
  tryOpenStory,
} from '@/engine/interaction/narrativeOpenHelpers';
import { notifyItemReceived } from '@/components/game/LootNotification';
import { applyEffects } from '@/shared/utils/applyEffects';
import {
  closeMinigame,
  isKnownMinigameId,
  openMinigame,
  type MinigamePanelSetters,
} from '@/shared/constants/minigames';
import type { EnemyType, ExamineData, StoryEffect } from '@/shared/types/game';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import {
  emitInteractionEndIfNeeded,
  beginInteractionEndCycle,
} from '@/engine/interaction/interactionEndDedup';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { devWarn } from '@/shared/utils/devLog';

function runInteractionTask(label: string, task: () => Promise<void>): void {
  void task().catch((err) => {
    devWarn(`[InteractionController] ${label} failed:`, err);
  });
}

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

async function triggerLinkedContent(zone: TriggerZone): Promise<void> {
  if (zone.linkedMinigame) {
    eventBus.emit('minigame:open', { gameType: zone.linkedMinigame });
    return;
  }

  if (zone.linkedStoryNodeId) {
    await openLinkedStory(zone.linkedStoryNodeId);
  } else if (zone.linkedDialogueNodeId) {
    await openLinkedDialogue(zone.linkedDialogueNodeId);
  }
}

function findNpcTriggerZone(npcId: string, dialogueNodeId?: string): TriggerZone | undefined {
  const zones = getTriggerZones();
  return (
    findTriggerZoneByNpcId(zones, npcId)
    ?? (dialogueNodeId ? findTriggerZoneByDialogueNodeId(zones, dialogueNodeId) : undefined)
  );
}

function isExplorationMode(): boolean {
  return getGameSnapshot().mode === 'exploration';
}

/**
 * Domain logic for exploration interactions (trigger zones, NPC dialogue, minigames).
 * React hook useInteractionOrchestrator wires EventBus + UI state to this controller.
 */
export class InteractionController {
  private readonly session = new ControllerSession();

  constructor(private readonly deps: InteractionControllerDeps) {
    this.session.begin();

    // Subscribe to auto-trigger events for combat zones
    const unsubAutoTrigger = eventBus.on('trigger:auto_execute', ({ triggerZoneId }) => {
      if (this.session.isDisposed()) return;
      const zone = getTriggerZones().find((z) => z.id === triggerZoneId);
      if (!zone) return;

      if (!isExplorationMode()) return;

      const snapshot = getGameSnapshot();
      if (zone.requiredAct && snapshot.playerState.progression.currentAct < zone.requiredAct) {
        return;
      }

      if (zone.effects && zone.effects.length > 0) {
        this.applyInteractionEffects(zone.effects);
      }

      if (zone.isOneTime) {
        dispatchGameAction({ type: 'exploration/consumeInteractiveObject', objectId: triggerZoneId });
      }

      if (zone.linkedQuestId) {
        dispatchGameAction({ type: 'quest/activate', questId: zone.linkedQuestId });
      }
    });

    // Store unsubscribe for cleanup
    this.session.onDispose(() => {
      unsubAutoTrigger();
    });
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
    beginInteractionEndCycle();
  }

  onNarrativeOverlayOpened(): void {
    beginInteractionEndCycle();
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
    if (!zone) {
      devWarn(`[InteractionController] Trigger zone not found: "${triggerZoneId}"`);
      return;
    }

    if (!isExplorationMode()) return;

    const snapshot = getGameSnapshot();

    if (zone.requiredAct && snapshot.playerState.progression.currentAct < zone.requiredAct) {
      devWarn(
        `[InteractionController] Zone "${triggerZoneId}" requires act ${zone.requiredAct}, ` +
        `current act ${snapshot.playerState.progression.currentAct}`,
      );
      dispatchGameAction({
        type: 'notification/push',
        notificationType: 'quest',
        text: `Станет доступно в акте ${zone.requiredAct}`,
      });
      return;
    }

    if (zone.isOneTime && snapshot.exploration.interactiveObjectStates[triggerZoneId]) {
      devWarn(`[InteractionController] One-time zone already used: "${triggerZoneId}"`);
      return;
    }

    if (zone.effects && zone.effects.length > 0) {
      this.applyInteractionEffects(zone.effects);
    }

    if (zone.isOneTime) {
      dispatchGameAction({ type: 'exploration/consumeInteractiveObject', objectId: triggerZoneId });
    }

    if (zone.linkedQuestId) {
      dispatchGameAction({ type: 'quest/activate', questId: zone.linkedQuestId });
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
      runInteractionTask('triggerLinkedContent', () => triggerLinkedContent(zone));
    }
  }

  handleNpcInteractStaged(npcId: string): void {
    if (this.session.isDisposed()) return;
    if (!isExplorationMode()) return;

    const npcDef = findNpcById(npcId);
    if (!npcDef) {
      devWarn(`[InteractionController] NPC not in registry: "${npcId}"`);
      return;
    }

    const npcZone = findNpcTriggerZone(npcId, npcDef.dialogueNodeId);

    if (npcZone) {
      if (npcZone.effects && npcZone.effects.length > 0) {
        this.applyInteractionEffects(npcZone.effects);
      }
      if (npcZone.linkedQuestId) {
        dispatchGameAction({ type: 'quest/activate', questId: npcZone.linkedQuestId });
      }
    }

    runInteractionTask('handleNpcInteractStaged', async () => {
      let openedNarrative = false;
      if (npcDef.dialogueNodeId) {
        openedNarrative = await tryOpenDialogue(npcDef.dialogueNodeId);
      } else if (npcZone?.linkedDialogueNodeId) {
        openedNarrative = await tryOpenDialogue(npcZone.linkedDialogueNodeId);
      } else if (npcZone?.linkedStoryNodeId) {
        openedNarrative = await tryOpenStory(npcZone.linkedStoryNodeId);
      }

      if (!openedNarrative) {
        if (
          !npcDef.dialogueNodeId &&
          !npcZone?.linkedDialogueNodeId &&
          !npcZone?.linkedStoryNodeId
        ) {
          devWarn(`[InteractionController] No narrative linked for NPC "${npcId}"`);
        }
        queueMicrotask(() => {
          if (this.session.isDisposed()) return;
          emitInteractionEndIfNeeded();
        });
      }
    });

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

    const zoneSnapshot = zone;
    const { ui } = this.deps;
    ui.setExamineOpen(false);
    ui.setExamineData(null);
    ui.setExamineHasLinkedContent(false);
    this.deps.setPendingTriggerZone(null);

    // Let ExaminePanel exit animation finish before opening narrative overlay (avoids dual FocusTrap / React #185).
    this.session.schedule(() => {
      if (this.session.isDisposed()) return;
      runInteractionTask('triggerLinkedContent', () => triggerLinkedContent(zoneSnapshot));
    }, 300);
  }

  clearPendingTriggerZone(): void {
    this.deps.setPendingTriggerZone(null);
  }
}
