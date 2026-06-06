
/* ─── ЧК · Лес · Зорге — secret society clearing (procedural forest) ─── */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ChkForestZorgeVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

const W = 36;
const D = 36;

/** Night forest clearing: campfire, port wine crates, guitar spot */
export function ChkForestZorgeVisual(_props: ChkForestZorgeVisualProps) {
  const groundTexture = useMemo(() => createForestGroundTexture(), []);
  const fireLightRef = useRef<THREE.PointLight>(null);
  const fireMeshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const flicker = 0.85 + Math.sin(tRef.current * 11) * 0.08 + Math.sin(tRef.current * 23) * 0.05;
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 3.2 * flicker;
    }
    if (fireMeshRef.current) {
      fireMeshRef.current.scale.y = 0.9 + Math.sin(tRef.current * 9) * 0.15;
    }
  });

  const treePlacements: Array<{
    pos: [number, number, number];
    seed: number;
    preset: string;
    scale: number;
    rot: number;
  }> = [
    { pos: [-10, 0, -8], seed: 101, preset: 'Oak Large', scale: 1.1, rot: 0.2 },
    { pos: [11, 0, -9], seed: 202, preset: 'Pine Small', scale: 1.0, rot: -0.4 },
    { pos: [-12, 0, 6], seed: 303, preset: 'Oak Medium', scale: 0.95, rot: 0.8 },
    { pos: [9, 0, 10], seed: 404, preset: 'Birch Medium', scale: 1.05, rot: -0.6 },
    { pos: [-6, 0, -13], seed: 505, preset: 'Pine Medium', scale: 1.15, rot: 0.1 },
    { pos: [13, 0, 2], seed: 606, preset: 'Oak Small', scale: 0.9, rot: 1.2 },
    { pos: [-14, 0, -2], seed: 707, preset: 'Pine Large', scale: 1.2, rot: 0.5 },
    { pos: [5, 0, -14], seed: 808, preset: 'Oak Medium', scale: 1.0, rot: -0.2 },
    { pos: [-8, 0, 12], seed: 909, preset: 'Birch Small', scale: 0.85, rot: 0.9 },
    { pos: [12, 0, -4], seed: 111, preset: 'Pine Medium', scale: 1.05, rot: -0.8 },
  ];

  return (
    <group>
      {/* Ground — mossy clearing */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={groundTexture}
          color="#2a4a22"
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* Dirt path from north edge */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, -14]} receiveShadow>
        <planeGeometry args={[2.2, 8]} />
        <meshStandardMaterial color="#4a3a28" roughness={1} />
      </mesh>

      {/* Forest perimeter — lightweight procedural trees (no ez-tree bundle) */}
      {treePlacements.map((t) => (
        <ForestTree
          key={t.seed}
          position={t.pos}
          preset={t.preset}
          scale={t.scale}
          rotation={t.rot}
        />
      ))}

      {/* Campfire ring */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={`log-${i}`} position={[Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55]} rotation={[0, a, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
              <meshStandardMaterial color="#3a2818" roughness={0.9} />
            </mesh>
          );
        })}
        <mesh ref={fireMeshRef} position={[0, 0.35, 0]}>
          <coneGeometry args={[0.25, 0.55, 8]} />
          <meshStandardMaterial color="#ff6622" emissive="#ff4400" emissiveIntensity={2.5} transparent opacity={0.85} />
        </mesh>
        <pointLight ref={fireLightRef} color="#ff8833" intensity={3.2} distance={14} position={[0, 1.2, 0]} castShadow />
      </group>

      {/* Log seats around fire */}
      {[
        [-2.2, 0, 0.8],
        [2.2, 0, 0.6],
        [0.5, 0, -2.0],
        [-0.8, 0, 2.1],
        [-1.8, 0, -1.5],
      ].map(([x, y, z], i) => (
        <mesh key={`seat-${i}`} position={[x, y + 0.12, z]} rotation={[0, i * 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.2, 0.24, 8]} />
          <meshStandardMaterial color="#4a3520" roughness={0.85} />
        </mesh>
      ))}

      {/* Port wine crate + bottles */}
      <group position={[1.8, 0, 1.6]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.7, 0.4, 0.5]} />
          <meshStandardMaterial color="#5a3020" roughness={0.8} />
        </mesh>
        <mesh position={[-0.15, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.28, 8]} />
          <meshStandardMaterial color="#2a0818" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0.12, 0.46, 0.08]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.24, 8]} />
          <meshStandardMaterial color="#1a0610" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* Guitar lean spot (Элис) */}
      <group position={[-1.6, 0, -1.2]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.55, 0]} rotation={[0.15, 0, -0.25]} castShadow>
          <boxGeometry args={[0.35, 0.55, 0.06]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
      </group>

      {/* Portable speaker (heavy music) */}
      <mesh position={[2.5, 0.25, -1.0]} castShadow>
        <boxGeometry args={[0.35, 0.5, 0.25]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Zorge street sign — rusted marker at path entrance */}
      <group position={[0, 0, -16]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[1.4, 0.35, 0.06]} />
          <meshStandardMaterial color="#555548" roughness={0.85} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.8, 6]} />
          <meshStandardMaterial color="#444440" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

