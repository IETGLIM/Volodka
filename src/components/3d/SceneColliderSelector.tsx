
/* ─── Volodka RPG – Scene collider selector ───
 *
 *  Architecture (M7 — lightweight physics colliders):
 *  ─────────────
 *  1. Visual scene meshes → render-only (NO trimesh colliders).
 *     Full visual geometry (50–100+ meshes per scene) previously generated
 *     dense Rapier trimesh colliders (~2k–8k triangles). Visuals stay in MIDGROUND
 *     for rendering; physics uses simplified proxies instead.
 *
 *  2. SceneDefinition cuboids → walls, obstacles, ceilings from sceneDefinitions.ts
 *     → Cached per sceneId via useMemo; ~8–20 cuboids per scene vs 50–100 trimeshes
 *
 *  3. Structural colliders → thick floor + boundary walls from SceneConfig
 *     → Prevents tunneling; footstep material via fs: name prefix
 *
 *  4. Foreground decorative meshes → never collided (parallax layer only)
 */

import { Suspense, useRef, useMemo, useEffect, type ComponentType } from 'react';
import { retryLazy } from '@/shared/utils/retryLazy';
import { importWithSceneGpuRegistration } from '@/engine/three/importWithSceneGpuRegistration';
import { CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import {
  generateColliders,
  generateBoundaryWallSegments,
  STRUCTURAL_FLOOR_HALF_HEIGHT,
} from '@/config/sceneDefinitionGenerator';
import type { ColliderDef } from '@/shared/types/sceneDefinition';
import { SceneLayer, LayeredForeground } from './VisualizationLayers';
import { CameraCollisionProxies } from './CameraCollisionProxies';
import { EnvironmentLodProvider } from './lod/EnvironmentLodProvider';
import type { SceneId } from '@/shared/types/game';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useThreeCleanup } from '@/hooks/useThreeCleanup';

/* ── Lazy-loaded scene visuals ──
 * Each scene visual is loaded on demand when the player enters that scene.
 * GPU registrations during import are tagged for scene:unload disposal. */

function lazySceneVisual(
  sceneId: SceneId,
  importFn: () => Promise<Record<string, ComponentType<any>>>,
  exportName: string,
) {
  return retryLazy(
    () =>
      importWithSceneGpuRegistration(sceneId, importFn) as Promise<
        Record<string, ComponentType<any>>
      >,
    exportName,
  );
}

