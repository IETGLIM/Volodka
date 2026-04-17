"use client";

import { memo, useMemo, useRef, useState, Suspense } from 'react';
import type { SceneId } from '@/data/types';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================
// ТЕКСТУРЫ
// ============================================

function useRoomTextures() {
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    
    const woodTexture = loader.load('/textures/wood_floor.jpg');
    const wallpaperTexture = loader.load('/textures/wallpaper.jpg');
    const carpetTexture = loader.load('/textures/carpet_pattern.jpg');
    
    // Настраиваем повторение
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    wallpaperTexture.wrapS = wallpaperTexture.wrapT = THREE.RepeatWrapping;
    carpetTexture.wrapS = carpetTexture.wrapT = THREE.RepeatWrapping;

    woodTexture.repeat.set(4, 4);
    wallpaperTexture.repeat.set(2, 1);
    carpetTexture.repeat.set(2, 1.5);

    return { woodTexture, wallpaperTexture, carpetTexture };
  }, []);
}

// ============================================
// ИНТЕРАКТИВНЫЙ ОБЪЕКТ
// ============================================

interface InteractiveObjectProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  name: string;
  onInteract?: () => void;
  isInteractable?: boolean;
  rotation?: [number, number, number];
}

export const InteractiveObject = memo(function InteractiveObject({
  position,
  size = [0.5, 0.5, 0.5],
  color = '#aabbcc',
  name,
  onInteract,
  isInteractable = true,
  rotation = [0, 0, 0],
}: InteractiveObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [highlighted, setHighlighted] = useState(false);

  useFrame(({ clock }) => {
    if (meshRef.current && isInteractable) {
      const t = clock.getElapsedTime();
      if (highlighted || hovered) {
        meshRef.current.position.y = position[1] + Math.sin(t * 3) * 0.05;
      }
    }
  });

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh
        ref={meshRef}
        rotation={rotation}
        castShadow
        receiveShadow
        onPointerOver={() => isInteractable && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => isInteractable && onInteract?.()}
        userData={{ isInteractable, name }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={hovered || highlighted ? '#ffd700' : color}
          emissive={hovered || highlighted ? '#ffd700' : '#000000'}
          emissiveIntensity={hovered || highlighted ? 0.3 : 0}
          roughness={0.5}
        />
      </mesh>
      {/* Индикатор взаимодействия */}
      {isInteractable && (hovered || highlighted) && (
        <mesh position={[0, size[1] + 0.3, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      )}
    </RigidBody>
  );
});

// ============================================
// СТОЛ
// ============================================

export const Table = memo(function Table({
  position,
  color = '#5c4033',
}: {
  position: [number, number, number];
  color?: string;
}) {
  const tableHeight = 0.75;
  const tableWidth = 1.2;
  const tableDepth = 0.6;
  const legSize = 0.06;

  return (
    <group position={position}>
      {/* Столешница */}
      <RigidBody type="fixed" position={[0, tableHeight, 0]}>
        <CuboidCollider args={[tableWidth / 2, 0.03, tableDepth / 2]} />
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[tableWidth, 0.04, tableDepth]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* Ножки */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <RigidBody key={i} type="fixed" position={[x * (tableWidth / 2 - legSize), tableHeight / 2, z * (tableDepth / 2 - legSize)]}>
          <CuboidCollider args={[legSize / 2, tableHeight / 2, legSize / 2]} />
          <mesh castShadow receiveShadow>
            <boxGeometry args={[legSize, tableHeight, legSize]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
});

// ============================================
// СТУЛ
// ============================================

export const Chair = memo(function Chair({
  position,
  rotation = 0,
  color = '#4a3520',
}: {
  position: [number, number, number];
  rotation?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Сиденье */}
      <RigidBody type="fixed" position={[0, 0.45, 0]}>
        <CuboidCollider args={[0.25, 0.03, 0.25]} />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Спинка */}
      <RigidBody type="fixed" position={[0, 0.7, -0.22]}>
        <CuboidCollider args={[0.25, 0.3, 0.03]} />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.6, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Ножки */}
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]} castShadow>
          <boxGeometry args={[0.04, 0.45, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
});

// ============================================
// ЯЩИК/КОРОБКА
// ============================================

export const Crate = memo(function Crate({
  position,
  size = [0.5, 0.5, 0.5],
}: {
  position: [number, number, number];
  size?: [number, number, number];
}) {
  return (
    <RigidBody type="fixed" position={[position[0], position[1] + size[1] / 2, position[2]]}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#6b4423" roughness={0.9} />
      </mesh>
      {/* Декоративные планки */}
      <mesh position={[0, 0, size[2] / 2 + 0.001]}>
        <boxGeometry args={[size[0] * 0.9, 0.02, 0.01]} />
        <meshStandardMaterial color="#4a3520" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, size[2] / 2 + 0.001]}>
        <boxGeometry args={[0.02, size[1] * 0.9, 0.01]} />
        <meshStandardMaterial color="#4a3520" roughness={0.8} />
      </mesh>
    </RigidBody>
  );
});

