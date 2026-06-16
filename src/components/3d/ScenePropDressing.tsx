/* ─── Volodka RPG – Kenney / AI3DGen GLB set dressing per scene ─── */

import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCurrentSceneId } from '@/store/selectors';
import { getPropModelDefinition } from '@/config/propModelRegistry';
import type { SceneId } from '@/shared/types/game';
import { getScenePropDressing, type ScenePropPlacement } from '@/config/scenePropDressing';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useGltfPropPlacement } from '@/hooks/useGltfPropPlacement';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

interface ScenePropMeshProps {
  placement: ScenePropPlacement;
}

function ScenePropMesh({ placement }: ScenePropMeshProps) {
  const def = getPropModelDefinition(placement.propModelId);
  if (!def) return null;
  return <ScenePropMeshInner placement={placement} def={def} />;
}

interface ScenePropMeshInnerProps {
  placement: ScenePropPlacement;
  def: NonNullable<ReturnType<typeof getPropModelDefinition>>;
}

function ScenePropMeshInner({ placement, def }: ScenePropMeshInnerProps) {
  const gltf = useGLTF(def.url, true, true, extendLoader);
  const clone = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return root;
  }, [gltf.scene]);

  const scale = def.scale ?? 1;
  const { scale: fitScale, footY } = useGltfPropPlacement(clone, {
    manualScale: scale,
    targetSizeM: def.targetSizeM,
    fitAxis: def.fitAxis,
  });
  const baseRotation = def.rotation ?? [0, 0, 0];
  const offset = def.offset ?? [0, 0, 0];
  const placementOffset = placement.offset ?? [0, 0, 0];
  const rotationY = baseRotation[1] + (placement.rotationY ?? 0);

  return (
    <group
      position={[
        placement.position[0] + offset[0] + placementOffset[0],
        placement.position[1] + offset[1] + placementOffset[1] + footY,
        placement.position[2] + offset[2] + placementOffset[2],
      ]}
      rotation={[baseRotation[0], rotationY, baseRotation[2]]}
      scale={[fitScale, fitScale, fitScale]}
    >
      <primitive object={clone} />
    </group>
  );
}

/** Renders shipped GLB props configured in scenePropDressing for the active scene. */
export function ScenePropDressing() {
  const sceneId = useCurrentSceneId();
  const { preset } = useGraphicsQuality();
  const placements = useMemo(() => getScenePropDressing(sceneId), [sceneId]);

  if (!allowsGlbAssetRendering(preset.environmentRenderMode) || placements.length === 0) {
    return null;
  }

  return (
    <group key={`dressing:${sceneId}`}>
      {placements.map((placement, index) => (
        <Suspense key={`${placement.propModelId}:${index}`} fallback={null}>
          <ScenePropMesh placement={placement} />
        </Suspense>
      ))}
    </group>
  );
}

/** Warm dressing GLBs for a scene (call from GPU lifecycle). */
export function preloadScenePropDressing(sceneId: SceneId): void {
  for (const placement of getScenePropDressing(sceneId)) {
    const def = getPropModelDefinition(placement.propModelId);
    if (def) useGLTF.preload(def.url, true, true, extendLoader);
  }
}
