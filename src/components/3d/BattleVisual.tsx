
/* ─── Volodka RPG – Combat Arena procedural 3D visual ─── */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedSphereGeometry,
} from '@/engine/three/moduleGeometryRegistry';

import { useFrameTick } from '@/engine/frame/useFrameTick';
import { eventBus } from '@/engine/EventBus';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';

interface BattleVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/** CyberPunk2077/MatrixRain combat arena (12×12m) */
export function BattleVisual({ livePlayerPositionRef: _livePlayerPositionRef }: BattleVisualProps) {
  const floorTexture = useCachedCanvasTexture('battle:floor', createArenaFloorTexture);

  const W = 12;
  const D = 12;

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        <meshStandardMaterial
          map={floorTexture}
          color="#3a3a3a"
          roughness={0.7}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* Combat-reactive emissive grid — pulses with the fight, flashes on hits */}
      <ArenaReactiveGrid size={W} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CONCRETE BARRIERS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <ConcreteBarrier position={[-4, 0, -2]} rotation={0.3} />
      <ConcreteBarrier position={[3, 0, -3]} rotation={-0.2} />
      <ConcreteBarrier position={[-2, 0, 3]} rotation={0.5} />
      <ConcreteBarrier position={[4, 0, 2]} rotation={-0.4} />
      <ConcreteBarrier position={[0, 0, -4]} rotation={0.1} />

      {/* Wrecked car — central cover piece */}
      <WreckedCar position={[2.8, 0, 3.6]} rotation={-0.7} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── NEON-LIT ARENA EDGES ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Red neon strip - back */}
      <mesh position={[0, 0.15, -6]} castShadow geometry={getSharedBoxGeometry(12, 0.3, 0.1)}>
        <meshStandardMaterial color="#330011" emissive="#ff2244" emissiveIntensity={1.5} />
      </mesh>
      {/* Blue neon strip - left */}
      <mesh position={[-6, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow geometry={getSharedBoxGeometry(12, 0.3, 0.1)}>
        <meshStandardMaterial color="#001133" emissive="#2244ff" emissiveIntensity={1.5} />
      </mesh>
      {/* Red neon strip - front */}
      <mesh position={[0, 0.15, 6]} castShadow geometry={getSharedBoxGeometry(12, 0.3, 0.1)}>
        <meshStandardMaterial color="#330011" emissive="#ff2244" emissiveIntensity={1.5} />
      </mesh>
      {/* Blue neon strip - right */}
      <mesh position={[6, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow geometry={getSharedBoxGeometry(12, 0.3, 0.1)}>
        <meshStandardMaterial color="#001133" emissive="#2244ff" emissiveIntensity={1.5} />
      </mesh>

      {/* Center overhead fill — prevents dark corners in the arena */}
      <pointLight position={[0, 4, 0]} color="#667788" intensity={1.5} distance={12} decay={2} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── HOLOGRAPHIC DISPLAYS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <HolographicDisplay position={[-3, 0, -5]} color="#ff2244" />
      <HolographicDisplay position={[3, 0, -5]} color="#2244ff" />
      <HolographicDisplay position={[0, 0, 5]} color="#22ffaa" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── DEBRIS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail minLod="standard" position={[0, 0, 0]}>
      {Array.from({ length: 8 }).map((_, i) => {
        const x = Math.sin(i * 2.7) * 4;
        const z = Math.cos(i * 3.1) * 4;
        return (
          <mesh key={i} position={[x, 0.08, z]} rotation={[(i * 0.37) % 0.5, (i * 1.17) % Math.PI, 0]} castShadow geometry={getSharedBoxGeometry(0.2 + (i * 0.13) % 0.3, 0.1, 0.15 + (i * 0.07) % 0.2)}>
            <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
          </mesh>
        );
      })}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CHAIN LINK FENCE (back perimeter) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 0, -5.8]}>
        {/* Fence posts */}
        {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
          <mesh key={i} position={[x, 1.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.03, 0.03, 3, 6)}>
            <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* Top rail */}
        <mesh position={[0, 3, 0]} geometry={getSharedBoxGeometry(10, 0.04, 0.04)}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Chain link panels */}
        {[-3.75, -1.25, 1.25, 3.75].map((x, i) => (
          <mesh key={`cl-${i}`} position={[x, 1.5, 0]} geometry={getSharedPlaneGeometry(2.5, 3)}>
            <meshStandardMaterial color="#3a3a3a" transparent opacity={0.3} side={THREE.DoubleSide} wireframe polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SPOTLIGHT TOWERS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <SpotlightTower position={[-5, 0, -5]} lightColor="#ff2244" />
      <SpotlightTower position={[5, 0, -5]} lightColor="#2244ff" />
      <SpotlightTower position={[-5, 0, 5]} lightColor="#2244ff" />
      <SpotlightTower position={[5, 0, 5]} lightColor="#ff2244" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Red neon edge glow */}
      <pointLight position={[0, 0.5, -5.5]} color="#ff2244" intensity={3.5} distance={10} />

      {/* Blue neon edge glow */}
      <pointLight position={[-5.5, 0.5, 0]} color="#2244ff" intensity={3.5} distance={10} />

      {/* Arena center light — shadow-mapSize-height was missing (defaults to
          512, mismatched with width=256 producing stretched/distorted shadow
          maps). Added normalBias to reduce shadow acne on character meshes. */}
      <pointLight
        position={[0, 4, 0]}
        color="#ffffff"
        intensity={2.0}
        distance={16}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.003}
        shadow-normalBias={0.02}
      />

      {/* Opposite neon strips */}
      <pointLight position={[0, 0.5, 5.5]} color="#ff2244" intensity={2.5} distance={10} />
      <pointLight position={[5.5, 0.5, 0]} color="#2244ff" intensity={2.5} distance={10} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Broken monitors (shattered glass effect) ── */}
      <group position={[4, 0, -1]} rotation={[0, 0.8, 0]}>
        {/* Monitor frame on ground */}
        <mesh position={[0, 0.15, 0]} rotation={[0.3, 0, 0.2]} castShadow geometry={getSharedBoxGeometry(0.55, 0.35, 0.03)}>
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Cracked screen glow */}
        <mesh position={[0, 0.17, 0.02]} rotation={[0.3, 0, 0.2]} geometry={getSharedPlaneGeometry(0.45, 0.28)}>
          <meshStandardMaterial color="#000000" emissive="#2244ff" emissiveIntensity={0.3} />
        </mesh>
        {/* Glass shards */}
        <mesh position={[0.1, 0.2, 0.04]} rotation={[0.5, 0.3, 0]} geometry={getSharedPlaneGeometry(0.08, 0.12)}>
          <meshStandardMaterial color="#6080a0" transparent opacity={0.4} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      </group>

      {/* ── Sparks from damaged equipment (emissive dots) ── */}
      {[[2.5, 0.3, -3], [-3, 0.5, 2]].map((pos, i) => (
        <mesh key={`spark-${i}`} position={pos as [number, number, number]} geometry={getSharedSphereGeometry(0.03, 6, 6)}>
          <meshStandardMaterial color="#ffaa22" emissive="#ffaa22" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* ── Scattered papers ── */}
      {[[-1, 0.02, 1], [1.5, 0.02, -2], [-2, 0.02, -1]].map((pos, i) => (
        <mesh key={`paper-${i}`} rotation={[-Math.PI / 2, 0, 0.3 + i * 0.5]} position={pos as [number, number, number]} geometry={getSharedPlaneGeometry(0.15, 0.1)}>
          <meshStandardMaterial color="#e8e4dc" roughness={0.95} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      ))}

      {/* ── Bullet holes in walls (dark circles) ── */}
      {[[-5.9, 1.5, -3], [-5.9, 2.0, -1], [-5.9, 1.2, 1]].map((pos, i) => (
        <mesh key={`bullet-${i}`} position={pos as [number, number, number]} rotation-y={Math.PI / 2} geometry={getSharedCircleGeometry(0.03, 8)}>
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
      ))}

      {/* ── Overturned chair ── */}
      <group position={[-1, 0, 2.5]} rotation={[0.3, 0.5, Math.PI / 2.5]}>
        <mesh position={[0, 0.2, 0]} castShadow geometry={getSharedBoxGeometry(0.45, 0.04, 0.45)}>
          <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.5, -0.2]} castShadow geometry={getSharedBoxGeometry(0.45, 0.45, 0.04)}>
          <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
        </mesh>
      </group>
      </EnvironmentDetail>
    </group>
  );
}

