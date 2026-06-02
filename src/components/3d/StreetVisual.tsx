'use client';

/* ─── Volodka RPG – Street scene procedural 3D visual ─── */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneId } from '@/shared/types/game';

interface StreetVisualProps {
  sceneId?: SceneId;
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/** Street scene with buildings, neon, fog, lamps, and weather */
export function StreetVisual({ sceneId = 'street_night', livePlayerPositionRef }: StreetVisualProps) {
  const isWinter = sceneId === 'street_winter';

  return (
    <group>
      {/* ── Dark ground plane ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color={isWinter ? '#a0a8b8' : '#1a1a2a'}
          roughness={isWinter ? 0.7 : 0.85}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Sidewalk ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        <planeGeometry args={[6, 40]} />
        <meshStandardMaterial
          color={isWinter ? '#b0b8c8' : '#2a2a3a'}
          roughness={0.8}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Panel Building Silhouettes (5 buildings) ── */}
      <PanelBuildings />

      {/* ── Neon Signs ── */}
      <NeonSigns isWinter={isWinter} />

      {/* ── Street Lamps are now rendered in FOREGROUND layer via SceneColliderSelector ── */}

      {/* ── Fog ── (handled by SceneEnvironment — no duplicate) */}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Overflowing trash cans ── */}
      <group position={[2, 0, 3]}>
        {/* Trash can */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.2, 1.0, 8]} />
          <meshStandardMaterial color="#3a4a3a" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* Overflow trash on top */}
        <mesh position={[0.1, 1.05, 0]} rotation={[0.2, 0.5, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.08]} />
          <meshStandardMaterial color="#6a5a40" roughness={0.95} />
        </mesh>
        <mesh position={[-0.08, 1.08, 0.1]} rotation={[0.3, 1.2, 0.1]}>
          <sphereGeometry args={[0.05, 5, 5]} />
          <meshStandardMaterial color="#8a8a80" roughness={0.95} />
        </mesh>
      </group>

      {/* Second trash can */}
      <group position={[-2.5, 0, -8]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.18, 0.9, 8]} />
          <meshStandardMaterial color="#4a3a2a" metalness={0.3} roughness={0.7} />
        </mesh>
      </group>

      {/* ── Puddle reflections - polygonOffset prevents Z-fighting */}
      <mesh rotation-x={-Math.PI / 2} position={[1.5, 0.02, 2]}>
        <circleGeometry args={[0.6, 12]} />
        <meshStandardMaterial color="#0e0e1e" metalness={0.8} roughness={0.1} transparent opacity={0.5} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-1, 0.02, -4]}>
        <circleGeometry args={[0.4, 12]} />
        <meshStandardMaterial color="#0e0e1e" metalness={0.7} roughness={0.1} transparent opacity={0.4} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      {/* ── Dripping pipe (thin cylinder from building) ── */}
      <mesh position={[-12, 3.5, -12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Drip at end of pipe */}
      <mesh position={[-12, 3.1, -12]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#4a6a8a" transparent opacity={0.7} />
      </mesh>

      {/* ── Broken window in building ── */}
      <mesh position={[12, 8, -18]}>
        <planeGeometry args={[0.8, 1.0]} />
        <meshStandardMaterial color="#0a0a12" roughness={0.95} />
      </mesh>
      {/* Broken glass shards */}
      <mesh position={[12, 8.3, -17.99]}>
        <planeGeometry args={[0.25, 0.3]} />
        <meshStandardMaterial color="#607080" transparent opacity={0.3} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[12.15, 7.7, -17.99]}>
        <planeGeometry args={[0.2, 0.35]} />
        <meshStandardMaterial color="#607080" transparent opacity={0.2} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** 5 panel building silhouettes using InstancedMesh */
function PanelBuildings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const buildingData = useMemo(() => [
    { pos: [-12, 0, -15] as [number, number, number], w: 8, h: 18, d: 6 },
    { pos: [12, 0, -20] as [number, number, number], w: 10, h: 22, d: 6 },
    { pos: [-15, 0, 5] as [number, number, number], w: 7, h: 15, d: 5 },
    { pos: [14, 0, 8] as [number, number, number], w: 9, h: 20, d: 6 },
    { pos: [0, 0, -25] as [number, number, number], w: 12, h: 25, d: 8 },
  ], []);

  // Set up instance matrices in useEffect (not useMemo) to avoid ref access during render
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    buildingData.forEach((b, i) => {
      dummy.position.set(b.pos[0], b.h / 2, b.pos[2]);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [buildingData]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 5]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1a1a22" roughness={0.95} />
    </instancedMesh>
  );
}

