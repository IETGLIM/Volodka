"use client";

import { useRef, useMemo, memo, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Stars, useTexture } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { SceneId, VisualState } from '@/data/types';
import { ZaremaAlbertRoom } from './RoomEnvironment';

// ============================================
// INSTANCED MESHES FOR PERFORMANCE
// ============================================

interface InstancedTreesProps {
  positions: [number, number, number][];
}

const InstancedTrees = memo(function InstancedTrees({ positions }: InstancedTreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);

  const trunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.2, 2, 8), []);
  const crownGeometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);

  useEffect(() => {
    if (!trunkRef.current || !crownRef.current) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();

    positions.forEach((pos, i) => {
      // Ствол
      position.set(pos[0], pos[1] + 1, pos[2]);
      matrix.setPosition(position);
      trunkRef.current!.setMatrixAt(i, matrix);

      // Крона
      position.set(pos[0], pos[1] + 2.5, pos[2]);
      matrix.setPosition(position);
      crownRef.current!.setMatrixAt(i, matrix);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    crownRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <>
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeometry, undefined, positions.length]}
        castShadow
      >
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={crownRef}
        args={[crownGeometry, undefined, positions.length]}
        castShadow
      >
        <meshStandardMaterial color="#1a3a1a" roughness={0.8} />
      </instancedMesh>
    </>
  );
});

interface InstancedLampsProps {
  positions: [number, number, number][];
}

const InstancedLamps = memo(function InstancedLamps({ positions }: InstancedLampsProps) {
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);

  const poleGeometry = useMemo(() => new THREE.CylinderGeometry(0.08, 0.1, 3, 8), []);
  const lightGeometry = useMemo(() => new THREE.SphereGeometry(0.15, 16, 16), []);

  useEffect(() => {
    if (!poleRef.current || !lightRef.current) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();

    positions.forEach((pos, i) => {
      position.set(pos[0], pos[1] + 1.5, pos[2]);
      matrix.setPosition(position);
      poleRef.current!.setMatrixAt(i, matrix);

      position.set(pos[0], pos[1] + 3.1, pos[2]);
      matrix.setPosition(position);
      lightRef.current!.setMatrixAt(i, matrix);
    });

    poleRef.current.instanceMatrix.needsUpdate = true;
    lightRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <>
      <instancedMesh
        ref={poleRef}
        args={[poleGeometry, undefined, positions.length]}
        castShadow
      >
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.3} />
      </instancedMesh>
      <instancedMesh
        ref={lightRef}
        args={[lightGeometry, undefined, positions.length]}
      >
        <meshBasicMaterial color="#ffdd88" />
      </instancedMesh>
      {positions.map((pos, i) => (
        <pointLight
          key={`lamp-light-${i}`}
          position={[pos[0], pos[1] + 3, pos[2]]}
          intensity={2}
          color="#ffdd88"
          distance={10}
        />
      ))}
    </>
  );
});

// ============================================
// SNOWFLAKES WITH INSTANCING
// ============================================

interface SnowflakesProps {
  intensity?: number;
}

const Snowflakes = memo(function Snowflakes({ intensity = 1 }: SnowflakesProps) {
  const count = Math.floor(150 * intensity);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const positionsRef = useRef<Float32Array>(null);

  useEffect(() => {
    if (!positionsRef.current) {
      positionsRef.current = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positionsRef.current[i * 3] = (Math.random() - 0.5) * 25;
        positionsRef.current[i * 3 + 1] = Math.random() * 20;
        positionsRef.current[i * 3 + 2] = (Math.random() - 0.5) * 25;
      }
    }
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !positionsRef.current) return;

    const time = clock.getElapsedTime();
    const positions = positionsRef.current;

    for (let i = 0; i < count; i++) {
      // Обновляем позицию
      positions[i * 3] += Math.sin(time * 0.5 + i) * 0.01;
      positions[i * 3 + 1] -= 0.02 + Math.random() * 0.01;
      positions[i * 3 + 2] += Math.cos(time * 0.3 + i) * 0.01;

      // Сбрасываем если упало ниже пола
      if (positions[i * 3 + 1] < -1) {
        positions[i * 3 + 1] = 20;
        positions[i * 3] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
      }

      tempMatrix.setPosition(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.025, 4, 4]} />
      <meshBasicMaterial color="white" transparent opacity={0.6} />
    </instancedMesh>
  );
});

