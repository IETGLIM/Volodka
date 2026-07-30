
/* ─── Volodka RPG – Volodka's room procedural 3D visual ─── */

import { memo, useMemo, useRef, useEffect, Suspense, type MutableRefObject } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getSharedStandardMaterial, mat } from '@/engine/three/moduleMaterialRegistry';
import {
  registerModuleGeometries,
  registerModuleGeometry,
  getSharedBoxGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { Lamp, Rug, Radiator } from './lazyInteriorModels';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createVolodkaRoomNightSkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import { VolodkaRoomClutter } from './sceneChunks/volodkaRoom';
import {
  createGrafanaTexture,
  createTerminalScreenTexture,
  createZabbixTexture,
} from './sceneVisuals/volodkaRoom/monitorTextures';
import { useVolodkaRoomAnimations } from './sceneVisuals/volodkaRoom/useVolodkaRoomAnimations';
import { FlickeringCeilingLight } from './sceneVisuals/volodkaRoom/FlickeringCeilingLight';
import { useMonitorGlitch } from './sceneVisuals/volodkaRoom/useMonitorGlitch';
import { useZabbixAlertPulse } from './sceneVisuals/volodkaRoom/useZabbixAlertPulse';
import { PolyHavenStandardMaterial } from './PolyHavenStandardMaterial';
import { CraftedDeskShell, ThinMonitor } from './CraftedDeskAndMonitors';
import { INTERIOR_SHELL_MODELS } from '../../config/interiorShellModels';
import { AuthoredInteriorShell } from './AuthoredInteriorShell';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { POLYHAVEN_MODELS } from '@/config/polyhavenAssets';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
// FIX-B1: DustParticles import removed — VolodkaRoomVisual no longer renders
// its own dust system. AtmosphericEffects' DustMotes already covers
// volodka_room (it's in DUST_SCENES), so the duplicate system is gone.

interface VolodkaRoomVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Procedural 3D room for Volodka's apartment (5×7m) */
/* ─── Shared geometries (module-level, reused across renders) ─── */

const geo_pln_1 = new THREE.PlaneGeometry(5, 7);
const geo_pln_2 = new THREE.PlaneGeometry(5, 3);
const geo_pln_3 = new THREE.PlaneGeometry(7, 3);
const geo_box_4 = new THREE.BoxGeometry(1, 2.2, 0.06);
const geo_box_5 = new THREE.BoxGeometry(0.05, 2.2, 0.08);
const geo_box_6 = new THREE.BoxGeometry(1, 0.05, 0.08);
const geo_box_7 = new THREE.BoxGeometry(0.9, 2.15, 0.04);
const geo_cyl_8 = new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6);
const geo_box_9 = new THREE.BoxGeometry(0.5, 0.6, 0.005);
const geo_box_10 = new THREE.BoxGeometry(0.8, 2, 0.55);
const geo_box_11 = new THREE.BoxGeometry(0.84, 0.03, 0.58);
const geo_box_12 = new THREE.BoxGeometry(0.76, 0.03, 0.5);
const geo_box_13 = new THREE.BoxGeometry(0.38, 1.94, 0.03);
const geo_sph_14 = new THREE.SphereGeometry(0.015, 6, 6);
const geo_box_15 = new THREE.BoxGeometry(0.24, 0.5, 0.005);
const geo_box_16 = new THREE.BoxGeometry(1.8, 0.05, 0.8);
const geo_box_17 = new THREE.BoxGeometry(0.04, 0.75, 0.04);
const geo_box_18 = new THREE.BoxGeometry(0.54, 0.38, 0.04);
const geo_pln_19 = new THREE.PlaneGeometry(0.5, 0.34);
const geo_cir_20 = new THREE.CircleGeometry(0.012, 14);
const geo_box_21 = new THREE.BoxGeometry(0.05, 0.16, 0.05);
const geo_box_22 = new THREE.BoxGeometry(0.2, 0.02, 0.12);
const geo_box_23 = new THREE.BoxGeometry(0.4, 0.02, 0.15);
const geo_box_24 = new THREE.BoxGeometry(0.008, 0.004, 0.008);
const geo_box_25 = new THREE.BoxGeometry(0.25, 0.005, 0.2);
const geo_box_26 = new THREE.BoxGeometry(0.04, 0.02, 0.06);
const geo_cyl_27 = new THREE.CylinderGeometry(0.032, 0.028, 0.08, 8);
const geo_tor_28 = new THREE.TorusGeometry(0.018, 0.005, 4, 8, 3.141592653589793);
const geo_cyl_29 = new THREE.CylinderGeometry(0.03, 0.03, 0.005, 8);
const geo_box_30 = new THREE.BoxGeometry(0.15, 0.003, 0.2);
const geo_box_31 = new THREE.BoxGeometry(0.12, 0.003, 0.18);
const geo_box_32 = new THREE.BoxGeometry(0.1, 0.003, 0.14);
const geo_box_33 = new THREE.BoxGeometry(0.5, 0.05, 0.5);
const geo_box_34 = new THREE.BoxGeometry(0.5, 0.5, 0.04);
const geo_box_35 = new THREE.BoxGeometry(0.03, 0.45, 0.03);
const geo_box_36 = new THREE.BoxGeometry(0.8, 2, 0.35);
const geo_box_37 = new THREE.BoxGeometry(0.78, 0.03, 0.33);
const geo_box_38 = new THREE.BoxGeometry(1, 0.3, 2);
const geo_box_39 = new THREE.BoxGeometry(1, 0.5, 0.08);
const geo_box_40 = new THREE.BoxGeometry(0.5, 0.1, 0.3);
const geo_box_41 = new THREE.BoxGeometry(0.9, 0.05, 1.2);
const geo_pln_42 = new THREE.PlaneGeometry(1.2, 1);
const geo_box_43 = new THREE.BoxGeometry(0.05, 1.05, 1.25);
const geo_pln_44 = new THREE.PlaneGeometry(1, 1);
const geo_box_45 = new THREE.BoxGeometry(1.05, 1.05, 0.05);
const geo_cyl_46 = new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8);
const geo_tor_47 = new THREE.TorusGeometry(0.08, 0.003, 4, 16);
const geo_box_48 = new THREE.BoxGeometry(0.06, 0.015, 0.01);
const geo_cyl_49 = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6);
const geo_box_50 = new THREE.BoxGeometry(0.2, 0.5, 0.4);
const geo_box_51 = new THREE.BoxGeometry(0.002, 0.45, 0.35);
const geo_sph_52 = new THREE.SphereGeometry(0.005, 4, 4);
const geo_sph_53 = new THREE.SphereGeometry(0.004, 4, 4);
const geo_box_54 = new THREE.BoxGeometry(0.002, 0.008, 0.15);
const geo_pln_55 = new THREE.PlaneGeometry(1, 0.4);
const geo_box_56 = new THREE.BoxGeometry(0.5, 0.7, 0.005);
const geo_box_57 = new THREE.BoxGeometry(0.35, 0.15, 0.002);
const geo_box_58 = new THREE.BoxGeometry(0.3, 0.1, 0.002);
const geo_box_59 = new THREE.BoxGeometry(0.45, 0.6, 0.005);
const geo_box_60 = new THREE.BoxGeometry(0.3, 0.12, 0.002);
const geo_box_61 = new THREE.BoxGeometry(0.06, 0.02, 0.001);
const geo_tor_62 = new THREE.TorusGeometry(0.06, 0.005, 4, 12, 3.141592653589793);
const geo_cyl_63 = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8);
const geo_cyl_64 = new THREE.CylinderGeometry(0.003, 0.003, 0.3, 4);
const geo_box_65 = new THREE.BoxGeometry(0.3, 0.06, 0.25);
const geo_box_66 = new THREE.BoxGeometry(0.25, 0.04, 0.12);
const geo_cyl_67 = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 4);
const geo_box_68 = new THREE.BoxGeometry(0.4, 0.5, 0.35);
const geo_box_69 = new THREE.BoxGeometry(0.36, 0.18, 0.02);
const geo_cyl_70 = new THREE.CylinderGeometry(0.005, 0.005, 0.1, 4);
const geo_box_71 = new THREE.BoxGeometry(0.07, 0.008, 0.14);
const geo_box_72 = new THREE.BoxGeometry(0.06, 0.003, 0.12);
const geo_cyl_73 = new THREE.CylinderGeometry(0.025, 0.02, 0.08, 8);
const geo_box_74 = new THREE.BoxGeometry(0.08, 0.03, 0.18);
const geo_pln_75 = new THREE.PlaneGeometry(0.12, 0.25);
const geo_pln_76 = new THREE.PlaneGeometry(0.08, 0.35);
const geo_pln_77 = new THREE.PlaneGeometry(0.02, 0.02);
const geo_pln_78 = new THREE.PlaneGeometry(0.015, 0.015);
const geo_box_79 = new THREE.BoxGeometry(0.3, 0.4, 0.15);
const geo_box_80 = new THREE.BoxGeometry(0.03, 0.3, 0.01);
const geo_box_81 = new THREE.BoxGeometry(0.15, 0.005, 0.005);
const geo_box_82 = new THREE.BoxGeometry(0.6, 0.8, 0.005);
const geo_box_83 = new THREE.BoxGeometry(0.4, 0.2, 0.002);
const geo_posterFrame = new THREE.BoxGeometry(0.64, 0.84, 0.02);
const geo_posterBack = new THREE.BoxGeometry(0.6, 0.8, 0.005);
const geo_posterLogo = new THREE.BoxGeometry(0.18, 0.1, 0.002);
const geo_photoFrame = new THREE.BoxGeometry(0.34, 0.44, 0.02);
const geo_photoBack = new THREE.BoxGeometry(0.3, 0.4, 0.005);
const bookSpineGeoCache = new Map<string, THREE.BoxGeometry>();
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;
const KENNEY_TERMINAL_MODEL = '/models/props/terminal.glb';
const AI3DGEN_SERVER_FRAGMENT_MODEL = '/models/props/server_fragment.glb';
const AI3DGEN_POETIC_COMPILER_MODEL = '/models/props/poetic_compiler.glb';
const AI3DGEN_NEURAL_FILTER_MODEL = '/models/props/neural_filter.glb';

