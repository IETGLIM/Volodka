import { describe, expect, it } from 'vitest';
import {
  CREEP_STUCK_MIN_DISTANCE,
  CREEP_STUCK_WINDOW_S,
  computeCreepNavPath,
  createCreepStuckTracker,
  filterVisionBlockers,
  hasCreepLineOfSight,
  isPlayerBeyondLeash,
  isWithinRangedEngageBand,
  nearestWaypointIndex,
  resolveCreepNavMesh,
  resolveKiteMove,
  resolveRetreatDirection,
  segmentIntersectsAabb,
  updateCreepStuckTracker,
} from '@/engine/npc/creepTactics';
import { getEnemyAiConfig } from '@/engine/combat/enemyAiBehaviors';
import type { NavMeshCell, NavMeshGraph } from '@/engine/npc/navMeshBuilder';
import type { ColliderDef } from '@/shared/types/sceneDefinition';

function makeObstacle(
  size: [number, number, number],
  position: [number, number, number],
  rotation?: number,
): ColliderDef {
  return { type: 'cuboidObstacle', size, position, rotation };
}

/* ─── Hand-built nav graphs (L-shaped corridor) ─── */

const cellKey = (gx: number, gz: number): string => `${gx},${gz}`;

function makeCell(gx: number, gz: number, neighbors: string[]): NavMeshCell {
  return {
    x: gx,
    z: gz,
    gridX: gx,
    gridZ: gz,
    walkable: true,
    cost: 1,
    neighbors,
  };
}

/** L-shaped 4-connected corridor: (0,0)→(0,1)→(0,2)→(1,2)→(2,2). */
function makeLGraph(withBridge = true): NavMeshGraph {
  const cells = new Map<string, NavMeshCell>();
  const link = (a: [number, number], b: [number, number]) => {
    cells.get(cellKey(a[0], a[1]))!.neighbors.push(cellKey(b[0], b[1]));
    cells.get(cellKey(b[0], b[1]))!.neighbors.push(cellKey(a[0], a[1]));
  };
  cells.set(cellKey(0, 0), makeCell(0, 0, []));
  cells.set(cellKey(0, 1), makeCell(0, 1, []));
  cells.set(cellKey(0, 2), makeCell(0, 2, []));
  cells.set(cellKey(2, 2), makeCell(2, 2, []));
  if (withBridge) cells.set(cellKey(1, 2), makeCell(1, 2, []));

  link([0, 0], [0, 1]);
  link([0, 1], [0, 2]);
  if (withBridge) {
    link([0, 2], [1, 2]);
    link([1, 2], [2, 2]);
  }

  return {
    cells,
    width: 3,
    depth: 3,
    cellSize: 1,
    sceneId: 'test',
    originX: -0.5,
    originZ: -0.5,
  };
}

/* ─── Segment vs AABB (slab method) ─── */

describe('segmentIntersectsAabb', () => {
  const box = { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };

  it('detects a segment crossing straight through the box', () => {
    expect(segmentIntersectsAabb(-3, 0, 3, 0, box)).toBe(true);
  });

  it('detects a diagonal crossing', () => {
    expect(segmentIntersectsAabb(-2, -2, 2, 2, box)).toBe(true);
  });

  it('misses when the segment passes above the box', () => {
    expect(segmentIntersectsAabb(-3, 2, 3, 2, box)).toBe(false);
  });

  it('misses when the segment would hit the box but stops short', () => {
    // Line aims at the box but the segment ends before reaching it.
    expect(segmentIntersectsAabb(-4, 0, -2, 0, box)).toBe(false);
  });

  it('treats a segment fully inside the box as blocked', () => {
    expect(segmentIntersectsAabb(-0.5, 0, 0.5, 0, box)).toBe(true);
  });

  it('misses for a ray parallel to and outside the slab', () => {
    expect(segmentIntersectsAabb(-3, 3, 3, 3, box)).toBe(false);
  });

  it('treats a segment touching the face as blocked', () => {
    // Endpoint exactly on the Z face of the box.
    expect(segmentIntersectsAabb(0, -3, 0, -1, box)).toBe(true);
  });
});

/* ─── Line of sight ─── */