// ============================================
// ЛАМПА
// ============================================

export const Lamp = memo(function Lamp({
  position,
  color = '#ffd93d',
}: {
  position: [number, number, number];
  color?: string;
}) {
  const lightRef = useRef<THREE.PointLight>(null);

  return (
    <group position={position}>
      {/* Основание */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.04, 16]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Стойка */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Абажур */}
      <mesh position={[0, 0.6, 0]}>
        <coneGeometry args={[0.2, 0.25, 16, 1, true]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Источник света */}
      <pointLight
        ref={lightRef}
        position={[0, 0.55, 0]}
        intensity={0.8}
        distance={5}
        color={color}
        castShadow
      />
    </group>
  );
});

// ============================================
// ПОСТЕР НА СТЕНЕ
// ============================================

export const WallPoster = memo(function WallPoster({
  position,
  size = [0.8, 1.0],
  rotation = 0,
  text,
}: {
  position: [number, number, number];
  size?: [number, number];
  rotation?: number;
  text?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Рамка */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[size[0] + 0.04, size[1] + 0.04, 0.02]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
      </mesh>
      {/* Постер */}
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>
      {text && (
        <group position={[0, 0, 0.03]}>
          {/* Текст на постере - placeholder */}
          <mesh>
            <planeGeometry args={[size[0] * 0.9, 0.1]} />
            <meshBasicMaterial color="#a855f7" />
          </mesh>
        </group>
      )}
    </group>
  );
});

// ============================================
// КОВЁР
// ============================================

export const Carpet = memo(function Carpet({
  position,
  size = [3, 2],
  color = '#8b4513',
  texture,
}: {
  position: [number, number, number];
  size?: [number, number];
  color?: string;
  texture?: THREE.Texture;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial
        map={texture}
        color={texture ? '#ffffff' : color}
        roughness={0.95}
      />
    </mesh>
  );
});

// ============================================
// КОМНАТА "ЗАРЕМУШКА С АЛЬБЕРТОМ" (С ТЕКСТУРАМИ)
// ============================================

