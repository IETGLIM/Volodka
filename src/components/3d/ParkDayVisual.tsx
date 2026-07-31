
/* ─── Volodka RPG – Memorial Park procedural 3D visual ─── */

import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedConeGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedSphereGeometry,
} from '@/engine/three/moduleGeometryRegistry';

import { getEnvironmentLodProfile } from '@/engine/lod/distanceLod';
import { EnvironmentDetail, SceneClutterGate } from './lod/PropDistanceGate';
import { scratchColor } from '@/engine/three/frameScratch';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createParkHazySkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import { getIndustrialDampFloorSettings } from '@/engine/graphics/wetStreetScenes';

interface ParkDayVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const DISTANT_TREES: Array<[number, number, number]> = [
  [-8, 0, -8],
  [9, 0, -6],
  [-10, 0, 5],
  [7, 0, 9],
  [-5, 0, -12],
  [11, 0, 3],
];

/** Gothic/Dark Fantasy memorial park (30×30m) */
export function ParkDayVisual({ livePlayerPositionRef }: ParkDayVisualProps) {
  const groundTexture = useCachedCanvasTexture('park_day:ground', createParkGroundTexture);
  const envProfile = useMemo(() => getEnvironmentLodProfile('park_day'), []);
  const damp = useMemo(() => getIndustrialDampFloorSettings('park_day'), []);

  const W = 30;
  const D = 30;

  return (
    <group>
      {/* ── Overcast haze sky dome (fog-exempt) ── */}
      <ParkHazySkyDome />

      {/* ── Ground — mist dew sheen ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        <meshStandardMaterial
          map={groundTexture}
          color="#3a5a2a"
          roughness={damp?.roughness ?? 0.9}
          metalness={damp?.metalness ?? 0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Path (gravel) — dew polish ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow geometry={getSharedPlaneGeometry(2.5, 20)}>
        <meshStandardMaterial
          color="#7a7a70"
          roughness={damp ? Math.max(0.58, damp.roughness - 0.1) : 0.95}
          metalness={damp?.metalness ?? 0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {/* Cross path */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.025, 0]} receiveShadow geometry={getSharedPlaneGeometry(2.5, 20)}>
        <meshStandardMaterial
          color="#7a7a70"
          roughness={damp ? Math.max(0.58, damp.roughness - 0.1) : 0.95}
          metalness={damp?.metalness ?? 0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* Selective dew discs near path + obelisk (no planar reflector — mist hub) */}
      {damp && (
        <>
          <EnvironmentDetail minLod="full" position={[-1.2, 0.028, 1.8]}>
            <mesh rotation-x={-Math.PI / 2} position={[-1.2, 0.028, 1.8]} geometry={getSharedCircleGeometry(0.55, 12)}>
              <meshStandardMaterial
                color="#1a2a22"
                metalness={damp.oilMetalness}
                roughness={damp.oilRoughness}
                transparent
                opacity={0.4}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={1}
              />
            </mesh>
          </EnvironmentDetail>
          <EnvironmentDetail minLod="full" position={[1.4, 0.028, -1.2]}>
            <mesh rotation-x={-Math.PI / 2} position={[1.4, 0.028, -1.2]} geometry={getSharedCircleGeometry(0.42, 12)}>
              <meshStandardMaterial
                color="#182820"
                metalness={damp.oilMetalness}
                roughness={damp.oilRoughness}
                transparent
                opacity={0.36}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={1}
              />
            </mesh>
          </EnvironmentDetail>
          <EnvironmentDetail minLod="full" position={[0.3, 0.03, -3.2]}>
            <mesh rotation-x={-Math.PI / 2} position={[0.3, 0.03, -3.2]} geometry={getSharedCircleGeometry(0.48, 12)}>
              <meshStandardMaterial
                color="#2a3228"
                metalness={damp.oilMetalness * 0.9}
                roughness={damp.oilRoughness}
                transparent
                opacity={0.34}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={1}
              />
            </mesh>
          </EnvironmentDetail>
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ANCIENT TREES (distant — distance gated) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {DISTANT_TREES.map(([x, y, z]) => (
          <EnvironmentDetail key={`tree-lod-${x}-${z}`} minLod="standard" position={[x, y, z]}>
          <SceneClutterGate
            key={`tree-${x}-${z}`}
            livePlayerPositionRef={livePlayerPositionRef}
            position={[x, y, z]}
            maxDistance={envProfile.decorativeDistance}
          >
            <AncientTree position={[0, 0, 0]} />
          </SceneClutterGate>
          </EnvironmentDetail>
        ))}
      {/* Near trees moved to FOREGROUND layer */}

      {/* Misty tree belt beyond the fence — closes the horizon (3 draw calls) */}
      <MistyTreeBelt />

      {/* Ravens on the fence — gothic staffage (2 instanced draws) */}
      <Ravens />

      {/* Wrought iron entrance gate (south path) */}
      <ParkGate />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── STONE BENCHES (distant — MIDGROUND layer) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Near benches moved to FOREGROUND layer */}
      <EnvironmentDetail minLod="standard" position={[3, 0, -3]}>
        <SceneClutterGate
          livePlayerPositionRef={livePlayerPositionRef}
          position={[3, 0, -3]}
          maxDistance={envProfile.clutterDistance}
        >
          <StoneBench position={[0, 0, 0]} rotation={0.3} />
        </SceneClutterGate>
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── MEMORIAL OBELISK (center) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 0, -2]}>
        {/* Base */}
        <mesh position={[0, 0.15, 0]} castShadow geometry={getSharedBoxGeometry(1.5, 0.3, 1.5)}>
          <meshStandardMaterial color="#7a7a70" roughness={0.8} />
        </mesh>
        {/* Mid base */}
        <mesh position={[0, 0.5, 0]} castShadow geometry={getSharedBoxGeometry(1.1, 0.4, 1.1)}>
          <meshStandardMaterial color="#6a6a60" roughness={0.8} />
        </mesh>
        {/* Obelisk shaft */}
        <mesh position={[0, 2.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.15, 0.35, 4.0, 6)}>
          <meshStandardMaterial color="#7a7a70" roughness={0.7} />
        </mesh>
        {/* Obelisk tip */}
        <mesh position={[0, 4.7, 0]} castShadow geometry={getSharedConeGeometry(0.18, 0.4, 6)}>
          <meshStandardMaterial color="#8a8a80" roughness={0.6} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── IRON FENCE (perimeter) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Back fence */}
      {Array.from({ length: 12 }).map((_, i) => (
        <IronFencePost key={`bf-${i}`} position={[-13.5 + i * 2.5, 0, -14.5]} />
      ))}
      {/* Left fence */}
      {Array.from({ length: 12 }).map((_, i) => (
        <IronFencePost key={`lf-${i}`} position={[-14.5, 0, -13.5 + i * 2.5]} rotation={Math.PI / 2} />
      ))}
      {/* Right fence */}
      {Array.from({ length: 12 }).map((_, i) => (
        <IronFencePost key={`rf-${i}`} position={[14.5, 0, -13.5 + i * 2.5]} rotation={Math.PI / 2} />
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── MISTY POND (front-left) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-8, 0, 8]}>
        {/* Pond surface - polygonOffset prevents Z-fighting with ground */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} geometry={getSharedCircleGeometry(3, 16)}>
          <meshStandardMaterial
            color="#1a3a3a"
            metalness={damp ? Math.min(0.45, damp.oilMetalness + 0.2) : 0.3}
            roughness={damp ? Math.max(0.14, damp.oilRoughness - 0.28) : 0.2}
            transparent
            opacity={0.7}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        {/* Pond edge stones */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 3.1, 0.1, Math.sin(angle) * 3.1]} geometry={getSharedSphereGeometry(0.2, 6, 6)}>
              <meshStandardMaterial
                color="#6a6a60"
                roughness={damp ? Math.max(0.55, damp.roughness - 0.12) : 0.9}
                metalness={damp?.metalness ?? 0}
              />
            </mesh>
          );
        })}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── FALLEN LEAVES (scattered) ── */}
      {/* ═══════════════════════════════════════════════ */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = (Math.sin(i * 7.3) * 12);
        const z = (Math.cos(i * 5.1) * 12);
        return (
          <mesh key={`leaf-${i}`} rotation-x={-Math.PI / 2} position={[x, 0.03, z]} geometry={getSharedPlaneGeometry(0.15, 0.1)}>
            <meshStandardMaterial
              color={['#6a4020', '#8a5a20', '#5a3a10', '#7a4a18'][i % 4]}
              roughness={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Warm amber lamp near obelisk */}
      <pointLight position={[0, 3.5, -2]} color="#ffaa44" intensity={2.5} distance={14} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} />

      {/* Second amber lamp along path */}
      <pointLight position={[5, 3.5, 3]} color="#ffaa44" intensity={2.0} distance={12} />

      {/* Greenish pond glow */}
      <pointLight position={[-8, 0.5, 8]} color="#22aa66" intensity={1.5} distance={10} />

      {/* Overall ambient fill */}
      <pointLight position={[0, 5, 0]} color="#a0c0a0" intensity={1.0} distance={30} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Bench with graffiti ── */}
      <group position={[8, 0, 3]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow geometry={getSharedBoxGeometry(1.2, 0.08, 0.4)}>
          <meshStandardMaterial color="#7a7a70" roughness={0.85} />
        </mesh>
        <mesh position={[-0.5, 0.2, 0]} geometry={getSharedBoxGeometry(0.1, 0.4, 0.35)}>
          <meshStandardMaterial color="#6a6a60" roughness={0.85} />
        </mesh>
        <mesh position={[0.5, 0.2, 0]} geometry={getSharedBoxGeometry(0.1, 0.4, 0.35)}>
          <meshStandardMaterial color="#6a6a60" roughness={0.85} />
        </mesh>
        {/* Graffiti spray on bench */}
        <mesh position={[0, 0.42, 0.21]} geometry={getSharedPlaneGeometry(0.4, 0.1)}>
          <meshStandardMaterial color="#3a3a3a" emissive="#ff2244" emissiveIntensity={0.15} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* ── Bird on tree (tiny shape) ── */}
      <group position={[-8, 4.2, -8]}>
        <mesh geometry={getSharedSphereGeometry(0.06, 6, 6)}>
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
        </mesh>
        {/* Head */}
        <mesh position={[0.04, 0.04, 0]} geometry={getSharedSphereGeometry(0.03, 6, 6)}>
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Discarded newspaper on path ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[1.5, 0.04, -1.0]} geometry={getSharedPlaneGeometry(0.3, 0.2)}>
        <meshStandardMaterial color="#c8c0a0" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Legacy path puddle — driven by damp knobs when present */}
      <mesh rotation-x={-Math.PI / 2} position={[-1, 0.03, 2]} geometry={getSharedCircleGeometry(0.5, 12)}>
        <meshStandardMaterial
          color="#1a3a3a"
          metalness={damp?.oilMetalness ?? 0.5}
          roughness={damp ? Math.max(0.12, damp.oilRoughness - 0.3) : 0.1}
          transparent
          opacity={0.6}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
    </group>
  );
}

