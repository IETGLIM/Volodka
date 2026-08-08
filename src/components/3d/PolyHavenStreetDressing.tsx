/* Street dressing: unique authored facades + Poly Haven props (no facade GLB clone grid). */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { POLYHAVEN_MODELS } from '@/config/polyhavenAssets';
import {
  STREET_FACADE_SCALE,
  STREET_SHUTTER_DOOR_SCALE,
  STREET_SHUTTER_WINDOW_SCALE,
} from '@/config/metricScaleCoherence';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { disposeClonedScene, createSourceSkipSet } from '@/engine/three/disposeThreeResources';
import { UniqueStreetFacades } from './UniqueStreetFacades';
import { InstancedProp, type InstancedPropTransform } from '@/engine/graphics/InstancedProp';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

const FIRE_ESCAPES: Array<{ position: [number, number, number]; rotationY: number; scale: number }> = [
  { position: [-10.0, 0, -15.2], rotationY: 0.12, scale: 1.2 },
  { position: [10.8, 0, -18.5], rotationY: Math.PI - 0.08, scale: 1.25 },
  { position: [-11.2, 0, -5.8], rotationY: 0.2, scale: 1.05 },
  { position: [13.8, 0, 6.2], rotationY: -Math.PI / 2 - 0.04, scale: 0.95 },
  { position: [-0.8, 0, -24.2], rotationY: 0.03, scale: 1.15 },
];

type GltfMaterialVariant = {
  tint?: string;
  envMapIntensity?: number;
  roughnessFloor?: number;
};

const AUTHORED_STREET_FACADES: Array<{
  position: [number, number, number];
  rotationY: number;
  scale: number;
  variant: GltfMaterialVariant;
}> = [
  { position: [-12.4, 0, -16.0], rotationY: 0.06, scale: STREET_FACADE_SCALE.hero, variant: { tint: '#9aa0ad', envMapIntensity: 0.58, roughnessFloor: 0.62 } },
  { position: [-12.8, 0, -5.4], rotationY: 0.18, scale: STREET_FACADE_SCALE.mid, variant: { tint: '#7f8b96', envMapIntensity: 0.52, roughnessFloor: 0.68 } },
  { position: [-11.8, 0, 6.3], rotationY: Math.PI / 2 + 0.04, scale: STREET_FACADE_SCALE.side, variant: { tint: '#a28d7c', envMapIntensity: 0.55, roughnessFloor: 0.64 } },
  { position: [12.8, 0, -18.8], rotationY: Math.PI - 0.11, scale: STREET_FACADE_SCALE.hero + 0.06, variant: { tint: '#7b8190', envMapIntensity: 0.62, roughnessFloor: 0.58 } },
  { position: [14.0, 0, -7.0], rotationY: Math.PI + 0.14, scale: STREET_FACADE_SCALE.mid + 0.04, variant: { tint: '#8c7f72', envMapIntensity: 0.54, roughnessFloor: 0.7 } },
  { position: [12.5, 0, 5.5], rotationY: -Math.PI / 2 - 0.09, scale: STREET_FACADE_SCALE.side + 0.04, variant: { tint: '#8fa0a5', envMapIntensity: 0.56, roughnessFloor: 0.66 } },
  { position: [0.6, 0, -25.2], rotationY: 0.02, scale: STREET_FACADE_SCALE.hero + 0.1, variant: { tint: '#756f74', envMapIntensity: 0.5, roughnessFloor: 0.72 } },
];

function clonePreparedScene(
  source: THREE.Object3D,
  castShadow: boolean,
  variant?: GltfMaterialVariant,
): THREE.Object3D {
  const clone = source.clone(true);
  clone.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone());
      } else {
        mesh.material = mesh.material.clone();
      }
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m && 'envMapIntensity' in m) {
          const std = m as THREE.MeshStandardMaterial;
          std.envMapIntensity = variant?.envMapIntensity ?? 0.55;
          if (variant?.tint && std.color) {
            std.color.multiply(new THREE.Color(variant.tint));
          }
          if (typeof std.roughness === 'number') {
            std.roughness = Math.min(1, Math.max(variant?.roughnessFloor ?? 0.58, std.roughness * 1.18));
          }
          if (typeof std.metalness === 'number') {
            std.metalness = Math.min(std.metalness, 0.35);
          }
          std.polygonOffset = true;
          std.polygonOffsetFactor = 1;
          std.polygonOffsetUnits = 1;
          std.needsUpdate = true;
        }
      }
    }
  });
  return clone;
}