// ============================================
// SCENE ENVIRONMENTS
// ============================================

/** Узкий коридор панельной трёшки: стены, потолок, косяки дверей (пол и коллизии — в коллайдерах сцены). */
const VolodkaCorridorEnvironment = memo(function VolodkaCorridorEnvironment() {
  const w = 3.5;
  const d = 12;
  const h = 2.85;
  const t = 0.09;
  return (
    <group>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d - 0.25]} />
        <meshStandardMaterial color="#d4c4b0" roughness={0.86} />
      </mesh>
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d - 0.25]} />
        <meshStandardMaterial color="#d4c4b0" roughness={0.86} />
      </mesh>
      <mesh position={[0, h - 0.07, 0]} receiveShadow>
        <boxGeometry args={[w - 0.12, 0.12, d - 0.28]} />
        <meshStandardMaterial color="#c8bdb0" roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + 0.36]} castShadow>
        <boxGeometry args={[1.06, h * 0.9, 0.12]} />
        <meshStandardMaterial color="#5c4a3a" roughness={0.78} />
      </mesh>
      <mesh position={[0, h / 2, d / 2 - 0.36]} castShadow>
        <boxGeometry args={[1.06, h * 0.9, 0.12]} />
        <meshStandardMaterial color="#4a3f35" roughness={0.78} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} intensity={0.55} color="#f5e6d3" distance={14} decay={2} />
    </group>
  );
});

const KitchenEnvironment = memo(function KitchenEnvironment() {
  return (
    <group>
      {/* Стол */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.08, 1]} />
          <meshStandardMaterial color="#5c4033" roughness={0.8} />
        </mesh>
        {[-0.9, 0.9].map((x, i) =>
          [-0.4, 0.4].map((z, j) => (
            <mesh key={`${i}-${j}`} position={[x, 0.45, z]} castShadow>
              <boxGeometry args={[0.06, 0.9, 0.06]} />
              <meshStandardMaterial color="#3d2817" roughness={0.8} />
            </mesh>
          ))
        )}
        {/* Тетрадь */}
        <mesh position={[-0.4, 0.97, 0]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.25, 0.01, 0.18]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.95} />
        </mesh>
        {/* Чашка */}
        <mesh position={[0.5, 0.96, 0.2]}>
          <cylinderGeometry args={[0.04, 0.035, 0.08, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      </group>

      {/* Лампа */}
      <group position={[0, 2.5, -2]}>
        <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.25, 8]} />
          <meshStandardMaterial color="#f0e68c" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, -0.2, 0]} intensity={3} color="#ffcc00" distance={8} />
      </group>

      {/* Холодильник */}
      <group position={[4, 0, -2]}>
        <mesh position={[0, 1, 0]} castShadow receiveShadow>
          <boxGeometry args={[1, 2, 0.7]} />
          <meshStandardMaterial color="#d4d4d4" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* Окно */}
      <group position={[-3, 2, -5]}>
        <mesh>
          <boxGeometry args={[2, 1.5, 0.1]} />
          <meshStandardMaterial color="#4a3728" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[1.8, 1.3, 0.02]} />
          <meshStandardMaterial color="#0a1628" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
});