// Deterministic placement PRNG (same pattern as EnvironmentalAnimator)
function parkSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Instanced desaturated tree ring outside the iron fence — fills the misty horizon. */
function MistyTreeBelt() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);

  const placements = useMemo(() => {
    const rng = parkSeededRandom(331177);
    const out: Array<{ x: number; z: number; s: number; tint: number }> = [];
    const COUNT = 34;
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + rng() * 0.15;
      const radius = 16.5 + rng() * 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Keep the south path entrance open
      if (Math.abs(x) < 3 && z > 13) continue;
      out.push({ x, z, s: 0.8 + rng() * 0.6, tint: rng() });
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const trunk = trunkRef.current;
    const canopy = canopyRef.current;
    if (!trunk || !canopy) return;
    const dummy = new THREE.Object3D();
    scratchColor.set('#ffffff');
    const color = scratchColor;
    placements.forEach((p, i) => {
      const trunkH = 3.0 * p.s;
      dummy.position.set(p.x, trunkH * 0.5, p.z);
      dummy.scale.set(p.s, p.s, p.s);
      dummy.rotation.set(0, p.tint * Math.PI * 2, 0);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, trunkH + 1.3 * p.s, p.z);
      dummy.updateMatrix();
      canopy.setMatrixAt(i, dummy.matrix);
      // Desaturated gothic greens fading toward fog gray
      color.setHSL(0.28 + p.tint * 0.03, 0.18 + p.tint * 0.1, 0.16 + p.tint * 0.06);
      canopy.setColorAt(i, color);
    });
    trunk.instanceMatrix.needsUpdate = true;
    canopy.instanceMatrix.needsUpdate = true;
    if (canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
  }, [placements]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[getSharedCylinderGeometry(0.18, 0.32, 3.0, 6), undefined, placements.length]} frustumCulled={false}>
        <meshStandardMaterial color="#2e241c" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[getSharedSphereGeometry(1.9, 7, 6), undefined, placements.length]} frustumCulled={false}>
        <meshStandardMaterial color="#2a3a24" roughness={0.95} />
      </instancedMesh>
    </group>
  );
}

