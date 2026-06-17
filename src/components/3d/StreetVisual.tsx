
/* ─── Volodka RPG – Street scene procedural 3D visual ─── */

import { useRef, useMemo, useEffect, useLayoutEffect, type ComponentRef } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useGameStore } from '@/store/gameStore';
import { useWetSurfaceMaterial } from '@/hooks/useWetSurfaceMaterial';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { registerFrameTick, unregisterFrameTick } from '@/engine/frame/FrameBudgetRegistry';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import { getReflectorMaterialSettings, isWetStreetScene } from '@/engine/graphics/wetStreetScenes';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { applyWetness } from '@/engine/graphics/materials/pbrPresets';
import * as THREE from 'three';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedSphereGeometry,
} from '@/engine/three/moduleGeometryRegistry';

import type { SceneId } from '@/shared/types/game';
import { getEnvironmentLodProfile } from '@/engine/lod/distanceLod';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail, PropDistanceGate } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createStreetNightSynthwaveSkyTexture } from '@/engine/graphics/proceduralSkyTextures';

interface StreetVisualProps {
  sceneId?: SceneId;
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/** Rain-wet ground plane for street scenes. High+ uses planar reflections on wet streets. */
function StreetGround({
  sceneId,
  isWinter,
  rainIntensity,
}: {
  sceneId: SceneId;
  isWinter: boolean;
  rainIntensity: number;
}) {
  const { preset, selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const reducedMotion = useEffectiveReducedMotion();
  const reflectorSettings = getReflectorMaterialSettings(preset.id);
  const usePlanarReflector =
    isWetStreetScene(sceneId)
    && !isWinter
    && !reducedMotion
    && allowsHeavyGfxFeature(selectedPreset, 'reflector', { coarsePointer });
  const groundColor = isWinter ? '#a0a8b8' : '#3a3a52';
  const dryRoughness = isWinter ? 0.7 : 0.85;
  const dryMetalness = 0.05;
  const effectiveRain = isWinter ? 0 : rainIntensity;

  const wetMat = useWetSurfaceMaterial(groundColor, {
    dryRoughness,
    dryMetalness,
    rainIntensity: effectiveRain,
  });

  const reflectorMatRef = useRef<ComponentRef<typeof MeshReflectorMaterial>>(null);
  const wetActive = effectiveRain > 0;

  useLayoutEffect(() => {
    if (!usePlanarReflector) return;

    const mat = reflectorMatRef.current;
    if (!mat) return;

    if (!wetActive) {
      applyWetness(mat, dryRoughness, dryMetalness, 0);
      return;
    }

    const tickId = registerFrameTick('weather', () => {
      const current = reflectorMatRef.current;
      if (!current) return;
      applyWetness(current, dryRoughness, dryMetalness, effectiveRain);
    });

    return () => unregisterFrameTick(tickId);
  }, [usePlanarReflector, wetActive, dryRoughness, dryMetalness, effectiveRain]);

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(60, 60)}>
      {usePlanarReflector ? (
        <MeshReflectorMaterial
          ref={reflectorMatRef}
          color={groundColor}
          roughness={dryRoughness}
          metalness={dryMetalness}
          blur={reflectorSettings.blur}
          resolution={reflectorSettings.resolution}
          mixBlur={0.85}
          mixStrength={reflectorSettings.mixStrength}
          mirror={0.45}
          depthScale={1}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.4}
        />
      ) : (
        <primitive object={wetMat} attach="material" />
      )}
    </mesh>
  );
}

