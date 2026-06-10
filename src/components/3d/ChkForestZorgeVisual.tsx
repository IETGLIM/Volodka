
/* ─── ЧК · Лес · Зорге — secret society clearing (procedural forest) ─── */

import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { getEnvironmentLodProfile } from '@/engine/lod/distanceLod';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail, SceneClutterGate } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';

interface ChkForestZorgeVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 36;
const D = 36;

// ─── Seeded random for deterministic placement ───
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Night forest clearing: campfire, port wine crates, guitar spot */
export function ChkForestZorgeVisual({ livePlayerPositionRef }: ChkForestZorgeVisualProps) {
  const groundTexture = useCachedCanvasTexture('chk_forest_zorge:ground', createForestGroundTexture);
  const { lod } = useEnvironmentLod();
  const envProfile = useMemo(() => getEnvironmentLodProfile('chk_forest_zorge'), []);
  const fireLightRef = useRef<THREE.PointLight>(null);
  const fireMeshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);

  useFrameTick('misc', ({ delta }) => {
    tRef.current += delta;
    const flicker = 0.85 + Math.sin(tRef.current * 11) * 0.08 + Math.sin(tRef.current * 23) * 0.05;
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 3.2 * flicker;
    }
    if (fireMeshRef.current) {
      fireMeshRef.current.scale.y = 0.9 + Math.sin(tRef.current * 9) * 0.15;
    }
  });

  const treePlacements: Array<{
    pos: [number, number, number];
    seed: number;
    preset: string;
    scale: number;
    rot: number;
  }> = [
    { pos: [-10, 0, -8], seed: 101, preset: 'Oak Large', scale: 1.1, rot: 0.2 },
    { pos: [11, 0, -9], seed: 202, preset: 'Pine Small', scale: 1.0, rot: -0.4 },
    { pos: [-12, 0, 6], seed: 303, preset: 'Oak Medium', scale: 0.95, rot: 0.8 },
    { pos: [9, 0, 10], seed: 404, preset: 'Birch Medium', scale: 1.05, rot: -0.6 },
    { pos: [-6, 0, -13], seed: 505, preset: 'Pine Medium', scale: 1.15, rot: 0.1 },
    { pos: [13, 0, 2], seed: 606, preset: 'Oak Small', scale: 0.9, rot: 1.2 },
    { pos: [-14, 0, -2], seed: 707, preset: 'Pine Large', scale: 1.2, rot: 0.5 },
    { pos: [5, 0, -14], seed: 808, preset: 'Oak Medium', scale: 1.0, rot: -0.2 },
    { pos: [-8, 0, 12], seed: 909, preset: 'Birch Small', scale: 0.85, rot: 0.9 },
    { pos: [12, 0, -4], seed: 111, preset: 'Pine Medium', scale: 1.05, rot: -0.8 },
  ];

  return (
    <group>
      {/* Ground — mossy clearing */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={groundTexture}
          color="#2a4a22"
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* Dirt path from north edge */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, -14]} receiveShadow>
        <planeGeometry args={[2.2, 8]} />
        <meshStandardMaterial color="#4a3a28" roughness={1} />
      </mesh>

      {/* Forest perimeter — lightweight procedural trees (no ez-tree bundle) */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
        {treePlacements.map((t) => (
          <SceneClutterGate
            key={t.seed}
            livePlayerPositionRef={livePlayerPositionRef}
            position={t.pos}
            maxDistance={envProfile.decorativeDistance}
          >
            <ForestTree
              position={[0, 0, 0]}
              preset={t.preset}
              scale={t.scale}
              rotation={t.rot}
            />
          </SceneClutterGate>
        ))}
      </EnvironmentDetail>

      {/* Dense instanced tree belt — closes the clearing into an actual forest */}
      <InstancedTreeBelt />

      {/* Night sky: moon disc + starfield (fog-exempt, skybox is disabled here) */}
      <NightSky />

      {/* Fireflies drifting around the campfire */}
      <Fireflies />

      {/* Fallen logs, stumps and boulders along the clearing edge */}
      <ForestFloorClutter />

      {/* Campfire ring */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={`log-${i}`} position={[Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55]} rotation={[0, a, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
              <meshStandardMaterial color="#3a2818" roughness={0.9} />
            </mesh>
          );
        })}
        <mesh ref={fireMeshRef} position={[0, 0.35, 0]}>
          <coneGeometry args={[0.25, 0.55, 8]} />
          <meshStandardMaterial color="#ff6622" emissive="#ff4400" emissiveIntensity={2.5} transparent opacity={0.85} />
        </mesh>
        <pointLight ref={fireLightRef} color="#ff8833" intensity={3.2} distance={14} position={[0, 1.2, 0]} castShadow />
      </group>

      {/* Log seats around fire */}
      {[
        [-2.2, 0, 0.8],
        [2.2, 0, 0.6],
        [0.5, 0, -2.0],
        [-0.8, 0, 2.1],
        [-1.8, 0, -1.5],
      ].map(([x, y, z], i) => (
        <mesh key={`seat-${i}`} position={[x, y + 0.12, z]} rotation={[0, i * 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.2, 0.24, 8]} />
          <meshStandardMaterial color="#4a3520" roughness={0.85} />
        </mesh>
      ))}

      {/* Port wine crate + bottles */}
      <group position={[1.8, 0, 1.6]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.7, 0.4, 0.5]} />
          <meshStandardMaterial color="#5a3020" roughness={0.8} />
        </mesh>
        <mesh position={[-0.15, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.28, 8]} />
          <meshStandardMaterial color="#2a0818" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0.12, 0.46, 0.08]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.24, 8]} />
          <meshStandardMaterial color="#1a0610" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* Guitar lean spot (Элис) */}
      <group position={[-1.6, 0, -1.2]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.55, 0]} rotation={[0.15, 0, -0.25]} castShadow>
          <boxGeometry args={[0.35, 0.55, 0.06]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
      </group>

      {/* Portable speaker (heavy music) */}
      <mesh position={[2.5, 0.25, -1.0]} castShadow>
        <boxGeometry args={[0.35, 0.5, 0.25]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Zorge street sign — rusted marker at path entrance */}
      <group position={[0, 0, -16]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[1.4, 0.35, 0.06]} />
          <meshStandardMaterial color="#555548" roughness={0.85} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.8, 6]} />
          <meshStandardMaterial color="#444440" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

