"use client";

import { memo, useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { SceneId } from '@/data/types';
import { footstepColliderName, type FootstepMaterial } from '@/lib/footstepMaterials';

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
  footstepMaterial?: FootstepMaterial;
}

/**
 * Невидимая стена с физическим коллайдером
 * Блокирует движение игрока
 */
const PhysicsWall = memo(function PhysicsWall({
  position,
  size,
  footstepMaterial = 'concrete',
}: PhysicsWallProps) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} name={footstepColliderName(footstepMaterial)} />
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

/**
 * Прямоугольный периметр (разные ширина/глубина), те же кубоиды, что и у {@link BoundaryWalls}.
 */
const RectangularBoundaryWalls = memo(function RectangularBoundaryWalls({
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
  /** Уменьшение внутреннего прямоугольника относительно полного width/depth по каждой оси */
  wallInset?: number;
}) {
  const bw = Math.max(2, width - wallInset);
  const bd = Math.max(2, depth - wallInset);
  const halfW = bw / 2;
  const halfD = bd / 2;
  const wallThickness = 0.5;

  return (
    <group position={position}>
      <PhysicsWall
        position={[0, height / 2, -halfD]}
        size={[bw + wallThickness * 2, height, wallThickness]}
      />
      <PhysicsWall
        position={[0, height / 2, halfD]}
        size={[bw + wallThickness * 2, height, wallThickness]}
      />
      <PhysicsWall
        position={[-halfW, height / 2, 0]}
        size={[wallThickness, height, bd]}
      />
      <PhysicsWall
        position={[halfW, height / 2, 0]}
        size={[wallThickness, height, bd]}
      />
    </group>
  );
});

// ============================================
// ПОЛ С ФИЗИКОЙ
// ============================================
//
// Диагностика мерцания: на сцену обычно приходится **один** `PhysicsFloor` (один `CuboidCollider` на пол).
// Мелкая сетка box-коллайдеров для пола здесь не используется — см. отдельные `InstancedObstacles` для мебели.
// Визуальный пол в интерьерах (напр. `VolodkaRoomVisual`) чуть **выше** коллайдера (`y≈0.015` vs кубоид `y≈-0.22`) — намеренный зазор, не дублирующийся «второй пол» в Rapier.

interface PhysicsFloorProps {
  size?: [number, number];
  color?: string;
  position?: [number, number, number];
  footstepMaterial?: FootstepMaterial;
}

const PhysicsFloor = memo(function PhysicsFloor({
  size = [20, 20],
  color = '#3d2817',
  position = [0, 0, 0],
  footstepMaterial = 'wood',
}: PhysicsFloorProps) {
  return (
    <group position={position}>
      {/* Физический коллайдер пола */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[size[0] / 2, 0.22, size[1] / 2]}
          position={[0, -0.22, 0]}
          name={footstepColliderName(footstepMaterial)}
        />
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
  footstepMaterial?: FootstepMaterial;
}

const PhysicsObstacle = memo(function PhysicsObstacle({ position, size, footstepMaterial = 'wood' }: ObstacleProps) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} name={footstepColliderName(footstepMaterial)} />
    </RigidBody>
  );
});

const InstancedObstacles = memo(function InstancedObstacles({
  positions,
  size = [1, 2, 1],
  footstepMaterial = 'wood',
}: {
  positions: [number, number, number][];
  size?: [number, number, number];
  footstepMaterial?: FootstepMaterial;
}) {
  return (
    <>
      {positions.map((pos, i) => (
        <PhysicsObstacle key={`obstacle-${i}`} position={pos} size={size} footstepMaterial={footstepMaterial} />
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
      <PhysicsFloor size={[14, 14]} color="#3d2817" footstepMaterial="wood" />
      <BoundaryWalls size={14} height={3} />
      <InstancedObstacles positions={obstacles} size={[1.2, 2, 0.8]} footstepMaterial="wood" />
    </group>
  );
});

/** Вечерняя квартира: пол и стены без дублирующей «кухонной» мебели — коллизии дают интерактивные объекты сцены. */
export const HomeEveningColliders = memo(function HomeEveningColliders() {
  return (
    <group>
      <PhysicsFloor size={[14, 14]} color="#241c14" footstepMaterial="wood" />
      <BoundaryWalls size={14} height={3} />
    </group>
  );
});

/** Комната Володьки: 14×10, проём в стене у двери в коридор (z+). */
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
      <PhysicsFloor size={[14, 10]} color="#2a3340" footstepMaterial="wood" />
      <PhysicsWall position={[0, h / 2, -hd]} size={[14 + wallT * 2, h, wallT]} />
      <PhysicsWall position={[-hw, h / 2, 0]} size={[wallT, h, 10]} />
      <PhysicsWall position={[hw, h / 2, 0]} size={[wallT, h, 10]} />
      <PhysicsWall position={[-4.12, h / 2, hd]} size={[5.9 + wallT, h, wallT]} />
      <PhysicsWall position={[4.12, h / 2, hd]} size={[5.9 + wallT, h, wallT]} />
      <InstancedObstacles positions={deskMain} size={[1.45, 0.08, 0.78]} footstepMaterial="wood" />
      <InstancedObstacles positions={deskSide} size={[1.05, 0.08, 0.58]} footstepMaterial="wood" />
      <InstancedObstacles positions={wardrobes} size={[0.58, 1.75, 0.68]} footstepMaterial="wood" />
      <InstancedObstacles positions={sofa} size={[1.85, 0.52, 0.88]} footstepMaterial="wood" />
    </group>
  );
});

