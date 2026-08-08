
/* ─── Volodka RPG – Street scene procedural 3D visual ─── */

import { useRef, useMemo, useEffect, Suspense } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useFrameTick } from '@/engine/frame/useFrameTick';
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
import { EnvironmentDetail, PropDistanceGate } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createStreetNightSynthwaveSkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import { AmbientParticles } from './AmbientParticles';
import { WetStreetGround } from './WetStreetGround';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { getCachedSurfaceDetailMaps } from '@/engine/graphics/proceduralSurfaceTextures';
import { PBR_PRESETS } from '@/engine/graphics/materials/pbrPresets';
import {
  allowsSelectiveMeshPhysicalWet,
  getRainWetSidewalkSettings,
  getWetGlassPhysicalParams,
  getWetPuddlePhysicalParams,
} from '@/engine/graphics/wetStreetScenes';
import { HeroStreetFacadesWithAssets } from './PolyHavenStreetDressing';
import { PolyHavenStandardMaterial } from './PolyHavenStandardMaterial';
import { usesPhotographicHdriBackground } from '@/config/polyhavenAssets';
import { isProceduralAaaFlagActive } from '@/proceduralAaa/params';
import { ProceduralAaaHybridOverlay } from '@/proceduralAaa/ProceduralAaaHybridOverlay';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import { disposeEphemeralGpuResources } from '@/engine/three/disposeThreeResources';
import { useIsMobileVisual } from '@/hooks/use-mobile';

interface StreetVisualProps {
  sceneId?: SceneId;
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/** Street scene with buildings, neon, fog, lamps, and weather */
export function StreetVisual({ sceneId = 'street_night', livePlayerPositionRef }: StreetVisualProps) {
  const isWinter = sceneId === 'street_winter';
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const envProfile = useMemo(() => getEnvironmentLodProfile(sceneId), [sceneId]);
  const { selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  // Authored GLTF dressing replaces benches/lamps — NeonSigns + drip/broken-window stay always.
  const usePhysicalPuddles =
    !isWinter
    && allowsHeavyGfxFeature(selectedPreset, 'meshPhysicalWet', { coarsePointer });
  const usePhysicalWetGlass =
    !isWinter
    && sceneId === 'street_night'
    && allowsSelectiveMeshPhysicalWet('street_night', selectedPreset, { coarsePointer });
  const wetPuddle = useMemo(
    () => getWetPuddlePhysicalParams(rainIntensity),
    [rainIntensity],
  );
  const wetShopGlass = useMemo(() => getWetGlassPhysicalParams('streetShopWindow'), []);
  const wetNeonFascia = useMemo(() => getWetGlassPhysicalParams('neonFascia'), []);

  // High/ultra (or ?proceduralAaa=1) — hybrid: Poly Haven grounds/facades + procedural atmosphere/landmarks
  const hybridAaa =
    !isWinter
    && sceneId === 'street_night'
    && (
      isProceduralAaaFlagActive()
      || allowsHeavyGfxFeature(selectedPreset, 'meshPhysicalWet', { coarsePointer })
    );

  return (
    <group>
      {!isWinter && sceneId === 'street_night' && !usesPhotographicHdriBackground(sceneId)
        ? <StreetNightSkyDome />
        : null}
      <WetStreetGround sceneId={sceneId} isWinter={isWinter} rainIntensity={rainIntensity} />

      {/* ── Sidewalk ── */}
      <StreetSidewalk isWinter={isWinter} rainIntensity={rainIntensity} />

      {/* ── Bevelled panel buildings + neon fascia (hero silhouette) ── */}
      <EnvironmentDetail minLod="standard" position={[0, 0, -10]}>
        <HeroStreetFacadesWithAssets />
        {/* Neon storytelling stays — authored facades/props have no café/КАФЕ/bar tubes.
            High previously hid NeonSigns and left dead facade strips. */}
        <NeonSigns isWinter={isWinter} />
      </EnvironmentDetail>

      {hybridAaa ? <ProceduralAaaHybridOverlay /> : null}

      {/* ── Playable-area boundary: curb + railing so the invisible wall reads as a barrier ── */}
      <StreetBoundary isWinter={isWinter} />

      {/* ── Street Lamps are now rendered in FOREGROUND layer via SceneColliderSelector ── */}

      {/* ── Fog ── (handled by SceneEnvironment — no duplicate) */}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Wet bench + trash cans replaced by Poly Haven GLTF in HeroStreetFacadesWithAssets */}

      {/* ── Puddle reflections - polygonOffset prevents Z-fighting */}
      <EnvironmentDetail minLod="full" position={[1.5, 0.02, 2]}>
        {usePhysicalPuddles && rainIntensity > 0.08 ? (
          <>
            <mesh rotation-x={-Math.PI / 2} position={[1.5, 0.02, 2]} geometry={getSharedCircleGeometry(0.6, 12)} renderOrder={2}>
              <meshPhysicalMaterial
                color="#0e0e1e"
                metalness={wetPuddle.metalness}
                roughness={wetPuddle.roughness}
                clearcoat={wetPuddle.clearcoat}
                clearcoatRoughness={wetPuddle.clearcoatRoughness}
                transparent
                opacity={wetPuddle.opacity}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={1}
              />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[-1, 0.02, -4]} geometry={getSharedCircleGeometry(0.4, 12)} renderOrder={2}>
              <meshPhysicalMaterial
                color="#0e0e1e"
                metalness={wetPuddle.metalness * 0.92}
                roughness={Math.min(1, wetPuddle.roughness + 0.04)}
                clearcoat={wetPuddle.clearcoat * 0.9}
                clearcoatRoughness={wetPuddle.clearcoatRoughness}
                transparent
                opacity={Math.max(0.2, wetPuddle.opacity * 0.85)}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={1}
              />
            </mesh>
          </>
        ) : (
          <>
            <mesh rotation-x={-Math.PI / 2} position={[1.5, 0.02, 2]} geometry={getSharedCircleGeometry(0.6, 12)}>
              <meshStandardMaterial
                color="#0e0e1e"
                metalness={0.55 + rainIntensity * 0.15}
                roughness={Math.max(0.12, 0.22 - rainIntensity * 0.08)}
                transparent
                opacity={0.35 + rainIntensity * 0.2}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={1}
              />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[-1, 0.02, -4]} geometry={getSharedCircleGeometry(0.4, 12)}>
              <meshStandardMaterial
                color="#0e0e1e"
                metalness={0.5 + rainIntensity * 0.12}
                roughness={Math.max(0.14, 0.25 - rainIntensity * 0.08)}
                transparent
                opacity={0.3 + rainIntensity * 0.18}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={1}
              />
            </mesh>
          </>
        )}
      </EnvironmentDetail>

