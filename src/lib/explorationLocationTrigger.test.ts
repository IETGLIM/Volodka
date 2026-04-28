import { describe, expect, it } from 'vitest';
import { applyExplorationLocationTrigger } from '@/lib/explorationLocationTrigger';
import type { ExplorationState, TriggerZone } from '@/data/rpgTypes';
import { PLAYER_FEET_SPAWN_Y } from '@/lib/playerScaleConstants';

const baseEx = (): ExplorationState => ({
  playerPosition: { x: 2, y: PLAYER_FEET_SPAWN_Y, z: 1.5, rotation: 0.1 },
  currentSceneId: 'volodka_room',
  timeOfDay: 20,
  npcStates: {},
  triggerStates: {},
  worldItems: [],
  exploredAreas: [],
  lastSceneTransition: 0,
  cameraOrbitResyncNonce: 0,
});

describe('applyExplorationLocationTrigger', () => {
  it('enters dream and stores wake return snapshot', () => {
    const ex = baseEx();
    const trigger: TriggerZone = {
      id: 't',
      position: { x: 0, y: 0, z: 0 },
      size: { x: 1, y: 1, z: 1 },
      sceneId: 'volodka_room',
      type: 'location',
      targetSceneId: 'dream',
      targetPosition: { x: 0, y: 1, z: 0 },
    };
    const next = applyExplorationLocationTrigger(ex, trigger, 99);
    expect(next.currentSceneId).toBe('dream');
    expect(next.dreamWakeReturn?.sceneId).toBe('volodka_room');
    expect(next.lastSceneTransition).toBe(99);
  });

  it('wakes from dream to saved scene', () => {
    const ex: ExplorationState = {
      ...baseEx(),
      currentSceneId: 'dream',
      dreamWakeReturn: {
        sceneId: 'volodka_room',
        position: { x: -1, y: PLAYER_FEET_SPAWN_Y, z: 0.5, rotation: 0 },
      },
    };
    const trigger: TriggerZone = {
      id: 'wake',
      position: { x: 0, y: 0, z: 0 },
      size: { x: 1, y: 1, z: 1 },
      sceneId: 'dream',
      type: 'location',
      targetSceneId: 'kitchen_night',
    };
    const next = applyExplorationLocationTrigger(ex, trigger, 100);
    expect(next.currentSceneId).toBe('volodka_room');
    expect(next.dreamWakeReturn).toBeUndefined();
  });
});
