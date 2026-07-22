/* ─── Volodka RPG – Nav Mesh Pathfinder (A*) ─── */
/* A* pathfinding on the nav mesh grid produced by navMeshBuilder.ts.
 *
 * ALGORITHM:
 *   1. Convert start/end world positions to grid cell keys.
 *   2. If start/end is in an unwalkable cell, snap to nearest walkable cell.
 *   3. Run standard A* with binary-heap priority queue.
 *      - Heuristic: Euclidean distance (admissible for 8-connected grid).
 *      - Cost: 1.0 for straight moves, √2 for diagonal moves.
 *   4. Reconstruct raw grid path (cell keys → world positions).
 *   5. Apply line-of-sight smoothing: skip waypoints where a straight line
 *      from current to next+2 doesn't cross blocked cells.
 *   6. Return smoothed world-space waypoints with y = floorY.
 *
 * PERFORMANCE:
 *   - NPC path computation happens per schedule change (not per frame).
 *   - Max path length capped at 200 cells to prevent excessive computation.
 *   - Fallback: if no path found, return direct line (same as current behaviour).
 *
 * The binary heap is a simple array-based min-heap — fast enough for
 * typical grid sizes (10×14 = 140 cells for volodka_room). */

import type { NavMeshGraph, NavMeshCell } from './navMeshBuilder';
import { navMeshCellKey, parseNavMeshCellKey } from './navMeshBuilder';

// ─── Types ───

export interface NavMeshPathResult {
  /** World-space waypoints [x, y, z] (y = floorY). */
  waypoints: [number, number, number][];
  /** Total path distance in metres. */
  length: number;
  /** Whether a valid path was found. */
  found: boolean;
}

// ─── Constants ───

/** Maximum cells to explore before giving up (prevents infinite loops). */
const MAX_EXPLORED = 200;
/** Cost multiplier for diagonal moves (√2 ≈ 1.414). */
const DIAGONAL_COST = Math.SQRT2;
/** Straight move cost. */
const STRAIGHT_COST = 1.0;
/** Maximum number of cells to check during line-of-sight smoothing. */
const MAX_LINE_OF_SIGHT_CHECKS = 200;

// ─── Binary heap (min-heap by f-score) ───

interface HeapNode {
  key: string;
  f: number;
}

class BinaryHeap {
  private data: HeapNode[] = [];

  push(node: HeapNode): void {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number {
    return this.data.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].f < this.data[parent].f) {
        const tmp = this.data[i];
        this.data[i] = this.data[parent];
        this.data[parent] = tmp;
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[smallest].f) smallest = l;
      if (r < n && this.data[r].f < this.data[smallest].f) smallest = r;
      if (smallest !== i) {
        const tmp = this.data[i];
        this.data[i] = this.data[smallest];
        this.data[smallest] = tmp;
        i = smallest;
      } else break;
    }
  }
}

// ─── Helpers ───

/** Convert world XZ position to grid cell key. */
function worldToCellKey(
  worldX: number,
  worldZ: number,
  graph: NavMeshGraph,
): string {
  const gridX = Math.floor((worldX - graph.originX) / graph.cellSize);
  const gridZ = Math.floor((worldZ - graph.originZ) / graph.cellSize);
  return navMeshCellKey(gridX, gridZ);
}

/**
 * Snap a world position to the nearest walkable cell.
 * If the cell at the given position is walkable, return it.
 * Otherwise, search outward in expanding rings up to a reasonable radius.
 */
function snapToWalkable(
  worldX: number,
  worldZ: number,
  graph: NavMeshGraph,
): NavMeshCell | null {
  // First try the exact cell.
  const exactKey = worldToCellKey(worldX, worldZ, graph);
  const exactCell = graph.cells.get(exactKey);
  if (exactCell?.walkable) return exactCell;

  // Search outward in expanding rings (max radius = 4 cells = 2m).
  const maxRadius = 4;
  const centerGX = Math.floor((worldX - graph.originX) / graph.cellSize);
  const centerGZ = Math.floor((worldZ - graph.originZ) / graph.cellSize);

  let bestCell: NavMeshCell | null = null;
  let bestDistSq = Infinity;

  for (let r = 1; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        // Only check cells on the ring boundary.
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        const key = navMeshCellKey(centerGX + dx, centerGZ + dz);
        const cell = graph.cells.get(key);
        if (cell?.walkable) {
          const distSq = (cell.x - worldX) ** 2 + (cell.z - worldZ) ** 2;
          if (distSq < bestDistSq) {
            bestDistSq = distSq;
            bestCell = cell;
          }
        }
      }
    }
    if (bestCell) return bestCell;
  }

  return null; // No walkable cell within snap radius.
}