      {/* Selective wet shop glass + neon fascia (high/ultra) — plaza/café parity */}
      {usePhysicalWetGlass ? (
        <EnvironmentDetail minLod="standard" position={[0, 0, 0]}>
          <mesh position={[6.2, 1.55, -9.15]} geometry={getSharedBoxGeometry(1.8, 1.35, 0.04)}>
            <meshPhysicalMaterial
              color="#1a2238"
              roughness={wetShopGlass.roughness}
              metalness={wetShopGlass.metalness}
              transmission={wetShopGlass.transmission}
              thickness={wetShopGlass.thickness}
              clearcoat={wetShopGlass.clearcoat}
              clearcoatRoughness={wetShopGlass.clearcoatRoughness}
              transparent
              opacity={wetShopGlass.opacity}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[-5.8, 4.85, -9.85]} geometry={getSharedBoxGeometry(2.15, 0.12, 0.06)}>
            <meshPhysicalMaterial
              color="#201018"
              roughness={wetNeonFascia.roughness}
              metalness={wetNeonFascia.metalness}
              transmission={wetNeonFascia.transmission}
              thickness={wetNeonFascia.thickness}
              clearcoat={wetNeonFascia.clearcoat}
              clearcoatRoughness={wetNeonFascia.clearcoatRoughness}
              transparent
              opacity={wetNeonFascia.opacity}
              emissive="#ff4488"
              emissiveIntensity={0.35}
              depthWrite={false}
            />
          </mesh>
        </EnvironmentDetail>
      ) : null}

      {/* Drip pipe + broken window stay — authored facades/props have no replacements.
          High previously hid these with !useAuthoredDressing (same empty-facade gap as NeonSigns). */}
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
          <meshPhysicalMaterial color="#607080" transparent opacity={0.3} metalness={0.2} roughness={0.1} clearcoat={1.0} clearcoatRoughness={0.1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
        <mesh position={[0.15, 7.7, 0.01]} geometry={getSharedPlaneGeometry(0.2, 0.35)}>
          <meshPhysicalMaterial color="#607080" transparent opacity={0.2} metalness={0.2} roughness={0.1} clearcoat={1.0} clearcoatRoughness={0.1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      </StreetClutterGate>
    </group>
  );
}

/** Tiled sidewalk — Poly Haven concrete PBR (procedural fallback while loading). */
function StreetSidewalk({ isWinter, rainIntensity }: { isWinter: boolean; rainIntensity: number }) {
  const wet = useMemo(
    () => (isWinter ? null : getRainWetSidewalkSettings(rainIntensity)),
    [isWinter, rainIntensity],
  );
  return (
    <Suspense fallback={<StreetSidewalkProcedural isWinter={isWinter} rainIntensity={rainIntensity} />}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow geometry={getSharedPlaneGeometry(6, 40)}>
        <PolyHavenStandardMaterial
          materialId="concrete_floor_painted"
          repeatScale={isWinter ? 0.9 : 1.1}
          color={isWinter ? '#c8d0dc' : '#ffffff'}
          metalness={wet?.metalness ?? 0.03}
          roughness={wet?.roughness ?? 1}
          polygonOffset
        />
      </mesh>
    </Suspense>
  );
}

