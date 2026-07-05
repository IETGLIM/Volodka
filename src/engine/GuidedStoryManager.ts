/* ─── Volodka RPG – GuidedStoryManager ─── */
/* Enforces linear story progression through the golden path.
 * Store + goldenPath are injected via GuidedStoryDeps for unit testing. */

import { eventBus, type EventBusScope } from '@/engine/EventBus';
import type { EventMap } from '@/engine/events';
import { subscribeGameSnapshot, getGameSnapshot, type GameStoreSnapshot } from '@/engine/GameActionDispatcher';
import { getQuotesByAct } from '@/data/matrixQuotes';
import { shouldSuppressQuestAcceptEmit } from '@/engine/quest/questAcceptDeferral';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';
import { getStoryGraphIndex, invalidateStoryGraphIndex } from '@/engine/story/storyGraphIndex';
import {
  createDefaultGuidedStoryDeps,
  getStoryNodeSceneId,
  toGuidedStorySnapshot,
} from '@/engine/guidedStory/createGuidedStoryDeps';
import {
  canStartQuest as canStartQuestLogic,
  findNpcForQuest,
  getActForNode,
  getActTransition,
  getCurrentGuidance as getCurrentGuidanceLogic,
  resolveStorySpineAdvance,
  reconcileSpineQuestActivation,
  syncSpineStateFromSnapshot,
} from '@/engine/guidedStory/guidedStoryLogic';
import { enrichGuidanceWithLocation } from '@/engine/guidedStory/guidanceLocation';
import type { GuidedStoryDeps, GuidanceInfo } from '@/engine/guidedStory/guidedStoryTypes';

export type { GuidanceInfo } from '@/engine/guidedStory/guidedStoryTypes';

/** Coalesce visitNode / scene:enter / npc:talked / flag signals in one burst. */
const STORY_SPINE_ADVANCE_DEBOUNCE_MS = 32;

function selectLastVisitedNode(snapshot: GameStoreSnapshot): string | null {
  const nodes = snapshot.playerState.visitedNodes;
  return nodes.length > 0 ? nodes[nodes.length - 1] : null;
}

function stringArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export class GuidedStoryManager {
  private currentStepIndex = 0;
  private currentQuestSpineIndex = 0;
  private lastAdvancedToAct = 0;
  private initialized = false;
  /** [roadmap:ARCH-16] Public accessor for revive check. */
  isInitialized(): boolean { return this.initialized; }
  private unsubVisitNode: (() => void) | null = null;
  private unsubFlagSet: (() => void) | null = null;
  /**
   * [roadmap:ARCH-15] EventBusScope for the 4 eventBus.on() listeners
   * (quest:completed, npc:talked, scene:enter, game:loaded). One
   * scope.dispose() drops all 4. The 2 subscribeGameSnapshot listeners
   * (visitNode, flagSet) are store subscriptions, not EventBus — kept as
   * individual unsubs.
   */
  private eventScope: EventBusScope<EventMap> | null = null;
  private spineAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSpineNodeId: string | null = null;
  private lastGuidanceSignature: string | null = null;

  constructor(private readonly deps: GuidedStoryDeps = createDefaultGuidedStoryDeps()) {}

  private spineState() {
    return {
      currentStepIndex: this.currentStepIndex,
      currentQuestSpineIndex: this.currentQuestSpineIndex,
      lastAdvancedToAct: this.lastAdvancedToAct,
    };
  }

  getCurrentGuidance(): GuidanceInfo | null {
    return getCurrentGuidanceLogic(this.spineState(), this.deps);
  }

  canStartQuest(questId: string): boolean {
    return canStartQuestLogic(questId, this.deps);
  }

  /** Test hook: align spine indexes from the injected snapshot. */
  syncSpineForTest(): void {
    this.syncFromStore();
  }

  /** Test hook: advance story spine without EventBus/store subscriptions. */
  advanceStorySpineForTest(
    visitedNodeId: string,
    options?: { immediate?: boolean },
  ): void {
    if (options?.immediate) {
      this.applyStorySpineAdvance(visitedNodeId);
      return;
    }
    this.scheduleStorySpineAdvance(visitedNodeId);
  }

  /** Test hook — flush pending debounced spine advance. */
  flushStorySpineAdvanceForTest(): void {
    this.flushScheduledStorySpineAdvance();
  }

  private getNextQuestInSpine() {
    const snapshot = this.deps.getSnapshot();
    const { path, quests } = this.deps;

    for (let i = this.currentQuestSpineIndex; i < path.questSpine.length; i++) {
      const questId = path.questSpine[i];
      const questState = snapshot.quests.find((q) => q.questId === questId);

      if (questState?.status === 'completed' || questState?.status === 'active') {
        this.currentQuestSpineIndex = i + 1;
        continue;
      }

      const def = this.deps.graph.getQuestDefinitionById(questId);
      if (!def) continue;

      const deps = quests.areDependenciesMet(questId);
      if (!deps.met) continue;

      if (def.requiredFlag && !snapshot.flags[def.requiredFlag]) continue;

      if (def.requiredPoem && !snapshot.collectedPoems.includes(def.requiredPoem)) continue;

      const questAct = def.act ?? 1;
      if (questAct > snapshot.currentAct) continue;

      return { questId, def };
    }

    return null;
  }

  private clearSpineAdvanceDebounce(): void {
    if (this.spineAdvanceTimer !== null) {
      clearTimeout(this.spineAdvanceTimer);
      this.spineAdvanceTimer = null;
    }
    this.pendingSpineNodeId = null;
  }

  private scheduleStorySpineAdvance(visitedNodeId: string): void {
    const { path } = this.deps;
    if (resolveStorySpineAdvance(visitedNodeId, this.currentStepIndex, path) === null) {
      return;
    }

    this.pendingSpineNodeId = visitedNodeId;
    if (this.spineAdvanceTimer !== null) return;

    this.spineAdvanceTimer = setTimeout(() => {
      this.flushScheduledStorySpineAdvance();
    }, STORY_SPINE_ADVANCE_DEBOUNCE_MS);
  }

  private flushScheduledStorySpineAdvance(): void {
    const nodeId = this.pendingSpineNodeId;
    this.spineAdvanceTimer = null;
    this.pendingSpineNodeId = null;
    if (!nodeId) return;
    this.applyStorySpineAdvance(nodeId);
  }

  private advanceStorySpine(visitedNodeId: string): void {
    this.scheduleStorySpineAdvance(visitedNodeId);
  }

  private applyStorySpineAdvance(visitedNodeId: string): void {
    const { path, actions, events } = this.deps;
    const nextIndex = resolveStorySpineAdvance(visitedNodeId, this.currentStepIndex, path);
    if (nextIndex === null) return;

    const prevStep = this.currentStepIndex;
    this.currentStepIndex = nextIndex;

    const prevAct = getActForNode(path.storySpine[prevStep], path);
    const newAct =
      this.currentStepIndex < path.storySpine.length
        ? getActForNode(path.storySpine[this.currentStepIndex], path)
        : prevAct;

    if (newAct > prevAct && newAct > this.lastAdvancedToAct) {
      this.lastAdvancedToAct = newAct;
      actions.advanceAct();
      events.emitActTransition({
        fromAct: prevAct,
        toAct: newAct,
        chapterTitle: path.actChapterTitles[newAct] ?? `Акт ${newAct}`,
      });
    }

    this.emitGuidanceUpdate();
  }

  private advanceQuestSpine(completedQuestId: string) {
    const { path, actions, events } = this.deps;
    const spineIdx = path.questSpine.indexOf(completedQuestId);
    if (spineIdx >= 0 && spineIdx >= this.currentQuestSpineIndex) {
      this.currentQuestSpineIndex = spineIdx + 1;
    }

    const snapshot = this.deps.getSnapshot();
    const currentAct = snapshot.currentAct;
    const actTransition = getActTransition(path, currentAct);
    const actQuests = actTransition?.questSpineIds ?? [];

    const allActQuestsComplete =
      actQuests.length > 0 &&
      actQuests.every((qId) => {
        const qs = snapshot.quests.find((q) => q.questId === qId);
        return qs?.status === 'completed';
      });

    const questAdvanceAllowed = actTransition?.advanceTrigger !== 'story_node';

    if (allActQuestsComplete && questAdvanceAllowed && currentAct < path.actTransitions.length) {
      const nextAct = currentAct + 1;
      if (nextAct > this.lastAdvancedToAct) {
        this.lastAdvancedToAct = nextAct;
        actions.advanceAct();
        events.emitActTransition({
          fromAct: currentAct,
          toAct: nextAct,
          chapterTitle: path.actChapterTitles[nextAct] ?? `Акт ${nextAct}`,
        });
      }
    }

    const nextQuest = this.getNextQuestInSpine();
    if (nextQuest) {
      events.emitQuestAvailable({
        questId: nextQuest.questId,
        questTitle: nextQuest.def.title,
        questType: nextQuest.def.questType,
        npcId: findNpcForQuest(nextQuest.def),
      });

      const isDirectChainSuccessor = spineIdx >= 0 && spineIdx < path.questSpine.length - 1;
      if (isDirectChainSuccessor) {
        const prevQuestDef = this.deps.graph.getQuestDefinitionById(completedQuestId);
        events.emitQuestChainUnlock({
          completedQuestId,
          completedQuestTitle: prevQuestDef?.title ?? completedQuestId,
          nextQuestId: nextQuest.questId,
          nextQuestTitle: nextQuest.def.title,
          nextQuestType: nextQuest.def.questType,
          npcId: nextQuest.def.questGiverNpcId ?? findNpcForQuest(nextQuest.def),
          actNumber: nextQuest.def.act ?? currentAct,
        });
      }
    }

    this.emitGuidanceUpdate();
  }

  private guidanceSignature(guidance: GuidanceInfo): string {
    return [
      guidance.objectiveText,
      guidance.objectiveType,
      guidance.targetId,
      guidance.urgency,
      String(guidance.actNumber),
      guidance.chapterTitle,
      guidance.targetSceneId ?? '',
    ].join('|');
  }

  private emitGuidanceUpdate() {
    const guidance = this.getCurrentGuidance();
    if (!guidance) return;
    const enriched = enrichGuidanceWithLocation(
      guidance,
      this.deps.path.getNpcIdForStoryNode,
    );
    const signature = this.guidanceSignature(enriched);
    if (signature === this.lastGuidanceSignature) return;
    this.lastGuidanceSignature = signature;
    this.deps.events.emitGuidanceUpdate(enriched);
  }

  private autoStartFirstQuest() {
    const { path, actions, events } = this.deps;
    const phase = getGameSnapshot().mode;
    // Title poem / main menu — wake-up cutscene offers first_reading, not the HUD.
    if (phase === 'intro' || phase === 'menu') return;

    const snapshot = this.deps.getSnapshot();
    const firstQuestId = path.questSpine[0];
    if (!firstQuestId) return;

    const existing = snapshot.quests.find((q) => q.questId === firstQuestId);
    if (existing && existing.status !== 'inactive' && existing.status !== 'failed') return;

    const def = this.deps.graph.getQuestDefinitionById(firstQuestId);
    if (!def) return;

    actions.activateQuest(firstQuestId);
    this.currentQuestSpineIndex = 0;

    // Wake/prologue grants first_reading silently in the apartment.
    if (!shouldSuppressQuestAcceptEmit(firstQuestId)) {
      events.emitQuestAvailable({
        questId: firstQuestId,
        questTitle: def.title,
        questType: def.questType,
        npcId: findNpcForQuest(def),
      });
    }
  }

  private syncFromStore() {
    const synced = syncSpineStateFromSnapshot(this.deps.getSnapshot(), this.deps.path);
    this.currentStepIndex = synced.currentStepIndex;
    this.currentQuestSpineIndex = synced.currentQuestSpineIndex;
    this.lastAdvancedToAct = synced.lastAdvancedToAct;
  }

  resetState() {
    this.currentStepIndex = 0;
    this.currentQuestSpineIndex = 0;
    this.lastAdvancedToAct = 0;
    this.lastGuidanceSignature = null;
    this.clearSpineAdvanceDebounce();

    if (!this.initialized) return;

    this.syncFromStore();
    this.autoStartFirstQuest();
    this.emitGuidanceUpdate();
  }

  /** Reconcile spine/guidance after store mutations (quests, flags, visited nodes). */
  reconcile() {
    if (!this.initialized) return;
    this.syncFromStore();
    reconcileSpineQuestActivation(this.deps);
    this.syncFromStore();
    this.emitGuidanceUpdate();
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    getStoryGraphIndex();
    this.syncFromStore();
    this.autoStartFirstQuest();

    const { path } = this.deps;

    this.unsubVisitNode = subscribeGameSnapshot(
      (lastNode) => {
        if (lastNode) this.advanceStorySpine(lastNode);
      },
      {
        selector: selectLastVisitedNode,
        equalityFn: (a, b) => a === b,
      },
    );

    // [roadmap:ARCH-15] EventBus listeners grouped in a scope — one
    // scope.dispose() drops all 4 instead of 6 individual unsubs.
    this.eventScope = eventBus.createScope();
    this.eventScope.on('quest:completed', ({ questId }) => {
      if (path.questSpine.includes(questId)) {
        this.advanceQuestSpine(questId);
      }
    });

    this.eventScope.on('npc:talked', ({ npcId }) => {
      const canonicalNpcId = resolveCanonicalNpcId(npcId);
      for (let i = this.currentStepIndex; i < path.storySpine.length; i++) {
        const nodeId = path.storySpine[i];
        const mappedNpcId = path.getNpcIdForStoryNode(nodeId);
        if (mappedNpcId && resolveCanonicalNpcId(mappedNpcId) === canonicalNpcId) {
          this.advanceStorySpine(nodeId);
          break;
        }
      }
    });

    this.eventScope.on('scene:enter', ({ sceneId }) => {
      const stepNodeId = path.storySpine[this.currentStepIndex];
      if (stepNodeId && getStoryNodeSceneId(stepNodeId) === sceneId) {
        this.advanceStorySpine(stepNodeId);
      }
      this.emitGuidanceUpdate();
    });

    this.unsubFlagSet = subscribeGameSnapshot(
      (flagKeys) => {
        const currentStepNodeId = path.storySpine[this.currentStepIndex];
        if (!currentStepNodeId) return;
        for (const key of flagKeys) {
          const nodeMatch = path.storyFlagToNodeId[key];
          if (nodeMatch === currentStepNodeId) {
            this.advanceStorySpine(nodeMatch);
            break;
          }
        }
      },
      {
        selector: (snapshot) => toGuidedStorySnapshot(snapshot).activeTTLFlagKeys,
        equalityFn: stringArraysEqual,
      },
    );

    this.eventScope.on('game:loaded', () => {
      this.resetState();
    });

    this.emitGuidanceUpdate();
  }

  dispose() {
    if (!this.initialized) return;
    this.initialized = false;

    // [roadmap:ARCH-15] scope.dispose() drops all 4 EventBus listeners.
    this.eventScope?.dispose();
    this.eventScope = null;
    // Store subscriptions still need individual unsubs.
    this.unsubVisitNode?.();
    this.unsubFlagSet?.();

    this.unsubVisitNode = null;
    this.unsubFlagSet = null;

    this.currentStepIndex = 0;
    this.currentQuestSpineIndex = 0;
    this.lastAdvancedToAct = 0;
    this.lastGuidanceSignature = null;
    this.clearSpineAdvanceDebounce();
  }

  getActQuote(actNumber: number): string | undefined {
    const actQuotes = getQuotesByAct(actNumber);
    return actQuotes.length > 0 ? actQuotes[0].text : undefined;
  }
}

