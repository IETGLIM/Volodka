/* ─── Volodka RPG – Nav Mesh Cache ─── */
/* Caches built NavMeshGraph instances per scene so they are only
 * computed once when the scene loads, and invalidated when the
 * scene changes. This avoids rebuilding the grid every time an
 * NPC requests a path.
 *
 * USAGE:
 *   - Call getNavMeshForScene(sceneId) when an NPC needs a path.
 *   - Call invalidateNavMesh(sceneId) when the scene changes.
 *   - Call clearAllNavMeshes() on game reset / save load. */

import { buildNavMeshFromScene, type NavMeshGraph } from './navMeshBuilder';

const navMeshCache = new Map<string, NavMeshGraph>();

/**
 * Get the nav mesh for a scene. If not cached, build it from scene
 * definitions, cache it, and return it.
 */
export function getNavMeshForScene(sceneId: string): NavMeshGraph {
  const cached = navMeshCache.get(sceneId);
  if (cached) return cached;

  const mesh = buildNavMeshFromScene(sceneId);
  navMeshCache.set(sceneId, mesh);
  return mesh;
}

/**
 * Invalidate (remove) the cached nav mesh for a specific scene.
 * Called when the scene changes or scene definitions are updated.
 */
export function invalidateNavMesh(sceneId: string): void {
  navMeshCache.delete(sceneId);
}

/**
 * Clear all cached nav meshes. Called on game reset or save load.
 */
export function clearAllNavMeshes(): void {
  navMeshCache.clear();
}
