import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  pickPrimaryInteractionTarget,
  queryInteractionTargets,
  scoreInteractionTarget,
} from './interactionTargetQuery';

describe('scoreInteractionTarget', () => {
  const playerPos = new THREE.Vector3(0, 0, 0);

  it('returns null when out of range', () => {
    const target = new THREE.Vector3(0, 0, 10);
    expect(scoreInteractionTarget(playerPos, 0, target, 3)).toBeNull();
  });

  it('prefers targets the player faces', () => {
    const ahead = new THREE.Vector3(0, 0, 2);
    const behind = new THREE.Vector3(0, 0, -2);

    const facing = scoreInteractionTarget(playerPos, 0, ahead, 5)!;
    const back = scoreInteractionTarget(playerPos, 0, behind, 5)!;

    expect(facing.score).toBeLessThan(back.score);
  });
});

describe('queryInteractionTargets', () => {
  const playerPos = new THREE.Vector3(0, 0, 0);

  it('ranks closer zone ahead of farther zone', () => {
    const hits = queryInteractionTargets({
      playerPos,
      playerYaw: 0,
      checkLineOfSight: false,
      zones: [
        {
          id: 'near',
          sceneId: 'cafe_evening',
          position: [0, 0, 1.5],
          size: [2, 1, 2],
          interactionLabel: 'Near',
        },
        {
          id: 'far',
          sceneId: 'cafe_evening',
          position: [0, 0, 2],
          size: [2, 1, 2],
          interactionLabel: 'Far',
        },
      ],
      npcs: [],
    });

    expect(hits[0]?.id).toBe('near');
    expect(hits).toHaveLength(2);
  });

  it('pickPrimaryInteractionTarget returns best hit', () => {
    const primary = pickPrimaryInteractionTarget({
      playerPos,
      playerYaw: 0,
      checkLineOfSight: false,
      zones: [
        {
          id: 'only',
          sceneId: 'cafe_evening',
          position: [0, 0, 1],
          size: [2, 1, 2],
          interactionLabel: 'Only',
        },
      ],
      npcs: [],
    });

    expect(primary?.id).toBe('only');
  });
});
