
/* ─── Volodka RPG – River Pier at night: second ЧК hangout ───
 *  Wooden pier over dark water. Barrel fire, port wine, a guitar against a
 *  crate, string lights, an old boat, moon road on the river. The forest of
 *  Zorge has a sibling now.
 */

import { useLayoutEffect, useMemo, useRef, useEffect, type MutableRefObject } from 'react';
import * as THREE from 'three';
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
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { SceneBackdropShell } from './SceneBackdropShell';
import { WetStreetGround } from './WetStreetGround';
import type { SceneId } from '@/shared/types/game';

interface RiverPierVisualProps {
  sceneId?: SceneId;
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
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
  const { preset } = useGraphicsQuality();
  const useGltfDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  const useAuthoredBackdrop = !preset.visualLite && useGltfDressing;
  // Medium+ (hybrid/glb): prop dressing + backdrop own the dock; hide procedural edge clutter.
  const hideDockClutter = useGltfDressing;
  const plankTexture = useCachedCanvasTexture('river_pier:planks', createPlankTexture);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const waterRef = useRef<THREE.Mesh>(null);
  const fireRef = useRef<THREE.Mesh>(null);
  const moonRoadRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);

  useFrameTick('misc', ({ delta }) => {
    tRef.current += delta;
    const t = tRef.current;
    if (fireRef.current) {
      fireRef.current.scale.y = 0.85 + Math.sin(t * 9) * 0.18 + Math.sin(t * 17) * 0.08;
      fireRef.current.rotation.y = t * 0.8;
    }
    if (waterRef.current) {
      // Slow breathing of the water plane
      waterRef.current.position.y = -0.35 + Math.sin(t * 0.5) * 0.03;
    }
    if (moonRoadRef.current) {
      (moonRoadRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.16 + Math.sin(t * 0.7) * 0.05;
    }
  });

  const waterMetalness = 0.85 + Math.min(0.12, rainIntensity * 0.12);
  const waterRoughness = Math.max(0.08, 0.18 - rainIntensity * 0.08);

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
        <meshStandardMaterial
          map={plankTexture}
          color="#4a3e30"
          roughness={Math.max(0.35, 0.9 - rainIntensity * 0.4)}
          metalness={0.05 + rainIntensity * 0.18}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Water — dark plane stretching south past the railing ── */}
      <mesh ref={waterRef} rotation-x={-Math.PI / 2} position={[0, -0.35, -26]} geometry={getSharedPlaneGeometry(90, 44)}>
        <meshStandardMaterial
          color="#0d1b26"
          metalness={waterMetalness}
          roughness={waterRoughness}
          transparent
          opacity={0.94}
        />
      </mesh>
      {/* Moon road on the water (fog-exempt shimmer) */}
      <mesh ref={moonRoadRef} rotation-x={-Math.PI / 2} position={[5, -0.33, -22]} geometry={getSharedPlaneGeometry(2.2, 30)}>
        <meshBasicMaterial color="#cdd8ee" transparent opacity={0.18} fog={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ── Night sky: moon + stars (fog-exempt) ── */}
      <PierNightSky />

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

      {/* ── Pier railing along the water edge ── */}
      {!hideDockClutter ? <PierRailing /> : null}

      {/* ── Pilings under the deck edge ── */}
      {!hideDockClutter
        ? [-10, -6, -2, 2, 6, 10].map((x) => (
        <mesh key={`piling-${x}`} position={[x, -0.5, -9.2]} geometry={getSharedCylinderGeometry(0.14, 0.16, 1.6, 7)}>
          <meshStandardMaterial color="#2c2419" roughness={0.95} />
        </mesh>
      ))
        : null}

      {/* ── Barrel fire — keep animated flame; barrel mesh owned by prop dressing ── */}
      <group position={[0, 0, -2]}>
        {!useGltfDressing ? (
        <mesh position={[0, 0.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.34, 0.32, 1.0, 12)}>
          <meshStandardMaterial color="#3a3026" metalness={0.55} roughness={0.6} />
        </mesh>
        ) : null}
        {/* Glow holes punched in the barrel */}
        {!useGltfDressing
          ? [0.4, 1.6, 2.9, 4.2].map((a) => (
          <mesh key={`hole-${a}`} position={[Math.cos(a) * 0.33, 0.45, Math.sin(a) * 0.33]} rotation={[0, -a + Math.PI / 2, 0]} geometry={getSharedCircleGeometry(0.045, 8)}>
            <meshStandardMaterial color="#200a00" emissive="#ff7722" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        ))
          : null}
        <mesh ref={fireRef} position={[0, 1.15, 0]} geometry={getSharedConeGeometry(0.22, 0.5, 8)}>
          <meshStandardMaterial color="#ff6622" emissive="#ff4400" emissiveIntensity={2.6} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* ── Crate seats around the fire ── */}
      {!useGltfDressing
        ? [
        { pos: [-1.6, -1.2] as const, rot: 0.3 },
        { pos: [1.7, -1.4] as const, rot: -0.5 },
        { pos: [0.4, -3.6] as const, rot: 1.1 },
      ].map((crate, i) => (
        <mesh key={`crate-${i}`} position={[crate.pos[0], 0.25, crate.pos[1]]} rotation={[0, crate.rot, 0]} castShadow geometry={getSharedBoxGeometry(0.65, 0.5, 0.65)}>
          <meshStandardMaterial color="#54422c" roughness={0.9} />
        </mesh>
      ))
        : null}

      {/* ── Port wine: bottles + tin cups on a crate-table ── */}
      {!useGltfDressing ? (
      <group position={[-0.7, 0, -2.9]}>
        <mesh position={[0, 0.2, 0]} castShadow geometry={getSharedBoxGeometry(0.55, 0.4, 0.45)}>
          <meshStandardMaterial color="#4a3a26" roughness={0.9} />
        </mesh>
        <mesh position={[-0.12, 0.55, 0.05]} castShadow geometry={getSharedCylinderGeometry(0.042, 0.048, 0.3, 8)}>
          <meshStandardMaterial color="#2a0814" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0.14, 0.52, -0.08]} castShadow geometry={getSharedCylinderGeometry(0.04, 0.045, 0.26, 8)}>
          <meshStandardMaterial color="#1c0610" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0.05, 0.44, 0.14]} geometry={getSharedCylinderGeometry(0.035, 0.03, 0.08, 8)}>
          <meshStandardMaterial color="#8a8d90" metalness={0.8} roughness={0.35} />
        </mesh>
      </group>
      ) : null}

      {/* ── Guitar against a crate — ScenePropDressing owns High/Ultra ── */}
      {!useGltfDressing ? (
      <group position={[2.4, 0, -2.6]} rotation={[0, -0.7, 0]}>
        <mesh position={[0, 0.42, 0]} rotation={[0.18, 0, -0.3]} castShadow geometry={getSharedCylinderGeometry(0.26, 0.3, 0.09, 12)}>
          <meshStandardMaterial color="#7a4f24" roughness={0.55} />
        </mesh>
        <mesh position={[0.18, 0.85, 0.02]} rotation={[0.18, 0, -0.3]} castShadow geometry={getSharedBoxGeometry(0.05, 0.75, 0.04)}>
          <meshStandardMaterial color="#3c2a16" roughness={0.6} />
        </mesh>
      </group>
      ) : null}

      {/* ── Old overturned boat on the bank — prop dressing owns tyre/crate clutter ── */}
      {!hideDockClutter ? (
      <group position={[-6, 0, 3]} rotation={[0, 0.4, Math.PI]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.7, 2.8, 7, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#3f4a50" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      </group>
      ) : null}

      {/* ── Fishing rod leaning on the railing ── */}
      {!hideDockClutter ? (
      <mesh position={[4.5, 0.7, -8.2]} rotation={[0.5, 0, 0.15]} castShadow geometry={getSharedCylinderGeometry(0.012, 0.02, 2.4, 5)}>
        <meshStandardMaterial color="#5a4a34" roughness={0.8} />
      </mesh>
      ) : null}

      {/* ── String lights between two poles ── */}
      <StringLights />

      {/* ── Reeds along the bank edges ── */}
      {!hideDockClutter ? <Reeds /> : null}

      {/* ── Scene-level ambient lighting ── */}
      {/* Moonlight — cold blue overhead illumination for the pier */}
      <pointLight position={[5, 15, -22]} color="#8a9ab8" intensity={1.5} distance={35} decay={1.5} />

      {/* Warm fill from barrel fire area — extends the fire's reach */}
      <pointLight position={[0, 3, 5]} color="#ff9944" intensity={1.2} distance={10} decay={2} />
    </group>
  );
}

