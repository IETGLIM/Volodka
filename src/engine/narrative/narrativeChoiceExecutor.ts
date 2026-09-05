import { audioEngine } from '@/engine/AudioEngine';
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import {
  closeDiegeticNarrative,
  closeNarrativeOverlay,
  openNarrativeOverlay,
} from '@/engine/scene/narrativeOverlay';
import { presentNarrativeBeat } from '@/engine/narrative/presentNarrativeBeat';
import {
  isClosedOverlayExploreHub,
  resolveExploreHubNavigation,
} from '@/shared/sceneExploreHubRegistry';
import { EXPLORE_HUB_NODE_IDS } from '@/shared/exploreHubNodes';
import { isAct1DiegeticStoryNode } from '@/engine/narrative/narrativePresentationPolicy';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import { requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { guessNarrativeKind } from '@/engine/narrative/narrativeKindResolution';
import type { DialogueChoice, StoryChoice, StoryEffect } from '@/shared/types/game';
import { applyEffects } from '@/shared/utils/applyEffects';
import type { SceneId } from '@/shared/types/game';

export interface StoryChoiceExecutorContext {
  currentNodeId: string;
  nodeSceneId?: SceneId;
  onAppliedEffects?: (effects: StoryEffect[]) => void;
}

/** Guard against rapid double-click on story choices. */
let choiceExecutionInFlight = false;

/** Guard against rapid double-click on dialogue choices. */
let dialogueChoiceExecutionInFlight = false;

/** Первый visitStoryNode-эффект в списке эффектов (для хуков с next:null). */
function extractVisitedStoryNodeId(
  effects?: readonly StoryEffect[],
): string | undefined {
  const visit = effects?.find(
    (fx) => fx.type === 'visitStoryNode' && typeof fx.nodeId === 'string' && fx.nodeId,
  );
  return visit?.nodeId as string | undefined;
}

/** Execute a story node choice — shared by StoryRenderer and DiegeticDialogueHud. */
export function executeStoryChoice(
  choice: StoryChoice,
  ctx: StoryChoiceExecutorContext,
): void {
  // NAR-2: Prevent rapid double-click from dispatching conflicting state.
  // React re-renders the choice list asynchronously, so a fast double-click
  // could fire two choices before the list updates, causing conflicting
  // setCurrentNodeId / applyEffects / scene transitions.
  if (choiceExecutionInFlight) return;
  choiceExecutionInFlight = true;
  // Release guard on next microtask (after all synchronous dispatches complete
  // and React has processed the state updates).
  queueMicrotask(() => { choiceExecutionInFlight = false; });

  audioEngine.playSfx('confirm');
  const transitionsScene =
    choice.effects?.some((fx) => fx.type === 'transitionScene') ?? false;

  // Phase 12: Record every choice for consequence tracking.
  dispatchGameAction({ type: 'player/logChoice', nodeId: ctx.currentNodeId, choiceText: choice.text, kind: 'story' });
  // Auto-detect moral choices: any choice that modifies karma or NPC relations.
  const hasMoralWeight = choice.effects?.some(
    (fx) => fx.type === 'addKarma' || (fx.type === 'npcChange' && fx.npcChange?.relation)
  );
  if (hasMoralWeight) {
    dispatchGameAction({ type: 'player/logMoralChoice', nodeId: ctx.currentNodeId, choiceText: choice.text });
  }

  if (choice.effects) {
    if (transitionsScene) {
      // Race #15: apply effects (including requestSceneTransition) BEFORE closing
      // the overlay. Previously the overlay was closed first, then effects applied.
      // If applyEffects triggered a scene transition, the interactionSession could
      // reset the FSM during the gap, leaving currentNodeId pointing to the next
      // node but no overlay open — a "dead" narrative state.
      if (choice.next) {
        dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: choice.next });
      }
      applyEffects(choice.effects);
      ctx.onAppliedEffects?.(choice.effects);
      // Close overlay after effects are dispatched so React sees consistent state.
      closeNarrativeOverlay();
      closeDiegeticNarrative();
      return; // Prevent fall-through to explore-hub or next-node branch
    } else {
      applyEffects(choice.effects);
      ctx.onAppliedEffects?.(choice.effects);
    }
  }

  if (choice.next === null) {
    // Cross-registry fix (visitStoryNode): хуки с next:null + visitStoryNode
    // (albert_greeting: уроки Альберта, friday-мост, ночной обход) должны
    // продолжаться story-узлом, а не закрывать оверлей — иначе вступление
    // не показывается, а флаги старта из его выборов не выставляются.
    const visitedNodeId = extractVisitedStoryNodeId(choice.effects);
    if (visitedNodeId) {
      presentNarrativeBeat(visitedNodeId, guessNarrativeKind(visitedNodeId) ?? 'story');
      return;
    }
    closeNarrativeOverlay();
    closeDiegeticNarrative();
  } else if (choice.next && EXPLORE_HUB_NODE_IDS.has(choice.next)) {
    const resolved = resolveExploreHubNavigation(
      ctx.currentNodeId,
      ctx.nodeSceneId,
      choice.next,
    );
    if (resolved.action === 'navigate') {
      if (isClosedOverlayExploreHub(resolved.hubId)) {
        enterSceneFreeExplorationHub(resolved.hubId);
      } else {
        dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: resolved.hubId });
      }
    } else {
      closeNarrativeOverlay();
      closeDiegeticNarrative();
    }
  } else if (choice.next && !transitionsScene) {
    if (choice.next === 'start') {
      dispatchGameAction({
        type: 'game/resetForNewPlaythrough',
        preserveAchievements: true,
        skipIntro: true,
      });
      openNarrativeOverlay('start', 'story');
      return;
    }
    if (isAct1DiegeticStoryNode(choice.next)) {
      presentNarrativeBeat(choice.next, 'story');
    } else {
      dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: choice.next });
      // Cross-registry fix: выбор story-узла может вести в диалоговый узел
      // (хуки приветствий живут в диалогах и наоборот). Если однозначно
      // известно, в каком реестре лежит цель — открываем оверлей с её kind,
      // иначе рендер не найдёт узел и покажет ошибку загрузки.
      const kind = guessNarrativeKind(choice.next) ?? 'story';
      openNarrativeOverlay(choice.next, kind);
    }
  }
}