/** Street scene with buildings, neon, fog, lamps, and weather */
export function StreetVisual({ sceneId = 'street_night', livePlayerPositionRef }: StreetVisualProps) {
  const isWinter = sceneId === 'street_winter';
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const { lod } = useEnvironmentLod();
  const envProfile = useMemo(() => getEnvironmentLodProfile(sceneId), [sceneId]);

  return (
    <group>
      {!isWinter && sceneId === 'street_night' ? <StreetNightSkyDome /> : null}
      <StreetGround sceneId={sceneId} isWinter={isWinter} rainIntensity={rainIntensity} />

      {/* ── Sidewalk ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow geometry={getSharedPlaneGeometry(6, 40)}>
        <meshStandardMaterial
          color={isWinter ? '#b0b8c8' : '#4a4a62'}
          roughness={0.8}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Panel Building Silhouettes + neon (hidden at minimal environment LOD) ── */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
        <PanelBuildings />
        <NeonSigns isWinter={isWinter} />
      </EnvironmentDetail>

      {/* ── Playable-area boundary: curb + railing so the invisible wall reads as a barrier ── */}
      <StreetBoundary isWinter={isWinter} />

      {/* ── Street Lamps are now rendered in FOREGROUND layer via SceneColliderSelector ── */}

      {/* ── Fog ── (handled by SceneEnvironment — no duplicate) */}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Wet bench (matches street_bench_zone trigger at origin) ── */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow geometry={getSharedBoxGeometry(1.6, 0.08, 0.55)}>
          <meshStandardMaterial color="#3a4a3a" roughness={0.85} />
        </mesh>
        <mesh position={[-0.65, 0.45, 0]} castShadow geometry={getSharedBoxGeometry(0.08, 0.32, 0.5)}>
          <meshStandardMaterial color="#2a3a2a" roughness={0.9} />
        </mesh>
        <mesh position={[0.65, 0.45, 0]} castShadow geometry={getSharedBoxGeometry(0.08, 0.32, 0.5)}>
          <meshStandardMaterial color="#2a3a2a" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Overflowing trash cans ── */}
      <StreetClutterGate
        livePlayerPositionRef={livePlayerPositionRef}
        position={[2, 0, 3]}
        maxDistance={envProfile.clutterDistance}
      >
        {/* Trash can */}
        <mesh position={[0, 0.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.25, 0.2, 1.0, 8)}>
          <meshStandardMaterial color="#3a4a3a" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* Overflow trash on top */}
        <mesh position={[0.1, 1.05, 0]} rotation={[0.2, 0.5, 0]} geometry={getSharedBoxGeometry(0.12, 0.06, 0.08)}>
          <meshStandardMaterial color="#6a5a40" roughness={0.95} />
        </mesh>
        <mesh position={[-0.08, 1.08, 0.1]} rotation={[0.3, 1.2, 0.1]} geometry={getSharedSphereGeometry(0.05, 5, 5)}>
          <meshStandardMaterial color="#8a8a80" roughness={0.95} />
        </mesh>
      </StreetClutterGate>

      {/* Second trash can */}
      <StreetClutterGate
        livePlayerPositionRef={livePlayerPositionRef}
        position={[-2.5, 0, -8]}
        maxDistance={envProfile.clutterDistance}
      >
        <mesh position={[0, 0.45, 0]} castShadow geometry={getSharedCylinderGeometry(0.22, 0.18, 0.9, 8)}>
          <meshStandardMaterial color="#4a3a2a" metalness={0.3} roughness={0.7} />
        </mesh>
      </StreetClutterGate>

      {/* ── Puddle reflections - polygonOffset prevents Z-fighting */}
      <EnvironmentDetail currentLod={lod} minLod="full">
        <mesh rotation-x={-Math.PI / 2} position={[1.5, 0.02, 2]} geometry={getSharedCircleGeometry(0.6, 12)}>
          <meshStandardMaterial color="#0e0e1e" metalness={0.8} roughness={0.1} transparent opacity={0.5} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[-1, 0.02, -4]} geometry={getSharedCircleGeometry(0.4, 12)}>
          <meshStandardMaterial color="#0e0e1e" metalness={0.7} roughness={0.1} transparent opacity={0.4} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      </EnvironmentDetail>

      <StreetClutterGate
        livePlayerPositionRef={livePlayerPositionRef}
        position={[-12, 0, -12]}
        maxDistance={envProfile.decorativeDistance}
      >
        {/* Dripping pipe (thin cylinder from building) */}
        <mesh position={[0, 3.5, 0]} rotation={[0, 0, Math.PI / 2]} geometry={getSharedCylinderGeometry(0.02, 0.02, 0.8, 6)}>
          <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Drip at end of pipe */}
        <mesh position={[0, 3.1, 0]} geometry={getSharedSphereGeometry(0.02, 6, 6)}>
          <meshStandardMaterial color="#4a6a8a" transparent opacity={0.7} />
        </mesh>
      </StreetClutterGate>

      <StreetClutterGate
        livePlayerPositionRef={livePlayerPositionRef}
        position={[12, 0, -18]}
        maxDistance={envProfile.decorativeDistance}
      >
        {/* Broken window in building */}
        <mesh position={[0, 8, 0]} geometry={getSharedPlaneGeometry(0.8, 1.0)}>
          <meshStandardMaterial color="#0a0a12" roughness={0.95} />
        </mesh>
        {/* Broken glass shards */}
        <mesh position={[0, 8.3, 0.01]} geometry={getSharedPlaneGeometry(0.25, 0.3)}>
          <meshStandardMaterial color="#607080" transparent opacity={0.3} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.15, 7.7, 0.01]} geometry={getSharedPlaneGeometry(0.2, 0.35)}>
          <meshStandardMaterial color="#607080" transparent opacity={0.2} metalness={0.2} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>
      </StreetClutterGate>
    </group>
  );
}