const VolodkaRoomVisual = lazySceneVisual('volodka_room', () => import('./VolodkaRoomVisual'), 'VolodkaRoomVisual');
const VolodkaCorridorVisual = lazySceneVisual('volodka_corridor', () => import('./VolodkaCorridorVisual'), 'VolodkaCorridorVisual');
const HomeEveningVisual = lazySceneVisual('home_evening', () => import('./HomeEveningVisual'), 'HomeEveningVisual');
const StreetVisual = lazySceneVisual('street_night', () => import('./StreetVisual'), 'StreetVisual');
const CafeVisual = lazySceneVisual('cafe_evening', () => import('./CafeVisual'), 'CafeVisual');
const OfficeDayVisual = lazySceneVisual('office_day', () => import('./OfficeDayVisual'), 'OfficeDayVisual');
const ParkDayVisual = lazySceneVisual('park_day', () => import('./ParkDayVisual'), 'ParkDayVisual');
const LibraryDayVisual = lazySceneVisual('library_day', () => import('./LibraryDayVisual'), 'LibraryDayVisual');
const BattleVisual = lazySceneVisual('battle', () => import('./BattleVisual'), 'BattleVisual');
const SleepDreamVisual = lazySceneVisual('sleep_dream', () => import('./SleepDreamVisual'), 'SleepDreamVisual');
const RooftopEdgeVisual = lazySceneVisual('rooftop_edge', () => import('./RooftopEdgeVisual'), 'RooftopEdgeVisual');
const AbandonedFactoryVisual = lazySceneVisual('abandoned_factory', () => import('./AbandonedFactoryVisual'), 'AbandonedFactoryVisual');
const ZaremaAlbertRoomVisual = lazySceneVisual('zarema_albert_room', () => import('./ZaremaAlbertRoomVisual'), 'ZaremaAlbertRoomVisual');
const SolnyshRoomVisual = lazySceneVisual('solnysh_room', () => import('./SolnyshRoomVisual'), 'SolnyshRoomVisual');
const StreetWinterVisual = lazySceneVisual('street_winter', () => import('./StreetWinterVisual'), 'StreetWinterVisual');
const ChkForestZorgeVisual = lazySceneVisual('chk_forest_zorge', () => import('./ChkForestZorgeVisual'), 'ChkForestZorgeVisual');
const FactoryBasementVisual = lazySceneVisual('factory_basement', () => import('./FactoryBasementVisual'), 'FactoryBasementVisual');
const RiverPierVisual = lazySceneVisual('river_pier', () => import('./RiverPierVisual'), 'RiverPierVisual');
const GuildMainframeVisual = lazySceneVisual('guild_mainframe', () => import('./GuildMainframeVisual'), 'GuildMainframeVisual');
const CitySquareVisual = lazySceneVisual('city_square', () => import('./CitySquareVisual'), 'CitySquareVisual');
const UndergroundBunkerVisual = lazySceneVisual('underground_bunker', () => import('./UndergroundBunkerVisual'), 'UndergroundBunkerVisual');
const LibraryBasementVisual = lazySceneVisual('library_basement', () => import('./LibraryBasementVisual'), 'LibraryBasementVisual');
const AlbertBackroomVisual = lazySceneVisual('albert_backroom', () => import('./AlbertBackroomVisual'), 'AlbertBackroomVisual');
const ProceduralAaaVisual = lazySceneVisual('procedural_aaa', () => import('./ProceduralAaaVisual'), 'ProceduralAaaVisual');

interface SceneColliderSelectorProps {
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
}

/** Selects and renders the appropriate visual + physics components based on current sceneId.
 *  Visuals are render-only; physics uses SceneDefinition cuboids + structural safety colliders. */