// ISSUE #5: Pre-allocated color for emissive monitor screens (avoids per-render allocation)

function bookSpineGeo(w: number, h: number, d = 0.18): THREE.BoxGeometry {
  const key = `${w}_${h}_${d}`;
  let geo = bookSpineGeoCache.get(key);
  if (!geo) {
    geo = registerModuleGeometry(new THREE.BoxGeometry(w, h, d));
    bookSpineGeoCache.set(key, geo);
  }
  return geo;
}

registerModuleGeometries([geo_pln_1, geo_pln_2, geo_pln_3, geo_box_4, geo_box_5, geo_box_6, geo_box_7, geo_cyl_8, geo_box_9, geo_box_10, geo_box_11, geo_box_12, geo_box_13, geo_sph_14, geo_box_15, geo_box_16, geo_box_17, geo_box_18, geo_pln_19, geo_cir_20, geo_box_21, geo_box_22, geo_box_23, geo_box_24, geo_box_25, geo_box_26, geo_cyl_27, geo_tor_28, geo_cyl_29, geo_box_30, geo_box_31, geo_box_32, geo_box_33, geo_box_34, geo_box_35, geo_box_36, geo_box_37, geo_box_38, geo_box_39, geo_box_40, geo_box_41, geo_pln_42, geo_box_43, geo_pln_44, geo_box_45, geo_cyl_46, geo_tor_47, geo_box_48, geo_cyl_49, geo_box_50, geo_box_51, geo_sph_52, geo_sph_53, geo_box_54, geo_pln_55, geo_box_56, geo_box_57, geo_box_58, geo_box_59, geo_box_60, geo_box_61, geo_tor_62, geo_cyl_63, geo_cyl_64, geo_box_65, geo_box_66, geo_cyl_67, geo_box_68, geo_box_69, geo_cyl_70, geo_box_71, geo_box_72, geo_cyl_73, geo_box_74, geo_pln_75, geo_pln_76, geo_pln_77, geo_pln_78, geo_box_79, geo_box_80, geo_box_81, geo_box_82, geo_box_83, geo_posterFrame, geo_posterBack, geo_posterLogo, geo_photoFrame, geo_photoBack]);

