import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { TriggerZone } from '@/data/triggerZones';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import {
  getTriggerZones,
  findNpcById,
  getItemDefinition,
} from '@/data/gameDataLoader';
import { isTriggerZoneAvailable } from '@/data/triggerZones';
import {
  findNpcTriggerZoneForScene,
  resolveNpcNarrativeTarget,
} from '@/engine/interaction/npcNarrativeRouting';
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
  beginInteractionEndCycle,
  emitInteractionEndIfNeeded,
  getInteractionEndCycleId,
} from '@/engine/interaction/interactionEndDedup';
import { consumeEKey } from '@/engine/input/eKeyConsumption';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { isCinematicTimelineActive } from '@/engine/cinematic/cinematicTimelineOrchestrator';
import { devWarn } from '@/shared/utils/devLog';
import { resolveNpcBarkForRelation } from '@/shared/npcBark';
import { resolveZoneInteractionSplash } from '@/engine/interaction/resolveInteractionSplash';
import { playInteractionSplash } from '@/engine/interaction/playInteractionSplash';
import { shouldOpenLinkedStoryDirectly } from '@/engine/interaction/interactionZonePresentation';

/** Human-readable skill names in Russian. */
const SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Кодинг',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Писательство',
  rhythm: 'Ритм',
};

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
  /** Open the container loot panel for a zone with containerContents. */
  openContainerLoot?: (zone: TriggerZone) => void;
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

function isExplorationMode(): boolean {
  return getGameSnapshot().mode === 'exploration';
}

/** Deterministic bark index from NPC id hash — avoids Math.random() non-determinism. */
let fallbackBarkCounter = 0;
const FALLBACK_NO_DIALOGUE_BARKS = [
  'Мне нечего сказать...',
  'Уходи, я занят.',
  'Не сейчас.',
  'Нечего обсуждать.',
] as const;

