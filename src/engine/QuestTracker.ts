/* ─── Volodka RPG – Quest Tracking Engine (AAA+ Overhaul) ─── */

import type { SceneId, QuestDefinition } from '@/shared/types/game';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import {
  dispatchGameAction,
  getGameSnapshot,
  subscribeGameSnapshot,
  type GameStoreSnapshot,
} from '@/engine/GameActionDispatcher';
import { eventBus } from '@/engine/EventBus';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { isKnownMinigameId, MINIGAME_COMPLETION_FLAGS } from '@/shared/constants/minigames';

/** Slice of store state that QuestTracker reacts to (scene, flags, inventory, poems, quests, time). */
interface QuestTrackerRelevantSlice {
  currentSceneId: SceneId;
  timeOfDay: number;
  flags: Record<string, boolean>;
  inventoryIds: string[];
  collectedPoems: string[];
  quests: Array<{
    questId: string;
    status: string;
    startedAtTime?: number;
    objectives: Record<string, boolean>;
  }>;
}

function selectQuestTrackerSlice(snapshot: GameStoreSnapshot): QuestTrackerRelevantSlice {
  return {
    currentSceneId: snapshot.exploration.currentSceneId,
    timeOfDay: snapshot.exploration.timeOfDay,
    flags: snapshot.playerState.flags,
    inventoryIds: snapshot.playerState.inventory.map((i) => i.id).sort(),
    collectedPoems: [...snapshot.collectedPoems].sort(),
    quests: snapshot.quests.map((q) => ({
      questId: q.questId,
      status: q.status,
      startedAtTime: q.startedAtTime,
      objectives: q.objectives,
    })),
  };
}

