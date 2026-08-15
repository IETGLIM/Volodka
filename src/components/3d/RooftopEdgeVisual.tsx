
/* ─── Volodka RPG – Rooftop Edge procedural 3D visual ─── */

import { useMemo, useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { BackSide, CanvasTexture, Mesh, Points, RepeatWrapping, Vector3 } from 'three';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedConeGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';

import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { useOwnedBufferGeometry } from '@/hooks/useOwnedBufferGeometry';
import { seededRand } from '@/shared/utils/seededRand';
import {
  createRooftopHorizonStarGeometry,
  createRooftopSunsetGalaxySkyTexture,
} from '@/engine/graphics/proceduralSkyTextures';
import { useGameStore } from '@/store/gameStore';
import { WetStreetGround } from './WetStreetGround';
import {
  allowsSelectiveMeshPhysicalWet,
  getWetGlassPhysicalParams,
  getWetPuddlePhysicalParams,
} from '@/engine/graphics/wetStreetScenes';
import { useIsMobileVisual } from '@/hooks/use-mobile';

interface RooftopEdgeVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<Vector3>;
}

/** Distant skyline buildings (static layout) */
const SKYLINE_BUILDINGS = [
  { pos: [-20, 0, -30] as [number, number, number], w: 5, h: 20, d: 5 },
  { pos: [-12, 0, -35] as [number, number, number], w: 8, h: 30, d: 6 },
  { pos: [-3, 0, -32] as [number, number, number], w: 6, h: 15, d: 5 },
  { pos: [5, 0, -28] as [number, number, number], w: 7, h: 25, d: 6 },
  { pos: [15, 0, -33] as [number, number, number], w: 10, h: 35, d: 8 },
  { pos: [22, 0, -30] as [number, number, number], w: 5, h: 18, d: 5 },
  { pos: [-25, 0, -25] as [number, number, number], w: 6, h: 22, d: 6 },
  { pos: [28, 0, -26] as [number, number, number], w: 8, h: 28, d: 7 },
];

