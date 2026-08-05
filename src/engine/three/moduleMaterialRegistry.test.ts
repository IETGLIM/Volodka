import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  disposeAllModuleMaterials,
  getRegisteredModuleMaterialCount,
  getSharedStandardMaterial,
  mat,
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

  it('getSharedStandardMaterial dedupes emissive params', () => {
    // emissiveIntensity >0.6 is clamped to 0.45 by AAA de-plasticize,
    // so we must use values below the clamp threshold to test distinct keys.
    const a = getSharedStandardMaterial({
      color: '#00ff44',
      emissive: '#00ff44',
      emissiveIntensity: 0.3,
    });
    const b = getSharedStandardMaterial({
      color: '#00ff44',
      emissive: '#00ff44',
      emissiveIntensity: 0.3,
    });
    const c = getSharedStandardMaterial({
      color: '#00ff44',
      emissive: '#00ff44',
      emissiveIntensity: 0.5,
    });

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('getSharedStandardMaterial clamps high emissiveIntensity via AAA de-plasticize', () => {
    const a = getSharedStandardMaterial({
      color: '#00ff44',
      emissive: '#00ff44',
      emissiveIntensity: 3.0,
    });
    const b = getSharedStandardMaterial({
      color: '#00ff44',
      emissive: '#00ff44',
      emissiveIntensity: 2.0,
    });

    expect(a).toBe(b);
    expect(a.emissiveIntensity).toBeLessThanOrEqual(0.45);
  });

  it('mat() shorthand delegates to getSharedStandardMaterial', () => {
    const a = mat('#445566', { roughness: 0.7 });
    const b = getSharedStandardMaterial({ color: '#445566', roughness: 0.7 });
    expect(a).toBe(b);
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
