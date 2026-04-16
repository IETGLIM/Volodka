"use client";

import { memo, useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';

// ============================================
// ЧАСТИЦЫ ПЫЛИ В ЛУЧАХ СВЕТА
// ============================================

const DustParticles = memo(function DustParticles({ 
  count = 50, 
  color = '#ffffff',
  area = { x: 10, y: 4, z: 10 }
}: { 
  count?: number;
  color?: string;
  area?: { x: number; y: number; z: number };
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  
  // Генерация начальных позиций частиц
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * area.x,
      y: Math.random() * area.y,
      z: (Math.random() - 0.5) * area.z,
      speed: 0.1 + Math.random() * 0.2,
      offset: Math.random() * Math.PI * 2,
    }));
  }, [count, area]);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    
    particles.forEach((p, i) => {
      // Медленное движение вверх и покачивание
      const y = ((p.y + time * p.speed * 0.1) % area.y);
      const x = p.x + Math.sin(time * 0.3 + p.offset) * 0.1;
      const z = p.z + Math.cos(time * 0.2 + p.offset) * 0.1;
      
      tempMatrix.setPosition(x, y, z);
      meshRef.current!.setMatrixAt(i, tempMatrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.015, 4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </instancedMesh>
  );
});

// ============================================
// ОФИС СО СТЕНАМИ, ПОТОЛКОМ, ЭКРАНАМИ И ЛЮДЬМИ
// ============================================

