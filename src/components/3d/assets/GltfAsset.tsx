/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { Suspense, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { getAssetDefinition, isAssetEffectiveShipped, resolveAssetUrl } from '@/config/assetManifest';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import {
  GltfPreloadPriority,
  scheduleGltfPreload,
} from '@/engine/assets/gltfPreloadScheduler';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { weatherEnvironmentMaterials } from '@/engine/graphics/materials/weatherEnvironmentMaterials';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { measureGltfBounds } from '@/engine/assets/gltfScale';
import { LodSwitcher } from './LodSwitcher';

/** drei GLTFLoader types (three-stdlib) vs three/jm decoders — cast at boundary */
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

export interface GltfAssetProps {
  assetId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  /**
   * Lift the model so its lowest point sits at placement y (default: false).
   * FIX v4.14.0: manifest GLB bundles may carry minY < 0 (env_cafe_props
   * minY −0.247 → при scale 1.5 проседал на 0.37 м под пол).
   */
  groundAnchor?: boolean;
  fallback?: React.ReactNode;
}

interface GltfAssetSceneProps {
  url: string;
  castShadow: boolean;
  receiveShadow: boolean;
  visible?: boolean;
  groundAnchor: boolean;
}

function GltfAssetScene({ url, castShadow, receiveShadow, visible = true, groundAnchor }: GltfAssetSceneProps) {
  const gltf = useGLTF(url, true, true, extendLoader);

  const cloneOptions = useMemo(
    () => ({ castShadow, receiveShadow }),
    [castShadow, receiveShadow],
  );

  const { scene } = useSkinnedGltfClone(gltf.scene, gltf.animations, cloneOptions);

  useLayoutEffect(() => {
    weatherEnvironmentMaterials(scene, 'prop');
  }, [scene]);

  // Ground anchor: lift the raw clone (unit scale) so min.y sits at 0.
  // The lift is applied INSIDE the parent's scale group, so it scales with
  // the placement scale — same semantics as ScenePropDressing footY.
  const liftY = useMemo(() => {
    if (!groundAnchor) return 0;
    try {
      const bounds = measureGltfBounds(scene);
      if (!Number.isFinite(bounds.min.y)) return 0;
      return -bounds.min.y;
    } catch {
      return 0;
    }
  }, [scene, groundAnchor]);

  return (
    <group position={[0, liftY, 0]}>
      <primitive object={scene} visible={visible} />
    </group>
  );
}

function GltfAssetInner({
  assetId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  groundAnchor = false,
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
              groundAnchor={groundAnchor}
            />
          )}
        </LodSwitcher>
      ) : (
        <Suspense fallback={null}>
          <GltfAssetScene
            url={defaultUrl}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
            groundAnchor={groundAnchor}
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
  groundAnchor,
}: {
  urls: readonly string[];
  activeUrlRef: React.MutableRefObject<string>;
  castShadow: boolean;
  receiveShadow: boolean;
  groundAnchor: boolean;
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
    }, 200); // 5Hz — LOD switches are not latency-critical; fewer timers help INP
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
        groundAnchor={groundAnchor}
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