/** Коридор трёшки 3.5×12: пол + стены с проёмами у дверей в комнату (юг) и в общую зону (север). */
export const VolodkaCorridorColliders = memo(function VolodkaCorridorColliders() {
  const h = 3;
  const wallT = 0.5;
  const halfW = 1.75;
  const halfD = 6;
  const shoe = useMemo(() => [[-1.15, 0.26, -4.05]] as [number, number, number][], []);
  const radiator = useMemo(() => [[1.22, 0.24, -0.8]] as [number, number, number][], []);

  return (
    <group>
      <PhysicsFloor size={[3.5, 12]} color="#3a3630" footstepMaterial="wood" />
      {/* Восток / запад — сплошные */}
      <PhysicsWall position={[halfW, h / 2, 0]} size={[wallT, h, 12]} />
      <PhysicsWall position={[-halfW, h / 2, 0]} size={[wallT, h, 12]} />
      {/* Юг: проём под дверь в комнату ~1 m по X */}
      <PhysicsWall position={[-1.125, h / 2, -halfD]} size={[1.25, h, wallT]} />
      <PhysicsWall position={[1.125, h / 2, -halfD]} size={[1.25, h, wallT]} />
      {/* Север: проём в квартиру */}
      <PhysicsWall position={[-1.125, h / 2, halfD]} size={[1.25, h, wallT]} />
      <PhysicsWall position={[1.125, h / 2, halfD]} size={[1.25, h, wallT]} />
      <InstancedObstacles positions={shoe} size={[0.64, 0.52, 0.28]} footstepMaterial="wood" />
      <InstancedObstacles positions={radiator} size={[0.12, 0.48, 2.35]} footstepMaterial="metal" />
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
      <PhysicsFloor size={[16, 16]} color="#4a3520" footstepMaterial="wood" />
      <BoundaryWalls size={16} height={3} />
      <InstancedObstacles positions={obstacles} size={[6, 1.2, 1]} footstepMaterial="wood" />
      <InstancedObstacles positions={tables} size={[0.8, 0.8, 0.8]} footstepMaterial="wood" />
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
      <PhysicsFloor size={[16, 16]} color="#4a4a4a" footstepMaterial="carpet" />
      <BoundaryWalls size={16} height={3} />
      <InstancedObstacles positions={desks} size={[1.5, 1.2, 0.8]} footstepMaterial="wood" />
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
      <PhysicsFloor size={[30, 30]} color="#2d3436" footstepMaterial="concrete" />
      <BoundaryWalls size={26} height={2.5} />
      <InstancedObstacles positions={lamps} size={[0.2, 3, 0.2]} footstepMaterial="metal" />
      <InstancedObstacles positions={benches} size={[1.3, 0.6, 0.4]} footstepMaterial="wood" />
      <InstancedObstacles positions={trees} size={[0.5, 2.5, 0.5]} footstepMaterial="grass" />
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
      <PhysicsFloor size={[25, 25]} color="#2a4a2a" footstepMaterial="grass" />
      <BoundaryWalls size={22} height={2} />
      <InstancedObstacles positions={trees} size={[0.5, 3, 0.5]} footstepMaterial="grass" />
      <InstancedObstacles positions={benches} size={[1.3, 0.6, 0.4]} footstepMaterial="wood" />
      <InstancedObstacles positions={monument} size={[0.6, 1.6, 0.6]} footstepMaterial="concrete" />
      <InstancedObstacles positions={gazebo} size={[5, 2.6, 4]} footstepMaterial="wood" />
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
      <PhysicsFloor size={[20, 20]} color="#2a2a2a" footstepMaterial="concrete" />

      {/* Ограждение по краю крыши */}
      <PhysicsWall position={[0, 0.6, -8]} size={[20, 1.2, 0.2]} footstepMaterial="metal" />

      {/* Столбы ограждения */}
      <InstancedObstacles positions={railings} size={[0.15, 1.5, 0.15]} footstepMaterial="metal" />

      {/* Боковые стены */}
      <PhysicsWall position={[-10, 1.5, 0]} size={[0.5, 3, 20]} footstepMaterial="concrete" />
      <PhysicsWall position={[10, 1.5, 0]} size={[0.5, 3, 20]} footstepMaterial="concrete" />
      <PhysicsWall position={[0, 1.5, 10]} size={[20, 3, 0.5]} footstepMaterial="concrete" />
    </group>
  );
});