export const EnhancedOfficeScene = memo(function EnhancedOfficeScene() {
  const screenRef1 = useRef<THREE.MeshBasicMaterial>(null);
  const screenRef2 = useRef<THREE.MeshBasicMaterial>(null);
  
  // Анимация мерцания экранов
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Экран 1 - логи, тикеты
    if (screenRef1.current) {
      const flicker = Math.sin(time * 2) * 0.1 + Math.sin(time * 5) * 0.05;
      screenRef1.current.opacity = 0.9 + flicker;
    }
    
    // Экран 2 - Kibana/Grafana
    if (screenRef2.current) {
      const flicker = Math.sin(time * 1.5 + 1) * 0.08 + Math.sin(time * 4) * 0.04;
      screenRef2.current.opacity = 0.9 + flicker;
    }
  });

  return (
    <group>
      {/* ========== СТЕНЫ ========== */}
      {/* Задняя стена */}
      <Box args={[20, 5, 0.2]} position={[0, 2.5, -6]} receiveShadow>
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </Box>
      
      {/* Боковые стены */}
      <Box args={[0.2, 5, 14]} position={[-8, 2.5, 1]} receiveShadow>
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </Box>
      <Box args={[0.2, 5, 14]} position={[8, 2.5, 1]} receiveShadow>
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </Box>
      
      {/* Потолок */}
      <Box args={[16, 0.15, 12]} position={[0, 5, 0]}>
        <meshStandardMaterial color="#4a4a4a" roughness={0.95} />
      </Box>
      
      {/* Потолочные панели */}
      {[-4, 0, 4].map((x, i) =>
        [-3, 1, 5].map((z, j) => (
          <Box key={`panel-${i}-${j}`} args={[3.8, 0.02, 3.8]} position={[x, 4.92, z]}>
            <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
          </Box>
        ))
      )}
      
      {/* Потолочные светильники */}
      {[-3, 3].map((x, i) =>
        [-2, 2, 6].map((z, j) => (
          <group key={`light-${i}-${j}`} position={[x, 4.9, z]}>
            <Box args={[1.5, 0.05, 0.3]}>
              <meshStandardMaterial color="#f5f5dc" emissive="#f5f5dc" emissiveIntensity={0.3} />
            </Box>
            <pointLight position={[0, -0.5, 0]} intensity={0.5} color="#f5f5dc" distance={8} />
          </group>
        ))
      )}

      {/* ========== РАБОЧИЕ СТОЛЫ ========== */}
      {[-3, 3].map((x, idx) => (
        <group key={idx} position={[x, 0, 0]}>
          {/* Столешница */}
          <Box args={[1.4, 0.05, 0.7]} position={[0, 0.75, 0]} castShadow>
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
          </Box>
          {/* Ножки стола */}
          {[[-0.65, -0.25], [0.65, -0.25], [-0.65, 0.25], [0.65, 0.25]].map(([lx, lz], i) => (
            <Box key={i} args={[0.05, 0.75, 0.05]} position={[lx, 0.375, lz]} castShadow>
              <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
            </Box>
          ))}
          
          {/* Три монитора */}
          <group position={[0, 0, -0.2]}>
            {/* Центральный монитор */}
            <group position={[0, 0, 0]}>
              <Box args={[0.55, 0.4, 0.03]} position={[0, 1.15, 0]} castShadow>
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
              </Box>
              <Box args={[0.15, 0.02, 0.08]} position={[0, 0.78, 0]} castShadow>
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
              </Box>
              <Box args={[0.03, 0.35, 0.03]} position={[0, 0.96, 0]} castShadow>
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
              </Box>
              {/* Экран с мерцанием */}
              <Box args={[0.53, 0.38, 0.01]} position={[0, 1.15, 0.02]}>
                <meshBasicMaterial 
                  ref={idx === 0 ? screenRef1 : screenRef2}
                  color={idx === 0 ? "#0a1628" : "#1a0a28"} 
                  transparent 
                  opacity={0.95}
                />
              </Box>
            </group>
            
            {/* Левый монитор (код) */}
            <group position={[-0.65, 0, 0.1]}>
              <Box args={[0.4, 0.3, 0.02]} position={[0, 1.1, 0]} castShadow>
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
              </Box>
              <Box args={[0.38, 0.28, 0.01]} position={[0, 1.1, 0.02]}>
                <meshBasicMaterial color="#0d1117" transparent opacity={0.9} />
              </Box>
            </group>
            
            {/* Правый монитор (почта/Slack) */}
            <group position={[0.65, 0, 0.1]}>
              <Box args={[0.4, 0.3, 0.02]} position={[0, 1.1, 0]} castShadow>
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
              </Box>
              <Box args={[0.38, 0.28, 0.01]} position={[0, 1.1, 0.02]}>
                <meshBasicMaterial color="#1a0a1a" transparent opacity={0.9} />
              </Box>
            </group>
          </group>
          
          {/* Клавиатура */}
          <Box args={[0.4, 0.015, 0.14]} position={[0, 0.78, 0.15]} castShadow>
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
          </Box>
          
          {/* Мышь */}
          <Box args={[0.06, 0.02, 0.1]} position={[0.35, 0.78, 0.15]}>
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
          </Box>
          
          {/* Кофейная кружка */}
          <group position={[-0.5, 0.78, 0.25]}>
            <Cylinder args={[0.04, 0.035, 0.1, 16]}>
              <meshStandardMaterial color="#f5f5f5" roughness={0.3} />
            </Cylinder>
          </group>
          
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

      {/* ========== СИЛУЭТЫ КОЛЛЕГ ========== */}
      {/* Человек за дальним столом слева */}
      <group position={[-6, 0, -3]}>
        <Cylinder args={[0.25, 0.3, 1.2, 8]} position={[0, 0.6, 0]}>
          <meshStandardMaterial color="#2a2a3a" roughness={0.9} transparent opacity={0.7} />
        </Cylinder>
        <Sphere args={[0.2]} position={[0, 1.4, 0]}>
          <meshStandardMaterial color="#3a3a4a" roughness={0.8} transparent opacity={0.6} />
        </Sphere>
      </group>
      
      {/* Человек за дальним столом справа */}
      <group position={[6, 0, -3]}>
        <Cylinder args={[0.25, 0.3, 1.2, 8]} position={[0, 0.6, 0]}>
          <meshStandardMaterial color="#2a2a3a" roughness={0.9} transparent opacity={0.7} />
        </Cylinder>
        <Sphere args={[0.2]} position={[0, 1.4, 0]}>
          <meshStandardMaterial color="#3a3a4a" roughness={0.8} transparent opacity={0.6} />
        </Sphere>
      </group>
      
      {/* Проходящий коллега (дальше) */}
      <group position={[0, 0, 4]}>
        <Cylinder args={[0.22, 0.28, 1.1, 8]} position={[0, 0.55, 0]}>
          <meshStandardMaterial color="#252535" roughness={0.9} transparent opacity={0.5} />
        </Cylinder>
        <Sphere args={[0.18]} position={[0, 1.3, 0]}>
          <meshStandardMaterial color="#353545" roughness={0.8} transparent opacity={0.4} />
        </Sphere>
      </group>

      {/* ========== ОКНА ========== */}
      {[-4, 0, 4].map((x, i) => (
        <group key={`window-${i}`} position={[x, 3.5, -5.8]}>
          <Box args={[2.5, 2, 0.15]}>
            <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
          </Box>
          <Box args={[2.2, 1.7, 0.02]} position={[0, 0, 0.08]}>
            <meshStandardMaterial 
              color="#87ceeb" 
              transparent 
              opacity={0.4}
              roughness={0.1}
              metalness={0.1}
            />
          </Box>
          <Box args={[2.8, 0.1, 0.3]} position={[0, -1.1, 0.1]}>
            <meshStandardMaterial color="#6a6a6a" roughness={0.7} />
          </Box>
        </group>
      ))}
      
      {/* ========== ДОПОЛНИТЕЛЬНЫЕ ДЕТАЛИ ========== */}
      {/* Кулер */}
      <group position={[6.5, 0, 3]}>
        <Box args={[0.4, 1.2, 0.4]} position={[0, 0.6, 0]} castShadow>
          <meshStandardMaterial color="#e8e8e8" roughness={0.5} />
        </Box>
        <Cylinder args={[0.2, 0.2, 0.5, 16]} position={[0, 1.45, 0]}>
          <meshStandardMaterial color="#4a90a4" transparent opacity={0.6} />
        </Cylinder>
      </group>
      
      {/* Принтер/МФУ */}
      <group position={[-6.5, 0, 2]}>
        <Box args={[0.5, 0.4, 0.5]} position={[0, 0.2, 0]} castShadow>
          <meshStandardMaterial color="#3a3a3a" roughness={0.6} />
        </Box>
      </group>
      
      {/* Растение в горшке */}
      <group position={[7, 0, -4]}>
        <Cylinder args={[0.25, 0.2, 0.4, 8]} position={[0, 0.2, 0]}>
          <meshStandardMaterial color="#5a4030" roughness={0.8} />
        </Cylinder>
        <Sphere args={[0.4]} position={[0, 0.7, 0]}>
          <meshStandardMaterial color="#2a4a2a" roughness={0.9} />
        </Sphere>
      </group>
      
      {/* Частицы пыли в лучах света */}
      <DustParticles count={40} color="#ffffff" area={{ x: 16, y: 5, z: 12 }} />
    </group>
  );
});

// ============================================
// УЛУЧШЕННАЯ КУХНЯ/ДОМ
// ============================================

export const EnhancedKitchenScene = memo(function EnhancedKitchenScene() {
  return (
    <group>
      {/* Стены */}
      <Box args={[12, 4, 0.15]} position={[0, 2, -6]}>
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </Box>
      <Box args={[0.15, 4, 10]} position={[-6, 2, -1]}>
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </Box>
      <Box args={[0.15, 4, 10]} position={[6, 2, -1]}>
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </Box>
      
      {/* Потолок */}
      <Box args={[12, 0.1, 10]} position={[0, 4, -1]}>
        <meshStandardMaterial color="#f5e6d3" roughness={0.9} />
      </Box>
      
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
        {/* Ручка */}
        <Cylinder args={[0.008, 0.008, 0.12]} position={[-0.3, 0.98, 0.1]} rotation={[0, 0, Math.PI / 12]}>
          <meshStandardMaterial color="#1a1a1a" />
        </Cylinder>
      </group>

      {/* Лампа */}
      <group position={[0, 3.5, -2]}>
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
      <group position={[-5.5, 2.5, -2]}>
        <Box args={[0.15, 1.8, 2]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#4a3728" roughness={0.8} />
        </Box>
        <Box args={[0.02, 1.5, 1.8]} position={[0.08, 0, 0]}>
          <meshStandardMaterial color="#0a1628" transparent opacity={0.8} />
        </Box>
      </group>
      
      {/* Книжная полка */}
      <group position={[4, 0, 2]}>
        <Box args={[1.5, 0.05, 0.3]} position={[0, 1.5, 0]} castShadow>
          <meshStandardMaterial color="#5c4033" roughness={0.8} />
        </Box>
        <Box args={[1.5, 0.05, 0.3]} position={[0, 2, 0]} castShadow>
          <meshStandardMaterial color="#5c4033" roughness={0.8} />
        </Box>
        {/* Книги */}
        {[[-0.4, 1.55], [0, 1.55], [0.4, 1.55], [-0.3, 2.05], [0.2, 2.05]].map(([x, y], i) => (
          <Box key={i} args={[0.12, 0.3, 0.2]} position={[x, y, 0]}>
            <meshStandardMaterial color={['#8b4513', '#2f4f4f', '#8b0000', '#00008b', '#006400'][i]} roughness={0.9} />
          </Box>
        ))}
      </group>
      
      {/* Частицы пыли в теплом свете лампы */}
      <DustParticles count={25} color="#ffcc88" area={{ x: 8, y: 3, z: 6 }} />
    </group>
  );
});

// ============================================
// УЛУЧШЕННОЕ КАФЕ "СИНИЙ КОТ"
// ============================================

export const EnhancedCafeScene = memo(function EnhancedCafeScene() {
  return (
    <group>
      {/* Стены */}
      <Box args={[16, 4, 0.15]} position={[0, 2, -6]}>
        <meshStandardMaterial color="#4a3520" roughness={0.9} />
      </Box>
      <Box args={[0.15, 4, 12]} position={[-8, 2, 0]}>
        <meshStandardMaterial color="#4a3520" roughness={0.9} />
      </Box>
      <Box args={[0.15, 4, 12]} position={[8, 2, 0]}>
        <meshStandardMaterial color="#4a3520" roughness={0.9} />
      </Box>
      
      {/* Потолок с балками */}
      <Box args={[16, 0.1, 12]} position={[0, 4, 0]}>
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </Box>
      {[-4, 0, 4].map((x, i) => (
        <Box key={`beam-${i}`} args={[0.15, 0.2, 12]} position={[x, 3.9, 0]}>
          <meshStandardMaterial color="#2d1a0a" roughness={0.8} />
        </Box>
      ))}
      
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
          {/* Свеча на столе */}
          <group position={[0.15, 0.8, 0.1]}>
            <Cylinder args={[0.02, 0.02, 0.08]}>
              <meshStandardMaterial color="#f5f5dc" />
            </Cylinder>
            <pointLight position={[0, 0.06, 0]} intensity={0.3} color="#ffaa00" distance={2} />
          </group>
        </group>
      ))}
      
      {/* Сцена */}
      <group position={[0, 0, -5]}>
        <Box args={[4, 0.2, 2]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#2d2d2d" />
        </Box>
        <Cylinder args={[0.3, 0.3, 1.5]} position={[0, 0.95, 0]}>
          <meshStandardMaterial color="#1a1a1a" />
        </Cylinder>
        {/* Микрофон */}
        <group position={[0, 1.5, 0.3]}>
          <Cylinder args={[0.03, 0.03, 0.3]}>
            <meshStandardMaterial color="#333333" />
          </Cylinder>
          <Sphere args={[0.05]} position={[0, 0.18, 0]}>
            <meshStandardMaterial color="#1a1a1a" />
          </Sphere>
        </group>
      </group>
      
      {/* Силуэты посетителей */}
      {[
        [-5, -2], [5, -2], [-4, 1], [4, 1]
      ].map(([x, z], i) => (
        <group key={`visitor-${i}`} position={[x, 0, z]}>
          <Cylinder args={[0.2, 0.25, 1, 8]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#2a2a3a" transparent opacity={0.5} />
          </Cylinder>
          <Sphere args={[0.15]} position={[0, 1.15, 0]}>
            <meshStandardMaterial color="#3a3a4a" transparent opacity={0.4} />
          </Sphere>
        </group>
      ))}
      
      {/* Тёплый свет */}
      <pointLight position={[0, 3, -2]} intensity={2} color="#ffa500" distance={15} />
      <pointLight position={[-4, 2, 0]} intensity={1} color="#ff8c00" distance={10} />
      <pointLight position={[4, 2, 0]} intensity={1} color="#ff8c00" distance={10} />
      
      {/* Афиша на стене */}
      <group position={[6, 2.5, -3]}>
        <Box args={[0.8, 1.2, 0.02]}>
          <meshStandardMaterial color="#f5e6d3" />
        </Box>
        <Box args={[0.02, 0.3, 0.02]} position={[-0.35, -0.65, 0]} rotation={[0, 0, 0.1]}>
          <meshStandardMaterial color="#5c4033" />
        </Box>
        <Box args={[0.02, 0.3, 0.02]} position={[0.35, -0.65, 0]} rotation={[0, 0, -0.1]}>
          <meshStandardMaterial color="#5c4033" />
        </Box>
      </group>
      
      {/* Частицы пыли в тёплом свете кафе */}
      <DustParticles count={35} color="#ffaa66" area={{ x: 14, y: 3.5, z: 10 }} />
    </group>
  );
});

export default EnhancedOfficeScene;
