
/* ─── Volodka RPG – Corridor procedural 3D visual ─── */

import { Suspense, useRef, useEffect, useMemo, type MutableRefObject } from 'react';
import { CANONICAL_SHADOW_BIAS, CANONICAL_SHADOW_NORMAL_BIAS } from '@/components/3d/Lighting';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { BoxGeometry, CanvasTexture, CylinderGeometry, DoubleSide, Group, MathUtils, PlaneGeometry, PointLight, RepeatWrapping, SphereGeometry, Vector3 } from 'three';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createVolodkaCorridorRainySkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import { registerModuleGeometries } from '@/engine/three/moduleGeometryRegistry';
import { PolyHavenStandardMaterial } from './PolyHavenStandardMaterial';
import {
  getRainSpillInFloorBoost,
} from '@/engine/graphics/wetStreetScenes';
import { getSharedCircleGeometry } from '@/engine/three/moduleGeometryRegistry';

interface VolodkaCorridorVisualProps {
  livePlayerPositionRef?: MutableRefObject<Vector3>;
}

/** Communal corridor (6×16×3m) — matches sceneDefinition physics bounds */
/* ─── Shared geometries (module-level, reused across renders) ─── */

const geo_pln_1 = new PlaneGeometry(6, 16);
const geo_pln_2 = new PlaneGeometry(1.4, 14);
const geo_pln_3 = new PlaneGeometry(16, 3);
const geo_pln_4 = new PlaneGeometry(6, 3);
const geo_box_5 = new BoxGeometry(0.5, 0.7, 0.4);
const geo_box_6 = new BoxGeometry(0.48, 0.03, 0.38);
const geo_box_7 = new BoxGeometry(0.08, 0.8, 0.6);
const geo_box_8 = new BoxGeometry(0.02, 0.08, 0.55);
const geo_box_9 = new BoxGeometry(0.15, 0.05, 0.15);
const geo_cyl_10 = new CylinderGeometry(0.1, 0.2, 0.15, 8);
const geo_pln_11 = new PlaneGeometry(0.9, 2.2);
const geo_box_12 = new BoxGeometry(0.03, 2.2, 0.95);
const geo_box_13 = new BoxGeometry(0.03, 0.05, 0.95);
const geo_box_14 = new BoxGeometry(0.04, 2.15, 0.9);
const geo_cyl_15 = new CylinderGeometry(0.012, 0.012, 0.1, 6);
const geo_box_16 = new BoxGeometry(0.005, 0.5, 0.5);
const geo_box_17 = new BoxGeometry(0.95, 2.2, 0.03);
const geo_box_18 = new BoxGeometry(0.95, 0.05, 0.03);
const geo_box_19 = new BoxGeometry(0.9, 2.15, 0.04);
const geo_box_20 = new BoxGeometry(0.5, 0.6, 0.005);
const geo_pln_21 = new PlaneGeometry(1.2, 0.6);
const geo_pln_22 = new PlaneGeometry(0.6, 0.3);
const geo_sph_23 = new SphereGeometry(0.08, 5, 5);
const geo_sph_24 = new SphereGeometry(0.06, 5, 5);
const geo_pln_25 = new PlaneGeometry(0.25, 0.18);
const geo_pln_26 = new PlaneGeometry(0.5, 0.5);
const geo_cyl_27 = new CylinderGeometry(0.006, 0.006, 0.3, 4);
const geo_pln_28 = new PlaneGeometry(0.08, 0.14);
const geo_pln_29 = new PlaneGeometry(0.4, 0.3);
const geo_pln_30 = new PlaneGeometry(0.35, 0.22);
const geo_box_31 = new BoxGeometry(0.8, 1.2, 0.15);
const geo_box_32 = new BoxGeometry(0.65, 0.18, 0.01);
const geo_box_33 = new BoxGeometry(0.2, 0.03, 0.003);
const geo_cyl_34 = new CylinderGeometry(0.005, 0.005, 0.003, 6);
const geo_box_35 = new BoxGeometry(0.15, 0.25, 0.03);
const geo_box_36 = new BoxGeometry(0.1, 0.08, 0.002);
const geo_box_37 = new BoxGeometry(0.09, 0.003, 0.001);
const geo_cyl_38 = new CylinderGeometry(0.015, 0.015, 0.005, 8);
const geo_cyl_39 = new CylinderGeometry(0.01, 0.01, 0.005, 8);
const geo_pln_40 = new PlaneGeometry(0.4, 0.4);
const geo_pln_41 = new PlaneGeometry(0.25, 0.005);
const geo_pln_42 = new PlaneGeometry(0.15, 0.004);
const geo_box_43 = new BoxGeometry(0.4, 0.6, 0.02);
const geo_pln_44 = new PlaneGeometry(0.33, 0.52);
const geo_cyl_45 = new CylinderGeometry(0.005, 0.005, 0.06, 4);
const geo_cyl_46 = new CylinderGeometry(0.005, 0.005, 0.03, 4);
const geo_box_47 = new BoxGeometry(0.06, 0.5, 0.015);
const geo_pln_48 = new PlaneGeometry(0.8, 0.5);
const geo_cyl_49 = new CylinderGeometry(0.025, 0.025, 16, 8);
const geo_box_50 = new BoxGeometry(0.04, 0.06, 0.04);
const geo_cyl_51 = new CylinderGeometry(0.04, 0.04, 0.02, 6);
const geo_box_52 = new BoxGeometry(0.08, 0.01, 0.01);
const geo_box_53 = new BoxGeometry(0.06, 0.08, 0.01);
const geo_box_54 = new BoxGeometry(0.03, 0.015, 0.005);
const geo_sph_55 = new SphereGeometry(0.05, 4, 3);
const geo_pln_56 = new PlaneGeometry(0.7, 2);
const geo_box_57 = new BoxGeometry(0.03, 2, 0.75);
const geo_box_58 = new BoxGeometry(0.04, 1.95, 0.7);
const geo_cyl_59 = new CylinderGeometry(0.012, 0.012, 0.08, 6);
const geo_pln_60 = new PlaneGeometry(0.06, 0.04);
// FIX P2-CORR-B2/B3/B4/B5: geoms for leak stain, hanging bulb, doorplate «14», fuse box, sandals
const geo_pln_61 = new PlaneGeometry(0.9, 0.6);
const geo_pln_62 = new PlaneGeometry(0.5, 2.0);
const geo_cyl_63 = new CylinderGeometry(0.006, 0.006, 1.13, 6);
const geo_sph_64 = new SphereGeometry(0.055, 8, 8);
const geo_box_65 = new BoxGeometry(0.12, 0.08, 0.01);
const geo_box_66 = new BoxGeometry(0.5, 0.7, 0.12);
const geo_box_67 = new BoxGeometry(0.24, 0.66, 0.02);
const geo_cyl_68 = new CylinderGeometry(0.02, 0.02, 0.03, 8);
const geo_box_69 = new BoxGeometry(0.11, 0.015, 0.05);