const mat_1 = getSharedStandardMaterial({ color: '#3a2820', roughness: 0.85 });
const mat_2 = getSharedStandardMaterial({ color: '#5a4838', roughness: 0.8 });
const mat_3 = getSharedStandardMaterial({ color: '#5a4030', roughness: 0.75 });
const mat_4 = getSharedStandardMaterial({ color: '#aaa', metalness: 0.8, roughness: 0.2 });
const mat_5 = getSharedStandardMaterial({ color: '#4a3525', roughness: 0.85 });
const mat_6 = getSharedStandardMaterial({ color: '#4a3828', roughness: 0.8 });
const mat_7 = getSharedStandardMaterial({ color: '#3a2818', roughness: 0.8 });
const mat_8 = getSharedStandardMaterial({ color: '#3a2818', roughness: 0.85 });
const mat_9 = getSharedStandardMaterial({ color: '#5a4530', roughness: 0.8 });
const mat_10 = getSharedStandardMaterial({ color: '#4a3820', roughness: 0.85 });
const mat_11 = getSharedStandardMaterial({ color: '#4a3a28', roughness: 0.7 });
const mat_15 = getSharedStandardMaterial({ color: '#1a1a1a', emissive: '#00ff44', emissiveIntensity: 0.02 });
const mat_16 = getSharedStandardMaterial({ color: '#00ff44', emissive: '#00ff44', emissiveIntensity: 1.2 });
const mat_17 = getSharedStandardMaterial({ color: '#ffaa00', emissive: '#ffaa00', emissiveIntensity: 0.9 });
const mat_18 = getSharedStandardMaterial({ color: '#1a1a2a', roughness: 0.95 });
const mat_19 = getSharedStandardMaterial({ color: '#2a2a2a', roughness: 0.6 });
const mat_20 = getSharedStandardMaterial({ color: '#6b3a1a', roughness: 0.7 });
const mat_21 = getSharedStandardMaterial({ color: '#2a1508', roughness: 0.3 });
const mat_22 = getSharedStandardMaterial({ color: '#e8dcc8', roughness: 0.95 });
const mat_23 = getSharedStandardMaterial({ color: '#f0e8d8', roughness: 0.95 });
const mat_24 = getSharedStandardMaterial({ color: '#ddd4c0', roughness: 0.95 });
const mat_25 = getSharedStandardMaterial({ color: '#2a2a30', roughness: 0.8 });
const mat_26 = getSharedStandardMaterial({ color: '#333' });
const mat_27 = getSharedStandardMaterial({ color: '#5a4030', roughness: 0.8 });
const mat_28 = getSharedStandardMaterial({ color: '#4a3525' });
const mat_29 = getSharedStandardMaterial({ color: '#2a3040', roughness: 0.9 });
const mat_30 = getSharedStandardMaterial({ color: '#3a2a20', roughness: 0.8 });
const mat_31 = getSharedStandardMaterial({ color: '#aaaacc', roughness: 0.95 });
const mat_32 = getSharedStandardMaterial({ color: '#303050', roughness: 0.95 });
const mat_33 = getSharedStandardMaterial({ color: '#0a0a30', emissive: '#4488ee', emissiveIntensity: 1.45, toneMapped: false });
const mat_34 = getSharedStandardMaterial({ color: '#0a0a30', emissive: '#3366cc', emissiveIntensity: 1.25, toneMapped: false });
const mat_35 = getSharedStandardMaterial({ color: '#333333', metalness: 0.5, roughness: 0.4 });
const mat_36 = getSharedStandardMaterial({ color: '#555555', metalness: 0.6, roughness: 0.3 });
const mat_37 = getSharedStandardMaterial({ color: '#666666', metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide });
const mat_38 = getSharedStandardMaterial({ color: '#444', metalness: 0.7, roughness: 0.2 });
const mat_39 = getSharedStandardMaterial({ color: '#1a1a1e', metalness: 0.3, roughness: 0.7 });
const mat_40 = getSharedStandardMaterial({ color: '#2a2a2e' });
const mat_41 = getSharedStandardMaterial({ color: '#ff4400', emissive: '#ff4400', emissiveIntensity: 1.5 });
const mat_42 = getSharedStandardMaterial({ color: '#151515', emissive: '#ffcc88', emissiveIntensity: 0.2 });
const mat_43 = getSharedStandardMaterial({ color: '#1a1a2a', roughness: 0.8 });
const mat_44 = getSharedStandardMaterial({ color: '#001133', emissive: '#0088ff', emissiveIntensity: 0.45 });
const mat_45 = getSharedStandardMaterial({ color: '#110033', emissive: '#aa44ff', emissiveIntensity: 0.25 });
const mat_46 = getSharedStandardMaterial({ color: '#2a1a1a', roughness: 0.8 });
const mat_47 = getSharedStandardMaterial({ color: '#1a0000', emissive: '#ff2244', emissiveIntensity: 0.8 });
const mat_48 = getSharedStandardMaterial({ color: '#c8c0a0', roughness: 0.9, transparent: true, opacity: 0.7, depthWrite: false });
const mat_49 = getSharedStandardMaterial({ color: '#1a1a1a', roughness: 0.7 });
const mat_50 = getSharedStandardMaterial({ color: '#2a2a2a', roughness: 0.8 });
const mat_51 = getSharedStandardMaterial({ color: '#222', roughness: 0.9 });
const mat_52 = getSharedStandardMaterial({ color: '#3a4a5a', roughness: 0.95 });
const mat_53 = getSharedStandardMaterial({ color: '#1a2a4a', roughness: 0.9 });
const mat_54 = getSharedStandardMaterial({ color: '#4a4a4a', roughness: 0.95 });
const mat_55 = getSharedStandardMaterial({ color: '#5a4535', roughness: 0.8 });
const mat_56 = getSharedStandardMaterial({ color: '#aaa', metalness: 0.7, roughness: 0.3 });
const mat_57 = getSharedStandardMaterial({ color: '#1a1a1a', roughness: 0.6 });
const mat_58 = getSharedStandardMaterial({ color: '#001122', emissive: '#3355aa', emissiveIntensity: 0.5 });
const mat_59 = getSharedStandardMaterial({ color: '#333', roughness: 0.9 });
const mat_60 = getSharedStandardMaterial({ color: '#c0d0e0', transparent: true, opacity: 0.4, roughness: 0.2, depthWrite: false });
const mat_61 = getSharedStandardMaterial({ color: '#5a4050', roughness: 0.95 });
const mat_62 = getSharedStandardMaterial({ color: '#0a0a20', emissive: '#1a1a30', emissiveIntensity: 1.5 });
const mat_63 = getSharedStandardMaterial({ color: '#ffcc44', emissive: '#ffcc44', emissiveIntensity: 1.0 });
const mat_64 = getSharedStandardMaterial({ color: '#aaccff', emissive: '#aaccff', emissiveIntensity: 0.75 });
const mat_65 = getSharedStandardMaterial({ color: '#2a3a2a', roughness: 0.9 });
const mat_66 = getSharedStandardMaterial({ color: '#1a2a1a', roughness: 0.9 });
const mat_67 = getSharedStandardMaterial({ color: '#888', metalness: 0.7, roughness: 0.3 });
const mat_68 = getSharedStandardMaterial({ color: '#1a2a1a', roughness: 0.8 });
const mat_69 = getSharedStandardMaterial({ color: '#002200', emissive: '#00ff44', emissiveIntensity: 0.8 });
const mat_led_power = getSharedStandardMaterial({
  color: '#00ff00',
  emissive: '#00ff00',
  emissiveIntensity: 1.4,
});
const mat_zabbix_led = getSharedStandardMaterial({
  color: '#e8413a',
  emissive: '#e8413a',
  emissiveIntensity: 2.5,
  toneMapped: false,
});
const mat_posterTeal = getSharedStandardMaterial({ color: '#0a3a3a', roughness: 0.7 });
const mat_posterLogo = getSharedStandardMaterial({ color: '#00ccaa', emissive: '#00ccaa', emissiveIntensity: 0.55, toneMapped: false });
const mat_photoWarm = getSharedStandardMaterial({ color: '#d4b870', roughness: 0.8 });

function bookSpineMaterial(color: string) {
  return mat(color, { roughness: 0.6 });
}

function cloneRoomAsset(source: THREE.Object3D, castShadow: boolean): THREE.Object3D {
  const clone = source.clone(true);
  clone.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of mats) {
        if (material && 'envMapIntensity' in material) {
          const std = material as THREE.MeshStandardMaterial;
          std.envMapIntensity = 0.78;
          if (typeof std.roughness === 'number') std.roughness = Math.min(1, Math.max(0.42, std.roughness));
        }
      }
    }
  });
  return clone;
}

function AuthoredRoomProp({
  url,
  position,
  rotationY = 0,
  scale = 1,
  castShadow,
}: {
  url: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  castShadow: boolean;
}) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const scene = useMemo(() => cloneRoomAsset(gltf.scene, castShadow), [gltf.scene, castShadow]);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function AuthoredVolodkaRoomDressing({ castShadow }: { castShadow: boolean }) {
  return (
    <group>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.sofa}
          position={[1.78, 0, 2.0]}
          rotationY={-Math.PI / 2}
          scale={0.92}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.armChair}
          position={[-0.55, 0, -1.35]}
          rotationY={Math.PI}
          scale={0.74}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.woodenBookshelfWorn}
          position={[-2.28, 0, -0.1]}
          rotationY={Math.PI / 2}
          scale={0.92}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.paintedWoodenCabinet}
          position={[-2.25, 0, 2.35]}
          rotationY={Math.PI / 2}
          scale={0.88}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.paintedWoodenTable}
          position={[2.08, 0, 2.1]}
          rotationY={0.2}
          scale={0.66}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.deskLampArm}
          position={[1.98, 0.52, 2.16]}
          rotationY={-0.45}
          scale={0.48}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.cassettePlayer}
          position={[0.52, 0.79, -2.35]}
          rotationY={0.28}
          scale={0.36}
          castShadow={castShadow}
        />
      </Suspense>
    </group>
  );
}

