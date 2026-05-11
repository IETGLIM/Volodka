'use client';

/* ─── Volodka RPG – Dreamscape procedural 3D visual ─── */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Dark Fantasy/Psychonauts2 dreamscape (50×50m) */
export function SleepDreamVisual() {
  const groundTexture = useMemo(() => createDreamGroundTexture(), []);

  const W = 50;
  const D = 50;

  return (
    <group>
      {/* ── Ethereal ground ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={groundTexture}
          color="#0a0515"
          roughness={0.95}
          transparent
          opacity={0.8}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── FLOATING ISLANDS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <FloatingIsland position={[-12, 4, -10]} scale={2.5} />
      <FloatingIsland position={[15, 6, -8]} scale={1.8} />
      <FloatingIsland position={[-8, 8, 12]} scale={2.0} />
      <FloatingIsland position={[10, 3, 14]} scale={1.5} />
      <FloatingIsland position={[0, 10, -18]} scale={3.0} />
      <FloatingIsland position={[-18, 5, 0]} scale={1.3} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── IMPOSSIBLE GEOMETRY ── */}
      {/* ═══════════════════════════════════════════════ */}
      <ImpossibleStructure position={[8, 2, -5]} />
      <ImpossibleStructure position={[-15, 3, 8]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── FLOATING POEM TEXT ── */}
      {/* ═══════════════════════════════════════════════ */}
      <FloatingPoemFragment position={[-5, 5, -12]} text="СМЕРТЬ" />
      <FloatingPoemFragment position={[12, 7, 5]} text="СВЕТ" />
      <FloatingPoemFragment position={[-10, 4, 15]} text="ПАМЯТЬ" />
      <FloatingPoemFragment position={[6, 9, -15]} text="ТИШИНА" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── MEMORY FRAGMENTS (glowing cubes) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <MemoryFragment position={[-3, 1.5, -6]} color="#ffcc44" />
      <MemoryFragment position={[7, 2.0, -3]} color="#00cccc" />
      <MemoryFragment position={[-8, 1.0, 4]} color="#ffcc44" />
      <MemoryFragment position={[4, 3.0, 8]} color="#ff44aa" />
      <MemoryFragment position={[-14, 2.5, -3]} color="#00cccc" />
      <MemoryFragment position={[0, 1.8, -10]} color="#ffcc44" />
      <MemoryFragment position={[16, 1.2, -2]} color="#00cccc" />
      <MemoryFragment position={[-5, 4.0, -18]} color="#ffcc44" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SPIRAL PILLARS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <SpiralPillar position={[-6, 0, -3]} />
      <SpiralPillar position={[10, 0, -8]} />
      <SpiralPillar position={[-4, 0, 10]} />
      <SpiralPillar position={[0, 0, -15]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ETHEREAL FOG LAYERS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <FogLayer y={0.3} />
      <FogLayer y={3.0} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Central floating orb */}
      <pointLight position={[0, 6, 0]} color="#00cccc" intensity={3.5} distance={30} />

      {/* Memory fragment glows */}
      <pointLight position={[-3, 2, -6]} color="#ffcc44" intensity={2.0} distance={10} />
      <pointLight position={[4, 4, 8]} color="#ff44aa" intensity={1.5} distance={10} />

      {/* Deep purple ambient */}
      <pointLight position={[0, 0.5, 0]} color="#2a1a50" intensity={1.0} distance={30} />

      {/* Ethereal cyan highlights */}
      <pointLight position={[-15, 5, -10]} color="#00cccc" intensity={2.0} distance={18} />
      <pointLight position={[15, 5, 10]} color="#00cccc" intensity={2.0} distance={18} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Floating clock ── */}
      <group position={[5, 6, -3]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
          <meshStandardMaterial color="#1a0a30" emissive="#ffcc44" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
        {/* Clock hands */}
        <mesh position={[0, 0.025, 0]} rotation={[0, 0, 0.8]}>
          <boxGeometry args={[0.15, 0.01, 0.005]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, 0.025, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.1, 0.01, 0.005]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* ── Ethereal glowing orbs ── */}
      {[[-3, 3, 5], [8, 7, -12], [-12, 2, -8]].map((pos, i) => (
        <mesh key={`orb-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color={['#ff44aa', '#00cccc', '#ffcc44'][i]}
            emissive={['#ff44aa', '#00cccc', '#ffcc44'][i]}
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* ── Torn photo floating ── */}
      <group position={[-6, 4, 8]}>
        <mesh rotation={[0.2, 0.4, 0.1]}>
          <planeGeometry args={[0.2, 0.15]} />
          <meshStandardMaterial color="#c8b8a0" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
        {/* Torn edge */}
        <mesh position={[0.08, -0.04, 0]} rotation={[0.2, 0.4, 0.3]}>
          <planeGeometry args={[0.08, 0.06]} />
          <meshStandardMaterial color="#c8b8a0" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* ── Melting furniture (distorted chair) ── */}
      <group position={[2, 0, -8]}>
        <mesh position={[0, 0.3, 0]} castShadow scale={[1, 0.6, 1]}>
          <boxGeometry args={[0.4, 0.04, 0.4]} />
          <meshStandardMaterial color="#2a1a40" emissive="#1a0a30" emissiveIntensity={0.1} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.5, -0.15]} scale={[1, 1.3, 0.5]}>
          <boxGeometry args={[0.4, 0.4, 0.04]} />
          <meshStandardMaterial color="#2a1a40" emissive="#1a0a30" emissiveIntensity={0.1} roughness={0.9} />
        </mesh>
        {/* Dripping leg */}
        <mesh position={[0.15, 0.1, 0.15]}>
          <cylinderGeometry args={[0.015, 0.008, 0.25, 4]} />
          <meshStandardMaterial color="#2a1a40" emissive="#00cccc" emissiveIntensity={0.15} roughness={0.9} />
        </mesh>
      </group>

      {/* ── Inverted perspective elements (upside-down door frame) ── */}
      <group position={[-10, 4, -5]} rotation={[Math.PI, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 2.2, 0.08]} />
          <meshStandardMaterial color="#2a1a40" emissive="#1a0a30" emissiveIntensity={0.15} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/** Floating island with impossible terrain */
function FloatingIsland({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Island base (inverted truncated cone) */}
      <mesh position={[0, -0.5, 0]} scale={scale} castShadow>
        <cylinderGeometry args={[0.3, 1.2, 1.5, 6]} />
        <meshStandardMaterial color="#1a0a30" roughness={0.9} />
      </mesh>
      {/* Island top surface */}
      <mesh position={[0, 0.25, 0]} scale={scale} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 6]} />
        <meshStandardMaterial color="#2a1a40" roughness={0.8} />
      </mesh>
      {/* Terrain feature */}
      <mesh position={[0, 0.6, 0]} scale={scale * 0.4}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Impossible geometry structure */
function ImpossibleStructure({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Penrose-like triangle approximation */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.15, 3, 0.15]} />
        <meshStandardMaterial color="#2a1a40" emissive="#00cccc" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
      <mesh position={[0.7, 1.5, 0]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[0.15, 3, 0.15]} />
        <meshStandardMaterial color="#2a1a40" emissive="#00cccc" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
      <mesh position={[0.35, 2.8, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.4, 0.15, 0.15]} />
        <meshStandardMaterial color="#2a1a40" emissive="#00cccc" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Floating poem text fragment */
function FloatingPoemFragment({ position, text }: { position: [number, number, number]; text: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = '#00cccc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.5;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2 + position[2]) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <planeGeometry args={[2.5, 0.6]} />
        <meshStandardMaterial map={texture} transparent opacity={0.7} side={THREE.DoubleSide} emissive="#00cccc" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/** Glowing memory fragment cube */
function MemoryFragment({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + position[0];
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3 + position[2];
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.8} />
    </mesh>
  );
}

/** Spiral pillar */
function SpiralPillar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Central column */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#2a1a40" emissive="#1a0a30" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
      {/* Spiral segments */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 3;
        const y = (i / 8) * 3.5 + 0.3;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.5, y, Math.sin(angle) * 0.5]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.4, 0.08, 0.12]} />
            <meshStandardMaterial color="#1a0a30" emissive="#00cccc" emissiveIntensity={0.15} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Ethereal fog layer */
function FogLayer({ y }: { y: number }) {
  return (
    <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#1a0a30" transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
  );
}

function createDreamGroundTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep purple base
  ctx.fillStyle = '#0a0515';
  ctx.fillRect(0, 0, size, size);

  // Ethereal swirl patterns
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 40 + 10;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, '#00cccc');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Subtle cracks
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#ffcc44';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}
