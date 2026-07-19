
/* ─── Volodka RPG – Zarema & Albert Room procedural 3D visual ─── */

import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { Desk, Chair, Laptop, Lamp, Radiator, Plant } from './lazyInteriorModels';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createZaremaAlbertWarmSkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import { registerModuleGeometries } from '@/engine/three/moduleGeometryRegistry';

interface ZaremaAlbertRoomVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Cozy apartment with DutySupport aesthetic (8×8m) */
/* ─── Shared geometries (module-level, reused across renders) ─── */

const geo_pln_1 = new THREE.PlaneGeometry(8, 8);
const geo_pln_2 = new THREE.PlaneGeometry(8, 3);
const geo_box_3 = new THREE.BoxGeometry(1.6, 0.35, 2.2);
const geo_box_4 = new THREE.BoxGeometry(1.5, 0.2, 2.1);
const geo_box_5 = new THREE.BoxGeometry(1.6, 0.8, 0.08);
const geo_box_6 = new THREE.BoxGeometry(0.45, 0.1, 0.3);
const geo_box_7 = new THREE.BoxGeometry(1.4, 0.06, 1.5);
const geo_box_8 = new THREE.BoxGeometry(1.2, 2, 0.6);
const geo_box_9 = new THREE.BoxGeometry(0.02, 1.9, 0.01);
const geo_box_10 = new THREE.BoxGeometry(0.03, 0.15, 0.03);
const geo_box_11 = new THREE.BoxGeometry(1.2, 0.04, 0.7);
const geo_box_12 = new THREE.BoxGeometry(0.04, 0.72, 0.04);
const geo_box_13 = new THREE.BoxGeometry(0.4, 0.02, 0.3);
const geo_box_14 = new THREE.BoxGeometry(0.4, 0.28, 0.01);
const geo_box_15 = new THREE.BoxGeometry(0.45, 0.04, 0.45);
const geo_box_16 = new THREE.BoxGeometry(0.45, 0.4, 0.04);
const geo_pln_17 = new THREE.PlaneGeometry(0.3, 0.4);
const geo_box_18 = new THREE.BoxGeometry(0.015, 0.42, 0.32);
const geo_pln_19 = new THREE.PlaneGeometry(0.25, 0.35);
const geo_box_20 = new THREE.BoxGeometry(0.015, 0.37, 0.27);
const geo_pln_21 = new THREE.PlaneGeometry(0.35, 0.25);
const geo_box_22 = new THREE.BoxGeometry(0.015, 0.27, 0.37);
const geo_pln_23 = new THREE.PlaneGeometry(3, 2.5);
const geo_pln_24 = new THREE.PlaneGeometry(1.8, 2);
const geo_cyl_25 = new THREE.CylinderGeometry(0.015, 0.015, 2.2, 6);
const geo_box_26 = new THREE.BoxGeometry(0.7, 1.6, 0.3);
const geo_box_27 = new THREE.BoxGeometry(0.68, 0.03, 0.28);
const geo_box_28 = new THREE.BoxGeometry(0.4, 0.18, 0.2);
const geo_cyl_29 = new THREE.CylinderGeometry(0.25, 0.25, 0.04, 8);
const geo_cyl_30 = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
const geo_cyl_31 = new THREE.CylinderGeometry(0.04, 0.03, 0.06, 8);
const geo_cyl_32 = new THREE.CylinderGeometry(0.06, 0.06, 0.01, 8);
const geo_pln_33 = new THREE.PlaneGeometry(1.2, 1.4);
const geo_box_34 = new THREE.BoxGeometry(0.05, 1.45, 1.25);
const geo_box_35 = new THREE.BoxGeometry(0.04, 0.03, 1.2);
const geo_box_36 = new THREE.BoxGeometry(0.03, 1.4, 0.03);
const geo_box_37 = new THREE.BoxGeometry(0.4, 0.6, 0.35);
const geo_box_38 = new THREE.BoxGeometry(0.2, 0.015, 0.15);
const geo_pln_39 = new THREE.PlaneGeometry(0.8, 1.2);
const geo_pln_40 = new THREE.PlaneGeometry(0.4, 0.3);
const geo_cyl_41 = new THREE.CylinderGeometry(0.12, 0.08, 0.3, 8);
const geo_cyl_42 = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6);
const geo_cyl_43 = new THREE.CylinderGeometry(0.04, 0.03, 0.08, 6);
const geo_cyl_44 = new THREE.CylinderGeometry(0.008, 0.008, 0.4, 4);