/** Noir/CyberPunk2077 rooftop (10×8m) */
export function RooftopEdgeVisual({ livePlayerPositionRef: _livePlayerPositionRef }: RooftopEdgeVisualProps) {
  const floorTexture = useCachedCanvasTexture('rooftop_edge:floor', createRooftopFloorTexture);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const { selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const usePhysicalWet =
    allowsSelectiveMeshPhysicalWet('rooftop_edge', selectedPreset, { coarsePointer })
    && rainIntensity > 0.08;
  const puddleParams = useMemo(
    () => getWetPuddlePhysicalParams(rainIntensity),
    [rainIntensity],
  );
  const wetSkylight = useMemo(() => getWetGlassPhysicalParams('rooftopSkylightGlass'), []);

  const W = 10;
  const D = 8;

  const shirtRef = useRef<Mesh>(null);

  // Deterministic lit-window layout — Math.random() in render made windows
  // jump to new positions on every re-render
  const skylineWindows = useMemo(
    () =>
      SKYLINE_BUILDINGS.map((b, i) =>
        Array.from({ length: 3 + (i % 4) }, (_, j) => ({
          x: (seededRand(i * 97 + j * 13 + 1) - 0.5) * (b.w - 0.5),
          y: seededRand(i * 53 + j * 29 + 2) * (b.h - 2) + 1,
        }))
      ),
    []
  );

  useFrameTick('misc', ({ state }) => {
    if (shirtRef.current) {
      // Swaying shirt on clothesline
      const t = state.clock.elapsedTime;
      shirtRef.current.rotation.z = Math.sin(t * 1.5) * 0.08;
      shirtRef.current.rotation.x = Math.sin(t * 1.2) * 0.03;
    }
  });

  return (
    <group>
      {/* ── Sunset gradient sky dome (scene skybox is disabled, fog-exempt) ── */}
      <SunsetSkyDome />

      {/* Wet apron under tar deck — planar reflector when raining */}
      <WetStreetGround
        sceneId="rooftop_edge"
        rainIntensity={rainIntensity}
        size={Math.max(W, D) + 6}
        groundColor="#2a2830"
      />

      {/* ── Rooftop surface ── */}
      {/* WS21-C: PBR upgrade — wet rooftop after rain with clearcoat + ior */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        <meshPhysicalMaterial
          map={floorTexture}
          color="#3a3a3a"
          roughness={Math.max(0.35, 0.85 - rainIntensity * 0.4)}
          metalness={0.05 + rainIntensity * 0.2}
          clearcoat={0.7}
          clearcoatRoughness={0.15}
          ior={1.5}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Rain puddles on the tar surface ── */}
      <EnvironmentDetail minLod="full" position={[-2.2, 0.02, 0.8]}>
        <mesh rotation-x={-Math.PI / 2} position={[-2.2, 0.02, 0.8]} geometry={getSharedCircleGeometry(0.55, 12)}>
          {usePhysicalWet ? (
            <meshPhysicalMaterial
              color="#101622"
              metalness={puddleParams.metalness}
              roughness={puddleParams.roughness}
              clearcoat={puddleParams.clearcoat}
              clearcoatRoughness={puddleParams.clearcoatRoughness}
              transparent
              opacity={puddleParams.opacity}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          ) : (
            <meshStandardMaterial
              color="#101622"
              metalness={0.85}
              roughness={0.08}
              transparent
              opacity={0.55}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          )}
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[1.4, 0.02, 1.9]} geometry={getSharedCircleGeometry(0.35, 12)}>
          {usePhysicalWet ? (
            <meshPhysicalMaterial
              color="#101622"
              metalness={puddleParams.metalness * 0.95}
              roughness={puddleParams.roughness + 0.02}
              clearcoat={puddleParams.clearcoat}
              clearcoatRoughness={puddleParams.clearcoatRoughness}
              transparent
              opacity={Math.min(0.7, puddleParams.opacity * 0.9)}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          ) : (
            <meshStandardMaterial
              color="#101622"
              metalness={0.8}
              roughness={0.1}
              transparent
              opacity={0.45}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          )}
        </mesh>
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LOW PARAPET WALLS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Front parapet (the edge) */}
      <mesh position={[0, 0.5, D / 2]} castShadow geometry={getSharedBoxGeometry(W, 1.0, 0.2)}>
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>

      {/* Left parapet */}
      <mesh position={[-W / 2, 0.5, 0]} castShadow geometry={getSharedBoxGeometry(0.2, 1.0, D)}>
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>

      {/* Right parapet */}
      <mesh position={[W / 2, 0.5, 0]} castShadow geometry={getSharedBoxGeometry(0.2, 1.0, D)}>
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>

      {/* Pipe railings on open drop edges (visual-only; physics boundary unchanged) */}
      <RooftopEdgeRailings w={W} d={D} />

      {/* Back wall (building wall) */}
      <mesh position={[0, 2.5, -D / 2]} castShadow geometry={getSharedBoxGeometry(W, 5, 0.3)}>
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── HVAC UNITS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-3.5, 0, -2.5]}>
        <mesh position={[0, 0.6, 0]} castShadow geometry={getSharedBoxGeometry(1.2, 1.2, 0.8)}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Vent grille / wet gauge glass */}
        <mesh position={[0, 0.8, 0.41]} geometry={getSharedPlaneGeometry(0.8, 0.5)}>
          {usePhysicalWet ? (
            <meshPhysicalMaterial
              color="#1a222c"
              roughness={wetSkylight.roughness}
              metalness={wetSkylight.metalness}
              transmission={wetSkylight.transmission}
              thickness={wetSkylight.thickness}
              clearcoat={wetSkylight.clearcoat}
              clearcoatRoughness={wetSkylight.clearcoatRoughness}
              transparent
              opacity={wetSkylight.opacity}
            />
          ) : (
            <meshStandardMaterial color="#3a3a3a" metalness={0.3} roughness={0.5} />
          )}
        </mesh>
        {/* Pipes */}
        <mesh position={[-0.5, 0.3, -0.3]} castShadow geometry={getSharedCylinderGeometry(0.04, 0.04, 0.6, 6)}>
          <meshStandardMaterial color="#6a5a4a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      <group position={[3.0, 0, -2.0]}>
        <mesh position={[0, 0.5, 0]} castShadow geometry={getSharedBoxGeometry(0.8, 1.0, 0.6)}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANTENNA ARRAY — moved to FOREGROUND layer ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CITY SKYLINE (distant box geometry) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {SKYLINE_BUILDINGS.map((b, i) => (
        <group key={i} position={b.pos}>
          <mesh position={[0, b.h / 2, 0]} geometry={getSharedBoxGeometry(b.w, b.h, b.d)}>
            <meshStandardMaterial color="#0a0a15" roughness={0.95} />
          </mesh>
          {/* Lit windows (deterministic, seeded) */}
          {skylineWindows[i].map((win, j) => (
            <mesh key={j} position={[win.x, win.y, b.d / 2 + 0.01]} geometry={getSharedPlaneGeometry(0.4, 0.3)}>
              <meshStandardMaterial
                color="#000000"
                emissive="#ffaa44"
                emissiveIntensity={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── NEON BILLBOARDS (distant) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[15, 18, -30]}>
        <mesh geometry={getSharedBoxGeometry(4, 2, 0.1)}>
          <meshStandardMaterial color="#001122" emissive="#ff44aa" emissiveIntensity={1.0} />
        </mesh>
        <pointLight position={[0, -1, 1]} color="#ff44aa" intensity={1.5} distance={8} />
      </group>

      <group position={[-15, 12, -32]}>
        <mesh geometry={getSharedBoxGeometry(3, 1.5, 0.1)}>
          <meshStandardMaterial color="#002200" emissive="#44ffaa" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WATER TOWER ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[4, 0, -3]}>
        {/* Legs */}
        {[-0.4, 0.4].map((x, i) => (
          [-0.4, 0.4].map((z, j) => (
            <mesh key={`${i}-${j}`} position={[x, 1, z]} geometry={getSharedCylinderGeometry(0.04, 0.06, 2, 6)}>
              <meshStandardMaterial color="#5a4a3a" metalness={0.5} roughness={0.5} />
            </mesh>
          ))
        ))}
        {/* Tank */}
        <mesh position={[0, 2.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.6, 0.5, 1.0, 8)}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Tank top */}
        <mesh position={[0, 3.05, 0]} geometry={getSharedConeGeometry(0.65, 0.3, 8)}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.3} roughness={0.6} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ROOFTOP DOOR ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[2, 0, -D / 2 + 0.15]}>
        {/* Door frame */}
        <mesh position={[0, 1.1, 0]} castShadow geometry={getSharedBoxGeometry(0.9, 2.2, 0.1)}>
          <meshStandardMaterial color="#3a2a20" roughness={0.8} />
        </mesh>
        {/* Door */}
        <mesh position={[0, 1.1, 0.06]} geometry={getSharedBoxGeometry(0.8, 2.1, 0.05)}>
          <meshStandardMaterial color="#2a1a10" roughness={0.85} />
        </mesh>
        {/* Stairwell door pane — selective wet glass */}
        <mesh position={[0, 1.55, 0.1]} geometry={getSharedPlaneGeometry(0.42, 0.55)}>
          {usePhysicalWet ? (
            <meshPhysicalMaterial
              color="#15202a"
              roughness={wetSkylight.roughness}
              metalness={wetSkylight.metalness}
              transmission={wetSkylight.transmission}
              thickness={wetSkylight.thickness}
              clearcoat={wetSkylight.clearcoat}
              clearcoatRoughness={wetSkylight.clearcoatRoughness}
              transparent
              opacity={Math.min(0.7, wetSkylight.opacity + 0.1)}
            />
          ) : (
            <meshStandardMaterial color="#1a2830" metalness={0.2} roughness={0.35} transparent opacity={0.55} />
          )}
        </mesh>
        {/* Handle */}
        <mesh position={[0.3, 1.0, 0.1]} geometry={getSharedBoxGeometry(0.04, 0.12, 0.04)}>
          <meshStandardMaterial color="#8a7a50" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Neon sign glow */}
      <pointLight position={[15, 18, -28]} color="#ff44aa" intensity={3.5} distance={25} />

      {/* Warm sunset glow */}
      {/* LIGHT-4: Warm sunset glow — no castShadow to avoid a second shadow map pass. */}
      <pointLight position={[-5, 3, 6]} color="#cc6622" intensity={3.5} distance={18} />

      {/* Antenna red light */}
      <pointLight position={[-1.5, 6, -3.5]} color="#ff0000" intensity={1.0} distance={5} />

      {/* City ambient */}
      <pointLight position={[0, 0.5, 0]} color="#2a2a50" intensity={0.8} distance={12} />

      {/* Moonlight from above */}
      <pointLight position={[0, 15, 0]} color="#8a9ab0" intensity={1.2} distance={35} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail minLod="standard" position={[0, 0, 2]}>

      {/* ── Pigeons on parapet ledge — moved to FOREGROUND layer ── */}

      {/* ── Satellite dish — moved to FOREGROUND layer ── */}

      {/* ── Clothesline with one shirt ── */}
      <group position={[-2, 0, 2]}>
        {/* Poles */}
        <mesh position={[-1, 1.2, 0]} geometry={getSharedCylinderGeometry(0.02, 0.03, 2.4, 4)}>
          <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
        </mesh>
        <mesh position={[1, 1.2, 0]} geometry={getSharedCylinderGeometry(0.02, 0.03, 2.4, 4)}>
          <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
        </mesh>
        {/* Line */}
        <mesh position={[0, 2.35, 0]} rotation={[0, 0, Math.PI / 2]} geometry={getSharedCylinderGeometry(0.003, 0.003, 2, 4)}>
          <meshStandardMaterial color="#888" roughness={0.9} />
        </mesh>
        {/* Shirt hanging */}
        <mesh ref={shirtRef} position={[0.2, 2.1, 0.05]} geometry={getSharedBoxGeometry(0.2, 0.3, 0.02)}>
          <meshStandardMaterial color="#4a6a8a" roughness={0.9} />
        </mesh>
        {/* Sleeve */}
        <mesh position={[0.1, 2.05, 0.05]} rotation={[0, 0, 0.3]} geometry={getSharedBoxGeometry(0.15, 0.06, 0.01)}>
          <meshStandardMaterial color="#4a6a8a" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Broken antenna (bent metal) ── */}
      <group position={[-3.5, 1.2, -3.0]}>
        <mesh rotation={[0, 0, 0.6]} geometry={getSharedCylinderGeometry(0.01, 0.015, 1.5, 4)}>
          <meshStandardMaterial color="#6a6a6a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.3, 0.8, 0]} rotation={[0, 0, 1.2]} geometry={getSharedCylinderGeometry(0.008, 0.01, 0.8, 4)}>
          <meshStandardMaterial color="#5a5a5a" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
      </EnvironmentDetail>
    </group>
  );
}

