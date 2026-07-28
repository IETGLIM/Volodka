import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import { createSceneModuleGpu } from '@/engine/three/sceneModuleGpu';
import { EnvironmentDetail } from '../../lod/PropDistanceGate';

function buildFactoryBasementClutterGpu() {
  return {
    geo_box: getSharedBoxGeometry(0.6, 0.8, 0.5),
    geo_cyl: getSharedCylinderGeometry(0.15, 0.15, 0.5, 8),
    mat_box: getSharedStandardMaterial({ color: '#2a2a2a', roughness: 0.9 }),
    mat_cyl: getSharedStandardMaterial({ color: '#3a3a3a', metalness: 0.5 }),
  };
}

/** Minimal clutter chunk for factory basement — lazy-loaded on scene enter. */
export function FactoryBasementClutterChunk() {
  const gpu = createSceneModuleGpu(
    'factory-basement-clutter',
    'factory_basement',
    buildFactoryBasementClutterGpu,
  );

  return (
    <EnvironmentDetail minLod="full" position={[0, 0, 0.2]}>
      <mesh position={[1.2, 0.4, -0.8]} castShadow geometry={gpu.geo_box} material={gpu.mat_box} />
      <mesh position={[-1.5, 0.25, 1.2]} geometry={gpu.geo_cyl} material={gpu.mat_cyl} />
    </EnvironmentDetail>
  );
}
