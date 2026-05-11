/* ─── Volodka RPG – Quest Tracking Engine (AAA+ Overhaul) ─── */

import type { SceneId, StoryEffect, QuestState, QuestDefinition } from '@/shared/types/game';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { useGameStore, type GameStoreState } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { applyEffects } from '@/shared/utils/applyEffects';

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
    const state = useGameStore.getState();
    this.previousSceneId = state.exploration.currentSceneId;
    this.previousFlags = { ...state.playerState.flags };
    this.previousInventoryIds = new Set(state.playerState.inventory.map((i) => i.id));
    this.previousPoems = new Set(state.collectedPoems);

    // Subscribe to Zustand store changes
    this.unsubscribeStore = useGameStore.subscribe((state) => {
      this.onStateChanged(state);
    });

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
        const s = useGameStore.getState();
        this.previousSceneId = s.exploration.currentSceneId;
        this.previousFlags = { ...s.playerState.flags };
        this.previousInventoryIds = new Set(s.playerState.inventory.map((i) => i.id));
        this.previousPoems = new Set(s.collectedPoems);
      }),
    );

    // Subscribe to poem power usage for quest interactions
    this.unsubscribeEvents.push(
      eventBus.on('poem:power_used', (payload) => {
        this.onPoemPowerUsed(payload.poemId);
      }),
    );
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

  /** Called on every Zustand state change */
  private onStateChanged(state: GameStoreState): void {
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
      const definition = QUEST_DEFINITIONS.find((d) => d.id === quest.questId);
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
      const definition = QUEST_DEFINITIONS.find((d) => d.id === quest.questId);
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
      const definition = QUEST_DEFINITIONS.find((d) => d.id === quest.questId);
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
      const definition = QUEST_DEFINITIONS.find((d) => d.id === quest.questId);
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
      const definition = QUEST_DEFINITIONS.find((d) => d.id === quest.questId);
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

  /** Check time limits for active quests with timeLimitHours */
  private checkTimeLimits(state: GameStoreState): void {
    const currentTime = state.exploration.timeOfDay;

    for (const quest of state.quests) {
      if (quest.status !== 'active') continue;
      if (quest.startedAtTime === undefined) continue;

      const definition = QUEST_DEFINITIONS.find((d) => d.id === quest.questId);
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
    const store = useGameStore.getState();
    const activeQuests = store.quests.filter((q) => q.status === 'active');

    for (const quest of activeQuests) {
      const definition = QUEST_DEFINITIONS.find((d) => d.id === quest.questId);
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
    const store = useGameStore.getState();
    const quest = store.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;
    if (quest.objectives[objectiveId]) return;

    const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
    if (!definition) return;

    const objective = definition.objectives.find((o) => o.id === objectiveId);
    if (!objective?.poemPowerBypass) return;
    if (objective.poemPowerBypass !== poemId) return;

    // Verify the player has this poem collected
    if (!store.collectedPoems.includes(poemId)) return;

    this.completeObjective(questId, objectiveId);
  }

  /** Try to complete a specific objective by quest+objective ID */
  private tryCompleteObjective(questId: string, objectiveId: string): void {
    const quest = useGameStore.getState().quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;
    if (quest.objectives[objectiveId]) return; // already complete

    this.completeObjective(questId, objectiveId);
  }

  /** Complete an objective and check if the entire quest is now done */
  private completeObjective(questId: string, objectiveId: string): void {
    const store = useGameStore.getState();

    // Verify the quest is active and the objective isn't already done
    const quest = store.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;
    if (quest.objectives[objectiveId]) return;

    // Complete the objective via the store action
    store.completeQuestObjective(questId, objectiveId);

    // Check if all objectives are now complete
    this.checkQuestCompletion(questId);
  }

  /** Check if all objectives of a quest are complete, and if so, complete the quest */
  private checkQuestCompletion(questId: string): void {
    const state = useGameStore.getState();
    const quest = state.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;

    const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
    if (!definition) return;

    const allComplete = definition.objectives.every(
      (obj) => quest.objectives[obj.id] === true,
    );

    if (allComplete) {
      // Apply quest rewards
      if (definition.rewards && definition.rewards.length > 0) {
        this.applyQuestRewards(definition.rewards);
      }

      // Complete the quest
      state.completeQuest(questId);
    }
  }

  /** Fail a quest with a reason */
  private failQuest(questId: string, reason: string): void {
    const store = useGameStore.getState();
    const quest = store.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;

    const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
    if (!definition) return;

    // Use the store's failQuest action
    store.failQuest(questId);

    eventBus.emit('quest:failed', { questId, reason });
  }

  /** Apply quest reward effects via the centralized applyEffects utility */
  private applyQuestRewards(rewards: StoryEffect[]): void {
    applyEffects(rewards, {
      shouldActivateQuest: (questId: string) => this.canActivateQuest(questId),
    });
  }

  /** Check if a quest can be activated (dependencies, required flags, etc.) */
  canActivateQuest(questId: string): boolean {
    const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
    if (!definition) return false;

    const state = useGameStore.getState();

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
    return QUEST_DEFINITIONS.find((d) => d.id === questId);
  }

  /** Get all currently active quests */
  private getActiveQuests(): QuestState[] {
    return useGameStore.getState().quests.filter((q) => q.status === 'active');
  }

  /** Get quest progress as a percentage */
  getQuestProgress(questId: string): number {
    const state = useGameStore.getState();
    const quest = state.quests.find((q) => q.questId === questId);
    if (!quest) return 0;

    const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
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
