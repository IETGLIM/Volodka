
/* ─── Volodka RPG – Солныш & Лёня room procedural visual ─── */

import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { Desk, Chair, Lamp, Plant } from './lazyInteriorModels';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';

interface SolnyshRoomVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Cozy room with carpets — designer + barista couple (8×8 m) */
export function SolnyshRoomVisual({ livePlayerPositionRef: _livePlayerPositionRef }: SolnyshRoomVisualProps) {
  const floorTexture = useCachedCanvasTexture('solnysh_room:floor', createWoodFloorTexture);
  const carpetTexture = useCachedCanvasTexture('solnysh_room:carpet', createCarpetTexture);
  const wallTexture = useCachedCanvasTexture('solnysh_room:wall', createWallTexture);
  const { lod } = useEnvironmentLod();

  const W = 8;
  const D = 8;
  const H = 3;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.002}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floorTexture} color="#7a6a58" roughness={0.88} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
      </mesh>

      {/* Layered carpets */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, 0.008, 0]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial map={carpetTexture} color="#8a4050" roughness={0.96} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[-2.2, 0.01, 1.8]}>
        <planeGeometry args={[2.0, 1.6]} />
        <meshStandardMaterial map={carpetTexture} color="#6a3548" roughness={0.96} />
      </mesh>

      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.95} />
      </mesh>

      {[
        [0, H / 2, -D / 2 + 0.01, 0],
        [0, H / 2, D / 2 - 0.01, Math.PI],
        [-W / 2 + 0.01, H / 2, 0, Math.PI / 2],
        [W / 2 - 0.01, H / 2, 0, -Math.PI / 2],
      ].map(([x, y, z, ry], i) => (
        <mesh key={i} position={[x, y, z]} rotation-y={ry}>
          <planeGeometry args={[i < 2 ? W : D, H]} />
          <meshStandardMaterial map={wallTexture} color="#d8c8b8" roughness={0.9} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      ))}

      <EnvironmentDetail currentLod={lod} minLod="standard">
        {/* Easel + canvas — Солныш designer */}
        <group position={[2.2, 0, -2.0]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.06, 1.1, 0.06]} />
            <meshStandardMaterial color="#5a4030" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.9, 0.08]} rotation-x={-0.15} castShadow>
            <boxGeometry args={[0.7, 0.55, 0.03]} />
            <meshStandardMaterial color="#f0e8d8" roughness={0.7} />
          </mesh>
          <mesh position={[0.08, 0.95, 0.1]} rotation-x={-0.15}>
            <planeGeometry args={[0.5, 0.4]} />
            <meshStandardMaterial color="#88aacc" roughness={0.6} />
          </mesh>
        </group>

        {/* Coffee corner — Лёня barista */}
        <group position={[-2.4, 0, -2.2]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.9, 0.9, 0.5]} />
            <meshStandardMaterial color="#4a3828" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 0.35, 8]} />
            <meshStandardMaterial color="#666" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0.25, 0.52, 0.1]}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 6]} />
            <meshStandardMaterial color="#eee" roughness={0.4} />
          </mesh>
        </group>

        <Desk position={[-1.5, 0, 0.5]} rotation={[0, 0.1, 0]} />
        <Chair position={[-1.5, 0, 1.2]} rotation={[0, Math.PI, 0]} />
        <Lamp position={[1.8, 0, 1.5]} />
        <Plant position={[2.8, 0, 2.5]} />

        {/* Wardrobe — wine hint location */}
        <group position={[-2.6, 0, 1.6]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[0.8, 1.5, 0.45]} />
            <meshStandardMaterial color="#5a4030" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.75, 0.24]}>
            <boxGeometry args={[0.72, 1.4, 0.02]} />
            <meshStandardMaterial color="#4a3828" roughness={0.9} />
          </mesh>
        </group>

        {/* Gymnasium photos on shelf */}
        <group position={[0.2, 1.35, -3.92]}>
          {(
            [
              { x: -0.55, tint: '#c8d8e8' },
              { x: 0, tint: '#d8c8b0' },
              { x: 0.55, tint: '#b8c8d8' },
            ] as const
          ).map(({ x, tint }, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.22, 0.16, 0.02]} />
                <meshStandardMaterial color="#3a3028" roughness={0.85} />
              </mesh>
              <mesh position={[0, 0, 0.012]}>
                <planeGeometry args={[0.18, 0.12]} />
                <meshStandardMaterial color={tint} roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Watercolor frames — Алина's art on side wall */}
        {[
          { pos: [-3.92, 1.4, -1.2] as const, rot: Math.PI / 2, color: '#88aacc' },
          { pos: [-3.92, 1.15, 0.4] as const, rot: Math.PI / 2, color: '#ccaa88' },
          { pos: [3.92, 1.35, -0.6] as const, rot: -Math.PI / 2, color: '#aaccaa' },
        ].map(({ pos, rot, color }, i) => (
          <group key={i} position={pos} rotation-y={rot}>
            <mesh>
              <boxGeometry args={[0.32, 0.26, 0.02]} />
              <meshStandardMaterial color="#4a3828" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.012]}>
              <planeGeometry args={[0.26, 0.2]} />
              <meshStandardMaterial color={color} roughness={0.65} />
            </mesh>
          </group>
        ))}

        {/* Dog bed */}
        <group position={[-0.8, 0, 0.2]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.32, 0.1, 12]} />
            <meshStandardMaterial color="#c87888" roughness={0.95} />
          </mesh>
        </group>
      </EnvironmentDetail>

      <pointLight position={[0, 2.2, 0]} color="#ffccaa" intensity={1.8} distance={9} />
      <pointLight position={[-2, 1.5, -2]} color="#ffaa66" intensity={0.8} distance={5} />
    </group>
  );
}

function createWoodFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#7a6a58';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#6a5a48';
  for (let i = 0; i < size; i += 24) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createCarpetTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8a4050';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#6a2838';
  ctx.lineWidth = 2;
  for (let i = 0; i < size; i += 16) {
    ctx.strokeRect(i % 32 === 0 ? i : i - 8, i, 14, 14);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createWallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#d8c8b8';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? '#c8b8a8' : '#e8d8c8';
    ctx.fillRect(Math.random() * size, Math.random() * size, 30, 20);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.5);
  return tex;
}
