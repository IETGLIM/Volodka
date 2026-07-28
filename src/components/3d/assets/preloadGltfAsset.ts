import { getAssetDefinition } from '@/config/assetManifest';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useGLTF } from '@react-three/drei';

/** drei GLTFLoader types (three-stdlib) vs three/jm decoders — cast at boundary */
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

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

export { extendLoader as gltfExtendLoader };
