import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { enterSceneFreeExplorationHub } from './freeExplorationHub';
import { EXPLORATION_HUD_HANDOFF } from '@/shared/constants/transitionTimings';
import { loadSceneExploreHubs, loadStoryPack } from '@/data/narrative/narrativePackRegistry';

// Резолвер прозы хабов читает ленивый кэш narrative-паков (eager-фолбэк
// убран из бандла в v4.21) — в bootstrap-порядке act-паки и хабы грузятся
// до входа в хаб; тест повторяет тот же порядок вместо статического графа.
beforeAll(async () => {
  await Promise.all([loadStoryPack('act1'), loadSceneExploreHubs()]);
});

const dispatchGameAction = vi.fn();
const closeNarrativeOverlay = vi.fn();
const eventBusEmit = vi.fn();

let mockSnapshot = {
  currentNodeId: 'start',
  playerState: { visitedNodes: [] as string[] },
};

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => mockSnapshot,
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

vi.mock('@/engine/scene/narrativeOverlay', () => ({
  closeNarrativeOverlay: () => closeNarrativeOverlay(),
  closeDiegeticNarrative: vi.fn(),
}));

vi.mock('@/engine/interaction/interactionEndDedup', () => ({
  forceEmitInteractionEnd: vi.fn(),
}));

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    on: vi.fn(),
    emit: (...args: unknown[]) => eventBusEmit(...args),
  },
}));

vi.mock('@/store/visitedNodesIndex', () => ({
  hasVisitedNode: (visited: string[], nodeId: string) => visited.includes(nodeId),
}));

describe('enterSceneFreeExplorationHub', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dispatchGameAction.mockClear();
    closeNarrativeOverlay.mockClear();
    eventBusEmit.mockClear();
    mockSnapshot = {
      currentNodeId: 'start',
      playerState: { visitedNodes: [] },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('closes overlay and shows location context on first visit', () => {
    enterSceneFreeExplorationHub('explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'explore_mode',
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/visitNode',
      nodeId: 'explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );

    vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS);
    // FIX v4.46: у volodka_room есть entryText — титр-карту входа показывает
    // SceneEntryTextOverlay, дубль-уведомление хаба подавлено.
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );
  });

  it('v4.46: first-visit hub toast suppressed when scene has entryText (rooftop)', () => {
    // Все игровые сцены определяют entryText — титр-карту входа показывает
    // SceneEntryTextOverlay; дубль-уведомление хаба подавляется всегда.
    // Этот тест фиксирует контракт: если у сцены есть entryText — тоста нет.
    enterSceneFreeExplorationHub('rooftop_explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'rooftop_explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS);
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );
  });

  it('shows shorter revisit message when hubTextRevisit is set', () => {
    mockSnapshot.playerState.visitedNodes = ['explore_mode'];
    enterSceneFreeExplorationHub('explore_mode');

    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS);
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );
    expect(eventBusEmit).toHaveBeenCalledWith('ui:exploration_message', {
      text: expect.stringContaining('Комната'),
    });
  });

  it('supports home_evening closed-overlay hub (entryText dedupe v4.46)', () => {
    enterSceneFreeExplorationHub('home_evening_explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'home_evening_explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS);
    // home_evening имеет entryText («Тёплый свет…») — дубль-тост подавлен.
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );
  });

  it('supports Act II closed-overlay hubs (entryText dedupe v4.46)', () => {
    enterSceneFreeExplorationHub('cafe_explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'cafe_explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS);
    // cafe_evening имеет entryText («Кофе, синий свет…») — дубль-тост подавлен.
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );
  });

  it('supports Act III closed-overlay hubs (entryText dedupe v4.46)', () => {
    enterSceneFreeExplorationHub('park_explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'park_explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS);
    // park_day имеет entryText («Листва шуршит…») — дубль-тост подавлен.
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );
  });

  it('ignores unknown hub ids', () => {
    enterSceneFreeExplorationHub('not_a_real_hub');
    expect(dispatchGameAction).not.toHaveBeenCalled();
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
  });
});
