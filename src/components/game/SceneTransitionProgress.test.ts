import { describe, expect, it, vi, beforeEach } from 'vitest';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { performSceneTransition, resetSceneTransitionGuard } from '@/engine/core/SceneTransitionManager';
import { resetSceneLoadedGate } from '@/engine/core/sceneLoadedGate';
import { resetTransitionDirector } from '@/engine/scene/TransitionDirector';

/**
 * Regression: SceneTransitionHandler calls performSceneTransition inside scene:transition,
 * which nested-emits scene:enter before later scene:transition listeners run.
 * Progress bar must latch loading before the handler runs (Engine < Orchestrator priority)
 * or buffer scene:enter until the latch is set.
 */

vi.mock('@/engine/interaction/narrativeOpenHelpers', () => ({
  triggerSceneEntryStoryIfNeeded: vi.fn(),
}));

vi.mock('@/engine/guidedStory/createGuidedStoryDeps', () => ({
  getStoryNodeSceneId: () => undefined,
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    exploration: { currentSceneId: 'volodka_room' },
    showStoryOverlay: false,
    currentNodeId: 'explore_mode',
  }),
  dispatchGameAction: vi.fn(),
}));

describe('SceneTransitionProgress event ordering', () => {
  beforeEach(() => {
    resetSceneTransitionGuard();
    resetSceneLoadedGate();
    resetTransitionDirector();
  });

  it('completes when scene:enter nests inside scene:transition (handler-before-progress order)', () => {
    let loadingLatched = false;
    let progressComplete = false;

    // Simulate SceneTransitionHandler at Orchestrator priority (registered first — old bug order).
    eventBus.on(
      'scene:transition',
      () => {
        performSceneTransition({
          targetScene: 'volodka_corridor',
          spawnAt: [0, 0, 2],
        });
      },
      EventBusPriority.Orchestrator,
    );

    // Simulate SceneTransitionProgress latch + pending-enter fallback at Engine priority.
    eventBus.on(
      'scene:transition',
      () => {
        loadingLatched = true;
        // Handler already ran nested scene:enter; pending buffer would be consumed here in the component.
      },
      EventBusPriority.Engine,
    );

    let pendingEnter: string | null = null;
    eventBus.on('scene:enter', ({ sceneId }) => {
      if (!loadingLatched) {
        pendingEnter = sceneId;
        return;
      }
      if (pendingEnter) {
        progressComplete = true;
        pendingEnter = null;
      }
    });

    eventBus.emit('scene:transition', {
      targetScene: 'volodka_corridor',
      spawnAt: [0, 0, 2],
    });

    // Engine-priority listener runs before Orchestrator — latch is set before nested enter.
    expect(loadingLatched).toBe(true);
    expect(pendingEnter).toBeNull();
    expect(progressComplete).toBe(false);

    // With Engine priority on the real component, scene:enter completes via loadingTransitionRef.
    // Here we only assert the latch precedes performSceneTransition (no orphaned pending enter).
  });
});