type ForestTreePreset = 'Oak Large' | 'Oak Medium' | 'Oak Small' | 'Pine Large' | 'Pine Medium' | 'Pine Small' | 'Birch Large' | 'Birch Medium' | 'Birch Small' | string;

function ForestTree({
  position,
  preset,
  scale = 1,
  rotation = 0,
}: {
  position: [number, number, number];
  preset: ForestTreePreset;
  scale?: number;
  rotation?: number;
}) {
  const kind = preset.startsWith('Pine') ? 'pine' : preset.startsWith('Birch') ? 'birch' : 'oak';
  const size = preset.includes('Large') ? 'large' : preset.includes('Small') ? 'small' : 'medium';

  const trunkH = (kind === 'pine' ? 3.2 : 2.6) * scale * (size === 'large' ? 1.15 : size === 'small' ? 0.85 : 1);
  const trunkR = (kind === 'birch' ? 0.14 : 0.22) * scale;
  const trunkColor = kind === 'birch' ? '#c8c0b0' : '#3a2a1a';
  const leafColor = kind === 'pine' ? '#1a3a18' : kind === 'birch' ? '#4a6a38' : '#2a4a1a';
  const leafColor2 = kind === 'pine' ? '#234822' : '#3a5a2a';

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, trunkH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[trunkR * 0.7, trunkR, trunkH, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      {kind === 'pine' ? (
        <>
          <mesh position={[0, trunkH + 0.9 * scale, 0]} castShadow>
            <coneGeometry args={[1.3 * scale * (size === 'large' ? 1.2 : 1), 2.2 * scale, 8]} />
            <meshStandardMaterial color={leafColor} roughness={0.95} />
          </mesh>
          <mesh position={[0, trunkH + 1.9 * scale, 0]} castShadow>
            <coneGeometry args={[1.0 * scale, 1.8 * scale, 8]} />
            <meshStandardMaterial color={leafColor2} roughness={0.95} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, trunkH + 0.8 * scale, 0]} castShadow>
            <sphereGeometry args={[1.4 * scale * (size === 'large' ? 1.2 : size === 'small' ? 0.85 : 1), 8, 8]} />
            <meshStandardMaterial color={leafColor} roughness={0.95} />
          </mesh>
          <mesh position={[0.5 * scale, trunkH + 1.2 * scale, 0.3 * scale]} castShadow>
            <sphereGeometry args={[0.9 * scale, 8, 6]} />
            <meshStandardMaterial color={leafColor2} roughness={0.95} />
          </mesh>
        </>
      )}
    </group>
  );
}

function createForestGroundTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2a4a22';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const g = 30 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgb(${g - 10},${g + 20},${g - 15})`;
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}
