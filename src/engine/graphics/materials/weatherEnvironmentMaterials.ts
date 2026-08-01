import * as THREE from 'three';
import {
  applySurfaceDetailMaps,
  type SurfaceDetailKind,
} from '@/engine/graphics/proceduralSurfaceTextures';

export type EnvironmentMaterialMood =
  | 'interior'
  | 'plaza'
  | 'street'
  | 'office'
  | 'prop';

export interface WeatherEnvironmentOptions {
  /** Inject procedural wear maps (albedo/normal/roughness). Default: large surfaces only. */
  applyMaps?: boolean | 'large';
}

const MOOD: Record<
  EnvironmentMaterialMood,
  {
    envMapIntensity: number;
    minRoughness: number;
    roughnessMul: number;
    maxMetalness: number;
    surface: SurfaceDetailKind;
    repeatScale: number;
  }
> = {
  interior: {
    envMapIntensity: 0.42,
    minRoughness: 0.68,
    roughnessMul: 1.22,
    maxMetalness: 0.22,
    surface: 'plaster',
    repeatScale: 1.45,
  },
  plaza: {
    envMapIntensity: 0.48,
    minRoughness: 0.62,
    roughnessMul: 1.2,
    maxMetalness: 0.4,
    surface: 'concrete',
    repeatScale: 1.15,
  },
  street: {
    envMapIntensity: 0.5,
    minRoughness: 0.58,
    roughnessMul: 1.22,
    maxMetalness: 0.38,
    surface: 'asphalt',
    repeatScale: 1.25,
  },
  office: {
    envMapIntensity: 0.44,
    minRoughness: 0.64,
    roughnessMul: 1.18,
    maxMetalness: 0.28,
    surface: 'plaster',
    repeatScale: 1.55,
  },
  prop: {
    envMapIntensity: 0.48,
    minRoughness: 0.6,
    roughnessMul: 1.18,
    maxMetalness: 0.5,
    surface: 'wood',
    repeatScale: 0.85,
  },
};

const _box = new THREE.Box3();
const _size = new THREE.Vector3();

function shouldApplyWearMaps(
  mesh: THREE.Mesh,
  mode: boolean | 'large' | undefined,
): boolean {
  if (mode === false) return false;
  if (mode === true) return true;
  // Default / 'large': hero shells & floors — skip tiny prop tris for 60fps.
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox ?? _box;
  bb.getSize(_size);
  const maxDim = Math.max(_size.x, _size.y, _size.z);
  if (maxDim >= 1.2) return true;
  const name = `${mesh.name} ${mesh.parent?.name ?? ''}`.toLowerCase();
  return /floor|wall|ceil|ground|shell|plaster|concrete|road|facade/.test(name);
}

/**
 * Lived-in environment response: clamp plastic IBL + optional tiled wear maps
 * on large kit/authored surfaces (not every prop triangle).
 */
export function weatherEnvironmentMaterials(
  root: THREE.Object3D,
  mood: EnvironmentMaterialMood = 'prop',
  options: WeatherEnvironmentOptions = {},
): void {
  const cfg = MOOD[mood];
  const mapMode = options.applyMaps ?? 'large';

  root.traverse((node) => {
    if (!(node as THREE.Mesh).isMesh) return;
    const mesh = node as THREE.Mesh;
    const sourceMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const applyMaps = shouldApplyWearMaps(mesh, mapMode);
    const nextMats = sourceMats.map((material) => {
      if (!material || !('envMapIntensity' in material)) return material;
      const std = (material as THREE.MeshStandardMaterial).clone();
      std.envMapIntensity = cfg.envMapIntensity;
      if (typeof std.roughness === 'number') {
        std.roughness = Math.min(1, Math.max(cfg.minRoughness, std.roughness * cfg.roughnessMul));
      }
      if (typeof std.metalness === 'number') {
        std.metalness = Math.min(cfg.maxMetalness, Math.max(0, std.metalness));
      }
      if (std.flatShading) {
        std.flatShading = false;
      }

      const hasPhotoMaps = Boolean(std.map && std.roughnessMap && std.normalMap);
      if (applyMaps && !hasPhotoMaps) {
        applySurfaceDetailMaps(std, cfg.surface, 1, cfg.repeatScale);
        if (std.color) {
          // Lived-in kit shells: pull albedo off candy Kenney whites.
          std.color.multiplyScalar(mood === 'interior' || mood === 'office' ? 0.86 : 0.9);
        }
      }

      std.needsUpdate = true;
      return std;
    });
    mesh.material = nextMats.length === 1 ? nextMats[0]! : nextMats;
  });
}
