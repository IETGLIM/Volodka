import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  resetTransitionDirector,
  getTransitionDirectorSnapshot,
  disposeTransitionDirector,
  reviveTransitionDirector,
} from '@/engine/scene/TransitionDirector';
import { TRANSITION_MILESTONES } from '@/shared/constants/transitionTimings';

describe('useSceneTransitionOverlayController integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetTransitionDirector();
    getTransitionDirectorSnapshot();
  });

  afterEach(() => {
    disposeTransitionDirector();
    reviveTransitionDirector();
    vi.useRealTimers();
  });

  it('director milestones gate hold until scene:enter progress', () => {
    eventBus.emit('scene:transition', {
      targetScene: 'street_night',
      spawnAt: [0, 0, 0] as [number, number, number],
    });
    expect(getTransitionDirectorSnapshot().phase).toBe('loading');
    expect(getTransitionDirectorSnapshot().progress).toBe(TRANSITION_MILESTONES.started);

    eventBus.emit('scene:enter', {
      sceneId: 'street_night',
      fromSceneId: 'volodka_room',
    });
    expect(getTransitionDirectorSnapshot().progress).toBeGreaterThanOrEqual(
      TRANSITION_MILESTONES.entered,
    );
  });

  it('dispose and revive re-subscribes director to bus events', () => {
    disposeTransitionDirector();
    reviveTransitionDirector();

    eventBus.emit('scene:transition', {
      targetScene: 'cafe_evening',
      spawnAt: [0, 0, 0] as [number, number, number],
    });
    expect(getTransitionDirectorSnapshot().phase).toBe('loading');
    expect(getTransitionDirectorSnapshot().targetScene).toBe('cafe_evening');
  });
});