function GltfProp({
  url,
  position,
  rotationY = 0,
  scale = 1,
  castShadow = true,
  variant,
}: {
  url: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  castShadow?: boolean;
  variant?: GltfMaterialVariant;
}) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const cloneRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    const next = clonePreparedScene(gltf.scene, castShadow, variant);
    if (cloneRef.current) {
      disposeClonedScene(cloneRef.current, { skip: createSourceSkipSet(gltf.scene) });
    }
    cloneRef.current = next;
    setScene(next);
    return () => {
      if (cloneRef.current) {
        disposeClonedScene(cloneRef.current, { skip: createSourceSkipSet(gltf.scene) });
        cloneRef.current = null;
      }
    };
  }, [gltf.scene, castShadow, variant]);

  if (!scene) return null;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function StreetPropDressing() {
  const { preset } = useGraphicsQuality();
  const castShadow = preset.shadows;

  // ── Instanced prop transforms (stable refs via useMemo) ──
  // BEFORE: each group was N individual <GltfProp> mounts = N × meshParts draw calls
  // AFTER:  1 <InstancedProp> per group = meshParts draw calls total
  //
  // Fire escapes: 5 instances × ~4 parts ≈ 20 draw calls → 4 draw calls
  const fireEscapeInstances = useMemo(
    () => FIRE_ESCAPES.map((p) => ({ position: p.position, rotation: [0, p.rotationY, 0] as [number, number, number], scale: p.scale } as InstancedPropTransform)),
    [],
  );
  // Benches: 3 × ~3 parts ≈ 9 → 3
  const benchInstances = useMemo<InstancedPropTransform[]>(
    () => [
      { position: [0, 0, 0], scale: 1.35 },
      { position: [-4.4, 0, 2.0], rotation: [0, Math.PI / 2, 0], scale: 1.15 },
      { position: [3.8, 0, -6.4], rotation: [0, -0.4, 0], scale: 1.1 },
    ],
    [],
  );
  // Metal trash cans: 2 × ~2 parts ≈ 4 → 2
  const trashCanInstances = useMemo<InstancedPropTransform[]>(
    () => [
      { position: [2.15, 0, 3.1], scale: 1.2 },
      { position: [-2.55, 0, -8.1], rotation: [0, 0.4, 0], scale: 1.1 },
    ],
    [],
  );
  // Trash bags: 2 × ~2 parts ≈ 4 → 2
  const trashbagInstances = useMemo<InstancedPropTransform[]>(
    () => [
      { position: [2.55, 0, 3.35], rotation: [0, 0.7, 0], scale: 1.4 },
      { position: [-2.9, 0, -7.7], rotation: [0, -0.3, 0], scale: 1.25 },
    ],
    [],
  );
  // Barrels: 2 × ~2 parts ≈ 4 → 2
  const barrelInstances = useMemo<InstancedPropTransform[]>(
    () => [
      { position: [2.4, 0, 2.5], scale: 1.15 },
      { position: [-3.1, 0, -7.2], rotation: [0, 0.9, 0], scale: 1.05 },
    ],
    [],
  );
  // Cardboard boxes: 2 × ~2 parts ≈ 4 → 2
  const cardboardBoxInstances = useMemo<InstancedPropTransform[]>(
    () => [
      { position: [-5.2, 0, -3.5], rotation: [0, 0.35, 0], scale: 1.5 },
      { position: [-4.7, 0.55, -3.3], rotation: [0, -0.6, 0], scale: 1.15 },
    ],
    [],
  );

  return (
    <group>
      {/* ── Instanced props (batched draw calls) ── */}
      <InstancedProp url={POLYHAVEN_MODELS.fireEscape} instances={fireEscapeInstances} castShadow={castShadow} />
      <InstancedProp url={POLYHAVEN_MODELS.bench} instances={benchInstances} />
      <InstancedProp url={POLYHAVEN_MODELS.metalTrashCan} instances={trashCanInstances} />
      <InstancedProp url={POLYHAVEN_MODELS.trashbag} instances={trashbagInstances} />
      <InstancedProp url={POLYHAVEN_MODELS.barrel} instances={barrelInstances} />
      <InstancedProp url={POLYHAVEN_MODELS.cardboardBox} instances={cardboardBoxInstances} />

      {/* ── Unique props (single instance — no instancing benefit) ── */}
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterDoor} position={[11.6, 0, -17.8]} rotationY={Math.PI} scale={STREET_SHUTTER_DOOR_SCALE} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.roadBarrierAlt} position={[-5.9, 0, 8.7]} rotationY={-0.18} scale={1.15} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.roadBarrier} position={[0.3, 0, 9.2]} rotationY={0.08} scale={1.25} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.wetFloorSign} position={[1.6, 0, 1.2]} rotationY={-0.5} scale={1.3} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.woodenCrate} position={[4.7, 0, -6.9]} rotationY={0.25} scale={1.3} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.oldTyre} position={[4.2, 0, -7.45]} rotationY={0.8} scale={1.2} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.manholeCover} position={[-0.8, 0.018, -1.8]} rotationY={0.4} scale={1.25} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.streetLamp} position={[-6.2, 0, -1.2]} scale={1.0} castShadow={castShadow} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.streetLampAlt} position={[5.8, 0, 2.8]} rotationY={Math.PI / 5} scale={1.0} castShadow={castShadow} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.industrialLamp} position={[-5.5, 3.8, -2]} scale={1.25} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterWindow} position={[12.5, 5.2, -19.2]} rotationY={Math.PI} scale={STREET_SHUTTER_WINDOW_SCALE} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.exteriorAirconUnit} position={[-12.3, 4.25, -11.6]} rotationY={0.08} scale={1.1} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.securityCamera} position={[12.3, 4.8, -13.2]} rotationY={Math.PI} scale={0.85} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.powerBox} position={[-10.7, 0, 2.4]} rotationY={0.08} scale={1.0} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.utilityBox} position={[9.8, 0, -3.2]} rotationY={Math.PI} scale={1.05} />
      </Suspense>
    </group>
  );
}

