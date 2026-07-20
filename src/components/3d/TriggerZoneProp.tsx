/* ─── Volodka RPG – GLB prop mesh at trigger zone position ─── */

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { Suspense, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useCurrentSceneId } from '@/store/selectors';
import { TRIGGER_ZONES, type TriggerZone, isTriggerZoneAvailable } from '@/data/triggerZones';
import { getPropModelDefinition } from '@/config/propModelRegistry';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import {
  GltfPreloadPriority,
  scheduleGltfPreload,
} from '@/engine/assets/gltfPreloadScheduler';
import { useGltfPropPlacement } from '@/hooks/useGltfPropPlacement';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { useSceneLoadedGate } from '@/hooks/useSceneLoadedGate';
import { disposeClonedScene, createSourceSkipSet } from '@/engine/three/disposeThreeResources';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

interface TriggerZonePropMeshProps {
  zone: TriggerZone;
}

/** Resolves the prop definition before mounting the mesh so hooks below run unconditionally */
function TriggerZonePropMesh({ zone }: TriggerZonePropMeshProps) {
  const def = getPropModelDefinition(zone.propModelId!);
  if (!def) return null;
  return <TriggerZonePropMeshInner zone={zone} def={def} />;
}

interface TriggerZonePropMeshInnerProps {
  zone: TriggerZone;
  def: NonNullable<ReturnType<typeof getPropModelDefinition>>;
}

function TriggerZonePropMeshInner({ zone, def }: TriggerZonePropMeshInnerProps) {
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

  // Dispose the cloned scene on unmount or when gltf.scene changes.
  // R3F does not auto-dispose <primitive> objects, so the clone's
  // geometries + materials would otherwise leak per scene visit.
  // Skip shared resources with the cached source scene to avoid
  // corrupting the useGLTF cache (would cause shader recompiles +
  // GPU re-uploads on every scene revisit).
  useEffect(() => {
    return () => disposeClonedScene(clone, { skip: createSourceSkipSet(gltf.scene) });
  }, [clone, gltf.scene]);

  const scale = def.scale ?? 1;
  const { scale: fitScale, footY } = useGltfPropPlacement(clone, {
    manualScale: scale,
    targetSizeM: def.targetSizeM,
    fitAxis: def.fitAxis,
  });
  const baseRotation = def.rotation ?? [0, 0, 0];
  const offset = def.offset ?? [0, 0, 0];
  const zoneOffset = zone.propOffset ?? [0, 0, 0];
  const rotationY = baseRotation[1] + (zone.propRotationY ?? 0);

  return (
    <group
      position={[
        zone.position[0] + offset[0] + zoneOffset[0],
        zone.position[1] + offset[1] + zoneOffset[1] + footY,
        zone.position[2] + offset[2] + zoneOffset[2],
      ]}
      rotation={[baseRotation[0], rotationY, baseRotation[2]]}
      scale={[fitScale, fitScale, fitScale]}
    >
      <primitive object={clone} />
    </group>
  );
}

/** Renders shipped GLB props for trigger zones in the active scene. */
export function TriggerZoneProps() {
  const sceneId = useCurrentSceneId();
  const sceneLoaded = useSceneLoadedGate(sceneId);
  const { preset } = useGraphicsQuality();
  const flags = useGameStore((s) => s.playerState.flags);
  const currentAct = useGameStore((s) => s.playerState.progression.currentAct);
  const activeTTLFlags = useGameStore((s) => s.activeTTLFlags);
  // One-time zones that have been triggered — their props should disappear
  // (Gothic-style: pick up item → item is gone from the world).
  const interactiveObjectStates = useGameStore((s) => s.interactiveObjectStates);
  const zones = useMemo(
    () =>
      TRIGGER_ZONES.filter(
        (z) =>
          z.sceneId === sceneId &&
          z.propModelId &&
          isTriggerZoneAvailable(z, flags, currentAct, activeTTLFlags) &&
          // Hide prop if this one-time zone was already triggered (item picked up).
          !(z.isOneTime && interactiveObjectStates[z.id]),
      ),
    [sceneId, flags, currentAct, activeTTLFlags, interactiveObjectStates],
  );

  if (
    !sceneLoaded ||
    !allowsGlbAssetRendering(preset.environmentRenderMode) ||
    zones.length === 0
  ) {
    return null;
  }

  return (
    <group key={`props:${sceneId}`}>
      {zones.map((zone) => (
        <Suspense key={zone.id} fallback={null}>
          <TriggerZonePropMesh zone={zone} />
        </Suspense>
      ))}
    </group>
  );
}

/** Warm prop GLBs for a scene (call from GPU lifecycle). */
export function preloadTriggerZoneProps(
  sceneId: string,
  priority: GltfPreloadPriority = GltfPreloadPriority.High,
): void {
  for (const zone of TRIGGER_ZONES) {
    if (zone.sceneId !== sceneId || !zone.propModelId) continue;
    const def = getPropModelDefinition(zone.propModelId);
    if (!def) continue;
    scheduleGltfPreload(
      def.url,
      () => useGLTF.preload(def.url, true, true, extendLoader),
      priority,
    );
  }
}
