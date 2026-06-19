/* ─── Volodka RPG – CC0 interior GLB shells per scene ─── */

import { Suspense, useMemo } from 'react';
import { useCurrentSceneId } from '@/store/selectors';
import { getSceneInteriorAssets } from '@/config/sceneInteriorAssets';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useSceneLoadedGate } from '@/hooks/useSceneLoadedGate';
import { GltfAsset } from './assets/GltfAsset';

/** Renders shipped interior backdrop bundles for the active scene. */
export function SceneInteriorAssets() {
  const sceneId = useCurrentSceneId();
  const { preset } = useGraphicsQuality();
  const sceneLoaded = useSceneLoadedGate(sceneId);
  const placements = useMemo(() => getSceneInteriorAssets(sceneId), [sceneId]);

  if (
    !sceneLoaded ||
    !allowsGlbAssetRendering(preset.environmentRenderMode) ||
    placements.length === 0
  ) {
    return null;
  }

  return (
    <group key={`interior:${sceneId}`}>
      {placements.map((placement, index) => (
        <Suspense key={`${placement.assetId}:${index}`} fallback={null}>
          <GltfAsset
            assetId={placement.assetId}
            position={placement.position}
            rotation={placement.rotation}
            scale={placement.scale ?? 1}
          />
        </Suspense>
      ))}
    </group>
  );
}
