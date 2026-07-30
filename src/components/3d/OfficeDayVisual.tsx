
/* ─── Volodka RPG – IT Guild Office procedural 3D visual ─── */

import { Suspense, useMemo, type MutableRefObject } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { seededRand } from '@/shared/utils/seededRand';
import { getSharedStandardMaterial, mat } from '@/engine/three/moduleMaterialRegistry';
import { Plant, Radiator, Clock } from './lazyInteriorModels';
import { getEnvironmentLodProfile } from '@/engine/lod/distanceLod';
import { EnvironmentDetail, SceneClutterGate } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createOfficeDayOvercastSkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import {
  getSharedBoxGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { INTERIOR_SHELL_MODELS } from '../../config/interiorShellModels';
import { AuthoredInteriorShell } from './AuthoredInteriorShell';
import { POLYHAVEN_MODELS } from '@/config/polyhavenAssets';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { getInteriorShellScale } from '@/config/interiorShellScale';

interface OfficeDayVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Sterile corporate IT office (14×12m) — CyberPunk2077/Bank aesthetic */
const mat_1 = getSharedStandardMaterial({ color: '#4a4a5a', roughness: 0.4 });
const mat_2 = getSharedStandardMaterial({ color: '#3a3a4a', roughness: 0.7 });
const mat_3 = getSharedStandardMaterial({ color: '#001a22', emissive: '#0088aa', emissiveIntensity: 0.6 });
const mat_4 = getSharedStandardMaterial({ color: '#4a4a5a', metalness: 0.6, roughness: 0.3 });
const mat_5 = getSharedStandardMaterial({ color: '#d0d0d0', metalness: 0.3, roughness: 0.4 });
const mat_6 = getSharedStandardMaterial({ color: '#a0d0e0', transparent: true, opacity: 0.5, roughness: 0.1, depthWrite: false });
const mat_7 = getSharedStandardMaterial({ color: '#e8e0d8', roughness: 0.5 });
const mat_8 = getSharedStandardMaterial({ color: '#2a2a2a', roughness: 0.5 });
const mat_9 = getSharedStandardMaterial({ color: '#8a4a4a', roughness: 0.6 });
const mat_10 = getSharedStandardMaterial({ color: '#e8e8e8', roughness: 0.3 });
const mat_11 = getSharedStandardMaterial({ color: '#cc2222', roughness: 0.9 });
const mat_12 = getSharedStandardMaterial({ color: '#2222cc', roughness: 0.9 });
const mat_13 = getSharedStandardMaterial({ color: '#22aa22', roughness: 0.9 });
const mat_14 = getSharedStandardMaterial({ color: '#e8e4dc', roughness: 0.9 });
const mat_15 = getSharedStandardMaterial({ color: '#f0ece4', roughness: 0.9 });
const mat_16 = getSharedStandardMaterial({ color: '#00ff44', emissive: '#00ff44', emissiveIntensity: 2.0 });
const mat_17 = getSharedStandardMaterial({ color: '#5a5a6a', roughness: 0.8 });
const mat_18 = getSharedStandardMaterial({ color: '#4a4a5a', metalness: 0.3, roughness: 0.5 });
const mat_19 = getSharedStandardMaterial({ color: '#e0e0e0', roughness: 0.6 });
const mat_20 = getSharedStandardMaterial({ color: '#ccc', roughness: 0.5 });
const mat_21 = getSharedStandardMaterial({ color: '#bbb', roughness: 0.5 });
const mat_22 = getSharedStandardMaterial({ color: '#f0f0f0', roughness: 0.9 });
const mat_23 = getSharedStandardMaterial({ color: '#00aa00', emissive: '#00aa00', emissiveIntensity: 2.0 });
const mat_24 = getSharedStandardMaterial({ color: '#f0f0f0', roughness: 0.4 });
const mat_25 = getSharedStandardMaterial({ color: '#4a4a5a', metalness: 0.5, roughness: 0.4 });
const mat_26 = getSharedStandardMaterial({ color: '#1a1a1a' });
const mat_27 = getSharedStandardMaterial({ color: '#aa2222' });
const mat_28 = getSharedStandardMaterial({ color: '#8a6a3a', roughness: 0.9 });
const mat_29 = getSharedStandardMaterial({ color: '#4a4a5a', roughness: 0.5 });
const mat_30 = getSharedStandardMaterial({ color: '#3a3a4a', metalness: 0.5, roughness: 0.4 });
const mat_31 = getSharedStandardMaterial({ color: '#2a2a2e', metalness: 0.4, roughness: 0.5 });
const mat_32 = getSharedStandardMaterial({ color: '#003300', emissive: '#00aa44', emissiveIntensity: 1.0 });
const mat_33 = getSharedStandardMaterial({ color: '#f0e8e0', roughness: 0.5 });
const mat_34 = getSharedStandardMaterial({ color: '#ffffff', roughness: 0.6 });
const mat_35 = getSharedStandardMaterial({ color: '#2a2a30', metalness: 0.4, roughness: 0.6 });
const mat_36 = getSharedStandardMaterial({ color: '#1a1a1a', roughness: 0.7 });
const mat_37 = getSharedStandardMaterial({ color: '#8b2020', roughness: 0.7 });
const mat_38 = getSharedStandardMaterial({ color: '#2a2a2a', roughness: 0.8 });
const mat_39 = getSharedStandardMaterial({ color: '#1a1a1a', roughness: 0.6 });
const mat_40 = getSharedStandardMaterial({ color: '#001133', emissive: '#4466aa', emissiveIntensity: 0.8 });
const mat_41 = getSharedStandardMaterial({ color: '#c0c8d0', roughness: 0.8 });
const mat_42 = getSharedStandardMaterial({ color: '#b0b8c0', roughness: 0.7 });
const mat_43 = getSharedStandardMaterial({ color: '#003300', emissive: '#00aa00', emissiveIntensity: 1.5 });
const mat_44 = getSharedStandardMaterial({ color: '#001122', emissive: '#4488ff', emissiveIntensity: 1.0 });
const mat_45 = getSharedStandardMaterial({ color: '#333', metalness: 0.6 });
const mat_46 = getSharedStandardMaterial({ color: '#2a2a3a', roughness: 0.7 });
const mat_47 = getSharedStandardMaterial({ color: '#2a2a30', metalness: 0.7, roughness: 0.3 });
const mat_48 = getSharedStandardMaterial({ color: '#3a3a40', metalness: 0.5, roughness: 0.4 });
const mat_49 = getSharedStandardMaterial({ color: '#ff2244', emissive: '#ff2244', emissiveIntensity: 2.0 });
const mat_50 = getSharedStandardMaterial({ color: '#00ff44', emissive: '#00ff44', emissiveIntensity: 1.5 });
const mat_51 = getSharedStandardMaterial({ color: '#6a4a30', roughness: 0.8 });
const mat_52 = getSharedStandardMaterial({ color: '#4a5a2a', roughness: 0.9 });
const mat_53 = getSharedStandardMaterial({ color: '#3a4a1a', roughness: 0.9 });
const mat_glass = getSharedStandardMaterial({
  color: '#b0c0d0',
  transparent: true,
  opacity: 0.25,
  metalness: 0.1,
  roughness: 0.05,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
const mat_light_housing = getSharedStandardMaterial({ color: '#aab2bc', metalness: 0.3, roughness: 0.6 });
const mat_light_tube = getSharedStandardMaterial({
  color: '#e8f0f8',
  emissive: '#f4faff',
  emissiveIntensity: 1.6,
});
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;
const KENNEY_TERMINAL_MODEL = '/models/props/terminal.glb';

/** Desk slots kept when authored shell + GLB dressing replace the full procedural grid. */
const OFFICE_HERO_DESK_POSITIONS: readonly [number, number, number][] = [
  [-4.5, 0, -3.5],
  [-1.5, 0, -1.0],
  [-1.5, 0, 1.5],
  [1.5, 0, -3.5],
  [1.5, 0, 1.5],
  [4.5, 0, -1.0],
];

function cloneOfficeAsset(source: THREE.Object3D, castShadow: boolean): THREE.Object3D {
  const clone = source.clone(true);
  clone.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of mats) {
        if (material && 'envMapIntensity' in material) {
          const standard = material as THREE.MeshStandardMaterial;
          standard.envMapIntensity = 0.72;
          if (typeof standard.roughness === 'number') {
            standard.roughness = Math.min(1, Math.max(0.42, standard.roughness));
          }
        }
      }
    }
  });
  return clone;
}