registerModuleGeometries([geo_pln_1, geo_pln_2, geo_box_3, geo_box_4, geo_box_5, geo_box_6, geo_box_7, geo_box_8, geo_box_9, geo_box_10, geo_box_11, geo_box_12, geo_box_13, geo_box_14, geo_box_15, geo_box_16, geo_pln_17, geo_box_18, geo_pln_19, geo_box_20, geo_pln_21, geo_box_22, geo_pln_23, geo_pln_24, geo_cyl_25, geo_box_26, geo_box_27, geo_box_28, geo_cyl_29, geo_cyl_30, geo_cyl_31, geo_cyl_32, geo_pln_33, geo_box_34, geo_box_35, geo_box_36, geo_box_37, geo_box_38, geo_pln_39, geo_pln_40, geo_cyl_41, geo_cyl_42, geo_cyl_43, geo_cyl_44]);

export function ZaremaAlbertRoomVisual({ livePlayerPositionRef: _livePlayerPositionRef }: ZaremaAlbertRoomVisualProps) {
  const floorTexture = useCachedCanvasTexture('zarema_albert_room:floor', createRoomFloorTexture);
  const wallTexture = useCachedCanvasTexture('zarema_albert_room:wall', createRoomWallTexture);
  const ceilingWashTexture = useCachedCanvasTexture(
    'zarema_albert_room:warm-ceiling',
    createZaremaAlbertWarmSkyTexture,
  );

  const W = 8;
  const D = 8;
  const H = 3;

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={geo_pln_1}>

        <meshStandardMaterial
          map={floorTexture}
          color="#8a7a60"
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Ceiling — warm domestic HDR wash ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={geo_pln_1}>
        <meshStandardMaterial
          map={ceilingWashTexture}
          color="#403020"
          emissive="#584838"
          emissiveIntensity={0.24}
          roughness={0.95}
        />
      </mesh>

      {/* ── Walls ── */}
      <mesh position={[0, H / 2, -D / 2]} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#c8b8a0" roughness={0.9} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#c8b8a0" roughness={0.9} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#c8b8a0" roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={geo_pln_2}>

        <meshStandardMaterial map={wallTexture} color="#c8b8a0" roughness={0.9} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── DOUBLE BED ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-2.5, 0, -2.5]}>
        {/* Bed frame */}
        <mesh position={[0, 0.25, 0]} castShadow geometry={geo_box_3}>

          <meshStandardMaterial color="#6a4a30" roughness={0.8} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, 0.5, 0]} castShadow geometry={geo_box_4}>

          <meshStandardMaterial color="#c8b0a0" roughness={0.95} />
        </mesh>
        {/* Headboard */}
        <mesh position={[0, 0.7, -1.05]} castShadow geometry={geo_box_5}>

          <meshStandardMaterial color="#5a3a20" roughness={0.8} />
        </mesh>
        {/* Pillows */}
        <mesh position={[-0.35, 0.65, -0.7]} geometry={geo_box_6}>

          <meshStandardMaterial color="#e8d8c8" roughness={0.95} />
        </mesh>
        <mesh position={[0.35, 0.65, -0.7]} geometry={geo_box_6}>

          <meshStandardMaterial color="#e8d8c8" roughness={0.95} />
        </mesh>
        {/* Blanket */}
        <mesh position={[0, 0.62, 0.2]} geometry={geo_box_7}>

          <meshStandardMaterial color="#6a4a5a" roughness={0.95} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WARDROBE ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-3.5, 0, 1.5]}>
        <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_8}>

          <meshStandardMaterial color="#6a4a30" roughness={0.8} />
        </mesh>
        {/* Door split line */}
        <mesh position={[0, 1.0, 0.31]} geometry={geo_box_9}>

          <meshStandardMaterial color="#5a3a20" />
        </mesh>
        {/* Handles */}
        <mesh position={[-0.12, 1.0, 0.32]} geometry={geo_box_10}>

          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.12, 1.0, 0.32]} geometry={geo_box_10}>

          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── DESK WITH LAPTOP ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[2.5, 0, -2.5]}>
        {/* Desk top */}
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow geometry={geo_box_11}>

          <meshStandardMaterial color="#7a5a38" roughness={0.7} />
        </mesh>
        {/* Legs */}
        {[[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.36, z]} geometry={geo_box_12}>

            <meshStandardMaterial color="#5a3a20" />
          </mesh>
        ))}
        {/* Laptop */}
        <mesh position={[0, 0.78, -0.05]} geometry={geo_box_13}>

          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        {/* Laptop screen */}
        <mesh position={[0, 1.0, -0.2]} rotation={[0.2, 0, 0]} geometry={geo_box_14}>

          <meshStandardMaterial color="#001122" emissive="#4488cc" emissiveIntensity={0.4} />
        </mesh>
        {/* Desk chair */}
        <group position={[0, 0, 0.6]}>
          <mesh position={[0, 0.4, 0]} castShadow geometry={geo_box_15}>

            <meshStandardMaterial color="#6a4a5a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.65, -0.2]} castShadow geometry={geo_box_16}>

            <meshStandardMaterial color="#6a4a5a" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── PHOTOS ON WALL ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-W / 2 + 0.02, 1.8, -1.5]}>
        <mesh rotation-y={Math.PI / 2} geometry={geo_pln_17}>

          <meshStandardMaterial color="#d8c8b0" roughness={0.5} />
        </mesh>
        {/* Frame */}
        <mesh rotation-y={Math.PI / 2} position={[0, 0, -0.005]} geometry={geo_box_18}>

          <meshStandardMaterial color="#5a3a20" roughness={0.7} />
        </mesh>
      </group>
      <group position={[-W / 2 + 0.02, 1.8, -0.5]}>
        <mesh rotation-y={Math.PI / 2} geometry={geo_pln_19}>

          <meshStandardMaterial color="#c8b8a0" roughness={0.5} />
        </mesh>
        <mesh rotation-y={Math.PI / 2} position={[0, 0, -0.005]} geometry={geo_box_20}>

          <meshStandardMaterial color="#5a3a20" roughness={0.7} />
        </mesh>
      </group>
      <group position={[-W / 2 + 0.02, 2.0, 0.8]}>
        <mesh rotation-y={Math.PI / 2} geometry={geo_pln_21}>

          <meshStandardMaterial color="#b8a890" roughness={0.5} />
        </mesh>
        <mesh rotation-y={Math.PI / 2} position={[0, 0, -0.005]} geometry={geo_box_22}>

          <meshStandardMaterial color="#5a3a20" roughness={0.7} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CARPET ── */}
      {/* ═══════════════════════════════════════════════ */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, 0.5]} geometry={geo_pln_23}>

        <meshBasicMaterial color="#6a4a5a" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CURTAINS (window wall) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[W / 2 - 0.01, 1.5, -1]}>
        {/* Curtain left */}
        <mesh rotation-y={-Math.PI / 2} geometry={geo_pln_24}>

          <meshStandardMaterial color="#8a6a5a" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        {/* Curtain rod */}
        <mesh position={[0, 1.05, 0]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_25}>

          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── BOOKSHELF ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[3.2, 0, 1.5]}>
        <mesh position={[0, 0.8, 0]} castShadow geometry={geo_box_26}>

          <meshStandardMaterial color="#6a4a30" roughness={0.8} />
        </mesh>
        {/* Shelf dividers */}
        {[0.4, 0.8, 1.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0.02]} geometry={geo_box_27}>

            <meshStandardMaterial color="#5a3a20" />
          </mesh>
        ))}
        {/* Books */}
        {[0.2, 0.6, 1.0, 1.4].map((y, i) => (
          <mesh key={`book-${i}`} position={[0, y, 0.01]} geometry={geo_box_28}>

            <meshStandardMaterial
              color={['#8b2020', '#204080', '#208020', '#cc8844'][i]}
              roughness={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── TEA CUPS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0.5, 0, 2.5]}>
        {/* Small side table */}
        <mesh position={[0, 0.4, 0]} castShadow geometry={geo_cyl_29}>

          <meshStandardMaterial color="#7a5a38" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]} geometry={geo_cyl_30}>

          <meshStandardMaterial color="#5a3a20" roughness={0.7} />
        </mesh>
        {/* Cup 1 */}
        <mesh position={[-0.08, 0.48, 0]} geometry={geo_cyl_31}>

          <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
        </mesh>
        {/* Cup 2 */}
        <mesh position={[0.08, 0.48, 0]} geometry={geo_cyl_31}>

          <meshStandardMaterial color="#d8c8b0" roughness={0.5} />
        </mesh>
        {/* Saucers */}
        <mesh position={[-0.08, 0.44, 0]} geometry={geo_cyl_32}>

          <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
        </mesh>
        <mesh position={[0.08, 0.44, 0]} geometry={geo_cyl_32}>

          <meshStandardMaterial color="#d8c8b0" roughness={0.5} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WINDOW (emissive warm glow) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[W / 2 - 0.01, 1.8, 0]}>
        <mesh rotation-y={-Math.PI / 2} geometry={geo_pln_33}>

          <meshStandardMaterial
            color="#0a0a10"
            emissive="#ffaa44"
            emissiveIntensity={1.0}
          />
        </mesh>
        {/* Window frame */}
        <mesh rotation-y={-Math.PI / 2} position={[0.01, 0, 0]} geometry={geo_box_34}>

          <meshStandardMaterial color="#5a3a20" />
        </mesh>
        {/* Cross bars */}
        <mesh rotation-y={-Math.PI / 2} position={[0.02, 0, 0]} geometry={geo_box_35}>

          <meshStandardMaterial color="#5a3a20" />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[0.02, 0, 0]} geometry={geo_box_36}>

          <meshStandardMaterial color="#5a3a20" />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Warm desk lamp */}
      <pointLight position={[2.5, 1.5, -2.5]} color="#cc8844" intensity={3.0} distance={7} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} />

      {/* Soft ceiling light */}
      <pointLight position={[0, 2.8, 0]} color="#ffeedd" intensity={2.5} distance={10} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} />

      {/* Window warm spill */}
      <pointLight position={[3.5, 1.8, 0]} color="#ffaa44" intensity={1.2} distance={6} />

      {/* Bedside warm glow */}
      <pointLight position={[-2.5, 1.0, -2.5]} color="#cc8844" intensity={1.2} distance={5} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Open book on nightstand ── */}
      <group position={[-3.5, 0, -2.0]}>
        {/* Nightstand */}
        <mesh position={[0, 0.3, 0]} castShadow geometry={geo_box_37}>

          <meshStandardMaterial color="#5a3a20" roughness={0.8} />
        </mesh>
        {/* Open book */}
        <mesh position={[0, 0.62, 0]} rotation={[0, 0.2, 0]} geometry={geo_box_38}>

          <meshStandardMaterial color="#c8b898" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Prayer mat in corner ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.8]} position={[-3.0, 0.003, 3.0]} geometry={geo_pln_39}>

        <meshBasicMaterial color="#2a5a3a" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {/* Mat pattern (small rectangle on mat). renderOrder=2 kept so pattern layers above prayer mat at equal biased depth via LEQUAL */}
      <mesh rotation={[-Math.PI / 2, 0, 0.8]} position={[-3.0, 0.003, 2.7]} renderOrder={2} geometry={geo_pln_40}>

        <meshBasicMaterial color="#3a6a4a" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>

      {/* ── Hookah/Shisha ── */}
      <group position={[1.5, 0, 2.5]}>
        {/* Base */}
        <mesh position={[0, 0.15, 0]} geometry={geo_cyl_41}>

          <meshStandardMaterial color="#8a4a6a" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Stem */}
        <mesh position={[0, 0.55, 0]} geometry={geo_cyl_42}>

          <meshStandardMaterial color="#8a7a50" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Bowl on top */}
        <mesh position={[0, 0.82, 0]} geometry={geo_cyl_43}>

          <meshStandardMaterial color="#6a4a30" roughness={0.8} />
        </mesh>
        {/* Hose */}
        <mesh position={[0.15, 0.45, 0]} rotation={[0, 0, 0.4]} geometry={geo_cyl_44}>

          <meshStandardMaterial color="#5a3a20" roughness={0.9} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERIOR MODELS (lazy chunk) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail minLod="standard" position={[2.5, 0, 1.5]}>

      {/* ── Second desk (Zarema's desk) with laptop ── */}
      <Desk position={[2.5, 0, 1.5]} color="#7a5a38" />
      <Laptop position={[2.5, 0.73, 1.45]} />

      {/* ── Second desk chair ── */}
      <Chair position={[2.5, 0, 2.1]} color="#6a4a5a" />

      {/* ── Desk lamp on Zarema's desk ── */}
      <Lamp position={[2.9, 0.74, 1.2]} scale={[0.7, 0.7, 0.7]} />

      {/* ── Radiator on left wall ── */}
      <Radiator position={[-W / 2 + 0.06, 0.3, 2.5]} rotation={[0, Math.PI / 2, 0]} color="#a8a8a8" />

      {/* ── Plant near window ── */}
      <Plant position={[3.5, 0, -3.0]} color="#2a6a20" scale={[1.1, 1.1, 1.1]} />
      </EnvironmentDetail>
    </group>
  );
}

function createRoomFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm wood base
  ctx.fillStyle = '#8a7a60';
  ctx.fillRect(0, 0, size, size);

  // Wood plank lines
  ctx.strokeStyle = '#7a6a50';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Grain
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 50; i++) {
    const y = Math.random() * size;
    ctx.strokeStyle = '#9a8a70';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

function createRoomWallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm cream wall
  ctx.fillStyle = '#c8b8a0';
  ctx.fillRect(0, 0, size, size);

  // Subtle wallpaper pattern
  ctx.globalAlpha = 0.04;
  for (let x = 0; x < size; x += 20) {
    for (let y = 0; y < size; y += 20) {
      if ((x + y) % 40 === 0) {
        ctx.fillStyle = '#d8c8b0';
        ctx.fillRect(x, y, 10, 10);
      }
    }
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  return tex;
}