function AuthoredVolodkaWorkstation({ castShadow }: { castShadow: boolean }) {
  return (
    <group>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.paintedWoodenTable}
          position={[0, 0, -2.5]}
          rotationY={Math.PI}
          scale={0.78}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={KENNEY_TERMINAL_MODEL}
          position={[-0.48, 0.82, -2.72]}
          rotationY={0.22}
          scale={1.12}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={KENNEY_TERMINAL_MODEL}
          position={[0.0, 0.82, -2.74]}
          scale={1.18}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={KENNEY_TERMINAL_MODEL}
          position={[0.48, 0.82, -2.72]}
          rotationY={-0.22}
          scale={1.12}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={AI3DGEN_SERVER_FRAGMENT_MODEL}
          position={[0.82, 0.12, -2.82]}
          rotationY={-0.25}
          scale={0.82}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.deskLampArm}
          position={[-0.72, 0.82, -2.3]}
          rotationY={0.42}
          scale={0.46}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={POLYHAVEN_MODELS.cassettePlayer}
          position={[0.62, 0.82, -2.3]}
          rotationY={-0.2}
          scale={0.34}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={AI3DGEN_POETIC_COMPILER_MODEL}
          position={[-0.18, 0.84, -2.22]}
          rotationY={0.35}
          scale={0.38}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredRoomProp
          url={AI3DGEN_NEURAL_FILTER_MODEL}
          position={[0.24, 0.86, -2.22]}
          rotationY={-0.25}
          scale={0.32}
          castShadow={castShadow}
        />
      </Suspense>
      <pointLight position={[0, 1.25, -2.25]} color="#33ddaa" intensity={2.4} distance={7} decay={2} />
    </group>
  );
}

