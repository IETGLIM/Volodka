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
    // Холодильник
    [4, 1, -2],
    // Стол (низкий блок)
    [0, 0.5, -2],
    // Окно (стена за ним)
    [-3, 1.5, -5],
  ], []);
  
  return (
    <group>
      {/* Пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
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
        <planeGeometry args={[20, 20]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial color="#2a3340" roughness={0.82} />
      </mesh>
      <InstancedWalls positions={[[0, h / 2, -hd]]} size={[14 + wallT * 2, h, wallT]} />
      <InstancedWalls positions={[[-hw, h / 2, 0]]} size={[wallT, h, 10]} />
      <InstancedWalls positions={[[hw, h / 2, 0]]} size={[wallT, h, 10]} />
      <InstancedWalls positions={[[-4.12, h / 2, hd]]} size={[5.9 + wallT, h, wallT]} />
      <InstancedWalls positions={[[4.12, h / 2, hd]]} size={[5.9 + wallT, h, wallT]} />
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
        <planeGeometry args={[4, 13]} />
        <meshStandardMaterial color="#3a3630" roughness={0.82} />
      </mesh>
      <InstancedWalls positions={[[halfW, h / 2, 0]]} size={[wallT, h, 12]} />
      <InstancedWalls positions={[[-halfW, h / 2, 0]]} size={[wallT, h, 12]} />
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
        <planeGeometry args={[20, 20]} />
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
        <planeGeometry args={[20, 20]} />
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
