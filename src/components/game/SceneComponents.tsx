"use client";

/**
 * Декоративные 3D-группы для слоя сцен (без Rapier): статичные примитивы под `SceneRenderer` / окружение.
 *
 * Столы, стулья и т.п. здесь **не** те же компоненты, что в `RoomEnvironment` (там RigidBody и коллайдеры).
 * Унификация в один набор мешей возможна (общие «dumb» группы + обёртка с физикой там, где нужно),
 * пока разделение намеренное: меньше связности между визуальным фоном и физкомнатой.
 *
 * Материалы — в основном сплошной цвет; файловые текстуры как в `RoomEnvironment` можно подключить позже
 * (CanvasTexture / ассеты в `public/`), не меняя контракт именованных экспортов.
 */

import { memo, useMemo } from 'react';
import { Float, Stars, Box, Sphere, Cone, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';

// ============================================
// ПОЛ (палитра по сцене, без файловых карт — имя компонента историческое)
// ============================================

export const FloorWithTexture = memo(function FloorWithTexture({ sceneId }: { sceneId: string }) {
  const config = useMemo(() => {
    switch (sceneId) {
      case 'kitchen_night':
      case 'kitchen_dawn':
      case 'home_morning':
      case 'home_evening':
      case 'volodka_room':
        return { color: '#3d2817', roughness: 0.7, segments: 20 };
      case 'office_morning':
        return { color: '#4a4a4a', roughness: 0.9, segments: 40 };
      case 'cafe_evening':
        return { color: '#4a3520', roughness: 0.6, segments: 20 };
      case 'rooftop_night':
        return { color: '#2a2a2a', roughness: 0.8, segments: 30 };
      case 'dream':
        return { color: '#1a0a2e', roughness: 0.5, segments: 10 };
      case 'battle':
        return { color: '#2a0a0a', roughness: 0.6, segments: 50 };
      default:
        return { color: '#2d3436', roughness: 0.8, segments: 20 };
    }
  }, [sceneId]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20, config.segments, config.segments]} />
      <meshStandardMaterial color={config.color} roughness={config.roughness} metalness={0.1} />
    </mesh>
  );
});

// ============================================
// КУХНЯ
// ============================================

