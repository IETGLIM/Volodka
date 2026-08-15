
/* ─── Volodka RPG – River Pier at night: second ЧК hangout ───
 *  Wooden pier over dark water. Barrel fire, port wine, a guitar against a
 *  crate, string lights, an old boat, moon road on the river. The forest of
 *  Zorge has a sibling now.
 */

import { useLayoutEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react';
import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Group, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, RepeatWrapping, SRGBColorSpace, Vector3 } from 'three';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedConeGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedSphereGeometry,
} from '@/engine/three/moduleGeometryRegistry';

import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { useOwnedBufferGeometry } from '@/hooks/useOwnedBufferGeometry';
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { SceneBackdropShell } from './SceneBackdropShell';
import { WetStreetGround } from './WetStreetGround';
import {
  allowsSelectiveMeshPhysicalWet,
  getRainWetPlankSettings,
  getWetGlassPhysicalParams,
  getWetPuddlePhysicalParams,
} from '@/engine/graphics/wetStreetScenes';
import type { SceneId } from '@/shared/types/game';

interface RiverPierVisualProps {
  sceneId?: SceneId;
  livePlayerPositionRef?: MutableRefObject<Vector3>;
}

const W = 26;
const D = 20;

function pierSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function RiverPierVisual({ sceneId = 'river_pier' }: RiverPierVisualProps) {
  const { preset, selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const reducedMotion = useEffectiveReducedMotion();
  const useGltfDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  const useAuthoredBackdrop = !preset.visualLite && useGltfDressing;
  // Pier GLB is backdrop_dressing only (SceneBackdropShell far over water). Prop dressing is
  // sparse overlay — never strip railing/pilings/boat/reeds OR barrel/crate seats/wine.
  // Guitar is the one explicit hand-off: procedural fallback on Low, authored prop otherwise.
  const usePhysicalWater = allowsHeavyGfxFeature(selectedPreset, 'meshPhysicalWet', {
    coarsePointer,
  });
  const useWetGlass = allowsSelectiveMeshPhysicalWet(sceneId, selectedPreset, { coarsePointer });
  const wetLanternGlass = useMemo(() => getWetGlassPhysicalParams('pierLanternGlass'), []);
  const plankTexture = useCachedCanvasTexture('river_pier:planks', createPlankTexture);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const plankWet = useMemo(() => getRainWetPlankSettings(rainIntensity), [rainIntensity]);
  const wetPuddle = useMemo(() => getWetPuddlePhysicalParams(rainIntensity), [rainIntensity]);
  const waterRef = useRef<Mesh>(null);
  const fireRef = useRef<Mesh>(null);
  const moonRoadRef = useRef<Mesh>(null);
  const stringLightsRef = useRef<Group>(null);
  const reedsRef = useRef<Group>(null);
  const tRef = useRef(0);

  useFrameTick('misc', ({ delta }) => {
    tRef.current += delta;
    const t = tRef.current;
    if (fireRef.current) {
      fireRef.current.scale.y = reducedMotion
        ? 1
        : 0.85 + Math.sin(t * 9) * 0.18 + Math.sin(t * 17) * 0.08;
      fireRef.current.rotation.y = reducedMotion ? 0 : t * 0.8;
    }
    if (waterRef.current) {
      // Slow breathing of the water plane
      waterRef.current.position.y = -0.35 + Math.sin(t * 0.5) * 0.03;
    }
    if (moonRoadRef.current) {
      (moonRoadRef.current.material as MeshBasicMaterial).opacity =
        reducedMotion ? 0.1 : 0.1 + Math.sin(t * 0.55) * 0.025;
      moonRoadRef.current.scale.x = reducedMotion ? 1 : 0.94 + Math.sin(t * 0.34) * 0.06;
    }
    if (stringLightsRef.current) {
      stringLightsRef.current.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.012;
    }
    if (reedsRef.current) {
      reedsRef.current.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.42) * 0.009;
    }
  });

  // Water is dielectric: reflections come from low roughness + clearcoat, not metallic albedo.
  const waterMetalness = 0.02;
  const waterRoughness = Math.max(0.16, 0.3 - rainIntensity * 0.1);
  const waterClearcoat = 0.45 + Math.min(0.35, rainIntensity * 0.3);

  return (
    <group>
      <SceneBackdropShell sceneId="river_pier" />

      {/* Wet approach apron under / around the pier (planar reflector when raining) */}
      <WetStreetGround
        sceneId={sceneId}
        rainIntensity={rainIntensity}
        size={Math.max(W, D) + 8}
        groundColor="#2a2830"
      />

      {/* ── Wooden pier deck (player area) ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={useAuthoredBackdrop ? 0.018 : 0.012} geometry={getSharedPlaneGeometry(W, D)}>
        {/* WS22-C: PBR upgrade */}
        <meshPhysicalMaterial
          map={plankTexture}
          color="#4a3e30"
          roughness={plankWet.roughness}
          metalness={plankWet.metalness}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* Deck spill puddles — few MeshPhysical discs only (high/ultra). */}
      {usePhysicalWater && rainIntensity > 0.08
        ? (
          [
            { pos: [-2.4, -1.2] as const, r: 0.55 },
            { pos: [1.8, 2.1] as const, r: 0.42 },
            { pos: [0.3, -4.6] as const, r: 0.7 },
          ] as const
        ).map((p, i) => (
          <mesh
            key={`pier-puddle-${i}`}
            rotation-x={-Math.PI / 2}
            position={[p.pos[0], 0.02, p.pos[1]]}
            geometry={getSharedCircleGeometry(p.r, 16)}
            renderOrder={2}
          >
            <meshPhysicalMaterial
              color="#1a2230"
              roughness={wetPuddle.roughness}
              metalness={wetPuddle.metalness}
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
        ))
        : null}

      {/* ── Water — dark plane stretching south past the railing ── */}
      <mesh ref={waterRef} rotation-x={-Math.PI / 2} position={[0, -0.35, -26]} geometry={getSharedPlaneGeometry(90, 44)}>
        {usePhysicalWater ? (
          <meshPhysicalMaterial
            color="#0d1b26"
            metalness={waterMetalness}
            roughness={waterRoughness}
            clearcoat={waterClearcoat}
            clearcoatRoughness={Math.max(0.1, 0.25 - rainIntensity * 0.08)}
            transmission={0.025}
            thickness={0.7}
            transparent
            opacity={0.94}
          />
        ) : (
          <meshStandardMaterial
            color="#0d1b26"
            metalness={waterMetalness}
            roughness={waterRoughness}
            transparent
            opacity={0.94}
          />
        )}
      </mesh>
      {/* Moon road on the water — restrained normal blend avoids a flat emissive stripe. */}
      <mesh ref={moonRoadRef} rotation-x={-Math.PI / 2} position={[5, -0.33, -22]} geometry={getSharedPlaneGeometry(2.2, 30)}>
        <meshBasicMaterial color="#b8c5da" transparent opacity={0.1} fog={false} depthWrite={false} />
      </mesh>

      {/* ── Night sky: moon + stars (fog-exempt) ── */}
      <PierNightSky visualLite={preset.visualLite} />

      {/* ── Far bank silhouettes ── */}
      {[
        { x: -18, h: 5, w: 9 },
        { x: -4, h: 3.5, w: 7 },
        { x: 12, h: 6, w: 11 },
      ].map((bank, i) => (
        <mesh key={`bank-${i}`} position={[bank.x, bank.h / 2 - 0.3, -42]} geometry={getSharedBoxGeometry(bank.w, bank.h, 2)}>
          <meshStandardMaterial color="#0c1118" roughness={1} />
        </mesh>
      ))}

      {/* ── Pier railing along the water edge (procedural — backdrop GLB does not own the deck) ── */}
      <PierRailing />

      {/* ── Pilings under the deck edge ── */}
      {[-10, -6, -2, 2, 6, 10].map((x) => (
        <mesh key={`piling-${x}`} position={[x, -0.5, -9.2]} geometry={getSharedCylinderGeometry(0.14, 0.16, 1.6, 7)}>
          <meshStandardMaterial color="#2c2419" roughness={0.95} />
        </mesh>
      ))}

      {/* ── Barrel fire — procedural barrel stays; prop dressing is sparse overlay ── */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.34, 0.32, 1.0, 12)}>
          <meshStandardMaterial color="#3a3026" metalness={0.55} roughness={0.6} />
        </mesh>
        {/* Glow holes punched in the barrel */}
        {[0.4, 1.6, 2.9, 4.2].map((a) => (
          <mesh key={`hole-${a}`} position={[Math.cos(a) * 0.33, 0.45, Math.sin(a) * 0.33]} rotation={[0, -a + Math.PI / 2, 0]} geometry={getSharedCircleGeometry(0.045, 8)}>
            <meshStandardMaterial color="#200a00" emissive="#ff7722" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        ))}
        <mesh ref={fireRef} position={[0, 1.15, 0]} geometry={getSharedConeGeometry(0.22, 0.5, 8)}>
          <meshStandardMaterial color="#ff6622" emissive="#ff4400" emissiveIntensity={2.6} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* ── Crate seats around the fire (prop dressing has 1 bench — keep the ring) ── */}
      {[
        { pos: [-1.6, -1.2] as const, rot: 0.3 },
        { pos: [1.7, -1.4] as const, rot: -0.5 },
        { pos: [0.4, -3.6] as const, rot: 1.1 },
      ].map((crate, i) => (
        <mesh key={`crate-${i}`} position={[crate.pos[0], 0.25, crate.pos[1]]} rotation={[0, crate.rot, 0]} castShadow geometry={getSharedBoxGeometry(0.65, 0.5, 0.65)}>
          <meshStandardMaterial color="#54422c" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Port wine: bottles + tin cups on a crate-table ── */}
      <group position={[-0.7, 0, -2.9]}>
        <mesh position={[0, 0.2, 0]} castShadow geometry={getSharedBoxGeometry(0.55, 0.4, 0.45)}>
          <meshStandardMaterial color="#4a3a26" roughness={0.9} />
        </mesh>
        <mesh position={[-0.12, 0.55, 0.05]} castShadow geometry={getSharedCylinderGeometry(0.042, 0.048, 0.3, 8)}>
          {useWetGlass ? (
            <meshPhysicalMaterial
              color="#2a0814"
              roughness={wetLanternGlass.roughness}
              metalness={wetLanternGlass.metalness}
              transmission={wetLanternGlass.transmission}
              thickness={wetLanternGlass.thickness}
              clearcoat={wetLanternGlass.clearcoat}
              clearcoatRoughness={wetLanternGlass.clearcoatRoughness}
              transparent
              opacity={wetLanternGlass.opacity}
            />
          ) : (
            <meshStandardMaterial color="#2a0814" roughness={0.3} metalness={0.2} />
          )}
        </mesh>
        <mesh position={[0.14, 0.52, -0.08]} castShadow geometry={getSharedCylinderGeometry(0.04, 0.045, 0.26, 8)}>
          {useWetGlass ? (
            <meshPhysicalMaterial
              color="#1c0610"
              roughness={wetLanternGlass.roughness}
              metalness={wetLanternGlass.metalness}
              transmission={wetLanternGlass.transmission * 0.85}
              thickness={wetLanternGlass.thickness}
              clearcoat={wetLanternGlass.clearcoat}
              clearcoatRoughness={wetLanternGlass.clearcoatRoughness}
              transparent
              opacity={wetLanternGlass.opacity}
            />
          ) : (
            <meshStandardMaterial color="#1c0610" roughness={0.3} metalness={0.2} />
          )}
        </mesh>
        <mesh position={[0.05, 0.44, 0.14]} geometry={getSharedCylinderGeometry(0.035, 0.03, 0.08, 8)}>
          <meshStandardMaterial color="#8a8d90" metalness={0.8} roughness={0.35} />
        </mesh>
      </group>

      {/* Selective wet lantern glass — few panes on string-light poles (high/ultra). */}
      {useWetGlass
        ? (
          [
            { pos: [-5.2, 2.35, -1.8] as const },
            { pos: [5.2, 2.35, -1.8] as const },
            { pos: [0.1, 2.55, -4.2] as const },
          ] as const
        ).map((g, i) => (
          <mesh
            key={`pier-lantern-glass-${i}`}
            position={g.pos}
            geometry={getSharedSphereGeometry(0.11, 10, 8)}
            renderOrder={2}
          >
            <meshPhysicalMaterial
              color="#e8d8a8"
              roughness={wetLanternGlass.roughness}
              metalness={wetLanternGlass.metalness}
              transmission={wetLanternGlass.transmission}
              thickness={wetLanternGlass.thickness}
              clearcoat={wetLanternGlass.clearcoat}
              clearcoatRoughness={wetLanternGlass.clearcoatRoughness}
              transparent
              opacity={Math.min(0.85, wetLanternGlass.opacity + 0.08)}
              emissive="#ffaa44"
              emissiveIntensity={0.35}
              depthWrite={false}
            />
          </mesh>
        ))
        : null}

      {/* Low/visualLite guitar fallback; authored dressing owns the single guitar otherwise. */}
      {!useGltfDressing ? (
        <group position={[2.4, 0, -2.6]} rotation={[0, -0.7, 0]}>
          <mesh position={[0, 0.42, 0]} rotation={[0.18, 0, -0.3]} castShadow geometry={getSharedCylinderGeometry(0.26, 0.3, 0.09, 12)}>
            <meshStandardMaterial color="#7a4f24" roughness={0.62} />
          </mesh>
          <mesh position={[0.18, 0.85, 0.02]} rotation={[0.18, 0, -0.3]} castShadow geometry={getSharedBoxGeometry(0.05, 0.75, 0.04)}>
            <meshStandardMaterial color="#3c2a16" roughness={0.72} />
          </mesh>
        </group>
      ) : null}

      {/* ── Old overturned boat on the bank — prop dressing owns tyre/crate overlay only ── */}
      <group position={[-6, 0, 3]} rotation={[0, 0.4, Math.PI]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.7, 2.8, 7, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#3f4a50" roughness={0.85} side={DoubleSide} />
        </mesh>
      </group>

      {/* ── Fishing rod leaning on the railing ── */}
      <mesh position={[4.5, 0.7, -8.2]} rotation={[0.5, 0, 0.15]} castShadow geometry={getSharedCylinderGeometry(0.012, 0.02, 2.4, 5)}>
        <meshStandardMaterial color="#5a4a34" roughness={0.8} />
      </mesh>

      {/* ── String lights between two poles ── */}
      <StringLights swayRef={stringLightsRef} visualLite={preset.visualLite} />

      {/* ── Reeds along the bank edges ── */}
      <Reeds swayRef={reedsRef} visualLite={preset.visualLite} />
    </group>
  );
}

/* ── Moon + sparse stars over the river ── */
function PierNightSky({ visualLite = false }: { visualLite?: boolean }) {
  const starGeometry = useOwnedBufferGeometry(() => {
    const rng = pierSeededRandom(880011);
    const COUNT = visualLite ? 64 : 120;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = rng() * Math.PI; // southern hemisphere band over the water
      const phi = rng() * Math.PI * 0.4;
      const r = 50;
      positions[i * 3] = Math.cos(theta + Math.PI / 2) * Math.sin(phi + 0.2) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r * 0.5 + 8;
      positions[i * 3 + 2] = -Math.abs(Math.sin(theta + Math.PI / 2)) * Math.sin(phi + 0.2) * r - 14;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    return geo;
  }, [visualLite]);

  return (
    <group>
      <points geometry={starGeometry}>
        <pointsMaterial color="#d4dcf2" size={1.5} sizeAttenuation={false} transparent opacity={0.8} fog={false} depthWrite={false} />
      </points>
      <group position={[5, 14, -38]}>
        <mesh geometry={getSharedCircleGeometry(1.8, 24)}>
          <meshBasicMaterial color="#e9edf6" fog={false} />
        </mesh>
        <mesh position={[0, 0, -0.05]} geometry={getSharedCircleGeometry(3.0, 24)}>
          <meshBasicMaterial color="#9aa8cc" transparent opacity={0.2} fog={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Railing along the south (water) edge with a gap at the fishing spot ── */
function PierRailing() {
  const railSegments = [
    { x: -1.5, width: 10 },
    { x: 6, width: 1 },
  ] as const;

  return (
    <group position={[0, 0, -8.5]}>
      {[-6, -4, -2, 0, 2, 3.5, 5.5, 6.5].map((x) => (
        <mesh key={`post-${x}`} position={[x, 0.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.04, 0.05, 1.0, 6)}>
          <meshStandardMaterial color="#4c4438" metalness={0.18} roughness={0.82} />
        </mesh>
      ))}
      {railSegments.flatMap((segment) => [
        <mesh key={`top-${segment.x}`} position={[segment.x, 0.92, 0]} geometry={getSharedBoxGeometry(segment.width, 0.06, 0.06)}>
          <meshStandardMaterial color="#564c3e" metalness={0.18} roughness={0.82} />
        </mesh>,
        <mesh key={`mid-${segment.x}`} position={[segment.x, 0.5, 0]} geometry={getSharedBoxGeometry(segment.width, 0.04, 0.04)}>
          <meshStandardMaterial color="#4c4438" metalness={0.18} roughness={0.82} />
        </mesh>,
      ])}
    </group>
  );
}

/* ── String lights: catenary of warm bulbs (1 instanced draw + wire) ── */
function StringLights({
  swayRef,
  visualLite,
}: {
  swayRef: RefObject<Group | null>;
  visualLite: boolean;
}) {
  const bulbsRef = useRef<InstancedMesh>(null);
  const bulbCount = visualLite ? 7 : 11;

  useLayoutEffect(() => {
    const mesh = bulbsRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    for (let i = 0; i < bulbCount; i++) {
      const f = i / (bulbCount - 1);
      const x = -4 + f * 8;
      // Catenary sag
      const y = 2.6 - Math.sin(f * Math.PI) * 0.5;
      dummy.position.set(x, y, -4);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [bulbCount]);

  return (
    <group ref={swayRef}>
      {/* Poles */}
      {[-4, 4].map((x) => (
        <mesh key={`pole-${x}`} position={[x, 1.3, -4]} castShadow geometry={getSharedCylinderGeometry(0.05, 0.07, 2.6, 6)}>
          <meshStandardMaterial color="#3a3228" roughness={0.85} />
        </mesh>
      ))}
      {/* Wire (approximated with a thin sagging box) */}
      <mesh position={[0, 2.35, -4]} rotation={[0, 0, 0]} geometry={getSharedBoxGeometry(8, 0.012, 0.012)}>
        <meshStandardMaterial color="#1c1a16" roughness={0.9} />
      </mesh>
      <instancedMesh ref={bulbsRef} args={[getSharedSphereGeometry(0.05, 6, 5), undefined, bulbCount]} frustumCulled={false}>
        <meshStandardMaterial color="#6a4218" emissive="#ffc266" emissiveIntensity={0.95} />
      </instancedMesh>
    </group>
  );
}

/* ── Instanced reeds along the bank (1 draw call) ── */
function Reeds({
  swayRef,
  visualLite,
}: {
  swayRef: RefObject<Group | null>;
  visualLite: boolean;
}) {
  const reedsRef = useRef<InstancedMesh>(null);

  const placements = useMemo(() => {
    const rng = pierSeededRandom(551234);
    const out: Array<{ x: number; z: number; s: number; lean: number }> = [];
    const count = visualLite ? 22 : 40;
    for (let i = 0; i < count; i++) {
      const x = -12 + rng() * 24;
      const z = -7.6 - rng() * 1.6;
      // Keep the fishing-rod gap clear
      if (x > 3.5 && x < 5.5) continue;
      out.push({ x, z, s: 0.7 + rng() * 0.7, lean: (rng() - 0.5) * 0.35 });
    }
    return out;
  }, [visualLite]);

  useLayoutEffect(() => {
    const mesh = reedsRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    placements.forEach((p, i) => {
      dummy.position.set(p.x, p.s * 0.5 - 0.3, p.z);
      dummy.rotation.set(p.lean, 0, p.lean * 0.7);
      dummy.scale.set(1, p.s, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [placements]);

  return (
    <group ref={swayRef}>
      <instancedMesh ref={reedsRef} args={[getSharedCylinderGeometry(0.015, 0.03, 1, 4), undefined, placements.length]} frustumCulled={false}>
        <meshStandardMaterial color="#3c4a2c" roughness={0.95} />
      </instancedMesh>
    </group>
  );
}

function createPlankTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rng = pierSeededRandom(44021);

  ctx.fillStyle = '#4a3e30';
  ctx.fillRect(0, 0, size, size);

  // Planks with grain
  const plankH = 32;
  for (let y = 0; y < size; y += plankH) {
    ctx.fillStyle = `rgba(${30 + rng() * 24}, ${24 + rng() * 18}, ${14 + rng() * 12}, 0.45)`;
    ctx.fillRect(0, y, size, plankH - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, y + plankH - 2, size, 2);
    // Grain lines
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#241c10';
    for (let g = 0; g < 4; g++) {
      const gy = y + 4 + rng() * (plankH - 8);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(size * 0.3, gy + (rng() - 0.5) * 6, size * 0.7, gy + (rng() - 0.5) * 6, size, gy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.anisotropy = 4;
  tex.repeat.set(5, 5);
  return tex;
}