/** Visible boundary around the 20×20 playable area (physics walls sit at ±10).
 *  Low curb + metal railing: 1 instanced post mesh + 8 rail boxes + 4 curbs. */
function StreetBoundary({ isWinter }: { isWinter: boolean }) {
  const postsRef = useRef<THREE.InstancedMesh>(null);

  const HALF = 10;
  const RAIL_INSET = 0.25; // just inside the physics wall

  const postPositions = useMemo(() => {
    const out: Array<[number, number]> = [];
    const edge = HALF - RAIL_INSET;
    for (let v = -HALF + 1; v <= HALF - 1; v += 2) {
      out.push([v, -edge], [v, edge], [-edge, v], [edge, v]);
    }
    return out;
  }, []);

  useEffect(() => {
    const mesh = postsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    postPositions.forEach(([x, z], i) => {
      dummy.position.set(x, 0.55, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [postPositions]);

  const railColor = isWinter ? '#5a6470' : '#3c4456';
  const curbColor = isWinter ? '#9aa2b2' : '#44445e';
  const edge = HALF - RAIL_INSET;
  const span = (HALF - RAIL_INSET) * 2;

  return (
    <group>
      <instancedMesh ref={postsRef} args={[getSharedCylinderGeometry(0.035, 0.035, 1.1, 6), undefined, postPositions.length]} castShadow frustumCulled={false}>
        <meshStandardMaterial color={railColor} metalness={0.6} roughness={0.5} />
      </instancedMesh>

      {/* Two horizontal rails per side */}
      {[0.6, 1.0].map((y) => (
        <group key={`rails-${y}`}>
          <mesh position={[0, y, -edge]} geometry={getSharedBoxGeometry(span, 0.04, 0.04)}>
            <meshStandardMaterial color={railColor} metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, y, edge]} geometry={getSharedBoxGeometry(span, 0.04, 0.04)}>
            <meshStandardMaterial color={railColor} metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[-edge, y, 0]} rotation={[0, Math.PI / 2, 0]} geometry={getSharedBoxGeometry(span, 0.04, 0.04)}>
            <meshStandardMaterial color={railColor} metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[edge, y, 0]} rotation={[0, Math.PI / 2, 0]} geometry={getSharedBoxGeometry(span, 0.04, 0.04)}>
            <meshStandardMaterial color={railColor} metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Low curb under the railing */}
      {[
        { pos: [0, 0.08, -HALF + 0.1] as const, rot: 0 },
        { pos: [0, 0.08, HALF - 0.1] as const, rot: 0 },
        { pos: [-HALF + 0.1, 0.08, 0] as const, rot: Math.PI / 2 },
        { pos: [HALF - 0.1, 0.08, 0] as const, rot: Math.PI / 2 },
      ].map((c, i) => (
        <mesh key={`curb-${i}`} position={[c.pos[0], c.pos[1], c.pos[2]]} rotation={[0, c.rot, 0]} receiveShadow geometry={getSharedBoxGeometry(HALF * 2, 0.16, 0.35)}>
          <meshStandardMaterial color={curbColor} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Distance gate for street clutter — falls back to always-visible when no player ref. */
function StreetClutterGate({
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

/** 5 panel building silhouettes using InstancedMesh */
/** Modular facade buildings with emissive window grid (replaces flat instanced boxes). */
function PanelBuildings() {
  const buildings = useMemo(
    () => [
      { pos: [-12, 0, -15] as [number, number, number], w: 8, h: 18, d: 6 },
      { pos: [12, 0, -20] as [number, number, number], w: 10, h: 22, d: 6 },
      { pos: [-15, 0, 5] as [number, number, number], w: 7, h: 15, d: 5 },
      { pos: [14, 0, 8] as [number, number, number], w: 9, h: 20, d: 6 },
      { pos: [0, 0, -25] as [number, number, number], w: 12, h: 25, d: 8 },
    ],
    [],
  );

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={`facade-${i}`} position={b.pos}>
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow geometry={getSharedBoxGeometry(b.w, b.h, b.d)}>
            <meshStandardMaterial color="#2a2a3e" roughness={0.92} metalness={0.08} />
          </mesh>
          {/* Emissive window strip */}
          <mesh position={[0, b.h * 0.55, b.d / 2 + 0.02]} geometry={getSharedPlaneGeometry(b.w * 0.75, b.h * 0.35)}>
            <meshStandardMaterial
              color="#1a2030"
              emissive="#88ccff"
              emissiveIntensity={0.35 + (i % 3) * 0.15}
              roughness={0.4}
            />
          </mesh>
          {/* Ground floor shop front */}
          <mesh position={[0, 1.2, b.d / 2 + 0.03]} geometry={getSharedPlaneGeometry(b.w * 0.4, 2.2)}>
            <meshStandardMaterial
              color="#ffaa44"
              emissive="#ff8800"
              emissiveIntensity={0.5}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Neon sign strips with emissive glow — with flicker animation */
function NeonSigns({ isWinter }: { isWinter: boolean }) {
  const redSignRef = useRef<THREE.Mesh>(null);
  const redLightRef = useRef<THREE.PointLight>(null);
  const cafeSignRef = useRef<THREE.Mesh>(null);
  const cafeKafeRef = useRef<THREE.Mesh>(null);
  const cafeKafeLightRef = useRef<THREE.PointLight>(null);
  const barScrollRef = useRef<THREE.Mesh>(null);
  const barScrollLightRef = useRef<THREE.PointLight>(null);
  const kafeOnRef = useRef(true);
  const kafeNextToggleRef = useRef(0);

  useFrameTick('misc', ({ state, delta }) => {
    const t = state.clock.elapsedTime;

    // Red neon flicker — occasional quick flashes
    if (redSignRef.current) {
      const flicker = Math.random() > 0.95 ? 0.3 : 1.2;
      (redSignRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flicker;
    }
    if (redLightRef.current) {
      redLightRef.current.intensity = Math.random() > 0.95 ? 0.2 : 0.8;
    }
    // Cafe sign subtle pulse
    if (cafeSignRef.current) {
      const pulse = (isWinter ? 1.2 : 1.5) + Math.sin(t * 2) * 0.15;
      (cafeSignRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }

    // "КАФЕ" neon sign flicker — random on/off like a broken tube
    if (t >= kafeNextToggleRef.current) {
      kafeNextToggleRef.current = t + 1 / 8; // 8 toggles/sec
      kafeOnRef.current = Math.random() < 0.94;
    }
    if (cafeKafeRef.current) {
      (cafeKafeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        kafeOnRef.current ? 2.0 : 0.05;
    }
    if (cafeKafeLightRef.current) {
      cafeKafeLightRef.current.intensity = kafeOnRef.current ? 1.5 : 0;
    }

    // Bar scrolling neon light — traveling bright segment
    if (barScrollRef.current) {
      const baseIntensity = 0.6;
      const scrollBoost = 1.5;
      (barScrollRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        baseIntensity + scrollBoost * 0.5 * (1 + Math.sin(t * 4));
    }
    if (barScrollLightRef.current) {
      const scrollX = Math.sin(t * 0.8) * 1.5;
      barScrollLightRef.current.position.x = scrollX;
      barScrollLightRef.current.intensity = 0.8 + Math.sin(t * 2) * 0.3;
    }
  });

  return (
    <group>
      {/* "Синяя яма" cafe sign */}
      <group position={[8, 4, -8]}>
        <mesh ref={cafeSignRef} geometry={getSharedBoxGeometry(2.5, 0.3, 0.05)}>
          <meshStandardMaterial
            color="#001133"
            emissive="#1a4aff"
            emissiveIntensity={isWinter ? 1.2 : 1.5}
          />
        </mesh>
        <pointLight position={[0, -0.5, 0.5]} color="#1a4aff" intensity={2.5} distance={9} />
      </group>

      {/* "КАФЕ" neon sign — flickering broken tube style */}
      <group position={[-6, 5, -10]}>
        {/* Sign backing */}
        <mesh position={[0, 0.15, -0.02]} geometry={getSharedBoxGeometry(2.0, 0.6, 0.02)}>
          <meshStandardMaterial color="#111111" roughness={0.9} />
        </mesh>
        {/* Neon letter frames — 4 Cyrillic letters К А Ф Е */}
        {[-0.7, -0.2, 0.2, 0.7].map((x, i) => (
          <mesh key={i} ref={i === 0 ? cafeKafeRef : undefined} position={[x, 0.15, 0]} geometry={getSharedBoxGeometry(0.35, 0.4, 0.05)}>
            <meshStandardMaterial
              color="#001133"
              emissive="#ff4488"
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>
        ))}
        <pointLight
          ref={cafeKafeLightRef}
          position={[0, -0.5, 1]}
          color="#ff4488"
          intensity={1.5}
          distance={8}
        />
      </group>

      {/* Cyberpunk bar sign with scrolling light */}
      <group position={[5, 6, -15]}>
        {/* Sign panel */}
        <mesh position={[0, 0.2, -0.02]} geometry={getSharedBoxGeometry(3.0, 0.8, 0.02)}>
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
        {/* Bar name neon strip */}
        <mesh ref={barScrollRef} position={[0, 0.3, 0]} geometry={getSharedBoxGeometry(2.6, 0.15, 0.05)}>
          <meshStandardMaterial
            color="#001a00"
            emissive="#00ffaa"
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
        {/* Bottom decorative strip */}
        <mesh position={[0, 0.05, 0]} geometry={getSharedBoxGeometry(2.8, 0.05, 0.05)}>
          <meshStandardMaterial
            color="#1a0000"
            emissive="#ff2200"
            emissiveIntensity={1.0}
            toneMapped={false}
          />
        </mesh>
        {/* Scrolling accent light */}
        <pointLight
          ref={barScrollLightRef}
          position={[0, 0, 1]}
          color="#00ffaa"
          intensity={0.8}
          distance={6}
        />
      </group>

      {/* Red neon strip on building */}
      <group position={[-12, 8, -12]}>
        <mesh ref={redSignRef} geometry={getSharedBoxGeometry(3, 0.15, 0.05)}>
          <meshStandardMaterial
            color="#330011"
            emissive="#ff1a3a"
            emissiveIntensity={1.2}
          />
        </mesh>
        <pointLight ref={redLightRef} position={[0, -0.3, 0.5]} color="#ff1a3a" intensity={2.0} distance={9} />
      </group>

      {/* Green pharmacy cross */}
      <group position={[14, 6, 7]}>
        <mesh geometry={getSharedBoxGeometry(0.8, 0.8, 0.05)}>
          <meshStandardMaterial
            color="#003311"
            emissive="#00ff44"
            emissiveIntensity={1.0}
          />
        </mesh>
        <pointLight position={[0, -0.3, 0.5]} color="#00ff44" intensity={2.0} distance={7} />
      </group>

      {/* Yellow advertisement strip */}
      <group position={[0, 12, -24]}>
        <mesh geometry={getSharedBoxGeometry(4, 0.2, 0.05)}>
          <meshStandardMaterial
            color="#332200"
            emissive="#ffaa00"
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Rainy synthwave sky dome — fog-exempt horizon depth for street_night. */
function StreetNightSkyDome() {
  const skyTexture = useCachedCanvasTexture(
    'street_night:synthwave-sky',
    createStreetNightSynthwaveSkyTexture,
  );

  return (
    <mesh position={[0, 8, 0]} renderOrder={-10}>
      <sphereGeometry args={[62, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <meshBasicMaterial
        map={skyTexture}
        side={THREE.BackSide}
        fog={false}
        depthWrite={false}
      />
    </mesh>
  );
}