export const KitchenScene = memo(function KitchenScene() {
  return (
    <group>
      {/* Стол */}
      <group position={[0, 0, -2]}>
        <Box args={[2, 0.08, 1]} position={[0, 0.92, 0]} castShadow>
          <meshStandardMaterial color="#5c4033" roughness={0.8} metalness={0.1} />
        </Box>
        {[-0.9, 0.9].map((x, i) => 
          [-0.4, 0.4].map((z, j) => (
            <Box key={`${i}-${j}`} args={[0.06, 0.9, 0.06]} position={[x, 0.45, z]} castShadow>
              <meshStandardMaterial color="#3d2817" roughness={0.8} metalness={0.1} />
            </Box>
          ))
        )}
        {/* Тетрадь */}
        <Box args={[0.25, 0.01, 0.18]} position={[-0.4, 0.97, 0]} rotation={[0, 0.1, 0]}>
          <meshStandardMaterial color="#f5e6d3" roughness={0.95} />
        </Box>
        {/* Чашка */}
        <Cylinder args={[0.04, 0.035, 0.08]} position={[0.5, 0.96, 0.2]}>
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </Cylinder>
      </group>

      {/* Лампа */}
      <group position={[0, 2.5, -2]}>
        <Cone args={[0.2, 0.25, 8]} position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
          <meshStandardMaterial color="#f0e68c" roughness={0.5} side={THREE.DoubleSide} />
        </Cone>
        <pointLight position={[0, -0.2, 0]} intensity={3} color="#ffcc00" distance={8} />
      </group>

      {/* Холодильник */}
      <group position={[4, 0, -2]}>
        <Box args={[1, 2, 0.7]} position={[0, 1, 0]} castShadow>
          <meshStandardMaterial color="#d4d4d4" roughness={0.3} metalness={0.8} />
        </Box>
      </group>

      {/* Окно */}
      <group position={[-3, 2, -5]}>
        <Box args={[2, 1.5, 0.1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#4a3728" roughness={0.8} />
        </Box>
        <Box args={[1.8, 1.3, 0.02]} position={[0, 0, 0.06]}>
          <meshStandardMaterial color="#0a1628" transparent opacity={0.8} />
        </Box>
      </group>
    </group>
  );
});

// ============================================
// КАФЕ
// ============================================

export const CafeScene = memo(function CafeScene() {
  return (
    <group>
      {/* Барная стойка */}
      <Box args={[6, 1.1, 0.8]} position={[0, 0.55, -4]} castShadow>
        <meshStandardMaterial color="#5c4033" roughness={0.7} />
      </Box>
      
      {/* Столики */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <Cylinder args={[0.4, 0.4, 0.05]} position={[0, 0.75, 0]}>
            <meshStandardMaterial color="#4a3728" roughness={0.6} />
          </Cylinder>
          <Cylinder args={[0.03, 0.03, 0.75]} position={[0, 0.375, 0]}>
            <meshStandardMaterial color="#3d2817" />
          </Cylinder>
        </group>
      ))}
      
      {/* Сцена */}
      <group position={[0, 0, -6]}>
        <Box args={[4, 0.2, 2]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#2d2d2d" />
        </Box>
        <Cylinder args={[0.3, 0.3, 1.5]} position={[0, 0.95, 0]}>
          <meshStandardMaterial color="#1a1a1a" />
        </Cylinder>
      </group>
      
      {/* Тёплый свет */}
      <pointLight position={[0, 3, -2]} intensity={2} color="#ffa500" distance={15} />
      <pointLight position={[-4, 2, 0]} intensity={1} color="#ff8c00" distance={10} />
      <pointLight position={[4, 2, 0]} intensity={1} color="#ff8c00" distance={10} />
    </group>
  );
});

// ============================================
// УЛИЦА
// ============================================

export const StreetScene = memo(function StreetScene() {
  return (
    <group>
      {/* Фонари */}
      {[-6, -2, 2, 6].map((x, i) => (
        <group key={i} position={[x, 0, -4]}>
          <Cylinder args={[0.08, 0.1, 3]} position={[0, 1.5, 0]}>
            <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.3} />
          </Cylinder>
          <Sphere args={[0.15]} position={[0, 3.1, 0]}>
            <meshBasicMaterial color="#ffdd88" />
          </Sphere>
          <pointLight position={[0, 3, 0]} intensity={2} color="#ffdd88" distance={10} />
        </group>
      ))}
      
      {/* Деревья */}
      {[-8, 8].map((x, i) => (
        <group key={`tree-${i}`} position={[x, 0, -6]}>
          <Cylinder args={[0.15, 0.2, 2]} position={[0, 1, 0]}>
            <meshStandardMaterial color="#4a3728" roughness={0.9} />
          </Cylinder>
          <Sphere args={[1]} position={[0, 2.5, 0]}>
            <meshStandardMaterial color="#1a3a1a" roughness={0.8} />
          </Sphere>
        </group>
      ))}
      
      {/* Скамейки */}
      {[-4, 4].map((x, i) => (
        <group key={`bench-${i}`} position={[x, 0, 2]}>
          <Box args={[1.2, 0.05, 0.35]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#5c4033" roughness={0.8} />
          </Box>
          <Box args={[0.05, 0.5, 0.05]} position={[-0.55, 0.25, -0.12]}>
            <meshStandardMaterial color="#3d2817" />
          </Box>
          <Box args={[0.05, 0.5, 0.05]} position={[0.55, 0.25, -0.12]}>
            <meshStandardMaterial color="#3d2817" />
          </Box>
          <Box args={[0.05, 0.5, 0.05]} position={[-0.55, 0.25, 0.12]}>
            <meshStandardMaterial color="#3d2817" />
          </Box>
          <Box args={[0.05, 0.5, 0.05]} position={[0.55, 0.25, 0.12]}>
            <meshStandardMaterial color="#3d2817" />
          </Box>
        </group>
      ))}
      
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
    </group>
  );
});

// ============================================
// МЕМОРИАЛЬНЫЙ ПАРК
// ============================================

export const MemorialParkScene = memo(function MemorialParkScene() {
  return (
    <group>
      {/* Деревья */}
      {[-8, -4, 4, 8].map((x, i) => (
        <group key={`tree-${i}`} position={[x, 0, -8 + i * 2]}>
          <Cylinder args={[0.2, 0.25, 3]} position={[0, 1.5, 0]}>
            <meshStandardMaterial color="#3d2817" roughness={0.9} />
          </Cylinder>
          <Sphere args={[1.5]} position={[0, 3.5, 0]}>
            <meshStandardMaterial color="#2a4a2a" roughness={0.8} />
          </Sphere>
        </group>
      ))}
      
      {/* Беседка */}
      <group position={[0, 0, -6]}>
        {[-2, 2].map((x, i) => (
          <Cylinder key={i} args={[0.1, 0.1, 2.5]} position={[x, 1.25, -2]}>
            <meshStandardMaterial color="#8a8a8a" roughness={0.6} />
          </Cylinder>
        ))}
        <Box args={[5, 0.1, 4]} position={[0, 2.5, -2]}>
          <meshStandardMaterial color="#4a4a4a" roughness={0.7} />
        </Box>
      </group>
      
      {/* Скамейки */}
      {[-5, 5].map((x, i) => (
        <group key={`bench-${i}`} position={[x, 0, 0]}>
          <Box args={[1.2, 0.05, 0.35]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#5c4033" roughness={0.8} />
          </Box>
          <Box args={[0.05, 0.5, 0.05]} position={[-0.55, 0.25, -0.12]}>
            <meshStandardMaterial color="#3d2817" />
          </Box>
          <Box args={[0.05, 0.5, 0.05]} position={[0.55, 0.25, -0.12]}>
            <meshStandardMaterial color="#3d2817" />
          </Box>
          <Box args={[0.05, 0.5, 0.05]} position={[-0.55, 0.25, 0.12]}>
            <meshStandardMaterial color="#3d2817" />
          </Box>
          <Box args={[0.05, 0.5, 0.05]} position={[0.55, 0.25, 0.12]}>
            <meshStandardMaterial color="#3d2817" />
          </Box>
        </group>
      ))}
      
      {/* Памятник */}
      <group position={[0, 0, -10]}>
        <Box args={[2, 0.2, 1]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#5a5a5a" roughness={0.5} />
        </Box>
        <Box args={[0.4, 1.5, 0.4]} position={[0, 0.95, 0]}>
          <meshStandardMaterial color="#4a4a4a" roughness={0.4} metalness={0.2} />
        </Box>
      </group>
      
      <pointLight position={[0, 3, 0]} intensity={1.5} color="#ffd9a0" distance={15} />
    </group>
  );
});

// ============================================
// ОФИС
// ============================================

export const OfficeScene = memo(function OfficeScene() {
  return (
    <group>
      {/* Рабочие столы */}
      {[-3, 3].map((x, idx) => (
        <group key={idx} position={[x, 0, 0]}>
          {/* Столешница */}
          <Box args={[1.4, 0.05, 0.7]} position={[0, 0.75, 0]} castShadow>
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
          </Box>
          {/* Ножки стола */}
          <Box args={[0.05, 0.75, 0.05]} position={[-0.65, 0.375, -0.25]} castShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
          </Box>
          <Box args={[0.05, 0.75, 0.05]} position={[0.65, 0.375, -0.25]} castShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
          </Box>
          <Box args={[0.05, 0.75, 0.05]} position={[-0.65, 0.375, 0.25]} castShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
          </Box>
          <Box args={[0.05, 0.75, 0.05]} position={[0.65, 0.375, 0.25]} castShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
          </Box>
          {/* Монитор */}
          <Box args={[0.5, 0.35, 0.03]} position={[0, 1.1, -0.15]} castShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
          </Box>
          <Box args={[0.15, 0.02, 0.1]} position={[0, 0.78, -0.15]} castShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </Box>
          <Box args={[0.03, 0.3, 0.03]} position={[0, 0.93, -0.15]} castShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </Box>
          <Box args={[0.48, 0.32, 0.01]} position={[0, 1.1, -0.13]}>
            <meshBasicMaterial color={idx === 0 ? "#0a1628" : "#1a0a28"} />
          </Box>
          {/* Клавиатура */}
          <Box args={[0.35, 0.015, 0.12]} position={[0, 0.78, 0.1]} castShadow>
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
          </Box>
          {/* Стул */}
          <group position={[0, 0, 0.8]}>
            <Box args={[0.45, 0.05, 0.45]} position={[0, 0.5, 0]} castShadow>
              <meshStandardMaterial color="#333333" roughness={0.8} />
            </Box>
            <Box args={[0.45, 0.5, 0.05]} position={[0, 0.8, -0.2]} castShadow>
              <meshStandardMaterial color="#333333" roughness={0.8} />
            </Box>
            {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([lx, lz], i) => (
              <Cylinder key={i} args={[0.02, 0.02, 0.5]} position={[lx, 0.25, lz]}>
                <meshStandardMaterial color="#1a1a1a" />
              </Cylinder>
            ))}
          </group>
        </group>
      ))}

      {/* Окна */}
      {[-4, 0, 4].map((x, i) => (
        <group key={`window-${i}`} position={[x, 3, -5]}>
          <Box args={[2, 1.5, 0.1]}>
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </Box>
          <Box args={[1.8, 1.3, 0.02]} position={[0, 0, 0.06]}>
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
          </Box>
        </group>
      ))}
    </group>
  );
});

// ============================================
// КРЫША
// ============================================

export const RooftopScene = memo(function RooftopScene() {
  const cityLights = useMemo(() => [
    { pos: [-12, -1, -18] as [number, number, number], color: '#ffaa00' },
    { pos: [-8, -1, -20] as [number, number, number], color: '#ff5500' },
    { pos: [-4, -1, -22] as [number, number, number], color: '#ffffff' },
    { pos: [0, -1, -19] as [number, number, number], color: '#ffaa00' },
    { pos: [4, -1, -21] as [number, number, number], color: '#ff5500' },
    { pos: [8, -1, -18] as [number, number, number], color: '#ffffff' },
    { pos: [12, -1, -23] as [number, number, number], color: '#ffaa00' },
    { pos: [-10, -1, -25] as [number, number, number], color: '#ff5500' },
    { pos: [-6, -1, -24] as [number, number, number], color: '#ffffff' },
    { pos: [2, -1, -22] as [number, number, number], color: '#ffaa00' },
    { pos: [6, -1, -20] as [number, number, number], color: '#ff5500' },
    { pos: [10, -1, -24] as [number, number, number], color: '#ffffff' },
    { pos: [-2, -1, -21] as [number, number, number], color: '#ffaa00' },
    { pos: [-14, -1, -19] as [number, number, number], color: '#ff5500' },
    { pos: [14, -1, -22] as [number, number, number], color: '#ffffff' }
  ], []);

  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <Box args={[20, 1.2, 0.15]} position={[0, 0.6, -8]} castShadow>
        <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.7} />
      </Box>
      
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <Box key={i} args={[0.12, 1.4, 0.12]} position={[x, 0.7, -8]} castShadow>
          <meshStandardMaterial color="#3a3a3a" roughness={0.5} metalness={0.7} />
        </Box>
      ))}

      {cityLights.map((light, i) => (
        <mesh key={`light-${i}`} position={light.pos}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color={light.color} />
        </mesh>
      ))}
    </group>
  );
});

