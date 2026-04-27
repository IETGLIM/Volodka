"use client";

import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneId } from '@/data/types';

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Слой для коллайдеров камеры (бит 3 = слой 4)
 * Используется для оптимизации raycast
 */
export const CAMERA_COLLISION_LAYER = 4;

// ============================================
// НЕВИДИМЫЕ СТЕНЫ ДЛЯ КАМЕРЫ
// ============================================

/**
 * Невидимая стена-коллайдер для камеры
 * Визуально не отображается, но блокирует камеру (участвует в raycast)
 * 
 * ВАЖНО: Используем transparent opacity={0}, а не visible={false},
 * т.к. меши с visible=false не участвуют в raycast
 */
const InvisibleWall = memo(function InvisibleWall({
  position,
  size = [1, 3, 1],
}: {
  position: [number, number, number];
  size?: [number, number, number];
}) {
  return (
    <mesh 
      position={position} 
      userData={{ isCollider: true }}
      layers={CAMERA_COLLISION_LAYER}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial 
        transparent 
        opacity={0} 
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
});

/**
 * Группа невидимых стен по периметру
 */
const BoundaryWalls = memo(function BoundaryWalls({
  size = 20,
  height = 4,
  position = [0, 0, 0],
}: {
  size?: number;
  height?: number;
  position?: [number, number, number];
}) {
  const halfSize = size / 2;
  const wallThickness = 0.5;
  
  return (
    <group position={position}>
      {/* Задняя стена */}
      <InvisibleWall 
        position={[0, height / 2, -halfSize]} 
        size={[size + wallThickness * 2, height, wallThickness]} 
      />
      {/* Передняя стена */}
      <InvisibleWall 
        position={[0, height / 2, halfSize]} 
        size={[size + wallThickness * 2, height, wallThickness]} 
      />
      {/* Левая стена */}
      <InvisibleWall 
        position={[-halfSize, height / 2, 0]} 
        size={[wallThickness, height, size]} 
      />
      {/* Правая стена */}
      <InvisibleWall 
        position={[halfSize, height / 2, 0]} 
        size={[wallThickness, height, size]} 
      />
    </group>
  );
});

/** Прямоугольный периметр для raycast камеры (как `RectangularBoundaryWalls` в `PhysicsSceneColliders`). */
const RectangularInvisibleBoundary = memo(function RectangularInvisibleBoundary({
  width,
  depth,
  height = 4,
  position = [0, 0, 0],
  wallInset = 1,
}: {
  width: number;
  depth: number;
  height?: number;
  position?: [number, number, number];
  wallInset?: number;
}) {
  const bw = Math.max(2, width - wallInset);
  const bd = Math.max(2, depth - wallInset);
  const halfW = bw / 2;
  const halfD = bd / 2;
  const wallThickness = 0.5;

  return (
    <group position={position}>
      <InvisibleWall position={[0, height / 2, -halfD]} size={[bw + wallThickness * 2, height, wallThickness]} />
      <InvisibleWall position={[0, height / 2, halfD]} size={[bw + wallThickness * 2, height, wallThickness]} />
      <InvisibleWall position={[-halfW, height / 2, 0]} size={[wallThickness, height, bd]} />
      <InvisibleWall position={[halfW, height / 2, 0]} size={[wallThickness, height, bd]} />
    </group>
  );
});

/**
 * Один `InstancedMesh` на много невидимых AABB для raycast камеры (слой {@link CAMERA_COLLISION_LAYER}).
 */
const InstancedWalls = memo(function InstancedWalls({
  positions,
  size = [1, 3, 1],
}: {
  positions: [number, number, number][];
  size?: [number, number, number];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.layers.set(CAMERA_COLLISION_LAYER);
    mesh.userData.isCollider = true;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || positions.length === 0) return;
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(size[0], size[1], size[2]);
    positions.forEach((pos, i) => {
      p.set(pos[0], pos[1], pos[2]);
      q.identity();
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions, size]);

  if (positions.length === 0) return null;

  return (
    <instancedMesh ref={ref} args={[geo, mat, positions.length]} frustumCulled={false} userData={{ isCollider: true }} />
  );
});

// ============================================
// КОЛЛАЙДЕРЫ КУХНИ
// ============================================

export const KitchenColliders = memo(function KitchenColliders() {
  const obstacleWalls: [number, number, number][] = useMemo(() => [
    [4, 1, -2],
    [0, 0.5, -2],
  ], []);
  
  return (
    <group>
      {/* Пол — как PhysicsFloor 14×14 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#3d2817" roughness={0.7} />
      </mesh>
      
      {/* Границы комнаты */}
      <BoundaryWalls size={14} height={3} />
      
      {/* Препятствия */}
      <InstancedWalls positions={obstacleWalls} size={[1.2, 2, 0.8]} />
    </group>
  );
});

/** Вечерняя квартира: периметр без «кухонных» блоков — совпадает с физической версией сцены. */
export const HomeEveningColliders = memo(function HomeEveningColliders() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#241c14" roughness={0.78} />
      </mesh>
      <BoundaryWalls size={14} height={3} />
    </group>
  );
});

