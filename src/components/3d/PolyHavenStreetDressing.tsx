/* Street dressing: unique authored facades + Poly Haven props (no facade GLB clone grid). */

import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { POLYHAVEN_MODELS } from '@/config/polyhavenAssets';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { UniqueStreetFacades } from './UniqueStreetFacades';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

const FIRE_ESCAPES: Array<{ position: [number, number, number]; rotationY: number; scale: number }> = [
  { position: [-10.0, 0, -15.2], rotationY: 0.12, scale: 1.2 },
  { position: [10.8, 0, -18.5], rotationY: Math.PI - 0.08, scale: 1.25 },
  { position: [-11.2, 0, -5.8], rotationY: 0.2, scale: 1.05 },
];

function clonePreparedScene(source: THREE.Object3D, castShadow: boolean): THREE.Object3D {
  const clone = source.clone(true);
  clone.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m && 'envMapIntensity' in m) {
          const std = m as THREE.MeshStandardMaterial;
          std.envMapIntensity = 0.9;
          if (typeof std.roughness === 'number') {
            std.roughness = Math.min(1, Math.max(0.4, std.roughness * 1.1));
          }
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
}: {
  url: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  castShadow?: boolean;
}) {
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

function StreetPropDressing() {
  const { preset } = useGraphicsQuality();
  const castShadow = preset.shadows;

  return (
    <group>
      {FIRE_ESCAPES.map((p, i) => (
        <Suspense key={`escape-${i}`} fallback={null}>
          <GltfProp
            url={POLYHAVEN_MODELS.fireEscape}
            position={p.position}
            rotationY={p.rotationY}
            scale={p.scale}
            castShadow={castShadow}
          />
        </Suspense>
      ))}

      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.bench} position={[0, 0, 0]} rotationY={0} scale={1.35} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.bench} position={[-4.4, 0, 2.0]} rotationY={Math.PI / 2} scale={1.15} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.bench} position={[3.8, 0, -6.4]} rotationY={-0.4} scale={1.1} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterDoor} position={[11.6, 0, -17.8]} rotationY={Math.PI} scale={1.6} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.roadBarrier} position={[0.3, 0, 9.2]} rotationY={0.08} scale={1.25} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.wetFloorSign} position={[1.6, 0, 1.2]} rotationY={-0.5} scale={1.3} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.metalTrashCan} position={[2.15, 0, 3.1]} scale={1.2} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.metalTrashCan} position={[-2.55, 0, -8.1]} rotationY={0.4} scale={1.1} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.trashbag} position={[2.55, 0, 3.35]} rotationY={0.7} scale={1.4} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.trashbag} position={[-2.9, 0, -7.7]} rotationY={-0.3} scale={1.25} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.barrel} position={[2.4, 0, 2.5]} scale={1.15} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.barrel} position={[-3.1, 0, -7.2]} rotationY={0.9} scale={1.05} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.cardboardBox} position={[-5.2, 0, -3.5]} rotationY={0.35} scale={1.5} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.cardboardBox} position={[-4.7, 0.55, -3.3]} rotationY={-0.6} scale={1.15} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.streetLamp} position={[-6.2, 0, -1.2]} scale={1.0} castShadow={castShadow} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.streetLamp} position={[5.8, 0, 2.8]} rotationY={Math.PI / 5} scale={1.0} castShadow={castShadow} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.industrialLamp} position={[-5.5, 3.8, -2]} scale={1.25} />
      </Suspense>
      <Suspense fallback={null}>
        <GltfProp url={POLYHAVEN_MODELS.shutterWindow} position={[12.5, 5.2, -19.2]} rotationY={Math.PI} scale={1.5} />
      </Suspense>
    </group>
  );
}

/** Unique BufferGeometry facades on all presets; PH props when GLB env mode allows. */
export function HeroStreetFacadesWithAssets() {
  const { preset } = useGraphicsQuality();
  const glbProps = allowsGlbAssetRendering(preset.environmentRenderMode);

  return (
    <group>
      <UniqueStreetFacades />
      {glbProps ? (
        <Suspense fallback={null}>
          <StreetPropDressing />
        </Suspense>
      ) : null}
    </group>
  );
}

useGLTF.preload(POLYHAVEN_MODELS.bench, true, true, extendLoader);
useGLTF.preload(POLYHAVEN_MODELS.fireEscape, true, true, extendLoader);