function pickFallbackBark(): string {
  // Simple round-robin — deterministic per call order, not per NPC, but
  // this path only fires for NPCs with no barkTexts defined (rare fallback).
  const idx = fallbackBarkCounter % FALLBACK_NO_DIALOGUE_BARKS.length;
  fallbackBarkCounter++;
  return FALLBACK_NO_DIALOGUE_BARKS[idx]!;
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

      // Don't fire auto-trigger effects during an active NPC interaction.
      // The approach path could cross a trigger zone, and a transitionScene
      // effect would desync the InteractionSystemBridge stateRef with the
      // module-level interactionSession (which resets on scene:transition_start).
      if (isInteractionLocked()) return;

      // Area B defense-in-depth: also block during an active cinematic
      // timeline. InteractiveTriggers.tsx suppresses the emit, but a
      // programmatic emit (e.g., from a test or another module) could
      // still slip through. The hard gate in requestSceneTransition blocks
      // scene changes, but other effects (addItem, addStat) would apply.
      if (isCinematicTimelineActive()) return;

      const snapshot = getGameSnapshot();
      if (zone.requiredAct && snapshot.playerState.progression.currentAct < zone.requiredAct) {
        return;
      }

      if (zone.effects && zone.effects.length > 0) {
        this.applyInteractionEffects(zone.effects);
      }

      if (zone.isOneTime) {
        dispatchGameAction({ type: 'exploration/toggleInteractiveObject', objectId: triggerZoneId });
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
    const cycleIdAtClose = getInteractionEndCycleId();
    const sessionAlive = !this.session.isDisposed();
    queueMicrotask(() => {
      if (!sessionAlive || this.session.isDisposed()) return;
      emitInteractionEndIfNeeded();
      if (isInteractionLocked()) {
        // Race #13: capture session reference so disposal during the 100ms window
        // prevents the timer from ending a *new* interaction started after close.
        const sessionAtSchedule = this.session;
        sessionAtSchedule.schedule(() => {
          if (sessionAtSchedule.isDisposed()) return;
          if (getInteractionEndCycleId() !== cycleIdAtClose) return;
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
      eventBus.emit('fx:shake', { intensity: 2, duration: 200 });
      eventBus.emit('fx:flash', { color: 'rgba(251,191,36,0.15)', opacity: 1, duration: 300 });
      return;
    }

    if (
      !isTriggerZoneAvailable(
        zone,
        snapshot.playerState.flags,
        snapshot.playerState.progression.currentAct,
        snapshot.activeTTLFlags,
      )
    ) {
      devWarn(`[InteractionController] Zone "${triggerZoneId}" not available for current state`);
      eventBus.emit('fx:shake', { intensity: 3, duration: 250 });
      eventBus.emit('fx:flash', { color: 'rgba(244,63,94,0.2)', opacity: 1, duration: 300 });
      return;
    }

    if (zone.isOneTime && snapshot.exploration.interactiveObjectStates[triggerZoneId]) {
      devWarn(`[InteractionController] One-time zone already used: "${triggerZoneId}"`);
      eventBus.emit('fx:shake', { intensity: 2, duration: 200 });
      eventBus.emit('fx:flash', { color: 'rgba(148,163,184,0.15)', opacity: 1, duration: 250 });
      return;
    }

    // ── Skill check gate ──
    if (zone.requiredSkill) {
      const threshold = zone.skillThreshold ?? 3;
      const playerSkill = snapshot.playerState.skills[zone.requiredSkill] ?? 0;
      const passed = playerSkill >= threshold;

      eventBus.emit('ui:skill_check', {
        skill: zone.requiredSkill,
        skillLabel: SKILL_LABELS[zone.requiredSkill],
        required: threshold,
        actual: playerSkill,
        passed,
      });

      if (!passed) {
        dispatchGameAction({
          type: 'notification/push',
          notificationType: 'quest',
          text: `Недостаточный навык: ${SKILL_LABELS[zone.requiredSkill]} ${playerSkill}/${threshold}`,
        });
        eventBus.emit('fx:shake', { intensity: 4, duration: 300 });
        eventBus.emit('fx:flash', { color: 'rgba(244,63,94,0.25)', opacity: 1, duration: 350 });
        return;
      }
    }

    const splash = resolveZoneInteractionSplash(zone, {
      flags: snapshot.playerState.flags,
    });
    const openStoryDirectly = shouldOpenLinkedStoryDirectly(zone);

    const executeZoneInteraction = (): void => {
      if (this.session.isDisposed()) return;

      // Re-read snapshot after splash delay — player state may have changed
      const freshSnapshot = getGameSnapshot();

      // Re-validate act gate
      if (zone.requiredAct && freshSnapshot.playerState.progression.currentAct < zone.requiredAct) return;

      // Re-validate zone availability (flags may have changed during splash)
      if (
        !isTriggerZoneAvailable(
          zone,
          freshSnapshot.playerState.flags,
          freshSnapshot.playerState.progression.currentAct,
          freshSnapshot.activeTTLFlags,
        )
      ) return;

      // Re-validate one-time
      if (zone.isOneTime && freshSnapshot.exploration.interactiveObjectStates[triggerZoneId]) return;

      // Re-validate skill check
      if (zone.requiredSkill) {
        const threshold = zone.skillThreshold ?? 3;
        const playerSkill = freshSnapshot.playerState.skills[zone.requiredSkill] ?? 0;
        if (playerSkill < threshold) return;
      }

      // Container loot — show the loot panel instead of firing effects.
      // The panel handles item transfer individually; effects fire only for
      // non-container zones.
      if (zone.containerContents && zone.containerContents.length > 0 && this.deps.openContainerLoot) {
        this.deps.openContainerLoot(zone);
        if (zone.isOneTime) {
          dispatchGameAction({ type: 'exploration/toggleInteractiveObject', objectId: triggerZoneId });
        }
        return;
      }

      const hasLinkedContent = !!(zone.linkedDialogueNodeId || zone.linkedStoryNodeId || zone.linkedMinigame);
      const { ui } = this.deps;
      const deferProgress =
        !!zone.examineData && !openStoryDirectly && hasLinkedContent;

      // When examine opens with linked story/dialogue, defer effects + isOneTime
      // until Continue — Escape must not burn the zone (e.g. terminal_poem_read
      // hiding the monitor before terminal_boot_poem runs).
      if (!deferProgress) {
        if (zone.effects && zone.effects.length > 0) {
          this.applyInteractionEffects(zone.effects);
        }

        if (zone.isOneTime) {
          dispatchGameAction({ type: 'exploration/toggleInteractiveObject', objectId: triggerZoneId });
        }

        if (zone.linkedQuestId) {
          dispatchGameAction({ type: 'quest/activate', questId: zone.linkedQuestId });
        }
      }

      if (zone.examineData && !openStoryDirectly) {
        ui.setExamineData(zone.examineData);
        ui.setExamineOpen(true);
        ui.setExamineHasLinkedContent(hasLinkedContent);
        audioEngine.playStinger('discovery');
        this.deps.setPendingTriggerZone(hasLinkedContent ? zone : null);
      } else {
        if (openStoryDirectly) {
          beginInteractionEndCycle();
        }
        runInteractionTask('triggerLinkedContent', () => triggerLinkedContent(zone));
      }
    };

    // Story doors skip splash — corridor cutscene provides the cinematic beat.
    if (splash && !openStoryDirectly) {
      playInteractionSplash(splash, executeZoneInteraction, this.session);
    } else {
      executeZoneInteraction();
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

    const sceneId = getGameSnapshot().exploration.currentSceneId;
    const npcZone = findNpcTriggerZoneForScene(npcId, sceneId, npcDef.dialogueNodeId);
    const narrativeTarget = resolveNpcNarrativeTarget(npcId, npcDef.dialogueNodeId, sceneId);

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
      if (narrativeTarget?.kind === 'story') {
        openedNarrative = await tryOpenStory(narrativeTarget.nodeId);
      } else if (
        narrativeTarget?.kind === 'dialogue' ||
        narrativeTarget?.kind === 'default_dialogue'
      ) {
        openedNarrative = await tryOpenDialogue(narrativeTarget.nodeId);
      }

      if (openedNarrative) {
        if (this.session.isDisposed()) return;
        const talkedNodeId = narrativeTarget?.nodeId ?? npcDef.dialogueNodeId;
        eventBus.emit('npc:talked', { npcId, dialogueNodeId: talkedNodeId });
      } else {
        if (!narrativeTarget) {
          devWarn(`[InteractionController] No narrative linked for NPC "${npcId}"`);
        }

        // Resolve a bark line so the player sees visible feedback.
        // Uses the NPC's barkTexts based on relationship level, with a
        // generic fallback when no barkTexts are defined.
        let barkText: string;
        if (npcDef.barkTexts) {
          const npcRelations = getGameSnapshot().npcRelations;
          const relation = npcRelations.find((r) => r.npcId === npcId);
          const relationValue = relation?.value ?? 50;
          barkText = resolveNpcBarkForRelation(npcDef.barkTexts, relationValue);
        } else {
          barkText = pickFallbackBark();
        }
        eventBus.emit('npc:no_dialogue', { npcId, barkText });

        queueMicrotask(() => {
          if (this.session.isDisposed()) return;
          emitInteractionEndIfNeeded();
        });
      }
    });
  }

  handleMinigameOpen(gameType: string): void {
    if (this.session.isDisposed()) return;
    if (!isKnownMinigameId(gameType)) return;
    // Don't open minigame while narrative overlay is showing — prevents stacked modals
    const snap = getGameSnapshot();
    if (snap.showStoryOverlay) return;
    openMinigame(gameType, this.deps.minigameSetters);
  }

  handleMinigameComplete(gameType: string): void {
    this.session.schedule(() => {
      if (this.session.isDisposed()) return;
      if (!isKnownMinigameId(gameType)) return;
      try {
        closeMinigame(gameType, this.deps.minigameSetters);
      } catch (err) {
        devWarn(`[InteractionController] closeMinigame failed for "${gameType}":`, err);
      }
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

    // Apply deferred progress (effects / one-time / quest) now that the player
    // committed via Continue — Escape leaves the zone reusable.
    if (zoneSnapshot.effects && zoneSnapshot.effects.length > 0) {
      this.applyInteractionEffects(zoneSnapshot.effects);
    }
    if (zoneSnapshot.isOneTime) {
      dispatchGameAction({
        type: 'exploration/toggleInteractiveObject',
        objectId: zoneSnapshot.id,
      });
    }
    if (zoneSnapshot.linkedQuestId) {
      dispatchGameAction({ type: 'quest/activate', questId: zoneSnapshot.linkedQuestId });
    }

    // Let ExaminePanel exit animation finish before opening narrative overlay (avoids dual FocusTrap / React #185).
    // Consume E-key for longer than the schedule delay to prevent re-interaction
    // during the 300ms gap (examine closes → E-key debounce expires → new interaction fires).
    consumeEKey(400);
    this.session.schedule(() => {
      if (this.session.isDisposed()) return;
      runInteractionTask('triggerLinkedContent', () => triggerLinkedContent(zoneSnapshot));
    }, 300);
  }

  clearPendingTriggerZone(): void {
    this.deps.setPendingTriggerZone(null);
  }
}