/* ─── Volodka RPG – Nav mesh layer (district navigation) ─── */
/*
 * Handcrafted interiors use Rapier colliders; NavMeshLayer covers open districts
 * for future pathfinding, ambient patrol routes, and spawn validation.
 */

import type { SceneId } from '@/shared/types/game';
import type {
  NavMeshLayerSnapshot,
  NavMeshNode,
  WorldCellId,
  WorldChunkCoord,
  WorldRegionId,
} from './types';
import { chunkWorldCenter, getWorldCell, getChunkForScene } from './worldRegistry';
import { DEFAULT_WORLD_CHUNK_OPTIONS } from './WorldChunkManager';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

export class NavMeshLayer {
  private readonly nodes = new Map<string, NavMeshNode>();
  private regionId: WorldRegionId | null = null;
  private cellId: WorldCellId | null = null;

  /** Build a coarse grid graph for a cell's chunks (placeholder until real nav bake). */
  loadCell(regionId: WorldRegionId, cellId: WorldCellId): void {
    this.clear();
    this.regionId = regionId;
    this.cellId = cellId;

    const cell = getWorldCell(cellId);
    const size = DEFAULT_WORLD_CHUNK_OPTIONS.chunkSizeMeters;

    for (const coord of cell.chunkCoords) {
      const center = chunkWorldCenter(coord, size);
      const id = `${coord.x},${coord.z}`;
      this.nodes.set(id, {
        id,
        position: center,
        neighbors: [],
      });
    }

    for (const node of this.nodes.values()) {
      const [x, z] = node.id.split(',').map(Number);
      const neighbors: string[] = [];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nid = `${x + dx},${z + dz}`;
        if (this.nodes.has(nid)) neighbors.push(nid);
      }
      node.neighbors = neighbors;
    }
  }

  clear(): void {
    this.nodes.clear();
    this.regionId = null;
    this.cellId = null;
  }

  getSnapshot(): NavMeshLayerSnapshot | null {
    if (!this.regionId) return null;
    return {
      regionId: this.regionId,
      cellId: this.cellId,
      nodeCount: this.nodes.size,
    };
  }

  /** Nearest walkable point for a district scene (chunk center fallback). */
  getNearestWalkable(sceneId: SceneId): [number, number, number] {
    const coord = getChunkForScene(sceneId);
    const id = `${coord.x},${coord.z}`;
    const node = this.nodes.get(id);
    if (node) return [...node.position] as [number, number, number];

    const size = DEFAULT_WORLD_CHUNK_OPTIONS.chunkSizeMeters;
    return chunkWorldCenter(coord, size);
  }

  /** Snap world XZ to nearest nav node in the active layer. */
  snapWorldPosition(worldX: number, worldZ: number): [number, number, number] {
    if (this.nodes.size === 0) return [worldX, 0, worldZ];

    let best: NavMeshNode | null = null;
    let bestDist = Infinity;
    for (const node of this.nodes.values()) {
      const dx = node.position[0] - worldX;
      const dz = node.position[2] - worldZ;
      const d = dx * dx + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = node;
      }
    }
    return best ? ([...best.position] as [number, number, number]) : [worldX, 0, worldZ];
  }
}

let sharedNavMesh: NavMeshLayer | null = null;

export function getNavMeshLayer(): NavMeshLayer {
  if (!sharedNavMesh) {
    sharedNavMesh = new NavMeshLayer();
  }
  return sharedNavMesh;
}

/** Clear loaded nav data and release singleton (unmount / HMR). */
export function disposeNavMeshLayer(): void {
  sharedNavMesh?.clear();
  sharedNavMesh = null;
}

/** Re-arm after orchestrator remount (React StrictMode). Ensures singleton exists. */
export function reviveNavMeshLayer(): void {
  getNavMeshLayer();
}

registerHmrDispose(disposeNavMeshLayer);