let guidedStoryManagerInstance: GuidedStoryManager | null = null;

function getGuidedStoryManager(): GuidedStoryManager {
  if (!guidedStoryManagerInstance) {
    guidedStoryManagerInstance = new GuidedStoryManager();
  }
  return guidedStoryManagerInstance;
}

export function disposeGuidedStoryManager() {
  if (guidedStoryManagerInstance) {
    guidedStoryManagerInstance.dispose();
    guidedStoryManagerInstance = null;
  }
  invalidateStoryGraphIndex();
}

registerHmrDispose(disposeGuidedStoryManager);

export function initGuidedStoryManager() {
  getGuidedStoryManager().init();
}

/**
 * Re-arm after orchestrator remount (React StrictMode).
 * [roadmap:ARCH-16] Previously a NO-OP — guidance was silently broken after
 * HMR until initGuidedStoryManager() was called elsewhere. Now explicitly
 * re-initializes the singleton if it was disposed.
 */
export function reviveGuidedStoryManager(): void {
  const instance = guidedStoryManagerInstance;
  if (instance && !instance.isInitialized()) {
    instance.init();
  }
}

export function resetGuidedStoryManager() {
  invalidateStoryGraphIndex();
  guidedStoryManagerInstance?.resetState();
}

export function reconcileGuidedStory() {
  getGuidedStoryManager().reconcile();
}

export function getCurrentGuidance(): GuidanceInfo | null {
  return getGuidedStoryManager().getCurrentGuidance();
}

export function canStartQuest(questId: string): boolean {
  return getGuidedStoryManager().canStartQuest(questId);
}

export function getActQuote(actNumber: number): string | undefined {
  return getGuidedStoryManager().getActQuote(actNumber);
}
