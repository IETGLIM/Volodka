import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { getAssetDefinition, resolveVariantUrl } from '@/config/assetManifest';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { LodSwitcher } from './LodSwitcher';
import { gltfExtendLoader as extendLoader } from './preloadGltfAsset';

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
}

function GltfAssetScene({ url, castShadow, receiveShadow }: GltfAssetSceneProps) {
  const gltf = useGLTF(url, true, true, extendLoader);

  const cloneOptions = useMemo(
    () => ({ castShadow, receiveShadow }),
    [castShadow, receiveShadow],
  );

  const { scene } = useSkinnedGltfClone(gltf.scene, gltf.animations, cloneOptions);

  return <primitive object={scene} />;
}

function GltfAssetInner({
  assetId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: Omit<GltfAssetProps, 'fallback'>) {
  const { preset } = useGraphicsQuality();
  const asset = getAssetDefinition(assetId);
  if (!asset) return null;

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
          {(lodUrl) => (
            <Suspense fallback={null}>
              <GltfAssetScene
                key={lodUrl}
                url={lodUrl}
                castShadow={castShadow}
                receiveShadow={receiveShadow}
              />
            </Suspense>
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

/** GLB/GLTF asset — Draco/Meshopt via quality preset, distance LOD when manifest has LOD chain. */
export function GltfAsset({ fallback = null, assetId, ...props }: GltfAssetProps) {
  if (!getAssetDefinition(assetId)) return fallback;

  return (
    <Suspense fallback={fallback}>
      <GltfAssetInner assetId={assetId} {...props} />
    </Suspense>
  );
}