const ZaremaAlbertRoomContent = memo(function ZaremaAlbertRoomContent() {
  const roomSize = [10, 3, 8]; // ширина, высота, глубина
  const { woodTexture, wallpaperTexture, carpetTexture } = useRoomTextures();

  return (
    <group>
      {/* Пол с текстурой дерева */}
      <RigidBody type="fixed" position={[0, -0.05, 0]}>
        <CuboidCollider args={[roomSize[0] / 2, 0.05, roomSize[2] / 2]} />
      </RigidBody>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[roomSize[0], roomSize[2]]} />
        <meshStandardMaterial map={woodTexture} roughness={0.7} />
      </mesh>

      {/* Ковёр в центре с текстурой */}
      <Carpet
        position={[0, 0.02, 0]}
        size={[4, 3]}
        texture={carpetTexture}
      />

      {/* Стены */}
      {/* Задняя стена */}
      <RigidBody type="fixed" position={[0, roomSize[1] / 2, -roomSize[2] / 2]}>
        <CuboidCollider args={[roomSize[0] / 2, roomSize[1] / 2, 0.1]} />
        <mesh receiveShadow>
          <boxGeometry args={[roomSize[0], roomSize[1], 0.2]} />
          <meshStandardMaterial map={wallpaperTexture} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Передняя стена с дверным проёмом */}
      <RigidBody type="fixed" position={[-roomSize[0] / 4, roomSize[1] / 2, roomSize[2] / 2]}>
        <CuboidCollider args={[roomSize[0] / 4, roomSize[1] / 2, 0.1]} />
        <mesh receiveShadow>
          <boxGeometry args={[roomSize[0] / 2, roomSize[1], 0.2]} />
          <meshStandardMaterial map={wallpaperTexture} roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[roomSize[0] / 4, roomSize[1] / 2, roomSize[2] / 2]}>
        <CuboidCollider args={[roomSize[0] / 4, roomSize[1] / 2, 0.1]} />
        <mesh receiveShadow>
          <boxGeometry args={[roomSize[0] / 2, roomSize[1], 0.2]} />
          <meshStandardMaterial map={wallpaperTexture} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Боковые стены */}
      <RigidBody type="fixed" position={[-roomSize[0] / 2, roomSize[1] / 2, 0]}>
        <CuboidCollider args={[0.1, roomSize[1] / 2, roomSize[2] / 2]} />
        <mesh receiveShadow>
          <boxGeometry args={[0.2, roomSize[1], roomSize[2]]} />
          <meshStandardMaterial map={wallpaperTexture} roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[roomSize[0] / 2, roomSize[1] / 2, 0]}>
        <CuboidCollider args={[0.1, roomSize[1] / 2, roomSize[2] / 2]} />
        <mesh receiveShadow>
          <boxGeometry args={[0.2, roomSize[1], roomSize[2]]} />
          <meshStandardMaterial map={wallpaperTexture} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Потолок */}
      <RigidBody type="fixed" position={[0, roomSize[1], 0]}>
        <CuboidCollider args={[roomSize[0] / 2, 0.1, roomSize[2] / 2]} />
        <mesh receiveShadow>
          <boxGeometry args={[roomSize[0], 0.2, roomSize[2]]} />
          <meshStandardMaterial color="#2d2d3d" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Мебель */}
      {/* Стол в центре */}
      <Table position={[0, 0, -1]} color="#5c4033" />

      {/* Стулья */}
      <Chair position={[-0.8, 0, -0.5]} rotation={Math.PI / 4} />
      <Chair position={[0.8, 0, -0.5]} rotation={-Math.PI / 4} />
      <Chair position={[-0.8, 0, -1.8]} rotation={Math.PI * 3/4} />
      <Chair position={[0.8, 0, -1.8]} rotation={-Math.PI * 3/4} />

      {/* Лампы */}
      <Lamp position={[-3, 0, -2]} color="#ffd93d" />
      <Lamp position={[3, 0, -2]} color="#ff9f43" />

      {/* Ящики */}
      <Crate position={[-4, 0, -3]} size={[0.6, 0.5, 0.6]} />
      <Crate position={[-4, 0.5, -3]} size={[0.4, 0.3, 0.4]} />
      <Crate position={[4, 0, 2]} size={[0.5, 0.4, 0.5]} />

      {/* Постеры на стенах */}
      <WallPoster position={[-4.9, 2, -2]} rotation={Math.PI / 2} text="ART" size={[1, 0.7]} />
      <WallPoster position={[4.9, 2, 0]} rotation={-Math.PI / 2} text="MUSIC" size={[0.7, 1]} />
      <WallPoster position={[0, 2, -3.9]} rotation={0} text="POETRY" size={[1.2, 0.8]} />

      {/* Книжная полка */}
      <group position={[-4, 0, 1]}>
        <RigidBody type="fixed" position={[0, 0.75, 0]}>
          <CuboidCollider args={[0.8, 0.75, 0.2]} />
        </RigidBody>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 0.3]} />
          <meshStandardMaterial color="#4a3520" roughness={0.8} />
        </mesh>
        {/* Книги */}
        {[-0.5, -0.2, 0.1, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 1.2, 0.05]} castShadow>
            <boxGeometry args={[0.15, 0.5, 0.2]} />
            <meshStandardMaterial color={['#8b4513', '#2d5a4b', '#5a2d4b', '#4b2d5a'][i]} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Диван */}
      <group position={[3, 0, 2]}>
        <RigidBody type="fixed" position={[0, 0.3, 0]}>
          <CuboidCollider args={[1.5, 0.3, 0.6]} />
        </RigidBody>
        {/* Сиденье */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 0.4, 1]} />
          <meshStandardMaterial color="#6b4423" roughness={0.9} />
        </mesh>
        {/* Спинка */}
        <mesh position={[0, 0.65, -0.4]} castShadow receiveShadow>
          <boxGeometry args={[3, 0.6, 0.2]} />
          <meshStandardMaterial color="#5c4033" roughness={0.9} />
        </mesh>
        {/* Подушки */}
        <mesh position={[-0.8, 0.5, 0]} castShadow>
          <boxGeometry args={[0.5, 0.3, 0.4]} />
          <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </mesh>
        <mesh position={[0.8, 0.5, 0]} castShadow>
          <boxGeometry args={[0.5, 0.3, 0.4]} />
          <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </mesh>
      </group>

      {/* Растение в горшке */}
      <group position={[4, 0, -3]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 0.4, 16]} />
          <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#2d5a2d" roughness={0.9} />
        </mesh>
      </group>

      {/* Тёплый свет */}
      <pointLight position={[0, 2.5, 0]} intensity={1.5} color="#ffd93d" distance={10} />
    </group>
  );
});