// FIX-B6 (Phase 7.2 — Volodka Room duplicate-frame cleanup):
// Wrap VolodkaRoomVisual in memo() so that any incidental parent re-render
// (e.g. from a Zustand store read elsewhere in the tree) does NOT cause
// this heavy procedural-geometry component to reconcile. The component has
// no internal useState and all its animation state lives in refs, so a
// shallow props comparison is sufficient to prevent wasted renders.
export const VolodkaRoomVisual = memo(function VolodkaRoomVisual({ livePlayerPositionRef: _livePlayerPositionRef }: VolodkaRoomVisualProps) {
  const { preset } = useGraphicsQuality();
  const useGltfFurniture = allowsGlbAssetRendering(preset.environmentRenderMode);
  const useAuthoredShell = !preset.visualLite;
  // Canvas textures created synchronously via useMemo
  const floorTexture = useCachedCanvasTexture('volodka_room:floor:v2', createFloorTexture);
  const wallTexture = useCachedCanvasTexture('volodka_room:wall:v2', createWallTexture);
  const ceilingWashTexture = useCachedCanvasTexture(
    'volodka_room:matrix-ceiling',
    createVolodkaRoomNightSkyTexture,
  );

  const mat_floor = useMemo(
    () =>
      getSharedStandardMaterial({
        map: floorTexture,
        color: '#5c4a36',
        roughness: 0.78,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [floorTexture],
  );
  const mat_ceiling = useMemo(
    () =>
      getSharedStandardMaterial({
        map: ceilingWashTexture,
        color: '#101820',
        emissive: '#183828',
        emissiveIntensity: 0.26,
        roughness: 0.95,
      }),
    [ceilingWashTexture],
  );
  const mat_wall = useMemo(
    () =>
      getSharedStandardMaterial({
        map: wallTexture,
        color: '#3a3548',
        roughness: 0.9,
        emissive: '#1a1828',
        emissiveIntensity: 0.15,
      }),
    [wallTexture],
  );

  // ── Desk monitor screen textures (Grafana · terminal · Zabbix) ──
  const terminalTexture = useMemo(() => createTerminalScreenTexture(), []);
  const grafanaTexture = useMemo(() => createGrafanaTexture(), []);
  const zabbixTexture = useMemo(() => createZabbixTexture(), []);

  // ── Animated elements refs ──
  const fanGroupRef = useRef<THREE.Group>(null);
  // ISSUE #3: Initialize refs directly to module-level materials instead of
  // setting them in useEffect([], []) — avoids 1-2 frames of null on mount.
  const ledRef = useRef<THREE.MeshStandardMaterial>(mat_led_power);
  const ledTimeRef = useRef(0);
  const terminalTexRef = useRef<THREE.CanvasTexture | null>(terminalTexture);
  const zabbixAlertRef = useRef<THREE.MeshStandardMaterial>(mat_zabbix_led);

  // ── Ambient effect refs ──
  const terminalMonitorGroupRef = useRef<THREE.Group>(null);
  const ambientPulseLightRef = useRef<THREE.PointLight>(null);

  // ── Interactive object animation refs ──
  const roomDoorRef = useRef<THREE.Group>(null);
  const roomWardrobeDoorRef = useRef<THREE.Group>(null);

  const W = 5; // width (x)
  const D = 7; // depth (z)
  const H = 3; // height (y)

  // terminalTexRef now initialized directly above — no useEffect needed.

  useEffect(() => {
    return () => {
      terminalTexture.dispose();
      grafanaTexture.dispose();
      zabbixTexture.dispose();
    };
  }, [terminalTexture, grafanaTexture, zabbixTexture]);

  // NOTE: floorTexture and wallTexture come from useCachedCanvasTexture,
  // which already refcounts and auto-disposes when the last consumer
  // unmounts. The previous manual ft.dispose()/wt.dispose() here was
  // double-disposing — it corrupted the shared cache, causing the next
  // scene visit to re-upload the texture (shader recompile + GPU stutter).
  // The terminal/grafana/zabbix textures below are NOT cached (created
  // via useMemo directly), so they DO need manual dispose.

  // ledRef and zabbixAlertRef are now initialized directly (see above).

  useVolodkaRoomAnimations({
    fanGroupRef,
    ledRef,
    ledTimeRef,
    terminalTexRef,
    zabbixAlertRef,
    roomDoorRef,
    roomWardrobeDoorRef,
  });

  // ── Ambient room effects ──
  useMonitorGlitch(terminalMonitorGroupRef);
  useZabbixAlertPulse(zabbixAlertRef, ambientPulseLightRef);

  return (
    <group>
      {useAuthoredShell ? (
        <AuthoredInteriorShell
          url={INTERIOR_SHELL_MODELS.volodkaBedroom}
          scale={[W / 1.3, H / 0.83354, D / 1.02814]}
          castShadow={preset.shadows}
        />
      ) : (
        <>
          {/* ── Floor — Poly Haven wood parquet (canvas fallback while loading) ── */}
          <Suspense
            fallback={
              <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={geo_pln_1} material={mat_floor} />
            }
          >
            <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={geo_pln_1}>
              <PolyHavenStandardMaterial
                materialId="wood_floor"
                repeatScale={0.85}
                color="#c8b090"
                metalness={0.02}
                roughness={0.82}
                polygonOffset
              />
            </mesh>
          </Suspense>

          {/* ── Ceiling — matrix monitor HDR wash ── */}
          <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={geo_pln_1} material={mat_ceiling} />

          {/* ── Walls — inset slightly to avoid coplanar z-fight at corners/door ── */}
          <Suspense
            fallback={
              <>
                <mesh position={[0, H / 2, -D / 2 + 0.01]} geometry={geo_pln_2} material={mat_wall} />
                <mesh position={[0, H / 2, D / 2 - 0.01]} rotation-y={Math.PI} geometry={geo_pln_2} material={mat_wall} />
                <mesh position={[-W / 2 + 0.01, H / 2, 0]} rotation-y={Math.PI / 2} geometry={geo_pln_3} material={mat_wall} />
                <mesh position={[W / 2 - 0.01, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={geo_pln_3} material={mat_wall} />
              </>
            }
          >
            <mesh position={[0, H / 2, -D / 2 + 0.01]} geometry={geo_pln_2}>
              <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={0.7} color="#9a94a8" roughness={0.92} />
            </mesh>
            <mesh position={[0, H / 2, D / 2 - 0.01]} rotation-y={Math.PI} geometry={geo_pln_2}>
              <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={0.7} color="#9a94a8" roughness={0.92} />
            </mesh>
            <mesh position={[-W / 2 + 0.01, H / 2, 0]} rotation-y={Math.PI / 2} geometry={geo_pln_3}>
              <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={0.75} color="#9a94a8" roughness={0.92} />
            </mesh>
            <mesh position={[W / 2 - 0.01, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={geo_pln_3}>
              <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={0.75} color="#9a94a8" roughness={0.92} />
            </mesh>
          </Suspense>

          {/* Architectural trim — baseboards + crown (breaks flat-plane room read) */}
          <mesh position={[0, 0.06, -D / 2 + 0.02]} geometry={getSharedBoxGeometry(W - 0.08, 0.12, 0.04)}>
            <PolyHavenStandardMaterial materialId="wood_floor" repeatScale={1.3} color="#4a3d30" roughness={0.82} metalness={0.04} />
          </mesh>
          <mesh position={[0, 0.06, D / 2 - 0.02]} geometry={getSharedBoxGeometry(W - 0.08, 0.12, 0.04)}>
            <PolyHavenStandardMaterial materialId="wood_floor" repeatScale={1.3} color="#4a3d30" roughness={0.82} metalness={0.04} />
          </mesh>
          <mesh position={[-W / 2 + 0.02, 0.06, 0]} geometry={getSharedBoxGeometry(0.04, 0.12, D - 0.08)}>
            <PolyHavenStandardMaterial materialId="wood_floor" repeatScale={1.4} color="#4a3d30" roughness={0.82} metalness={0.04} />
          </mesh>
          <mesh position={[W / 2 - 0.02, 0.06, 0]} geometry={getSharedBoxGeometry(0.04, 0.12, D - 0.08)}>
            <PolyHavenStandardMaterial materialId="wood_floor" repeatScale={1.4} color="#4a3d30" roughness={0.82} metalness={0.04} />
          </mesh>
          <mesh position={[0, H - 0.08, -D / 2 + 0.03]} geometry={getSharedBoxGeometry(W - 0.1, 0.1, 0.06)}>
            <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={1.0} color="#4a4658" roughness={0.84} metalness={0.04} />
          </mesh>
          <mesh position={[0, H - 0.08, D / 2 - 0.03]} geometry={getSharedBoxGeometry(W - 0.1, 0.1, 0.06)}>
            <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={1.0} color="#4a4658" roughness={0.84} metalness={0.04} />
          </mesh>
          <mesh position={[-W / 2 + 0.03, H - 0.08, 0]} geometry={getSharedBoxGeometry(0.06, 0.1, D - 0.1)}>
            <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={1.05} color="#4a4658" roughness={0.84} metalness={0.04} />
          </mesh>
          <mesh position={[W / 2 - 0.03, H - 0.08, 0]} geometry={getSharedBoxGeometry(0.06, 0.1, D - 0.1)}>
            <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={1.05} color="#4a4658" roughness={0.84} metalness={0.04} />
          </mesh>
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERACTIVE ANIMATED OBJECTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Room Door — authored GLTF dressing owns High/Ultra; primitive fallback only ── */}
      {!useGltfFurniture ? (
        <>
          {/* Door frame — pushed further off the inset wall to avoid z-fight */}
          <mesh position={[0, 1.1, D / 2 - 0.04]} rotation-y={Math.PI} geometry={geo_box_4} material={mat_1} />
          {/* Door frame border */}
          <mesh position={[-0.5, 1.1, D / 2 - 0.045]} rotation-y={Math.PI} geometry={geo_box_5} material={mat_2} />
          <mesh position={[0.5, 1.1, D / 2 - 0.045]} rotation-y={Math.PI} geometry={geo_box_5} material={mat_2} />
          <mesh position={[0, 2.2, D / 2 - 0.045]} rotation-y={Math.PI} geometry={geo_box_6} material={mat_2} />
          {/* Animated door panel — pivot on left edge */}
          <group position={[-0.45, 0, D / 2 - 0.06]} ref={roomDoorRef}>
            <mesh position={[0.45, 1.1, 0]} geometry={geo_box_7} material={mat_3} />
            {/* Door handle */}
            <mesh position={[0.78, 1.05, 0.03]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_8} material={mat_4} />
            {/* Door panel detail — inset rectangle */}
            <mesh position={[0.45, 1.4, 0.025]} geometry={geo_box_9} material={mat_5} />
            <mesh position={[0.45, 0.7, 0.025]} geometry={geo_box_9} material={mat_5} />
          </group>
        </>
      ) : (
        <group ref={roomDoorRef} visible={false} />
      )}

      {/* ── Wardrobe — hidden on GLTF presets to avoid placeholder hero read ── */}
      {!useGltfFurniture ? (
      <group position={[-2.2, 0, 2.5]}>
        {/* Wardrobe body */}
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_10} material={mat_6} />
        {/* Wardrobe top */}
        <mesh position={[0, 2.02, 0]} geometry={geo_box_11} material={mat_7} />
        {/* Wardrobe shelf */}
        <mesh position={[0, 1.0, 0.01]} geometry={geo_box_12} material={mat_8} />
        {/* Animated wardrobe left door — pivot on left edge */}
        <group position={[-0.38, 0, 0.28]} ref={roomWardrobeDoorRef}>
          <mesh position={[0.19, 1.0, 0]} geometry={geo_box_13} material={mat_9} />
          {/* Door handle */}
          <mesh position={[0.32, 1.0, 0.02]} geometry={geo_sph_14} material={mat_4} />
          {/* Door panel detail */}
          <mesh position={[0.19, 1.3, 0.02]} geometry={geo_box_15} material={mat_10} />
          <mesh position={[0.19, 0.65, 0.02]} geometry={geo_box_15} material={mat_10} />
        </group>
        {/* Wardrobe right door (static) */}
        <mesh position={[0.19, 1.0, 0.295]} geometry={geo_box_13} material={mat_9} />
        <mesh position={[0.06, 1.0, 0.315]} geometry={geo_sph_14} material={mat_4} />
      </group>
      ) : (
        <group ref={roomWardrobeDoorRef} visible={false} />
      )}

      {/* ── Desk — GLTF kitbash on authored presets; procedural rig only on lite tiers ── */}
      {useAuthoredShell ? (
        <AuthoredVolodkaWorkstation castShadow={preset.shadows} />
      ) : (
        <group position={[0, 0, -2.5]}>
          <CraftedDeskShell matFallback={mat_11} />
          {([
            { id: 'grafana', tex: grafanaTexture, x: -0.62, rotY: 0.24 },
            { id: 'terminal', tex: terminalTexture, x: 0, rotY: 0 },
            { id: 'zabbix', tex: zabbixTexture, x: 0.62, rotY: -0.24 },
          ] as const).map(({ id, tex, x, rotY }) => (
            <ThinMonitor
              key={id}
              id={id}
              tex={tex}
              x={x}
              rotY={rotY}
              groupRef={id === 'terminal' ? terminalMonitorGroupRef : undefined}
              alertLed={id === 'zabbix' ? mat_zabbix_led : undefined}
            />
          ))}

          <pointLight position={[0, 1.25, 0.15]} color="#33ddaa" intensity={3.5} distance={12} decay={2} />
          {/* Keyboard — flat slab not cube pile */}
          <mesh position={[0, 0.785, 0.12]} geometry={getSharedBoxGeometry(0.42, 0.018, 0.14)} material={mat_15} />
          <mesh position={[0.15, 0.8, 0.05]} geometry={getSharedBoxGeometry(0.012, 0.006, 0.012)} material={mat_16} />
          <mesh position={[0.17, 0.8, 0.05]} geometry={getSharedBoxGeometry(0.012, 0.006, 0.012)} material={mat_17} />
          <mesh position={[0.6, 0.78, 0.1]} rotation={[0, 0.1, 0]} geometry={getSharedBoxGeometry(0.18, 0.004, 0.2)} material={mat_18} />
          <mesh position={[0.6, 0.79, 0.1]} rotation={[0, 0.1, 0]} geometry={getSharedBoxGeometry(0.06, 0.022, 0.1)} material={mat_19} />
          <group position={[-0.55, 0.78, 0.25]}>
            <mesh position={[0, 0.04, 0]} geometry={geo_cyl_27} material={mat_20} />
            <mesh position={[0.04, 0.04, 0]} rotation={[0, 0, Math.PI / 2]} geometry={geo_tor_28} material={mat_20} />
            <mesh position={[0, 0.075, 0]} geometry={geo_cyl_29} material={mat_21} />
          </group>
          <mesh position={[0.3, 0.78, 0.2]} rotation={[0, 0.4, 0]} geometry={geo_box_30} material={mat_22} />
          <mesh position={[0.35, 0.785, 0.15]} rotation={[0, -0.2, 0.02]} geometry={geo_box_31} material={mat_23} />
          <mesh position={[-0.2, 0.78, 0.3]} rotation={[0, 0.7, -0.01]} geometry={geo_box_32} material={mat_24} />
        </group>
      )}

      {/* ── Chair — fallback only; no low-poly hero chair on GLTF presets ── */}
      {!useGltfFurniture ? (
      <group position={[0, 0, -1.5]}>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]} castShadow geometry={geo_box_33} material={mat_25} />
        {/* Backrest */}
        <mesh position={[0, 0.75, -0.22]} castShadow geometry={geo_box_34} material={mat_25} />
        {/* Legs */}
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.225, z]} geometry={geo_box_35} material={mat_26} />
        ))}
      </group>
      ) : null}

      {/* ── Bookshelf — fallback only; GLTF presets use authored wall dressing ── */}
      {!useGltfFurniture ? (
      <group position={[-2.2, 0, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_36} material={mat_27} />
        {/* Shelf dividers */}
        {[0.5, 1.0, 1.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0.02]} geometry={geo_box_37} material={mat_28} />
        ))}
        {/* Books on shelves — multiple thin colored spines per shelf */}
        {/* Shelf 1 (bottom) */}
        {[
          { x: -0.25, w: 0.04, c: '#8b2020' }, { x: -0.18, w: 0.05, c: '#204080' },
          { x: -0.10, w: 0.03, c: '#208020' }, { x: -0.04, w: 0.06, c: '#806020' },
          { x: 0.06, w: 0.04, c: '#602080' }, { x: 0.14, w: 0.05, c: '#804020' },
          { x: 0.22, w: 0.03, c: '#208080' },
        ].map((b, _i) => (
          <mesh key={`s1-${b.c}`} position={[b.x, 0.27, 0.02]} geometry={bookSpineGeo(b.w, 0.2)} material={bookSpineMaterial(b.c)} />
        ))}
        {/* Shelf 2 */}
        {[
          { x: -0.22, w: 0.05, c: '#a03020' }, { x: -0.12, w: 0.04, c: '#304090' },
          { x: -0.04, w: 0.06, c: '#307030' }, { x: 0.08, w: 0.03, c: '#907030' },
          { x: 0.15, w: 0.05, c: '#703090' },
        ].map((b, _i) => (
          <mesh key={`s2-${b.c}`} position={[b.x, 0.77, 0.02]} geometry={bookSpineGeo(b.w, 0.18)} material={bookSpineMaterial(b.c)} />
        ))}
        {/* Shelf 3 */}
        {[
          { x: -0.20, w: 0.04, c: '#b04030' }, { x: -0.10, w: 0.06, c: '#2050a0' },
          { x: 0.02, w: 0.03, c: '#30a040' }, { x: 0.10, w: 0.05, c: '#a08030' },
          { x: 0.18, w: 0.04, c: '#8040a0' }, { x: 0.25, w: 0.03, c: '#30a0a0' },
        ].map((b, _i) => (
          <mesh key={`s3-${b.c}`} position={[b.x, 1.27, 0.02]} geometry={bookSpineGeo(b.w, 0.2)} material={bookSpineMaterial(b.c)} />
        ))}
        {/* Shelf 4 (top) — a few books, leaning */}
        {[
          { x: -0.15, w: 0.05, c: '#c05040', lean: 0.05 },
          { x: -0.05, w: 0.04, c: '#3060b0', lean: -0.08 },
          { x: 0.06, w: 0.06, c: '#40b050', lean: 0.02 },
        ].map((b, _i) => (
          <mesh key={`s4-${b.c}`} position={[b.x, 1.77, 0.02]} rotation={[0, 0, b.lean]} geometry={bookSpineGeo(b.w, 0.18)} material={bookSpineMaterial(b.c)} />
        ))}
      </group>
      ) : null}

      {!useAuthoredShell ? (
        <group position={[1.8, 1.6, -3.45]}>
          {/* Thin dark frame */}
          <mesh geometry={geo_posterFrame} material={mat_49} />
          {/* Poster surface — dark teal/emerald */}
          <mesh position={[0, 0, 0.013]} geometry={geo_posterBack} material={mat_posterTeal} />
          {/* Glowing logo rectangle (suggests a tech/concert poster) */}
          <mesh position={[0, 0.12, 0.018]} geometry={geo_posterLogo} material={mat_posterLogo} />
        </group>
      ) : null}

      {!useAuthoredShell ? (
        <group position={[2.35, 1.5, 1.5]} rotation-y={-Math.PI / 2}>
          {/* Wooden frame (brown) */}
          <mesh geometry={geo_photoFrame} material={mat_1} />
          {/* Warm photo print */}
          <mesh position={[0, 0, 0.013]} geometry={geo_photoBack} material={mat_photoWarm} />
        </group>
      ) : null}

      {/* ── Bed — fallback only; GLTF presets use Poly Haven bench/prop dressing ── */}
      {!useGltfFurniture ? (
      <group position={[1.8, 0, 2.0]}>
        {/* Mattress */}
        <mesh position={[0, 0.35, 0]} castShadow geometry={geo_box_38} material={mat_29} />
        {/* Headboard */}
        <mesh position={[0, 0.6, -0.95]} castShadow geometry={geo_box_39} material={mat_30} />
        {/* Pillow */}
        <mesh position={[0, 0.55, -0.7]} geometry={geo_box_40} material={mat_31} />
        {/* Blanket */}
        <mesh position={[0, 0.52, 0.2]} geometry={geo_box_41} material={mat_32} />
      </group>
      ) : null}

      {!useGltfFurniture ? (
        <>
          {/* ── Window (right wall, emissive blue — nighttime city glow) ── */}
          <group position={[W / 2 - 0.04, 1.5, -2.0]}>
            <mesh renderOrder={1} rotation-y={-Math.PI / 2} geometry={geo_pln_42} material={mat_33} />
            {/* Window frame */}
            <mesh renderOrder={2} rotation-y={-Math.PI / 2} position={[0.015, 0, 0]} geometry={geo_box_43} material={mat_26} />
            {/* Window blue light spill into room */}
            <pointLight position={[-0.8, 0, 0.5]} color="#4488ee" intensity={3.0} distance={5} />
            {/* City building silhouettes through window */}
            <mesh renderOrder={3} rotation-y={-Math.PI / 2} position={[-0.02, -0.15, -0.3]} geometry={geo_pln_75} material={mat_62} />
            <mesh renderOrder={3} rotation-y={-Math.PI / 2} position={[-0.02, -0.1, 0.2]} geometry={geo_pln_76} material={mat_62} />
            {/* Tiny window lights on buildings */}
            <mesh renderOrder={4} rotation-y={-Math.PI / 2} position={[-0.028, -0.2, -0.3]} geometry={geo_pln_77} material={mat_63} />
            <mesh renderOrder={4} rotation-y={-Math.PI / 2} position={[-0.028, -0.05, 0.2]} geometry={geo_pln_77} material={mat_63} />
            <mesh renderOrder={4} rotation-y={-Math.PI / 2} position={[-0.028, -0.12, 0.22]} geometry={geo_pln_78} material={mat_64} />
          </group>

          {/* ── Second Window (back wall, emissive blue — nighttime city) ── */}
          <group position={[-1.0, 1.5, -D / 2 + 0.04]}>
            <mesh renderOrder={1} geometry={geo_pln_44} material={mat_34} />
            {/* Window frame */}
            <mesh renderOrder={2} position={[0, 0, -0.015]} geometry={geo_box_45} material={mat_26} />
            {/* ISSUE #7: Removed per-window pointLight — the right wall window light +
                desk lamp + ambient pulse provide sufficient fill. The window material's
                emissive (mat_34, emissiveIntensity=3.5) already creates a visible glow. */}
          </group>
        </>
      ) : null}

      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING (lazy chunk) ── */}
      {!useGltfFurniture ? <VolodkaRoomClutter /> : null}
      {useGltfFurniture ? <AuthoredVolodkaRoomDressing castShadow={preset.shadows} /> : null}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANIMATED DESK ELEMENTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {!useAuthoredShell ? (
        <group position={[-0.7, 0.78, -2.3]}>
          {/* Fan base */}
          <mesh position={[0, 0.04, 0]} geometry={geo_cyl_46} material={mat_35} />
          {/* Fan cage (static outer ring) */}
          <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={geo_tor_47} material={mat_36} />
          {/* Rotating fan blades */}
          <group ref={fanGroupRef} position={[0, 0.12, 0.02]}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} geometry={geo_box_48} material={mat_37} />
            ))}
            {/* Fan hub */}
            <mesh geometry={geo_cyl_49} material={mat_38} />
          </group>
        </group>
      ) : null}

      {/* ── PC case with blinking LED ── */}
      {!useAuthoredShell ? <group position={[0.9, 0, -2.8]}>
        {/* Case body */}
        <mesh position={[0, 0.25, 0]} castShadow geometry={geo_box_50} material={mat_39} />
        {/* Front panel line */}
        <mesh position={[-0.1, 0.25, 0]} geometry={geo_box_51} material={mat_40} />
        {/* Blinking power LED */}
        <mesh position={[-0.101, 0.42, 0.12]} geometry={geo_sph_52} material={mat_led_power} />
        {/* HDD activity LED */}
        <mesh position={[-0.101, 0.42, 0.08]} geometry={geo_sph_53} material={mat_41} />
        {/* Ventilation grill lines */}
        {[0.05, 0.1, 0.15, 0.2].map((y, i) => (
          <mesh key={`vent-${i}`} position={[-0.101, y, -0.05]} geometry={geo_box_54} material={mat_40} />
        ))}
      </group> : null}

      {/* ── Desk lamp — warm practical with soft shadow on High/Ultra ── */}
      <pointLight
        position={[0.3, 1.5, -2.3]}
        color="#ffcc88"
        intensity={4.2}
        distance={10}
        decay={2}
        castShadow={preset.shadows}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.003}
        shadow-normalBias={0.04}
      />

      {/* ── Subtle warm fill near bed area — brightened so bed/bookshelf are visible ── */}
      <pointLight
        position={[-1.5, 1.8, 2.5]}
        color="#c8b8d0"
        intensity={1.85}
        distance={6}
        decay={2}
      />

      {/* Soft practical near wardrobe / door */}
      <pointLight
        position={[-1.8, 2.0, 1.2]}
        color="#ffe0c0"
        intensity={1.1}
        distance={5}
        decay={2}
      />

      {/* ── Ceiling ambient glow panel (dim — noir apartment) ── */}
      <mesh position={[0, H - 0.02, -1]} rotation-x={Math.PI / 2} geometry={geo_pln_55} material={mat_42} />

      {/* ── Ambient room effects ── */}
      <FlickeringCeilingLight />
      {/* Ambient pulse light — tinted red by Zabbix alerts via useZabbixAlertPulse */}
      <pointLight
        ref={ambientPulseLightRef}
        position={[0, 2.2, -1.5]}
        color="#ffe8cc"
        intensity={1.8}
        distance={7}
        decay={2}
      />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL ROOM DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {!useAuthoredShell ? (
        <>
          {/* ── Posters on back wall (renderOrder + offset to kill wall z-fight) ── */}
          <group position={[-1.0, 1.8, -D / 2 + 0.035]}>
            {/* Poster 1 — dark with neon accent */}
            <mesh renderOrder={2} geometry={geo_box_56} material={mat_43} />
            {/* Poster design — colored rectangles */}
            <mesh renderOrder={3} position={[0, 0.1, 0.012]} geometry={geo_box_57} material={mat_44} />
            <mesh renderOrder={3} position={[0, -0.1, 0.012]} geometry={geo_box_58} material={mat_45} />
          </group>

          <group position={[1.5, 1.6, -D / 2 + 0.035]}>
            {/* Poster 2 — punk band poster */}
            <mesh renderOrder={2} geometry={geo_box_59} material={mat_46} />
            <mesh renderOrder={3} position={[0, 0.08, 0.012]} geometry={geo_box_60} material={mat_47} />
            {/* Tape on corners */}
            <mesh renderOrder={4} position={[-0.2, 0.28, 0.018]} rotation={[0, 0, 0.3]} geometry={geo_box_61} material={mat_48} />
            <mesh renderOrder={4} position={[0.2, -0.28, 0.018]} rotation={[0, 0, -0.2]} geometry={geo_box_61} material={mat_48} />
          </group>
        </>
      ) : null}

      {!useAuthoredShell ? <group position={[0.5, 0.78, -2.6]}>
        {/* Headband */}
        <mesh rotation={[0, 0, 0]} geometry={geo_tor_62} material={mat_49} />
        {/* Left ear cup */}
        <mesh position={[-0.06, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} geometry={geo_cyl_63} material={mat_50} />
        {/* Right ear cup */}
        <mesh position={[0.06, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} geometry={geo_cyl_63} material={mat_50} />
        {/* Cable */}
        <mesh position={[0, -0.04, 0.15]} rotation={[0.3, 0, 0]} geometry={geo_cyl_64} material={mat_51} />
      </group> : null}

      {/* ── Laundry pile on floor near bed ── */}
      {!useAuthoredShell ? <group position={[1.5, 0, 3.5]}>
        {/* T-shirt shape */}
        <mesh position={[0, 0.05, 0]} rotation={[0.2, 0.5, 0.1]} geometry={geo_box_65} material={mat_52} />
        {/* Jeans */}
        <mesh position={[0.15, 0.03, 0.1]} rotation={[0, -0.3, 0.15]} geometry={geo_box_66} material={mat_53} />
        {/* Sock */}
        <mesh position={[-0.1, 0.02, 0.15]} rotation={[0.5, 0.8, 0.2]} geometry={geo_cyl_67} material={mat_54} />
      </group> : null}

      {/* ── Nightstand beside bed — fallback only; GLTF presets use authored barrel/box dressing ── */}
      {!useGltfFurniture ? (
        <group position={[2.2, 0, 2.0]}>
          {/* Nightstand body */}
          <mesh position={[0, 0.25, 0]} castShadow geometry={geo_box_68} material={mat_6} />
          {/* Drawer */}
          <mesh position={[0, 0.3, 0.18]} geometry={geo_box_69} material={mat_55} />
          {/* Drawer handle */}
          <mesh position={[0, 0.3, 0.2]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_70} material={mat_56} />
        </group>
      ) : null}
      <group position={[2.2, useGltfFurniture ? 0.08 : 0, 2.0]}>
        {/* Phone / glass stay as narrative dressing on either table implementation. */}
        <mesh position={[0, 0.52, 0.05]} rotation={[0, 0.2, 0]} geometry={geo_box_71} material={mat_57} />
        <mesh position={[0, 0.533, 0.05]} rotation={[0, 0.2, 0]} geometry={geo_box_72} material={mat_58} />
        <mesh position={[0.05, 0.51, -0.05]} rotation={[0.8, 0.2, 0]} geometry={geo_cyl_64} material={mat_59} />
        <mesh renderOrder={2} position={[-0.1, 0.565, -0.05]} geometry={geo_cyl_73} material={mat_60} />
      </group>

      {!useAuthoredShell ? (
        <>
          {/* ── Slippers on floor near bed ── */}
          <mesh position={[1.3, 0.015, 3.0]} rotation={[0, 0.3, 0]} geometry={geo_box_74} material={mat_61} />
          <mesh position={[1.5, 0.015, 2.9]} rotation={[0, -0.15, 0.05]} geometry={geo_box_74} material={mat_61} />
        </>
      ) : null}

      {/* ── Backpack on floor near door — fallback only; Poly Haven boxes dress this corner on GLB presets ── */}
      {!useGltfFurniture ? (
      <group position={[-1.5, 0, 2.8]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow geometry={geo_box_79} material={mat_65} />
        {/* Straps */}
        <mesh position={[-0.08, 0.25, 0.08]} geometry={geo_box_80} material={mat_66} />
        <mesh position={[0.08, 0.25, 0.08]} geometry={geo_box_80} material={mat_66} />
        {/* Zipper */}
        <mesh position={[0, 0.35, 0.08]} geometry={geo_box_81} material={mat_67} />
      </group>
      ) : null}

      {!useAuthoredShell ? (
        <group position={[-W / 2 + 0.02, 1.6, -1.0]} rotation-y={Math.PI / 2}>
          <mesh geometry={geo_box_82} material={mat_68} />
          <mesh position={[0, 0.1, 0.004]} geometry={geo_box_83} material={mat_69} />
        </group>
      ) : null}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERIOR MODELS (from InteriorModels.tsx) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Desk Lamp on nightstand ── */}
      <Lamp position={[2.0, 0.5, 2.2]} scale={[0.6, 0.6, 0.6]} />

      {/* ── Rug on floor near bed ── */}
      <Rug position={[1.8, 0.002, 2.0]} scale={[0.8, 1, 0.7]} color="#2a2840" />

      {/* ── Radiator on left wall near bed ── */}
      <Radiator position={[-W / 2 + 0.06, 0.3, 1.5]} rotation={[0, Math.PI / 2, 0]} color="#a0a0a0" />

      {/* FIX-B1 (Phase 7.2 — Volodka Room duplicate-frame cleanup):
          Removed <DustParticles /> — it was a SECOND dust particle system
          running simultaneously with AtmosphericEffects' DustMotes (which
          mounts automatically because 'volodka_room' is in DUST_SCENES).
          Both wrote GPU buffers every frame, both rendered ~visible dust
          motes. DustMotes is preferred because it has player-wake response
          + mobile particle scaling; DustParticles is a static 400-particle
          raw useFrame loop. Keeping DustMotes alone saves 400 particles
          of per-frame BufferAttribute writes. */}
    </group>
  );
});

