import { describe, expect, it, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  getTransitionDirectorSnapshot,
  resetTransitionDirector,
} from './TransitionDirector';
import { TRANSITION_MILESTONES } from '@/shared/constants/transitionTimings';

describe('TransitionDirector', () => {
  beforeEach(() => {
    resetTransitionDirector();
  });

  it('advances progress through scene milestones', () => {
    getTransitionDirectorSnapshot();
    eventBus.emit('scene:transition', {
      targetScene: 'street_night',
      spawnAt: [0, 0, 0] as [number, number, number],
    });
    expect(getTransitionDirectorSnapshot().progress).toBe(TRANSITION_MILESTONES.started);

    eventBus.emit('scene:transition_start', {
      fromSceneId: 'volodka_room',
      targetScene: 'street_night',
      spawnAt: [0, 0, 0],
    });
    expect(getTransitionDirectorSnapshot().progress).toBeGreaterThanOrEqual(
      TRANSITION_MILESTONES.unloading,
    );

    eventBus.emit('scene:enter', {
      sceneId: 'street_night',
      fromSceneId: 'volodka_room',
    });
    expect(getTransitionDirectorSnapshot().progress).toBeGreaterThanOrEqual(
      TRANSITION_MILESTONES.entered,
    );

    eventBus.emit('scene:loaded', {
      sceneId: 'street_night',
      fromSceneId: 'volodka_room',
    });
    expect(getTransitionDirectorSnapshot().phase).toBe('complete');
    expect(getTransitionDirectorSnapshot().progress).toBe(TRANSITION_MILESTONES.loaded);
  });

  it('returns to idle on scene:transition_failed', () => {
    getTransitionDirectorSnapshot();
    eventBus.emit('scene:transition', {
      targetScene: 'street_night',
      spawnAt: [0, 0, 0] as [number, number, number],
    });
    expect(getTransitionDirectorSnapshot().phase).toBe('loading');

    eventBus.emit('scene:transition_failed', { reason: 'Chunk load failed' });
    expect(getTransitionDirectorSnapshot().phase).toBe('idle');
    expect(getTransitionDirectorSnapshot().progress).toBe(0);
    expect(getTransitionDirectorSnapshot().targetScene).toBeNull();
  });
});
