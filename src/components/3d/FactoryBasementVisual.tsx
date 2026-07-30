
/* ─── Volodka RPG – Factory Basement: the reliquary of «Заря-М» ───
 *  Dense industrial catacombs under the abandoned factory. Server rack rows,
 *  dripping pipes, puddles — and the green-pulsing monolith of «Заря-М»
 *  at the far wall (act 5 machine confession happens here).
 */

import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { scratchColor } from '@/engine/three/frameScratch';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedSphereGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createFactoryBasementCoreGlowTexture } from '@/engine/graphics/proceduralSkyTextures';
import {
  getIndustrialDampFloorSettings,
  getRainSpillInFloorBoost,
} from '@/engine/graphics/wetStreetScenes';
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { INTERIOR_SHELL_MODELS } from '@/config/interiorShellModels';
import { AuthoredInteriorShell } from './AuthoredInteriorShell';
import { EnvironmentDetail } from './lod/PropDistanceGate';

interface FactoryBasementVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 16;
const D = 14;
const CEIL_H = 3.4;

function basementSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function FactoryBasementVisual(_props: FactoryBasementVisualProps) {
  const { preset } = useGraphicsQuality();
  const useAuthoredShell = !preset.visualLite;
  const useGltfDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  const hideProceduralClutter = useAuthoredShell && useGltfDressing;
  const floorTexture = useCachedCanvasTexture('factory_basement:floor', createBasementFloorTexture);
  const ceilingWashTexture = useCachedCanvasTexture(
    'factory_basement:core-ceiling',
    createFactoryBasementCoreGlowTexture,
  );
  const damp = useMemo(() => getIndustrialDampFloorSettings('factory_basement'), []);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const spill = useMemo(
    () => getRainSpillInFloorBoost('factory_basement', rainIntensity),
    [rainIntensity],
  );
  const coreRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const rootGroupRef = useRef<THREE.Group>(null);
  const tRef = useRef(0);

  useFrameTick('misc', ({ delta }) => {
    tRef.current += delta;
    const t = tRef.current;
    // «Заря-М» breathes — slow systolic pulse with a double-beat
    const pulse = 0.75 + Math.max(0, Math.sin(t * 1.4)) * 0.5 + Math.max(0, Math.sin(t * 2.8)) * 0.2;
    if (coreRef.current) {
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 * pulse;
    }
    if (coreLightRef.current) {
      coreLightRef.current.intensity = 2.2 * pulse;
    }
  }, { visibilityRef: rootGroupRef });

  const floorRoughness = Math.max(0.2, (damp?.roughness ?? 0.85) - (spill?.roughnessDrop ?? 0));
  const floorMetalness = Math.min(0.55, (damp?.metalness ?? 0) + (spill?.metalnessBoost ?? 0));

  return (
    <group ref={rootGroupRef}>
      {useAuthoredShell ? (
        <AuthoredInteriorShell
          sceneId="factory_basement"
          url={INTERIOR_SHELL_MODELS.basement}
          position={[-1, 0.2, -3]}
          rotationY={-Math.PI / 4}
          scale={2.5}
          castShadow={preset.shadows}
        />
      ) : (
        <>
          {/* ── Walls + low ceiling (lite fallback) ── */}
          {[
            { pos: [0, CEIL_H / 2, -D / 2] as const, size: [W, CEIL_H, 0.2] as const },
            { pos: [0, CEIL_H / 2, D / 2] as const, size: [W, CEIL_H, 0.2] as const },
            { pos: [-W / 2, CEIL_H / 2, 0] as const, size: [0.2, CEIL_H, D] as const },
            { pos: [W / 2, CEIL_H / 2, 0] as const, size: [0.2, CEIL_H, D] as const },
          ].map((wall, i) => (
            <mesh key={`wall-${i}`} position={[wall.pos[0], wall.pos[1], wall.pos[2]]} receiveShadow geometry={getSharedBoxGeometry(wall.size[0], wall.size[1], wall.size[2])}>
              <meshStandardMaterial color="#2c3134" roughness={0.95} />
            </mesh>
          ))}
          <mesh rotation-x={Math.PI / 2} position-y={CEIL_H} geometry={getSharedPlaneGeometry(W, D)}>
            <meshStandardMaterial
              map={ceilingWashTexture}
              color="#101818"
              emissive="#204838"
              emissiveIntensity={0.22}
              roughness={0.95}
            />
          </mesh>
        </>
      )}

      {/* ── Stained concrete floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        <meshStandardMaterial
          map={floorTexture}
          color="#23282a"
          roughness={floorRoughness}
          metalness={floorMetalness}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {spill && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, D * 0.35]} geometry={getSharedCircleGeometry(2.4, 24)}>
          <meshStandardMaterial
            color="#1a2830"
            metalness={damp?.oilMetalness ?? 0.55}
            roughness={damp?.oilRoughness ?? 0.22}
            transparent
            opacity={spill.puddleOpacity}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}

      {!hideProceduralClutter ? (
        <>
          {/* ── Support columns ── */}
          {[
            [-2.5, 0],
            [2.5, 0],
          ].map(([x, z]) => (
            <mesh key={`col-${x}`} position={[x, CEIL_H / 2, z]} castShadow geometry={getSharedBoxGeometry(0.6, CEIL_H, 0.6)}>
              <meshStandardMaterial color="#33383b" roughness={0.9} />
            </mesh>
          ))}

          {/* ── Server rack rows with blinking LEDs (distance-gated clutter) ── */}
          <EnvironmentDetail minLod="standard" position={[-4.5, 0, -1]}>
            <ServerRackRow position={[-4.5, 0, -1]} length={5.2} seed={11} />
          </EnvironmentDetail>
          <EnvironmentDetail minLod="standard" position={[4.5, 0, -1]}>
            <ServerRackRow position={[4.5, 0, -1]} length={5.2} seed={22} />
          </EnvironmentDetail>
          <EnvironmentDetail minLod="full" position={[-4.5, 0, 3.5]}>
            <ServerRackRow position={[-4.5, 0, 3.5]} length={3.6} seed={33} />
          </EnvironmentDetail>
          <EnvironmentDetail minLod="full" position={[4.5, 0, 3.5]}>
            <ServerRackRow position={[4.5, 0, 3.5]} length={3.6} seed={44} />
          </EnvironmentDetail>
        </>
      ) : null}

      {/* ── «Заря-М» monolith ── */}
      <group position={[0, 0, -5.2]}>
        {/* Body */}
        <mesh position={[0, 1.6, 0]} castShadow geometry={getSharedBoxGeometry(2.4, 3.2, 1.6)}>
          <meshStandardMaterial color="#1a2420" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Pulsing core seam */}
        <mesh ref={coreRef} position={[0, 1.6, 0.82]} geometry={getSharedPlaneGeometry(0.35, 2.6)}>
          <meshStandardMaterial color="#03130c" emissive="#22ff88" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        {/* Side vents */}
        {[-0.85, 0.85].map((x) => (
          <mesh key={`vent-${x}`} position={[x, 1.6, 0.81]} geometry={getSharedPlaneGeometry(0.5, 2.2)}>
            <meshStandardMaterial color="#0e1714" roughness={0.6} metalness={0.5} />
          </mesh>
        ))}
        {/* Cable bundles into the ceiling */}
        {[-0.6, 0, 0.6].map((x, i) => (
          <mesh key={`cable-${i}`} position={[x, 3.3, -0.3]} rotation={[0.25 * (i - 1), 0, 0]} geometry={getSharedCylinderGeometry(0.05, 0.07, 1.2, 6)}>
            <meshStandardMaterial color="#101416" roughness={0.8} />
          </mesh>
        ))}
        <pointLight ref={coreLightRef} position={[0, 1.6, 1.4]} color="#22ff88" intensity={2.2} distance={9} decay={2} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} shadow-bias={-0.002} />
      </group>

      {/* ── Overhead pipes ── */}
      {[
        { z: -2.5, r: 0.1 },
        { z: -2.2, r: 0.06 },
        { z: 2.8, r: 0.12 },
      ].map((pipe, i) => (
        <mesh key={`pipe-${i}`} position={[0, CEIL_H - 0.25 - i * 0.12, pipe.z]} rotation={[0, 0, Math.PI / 2]} geometry={getSharedCylinderGeometry(pipe.r, pipe.r, W - 1, 8)}>
          <meshStandardMaterial color="#3c3a32" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}

      {/* ── Puddles ── */}
      {[
        { pos: [-2.2, 1.8] as const, r: 0.7 },
        { pos: [1.6, -2.4] as const, r: 0.5 },
        { pos: [3.4, 1.2] as const, r: 0.4 },
      ].map((p, i) => (
        <mesh key={`puddle-${i}`} rotation-x={-Math.PI / 2} position={[p.pos[0], 0.015, p.pos[1]]} geometry={getSharedCircleGeometry(p.r, 14)}>
          <meshStandardMaterial
            color="#0a1812"
            metalness={0.85}
            roughness={0.08}
            transparent
            opacity={0.6}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      ))}

      {/* ── Old desk with dead terminal near the entrance ── */}
      <group position={[4.5, 0, 5.5]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.38, 0]} castShadow geometry={getSharedBoxGeometry(1.1, 0.06, 0.6)}>
          <meshStandardMaterial color="#3a3328" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.62, -0.1]} rotation={[-0.12, 0, 0]} castShadow geometry={getSharedBoxGeometry(0.45, 0.35, 0.08)}>
          <meshStandardMaterial color="#22251f" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.62, -0.05]} rotation={[-0.12, 0, 0]} geometry={getSharedPlaneGeometry(0.38, 0.27)}>
          <meshStandardMaterial color="#020503" emissive="#143" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ── Red emergency lamps on side walls ── */}
      {[
        [-W / 2 + 0.15, 2.8, 2],
        [W / 2 - 0.15, 2.8, 2],
      ].map(([x, y, z], i) => (
        <mesh key={`emlamp-${i}`} position={[x, y, z]} geometry={getSharedSphereGeometry(0.08, 8, 6)}>
          <meshStandardMaterial color="#330805" emissive="#ff3322" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Server rack row: body + instanced blinking LEDs (2 draw calls) ── */
function ServerRackRow({
  position,
  length,
  seed,
}: {
  position: [number, number, number];
  length: number;
  seed: number;
}) {
  const ledsRef = useRef<THREE.InstancedMesh>(null);
  const tRef = useRef(0);
  const blinkColorRef = useRef(new THREE.Color());

  const leds = useMemo(() => {
    const rng = basementSeededRandom(seed * 7919 + 13);
    const out: Array<{ y: number; z: number; phase: number; speed: number; green: boolean }> = [];
    const count = Math.floor(length * 7);
    for (let i = 0; i < count; i++) {
      out.push({
        y: 0.25 + rng() * 1.75,
        z: -length / 2 + rng() * length,
        phase: rng() * Math.PI * 2,
        speed: 1 + rng() * 4,
        green: rng() > 0.35,
      });
    }
    return out;
  }, [length, seed]);

  useLayoutEffect(() => {
    const mesh = ledsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = scratchColor;
    leds.forEach((led, i) => {
      // Face the aisle: x offset toward scene centre
      const inward = position[0] > 0 ? -0.46 : 0.46;
      dummy.position.set(inward, led.y, led.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(led.green ? '#2bff9a' : '#ffb133');
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leds, position]);

  useFrameTick('misc', ({ delta }) => {
    tRef.current += delta;
    const mesh = ledsRef.current;
    if (!mesh) return;
    const t = tRef.current;
    const color = blinkColorRef.current;
    // Blink a small rotating subset each frame — cheap (no full loop per frame)
    const start = Math.floor(t * 10) % leds.length;
    for (let k = 0; k < 6; k++) {
      const i = (start + k * 7) % leds.length;
      const led = leds[i];
      const on = Math.sin(t * led.speed + led.phase) > -0.2;
      color.set(on ? (led.green ? '#2bff9a' : '#ffb133') : '#0a0f0c');
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, { visibilityRef: ledsRef });

  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow geometry={getSharedBoxGeometry(0.9, 2.2, length)}>
        <meshStandardMaterial color="#23282b" metalness={0.5} roughness={0.55} />
      </mesh>
      <instancedMesh
        ref={ledsRef}
        args={[getSharedSphereGeometry(0.02, 4, 4), undefined, leds.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial color="#2bff9a" emissive="#ffffff" emissiveIntensity={0.9} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function createBasementFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#23282a';
  ctx.fillRect(0, 0, size, size);

  // Oil stains
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 9; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#15181a';
    ctx.beginPath();
    ctx.arc(x, y, 8 + Math.random() * 26, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hairline cracks
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#191d1f';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}
