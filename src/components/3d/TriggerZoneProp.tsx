/* ─── Volodka RPG – GLB prop mesh at trigger zone position ─── */

import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCurrentSceneId } from '@/store/selectors';
import { TRIGGER_ZONES, type TriggerZone } from '@/data/triggerZones';
import { getPropModelDefinition } from '@/config/propModelRegistry';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';

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

  const scale = def.scale ?? 1;
  const rotation = def.rotation ?? [0, 0, 0];
  const offset = def.offset ?? [0, 0, 0];

  return (
    <group
      position={[
        zone.position[0] + offset[0],
        zone.position[1] + offset[1],
        zone.position[2] + offset[2],
      ]}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <primitive object={clone} />
    </group>
  );
}

/** Renders shipped GLB props for trigger zones in the active scene. */
export function TriggerZoneProps() {
  const sceneId = useCurrentSceneId();
  const zones = useMemo(
    () => TRIGGER_ZONES.filter((z) => z.sceneId === sceneId && z.propModelId),
    [sceneId],
  );

  if (zones.length === 0) return null;

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
export function preloadTriggerZoneProps(sceneId: string): void {
  for (const zone of TRIGGER_ZONES) {
    if (zone.sceneId !== sceneId || !zone.propModelId) continue;
    const def = getPropModelDefinition(zone.propModelId);
    if (def) useGLTF.preload(def.url, true, true, extendLoader);
  }
}
