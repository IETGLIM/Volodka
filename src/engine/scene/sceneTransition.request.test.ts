import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  bindSceneTransitionRequestListener,
  unbindSceneTransitionRequestListener,
} from '@/engine/scene/sceneTransition';

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    exploration: {
      currentSceneId: 'volodka_room',
      playerPosition: [0, 0, 0] as [number, number, number],
      timeOfDay: 12,
    },
  }),
}));

describe('scene:request_transition listener', () => {
  beforeEach(() => {
    unbindSceneTransitionRequestListener();
    bindSceneTransitionRequestListener();
  });

  it('forwards to scene:transition with resolved spawn', () => {
    const transitions: Array<{
      targetScene: string;
      spawnAt: [number, number, number];
    }> = [];

    const unsub = eventBus.on('scene:transition', (payload) => {
      transitions.push(payload);
    });

    eventBus.emit('scene:request_transition', {
      targetScene: 'cafe_evening',
      spawnAt: [3, 0, 4],
    });

    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toEqual({
      targetScene: 'cafe_evening',
      spawnAt: [3, 0, 4],
    });

    unsub();
  });
});
