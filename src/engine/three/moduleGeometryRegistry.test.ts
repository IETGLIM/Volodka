import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  disposeAllModuleGeometries,
  getRegisteredModuleGeometryCount,
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedTorusGeometry,
  registerModuleGeometries,
  registerModuleGeometry,
} from '@/engine/three/moduleGeometryRegistry';

describe('moduleGeometryRegistry', () => {
  beforeEach(() => {
    disposeAllModuleGeometries();
  });

  it('getSharedBoxGeometry returns the same instance for identical args', () => {
    const a = getSharedBoxGeometry(2, 3, 4);
    const b = getSharedBoxGeometry(2, 3, 4);
    const c = getSharedBoxGeometry(2, 3, 5);

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('getSharedTorusGeometry and getSharedCylinderGeometry dedupe by parameters', () => {
    const torusA = getSharedTorusGeometry(0.08, 0.008, 4, 8);
    const torusB = getSharedTorusGeometry(0.08, 0.008, 4, 8);
    const cylA = getSharedCylinderGeometry(0.1, 0.08, 0.03, 8);
    const cylB = getSharedCylinderGeometry(0.1, 0.08, 0.03, 8);

    expect(torusA).toBe(torusB);
    expect(cylA).toBe(cylB);
    expect(torusA).not.toBe(cylA);
  });

  it('disposeAllModuleGeometries disposes registered and cached geometries', () => {
    const shared = getSharedPlaneGeometry(10, 12);
    const owned = registerModuleGeometry(new THREE.SphereGeometry(1, 4, 4));
    vi.spyOn(shared, 'dispose');
    vi.spyOn(owned, 'dispose');

    disposeAllModuleGeometries();

    expect(shared.dispose).toHaveBeenCalledTimes(1);
    expect(owned.dispose).toHaveBeenCalledTimes(1);
    expect(getSharedPlaneGeometry(10, 12)).not.toBe(shared);
  });

  it('registerModuleGeometries registers all geometries for global disposal', () => {
    const g1 = new THREE.BoxGeometry(1, 1, 1);
    const g2 = new THREE.SphereGeometry(1, 4, 4);
    vi.spyOn(g1, 'dispose');
    vi.spyOn(g2, 'dispose');

    registerModuleGeometries([g1, g2]);
    expect(getRegisteredModuleGeometryCount()).toBe(2);

    disposeAllModuleGeometries();

    expect(g1.dispose).toHaveBeenCalledTimes(1);
    expect(g2.dispose).toHaveBeenCalledTimes(1);
    expect(getRegisteredModuleGeometryCount()).toBe(0);
  });
});
