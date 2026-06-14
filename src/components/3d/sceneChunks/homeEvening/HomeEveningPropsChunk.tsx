/* ─── Home evening — kitchen clutter (lazy sub-chunk) ─── */

import { EnvironmentDetail } from '../../lod/PropDistanceGate';
import type { EnvironmentLodLevel } from '@/engine/lod/distanceLod';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';

const geo_cyl_1 = getSharedCylinderGeometry(0.12, 0.1, 0.12, 8);
const geo_cyl_2 = getSharedCylinderGeometry(0.01, 0.01, 0.12, 4);
const geo_box_3 = getSharedBoxGeometry(0.3, 0.02, 0.2);
const geo_box_4 = getSharedBoxGeometry(0.04, 0.03, 0.04);
const geo_box_5 = getSharedBoxGeometry(0.05, 0.03, 0.04);
const geo_circ_6 = getSharedCircleGeometry(0.15, 12);
const geo_cyl_7 = getSharedCylinderGeometry(0.1, 0.08, 0.03, 8);
const geo_cyl_8 = getSharedCylinderGeometry(0.08, 0.06, 0.03, 8);

const mat_cyl_1 = getSharedStandardMaterial({ color: '#3a3a3a', metalness: 0.6, roughness: 0.4 });
const mat_cyl_2 = getSharedStandardMaterial({ color: '#222', metalness: 0.5, roughness: 0.5 });
const mat_box_3 = getSharedStandardMaterial({ color: '#b89868', roughness: 0.8 });
const mat_box_4 = getSharedStandardMaterial({ color: '#dd4422', roughness: 0.9 });
const mat_box_5 = getSharedStandardMaterial({ color: '#22aa44', roughness: 0.9 });
const mat_circ_6 = getSharedStandardMaterial({
  color: '#7090a0',
  transparent: true,
  opacity: 0.2,
  roughness: 0.1,
  metalness: 0.2,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
const mat_cyl_7 = getSharedStandardMaterial({ color: '#e8e0d8', roughness: 0.6 });
const mat_cyl_8 = getSharedStandardMaterial({ color: '#d0c8c0', roughness: 0.6 });

export interface HomeEveningPropsChunkProps {
  lod: EnvironmentLodLevel;
}

export function HomeEveningPropsChunk({ lod }: HomeEveningPropsChunkProps) {
  return (
    <EnvironmentDetail currentLod={lod} minLod="standard">
      <mesh position={[3.5, 0.98, -5.2]} geometry={geo_cyl_1} material={mat_cyl_1} />
      <mesh
        position={[3.38, 1.02, -5.2]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={geo_cyl_2}
        material={mat_cyl_2}
      />

      <mesh
        position={[4.8, 0.93, -5.3]}
        rotation={[0, 0.2, 0]}
        geometry={geo_box_3}
        material={mat_box_3}
      />
      <mesh position={[4.85, 0.95, -5.25]} geometry={geo_box_4} material={mat_box_4} />
      <mesh position={[4.75, 0.95, -5.35]} geometry={geo_box_5} material={mat_box_5} />

      <mesh
        rotation-x={-Math.PI / 2}
        position={[4.2, 0.93, -5.6]}
        geometry={geo_circ_6}
        material={mat_circ_6}
      />

      <mesh
        position={[4.0, 1.0, -5.4]}
        rotation={[0.1, 0.3, 0]}
        geometry={geo_cyl_7}
        material={mat_cyl_7}
      />
      <mesh
        position={[4.1, 1.02, -5.5]}
        rotation={[0.15, -0.2, 0.05]}
        geometry={geo_cyl_8}
        material={mat_cyl_8}
      />
    </EnvironmentDetail>
  );
}