// ============================================
// КОЛЛАЙДЕРЫ СЦЕН СНОВ/БИТВ
// ============================================

export const DreamColliders = memo(function DreamColliders() {
  return (
    <group>
      <PhysicsFloor size={[20, 20]} color="#1a0a2e" footstepMaterial="default" />
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
      <PhysicsFloor size={[20, 20]} color="#2a0a0a" footstepMaterial="concrete" />
      <BoundaryWalls size={18} height={2} />
      <InstancedObstacles positions={crystals} size={[0.4, 0.7, 0.4]} footstepMaterial="metal" />
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
      <RigidBody type="fixed" colliders={false} position={[0, -0.05, 0]}>
        <CuboidCollider args={[5, 0.05, 4]} name={footstepColliderName('wood')} />
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
// НОВЫЕ ЛОКАЦИИ (размеры пола = src/config/scenes.ts)
// ============================================

export const BluePitColliders = memo(function BluePitColliders() {
  const bar = useMemo(() => [[0, 0.55, -4.5]] as [number, number, number][], []);
  const tables = useMemo(
    () =>
      [
        [-3.5, 0.4, 1],
        [3.5, 0.4, 1],
      ] as [number, number, number][],
    []
  );

  return (
    <group>
      <PhysicsFloor size={[15, 15]} color="#1e3a5f" footstepMaterial="concrete" />
      <BoundaryWalls size={14} height={3} />
      <InstancedObstacles positions={bar} size={[5, 1.1, 0.9]} footstepMaterial="wood" />
      <InstancedObstacles positions={tables} size={[0.85, 0.8, 0.85]} footstepMaterial="wood" />
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
    []
  );
  const benches = useMemo(
    () =>
      [
        [-2, 0.35, 0],
        [2, 0.35, 0],
      ] as [number, number, number][],
    []
  );

  return (
    <group>
      <PhysicsFloor size={[18, 18]} color="#2d5a3d" footstepMaterial="grass" />
      <BoundaryWalls size={17} height={2.5} />
      <InstancedObstacles positions={trees} size={[0.45, 2.4, 0.45]} footstepMaterial="grass" />
      <InstancedObstacles positions={benches} size={[1.2, 0.55, 0.45]} footstepMaterial="wood" />
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
    []
  );
  const crates = useMemo(
    () =>
      [
        [-4, 0.45, 3],
        [4, 0.45, 3],
      ] as [number, number, number][],
    []
  );

  return (
    <group>
      <PhysicsFloor size={[20, 20]} color="#3d3d42" footstepMaterial="concrete" />
      <BoundaryWalls size={19} height={2.5} />
      <InstancedObstacles positions={lamps} size={[0.22, 2.8, 0.22]} footstepMaterial="metal" />
      <InstancedObstacles positions={crates} size={[1, 0.9, 0.9]} footstepMaterial="wood" />
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
    []
  );

  return (
    <group>
      <PhysicsFloor size={[12, 10]} color="#4a5568" footstepMaterial="carpet" />
      <RectangularBoundaryWalls width={12} depth={10} height={3} wallInset={1} />
      <InstancedObstacles positions={counter} size={[4.5, 1.1, 0.7]} footstepMaterial="wood" />
      <InstancedObstacles positions={desks} size={[1.2, 0.95, 0.65]} footstepMaterial="wood" />
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
    []
  );

  return (
    <group>
      <PhysicsFloor size={[14, 10]} color="#5c5348" footstepMaterial="carpet" />
      <RectangularBoundaryWalls width={14} depth={10} height={3.5} wallInset={1} />
      <InstancedObstacles positions={reception} size={[5, 1.1, 0.85]} footstepMaterial="wood" />
      <InstancedObstacles positions={columns} size={[0.35, 2.2, 0.35]} footstepMaterial="concrete" />
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
      // Сцена Заремушка с Альбертом
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
            <PhysicsFloor size={[20, 20]} color="#2d3436" footstepMaterial="concrete" />
            <BoundaryWalls size={18} height={2.5} />
          </group>
        );
    }
  }, [sceneId]);

  return <>{colliders}</>;
});

export default PhysicsSceneColliders;