const OfficeEnvironment = memo(function OfficeEnvironment() {
  return (
    <group>
      {/* Рабочие столы */}
      {[-3, 3].map((x, idx) => (
        <group key={idx} position={[x, 0, 0]}>
          <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.05, 0.7]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Монитор */}
          <mesh position={[0, 1.1, -0.15]} castShadow>
            <boxGeometry args={[0.5, 0.35, 0.03]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, 1.1, -0.13]}>
            <boxGeometry args={[0.48, 0.32, 0.01]} />
            <meshBasicMaterial color={idx === 0 ? "#0a1628" : "#1a0a28"} />
          </mesh>
          {/* Клавиатура */}
          <mesh position={[0, 0.78, 0.1]} castShadow>
            <boxGeometry args={[0.35, 0.015, 0.12]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Окна */}
      {[-4, 0, 4].map((x, i) => (
        <group key={`window-${i}`} position={[x, 3, -5]}>
          <mesh>
            <boxGeometry args={[2, 1.5, 0.1]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[1.8, 1.3, 0.02]} />
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

const CafeEnvironment = memo(function CafeEnvironment() {
  return (
    <group>
      {/* Барная стойка */}
      <mesh position={[0, 0.55, -4]} castShadow receiveShadow>
        <boxGeometry args={[6, 1.1, 0.8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.7} />
      </mesh>

      {/* Столики */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.05, 16]} />
            <meshStandardMaterial color="#4a3728" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.375, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.75, 8]} />
            <meshStandardMaterial color="#3d2817" />
          </mesh>
        </group>
      ))}

      {/* Сцена */}
      <group position={[0, 0, -6]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[4, 0.2, 2]} />
          <meshStandardMaterial color="#2d2d2d" />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 1.5, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* Тёплый свет */}
      <pointLight position={[0, 3, -2]} intensity={2} color="#ffa500" distance={15} />
      <pointLight position={[-4, 2, 0]} intensity={1} color="#ff8c00" distance={10} />
      <pointLight position={[4, 2, 0]} intensity={1} color="#ff8c00" distance={10} />
    </group>
  );
});

const StreetEnvironment = memo(function StreetEnvironment() {
  // Предопределённые позиции для инстансинга
  const lampPositions: [number, number, number][] = useMemo(() => [
    [-6, 0, -4], [-2, 0, -4], [2, 0, -4], [6, 0, -4]
  ], []);

  const treePositions: [number, number, number][] = useMemo(() => [
    [-8, 0, -6], [8, 0, -6]
  ], []);

  return (
    <group>
      <InstancedLamps positions={lampPositions} />
      <InstancedTrees positions={treePositions} />

      {/* Скамейки */}
      {[-4, 4].map((x, i) => (
        <group key={`bench-${i}`} position={[x, 0, 2]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.2, 0.05, 0.35]} />
            <meshStandardMaterial color="#5c4033" roughness={0.8} />
          </mesh>
          <mesh position={[-0.55, 0.25, -0.12]}>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color="#3d2817" />
          </mesh>
          <mesh position={[0.55, 0.25, -0.12]}>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color="#3d2817" />
          </mesh>
        </group>
      ))}

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
    </group>
  );
});

