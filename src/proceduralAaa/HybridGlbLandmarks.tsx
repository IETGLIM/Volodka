/**
 * Session 8 — authored Poly Haven GLB landmarks for silhouette readability.
 * Non-repeating placements; used by procedural_aaa + hybrid street overlay.
 */

import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { POLYHAVEN_MODELS } from '@/config/polyhavenAssets';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { weatherEnvironmentMaterials } from '@/engine/graphics/materials/weatherEnvironmentMaterials';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

type LandmarkDef = {
  url: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
};

/** Distinct landmark set — not a tiled module grid. */
const PROCEDURAL_LANDMARKS: LandmarkDef[] = [
  { url: POLYHAVEN_MODELS.fireEscape, position: [-7.2, 0, -9.4], rotationY: 0.18, scale: 1.15 },
  { url: POLYHAVEN_MODELS.shutterDoor, position: [8.6, 0, -11.2], rotationY: Math.PI - 0.1, scale: 1.45 },
  { url: POLYHAVEN_MODELS.streetLamp, position: [-3.4, 0, 4.8], rotationY: 0.4, scale: 1.05 },
  { url: POLYHAVEN_MODELS.roadBarrier, position: [2.1, 0, 7.6], rotationY: 0.12, scale: 1.3 },
  { url: POLYHAVEN_MODELS.barrel, position: [5.4, 0, -4.2], rotationY: 0.7, scale: 1.2 },
  { url: POLYHAVEN_MODELS.industrialLamp, position: [-5.8, 3.6, -2.4], rotationY: 0, scale: 1.2 },
];

const STREET_HYBRID_LANDMARKS: LandmarkDef[] = [
  { url: POLYHAVEN_MODELS.fireEscape, position: [-9.2, 0, -14.5], rotationY: 0.15, scale: 1.2 },
  { url: POLYHAVEN_MODELS.shutterDoor, position: [11.2, 0, -16.8], rotationY: Math.PI, scale: 1.55 },
  { url: POLYHAVEN_MODELS.roadBarrier, position: [-1.8, 0, 8.4], rotationY: -0.05, scale: 1.2 },
  { url: POLYHAVEN_MODELS.streetLamp, position: [4.6, 0, -3.2], rotationY: Math.PI / 6, scale: 1.0 },
  { url: POLYHAVEN_MODELS.barrel, position: [-6.8, 0, 5.5], rotationY: 1.1, scale: 1.15 },
  { url: POLYHAVEN_MODELS.metalTrashCan, position: [7.4, 0, 2.8], rotationY: -0.3, scale: 1.25 },
  { url: POLYHAVEN_MODELS.exteriorAirconUnit, position: [-10.4, 2.85, -6.2], rotationY: 0.08, scale: 1.05 },
  { url: POLYHAVEN_MODELS.utilityBox, position: [9.1, 0, 6.4], rotationY: -0.4, scale: 1.1 },
  { url: POLYHAVEN_MODELS.oldTyre, position: [2.8, 0, -8.6], rotationY: 0.9, scale: 1.2 },
  { url: POLYHAVEN_MODELS.securityCamera, position: [10.6, 3.4, -12.2], rotationY: -Math.PI / 3, scale: 1.15 },
];

function clonePreparedScene(source: THREE.Object3D, castShadow: boolean): THREE.Object3D {
  const clone = source.clone(true);
  clone.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => m.clone());
    } else if (mesh.material) {
      mesh.material = mesh.material.clone();
    }
  });
  weatherEnvironmentMaterials(clone, 'street');
  return clone;
}

function LandmarkProp({
  url,
  position,
  rotationY,
  scale,
  castShadow,
}: LandmarkDef & { castShadow: boolean }) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const scene = useMemo(
    () => clonePreparedScene(gltf.scene, castShadow),
    [gltf.scene, castShadow],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function LandmarkSet({ defs }: { defs: LandmarkDef[] }) {
  const { preset } = useGraphicsQuality();
  const castShadow = preset.shadows;
  return (
    <group name="HybridGlbLandmarks">
      {defs.map((d, i) => (
        <Suspense key={`landmark-${i}-${d.url}`} fallback={null}>
          <LandmarkProp {...d} castShadow={castShadow} />
        </Suspense>
      ))}
    </group>
  );
}

/** Landmarks for procedural_aaa hero scene (SDF world + authored props). */
export function ProceduralAaaGlbLandmarks() {
  return <LandmarkSet defs={PROCEDURAL_LANDMARKS} />;
}

/** Landmarks for street_night hybrid overlay (Poly Haven grounds already present). */
export function StreetHybridGlbLandmarks() {
  return <LandmarkSet defs={STREET_HYBRID_LANDMARKS} />;
}
