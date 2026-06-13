
/* ─── Volodka RPG – Volodka's room procedural 3D visual ─── */

import { useMemo, useRef, useEffect, type MutableRefObject } from 'react';
import * as THREE from 'three';
import {
  registerModuleGeometries,
  registerModuleGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { Lamp, Rug, Radiator } from './lazyInteriorModels';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { VolodkaRoomClutter } from './sceneChunks/volodkaRoom';
import {
  createGrafanaTexture,
  createTerminalScreenTexture,
  createZabbixTexture,
} from './sceneVisuals/volodkaRoom/monitorTextures';
import { useVolodkaRoomAnimations } from './sceneVisuals/volodkaRoom/useVolodkaRoomAnimations';

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
const bookSpineGeoCache = new Map<string, THREE.BoxGeometry>();
function bookSpineGeo(w: number, h: number, d = 0.18): THREE.BoxGeometry {
  const key = `${w}_${h}_${d}`;
  let geo = bookSpineGeoCache.get(key);
  if (!geo) {
    geo = registerModuleGeometry(new THREE.BoxGeometry(w, h, d));
    bookSpineGeoCache.set(key, geo);
  }
  return geo;
}

registerModuleGeometries([geo_pln_1, geo_pln_2, geo_pln_3, geo_box_4, geo_box_5, geo_box_6, geo_box_7, geo_cyl_8, geo_box_9, geo_box_10, geo_box_11, geo_box_12, geo_box_13, geo_sph_14, geo_box_15, geo_box_16, geo_box_17, geo_box_18, geo_pln_19, geo_cir_20, geo_box_21, geo_box_22, geo_box_23, geo_box_24, geo_box_25, geo_box_26, geo_cyl_27, geo_tor_28, geo_cyl_29, geo_box_30, geo_box_31, geo_box_32, geo_box_33, geo_box_34, geo_box_35, geo_box_36, geo_box_37, geo_box_38, geo_box_39, geo_box_40, geo_box_41, geo_pln_42, geo_box_43, geo_pln_44, geo_box_45, geo_cyl_46, geo_tor_47, geo_box_48, geo_cyl_49, geo_box_50, geo_box_51, geo_sph_52, geo_sph_53, geo_box_54, geo_pln_55, geo_box_56, geo_box_57, geo_box_58, geo_box_59, geo_box_60, geo_box_61, geo_tor_62, geo_cyl_63, geo_cyl_64, geo_box_65, geo_box_66, geo_cyl_67, geo_box_68, geo_box_69, geo_cyl_70, geo_box_71, geo_box_72, geo_cyl_73, geo_box_74, geo_pln_75, geo_pln_76, geo_pln_77, geo_pln_78, geo_box_79, geo_box_80, geo_box_81, geo_box_82, geo_box_83]);

export function VolodkaRoomVisual({ livePlayerPositionRef: _livePlayerPositionRef }: VolodkaRoomVisualProps) {
  // Canvas textures created synchronously via useMemo
  const floorTexture = useCachedCanvasTexture('volodka_room:floor', createFloorTexture);
  const wallTexture = useCachedCanvasTexture('volodka_room:wall', createWallTexture);
  const { lod } = useEnvironmentLod();

  // ── Animated elements refs ──
  const fanGroupRef = useRef<THREE.Group>(null);
  const ledRef = useRef<THREE.MeshStandardMaterial>(null);
  const ledTimeRef = useRef(0);
  const terminalTexRef = useRef<THREE.CanvasTexture | null>(null);
  const zabbixAlertRef = useRef<THREE.MeshStandardMaterial>(null);

  // ── Interactive object animation refs ──
  const roomDoorRef = useRef<THREE.Group>(null);
  const roomWardrobeDoorRef = useRef<THREE.Group>(null);

  const W = 5; // width (x)
  const D = 7; // depth (z)
  const H = 3; // height (y)

  // ── Desk monitor screen textures (Grafana · terminal · Zabbix) ──
  const terminalTexture = useMemo(() => createTerminalScreenTexture(), []);
  const grafanaTexture = useMemo(() => createGrafanaTexture(), []);
  const zabbixTexture = useMemo(() => createZabbixTexture(), []);

  // Sync animated (terminal) texture ref outside of render
  useEffect(() => {
    terminalTexRef.current = terminalTexture;
  }, [terminalTexture]);

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

  useVolodkaRoomAnimations({
    fanGroupRef,
    ledRef,
    ledTimeRef,
    terminalTexRef,
    zabbixAlertRef,
    roomDoorRef,
    roomWardrobeDoorRef,
  });

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={geo_pln_1}>

        <meshStandardMaterial
          map={floorTexture}
          color="#5a4a3a"
          roughness={0.8}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={geo_pln_1}>

        <meshStandardMaterial color="#1a1820" roughness={0.95} emissive="#0a0810" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Back Wall (z = -D/2) ── */}
      <mesh position={[0, H / 2, -D / 2]} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#3a3548" roughness={0.9} emissive="#1a1828" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Front Wall (z = +D/2) ── */}
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#3a3548" roughness={0.9} emissive="#1a1828" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Left Wall (x = -W/2) ── */}
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2} geometry={geo_pln_3}>

        <meshStandardMaterial map={wallTexture} color="#3a3548" roughness={0.9} emissive="#1a1828" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Right Wall (x = +W/2) ── */}
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={geo_pln_3}>

        <meshStandardMaterial map={wallTexture} color="#3a3548" roughness={0.9} emissive="#1a1828" emissiveIntensity={0.15} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERACTIVE ANIMATED OBJECTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Room Door (front wall, swings open) ── */}
      {/* Door frame */}
      <mesh position={[0, 1.1, D / 2 - 0.01]} rotation-y={Math.PI} geometry={geo_box_4}>

        <meshStandardMaterial color="#3a2820" roughness={0.85} />
      </mesh>
      {/* Door frame border */}
      <mesh position={[-0.5, 1.1, D / 2 - 0.015]} rotation-y={Math.PI} geometry={geo_box_5}>

        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 1.1, D / 2 - 0.015]} rotation-y={Math.PI} geometry={geo_box_5}>

        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.2, D / 2 - 0.015]} rotation-y={Math.PI} geometry={geo_box_6}>

        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      {/* Animated door panel — pivot on left edge */}
      <group position={[-0.45, 0, D / 2 - 0.03]} ref={roomDoorRef}>
        <mesh position={[0.45, 1.1, 0]} geometry={geo_box_7}>

          <meshStandardMaterial color="#5a4030" roughness={0.75} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.78, 1.05, 0.03]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_8}>

          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Door panel detail — inset rectangle */}
        <mesh position={[0.45, 1.4, 0.025]} geometry={geo_box_9}>

          <meshStandardMaterial color="#4a3525" roughness={0.85} />
        </mesh>
        <mesh position={[0.45, 0.7, 0.025]} geometry={geo_box_9}>

          <meshStandardMaterial color="#4a3525" roughness={0.85} />
        </mesh>
      </group>

      {/* ── Wardrobe (left wall, near bed) ── */}
      <group position={[-2.2, 0, 2.5]}>
        {/* Wardrobe body */}
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_10}>

          <meshStandardMaterial color="#4a3828" roughness={0.8} />
        </mesh>
        {/* Wardrobe top */}
        <mesh position={[0, 2.01, 0]} geometry={geo_box_11}>

          <meshStandardMaterial color="#3a2818" roughness={0.8} />
        </mesh>
        {/* Wardrobe shelf */}
        <mesh position={[0, 1.0, 0.01]} geometry={geo_box_12}>

          <meshStandardMaterial color="#3a2818" roughness={0.85} />
        </mesh>
        {/* Animated wardrobe left door — pivot on left edge */}
        <group position={[-0.38, 0, 0.28]} ref={roomWardrobeDoorRef}>
          <mesh position={[0.19, 1.0, 0]} geometry={geo_box_13}>

            <meshStandardMaterial color="#5a4530" roughness={0.8} />
          </mesh>
          {/* Door handle */}
          <mesh position={[0.32, 1.0, 0.02]} geometry={geo_sph_14}>

            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Door panel detail */}
          <mesh position={[0.19, 1.3, 0.02]} geometry={geo_box_15}>

            <meshStandardMaterial color="#4a3820" roughness={0.85} />
          </mesh>
          <mesh position={[0.19, 0.65, 0.02]} geometry={geo_box_15}>

            <meshStandardMaterial color="#4a3820" roughness={0.85} />
          </mesh>
        </group>
        {/* Wardrobe right door (static) */}
        <mesh position={[0.19, 1.0, 0.295]} geometry={geo_box_13}>

          <meshStandardMaterial color="#5a4530" roughness={0.8} />
        </mesh>
        <mesh position={[0.06, 1.0, 0.315]} geometry={geo_sph_14}>

          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ── Desk ── */}
      <group position={[0, 0, -2.5]}>
        {/* Table top */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow geometry={geo_box_16}>

          <meshStandardMaterial color="#4a3a28" roughness={0.7} />
        </mesh>
        {/* Legs */}
        {[[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.375, z]} geometry={geo_box_17}>

            <meshStandardMaterial color="#3a2a18" />
          </mesh>
        ))}
        {/* ── Triple monitor rig: Grafana · terminal · Zabbix ── */}
        {([
          { id: 'grafana', tex: grafanaTexture, x: -0.62, rotY: 0.24 },
          { id: 'terminal', tex: terminalTexture, x: 0, rotY: 0 },
          { id: 'zabbix', tex: zabbixTexture, x: 0.62, rotY: -0.24 },
        ] as const).map(({ id, tex, x, rotY }) => (
          <group key={id} position={[x, 1.12, -0.18]} rotation={[0, rotY, 0]}>
            {/* Bezel */}
            <mesh geometry={geo_box_18} renderOrder={1}>

              <meshStandardMaterial color="#08080b" roughness={0.4} metalness={0.4} />
            </mesh>
            {/* Screen — nudged in front of bezel to avoid z-fighting / white seam */}
            <mesh position={[0, 0, 0.028]} geometry={geo_pln_19} renderOrder={2}>

              <meshBasicMaterial map={tex} toneMapped={false} depthWrite={false} />
            </mesh>
            {/* Zabbix blinking alert LED */}
            {id === 'zabbix' && (
              <mesh position={[0.205, 0.145, 0.03]} geometry={geo_cir_20}>

                <meshStandardMaterial
                  ref={zabbixAlertRef}
                  color="#e8413a"
                  emissive="#e8413a"
                  emissiveIntensity={2.5}
                  toneMapped={false}
                />
              </mesh>
            )}
            {/* Stand */}
            <mesh position={[0, -0.27, -0.02]} geometry={geo_box_21}>

              <meshStandardMaterial color="#15151a" />
            </mesh>
            <mesh position={[0, -0.35, 0]} geometry={geo_box_22}>

              <meshStandardMaterial color="#15151a" />
            </mesh>
          </group>
        ))}

        {/* Monitor glow — keeps the room lit (the screens are the primary source) */}
        <pointLight position={[0, 1.25, 0.15]} color="#00ff88" intensity={4.5} distance={9} />
        <pointLight position={[-0.62, 1.1, 0.1]} color="#22d3ee" intensity={1.5} distance={5} />
        <pointLight position={[0.62, 1.1, 0.1]} color="#f59e0b" intensity={1.2} distance={5} />
        {/* Keyboard */}
        <mesh position={[0, 0.78, 0.1]} geometry={geo_box_23}>

          <meshStandardMaterial color="#1a1a1a" emissive="#00ff44" emissiveIntensity={0.02} />
        </mesh>
        {/* Keyboard LED indicators */}
        <mesh position={[0.15, 0.795, 0.02]} geometry={geo_box_24}>

          <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={3.0} />
        </mesh>
        <mesh position={[0.17, 0.795, 0.02]} geometry={geo_box_24}>

          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2.0} />
        </mesh>
        {/* Mouse pad */}
        <mesh position={[0.6, 0.775, 0.1]} rotation={[0, 0.1, 0]} geometry={geo_box_25}>

          <meshStandardMaterial color="#1a1a2a" roughness={0.95} />
        </mesh>
        {/* Mouse */}
        <mesh position={[0.6, 0.79, 0.1]} rotation={[0, 0.1, 0]} geometry={geo_box_26}>

          <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
        </mesh>
        {/* Coffee mug on desk */}
        <group position={[-0.55, 0.78, -2.2]}>
          <mesh position={[0, 0.04, 0]} geometry={geo_cyl_27}>

            <meshStandardMaterial color="#6b3a1a" roughness={0.7} />
          </mesh>
          {/* Mug handle */}
          <mesh position={[0.04, 0.04, 0]} rotation={[0, 0, Math.PI / 2]} geometry={geo_tor_28}>

            <meshStandardMaterial color="#6b3a1a" roughness={0.7} />
          </mesh>
          {/* Coffee surface */}
          <mesh position={[0, 0.075, 0]} geometry={geo_cyl_29}>

            <meshStandardMaterial color="#2a1508" roughness={0.3} />
          </mesh>
        </group>
        {/* Scattered papers/documents on desk */}
        <mesh position={[0.3, 0.78, -2.15]} rotation={[0, 0.4, 0]} geometry={geo_box_30}>

          <meshStandardMaterial color="#e8dcc8" roughness={0.95} />
        </mesh>
        <mesh position={[0.35, 0.785, -2.35]} rotation={[0, -0.2, 0.02]} geometry={geo_box_31}>

          <meshStandardMaterial color="#f0e8d8" roughness={0.95} />
        </mesh>
        <mesh position={[-0.2, 0.78, -2.1]} rotation={[0, 0.7, -0.01]} geometry={geo_box_32}>

          <meshStandardMaterial color="#ddd4c0" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Chair ── */}
      <group position={[0, 0, -1.5]}>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]} castShadow geometry={geo_box_33}>

          <meshStandardMaterial color="#2a2a30" roughness={0.8} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.75, -0.22]} castShadow geometry={geo_box_34}>

          <meshStandardMaterial color="#2a2a30" roughness={0.8} />
        </mesh>
        {/* Legs */}
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.225, z]} geometry={geo_box_35}>

            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
      </group>

      {/* ── Bookshelf ── */}
      <group position={[-2.2, 0, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_36}>

          <meshStandardMaterial color="#5a4030" roughness={0.8} />
        </mesh>
        {/* Shelf dividers */}
        {[0.5, 1.0, 1.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0.02]} geometry={geo_box_37}>

            <meshStandardMaterial color="#4a3525" />
          </mesh>
        ))}
        {/* Books on shelves — multiple thin colored spines per shelf */}
        {/* Shelf 1 (bottom) */}
        {[
          { x: -0.25, w: 0.04, c: '#8b2020' }, { x: -0.18, w: 0.05, c: '#204080' },
          { x: -0.10, w: 0.03, c: '#208020' }, { x: -0.04, w: 0.06, c: '#806020' },
          { x: 0.06, w: 0.04, c: '#602080' }, { x: 0.14, w: 0.05, c: '#804020' },
          { x: 0.22, w: 0.03, c: '#208080' },
        ].map((b, i) => (
          <mesh key={`s1-${i}`} position={[b.x, 0.27, 0.02]} geometry={bookSpineGeo(b.w, 0.2)}>
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        ))}
        {/* Shelf 2 */}
        {[
          { x: -0.22, w: 0.05, c: '#a03020' }, { x: -0.12, w: 0.04, c: '#304090' },
          { x: -0.04, w: 0.06, c: '#307030' }, { x: 0.08, w: 0.03, c: '#907030' },
          { x: 0.15, w: 0.05, c: '#703090' },
        ].map((b, i) => (
          <mesh key={`s2-${i}`} position={[b.x, 0.77, 0.02]} geometry={bookSpineGeo(b.w, 0.18)}>
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        ))}
        {/* Shelf 3 */}
        {[
          { x: -0.20, w: 0.04, c: '#b04030' }, { x: -0.10, w: 0.06, c: '#2050a0' },
          { x: 0.02, w: 0.03, c: '#30a040' }, { x: 0.10, w: 0.05, c: '#a08030' },
          { x: 0.18, w: 0.04, c: '#8040a0' }, { x: 0.25, w: 0.03, c: '#30a0a0' },
        ].map((b, i) => (
          <mesh key={`s3-${i}`} position={[b.x, 1.27, 0.02]} geometry={bookSpineGeo(b.w, 0.2)}>
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        ))}
        {/* Shelf 4 (top) — a few books, leaning */}
        {[
          { x: -0.15, w: 0.05, c: '#c05040', lean: 0.05 },
          { x: -0.05, w: 0.04, c: '#3060b0', lean: -0.08 },
          { x: 0.06, w: 0.06, c: '#40b050', lean: 0.02 },
        ].map((b, i) => (
          <mesh key={`s4-${i}`} position={[b.x, 1.77, 0.02]} rotation={[0, 0, b.lean]} geometry={bookSpineGeo(b.w, 0.18)}>
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* ── Bed ── */}
      <group position={[1.8, 0, 2.0]}>
        {/* Mattress */}
        <mesh position={[0, 0.35, 0]} castShadow geometry={geo_box_38}>

          <meshStandardMaterial color="#2a3040" roughness={0.9} />
        </mesh>
        {/* Headboard */}
        <mesh position={[0, 0.6, -0.95]} castShadow geometry={geo_box_39}>

          <meshStandardMaterial color="#3a2a20" roughness={0.8} />
        </mesh>
        {/* Pillow */}
        <mesh position={[0, 0.55, -0.7]} geometry={geo_box_40}>

          <meshStandardMaterial color="#aaaacc" roughness={0.95} />
        </mesh>
        {/* Blanket */}
        <mesh position={[0, 0.52, 0.2]} geometry={geo_box_41}>

          <meshStandardMaterial color="#303050" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Window (right wall, emissive blue — nighttime city glow) ── */}
      <group position={[W / 2 - 0.01, 1.5, -2.0]}>
        <mesh rotation-y={-Math.PI / 2} geometry={geo_pln_42}>

          <meshStandardMaterial
            color="#0a0a30"
            emissive="#4488ee"
            emissiveIntensity={4.0}
            toneMapped={false}
          />
        </mesh>
        {/* Window frame */}
        <mesh rotation-y={-Math.PI / 2} position={[0.01, 0, 0]} geometry={geo_box_43}>

          <meshStandardMaterial color="#333" />
        </mesh>
        {/* Window blue light spill into room */}
        <pointLight position={[-0.8, 0, 0.5]} color="#4488ee" intensity={3.0} distance={5} />
      </group>

      {/* ── Second Window (back wall, emissive blue — nighttime city) ── */}
      <group position={[-1.0, 1.5, -D / 2 + 0.01]}>
        <mesh geometry={geo_pln_44}>

          <meshStandardMaterial
            color="#0a0a30"
            emissive="#3366cc"
            emissiveIntensity={3.5}
            toneMapped={false}
          />
        </mesh>
        {/* Window frame */}
        <mesh position={[0, 0, -0.01]} geometry={geo_box_45}>

          <meshStandardMaterial color="#333" />
        </mesh>
        {/* Window blue light spill */}
        <pointLight position={[0, 0, 0.8]} color="#3366cc" intensity={2.0} distance={5} />
      </group>

      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING (lazy chunk) ── */}
      <VolodkaRoomClutter lod={lod} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANIMATED DESK ELEMENTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Small desk fan (rotating) ── */}
      <group position={[-0.7, 0.78, -2.3]}>
        {/* Fan base */}
        <mesh position={[0, 0.04, 0]} geometry={geo_cyl_46}>

          <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Fan cage (static outer ring) */}
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={geo_tor_47}>

          <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Rotating fan blades */}
        <group ref={fanGroupRef} position={[0, 0.12, 0.02]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} geometry={geo_box_48}>

              <meshStandardMaterial color="#666666" metalness={0.3} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* Fan hub */}
          <mesh geometry={geo_cyl_49}>

            <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ── PC case with blinking LED ── */}
      <group position={[0.9, 0, -2.8]}>
        {/* Case body */}
        <mesh position={[0, 0.25, 0]} castShadow geometry={geo_box_50}>

          <meshStandardMaterial color="#1a1a1e" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* Front panel line */}
        <mesh position={[-0.1, 0.25, 0]} geometry={geo_box_51}>

          <meshStandardMaterial color="#2a2a2e" />
        </mesh>
        {/* Blinking power LED */}
        <mesh position={[-0.101, 0.42, 0.12]} geometry={geo_sph_52}>

          <meshStandardMaterial
            ref={ledRef}
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={3.0}
          />
        </mesh>
        {/* HDD activity LED */}
        <mesh position={[-0.101, 0.42, 0.08]} geometry={geo_sph_53}>

          <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={1.5} />
        </mesh>
        {/* Ventilation grill lines */}
        {[0.05, 0.1, 0.15, 0.2].map((y, i) => (
          <mesh key={`vent-${i}`} position={[-0.101, y, -0.05]} geometry={geo_box_54}>

            <meshStandardMaterial color="#2a2a2e" />
          </mesh>
        ))}
      </group>

      {/* ── Desk lamp — warm accent light (NOT primary — monitor is primary) ── */}
      <pointLight
        position={[0.3, 1.5, -2.3]}
        color="#ffcc88"
        intensity={2.5}
        distance={8}
        castShadow={false}
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-bias={-0.003}
        shadow-normalBias={0.04}
      />

      {/* ── Subtle warm fill near bed area ── */}
      <pointLight
        position={[-1.5, 1.8, 2.5]}
        color="#8877aa"
        intensity={0.8}
        distance={4}
      />

      {/* ── Ceiling ambient glow panel (dim — noir apartment) ── */}
      <mesh position={[0, H - 0.02, -1]} rotation-x={Math.PI / 2} geometry={geo_pln_55}>

        <meshStandardMaterial color="#151515" emissive="#ffcc88" emissiveIntensity={0.2} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL ROOM DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Posters on back wall ── */}
      <group position={[-1.0, 1.8, -D / 2 + 0.02]}>
        {/* Poster 1 — dark with neon accent */}
        <mesh geometry={geo_box_56}>

          <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
        </mesh>
        {/* Poster design — colored rectangles */}
        <mesh position={[0, 0.1, 0.004]} geometry={geo_box_57}>

          <meshStandardMaterial color="#001133" emissive="#0088ff" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0, -0.1, 0.004]} geometry={geo_box_58}>

          <meshStandardMaterial color="#110033" emissive="#aa44ff" emissiveIntensity={0.6} />
        </mesh>
      </group>

      <group position={[1.5, 1.6, -D / 2 + 0.02]}>
        {/* Poster 2 — punk band poster */}
        <mesh geometry={geo_box_59}>

          <meshStandardMaterial color="#2a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.08, 0.004]} geometry={geo_box_60}>

          <meshStandardMaterial color="#1a0000" emissive="#ff2244" emissiveIntensity={0.8} />
        </mesh>
        {/* Tape on corners */}
        <mesh position={[-0.2, 0.28, 0.005]} rotation={[0, 0, 0.3]} geometry={geo_box_61}>

          <meshStandardMaterial color="#c8c0a0" roughness={0.9} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.2, -0.28, 0.005]} rotation={[0, 0, -0.2]} geometry={geo_box_61}>

          <meshStandardMaterial color="#c8c0a0" roughness={0.9} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* ── Headphones on desk ── */}
      <group position={[0.5, 0.78, -2.6]}>
        {/* Headband */}
        <mesh rotation={[0, 0, 0]} geometry={geo_tor_62}>

          <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
        </mesh>
        {/* Left ear cup */}
        <mesh position={[-0.06, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} geometry={geo_cyl_63}>

          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
        {/* Right ear cup */}
        <mesh position={[0.06, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} geometry={geo_cyl_63}>

          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
        {/* Cable */}
        <mesh position={[0, -0.04, 0.15]} rotation={[0.3, 0, 0]} geometry={geo_cyl_64}>

          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Laundry pile on floor near bed ── */}
      <group position={[1.5, 0, 3.5]}>
        {/* T-shirt shape */}
        <mesh position={[0, 0.05, 0]} rotation={[0.2, 0.5, 0.1]} geometry={geo_box_65}>

          <meshStandardMaterial color="#3a4a5a" roughness={0.95} />
        </mesh>
        {/* Jeans */}
        <mesh position={[0.15, 0.03, 0.1]} rotation={[0, -0.3, 0.15]} geometry={geo_box_66}>

          <meshStandardMaterial color="#1a2a4a" roughness={0.9} />
        </mesh>
        {/* Sock */}
        <mesh position={[-0.1, 0.02, 0.15]} rotation={[0.5, 0.8, 0.2]} geometry={geo_cyl_67}>

          <meshStandardMaterial color="#4a4a4a" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Nightstand beside bed ── */}
      <group position={[2.2, 0, 2.0]}>
        {/* Nightstand body */}
        <mesh position={[0, 0.25, 0]} castShadow geometry={geo_box_68}>

          <meshStandardMaterial color="#4a3828" roughness={0.8} />
        </mesh>
        {/* Drawer */}
        <mesh position={[0, 0.3, 0.18]} geometry={geo_box_69}>

          <meshStandardMaterial color="#5a4535" roughness={0.8} />
        </mesh>
        {/* Drawer handle */}
        <mesh position={[0, 0.3, 0.2]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_70}>

          <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Phone on nightstand */}
        <mesh position={[0, 0.52, 0.05]} rotation={[0, 0.2, 0]} geometry={geo_box_71}>

          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* Phone screen */}
        <mesh position={[0, 0.525, 0.05]} rotation={[0, 0.2, 0]} geometry={geo_box_72}>

          <meshStandardMaterial color="#001122" emissive="#3355aa" emissiveIntensity={0.5} />
        </mesh>
        {/* Charging cable */}
        <mesh position={[0.05, 0.51, -0.05]} rotation={[0.8, 0.2, 0]} geometry={geo_cyl_64}>

          <meshStandardMaterial color="#333" roughness={0.9} />
        </mesh>
        {/* Water glass on nightstand */}
        <mesh position={[-0.1, 0.56, -0.05]} geometry={geo_cyl_73}>

          <meshStandardMaterial color="#c0d0e0" transparent opacity={0.4} roughness={0.2} />
        </mesh>
      </group>

      {/* ── Slippers on floor near bed ── */}
      <mesh position={[1.3, 0.015, 3.0]} rotation={[0, 0.3, 0]} geometry={geo_box_74}>

        <meshStandardMaterial color="#5a4050" roughness={0.95} />
      </mesh>
      <mesh position={[1.5, 0.015, 2.9]} rotation={[0, -0.15, 0.05]} geometry={geo_box_74}>

        <meshStandardMaterial color="#5a4050" roughness={0.95} />
      </mesh>

      {/* ── Window with city view detail (right wall) ── */}
      <group position={[W / 2 - 0.01, 1.5, -2.0]}>
        {/* City building silhouettes through window */}
        <mesh rotation-y={-Math.PI / 2} position={[-0.01, -0.15, -0.3]} geometry={geo_pln_75}>

          <meshStandardMaterial color="#0a0a20" emissive="#1a1a30" emissiveIntensity={1.5} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[-0.01, -0.1, 0.2]} geometry={geo_pln_76}>

          <meshStandardMaterial color="#0a0a20" emissive="#1a1a30" emissiveIntensity={1.5} />
        </mesh>
        {/* Tiny window lights on buildings */}
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.2, -0.3]} geometry={geo_pln_77}>

          <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={3.0} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.05, 0.2]} geometry={geo_pln_77}>

          <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={3.0} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[-0.015, -0.12, 0.22]} geometry={geo_pln_78}>

          <meshStandardMaterial color="#aaccff" emissive="#aaccff" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ── Backpack on floor near door ── */}
      <group position={[-1.5, 0, 2.8]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow geometry={geo_box_79}>

          <meshStandardMaterial color="#2a3a2a" roughness={0.9} />
        </mesh>
        {/* Straps */}
        <mesh position={[-0.08, 0.25, 0.08]} geometry={geo_box_80}>

          <meshStandardMaterial color="#1a2a1a" roughness={0.9} />
        </mesh>
        <mesh position={[0.08, 0.25, 0.08]} geometry={geo_box_80}>

          <meshStandardMaterial color="#1a2a1a" roughness={0.9} />
        </mesh>
        {/* Zipper */}
        <mesh position={[0, 0.35, 0.08]} geometry={geo_box_81}>

          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Poster on left wall ── */}
      <group position={[-W / 2 + 0.02, 1.6, -1.0]} rotation-y={Math.PI / 2}>
        <mesh geometry={geo_box_82}>

          <meshStandardMaterial color="#1a2a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0.004]} geometry={geo_box_83}>

          <meshStandardMaterial color="#002200" emissive="#00ff44" emissiveIntensity={0.8} />
        </mesh>
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