// ============================================
// СОН
// ============================================

export const DreamScene = memo(function DreamScene() {
  const particles = useMemo(() => [
    { pos: [-4, 2, -3] as [number, number, number], speed: 1.2, intensity: 0.5, size: 0.04, opacity: 0.8, color: '#a855f7' },
    { pos: [3, 3, -2] as [number, number, number], speed: 1.5, intensity: 0.6, size: 0.03, opacity: 0.9, color: '#ec4899' },
    { pos: [-2, 4, -4] as [number, number, number], speed: 0.8, intensity: 0.4, size: 0.05, opacity: 0.7, color: '#3b82f6' },
    { pos: [5, 2, 2] as [number, number, number], speed: 1.0, intensity: 0.5, size: 0.03, opacity: 0.85, color: '#a855f7' },
    { pos: [-5, 3, 1] as [number, number, number], speed: 1.3, intensity: 0.55, size: 0.04, opacity: 0.75, color: '#ec4899' },
    { pos: [0, 5, -5] as [number, number, number], speed: 1.8, intensity: 0.7, size: 0.025, opacity: 0.95, color: '#3b82f6' },
    { pos: [2, 2, 4] as [number, number, number], speed: 0.9, intensity: 0.45, size: 0.045, opacity: 0.65, color: '#a855f7' },
    { pos: [-3, 4, 3] as [number, number, number], speed: 1.1, intensity: 0.5, size: 0.035, opacity: 0.8, color: '#ec4899' },
    { pos: [4, 3, -1] as [number, number, number], speed: 1.4, intensity: 0.6, size: 0.03, opacity: 0.9, color: '#3b82f6' },
    { pos: [-1, 2, 5] as [number, number, number], speed: 1.0, intensity: 0.5, size: 0.04, opacity: 0.7, color: '#a855f7' },
  ], []);

  const torusShapes = useMemo(() => [
    { pos: [-2, 2.5, -2] as [number, number, number], rot: [0.5, 1.2, 0] as [number, number, number], size: 0.35, speed: 1.5 },
    { pos: [3, 3, 1] as [number, number, number], rot: [2.1, 0.8, 0] as [number, number, number], size: 0.4, speed: 1.8 },
    { pos: [0, 2, 3] as [number, number, number], rot: [1.0, 2.5, 0] as [number, number, number], size: 0.3, speed: 1.2 }
  ], []);

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[0.8]} position={[0, 2, -3]}>
          <meshStandardMaterial 
            color="#a855f7" 
            emissive="#a855f7" 
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.3}
            transparent
            opacity={0.8}
          />
        </Sphere>
      </Float>
      <pointLight position={[0, 2, -3]} intensity={4} color="#a855f7" distance={12} />

      {particles.map((p, i) => (
        <Float key={i} speed={p.speed} floatIntensity={p.intensity}>
          <Sphere args={[p.size]} position={p.pos}>
            <meshBasicMaterial color={p.color} transparent opacity={p.opacity} />
          </Sphere>
        </Float>
      ))}

      {torusShapes.map((t, i) => (
        <Float key={`shape-${i}`} speed={t.speed} rotationIntensity={0.3}>
          <Torus args={[t.size, 0.05, 8, 32]} position={t.pos} rotation={t.rot}>
            <meshStandardMaterial 
              color="#8b5cf6"
              emissive="#8b5cf6"
              emissiveIntensity={0.3}
              transparent
              opacity={0.5}
            />
          </Torus>
        </Float>
      ))}
    </group>
  );
});

