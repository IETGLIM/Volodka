
/* ─── Volodka RPG – Volodka's room procedural 3D visual ─── */

import { useMemo, useRef, useEffect, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { getSharedStandardMaterial, mat } from '@/engine/three/moduleMaterialRegistry';
import {
  registerModuleGeometries,
  registerModuleGeometry,
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
import { DustParticles } from './DustParticles';

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

// ISSUE #5: Pre-allocated color for emissive monitor screens (avoids per-render allocation)
const MONITOR_EMISSIVE_COLOR = new THREE.Color(0xffffff);

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
const mat_12 = getSharedStandardMaterial({ color: '#3a2a18' });
const mat_13 = getSharedStandardMaterial({ color: '#08080b', roughness: 0.4, metalness: 0.4 });
const mat_14 = getSharedStandardMaterial({ color: '#15151a' });
const mat_15 = getSharedStandardMaterial({ color: '#1a1a1a', emissive: '#00ff44', emissiveIntensity: 0.02 });
const mat_16 = getSharedStandardMaterial({ color: '#00ff44', emissive: '#00ff44', emissiveIntensity: 3.0 });
const mat_17 = getSharedStandardMaterial({ color: '#ffaa00', emissive: '#ffaa00', emissiveIntensity: 2.0 });
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
const mat_33 = getSharedStandardMaterial({ color: '#0a0a30', emissive: '#4488ee', emissiveIntensity: 4.0, toneMapped: false });
const mat_34 = getSharedStandardMaterial({ color: '#0a0a30', emissive: '#3366cc', emissiveIntensity: 3.5, toneMapped: false });
const mat_35 = getSharedStandardMaterial({ color: '#333333', metalness: 0.5, roughness: 0.4 });
const mat_36 = getSharedStandardMaterial({ color: '#555555', metalness: 0.6, roughness: 0.3 });
const mat_37 = getSharedStandardMaterial({ color: '#666666', metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide });
const mat_38 = getSharedStandardMaterial({ color: '#444', metalness: 0.7, roughness: 0.2 });
const mat_39 = getSharedStandardMaterial({ color: '#1a1a1e', metalness: 0.3, roughness: 0.7 });
const mat_40 = getSharedStandardMaterial({ color: '#2a2a2e' });
const mat_41 = getSharedStandardMaterial({ color: '#ff4400', emissive: '#ff4400', emissiveIntensity: 1.5 });
const mat_42 = getSharedStandardMaterial({ color: '#151515', emissive: '#ffcc88', emissiveIntensity: 0.2 });
const mat_43 = getSharedStandardMaterial({ color: '#1a1a2a', roughness: 0.8 });
const mat_44 = getSharedStandardMaterial({ color: '#001133', emissive: '#0088ff', emissiveIntensity: 1.2 });
const mat_45 = getSharedStandardMaterial({ color: '#110033', emissive: '#aa44ff', emissiveIntensity: 0.6 });
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
const mat_63 = getSharedStandardMaterial({ color: '#ffcc44', emissive: '#ffcc44', emissiveIntensity: 3.0 });
const mat_64 = getSharedStandardMaterial({ color: '#aaccff', emissive: '#aaccff', emissiveIntensity: 2.0 });
const mat_65 = getSharedStandardMaterial({ color: '#2a3a2a', roughness: 0.9 });
const mat_66 = getSharedStandardMaterial({ color: '#1a2a1a', roughness: 0.9 });
const mat_67 = getSharedStandardMaterial({ color: '#888', metalness: 0.7, roughness: 0.3 });
const mat_68 = getSharedStandardMaterial({ color: '#1a2a1a', roughness: 0.8 });
const mat_69 = getSharedStandardMaterial({ color: '#002200', emissive: '#00ff44', emissiveIntensity: 0.8 });
const mat_led_power = getSharedStandardMaterial({
  color: '#00ff00',
  emissive: '#00ff00',
  emissiveIntensity: 3.0,
});
const mat_zabbix_led = getSharedStandardMaterial({
  color: '#e8413a',
  emissive: '#e8413a',
  emissiveIntensity: 2.5,
  toneMapped: false,
});
const mat_posterTeal = getSharedStandardMaterial({ color: '#0a3a3a', roughness: 0.7 });
const mat_posterLogo = getSharedStandardMaterial({ color: '#00ccaa', emissive: '#00ccaa', emissiveIntensity: 1.5, toneMapped: false });
const mat_photoWarm = getSharedStandardMaterial({ color: '#d4b870', roughness: 0.8 });

function bookSpineMaterial(color: string) {
  return mat(color, { roughness: 0.6 });
}

export function VolodkaRoomVisual({ livePlayerPositionRef: _livePlayerPositionRef }: VolodkaRoomVisualProps) {
  // Canvas textures created synchronously via useMemo
  const floorTexture = useCachedCanvasTexture('volodka_room:floor', createFloorTexture);
  const wallTexture = useCachedCanvasTexture('volodka_room:wall', createWallTexture);
  const ceilingWashTexture = useCachedCanvasTexture(
    'volodka_room:matrix-ceiling',
    createVolodkaRoomNightSkyTexture,
  );

  const mat_floor = useMemo(
    () =>
      getSharedStandardMaterial({
        map: floorTexture,
        color: '#5a4a3a',
        roughness: 0.8,
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

  // Dispose floor and wall textures on unmount to prevent GPU memory leak
  useEffect(() => {
    const ft = floorTexture;
    const wt = wallTexture;
    return () => {
      ft.dispose();
      wt.dispose();
    };
  }, [floorTexture, wallTexture]);

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
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={geo_pln_1} material={mat_floor} />

      {/* ── Ceiling — matrix monitor HDR wash ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={geo_pln_1} material={mat_ceiling} />

      {/* ── Back Wall (z = -D/2) ── */}
      <mesh position={[0, H / 2, -D / 2]} geometry={geo_pln_2} material={mat_wall} />

      {/* ── Front Wall (z = +D/2) ── */}
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI} geometry={geo_pln_2} material={mat_wall} />

      {/* ── Left Wall (x = -W/2) ── */}
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2} geometry={geo_pln_3} material={mat_wall} />

      {/* ── Right Wall (x = +W/2) ── */}
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={geo_pln_3} material={mat_wall} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERACTIVE ANIMATED OBJECTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Room Door (front wall, swings open) ── */}
      {/* Door frame */}
      <mesh position={[0, 1.1, D / 2 - 0.01]} rotation-y={Math.PI} geometry={geo_box_4} material={mat_1} />
      {/* Door frame border */}
      <mesh position={[-0.5, 1.1, D / 2 - 0.015]} rotation-y={Math.PI} geometry={geo_box_5} material={mat_2} />
      <mesh position={[0.5, 1.1, D / 2 - 0.015]} rotation-y={Math.PI} geometry={geo_box_5} material={mat_2} />
      <mesh position={[0, 2.2, D / 2 - 0.015]} rotation-y={Math.PI} geometry={geo_box_6} material={mat_2} />
      {/* Animated door panel — pivot on left edge */}
      <group position={[-0.45, 0, D / 2 - 0.03]} ref={roomDoorRef}>
        <mesh position={[0.45, 1.1, 0]} geometry={geo_box_7} material={mat_3} />
        {/* Door handle */}
        <mesh position={[0.78, 1.05, 0.03]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_8} material={mat_4} />
        {/* Door panel detail — inset rectangle */}
        <mesh position={[0.45, 1.4, 0.025]} geometry={geo_box_9} material={mat_5} />
        <mesh position={[0.45, 0.7, 0.025]} geometry={geo_box_9} material={mat_5} />
      </group>

      {/* ── Wardrobe (left wall, near bed) ── */}
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

      {/* ── Desk ── */}
      <group position={[0, 0, -2.5]}>
        {/* Table top */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow geometry={geo_box_16} material={mat_11} />
        {/* Legs */}
        {[[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.375, z]} geometry={geo_box_17} material={mat_12} />
        ))}
        {/* ── Triple monitor rig: Grafana · terminal · Zabbix ── */}
        {([
          { id: 'grafana', tex: grafanaTexture, x: -0.62, rotY: 0.24 },
          { id: 'terminal', tex: terminalTexture, x: 0, rotY: 0 },
          { id: 'zabbix', tex: zabbixTexture, x: 0.62, rotY: -0.24 },
        ] as const).map(({ id, tex, x, rotY }) => (
          <group key={id} position={[x, 1.12, -0.18]} rotation={[0, rotY, 0]} ref={id === 'terminal' ? terminalMonitorGroupRef : undefined}>
            {/* Bezel */}
            <mesh geometry={geo_box_18} renderOrder={1} material={mat_13} />
            {/* Screen — emissive StandardMaterial with toneMapped:true for HDR
             *  consistency. ISSUE #5: replaced meshBasicMaterial + toneMapped:false which
             *  caused tone mapping artifacts and didn't respond to scene lighting. */}
            <mesh position={[0, 0, 0.028]} geometry={geo_pln_19} renderOrder={2}>
              <meshStandardMaterial map={tex} emissive={MONITOR_EMISSIVE_COLOR} emissiveMap={tex} emissiveIntensity={1.5} toneMapped depthWrite={false} />
            </mesh>
            {/* Zabbix blinking alert LED */}
            {id === 'zabbix' && (
              <mesh position={[0.205, 0.145, 0.03]} geometry={geo_cir_20} material={mat_zabbix_led} />
            )}
            {/* Stand */}
            <mesh position={[0, -0.27, -0.02]} geometry={geo_box_21} material={mat_14} />
            <mesh position={[0, -0.35, 0]} geometry={geo_box_22} material={mat_14} />
          </group>
        ))}

        {/* ISSUE #7: Reduced from 3 per-monitor lights to 1 combined desk glow.
         * 3 separate point lights for 3 monitors was expensive and the lights
         * were too close together to produce distinct shadows. One central glow
         * is visually equivalent at a fraction of the GPU cost. */}
        <pointLight position={[0, 1.25, 0.15]} color="#33ddaa" intensity={3.5} distance={12} />
        {/* Keyboard */}
        <mesh position={[0, 0.78, 0.1]} geometry={geo_box_23} material={mat_15} />
        {/* Keyboard LED indicators */}
        <mesh position={[0.15, 0.795, 0.02]} geometry={geo_box_24} material={mat_16} />
        <mesh position={[0.17, 0.795, 0.02]} geometry={geo_box_24} material={mat_17} />
        {/* Mouse pad */}
        <mesh position={[0.6, 0.775, 0.1]} rotation={[0, 0.1, 0]} geometry={geo_box_25} material={mat_18} />
        {/* Mouse */}
        <mesh position={[0.6, 0.79, 0.1]} rotation={[0, 0.1, 0]} geometry={geo_box_26} material={mat_19} />
        {/* Coffee mug on desk (fixed: was at Z=-2.2 → world -4.7, behind wall) */}
        <group position={[-0.55, 0.78, 0.25]}>
          <mesh position={[0, 0.04, 0]} geometry={geo_cyl_27} material={mat_20} />
          {/* Mug handle */}
          <mesh position={[0.04, 0.04, 0]} rotation={[0, 0, Math.PI / 2]} geometry={geo_tor_28} material={mat_20} />
          {/* Coffee surface */}
          <mesh position={[0, 0.075, 0]} geometry={geo_cyl_29} material={mat_21} />
        </group>
        {/* Scattered papers/documents on desk (fixed: were behind wall) */}
        <mesh position={[0.3, 0.78, 0.2]} rotation={[0, 0.4, 0]} geometry={geo_box_30} material={mat_22} />
        <mesh position={[0.35, 0.785, 0.15]} rotation={[0, -0.2, 0.02]} geometry={geo_box_31} material={mat_23} />
        <mesh position={[-0.2, 0.78, 0.3]} rotation={[0, 0.7, -0.01]} geometry={geo_box_32} material={mat_24} />
      </group>

      {/* ── Chair ── */}
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

      {/* ── Bookshelf ── */}
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
        ].map((b, i) => (
          <mesh key={`s1-${b.c}`} position={[b.x, 0.27, 0.02]} geometry={bookSpineGeo(b.w, 0.2)} material={bookSpineMaterial(b.c)} />
        ))}
        {/* Shelf 2 */}
        {[
          { x: -0.22, w: 0.05, c: '#a03020' }, { x: -0.12, w: 0.04, c: '#304090' },
          { x: -0.04, w: 0.06, c: '#307030' }, { x: 0.08, w: 0.03, c: '#907030' },
          { x: 0.15, w: 0.05, c: '#703090' },
        ].map((b, i) => (
          <mesh key={`s2-${b.c}`} position={[b.x, 0.77, 0.02]} geometry={bookSpineGeo(b.w, 0.18)} material={bookSpineMaterial(b.c)} />
        ))}
        {/* Shelf 3 */}
        {[
          { x: -0.20, w: 0.04, c: '#b04030' }, { x: -0.10, w: 0.06, c: '#2050a0' },
          { x: 0.02, w: 0.03, c: '#30a040' }, { x: 0.10, w: 0.05, c: '#a08030' },
          { x: 0.18, w: 0.04, c: '#8040a0' }, { x: 0.25, w: 0.03, c: '#30a0a0' },
        ].map((b, i) => (
          <mesh key={`s3-${b.c}`} position={[b.x, 1.27, 0.02]} geometry={bookSpineGeo(b.w, 0.2)} material={bookSpineMaterial(b.c)} />
        ))}
        {/* Shelf 4 (top) — a few books, leaning */}
        {[
          { x: -0.15, w: 0.05, c: '#c05040', lean: 0.05 },
          { x: -0.05, w: 0.04, c: '#3060b0', lean: -0.08 },
          { x: 0.06, w: 0.06, c: '#40b050', lean: 0.02 },
        ].map((b, i) => (
          <mesh key={`s4-${i}`} position={[b.x, 1.77, 0.02]} rotation={[0, 0, b.lean]} geometry={bookSpineGeo(b.w, 0.18)} material={bookSpineMaterial(b.c)} />
        ))}
      </group>

      {/* ── Wall Poster — concert/tech conference poster (between desk and window) ── */}
      <group position={[1.8, 1.6, -3.45]}>
        {/* Thin dark frame */}
        <mesh geometry={geo_posterFrame} material={mat_49} />
        {/* Poster surface — dark teal/emerald */}
        <mesh position={[0, 0, 0.013]} geometry={geo_posterBack} material={mat_posterTeal} />
        {/* Glowing logo rectangle (suggests a tech/concert poster) */}
        <mesh position={[0, 0.12, 0.018]} geometry={geo_posterLogo} material={mat_posterLogo} />
      </group>

      {/* ── Photo Frame on side wall (near bed, facing into room) ── */}
      <group position={[2.35, 1.5, 1.5]} rotation-y={-Math.PI / 2}>
        {/* Wooden frame (brown) */}
        <mesh geometry={geo_photoFrame} material={mat_1} />
        {/* Warm photo print */}
        <mesh position={[0, 0, 0.013]} geometry={geo_photoBack} material={mat_photoWarm} />
      </group>

      {/* ── Bed ── */}
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

      {/* ── Window (right wall, emissive blue — nighttime city glow) ── */}
      <group position={[W / 2 - 0.025, 1.5, -2.0]}>
        <mesh rotation-y={-Math.PI / 2} geometry={geo_pln_42} material={mat_33} />
        {/* Window frame */}
        <mesh rotation-y={-Math.PI / 2} position={[0.01, 0, 0]} geometry={geo_box_43} material={mat_26} />
        {/* Window blue light spill into room */}
        <pointLight position={[-0.8, 0, 0.5]} color="#4488ee" intensity={3.0} distance={5} />
        {/* City building silhouettes through window */}
        <mesh rotation-y={-Math.PI / 2} position={[-0.01, -0.15, -0.3]} geometry={geo_pln_75} material={mat_62} />
        <mesh rotation-y={-Math.PI / 2} position={[-0.01, -0.1, 0.2]} geometry={geo_pln_76} material={mat_62} />
        {/* Tiny window lights on buildings */}
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.2, -0.3]} geometry={geo_pln_77} material={mat_63} />
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.05, 0.2]} geometry={geo_pln_77} material={mat_63} />
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.12, 0.22]} geometry={geo_pln_78} material={mat_64} />
      </group>

      {/* ── Second Window (back wall, emissive blue — nighttime city) ── */}
      <group position={[-1.0, 1.5, -D / 2 + 0.025]}>
        <mesh geometry={geo_pln_44} material={mat_34} />
        {/* Window frame */}
        <mesh position={[0, 0, -0.01]} geometry={geo_box_45} material={mat_26} />
        {/* ISSUE #7: Removed per-window pointLight — the right wall window light +
            desk lamp + ambient pulse provide sufficient fill. The window material's
            emissive (mat_34, emissiveIntensity=3.5) already creates a visible glow. */}
      </group>

      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING (lazy chunk) ── */}
      <VolodkaRoomClutter />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANIMATED DESK ELEMENTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Small desk fan (rotating) ── */}
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

      {/* ── PC case with blinking LED ── */}
      <group position={[0.9, 0, -2.8]}>
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
      </group>

      {/* ── Desk lamp — warm accent light, boosted to balance the monitor glow ── */}
      <pointLight
        position={[0.3, 1.5, -2.3]}
        color="#ffcc88"
        intensity={3.5}
        distance={9}
        castShadow={false}
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-bias={-0.003}
        shadow-normalBias={0.04}
      />

      {/* ── Subtle warm fill near bed area — brightened so bed/bookshelf are visible ── */}
      <pointLight
        position={[-1.5, 1.8, 2.5]}
        color="#aa99bb"
        intensity={1.4}
        distance={5}
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

      {/* ── Posters on back wall ── */}
      <group position={[-1.0, 1.8, -D / 2 + 0.02]}>
        {/* Poster 1 — dark with neon accent */}
        <mesh geometry={geo_box_56} material={mat_43} />
        {/* Poster design — colored rectangles */}
        <mesh position={[0, 0.1, 0.004]} geometry={geo_box_57} material={mat_44} />
        <mesh position={[0, -0.1, 0.004]} geometry={geo_box_58} material={mat_45} />
      </group>

      <group position={[1.5, 1.6, -D / 2 + 0.02]}>
        {/* Poster 2 — punk band poster */}
        <mesh geometry={geo_box_59} material={mat_46} />
        <mesh position={[0, 0.08, 0.004]} geometry={geo_box_60} material={mat_47} />
        {/* Tape on corners */}
        <mesh position={[-0.2, 0.28, 0.005]} rotation={[0, 0, 0.3]} geometry={geo_box_61} material={mat_48} />
        <mesh position={[0.2, -0.28, 0.005]} rotation={[0, 0, -0.2]} geometry={geo_box_61} material={mat_48} />
      </group>

      {/* ── Headphones on desk ── */}
      <group position={[0.5, 0.78, -2.6]}>
        {/* Headband */}
        <mesh rotation={[0, 0, 0]} geometry={geo_tor_62} material={mat_49} />
        {/* Left ear cup */}
        <mesh position={[-0.06, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} geometry={geo_cyl_63} material={mat_50} />
        {/* Right ear cup */}
        <mesh position={[0.06, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} geometry={geo_cyl_63} material={mat_50} />
        {/* Cable */}
        <mesh position={[0, -0.04, 0.15]} rotation={[0.3, 0, 0]} geometry={geo_cyl_64} material={mat_51} />
      </group>

      {/* ── Laundry pile on floor near bed ── */}
      <group position={[1.5, 0, 3.5]}>
        {/* T-shirt shape */}
        <mesh position={[0, 0.05, 0]} rotation={[0.2, 0.5, 0.1]} geometry={geo_box_65} material={mat_52} />
        {/* Jeans */}
        <mesh position={[0.15, 0.03, 0.1]} rotation={[0, -0.3, 0.15]} geometry={geo_box_66} material={mat_53} />
        {/* Sock */}
        <mesh position={[-0.1, 0.02, 0.15]} rotation={[0.5, 0.8, 0.2]} geometry={geo_cyl_67} material={mat_54} />
      </group>

      {/* ── Nightstand beside bed ── */}
      <group position={[2.2, 0, 2.0]}>
        {/* Nightstand body */}
        <mesh position={[0, 0.25, 0]} castShadow geometry={geo_box_68} material={mat_6} />
        {/* Drawer */}
        <mesh position={[0, 0.3, 0.18]} geometry={geo_box_69} material={mat_55} />
        {/* Drawer handle */}
        <mesh position={[0, 0.3, 0.2]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_70} material={mat_56} />
        {/* Phone on nightstand */}
        <mesh position={[0, 0.52, 0.05]} rotation={[0, 0.2, 0]} geometry={geo_box_71} material={mat_57} />
        {/* Phone screen */}
        <mesh position={[0, 0.533, 0.05]} rotation={[0, 0.2, 0]} geometry={geo_box_72} material={mat_58} />
        {/* Charging cable */}
        <mesh position={[0.05, 0.51, -0.05]} rotation={[0.8, 0.2, 0]} geometry={geo_cyl_64} material={mat_59} />
        {/* Water glass on nightstand */}
        <mesh position={[-0.1, 0.56, -0.05]} geometry={geo_cyl_73} material={mat_60} />
      </group>

      {/* ── Slippers on floor near bed ── */}
      <mesh position={[1.3, 0.015, 3.0]} rotation={[0, 0.3, 0]} geometry={geo_box_74} material={mat_61} />
      <mesh position={[1.5, 0.015, 2.9]} rotation={[0, -0.15, 0.05]} geometry={geo_box_74} material={mat_61} />

      {/* ── Backpack on floor near door ── */}
      <group position={[-1.5, 0, 2.8]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow geometry={geo_box_79} material={mat_65} />
        {/* Straps */}
        <mesh position={[-0.08, 0.25, 0.08]} geometry={geo_box_80} material={mat_66} />
        <mesh position={[0.08, 0.25, 0.08]} geometry={geo_box_80} material={mat_66} />
        {/* Zipper */}
        <mesh position={[0, 0.35, 0.08]} geometry={geo_box_81} material={mat_67} />
      </group>

      {/* ── Poster on left wall ── */}
      <group position={[-W / 2 + 0.02, 1.6, -1.0]} rotation-y={Math.PI / 2}>
        <mesh geometry={geo_box_82} material={mat_68} />
        <mesh position={[0, 0.1, 0.004]} geometry={geo_box_83} material={mat_69} />
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERIOR MODELS (from InteriorModels.tsx) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Desk Lamp on nightstand ── */}
      <Lamp position={[2.0, 0.5, 2.2]} scale={[0.6, 0.6, 0.6]} />

      {/* ── Rug on floor near bed ── */}
      <Rug position={[1.8, 0.002, 2.0]} scale={[0.8, 1, 0.7]} color="#2a2840" />

      {/* ── Radiator on left wall near bed ── */}
      <Radiator position={[-W / 2 + 0.06, 0.3, 1.5]} rotation={[0, Math.PI / 2, 0]} color="#a0a0a0" />

      {/* ── Atmospheric dust particles ── */}
      <DustParticles />
    </group>
  );
}

/* ─── Canvas Texture Helpers ─── */

function createFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Brighter wood base
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(0, 0, size, size);

  // Wood plank lines
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Subtle grain
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * size;
    ctx.strokeStyle = Math.random() > 0.5 ? '#4a3a2a' : '#2a1a0a';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 4);
  return tex;
}

function createWallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Brighter wall base
  ctx.fillStyle = '#4a4050';
  ctx.fillRect(0, 0, size, size);

  // Subtle plaster variation
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 30 + 10;
    ctx.fillStyle = Math.random() > 0.5 ? '#5a5058' : '#3a3038';
    ctx.fillRect(x, y, r, r);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}
