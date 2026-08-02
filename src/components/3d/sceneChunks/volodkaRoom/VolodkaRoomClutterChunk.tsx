/* ─── Volodka room — environmental clutter (lazy sub-chunk) ─── */

import * as THREE from 'three';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedSphereGeometry,
  getSharedTorusGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import { createSceneModuleGpu } from '@/engine/three/sceneModuleGpu';
import { EnvironmentDetail } from '../../lod/PropDistanceGate';

function buildVolodkaRoomClutterGpu() {
  return {
    geo_cyl_1: getSharedCylinderGeometry(0.1, 0.08, 0.3, 8),
    geo_tor_2: getSharedTorusGeometry(0.1, 0.008, 4, 8),
    geo_sph_3: getSharedSphereGeometry(0.04, 4, 3),
    geo_cyl_4: getSharedCylinderGeometry(0.008, 0.008, 0.06, 4),
    geo_box_5: getSharedBoxGeometry(0.45, 0.6, 0.06),
    geo_box_6: getSharedBoxGeometry(0.3, 0.08, 0.06),
    geo_box_7: getSharedBoxGeometry(0.1, 0.4, 0.05),
    geo_box_8: getSharedBoxGeometry(0.1, 0.38, 0.05),
    geo_cyl_9: getSharedCylinderGeometry(0.08, 0.06, 0.2, 8),
    geo_tor_10: getSharedTorusGeometry(0.08, 0.008, 4, 8),
    geo_cyl_11: getSharedCylinderGeometry(0.075, 0.075, 0.01, 8),
    geo_sph_12: getSharedSphereGeometry(0.1, 6, 5),
    geo_sph_13: getSharedSphereGeometry(0.07, 5, 4),
    geo_sph_14: getSharedSphereGeometry(0.06, 5, 4),
    geo_box_15: getSharedBoxGeometry(0.22, 0.02, 0.22),
    geo_circ_16: getSharedCircleGeometry(0.06, 8),
    geo_cyl_17: getSharedCylinderGeometry(0.03, 0.03, 0.12, 8),
    geo_cyl_18: getSharedCylinderGeometry(0.025, 0.025, 0.1, 6),
    geo_pln_19: getSharedPlaneGeometry(0.06, 0.06),
    geo_pln_20: getSharedPlaneGeometry(0.05, 0.06),
    geo_cyl_21: getSharedCylinderGeometry(0.008, 0.008, 0.6, 4),
    geo_cyl_22: getSharedCylinderGeometry(0.006, 0.006, 0.5, 4),
    geo_cyl_23: getSharedCylinderGeometry(0.007, 0.007, 0.4, 4),
    geo_box_24: getSharedBoxGeometry(0.2, 0.015, 0.15),
    geo_box_25: getSharedBoxGeometry(0.22, 0.008, 0.16),
    mat_cyl_1: getSharedStandardMaterial({ color: '#2a2a2e', roughness: 0.9 }),
    mat_tor_2: getSharedStandardMaterial({ color: '#3a3a3e', roughness: 0.8 }),
    mat_sph_3: getSharedStandardMaterial({ color: '#c8c0a0', roughness: 0.95 }),
    mat_cyl_4: getSharedStandardMaterial({ color: '#555', metalness: 0.6, roughness: 0.4 }),
    mat_box_dark: getSharedStandardMaterial({ color: '#2a2030', roughness: 0.85 }),
    mat_box_6: getSharedStandardMaterial({ color: '#352540', roughness: 0.85 }),
    mat_cyl_9: getSharedStandardMaterial({ color: '#8a5a3a', roughness: 0.8 }),
    mat_tor_10: getSharedStandardMaterial({ color: '#7a4a2a', roughness: 0.8 }),
    mat_cyl_11: getSharedStandardMaterial({ color: '#3a2a1a', roughness: 0.95 }),
    mat_sph_12: getSharedStandardMaterial({ color: '#2a6a20', roughness: 0.85 }),
    mat_sph_13: getSharedStandardMaterial({ color: '#308028', roughness: 0.85 }),
    mat_sph_14: getSharedStandardMaterial({ color: '#257020', roughness: 0.85 }),
    mat_box_15: getSharedStandardMaterial({ color: '#c4a050', roughness: 0.9 }),
    mat_circ_16: getSharedStandardMaterial({
      color: '#a08030',
      roughness: 0.95,
      transparent: true,
      opacity: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    mat_cyl_17_green: getSharedStandardMaterial({ color: '#00aa44', metalness: 0.4, roughness: 0.3 }),
    mat_cyl_17_blue: getSharedStandardMaterial({ color: '#2244aa', metalness: 0.4, roughness: 0.3 }),
    mat_cyl_18: getSharedStandardMaterial({ color: '#cc2222', metalness: 0.3, roughness: 0.5 }),
    mat_pln_yellow: getSharedStandardMaterial({ color: '#ffdd44', roughness: 0.9, side: THREE.DoubleSide }),
    mat_pln_pink: getSharedStandardMaterial({ color: '#ff8888', roughness: 0.9, side: THREE.DoubleSide }),
    mat_pln_blue: getSharedStandardMaterial({ color: '#88ddff', roughness: 0.9, side: THREE.DoubleSide }),
    mat_cyl_21: getSharedStandardMaterial({ color: '#222', roughness: 0.95 }),
    mat_cyl_22: getSharedStandardMaterial({ color: '#882222', roughness: 0.95 }),
    mat_cyl_23: getSharedStandardMaterial({ color: '#228822', roughness: 0.95 }),
    mat_box_24: getSharedStandardMaterial({ color: '#c8b898', roughness: 0.95 }),
    mat_box_25: getSharedStandardMaterial({ color: '#e8dcc8', roughness: 0.95 }),
  };
}

export function VolodkaRoomClutterChunk() {
  const {
    geo_cyl_1,
    geo_tor_2,
    geo_sph_3,
    geo_cyl_4,
    geo_box_5,
    geo_box_6,
    geo_box_7,
    geo_box_8,
    geo_cyl_9,
    geo_tor_10,
    geo_cyl_11,
    geo_sph_12,
    geo_sph_13,
    geo_sph_14,
    geo_box_15,
    geo_circ_16,
    geo_cyl_17,
    geo_cyl_18,
    geo_pln_19,
    geo_pln_20,
    geo_cyl_21,
    geo_cyl_22,
    geo_cyl_23,
    geo_box_24,
    geo_box_25,
    mat_cyl_1,
    mat_tor_2,
    mat_sph_3,
    mat_cyl_4,
    mat_box_dark,
    mat_box_6,
    mat_cyl_9,
    mat_tor_10,
    mat_cyl_11,
    mat_sph_12,
    mat_sph_13,
    mat_sph_14,
    mat_box_15,
    mat_circ_16,
    mat_cyl_17_green,
    mat_cyl_17_blue,
    mat_cyl_18,
    mat_pln_yellow,
    mat_pln_pink,
    mat_pln_blue,
    mat_cyl_21,
    mat_cyl_22,
    mat_cyl_23,
    mat_box_24,
    mat_box_25,
  } = createSceneModuleGpu('volodka-room-clutter', 'volodka_room', buildVolodkaRoomClutterGpu);

  return (
    <>
      {/* Keep off the desk/bookshelf strip (z≈-2.5) — was colliding with workstation props. */}
      <group position={[2.05, 0, 0.55]}>
        <EnvironmentDetail minLod="standard">
          <mesh position={[0, 0.15, 0]} geometry={geo_cyl_1} material={mat_cyl_1} />
          <mesh position={[0, 0.3, 0]} geometry={geo_tor_2} material={mat_tor_2} />
          <mesh
            position={[0, 0.22, 0.03]}
            rotation={[0.3, 0.5, 0.2]}
            geometry={geo_sph_3}
            material={mat_sph_3}
          />
        </EnvironmentDetail>
      </group>

      <group position={[1.5, 0, 3.2]}>
        <EnvironmentDetail minLod="standard">
          <mesh
            position={[0, 1.9, -0.05]}
            rotation={[Math.PI / 2, 0, 0]}
            geometry={geo_cyl_4}
            material={mat_cyl_4}
          />
          <mesh
            position={[0, 1.4, 0.05]}
            rotation={[0.05, 0, 0.03]}
            geometry={geo_box_5}
            material={mat_box_dark}
          />
          <mesh
            position={[0, 1.72, 0.06]}
            rotation={[0.1, 0, 0]}
            geometry={geo_box_6}
            material={mat_box_6}
          />
          <mesh
            position={[-0.2, 1.35, 0.05]}
            rotation={[0, 0, 0.15]}
            geometry={geo_box_7}
            material={mat_box_dark}
          />
          <mesh
            position={[0.2, 1.35, 0.05]}
            rotation={[0, 0, -0.12]}
            geometry={geo_box_8}
            material={mat_box_dark}
          />
        </EnvironmentDetail>
      </group>

      <group position={[2.0, 0, -3.0]}>
        <EnvironmentDetail minLod="standard">
          <mesh position={[0, 0.1, 0]} geometry={geo_cyl_9} material={mat_cyl_9} />
          <mesh position={[0, 0.2, 0]} geometry={geo_tor_10} material={mat_tor_10} />
          <mesh position={[0, 0.19, 0]} geometry={geo_cyl_11} material={mat_cyl_11} />
          <mesh position={[0, 0.35, 0]} geometry={geo_sph_12} material={mat_sph_12} />
          <mesh position={[0.06, 0.4, 0.04]} geometry={geo_sph_13} material={mat_sph_13} />
          <mesh position={[-0.05, 0.42, -0.03]} geometry={geo_sph_14} material={mat_sph_14} />
        </EnvironmentDetail>
      </group>

      <EnvironmentDetail minLod="standard" position={[0.55, 0.78, -2.3]}>
        <mesh rotation={[0, 0.3, 0]} geometry={geo_box_15} material={mat_box_15} />
        <mesh rotation={[0, 0.3, 0]} geometry={geo_circ_16} material={mat_circ_16} />
      </EnvironmentDetail>

      <EnvironmentDetail minLod="standard" position={[0.3, 0.06, -1.0]}>
        <mesh
          position={[0.5, 0, -0.2]}
          rotation={[0, 0.5, 0.08]}
          geometry={geo_cyl_17}
          material={mat_cyl_17_green}
        />
        <mesh
          position={[-0.6, 0, -0.2]}
          rotation={[0.15, 0.2, 0]}
          geometry={geo_cyl_17}
          material={mat_cyl_17_blue}
        />
        <mesh
          position={[0.2, -0.035, 0.5]}
          rotation={[0, 1.2, Math.PI / 2]}
          geometry={geo_cyl_18}
          material={mat_cyl_18}
        />
      </EnvironmentDetail>

      <EnvironmentDetail minLod="standard" position={[-0.22, 1.23, -2.45]}>
        <mesh rotation={[0, 0, 0.1]} geometry={geo_pln_19} material={mat_pln_yellow} />
        <mesh rotation={[0, 0, -0.05]} geometry={geo_pln_19} material={mat_pln_pink} />
        <mesh rotation={[0, 0, 0.15]} geometry={geo_pln_20} material={mat_pln_blue} />
      </EnvironmentDetail>

      <EnvironmentDetail minLod="standard" position={[0.05, 0.05, -2.2]}>
        <mesh rotation={[0, 0.3, 0]} geometry={geo_cyl_21} material={mat_cyl_21} />
        <mesh rotation={[0.5, 0.8, 0.3]} geometry={geo_cyl_22} material={mat_cyl_22} />
        <mesh rotation={[-0.3, 0.5, 0.2]} geometry={geo_cyl_23} material={mat_cyl_23} />
      </EnvironmentDetail>

      <EnvironmentDetail minLod="standard" position={[1.5, 0.55, 2.5]}>
        <mesh rotation={[0, 0.4, 0.05]} geometry={geo_box_24} material={mat_box_24} />
        <mesh rotation={[0, 0.4, 0.05]} geometry={geo_box_25} material={mat_box_25} />
      </EnvironmentDetail>
    </>
  );
}
