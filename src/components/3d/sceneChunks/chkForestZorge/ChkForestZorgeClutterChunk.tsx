import {
  getSharedBoxGeometry,
  getSharedConeGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';

const geo_cone = getSharedConeGeometry(0.4, 0.6, 6);
const geo_box = getSharedBoxGeometry(0.5, 0.3, 0.4);

const mat_cone = getSharedStandardMaterial({ color: '#1a3020', roughness: 0.95 });
const mat_box = getSharedStandardMaterial({ color: '#2a2018', roughness: 0.9 });

/** Minimal clutter chunk for CHK forest Zorge — lazy-loaded on scene enter. */
export function ChkForestZorgeClutterChunk() {
  return (
    <group>
      <mesh position={[2, 0.3, -1.5]} castShadow geometry={geo_cone} material={mat_cone} />
      <mesh position={[-1.8, 0.15, 0.6]} geometry={geo_box} material={mat_box} />
    </group>
  );
}
