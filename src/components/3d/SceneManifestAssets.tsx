/* ─── Volodka RPG – asset manifest GLB bundles in scene visuals ─── */

import { Suspense, useMemo } from 'react';
import { useCurrentSceneId } from '@/store/selectors';
import { getSceneManifestAssets } from '@/config/sceneManifestAssets';
import { GltfAsset } from './assets/GltfAsset';

/** Renders shipped manifest bundles (env / vegetation) for the active scene. */
export function SceneManifestAssets() {
  const sceneId = useCurrentSceneId();
  const placements = useMemo(() => getSceneManifestAssets(sceneId), [sceneId]);

  if (placements.length === 0) return null;

  return (
    <group key={`manifest:${sceneId}`}>
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
