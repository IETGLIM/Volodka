/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { getAssetDefinition, isAssetEffectiveShipped, resolveAssetUrl } from '@/config/assetManifest';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import {
  GltfPreloadPriority,
  scheduleGltfPreload,
} from '@/engine/assets/gltfPreloadScheduler';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { LodSwitcher } from './LodSwitcher';

/** drei GLTFLoader types (three-stdlib) vs three/jm decoders — cast at boundary */
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

export interface GltfAssetProps {
  assetId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  fallback?: React.ReactNode;
}

interface GltfAssetSceneProps {
  url: string;
  castShadow: boolean;
  receiveShadow: boolean;
  visible?: boolean;
}

function GltfAssetScene({ url, castShadow, receiveShadow, visible = true }: GltfAssetSceneProps) {
  const gltf = useGLTF(url, true, true, extendLoader);

  const cloneOptions = useMemo(
    () => ({ castShadow, receiveShadow }),
    [castShadow, receiveShadow],
  );

  const { scene } = useSkinnedGltfClone(gltf.scene, gltf.animations, cloneOptions);

  return <primitive object={scene} visible={visible} />;
}

function GltfAssetInner({
  assetId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: Omit<GltfAssetProps, 'fallback'>) {
  const { preset } = useGraphicsQuality();
  const asset = getAssetDefinition(assetId);

  if (!isAssetEffectiveShipped(assetId) || !asset) return null;

  const castShadow = asset.castShadow ?? false;
  const receiveShadow = asset.receiveShadow ?? true;
  const scaleProp =
    typeof scale === 'number' ? ([scale, scale, scale] as [number, number, number]) : scale;

  const defaultUrl = resolveAssetUrl(asset, preset.compression, 0, preset.lodBias);
  const useDistanceLod = asset.lods.length > 1;

  return (
    <group position={position} rotation={rotation} scale={scaleProp}>
      {useDistanceLod ? (
        <LodSwitcher asset={asset}>
          {({ activeUrlRef, urls }) => (
            <GltfLodBranches
              urls={urls}
              activeUrlRef={activeUrlRef}
              castShadow={castShadow}
              receiveShadow={receiveShadow}
            />
          )}
        </LodSwitcher>
      ) : (
        <Suspense fallback={null}>
          <GltfAssetScene
            url={defaultUrl}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        </Suspense>
      )}
    </group>
  );
}

function GltfLodBranches({
  urls,
  activeUrlRef,
  castShadow,
  receiveShadow,
}: {
  urls: readonly string[];
  activeUrlRef: React.MutableRefObject<string>;
  castShadow: boolean;
  receiveShadow: boolean;
}) {
  // Mount ONLY the active LOD instead of all LODs simultaneously.
  // Previously every LOD URL was mounted as a sibling group and only
  // `visible` was toggled — meaning all LOD geometries were uploaded to
  // GPU VRAM at once (3-LOD asset cost 3× VRAM). Now we track the active
  // URL in state and render only that LOD. All LODs are still preloaded
  // by LodSwitcher (useGLTF.preload), so LOD changes are instant cache
  // hits with no Suspense fallback. This also eliminates the visibility
  // tick race between LodSwitcher's frame tick (writes activeUrlRef) and
  // GltfLodBranches's frame tick (reads activeUrlRef) — there's no longer
  // a GltfLodBranches tick.
  const [activeUrl, setActiveUrl] = useState(activeUrlRef.current);

  useEffect(() => {
    // Sync ref → state on LOD changes. Only fires setState when the URL
    // actually changes, so no per-frame re-renders.
    let lastUrl = activeUrlRef.current;
    setActiveUrl(lastUrl);
    const checkInterval = setInterval(() => {
      if (activeUrlRef.current !== lastUrl) {
        lastUrl = activeUrlRef.current;
        setActiveUrl(lastUrl);
      }
    }, 50); // 20Hz polling — LOD switches are not frame-critical
    return () => clearInterval(checkInterval);
  }, [activeUrlRef]);

  const activeUrlSafe = activeUrl && urls.includes(activeUrl) ? activeUrl : urls[0];

  return (
    <Suspense fallback={null}>
      <GltfAssetScene
        key={activeUrlSafe}
        url={activeUrlSafe}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />
    </Suspense>
  );
}

/** GLB/GLTF asset — Draco/Meshopt via quality preset, distance LOD when manifest has LOD chain. */
export function GltfAsset({ fallback = null, assetId, ...props }: GltfAssetProps) {
  if (!isAssetEffectiveShipped(assetId)) return fallback;

  return (
    <Suspense fallback={fallback}>
      <GltfAssetInner assetId={assetId} {...props} />
    </Suspense>
  );
}

export function preloadGltfAsset(
  assetId: string,
  priority: GltfPreloadPriority = GltfPreloadPriority.Critical,
): void {
  if (!isAssetEffectiveShipped(assetId)) return;
  const asset = getAssetDefinition(assetId);
  if (!asset) return;
  for (const lod of asset.lods) {
    scheduleGltfPreload(
      lod.url,
      () => useGLTF.preload(lod.url, true, true, extendLoader),
      priority,
    );
  }
  if (asset.variants) {
    for (const url of Object.values(asset.variants)) {
      if (url) {
        scheduleGltfPreload(
          url,
          () => useGLTF.preload(url, true, true, extendLoader),
          priority,
        );
      }
    }
  }
}
