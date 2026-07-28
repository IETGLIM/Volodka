/* ─── Volodka RPG – Nav Mesh Builder ─── */
/* Builds a walkable-area grid from scene collision data (walls + obstacles).
 *
 * ALGORITHM:
 *   1. Create a 2D grid covering the scene dimensions (CELL_SIZE = 0.5m).
 *   2. For each wall/obstacle collider, convert it to a 2D AABB (using the
 *      same obstacleToAabb pattern from npcObstacleAvoidance.ts).
 *   3. Expand each AABB by NAV_MARGIN (0.3m) to keep NPCs away from walls.
 *   4. Mark cells whose bounding box overlaps any expanded AABB as unwalkable.
 *   5. Create 8-connected grid: each walkable cell connects to its walkable
 *      neighbors (4 straight + 4 diagonal, diagonal cost = √2).
 *   6. Store as NavMeshGraph with Map<string, NavMeshCell> keyed by
 *      "grid_x,grid_z" for fast lookup.
 *
 * The grid approach is simpler than a polygon nav mesh but adequate for
 * small scenes (5–20 m) — precise enough for NPC patrol navigation and
 * cheap to build (< 1 ms for typical scene sizes). */

import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import type { SceneId } from '@/config/sceneIds';
import type { ColliderDef } from '@/shared/types/sceneDefinition';

// ─── Constants ───

/** Grid cell size in metres — balance between precision and performance. */
const CELL_SIZE = 0.5;
/** Extra margin around obstacles/walls — NPCs stay this far from surfaces. */
const NAV_MARGIN = 0.3;
/** Minimum obstacle height (Y half-extent) to block NPC movement.
 *  Low props that NPCs can step over are excluded. */
const MIN_BLOCKING_HEIGHT = 0.3;

// ─── Types ───

export interface NavMeshCell {
  /** World-space centre X of this cell. */
  x: number;
  /** World-space centre Z of this cell. */
  z: number;
  /** Grid column index. */
  gridX: number;
  /** Grid row index. */
  gridZ: number;
  /** Whether an NPC can stand in this cell. */
  walkable: boolean;
  /** Movement cost to enter this cell from a straight neighbour (1.0)
   *  or a diagonal neighbour (√2 ≈ 1.414). */
  cost: number;
  /** Keys of connected walkable neighbours (for A* neighbour expansion). */
  neighbors: string[];
}

export interface NavMeshGraph {
  /** All cells keyed by "gridX,gridZ" for O(1) lookup. */
  cells: Map<string, NavMeshCell>;
  /** Grid width (number of columns). */
  width: number;
  /** Grid depth (number of rows). */
  depth: number;
  /** Cell size in metres. */
  cellSize: number;
  /** Scene this graph was built for. */
  sceneId: string;
  /** Scene X origin (left edge in world space). */
  originX: number;
  /** Scene Z origin (top edge in world space). */
  originZ: number;
}

// ─── AABB helpers (reuse pattern from npcObstacleAvoidance.ts) ───