/** Neon sign strips with emissive glow — with flicker animation */
function NeonSigns({ isWinter }: { isWinter: boolean }) {
  const redSignRef = useRef<THREE.Mesh>(null);
  const redLightRef = useRef<THREE.PointLight>(null);
  const cafeSignRef = useRef<THREE.Mesh>(null);
  const cafeKafeRef = useRef<THREE.Mesh>(null);
  const cafeKafeLightRef = useRef<THREE.PointLight>(null);
  const barScrollRef = useRef<THREE.Mesh>(null);
  const barScrollLightRef = useRef<THREE.PointLight>(null);
  const kafeOnRef = useRef(true);
  const kafeNextToggleRef = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Red neon flicker — occasional quick flashes
    if (redSignRef.current) {
      const flicker = Math.random() > 0.95 ? 0.3 : 1.2;
      (redSignRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flicker;
    }
    if (redLightRef.current) {
      redLightRef.current.intensity = Math.random() > 0.95 ? 0.2 : 0.8;
    }
    // Cafe sign subtle pulse
    if (cafeSignRef.current) {
      const pulse = (isWinter ? 1.2 : 1.5) + Math.sin(t * 2) * 0.15;
      (cafeSignRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }

    // "КАФЕ" neon sign flicker — random on/off like a broken tube
    if (t >= kafeNextToggleRef.current) {
      kafeNextToggleRef.current = t + 1 / 8; // 8 toggles/sec
      kafeOnRef.current = Math.random() < 0.94;
    }
    if (cafeKafeRef.current) {
      (cafeKafeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        kafeOnRef.current ? 2.0 : 0.05;
    }
    if (cafeKafeLightRef.current) {
      cafeKafeLightRef.current.intensity = kafeOnRef.current ? 1.5 : 0;
    }

    // Bar scrolling neon light — traveling bright segment
    if (barScrollRef.current) {
      const baseIntensity = 0.6;
      const scrollBoost = 1.5;
      (barScrollRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        baseIntensity + scrollBoost * 0.5 * (1 + Math.sin(t * 4));
    }
    if (barScrollLightRef.current) {
      const scrollX = Math.sin(t * 0.8) * 1.5;
      barScrollLightRef.current.position.x = scrollX;
      barScrollLightRef.current.intensity = 0.8 + Math.sin(t * 2) * 0.3;
    }
  });

  return (
    <group>
      {/* "Синяя яма" cafe sign */}
      <group position={[8, 4, -8]}>
        <mesh ref={cafeSignRef}>
          <boxGeometry args={[2.5, 0.3, 0.05]} />
          <meshStandardMaterial
            color="#001133"
            emissive="#1a4aff"
            emissiveIntensity={isWinter ? 1.2 : 1.5}
          />
        </mesh>
        <pointLight position={[0, -0.5, 0.5]} color="#1a4aff" intensity={2.5} distance={9} />
      </group>

      {/* "КАФЕ" neon sign — flickering broken tube style */}
      <group position={[-6, 5, -10]}>
        {/* Sign backing */}
        <mesh position={[0, 0.15, -0.02]}>
          <boxGeometry args={[2.0, 0.6, 0.02]} />
          <meshStandardMaterial color="#111111" roughness={0.9} />
        </mesh>
        {/* Neon letter frames — 4 Cyrillic letters К А Ф Е */}
        {[-0.7, -0.2, 0.2, 0.7].map((x, i) => (
          <mesh key={i} ref={i === 0 ? cafeKafeRef : undefined} position={[x, 0.15, 0]}>
            <boxGeometry args={[0.35, 0.4, 0.05]} />
            <meshStandardMaterial
              color="#001133"
              emissive="#ff4488"
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>
        ))}
        <pointLight
          ref={cafeKafeLightRef}
          position={[0, -0.5, 1]}
          color="#ff4488"
          intensity={1.5}
          distance={8}
        />
      </group>

      {/* Cyberpunk bar sign with scrolling light */}
      <group position={[5, 6, -15]}>
        {/* Sign panel */}
        <mesh position={[0, 0.2, -0.02]}>
          <boxGeometry args={[3.0, 0.8, 0.02]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
        {/* Bar name neon strip */}
        <mesh ref={barScrollRef} position={[0, 0.3, 0]}>
          <boxGeometry args={[2.6, 0.15, 0.05]} />
          <meshStandardMaterial
            color="#001a00"
            emissive="#00ffaa"
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
        {/* Bottom decorative strip */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[2.8, 0.05, 0.05]} />
          <meshStandardMaterial
            color="#1a0000"
            emissive="#ff2200"
            emissiveIntensity={1.0}
            toneMapped={false}
          />
        </mesh>
        {/* Scrolling accent light */}
        <pointLight
          ref={barScrollLightRef}
          position={[0, 0, 1]}
          color="#00ffaa"
          intensity={0.8}
          distance={6}
        />
      </group>

      {/* Red neon strip on building */}
      <group position={[-12, 8, -12]}>
        <mesh ref={redSignRef}>
          <boxGeometry args={[3, 0.15, 0.05]} />
          <meshStandardMaterial
            color="#330011"
            emissive="#ff1a3a"
            emissiveIntensity={1.2}
          />
        </mesh>
        <pointLight ref={redLightRef} position={[0, -0.3, 0.5]} color="#ff1a3a" intensity={2.0} distance={9} />
      </group>

      {/* Green pharmacy cross */}
      <group position={[14, 6, 7]}>
        <mesh>
          <boxGeometry args={[0.8, 0.8, 0.05]} />
          <meshStandardMaterial
            color="#003311"
            emissive="#00ff44"
            emissiveIntensity={1.0}
          />
        </mesh>
        <pointLight position={[0, -0.3, 0.5]} color="#00ff44" intensity={2.0} distance={7} />
      </group>

      {/* Yellow advertisement strip */}
      <group position={[0, 12, -24]}>
        <mesh>
          <boxGeometry args={[4, 0.2, 0.05]} />
          <meshStandardMaterial
            color="#332200"
            emissive="#ffaa00"
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>
    </group>
  );
}


