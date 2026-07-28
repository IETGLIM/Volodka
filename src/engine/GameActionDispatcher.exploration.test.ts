import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dispatchGameAction,
  registerGameActionBridge,
  resetGameActionBridge,
  type GameAction,
  type GameActionBridge,
} from '@/engine/GameActionDispatcher';

describe('GameActionDispatcher exploration actions', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    resetGameActionBridge();
    dispatch.mockReset();
    const bridge: GameActionBridge = {
      dispatch: (action: GameAction) => dispatch(action),
      getSnapshot: () => {
        throw new Error('not used');
      },
      subscribe: () => () => {},
      tryAddItem: () => false,
      tryActivatePoemPower: () => false,
    };
    registerGameActionBridge(bridge);
  });

  it('forwards exploration/toggleInteractiveObject', () => {
    dispatchGameAction({ type: 'exploration/toggleInteractiveObject', id: 'door_1' });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'exploration/toggleInteractiveObject',
      id: 'door_1',
    });
  });

  it('forwards exploration/commitSceneTransition', () => {
    dispatchGameAction({
      type: 'exploration/commitSceneTransition',
      sceneId: 'cafe_evening',
      spawnAt: [1, 0, 2],
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'exploration/commitSceneTransition',
      sceneId: 'cafe_evening',
      spawnAt: [1, 0, 2],
    });
  });

  it('forwards exploration/setNpcStates', () => {
    const npcStates = {
      volodka: { position: [0, 0, 1] as [number, number, number], sceneId: 'volodka_room' as const },
    };
    dispatchGameAction({ type: 'exploration/setNpcStates', npcStates });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'exploration/setNpcStates',
      npcStates,
    });
  });
});