/** Euclidean distance heuristic between two cells. */
function heuristic(cellA: NavMeshCell, cellB: NavMeshCell): number {
  return Math.hypot(cellA.x - cellB.x, cellA.z - cellB.z);
}

// ─── A* Search ───

/**
 * Run A* from startKey to endKey on the nav mesh graph.
 * Returns the list of cell keys forming the path, or null if no path found.
 */
function aStarSearch(
  startKey: string,
  endKey: string,
  graph: NavMeshGraph,
): string[] | null {
  const startCell = graph.cells.get(startKey);
  const endCell = graph.cells.get(endKey);
  if (!startCell || !endCell) return null;

  const openSet = new BinaryHeap();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();

  // Initialize.
  gScore.set(startKey, 0);
  openSet.push({ key: startKey, f: heuristic(startCell, endCell) });

  let explored = 0;

  while (openSet.size > 0 && explored < MAX_EXPLORED) {
    const current = openSet.pop()!;
    explored++;

    // Goal reached.
    if (current.key === endKey) {
      // Reconstruct path.
      const path: string[] = [];
      let k: string | undefined = endKey;
      while (k !== undefined) {
        path.unshift(k);
        k = cameFrom.get(k);
      }
      return path;
    }

    const currentCell = graph.cells.get(current.key)!;
    const currentG = gScore.get(current.key) ?? Infinity;

    // Expand neighbours.
    for (const neighborKey of currentCell.neighbors) {
      const neighborCell = graph.cells.get(neighborKey);
      if (!neighborCell) continue;

      // Determine move cost (diagonal vs straight).
      const dx = Math.abs(neighborCell.gridX - currentCell.gridX);
      const dz = Math.abs(neighborCell.gridZ - currentCell.gridZ);
      const moveCost = (dx + dz === 2) ? DIAGONAL_COST : STRAIGHT_COST;

      const tentativeG = currentG + moveCost;
      const prevG = gScore.get(neighborKey) ?? Infinity;

      if (tentativeG < prevG) {
        cameFrom.set(neighborKey, current.key);
        gScore.set(neighborKey, tentativeG);
        openSet.push({ key: neighborKey, f: tentativeG + heuristic(neighborCell, endCell) });
      }
    }
  }

  // No path found within budget.
  return null;
}

// ─── Path smoothing ───

/**
 * Check whether a straight line from (x0,z0) to (x1,z1) crosses any
 * blocked cell. Uses a simple grid-traversal (DDA/Bresenham-like walk
 * through cells) and checks each cell along the line for walkability.
 *
 * Returns true if the line is clear (no blocked cells), false otherwise.
 */
function lineOfSightClear(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  graph: NavMeshGraph,
): boolean {
  // Convert start/end to grid coordinates.
  const gx0 = (x0 - graph.originX) / graph.cellSize;
  const gz0 = (z0 - graph.originZ) / graph.cellSize;
  const gx1 = (x1 - graph.originX) / graph.cellSize;
  const gz1 = (z1 - graph.originZ) / graph.cellSize;

  const dx = gx1 - gx0;
  const dz = gz1 - gz0;
  const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) * 3); // 3 cells per grid unit

  if (steps === 0) return true;

  const stepX = dx / steps;
  const stepZ = dz / steps;

  let checked = 0;
  for (let i = 0; i <= steps && checked < MAX_LINE_OF_SIGHT_CHECKS; i++) {
    const gx = Math.floor(gx0 + stepX * i);
    const gz = Math.floor(gz0 + stepZ * i);
    const key = navMeshCellKey(gx, gz);
    const cell = graph.cells.get(key);
    if (!cell || !cell.walkable) return false;
    checked++;
  }

  return true;
}

/**
 * Smooth a raw A* grid path by removing unnecessary waypoints.
 * For each waypoint, check if there's a direct line of sight from the
 * previous kept waypoint to a waypoint further along the path. If so,
 * skip the intermediate waypoints.
 *
 * This produces much more natural NPC movement (fewer grid-aligned turns).
 */
