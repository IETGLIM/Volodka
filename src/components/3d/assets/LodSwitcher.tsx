import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { GltfAssetDefinition } from '@/config/assetManifest';
import { resolveLodUrl } from '@/config/assetManifest';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

export interface LodSwitcherRenderInfo {
  activeUrlRef: React.MutableRefObject<string>;
  distanceRef: React.MutableRefObject<number>;
  urls: readonly string[];
}

export interface LodSwitcherProps {
  asset: GltfAssetDefinition;
  /** All LOD urls are preloaded; read activeUrlRef each frame for visibility swaps */
  children: (info: LodSwitcherRenderInfo) => React.ReactNode;
}

/**
 * Distance-based LOD selector — preloads every LOD url and swaps visibility
 * instead of remounting GLB scenes on distance change.
 */
export function LodSwitcher({ asset, children }: LodSwitcherProps) {
  const anchorRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const activeUrlRef = useRef(asset.lods[0]?.url ?? '');
  const distanceRef = useRef(0);
  const { camera } = useThree();
  const { preset } = useGraphicsQuality();

  const urls = useMemo(
    () => asset.lods.map((lod) => lod.url).filter(Boolean),
    [asset.lods],
  );

  useEffect(() => {
    for (const url of urls) {
      useGLTF.preload(url, true, true, extendLoader);
    }
    if (urls[0]) activeUrlRef.current = urls[0];
  }, [urls]);

  useFrameTick(
    'misc',
    () => {
      if (!anchorRef.current || urls.length === 0) return;
      const dist = camera.position.distanceTo(
        anchorRef.current.getWorldPosition(worldPosRef.current),
      );
      distanceRef.current = dist;
      const next = resolveLodUrl(asset, dist, preset.lodBias);
      if (next) activeUrlRef.current = next;
    },
    { label: 'LodSwitcher' },
  );

  return (
    <group ref={anchorRef}>
      {children({ activeUrlRef, distanceRef, urls })}
    </group>
  );
}
