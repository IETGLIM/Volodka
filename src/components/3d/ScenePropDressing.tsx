/* ─── Volodka RPG – Kenney / AI3DGen GLB set dressing per scene ─── */

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCurrentSceneId } from '@/store/selectors';
import { getPropModelDefinition } from '@/config/propModelRegistry';
import type { SceneId } from '@/shared/types/game';
import { getScenePropDressing, resolvePropDressingPreloadPriority, splitScenePropDressing, type ScenePropPlacement } from '@/config/scenePropDressing';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import {
  GltfPreloadPriority,
  scheduleGltfPreload,
} from '@/engine/assets/gltfPreloadScheduler';
import { useGltfPropPlacement } from '@/hooks/useGltfPropPlacement';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { useStaggeredMountCount } from '@/hooks/useStaggeredMountCount';
import { disposeClonedScene } from '@/engine/three/disposeThreeResources';

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

function buildPropClone(source: THREE.Object3D): THREE.Object3D {
  const root = source.clone(true);
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  return root;
}

function ScenePropMeshInner({ placement, def }: ScenePropMeshInnerProps) {
  const gltf = useGLTF(def.url, true, true, extendLoader);
  const [clone, setClone] = useState<THREE.Object3D | null>(null);
  const cloneRef = useRef<THREE.Object3D | null>(null);
  const placementFallback = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const commitClone = () => {
      if (cancelled) return;
      // Dispose the previous clone before setting the new one.
      // R3F does not auto-dispose <primitive> objects, so each clone
      // replacement otherwise leaks all geometries + materials.
      if (cloneRef.current) {
        disposeClonedScene(cloneRef.current);
        cloneRef.current = null;
      }
      const next = buildPropClone(gltf.scene);
      cloneRef.current = next;
      setClone(next);
    };

    setClone(null);
    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(commitClone, { timeout: 32 });
    } else {
      timeoutId = setTimeout(commitClone, 0);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      // Dispose the clone on unmount or gltf.scene change.
      if (cloneRef.current) {
        disposeClonedScene(cloneRef.current);
        cloneRef.current = null;
      }
    };
  }, [gltf.scene]);

  const scale = def.scale ?? 1;
  const { scale: fitScale, footY } = useGltfPropPlacement(clone ?? placementFallback, {
    manualScale: scale,
    targetSizeM: def.targetSizeM,
    fitAxis: def.fitAxis,
  });
  const baseRotation = def.rotation ?? [0, 0, 0];
  const offset = def.offset ?? [0, 0, 0];
  const placementOffset = placement.offset ?? [0, 0, 0];
  const rotationY = baseRotation[1] + (placement.rotationY ?? 0);

  if (!clone) return null;

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
  const { critical, deferred } = useMemo(() => splitScenePropDressing(sceneId), [sceneId]);
  const deferredVisible = useStaggeredMountCount(deferred.length);

  if (
    !allowsGlbAssetRendering(preset.environmentRenderMode) ||
    (critical.length === 0 && deferred.length === 0)
  ) {
    return null;
  }

  return (
    <group key={`dressing:${sceneId}`}>
      {critical.map((placement, index) => (
        <Suspense key={`${placement.propModelId}:${index}`} fallback={null}>
          <ScenePropMesh placement={placement} />
        </Suspense>
      ))}
      {deferred.slice(0, deferredVisible).map((placement, index) => (
        <Suspense key={`deferred:${placement.propModelId}:${index}`} fallback={null}>
          <ScenePropMesh placement={placement} />
        </Suspense>
      ))}
    </group>
  );
}

/** Warm dressing GLBs for a scene (call from GPU lifecycle). */
export function preloadScenePropDressing(
  sceneId: SceneId,
  _priority: GltfPreloadPriority = GltfPreloadPriority.Normal,
): void {
  for (const placement of getScenePropDressing(sceneId)) {
    const def = getPropModelDefinition(placement.propModelId);
    if (!def) continue;
    scheduleGltfPreload(
      def.url,
      () => useGLTF.preload(def.url, true, true, extendLoader),
      resolvePropDressingPreloadPriority(placement),
    );
  }
}