type ForestTreePreset = 'Oak Large' | 'Oak Medium' | 'Oak Small' | 'Pine Large' | 'Pine Medium' | 'Pine Small' | 'Birch Large' | 'Birch Medium' | 'Birch Small' | string;

function ForestTree({
  position,
  preset,
  scale = 1,
  rotation = 0,
}: {
  position: [number, number, number];
  preset: ForestTreePreset;
  scale?: number;
  rotation?: number;
}) {
  const kind = preset.startsWith('Pine') ? 'pine' : preset.startsWith('Birch') ? 'birch' : 'oak';
  const size = preset.includes('Large') ? 'large' : preset.includes('Small') ? 'small' : 'medium';

  const trunkH = (kind === 'pine' ? 3.2 : 2.6) * scale * (size === 'large' ? 1.15 : size === 'small' ? 0.85 : 1);
  const trunkR = (kind === 'birch' ? 0.14 : 0.22) * scale;
  const trunkColor = kind === 'birch' ? '#c8c0b0' : '#3a2a1a';
  const leafColor = kind === 'pine' ? '#1a3a18' : kind === 'birch' ? '#4a6a38' : '#2a4a1a';
  const leafColor2 = kind === 'pine' ? '#234822' : '#3a5a2a';

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, trunkH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[trunkR * 0.7, trunkR, trunkH, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      {kind === 'pine' ? (
        <>
          <mesh position={[0, trunkH + 0.9 * scale, 0]} castShadow>
            <coneGeometry args={[1.3 * scale * (size === 'large' ? 1.2 : 1), 2.2 * scale, 8]} />
            <meshStandardMaterial color={leafColor} roughness={0.95} />
          </mesh>
          <mesh position={[0, trunkH + 1.9 * scale, 0]} castShadow>
            <coneGeometry args={[1.0 * scale, 1.8 * scale, 8]} />
            <meshStandardMaterial color={leafColor2} roughness={0.95} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, trunkH + 0.8 * scale, 0]} castShadow>
            <sphereGeometry args={[1.4 * scale * (size === 'large' ? 1.2 : size === 'small' ? 0.85 : 1), 8, 8]} />
            <meshStandardMaterial color={leafColor} roughness={0.95} />
          </mesh>
          <mesh position={[0.5 * scale, trunkH + 1.2 * scale, 0.3 * scale]} castShadow>
            <sphereGeometry args={[0.9 * scale, 8, 6]} />
            <meshStandardMaterial color={leafColor2} roughness={0.95} />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ─── Dense instanced tree belt around the clearing ───
 * 3 draw calls total (trunks + two canopy layers) for ~46 trees.
 * A gap is left at the north path entrance (exit to park). */
function InstancedTreeBelt() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyLowRef = useRef<THREE.InstancedMesh>(null);
  const canopyTopRef = useRef<THREE.InstancedMesh>(null);

  const placements = useMemo(() => {
    const rng = seededRandom(777001);
    const out: Array<{ x: number; z: number; s: number; rot: number; tint: number }> = [];
    const COUNT = 46;
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + rng() * 0.12;
      const radius = 15.5 + rng() * 3.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Path gap at north entrance (exit corridor to park)
      if (Math.abs(x) < 3.2 && z < -12) continue;
      out.push({ x, z, s: 0.85 + rng() * 0.5, rot: rng() * Math.PI * 2, tint: rng() });
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const trunk = trunkRef.current;
    const low = canopyLowRef.current;
    const top = canopyTopRef.current;
    if (!trunk || !low || !top) return;

    placements.forEach((p, i) => {
      const trunkH = 3.4 * p.s;

      dummy.position.set(p.x, trunkH * 0.5, p.z);
      dummy.rotation.set(0, p.rot, 0);
      dummy.scale.set(p.s, p.s, p.s);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, trunkH + 1.0 * p.s, p.z);
      dummy.updateMatrix();
      low.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.32 + p.tint * 0.04, 0.45, 0.13 + p.tint * 0.05);
      low.setColorAt(i, color);

      dummy.position.set(p.x, trunkH + 2.1 * p.s, p.z);
      dummy.scale.set(p.s * 0.8, p.s * 0.9, p.s * 0.8);
      dummy.updateMatrix();
      top.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.33 + p.tint * 0.04, 0.42, 0.17 + p.tint * 0.05);
      top.setColorAt(i, color);
    });

    trunk.instanceMatrix.needsUpdate = true;
    low.instanceMatrix.needsUpdate = true;
    top.instanceMatrix.needsUpdate = true;
    if (low.instanceColor) low.instanceColor.needsUpdate = true;
    if (top.instanceColor) top.instanceColor.needsUpdate = true;
  }, [placements]);

  const count = placements.length;

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
        <cylinderGeometry args={[0.16, 0.26, 3.4, 6]} />
        <meshStandardMaterial color="#33241a" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={canopyLowRef} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
        <coneGeometry args={[1.5, 2.6, 7]} />
        <meshStandardMaterial color="#1c3a1a" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={canopyTopRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <coneGeometry args={[1.1, 2.0, 7]} />
        <meshStandardMaterial color="#234822" roughness={0.95} />
      </instancedMesh>
    </group>
  );
}

