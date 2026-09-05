import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DialogueChoice } from '@/shared/types/game';
import { executeDialogueChoice } from './narrativeChoiceExecutor';
import {
  mergeStoryNodesIntoCacheForTests,
  mergeDialogueNodesIntoCacheForTests,
} from '@/data/narrative/narrativePackRegistry';

/* ── Моки внешних сайд-эффектов ── */
const openNarrativeOverlay = vi.fn();
const closeNarrativeOverlay = vi.fn();
const closeDiegeticNarrative = vi.fn();
const presentNarrativeBeat = vi.fn();
const applyEffects = vi.fn();
const dispatchGameAction = vi.fn();

vi.mock('@/engine/AudioEngine', () => ({
  audioEngine: { playSfx: vi.fn() },
}));
vi.mock('@/engine/scene/narrativeOverlay', () => ({
  openNarrativeOverlay: (...args: unknown[]) => openNarrativeOverlay(...args),
  closeNarrativeOverlay: (...args: unknown[]) => closeNarrativeOverlay(...args),
  closeDiegeticNarrative: (...args: unknown[]) => closeDiegeticNarrative(...args),
}));
vi.mock('@/engine/narrative/presentNarrativeBeat', () => ({
  presentNarrativeBeat: (...args: unknown[]) => presentNarrativeBeat(...args),
}));
vi.mock('@/shared/utils/applyEffects', () => ({
  applyEffects: (...args: unknown[]) => applyEffects(...args),
}));
vi.mock('@/engine/GameActionDispatcher', () => ({
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
  getGameSnapshot: () => ({ exploration: { currentSceneId: 'street_night' } }),
}));
vi.mock('@/engine/scene/sceneTransition', () => ({
  requestSceneTransitionForStoryNode: vi.fn(),
}));
vi.mock('@/engine/scene/freeExplorationHub', () => ({
  enterSceneFreeExplorationHub: vi.fn(),
}));
vi.mock('@/shared/sceneExploreHubRegistry', () => ({
  isClosedOverlayExploreHub: () => false,
  resolveExploreHubNavigation: () => ({ action: 'close' }),
}));
vi.mock('@/shared/exploreHubNodes', () => ({
  EXPLORE_HUB_NODE_IDS: new Set<string>(['cafe_explore_mode']),
}));
vi.mock('@/engine/narrative/narrativePresentationPolicy', () => ({
  isAct1DiegeticStoryNode: () => false,
}));

/**
 * Регрессия на два видимых бага перекрёстных реестров:
 * 1) хуки приветствий с next → story-узел открывались с kind='dialogue' —
 *    DialogueRenderer не находил узел и показывал ошибку загрузки;
 * 2) хуки с next:null + visitStoryNode закрывали оверлей, не показывая
 *    story-узел (вступление квеста терялось, старт-флаги не выставлялись).
 */
describe('narrativeChoiceExecutor — cross-registry hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mergeStoryNodesIntoCacheForTests(
      {
        aaa_maria_lost_diary_start: {
          id: 'aaa_maria_lost_diary_start',
          text: 'вступление',
          sceneId: 'cafe_evening',
          choices: [],
        },
      },
      'act-test',
    );
    mergeDialogueNodesIntoCacheForTests(
      {
        maria_dialogue: {
          id: 'maria_dialogue',
          speaker: 'Мария',
          text: 'привет',
          choices: [],
        },
      },
      'part-test',
    );
  });

  it('хук next → story-узел открывает оверлей с kind="story"', () => {
    const choice: DialogueChoice = {
      text: 'Расскажи про дневник',
      next: 'aaa_maria_lost_diary_start',
    };
    executeDialogueChoice(choice);

    expect(openNarrativeOverlay).toHaveBeenCalledWith(
      'aaa_maria_lost_diary_start',
      'story',
    );
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
  });

  it('хук next → dialogue-узел сохраняет kind="dialogue"', () => {
    const choice: DialogueChoice = {
      text: 'Вернуться к разговору',
      next: 'maria_dialogue',
    };
    executeDialogueChoice(choice);

    expect(openNarrativeOverlay).toHaveBeenCalledWith('maria_dialogue', 'dialogue');
  });

  it('хук next:null + visitStoryNode продолжает story-узлом, а не закрывает', () => {
    const choice: DialogueChoice = {
      text: 'Научи меня — код и стихи одно?',
      next: null,
      effects: [
        { type: 'visitStoryNode', nodeId: 'aaa_maria_lost_diary_start' },
        { type: 'triggerQuest', questId: 'aaa_maria_lost_diary' },
      ],
    };
    executeDialogueChoice(choice);

    expect(presentNarrativeBeat).toHaveBeenCalledWith(
      'aaa_maria_lost_diary_start',
      'story',
    );
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
  });

  it('обычный выбор next:null без visitStoryNode закрывает оверлей', () => {
    const choice: DialogueChoice = { text: 'Пойду я.', next: null };
    executeDialogueChoice(choice);

    expect(closeNarrativeOverlay).toHaveBeenCalledTimes(1);
    expect(presentNarrativeBeat).not.toHaveBeenCalled();
  });
});