/** Execute a dialogue node choice — shared by DialogueRenderer and DiegeticDialogueHud. */
export function executeDialogueChoice(choice: DialogueChoice): void {
  if (dialogueChoiceExecutionInFlight) return;
  dialogueChoiceExecutionInFlight = true;
  queueMicrotask(() => { dialogueChoiceExecutionInFlight = false; });

  audioEngine.playSfx('confirm');

  const transitionsScene =
    choice.effects?.some((fx) => fx.type === 'transitionScene') ?? false;

  // Phase 12: Record every dialogue choice for consequence tracking.
  dispatchGameAction({ type: 'player/logChoice', nodeId: 'dialogue', choiceText: choice.text, kind: 'dialogue' });
  const hasMoralWeight = choice.effects?.some(
    (fx) => fx.type === 'addKarma' || (fx.type === 'npcChange' && fx.npcChange?.relation)
  );
  if (hasMoralWeight) {
    dispatchGameAction({ type: 'player/logMoralChoice', nodeId: 'dialogue', choiceText: choice.text });
  }

  if (choice.effects) {
    if (transitionsScene) {
      // Race #15 (dialogue mirror): apply effects (including requestSceneTransition)
      // BEFORE closing the overlay, same pattern as executeStoryChoice.
      // If the overlay closes first, the interactionSession could reset the FSM
      // during the gap, leaving currentNodeId set but no overlay open.
      if (choice.next) {
        dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: choice.next });
      }
      applyEffects(choice.effects);
      // Close overlay after effects are dispatched so React sees consistent state.
      closeNarrativeOverlay();
      closeDiegeticNarrative();
      return; // Prevent fall-through to next-node navigation
    } else {
      applyEffects(choice.effects);
    }
  }

  if (choice.next === null) {
    // Cross-registry fix (visitStoryNode): зеркально story-пути — хук с
    // next:null + visitStoryNode продолжает повествование story-узлом.
    const visitedNodeId = extractVisitedStoryNodeId(choice.effects);
    if (visitedNodeId) {
      presentNarrativeBeat(visitedNodeId, guessNarrativeKind(visitedNodeId) ?? 'story');
      return;
    }
    closeNarrativeOverlay();
    closeDiegeticNarrative();
  } else if (choice.next && !transitionsScene) {
    if (isAct1DiegeticStoryNode(choice.next)) {
      presentNarrativeBeat(choice.next, 'dialogue');
    } else {
      dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: choice.next });
      // Cross-registry fix: хуки в приветствиях NPC ведут прямо в story-узлы
      // (next: 'aaa_*_start'). Открываем оверлей с kind цели — иначе
      // DialogueRenderer будет искать story-узел в диалоговых паках и
      // покажет игроку ошибку загрузки вместо вступления квеста.
      const kind = guessNarrativeKind(choice.next) ?? 'dialogue';
      openNarrativeOverlay(choice.next, kind);
    }
  }
}

/** Apply story node mount effects (visit, scene sync, sfx). */
export function applyStoryNodeMountEffects(node: {
  id: string;
  sceneId?: string;
  effects?: StoryEffect[];
  autoSave?: boolean;
  accessibilityAnnounce?: string;
  soundEffect?: string;
  musicCue?: string;
  speaker?: string;
}): void {
  dispatchGameAction({ type: 'story/visitNode', nodeId: node.id });
  const snapshot = getGameSnapshot();
  if (node.sceneId && snapshot.exploration.currentSceneId !== node.sceneId) {
    requestSceneTransitionForStoryNode(node.id, node.sceneId);
  }
  if (node.effects?.length) {
    applyEffects(node.effects);
  }
  if (node.autoSave) {
    dispatchGameAction({ type: 'game/save', source: 'auto' });
  }
}

/** Apply dialogue node mount effects. */
export function applyDialogueNodeMountEffects(node: {
  id: string;
  sceneId?: string;
  effects?: StoryEffect[];
  speaker?: string;
  speakerId?: string;
}): void {
  dispatchGameAction({ type: 'story/visitNode', nodeId: node.id });
  const snapshot = getGameSnapshot();
  if (node.sceneId && snapshot.exploration.currentSceneId !== node.sceneId) {
    requestSceneTransitionForStoryNode(node.id, node.sceneId);
  }
  if (node.effects?.length) {
    applyEffects(node.effects);
  }
}