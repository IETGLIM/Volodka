import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';

const geo_box = getSharedBoxGeometry(0.6, 0.8, 0.5);
const geo_cyl = getSharedCylinderGeometry(0.15, 0.15, 0.5, 8);

const mat_box = getSharedStandardMaterial({ color: '#2a2a2a', roughness: 0.9 });
const mat_cyl = getSharedStandardMaterial({ color: '#3a3a3a', metalness: 0.5 });

/** Minimal clutter chunk for factory basement — lazy-loaded on scene enter. */
export function FactoryBasementClutterChunk() {
  return (
    <group>
      <mesh position={[1.2, 0.4, -0.8]} castShadow geometry={geo_box} material={mat_box} />
      <mesh position={[-1.5, 0.25, 1.2]} geometry={geo_cyl} material={mat_cyl} />
    </group>
  );
}