/** Low-poly metal railings along open roof edges — matches parapet height, gap at street exit. */
function RooftopEdgeRailings({ w, d }: { w: number; d: number }) {
  const railColor = '#555555';
  const railMat = { color: railColor, metalness: 0.65, roughness: 0.45 };
  const postSpacing = 1.75;
  const railYLow = 1.05;
  const railYHigh = 1.18;
  const postBaseY = 1.0;
  const postHeight = 0.22;

  const postPositions: Array<{ key: string; pos: [number, number, number] }> = [];

  // Front edge (+Z) — gap for rooftop_to_street doorway (~0.9 m at centre)
  const frontZ = d / 2 - 0.06;
  const doorwayHalf = 0.55;
  for (let x = -w / 2 + 0.35; x <= w / 2 - 0.35; x += postSpacing) {
    if (Math.abs(x) < doorwayHalf) continue;
    postPositions.push({ key: `front-${x.toFixed(2)}`, pos: [x, postBaseY, frontZ] });
  }

  // Side edges (±X)
  for (let z = -d / 2 + 0.35; z <= d / 2 - 0.35; z += postSpacing) {
    postPositions.push({ key: `left-${z.toFixed(2)}`, pos: [-w / 2 + 0.06, postBaseY, z] });
    postPositions.push({ key: `right-${z.toFixed(2)}`, pos: [w / 2 - 0.06, postBaseY, z] });
  }

  const frontSegments: Array<[number, number]> = [
    [-w / 2 + 0.2, -doorwayHalf],
    [doorwayHalf, w / 2 - 0.2],
  ];
  const sideSpan = d - 0.5;

  return (
    <group>
      {postPositions.map(({ key, pos }) => (
        <mesh key={key} position={pos} geometry={getSharedBoxGeometry(0.04, postHeight, 0.04)}>
          {/* LIGHT-4: castShadow removed from thin 4cm posts */}
          <meshStandardMaterial {...railMat} />
        </mesh>
      ))}

      {frontSegments.map(([fromX, toX], i) => {
        const length = toX - fromX;
        const centerX = (fromX + toX) / 2;
        return (
          <group key={`front-rail-${i}`}>
            {/* LIGHT-4: Thin railings (2.5cm) don't cast visible shadows. */}
            <mesh position={[centerX, railYLow, frontZ]} geometry={getSharedBoxGeometry(length, 0.025, 0.025)}>
              <meshStandardMaterial {...railMat} />
            </mesh>
            <mesh position={[centerX, railYHigh, frontZ]} geometry={getSharedBoxGeometry(length, 0.025, 0.025)}>
              <meshStandardMaterial {...railMat} />
            </mesh>
          </group>
        );
      })}

      {(['left', 'right'] as const).map((side) => {
        const x = side === 'left' ? -w / 2 + 0.06 : w / 2 - 0.06;
        return (
          <group key={`${side}-rails`}>
            <mesh position={[x, railYLow, 0]} geometry={getSharedBoxGeometry(0.025, 0.025, sideSpan)}>
              <meshStandardMaterial {...railMat} />
            </mesh>
            <mesh position={[x, railYHigh, 0]} geometry={getSharedBoxGeometry(0.025, 0.025, sideSpan)}>
              <meshStandardMaterial {...railMat} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Large inward-facing dome with galaxy-sunset gradient and sparse horizon stars. */
function SunsetSkyDome() {
  const { selectedPreset } = useGraphicsQuality();
  const animateStars =
    allowsHeavyGfxFeature(selectedPreset, 'galaxySky')
    && !isEffectiveReducedMotion();
  const skyTexture = useCachedCanvasTexture('rooftop_edge:galaxy-sky', createRooftopSunsetGalaxySkyTexture);
  const starGeometry = useOwnedBufferGeometry(() => createRooftopHorizonStarGeometry(), []);
  const starsRef = useRef<Points>(null);

  useFrameTick('misc', ({ state }) => {
    if (!animateStars || !starsRef.current) return;
    starsRef.current.rotation.y = state.clock.elapsedTime * 0.004;
  });

  return (
    <group renderOrder={-10}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[60, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshBasicMaterial map={skyTexture} side={BackSide} fog={false} depthWrite={false} />
      </mesh>
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial
          color="#ffe8c8"
          size={1.1}
          sizeAttenuation={false}
          transparent
          opacity={0.75}
          fog={false}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function createRooftopFloorTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark concrete
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, size, size);

  // Tar seams
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 2;
  for (let i = 0; i < size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Gravel texture
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? '#4a4a4a' : '#2a2a2a';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1.0;

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(5, 4);
  return tex;
}