describe('hasCreepLineOfSight', () => {
  it('is clear when there are no blockers', () => {
    expect(hasCreepLineOfSight(-5, 0, 5, 0, [])).toBe(true);
  });

  it('is blocked by a wall between creep and player', () => {
    const wall = { minX: -0.2, maxX: 0.2, minZ: -2, maxZ: 2 };
    expect(hasCreepLineOfSight(-5, 0, 5, 0, [wall])).toBe(false);
  });

  it('is clear when the wall is off to the side', () => {
    const wall = { minX: 3, maxX: 4, minZ: 3, maxZ: 4 };
    expect(hasCreepLineOfSight(-5, 0, 5, 0, [wall])).toBe(true);
  });

  it('is blocked by the first wall that crosses the sight line', () => {
    const farWall = { minX: 4, maxX: 4.5, minZ: -1, maxZ: 1 };
    const nearWall = { minX: -4.5, maxX: -4, minZ: -1, maxZ: 1 };
    expect(hasCreepLineOfSight(-5, 0, 5, 0, [farWall, nearWall])).toBe(false);
  });
});

/* ─── Vision blocker filtering ─── */

describe('filterVisionBlockers', () => {
  it('keeps walls and tall props but drops low props', () => {
    const scene = {
      walls: [makeObstacle([2.5, 1.5, 0.1], [0, 1.5, -3.5])], // 3 m wall — blocks
      obstacles: [
        makeObstacle([0.4, 1.0, 0.2], [1.65, 1.0, -2.55]), // 2 m bookshelf — blocks
        makeObstacle([0.925, 0.375, 0.41], [0, 0.375, -2.5]), // 0.75 m desk — no
        makeObstacle([0.7, 0.3, 1.0], [1.78, 0.3, 2.05]), // 0.6 m bed — no
      ],
    };
    const blockers = filterVisionBlockers(scene);
    expect(blockers).toHaveLength(2);
  });

  it('ignores non-cuboidObstacle collider types', () => {
    const cuboid: ColliderDef = { type: 'cuboid', size: [5, 3, 1], position: [0, 0, 0] };
    const scene = {
      walls: [cuboid, makeObstacle([5, 3, 1], [0, 0, 5])],
    };
    expect(filterVisionBlockers(scene)).toHaveLength(1);
  });

  it('swaps half-extents for quarter-turned walls', () => {
    const scene = {
      walls: [makeObstacle([3.5, 1.5, 0.1], [2.5, 1.5, 0], Math.PI / 2)],
    };
    const [aabb] = filterVisionBlockers(scene);
    // Half-width was 0.1 (depth), half-depth 3.5 (width) after the 90° turn.
    expect(aabb.minX).toBeCloseTo(2.4);
    expect(aabb.maxX).toBeCloseTo(2.6);
    expect(aabb.minZ).toBeCloseTo(-3.5);
    expect(aabb.maxZ).toBeCloseTo(3.5);
  });

  it('returns empty for scenes without colliders', () => {
    expect(filterVisionBlockers({})).toEqual([]);
  });
});

/* ─── Leash (WoW-style) ─── */

describe('isPlayerBeyondLeash', () => {
  it('is false at exactly the leash range (strictly greater wins)', () => {
    expect(isPlayerBeyondLeash(0, 0, 20, 0, 20)).toBe(false);
  });

  it('is true when the player fled beyond the leash range', () => {
    expect(isPlayerBeyondLeash(0, 0, 20.5, 0, 20)).toBe(true);
  });

  it('measures from the chase origin, not the creep', () => {
    // Origin (0,0), leash 15: player at 16 → beyond, even if close to a creep at (10,0).
    expect(isPlayerBeyondLeash(0, 0, 16, 0, 15)).toBe(true);
    expect(isPlayerBeyondLeash(10, 0, 16, 0, 15)).toBe(false);
  });

  it('uses diagonal distance', () => {
    expect(isPlayerBeyondLeash(0, 0, 4, 3, 5)).toBe(false); // exactly 5 — not beyond
    expect(isPlayerBeyondLeash(0, 0, 7, 8, 10)).toBe(true); // ≈10.63 > 10
  });
});

/* ─── Ranged kiting ─── */

