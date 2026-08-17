/**
 * Apply shipped Poly Haven CC0 maps onto large kit/shell meshes (photo wear, not noise).
 * Multi-role: floor / wall / ceiling get different material IDs (not one mono wrap).
 */

import { Box3, Mesh, MeshStandardMaterial, Object3D, RepeatWrapping, Texture, Vector2, Vector3 } from 'three';
import type { PolyHavenMaterialId } from '@/config/polyhavenAssets';
import type { EnvironmentMaterialMood } from '@/engine/graphics/materials/weatherEnvironmentMaterials';

export type ShellSurfaceRole = 'floor' | 'wall' | 'ceiling';

export interface PhotoPbrMaps {
  map: Texture;
  normalMap: Texture;
  roughnessMap: Texture;
  aoMap?: Texture | null;
  repeat: number;
}

export type PhotoPbrMapSet = Record<ShellSurfaceRole, PhotoPbrMaps>;

const _box = new Box3();
const _size = new Vector3();

/** Primary wall/facade id by scene mood (floors/ceilings override separately). */
export function polyHavenIdForEnvironmentMood(mood: EnvironmentMaterialMood): PolyHavenMaterialId {
  switch (mood) {
    case 'street':
      return 'asphalt_02';
    case 'plaza':
      return 'concrete_floor_painted';
    case 'prop':
      return 'wood_floor';
    case 'office':
    case 'interior':
    default:
      return 'plastered_wall';
  }
}

export function polyHavenIdsForMood(mood: EnvironmentMaterialMood): Record<ShellSurfaceRole, PolyHavenMaterialId> {
  switch (mood) {
    case 'street':
      return {
        floor: 'asphalt_02',
        wall: 'concrete_floor_painted',
        ceiling: 'metal_plate',
      };
    case 'plaza':
      return {
        floor: 'concrete_floor_painted',
        wall: 'concrete_floor_painted',
        ceiling: 'plastered_wall',
      };
    case 'prop':
      return {
        floor: 'wood_floor',
        wall: 'plastered_wall',
        ceiling: 'plastered_wall',
      };
    case 'office':
      return {
        floor: 'wood_floor',
        wall: 'plastered_wall',
        ceiling: 'plastered_wall',
      };
    case 'interior':
    default:
      return {
        floor: 'wood_floor',
        wall: 'plastered_wall',
        ceiling: 'plastered_wall',
      };
  }
}

export function classifyShellSurfaceRole(mesh: Mesh): ShellSurfaceRole {
  const name = `${mesh.name} ${mesh.parent?.name ?? ''}`.toLowerCase();
  if (/ceil|roof|overhead/.test(name)) return 'ceiling';
  if (/floor|ground|road|deck|pavement|asphalt/.test(name)) return 'floor';
  if (/wall|facade|partition|panel/.test(name)) return 'wall';

  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox ?? _box;
  bb.getSize(_size);
  // Thin horizontal slab → floor/ceiling by world-ish height heuristic on local Y center.
  if (_size.y < Math.min(_size.x, _size.z) * 0.35) {
    const centerY = (bb.min.y + bb.max.y) * 0.5;
    return centerY > 1.6 ? 'ceiling' : 'floor';
  }
  return 'wall';
}

function isLargeSurface(mesh: Mesh): boolean {
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox ?? _box;
  bb.getSize(_size);
  const maxDim = Math.max(_size.x, _size.y, _size.z);
  if (maxDim >= 1.2) return true;
  const name = `${mesh.name} ${mesh.parent?.name ?? ''}`.toLowerCase();
  return /floor|wall|ceil|ground|shell|plaster|concrete|road|facade/.test(name);
}

function tileMap(src: Texture, repeat: number): Texture {
  const t = src.clone();
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = Math.max(t.anisotropy, 8);
  t.needsUpdate = true;
  return t;
}

function applyMapsToMaterial(std: MeshStandardMaterial, maps: PhotoPbrMaps, repeatScale: number): void {
  const repeat = maps.repeat * repeatScale;
  std.map = tileMap(maps.map, repeat);
  std.normalMap = tileMap(maps.normalMap, repeat);
  std.normalScale = new Vector2(0.65, 0.65);
  std.roughnessMap = tileMap(maps.roughnessMap, repeat);
  if (maps.aoMap) {
    std.aoMap = tileMap(maps.aoMap, repeat);
    std.aoMapIntensity = 0.92;
  }
  if (std.color) std.color.multiplyScalar(0.94);
  // Anti-plastic: clamp envMapIntensity to prevent overly shiny surfaces
  if (typeof std.envMapIntensity === 'number') {
    std.envMapIntensity = Math.min(std.envMapIntensity, 0.25);
  }
  std.needsUpdate = true;
}

/** @deprecated Prefer applyPhotoPbrMapSetToRoot for multi-role shells. */
export function applyPhotoPbrMapsToRoot(
  root: Object3D,
  maps: PhotoPbrMaps,
  repeatScale = 1,
): void {
  applyPhotoPbrMapSetToRoot(root, { floor: maps, wall: maps, ceiling: maps }, repeatScale);
}

/** Per-role Poly Haven maps on large shell surfaces. */
export function applyPhotoPbrMapSetToRoot(
  root: Object3D,
  mapSet: PhotoPbrMapSet,
  repeatScale = 1,
): void {
  root.traverse((node) => {
    if (!(node as Mesh).isMesh) return;
    const mesh = node as Mesh;
    if (!isLargeSurface(mesh)) return;

    const role = classifyShellSurfaceRole(mesh);
    const maps = mapSet[role];
    const roleRepeat =
      role === 'floor' ? repeatScale * 1.15
        : role === 'ceiling' ? repeatScale * 0.85
          : repeatScale;

    const sourceMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const nextMats = sourceMats.map((material) => {
      if (!material || !('envMapIntensity' in material)) return material;
      applyMapsToMaterial(material as MeshStandardMaterial, maps, roleRepeat);
      return material;
    });
    mesh.material = nextMats.length === 1 ? nextMats[0]! : nextMats;
  });
}