function AuthoredOfficeProp({
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
  const scene = useMemo(() => cloneOfficeAsset(gltf.scene, castShadow), [gltf.scene, castShadow]);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function AuthoredOfficeDesk({ castShadow }: { castShadow: boolean }) {
  return (
    <group>
      <Suspense fallback={null}>
        <AuthoredOfficeProp
          url={POLYHAVEN_MODELS.paintedWoodenTable}
          position={[0, 0, 0]}
          rotationY={Math.PI / 2}
          scale={0.58}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredOfficeProp
          url={KENNEY_TERMINAL_MODEL}
          position={[0, 0.8, -0.22]}
          scale={1.08}
          castShadow={castShadow}
        />
      </Suspense>
      <Suspense fallback={null}>
        <AuthoredOfficeProp
          url={POLYHAVEN_MODELS.armChair}
          position={[0, 0, 0.68]}
          rotationY={Math.PI}
          scale={0.52}
          castShadow={castShadow}
        />
      </Suspense>
    </group>
  );
}

export function OfficeDayVisual({ livePlayerPositionRef }: OfficeDayVisualProps) {
  const { preset } = useGraphicsQuality();
  const glbDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  const useAuthoredShell = !preset.visualLite;
  const useAuthoredDesks = !preset.visualLite && glbDressing;
  const useSparseDeskGrid = (useAuthoredShell && useAuthoredDesks) || !glbDressing;
  const hideProceduralDeskGrid = useSparseDeskGrid;
  const deskPositions = useSparseDeskGrid
    ? OFFICE_HERO_DESK_POSITIONS
    : ([
        [-4.5, 0, -3.5],
        [-4.5, 0, -1.0],
        [-4.5, 0, 1.5],
        [-1.5, 0, -3.5],
        [-1.5, 0, -1.0],
        [-1.5, 0, 1.5],
        [1.5, 0, -3.5],
        [1.5, 0, -1.0],
        [1.5, 0, 1.5],
        [4.5, 0, -3.5],
        [4.5, 0, -1.0],
        [4.5, 0, 1.5],
      ] as const);
  const floorTexture = useCachedCanvasTexture('office_day:floor', createOfficeFloorTexture);
  const wallTexture = useCachedCanvasTexture('office_day:wall', createOfficeWallTexture);
  const ceilingWashTexture = useCachedCanvasTexture(
    'office_day:overcast-ceiling',
    createOfficeDayOvercastSkyTexture,
  );
  const envProfile = useMemo(() => getEnvironmentLodProfile('office_day'), []);

  const mat_floor = useMemo(
    () =>
      getSharedStandardMaterial({
        map: floorTexture,
        color: '#c8d0d8',
        roughness: 0.6,
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
        color: '#c8d4e0',
        emissive: '#a0b8d0',
        emissiveIntensity: 0.22,
        roughness: 0.95,
      }),
    [ceilingWashTexture],
  );
  const mat_wall = useMemo(
    () => getSharedStandardMaterial({ map: wallTexture, color: '#d0d8e0', roughness: 0.7 }),
    [wallTexture],
  );

  const W = 14;
  const D = 12;
  const H = 3.2;

  // Shared geometry/materials for the ceiling light panel grid (12 panels)
  const lightPanel = useMemo(() => {
    const housingGeo = getSharedBoxGeometry(2.4, 0.06, 0.34);
    const tubeGeo = getSharedBoxGeometry(2.3, 0.03, 0.1);
    const positions: [number, number][] = [];
    for (const x of [-4.5, -1.5, 1.5, 4.5]) {
      for (const z of [-3.5, 0, 3.5]) positions.push([x, z]);
    }
    return { housingGeo, tubeGeo, positions };
  }, []);

  const glassMat = mat_glass;

  return (
    <group>
      {useAuthoredShell ? (
        <AuthoredInteriorShell
          sceneId="office_day"
          url={INTERIOR_SHELL_MODELS.office}
          scale={getInteriorShellScale('office', [W, H, D])}
          castShadow={preset.shadows}
        />
      ) : (
        <>
          {/* ── Floor ── */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)} material={mat_floor} />

          {/* ── Ceiling — procedural overcast HDR wash ── */}
          <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)} material={mat_ceiling} />

          {/* ── Walls ── */}
          <mesh position={[0, H / 2, -D / 2]} geometry={getSharedPlaneGeometry(W, H)} material={mat_wall} />
          <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI} geometry={getSharedPlaneGeometry(W, H)} material={mat_wall} />
          <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2} geometry={getSharedPlaneGeometry(D, H)} material={mat_wall} />
          <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={getSharedPlaneGeometry(D, H)} material={mat_wall} />
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ROWS OF DESKS WITH MONITORS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {deskPositions.map((position) => (
        <OfficeDesk
          key={`desk-${position[0]}-${position[2]}`}
          position={[position[0], position[1], position[2]]}
          authored={useAuthoredDesks}
          castShadow={preset.shadows}
        />
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SERVER RACKS (back wall) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <ServerRack position={[-5.5, 0, -5.5]} />
      <ServerRack position={[-4.0, 0, -5.5]} />
      <ServerRack position={[4.0, 0, -5.5]} />
      <ServerRack position={[5.5, 0, -5.5]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── GLASS MEETING ROOM (front-right) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[4.5, 0, 4.0]}>
        {/* Glass walls — renderOrder + depthWrite/polygonOffset to avoid z-fighting */}
        <mesh position={[0, H / 2, -1.5]} renderOrder={2} material={glassMat}>
          <boxGeometry args={[3.0, H, 0.05]} />
        </mesh>
        {/* Offset second glass wall slightly along shared edge to prevent corner z-fighting */}
        <mesh position={[1.5, H / 2, -0.005]} renderOrder={2} material={glassMat}>
          <boxGeometry args={[0.05, H, 3.0]} />
        </mesh>
        {/* Conference table */}
        <mesh position={[0, 0.4, 0]} castShadow material={mat_1}>
          <boxGeometry args={[2.0, 0.05, 1.0]} /></mesh>
        {/* Chairs around table */}
        {[-0.7, 0, 0.7].map((z, i) => (
          <mesh key={i} position={[-0.6, 0.25, z]} material={mat_2}>
            <boxGeometry args={[0.4, 0.05, 0.4]} /></mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CORPORATE LOGO WALL (back center) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 2.0, -D / 2 + 0.05]}>
        <mesh material={mat_3}>
          <boxGeometry args={[2.0, 0.5, 0.05]} /></mesh>
        {/* Logo frame */}
        <mesh position={[0, 0, 0.01]} material={mat_4}>
          <boxGeometry args={[2.2, 0.7, 0.02]} /></mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WATER COOLER (front-left) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail minLod="standard" position={[-5.5, 0, 4.0]}>
        <SceneClutterGate
          livePlayerPositionRef={livePlayerPositionRef}
          position={[-5.5, 0, 4.0]}
          maxDistance={envProfile.clutterDistance}
        >
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow material={mat_5}>
              <boxGeometry args={[0.4, 1.2, 0.4]} /></mesh>
            <mesh position={[0, 1.4, 0]} material={mat_6}>
              <cylinderGeometry args={[0.15, 0.18, 0.4, 8]} /></mesh>
          </group>
        </SceneClutterGate>
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── POTTED PLANTS (dying) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail minLod="standard" position={[-6.5, 0, -2.0]}>
        {([
          [-6.5, 0, -2.0],
          [6.5, 0, -2.0],
          [-6.5, 0, 3.0],
        ] as const).map(([x, y, z]) => (
          <SceneClutterGate
            key={`plant-${x}-${z}`}
            livePlayerPositionRef={livePlayerPositionRef}
            position={[x, y, z]}
            maxDistance={envProfile.decorativeDistance}
          >
            <DyingPlant position={[0, 0, 0]} />
          </SceneClutterGate>
        ))}
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CEILING FLUORESCENT PANEL GRID ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Emissive-only meshes — scene lighting already comes from point lights */}
      {lightPanel.positions.map(([x, z], i) => (
        <group key={`flpanel-${i}`} position={[x, H - 0.04, z]}>
          {/* Recessed housing frame */}
          <mesh geometry={lightPanel.housingGeo} material={mat_light_housing} />
          {/* Twin glowing tube strips */}
          <mesh geometry={lightPanel.tubeGeo} material={mat_light_tube} position={[0, -0.025, -0.08]} />
          <mesh geometry={lightPanel.tubeGeo} material={mat_light_tube} position={[0, -0.025, 0.08]} />
        </group>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Harsh white overhead */}
      <pointLight position={[0, 2.8, 0]} color="#e0e8f0" intensity={3.5} distance={16} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} shadow-normalBias={0.04} />

      {/* Blue monitor glow */}
      <pointLight position={[-3, 1.2, -1.0]} color="#4488ff" intensity={2.0} distance={8} />

      {/* Server rack red LEDs */}
      <pointLight position={[5.0, 1.0, -5.5]} color="#ff2244" intensity={1.0} distance={6} />

      {/* Meeting room light */}
      <pointLight position={[4.5, 2.5, 4.0]} color="#ffffff" intensity={1.5} distance={6} />

      {/* Corporate logo glow */}
      <pointLight position={[0, 2.0, -5.5]} color="#0088aa" intensity={1.2} distance={7} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Post-it notes on cubicle dividers ── */}
      {useMemo(() => {
        const rotations = [[-3.5, 1.2, -3.5], [-1.5, 1.15, -1.0], [1.5, 1.18, 1.5], [4.5, 1.22, -3.5]].map(
          (_, i) => [0, seededRand(i + 500) * 0.3 - 0.15, 0.05] as [number, number, number],
        );
        const colors = ['#ffdd44', '#ff8888', '#88ddff', '#88ff88'];
        return [[-3.5, 1.2, -3.5], [-1.5, 1.15, -1.0], [1.5, 1.18, 1.5], [4.5, 1.22, -3.5]].map((pos, i) => (
          <mesh key={`postit-${i}`} position={pos as [number, number, number]} rotation={rotations[i]} material={mat(colors[i], { roughness: 0.9, side: THREE.DoubleSide })}>
            <planeGeometry args={[0.05, 0.05]} /></mesh>
        ));
      }, [])}

      {/* ── Coffee mug graveyard on desk ── */}
      <group position={[-4.5, 0, -3.5]}>
        <mesh position={[0.4, 0.78, 0.2]} material={mat_7}>
          <cylinderGeometry args={[0.035, 0.03, 0.08, 8]} /></mesh>
        <mesh position={[0.35, 0.78, 0.25]} material={mat_8}>
          <cylinderGeometry args={[0.03, 0.025, 0.07, 8]} /></mesh>
        <mesh position={[0.45, 0.76, 0.15]} rotation={[0.2, 0, 0.3]} material={mat_9}>
          <cylinderGeometry args={[0.03, 0.025, 0.07, 8]} /></mesh>
      </group>

      {/* ── Whiteboard with writing ── */}
      <group position={[-W / 2 + 0.02, 1.8, 0]} rotation-y={Math.PI / 2}>
        <mesh material={mat_10}>
          <planeGeometry args={[2.0, 1.2]} /></mesh>
        {/* Colored marker lines */}
        <mesh position={[0, 0.2, 0.01]} material={mat_11}>
          <planeGeometry args={[1.2, 0.03]} /></mesh>
        <mesh position={[-0.3, -0.1, 0.01]} material={mat_12}>
          <planeGeometry args={[0.8, 0.03]} /></mesh>
        <mesh position={[0.1, -0.4, 0.01]} material={mat_13}>
          <planeGeometry args={[0.5, 0.03]} /></mesh>
      </group>

      {/* ── Paper stack on desk ── */}
      <group position={[1.5, 0, 1.5]}>
        <mesh position={[0.5, 0.76, 0.25]} rotation={[0, 0.05, 0]} material={mat_14}>
          <boxGeometry args={[0.15, 0.015, 0.2]} /></mesh>
        <mesh position={[0.5, 0.77, 0.25]} rotation={[0, -0.02, 0.01]} material={mat_15}>
          <boxGeometry args={[0.14, 0.01, 0.19]} /></mesh>
      </group>

      {/* ── Server blinking lights (additional tiny emissive cubes) ── */}
      {[0.5, 0.9, 1.3, 1.7].map((y, i) => (
        <mesh key={`srv-blink-${i}`} position={[5.9, y, -5.19]} material={mat_16}>
          <boxGeometry args={[0.015, 0.015, 0.01]} /></mesh>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL OFFICE DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Cubicle dividers between desk rows ── */}
      {!hideProceduralDeskGrid
        ? [
            { pos: [-3.0, 0, -2.25] as [number, number, number], rot: 0 },
            { pos: [-3.0, 0, 0.25] as [number, number, number], rot: 0 },
            { pos: [3.0, 0, -2.25] as [number, number, number], rot: 0 },
            { pos: [3.0, 0, 0.25] as [number, number, number], rot: 0 },
            { pos: [-1.5, 0, -2.25] as [number, number, number], rot: 0 },
            { pos: [1.5, 0, -2.25] as [number, number, number], rot: 0 },
          ].map((div, i) => (
            <group key={`divider-${i}`} position={div.pos} rotation={[0, div.rot, 0]}>
              <mesh position={[0, 0.75, 0]} castShadow material={mat_17}>
                <boxGeometry args={[1.4, 0.8, 0.03]} /></mesh>
              <mesh position={[0, 1.16, 0]} material={mat_18}>
                <boxGeometry args={[1.42, 0.025, 0.035]} /></mesh>
            </group>
          ))
        : null}

      {/* ── Printer/copier in corner ── */}
      <group position={[-6.0, 0, 2.0]}>
        {/* Printer body */}
        <mesh position={[0, 0.35, 0]} castShadow material={mat_19}>
          <boxGeometry args={[0.5, 0.7, 0.5]} /></mesh>
        {/* Paper tray top */}
        <mesh position={[0, 0.72, 0.15]} material={mat_20}>
          <boxGeometry args={[0.4, 0.02, 0.25]} /></mesh>
        {/* Paper output tray */}
        <mesh position={[0, 0.5, 0.28]} material={mat_21}>
          <boxGeometry args={[0.35, 0.01, 0.15]} /></mesh>
        {/* Paper sheet in output */}
        <mesh position={[0, 0.52, 0.28]} rotation={[0, 0.05, 0]} material={mat_22}>
          <boxGeometry args={[0.18, 0.003, 0.12]} /></mesh>
        {/* Status LED */}
        <mesh position={[0.2, 0.55, 0.26]} material={mat_23}>
          <sphereGeometry args={[0.008, 4, 4]} /></mesh>
      </group>

      {/* ── Wall clock (back wall) ── */}
      <group position={[0, 2.8, -D / 2 + 0.05]}>
        {/* Clock face */}
        <mesh material={mat_24}>
          <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} /></mesh>
        {/* Clock frame */}
        <mesh position={[0, 0, 0.01]} material={mat_25}>
          <torusGeometry args={[0.2, 0.015, 8, 24]} /></mesh>
        {/* Hour hand */}
        <mesh position={[0, 0, 0.02]} rotation={[0, 0, -Math.PI / 3]} material={mat_26}>
          <boxGeometry args={[0.1, 0.012, 0.005]} /></mesh>
        {/* Minute hand */}
        <mesh position={[0, 0, 0.025]} rotation={[0, 0, -Math.PI / 6]} material={mat_26}>
          <boxGeometry args={[0.14, 0.008, 0.005]} /></mesh>
        {/* Center dot */}
        <mesh position={[0, 0, 0.03]} material={mat_27}>
          <sphereGeometry args={[0.008, 6, 6]} /></mesh>
      </group>

      {/* ── Bulletin board on right wall ── */}
      <group position={[W / 2 - 0.02, 1.8, 3.0]} rotation-y={-Math.PI / 2}>
        {/* Board */}
        <mesh material={mat_28}>
          <boxGeometry args={[1.2, 0.9, 0.03]} /></mesh>
        {/* Pinned papers */}
        {[-0.3, 0.0, 0.25].map((x, i) => (
          <mesh key={`pin-paper-${i}`} position={[x, 0.1 - i * 0.12, 0.02]} rotation={[0, 0.1 - i * 0.05, 0]} material={mat(['#e8e4dc', '#f0ece4', '#ddd8cc'][i], { roughness: 0.9 })}>
            <boxGeometry args={[0.2, 0.15, 0.002]} /></mesh>
        ))}
        {/* Push pins */}
        {[-0.3, 0.0, 0.25].map((x, i) => (
          <mesh key={`pin-${i}`} position={[x, 0.17 - i * 0.12, 0.03]} material={mat(['#ff3333', '#3366ff', '#ffcc00'][i])}>
            <sphereGeometry args={[0.008, 4, 4]} /></mesh>
        ))}
      </group>

      {/* ── Coffee station area ── */}
      <group position={[-5.5, 0, 4.5]}>
        {/* Small counter/table */}
        <mesh position={[0, 0.4, 0]} castShadow material={mat_29}>
          <boxGeometry args={[0.8, 0.04, 0.5]} /></mesh>
        {/* Counter legs */}
        {[-0.35, 0.35].map((x, i) => (
          <mesh key={`cleg-${i}`} position={[x, 0.2, 0]} material={mat_30}>
            <boxGeometry args={[0.04, 0.4, 0.04]} /></mesh>
        ))}
        {/* Coffee machine */}
        <mesh position={[-0.15, 0.6, 0]} castShadow material={mat_31}>
          <boxGeometry args={[0.2, 0.25, 0.2]} /></mesh>
        {/* Coffee machine display */}
        <mesh position={[-0.15, 0.65, 0.105]} material={mat_32}>
          <boxGeometry args={[0.1, 0.05, 0.005]} /></mesh>
        {/* Mug collection on counter */}
        <mesh position={[0.15, 0.46, 0.05]} material={mat_7}>
          <cylinderGeometry args={[0.03, 0.025, 0.07, 8]} /></mesh>
        <mesh position={[0.25, 0.46, -0.05]} material={mat_33}>
          <cylinderGeometry args={[0.028, 0.024, 0.065, 8]} /></mesh>
        {/* Sugar bowl */}
        <mesh position={[0.05, 0.44, -0.12]} material={mat_34}>
          <cylinderGeometry args={[0.035, 0.03, 0.05, 8]} /></mesh>
      </group>

      {/* ── Umbrella stand near entrance ── */}
      <group position={[6.0, 0, 5.0]}>
        <mesh position={[0, 0.25, 0]} castShadow material={mat_35}>
          <cylinderGeometry args={[0.12, 0.1, 0.5, 8]} /></mesh>
        {/* Umbrella handles sticking out */}
        <mesh position={[0.03, 0.55, 0]} rotation={[0.15, 0, 0.1]} material={mat_36}>
          <cylinderGeometry args={[0.008, 0.008, 0.5, 4]} /></mesh>
        <mesh position={[-0.04, 0.5, 0.02]} rotation={[-0.1, 0.3, -0.08]} material={mat_37}>
          <cylinderGeometry args={[0.006, 0.006, 0.45, 4]} /></mesh>
      </group>

      {/* ── Headphones on desk ── */}
      <group position={[-1.5, 0, -1.0]}>
        {/* Headband */}
        <mesh position={[0.55, 0.85, 0.15]} rotation={[0, 0, 0]} material={mat_36}>
          <torusGeometry args={[0.06, 0.006, 4, 12, Math.PI]} /></mesh>
        {/* Left ear cup */}
        <mesh position={[0.49, 0.8, 0.15]} rotation={[0, Math.PI / 2, 0]} material={mat_38}>
          <cylinderGeometry args={[0.03, 0.03, 0.025, 8]} /></mesh>
        {/* Right ear cup */}
        <mesh position={[0.61, 0.8, 0.15]} rotation={[0, Math.PI / 2, 0]} material={mat_38}>
          <cylinderGeometry args={[0.03, 0.03, 0.025, 8]} /></mesh>
      </group>

      {/* ── More sticky notes cluster on divider ── */}
      {!hideProceduralDeskGrid
        ? [
        { pos: [-3.0, 1.0, -2.2] as [number, number, number], color: '#ffff88', rot: 0.1 },
        { pos: [-3.0, 1.15, -2.2] as [number, number, number], color: '#ffaaaa', rot: -0.05 },
        { pos: [-3.0, 1.05, -2.3] as [number, number, number], color: '#aaffaa', rot: 0.15 },
        { pos: [3.0, 1.1, -2.2] as [number, number, number], color: '#88ddff', rot: -0.1 },
        { pos: [3.0, 0.95, -2.3] as [number, number, number], color: '#ffdd44', rot: 0.08 },
      ].map((note, i) => (
        <mesh key={`extra-postit-${i}`} position={note.pos} rotation={[0, 0, note.rot]} material={mat(note.color, { roughness: 0.9, side: THREE.DoubleSide })}>
          <planeGeometry args={[0.06, 0.06]} /></mesh>
      ))
        : null}

      {/* ── Phone on desk ── */}
      <group position={[1.5, 0, -3.5]}>
        <mesh position={[-0.45, 0.76, -0.2]} material={mat_39}>
          <boxGeometry args={[0.06, 0.008, 0.12]} /></mesh>
        {/* Phone screen */}
        <mesh position={[-0.45, 0.765, -0.2]} material={mat_40}>
          <boxGeometry args={[0.05, 0.003, 0.08]} /></mesh>
      </group>

      {/* ── Ceiling vent ── */}
      <group position={[5.0, H - 0.02, 2.0]} rotation-x={Math.PI / 2}>
        <mesh material={mat_41}>
          <planeGeometry args={[0.6, 0.3]} /></mesh>
        {/* Vent slats */}
        {[-0.1, -0.03, 0.04, 0.11].map((y, i) => (
          <mesh key={`vent-${i}`} position={[0, y, 0.001]} material={mat_42}>
            <boxGeometry args={[0.55, 0.015, 0.003]} /></mesh>
        ))}
      </group>

      {/* ── Emergency exit sign ── */}
      <group position={[6.5, 2.6, 5.5]} rotation-y={-Math.PI / 4}>
        <mesh material={mat_43}>
          <boxGeometry args={[0.3, 0.12, 0.03]} /></mesh>
        {/* Sign light spill */}
        <pointLight position={[0, -0.2, 0.3]} color="#00aa00" intensity={0.5} distance={3} />
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERIOR MODELS (from InteriorModels.tsx) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Radiator on right wall ── */}
      <Radiator position={[W / 2 - 0.06, 0.3, -3.0]} rotation={[0, -Math.PI / 2, 0]} color="#c0c0c0" />

      {/* ── Radiator on left wall ── */}
      <Radiator position={[-W / 2 + 0.06, 0.3, 1.0]} rotation={[0, Math.PI / 2, 0]} color="#c0c0c0" />

      {/* ── Additional healthy plants in meeting room ── */}
      <Plant position={[5.5, 0, 2.5]} color="#2a6a20" scale={[1.4, 1.4, 1.4]} />

      {/* ── Additional plant in entrance area ── */}
      <Plant position={[-6.5, 0, 5.0]} color="#308028" scale={[1.2, 1.2, 1.2]} />

      {/* ── Wall clock on front wall ── */}
      <Clock position={[3.0, 2.5, D / 2 - 0.05]} rotation={[0, Math.PI, 0]} color="#e8e8e8" />
    </group>
  );
}

/** Office desk with emissive blue monitor */
function OfficeDesk({
  position,
  authored,
  castShadow,
}: {
  position: [number, number, number];
  authored: boolean;
  castShadow: boolean;
}) {
  if (authored) {
    return (
      <group position={position}>
        <AuthoredOfficeDesk castShadow={castShadow} />
      </group>
    );
  }

  return (
    <group position={position}>
      {/* Desk top */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow material={mat_29}>
        <boxGeometry args={[1.4, 0.04, 0.7]} /></mesh>
      {/* Leg panel left */}
      <mesh position={[-0.65, 0.35, 0]} material={mat_30}>
        <boxGeometry args={[0.04, 0.7, 0.65]} /></mesh>
      {/* Leg panel right */}
      <mesh position={[0.65, 0.35, 0]} material={mat_30}>
        <boxGeometry args={[0.04, 0.7, 0.65]} /></mesh>
      {/* Monitor */}
      <mesh position={[0, 1.1, -0.15]} material={mat_44}>
        <boxGeometry args={[0.55, 0.35, 0.03]} /></mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.85, -0.15]} material={mat_45}>
        <boxGeometry args={[0.06, 0.12, 0.06]} /></mesh>
      {/* Keyboard */}
      <mesh position={[0, 0.75, 0.15]} material={mat_26}>
        <boxGeometry args={[0.35, 0.015, 0.12]} /></mesh>
      {/* Mouse */}
      <mesh position={[0.3, 0.75, 0.15]} material={mat_26}>
        <boxGeometry args={[0.06, 0.015, 0.1]} /></mesh>
      {/* Chair */}
      <group position={[0, 0, 0.6]}>
        <mesh position={[0, 0.42, 0]} castShadow material={mat_46}>
          <boxGeometry args={[0.45, 0.04, 0.45]} /></mesh>
        <mesh position={[0, 0.7, -0.2]} castShadow material={mat_46}>
          <boxGeometry args={[0.45, 0.45, 0.04]} /></mesh>
      </group>
    </group>
  );
}

/** Server rack with blinking LEDs */
function ServerRack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main rack body */}
      <mesh position={[0, 1.0, 0]} castShadow material={mat_47}>
        <boxGeometry args={[0.8, 2.0, 0.6]} /></mesh>
      {/* Server units */}
      {[0.3, 0.7, 1.1, 1.5, 1.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0.31]} material={mat_48}>
          <boxGeometry args={[0.7, 0.12, 0.01]} /></mesh>
      ))}
      {/* LED indicators (red dots) */}
      {[0.3, 0.7, 1.1].map((y, i) => (
        <mesh key={`led-${i}`} position={[0.3, y + 0.04, 0.32]} material={mat_49}>
          <boxGeometry args={[0.02, 0.02, 0.01]} /></mesh>
      ))}
      {/* Green status LED */}
      <mesh position={[-0.3, 1.84, 0.32]} material={mat_50}>
        <boxGeometry args={[0.02, 0.02, 0.01]} /></mesh>
    </group>
  );
}

