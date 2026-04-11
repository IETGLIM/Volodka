"use client";

import { memo, useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { SceneId } from '@/data/types';

// ============================================
// ФИЗИЧЕСКИЕ КОЛЛАЙДЕРЫ ДЛЯ RAPIER
// ============================================
// ВАЖНО: Все стены и препятствия должны иметь RigidBody type="fixed"
// и CuboidCollider для корректной работы физики

// ============================================
// НЕВИДИМАЯ СТЕНА С ФИЗИКОЙ
// ============================================

interface PhysicsWallProps {
  position: [number, number, number];
  size: [number, number, number];
}

/**
 * Невидимая стена с физическим коллайдером
 * Блокирует движение игрока
 */
const PhysicsWall = memo(function PhysicsWall({ position, size }: PhysicsWallProps) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
    </RigidBody>
  );
});

// ============================================
// ГРАНИЦЫ КОМНАТЫ
// ============================================

interface BoundaryWallsProps {
  size?: number;
  height?: number;
  position?: [number, number, number];
}

/**
 * Создаёт стены по периметру комнаты
 */
const BoundaryWalls = memo(function BoundaryWalls({
  size = 20,
  height = 4,
  position = [0, 0, 0],
}: BoundaryWallsProps) {
  const halfSize = size / 2;
  const wallThickness = 0.5;

  return (
    <group position={position}>
      {/* Задняя стена */}
      <PhysicsWall
        position={[0, height / 2, -halfSize]}
        size={[size + wallThickness * 2, height, wallThickness]}
      />
      {/* Передняя стена */}
      <PhysicsWall
        position={[0, height / 2, halfSize]}
        size={[size + wallThickness * 2, height, wallThickness]}
      />
      {/* Левая стена */}
      <PhysicsWall
        position={[-halfSize, height / 2, 0]}
        size={[wallThickness, height, size]}
      />
      {/* Правая стена */}
      <PhysicsWall
        position={[halfSize, height / 2, 0]}
        size={[wallThickness, height, size]}
      />
    </group>
  );
});

// ============================================
// ПОЛ С ФИЗИКОЙ
// ============================================

interface PhysicsFloorProps {
  size?: [number, number];
  color?: string;
  position?: [number, number, number];
}