/* ── Moon + sparse stars over the river ── */
function PierNightSky() {
  const starGeometry = useMemo(() => {
    const rng = pierSeededRandom(880011);
    const COUNT = 140;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = rng() * Math.PI; // southern hemisphere band over the water
      const phi = rng() * Math.PI * 0.4;
      const r = 50;
      positions[i * 3] = Math.cos(theta + Math.PI / 2) * Math.sin(phi + 0.2) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r * 0.5 + 8;
      positions[i * 3 + 2] = -Math.abs(Math.sin(theta + Math.PI / 2)) * Math.sin(phi + 0.2) * r - 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // R3F auto-disposes JSX <pointsMaterial> but NOT geometry passed via the
  // `geometry` prop — dispose on unmount / when starGeometry changes.
  useEffect(() => {
    const geo = starGeometry;
    return () => {
      geo.dispose();
    };
  }, [starGeometry]);

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
  return (
    <group position={[0, 0, -8.5]}>
      {[-6, -4, -2, 0, 2, 4, 6].map((x) => (
        <mesh key={`post-${x}`} position={[x, 0.5, 0]} castShadow geometry={getSharedCylinderGeometry(0.04, 0.05, 1.0, 6)}>
          <meshStandardMaterial color="#4c4438" metalness={0.4} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.92, 0]} geometry={getSharedBoxGeometry(13, 0.06, 0.06)}>
        <meshStandardMaterial color="#564c3e" metalness={0.4} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0]} geometry={getSharedBoxGeometry(13, 0.04, 0.04)}>
        <meshStandardMaterial color="#4c4438" metalness={0.4} roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ── String lights: catenary of warm bulbs (1 instanced draw + wire) ── */
const BULB_COUNT = 11;

function StringLights() {
  const bulbsRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = bulbsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < BULB_COUNT; i++) {
      const f = i / (BULB_COUNT - 1);
      const x = -4 + f * 8;
      // Catenary sag
      const y = 2.6 - Math.sin(f * Math.PI) * 0.5;
      dummy.position.set(x, y, -4);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
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
      <instancedMesh ref={bulbsRef} args={[getSharedSphereGeometry(0.05, 6, 5), undefined, BULB_COUNT]} frustumCulled={false}>
        <meshStandardMaterial color="#4a2c08" emissive="#ffc266" emissiveIntensity={1.8} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* ── Instanced reeds along the bank (1 draw call) ── */
function Reeds() {
  const reedsRef = useRef<THREE.InstancedMesh>(null);

  const placements = useMemo(() => {
    const rng = pierSeededRandom(551234);
    const out: Array<{ x: number; z: number; s: number; lean: number }> = [];
    for (let i = 0; i < 40; i++) {
      const x = -12 + rng() * 24;
      const z = -7.6 - rng() * 1.6;
      // Keep the fishing-rod gap clear
      if (x > 3.5 && x < 5.5) continue;
      out.push({ x, z, s: 0.7 + rng() * 0.7, lean: (rng() - 0.5) * 0.35 });
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const mesh = reedsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
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
    <instancedMesh ref={reedsRef} args={[getSharedCylinderGeometry(0.015, 0.03, 1, 4), undefined, placements.length]} frustumCulled={false}>
      <meshStandardMaterial color="#3c4a2c" roughness={0.95} />
    </instancedMesh>
  );
}

function createPlankTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a3e30';
  ctx.fillRect(0, 0, size, size);

  // Planks with grain
  const plankH = 32;
  for (let y = 0; y < size; y += plankH) {
    ctx.fillStyle = `rgba(${30 + Math.random() * 24}, ${24 + Math.random() * 18}, ${14 + Math.random() * 12}, 0.45)`;
    ctx.fillRect(0, y, size, plankH - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, y + plankH - 2, size, 2);
    // Grain lines
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#241c10';
    for (let g = 0; g < 4; g++) {
      const gy = y + 4 + Math.random() * (plankH - 8);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(size * 0.3, gy + (Math.random() - 0.5) * 6, size * 0.7, gy + (Math.random() - 0.5) * 6, size, gy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  return tex;
}
