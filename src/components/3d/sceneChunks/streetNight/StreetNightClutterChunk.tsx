import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';

const geo_crate = getSharedBoxGeometry(0.8, 0.4, 0.5);
const geo_pipe = getSharedCylinderGeometry(0.08, 0.12, 0.7, 6);

const mat_crate = getSharedStandardMaterial({ color: '#1a1a22', roughness: 0.85 });
const mat_pipe = getSharedStandardMaterial({ color: '#333', metalness: 0.6 });

/** Minimal clutter chunk for street night — lazy-loaded on scene enter. */
export function StreetNightClutterChunk() {
  return (
    <group>
      <mesh
        position={[1.5, 0.2, 2]}
        castShadow
        geometry={geo_crate}
        material={mat_crate}
      />
      <mesh position={[-2, 0.35, -1]} geometry={geo_pipe} material={mat_pipe} />
    </group>
  );
}