export const VolodkaRoomColliders = memo(function VolodkaRoomColliders() {
  const h = 3;
  const wallT = 0.5;
  const hw = 7;
  const hd = 5;
  const floorHalfZ = 6.35;
  const deskMain: [number, number, number][] = useMemo(() => [[3.2, 0.45, 0.1]], []);
  const deskSide: [number, number, number][] = useMemo(() => [[0.8, 0.45, -2.8]], []);
  const wardrobes: [number, number, number][] = useMemo(
    () => [
      [5.2, 0.95, 0.2],
      [5.2, 0.95, -1.4],
    ],
    [],
  );
  const sofa: [number, number, number][] = useMemo(() => [[-3.8, 0.42, 1.2]], []);

  return (
    <group>
      {/* Пол только для raycast камеры (`InstancedWalls` = слой 4); видимый пол — в `VolodkaRoomVisual`. */}
      <InstancedWalls positions={[[0, -0.04, 0]]} size={[14, 0.08, floorHalfZ * 2]} />
      <InstancedWalls positions={[[0, h / 2, -hd]]} size={[14 + wallT * 2, h, wallT]} />
      <InstancedWalls positions={[[-hw, h / 2, 0]]} size={[wallT, h, floorHalfZ * 2]} />
      <InstancedWalls positions={[[hw, h / 2, 0]]} size={[wallT, h, floorHalfZ * 2]} />
      <InstancedWalls positions={[[-4.12, h / 2, hd]]} size={[5.9 + wallT, h, wallT]} />
      <InstancedWalls positions={[[4.12, h / 2, hd]]} size={[5.9 + wallT, h, wallT]} />
      <InstancedWalls positions={[[0, h / 2, hd + 1.35]]} size={[14 + wallT * 2, h, wallT]} />
      <InstancedWalls positions={deskMain} size={[1.45, 0.08, 0.78]} />
      <InstancedWalls positions={deskSide} size={[1.05, 0.08, 0.58]} />
      <InstancedWalls positions={wardrobes} size={[0.58, 1.75, 0.68]} />
      <InstancedWalls positions={sofa} size={[1.85, 0.52, 0.88]} />
    </group>
  );
});