/** Instanced ravens perched on fence posts (bodies + heads, 2 draws). */
const RAVEN_PERCHES: Array<{ x: number; y: number; z: number; yaw: number }> = [
  { x: -13.5 + 2 * 2.5, y: 1.32, z: -14.5, yaw: 0.4 },
  { x: -13.5 + 7 * 2.5, y: 1.32, z: -14.5, yaw: -0.6 },
  { x: -14.5, y: 1.32, z: -13.5 + 4 * 2.5, yaw: 1.7 },
  { x: 14.5, y: 1.32, z: -13.5 + 8 * 2.5, yaw: -1.4 },
  { x: 14.5, y: 1.32, z: -13.5 + 2 * 2.5, yaw: -2.0 },
  { x: 0.15, y: 4.95, z: -2, yaw: 0.9 }, // on the obelisk tip
];

function Ravens() {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const head = headRef.current;
    if (!body || !head) return;
    const dummy = new THREE.Object3D();
    RAVEN_PERCHES.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.yaw, 0);
      dummy.scale.set(1, 1, 1.5); // stretched body
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);

      dummy.position.set(
        p.x + Math.sin(p.yaw) * 0.09,
        p.y + 0.06,
        p.z + Math.cos(p.yaw) * 0.09,
      );
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      head.setMatrixAt(i, dummy.matrix);
    });
    body.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[getSharedSphereGeometry(0.07, 6, 5), undefined, RAVEN_PERCHES.length]} frustumCulled={false}>
        <meshStandardMaterial color="#16161c" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[getSharedSphereGeometry(0.04, 5, 4), undefined, RAVEN_PERCHES.length]} frustumCulled={false}>
        <meshStandardMaterial color="#101016" roughness={0.85} />
      </instancedMesh>
    </group>
  );
}

