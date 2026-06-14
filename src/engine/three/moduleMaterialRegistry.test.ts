import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  disposeAllModuleMaterials,
  getRegisteredModuleMaterialCount,
  getSharedStandardMaterial,
  registerModuleMaterial,
} from './moduleMaterialRegistry';

describe('moduleMaterialRegistry', () => {
  it('getSharedStandardMaterial returns the same instance for identical params', () => {
    const a = getSharedStandardMaterial({ color: '#2a2030', roughness: 0.85 });
    const b = getSharedStandardMaterial({ color: '#2a2030', roughness: 0.85 });
    const c = getSharedStandardMaterial({ color: '#352540', roughness: 0.85 });

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('disposeAllModuleMaterials disposes registered and cached materials', () => {
    const shared = getSharedStandardMaterial({ color: '#111111', roughness: 0.5 });
    const owned = registerModuleMaterial(new THREE.MeshStandardMaterial({ color: '#222222' }));
    vi.spyOn(shared, 'dispose');
    vi.spyOn(owned, 'dispose');

    disposeAllModuleMaterials();

    expect(shared.dispose).toHaveBeenCalledTimes(1);
    expect(owned.dispose).toHaveBeenCalledTimes(1);
    expect(getRegisteredModuleMaterialCount()).toBe(0);
    expect(getSharedStandardMaterial({ color: '#111111', roughness: 0.5 })).not.toBe(shared);
  });
});