const MemorialParkEnvironment = memo(function MemorialParkEnvironment() {
  const treePositions: [number, number, number][] = useMemo(() => [
    [-8, 0, -6], [-4, 0, -4], [4, 0, -2], [8, 0, 0]
  ], []);

  return (
    <group>
      <InstancedTrees positions={treePositions} />

      {/* Беседка */}
      <group position={[0, 0, -6]}>
        {[-2, 2].map((x, i) => (
          <mesh key={i} position={[x, 1.25, -2]}>
            <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
            <meshStandardMaterial color="#8a8a8a" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 2.5, -2]}>
          <boxGeometry args={[5, 0.1, 4]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.7} />
        </mesh>
      </group>

      {/* Скамейки */}
      {[-5, 5].map((x, i) => (
        <group key={`bench-${i}`} position={[x, 0, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.2, 0.05, 0.35]} />
            <meshStandardMaterial color="#5c4033" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Памятник */}
      <group position={[0, 0, -10]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[2, 0.2, 1]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[0.4, 1.5, 0.4]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.4} metalness={0.2} />
        </mesh>
      </group>

      <pointLight position={[0, 3, 0]} intensity={1.5} color="#ffd9a0" distance={15} />
    </group>
  );
});

const RooftopEnvironment = memo(function RooftopEnvironment() {
  const cityLights = useMemo(() => [
    { pos: [-12, -1, -18] as [number, number, number], color: '#ffaa00' },
    { pos: [-8, -1, -20] as [number, number, number], color: '#ff5500' },
    { pos: [-4, -1, -22] as [number, number, number], color: '#ffffff' },
    { pos: [0, -1, -19] as [number, number, number], color: '#ffaa00' },
    { pos: [4, -1, -21] as [number, number, number], color: '#ff5500' },
    { pos: [8, -1, -18] as [number, number, number], color: '#ffffff' },
    { pos: [12, -1, -23] as [number, number, number], color: '#ffaa00' },
  ], []);

  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Ограждение */}
      <mesh position={[0, 0.6, -8]} castShadow>
        <boxGeometry args={[20, 1.2, 0.15]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.7} />
      </mesh>

      {[-8, -4, 0, 4, 8].map((x, i) => (
        <mesh key={i} position={[x, 0.7, -8]} castShadow>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.5} metalness={0.7} />
        </mesh>
      ))}

      {/* Городские огни */}
      {cityLights.map((light, i) => (
        <mesh key={`light-${i}`} position={light.pos}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={light.color} />
        </mesh>
      ))}
    </group>
  );
});

