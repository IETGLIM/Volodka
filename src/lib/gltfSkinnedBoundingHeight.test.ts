import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getGltfSkinnedVisualHeightMeters, GLTF_SKINNED_VISUAL_HEIGHT_FALLBACK_M } from '@/lib/gltfSkinnedBoundingHeight';

describe('getGltfSkinnedVisualHeightMeters', () => {
  it('returns fallback for empty group', () => {
    const g = new THREE.Group();
    const scratch = new THREE.Vector3();
    expect(getGltfSkinnedVisualHeightMeters(g, scratch)).toBe(GLTF_SKINNED_VISUAL_HEIGHT_FALLBACK_M);
  });
});
