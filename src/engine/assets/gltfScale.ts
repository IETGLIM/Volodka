/**
 * AAA GLTF scale convention — 1 Three.js unit = 1 metre.
 * All GLB loaders should normalize through these helpers instead of ad-hoc factors.
 */

import * as THREE from 'three';
import {
  PLAYER_GLB_TARGET_VISUAL_METERS,
  PLAYER_VISUAL_HEIGHT_FALLBACK_M,
} from '@/data/constants';

/** World units per metre (Three.js scene graph). */
export const AAA_METERS_PER_UNIT = 1;

/** Canonical humanoid height when character scale multiplier = 1. */
export const CHARACTER_TARGET_HEIGHT_M = PLAYER_GLB_TARGET_VISUAL_METERS;

/** Fallback bounding height when a rigged mesh cannot be measured. */
export const CHARACTER_HEIGHT_FALLBACK_M = PLAYER_VISUAL_HEIGHT_FALLBACK_M;

/**
 * Minimum measured height (m) before trusting auto-fit.
 * Modular skinned exports (Quaternius) can yield a single mesh slice (e.g. boots ≈0.19 m);
 * fitting that to 1.75 m inflates one part to room scale.
 */
export const CHARACTER_MIN_TRUSTED_HEIGHT_M = 1.0;

export interface GltfBounds {
  size: THREE.Vector3;
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface CharacterGltfFit {
  scale: number;
  rotX: number;
  footY: number;
}

export type PropFitAxis = 'height' | 'width' | 'depth' | 'maxHorizontal' | 'maxExtent';

export function measureGltfBounds(obj: THREE.Object3D): GltfBounds {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  if (!box.isEmpty()) box.getSize(size);
  return { size, min: box.min.clone(), max: box.max.clone() };
}

const _meshBoundsScratch = new THREE.Box3();

/**
 * Humanoid GLB bounds — unions all SkinnedMesh slices after skeleton update.
 * Quaternius modular rigs export many skinned parts; `setFromObject` on the root
 * can measure a single slice (boots ≈0.19 m) and break scale/foot pivot on medium+.
 */
export function measureCharacterGltfBounds(obj: THREE.Object3D): GltfBounds {
  obj.updateWorldMatrix(true, true);
  const union = new THREE.Box3();
  let hasUnion = false;

  obj.traverse((node) => {
    if (node instanceof THREE.SkinnedMesh) {
      node.computeBoundingBox();
      if (!node.boundingBox) return;
      _meshBoundsScratch.copy(node.boundingBox).applyMatrix4(node.matrixWorld);
    } else if (node instanceof THREE.Mesh) {
      _meshBoundsScratch.setFromObject(node);
    } else {
      return;
    }

    if (_meshBoundsScratch.isEmpty()) return;
    if (hasUnion) union.union(_meshBoundsScratch);
    else {
      union.copy(_meshBoundsScratch);
      hasUnion = true;
    }
  });

  if (!hasUnion) return measureGltfBounds(obj);

  const size = new THREE.Vector3();
  union.getSize(size);
  return { size, min: union.min.clone(), max: union.max.clone() };
}

function resolveCharacterHeightDim(size: THREE.Vector3): { heightDim: number; rotX: number } {
  let rotX = 0;
  let heightDim = size.y;
  if (size.z > size.y * 1.15) {
    rotX = -Math.PI / 2;
    heightDim = size.z;
  }
  if (!Number.isFinite(heightDim) || heightDim < CHARACTER_MIN_TRUSTED_HEIGHT_M) {
    heightDim = CHARACTER_HEIGHT_FALLBACK_M;
  }
  return { heightDim, rotX };
}

/** Fit a rigged humanoid export to a target standing height (metres). */
export function fitCharacterGltf(
  bounds: GltfBounds,
  options: {
    targetHeightM?: number;
    heightFactor?: number;
    scaleMultiplier?: number;
  } = {},
): CharacterGltfFit {
  const targetHeightM = options.targetHeightM ?? CHARACTER_TARGET_HEIGHT_M;
  const heightFactor = options.heightFactor ?? 1;
  const scaleMultiplier = options.scaleMultiplier ?? 1;
  const { heightDim, rotX } = resolveCharacterHeightDim(bounds.size);
  const scale = (targetHeightM * heightFactor / heightDim) * scaleMultiplier;
  const footY = computeFootPivotY(bounds, scale);
  return { scale, rotX, footY };
}

/** Y offset so the scaled mesh sits on y = 0. */
export function computeFootPivotY(bounds: GltfBounds, scale: number): number {
  const y = Number.isFinite(bounds.min.y) ? -bounds.min.y * scale : 0;
  return Number.isFinite(y) ? y : 0;
}

function ratioIfValid(target: number, raw: number): number | null {
  if (!Number.isFinite(target) || !Number.isFinite(raw) || raw < 1e-4) return null;
  return target / raw;
}

/** Uniform scale to match a real-world target box (metres W×H×D). */
export function computePropUniformScale(
  bounds: GltfBounds,
  targetSizeM: readonly [number, number, number],
  fitAxis: PropFitAxis = 'height',
): number {
  const ratios = [
    ratioIfValid(targetSizeM[0], bounds.size.x),
    ratioIfValid(targetSizeM[1], bounds.size.y),
    ratioIfValid(targetSizeM[2], bounds.size.z),
  ].filter((r): r is number => r != null);

  if (ratios.length === 0) return 1;

  switch (fitAxis) {
    case 'width':
      return ratios[0] ?? 1;
    case 'height':
      return ratios[1] ?? ratios[0] ?? 1;
    case 'depth':
      return ratios[2] ?? ratios[0] ?? 1;
    case 'maxHorizontal': {
      const hRatios = [ratios[0], ratios[2]].filter((r): r is number => r != null);
      return hRatios.length > 0 ? Math.max(...hRatios) : 1;
    }
    case 'maxExtent': {
      const raw = Math.max(bounds.size.x, bounds.size.y, bounds.size.z);
      const target = Math.max(...targetSizeM);
      return raw > 1e-4 ? target / raw : 1;
    }
    default: {
      const _exhaustive: never = fitAxis;
      return _exhaustive;
    }
  }
}

export interface PropGltfFit {
  scale: number;
  footY: number;
}

/** Resolve final prop scale: optional target box in metres × manual multiplier. */
export function fitPropGltf(
  bounds: GltfBounds,
  options: {
    targetSizeM?: readonly [number, number, number];
    fitAxis?: PropFitAxis;
    manualScale?: number;
  } = {},
): PropGltfFit {
  const manualScale = options.manualScale ?? 1;
  const autoScale = options.targetSizeM
    ? computePropUniformScale(bounds, options.targetSizeM, options.fitAxis ?? 'height')
    : 1;
  const scale = autoScale * manualScale;
  return { scale, footY: computeFootPivotY(bounds, scale) };
}

/** Uniform scale so the mesh footprint spans a scene width×depth (metres). */
export function computeInteriorBackdropScale(
  bounds: GltfBounds,
  sceneFootprintM: readonly [number, number],
): number {
  const [sceneWidth, sceneDepth] = sceneFootprintM;
  const widthRatio = ratioIfValid(sceneWidth, bounds.size.x);
  const depthRatio = ratioIfValid(sceneDepth, bounds.size.z);
  const ratios = [widthRatio, depthRatio].filter((r): r is number => r != null);
  if (ratios.length === 0) return 1;
  return Math.max(...ratios);
}