registerModuleGeometries([geo_pln_1, geo_pln_2, geo_pln_3, geo_pln_4, geo_box_5, geo_box_6, geo_box_7, geo_box_8, geo_box_9, geo_cyl_10, geo_pln_11, geo_box_12, geo_box_13, geo_box_14, geo_cyl_15, geo_box_16, geo_box_17, geo_box_18, geo_box_19, geo_box_20, geo_pln_21, geo_pln_22, geo_sph_23, geo_sph_24, geo_pln_25, geo_pln_26, geo_cyl_27, geo_pln_28, geo_pln_29, geo_pln_30, geo_box_31, geo_box_32, geo_box_33, geo_cyl_34, geo_box_35, geo_box_36, geo_box_37, geo_cyl_38, geo_cyl_39, geo_pln_40, geo_pln_41, geo_pln_42, geo_box_43, geo_pln_44, geo_cyl_45, geo_cyl_46, geo_box_47, geo_pln_48, geo_cyl_49, geo_box_50, geo_cyl_51, geo_box_52, geo_box_53, geo_box_54, geo_sph_55, geo_pln_56, geo_box_57, geo_box_58, geo_cyl_59, geo_pln_60, geo_pln_61, geo_pln_62, geo_cyl_63, geo_sph_64, geo_box_65, geo_box_66, geo_box_67, geo_cyl_68, geo_box_69]);

