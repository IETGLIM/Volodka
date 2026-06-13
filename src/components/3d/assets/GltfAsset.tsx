import { Suspense, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { getAssetDefinition, resolveVariantUrl } from '@/config/assetManifest';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
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
  const lodGroupRefs = useRef<Map<string, THREE.Group>>(new Map());

  if (!asset || asset.shipped !== true) return null;

  const castShadow = asset.castShadow ?? false;
  const receiveShadow = asset.receiveShadow ?? true;
  const scaleProp =
    typeof scale === 'number' ? ([scale, scale, scale] as [number, number, number]) : scale;

  const defaultUrl = resolveVariantUrl(asset, preset.compression, 0, preset.lodBias);
  const useDistanceLod = asset.lods.length > 1;

  return (
    <group position={position} rotation={rotation} scale={scaleProp}>
      {useDistanceLod ? (
        <LodSwitcher asset={asset}>
          {({ activeUrlRef, urls }) => (
            <GltfLodBranches
              urls={urls}
              activeUrlRef={activeUrlRef}
              lodGroupRefs={lodGroupRefs}
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
  lodGroupRefs,
  castShadow,
  receiveShadow,
}: {
  urls: readonly string[];
  activeUrlRef: React.MutableRefObject<string>;
  lodGroupRefs: React.MutableRefObject<Map<string, THREE.Group>>;
  castShadow: boolean;
  receiveShadow: boolean;
}) {
  useFrameTick(
    'misc',
    () => {
      const activeUrl = activeUrlRef.current;
      for (const url of urls) {
        const group = lodGroupRefs.current.get(url);
        if (group) group.visible = url === activeUrl;
      }
    },
    { label: 'GltfAssetLodVisibility' },
  );

  return (
    <>
      {urls.map((lodUrl) => (
        <group
          key={lodUrl}
          ref={(node) => {
            if (node) lodGroupRefs.current.set(lodUrl, node);
            else lodGroupRefs.current.delete(lodUrl);
          }}
          visible={lodUrl === activeUrlRef.current}
        >
          <Suspense fallback={null}>
            <GltfAssetScene
              url={lodUrl}
              castShadow={castShadow}
              receiveShadow={receiveShadow}
            />
          </Suspense>
        </group>
      ))}
    </>
  );
}

/** GLB/GLTF asset — Draco/Meshopt via quality preset, distance LOD when manifest has LOD chain. */
export function GltfAsset({ fallback = null, assetId, ...props }: GltfAssetProps) {
  const asset = getAssetDefinition(assetId);
  if (!asset || asset.shipped !== true) return fallback;

  return (
    <Suspense fallback={fallback}>
      <GltfAssetInner assetId={assetId} {...props} />
    </Suspense>
  );
}

export function preloadGltfAsset(assetId: string): void {
  const asset = getAssetDefinition(assetId);
  if (!asset || asset.shipped !== true) return;
  for (const lod of asset.lods) useGLTF.preload(lod.url, true, true, extendLoader);
  if (asset.variants) {
    for (const url of Object.values(asset.variants)) {
      if (url) useGLTF.preload(url, true, true, extendLoader);
    }
  }
}
