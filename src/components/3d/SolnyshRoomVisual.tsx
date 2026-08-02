
/* ─── Volodka RPG – Солныш & Лёня room procedural visual ─── */

import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { Desk, Chair, Lamp, Plant } from './lazyInteriorModels';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { registerModuleGeometries } from '@/engine/three/moduleGeometryRegistry';

interface SolnyshRoomVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Cozy room with carpets — designer + barista couple (8×8 m) */
/* ─── Shared geometries (module-level, reused across renders) ─── */

const geo_pln_1 = new THREE.PlaneGeometry(8, 8);
const geo_pln_2 = new THREE.PlaneGeometry(4.2, 3.2);
const geo_pln_3 = new THREE.PlaneGeometry(2, 1.6);
const geo_box_4 = new THREE.BoxGeometry(0.06, 1.1, 0.06);
const geo_box_5 = new THREE.BoxGeometry(0.7, 0.55, 0.03);
const geo_pln_6 = new THREE.PlaneGeometry(0.5, 0.4);
const geo_box_7 = new THREE.BoxGeometry(0.9, 0.9, 0.5);
const geo_cyl_8 = new THREE.CylinderGeometry(0.12, 0.14, 0.35, 8);
const geo_cyl_9 = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 6);
const geo_box_10 = new THREE.BoxGeometry(0.8, 1.5, 0.45);
const geo_box_11 = new THREE.BoxGeometry(0.72, 1.4, 0.02);
const geo_box_12 = new THREE.BoxGeometry(0.22, 0.16, 0.02);
const geo_pln_13 = new THREE.PlaneGeometry(0.18, 0.12);
const geo_box_14 = new THREE.BoxGeometry(0.32, 0.26, 0.02);
const geo_pln_15 = new THREE.PlaneGeometry(0.26, 0.2);
const geo_cyl_16 = new THREE.CylinderGeometry(0.28, 0.32, 0.1, 12);
const geo_pln_wall_wh = new THREE.PlaneGeometry(8, 3);
const geo_pln_wall_dh = new THREE.PlaneGeometry(8, 3);

registerModuleGeometries([geo_pln_1, geo_pln_2, geo_pln_3, geo_box_4, geo_box_5, geo_pln_6, geo_box_7, geo_cyl_8, geo_cyl_9, geo_box_10, geo_box_11, geo_box_12, geo_pln_13, geo_box_14, geo_pln_15, geo_cyl_16, geo_pln_wall_wh, geo_pln_wall_dh]);

export function SolnyshRoomVisual({ livePlayerPositionRef: _livePlayerPositionRef }: SolnyshRoomVisualProps) {
  const floorTexture = useCachedCanvasTexture('solnysh_room:floor', createWoodFloorTexture);
  const carpetTexture = useCachedCanvasTexture('solnysh_room:carpet', createCarpetTexture);
  const wallTexture = useCachedCanvasTexture('solnysh_room:wall', createWallTexture);

  const W = 8;
  const D = 8;
  const H = 3;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.002} geometry={geo_pln_1}>

        <meshStandardMaterial map={floorTexture} color="#7a6a58" roughness={0.88} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
      </mesh>

      {/* Layered carpets */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, 0]} geometry={geo_pln_2}>

        <meshBasicMaterial map={carpetTexture} color="#8a4050" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {/* Smaller carpet 2 raised to y=0.006 so it layers above carpet 1 (y=0.003) in their overlap region.
          Prior 0.0035 was only 0.0005m separation — below depth-buffer precision at >3m camera distance,
          causing shimmer. 0.003m gap is safe for all camera angles in this small room. */}
      <mesh rotation-x={-Math.PI / 2} position={[-2.2, 0.006, 1.8]} geometry={geo_pln_3}>

        <meshBasicMaterial map={carpetTexture} color="#6a3548" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>

      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={geo_pln_1}>

        <meshStandardMaterial color="#e8dcc8" roughness={0.95} />
      </mesh>

      {[
        [0, H / 2, -D / 2 + 0.01, 0],
        [0, H / 2, D / 2 - 0.01, Math.PI],
        [-W / 2 + 0.01, H / 2, 0, Math.PI / 2],
        [W / 2 - 0.01, H / 2, 0, -Math.PI / 2],
      ].map(([x, y, z, ry], i) => (
        <mesh key={i} position={[x, y, z]} rotation-y={ry} geometry={i < 2 ? geo_pln_wall_wh : geo_pln_wall_dh}>
          <meshStandardMaterial map={wallTexture} color="#d8c8b8" roughness={0.9} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      ))}

      <EnvironmentDetail minLod="standard" position={[2.2, 0, -2.0]}>
        {/* Easel + canvas — Солныш designer */}
        <group position={[2.2, 0, -2.0]}>
          <mesh position={[0, 0.55, 0]} castShadow geometry={geo_box_4}>

            <meshStandardMaterial color="#5a4030" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.9, 0.08]} rotation-x={-0.15} castShadow geometry={geo_box_5}>

            <meshStandardMaterial color="#f0e8d8" roughness={0.7} />
          </mesh>
          <mesh position={[0.08, 0.95, 0.1]} rotation-x={-0.15} geometry={geo_pln_6}>

            <meshStandardMaterial color="#88aacc" roughness={0.6} />
          </mesh>
        </group>

        {/* Coffee corner — Лёня barista */}
        <group position={[-2.4, 0, -2.2]}>
          <mesh position={[0, 0.45, 0]} castShadow geometry={geo_box_7}>

            <meshStandardMaterial color="#4a3828" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow geometry={geo_cyl_8}>

            <meshStandardMaterial color="#666" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0.25, 0.52, 0.1]} geometry={geo_cyl_9}>

            <meshStandardMaterial color="#eee" roughness={0.4} />
          </mesh>
        </group>

        <Desk position={[-1.5, 0, 0.5]} rotation={[0, 0.1, 0]} />
        <Chair position={[-1.5, 0, 1.2]} rotation={[0, Math.PI, 0]} />
        <Lamp position={[1.8, 0, 1.5]} />
        <Plant position={[2.8, 0, 2.5]} />

        {/* Wardrobe — wine hint location */}
        <group position={[-2.6, 0, 1.6]}>
          <mesh position={[0, 0.75, 0]} castShadow geometry={geo_box_10}>

            <meshStandardMaterial color="#5a4030" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.75, 0.24]} geometry={geo_box_11}>

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
              <mesh geometry={geo_box_12}>

                <meshStandardMaterial color="#3a3028" roughness={0.85} />
              </mesh>
              <mesh position={[0, 0, 0.012]} geometry={geo_pln_13}>

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
            <mesh geometry={geo_box_14}>

              <meshStandardMaterial color="#4a3828" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.012]} geometry={geo_pln_15}>

              <meshStandardMaterial color={color} roughness={0.65} />
            </mesh>
          </group>
        ))}

        {/* Dog bed */}
        <group position={[-0.8, 0, 0.2]}>
          <mesh position={[0, 0.06, 0]} castShadow geometry={geo_cyl_16}>

            <meshStandardMaterial color="#c87888" roughness={0.95} />
          </mesh>
        </group>
      </EnvironmentDetail>

      <pointLight position={[0, 2.2, 0]} color="#ffccaa" intensity={2.5} distance={9} />
      <pointLight position={[-2, 1.5, -2]} color="#ffaa66" intensity={0.8} distance={5} />
      <pointLight position={[0, 2.8, 0]} color="#ffddaa" intensity={0.6} distance={8} decay={2} />
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