const mat_1 = getSharedStandardMaterial({ color: '#4a3828', roughness: 0.8 });
const mat_2 = getSharedStandardMaterial({ color: '#3a2818' });
const mat_3 = getSharedStandardMaterial({ color: '#888', metalness: 0.6, roughness: 0.3 });
const mat_4 = getSharedStandardMaterial({ color: '#999', metalness: 0.5, roughness: 0.4 });
const mat_5 = getSharedStandardMaterial({ color: '#333', metalness: 0.7 });
const mat_6 = getSharedStandardMaterial({ color: '#ffe8a0', emissive: '#ffdd80', emissiveIntensity: 0.5, side: DoubleSide });
const mat_7 = getSharedStandardMaterial({ color: '#3a2820', roughness: 0.85 });
const mat_8 = getSharedStandardMaterial({ color: '#5a4838' });
const mat_9 = getSharedStandardMaterial({ color: '#6a5038', roughness: 0.72, emissive: '#3a2818', emissiveIntensity: 0.12 });
const mat_10 = getSharedStandardMaterial({ color: '#aaa', metalness: 0.8, roughness: 0.2 });
const mat_11 = getSharedStandardMaterial({ color: '#4a3525', roughness: 0.85 });
const mat_12 = getSharedStandardMaterial({ color: '#2a2020', roughness: 0.85 });
const mat_13 = getSharedStandardMaterial({ color: '#3a2520', roughness: 0.8 });
const mat_14 = getSharedStandardMaterial({ color: '#2a1515', roughness: 0.85 });
const mat_15 = getSharedStandardMaterial({ color: '#1a1a1a', emissive: '#ff2244', emissiveIntensity: 0.35, roughness: 0.95 });
const mat_16 = getSharedStandardMaterial({ color: '#1a1a1a', emissive: '#44aaff', emissiveIntensity: 0.25, roughness: 0.95 });
const mat_17 = getSharedStandardMaterial({ color: '#c8c0a8', roughness: 0.95 });
const mat_18 = getSharedStandardMaterial({ color: '#b0a890', roughness: 0.95 });
const mat_19 = getSharedStandardMaterial({ color: '#c8c0a0', roughness: 0.95, side: DoubleSide });
const mat_20 = getSharedStandardMaterial({ color: '#0a0a0a', roughness: 1 });
const mat_21 = getSharedStandardMaterial({ color: '#222', roughness: 0.9 });
const mat_22 = getSharedStandardMaterial({ color: '#2a2520', roughness: 0.6, transparent: true, opacity: 0.25, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const mat_23 = getSharedStandardMaterial({ color: '#5a4a40', roughness: 0.95 });
const mat_24 = getSharedStandardMaterial({ color: '#3a3540', roughness: 0.9, side: DoubleSide });
const mat_25 = getSharedStandardMaterial({ color: '#4a4a4a', metalness: 0.4, roughness: 0.5 });
const mat_26 = getSharedStandardMaterial({ color: '#333', metalness: 0.3, roughness: 0.6 });
// Deplasticize: clamp envMapIntensity on metal-heavy props so they don't
// over-sample the warm_apartment env map (reads as shiny/plastic without
// the clamp). 0.4 matches the interior deplasticize pass in volodka_room.
const mat_27 = getSharedStandardMaterial({ color: '#8a7a50', metalness: 0.3, roughness: 0.5 }); // mailboxes nameplate (brass)
mat_27.envMapIntensity = 0.4;
const mat_28 = getSharedStandardMaterial({ color: '#1a1a1a' });
const mat_29 = getSharedStandardMaterial({ color: '#3a3a3a', metalness: 0.5, roughness: 0.5 });
const mat_30 = getSharedStandardMaterial({ color: '#1a1a1a', roughness: 0.9 });
const mat_31 = getSharedStandardMaterial({ color: '#2a2a2a' });
const mat_32 = getSharedStandardMaterial({ color: '#cc2222', emissive: '#cc2222', emissiveIntensity: 0.8 });
const mat_33 = getSharedStandardMaterial({ color: '#1a1a1a', metalness: 0.7, roughness: 0.2 });
const mat_34 = getSharedStandardMaterial({ color: '#4a3a30', roughness: 0.9, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const mat_35 = getSharedStandardMaterial({ color: '#2a2018', roughness: 0.9, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const mat_36 = getSharedStandardMaterial({ color: '#5a4530', roughness: 0.7 });
const mat_37 = getSharedStandardMaterial({ color: '#607080', metalness: 0.8, roughness: 0.1 }); // mirror (steel)
mat_37.envMapIntensity = 0.4;
const mat_38 = getSharedStandardMaterial({ color: '#555', metalness: 0.6, roughness: 0.4 }); // coat hooks
mat_38.envMapIntensity = 0.4;
const mat_39 = getSharedStandardMaterial({ color: '#6a3a3a', roughness: 0.9 });
const mat_40 = getSharedStandardMaterial({ color: '#4a4030', roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const mat_41 = getSharedStandardMaterial({ color: '#5a5a5a', metalness: 0.6, roughness: 0.4 }); // pipe
mat_41.envMapIntensity = 0.4;
const mat_42 = getSharedStandardMaterial({ color: '#4a4a4a', metalness: 0.5, roughness: 0.5 });
const mat_43 = getSharedStandardMaterial({ color: '#8b2020', metalness: 0.5, roughness: 0.4 });
const mat_44 = getSharedStandardMaterial({ color: '#8b2020', metalness: 0.4, roughness: 0.5 });
const mat_45 = getSharedStandardMaterial({ color: '#e0e0e0', roughness: 0.5 });
const mat_46 = getSharedStandardMaterial({ color: '#ccc', roughness: 0.6 });
const mat_47 = getSharedStandardMaterial({ color: '#5a5040', roughness: 0.95 });
const mat_48 = getSharedStandardMaterial({ color: '#4a3540', roughness: 0.85 });
const mat_49 = getSharedStandardMaterial({ color: '#6a4550', roughness: 0.75 });
const mat_50 = getSharedStandardMaterial({ color: '#4a4035', roughness: 0.85 });
const mat_51 = getSharedStandardMaterial({ color: '#6a5040', roughness: 0.75 });
const mat_52 = getSharedStandardMaterial({ color: '#3a3030', roughness: 0.85 });
const mat_53 = getSharedStandardMaterial({ color: '#888', roughness: 0.5 });
// FIX P2-CORR-B2: rusty leak decal — polygonOffset above wall/ceiling so no z-fight
const mat_54 = getSharedStandardMaterial({ color: '#6a4430', roughness: 0.95, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const mat_55 = getSharedStandardMaterial({ color: '#4a2c1e', roughness: 0.95, transparent: true, opacity: 0.7, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
// FIX P2-CORR-B3: hanging bulb (warm glass)
const mat_56 = getSharedStandardMaterial({ color: '#ffe8b0', emissive: '#ffcc66', emissiveIntensity: 0.9 });
// FIX P2-CORR-B6: children sandals on the shoe rack top shelf
const mat_57 = getSharedStandardMaterial({ color: '#7a5a38', roughness: 0.8 });

export function VolodkaCorridorVisual({ livePlayerPositionRef: _livePlayerPositionRef }: VolodkaCorridorVisualProps) {
  const floorTexture = useCachedCanvasTexture('volodka_corridor:floor', createCorridorFloorTexture);
  const wallTexture = useCachedCanvasTexture('volodka_corridor:wall', createCorridorWallTexture);
  const carpetTexture = useCachedCanvasTexture('volodka_corridor:carpet', createCorridorCarpetTexture);
  const ceilingWashTexture = useCachedCanvasTexture(
    'volodka_corridor:rainy-ceiling',
    createVolodkaCorridorRainySkyTexture,
  );
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const spill = useMemo(
    () => getRainSpillInFloorBoost('volodka_corridor', rainIntensity),
    [rainIntensity],
  );
  const floorRoughness = Math.max(0.35, 0.85 - (spill?.roughnessDrop ?? 0));
  const floorMetalness = Math.min(0.42, spill?.metalnessBoost ?? 0.02);

  const mat_floor = useMemo(
    () =>
      getSharedStandardMaterial({
        map: floorTexture,
        color: '#5a4a40',
        roughness: floorRoughness,
        metalness: floorMetalness,
        polygonOffset: true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits: 2,
      }),
    [floorTexture, floorRoughness, floorMetalness],
  );
  const mat_carpet = useMemo(
    () =>
      getSharedStandardMaterial({
        map: carpetTexture,
        color: '#6a3a30',
        roughness: 0.95,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [carpetTexture],
  );
  const mat_ceiling = useMemo(
    () =>
      getSharedStandardMaterial({
        map: ceilingWashTexture,
        color: '#242430',
        emissive: '#303038',
        emissiveIntensity: 0.2,
        roughness: 0.95,
      }),
    [ceilingWashTexture],
  );
  const mat_wall = useMemo(
    () =>
      getSharedStandardMaterial({
        map: wallTexture,
        color: '#3a3540',
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [wallTexture],
  );

  const W = 6;
  const D = 16;
  const H = 3;

  const flickerLightRef = useRef<PointLight>(null);
  const rootGroupRef = useRef<Group>(null);

  // ── Interactive object animation refs ──
  const kitchenDoorRef = useRef<Group>(null);
  const streetDoorRef = useRef<Group>(null);
  const roomDoorRef = useRef<Group>(null);
  const solnyshDoorRef = useRef<Group>(null);
  const zaremaDoorRef = useRef<Group>(null);
  const bathroomDoorRef = useRef<Group>(null);

  // ── Listen for object:interact events to toggle interactive objects ──
  useEffect(() => {
    const unsub = eventBus.on('object:interact', (payload) => {
      if (
        payload.objectId === 'corridor_kitchen_door' ||
        payload.objectId === 'corridor_street_door' ||
        payload.objectId === 'corridor_room_door' ||
        payload.objectId === 'corridor_solnysh_door' ||
        payload.objectId === 'corridor_zarema_door' ||
        payload.objectId === 'corridor_bathroom_door'
      ) {
        useGameStore.getState().toggleInteractiveObject(payload.objectId);
      }
    });
    return unsub;
  }, []);

  useFrameTick('misc', ({ state, delta }) => {
    if (flickerLightRef.current) {
      // FIX AUDIT-C16: was binary strobe (Math.sin(t*8) > 0.9 ? 0.2 : 1.0) — intensity
      // jumped instantly between 0.5 and 2.5. Replaced with smooth multi-sine flicker
      // (base 0.75 + two sines) for an organic broken-bulb feel, with occasional dips.
      const t = state.clock.elapsedTime;
      const dip = Math.sin(t * 8) > 0.92 ? 0.35 : 1.0;
      const flicker = (0.75 + 0.18 * Math.sin(t * 7.3) + 0.07 * Math.sin(t * 23.1)) * dip;
      flickerLightRef.current.intensity = flicker * 18;
    }

    // Interactive object animations — smooth lerp toward target rotation
    const objStates = useGameStore.getState().interactiveObjectStates;

    // Kitchen door (right wall): swings open into corridor
    if (kitchenDoorRef.current) {
      const open = objStates['corridor_kitchen_door'] ?? false;
      const targetY = open ? -Math.PI / 2 : 0;
      kitchenDoorRef.current.rotation.y = MathUtils.lerp(
        kitchenDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    // Street door (left wall): swings open into corridor
    if (streetDoorRef.current) {
      const open = objStates['corridor_street_door'] ?? false;
      const targetY = open ? Math.PI / 2 : 0;
      streetDoorRef.current.rotation.y = MathUtils.lerp(
        streetDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    // Room door (front wall): swings open into corridor
    if (roomDoorRef.current) {
      const open = objStates['corridor_room_door'] ?? false;
      const targetY = open ? -Math.PI / 2 : 0;
      roomDoorRef.current.rotation.y = MathUtils.lerp(
        roomDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    if (solnyshDoorRef.current) {
      const open = objStates['corridor_solnysh_door'] ?? false;
      const targetY = open ? -Math.PI / 2 : 0;
      solnyshDoorRef.current.rotation.y = MathUtils.lerp(
        solnyshDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    if (zaremaDoorRef.current) {
      const open = objStates['corridor_zarema_door'] ?? false;
      const targetY = open ? Math.PI / 2 : 0;
      zaremaDoorRef.current.rotation.y = MathUtils.lerp(
        zaremaDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    if (bathroomDoorRef.current) {
      const open = objStates['corridor_bathroom_door'] ?? false;
      const targetY = open ? -Math.PI / 2 : 0;
      bathroomDoorRef.current.rotation.y = MathUtils.lerp(
        bathroomDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }
  }, { visibilityRef: rootGroupRef });

  return (
    <group ref={rootGroupRef}>
      {/* ── Floor (linoleum) — Poly Haven concrete_floor_painted tinted Soviet-brown ── */}
      <Suspense
        fallback={
          <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.002} renderOrder={0} geometry={geo_pln_1} material={mat_floor} />
        }
      >
        <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.002} renderOrder={0} geometry={geo_pln_1}>
          <PolyHavenStandardMaterial
            materialId="concrete_floor_painted"
            repeatScale={1.2}
            color="#5a4a40"
            roughness={floorRoughness}
            metalness={floorMetalness}
            polygonOffset
          />
        </mesh>
      </Suspense>
      {/* FIX AUDIT-C7: puddle was at X=0 (inside opaque carpet runner X=±0.7) →
          hidden under the carpet. Moved to X=1.5 (bare floor, right of carpet). */}
      {spill && (
        <mesh rotation-x={-Math.PI / 2} position={[1.5, 0.006, 6.2]} renderOrder={2} geometry={getSharedCircleGeometry(1.35, 18)}>
          <meshPhysicalMaterial
            color="#2a3038"
            metalness={0.45}
            roughness={0.28}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            ior={1.33}
            transparent
            opacity={spill.puddleOpacity}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
            /* WS20-C: upgraded to MeshPhysicalMaterial for PBR clearcoat */
          />
        </mesh>
      )}

      {/* ── Carpet runner (decal on floor — no physics collider) ── */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} renderOrder={1} geometry={geo_pln_2} material={mat_carpet} />

      {/* ── Ceiling — dim rainy HDR wash ── */}
      {/* FIX AUDIT-C10: added receiveShadow so the ceiling lamp casts shadow pooling on ceiling. */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} receiveShadow geometry={geo_pln_1} material={mat_ceiling} />

      {/* ── Walls — Poly Haven plastered_wall for visual continuity with volodka_room ── */}
      <Suspense
        fallback={
          <>
            <mesh position={[-W / 2 + 0.01, H / 2, 0]} rotation-y={Math.PI / 2} receiveShadow geometry={geo_pln_3} material={mat_wall} />
            <mesh position={[W / 2 - 0.01, H / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow geometry={geo_pln_3} material={mat_wall} />
            <mesh position={[0, H / 2, -D / 2 + 0.01]} receiveShadow geometry={geo_pln_4} material={mat_wall} />
            <mesh position={[0, H / 2, D / 2 - 0.01]} rotation-y={Math.PI} receiveShadow geometry={geo_pln_4} material={mat_wall} />
          </>
        }
      >
        {/* ── Left Wall ── */}
        <mesh position={[-W / 2 + 0.01, H / 2, 0]} rotation-y={Math.PI / 2} receiveShadow geometry={geo_pln_3}>
          <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={0.9} color="#3a3540" roughness={0.9} polygonOffset />
        </mesh>

        {/* ── Right Wall ── */}
        <mesh position={[W / 2 - 0.01, H / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow geometry={geo_pln_3}>
          <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={0.9} color="#3a3540" roughness={0.9} polygonOffset />
        </mesh>

        {/* ── Back Wall ── */}
        <mesh position={[0, H / 2, -D / 2 + 0.01]} receiveShadow geometry={geo_pln_4}>
          <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={0.9} color="#3a3540" roughness={0.9} polygonOffset />
        </mesh>

        {/* ── Front Wall ── */}
        <mesh position={[0, H / 2, D / 2 - 0.01]} rotation-y={Math.PI} receiveShadow geometry={geo_pln_4}>
          <PolyHavenStandardMaterial materialId="plastered_wall" repeatScale={0.9} color="#3a3540" roughness={0.9} polygonOffset />
        </mesh>
      </Suspense>

      {/* ── Decorative props (LOD: standard+) ── */}
      <EnvironmentDetail minLod="standard" position={[-2.15, 0, 5.5]}>
      {/* ── Shoe Rack (left wall, near entrance) ── */}
      <group position={[-W / 2 + 0.35, 0, 5.5]}>
        <mesh position={[0, 0.35, 0]} castShadow geometry={geo_box_5} material={mat_1} />
        {/* Shelves */}
        {[0.2, 0.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0.01]} geometry={geo_box_6} material={mat_2} />
        ))}
        {/* FIX P2-CORR-B6: ws22b_corridor_shoe_rack promises "детские сандалии на верхней полке"
            — they were never rendered. Pair of small sandals on the top shelf (y=0.5). */}
        <group position={[0, 0.51, 0.02]}>
          <mesh position={[-0.07, 0, 0]} geometry={geo_box_69} material={mat_57} />
          <mesh position={[0.07, 0, 0]} geometry={geo_box_69} material={mat_57} />
        </group>
      </group>

      {/* ── Radiator (right wall) ── */}
      {/* FIX AUDIT-C1: was at Z=-2.0, same as kitchen door group (line ~405) → radiator
          blocked the kitchen door. Moved to Z=-5.5 (between kitchen door Z=-2 and
          front wall Z=-8), clear of all doorways. */}
      <group position={[W / 2 - 0.12, 0, -5.5]}>
        <mesh position={[0, 0.4, 0]} castShadow geometry={geo_box_7} material={mat_3} />
        {/* Ribs */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0.03, 0.1 + i * 0.12, 0]} geometry={geo_box_8} material={mat_4} />
        ))}
      </group>
      </EnvironmentDetail>

      {/* ── Ceiling Lamp ── */}
      <group position={[0, H - 0.02, -4.0]}>
        {/* Lamp fixture */}
        <mesh geometry={geo_box_9} material={mat_5} />
        {/* Lamp shade */}
        <mesh position={[0, -0.1, 0]} geometry={geo_cyl_10} material={mat_6} />
        {/* FIX (v4.56): 3.5 → 26 кд (three 0.172 физические света: освещённость = кд/м²).
            При 3.5 кд лампа освещала лишь круг радиусом ~1 м — остальное чернота. */}
        <pointLight
          position={[0, -0.2, 0]}
          color="#ffdd90"
          intensity={26}
          distance={16}
          decay={2}
          castShadow
          shadow-mapSize-width={256}
          shadow-bias={CANONICAL_SHADOW_BIAS} shadow-normalBias={CANONICAL_SHADOW_NORMAL_BIAS}
        />
      </group>

      {/* ── Second ceiling lamp (flickering) ── */}
      <group position={[0, H - 0.02, 4.0]}>
        <mesh geometry={geo_box_9} material={mat_5} />
        {/* FIX AUDIT-C12: missing lamp shade (first lamp at Z=-4 has one, this didn't). */}
        <mesh position={[0, -0.1, 0]} geometry={geo_cyl_10} material={mat_6} />
        {/* FIX P2-CORR-B3: ws20b_flickering_bulb_fixture zone sat at [0,2.8,0] — 4m from this
            lamp and unreachable (3D distance 2.8 > range). The examined object now hangs on
            a wire at y=1.85 (communal-corridor trope, above player height 1.75), and the
            zone moved to match. Light source moved down with the bulb. */}
        <mesh position={[0, -0.565, 0]} geometry={geo_cyl_63} material={mat_21} />
        <mesh position={[0, -1.13, 0]} geometry={geo_sph_64} material={mat_56} />
        <pointLight
          ref={flickerLightRef}
          position={[0, -1.2, 0]}
          color="#ffdd90"
          intensity={18}
          distance={14}
          decay={2}
        />
      </group>

      {/* ── Door: Kitchen (right wall, z=-1) — animated ── */}
      <group position={[W / 2 - 0.02, 0, -2.0]} name="kitchen-door">
        {/* Door indent (wall cutout) */}
        <mesh rotation-y={-Math.PI / 2} geometry={geo_pln_11} material={mat_7} />
        {/* Door frame */}
        <mesh position={[0.01, 1.1, 0]} rotation-y={-Math.PI / 2} geometry={geo_box_12} material={mat_8} />
        {/* Door frame top */}
        <mesh position={[0.01, 2.2, 0]} rotation-y={-Math.PI / 2} geometry={geo_box_13} material={mat_8} />
        {/* Animated door panel — pivot on left edge (when facing the door from corridor) */}
        <group position={[0.02, 0, 0.45]} ref={kitchenDoorRef}>
          <mesh position={[0, 1.1, -0.45]} geometry={geo_box_14} material={mat_9} />
          {/* Door handle */}
          <mesh position={[0, 1.05, -0.08]} geometry={geo_cyl_15} material={mat_10} />
          {/* Panel detail */}
          <mesh position={[0.025, 1.4, -0.45]} geometry={geo_box_16} material={mat_11} />
          <mesh position={[0.025, 0.7, -0.45]} geometry={geo_box_16} material={mat_11} />
        </group>
      </group>

      {/* ── Door: Street (left wall, z=-1) — animated ── */}
      <group position={[-W / 2 + 0.02, 0, -2.0]}>
        {/* Door indent */}
        <mesh rotation-y={Math.PI / 2} geometry={geo_pln_11} material={mat_12} />
        {/* Door frame */}
        <mesh position={[-0.01, 1.1, 0]} rotation-y={Math.PI / 2} geometry={geo_box_12} material={mat_8} />
        <mesh position={[-0.01, 2.2, 0]} rotation-y={Math.PI / 2} geometry={geo_box_13} material={mat_8} />
        {/* Animated door panel — pivot on right edge (when facing from corridor) */}
        <group position={[-0.02, 0, 0.45]} ref={streetDoorRef}>
          <mesh position={[0, 1.1, -0.45]} geometry={geo_box_14} material={mat_13} />
          {/* Door handle */}
          <mesh position={[0, 1.05, -0.08]} geometry={geo_cyl_15} material={mat_10} />
          {/* Metal detail — street door is heavier */}
          <mesh position={[-0.025, 1.4, -0.45]} geometry={geo_box_16} material={mat_14} />
          <mesh position={[-0.025, 0.7, -0.45]} geometry={geo_box_16} material={mat_14} />
        </group>
      </group>

      {/* ── Door: Volodka's room (front wall) — animated ── */}
      <group position={[0, 0, D / 2 - 0.02]}>
        {/* Door indent */}
        <mesh rotation-y={Math.PI} geometry={geo_pln_11} material={mat_7} />
        {/* Door frame */}
        <mesh position={[0, 1.1, 0.01]} rotation-y={Math.PI} geometry={geo_box_17} material={mat_8} />
        <mesh position={[0, 2.2, 0.01]} rotation-y={Math.PI} geometry={geo_box_18} material={mat_8} />
        {/* Animated door panel — pivot on left edge */}
        <group position={[-0.45, 0, 0.02]} ref={roomDoorRef}>
          <mesh position={[0.45, 1.1, 0]} geometry={geo_box_19} material={mat_9} />
          {/* Door handle */}
          <mesh position={[0.78, 1.05, 0.03]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_15} material={mat_10} />
          {/* Panel detail */}
          <mesh position={[0.45, 1.4, 0.025]} geometry={geo_box_20} material={mat_11} />
          <mesh position={[0.45, 0.7, 0.025]} geometry={geo_box_20} material={mat_11} />
        </group>
      </group>

      {/* ── Scratched apartment doorplate «14» (right of the room door) ── */}
      {/* FIX P2-CORR-B4: ws20b_scratched_doorplate zone sat at [2.0,1.5,6.0] — floating 0.85m
          off the mailbox bank, unreachable (d=1.5 > range 1.2), and no plate mesh existed.
          The plate now hangs on the wall beside Volodka's room door (unit 34 scratched over
          → 14); zone re-seated at [0.62,1.25,7.85] (reachable: d≈1.29 < range 1.35). */}
      <group position={[0.62, 1.45, D / 2 - 0.06]}>
        <mesh geometry={geo_box_65} material={mat_33} />
        {/* scratch diagonal — the ghost of the «3» under the «1» */}
        <mesh position={[0, 0, 0.007]} rotation={[0, 0, 0.6]} geometry={geo_box_69} material={mat_28} scale={[0.4, 1.6, 1]} />
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Graffiti on left wall (colored rectangles) ── */}
      <mesh position={[-W / 2 + 0.02, 1.6, 0.5]} rotation-y={Math.PI / 2} geometry={geo_pln_21} material={mat_15} />
      <mesh position={[-W / 2 + 0.02, 1.2, 0.5]} rotation-y={Math.PI / 2} geometry={geo_pln_22} material={mat_16} />

      {/* ── Trash pile in corner (near front wall) ── */}
      <group position={[W / 2 - 0.4, 0, 4.5]}>
        {/* Crumpled paper */}
        <mesh position={[0, 0.06, 0]} rotation={[0.3, 0.5, 0.2]} geometry={geo_sph_23} material={mat_17} />
        <mesh position={[0.15, 0.04, 0.1]} rotation={[0.5, 1.2, 0.1]} geometry={geo_sph_24} material={mat_18} />
        {/* Old newspaper */}
        <mesh position={[-0.1, 0.01, -0.1]} rotation={[0, 0.8, 0]} geometry={geo_pln_25} material={mat_19} />
      </group>

      {/* ── Missing ceiling tile ── */}
      <mesh position={[0.6, H + 0.02, 1.5]} rotation-x={Math.PI / 2} geometry={geo_pln_26} material={mat_20} />
      {/* Exposed wiring from missing tile */}
      <mesh position={[0.6, H - 0.05, 1.5]} rotation={[0.4, 0.2, 0.5]} geometry={geo_cyl_27} material={mat_21} />

      {/* ── Wet boot prints on floor ── */}
      {/* FIX AUDIT-C6: prints were at X=[-0.05..0.2] inside the carpet runner (X=±0.7)
          which is opaque and at Y=0.004 with polygonOffsetFactor=-1 — prints at Y=0.003
          with factor +1 were hidden UNDER the carpet. Moved prints outside the carpet
          strip (X > 0.7) so they're visible on the bare floor. */}
      {[
        [0.9, 0.003, 2.0], [1.05, 0.003, 1.5], [0.85, 0.003, 1.0], [1.1, 0.003, 0.5],
      ].map((pos, i) => (
        <mesh key={`boot-${i}`} rotation-x={-Math.PI / 2} position={pos as [number, number, number]} geometry={geo_pln_28} material={mat_22} />
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL CORRIDOR DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Peeling wallpaper patches (left wall) ── */}
      {[
        { pos: [-W / 2 + 0.015, 1.5, -3.5] as [number, number, number], rot: 0.1 },
        { pos: [-W / 2 + 0.015, 1.2, 1.5] as [number, number, number], rot: -0.05 },
        { pos: [-W / 2 + 0.015, 1.8, 4.0] as [number, number, number], rot: 0.15 },
      ].map((patch, i) => (
        <group key={`peel-${i}`} position={patch.pos} rotation-y={Math.PI / 2}>
          {/* Exposed wall underneath */}
          <mesh geometry={geo_pln_29} material={mat_23} />
          {/* Peeling wallpaper curling away */}
          <mesh position={[0, 0.08, 0.003]} rotation={[patch.rot, 0.1, 0.05]} geometry={geo_pln_30} material={mat_24} />
        </group>
      ))}

      {/* ── Rusty fuse box (left wall, between graffiti and Zarema's door) ── */}
      {/* FIX P2-CORR-B5: ws22b_corridor_fuse_box promised «Ржавый щиток. Дверца не закрывается.
          Пробки — фарфоровые, довоенные» but no mesh existed and the zone was unreachable
          (d≈1.68 > range 1.3). Box on the wall + ajar door + porcelain plugs; zone lowered
          to [-2.85,1.3,2.5] size [1.0,0.7,0.4] (reachable: d≈1.31 < range 1.5). */}
      <group position={[-W / 2 + 0.07, 1.5, 2.5]} rotation-y={Math.PI / 2}>
        <mesh castShadow geometry={geo_box_66} material={mat_42} />
        {/* ajar door (rotated open to the right) */}
        <mesh position={[0.22, 0, 0.09]} rotation-y={-0.9} geometry={geo_box_67} material={mat_29} />
        {/* porcelain plugs (three whole, two melted look via scale) */}
        {[-0.12, 0, 0.12].map((x, i) => (
          <mesh key={`plug-${i}`} position={[x, 0.18, 0.07]} geometry={geo_cyl_68} material={mat_45} rotation-x={Math.PI / 2} />
        ))}
        {[0, 0.12].map((x, i) => (
          <mesh key={`mplug-${i}`} position={[x, 0.02, 0.07]} geometry={geo_cyl_68} material={mat_28} rotation-x={Math.PI / 2} scale={[1, 0.7, 1]} />
        ))}
        {/* the nail instead of the sixth plug */}
        <mesh position={[-0.12, 0.02, 0.07]} rotation-x={Math.PI / 2} geometry={geo_cyl_46} material={mat_38} />
      </group>

      {/* ── Mailboxes ── */}
      {/* FIX AUDIT-C2: was at Z=4.5, overlapping solnysh door at Z=4.0 (mailbox Z-span
          4.1–4.9 after rotation, door indent Z-span 3.55–4.45 → 35cm overlap, mailbox
          blocked the door). Moved to Z=6.0 (between solnysh door Z=4 and front wall Z=8). */}
      <group position={[W / 2 - 0.15, 0, 6.0]} rotation-y={-Math.PI / 2}>
        {/* Mailbox panel */}
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_31} material={mat_25} />
        {/* Individual mailbox slots */}
        {/* FIX P2-CORR-B1: slot Ys were [0.35,0.1,-0.15,-0.4] relative to the group at Y=0 →
            three of four slots buried in the floor (panel spans Y 0.4..1.6). Re-seated onto
            the panel: [1.4,1.14,0.88,0.62] (top→bottom), «третий сверху» = 0.88 — now visible,
            matching corridor_letter_open and the corridor_mailboxes zone center (y=1.0). */}
        {[1.4, 1.14, 0.88, 0.62].map((y, i) => (
          <group key={`mbox-${i}`}>
            {/* Slot opening */}
            <mesh position={[0, y, 0.08]} geometry={geo_box_32} material={mat_26} />
            {/* Slot nameplate */}
            <mesh position={[0.2, y + 0.06, 0.086]} geometry={geo_box_33} material={mat_27} />
            {/* Keyhole */}
            <mesh position={[-0.25, y, 0.086]} geometry={geo_cyl_34} material={mat_28} />
          </group>
        ))}
      </group>

      {/* ── Intercom panel ── */}
      {/* Moved to Z=6.0 to stay next to the mailboxes (which moved clear of solnysh door). */}
      <group position={[-W / 2 + 0.02, 1.5, 6.0]} rotation-y={Math.PI / 2}>
        <mesh geometry={geo_box_35} material={mat_29} />
        {/* Speaker grille */}
        <mesh position={[0, 0.06, 0.016]} geometry={geo_box_36} material={mat_30} />
        {/* Speaker grille lines */}
        {[-0.03, -0.01, 0.01, 0.03].map((y, i) => (
          <mesh key={`ispk-${i}`} position={[0, 0.06 + y, 0.018]} geometry={geo_box_37} material={mat_31} />
        ))}
        {/* Call button */}
        <mesh position={[0, -0.06, 0.018]} geometry={geo_cyl_38} material={mat_32} />
        {/* Camera lens */}
        <mesh position={[0.04, -0.06, 0.018]} geometry={geo_cyl_39} material={mat_33} />
      </group>

      {/* ── Cracked floor tile ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0.8, 0.004, -2.0]} geometry={geo_pln_40} material={mat_34} />
      {/* Crack line */}
      <mesh rotation-x={-Math.PI / 2} position={[0.8, 0.005, -2.0]} geometry={geo_pln_41} material={mat_35} />
      <mesh rotation-x={-Math.PI / 2} position={[0.75, 0.006, -2.05]} rotation={[0, 0.5, 0]} geometry={geo_pln_42} material={mat_35} />

      {/* ── Mirror on right wall ── */}
      <group position={[W / 2 - 0.02, 1.4, -4.0]} rotation-y={-Math.PI / 2}>
        {/* Frame */}
        <mesh geometry={geo_box_43} material={mat_36} />
        {/* Mirror surface — 10mm in front of frame (was 1mm → z-fight at >5m). */}
        <mesh position={[0, 0, 0.02]} geometry={geo_pln_44} material={mat_37} />
      </group>

      {/* ── Coat hooks on right wall ── */}
      {[-2.5, 0.0, 2.0].map((z, i) => (
        <group key={`whook-${i}`} position={[W / 2 - 0.03, 1.9, z]} rotation-y={-Math.PI / 2}>
          <mesh geometry={geo_cyl_45} material={mat_38} />
          <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]} geometry={geo_cyl_46} material={mat_38} />
        </group>
      ))}
      {/* Scarf hanging from middle hook */}
      <mesh position={[W / 2 - 0.08, 1.5, 0.0]} rotation={[0.1, 0.2, 0.05]} geometry={geo_box_47} material={mat_39} />

      {/* ── Welcome mat at entrance ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, D / 2 - 0.3]} renderOrder={1} geometry={geo_pln_48} material={mat_40} />

      {/* ── Exposed pipe along ceiling (left wall side) ── */}
      <mesh position={[-W / 2 + 0.08, H - 0.08, 0]} castShadow geometry={geo_cyl_49} material={mat_41} />
      {/* Pipe brackets */}
      {[-4.0, -1.0, 2.0, 5.0].map((z, i) => (
        <mesh key={`pbracket-${i}`} position={[-W / 2 + 0.08, H - 0.08, z]} geometry={geo_box_50} material={mat_42} />
      ))}
      {/* Pipe valve */}
      <group position={[-W / 2 + 0.08, H - 0.08, 0.0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={geo_cyl_51} material={mat_43} />
        <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 4]} geometry={geo_box_52} material={mat_44} />
      </group>

      {/* ── Leak stain: ceiling patch + rust streak down the left wall ── */}
      {/* FIX P2-CORR-B2: ws20b_leaky_pipe_stain promised «Ржавое пятно расползлось по потолку»
          but nothing was rendered, and the zone at [-1.0,2.2,-2.0] was unreachable (3D distance
          2.2 > range 1.4) and hung above the street door area. Now: rust patch on the ceiling
          next to the pipe bracket (z=-1.0), streak running down the free wall segment between
          the street door (span to z=-1.525) and the graffiti (from z=-0.1); zone re-seated on
          the streak at [-2.85,1.15,-1.0] (reachable: d≈1.16 < range 1.4). */}
      <mesh position={[-2.5, H - 0.01, -1.0]} rotation-x={Math.PI / 2} geometry={geo_pln_61} material={mat_54} />
      <mesh position={[-W / 2 + 0.015, 1.55, -1.0]} rotation-y={Math.PI / 2} geometry={geo_pln_62} material={mat_55} />

      {/* ── Light switch plate on wall ── */}
      <group position={[-W / 2 + 0.02, 1.2, D / 2 - 0.5]} rotation-y={Math.PI / 2}>
        <mesh geometry={geo_box_53} material={mat_45} />
        {/* Switch toggle */}
        <mesh position={[0, 0.01, 0.006]} geometry={geo_box_54} material={mat_46} />
      </group>

      {/* ── Dust/debris in corners ── */}
      {[
        [W / 2 - 0.3, 0.01, -5.5] as [number, number, number],
        [-W / 2 + 0.3, 0.01, 5.5] as [number, number, number],
      ].map((pos, i) => (
        <mesh key={`dust-${i}`} position={pos} rotation={[0.2 * i, 0.5, 0]} geometry={geo_sph_55} material={mat_47} />
      ))}

      {/* ── Door: Солныш & Лёня (right wall, z=4) — animated ── */}
      <group position={[W / 2 - 0.02, 0, 4.0]}>
        <mesh rotation-y={-Math.PI / 2} geometry={geo_pln_11} material={mat_48} />
        <mesh position={[0.01, 1.1, 0]} rotation-y={-Math.PI / 2} geometry={geo_box_12} material={mat_8} />
        <group position={[0.02, 0, 0.45]} ref={solnyshDoorRef}>
          <mesh position={[0, 1.1, -0.45]} geometry={geo_box_14} material={mat_49} />
          <mesh position={[0, 1.05, -0.08]} geometry={geo_cyl_15} material={mat_10} />
        </group>
      </group>

      {/* ── Door: Зарема & Альберт (left wall, z=4) — animated ── */}
      <group position={[-W / 2 + 0.02, 0, 4.0]}>
        <mesh rotation-y={Math.PI / 2} geometry={geo_pln_11} material={mat_50} />
        <mesh position={[-0.01, 1.1, 0]} rotation-y={Math.PI / 2} geometry={geo_box_12} material={mat_8} />
        <group position={[-0.02, 0, 0.45]} ref={zaremaDoorRef}>
          <mesh position={[0, 1.1, -0.45]} geometry={geo_box_14} material={mat_51} />
          <mesh position={[0, 1.05, -0.08]} geometry={geo_cyl_15} material={mat_10} />
        </group>
      </group>

      {/* ── Additional door: Bathroom (right wall, z=2) — animated ── */}
      <group position={[W / 2 - 0.02, 0, 2.0]}>
        {/* Door indent */}
        <mesh rotation-y={-Math.PI / 2} geometry={geo_pln_56} material={mat_52} />
        {/* Door frame */}
        <mesh position={[0.01, 1.0, 0]} rotation-y={-Math.PI / 2} geometry={geo_box_57} material={mat_8} />
        {/* Door panel — pivoted for animation */}
        <group position={[0.02, 0, 0.35]} ref={bathroomDoorRef}>
          <mesh position={[0, 1.0, -0.35]} geometry={geo_box_58} material={mat_9} />
          <mesh position={[0, 1.0, 0.28 - 0.35]} geometry={geo_cyl_59} material={mat_10} />
        </group>
        {/* Room number */}
        <mesh position={[0.02, 1.8, 0]} rotation-y={-Math.PI / 2} geometry={geo_pln_60} material={mat_53} />
      </group>

      {/* ── Corridor ambient fill — warm overhead ──
          FIX (v4.56): игрок видел кромешную тьму. Три точечных источника
          вдоль коридора вместо одного, физические интенсивности (кд). */}
      <pointLight position={[0, 2.0, 1.5]} color="#ffcc88" intensity={22} distance={14} decay={2} />
      <pointLight position={[0, 2.1, -5.5]} color="#ffb877" intensity={16} distance={11} decay={2} />
      <pointLight position={[0, 2.1, 7.5]} color="#ffbf82" intensity={14} distance={10} decay={2} />

      {/* ── Ambient fill — холодный подсос, чтобы тени не проваливались в черноту ── */}
      <pointLight position={[0, 1.5, 0]} color="#5a5162" intensity={7} distance={16} decay={2} />

      {/* ── Dust particles ── REMOVED: AtmosphericEffects.DustMotes already
          covers volodka_corridor (DUST_SCENES set), so this inline
          <AmbientParticles> was a duplicate — wasted GPU on a second dust
          system + double-density motes. Same FIX-B1 pattern that was caught
          in volodka_room. DustMotes has player-wake response so it wins. */}
    </group>
  );
}

function createCorridorFloorTexture(): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5a4a40';
  ctx.fillRect(0, 0, size, size);

  // Tile pattern
  ctx.strokeStyle = '#4a3a30';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(3, 9);
  return tex;
}

function createCorridorCarpetTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6a3a30';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#5a2a22';
  ctx.lineWidth = 2;
  for (let i = 0; i < size; i += 24) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#8a4a38' : '#4a2218';
    ctx.fillRect(Math.random() * size, Math.random() * size, 8, 8);
  }
  ctx.globalAlpha = 1;

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(1, 8);
  return tex;
}

function createCorridorWallTexture(): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a3540';
  ctx.fillRect(0, 0, size, size);

  // Subtle wear marks
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? '#4a4550' : '#2a2530';
    ctx.fillRect(x, y, Math.random() * 40 + 5, Math.random() * 20 + 5);
  }
  ctx.globalAlpha = 1.0;

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 5);
  return tex;
}