interface BlockingAabb {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Convert a ColliderDef to a 2D AABB, handling rotation.
 * Rotation is handled approximately: 0 and π/2 are exact (swap half-extents),
 * any other angle falls back to the rotated rectangle's bounding box.
 *
 * This is the same algorithm as obstacleToAabb() in npcObstacleAvoidance.ts,
 * but without the height filter (that happens in buildBlockingAabbs).
 */
function colliderToAabb(collider: ColliderDef): BlockingAabb {
  const [halfW, , halfD] = collider.size;
  const [cx, , cz] = collider.position;
  const rot = collider.rotation ?? 0;

  let halfWidth = halfW;
  let halfDepth = halfD;

  // Normalize rotation to [0, π) and handle quarter-turn exactly.
  const normalized = ((rot % Math.PI) + Math.PI) % Math.PI;
  const isQuarterTurn = Math.abs(normalized - Math.PI / 2) < 0.01;
  if (isQuarterTurn) {
    halfWidth = halfD;
    halfDepth = halfW;
  } else if (normalized > 0.01 && !isQuarterTurn) {
    // Arbitrary angle: bounding box of the rotated rectangle.
    const cos = Math.abs(Math.cos(rot));
    const sin = Math.abs(Math.sin(rot));
    halfWidth = halfW * cos + halfD * sin;
    halfDepth = halfW * sin + halfD * cos;
  }

  return {
    minX: cx - halfWidth,
    maxX: cx + halfWidth,
    minZ: cz - halfDepth,
    maxZ: cz + halfDepth,
  };
}

/**
 * Build a combined list of blocking AABBs from scene walls + obstacles.
 * Each AABB is expanded by NAV_MARGIN so NPCs stay away from surfaces.
 * Only includes colliders tall enough to block NPC movement (> MIN_BLOCKING_HEIGHT).
 */
function buildBlockingAabbs(scene: {
  walls?: readonly ColliderDef[];
  obstacles?: readonly ColliderDef[];
}): BlockingAabb[] {
  const combined: ColliderDef[] = [];
  if (scene.walls) combined.push(...scene.walls);
  if (scene.obstacles) combined.push(...scene.obstacles);

  const aabbs: BlockingAabb[] = [];
  for (const collider of combined) {
    // Skip colliders that are too short for NPCs to care about (e.g. small props).
    if (collider.size[1] < MIN_BLOCKING_HEIGHT) continue;

    const aabb = colliderToAabb(collider);
    // Expand by NAV_MARGIN — NPCs must stay this far from surfaces.
    aabbs.push({
      minX: aabb.minX - NAV_MARGIN,
      maxX: aabb.maxX + NAV_MARGIN,
      minZ: aabb.minZ - NAV_MARGIN,
      maxZ: aabb.maxZ + NAV_MARGIN,
    });
  }
  return aabbs;
}

/**
 * Check whether a cell bounding box overlaps any blocking AABB.
 * A cell is blocked if even a corner touches an expanded obstacle.
 */
function cellBlockedByAabbs(
  cellMinX: number,
  cellMaxX: number,
  cellMinZ: number,
  cellMaxZ: number,
  aabbs: readonly BlockingAabb[],
): boolean {
  for (const aabb of aabbs) {
    // AABB overlap test: two boxes overlap iff their projections overlap on both axes.
    if (cellMaxX > aabb.minX && cellMinX < aabb.maxX &&
        cellMaxZ > aabb.minZ && cellMinZ < aabb.maxZ) {
      return true;
    }
  }
  return false;
}

// ─── Grid key helpers ───

/** Build the map key for a grid cell. */
export function navMeshCellKey(gridX: number, gridZ: number): string {
  return `${gridX},${gridZ}`;
}

/** Parse a grid key back into gridX, gridZ. */
export function parseNavMeshCellKey(key: string): { gridX: number; gridZ: number } {
  const parts = key.split(',');
  return { gridX: parseInt(parts[0], 10), gridZ: parseInt(parts[1], 10) };
}

// ─── Build ───

/**
 * Build a NavMeshGraph from a scene definition.
 *
 * The grid covers the scene dimensions. Each cell is CELL_SIZE × CELL_SIZE
 * metres. Cells that overlap expanded obstacle AABBs are marked unwalkable.
 * Walkable cells are 8-connected (straight + diagonal neighbours).
 */
export function buildNavMeshFromScene(sceneId: string): NavMeshGraph {
  // Read scene definition — this has walls, obstacles, and dimensions.
  const def = SCENE_DEFINITIONS[sceneId as SceneId];
  if (!def) {
    // Fallback: empty graph so NPCs don't crash.
    return {
      cells: new Map(),
      width: 0,
      depth: 0,
      cellSize: CELL_SIZE,
      sceneId,
      originX: 0,
      originZ: 0,
    };
  }

  // Scene dimensions: [width, height, depth] → grid covers [-w/2..w/2, -d/2..d/2].
  const [sceneW, , sceneD] = def.dimensions;
  const gridWidth = Math.ceil(sceneW / CELL_SIZE);
  const gridDepth = Math.ceil(sceneD / CELL_SIZE);

  // World-space origin: the grid starts at the left/top edge of the scene.
  const originX = -sceneW / 2;
  const originZ = -sceneD / 2;

  // Build blocking AABBs (walls + obstacles, expanded by NAV_MARGIN).
  const blockingAabbs = buildBlockingAabbs(def);

  // ── Phase 1: Create all cells and mark walkability ──
  const cells = new Map<string, NavMeshCell>();

  for (let gx = 0; gx < gridWidth; gx++) {
    for (let gz = 0; gz < gridDepth; gz++) {
      // World-space centre of this cell.
      const worldX = originX + (gx + 0.5) * CELL_SIZE;
      const worldZ = originZ + (gz + 0.5) * CELL_SIZE;

      // Cell bounding box (for overlap test with expanded AABBs).
      const cellMinX = originX + gx * CELL_SIZE;
      const cellMaxX = cellMinX + CELL_SIZE;
      const cellMinZ = originZ + gz * CELL_SIZE;
      const cellMaxZ = cellMinZ + CELL_SIZE;

      const walkable = !cellBlockedByAabbs(
        cellMinX, cellMaxX, cellMinZ, cellMaxZ,
        blockingAabbs,
      );

      const key = navMeshCellKey(gx, gz);
      cells.set(key, {
        x: worldX,
        z: worldZ,
        gridX: gx,
        gridZ: gz,
        walkable,
        cost: 1.0, // default; set per-connection later
        neighbors: [], // populated in Phase 2
      });
    }
  }

  // ── Phase 2: Connect walkable neighbours (8-connected grid) ──
  // 8 directions: N, NE, E, SE, S, SW, W, NW
  const NEIGHBOR_OFFSETS: [number, number, boolean][] = [
    // [deltaGX, deltaGZ, isDiagonal]
    [0, -1, false],   // N
    [1, -1, true],    // NE
    [1, 0, false],    // E
    [1, 1, true],     // SE
    [0, 1, false],    // S
    [-1, 1, true],    // SW
    [-1, 0, false],   // W
    [-1, -1, true],   // NW
  ];

  for (const [_key, cell] of cells) {
    if (!cell.walkable) continue;

    for (const [dgx, dgz, isDiagonal] of NEIGHBOR_OFFSETS) {
      const ngKey = navMeshCellKey(cell.gridX + dgx, cell.gridZ + dgz);
      const neighbour = cells.get(ngKey);
      if (!neighbour || !neighbour.walkable) continue;

      // Diagonal movement requires BOTH adjacent straight neighbours to be
      // walkable (prevents cutting corners through walls).
      if (isDiagonal) {
        const adjKey1 = navMeshCellKey(cell.gridX + dgx, cell.gridZ);
        const adjKey2 = navMeshCellKey(cell.gridX, cell.gridZ + dgz);
        const adj1 = cells.get(adjKey1);
        const adj2 = cells.get(adjKey2);
        if (!adj1?.walkable || !adj2?.walkable) continue;
      }

      cell.neighbors.push(ngKey);
    }
  }

  return {
    cells,
    width: gridWidth,
    depth: gridDepth,
    cellSize: CELL_SIZE,
    sceneId,
    originX,
    originZ,
  };
}