export const ZaremaAlbertRoom = memo(function ZaremaAlbertRoom() {
  return (
    <Suspense fallback={null}>
      <ZaremaAlbertRoomContent />
    </Suspense>
  );
});

/** Визуальная оболочка комнаты для Rapier-канваса: только сцены с готовым 3D-мешем. */
export const PhysicsExplorationRoomVisual = memo(function PhysicsExplorationRoomVisual({
  sceneId,
}: {
  sceneId: SceneId;
}) {
  switch (sceneId) {
    case 'zarema_albert_room':
      return <ZaremaAlbertRoom />;
    default:
      return null;
  }
});

// ============================================
// УЮТНАЯ КОМНАТА (ОСНОВНАЯ)
// ============================================

export const CozyRoom = memo(function CozyRoom() {
  return (
    <group>
      {/* Пол */}
      <RigidBody type="fixed" position={[0, -0.05, 0]}>
        <CuboidCollider args={[8, 0.05, 8]} />
      </RigidBody>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>

      {/* Стены */}
      <RigidBody type="fixed" position={[0, 1.5, -8]}>
        <CuboidCollider args={[8, 1.5, 0.1]} />
        <mesh receiveShadow>
          <boxGeometry args={[16, 3, 0.2]} />
          <meshStandardMaterial color="#4a4a5a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[-8, 1.5, 0]}>
        <CuboidCollider args={[0.1, 1.5, 8]} />
        <mesh receiveShadow>
          <boxGeometry args={[0.2, 3, 16]} />
          <meshStandardMaterial color="#4a4a5a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[8, 1.5, 0]}>
        <CuboidCollider args={[0.1, 1.5, 8]} />
        <mesh receiveShadow>
          <boxGeometry args={[0.2, 3, 16]} />
          <meshStandardMaterial color="#4a4a5a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 1.5, 8]}>
        <CuboidCollider args={[8, 1.5, 0.1]} />
        <mesh receiveShadow>
          <boxGeometry args={[16, 3, 0.2]} />
          <meshStandardMaterial color="#4a4a5a" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Мебель */}
      <Table position={[0, 0, -4]} />
      <Chair position={[-1, 0, -3]} rotation={Math.PI / 6} />
      <Chair position={[1, 0, -3]} rotation={-Math.PI / 6} />
      <Lamp position={[-5, 0, -5]} />
      <Lamp position={[5, 0, -5]} />
      <Crate position={[-5, 0, 3]} size={[0.8, 0.6, 0.8]} />
      <Crate position={[5, 0, 3]} size={[0.6, 0.4, 0.6]} />

      {/* Ковёр */}
      <Carpet position={[0, 0.02, 0]} size={[4, 3]} color="#5a3030" />

      {/* Постеры */}
      <WallPoster position={[-7.9, 2, -4]} rotation={Math.PI / 2} text="ART" />
      <WallPoster position={[7.9, 2, 4]} rotation={-Math.PI / 2} text="POETRY" />
    </group>
  );
});

export default ZaremaAlbertRoom;
