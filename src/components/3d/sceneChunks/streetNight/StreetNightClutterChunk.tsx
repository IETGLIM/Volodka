import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import { createSceneModuleGpu } from '@/engine/three/sceneModuleGpu';

function buildStreetNightClutterGpu() {
  return {
    geo_crate: getSharedBoxGeometry(0.8, 0.4, 0.5),
    geo_pipe: getSharedCylinderGeometry(0.08, 0.12, 0.7, 6),
    mat_crate: getSharedStandardMaterial({ color: '#1a1a22', roughness: 0.85 }),
    mat_pipe: getSharedStandardMaterial({ color: '#333', metalness: 0.6 }),
  };
}

/** Minimal clutter chunk for street night — lazy-loaded on scene enter. */
export function StreetNightClutterChunk() {
  const gpu = createSceneModuleGpu(
    'street-night-clutter',
    'street_night',
    buildStreetNightClutterGpu,
  );

  return (
    <group>
      <mesh
        position={[1.5, 0.2, 2]}
        castShadow
        geometry={gpu.geo_crate}
        material={gpu.mat_crate}
      />
      <mesh position={[-2, 0.35, -1]} geometry={gpu.geo_pipe} material={gpu.mat_pipe} />
    </group>
  );
}
