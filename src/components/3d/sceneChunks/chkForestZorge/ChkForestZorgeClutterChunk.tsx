import {
  getSharedBoxGeometry,
  getSharedConeGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import { createSceneModuleGpu } from '@/engine/three/sceneModuleGpu';

function buildChkForestZorgeClutterGpu() {
  return {
    geo_cone: getSharedConeGeometry(0.4, 0.6, 6),
    geo_box: getSharedBoxGeometry(0.5, 0.3, 0.4),
    mat_cone: getSharedStandardMaterial({ color: '#1a3020', roughness: 0.95 }),
    mat_box: getSharedStandardMaterial({ color: '#2a2018', roughness: 0.9 }),
  };
}

/** Minimal clutter chunk for CHK forest Zorge — lazy-loaded on scene enter. */
export function ChkForestZorgeClutterChunk() {
  const gpu = createSceneModuleGpu(
    'chk-forest-zorge-clutter',
    'chk_forest_zorge',
    buildChkForestZorgeClutterGpu,
  );

  return (
    <group>
      <mesh position={[2, 0.3, -1.5]} castShadow geometry={gpu.geo_cone} material={gpu.mat_cone} />
      <mesh position={[-1.8, 0.15, 0.6]} geometry={gpu.geo_box} material={gpu.mat_box} />
    </group>
  );
}