/** Wrought iron entrance gate at the south end of the path. */
function ParkGate() {
  return (
    <group position={[0, 0, 14.5]}>
      {/* Stone pillars */}
      {[-1.6, 1.6].map((x) => (
        <group key={`pillar-${x}`} position={[x, 0, 0]}>
          <mesh position={[0, 1.1, 0]} castShadow geometry={getSharedBoxGeometry(0.5, 2.2, 0.5)}>
            <meshStandardMaterial color="#6a6a60" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.32, 0]} castShadow geometry={getSharedConeGeometry(0.38, 0.35, 4)}>
            <meshStandardMaterial color="#5a5a50" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Arch */}
      <mesh position={[0, 2.5, 0]} geometry={getSharedBoxGeometry(3.6, 0.12, 0.08)}>
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Open gate leaves (swung inward) */}
      {[-1, 1].map((side) => (
        <group key={`leaf-${side}`} position={[side * 1.3, 0, 0]} rotation={[0, side * 0.9, 0]}>
          <mesh position={[side * -0.55, 0.9, 0]} geometry={getSharedBoxGeometry(1.1, 1.6, 0.04)}>
            <meshStandardMaterial color="#26262e" metalness={0.65} roughness={0.45} transparent opacity={0.92} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Ancient tree with trunk and canopy */
function AncientTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.2, 0.4, 3.0, 8)}>
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Canopy layers */}
      <mesh position={[0, 3.8, 0]} castShadow geometry={getSharedSphereGeometry(2.5, 8, 8)}>
        <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
      </mesh>
      <mesh position={[0.8, 4.2, 0.5]} castShadow geometry={getSharedSphereGeometry(1.5, 8, 6)}>
        <meshStandardMaterial color="#3a5a2a" roughness={0.95} />
      </mesh>
      <mesh position={[-0.6, 3.5, -0.6]} castShadow geometry={getSharedSphereGeometry(1.2, 8, 6)}>
        <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Stone bench */
function StoneBench({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.4, 0]} castShadow geometry={getSharedBoxGeometry(1.2, 0.08, 0.4)}>
        <meshStandardMaterial color="#7a7a70" roughness={0.85} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.5, 0.2, 0]} geometry={getSharedBoxGeometry(0.1, 0.4, 0.35)}>
        <meshStandardMaterial color="#6a6a60" roughness={0.85} />
      </mesh>
      <mesh position={[0.5, 0.2, 0]} geometry={getSharedBoxGeometry(0.1, 0.4, 0.35)}>
        <meshStandardMaterial color="#6a6a60" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Iron fence post */
function IronFencePost({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Post */}
      <mesh position={[0, 0.6, 0]} castShadow geometry={getSharedBoxGeometry(0.04, 1.2, 0.04)}>
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 1.25, 0]} geometry={getSharedSphereGeometry(0.05, 6, 6)}>
        <meshStandardMaterial color="#2a2a30" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Horizontal rail */}
      <mesh position={[0, 0.8, 0]} geometry={getSharedBoxGeometry(2.4, 0.03, 0.03)}>
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Bottom rail */}
      <mesh position={[0, 0.3, 0]} geometry={getSharedBoxGeometry(2.4, 0.03, 0.03)}>
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function createParkGroundTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark grass base
  ctx.fillStyle = '#3a5a2a';
  ctx.fillRect(0, 0, size, size);

  // Grass variation
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? '#4a6a3a' : '#2a4a1a';
    ctx.fillRect(x, y, Math.random() * 20 + 5, Math.random() * 10 + 3);
  }

  // Overgrown patches
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#5a7a4a';
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 15 + 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

function ParkHazySkyDome() {
  const skyTexture = useCachedCanvasTexture('park_day:hazy-sky', createParkHazySkyTexture);

  return (
    <mesh position={[0, 4, 0]} renderOrder={-10}>
      <sphereGeometry args={[55, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      <meshBasicMaterial map={skyTexture} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}
