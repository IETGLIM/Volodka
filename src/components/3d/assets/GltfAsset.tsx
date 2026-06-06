import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getAssetDefinition, resolveVariantUrl } from '@/config/assetManifest';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';

/** drei GLTFLoader types (three-stdlib) vs three/jm decoders — cast at boundary */
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

export interface GltfAssetProps {
  assetId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  fallback?: React.ReactNode;
}

function GltfAssetInner({
  assetId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: Omit<GltfAssetProps, 'fallback'>) {
  const { preset } = useGraphicsQuality();
  const asset = getAssetDefinition(assetId);
  const url = asset
    ? resolveVariantUrl(asset, preset.compression, 0, preset.lodBias)
    : '';

  const gltf = useGLTF(url, true, true, extendLoader);

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = asset?.castShadow ?? false;
        node.receiveShadow = asset?.receiveShadow ?? true;
      }
    });
    return clone;
  }, [gltf.scene, asset]);

  const scaleProp =
    typeof scale === 'number' ? ([scale, scale, scale] as [number, number, number]) : scale;

  return (
    <group position={position} rotation={rotation} scale={scaleProp}>
      <primitive object={scene} />
    </group>
  );
}

/** GLB/GLTF asset with compression variant + quality preset integration. */
export function GltfAsset({ fallback = null, assetId, ...props }: GltfAssetProps) {
  if (!getAssetDefinition(assetId)) return fallback;

  return (
    <Suspense fallback={fallback}>
      <GltfAssetInner assetId={assetId} {...props} />
    </Suspense>
  );
}

export function preloadGltfAsset(assetId: string): void {
  const asset = getAssetDefinition(assetId);
  if (!asset) return;
  for (const lod of asset.lods) useGLTF.preload(lod.url, true, true, extendLoader);
  if (asset.variants) {
    for (const url of Object.values(asset.variants)) {
      if (url) useGLTF.preload(url, true, true, extendLoader);
    }
  }
}
