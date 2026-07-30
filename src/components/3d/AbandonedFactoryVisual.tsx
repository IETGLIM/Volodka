
/* ─── Volodka RPG – Abandoned Factory procedural 3D visual ─── */

import { useMemo, useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedSphereGeometry,
} from '@/engine/three/moduleGeometryRegistry';

import { getEnvironmentLodProfile } from '@/engine/lod/distanceLod';
import { EnvironmentDetail, PropDistanceGate } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createAbandonedFactoryIndustrialSkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import { getIndustrialDampFloorSettings } from '@/engine/graphics/wetStreetScenes';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { SceneBackdropShell } from './SceneBackdropShell';

interface AbandonedFactoryVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/** Gothic/Industrial abandoned factory (20×18m) */
export function AbandonedFactoryVisual({ livePlayerPositionRef }: AbandonedFactoryVisualProps) {
  const { preset } = useGraphicsQuality();
  const useAuthoredShell = !preset.visualLite;
  const useGltfDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  const hideProceduralClutter = useAuthoredShell && useGltfDressing;
  const floorTexture = useCachedCanvasTexture('abandoned_factory:floor', createFactoryFloorTexture);
  const wallTexture = useCachedCanvasTexture('abandoned_factory:wall', createFactoryWallTexture);
  const ceilingWashTexture = useCachedCanvasTexture(
    'abandoned_factory:industrial-ceiling',
    createAbandonedFactoryIndustrialSkyTexture,
  );
  const envProfile = useMemo(() => getEnvironmentLodProfile('abandoned_factory'), []);
  const damp = useMemo(() => getIndustrialDampFloorSettings('abandoned_factory'), []);

  const W = 20;
  const D = 18;
  const H = 6;

  const dripRef = useRef<THREE.Mesh>(null);

  const debrisData = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        position: [(i - 3) * 0.5, 0.35 + (i * 0.11) % 0.25, (i % 3) * 0.4] as [number, number, number],
        rotation: [(i * 0.37) % 0.3, (i * 1.17) % Math.PI, 0] as [number, number, number],
        size: [0.3 + (i * 0.13) % 0.4, 0.08, 0.2 + (i * 0.07) % 0.3] as [number, number, number],
      })),
    [],
  );

  useFrameTick('misc', ({ state }) => {
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
      <SceneBackdropShell sceneId="abandoned_factory" />

      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        <meshStandardMaterial
          map={floorTexture}
          color="#2a2520"
          roughness={damp?.roughness ?? 0.9}
          metalness={damp?.metalness ?? 0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Ceiling — rust industrial HDR wash ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)}>
        <meshStandardMaterial
          map={ceilingWashTexture}
          color="#2a2018"
          emissive="#3a2820"
          emissiveIntensity={0.18}
          roughness={0.95}
        />
      </mesh>

      {/* ── Walls ── */}
      <mesh position={[0, H / 2, -D / 2]} geometry={getSharedPlaneGeometry(W, H)}>
        <meshStandardMaterial map={wallTexture} color="#3a3530" roughness={0.9} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI} geometry={getSharedPlaneGeometry(W, H)}>
        <meshStandardMaterial map={wallTexture} color="#3a3530" roughness={0.9} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2} geometry={getSharedPlaneGeometry(D, H)}>
        <meshStandardMaterial map={wallTexture} color="#3a3530" roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} geometry={getSharedPlaneGeometry(D, H)}>
        <meshStandardMaterial map={wallTexture} color="#3a3530" roughness={0.9} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── RUSTED MACHINERY (distance + LOD gated) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail minLod="standard" position={[-7, 0, -5]}>
        <FactoryPropGate livePlayerPositionRef={livePlayerPositionRef} position={[-7, 0, -5]} maxDistance={envProfile.decorativeDistance}>
          {/* Large press machine (left) */}
          <mesh position={[0, 1.5, 0]} castShadow geometry={getSharedBoxGeometry(2.0, 3.0, 1.5)}>
            <meshStandardMaterial color="#8a4020" roughness={0.9} metalness={0.3} />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow geometry={getSharedBoxGeometry(1.2, 0.4, 0.8)}>
            <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 4.2, 0]} castShadow geometry={getSharedCylinderGeometry(0.1, 0.1, 1.5, 8)}>
            <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
          </mesh>
        </FactoryPropGate>
      </EnvironmentDetail>

      <EnvironmentDetail minLod="standard" position={[6, 0, -3]}>
        <FactoryPropGate livePlayerPositionRef={livePlayerPositionRef} position={[6, 0, -3]} maxDistance={envProfile.decorativeDistance}>
          <mesh position={[0, 0.8, 0]} castShadow geometry={getSharedBoxGeometry(1.2, 1.6, 1.0)}>
            <meshStandardMaterial color="#8a4020" roughness={0.85} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.3, 0.51]} geometry={getSharedPlaneGeometry(0.5, 0.4)}>
            <meshStandardMaterial color="#1a1a1a" emissive="#22aa44" emissiveIntensity={0.3} />
          </mesh>
        </FactoryPropGate>
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── BROKEN WINDOWS WITH LIGHT BEAMS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[W / 2 - 0.01, 4, -4]}>
        <mesh rotation-y={-Math.PI / 2} geometry={getSharedPlaneGeometry(2.5, 2.0)}>
          <meshStandardMaterial
            color="#1a1a10"
            emissive="#ffdd88"
            emissiveIntensity={0.4}
          />
        </mesh>
        {/* Broken glass shards */}
        <mesh rotation-y={-Math.PI / 2} position={[0.02, 0.5, -0.8]} geometry={getSharedPlaneGeometry(0.3, 0.6)}>
          <meshStandardMaterial color="#a0b0c0" transparent opacity={0.3} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[0.02, -0.3, 0.5]} geometry={getSharedPlaneGeometry(0.4, 0.5)}>
          <meshStandardMaterial color="#a0b0c0" transparent opacity={0.2} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      </group>

      <group position={[W / 2 - 0.01, 4, 3]}>
        <mesh rotation-y={-Math.PI / 2} geometry={getSharedPlaneGeometry(2.5, 2.0)}>
          <meshStandardMaterial
            color="#1a1a10"
            emissive="#ffdd88"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CONVEYOR BELTS (hidden when GLB shell + props own the floor) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {!hideProceduralClutter ? (
      <EnvironmentDetail minLod="standard" position={[0, 0, 2]}>
      <group position={[0, 0, 2]}>
        {/* Belt surface */}
        <mesh position={[0, 0.6, 0]} castShadow geometry={getSharedBoxGeometry(8, 0.05, 1.0)}>
          <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
        </mesh>
        {/* Belt supports */}
        {[-3.5, -1.5, 0.5, 2.5].map((x, i) => (
          <mesh key={i} position={[x, 0.3, 0]} castShadow geometry={getSharedBoxGeometry(0.1, 0.6, 0.8)}>
            <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
        {/* Rollers */}
        {[-3.0, -1.0, 1.0, 3.0].map((x, i) => (
          <mesh key={`r-${i}`} position={[x, 0.63, 0]} rotation={[0, 0, Math.PI / 2]} geometry={getSharedCylinderGeometry(0.06, 0.06, 0.9, 6)}>
            <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>
      </EnvironmentDetail>
      ) : null}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CHEMICAL VATS (procedural clutter — GLB dressing replaces) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {!hideProceduralClutter ? (
      <EnvironmentDetail minLod="full" position={[-4, 0, 4]}>
      <FactoryPropGate livePlayerPositionRef={livePlayerPositionRef} position={[-4, 0, 4]} maxDistance={envProfile.clutterDistance}>
        <ChemicalVat position={[-1, 0, 1]} color="#22aa44" />
        <ChemicalVat position={[1, 0, 1]} color="#22aa44" />
        <ChemicalVat position={[0, 0, -1]} color="#44aa22" />
      </FactoryPropGate>
      </EnvironmentDetail>
      ) : null}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CATWALK (elevated) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {!hideProceduralClutter ? (
      <EnvironmentDetail minLod="standard" position={[0, 3.5, -7]}>
      <group position={[0, 3.5, -7]}>
        {/* Walkway */}
        <mesh castShadow geometry={getSharedBoxGeometry(12, 0.05, 1.2)}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Railing posts */}
        {[-5.5, -3, -0.5, 2, 4.5].map((x, i) => (
          <mesh key={i} position={[x, 0.5, 0.55]} castShadow geometry={getSharedCylinderGeometry(0.02, 0.02, 1.0, 4)}>
            <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* Top rail */}
        <mesh position={[0, 1.0, 0.55]} castShadow geometry={getSharedBoxGeometry(12, 0.03, 0.03)}>
          <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      </EnvironmentDetail>
      ) : null}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── GRAFFITI WALLS ── */}
      {/* ═══════════════════════════════════════════════ */}
      {!hideProceduralClutter ? (
      <EnvironmentDetail minLod="full" position={[-7.5, 2.5, -2.5]}>
      <group position={[-W / 2 + 0.02, 2, 0]}>
        {/* Graffiti patch 1 */}
        <mesh rotation-y={Math.PI / 2} geometry={getSharedPlaneGeometry(2, 1.5)}>
          <meshStandardMaterial color="#1a1a1a" emissive="#ff2244" emissiveIntensity={0.15} />
        </mesh>
      </group>
      <group position={[-W / 2 + 0.02, 3, -5]}>
        <mesh rotation-y={Math.PI / 2} geometry={getSharedPlaneGeometry(1.5, 1.0)}>
          <meshStandardMaterial color="#1a1a1a" emissive="#4488ff" emissiveIntensity={0.12} />
        </mesh>
      </group>
      </EnvironmentDetail>
      ) : null}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── COLLAPSED CEILING SECTION ── */}
      {/* ═══════════════════════════════════════════════ */}
      {!hideProceduralClutter ? (
      <EnvironmentDetail minLod="full" position={[5, 0, -5]}>
      <FactoryPropGate livePlayerPositionRef={livePlayerPositionRef} position={[5, 0, -5]} maxDistance={envProfile.decorativeDistance}>
      <group position={[0, 0, 0]}>
        {/* Debris on floor */}
        {debrisData.map((debris, i) => (
          <mesh key={i} position={debris.position} rotation={debris.rotation} castShadow geometry={getSharedBoxGeometry(...debris.size)}>
            <meshStandardMaterial color="#3a3530" roughness={0.9} />
          </mesh>
        ))}
        {/* Twisted beam */}
        <mesh position={[0, 0.5, 0]} rotation={[0.2, 0.5, 0.3]} castShadow geometry={getSharedBoxGeometry(2.5, 0.15, 0.1)}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.6} />
        </mesh>
        {/* Opening to sky (bright patch on ceiling) */}
        <mesh position={[0, H - 0.02, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(3, 3)}>
          <meshStandardMaterial color="#0a0a10" emissive="#8a9ab0" emissiveIntensity={0.5} />
        </mesh>
      </group>
      </FactoryPropGate>
      </EnvironmentDetail>
      ) : null}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Flickering industrial lamp (back) */}
      <pointLight position={[0, 5.5, -6]} color="#ffcc88" intensity={3.5} distance={14} />

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
      <mesh position={[6, 4, 0]} rotation={[0, 0, Math.PI / 2]} geometry={getSharedCylinderGeometry(0.03, 0.03, 3, 6)}>
        <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Pipe joint */}
      <mesh position={[4.5, 4, 0]} geometry={getSharedCylinderGeometry(0.05, 0.05, 0.15, 6)}>
        <meshStandardMaterial color="#6a5a4a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Drip at pipe end */}
      <mesh ref={dripRef} position={[4.5, 3.9, 0.05]} geometry={getSharedSphereGeometry(0.02, 6, 6)}>
        <meshStandardMaterial color="#4a6a8a" transparent opacity={0.7} />
      </mesh>

      {/* ── Broken glass on floor ── */}
      {[
        [2, 0.01, 4], [2.3, 0.01, 4.2], [1.8, 0.01, 4.5], [2.5, 0.01, 3.8],
      ].map((pos, i) => (
        <mesh key={`glass-${i}`} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0.3 + i * 0.7]} geometry={getSharedPlaneGeometry(0.08, 0.05)}>
          <meshStandardMaterial color="#a0b8c0" transparent opacity={0.4} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
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
      <mesh position={[W / 2 - 0.02, 2.5, 5]} rotation-y={-Math.PI / 2} geometry={getSharedPlaneGeometry(1.8, 0.8)}>
        <meshStandardMaterial color="#1a1a1a" emissive="#44ff44" emissiveIntensity={0.1} roughness={0.95} />
      </mesh>

      {/* ── Oil puddle on floor — industrial damp sheen ── */}
      <mesh rotation-x={-Math.PI / 2} position={[-5, 0.008, 3]} geometry={getSharedCircleGeometry(0.6, 12)}>
        <meshStandardMaterial
          color="#0a0a05"
          metalness={damp?.oilMetalness ?? 0.4}
          roughness={damp?.oilRoughness ?? 0.3}
          transparent
          opacity={0.55}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[2.2, 0.007, -4]} geometry={getSharedCircleGeometry(0.35, 10)}>
        <meshStandardMaterial
          color="#080810"
          metalness={damp?.oilMetalness ?? 0.4}
          roughness={(damp?.oilRoughness ?? 0.3) + 0.05}
          transparent
          opacity={0.4}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
    </group>
  );
}

/** Chemical vat with glowing contents */
function FactoryPropGate({
  livePlayerPositionRef,
  position,
  maxDistance,
  children,
}: {
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
  position: [number, number, number];
  maxDistance: number;
  children: React.ReactNode;
}) {
  if (!livePlayerPositionRef) {
    return <group position={position}>{children}</group>;
  }
  return (
    <PropDistanceGate
      livePlayerPositionRef={livePlayerPositionRef}
      position={position}
      maxDistance={maxDistance}
    >
      {children}
    </PropDistanceGate>
  );
}

function ChemicalVat({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Vat body */}
      <mesh position={[0, 0.8, 0]} castShadow geometry={getSharedCylinderGeometry(0.5, 0.4, 1.6, 8)}>
        <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Chemical surface */}
      <mesh position={[0, 1.5, 0]} geometry={getSharedCylinderGeometry(0.45, 0.45, 0.05, 8)}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.7} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Pipes */}
      <mesh position={[0.5, 1.2, 0]} rotation={[0, 0, Math.PI / 2]} geometry={getSharedCylinderGeometry(0.04, 0.04, 0.6, 6)}>
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