function StreetSidewalkProcedural({ isWinter, rainIntensity }: { isWinter: boolean; rainIntensity: number }) {
  const { preset } = useGraphicsQuality();
  const wet = useMemo(
    () => (isWinter ? null : getRainWetSidewalkSettings(rainIntensity)),
    [isWinter, rainIntensity],
  );
  const maps = useMemo(
    () => getCachedSurfaceDetailMaps('sidewalk', preset.textureScale),
    [preset.textureScale],
  );
  const map = useMemo(() => {
    const t = maps.map.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(maps.repeat * 0.35, maps.repeat * 2.2);
    t.needsUpdate = true;
    return t;
  }, [maps]);
  const normalMap = useMemo(() => {
    const t = maps.normalMap.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.copy(map.repeat);
    t.needsUpdate = true;
    return t;
  }, [maps, map]);
  const roughnessMap = useMemo(() => {
    const t = maps.roughnessMap.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.copy(map.repeat);
    t.needsUpdate = true;
    return t;
  }, [maps, map]);

  useEffect(
    () => () => disposeEphemeralGpuResources(map, normalMap, roughnessMap),
    [map, normalMap, roughnessMap],
  );

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow geometry={getSharedPlaneGeometry(6, 40)}>
      <meshPhysicalMaterial
        color={isWinter ? '#b0b8c8' : PBR_PRESETS.sidewalk.color}
        map={isWinter ? undefined : map}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.45, 0.45)}
        roughnessMap={roughnessMap}
        roughness={isWinter ? 0.72 : (wet?.roughness ?? PBR_PRESETS.sidewalk.roughness)}
        metalness={wet?.metalness ?? PBR_PRESETS.sidewalk.metalness}
        clearcoat={wet ? 0.6 : 0.25} /* WS22-C: PBR upgrade — dry baseline raised for wet asphalt sheen */
        clearcoatRoughness={wet ? 0.25 : 0.5}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
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
        <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={3.6} color={railColor} metalness={0.62} roughness={0.52} />
      </instancedMesh>

      {/* Two horizontal rails per side */}
      {[0.6, 1.0].map((y) => (
        <group key={`rails-${y}`}>
          <mesh position={[0, y, -edge]} geometry={getSharedBoxGeometry(span, 0.04, 0.04)}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={4.2} color={railColor} metalness={0.62} roughness={0.52} />
          </mesh>
          <mesh position={[0, y, edge]} geometry={getSharedBoxGeometry(span, 0.04, 0.04)}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={4.2} color={railColor} metalness={0.62} roughness={0.52} />
          </mesh>
          <mesh position={[-edge, y, 0]} rotation={[0, Math.PI / 2, 0]} geometry={getSharedBoxGeometry(span, 0.04, 0.04)}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={4.2} color={railColor} metalness={0.62} roughness={0.52} />
          </mesh>
          <mesh position={[edge, y, 0]} rotation={[0, Math.PI / 2, 0]} geometry={getSharedBoxGeometry(span, 0.04, 0.04)}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={4.2} color={railColor} metalness={0.62} roughness={0.52} />
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
          <PolyHavenStandardMaterial materialId="concrete_floor_painted" repeatScale={2.8} color={curbColor} roughness={0.9} />
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

  useFrameTick('misc', ({ state, delta: _delta }) => {
    const t = state.clock.elapsedTime;

    // Red neon flicker — time-gated deterministic on/off
    if (redSignRef.current) {
      const flicker = Math.sin(t * 17.3 + 4.1) > 0.9 ? 0.18 : 0.72;
      (redSignRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flicker;
    }
    if (redLightRef.current) {
      redLightRef.current.intensity = Math.sin(t * 17.3 + 4.1) > 0.9 ? 0.12 : 0.45;
    }
    // Cafe sign subtle pulse
    if (cafeSignRef.current) {
      const pulse = (isWinter ? 0.85 : 1.0) + Math.sin(t * 2) * 0.08;
      (cafeSignRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }

    // "КАФЕ" neon sign flicker — deterministic on/off like a broken tube
    if (t >= kafeNextToggleRef.current) {
      kafeNextToggleRef.current = t + 1 / 8; // 8 toggles/sec
      // 94% of 8 ticks = on most of the time, using sin threshold for determinism
      kafeOnRef.current = Math.sin(t * 53.7 + 7.3) > -0.88;
    }
    if (cafeKafeRef.current) {
      (cafeKafeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        kafeOnRef.current ? 1.15 : 0.04;
    }
    if (cafeKafeLightRef.current) {
      cafeKafeLightRef.current.intensity = kafeOnRef.current ? 0.85 : 0;
    }

    // Bar scrolling neon light — traveling bright segment
    if (barScrollRef.current) {
      const baseIntensity = 0.35;
      const scrollBoost = 0.85;
      (barScrollRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        baseIntensity + scrollBoost * 0.5 * (1 + Math.sin(t * 4));
    }
    if (barScrollLightRef.current) {
      const scrollX = Math.sin(t * 0.8) * 1.5;
      barScrollLightRef.current.position.x = scrollX;
      barScrollLightRef.current.intensity = 0.45 + Math.sin(t * 2) * 0.16;
    }
  });

  return (
    <group>
      {/* "Синяя яма" cafe sign — metal housing + restrained emissive tube */}
      <group position={[8, 4, -8]}>
        <mesh geometry={getSharedBoxGeometry(2.6, 0.36, 0.08)}>
          <Suspense fallback={<meshStandardMaterial color="#101018" roughness={0.7} metalness={0.4} />}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={1.8} color="#1c1c24" metalness={0.5} roughness={0.5} />
          </Suspense>
        </mesh>
        <mesh ref={cafeSignRef} position={[0, 0, 0.05]} geometry={getSharedBoxGeometry(2.35, 0.18, 0.04)}>
          <meshStandardMaterial
            color="#001133"
            emissive="#1a4aff"
            emissiveIntensity={isWinter ? 0.78 : 0.9}
            roughness={0.55}
            metalness={0.15}
          />
        </mesh>
        <pointLight position={[0, -0.5, 0.5]} color="#1a4aff" intensity={1.05} distance={9} decay={2} />
      </group>

      {/* "КАФЕ" neon sign — flickering broken tube style */}
      <group position={[-6, 5, -10]}>
        {/* Sign backing */}
        <mesh position={[0, 0.15, -0.02]} geometry={getSharedBoxGeometry(2.0, 0.6, 0.02)}>
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={2.2} color="#16161a" metalness={0.48} roughness={0.58} />
        </mesh>
        {/* Neon letter frames — 4 Cyrillic letters К А Ф Е */}
        {[-0.7, -0.2, 0.2, 0.7].map((x, i) => (
          <mesh key={i} ref={i === 0 ? cafeKafeRef : undefined} position={[x, 0.15, 0]} geometry={getSharedBoxGeometry(0.35, 0.4, 0.05)}>
            <meshStandardMaterial
              color="#001133"
              emissive="#ff4488"
              emissiveIntensity={1.15}
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
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={2.4} color="#101014" metalness={0.45} roughness={0.6} />
        </mesh>
        {/* Bar name neon strip */}
        <mesh ref={barScrollRef} position={[0, 0.3, 0]} geometry={getSharedBoxGeometry(2.6, 0.15, 0.05)}>
          <meshStandardMaterial
            color="#001a00"
            emissive="#00ffaa"
            emissiveIntensity={0.85}
            toneMapped={false}
          />
        </mesh>
        {/* Bottom decorative strip */}
        <mesh position={[0, 0.05, 0]} geometry={getSharedBoxGeometry(2.8, 0.05, 0.05)}>
          <meshStandardMaterial
            color="#1a0000"
            emissive="#ff2200"
            emissiveIntensity={0.55}
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
            emissiveIntensity={0.72}
          />
        </mesh>
        <pointLight ref={redLightRef} position={[0, -0.3, 0.5]} color="#ff1a3a" intensity={0.9} distance={9} />
      </group>

      {/* Green pharmacy cross */}
      <group position={[14, 6, 7]}>
        <mesh geometry={getSharedBoxGeometry(0.8, 0.8, 0.05)}>
          <meshStandardMaterial
            color="#003311"
            emissive="#00ff44"
            emissiveIntensity={0.55}
          />
        </mesh>
        <pointLight position={[0, -0.3, 0.5]} color="#00ff44" intensity={0.85} distance={7} />
      </group>

      {/* Yellow advertisement strip */}
      <group position={[0, 12, -24]}>
        <mesh geometry={getSharedBoxGeometry(4, 0.2, 0.05)}>
          <meshStandardMaterial
            color="#332200"
            emissive="#ffaa00"
            emissiveIntensity={0.45}
          />
        </mesh>
      </group>

      {/* ── Street ambient particles (neon green cyberpunk atmosphere) ── */}
      <AmbientParticles count={100} boundsX={[-15, 15]} boundsY={[0, 5]} boundsZ={[-15, 15]} color="#6ee7b7" opacity={0.15} sizeMax={0.03} driftSpeed={0.08} />
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

