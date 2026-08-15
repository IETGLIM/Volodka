import { LOD, Object3D } from 'three';
import { disposeObject3DTree } from '@/engine/three/disposeThreeResources';

export interface ThreeLodLevel {
  object: Object3D;
  /** Distance threshold — same semantics as LOD.addLevel */
  distance: number;
}

/** Build a native LOD group (high → medium → low by distance). */
export function createThreeLodGroup(levels: ReadonlyArray<ThreeLodLevel>): LOD {
  const lod = new LOD();
  for (const { object, distance } of levels) {
    lod.addLevel(object, distance);
  }
  return lod;
}

/** Dispose all LOD level objects and clear levels. */
export function disposeThreeLodGroup(lod: LOD): void {
  for (const level of lod.levels) {
    disposeObject3DTree(level.object);
  }
  lod.clear();
}
