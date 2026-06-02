'use client';

/* ─── Volodka RPG – Abandoned Factory procedural 3D visual ─── */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Gothic/Industrial abandoned factory (20×18m) */
export function AbandonedFactoryVisual() {
  const floorTexture = useMemo(() => createFactoryFloorTexture(), []);
  const wallTexture = useMemo(() => createFactoryWallTexture(), []);

  const W = 20;
  const D = 18;
  const H = 6;

  const dripRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (dripRef.current) {
      const t = state.clock.elapsedTime;
      // Dripping water — periodic drop falls
      const cycle = t % 2;
      const dropY = cycle < 1.5 ? 3.9 : 3.9 - (cycle - 1.5) * 2;
      dripRef.current.position.y = Math.max(dropY, 0.05);
      // Reset visibility when at bottom
      dripRef.current.visible = cycle < 1.8;
    }
  });

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floorTexture}
          color="#2a2520"
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#1a1510" roughness={0.95} />
      </mesh>

      {/* ── Walls ── */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3530" roughness={0.9} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3530" roughness={0.9} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3530" roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3530" roughness={0.9} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── RUSTED MACHINERY ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Large press machine (left) */}
      <group position={[-7, 0, -5]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[2.0, 3.0, 1.5]} />
          <meshStandardMaterial color="#8a4020" roughness={0.9} metalness={0.3} />
        </mesh>
        {/* Press arm */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[1.2, 0.4, 0.8]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.6} />
        </mesh>
        {/* Piston */}
        <mesh position={[0, 4.2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 1.5, 8]} />
          <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* Small machine (right) */}
      <group position={[6, 0, -3]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[1.2, 1.6, 1.0]} />
          <meshStandardMaterial color="#8a4020" roughness={0.85} metalness={0.3} />
        </mesh>
        {/* Control panel */}
        <mesh position={[0, 1.3, 0.51]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#22aa44" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── BROKEN WINDOWS WITH LIGHT BEAMS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[W / 2 - 0.01, 4, -4]}>
        <mesh rotation-y={-Math.PI / 2}>
          <planeGeometry args={[2.5, 2.0]} />
          <meshStandardMaterial
            color="#1a1a10"
            emissive="#ffdd88"
            emissiveIntensity={0.4}
          />
        </mesh>
        {/* Broken glass shards */}
        <mesh rotation-y={-Math.PI / 2} position={[0.02, 0.5, -0.8]}>
          <planeGeometry args={[0.3, 0.6]} />
          <meshStandardMaterial color="#a0b0c0" transparent opacity={0.3} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[0.02, -0.3, 0.5]}>
          <planeGeometry args={[0.4, 0.5]} />
          <meshStandardMaterial color="#a0b0c0" transparent opacity={0.2} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <group position={[W / 2 - 0.01, 4, 3]}>
        <mesh rotation-y={-Math.PI / 2}>
          <planeGeometry args={[2.5, 2.0]} />
          <meshStandardMaterial
            color="#1a1a10"
            emissive="#ffdd88"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CONVEYOR BELTS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 0, 2]}>
        {/* Belt surface */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[8, 0.05, 1.0]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
        </mesh>
        {/* Belt supports */}
        {[-3.5, -1.5, 0.5, 2.5].map((x, i) => (
          <mesh key={i} position={[x, 0.3, 0]} castShadow>
            <boxGeometry args={[0.1, 0.6, 0.8]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
        {/* Rollers */}
        {[-3.0, -1.0, 1.0, 3.0].map((x, i) => (
          <mesh key={`r-${i}`} position={[x, 0.63, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
            <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CHEMICAL VATS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <ChemicalVat position={[-5, 0, 5]} color="#22aa44" />
      <ChemicalVat position={[-3, 0, 5]} color="#22aa44" />
      <ChemicalVat position={[-4, 0, 3]} color="#44aa22" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CATWALK (elevated) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 3.5, -7]}>
        {/* Walkway */}
        <mesh castShadow>
          <boxGeometry args={[12, 0.05, 1.2]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Railing posts */}
        {[-5.5, -3, -0.5, 2, 4.5].map((x, i) => (
          <mesh key={i} position={[x, 0.5, 0.55]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 4]} />
            <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* Top rail */}
        <mesh position={[0, 1.0, 0.55]} castShadow>
          <boxGeometry args={[12, 0.03, 0.03]} />
          <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── GRAFFITI WALLS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-W / 2 + 0.02, 2, 0]}>
        {/* Graffiti patch 1 */}
        <mesh rotation-y={Math.PI / 2}>
          <planeGeometry args={[2, 1.5]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#ff2244" emissiveIntensity={0.15} />
        </mesh>
      </group>
      <group position={[-W / 2 + 0.02, 3, -5]}>
        <mesh rotation-y={Math.PI / 2}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#4488ff" emissiveIntensity={0.12} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── COLLAPSED CEILING SECTION ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[5, 0, -5]}>
        {/* Debris on floor */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[(i - 3) * 0.5, 0.1 + Math.random() * 0.2, (i % 3) * 0.4]} rotation={[Math.random() * 0.3, Math.random() * Math.PI, 0]} castShadow>
            <boxGeometry args={[0.3 + Math.random() * 0.4, 0.08, 0.2 + Math.random() * 0.3]} />
            <meshStandardMaterial color="#3a3530" roughness={0.9} />
          </mesh>
        ))}
        {/* Twisted beam */}
        <mesh position={[0, 0.5, 0]} rotation={[0.2, 0.5, 0.3]} castShadow>
          <boxGeometry args={[2.5, 0.15, 0.1]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.6} />
        </mesh>
        {/* Opening to sky (bright patch on ceiling) */}
        <mesh position={[0, H - 0.02, 0]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial color="#0a0a10" emissive="#8a9ab0" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Flickering industrial lamp (back) */}
      <pointLight position={[0, 5.5, -6]} color="#ffcc88" intensity={3.5} distance={14} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} />

      {/* Chemical vat glow */}
      <pointLight position={[-4, 1.5, 5]} color="#22aa44" intensity={2.5} distance={10} />

      {/* Light beam from broken window */}
      <pointLight position={[9, 4, -4]} color="#ffdd88" intensity={2.0} distance={8} />

      {/* Collapsed ceiling skylight */}
      <pointLight position={[5, 5.5, -5]} color="#8a9ab0" intensity={1.5} distance={10} />

      {/* Dim fill */}
      <pointLight position={[-8, 3, 0]} color="#2a2018" intensity={1.0} distance={12} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Dripping pipes (thin cylinders) ── */}
      <mesh position={[6, 4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 3, 6]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Pipe joint */}
      <mesh position={[4.5, 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 6]} />
        <meshStandardMaterial color="#6a5a4a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Drip at pipe end */}
      <mesh ref={dripRef} position={[4.5, 3.9, 0.05]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#4a6a8a" transparent opacity={0.7} />
      </mesh>

      {/* ── Broken glass on floor ── */}
      {[
        [2, 0.01, 4], [2.3, 0.01, 4.2], [1.8, 0.01, 4.5], [2.5, 0.01, 3.8],
      ].map((pos, i) => (
        <mesh key={`glass-${i}`} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0.3 + i * 0.7]}>
          <planeGeometry args={[0.08, 0.05]} />
          <meshStandardMaterial color="#a0b8c0" transparent opacity={0.4} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ── Abandoned hard hat ── */}
      <group position={[3, 0, 3]} rotation={[0, 0.5, 0.2]}>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#cc8822" roughness={0.8} />
        </mesh>
        {/* Brim */}
        <mesh position={[0, 0.08, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.08, 0.14, 8]} />
          <meshStandardMaterial color="#bb7720" roughness={0.8} />
        </mesh>
      </group>

      {/* ── Additional graffiti tag ── */}
      <mesh position={[W / 2 - 0.02, 2.5, 5]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[1.8, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" emissive="#44ff44" emissiveIntensity={0.1} roughness={0.95} />
      </mesh>

      {/* ── Oil puddle on floor ── */}
      <mesh rotation-x={-Math.PI / 2} position={[-5, 0.008, 3]}>
        <circleGeometry args={[0.6, 12]} />
        <meshStandardMaterial color="#0a0a05" metalness={0.4} roughness={0.3} transparent opacity={0.5} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
    </group>
  );
}

/** Chemical vat with glowing contents */
function ChemicalVat({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Vat body */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.4, 1.6, 8]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Chemical surface */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.05, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.7} />
      </mesh>
      {/* Pipes */}
      <mesh position={[0.5, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

function createFactoryFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Concrete base
  ctx.fillStyle = '#2a2520';
  ctx.fillRect(0, 0, size, size);

  // Stains
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 30 + 10;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, Math.random() > 0.5 ? '#1a1510' : '#3a3020');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Oil drips
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#0a0a05';
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 8 + 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Crack lines
  ctx.strokeStyle = '#1a1510';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  return tex;
}

function createFactoryWallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Industrial brick base
  ctx.fillStyle = '#3a3530';
  ctx.fillRect(0, 0, size, size);

  // Brick pattern
  ctx.strokeStyle = '#2a2520';
  ctx.lineWidth = 1;
  let offset = 0;
  for (let y = 0; y < size; y += 24) {
    for (let x = offset; x < size; x += 60) {
      ctx.strokeRect(x, y, 58, 22);
    }
    offset = offset === 0 ? 30 : 0;
  }

  // Water damage
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
    gradient.addColorStop(0, '#4a4530');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 40, y - 40, 80, 80);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  return tex;
}