const DreamEnvironment = memo(function DreamEnvironment() {
  const particles = useMemo(() => [
    { pos: [-4, 2, -3] as [number, number, number], speed: 1.2, color: '#a855f7' },
    { pos: [3, 3, -2] as [number, number, number], speed: 1.5, color: '#ec4899' },
    { pos: [-2, 4, -4] as [number, number, number], speed: 0.8, color: '#3b82f6' },
    { pos: [5, 2, 2] as [number, number, number], speed: 1.0, color: '#a855f7' },
    { pos: [-5, 3, 1] as [number, number, number], speed: 1.3, color: '#ec4899' },
    { pos: [0, 5, -5] as [number, number, number], speed: 1.8, color: '#3b82f6' },
  ], []);

  return (
    <group>
      {/* Центральная сфера */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[0, 2, -3]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>
      <pointLight position={[0, 2, -3]} intensity={4} color="#a855f7" distance={12} />

      {/* Частицы света */}
      {particles.map((p, i) => (
        <Float key={i} speed={p.speed} floatIntensity={0.5}>
          <mesh position={p.pos}>
            <sphereGeometry args={[0.03]} />
            <meshBasicMaterial color={p.color} transparent opacity={0.8} />
          </mesh>
        </Float>
      ))}
    </group>
  );
});

const BattleEnvironment = memo(function BattleEnvironment() {
  const crystals = useMemo(() => [
    { pos: [-3, 2, -2] as [number, number, number], rot: [0.5, 1.2, 0.8] as [number, number, number], speed: 2 },
    { pos: [2, 1.5, 3] as [number, number, number], rot: [1.1, 0.3, 2.1] as [number, number, number], speed: 2.5 },
    { pos: [0, 3, -3] as [number, number, number], rot: [2.2, 1.5, 0.4] as [number, number, number], speed: 3 },
  ], []);

  return (
    <group>
      <pointLight position={[0, 3, 0]} intensity={5} color="#ef4444" distance={15} />

      {/* Красные кристаллы */}
      {crystals.map((c, i) => (
        <Float key={i} speed={c.speed} rotationIntensity={0.5} floatIntensity={0.3}>
          <mesh position={c.pos} rotation={c.rot}>
            <coneGeometry args={[0.2, 0.5, 4]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={0.8}
              roughness={0.1}
              metalness={0.6}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
});

// ============================================
// NEW: СИНЯЯ ЯМА - таинственное место
// ============================================

const BluePitEnvironment = memo(function BluePitEnvironment() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      pos: [(Math.random() - 0.5) * 15, Math.random() * 5, (Math.random() - 0.5) * 15] as [number, number, number],
      speed: 0.5 + Math.random() * 1.5,
    })),
  []);

  return (
    <group>
      {/* Глубокая яма */}
      <mesh position={[0, -3, 0]} receiveShadow>
        <cylinderGeometry args={[6, 4, 6, 32, 1, true]} />
        <meshStandardMaterial
          color="#0a1a3a"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Свет из глубины */}
      <pointLight position={[0, -5, 0]} intensity={3} color="#0066ff" distance={20} />

      {/* Парящие частицы */}
      {particles.map((p, i) => (
        <Float key={i} speed={p.speed} floatIntensity={0.5}>
          <mesh position={p.pos}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#00aaff" transparent opacity={0.6} />
          </mesh>
        </Float>
      ))}

      {/* Кристаллы на стенах */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`crystal-${i}`}
          position={[
            Math.cos(i * Math.PI / 6) * 5,
            -2 + Math.random() * 3,
            Math.sin(i * Math.PI / 6) * 5
          ]}
          rotation={[Math.random(), Math.random(), Math.random()]}
        >
          <octahedronGeometry args={[0.2]} />
          <meshStandardMaterial
            color="#0088ff"
            emissive="#0044aa"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
});

// ============================================
// NEW: ЗЕЛЁНКА - парковая зона
// ============================================

const GreenZoneEnvironment = memo(function GreenZoneEnvironment() {
  const treePositions: [number, number, number][] = useMemo(() => [
    [-6, 0, -4], [-3, 0, -6], [0, 0, -5], [3, 0, -4], [6, 0, -5],
    [-5, 0, 2], [5, 0, 3],
  ], []);

  return (
    <group>
      <InstancedTrees positions={treePositions} />

      {/* Трава/поляна */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[12, 32]} />
        <meshStandardMaterial color="#1a4a1a" roughness={0.95} />
      </mesh>

      {/* Цветы */}
      {Array.from({ length: 20 }).map((_, i) => (
        <group key={`flower-${i}`} position={[(Math.random() - 0.5) * 18, 0, (Math.random() - 0.5) * 18]}>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'][i % 4]} />
          </mesh>
        </group>
      ))}

      {/* Скамейки */}
      {[-4, 4].map((x, i) => (
        <group key={`bench-${i}`} position={[x, 0, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[1.5, 0.1, 0.5]} />
            <meshStandardMaterial color="#5c4033" roughness={0.8} />
          </mesh>
        </group>
      ))}

      <pointLight position={[0, 4, 0]} intensity={2} color="#00ff66" distance={15} />
    </group>
  );
});

// ============================================
// NEW: РАЙОН - городской квартал
// ============================================

const DistrictEnvironment = memo(function DistrictEnvironment() {
  return (
    <group>
      {/* Многоэтажки */}
      {[-8, 0, 8].map((x, i) => (
        <group key={`building-${i}`} position={[x, 0, -6]}>
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[4, 8, 3]} />
            <meshStandardMaterial color="#4a4a5a" roughness={0.9} />
          </mesh>
          {/* Окна */}
          {Array.from({ length: 12 }).map((_, j) => (
            <mesh
              key={`win-${j}`}
              position={[
                -1.5 + (j % 4) * 1,
                1 + Math.floor(j / 4) * 2,
                1.51
              ]}
            >
              <planeGeometry args={[0.6, 0.8]} />
              <meshBasicMaterial color={Math.random() > 0.3 ? '#ffcc00' : '#1a1a2e'} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Дорога */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4]} receiveShadow>
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.9} />
      </mesh>

      {/* Фонари */}
      <InstancedLamps positions={[[-6, 0, 2], [0, 0, 2], [6, 0, 2]]} />

      <pointLight position={[0, 3, 0]} intensity={1.5} color="#ffa500" distance={20} />
    </group>
  );
});

// ============================================
// NEW: МВД - казённое здание
// ============================================

const MVDEnvironment = memo(function MVDEnvironment() {
  return (
    <group>
      {/* Здание МВД */}
      <mesh position={[0, 3, -5]} castShadow receiveShadow>
        <boxGeometry args={[12, 6, 4]} />
        <meshStandardMaterial color="#3a4a5a" roughness={0.8} />
      </mesh>

      {/* Вход */}
      <mesh position={[0, 1.5, -2.9]}>
        <boxGeometry args={[3, 3, 0.2]} />
        <meshStandardMaterial color="#2a3a4a" roughness={0.7} />
      </mesh>

      {/* Колонны */}
      {[-4, -1.5, 1.5, 4].map((x, i) => (
        <mesh key={`column-${i}`} position={[x, 2, -2.5]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 4, 16]} />
          <meshStandardMaterial color="#5a6a7a" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}

      {/* Решётки на окнах */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={`window-${i}`} position={[-4.5 + (i % 4) * 3, 3 + Math.floor(i / 4) * 2, -2.9]}>
          <mesh>
            <planeGeometry args={[1.5, 1.2]} />
            <meshBasicMaterial color="#4a90d9" transparent opacity={0.6} />
          </mesh>
          {/* Решётка */}
          <mesh>
            <boxGeometry args={[0.05, 1.3, 0.05]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Флагшток */}
      <mesh position={[6, 3, -2]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 6, 8]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.6} />
      </mesh>

      <pointLight position={[0, 5, 0]} intensity={2} color="#4a90d9" distance={15} />
    </group>
  );
});

// ============================================
// NEW: ПРЕЗИДЕНТ ОТЕЛЬ - роскошный отель
// ============================================

const PresidentHotelEnvironment = memo(function PresidentHotelEnvironment() {
  return (
    <group>
      {/* Здание отеля */}
      <mesh position={[0, 5, -6]} castShadow receiveShadow>
        <boxGeometry args={[14, 10, 5]} />
        <meshStandardMaterial color="#d4af37" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Вход с колоннами */}
      {[-4, -1.5, 1.5, 4].map((x, i) => (
        <mesh key={`col-${i}`} position={[x, 2, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 4, 16]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.5} />
        </mesh>
      ))}

      {/* Козырёк */}
      <mesh position={[0, 4.5, 1]} castShadow>
        <boxGeometry args={[8, 0.3, 3]} />
        <meshStandardMaterial color="#8b4513" roughness={0.6} />
      </mesh>

      {/* Люстры */}
      <mesh position={[0, 4, 3]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      <pointLight position={[0, 4, 3]} intensity={3} color="#ffd700" distance={10} />

      {/* Роскошные окна */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`win-${i}`}
          position={[-5 + (i % 6) * 2, 3 + Math.floor(i / 6) * 4, -3.4]}
        >
          <boxGeometry args={[1.2, 2, 0.1]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Красная дорожка */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 3]} receiveShadow>
        <planeGeometry args={[3, 8]} />
        <meshStandardMaterial color="#8b0000" roughness={0.8} />
      </mesh>

      {/* Вазоны с цветами */}
      {[-3, 3].map((x, i) => (
        <group key={`vase-${i}`} position={[x, 0, 2]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.3, 0.8, 16]} />
            <meshStandardMaterial color="#f5e6d3" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#2d5a2d" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// ============================================
// MAIN SCENE ENVIRONMENT COMPONENT
// ============================================

interface OptimizedSceneEnvironmentProps {
  sceneId: SceneId;
  visualState: VisualState;
}

export const OptimizedSceneEnvironment = memo(function OptimizedSceneEnvironment({
  sceneId,
  visualState
}: OptimizedSceneEnvironmentProps) {
  const config = useMemo(() => {
    switch (sceneId) {
      case 'kitchen_night':
      case 'kitchen_dawn':
      case 'home_morning':
      case 'home_evening':
      case 'volodka_room':
      case 'volodka_corridor':
        return { ambient: 0.4, light: '#ffcc00', fogColor: '#1a1a2e' };
      case 'office_morning':
        return { ambient: 0.5, light: '#ffffff', fogColor: '#2a2a3a' };
      case 'cafe_evening':
        return { ambient: 0.35, light: '#ffa500', fogColor: '#1a1510' };
      case 'rooftop_night':
        return { ambient: 0.15, light: '#4a5568', fogColor: '#0a0a15' };
      case 'dream':
        return { ambient: 0.3, light: '#a855f7', fogColor: '#1a0a2e' };
      case 'battle':
        return { ambient: 0.25, light: '#ef4444', fogColor: '#1a0505' };
      case 'street_winter':
      case 'street_night':
        return { ambient: 0.25, light: '#87ceeb', fogColor: '#0a1020' };
      case 'memorial_park':
        return { ambient: 0.35, light: '#ffd9a0', fogColor: '#0a1510' };
      // NEW: Сцена "Заремушка с Альбертом"
      case 'zarema_albert_room':
        return { ambient: 0.8, light: '#ffd93d', fogColor: '#2a2520' };
      // NEW: Дополнительные локации
      case 'blue_pit': // Синяя яма
        return { ambient: 0.3, light: '#0066ff', fogColor: '#0a0a1a' };
      case 'green_zone': // Зелёнка
        return { ambient: 0.4, light: '#00ff66', fogColor: '#0a1a0a' };
      case 'district': // Район
        return { ambient: 0.35, light: '#ffa500', fogColor: '#1a1510' };
      case 'mvd': // МВД
        return { ambient: 0.45, light: '#4a90d9', fogColor: '#1a1a2a' };
      case 'president_hotel': // Президент Отель
        return { ambient: 0.5, light: '#ffd700', fogColor: '#1a1810' };
      default:
        return { ambient: 0.35, light: '#b2bec3', fogColor: '#1a1a2e' };
    }
  }, [sceneId]);

  const environment = useMemo(() => {
    switch (sceneId) {
      case 'kitchen_night':
      case 'kitchen_dawn':
      case 'home_morning':
      case 'home_evening':
      case 'volodka_room':
        return <KitchenEnvironment />;
      case 'volodka_corridor':
        return <VolodkaCorridorEnvironment />;
      case 'office_morning':
        return <OfficeEnvironment />;
      case 'cafe_evening':
        return <CafeEnvironment />;
      case 'street_night':
      case 'street_winter':
        return <StreetEnvironment />;
      case 'memorial_park':
        return <MemorialParkEnvironment />;
      case 'rooftop_night':
        return <RooftopEnvironment />;
      case 'dream':
        return <DreamEnvironment />;
      case 'battle':
        return <BattleEnvironment />;
      // NEW: Сцена "Заремушка с Альбертом" - уютная комната
      case 'zarema_albert_room':
        return <ZaremaAlbertRoom />;
      // NEW: Дополнительные локации
      case 'blue_pit':
        return <BluePitEnvironment />;
      case 'green_zone':
        return <GreenZoneEnvironment />;
      case 'district':
        return <DistrictEnvironment />;
      case 'mvd':
        return <MVDEnvironment />;
      case 'president_hotel':
        return <PresidentHotelEnvironment />;
      default:
        return <KitchenEnvironment />;
    }
  }, [sceneId]);

  const showSnow = ['street_night', 'street_winter', 'memorial_park', 'rooftop_night'].includes(sceneId);

  return (
    <>
      {/* Туман для глубины */}
      <fog attach="fog" args={[config.fogColor, 8, 25]} />

      {/* Освещение */}
      <ambientLight intensity={config.ambient} />
      <hemisphereLight args={[config.light, '#1a1a1a', 0.6]} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.5}
        color={visualState.colorTint !== 'transparent' ? visualState.colorTint : '#fff'}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 4, 3]} intensity={1.2} color={config.light} />

      {/* Специфичные сцены */}
      <Suspense fallback={null}>
        {environment}
      </Suspense>

      {/* Снежинки */}
      {showSnow && <Snowflakes intensity={visualState.particles ? 1.5 : 1} />}
    </>
  );
});

export default OptimizedSceneEnvironment;
