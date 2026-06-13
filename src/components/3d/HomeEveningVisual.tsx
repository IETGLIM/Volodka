
/* ─── Volodka RPG – Home Evening room procedural 3D visual ─── */

import { useRef, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { Radiator, Plant, Picture } from './lazyInteriorModels';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { HomeEveningProps } from './sceneChunks/homeEvening';

/** Home evening room (14×14m) – kitchen, living area, bedroom area */
/* ─── Shared geometries (module-level, reused across renders) ─── */

const geo_pln_1 = new THREE.PlaneGeometry(14, 14);
const geo_pln_2 = new THREE.PlaneGeometry(14, 3);
const geo_box_3 = new THREE.BoxGeometry(4, 0.9, 0.7);
const geo_box_4 = new THREE.BoxGeometry(4.05, 0.03, 0.75);
const geo_box_5 = new THREE.BoxGeometry(0.68, 1.78, 0.5);
const geo_box_6 = new THREE.BoxGeometry(0.72, 0.03, 0.72);
const geo_box_7 = new THREE.BoxGeometry(0.66, 1.78, 0.04);
const geo_box_8 = new THREE.BoxGeometry(0.02, 0.3, 0.04);
const geo_box_9 = new THREE.BoxGeometry(0.64, 0.02, 0.005);
const geo_pln_10 = new THREE.PlaneGeometry(0.15, 0.2);
const geo_pln_11 = new THREE.PlaneGeometry(0.12, 0.15);
const geo_box_12 = new THREE.BoxGeometry(0.6, 0.1, 0.5);
const geo_cyl_13 = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
const geo_box_14 = new THREE.BoxGeometry(2.2, 0.35, 0.9);
const geo_box_15 = new THREE.BoxGeometry(2.2, 0.5, 0.15);
const geo_box_16 = new THREE.BoxGeometry(0.15, 0.3, 0.9);
const geo_box_17 = new THREE.BoxGeometry(1, 0.04, 0.6);
const geo_box_18 = new THREE.BoxGeometry(0.04, 0.35, 0.04);
const geo_box_19 = new THREE.BoxGeometry(1.4, 0.8, 0.06);
const geo_box_20 = new THREE.BoxGeometry(0.8, 0.6, 0.35);
const geo_box_21 = new THREE.BoxGeometry(1.4, 0.3, 2);
const geo_box_22 = new THREE.BoxGeometry(1.4, 0.5, 0.08);
const geo_box_23 = new THREE.BoxGeometry(0.6, 0.12, 0.3);
const geo_box_24 = new THREE.BoxGeometry(1.3, 0.06, 1.2);
const geo_box_25 = new THREE.BoxGeometry(0.98, 1.98, 0.55);
const geo_box_26 = new THREE.BoxGeometry(1.04, 0.03, 0.63);
const geo_box_27 = new THREE.BoxGeometry(0.94, 0.03, 0.5);
const geo_box_28 = new THREE.BoxGeometry(0.47, 1.94, 0.03);
const geo_cyl_29 = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6);
const geo_box_30 = new THREE.BoxGeometry(0.3, 0.5, 0.005);
const geo_pln_31 = new THREE.PlaneGeometry(2, 1.5);
const geo_box_32 = new THREE.BoxGeometry(0.05, 1.55, 2.05);
const geo_box_33 = new THREE.BoxGeometry(0.04, 1.5, 0.03);
const geo_box_34 = new THREE.BoxGeometry(0.03, 0.03, 2);
const geo_box_35 = new THREE.BoxGeometry(0.7, 0.9, 0.65);
const geo_box_36 = new THREE.BoxGeometry(0.72, 0.02, 0.67);
const geo_tor_37 = new THREE.TorusGeometry(0.06, 0.008, 6, 16);
const geo_box_38 = new THREE.BoxGeometry(0.6, 0.45, 0.02);
const geo_cyl_39 = new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6);
const geo_cyl_40 = new THREE.CylinderGeometry(0.06, 0.05, 0.14, 8);
const geo_sph_41 = new THREE.SphereGeometry(0.055, 6, 4, 0, 6.283185307179586, 0, 1.5707963267948966);
const geo_cyl_42 = new THREE.CylinderGeometry(0.012, 0.015, 0.08, 6);
const geo_tor_43 = new THREE.TorusGeometry(0.04, 0.006, 4, 8, 3.141592653589793);
const geo_box_44 = new THREE.BoxGeometry(1.2, 0.7, 0.35);
const geo_cyl_45 = new THREE.CylinderGeometry(0.006, 0.006, 0.15, 4);
const geo_box_46 = new THREE.BoxGeometry(0.6, 0.04, 0.15);
const geo_cyl_47 = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6);
const geo_pln_48 = new THREE.PlaneGeometry(1.5, 0.8);
const geo_box_49 = new THREE.BoxGeometry(1, 2, 0.3);
const geo_box_50 = new THREE.BoxGeometry(0.98, 0.03, 0.28);
const geo_cyl_51 = new THREE.CylinderGeometry(0.06, 0.08, 0.04, 8);
const geo_cyl_52 = new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6);
const geo_cyl_53 = new THREE.CylinderGeometry(0.04, 0.1, 0.12, 8);
const geo_sph_54 = new THREE.SphereGeometry(0.03, 6, 6);
const geo_box_55 = new THREE.BoxGeometry(0.05, 0.012, 0.15);
const geo_cyl_56 = new THREE.CylinderGeometry(0.03, 0.025, 0.06, 8);
const geo_cyl_57 = new THREE.CylinderGeometry(0.045, 0.045, 0.005, 12);
const geo_pln_58 = new THREE.PlaneGeometry(0.4, 1.6);
const geo_cyl_59 = new THREE.CylinderGeometry(0.01, 0.01, 2.3, 6);
const geo_pln_60 = new THREE.PlaneGeometry(3, 2.5);
const geo_pln_61 = new THREE.PlaneGeometry(2.8, 2.3);
const geo_cyl_62 = new THREE.CylinderGeometry(0.025, 0.03, 1.8, 6);
const geo_cyl_63 = new THREE.CylinderGeometry(0.2, 0.22, 0.06, 8);
const geo_cyl_64 = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 4);
const geo_box_65 = new THREE.BoxGeometry(0.4, 0.55, 0.05);
const geo_box_66 = new THREE.BoxGeometry(0.5, 0.8, 0.03);
const geo_pln_67 = new THREE.PlaneGeometry(0.42, 0.7);
const geo_box_68 = new THREE.BoxGeometry(0.08, 0.04, 0.2);
const geo_pln_69 = new THREE.PlaneGeometry(1.2, 0.6);
const geo_box_70 = new THREE.BoxGeometry(0.12, 0.18, 0.03);
const geo_box_71 = new THREE.BoxGeometry(0.08, 0.06, 0.002);
const geo_cyl_72 = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 8);
const geo_box_book_h0 = new THREE.BoxGeometry(0.08, 0.18, 0.15);
const geo_box_book_h1 = new THREE.BoxGeometry(0.08, 0.21, 0.15);
const geo_box_book_h2 = new THREE.BoxGeometry(0.08, 0.24, 0.15);
const BOOK_GEOS = [geo_box_book_h0, geo_box_book_h1, geo_box_book_h2] as const;
const geo_box_photo_0 = new THREE.BoxGeometry(0.25, 0.2, 0.02);
const geo_box_photo_1 = new THREE.BoxGeometry(0.30, 0.23, 0.02);
const geo_box_photo_2 = new THREE.BoxGeometry(0.35, 0.26, 0.02);
const PHOTO_FRAME_GEOS = [geo_box_photo_0, geo_box_photo_1, geo_box_photo_2] as const;
const geo_pln_photo_0 = new THREE.PlaneGeometry(0.2, 0.15);
const geo_pln_photo_1 = new THREE.PlaneGeometry(0.24, 0.17);
const geo_pln_photo_2 = new THREE.PlaneGeometry(0.28, 0.19);
const PHOTO_PLANE_GEOS = [geo_pln_photo_0, geo_pln_photo_1, geo_pln_photo_2] as const;

