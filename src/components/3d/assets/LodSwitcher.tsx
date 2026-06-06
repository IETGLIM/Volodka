import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { GltfAssetDefinition } from '@/config/assetManifest';
import { resolveLodUrl } from '@/config/assetManifest';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';

export interface LodSwitcherProps {
  asset: GltfAssetDefinition;
  /** Render function per resolved LOD url */
  children: (lodUrl: string, distance: number) => React.ReactNode;
}

/**
 * Distance-based LOD selector — swaps GLB url as camera moves.
 * Pair with GltfAsset or custom useGLTF inside children().
 */
export function LodSwitcher({ asset, children }: LodSwitcherProps) {
  const anchorRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { preset } = useGraphicsQuality();
  const [lodUrl, setLodUrl] = useState(() => asset.lods[0]?.url ?? '');
  const [distance, setDistance] = useState(0);

  useFrame(() => {
    if (!anchorRef.current) return;
    const dist = camera.position.distanceTo(
      anchorRef.current.getWorldPosition(new THREE.Vector3()),
    );
    const next = resolveLodUrl(asset, dist, preset.lodBias);
    if (next !== lodUrl) setLodUrl(next);
    if (Math.abs(dist - distance) > 0.5) setDistance(dist);
  });

  return <group ref={anchorRef}>{children(lodUrl, distance)}</group>;
}
