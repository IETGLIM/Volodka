/* ─── Volodka RPG – GuidedStoryManager ─── */
/* Enforces linear story progression through the golden path.
 * Store + goldenPath are injected via GuidedStoryDeps for unit testing. */

import { eventBus } from '@/engine/EventBus';
import { subscribeGameSnapshot, getGameSnapshot, type GameStoreSnapshot } from '@/engine/GameActionDispatcher';
import { getQuotesByAct } from '@/data/matrixQuotes';
import { shouldSuppressQuestAcceptEmit } from '@/engine/quest/questAcceptDeferral';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';
import { getStoryGraphIndex, invalidateStoryGraphIndex } from '@/engine/story/storyGraphIndex';
import { isNarrativeGameDataLoaded } from '@/data/gameDataLoader';
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

/** How long (ms) without a guidance update before we consider the player lost. */
const PLAYER_LOST_TIMEOUT_MS = 60_000;

/** Contextual hints shown when the player seems lost, keyed by act number. */
const PLAYER_LOST_HINTS: Record<number, string[]> = {
  1: [
    'Попробуй осмотреть комнату внимательнее — возможно, ты что-то упустил.',
    'Рабочий стол и книжная полка могут скрывать подсказки.',
    'Не стой на месте — подойди к предметам и нажми [E].',
    'Проверь журнал [Q] — там указана текущая цель и к какой сцене идти.',
  ],
  2: [
    'Попробуй поговорить с горожанами — кто-то может знать больше.',
    'Исследуй новые районы города — там могут быть зацепки.',
    'Зайди в «Синицу» или пройдись по офису — диалоги часто открывают новые пути.',
    'Открой журнал [Q] и проверь, не появились ли новые задания.',
  ],
  3: [
    'Вернись к ранее посещённым местам — изменилось ли что-нибудь?',
    'Поговори с товарищами — возможно, у них есть новые сведения.',
    'Проверь парк Зорге и окрестности — ЧК собираются только ночью.',
    'Открой журнал [Q]: задания ЧК, если они активны, укажут следующую точку.',
  ],
  4: [
    'Ситуация накаляется — ищи Альберта или следи за событиями в офисе.',
    'Если завис на задании — открой журнал [Q] и найди подсказку (hint).',
    'Проверь, не изменилось ли что-то в «Синице» после последних событий.',
  ],
  5: [
    'Финальные карты раскрыты — найди всех ключевых персонажей перед развязкой.',
    'Открой журнал [Q]: незавершённые задания могут блокировать концовку.',
    'Поговори с Лёней, Верой и товарищами ЧК — их позиции важны для финала.',
  ],
  6: [
    'Ты близко к финалу — ищи сцены, которые ещё не посещал.',
    'Открой журнал [Q] и убедись, что все цепочки завершены.',
    'Попробуй вернуться к Солнышу или на чердак — там могут быть незакрытые ветки.',
  ],
  7: [
    'Финал близко. Проверь стихотворения [P] — некоторые открывают скрытые ответы.',
    'Открой журнал [Q] и посмотри, какие задания ещё активны.',
    'Поговори с каждым персонажем — их последние слова важны для истинного конца.',
  ],
};

function pickLostHint(actNumber: number): string {
  const hints = PLAYER_LOST_HINTS[actNumber] ?? PLAYER_LOST_HINTS[1];
  return hints[Math.floor(Math.random() * hints.length)];
}

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
  private unsubVisitNode: (() => void) | null = null;
  private unsubQuestCompleted: (() => void) | null = null;
  private unsubNpcTalked: (() => void) | null = null;
  private unsubSceneEnter: (() => void) | null = null;
  private unsubFlagSet: (() => void) | null = null;
  private unsubGameLoaded: (() => void) | null = null;
  private spineAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSpineNodeId: string | null = null;
  private lastGuidanceSignature: string | null = null;
  private lastGuidanceTimestamp: number = 0;
  private playerLostTimer: ReturnType<typeof setInterval> | null = null;
  private playerLostHintShown: boolean = false;

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
    this.lastGuidanceTimestamp = Date.now();
    this.playerLostHintShown = false; // reset on any real guidance change
    // Re-arm lost detection so the interval can fire again if the player
    // stalls after this guidance change.
    this.startPlayerLostDetection();
    this.deps.events.emitGuidanceUpdate(enriched);
  }

  private startPlayerLostDetection(): void {
    this.stopPlayerLostDetection();
    this.playerLostTimer = setInterval(() => {
      if (!this.initialized) return;
      if (this.playerLostHintShown) return;

      const snapshot = this.deps.getSnapshot();
      // Only show hint in exploration mode
      const mode = getGameSnapshot().mode;
      if (mode !== 'exploration') return;

      const elapsed = Date.now() - this.lastGuidanceTimestamp;
      if (elapsed >= PLAYER_LOST_TIMEOUT_MS) {
        this.playerLostHintShown = true;
        const act = snapshot.currentAct;
        this.deps.events.emitPlayerLost({
          hint: pickLostHint(act),
          actNumber: act,
        });
        // Interval has served its purpose — stop it to avoid leaking a no-op timer.
        // It will be re-started by emitGuidanceUpdate when guidance changes.
        this.stopPlayerLostDetection();
      }
    }, PLAYER_LOST_TIMEOUT_MS / 2);
  }

  private stopPlayerLostDetection(): void {
    if (this.playerLostTimer !== null) {
      clearInterval(this.playerLostTimer);
      this.playerLostTimer = null;
    }
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

    this.unsubQuestCompleted = eventBus.on('quest:completed', ({ questId }) => {
      if (path.questSpine.includes(questId)) {
        this.advanceQuestSpine(questId);
      }
    });

    this.unsubNpcTalked = eventBus.on('npc:talked', ({ npcId }) => {
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

    this.unsubSceneEnter = eventBus.on('scene:enter', ({ sceneId }) => {
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

    this.unsubGameLoaded = eventBus.on('game:loaded', () => {
      this.resetState();
    });

    this.lastGuidanceTimestamp = Date.now();
    this.startPlayerLostDetection();
    this.emitGuidanceUpdate();
  }

  dispose() {
    if (!this.initialized) return;
    this.initialized = false;

    this.unsubVisitNode?.();
    this.unsubQuestCompleted?.();
    this.unsubNpcTalked?.();
    this.unsubSceneEnter?.();
    this.unsubFlagSet?.();
    this.unsubGameLoaded?.();

    this.unsubVisitNode = null;
    this.unsubQuestCompleted = null;
    this.unsubNpcTalked = null;
    this.unsubSceneEnter = null;
    this.unsubFlagSet = null;
    this.unsubGameLoaded = null;

    this.currentStepIndex = 0;
    this.currentQuestSpineIndex = 0;
    this.lastAdvancedToAct = 0;
    this.lastGuidanceSignature = null;
    this.lastGuidanceTimestamp = 0;
    this.playerLostHintShown = false;
    this.stopPlayerLostDetection();
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

/** Re-arm after orchestrator remount (React StrictMode). Init runs via useGameLifecycleManager. */
export function reviveGuidedStoryManager(): void {
  // If narrative data is already loaded, re-init immediately so game:loaded
  // event subscription is restored. Otherwise init() will be called later
  // by useGameLifecycleManager after narrative preload completes.
  if (isNarrativeGameDataLoaded()) {
    getGuidedStoryManager().init();
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