/** Dying potted plant */
function DyingPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow material={mat_51}>
        <cylinderGeometry args={[0.18, 0.15, 0.4, 8]} /></mesh>
      {/* Dying stems */}
      <mesh position={[0, 0.5, 0]} material={mat_52}>
        <cylinderGeometry args={[0.01, 0.015, 0.3, 4]} /></mesh>
      <mesh position={[0.05, 0.55, 0.03]} rotation={[0.2, 0, 0.3]} material={mat_53}>
        <cylinderGeometry args={[0.008, 0.01, 0.2, 4]} /></mesh>
      {/* Few sad leaves */}
      <mesh position={[0, 0.65, 0]} material={mat_53}>
        <sphereGeometry args={[0.08, 6, 6]} /></mesh>
    </group>
  );
}

function createOfficeFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Light tile base
  ctx.fillStyle = '#c8d0d8';
  ctx.fillRect(0, 0, size, size);

  // Grid tile pattern
  ctx.strokeStyle = '#b0b8c0';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }

  // Subtle scuff marks
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#888';
    ctx.fillRect(x, y, Math.random() * 30 + 5, 2);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 6);
  return tex;
}

function createOfficeWallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Clean white wall
  ctx.fillStyle = '#d0d8e0';
  ctx.fillRect(0, 0, size, size);

  // Subtle panel lines
  ctx.strokeStyle = '#c0c8d0';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < size; i += 128) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

useGLTF.preload(POLYHAVEN_MODELS.paintedWoodenTable, true, true, extendLoader);
useGLTF.preload(POLYHAVEN_MODELS.armChair, true, true, extendLoader);
useGLTF.preload(KENNEY_TERMINAL_MODEL, true, true, extendLoader);
