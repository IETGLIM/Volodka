import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  beginInteractionQueryFrame,
  pickPrimaryInteractionTarget,
  queryInteractionTargets,
  scoreInteractionTarget,
  hasInteractionLineOfSight,
  clearInteractionLineOfSightCache,
} from './interactionTargetQuery';
import {
  registerInteractionQueryContext,
  unregisterInteractionQueryContext,
} from './interactionQueryContext';

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

describe('hasInteractionLineOfSight', () => {
  beforeEach(() => {
    clearInteractionLineOfSightCache();
  });

  afterEach(() => {
    clearInteractionLineOfSightCache();
  });

  it('mutates rapier Ray.dir (not .direction) without throwing', () => {
    class FakeRay {
      origin: { x: number; y: number; z: number };
      dir: { x: number; y: number; z: number };
      constructor(
        origin: { x: number; y: number; z: number },
        dir: { x: number; y: number; z: number },
      ) {
        this.origin = { ...origin };
        this.dir = { ...dir };
      }
    }

    const castRay = vi.fn(() => null);
    const ctx = {
      world: { castRay },
      rapier: { Ray: FakeRay },
    };
    registerInteractionQueryContext(ctx);

    const player = new THREE.Vector3(0, 0, 0);
    const target = new THREE.Vector3(0, 0, 3);
    let clear = true;
    for (let i = 0; i < 6; i++) {
      beginInteractionQueryFrame();
      // Dual query in one frame (prompts + E-key) must not advance the throttle twice.
      queryInteractionTargets({
        playerPos: player,
        playerYaw: 0,
        zones: [],
        npcs: [{ id: 'n', npcId: 'npc', position: [0, 0, 3], label: 'N' }],
        checkLineOfSight: true,
      });
      queryInteractionTargets({
        playerPos: player,
        playerYaw: 0,
        zones: [],
        npcs: [{ id: 'n', npcId: 'npc', position: [0, 0, 3], label: 'N' }],
        checkLineOfSight: true,
      });
      clear = hasInteractionLineOfSight(player, target);
    }

    expect(clear).toBe(true);
    expect(castRay).toHaveBeenCalled();
    unregisterInteractionQueryContext(ctx);
  });
});