/** Combat-reactive emissive floor grid.
 *  Slow breathing pulse during the fight; bright flash decay on combat hits. */
function ArenaReactiveGrid({ size }: { size: number }) {
  const gridTexture = useCachedCanvasTexture('battle:grid', createArenaGridTexture);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const timeRef = useRef(0);
  const flashRef = useRef(0);

  useEffect(() => {
    const offHit = eventBus.on('combat:hit', () => {
      flashRef.current = 1;
    });
    const offDamage = eventBus.on('combat:damage', () => {
      flashRef.current = Math.max(flashRef.current, 0.7);
    });
    return () => {
      offHit();
      offDamage();
    };
  }, []);

  useFrameTick('misc', ({ delta }) => {
    timeRef.current += delta;
    flashRef.current = Math.max(0, flashRef.current - delta * 2.2);
    const mat = materialRef.current;
    if (!mat) return;
    const breathe = 0.3 + Math.sin(timeRef.current * 1.6) * 0.1;
    mat.opacity = Math.min(1, breathe + flashRef.current * 0.65);
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.012} geometry={getSharedPlaneGeometry(size, size)}>
      <meshBasicMaterial
        ref={materialRef}
        map={gridTexture}
        color="#22ddff"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

/** Wrecked car — low-poly cover prop with a flickering hazard light */
function WreckedCar({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow geometry={getSharedBoxGeometry(2.6, 0.6, 1.2)}>
        <meshStandardMaterial color="#37404a" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* Crushed cabin */}
      <mesh position={[-0.25, 0.92, 0]} rotation={[0, 0, 0.06]} castShadow geometry={getSharedBoxGeometry(1.3, 0.42, 1.05)}>
        <meshStandardMaterial color="#2c343c" metalness={0.4} roughness={0.7} />
      </mesh>
      {/* Shattered windshield */}
      <mesh position={[0.42, 0.92, 0]} rotation={[0, 0, -0.5]} geometry={getSharedPlaneGeometry(0.5, 1.0)}>
        <meshStandardMaterial color="#6080a0" transparent opacity={0.35} metalness={0.2} roughness={0.15} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Wheels (one missing — on blocks) */}
      {[
        [-0.9, 0.22, 0.62],
        [0.9, 0.22, 0.62],
        [-0.9, 0.22, -0.62],
      ].map(([x, y, z], i) => (
        <mesh key={`wheel-${i}`} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow geometry={getSharedCylinderGeometry(0.22, 0.22, 0.16, 10)}>
          <meshStandardMaterial color="#181818" roughness={0.9} />
        </mesh>
      ))}
      {/* Brick under the missing wheel */}
      <mesh position={[0.9, 0.12, -0.62]} castShadow geometry={getSharedBoxGeometry(0.3, 0.24, 0.2)}>
        <meshStandardMaterial color="#5a4438" roughness={0.95} />
      </mesh>
      {/* Hazard light still blinking */}
      <mesh position={[1.32, 0.55, 0.45]} geometry={getSharedSphereGeometry(0.05, 6, 6)}>
        <meshStandardMaterial color="#ff6622" emissive="#ff6622" emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
}

function createArenaGridTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  const step = size / 4;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/** Concrete barrier */
function ConcreteBarrier({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow geometry={getSharedBoxGeometry(1.2, 0.8, 0.4)}>
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>
      {/* Scuff marks */}
      <mesh position={[0, 0.4, 0.21]} geometry={getSharedPlaneGeometry(0.3, 0.2)}>
        <meshStandardMaterial color="#4a4a4a" roughness={0.95} transparent opacity={0.5} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
    </group>
  );
}

/** Holographic display panel */
function HolographicDisplay({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Display stand */}
      <mesh position={[0, 0.5, 0]} castShadow geometry={getSharedBoxGeometry(0.1, 1.0, 0.1)}>
        <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Holographic screen */}
      <mesh position={[0, 1.8, 0.006]} geometry={getSharedPlaneGeometry(1.2, 0.8)}>
        <meshStandardMaterial
          color="#000000"
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 1.8, 0]} geometry={getSharedBoxGeometry(1.3, 0.9, 0.02)}>
        <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Spotlight tower */
function SpotlightTower({ position, lightColor }: { position: [number, number, number]; lightColor: string }) {
  return (
    <group position={position}>
      {/* Tower pole */}
      <mesh position={[0, 3, 0]} castShadow geometry={getSharedCylinderGeometry(0.06, 0.08, 6, 6)}>
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Light housing */}
      <mesh position={[0, 6.1, 0]} castShadow geometry={getSharedBoxGeometry(0.4, 0.15, 0.3)}>
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Spotlight glow */}
      <mesh position={[0, 6.0, 0.1]} geometry={getSharedSphereGeometry(0.08, 6, 6)}>
        <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={3} />
      </mesh>
      {/* Spot light */}
      <pointLight position={[0, 5.8, 0.2]} color={lightColor} intensity={1.5} distance={10} />
    </group>
  );
}

function createArenaFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Concrete base
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, 0, size, size);

  // Grid lines (arena marking)
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }

  // Center circle
  ctx.strokeStyle = '#ff224466';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(128, 128, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Damage/cracks
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}
