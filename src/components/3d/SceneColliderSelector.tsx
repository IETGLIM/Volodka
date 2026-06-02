
/* ─── Volodka RPG – Scene collider selector ───
 *
 *  ONE SOURCE OF TRUTH: Visual geometry IS the collider.
 *
 *  Architecture:
 *  ─────────────
 *  1. Visual scene meshes → wrapped in <RigidBody type="fixed" colliders="trimesh">
 *     → Rapier auto-generates exact triangle-mesh colliders from visual geometry
 *     → No manual position/size duplication → zero drift
 *
 *  2. Floor + boundary walls → auto-generated from SceneConfig (size, hasCeiling, floorMaterial)
 *     → Thick floor prevents tunneling, named collider for footstep material
 *     → Boundary walls for outdoor scenes prevent walking off the map
 *
 *  3. Footstep sounds → determined by SceneConfig.floorMaterial (not collider names)
 *     → PhysicsPlayer reads directly from scene config
 *
 *  This eliminates the old PhysicsSceneColliders.tsx which manually maintained
 *  ~109 CuboidColliders with hardcoded positions that drifted from the visual
 *  scene positions over time. Now the visual IS the physics — if you move a desk
 *  in the visual component, its collider moves automatically.
 */

import { Suspense, lazy, useRef, useMemo, useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { SceneLayer, LayeredForeground } from './VisualizationLayers';
import type { SceneId } from '@/shared/types/game';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';

/* ── Lazy-loaded scene visuals ──
 * Each scene visual is loaded on demand when the player enters that scene.
 * Using React.lazy because these components render inside the R3F Canvas tree. */

function retryLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ [key: string]: T }>,
  exportName: string,
  maxRetries = 3,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    importFn().then((m) => ({ default: m[exportName] as T })).catch(async (err) => {
      if (maxRetries <= 0) throw err;
      console.warn(`[retryLazy] ChunkLoadError for ${exportName}, retrying... (${maxRetries} left)`, err.message);
      await new Promise((r) => setTimeout(r, 500 * (4 - maxRetries)));
      return importFn().then((m) => ({ default: m[exportName] as T }));
    })
  );
}

const VolodkaRoomVisual = retryLazy(() => import('./VolodkaRoomVisual'), 'VolodkaRoomVisual');
const VolodkaCorridorVisual = retryLazy(() => import('./VolodkaCorridorVisual'), 'VolodkaCorridorVisual');
const HomeEveningVisual = retryLazy(() => import('./HomeEveningVisual'), 'HomeEveningVisual');
const StreetVisual = retryLazy(() => import('./StreetVisual'), 'StreetVisual');
const CafeVisual = retryLazy(() => import('./CafeVisual'), 'CafeVisual');
const OfficeDayVisual = retryLazy(() => import('./OfficeDayVisual'), 'OfficeDayVisual');
const ParkDayVisual = retryLazy(() => import('./ParkDayVisual'), 'ParkDayVisual');
const LibraryDayVisual = retryLazy(() => import('./LibraryDayVisual'), 'LibraryDayVisual');
const BattleVisual = retryLazy(() => import('./BattleVisual'), 'BattleVisual');
const SleepDreamVisual = retryLazy(() => import('./SleepDreamVisual'), 'SleepDreamVisual');
const RooftopEdgeVisual = retryLazy(() => import('./RooftopEdgeVisual'), 'RooftopEdgeVisual');
const AbandonedFactoryVisual = retryLazy(() => import('./AbandonedFactoryVisual'), 'AbandonedFactoryVisual');
const ZaremaAlbertRoomVisual = retryLazy(() => import('./ZaremaAlbertRoomVisual'), 'ZaremaAlbertRoomVisual');
const StreetWinterVisual = retryLazy(() => import('./StreetWinterVisual'), 'StreetWinterVisual');

interface SceneColliderSelectorProps {
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
}

/** Selects and renders the appropriate visual + physics components based on current sceneId.
 *  Visual meshes are wrapped in RigidBody trimesh — the visual IS the collider. */