/* ─── Moon + starfield — fog-exempt night sky (scene skybox is disabled) ─── */
function NightSky() {
  const starGeometry = useMemo(() => {
    const rng = seededRandom(424242);
    const COUNT = 180;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Upper hemisphere dome
      const theta = rng() * Math.PI * 2;
      const phi = rng() * Math.PI * 0.42; // keep above horizon
      const r = 27;
      positions[i * 3] = Math.cos(theta) * Math.sin(phi + 0.18) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r * 0.65 + 6;
      positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi + 0.18) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <group>
      <points geometry={starGeometry}>
        <pointsMaterial
          color="#cdd6ff"
          size={1.6}
          sizeAttenuation={false}
          transparent
          opacity={0.85}
          fog={false}
          depthWrite={false}
        />
      </points>
      {/* Moon disc with soft halo */}
      <group position={[9, 19, -22]}>
        <mesh>
          <circleGeometry args={[1.6, 24]} />
          <meshBasicMaterial color="#e8ecf5" fog={false} />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <circleGeometry args={[2.6, 24]} />
          <meshBasicMaterial color="#9aa8cc" transparent opacity={0.22} fog={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ─── Fireflies — drifting additive points near the campfire ─── */
const FIREFLY_COUNT = 36;

function Fireflies() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  const { geometry, basePositions, phases } = useMemo(() => {
    const rng = seededRandom(99173);
    const base = new Float32Array(FIREFLY_COUNT * 3);
    const ph = new Float32Array(FIREFLY_COUNT);
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 1.2 + rng() * 3.4;
      base[i * 3] = Math.cos(angle) * radius;
      base[i * 3 + 1] = 0.4 + rng() * 1.5;
      base[i * 3 + 2] = Math.sin(angle) * radius;
      ph[i] = rng() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
    return { geometry: geo, basePositions: base, phases: ph };
  }, []);

  useFrameTick('misc', ({ delta }) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const points = pointsRef.current;
    if (!points) return;
    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const p = phases[i];
      arr[i * 3] = basePositions[i * 3] + Math.sin(t * 0.6 + p) * 0.45;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] + Math.sin(t * 0.9 + p * 2) * 0.25;
      arr[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(t * 0.5 + p) * 0.45;
    }
    attr.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = 0.65 + Math.sin(t * 2.2) * 0.2;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} position={[0, 0, 0]}>
      <pointsMaterial
        ref={materialRef}
        color="#b8ff5e"
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Fallen logs, stumps, boulders, instanced underbrush ─── */
function ForestFloorClutter() {
  const bushRef = useRef<THREE.InstancedMesh>(null);

  const bushes = useMemo(() => {
    const rng = seededRandom(555333);
    const out: Array<{ x: number; z: number; s: number }> = [];
    for (let i = 0; i < 16; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 10 + rng() * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (Math.abs(x) < 2.5 && z < -10) continue; // keep path clear
      out.push({ x, z, s: 0.5 + rng() * 0.6 });
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const mesh = bushRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    bushes.forEach((b, i) => {
      dummy.position.set(b.x, b.s * 0.45, b.z);
      dummy.scale.set(b.s * 1.3, b.s, b.s * 1.3);
      dummy.rotation.set(0, b.x * 7.3, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [bushes]);

  return (
    <group>
      <instancedMesh ref={bushRef} args={[undefined, undefined, bushes.length]} frustumCulled={false}>
        <sphereGeometry args={[0.6, 7, 5]} />
        <meshStandardMaterial color="#22381c" roughness={0.95} />
      </instancedMesh>

      {/* Fallen logs */}
      {[
        { pos: [-6.5, 0.22, 7.5] as const, rot: 0.8, len: 3.2 },
        { pos: [7.8, 0.2, -3.5] as const, rot: -0.5, len: 2.6 },
        { pos: [-4.0, 0.18, -9.0] as const, rot: 1.9, len: 2.2 },
      ].map((log, i) => (
        <mesh
          key={`fallen-${i}`}
          position={[log.pos[0], log.pos[1], log.pos[2]]}
          rotation={[0, log.rot, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.2, 0.24, log.len, 7]} />
          <meshStandardMaterial color="#41301f" roughness={0.95} />
        </mesh>
      ))}

      {/* Stumps */}
      {[
        [-9.5, 0.25, 1.5],
        [5.5, 0.22, 9.5],
      ].map(([x, y, z], i) => (
        <mesh key={`stump-${i}`} position={[x, y, z]} castShadow>
          <cylinderGeometry args={[0.3, 0.38, 0.5, 8]} />
          <meshStandardMaterial color="#3a2c1c" roughness={0.95} />
        </mesh>
      ))}

      {/* Boulders */}
      {[
        { pos: [-11, 0.3, -4] as const, s: 0.7 },
        { pos: [10.5, 0.35, 4.5] as const, s: 0.85 },
        { pos: [3.5, 0.22, 11.5] as const, s: 0.5 },
      ].map((b, i) => (
        <mesh key={`boulder-${i}`} position={[b.pos[0], b.pos[1], b.pos[2]]} scale={b.s} castShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#4e5350" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function createForestGroundTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2a4a22';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const g = 30 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgb(${g - 10},${g + 20},${g - 15})`;
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}