export const VolodkaCorridorColliders = memo(function VolodkaCorridorColliders() {
  const h = 3;
  const wallT = 0.5;
  const halfW = 1.75;
  const halfD = 6;
  const shoe: [number, number, number][] = useMemo(() => [[-1.15, 0.26, -4.05]], []);
  const radiator: [number, number, number][] = useMemo(() => [[1.22, 0.24, -0.8]], []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[3.5, 13.2]} />
        <meshStandardMaterial color="#3a3630" roughness={0.82} />
      </mesh>
      <InstancedWalls positions={[[halfW, h / 2, 0]]} size={[wallT, h, 13.2]} />
      <InstancedWalls positions={[[-halfW, h / 2, 0]]} size={[wallT, h, 13.2]} />
      <InstancedWalls positions={[[-1.125, h / 2, -halfD]]} size={[1.25, h, wallT]} />
      <InstancedWalls positions={[[1.125, h / 2, -halfD]]} size={[1.25, h, wallT]} />
      <InstancedWalls positions={[[-1.125, h / 2, halfD]]} size={[1.25, h, wallT]} />
      <InstancedWalls positions={[[1.125, h / 2, halfD]]} size={[1.25, h, wallT]} />
      <InstancedWalls positions={shoe} size={[0.64, 0.52, 0.28]} />
      <InstancedWalls positions={radiator} size={[0.12, 0.48, 2.35]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ КАФЕ
// ============================================

export const CafeColliders = memo(function CafeColliders() {
  const obstacleWalls: [number, number, number][] = useMemo(() => [
    // Барная стойка
    [0, 0.6, -4],
    // Сцена
    [0, 0.5, -6],
  ], []);
  
  const tablePositions: [number, number, number][] = useMemo(() => [
    [-3, 0.4, 0],
    [0, 0.4, 0],
    [3, 0.4, 0],
  ], []);
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#4a3520" roughness={0.6} />
      </mesh>
      
      <BoundaryWalls size={16} height={3} />
      
      <InstancedWalls positions={obstacleWalls} size={[6, 1.2, 1]} />
      <InstancedWalls positions={tablePositions} size={[0.8, 0.8, 0.8]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ ОФИСА
// ============================================

export const OfficeColliders = memo(function OfficeColliders() {
  const deskPositions: [number, number, number][] = useMemo(() => [
    [-3, 0.5, 0],
    [3, 0.5, 0],
  ], []);
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
      
      <BoundaryWalls size={16} height={3} />
      
      <InstancedWalls positions={deskPositions} size={[1.5, 1.2, 0.8]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ УЛИЦЫ
// ============================================

export const StreetColliders = memo(function StreetColliders() {
  const lampPositions: [number, number, number][] = useMemo(() => [
    [-6, 1.5, -4],
    [-2, 1.5, -4],
    [2, 1.5, -4],
    [6, 1.5, -4],
  ], []);
  
  const benchPositions: [number, number, number][] = useMemo(() => [
    [-4, 0.3, 2],
    [4, 0.3, 2],
  ], []);
  
  const treePositions: [number, number, number][] = useMemo(() => [
    [-8, 1, -6],
    [8, 1, -6],
  ], []);
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2d3436" roughness={0.8} />
      </mesh>
      
      <BoundaryWalls size={26} height={2.5} />
      
      <InstancedWalls positions={lampPositions} size={[0.2, 3, 0.2]} />
      <InstancedWalls positions={benchPositions} size={[1.3, 0.6, 0.4]} />
      <InstancedWalls positions={treePositions} size={[0.5, 2.5, 0.5]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ МЕМОРИАЛЬНОГО ПАРКА
// ============================================

export const MemorialParkColliders = memo(function MemorialParkColliders() {
  const treePositions: [number, number, number][] = useMemo(() => [
    [-8, 1.5, -6],
    [-4, 1.5, -2],
    [4, 1.5, 0],
    [8, 1.5, 2],
  ], []);
  
  const benchPositions: [number, number, number][] = useMemo(() => [
    [-5, 0.3, 0],
    [5, 0.3, 0],
  ], []);
  
  const monumentPosition: [number, number, number][] = useMemo(() => [
    [0, 0.8, -10],
  ], []);
  
  const gazeboPosition: [number, number, number][] = useMemo(() => [
    [0, 1.3, -6],
  ], []);
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#2a4a2a" roughness={0.9} />
      </mesh>
      
      <BoundaryWalls size={22} height={2} />
      
      <InstancedWalls positions={treePositions} size={[0.5, 3, 0.5]} />
      <InstancedWalls positions={benchPositions} size={[1.3, 0.6, 0.4]} />
      <InstancedWalls positions={monumentPosition} size={[0.6, 1.6, 0.6]} />
      <InstancedWalls positions={gazeboPosition} size={[5, 2.6, 4]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ КРЫШИ
// ============================================

export const RooftopColliders = memo(function RooftopColliders() {
  const railingPositions: [number, number, number][] = useMemo(() => [
    [-8, 0.7, -8],
    [-4, 0.7, -8],
    [0, 0.7, -8],
    [4, 0.7, -8],
    [8, 0.7, -8],
  ], []);
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>
      
      {/* Ограждение по краю крыши */}
      <InvisibleWall position={[0, 0.6, -8]} size={[20, 1.2, 0.2]} />
      
      {/* Столбы ограждения */}
      <InstancedWalls positions={railingPositions} size={[0.15, 1.5, 0.15]} />
      
      {/* Боковые стены */}
      <InvisibleWall position={[-10, 1.5, 0]} size={[0.5, 3, 20]} />
      <InvisibleWall position={[10, 1.5, 0]} size={[0.5, 3, 20]} />
      <InvisibleWall position={[0, 1.5, 10]} size={[20, 3, 0.5]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ СЦЕН СНОВ/БИТВ
// ============================================

export const DreamColliders = memo(function DreamColliders() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a0a2e" roughness={0.5} transparent opacity={0.5} />
      </mesh>
      
      {/* Мягкие границы для мира снов */}
      <BoundaryWalls size={18} height={1.5} />
    </group>
  );
});

export const BattleColliders = memo(function BattleColliders() {
  const crystalPositions: [number, number, number][] = useMemo(() => [
    [-3, 1, -2],
    [2, 0.8, 3],
    [0, 1.5, -3],
    [-2, 1.3, 2],
    [3, 0.9, -1],
    [-1, 1.1, 1],
  ], []);
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a0a0a" roughness={0.6} />
      </mesh>
      
      <BoundaryWalls size={18} height={2} />
      
      <InstancedWalls positions={crystalPositions} size={[0.4, 0.7, 0.4]} />
    </group>
  );
});

export const ZaremaAlbertColliders = memo(function ZaremaAlbertColliders() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.8} />
      </mesh>
      <BoundaryWalls size={10} height={3} />
    </group>
  );
});

export const BluePitColliders = memo(function BluePitColliders() {
  const bar = useMemo(() => [[0, 0.55, -4.5]] as [number, number, number][], []);
  const tables = useMemo(
    () =>
      [
        [-3.5, 0.4, 1],
        [3.5, 0.4, 1],
      ] as [number, number, number][],
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.85} />
      </mesh>
      <BoundaryWalls size={14} height={3} />
      <InstancedWalls positions={bar} size={[5, 1.1, 0.9]} />
      <InstancedWalls positions={tables} size={[0.85, 0.8, 0.85]} />
    </group>
  );
});

export const GreenZoneColliders = memo(function GreenZoneColliders() {
  const trees = useMemo(
    () =>
      [
        [-6, 1.2, -5],
        [6, 1.2, -4],
        [-5, 1.2, 5],
        [5, 1.2, 5],
      ] as [number, number, number][],
    [],
  );
  const benches = useMemo(
    () =>
      [
        [-2, 0.35, 0],
        [2, 0.35, 0],
      ] as [number, number, number][],
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#2d5a3d" roughness={0.88} />
      </mesh>
      <BoundaryWalls size={17} height={2.5} />
      <InstancedWalls positions={trees} size={[0.45, 2.4, 0.45]} />
      <InstancedWalls positions={benches} size={[1.2, 0.55, 0.45]} />
    </group>
  );
});

export const DistrictColliders = memo(function DistrictColliders() {
  const lamps = useMemo(
    () =>
      [
        [-7, 1.4, -7],
        [0, 1.4, -8],
        [7, 1.4, -7],
      ] as [number, number, number][],
    [],
  );
  const crates = useMemo(
    () =>
      [
        [-4, 0.45, 3],
        [4, 0.45, 3],
      ] as [number, number, number][],
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#3d3d42" roughness={0.82} />
      </mesh>
      <BoundaryWalls size={19} height={2.5} />
      <InstancedWalls positions={lamps} size={[0.22, 2.8, 0.22]} />
      <InstancedWalls positions={crates} size={[1, 0.9, 0.9]} />
    </group>
  );
});

export const MvdColliders = memo(function MvdColliders() {
  const counter = useMemo(() => [[0, 0.55, -3.2]] as [number, number, number][], []);
  const desks = useMemo(
    () =>
      [
        [-4, 0.48, 2],
        [4, 0.48, 2],
      ] as [number, number, number][],
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#4a5568" roughness={0.88} />
      </mesh>
      <RectangularInvisibleBoundary width={12} depth={10} height={3} wallInset={1} />
      <InstancedWalls positions={counter} size={[4.5, 1.1, 0.7]} />
      <InstancedWalls positions={desks} size={[1.2, 0.95, 0.65]} />
    </group>
  );
});

export const PresidentHotelColliders = memo(function PresidentHotelColliders() {
  const reception = useMemo(() => [[0, 0.55, -3.5]] as [number, number, number][], []);
  const columns = useMemo(
    () =>
      [
        [-4.5, 1.1, 0],
        [4.5, 1.1, 0],
      ] as [number, number, number][],
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#5c5348" roughness={0.86} />
      </mesh>
      <RectangularInvisibleBoundary width={14} depth={10} height={3.5} wallInset={1} />
      <InstancedWalls positions={reception} size={[5, 1.1, 0.85]} />
      <InstancedWalls positions={columns} size={[0.35, 2.2, 0.35]} />
    </group>
  );
});

// ============================================
// СЕЛЕКТОР КОЛЛАЙДЕРОВ ПО СЦЕНЕ
// ============================================

interface SceneColliderSelectorProps {
  sceneId: SceneId;
}

export const SceneColliderSelector = memo(function SceneColliderSelector({ sceneId }: SceneColliderSelectorProps) {
  const colliders = useMemo(() => {
    switch (sceneId) {
      case 'kitchen_night':
        return <ZaremaAlbertColliders />;
      case 'kitchen_dawn':
      case 'home_morning':
        return <KitchenColliders />;
      case 'home_evening':
        return <HomeEveningColliders />;
      case 'volodka_room':
        return <VolodkaRoomColliders />;
      case 'volodka_corridor':
        return <VolodkaCorridorColliders />;
      case 'cafe_evening':
        return <CafeColliders />;
      case 'office_morning':
        return <OfficeColliders />;
      case 'street_night':
      case 'street_winter':
        return <StreetColliders />;
      case 'memorial_park':
        return <MemorialParkColliders />;
      case 'rooftop_night':
        return <RooftopColliders />;
      case 'dream':
        return <DreamColliders />;
      case 'battle':
        return <BattleColliders />;
      case 'zarema_albert_room':
        return <ZaremaAlbertColliders />;
      case 'blue_pit':
        return <BluePitColliders />;
      case 'green_zone':
        return <GreenZoneColliders />;
      case 'district':
        return <DistrictColliders />;
      case 'mvd':
        return <MvdColliders />;
      case 'president_hotel':
        return <PresidentHotelColliders />;
      default:
        return (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#2d3436" roughness={0.8} />
            </mesh>
            <BoundaryWalls size={18} height={2.5} />
          </group>
        );
    }
  }, [sceneId]);

  return <>{colliders}</>;
});

export default SceneColliderSelector;