export function HomeEveningVisual() {
  const floorTexture = useCachedCanvasTexture('home_evening:floor', createHomeFloorTexture);
  const wallTexture = useCachedCanvasTexture('home_evening:wall', createHomeWallTexture);
  const { lod } = useEnvironmentLod();

  const W = 14;
  const D = 14;
  const H = 3;

  // ── Interactive object animation refs ──
  const wardrobeLeftDoorRef = useRef<THREE.Group>(null);
  const wardrobeRightDoorRef = useRef<THREE.Group>(null);
  const fridgeDoorRef = useRef<THREE.Group>(null);

  // ── Listen for object:interact events to toggle interactive objects ──
  useEffect(() => {
    const unsub = eventBus.on('object:interact', (payload) => {
      if (payload.objectId === 'kitchen_wardrobe' || payload.objectId === 'kitchen_fridge') {
        useGameStore.getState().toggleInteractiveObject(payload.objectId);
      }
    });
    return unsub;
  }, []);

  // ── Sync interactive object states via ref (avoids getState in useFrame) ──
  const interactiveStatesRef = useRef(useGameStore.getState().interactiveObjectStates);
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      interactiveStatesRef.current = state.interactiveObjectStates;
    });
    return unsub;
  }, []);

  // ── Interactive object animations ──
  useFrameTick('misc', ({ delta }) => {
    const states = interactiveStatesRef.current;

    // Wardrobe doors: swing open
    if (wardrobeLeftDoorRef.current) {
      const open = states['kitchen_wardrobe'] ?? false;
      const targetY = open ? Math.PI / 3 : 0;
      wardrobeLeftDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        wardrobeLeftDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }
    if (wardrobeRightDoorRef.current) {
      const open = states['kitchen_wardrobe'] ?? false;
      const targetY = open ? -Math.PI / 3 : 0;
      wardrobeRightDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        wardrobeRightDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    // Fridge door: swings open
    if (fridgeDoorRef.current) {
      const open = states['kitchen_fridge'] ?? false;
      const targetY = open ? -Math.PI / 2.5 : 0;
      fridgeDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        fridgeDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }
  });

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={geo_pln_1}>

        <meshStandardMaterial map={floorTexture} color="#6a5840" roughness={0.85} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={geo_pln_1}>

        <meshStandardMaterial color="#3a3535" roughness={0.95} />
      </mesh>

      {/* ── Walls ── */}
      <mesh position={[0, H / 2, -D / 2]} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#4a3a30" roughness={0.9} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#4a3a30" roughness={0.9} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#4a3a30" roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#4a3a30" roughness={0.9} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── KITCHEN AREA (front-right) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Kitchen Counter (long, along back wall) */}
      <group position={[4.0, 0, -5.5]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow geometry={geo_box_3}>

          <meshStandardMaterial color="#606060" roughness={0.4} />
        </mesh>
        {/* Counter top */}
        <mesh position={[0, 0.91, 0]} geometry={geo_box_4}>

          <meshStandardMaterial color="#888" metalness={0.3} roughness={0.2} />
        </mesh>
      </group>

      {/* Fridge — with animated door */}
      <group position={[6.5, 0, -5.0]}>
        {/* Fridge body (back part) */}
        <mesh position={[0, 0.9, -0.1]} castShadow geometry={geo_box_5}>

          <meshStandardMaterial color="#c8c8c8" metalness={0.4} roughness={0.3} />
        </mesh>
        {/* Fridge top */}
        <mesh position={[0, 1.81, 0]} geometry={geo_box_6}>

          <meshStandardMaterial color="#bbb" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Animated fridge door — pivot on left edge */}
        <group position={[-0.34, 0, 0.2]} ref={fridgeDoorRef}>
          <mesh position={[0.34, 0.9, 0]} geometry={geo_box_7}>

            <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.3} />
          </mesh>
          {/* Handle */}
          <mesh position={[0.6, 0.9, 0.03]} geometry={geo_box_8}>

            <meshStandardMaterial color="#888" metalness={0.8} />
          </mesh>
          {/* Fridge door line (freezer separator) */}
          <mesh position={[0.34, 1.3, 0.025]} geometry={geo_box_9}>

            <meshStandardMaterial color="#aaa" metalness={0.3} />
          </mesh>
        </group>
        {/* Family photos on fridge (static, on body) */}
        <mesh position={[0, 1.2, -0.36]} geometry={geo_pln_10}>

          <meshStandardMaterial color="#c8b8a0" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.5, -0.36]} geometry={geo_pln_11}>

          <meshStandardMaterial color="#b8a890" roughness={0.5} />
        </mesh>
      </group>

      {/* Sink */}
      <group position={[4.0, 0.9, -5.5]}>
        <mesh position={[0, 0.05, 0]} geometry={geo_box_12}>

          <meshStandardMaterial color="#707070" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Faucet */}
        <mesh position={[0, 0.25, -0.2]} geometry={geo_cyl_13}>

          <meshStandardMaterial color="#bbb" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIVING AREA (center) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Sofa */}
      <group position={[-2.0, 0, -1.0]}>
        {/* Seat */}
        <mesh position={[0, 0.35, 0]} castShadow geometry={geo_box_14}>

          <meshStandardMaterial color="#4a3020" roughness={0.9} />
        </mesh>
        {/* Back */}
        <mesh position={[0, 0.6, -0.4]} castShadow geometry={geo_box_15}>

          <meshStandardMaterial color="#4a3020" roughness={0.9} />
        </mesh>
        {/* Armrests */}
        <mesh position={[-1.05, 0.5, 0]} castShadow geometry={geo_box_16}>

          <meshStandardMaterial color="#3a2518" roughness={0.9} />
        </mesh>
        <mesh position={[1.05, 0.5, 0]} castShadow geometry={geo_box_16}>

          <meshStandardMaterial color="#3a2518" roughness={0.9} />
        </mesh>
      </group>

      {/* Coffee Table */}
      <group position={[-2.0, 0, 0.5]}>
        <mesh position={[0, 0.35, 0]} castShadow geometry={geo_box_17}>

          <meshStandardMaterial color="#5a4030" roughness={0.6} />
        </mesh>
        {[[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.175, z]} geometry={geo_box_18}>

            <meshStandardMaterial color="#3a2818" />
          </mesh>
        ))}
      </group>

      {/* TV on Stand */}
      <group position={[-2.0, 0, -3.5]}>
        {/* TV */}
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_19}>

          <meshStandardMaterial color="#0a0a0a" emissive="#111133" emissiveIntensity={0.5} />
        </mesh>
        {/* Stand */}
        <mesh position={[0, 0.3, 0]} geometry={geo_box_20}>

          <meshStandardMaterial color="#2a2020" roughness={0.8} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── BEDROOM AREA (front-left) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Bed */}
      <group position={[-5.0, 0, 3.0]}>
        <mesh position={[0, 0.35, 0]} castShadow geometry={geo_box_21}>

          <meshStandardMaterial color="#352a40" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.6, -0.9]} castShadow geometry={geo_box_22}>

          <meshStandardMaterial color="#4a3525" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.55, -0.6]} geometry={geo_box_23}>

          <meshStandardMaterial color="#bbb8cc" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.52, 0.2]} geometry={geo_box_24}>

          <meshStandardMaterial color="#3a3550" roughness={0.95} />
        </mesh>
      </group>

      {/* Wardrobe — with animated doors */}
      <group position={[-6.5, 0, 0]}>
        {/* Wardrobe body (interior) */}
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_25}>

          <meshStandardMaterial color="#3a2818" roughness={0.85} />
        </mesh>
        {/* Wardrobe top */}
        <mesh position={[0, 2.01, 0]} geometry={geo_box_26}>

          <meshStandardMaterial color="#3a2818" roughness={0.8} />
        </mesh>
        {/* Shelf inside */}
        <mesh position={[0, 1.0, 0.01]} geometry={geo_box_27}>

          <meshStandardMaterial color="#3a2818" roughness={0.85} />
        </mesh>
        {/* Animated left wardrobe door — pivot on left edge */}
        <group position={[-0.48, 0, 0.29]} ref={wardrobeLeftDoorRef}>
          <mesh position={[0.24, 1.0, 0]} geometry={geo_box_28}>

            <meshStandardMaterial color="#5a4530" roughness={0.8} />
          </mesh>
          {/* Handle */}
          <mesh position={[0.42, 1.0, 0.02]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_29}>

            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Panel detail */}
          <mesh position={[0.24, 1.3, 0.02]} geometry={geo_box_30}>

            <meshStandardMaterial color="#4a3820" roughness={0.85} />
          </mesh>
          <mesh position={[0.24, 0.65, 0.02]} geometry={geo_box_30}>

            <meshStandardMaterial color="#4a3820" roughness={0.85} />
          </mesh>
        </group>
        {/* Animated right wardrobe door — pivot on right edge */}
        <group position={[0.48, 0, 0.29]} ref={wardrobeRightDoorRef}>
          <mesh position={[-0.24, 1.0, 0]} geometry={geo_box_28}>

            <meshStandardMaterial color="#5a4530" roughness={0.8} />
          </mesh>
          {/* Handle */}
          <mesh position={[-0.42, 1.0, 0.02]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_29}>

            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Panel detail */}
          <mesh position={[-0.24, 1.3, 0.02]} geometry={geo_box_30}>

            <meshStandardMaterial color="#4a3820" roughness={0.85} />
          </mesh>
          <mesh position={[-0.24, 0.65, 0.02]} geometry={geo_box_30}>

            <meshStandardMaterial color="#4a3820" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WINDOW (right wall, emissive night city glow) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[W / 2 - 0.01, 1.5, -2.5]}>
        <mesh rotation-y={-Math.PI / 2} geometry={geo_pln_31}>

          <meshStandardMaterial
            color="#0a0a20"
            emissive="#1a2a5a"
            emissiveIntensity={1.2}
          />
        </mesh>
        {/* Window frame */}
        <mesh rotation-y={-Math.PI / 2} position={[0.01, 0, 0]} geometry={geo_box_32}>

          <meshStandardMaterial color="#555" />
        </mesh>
        {/* Cross bars */}
        <mesh rotation-y={-Math.PI / 2} position={[0.02, 0, 0]} geometry={geo_box_33}>

          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[0.025, 0, 0]} geometry={geo_box_34}>

          <meshStandardMaterial color="#444" />
        </mesh>
        {/* Window light spill */}
        <pointLight position={[-0.5, 0, 0.5]} color="#1a2a5a" intensity={1.2} distance={5} />
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Kitchen light */}
      <pointLight position={[4.0, 2.5, -5.0]} color="#ffe0a0" intensity={3.5} distance={10} castShadow shadow-mapSize-width={256} />

      {/* Living area warm light */}
      <pointLight position={[-2.0, 2.5, -1.0]} color="#ffcc80" intensity={4.0} distance={12} castShadow shadow-mapSize-width={256} />

      {/* Bedroom soft light */}
      <pointLight position={[-5.0, 2.5, 3.0]} color="#ccbbdd" intensity={2.5} distance={9} />

      {/* TV glow */}
      <pointLight position={[-2.0, 1.2, -3.0]} color="#4466aa" intensity={1.5} distance={6} />

      {/* Window glow spill */}
      <pointLight position={[6.5, 1.5, -2.5]} color="#1a2a5a" intensity={1.5} distance={7} />

      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING (lazy chunk) ── */}
      <HomeEveningProps lod={lod} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL KITCHEN DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Stove top with burners ── */}
      <group position={[3.2, 0, -5.5]}>
        {/* Stove body */}
        <mesh position={[0, 0.45, 0]} castShadow geometry={geo_box_35}>

          <meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Stove top surface */}
        <mesh position={[0, 0.91, 0]} geometry={geo_box_36}>

          <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Burner rings */}
        {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
          <mesh key={`burner-${i}`} position={[x, 0.93, z]} rotation-x={-Math.PI / 2} geometry={geo_tor_37}>

            <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* Oven door */}
        <mesh position={[0, 0.3, 0.33]} geometry={geo_box_38}>

          <meshStandardMaterial color="#333" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Oven door handle */}
        <mesh position={[0, 0.48, 0.35]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_39}>

          <meshStandardMaterial color="#666" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Kettle on stove ── */}
      <group position={[3.35, 0.93, -5.65]}>
        <mesh position={[0, 0.08, 0]} geometry={geo_cyl_40}>

          <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Kettle lid */}
        <mesh position={[0, 0.16, 0]} geometry={geo_sph_41}>

          <meshStandardMaterial color="#b0b0b0" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Kettle spout */}
        <mesh position={[0.06, 0.08, 0]} rotation={[0, 0, -0.4]} geometry={geo_cyl_42}>

          <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Kettle handle */}
        <mesh position={[-0.06, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} geometry={geo_tor_43}>

          <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* ── Wall-mounted cabinets above counter ── */}
      <group position={[4.5, 0, -6.2]}>
        {[0, 1.3].map((x, i) => (
          <mesh key={`cabinet-${i}`} position={[x, 2.2, 0]} castShadow geometry={geo_box_44}>

            <meshStandardMaterial color="#5a4a38" roughness={0.75} />
          </mesh>
        ))}
        {/* Cabinet door handles */}
        {[0, 1.3].map((x, i) => (
          <mesh key={`cab-handle-${i}`} position={[x + 0.5, 2.2, 0.18]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_45}>

            <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ── Spice rack on wall ── */}
      <group position={[3.0, 0, -6.4]}>
        <mesh position={[0, 1.9, 0]} geometry={geo_box_46}>

          <meshStandardMaterial color="#5a4030" roughness={0.7} />
        </mesh>
        {/* Small spice jars */}
        {[-0.2, -0.07, 0.06, 0.19].map((x, i) => (
          <mesh key={`spice-${i}`} position={[x, 1.96, 0]} geometry={geo_cyl_47}>

            <meshStandardMaterial
              color={['#884422', '#228844', '#884488', '#448888'][i]}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* ── Kitchen rug on floor ── */}
      <mesh rotation-x={-Math.PI / 2} position={[4.0, 0, -5.0]} renderOrder={1} geometry={geo_pln_48}>

        <meshBasicMaterial color="#6a3040" depthTest={false} depthWrite={false} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL LIVING ROOM DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Bookshelf on left wall ── */}
      <group position={[-6.0, 0, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_49}>

          <meshStandardMaterial color="#5a4030" roughness={0.8} />
        </mesh>
        {/* Shelves */}
        {[0.5, 1.0, 1.5].map((y, i) => (
          <mesh key={`bkshelf-${i}`} position={[0, y, 0.01]} geometry={geo_box_50}>

            <meshStandardMaterial color="#4a3520" roughness={0.7} />
          </mesh>
        ))}
        {/* Books on shelves */}
        {[0.25, 0.75, 1.25, 1.75].map((y, si) => (
          Array.from({ length: 3 + si % 2 }).map((_, j) => (
            <mesh key={`bk-${si}-${j}`} position={[-0.3 + j * 0.2, y, 0.02]} geometry={BOOK_GEOS[j % 3]}>
              <meshStandardMaterial
                color={['#8b2020', '#204080', '#205030', '#806020', '#604020'][j % 5]}
                roughness={0.6}
              />
            </mesh>
          ))
        ))}
      </group>

      {/* ── Table lamp on coffee table (warm glow) ── */}
      <group position={[-2.3, 0.37, 0.5]}>
        {/* Lamp base */}
        <mesh position={[0, 0.02, 0]} geometry={geo_cyl_51}>

          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Lamp stem */}
        <mesh position={[0, 0.15, 0]} geometry={geo_cyl_52}>

          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Lamp shade */}
        <mesh position={[0, 0.3, 0]} geometry={geo_cyl_53}>

          <meshStandardMaterial color="#e8d8b0" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* Lamp glow bulb */}
        <mesh position={[0, 0.28, 0]} geometry={geo_sph_54}>

          <meshStandardMaterial color="#ffddaa" emissive="#ffcc80" emissiveIntensity={2.0} />
        </mesh>
        {/* Warm light from lamp */}
        <pointLight position={[0, 0.35, 0]} color="#ffcc80" intensity={3.0} distance={5} castShadow shadow-mapSize-width={256} />
      </group>

      {/* ── Remote control on coffee table ── */}
      <mesh position={[-1.7, 0.375, 0.6]} rotation={[0, 0.3, 0]} geometry={geo_box_55}>

        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>

      {/* ── Tea cup on coffee table ── */}
      <group position={[-2.0, 0.37, 0.3]}>
        <mesh position={[0, 0.04, 0]} geometry={geo_cyl_56}>

          <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
        </mesh>
        {/* Saucer */}
        <mesh position={[0, 0.005, 0]} rotation-x={-Math.PI / 2} geometry={geo_cyl_57}>

          <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
        </mesh>
      </group>

      {/* ── Photos on living room wall ── */}
      {[[-3.5, 1.8, -3.2], [-2.5, 2.0, -3.2], [-1.5, 1.7, -3.2]].map((pos, i) => (
        <group key={`photo-${i}`} position={pos as [number, number, number]}>
          {/* Frame */}
          <mesh geometry={PHOTO_FRAME_GEOS[i]}>
            <meshStandardMaterial color="#4a3520" roughness={0.7} />
          </mesh>
          {/* Photo area */}
          <mesh position={[0, 0, 0.011]} geometry={PHOTO_PLANE_GEOS[i]}>
            <meshStandardMaterial
              color={['#8a7a60', '#7a8a70', '#6a7080'][i]}
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}

      {/* ── Curtains on window ── */}
      <group position={[W / 2 - 0.02, 1.5, -2.5]}>
        {/* Left curtain */}
        <mesh rotation-y={-Math.PI / 2} position={[0.03, 0, -0.8]} geometry={geo_pln_58}>

          <meshStandardMaterial color="#5a4a40" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {/* Right curtain */}
        <mesh rotation-y={-Math.PI / 2} position={[0.03, 0, 0.8]} geometry={geo_pln_58}>

          <meshStandardMaterial color="#5a4a40" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {/* Curtain rod */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.02, 0.85, 0]} geometry={geo_cyl_59}>

          <meshStandardMaterial color="#6a5a40" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>

      {/* ── Large rug under coffee table ── */}
      <mesh rotation-x={-Math.PI / 2} position={[-2.0, 0, 0.0]} renderOrder={1} geometry={geo_pln_60}>

        <meshBasicMaterial color="#4a3040" depthTest={false} depthWrite={false} />
      </mesh>
      {/* Rug border pattern */}
      <mesh rotation-x={-Math.PI / 2} position={[-2.0, 0, 0.0]} renderOrder={2} geometry={geo_pln_61}>

        <meshBasicMaterial color="#5a3848" depthTest={false} depthWrite={false} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── HALLWAY AREA DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Coat rack near entrance ── */}
      <group position={[5.5, 0, 5.0]}>
        {/* Pole */}
        <mesh position={[0, 0.9, 0]} geometry={geo_cyl_62}>

          <meshStandardMaterial color="#4a3520" roughness={0.7} />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0.03, 0]} geometry={geo_cyl_63}>

          <meshStandardMaterial color="#3a2818" roughness={0.8} />
        </mesh>
        {/* Hooks */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`hook-${i}`} position={[0, 1.5, 0]} rotation={[0, (i * Math.PI) / 2, -0.5]} geometry={geo_cyl_64}>

            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* Coat hanging on rack */}
        <mesh position={[0.08, 1.2, 0]} rotation={[0.05, 0, 0.03]} geometry={geo_box_65}>

          <meshStandardMaterial color="#2a3040" roughness={0.85} />
        </mesh>
      </group>

      {/* ── Mirror on wall near entrance ── */}
      <group position={[5.0, 1.5, 6.8]} rotation-y={Math.PI}>
        {/* Mirror frame */}
        <mesh geometry={geo_box_66}>

          <meshStandardMaterial color="#5a4530" roughness={0.7} />
        </mesh>
        {/* Mirror surface */}
        <mesh position={[0, 0, 0.016]} geometry={geo_pln_67}>

          <meshStandardMaterial color="#6080a0" metalness={0.8} roughness={0.1} />
        </mesh>
      </group>

      {/* ── Shoes near entrance ── */}
      {[[5.0, 0, 6.2], [5.2, 0, 6.0], [4.8, 0, 6.3]].map((pos, i) => (
        <mesh key={`shoe-${i}`} position={pos as [number, number, number]} rotation={[0, 0.3 + i * 0.5, 0]} geometry={geo_box_68}>

          <meshStandardMaterial color={['#2a1a1a', '#3a3a2a', '#1a1a2a'][i]} roughness={0.9} />
        </mesh>
      ))}

      {/* ── Welcome mat at entrance ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 6.5]} renderOrder={1} geometry={geo_pln_69}>

        <meshBasicMaterial color="#4a4030" depthTest={false} depthWrite={false} />
      </mesh>

      {/* ── Doorbell / intercom panel ── */}
      <group position={[-6.8, 1.4, 5.5]} rotation-y={Math.PI / 2}>
        <mesh geometry={geo_box_70}>

          <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Speaker grille */}
        <mesh position={[0, -0.04, 0.016]} geometry={geo_box_71}>

          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Button */}
        <mesh position={[0, 0.04, 0.018]} geometry={geo_cyl_72}>

          <meshStandardMaterial color="#aa2222" emissive="#aa2222" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERIOR MODELS (from InteriorModels.tsx) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Decorative props (LOD: standard+) ── */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
      {/* ── Radiator on left wall near bedroom ── */}
      <Radiator position={[-W / 2 + 0.06, 0.3, 1.0]} rotation={[0, Math.PI / 2, 0]} color="#b0b0b0" />

      {/* ── Radiator on back wall near kitchen ── */}
      <Radiator position={[2.5, 0.3, -D / 2 + 0.06]} color="#b0b0b0" />

      {/* ── Plant in living area corner ── */}
      <Plant position={[-4.5, 0, -3.0]} color="#2a6a20" scale={[1.2, 1.2, 1.2]} />

      {/* ── Pictures on bedroom wall ── */}
      <Picture position={[-6.0, 2.0, -1.5]} rotation={[0, Math.PI / 2, 0]} color="#5a3a20" />
      <Picture position={[-6.0, 1.8, 0.5]} rotation={[0, Math.PI / 2, 0]} color="#6a4a30" />
      </EnvironmentDetail>
    </group>
  );
}

function createHomeFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6a5840';
  ctx.fillRect(0, 0, size, size);

  // Wood planks
  ctx.strokeStyle = '#5a4830';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  return tex;
}

function createHomeWallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a3a30';
  ctx.fillRect(0, 0, size, size);

  // Wallpaper pattern - subtle vertical stripes
  ctx.globalAlpha = 0.04;
  for (let x = 0; x < size; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? '#5a4a40' : '#3a2a20';
    ctx.fillRect(x, 0, 8, size);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}