function flagsEqual(a: Record<string, boolean>, b: Record<string, boolean>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function stringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function questTrackerSliceEqual(a: QuestTrackerRelevantSlice, b: QuestTrackerRelevantSlice): boolean {
  if (a.currentSceneId !== b.currentSceneId) return false;
  if (a.timeOfDay !== b.timeOfDay) return false;
  if (!flagsEqual(a.flags, b.flags)) return false;
  if (!stringArraysEqual(a.inventoryIds, b.inventoryIds)) return false;
  if (!stringArraysEqual(a.collectedPoems, b.collectedPoems)) return false;
  if (a.quests.length !== b.quests.length) return false;
  for (let i = 0; i < a.quests.length; i++) {
    const aq = a.quests[i];
    const bq = b.quests[i];
    if (
      aq.questId !== bq.questId
      || aq.status !== bq.status
      || aq.startedAtTime !== bq.startedAtTime
    ) {
      return false;
    }
    if (!flagsEqual(aq.objectives, bq.objectives)) return false;
  }
  return true;
}

/**
 * QuestTracker subscribes to game state changes and EventBus events,
 * automatically completing quest objectives when their conditions are met.
 *
 * AAA+ features:
 * - Quest type categorization: main, side, hidden, daily
 * - Failed quest state (not just active/complete)
 * - Quest dependency tracking (quest B requires quest A complete)
 * - Quest time limits (optional: quest fails after X in-game hours)
 * - Poem-power quest interactions (some objectives can be bypassed with poem powers)
 *
 * Objective types:
 * - location_visited: player enters a specific scene
 * - npc_talked: player talks to a specific NPC
 * - item_collected: player has a specific item in inventory
 * - poem_collected: player has collected a specific poem
 * - flag_set: a specific flag is set in player state
 * - custom: manually triggered via event
 */
export class QuestTracker {
  private unsubscribeStore: (() => void) | null = null;
  private unsubscribeEvents: (() => void)[] = [];
  private previousSceneId: SceneId | null = null;
  private previousFlags: Record<string, boolean> = {};
  private previousInventoryIds: Set<string> = new Set();
  private previousPoems: Set<string> = new Set();

  /** Start tracking — subscribe to store changes and events */
  start(): void {
    // Snapshot initial state
    const state = getGameSnapshot();
    this.previousSceneId = state.exploration.currentSceneId;
    this.previousFlags = { ...state.playerState.flags };
    this.previousInventoryIds = new Set(state.playerState.inventory.map((i) => i.id));
    this.previousPoems = new Set(state.collectedPoems);

    // Subscribe only to quest-relevant store slices (not HUD, camera, notifications, etc.)
    this.unsubscribeStore = subscribeGameSnapshot(
      (state) => {
        this.onStateChanged(state);
      },
      {
        selector: selectQuestTrackerSlice,
        equalityFn: questTrackerSliceEqual,
      },
    );

    // Subscribe to EventBus events
    this.unsubscribeEvents.push(
      eventBus.on('npc:talked', (payload) => {
        this.onNpcTalked(payload.npcId);
      }),
    );

    this.unsubscribeEvents.push(
      eventBus.on('quest:complete_objective', (payload) => {
        this.tryCompleteObjective(payload.questId, payload.objectiveId);
      }),
    );

    // Poem power bypass — bypass an objective using a poem power
    this.unsubscribeEvents.push(
      eventBus.on('quest:poem_bypass', (payload) => {
        this.tryPoemBypass(payload.questId, payload.objectiveId, payload.poemId);
      }),
    );

    this.unsubscribeEvents.push(
      eventBus.on('game:loaded', () => {
        // Reset snapshot after load
        const s = getGameSnapshot();
        this.previousSceneId = s.exploration.currentSceneId;
        this.previousFlags = { ...s.playerState.flags };
        this.previousInventoryIds = new Set(s.playerState.inventory.map((i) => i.id));
        this.previousPoems = new Set(s.collectedPoems);

        // Retroactive check after load: active quests may have objectives
        // that were already met before the save (e.g. due to a previously
        // missed state change). Re-check all active quests.
        this.retroactiveCheck();
      }),
    );

    // Subscribe to poem power usage for quest interactions
    this.unsubscribeEvents.push(
      eventBus.on('poem:power_used', (payload) => {
        this.onPoemPowerUsed(payload.poemId);
      }),
    );

    // Subscribe to minigame completion — quest objectives only (never apply payload.reward;
    // rewards are applied once by completeMinigame with rewardsApplied: true).
    this.unsubscribeEvents.push(
      eventBus.on('minigame:complete', (payload) => {
        if (payload.success !== false) {
          this.onMinigameCompleted(payload.gameType);
        }
      }),
    );

    // Retroactive check: if a quest was activated after its objectives were
    // already met (race condition between initGuidedStoryManager and quest
    // activation), complete those objectives now.
    this.retroactiveCheck();

    // Also run retroactive check whenever a quest is accepted/activated,
    // so objectives that were already met before activation are detected.
    this.unsubscribeEvents.push(
      eventBus.on('quest:accepted', () => {
        this.retroactiveCheck();
      }),
    );

    if (import.meta.env.DEV) {
      void import('@/shared/validation/contentPipelineValidator').then(({ logValidationReport, validateContentPipeline }) => {
        logValidationReport(validateContentPipeline(), '[QuestTracker]');
      });
    }
  }

  /** Retroactive check: for each active quest, check if any objectives are
   *  already satisfied by the current game state. This handles the race
   *  condition where a quest is activated AFTER its objective conditions
   *  have already been met (e.g. poem collected before quest was active). */
  private retroactiveCheck(): void {
    const state = getGameSnapshot();
    const activeQuests = state.quests.filter((q) => q.status === 'active');

    for (const quest of activeQuests) {
      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition) continue;

      for (const objective of definition.objectives) {
        // Skip already-completed objectives
        if (quest.objectives[objective.id]) continue;

        let alreadyMet = false;

        switch (objective.type) {
          case 'location_visited':
            alreadyMet = objective.target === state.exploration.currentSceneId;
            break;
          case 'flag_set':
            alreadyMet = !!objective.target && !!state.playerState.flags[objective.target];
            break;
          case 'item_collected':
            alreadyMet = !!objective.target && state.playerState.inventory.some((i) => i.id === objective.target);
            break;
          case 'poem_collected':
            alreadyMet = !!objective.target && state.collectedPoems.includes(objective.target);
            break;
          case 'minigame_completed': {
            const target = objective.target;
            const completionFlag =
              target && isKnownMinigameId(target) ? MINIGAME_COMPLETION_FLAGS[target] : undefined;
            alreadyMet = !!completionFlag && !!state.playerState.flags[completionFlag];
            break;
          }
          // npc_talked, custom — can't be retroactively checked
        }

        if (alreadyMet) {
          this.completeObjective(quest.questId, objective.id);
        }
      }
    }
  }

  /** Stop tracking — clean up all subscriptions */
  stop(): void {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
    for (const unsub of this.unsubscribeEvents) {
      unsub();
    }
    this.unsubscribeEvents = [];
  }

  /** Called when quest-relevant store slices change */
  private onStateChanged(state: GameStoreSnapshot): void {
    const currentSceneId = state.exploration.currentSceneId;
    const currentFlags = state.playerState.flags;
    const currentInventoryIds = new Set(state.playerState.inventory.map((i) => i.id));
    const currentPoems = new Set(state.collectedPoems);

    // ── location_visited ──
    if (currentSceneId !== this.previousSceneId) {
      this.onSceneChanged(currentSceneId);
      this.previousSceneId = currentSceneId;
    }

    // ── flag_set ──
    this.checkNewFlags(currentFlags);
    this.previousFlags = { ...currentFlags };

    // ── item_collected ──
    this.checkNewItems(currentInventoryIds);
    this.previousInventoryIds = currentInventoryIds;

    // ── poem_collected ──
    this.checkNewPoems(currentPoems);
    this.previousPoems = currentPoems;

    // ── Check time limits on active quests ──
    this.checkTimeLimits(state);
  }

  /** Scene changed — check location_visited objectives */
  private onSceneChanged(sceneId: SceneId): void {
    const activeQuests = this.getActiveQuests();
    for (const quest of activeQuests) {
      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition) continue;

      for (const objective of definition.objectives) {
        if (objective.type !== 'location_visited') continue;
        if (quest.objectives[objective.id]) continue; // already complete
        if (objective.target === sceneId) {
          this.completeObjective(quest.questId, objective.id);
        }
      }
    }
  }

  /** NPC talked — check npc_talked objectives */
  private onNpcTalked(npcId: string): void {
    const activeQuests = this.getActiveQuests();
    for (const quest of activeQuests) {
      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition) continue;

      for (const objective of definition.objectives) {
        if (objective.type !== 'npc_talked') continue;
        if (quest.objectives[objective.id]) continue;
        if (objective.target === npcId) {
          this.completeObjective(quest.questId, objective.id);
        }
      }
    }
  }

  /** Check for newly set flags — flag_set objectives */
  private checkNewFlags(currentFlags: Record<string, boolean>): void {
    const newFlags: string[] = [];
    for (const [key, val] of Object.entries(currentFlags)) {
      if (val && !this.previousFlags[key]) {
        newFlags.push(key);
      }
    }

    if (newFlags.length === 0) return;

    const activeQuests = this.getActiveQuests();
    for (const quest of activeQuests) {
      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition) continue;

      for (const objective of definition.objectives) {
        if (objective.type !== 'flag_set') continue;
        if (quest.objectives[objective.id]) continue;
        if (objective.target && newFlags.includes(objective.target)) {
          this.completeObjective(quest.questId, objective.id);
        }
      }
    }
  }

  /** Check for newly collected items — item_collected objectives */
  private checkNewItems(currentInventoryIds: Set<string>): void {
    const newItems: string[] = [];
    for (const id of currentInventoryIds) {
      if (!this.previousInventoryIds.has(id)) {
        newItems.push(id);
      }
    }

    if (newItems.length === 0) return;

    const activeQuests = this.getActiveQuests();
    for (const quest of activeQuests) {
      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition) continue;

      for (const objective of definition.objectives) {
        if (objective.type !== 'item_collected') continue;
        if (quest.objectives[objective.id]) continue;
        if (objective.target && newItems.includes(objective.target)) {
          this.completeObjective(quest.questId, objective.id);
        }
      }
    }
  }

  /** Check for newly collected poems — poem_collected objectives */
  private checkNewPoems(currentPoems: Set<string>): void {
    const newPoems: string[] = [];
    for (const id of currentPoems) {
      if (!this.previousPoems.has(id)) {
        newPoems.push(id);
      }
    }

    if (newPoems.length === 0) return;

    const activeQuests = this.getActiveQuests();
    for (const quest of activeQuests) {
      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition) continue;

      for (const objective of definition.objectives) {
        if (objective.type !== 'poem_collected') continue;
        if (quest.objectives[objective.id]) continue;
        if (objective.target && newPoems.includes(objective.target)) {
          this.completeObjective(quest.questId, objective.id);
        }
      }
    }
  }

  /** Minigame completed — check minigame_completed objectives */
  private onMinigameCompleted(gameType: string): void {
    if (!gameType || typeof gameType !== 'string') {
      if (import.meta.env.DEV) {
        console.warn('[QuestTracker] minigame:complete received invalid gameType:', gameType);
      }
      return;
    }

    if (!isKnownMinigameId(gameType)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[QuestTracker] Unknown minigame id "${gameType}" — no quest objectives will match. ` +
            'Check quest targets against src/shared/constants/minigames.ts.',
        );
      }
      return;
    }

    const completionFlag = MINIGAME_COMPLETION_FLAGS[gameType];
    if (completionFlag) {
      const state = getGameSnapshot();
      if (!state.playerState.flags[completionFlag]) {
        dispatchGameAction({ type: 'player/setFlag', key: completionFlag, value: true });
      }
    }

    const activeQuests = this.getActiveQuests();
    for (const quest of activeQuests) {
      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition) continue;

      for (const objective of definition.objectives) {
        if (objective.type !== 'minigame_completed') continue;
        if (quest.objectives[objective.id]) continue;
        if (!objective.target) continue;
        if (objective.target === gameType) {
          this.completeObjective(quest.questId, objective.id);
        }
      }
    }
  }

  /** Check time limits for active quests with timeLimitHours */
  private checkTimeLimits(state: GameStoreSnapshot): void {
    const currentTime = state.exploration.timeOfDay;

    for (const quest of state.quests) {
      if (quest.status !== 'active') continue;
      if (quest.startedAtTime === undefined) continue;

      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition?.timeLimitHours) continue;

      // Calculate elapsed hours (handles midnight wraparound)
      const elapsed = this.calculateElapsedHours(quest.startedAtTime, currentTime);
      if (elapsed > definition.timeLimitHours) {
        this.failQuest(quest.questId, 'Истекло время задания');
      }
    }
  }

  /** Calculate elapsed hours between two 0-24 hour values, accounting for midnight */
  private calculateElapsedHours(startHour: number, currentHour: number): number {
    if (currentHour >= startHour) {
      return currentHour - startHour;
    }
    // Wrapped around midnight
    return (24 - startHour) + currentHour;
  }

  /** Called when a poem power is used — check for quest bypasses */
  private onPoemPowerUsed(poemId: string): void {
    const snapshot = getGameSnapshot();
    const activeQuests = snapshot.quests.filter((q) => q.status === 'active');

    for (const quest of activeQuests) {
      const definition = getQuestDefinitions().find((d) => d.id === quest.questId);
      if (!definition) continue;

      for (const objective of definition.objectives) {
        if (quest.objectives[objective.id]) continue; // already complete
        if (objective.poemPowerBypass === poemId) {
          // Auto-bypass the objective when the matching poem power is used
          this.completeObjective(quest.questId, objective.id);
          eventBus.emit('quest:poem_bypass', {
            questId: quest.questId,
            objectiveId: objective.id,
            poemId,
          });
        }
      }
    }
  }

  /** Try to bypass an objective using a poem power */
  private tryPoemBypass(questId: string, objectiveId: string, poemId: string): void {
    const snapshot = getGameSnapshot();
    const quest = snapshot.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;
    if (quest.objectives[objectiveId]) return;

    const definition = getQuestDefinitions().find((d) => d.id === questId);
    if (!definition) return;

    const objective = definition.objectives.find((o) => o.id === objectiveId);
    if (!objective?.poemPowerBypass) return;
    if (objective.poemPowerBypass !== poemId) return;

    // Verify the player has this poem collected
    if (!snapshot.collectedPoems.includes(poemId)) return;

    this.completeObjective(questId, objectiveId);
  }

  /** Try to complete a specific objective by quest+objective ID */
  private tryCompleteObjective(questId: string, objectiveId: string): void {
    const quest = getGameSnapshot().quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;
    if (quest.objectives[objectiveId]) return; // already complete

    this.completeObjective(questId, objectiveId);
  }

  /** Complete an objective and check if the entire quest is now done */
  private completeObjective(questId: string, objectiveId: string): void {
    const snapshot = getGameSnapshot();

    const quest = snapshot.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;
    if (quest.objectives[objectiveId]) return;

    dispatchGameAction({ type: 'quest/completeObjective', questId, objectiveId });

    // Check if all objectives are now complete
    this.checkQuestCompletion(questId);
  }

  /** Check if all objectives of a quest are complete, and if so, complete the quest */
  private checkQuestCompletion(questId: string): void {
    const state = getGameSnapshot();
    const quest = state.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;

    const definition = getQuestDefinitions().find((d) => d.id === questId);
    if (!definition) return;

    const allComplete = definition.objectives.every(
      (obj) => quest.objectives[obj.id] === true,
    );

    if (allComplete) {
      dispatchGameAction({ type: 'quest/completeAndApplyRewards', questId });
    }
  }

  /** Fail a quest with a reason */
  private failQuest(questId: string, reason: string): void {
    const snapshot = getGameSnapshot();
    const quest = snapshot.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;

    const definition = getQuestDefinitions().find((d) => d.id === questId);
    if (!definition) return;

    dispatchGameAction({ type: 'quest/fail', questId });

    eventBus.emit('quest:failed', { questId, reason });
  }

  /** Check if a quest can be activated (dependencies, required flags, etc.) */
  canActivateQuest(questId: string): boolean {
    const definition = getQuestDefinitions().find((d) => d.id === questId);
    if (!definition) return false;

    const state = getGameSnapshot();

    // Check if quest is already active or completed
    const existing = state.quests.find((q) => q.questId === questId);
    if (existing && existing.status !== 'inactive' && existing.status !== 'failed') return false;

    // If quest was failed and can't retry, block reactivation
    if (existing?.status === 'failed' && !definition.canRetry) return false;

    // Check dependency quests — all required quests must be completed
    if (definition.requiresQuests && definition.requiresQuests.length > 0) {
      for (const reqId of definition.requiresQuests) {
        const reqQuest = state.quests.find((q) => q.questId === reqId);
        if (!reqQuest || reqQuest.status !== 'completed') {
          return false;
        }
      }
    }

    // Check required flag
    if (definition.requiredFlag && !state.playerState.flags[definition.requiredFlag]) {
      return false;
    }

    return true;
  }

  /** Get the definition for a quest */
  getQuestDefinition(questId: string): QuestDefinition | undefined {
    return getQuestDefinitions().find((d) => d.id === questId);
  }

  /** Get all currently active quests */
  private getActiveQuests(): GameStoreSnapshot['quests'] {
    return getGameSnapshot().quests.filter((q) => q.status === 'active');
  }

  /** Get quest progress as a percentage */
  getQuestProgress(questId: string): number {
    const state = getGameSnapshot();
    const quest = state.quests.find((q) => q.questId === questId);
    if (!quest) return 0;

    const definition = getQuestDefinitions().find((d) => d.id === questId);
    if (!definition) return 0;

    const total = definition.objectives.length;
    if (total === 0) return 0;

    const completed = definition.objectives.filter(
      (obj) => quest.objectives[obj.id] === true,
    ).length;

    return Math.round((completed / total) * 100);
  }
}

/** Singleton instance */
export const questTracker = new QuestTracker();

/** Stop store/event subscriptions (unmount / HMR). Idempotent. */
export function disposeQuestTracker(): void {
  questTracker.stop();
}

registerHmrDispose(disposeQuestTracker);
