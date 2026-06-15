
/* ─── Volodka RPG – Cafe "Blue Pit" procedural 3D visual ─── */

import { useMemo, useRef, useEffect, type MutableRefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { getEnvironmentLodProfile } from '@/engine/lod/distanceLod';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail, SceneClutterGate } from './lod/PropDistanceGate';
import { FloorLamp, PastryCase, Window, Plant } from './lazyInteriorModels';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createCafeEveningNeonSkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import { useOwnedBufferGeometry } from '@/hooks/useOwnedBufferGeometry';
import {
  getSharedBoxGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';

interface CafeVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Blue Pit cafe – cozy interior with bar counter, tables, warm lighting */
export function CafeVisual({ livePlayerPositionRef }: CafeVisualProps) {
  const floorTexture = useCachedCanvasTexture('cafe_evening:floor', createCafeFloorTexture);
  const wallTexture = useCachedCanvasTexture('cafe_evening:wall', createCafeWallTexture);
  const ceilingGlowTexture = useCachedCanvasTexture(
    'cafe_evening:neon-ceiling',
    createCafeEveningNeonSkyTexture,
  );
  const { lod } = useEnvironmentLod();
  const envProfile = useMemo(() => getEnvironmentLodProfile('cafe_evening'), []);

  // ── Animated element refs ──
  const coffeeSteamRef = useRef<THREE.Points>(null);
  const coffeeSteamMaterialRef = useRef<THREE.PointsMaterial>(null);
  const coffeeSteamTimeRef = useRef(0);
  const shimmerRef = useRef<THREE.Mesh>(null);
  const shimmerMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const shimmerLayer2MaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const shimmerTimeRef = useRef(0);

  const W = 10;
  const D = 10;
  const H = 3.2;

  // ── Coffee machine steam particles ──
  const steamData = useMemo(() => {
    const count = 30;
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = -0.5 + (Math.random() - 0.5) * 0.1;
      pos[i3 + 1] = 1.4 + Math.random() * 0.6;
      pos[i3 + 2] = -3.9 + (Math.random() - 0.5) * 0.1;
      pha[i] = Math.random() * Math.PI * 2;
      vel[i] = 0.3 + Math.random() * 0.3;
    }
    return { positions: pos, phases: pha, velocities: vel };
  }, []);
  const steamVelocitiesRef = useRef(steamData.velocities);

  const steamGeometry = useOwnedBufferGeometry(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(steamData.positions.slice(), 3));
    return geo;
  }, [steamData.positions]);

  // ── Dispose owned materials on unmount (textures are module-cached) ──
  useEffect(() => {
    return () => {
      coffeeSteamMaterialRef.current?.dispose();
      shimmerMaterialRef.current?.dispose();
      shimmerLayer2MaterialRef.current?.dispose();
    };
  }, []);

  // ── Animations via useFrame ──
  useFrameTick('misc', ({ delta }) => {
    coffeeSteamTimeRef.current += delta;
    const t = coffeeSteamTimeRef.current;

    // Coffee machine steam particle update
    if (coffeeSteamRef.current) {
      const posAttr = coffeeSteamRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const count = 30;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const phase = steamData.phases[i];

        // Rise upward with drift
        posArray[i3 + 1] += (steamVelocitiesRef.current?.[i] ?? 0.3) * delta;
        posArray[i3] += Math.sin(t * 0.8 + phase) * 0.01 * delta;
        posArray[i3 + 2] += Math.cos(t * 0.6 + phase * 1.3) * 0.01 * delta;

        // Reset when too high
        if (posArray[i3 + 1] > 2.2) {
          posArray[i3] = -0.5 + (Math.random() - 0.5) * 0.1;
          posArray[i3 + 1] = 1.4 + Math.random() * 0.1;
          posArray[i3 + 2] = -3.9 + (Math.random() - 0.5) * 0.1;
          steamVelocitiesRef.current![i] = 0.3 + Math.random() * 0.3;
        }
      }
      posAttr.needsUpdate = true;
    }

    if (coffeeSteamMaterialRef.current) {
      coffeeSteamMaterialRef.current.opacity = 0.2 + Math.sin(t * 0.4) * 0.06;
    }

    // Warm air shimmer — oscillating distortion plane
    shimmerTimeRef.current += delta;
    if (shimmerMaterialRef.current) {
      const st = shimmerTimeRef.current;
      shimmerMaterialRef.current.opacity = 0.03 + Math.sin(st * 0.8) * 0.01;
    }
    if (shimmerRef.current) {
      const st = shimmerTimeRef.current;
      shimmerRef.current.position.y = 1.2 + Math.sin(st * 0.5) * 0.05;
      shimmerRef.current.rotation.x = Math.sin(st * 0.3) * 0.02;
    }
  });

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        <meshStandardMaterial map={floorTexture} color="#5a4a3a" roughness={0.85} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      {/* ── Ceiling — procedural blue-neon HDR wash ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)}>
        <meshStandardMaterial
          map={ceilingGlowTexture}
          color="#3a3038"
          emissive="#1a2850"
          emissiveIntensity={0.35}
          roughness={0.95}
        />
      </mesh>

      {/* ── Walls ── */}
      <mesh position={[0, H / 2, -D / 2]} geometry={getSharedPlaneGeometry(W, H)}>
        <meshStandardMaterial map={wallTexture} color="#4a3a30" roughness={0.9} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI} geometry={getSharedPlaneGeometry(W, H)}>
        <meshStandardMaterial map={wallTexture} color="#4a3a30" roughness={0.9} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2} geometry={getSharedPlaneGeometry(D, H)}>
        <meshStandardMaterial map={wallTexture} color="#4a3a30" roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={getSharedPlaneGeometry(D, H)}>
        <meshStandardMaterial map={wallTexture} color="#4a3a30" roughness={0.9} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── BAR COUNTER (back wall) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 0, -4.0]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow geometry={getSharedBoxGeometry(5.0, 1.1, 0.8)}>
          <meshStandardMaterial color="#4a3020" roughness={0.7} />
        </mesh>
        {/* Counter top */}
        <mesh position={[0, 1.11, 0]} geometry={getSharedBoxGeometry(5.1, 0.04, 0.85)}>
          <meshStandardMaterial color="#5a4030" metalness={0.1} roughness={0.4} />
        </mesh>
        {/* Shelf behind counter */}
        <mesh position={[0, 1.8, -0.3]} castShadow geometry={getSharedBoxGeometry(4.0, 0.04, 0.4)}>
          <meshStandardMaterial color="#3a2518" roughness={0.7} />
        </mesh>
        {/* Bottles on shelf */}
        {[-1.5, -0.8, 0, 0.7, 1.4].map((x, i) => (
          <mesh key={i} position={[x, 2.05, -0.3]} geometry={getSharedBoxGeometry(0.08, 0.4, 0.08)}>
            <meshStandardMaterial
              color={['#1a4a1a', '#4a1a1a', '#1a1a4a', '#4a4a1a', '#1a4a4a'][i]}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* ── Neon Sign behind bar ── */}
      <group position={[0, 2.5, -4.8]}>
        <mesh geometry={getSharedBoxGeometry(3.0, 0.4, 0.05)}>
          <meshStandardMaterial
            color="#001133"
            emissive="#1a4aff"
            emissiveIntensity={3.0}
            toneMapped={false}
          />
        </mesh>
        <pointLight position={[0, -0.5, 0.5]} color="#1a4aff" intensity={2.0} distance={6} />
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── TABLES AND CHAIRS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Table 1 - center-left (Albert's corner) */}
      <CafeTable position={[-3.0, 0, -2.0]} />
      {/* Table 2 - center-right */}
      <CafeTable position={[3.0, 0, 0]} />
      {/* Table 3 - near entrance */}
      <CafeTable position={[0, 0, 2.5]} />
      {/* Table 4 - left side */}
      <CafeTable position={[-3.0, 0, 1.5]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WARM LIGHTING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Over bar */}
      <pointLight position={[0, 2.8, -3.5]} color="#ffcc80" intensity={4.5} distance={10} castShadow shadow-mapSize-width={256} />

      {/* Over Albert's table */}
      <pointLight position={[-3.0, 2.5, -2.0]} color="#ffbb70" intensity={3.0} distance={7} castShadow shadow-mapSize-width={256} />

      {/* Center */}
      <pointLight position={[0, 2.8, 0]} color="#ffcc80" intensity={3.5} distance={10} />

      {/* Near entrance */}
      <pointLight position={[0, 2.5, 3.5]} color="#ffbb70" intensity={2.5} distance={7} />

      {/* Right side */}
      <pointLight position={[3.0, 2.5, 0]} color="#ffcc80" intensity={2.5} distance={7} />

      {/* Neon spill on ceiling */}
      <pointLight position={[0, 2.9, -4.5]} color="#1a4aff" intensity={1.5} distance={7} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Coffee cups on Albert's table ── */}
      <mesh position={[-3.2, 0.74, -2.0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.08, 8]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
      </mesh>
      <mesh position={[-2.8, 0.74, -1.8]}>
        <cylinderGeometry args={[0.03, 0.025, 0.07, 8]} />
        <meshStandardMaterial color="#c8b8a0" roughness={0.5} />
      </mesh>

      {/* ── Coffee cups on center-right table ── */}
      <mesh position={[2.9, 0.74, 0.1]}>
        <cylinderGeometry args={[0.032, 0.028, 0.07, 8]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
      </mesh>
      <mesh position={[3.15, 0.74, -0.1]}>
        <cylinderGeometry args={[0.035, 0.03, 0.08, 8]} />
        <meshStandardMaterial color="#f0e8e0" roughness={0.5} />
      </mesh>

      {/* ── Coffee cup on table near entrance ── */}
      <mesh position={[-0.15, 0.74, 2.4]}>
        <cylinderGeometry args={[0.03, 0.025, 0.06, 8]} />
        <meshStandardMaterial color="#e0d8d0" roughness={0.5} />
      </mesh>

      {/* ── Espresso machine on counter ── */}
      <group position={[-0.5, 1.13, -3.9]}>
        {/* Machine body */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.25]} />
          <meshStandardMaterial color="#2a2a2e" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Top dome */}
        <mesh position={[0, 0.32, 0]}>
          <sphereGeometry args={[0.12, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#333" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Portafilter spout */}
        <mesh position={[0, 0.08, 0.14]}>
          <boxGeometry args={[0.08, 0.02, 0.04]} />
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Drip tray */}
        <mesh position={[0, 0.01, 0.14]}>
          <boxGeometry args={[0.15, 0.01, 0.08]} />
          <meshStandardMaterial color="#444" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Cup under spout */}
        <mesh position={[0, 0.02, 0.14]}>
          <cylinderGeometry args={[0.025, 0.02, 0.04, 6]} />
          <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
        </mesh>
        {/* Power indicator light */}
        <mesh position={[0.12, 0.2, 0.13]}>
          <sphereGeometry args={[0.008, 4, 4]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ── Menu board on back wall ── */}
      <group position={[2.5, 2.2, -4.85]}>
        {/* Board background */}
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.03]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Lighter text area */}
        <mesh position={[0, 0, 0.016]}>
          <boxGeometry args={[1.05, 0.65, 0.002]} />
          <meshStandardMaterial color="#2a2a1a" emissive="#334422" emissiveIntensity={0.15} roughness={0.95} />
        </mesh>
        {/* Menu lines (text representation) */}
        {[-0.15, 0.0, 0.15, 0.25].map((y, i) => (
          <mesh key={`menu-${i}`} position={[0, y, 0.02]}>
            <boxGeometry args={[0.7 - i * 0.1, 0.015, 0.001]} />
            <meshStandardMaterial color="#887744" emissive="#887744" emissiveIntensity={0.3} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ── Neon sign on left wall (in addition to the one behind bar) ── */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
        <SceneClutterGate
          livePlayerPositionRef={livePlayerPositionRef}
          position={[-4.85, 2.3, -1.0]}
          maxDistance={envProfile.decorativeDistance}
        >
          <group position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Neon tube shape — horizontal bar */}
        <mesh>
          <boxGeometry args={[1.5, 0.08, 0.05]} />
          <meshStandardMaterial
            color="#ff2200"
            emissive="#ff4400"
            emissiveIntensity={3.0}
            roughness={0.3}
          />
        </mesh>
        {/* Neon glow */}
        <pointLight position={[0, -0.3, 0.5]} color="#ff4400" intensity={1.2} distance={4} />
          </group>
        </SceneClutterGate>
      </EnvironmentDetail>

      {/* ── Window on right wall showing blue/night light ── */}
      <group position={[W / 2 - 0.01, 1.8, -2.0]}>
        {/* Window pane */}
        <mesh rotation-y={-Math.PI / 2}>
          <planeGeometry args={[1.5, 1.2]} />
          <meshStandardMaterial
            color="#0a0a20"
            emissive="#1a2a55"
            emissiveIntensity={2.0}
          />
        </mesh>
        {/* Night light spill */}
        <pointLight position={[0.3, 0, 0.8]} color="#1a2a55" intensity={1.2} distance={5} />
      </group>

      {/* ── Napkin dispenser on counter ── */}
      <mesh position={[1.5, 1.2, -4.0]}>
        <boxGeometry args={[0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#cc3333" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* ── Newspaper on table near entrance ── */}
      <mesh position={[0.1, 0.73, 2.5]} rotation={[0, 0.3, 0]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="#c8c0a0" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Crumbs on table surface (center-right) ── */}
      {[[2.9, 0.725, 0.1], [3.1, 0.725, -0.05], [3.0, 0.725, 0.15]].map((pos, i) => (
        <mesh key={`crumb-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.008, 4, 4]} />
          <meshStandardMaterial color="#8a7040" roughness={0.95} />
        </mesh>
      ))}

      {/* ── Tip jar on counter ── */}
      <group position={[-1.5, 1.15, -4.0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 8]} />
          <meshStandardMaterial color="#d0c8b0" transparent opacity={0.6} roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Coins visible */}
        <mesh position={[0, -0.03, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
          <meshStandardMaterial color="#c8a830" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANIMATED STEAM & HEAT EFFECTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Steam from coffee machine (animated particles) ── */}
      <points ref={coffeeSteamRef} geometry={steamGeometry}>
        <pointsMaterial
          ref={coffeeSteamMaterialRef}
          color="#ffddbb"
          size={0.035}
          transparent
          opacity={0.25}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ── Warm air shimmer near kitchen area ── */}
      <mesh ref={shimmerRef} position={[-0.5, 1.2, -4.3]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[1.5, 1.0]} />
        <meshBasicMaterial
          ref={shimmerMaterialRef}
          color="#ffcc88"
          transparent
          opacity={0.03}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Additional shimmer layer (double plane for depth) ── */}
      <mesh position={[-0.5, 1.5, -4.5]} rotation={[0.05, 0.1, 0]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshBasicMaterial
          ref={shimmerLayer2MaterialRef}
          color="#ffaa66"
          transparent
          opacity={0.02}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERIOR MODELS (from InteriorModels.tsx) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Floor lamps in corners ── */}
      <FloorLamp position={[-4.2, 0, 3.5]} />
      <FloorLamp position={[4.2, 0, 3.5]} />

      {/* ── Pastry display case near bar ── */}
      <PastryCase position={[2.0, 1.13, -4.0]} />

      {/* ── Window on left wall ── */}
      <Window position={[-W / 2 + 0.01, 1.8, -2.0]} rotation={[0, Math.PI / 2, 0]} color="#2a55bb" />

      {/* ── Potted plants in corners ── */}
      <Plant position={[-4.2, 0, -4.0]} color="#2a6a20" scale={[1.3, 1.3, 1.3]} />
      <Plant position={[4.2, 0, -4.0]} color="#308028" scale={[1.1, 1.1, 1.1]} />
    </group>
  );
}

/** Reusable cafe table with two chairs */
function CafeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <meshStandardMaterial color="#5a4030" roughness={0.6} />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.06, 0.7, 0.06]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      {/* Chair 1 */}
      <group position={[-0.6, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.4, 0.04, 0.4]} />
          <meshStandardMaterial color="#4a3525" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.7, -0.18]} castShadow>
          <boxGeometry args={[0.4, 0.5, 0.04]} />
          <meshStandardMaterial color="#4a3525" roughness={0.8} />
        </mesh>
      </group>
      {/* Chair 2 */}
      <group position={[0.6, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.4, 0.04, 0.4]} />
          <meshStandardMaterial color="#4a3525" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.7, 0.18]} castShadow>
          <boxGeometry args={[0.4, 0.5, 0.04]} />
          <meshStandardMaterial color="#4a3525" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function createCafeFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(0, 0, size, size);

  // Dark wood planks
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 28) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  return tex;
}

function createCafeWallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a3a30';
  ctx.fillRect(0, 0, size, size);

  // Brick-like pattern
  ctx.strokeStyle = '#3a2a20';
  ctx.lineWidth = 1;
  let offset = 0;
  for (let y = 0; y < size; y += 20) {
    for (let x = offset; x < size; x += 50) {
      ctx.strokeRect(x, y, 48, 18);
    }
    offset = offset === 0 ? 25 : 0;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}