export function SceneColliderSelector({ livePlayerPositionRef }: SceneColliderSelectorProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);

  return (
    <group>
      {/* Background layer — distant elements, skybox, parallax objects */}
      <SceneLayer layer="BACKGROUND">
        <Suspense fallback={null}>
          <SceneSkybox sceneId={sceneId} />
        </Suspense>
      </SceneLayer>

      {/* Midground layer — architecture, walls, floors, furniture (visual only). */}
      <SceneLayer layer="MIDGROUND">
        <Suspense key={sceneId} fallback={<SceneLoadGreybox sceneId={sceneId} />}>
          <EnvironmentLodProvider livePlayerPositionRef={livePlayerPositionRef}>
            <SceneVisualRoot
              key={sceneId}
              sceneId={sceneId}
              livePlayerPositionRef={livePlayerPositionRef}
            />
          </EnvironmentLodProvider>
        </Suspense>
      </SceneLayer>

      {/* Foreground layer — nearby objects with parallax (outdoor scenes only) */}
      <Suspense key={`fg:${sceneId}`} fallback={null}>
        <ForegroundElements sceneId={sceneId} livePlayerPositionRef={livePlayerPositionRef} />
      </Suspense>

      {/* SceneDefinition + structural Rapier colliders — remount per sceneId. */}
      <ScenePhysicsColliders key={`physics:${sceneId}`} sceneId={sceneId} />

      {/* Invisible meshes on layer 5 for camera wall-avoidance raycasts. */}
      <CameraCollisionProxies key={`cam-proxies:${sceneId}`} sceneId={sceneId} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SCENE DEFINITION COLLIDERS — cuboid proxies from sceneDefinitions.ts
   ══════════════════════════════════════════════════════════════════════════════
   Replaces per-mesh trimesh colliders with lightweight cuboids defined alongside
   each scene. Descriptor arrays are memoized per sceneId (no rebuild on re-render).
   Floors are skipped here — SceneStructuralColliders provides the thick safety floor.
   ══════════════════════════════════════════════════════════════════════════════ */

function ScenePhysicsColliders({ sceneId }: { sceneId: SceneId }) {
  return (
    <group key={`physics-colliders:${sceneId}`}>
      <SceneDefinitionColliders sceneId={sceneId} />
      <SceneStructuralColliders sceneId={sceneId} />
    </group>
  );
}

function SceneDefinitionColliders({ sceneId }: { sceneId: SceneId }) {
  const colliders = useMemo(() => generateColliders(SCENE_DEFINITIONS[sceneId]), [sceneId]);

  return (
    <>
      {colliders.walls.map((def, i) => (
        <DefinitionCuboidCollider key={`${sceneId}-wall-${def.name ?? i}`} def={def} />
      ))}
      {colliders.obstacles.map((def, i) => (
        <DefinitionCuboidCollider key={`${sceneId}-obs-${def.name ?? i}`} def={def} />
      ))}
      {colliders.ceilings.map((def, i) => (
        <DefinitionCuboidCollider key={`${sceneId}-ceil-${def.name ?? i}`} def={def} />
      ))}
    </>
  );
}

function DefinitionCuboidCollider({ def }: { def: ColliderDef }) {
  const name = def.footstepMaterial ? `fs:${def.footstepMaterial}` : def.name ?? 'obstacle';
  const rotationY = def.rotation ?? 0;

  return (
    <CuboidCollider
      args={def.size}
      position={def.position}
      rotation={rotationY !== 0 ? [0, rotationY, 0] : undefined}
      name={name}
      restitution={0}
      friction={0.7}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STRUCTURAL COLLIDERS — auto-generated from SceneConfig
   ══════════════════════════════════════════════════════════════════════════════
   These are invisible physics-only colliders:
   - Floor: thick (0.5m) CuboidCollider prevents tunneling; named with footstep material
   - Ceiling: for indoor scenes, prevents jumping through
   - Boundary walls: for outdoor scenes, prevents walking off the map

   All dimensions come from SceneConfig — ZERO manual position maintenance.
   ══════════════════════════════════════════════════════════════════════════════ */

function SceneStructuralColliders({ sceneId }: { sceneId: SceneId }) {
  const config = getSceneConfig(sceneId);
  const [w, d] = config.size;
  const floorMaterial = config.floorMaterial;
  const hasCeiling = config.hasCeiling;
  const floorY = config.floorY;
  const floorCenterY = floorY - STRUCTURAL_FLOOR_HALF_HEIGHT;
  const wallHeight = 4;

  // Doorway-aware boundary walls: solid segments + recessed alcove backstops.
  // Replaces the four full-span walls so perimeter doorways become walkable recesses.
  const boundarySegments = useMemo(
    () => generateBoundaryWallSegments(SCENE_DEFINITIONS[sceneId]),
    [sceneId],
  );

  return (
    <>
      {/* ── Floor: thick cuboid with footstep material name ── */}
      <CuboidCollider
        key={`${sceneId}-floor`}
        args={[w / 2, STRUCTURAL_FLOOR_HALF_HEIGHT, d / 2]}
        position={[0, floorCenterY, 0]}
        name={`fs:${floorMaterial}`}
        restitution={0}
        friction={0.8}
      />

      {/* ── Ceiling: for indoor scenes ── */}
      {hasCeiling && (
        <CuboidCollider
          key={`${sceneId}-ceiling`}
          args={[w / 2, 0.1, d / 2]}
          position={[0, wallHeight + 0.1, 0]}
          name={`fs:${floorMaterial}`}
          restitution={0}
          friction={0.5}
        />
      )}

      {/* ── Boundary walls for ALL scenes ──
       *  Indoor scenes (hasCeiling=true): Visual walls are thin planeGeometry
       *  wrapped in trimesh — unreliable for KinematicCharacterController.
       *  Explicit CuboidColliders prevent walking through them.
       *
       *  Doorways on the boundary get an opening + recessed backstop so the
       *  player can step into the door alcove without leaving the map.
       */}
      {boundarySegments.map((def) => (
        <CuboidCollider
          key={`${sceneId}-${def.name}`}
          args={def.size}
          position={def.position}
          name="fs:concrete"
          restitution={0}
          friction={0.5}
        />
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VISUAL SCENE — lazy-loaded scene component selector
   ══════════════════════════════════════════════════════════════════════════════ */

interface VisualSceneProps {
  sceneId: SceneId;
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
}

/** Wraps scene visuals and disposes GPU resources when sceneId changes. */
function SceneVisualRoot({ sceneId, livePlayerPositionRef }: VisualSceneProps) {
  const rootRef = useRef<THREE.Group>(null);
  useThreeCleanup(rootRef, { sceneId });

  return (
    <group ref={rootRef}>
      <VisualScene sceneId={sceneId} livePlayerPositionRef={livePlayerPositionRef} />
    </group>
  );
}

function VisualScene({ sceneId, livePlayerPositionRef }: VisualSceneProps) {
  const visualSceneId = resolveDerivedSceneId(sceneId);
  switch (visualSceneId) {
    case 'volodka_room':
      return <VolodkaRoomVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'volodka_corridor':
      return <VolodkaCorridorVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'home_evening':
      return <HomeEveningVisual />;
    case 'street_night':
      return <StreetVisual sceneId={sceneId} livePlayerPositionRef={livePlayerPositionRef} />;
    case 'street_winter':
      return <StreetWinterVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'cafe_evening':
      return <CafeVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'office_day':
      return <OfficeDayVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'park_day':
      return <ParkDayVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'library_day':
      return <LibraryDayVisual />;
    case 'battle':
      return <BattleVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'sleep_dream':
      return <SleepDreamVisual />;
    case 'rooftop_edge':
      return <RooftopEdgeVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'abandoned_factory':
      return <AbandonedFactoryVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'zarema_albert_room':
      return <ZaremaAlbertRoomVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'solnysh_room':
      return <SolnyshRoomVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'chk_forest_zorge':
      return (
        <ChkForestZorgeVisual
          sceneId={sceneId}
          livePlayerPositionRef={livePlayerPositionRef}
        />
      );
    case 'factory_basement':
      return <FactoryBasementVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'river_pier':
      return <RiverPierVisual sceneId={sceneId} livePlayerPositionRef={livePlayerPositionRef} />;
    case 'guild_mainframe':
      return <GuildMainframeVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'city_square':
      return <CitySquareVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'underground_bunker':
      return <UndergroundBunkerVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'library_basement':
      return <LibraryBasementVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'albert_backroom':
      return <AlbertBackroomVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'procedural_aaa':
      return <ProceduralAaaVisual livePlayerPositionRef={livePlayerPositionRef} />;
    default:
      return <FallbackVisual sceneId={sceneId} />;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   SKYBOX + FOREGROUND + FALLBACK (unchanged from previous version)
   ══════════════════════════════════════════════════════════════════════════════ */

function SceneSkybox({ sceneId }: { sceneId: SceneId }) {
  const isOutdoor = !getSceneConfig(sceneId).hasCeiling;
  if (!isOutdoor || sceneId === 'chk_forest_zorge') return null;
  return <DistantBuildingSilhouettes sceneId={sceneId} />;
}

interface BuildingInstanceDef {
  x: number; y: number; z: number;
  width: number; height: number; depth: number;
  rotation: number;
}

function DistantBuildingSilhouettes({ sceneId }: { sceneId: SceneId }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const BUILDING_COUNT = 12;

  const buildings = useMemo<BuildingInstanceDef[]>(() => {
    const seed = hashSceneId(sceneId);
    const rng = seededRandom(seed);
    const result: BuildingInstanceDef[] = [];

    for (let i = 0; i < BUILDING_COUNT; i++) {
      const angle = (i / BUILDING_COUNT) * Math.PI * 2;
      const dist = 15 + rng() * 10;
      const width = 1 + rng() * 2;
      const height = 2 + rng() * 5;
      const depth = 1 + rng() * 1.5;

      result.push({
        x: Math.cos(angle) * dist,
        y: height / 2,
        z: Math.sin(angle) * dist,
        width, height, depth,
        rotation: rng() * Math.PI,
      });
    }
    return result;
  }, [sceneId]);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(0, b.rotation, 0);
      dummy.scale.set(b.width, b.height, b.depth);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings]);

  useThreeCleanup(meshRef);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BUILDING_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0a0a12" roughness={0.95} emissive="#0a0a15" emissiveIntensity={0.05} />
    </instancedMesh>
  );
}

function SceneLoadGreybox({ sceneId }: { sceneId: SceneId }) {
  const config = getSceneConfig(sceneId);
  const [w, d] = config.size;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={config.floorY}>
        <boxGeometry args={[w, 0.05, d]} />
        {/* polygonOffset pushes the greybox floor BACK so real scene floors (mounted
            at floorY+0.001..0.0025 during Suspense swap) win z-order. Without this,
            the 1-2 frame overlap window during scene enter causes a z-fight flash. */}
        <meshStandardMaterial color="#3a3a3a" roughness={0.95} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[w * 0.6, 3, d * 0.6]} />
        <meshStandardMaterial color="#2a2a2a" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function FallbackVisual({ sceneId }: { sceneId: SceneId }) {
  const config = getSceneConfig(sceneId);
  const [w, d] = config.size;
  const h = 3;
  const floorY = config.floorY;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={floorY + 0.005}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {config.hasCeiling && (
        <>
          <mesh position={[0, h / 2, -d / 2]}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          <mesh position={[0, h / 2, d / 2]} rotation-y={Math.PI}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          <mesh position={[-w / 2, h / 2, 0]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[d, h]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          <mesh position={[w / 2, h / 2, 0]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[d, h]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          <mesh position={[0, h, 0]} rotation-x={Math.PI / 2}>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
        </>
      )}
      <pointLight position={[0, 2.5, 0]} color="#ffcc80" intensity={1.0} distance={8} />
    </group>
  );
}

// ─── Foreground Elements (outdoor scenes only) ───

interface ForegroundElementsProps {
  sceneId: SceneId;
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
}

function ForegroundElements({ sceneId, livePlayerPositionRef }: ForegroundElementsProps) {
  const isOutdoor = !getSceneConfig(sceneId).hasCeiling;
  if (!isOutdoor) return null;

  switch (sceneId) {
    case 'street_night':
      return (
        <LayeredForeground key={sceneId} livePlayerPositionRef={livePlayerPositionRef}>
          <StreetForegroundObjects />
        </LayeredForeground>
      );
    case 'park_day':
      return (
        <LayeredForeground key={sceneId} livePlayerPositionRef={livePlayerPositionRef}>
          <ParkForegroundObjects />
        </LayeredForeground>
      );
    case 'rooftop_edge':
      return (
        <LayeredForeground key={sceneId} livePlayerPositionRef={livePlayerPositionRef}>
          <RooftopForegroundObjects />
        </LayeredForeground>
      );
    default:
      return null;
  }
}

// ─── Street foreground objects ───

function StreetForegroundObjects() {
  const lampPositions: [number, number, number][] = [
    [-3, 0, -5], [3, 0, 5], [-3, 0, 12], [3, 0, -12],
  ];
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!poleRef.current || !bulbRef.current) return;
    lampPositions.forEach((pos, i) => {
      dummy.position.set(pos[0], pos[1] + 2.5, pos[2]);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poleRef.current!.setMatrixAt(i, dummy.matrix);
      dummy.position.set(pos[0], pos[1] + 5.1, pos[2]);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bulbRef.current!.setMatrixAt(i, dummy.matrix);
    });
    poleRef.current.instanceMatrix.needsUpdate = true;
    bulbRef.current.instanceMatrix.needsUpdate = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [dummy]);

  return (
    <group>
      <instancedMesh ref={poleRef} args={[undefined, undefined, lampPositions.length]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 5, 6]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, lampPositions.length]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffe8a0" emissive="#ffdd80" emissiveIntensity={3} />
      </instancedMesh>
      {lampPositions.map((pos, i) => (
        <pointLight
          key={`fg-lamp-light-${i}`}
          position={[pos[0], pos[1] + 4.9, pos[2]]}
          color="#ffdd80"
          intensity={4.2}
          distance={18}
          castShadow={false}
        />
      ))}
      <group position={[2.5, 0, -2]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.8, 1.8, 0.6]} />
          <meshStandardMaterial color="#2a3a2a" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.2, 0.31]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshStandardMaterial color="#001a00" emissive="#00ff66" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.6, 0.31]}>
          <planeGeometry args={[0.5, 0.6]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
        </mesh>
      </group>
      <group position={[-4, 0, 3]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[1.0, 2.4, 0.15]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.9, 0.08]}>
          <planeGeometry args={[0.6, 1.8]} />
          <meshStandardMaterial color="#050508" roughness={0.95} />
        </mesh>
        <mesh position={[0, 1.8, 0.09]}>
          <boxGeometry args={[0.8, 0.05, 0.05]} />
          <meshStandardMaterial color="#330033" emissive="#ff44ff" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        <mesh position={[-0.35, 1.0, 0.09]}>
          <boxGeometry args={[0.05, 1.8, 0.05]} />
          <meshStandardMaterial color="#330033" emissive="#ff44ff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <mesh position={[0.35, 1.0, 0.09]}>
          <boxGeometry args={[0.05, 1.8, 0.05]} />
          <meshStandardMaterial color="#330033" emissive="#ff44ff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 1.5, 0.5]} color="#ff44ff" intensity={1.5} distance={5} />
      </group>
    </group>
  );
}

// ─── Park foreground objects ───

function ParkForegroundObjects() {
  return (
    <group>
      <ForegroundTree position={[4, 0, -2]} />
      <ForegroundTree position={[-4, 0, 1]} />
      <ForegroundTree position={[2, 0, 6]} />
      <ForegroundBench position={[1.5, 0, -1]} rotation={0.5} />
      <ForegroundBench position={[-2, 0, 4]} rotation={-0.3} />
      {[[-2, 0, -5], [3, 0, 3], [-4, 0, -2]].map((pos, i) => (
        <group key={`fg-park-lamp-${i}`} position={pos as [number, number, number]}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.05, 3.6, 6]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 3.65, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#ffe8a0" emissive="#ffaa44" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 3.6, 0]} color="#ffaa44" intensity={2.0} distance={10} />
        </group>
      ))}
    </group>
  );
}

function ForegroundTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.3, 2.4, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.0, 0]} castShadow>
        <sphereGeometry args={[1.8, 8, 8]} />
        <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
      </mesh>
    </group>
  );
}

function ForegroundBench({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.08, 0.4]} />
        <meshStandardMaterial color="#7a7a70" roughness={0.85} />
      </mesh>
      <mesh position={[-0.5, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.35]} />
        <meshStandardMaterial color="#6a6a60" roughness={0.85} />
      </mesh>
      <mesh position={[0.5, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.35]} />
        <meshStandardMaterial color="#6a6a60" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ─── Rooftop foreground objects ───

function RooftopForegroundObjects() {
  return (
    <group>
      <group position={[-1.5, 0, -3.5]}>
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.04, 6, 6]} />
          <meshStandardMaterial color="#6a6a6a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow>
          <boxGeometry args={[1.0, 0.02, 0.02]} />
          <meshStandardMaterial color="#5a5a5a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[0.7, 0.02, 0.02]} />
          <meshStandardMaterial color="#5a5a5a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.4, 3.8, 0]} rotation={[0.3, 0.5, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 8]} />
          <meshStandardMaterial color="#7a7a7a" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 6.1, 0]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
        </mesh>
      </group>
      {[[-2, 1.05, 4], [1.5, 1.05, 4], [3.5, 1.05, 4]].map((pos, i) => (
        <group key={`fg-pigeon-${i}`} position={pos as [number, number, number]} rotation={[0, 0.3 + i * 0.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#6a6a6a" roughness={0.9} />
          </mesh>
          <mesh position={[0.04, 0.03, 0]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <group position={[4.5, 0, -3.2]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.04, 3, 6]} />
          <meshStandardMaterial color="#5a5a5a" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 3.0, 0]} rotation={[0.4, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.06, 12]} />
          <meshStandardMaterial color="#7a7a7a" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, 3.2, 0.15]} rotation={[0.4, 0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 4]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Utilities ───

function hashSceneId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
