import { describe, expect, it } from 'vitest';
import {
  buildNpcAvoidanceObstacles,
  filterNpcObstacles,
  obstacleToAabb,
  rayAabbIntersect,
  resolveNpcObstacleAvoidance,
} from '@/engine/npc/npcObstacleAvoidance';
import type { ColliderDef } from '@/shared/types/sceneDefinition';

function makeObstacle(
  size: [number, number, number],
  position: [number, number, number],
  rotation?: number,
): ColliderDef {
  return { type: 'cuboidObstacle', size, position, rotation };
}

describe('obstacleToAabb', () => {
  it('converts an axis-aligned obstacle to an AABB', () => {
    const aabb = obstacleToAabb(makeObstacle([1, 1, 2], [5, 0, 3]));
    expect(aabb).toEqual({ minX: 4, maxX: 6, minZ: 1, maxZ: 5 });
  });

  it('swaps half-extents for a quarter-turn rotation', () => {
    const aabb = obstacleToAabb(makeObstacle([1, 1, 2], [0, 0, 0], Math.PI / 2));
    // After 90° rotation, half-width = 2 (was depth), half-depth = 1 (was width).
    expect(aabb).toEqual({ minX: -2, maxX: 2, minZ: -1, maxZ: 1 });
  });

  it('treats 0 rotation as axis-aligned', () => {
    const aabb = obstacleToAabb(makeObstacle([1, 1, 1], [0, 0, 0], 0));
    expect(aabb).toEqual({ minX: -1, maxX: 1, minZ: -1, maxZ: 1 });
  });
});

describe('rayAabbIntersect', () => {
  const box = { minX: 2, maxX: 4, minZ: 2, maxZ: 4 };

  it('hits a box directly ahead and returns the -X normal', () => {
    // Ray from (0, 3) going +X — hits minX face at t=2, normal (-1, 0).
    const hit = rayAabbIntersect(0, 3, 1, 0, box);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBe(2);
    expect(hit!.normalX).toBe(-1);
    expect(hit!.normalZ).toBe(0);
  });

  it('hits the -Z face when approaching from below', () => {
    const hit = rayAabbIntersect(3, 0, 0, 1, box);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBe(2);
    expect(hit!.normalZ).toBe(-1);
  });

  it('returns null when the ray misses the box', () => {
    const hit = rayAabbIntersect(0, 10, 1, 0, box);
    expect(hit).toBeNull();
  });

  it('returns null for a parallel ray outside the slab', () => {
    // Ray going +X but Z is outside the box.
    const hit = rayAabbIntersect(0, 5, 1, 0, box);
    expect(hit).toBeNull();
  });
});

describe('resolveNpcObstacleAvoidance', () => {
  it('passes through unchanged when no obstacles', () => {
    const result = resolveNpcObstacleAvoidance(0, 0, 1, 0, []);
    expect(result.avoided).toBe(false);
    expect(result.dirX).toBe(1);
    expect(result.dirZ).toBe(0);
    expect(result.speedScale).toBe(1);
  });

  it('steers around a wall directly ahead', () => {
    // Wall centered at (1.5, 0), half-extents 0.5x0.5 — blocks +X path.
    const wall = obstacleToAabb(makeObstacle([0.5, 2, 0.5], [1.5, 0, 0]));
    const result = resolveNpcObstacleAvoidance(0, 0, 1, 0, [wall], 1.5);
    expect(result.avoided).toBe(true);
    // Steered direction should have a Z component (perpendicular to the wall normal).
    expect(Math.abs(result.dirZ)).toBeGreaterThan(0.3);
    expect(result.speedScale).toBeLessThanOrEqual(1);
  });

  it('does not steer when the obstacle is far away', () => {
    const wall = obstacleToAabb(makeObstacle([1, 2, 1], [10, 0, 0]));
    const result = resolveNpcObstacleAvoidance(0, 0, 1, 0, [wall], 1.5);
    expect(result.avoided).toBe(false);
  });

  it('reduces speed when the path is blocked', () => {
    const wall = obstacleToAabb(makeObstacle([1, 2, 1], [1.5, 0, 0]));
    const result = resolveNpcObstacleAvoidance(0, 0, 1, 0, [wall], 1.5);
    expect(result.avoided).toBe(true);
    expect(result.speedScale).toBeLessThan(1);
  });
});

describe('filterNpcObstacles', () => {
  it('keeps tall obstacles and drops low props', () => {
    const obstacles: ColliderDef[] = [
      makeObstacle([1, 2, 1], [0, 0, 0]), // tall wall — keep
      makeObstacle([1, 0.2, 1], [2, 0, 0]), // low prop — drop
      makeObstacle([1, 1, 1], [4, 0, 0]), // medium — keep
    ];
    const aabbs = filterNpcObstacles(obstacles);
    expect(aabbs).toHaveLength(2);
  });

  it('ignores non-cuboidObstacle collider types', () => {
    const obstacles: ColliderDef[] = [
      { type: 'cuboid', size: [1, 2, 1], position: [0, 0, 0] },
      makeObstacle([1, 2, 1], [2, 0, 0]),
    ];
    const aabbs = filterNpcObstacles(obstacles);
    expect(aabbs).toHaveLength(1);
  });
});

describe('buildNpcAvoidanceObstacles', () => {
  it('merges walls and obstacles from a scene definition', () => {
    const scene = {
      walls: [makeObstacle([5, 3, 0.1], [0, 0, 0])],
      obstacles: [makeObstacle([1, 1, 1], [2, 0, 0])],
    };
    const aabbs = buildNpcAvoidanceObstacles(scene);
    expect(aabbs).toHaveLength(2);
  });

  it('returns empty array when scene has no colliders', () => {
    expect(buildNpcAvoidanceObstacles({})).toEqual([]);
  });
});
