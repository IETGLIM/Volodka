
/* ─── Volodka RPG – Combat Arena procedural 3D visual ─── */

import * as THREE from 'three';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';

interface BattleVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/** CyberPunk2077/MatrixRain combat arena (12×12m) */
export function BattleVisual({ livePlayerPositionRef: _livePlayerPositionRef }: BattleVisualProps) {
  const floorTexture = useCachedCanvasTexture('battle:floor', createArenaFloorTexture);
  const { lod } = useEnvironmentLod();

  const W = 12;
  const D = 12;

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floorTexture}
          color="#3a3a3a"
          roughness={0.7}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CONCRETE BARRIERS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <ConcreteBarrier position={[-4, 0, -2]} rotation={0.3} />
      <ConcreteBarrier position={[3, 0, -3]} rotation={-0.2} />
      <ConcreteBarrier position={[-2, 0, 3]} rotation={0.5} />
      <ConcreteBarrier position={[4, 0, 2]} rotation={-0.4} />
      <ConcreteBarrier position={[0, 0, -4]} rotation={0.1} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── NEON-LIT ARENA EDGES ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Red neon strip - back */}
      <mesh position={[0, 0.15, -6]} castShadow>
        <boxGeometry args={[12, 0.3, 0.1]} />
        <meshStandardMaterial color="#330011" emissive="#ff2244" emissiveIntensity={1.5} />
      </mesh>
      {/* Blue neon strip - left */}
      <mesh position={[-6, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[12, 0.3, 0.1]} />
        <meshStandardMaterial color="#001133" emissive="#2244ff" emissiveIntensity={1.5} />
      </mesh>
      {/* Red neon strip - front */}
      <mesh position={[0, 0.15, 6]} castShadow>
        <boxGeometry args={[12, 0.3, 0.1]} />
        <meshStandardMaterial color="#330011" emissive="#ff2244" emissiveIntensity={1.5} />
      </mesh>
      {/* Blue neon strip - right */}
      <mesh position={[6, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[12, 0.3, 0.1]} />
        <meshStandardMaterial color="#001133" emissive="#2244ff" emissiveIntensity={1.5} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── HOLOGRAPHIC DISPLAYS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <HolographicDisplay position={[-3, 0, -5]} color="#ff2244" />
      <HolographicDisplay position={[3, 0, -5]} color="#2244ff" />
      <HolographicDisplay position={[0, 0, 5]} color="#22ffaa" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── DEBRIS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
      {Array.from({ length: 8 }).map((_, i) => {
        const x = Math.sin(i * 2.7) * 4;
        const z = Math.cos(i * 3.1) * 4;
        return (
          <mesh key={i} position={[x, 0.08, z]} rotation={[Math.random() * 0.5, Math.random() * Math.PI, 0]} castShadow>
            <boxGeometry args={[0.2 + Math.random() * 0.3, 0.1, 0.15 + Math.random() * 0.2]} />
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
          <mesh key={i} position={[x, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 3, 6]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* Top rail */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[10, 0.04, 0.04]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Chain link panels */}
        {[-3.75, -1.25, 1.25, 3.75].map((x, i) => (
          <mesh key={`cl-${i}`} position={[x, 1.5, 0]}>
            <planeGeometry args={[2.5, 3]} />
            <meshStandardMaterial color="#3a3a3a" transparent opacity={0.3} side={THREE.DoubleSide} wireframe />
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

      {/* Arena center light */}
      <pointLight position={[0, 4, 0]} color="#ffffff" intensity={2.0} distance={16} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} />

      {/* Opposite neon strips */}
      <pointLight position={[0, 0.5, 5.5]} color="#ff2244" intensity={2.5} distance={10} />
      <pointLight position={[5.5, 0.5, 0]} color="#2244ff" intensity={2.5} distance={10} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Broken monitors (shattered glass effect) ── */}
      <group position={[4, 0, -1]} rotation={[0, 0.8, 0]}>
        {/* Monitor frame on ground */}
        <mesh position={[0, 0.15, 0]} rotation={[0.3, 0, 0.2]} castShadow>
          <boxGeometry args={[0.55, 0.35, 0.03]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Cracked screen glow */}
        <mesh position={[0, 0.17, 0.02]} rotation={[0.3, 0, 0.2]}>
          <planeGeometry args={[0.45, 0.28]} />
          <meshStandardMaterial color="#000000" emissive="#2244ff" emissiveIntensity={0.3} />
        </mesh>
        {/* Glass shards */}
        <mesh position={[0.1, 0.2, 0.04]} rotation={[0.5, 0.3, 0]}>
          <planeGeometry args={[0.08, 0.12]} />
          <meshStandardMaterial color="#6080a0" transparent opacity={0.4} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Sparks from damaged equipment (emissive dots) ── */}
      {[[2.5, 0.3, -3], [-3, 0.5, 2]].map((pos, i) => (
        <mesh key={`spark-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#ffaa22" emissive="#ffaa22" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* ── Scattered papers ── */}
      {[[-1, 0.02, 1], [1.5, 0.02, -2], [-2, 0.02, -1]].map((pos, i) => (
        <mesh key={`paper-${i}`} rotation={[-Math.PI / 2, 0, 0.3 + i * 0.5]} position={pos as [number, number, number]}>
          <planeGeometry args={[0.15, 0.1]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ── Bullet holes in walls (dark circles) ── */}
      {[[-5.9, 1.5, -3], [-5.9, 2.0, -1], [-5.9, 1.2, 1]].map((pos, i) => (
        <mesh key={`bullet-${i}`} position={pos as [number, number, number]} rotation-y={Math.PI / 2}>
          <circleGeometry args={[0.03, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
      ))}

      {/* ── Overturned chair ── */}
      <group position={[-1, 0, 2.5]} rotation={[0.3, 0.5, Math.PI / 2.5]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.45, 0.04, 0.45]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.5, -0.2]} castShadow>
          <boxGeometry args={[0.45, 0.45, 0.04]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
        </mesh>
      </group>
      </EnvironmentDetail>
    </group>
  );
}

/** Concrete barrier */
function ConcreteBarrier({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.8, 0.4]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>
      {/* Scuff marks */}
      <mesh position={[0, 0.4, 0.21]}>
        <planeGeometry args={[0.3, 0.2]} />
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
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Holographic screen */}
      <mesh position={[0, 1.8, 0.006]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial
          color="#000000"
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[1.3, 0.9, 0.02]} />
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
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 6, 6]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Light housing */}
      <mesh position={[0, 6.1, 0]} castShadow>
        <boxGeometry args={[0.4, 0.15, 0.3]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Spotlight glow */}
      <mesh position={[0, 6.0, 0.1]}>
        <sphereGeometry args={[0.08, 6, 6]} />
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
