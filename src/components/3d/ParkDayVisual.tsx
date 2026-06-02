
/* ─── Volodka RPG – Memorial Park procedural 3D visual ─── */

import { useMemo } from 'react';
import * as THREE from 'three';

interface ParkDayVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/** Gothic/Dark Fantasy memorial park (30×30m) */
export function ParkDayVisual({ livePlayerPositionRef }: ParkDayVisualProps) {
  const groundTexture = useMemo(() => createParkGroundTexture(), []);

  const W = 30;
  const D = 30;

  return (
    <group>
      {/* ── Ground ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={groundTexture}
          color="#3a5a2a"
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Path (gravel) ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[2.5, 20]} />
        <meshStandardMaterial color="#7a7a70" roughness={0.95} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Cross path */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.025, 0]} receiveShadow>
        <planeGeometry args={[2.5, 20]} />
        <meshStandardMaterial color="#7a7a70" roughness={0.95} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANCIENT TREES (distant — MIDGROUND layer) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <AncientTree position={[-8, 0, -8]} />
      <AncientTree position={[9, 0, -6]} />
      <AncientTree position={[-10, 0, 5]} />
      <AncientTree position={[7, 0, 9]} />
      <AncientTree position={[-5, 0, -12]} />
      <AncientTree position={[11, 0, 3]} />
      {/* Near trees moved to FOREGROUND layer */}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── STONE BENCHES (distant — MIDGROUND layer) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Near benches moved to FOREGROUND layer */}
      <StoneBench position={[3, 0, -3]} rotation={0.3} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── MEMORIAL OBELISK (center) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 0, -2]}>
        {/* Base */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[1.5, 0.3, 1.5]} />
          <meshStandardMaterial color="#7a7a70" roughness={0.8} />
        </mesh>
        {/* Mid base */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.1, 0.4, 1.1]} />
          <meshStandardMaterial color="#6a6a60" roughness={0.8} />
        </mesh>
        {/* Obelisk shaft */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.35, 4.0, 6]} />
          <meshStandardMaterial color="#7a7a70" roughness={0.7} />
        </mesh>
        {/* Obelisk tip */}
        <mesh position={[0, 4.7, 0]} castShadow>
          <coneGeometry args={[0.18, 0.4, 6]} />
          <meshStandardMaterial color="#8a8a80" roughness={0.6} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── IRON FENCE (perimeter) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Back fence */}
      {Array.from({ length: 12 }).map((_, i) => (
        <IronFencePost key={`bf-${i}`} position={[-13.5 + i * 2.5, 0, -14.5]} />
      ))}
      {/* Left fence */}
      {Array.from({ length: 12 }).map((_, i) => (
        <IronFencePost key={`lf-${i}`} position={[-14.5, 0, -13.5 + i * 2.5]} rotation={Math.PI / 2} />
      ))}
      {/* Right fence */}
      {Array.from({ length: 12 }).map((_, i) => (
        <IronFencePost key={`rf-${i}`} position={[14.5, 0, -13.5 + i * 2.5]} rotation={Math.PI / 2} />
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── MISTY POND (front-left) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-8, 0, 8]}>
        {/* Pond surface - polygonOffset prevents Z-fighting with ground */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
          <circleGeometry args={[3, 16]} />
          <meshStandardMaterial color="#1a3a3a" metalness={0.3} roughness={0.2} transparent opacity={0.7} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
        {/* Pond edge stones */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 3.1, 0.1, Math.sin(angle) * 3.1]}>
              <sphereGeometry args={[0.2, 6, 6]} />
              <meshStandardMaterial color="#6a6a60" roughness={0.9} />
            </mesh>
          );
        })}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── FALLEN LEAVES (scattered) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = (Math.sin(i * 7.3) * 12);
        const z = (Math.cos(i * 5.1) * 12);
        return (
          <mesh key={`leaf-${i}`} rotation-x={-Math.PI / 2} position={[x, 0.03, z]}>
            <planeGeometry args={[0.15, 0.1]} />
            <meshStandardMaterial
              color={['#6a4020', '#8a5a20', '#5a3a10', '#7a4a18'][i % 4]}
              roughness={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Warm amber lamp near obelisk */}
      <pointLight position={[0, 3.5, -2]} color="#ffaa44" intensity={2.5} distance={14} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} />

      {/* Second amber lamp along path */}
      <pointLight position={[5, 3.5, 3]} color="#ffaa44" intensity={2.0} distance={12} />

      {/* Greenish pond glow */}
      <pointLight position={[-8, 0.5, 8]} color="#22aa66" intensity={1.5} distance={10} />

      {/* Overall ambient fill */}
      <pointLight position={[0, 5, 0]} color="#a0c0a0" intensity={1.0} distance={30} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Bench with graffiti ── */}
      <group position={[8, 0, 3]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.2, 0.08, 0.4]} />
          <meshStandardMaterial color="#7a7a70" roughness={0.85} />
        </mesh>
        <mesh position={[-0.5, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.35]} />
          <meshStandardMaterial color="#6a6a60" roughness={0.85} />
        </mesh>
        <mesh position={[0.5, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.35]} />
          <meshStandardMaterial color="#6a6a60" roughness={0.85} />
        </mesh>
        {/* Graffiti spray on bench */}
        <mesh position={[0, 0.42, 0.21]}>
          <planeGeometry args={[0.4, 0.1]} />
          <meshStandardMaterial color="#3a3a3a" emissive="#ff2244" emissiveIntensity={0.15} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* ── Bird on tree (tiny shape) ── */}
      <group position={[-8, 4.2, -8]}>
        <mesh>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
        </mesh>
        {/* Head */}
        <mesh position={[0.04, 0.04, 0]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Discarded newspaper on path ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[1.5, 0.04, -1.0]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="#c8c0a0" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Puddle with reflection near path ── */}
      <mesh rotation-x={-Math.PI / 2} position={[-1, 0.03, 2]}>
        <circleGeometry args={[0.5, 12]} />
        <meshStandardMaterial color="#1a3a3a" metalness={0.5} roughness={0.1} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

/** Ancient tree with trunk and canopy */
function AncientTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.4, 3.0, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Canopy layers */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <sphereGeometry args={[2.5, 8, 8]} />
        <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
      </mesh>
      <mesh position={[0.8, 4.2, 0.5]} castShadow>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshStandardMaterial color="#3a5a2a" roughness={0.95} />
      </mesh>
      <mesh position={[-0.6, 3.5, -0.6]} castShadow>
        <sphereGeometry args={[1.2, 8, 6]} />
        <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Stone bench */
function StoneBench({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.08, 0.4]} />
        <meshStandardMaterial color="#7a7a70" roughness={0.85} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.5, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.35]} />
        <meshStandardMaterial color="#6a6a60" roughness={0.85} />
      </mesh>
      <mesh position={[0.5, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.35]} />
        <meshStandardMaterial color="#6a6a60" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Iron fence post */
function IronFencePost({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Post */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.04, 1.2, 0.04]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Horizontal rail */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.4, 0.03, 0.03]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Bottom rail */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2.4, 0.03, 0.03]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function createParkGroundTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark grass base
  ctx.fillStyle = '#3a5a2a';
  ctx.fillRect(0, 0, size, size);

  // Grass variation
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? '#4a6a3a' : '#2a4a1a';
    ctx.fillRect(x, y, Math.random() * 20 + 5, Math.random() * 10 + 3);
  }

  // Overgrown patches
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#5a7a4a';
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 15 + 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}