describe('resolveKiteMove', () => {
  const strelkov = getEnemyAiConfig('ranged_strelkov');
  const drone = getEnemyAiConfig('censor_drone');
  const melee = getEnemyAiConfig('system_daemon');

  it('ranged_strelkov retreats when crowded (under 5 m)', () => {
    expect(strelkov.kitingEnabled).toBe(true);
    expect(resolveKiteMove(4.9, strelkov)).toBe('retreat');
  });

  it('ranged_strelkov holds the 5–7 m firing band', () => {
    expect(resolveKiteMove(5, strelkov)).toBe('hold');
    expect(resolveKiteMove(6, strelkov)).toBe('hold');
    expect(resolveKiteMove(7, strelkov)).toBe('hold');
  });

  it('ranged_strelkov approaches when the player is beyond 7 m', () => {
    expect(resolveKiteMove(7.1, strelkov)).toBe('approach');
  });

  it('censor_drone uses its own 4–6 m band', () => {
    expect(resolveKiteMove(3.9, drone)).toBe('retreat');
    expect(resolveKiteMove(5, drone)).toBe('hold');
    expect(resolveKiteMove(6.5, drone)).toBe('approach');
  });

  it('melee creeps always approach', () => {
    expect(melee.kitingEnabled).toBe(false);
    expect(resolveKiteMove(0.5, melee)).toBe('approach');
    expect(resolveKiteMove(15, melee)).toBe('approach');
  });
});

describe('isWithinRangedEngageBand', () => {
  const strelkov = getEnemyAiConfig('ranged_strelkov');
  const melee = getEnemyAiConfig('system_daemon');

  it('accepts the inclusive firing band for ranged_strelkov', () => {
    expect(isWithinRangedEngageBand(4.9, strelkov)).toBe(false);
    expect(isWithinRangedEngageBand(5, strelkov)).toBe(true);
    expect(isWithinRangedEngageBand(7, strelkov)).toBe(true);
    expect(isWithinRangedEngageBand(7.1, strelkov)).toBe(false);
  });

  it('is always false for melee creeps', () => {
    expect(isWithinRangedEngageBand(1, melee)).toBe(false);
    expect(isWithinRangedEngageBand(6, melee)).toBe(false);
  });
});

describe('resolveRetreatDirection', () => {
  it('backs straight away from the player when home is toward the player', () => {
    // Player at origin, creep at (2,0), home behind the player at (-5,0).
    const dir = resolveRetreatDirection(2, 0, 0, 0, -5, 0);
    expect(dir.dirX).toBeCloseTo(1);
    expect(dir.dirZ).toBeCloseTo(0);
  });

  it('biases the retreat toward the patrol home when home lies behind the creep', () => {
    // Player at origin, creep at (2,0), home further away at (6,0) → +X.
    const dir = resolveRetreatDirection(2, 0, 0, 0, 6, 0);
    expect(dir.dirX).toBeCloseTo(1);
    expect(dir.dirZ).toBeCloseTo(0);
  });

  it('returns a normalized direction', () => {
    const dir = resolveRetreatDirection(3, 4, 0, 0, 10, 10);
    expect(Math.hypot(dir.dirX, dir.dirZ)).toBeCloseTo(1);
  });

  it('heads for home when the creep stands exactly on the player', () => {
    const dir = resolveRetreatDirection(0, 0, 0, 0, 0, 5);
    expect(dir.dirX).toBeCloseTo(0);
    expect(dir.dirZ).toBeCloseTo(1);
  });
});

/* ─── Waypoints & stuck detection ─── */

describe('nearestWaypointIndex', () => {
  const waypoints: Array<[number, number]> = [
    [0, 0],
    [10, 0],
    [0, 10],
  ];

  it('picks the nearest waypoint', () => {
    expect(nearestWaypointIndex(waypoints, 9, 1)).toBe(1);
    expect(nearestWaypointIndex(waypoints, 1, 9)).toBe(2);
    expect(nearestWaypointIndex(waypoints, 1, 1)).toBe(0);
  });

  it('handles an empty list by returning index 0', () => {
    expect(nearestWaypointIndex([], 5, 5)).toBe(0);
  });
});