/* ─── Canvas Texture Helpers ─── */

function createFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Worn Soviet parquet — warm mid-tone with plank bands
  ctx.fillStyle = '#5c4a36';
  ctx.fillRect(0, 0, size, size);

  const plankH = 36;
  for (let row = 0; row < size / plankH; row++) {
    const y = row * plankH;
    const shade = 78 + ((row * 17) % 28);
    ctx.fillStyle = `rgb(${shade},${(shade * 0.78) | 0},${(shade * 0.48) | 0})`;
    ctx.fillRect(0, y, size, plankH - 1);
    // Seam
    ctx.fillStyle = 'rgba(28,18,10,0.55)';
    ctx.fillRect(0, y + plankH - 1, size, 1);
    // Vertical plank joints staggered per row
    const offset = (row % 2) * 48;
    for (let x = offset; x < size; x += 96) {
      ctx.fillStyle = 'rgba(24,16,10,0.35)';
      ctx.fillRect(x, y, 1, plankH - 1);
    }
  }

  // Deterministic grain streaks
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 120; i++) {
    const y = ((i * 97) % size) + 0.5;
    ctx.strokeStyle = i % 2 === 0 ? '#3a2a18' : '#6a5640';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + ((i * 13) % 9) - 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Soft scuff / wear near center traffic path
  const wear = ctx.createRadialGradient(size * 0.5, size * 0.55, 20, size * 0.5, size * 0.55, size * 0.45);
  wear.addColorStop(0, 'rgba(90,70,50,0.18)');
  wear.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wear;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.repeat.set(3, 4);
  return tex;
}

function createWallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Faded wallpaper / plaster base — cool violet-grey apartment noir
  ctx.fillStyle = '#4a4050';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 90; i++) {
    const x = (i * 53) % size;
    const y = (i * 97) % size;
    const r = 8 + (i % 24);
    ctx.globalAlpha = 0.04 + (i % 5) * 0.008;
    ctx.fillStyle = i % 2 === 0 ? '#5a5058' : '#3a3038';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Subtle vertical wallpaper stripe
  ctx.globalAlpha = 0.06;
  for (let x = 0; x < size; x += 28) {
    ctx.fillStyle = '#6a6070';
    ctx.fillRect(x, 0, 2, size);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.repeat.set(2, 2);
  return tex;
}

useGLTF.preload(POLYHAVEN_MODELS.sofa, true, true, extendLoader);
useGLTF.preload(POLYHAVEN_MODELS.armChair, true, true, extendLoader);
useGLTF.preload(POLYHAVEN_MODELS.woodenBookshelfWorn, true, true, extendLoader);
useGLTF.preload(POLYHAVEN_MODELS.paintedWoodenCabinet, true, true, extendLoader);
useGLTF.preload(POLYHAVEN_MODELS.paintedWoodenTable, true, true, extendLoader);
useGLTF.preload(POLYHAVEN_MODELS.deskLampArm, true, true, extendLoader);
useGLTF.preload(POLYHAVEN_MODELS.cassettePlayer, true, true, extendLoader);
useGLTF.preload(KENNEY_TERMINAL_MODEL, true, true, extendLoader);
useGLTF.preload(AI3DGEN_SERVER_FRAGMENT_MODEL, true, true, extendLoader);
useGLTF.preload(AI3DGEN_POETIC_COMPILER_MODEL, true, true, extendLoader);
useGLTF.preload(AI3DGEN_NEURAL_FILTER_MODEL, true, true, extendLoader);