export function SceneColliderSelector({ livePlayerPositionRef }: SceneColliderSelectorProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const config = getSceneConfig(sceneId);

  return (
    <group>
      {/* Background layer — distant elements, skybox, parallax objects */}
      <SceneLayer layer="BACKGROUND">
        <Suspense fallback={null}>
          <SceneSkybox sceneId={sceneId} />
        </Suspense>
      </SceneLayer>

      {/* Midground layer — architecture, walls, floors, furniture.
          Wrapped in RigidBody trimesh: visual geometry = collider geometry.
          This is the SINGLE SOURCE OF TRUTH — no manual collider positions. */}
      <SceneLayer layer="MIDGROUND">
        <Suspense fallback={<SceneLoadingFallback />}>
          {/* CRITICAL: key={sceneId} forces complete RigidBody remount on scene change.
              Without this, Rapier's trimesh colliders are NOT regenerated when the
              visual scene changes — the player walks through walls because the
              colliders still belong to the OLD scene geometry. */}
          <RigidBody
            key={sceneId}
            type="fixed"
            colliders="trimesh"
            friction={0.7}
            restitution={0}
            name={`scene-geometry:${sceneId}`}
          >
            <VisualScene sceneId={sceneId} livePlayerPositionRef={livePlayerPositionRef} />
          </RigidBody>
        </Suspense>
      </SceneLayer>

      {/* Foreground layer — nearby objects with parallax (outdoor scenes only) */}
      <Suspense fallback={null}>
        <ForegroundElements sceneId={sceneId} livePlayerPositionRef={livePlayerPositionRef} />
      </Suspense>

      {/* Structural colliders auto-generated from scene config.
          Floor: thick cuboid (prevents tunneling) + footstep material name.
          Walls: boundary walls for outdoor scenes.
          These are NOT visual — they exist purely for physics safety. */}
      <SceneStructuralColliders sceneId={sceneId} />
    </group>
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
  const wallHeight = 4;
  const WALL_THICKNESS = 0.5; // Thick enough to prevent tunneling with KinematicCharacterController

  return (
    <group>
      {/* ── Floor: thick cuboid with footstep material name ──
       *  CRITICAL: The top surface is at y=0.01 to match the player spawn point.
       *  This MUST be ABOVE the visual floor trimesh (at y=0.001) so the
       *  KinematicCharacterController hits the CuboidCollider FIRST.
       *  The visual floor's trimesh is infinitely thin (planeGeometry) and
       *  unreliable — the controller can tunnel through it. The thick
       *  CuboidCollider is the TRUE floor for physics.
       *  Total thickness = 1.0m (half = 0.5), center at y=-0.49,
       *  top at y = -0.49 + 0.5 = 0.01, bottom at y = -0.49 - 0.5 = -0.99.
       */}
      <CuboidCollider
        args={[w / 2, 0.5, d / 2]}
        position={[0, -0.49, 0]}
        name={`fs:${floorMaterial}`}
        restitution={0}
        friction={0.8}
      />

      {/* ── Ceiling: for indoor scenes ── */}
      {hasCeiling && (
        <CuboidCollider
          args={[w / 2, 0.1, d / 2]}
          position={[0, wallHeight + 0.1, 0]}
          name={`fs:${floorMaterial}`}
          restitution={0}
          friction={0.5}
        />
      )}

      {/* ── Wall colliders for ALL scenes ──
       *  Indoor scenes (hasCeiling=true): Visual walls are thin planeGeometry
       *  wrapped in trimesh — unreliable for KinematicCharacterController.
       *  The player can walk through thin trimesh walls, especially at speed.
       *  Adding explicit CuboidColliders for walls prevents this.
       *
       *  Outdoor scenes (hasCeiling=false): Same boundary walls as before.
       */}
      {/* Left wall (x = -w/2) */}
      <CuboidCollider
        args={[WALL_THICKNESS / 2, wallHeight / 2, d / 2]}
        position={[-w / 2, wallHeight / 2, 0]}
        name="fs:concrete"
        restitution={0}
        friction={0.5}
      />
      {/* Right wall (x = +w/2) */}
      <CuboidCollider
        args={[WALL_THICKNESS / 2, wallHeight / 2, d / 2]}
        position={[w / 2, wallHeight / 2, 0]}
        name="fs:concrete"
        restitution={0}
        friction={0.5}
      />
      {/* Back wall (z = -d/2) */}
      <CuboidCollider
        args={[w / 2, wallHeight / 2, WALL_THICKNESS / 2]}
        position={[0, wallHeight / 2, -d / 2]}
        name="fs:concrete"
        restitution={0}
        friction={0.5}
      />
      {/* Front wall (z = +d/2) */}
      <CuboidCollider
        args={[w / 2, wallHeight / 2, WALL_THICKNESS / 2]}
        position={[0, wallHeight / 2, d / 2]}
        name="fs:concrete"
        restitution={0}
        friction={0.5}
      />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VISUAL SCENE — lazy-loaded scene component selector
   ══════════════════════════════════════════════════════════════════════════════ */

interface VisualSceneProps {
  sceneId: SceneId;
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
}

function VisualScene({ sceneId, livePlayerPositionRef }: VisualSceneProps) {
  switch (sceneId) {
    case 'volodka_room':
      return <VolodkaRoomVisual />;
    case 'volodka_corridor':
      return <VolodkaCorridorVisual />;
    case 'home_evening':
      return <HomeEveningVisual />;
    case 'street_night':
      return <StreetVisual sceneId={sceneId} livePlayerPositionRef={livePlayerPositionRef} />;
    case 'street_winter':
      return <StreetWinterVisual />;
    case 'cafe_evening':
      return <CafeVisual />;
    case 'office_day':
      return <OfficeDayVisual />;
    case 'park_day':
      return <ParkDayVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'library_day':
      return <LibraryDayVisual />;
    case 'battle':
      return <BattleVisual />;
    case 'sleep_dream':
      return <SleepDreamVisual />;
    case 'rooftop_edge':
      return <RooftopEdgeVisual livePlayerPositionRef={livePlayerPositionRef} />;
    case 'abandoned_factory':
      return <AbandonedFactoryVisual />;
    case 'zarema_albert_room':
      return <ZaremaAlbertRoomVisual />;
    default:
      return <FallbackVisual sceneId={sceneId} />;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   SKYBOX + FOREGROUND + FALLBACK (unchanged from previous version)
   ══════════════════════════════════════════════════════════════════════════════ */

function SceneSkybox({ sceneId }: { sceneId: SceneId }) {
  const isOutdoor = !getSceneConfig(sceneId).hasCeiling;
  if (!isOutdoor) return null;
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

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BUILDING_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0a0a12" roughness={0.95} emissive="#0a0a15" emissiveIntensity={0.05} />
    </instancedMesh>
  );
}

function FallbackVisual({ sceneId }: { sceneId: SceneId }) {
  const config = getSceneConfig(sceneId);
  const [w, d] = config.size;
  const h = 3;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.005}>
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
        <LayeredForeground livePlayerPositionRef={livePlayerPositionRef}>
          <StreetForegroundObjects />
        </LayeredForeground>
      );
    case 'park_day':
      return (
        <LayeredForeground livePlayerPositionRef={livePlayerPositionRef}>
          <ParkForegroundObjects />
        </LayeredForeground>
      );
    case 'rooftop_edge':
      return (
        <LayeredForeground livePlayerPositionRef={livePlayerPositionRef}>
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

  return (
    <group>
      {lampPositions.map((pos, i) => (
        <group key={`fg-lamp-${i}`} position={pos}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.05, 5, 6]} />
            <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 5.1, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.2]} />
            <meshStandardMaterial color="#555" metalness={0.6} />
          </mesh>
          <mesh position={[0, 4.95, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ffe8a0" emissive="#ffdd80" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[0, 4.9, 0]} color="#ffdd80" intensity={2.8} distance={15} castShadow={false} shadow-mapSize-width={256} shadow-bias={-0.002} />
        </group>
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

function SceneLoadingFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#444" wireframe />
    </mesh>
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