function smoothPath(
  rawWaypoints: [number, number, number][],
  graph: NavMeshGraph,
): [number, number, number][] {
  if (rawWaypoints.length <= 2) return rawWaypoints;

  const smoothed: [number, number, number][] = [rawWaypoints[0]];
  let currentIdx = 0;

  while (currentIdx < rawWaypoints.length - 1) {
    // Find the furthest waypoint we can see directly from current.
    let furthestIdx = currentIdx + 1;
    for (let lookAhead = currentIdx + 2; lookAhead < rawWaypoints.length; lookAhead++) {
      const curr = smoothed[smoothed.length - 1];
      const target = rawWaypoints[lookAhead];
      if (lineOfSightClear(curr[0], curr[2], target[0], target[2], graph)) {
        furthestIdx = lookAhead;
      } else {
        break; // Can't see further, stop looking.
      }
    }

    smoothed.push(rawWaypoints[furthestIdx]);
    currentIdx = furthestIdx;
  }

  // Always include the final waypoint.
  const last = smoothed[smoothed.length - 1];
  const final = rawWaypoints[rawWaypoints.length - 1];
  if (last[0] !== final[0] || last[2] !== final[2]) {
    smoothed.push(final);
  }

  return smoothed;
}

// ─── Main pathfinding function ───

/**
 * Find a path from (startX, startZ) to (endX, endZ) on the nav mesh.
 *
 * Returns world-space waypoints with y = floorY. If no path is found,
 * returns a direct line from start to end (fallback — same as current
 * NPC behaviour without nav mesh).
 */
export function findNavMeshPath(
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  floorY: number,
  graph: NavMeshGraph,
): NavMeshPathResult {
  // ── Handle empty graph (e.g. unknown scene) ──
  if (graph.cells.size === 0) {
    return fallbackDirectPath(startX, startZ, endX, endZ, floorY);
  }

  // ── Snap start/end to walkable cells ──
  const startCell = snapToWalkable(startX, startZ, graph);
  const endCell = snapToWalkable(endX, endZ, graph);

  if (!startCell || !endCell) {
    return fallbackDirectPath(startX, startZ, endX, endZ, floorY);
  }

  // If start and end snap to the same cell, direct path.
  if (startCell.gridX === endCell.gridX && startCell.gridZ === endCell.gridZ) {
    const directLen = Math.hypot(endX - startX, endZ - startZ);
    return {
      waypoints: [[startX, floorY, startZ], [endX, floorY, endZ]],
      length: directLen,
      found: true,
    };
  }

  // ── A* search ──
  const startKey = navMeshCellKey(startCell.gridX, startCell.gridZ);
  const endKey = navMeshCellKey(endCell.gridX, endCell.gridZ);

  const rawCellPath = aStarSearch(startKey, endKey, graph);

  if (!rawCellPath) {
    return fallbackDirectPath(startX, startZ, endX, endZ, floorY);
  }

  // ── Convert cell path to world-space waypoints ──
  const rawWaypoints: [number, number, number][] = rawCellPath.map((key) => {
    const cell = graph.cells.get(key)!;
    return [cell.x, floorY, cell.z];
  });

  // Replace first waypoint with actual start position (not snapped grid centre).
  rawWaypoints[0] = [startX, floorY, startZ];
  // Replace last waypoint with actual end position.
  rawWaypoints[rawWaypoints.length - 1] = [endX, floorY, endZ];

  // ── Smooth the path ──
  const smoothed = smoothPath(rawWaypoints, graph);

  // ── Compute total distance ──
  let totalLength = 0;
  for (let i = 1; i < smoothed.length; i++) {
    totalLength += Math.hypot(
      smoothed[i][0] - smoothed[i - 1][0],
      smoothed[i][2] - smoothed[i - 1][2],
    );
  }

  return {
    waypoints: smoothed,
    length: totalLength,
    found: true,
  };
}

/** Direct fallback path when nav mesh fails — straight line from start to end. */
function fallbackDirectPath(
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  floorY: number,
): NavMeshPathResult {
  const length = Math.hypot(endX - startX, endZ - startZ);
  return {
    waypoints: [[startX, floorY, startZ], [endX, floorY, endZ]],
    length,
    found: false,
  };
}
