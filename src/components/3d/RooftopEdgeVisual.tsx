
/* ─── Volodka RPG – Rooftop Edge procedural 3D visual ─── */

import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useEnvironmentLod } from './lod/useEnvironmentLod';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';

interface RooftopEdgeVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/** Noir/CyberPunk2077 rooftop (10×8m) */
export function RooftopEdgeVisual({ livePlayerPositionRef: _livePlayerPositionRef }: RooftopEdgeVisualProps) {
  const floorTexture = useCachedCanvasTexture('rooftop_edge:floor', createRooftopFloorTexture);
  const { lod } = useEnvironmentLod();

  const W = 10;
  const D = 8;

  const shirtRef = useRef<THREE.Mesh>(null);

  useFrameTick('misc', ({ state }) => {
    if (shirtRef.current) {
      // Swaying shirt on clothesline
      const t = state.clock.elapsedTime;
      shirtRef.current.rotation.z = Math.sin(t * 1.5) * 0.08;
      shirtRef.current.rotation.x = Math.sin(t * 1.2) * 0.03;
    }
  });

  return (
    <group>
      {/* ── Rooftop surface ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floorTexture}
          color="#3a3a3a"
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LOW PARAPET WALLS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Front parapet (the edge) */}
      <mesh position={[0, 0.5, D / 2]} castShadow>
        <boxGeometry args={[W, 1.0, 0.2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>

      {/* Left parapet */}
      <mesh position={[-W / 2, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 1.0, D]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>

      {/* Right parapet */}
      <mesh position={[W / 2, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 1.0, D]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>

      {/* Back wall (building wall) */}
      <mesh position={[0, 2.5, -D / 2]} castShadow>
        <boxGeometry args={[W, 5, 0.3]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── HVAC UNITS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-3.5, 0, -2.5]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.2, 1.2, 0.8]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Vent grille */}
        <mesh position={[0, 0.8, 0.41]}>
          <planeGeometry args={[0.8, 0.5]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Pipes */}
        <mesh position={[-0.5, 0.3, -0.3]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
          <meshStandardMaterial color="#6a5a4a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      <group position={[3.0, 0, -2.0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.8, 1.0, 0.6]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANTENNA ARRAY — moved to FOREGROUND layer ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CITY SKYLINE (distant box geometry) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {[
        { pos: [-20, 0, -30] as [number, number, number], w: 5, h: 20, d: 5 },
        { pos: [-12, 0, -35] as [number, number, number], w: 8, h: 30, d: 6 },
        { pos: [-3, 0, -32] as [number, number, number], w: 6, h: 15, d: 5 },
        { pos: [5, 0, -28] as [number, number, number], w: 7, h: 25, d: 6 },
        { pos: [15, 0, -33] as [number, number, number], w: 10, h: 35, d: 8 },
        { pos: [22, 0, -30] as [number, number, number], w: 5, h: 18, d: 5 },
        { pos: [-25, 0, -25] as [number, number, number], w: 6, h: 22, d: 6 },
        { pos: [28, 0, -26] as [number, number, number], w: 8, h: 28, d: 7 },
      ].map((b, i) => (
        <group key={i} position={b.pos}>
          <mesh position={[0, b.h / 2, 0]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#0a0a15" roughness={0.95} />
          </mesh>
          {/* Random lit windows */}
          {Array.from({ length: 3 + (i % 4) }).map((_, j) => {
            const wx = (Math.random() - 0.5) * (b.w - 0.5);
            const wy = Math.random() * (b.h - 2) + 1;
            return (
              <mesh key={j} position={[wx + b.pos[0] * 0, wy, b.d / 2 + 0.01 + b.pos[2] * 0]}>
                <planeGeometry args={[0.4, 0.3]} />
                <meshStandardMaterial
                  color="#000000"
                  emissive="#ffaa44"
                  emissiveIntensity={0.8}
                />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── NEON BILLBOARDS (distant) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[15, 18, -30]}>
        <mesh>
          <boxGeometry args={[4, 2, 0.1]} />
          <meshStandardMaterial color="#001122" emissive="#ff44aa" emissiveIntensity={1.0} />
        </mesh>
        <pointLight position={[0, -1, 1]} color="#ff44aa" intensity={1.5} distance={8} />
      </group>

      <group position={[-15, 12, -32]}>
        <mesh>
          <boxGeometry args={[3, 1.5, 0.1]} />
          <meshStandardMaterial color="#002200" emissive="#44ffaa" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WATER TOWER ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[4, 0, -3]}>
        {/* Legs */}
        {[-0.4, 0.4].map((x, i) => (
          [-0.4, 0.4].map((z, j) => (
            <mesh key={`${i}-${j}`} position={[x, 1, z]} castShadow>
              <cylinderGeometry args={[0.04, 0.06, 2, 6]} />
              <meshStandardMaterial color="#5a4a3a" metalness={0.5} roughness={0.5} />
            </mesh>
          ))
        ))}
        {/* Tank */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.5, 1.0, 8]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Tank top */}
        <mesh position={[0, 3.05, 0]}>
          <coneGeometry args={[0.65, 0.3, 8]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.3} roughness={0.6} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ROOFTOP DOOR ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[2, 0, -D / 2 + 0.15]}>
        {/* Door frame */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[0.9, 2.2, 0.1]} />
          <meshStandardMaterial color="#3a2a20" roughness={0.8} />
        </mesh>
        {/* Door */}
        <mesh position={[0, 1.1, 0.06]}>
          <boxGeometry args={[0.8, 2.1, 0.05]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.85} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.3, 1.0, 0.1]}>
          <boxGeometry args={[0.04, 0.12, 0.04]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Neon sign glow */}
      <pointLight position={[15, 18, -28]} color="#ff44aa" intensity={3.5} distance={25} />

      {/* Warm sunset glow */}
      <pointLight position={[-5, 3, 6]} color="#cc6622" intensity={3.5} distance={18} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} />

      {/* Antenna red light */}
      <pointLight position={[-1.5, 6, -3.5]} color="#ff0000" intensity={1.0} distance={5} />

      {/* City ambient */}
      <pointLight position={[0, 0.5, 0]} color="#2a2a50" intensity={0.8} distance={12} />

      {/* Moonlight from above */}
      <pointLight position={[0, 15, 0]} color="#8a9ab0" intensity={1.2} distance={35} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail currentLod={lod} minLod="standard">

      {/* ── Pigeons on parapet ledge — moved to FOREGROUND layer ── */}

      {/* ── Satellite dish — moved to FOREGROUND layer ── */}

      {/* ── Clothesline with one shirt ── */}
      <group position={[-2, 0, 2]}>
        {/* Poles */}
        <mesh position={[-1, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.03, 2.4, 4]} />
          <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
        </mesh>
        <mesh position={[1, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.03, 2.4, 4]} />
          <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
        </mesh>
        {/* Line */}
        <mesh position={[0, 2.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.003, 0.003, 2, 4]} />
          <meshStandardMaterial color="#888" roughness={0.9} />
        </mesh>
        {/* Shirt hanging */}
        <mesh ref={shirtRef} position={[0.2, 2.1, 0.05]}>
          <boxGeometry args={[0.2, 0.3, 0.02]} />
          <meshStandardMaterial color="#4a6a8a" roughness={0.9} />
        </mesh>
        {/* Sleeve */}
        <mesh position={[0.1, 2.05, 0.05]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.15, 0.06, 0.01]} />
          <meshStandardMaterial color="#4a6a8a" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Broken antenna (bent metal) ── */}
      <group position={[-3.5, 1.2, -3.0]}>
        <mesh rotation={[0, 0, 0.6]} castShadow>
          <cylinderGeometry args={[0.01, 0.015, 1.5, 4]} />
          <meshStandardMaterial color="#6a6a6a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.3, 0.8, 0]} rotation={[0, 0, 1.2]} castShadow>
          <cylinderGeometry args={[0.008, 0.01, 0.8, 4]} />
          <meshStandardMaterial color="#5a5a5a" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
      </EnvironmentDetail>
    </group>
  );
}

function createRooftopFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark concrete
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, size, size);

  // Tar seams
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 2;
  for (let i = 0; i < size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Gravel texture
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? '#4a4a4a' : '#2a2a2a';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  return tex;
}