describe('updateCreepStuckTracker', () => {
  it('does not fire before the window elapses', () => {
    const tracker = createCreepStuckTracker(0, 0);
    for (let i = 0; i < 14; i++) {
      expect(updateCreepStuckTracker(tracker, 0, 0, 0.1)).toBe(false);
    }
  });

  it('fires when the creep failed to move within the window', () => {
    const tracker = createCreepStuckTracker(0, 0);
    let stuck = false;
    for (let i = 0; i < 15; i++) {
      stuck = updateCreepStuckTracker(tracker, 0.05, 0, 0.1); // 1.5 s, moved 5 cm
    }
    expect(stuck).toBe(true);
  });

  it('does not fire when the creep covered the minimum distance', () => {
    const tracker = createCreepStuckTracker(0, 0);
    let stuck = false;
    for (let i = 0; i < 15; i++) {
      stuck = updateCreepStuckTracker(tracker, 0.5, 0, 0.1); // moved 50 cm
    }
    expect(stuck).toBe(false);
  });

  it('resets the window after firing', () => {
    const tracker = createCreepStuckTracker(0, 0);
    let stuck = false;
    for (let i = 0; i < 15; i++) {
      stuck = updateCreepStuckTracker(tracker, 0, 0, 0.1);
    }
    expect(stuck).toBe(true);
    // Next window: the creep moves again — must not fire.
    stuck = false;
    for (let i = 0; i < 15; i++) {
      stuck = updateCreepStuckTracker(tracker, 1, 0, 0.1);
    }
    expect(stuck).toBe(false);
  });

  it('supports custom window / distance thresholds', () => {
    const tracker = createCreepStuckTracker(0, 0);
    expect(updateCreepStuckTracker(tracker, 0, 0, 2.0, 1.0, 0.3)).toBe(true);
  });

  it('exposes the default thresholds via constants', () => {
    expect(CREEP_STUCK_WINDOW_S).toBe(1.5);
    expect(CREEP_STUCK_MIN_DISTANCE).toBe(0.3);
  });
});

/* ─── Nav-mesh paths ─── */

describe('computeCreepNavPath', () => {
  it('returns null without a nav mesh', () => {
    expect(computeCreepNavPath(0, 0, 5, 5, null)).toBeNull();
  });

  it('returns null for an empty graph', () => {
    const empty: NavMeshGraph = {
      cells: new Map(),
      width: 0,
      depth: 0,
      cellSize: 1,
      sceneId: 'test',
      originX: 0,
      originZ: 0,
    };
    expect(computeCreepNavPath(0, 0, 5, 5, empty)).toBeNull();
  });

  it('routes an L-shaped corridor around the blocked corner', () => {
    const graph = makeLGraph();
    const path = computeCreepNavPath(0, 0, 2, 2, graph);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThanOrEqual(2);
    // The corner waypoint (0,2) must be kept — the direct diagonal is blocked.
    expect(path![0][0]).toBeCloseTo(0);
    expect(path![0][1]).toBeCloseTo(2);
    const last = path![path!.length - 1];
    expect(last[0]).toBeCloseTo(2);
    expect(last[1]).toBeCloseTo(2);
  });

  it('drops the start waypoint (the creep is already there)', () => {
    const graph = makeLGraph();
    const path = computeCreepNavPath(0, 0, 2, 2, graph);
    const first = path![0];
    // First waypoint must not be the creep's own position (0,0).
    expect(Math.hypot(first[0] - 0, first[1] - 0)).toBeGreaterThan(0.5);
  });

  it('returns null when the target is unreachable', () => {
    const graph = makeLGraph(false); // bridge removed — (2,2) disconnected
    expect(computeCreepNavPath(0, 0, 2, 2, graph)).toBeNull();
  });
});

describe('resolveCreepNavMesh', () => {
  it('builds a walkable grid for a real scene', () => {
    const mesh = resolveCreepNavMesh('volodka_room');
    expect(mesh).not.toBeNull();
    expect(mesh!.cells.size).toBeGreaterThan(0);
  });

  it('returns null for unknown scenes', () => {
    expect(resolveCreepNavMesh('__no_such_scene__')).toBeNull();
  });
});