const PhysicsFloor = memo(function PhysicsFloor({
  size = [20, 20],
  color = '#3d2817',
  position = [0, 0, 0],
}: PhysicsFloorProps) {
  return (
    <group position={position}>
      {/* Физический коллайдер пола */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[size[0] / 2, 0.1, size[1] / 2]} position={[0, -0.1, 0]} />
      </RigidBody>

      {/* Визуальный пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
});

// ============================================
// ПРЕПЯТСТВИЯ
// ============================================

interface ObstacleProps {
  position: [number, number, number];
  size: [number, number, number];
}

const PhysicsObstacle = memo(function PhysicsObstacle({ position, size }: ObstacleProps) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
    </RigidBody>
  );
});

const InstancedObstacles = memo(function InstancedObstacles({
  positions,
  size = [1, 2, 1],
}: {
  positions: [number, number, number][];
  size?: [number, number, number];
}) {
  return (
    <>
      {positions.map((pos, i) => (
        <PhysicsObstacle key={`obstacle-${i}`} position={pos} size={size} />
      ))}
    </>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ КУХНИ
// ============================================

export const KitchenColliders = memo(function KitchenColliders() {
  const obstacles: [number, number, number][] = useMemo(() => [
    // Холодильник
    [4, 1, -2],
    // Стол
    [0, 0.5, -2],
  ], []);

  return (
    <group>
      <PhysicsFloor size={[14, 14]} color="#3d2817" />
      <BoundaryWalls size={14} height={3} />
      <InstancedObstacles positions={obstacles} size={[1.2, 2, 0.8]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ КАФЕ
// ============================================

export const CafeColliders = memo(function CafeColliders() {
  const obstacles: [number, number, number][] = useMemo(() => [
    // Барная стойка
    [0, 0.6, -4],
    // Сцена
    [0, 0.5, -6],
  ], []);

  const tables: [number, number, number][] = useMemo(() => [
    [-3, 0.4, 0],
    [0, 0.4, 0],
    [3, 0.4, 0],
  ], []);

  return (
    <group>
      <PhysicsFloor size={[16, 16]} color="#4a3520" />
      <BoundaryWalls size={16} height={3} />
      <InstancedObstacles positions={obstacles} size={[6, 1.2, 1]} />
      <InstancedObstacles positions={tables} size={[0.8, 0.8, 0.8]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ ОФИСА
// ============================================

export const OfficeColliders = memo(function OfficeColliders() {
  const desks: [number, number, number][] = useMemo(() => [
    [-3, 0.5, 0],
    [3, 0.5, 0],
  ], []);

  return (
    <group>
      <PhysicsFloor size={[16, 16]} color="#4a4a4a" />
      <BoundaryWalls size={16} height={3} />
      <InstancedObstacles positions={desks} size={[1.5, 1.2, 0.8]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ УЛИЦЫ
// ============================================

export const StreetColliders = memo(function StreetColliders() {
  const lamps: [number, number, number][] = useMemo(() => [
    [-6, 1.5, -4],
    [-2, 1.5, -4],
    [2, 1.5, -4],
    [6, 1.5, -4],
  ], []);

  const benches: [number, number, number][] = useMemo(() => [
    [-4, 0.3, 2],
    [4, 0.3, 2],
  ], []);

  const trees: [number, number, number][] = useMemo(() => [
    [-8, 1, -6],
    [8, 1, -6],
  ], []);

  return (
    <group>
      <PhysicsFloor size={[30, 30]} color="#2d3436" />
      <BoundaryWalls size={26} height={2.5} />
      <InstancedObstacles positions={lamps} size={[0.2, 3, 0.2]} />
      <InstancedObstacles positions={benches} size={[1.3, 0.6, 0.4]} />
      <InstancedObstacles positions={trees} size={[0.5, 2.5, 0.5]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ МЕМОРИАЛЬНОГО ПАРКА
// ============================================

export const MemorialParkColliders = memo(function MemorialParkColliders() {
  const trees: [number, number, number][] = useMemo(() => [
    [-8, 1.5, -6],
    [-4, 1.5, -2],
    [4, 1.5, 0],
    [8, 1.5, 2],
  ], []);

  const benches: [number, number, number][] = useMemo(() => [
    [-5, 0.3, 0],
    [5, 0.3, 0],
  ], []);

  const monument: [number, number, number][] = useMemo(() => [[0, 0.8, -10]], []);
  const gazebo: [number, number, number][] = useMemo(() => [[0, 1.3, -6]], []);

  return (
    <group>
      <PhysicsFloor size={[25, 25]} color="#2a4a2a" />
      <BoundaryWalls size={22} height={2} />
      <InstancedObstacles positions={trees} size={[0.5, 3, 0.5]} />
      <InstancedObstacles positions={benches} size={[1.3, 0.6, 0.4]} />
      <InstancedObstacles positions={monument} size={[0.6, 1.6, 0.6]} />
      <InstancedObstacles positions={gazebo} size={[5, 2.6, 4]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ КРЫШИ
// ============================================

export const RooftopColliders = memo(function RooftopColliders() {
  const railings: [number, number, number][] = useMemo(() => [
    [-8, 0.7, -8],
    [-4, 0.7, -8],
    [0, 0.7, -8],
    [4, 0.7, -8],
    [8, 0.7, -8],
  ], []);

  return (
    <group>
      <PhysicsFloor size={[20, 20]} color="#2a2a2a" />

      {/* Ограждение по краю крыши */}
      <PhysicsWall position={[0, 0.6, -8]} size={[20, 1.2, 0.2]} />

      {/* Столбы ограждения */}
      <InstancedObstacles positions={railings} size={[0.15, 1.5, 0.15]} />

      {/* Боковые стены */}
      <PhysicsWall position={[-10, 1.5, 0]} size={[0.5, 3, 20]} />
      <PhysicsWall position={[10, 1.5, 0]} size={[0.5, 3, 20]} />
      <PhysicsWall position={[0, 1.5, 10]} size={[20, 3, 0.5]} />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ СЦЕН СНОВ/БИТВ
// ============================================

export const DreamColliders = memo(function DreamColliders() {
  return (
    <group>
      <PhysicsFloor size={[20, 20]} color="#1a0a2e" />
      <BoundaryWalls size={18} height={1.5} />
    </group>
  );
});

export const BattleColliders = memo(function BattleColliders() {
  const crystals: [number, number, number][] = useMemo(() => [
    [-3, 1, -2],
    [2, 0.8, 3],
    [0, 1.5, -3],
    [-2, 1.3, 2],
    [3, 0.9, -1],
    [-1, 1.1, 1],
  ], []);

  return (
    <group>
      <PhysicsFloor size={[20, 20]} color="#2a0a0a" />
      <BoundaryWalls size={18} height={2} />
      <InstancedObstacles positions={crystals} size={[0.4, 0.7, 0.4]} />
    </group>
  );
});

// ============================================
// КОМНАТА "ЗАРЕМУШКА С АЛЬБЕРТОМ"
// ============================================

export const ZaremaAlbertColliders = memo(function ZaremaAlbertColliders() {
  return (
    <group>
      {/* Пол с физикой */}
      <RigidBody type="fixed" position={[0, -0.05, 0]}>
        <CuboidCollider args={[5, 0.05, 4]} />
      </RigidBody>
      {/* Визуальный пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.8} />
      </mesh>
      {/* Границы комнаты */}
      <BoundaryWalls size={10} height={3} />
    </group>
  );
});

// ============================================
// СЕЛЕКТОР КОЛЛАЙДЕРОВ ПО СЦЕНЕ
// ============================================

interface PhysicsSceneCollidersProps {
  sceneId: SceneId;
}

export const PhysicsSceneColliders = memo(function PhysicsSceneColliders({ sceneId }: PhysicsSceneCollidersProps) {
  const colliders = useMemo(() => {
    switch (sceneId) {
      case 'kitchen_night':
      case 'kitchen_dawn':
      case 'home_morning':
      case 'home_evening':
        return <KitchenColliders />;
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
      // Сцена Заремушка с Альбертом
      case 'zarema_albert_room':
        return <ZaremaAlbertColliders />;
      default:
        return (
          <group>
            <PhysicsFloor size={[20, 20]} color="#2d3436" />
            <BoundaryWalls size={18} height={2.5} />
          </group>
        );
    }
  }, [sceneId]);

  return <>{colliders}</>;
});

export default PhysicsSceneColliders;
