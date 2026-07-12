import * as THREE from 'three';
import { disposeObject3DTree } from '@/engine/three/disposeThreeResources';

export interface ThreeLodLevel {
  object: THREE.Object3D;
  /** Distance threshold — same semantics as THREE.LOD.addLevel */
  distance: number;
}

/** Build a native THREE.LOD group (high → medium → low by distance). */
export function createThreeLodGroup(levels: ReadonlyArray<ThreeLodLevel>): THREE.LOD {
  const lod = new THREE.LOD();
  for (const { object, distance } of levels) {
    lod.addLevel(object, distance);
  }
  return lod;
}

/** Dispose all LOD level objects and clear levels. */
export function disposeThreeLodGroup(lod: THREE.LOD): void {
  for (const level of lod.levels) {
    disposeObject3DTree(level.object);
  }
  lod.clear();
}