function AuthoredStreetArchitecture() {
  const { preset } = useGraphicsQuality();
  const castShadow = preset.shadows;

  return (
    <group>
      {AUTHORED_STREET_FACADES.map((p, i) => (
        <Suspense key={`street-authored-facade-${i}`} fallback={null}>
          <GltfProp
            url={POLYHAVEN_MODELS.urbanFacade}
            position={p.position}
            rotationY={p.rotationY}
            scale={p.scale}
            castShadow={castShadow}
            variant={p.variant}
          />
        </Suspense>
      ))}
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterDoor} position={[-10.6, 0, -2.4]} rotationY={0.08} scale={STREET_SHUTTER_DOOR_SCALE} variant={{ tint: '#8a8f96', roughnessFloor: 0.56 }} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterDoor} position={[12.2, 0, -14.8]} rotationY={Math.PI} scale={STREET_SHUTTER_DOOR_SCALE * 0.96} variant={{ tint: '#746a62', roughnessFloor: 0.64 }} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterWindow} position={[-12.0, 5.4, -9.8]} rotationY={0.08} scale={STREET_SHUTTER_WINDOW_SCALE * 1.04} variant={{ tint: '#9299a2' }} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterWindowAlt} position={[13.1, 5.8, -3.8]} rotationY={Math.PI} scale={STREET_SHUTTER_WINDOW_SCALE * 0.98} variant={{ tint: '#7b858c' }} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterWindow} position={[-12.4, 6.2, 3.4]} rotationY={Math.PI / 2 + 0.04} scale={STREET_SHUTTER_WINDOW_SCALE} variant={{ tint: '#a08f80' }} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterWindow} position={[0.2, 6.4, -24.7]} rotationY={0.02} scale={STREET_SHUTTER_WINDOW_SCALE * 1.06} variant={{ tint: '#6f747c' }} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterDoor} position={[5.4, 0, -24.4]} rotationY={0.02} scale={STREET_SHUTTER_DOOR_SCALE * 0.94} variant={{ tint: '#8c8378', roughnessFloor: 0.62 }} />
      </Suspense>
    </group>
  );
}

/** Procedural facades on low only; authored GLTF architecture on medium+. */
export function HeroStreetFacadesWithAssets() {
  const { preset } = useGraphicsQuality();
  const glbProps =
    preset.id !== 'low' && allowsGlbAssetRendering(preset.environmentRenderMode);

  return (
    <group>
      {glbProps ? (
        <Suspense fallback={null}>
          <AuthoredStreetArchitecture />
        </Suspense>
      ) : (
        <UniqueStreetFacades />
      )}
      {glbProps ? (
        <Suspense fallback={null}>
          <StreetPropDressing />
        </Suspense>
      ) : null}
    </group>
  );
}

// FIX S13-13: module-level preload loop REMOVED. This was a DUPLICATE of
// sceneGpuLifecycle.ts:preloadSceneStreetDressing which already preloads the
// same 23 URLs via STREET_NIGHT_DRESSING_URLS (streetDressingGpuUrls.ts) when
// street_night enters. The module-level loop fired whenever this chunk loaded
// (even during volodka_room if the street chunk was previously imported),
// queuing 23 preloads in the scheduler that drained via requestIdleCallback
// during the WRONG scene — causing the 3.8s frame freeze. Scene-gated preload
// in sceneGpuLifecycle is the single source of truth.