// ============================================
// БИТВА
// ============================================

export const BattleScene = memo(function BattleScene() {
  const crystals = useMemo(() => [
    { pos: [-3, 2, -2] as [number, number, number], rot: [0.5, 1.2, 0.8] as [number, number, number], size: 0.2, height: 0.5, speed: 2 },
    { pos: [2, 1.5, 3] as [number, number, number], rot: [1.1, 0.3, 2.1] as [number, number, number], size: 0.15, height: 0.6, speed: 2.5 },
    { pos: [0, 3, -3] as [number, number, number], rot: [2.2, 1.5, 0.4] as [number, number, number], size: 0.18, height: 0.45, speed: 3 },
    { pos: [-2, 2.5, 2] as [number, number, number], rot: [0.8, 2.1, 1.3] as [number, number, number], size: 0.22, height: 0.55, speed: 3.5 },
    { pos: [3, 1.8, -1] as [number, number, number], rot: [1.7, 0.9, 2.8] as [number, number, number], size: 0.17, height: 0.5, speed: 4 },
    { pos: [-1, 2.2, 1] as [number, number, number], rot: [2.5, 1.8, 0.2] as [number, number, number], size: 0.2, height: 0.65, speed: 4.5 }
  ], []);

  const orbs = useMemo(() => [
    { pos: [-2, 3, 0] as [number, number, number] },
    { pos: [2, 2.5, -2] as [number, number, number] },
    { pos: [0, 3.5, 2] as [number, number, number] }
  ], []);

  return (
    <group>
      <pointLight position={[0, 3, 0]} intensity={5} color="#ef4444" distance={15} />

      {crystals.map((c, i) => (
        <Float key={i} speed={c.speed} rotationIntensity={0.5} floatIntensity={0.3}>
          <Cone args={[c.size, c.height, 4]} position={c.pos} rotation={c.rot}>
            <meshStandardMaterial 
              color="#ef4444" 
              emissive="#ef4444" 
              emissiveIntensity={0.8}
              roughness={0.1}
              metalness={0.6}
            />
          </Cone>
        </Float>
      ))}

      {orbs.map((o, i) => (
        <Float key={`orb-${i}`} speed={3} floatIntensity={0.8}>
          <Sphere args={[0.15]} position={o.pos}>
            <meshStandardMaterial 
              color="#ff6b6b"
              emissive="#ff0000"
              emissiveIntensity={1}
              transparent
              opacity={0.7}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  );
});

