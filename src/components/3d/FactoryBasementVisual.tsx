
/* ─── Volodka RPG – Factory Basement: the reliquary of «Заря-М» ───
 *  Dense industrial catacombs under the abandoned factory. Server rack rows,
 *  dripping pipes, puddles — and the green-pulsing monolith of «Заря-М»
 *  at the far wall (act 5 machine confession happens here).
 */

import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';

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
  const floorTexture = useCachedCanvasTexture('factory_basement:floor', createBasementFloorTexture);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
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
  });

  return (
    <group>
      {/* ── Stained concrete floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floorTexture}
          color="#23282a"
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Walls + low ceiling ── */}
      {[
        { pos: [0, CEIL_H / 2, -D / 2] as const, size: [W, CEIL_H, 0.2] as const },
        { pos: [0, CEIL_H / 2, D / 2] as const, size: [W, CEIL_H, 0.2] as const },
        { pos: [-W / 2, CEIL_H / 2, 0] as const, size: [0.2, CEIL_H, D] as const },
        { pos: [W / 2, CEIL_H / 2, 0] as const, size: [0.2, CEIL_H, D] as const },
      ].map((wall, i) => (
        <mesh key={`wall-${i}`} position={[wall.pos[0], wall.pos[1], wall.pos[2]]} receiveShadow>
          <boxGeometry args={[wall.size[0], wall.size[1], wall.size[2]]} />
          <meshStandardMaterial color="#2c3134" roughness={0.95} />
        </mesh>
      ))}
      <mesh rotation-x={Math.PI / 2} position-y={CEIL_H}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#1d2123" roughness={0.95} />
      </mesh>

      {/* ── Support columns ── */}
      {[
        [-2.5, 0],
        [2.5, 0],
      ].map(([x, z]) => (
        <mesh key={`col-${x}`} position={[x, CEIL_H / 2, z]} castShadow>
          <boxGeometry args={[0.6, CEIL_H, 0.6]} />
          <meshStandardMaterial color="#33383b" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Server rack rows with blinking LEDs ── */}
      <ServerRackRow position={[-4.5, 0, -1]} length={5.2} seed={11} />
      <ServerRackRow position={[4.5, 0, -1]} length={5.2} seed={22} />
      <ServerRackRow position={[-4.5, 0, 3.5]} length={3.6} seed={33} />
      <ServerRackRow position={[4.5, 0, 3.5]} length={3.6} seed={44} />

      {/* ── «Заря-М» monolith ── */}
      <group position={[0, 0, -5.2]}>
        {/* Body */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[2.4, 3.2, 1.6]} />
          <meshStandardMaterial color="#1a2420" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Pulsing core seam */}
        <mesh ref={coreRef} position={[0, 1.6, 0.82]}>
          <planeGeometry args={[0.35, 2.6]} />
          <meshStandardMaterial color="#03130c" emissive="#22ff88" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        {/* Side vents */}
        {[-0.85, 0.85].map((x) => (
          <mesh key={`vent-${x}`} position={[x, 1.6, 0.81]}>
            <planeGeometry args={[0.5, 2.2]} />
            <meshStandardMaterial color="#0e1714" roughness={0.6} metalness={0.5} />
          </mesh>
        ))}
        {/* Cable bundles into the ceiling */}
        {[-0.6, 0, 0.6].map((x, i) => (
          <mesh key={`cable-${i}`} position={[x, 3.3, -0.3]} rotation={[0.25 * (i - 1), 0, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 1.2, 6]} />
            <meshStandardMaterial color="#101416" roughness={0.8} />
          </mesh>
        ))}
        <pointLight ref={coreLightRef} position={[0, 1.6, 1.4]} color="#22ff88" intensity={2.2} distance={9} decay={2} />
      </group>

      {/* ── Overhead pipes ── */}
      {[
        { z: -2.5, r: 0.1 },
        { z: -2.2, r: 0.06 },
        { z: 2.8, r: 0.12 },
      ].map((pipe, i) => (
        <mesh key={`pipe-${i}`} position={[0, CEIL_H - 0.25 - i * 0.12, pipe.z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[pipe.r, pipe.r, W - 1, 8]} />
          <meshStandardMaterial color="#3c3a32" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}

      {/* ── Puddles ── */}
      {[
        { pos: [-2.2, 1.8] as const, r: 0.7 },
        { pos: [1.6, -2.4] as const, r: 0.5 },
        { pos: [3.4, 1.2] as const, r: 0.4 },
      ].map((p, i) => (
        <mesh key={`puddle-${i}`} rotation-x={-Math.PI / 2} position={[p.pos[0], 0.015, p.pos[1]]}>
          <circleGeometry args={[p.r, 14]} />
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
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[1.1, 0.06, 0.6]} />
          <meshStandardMaterial color="#3a3328" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.62, -0.1]} rotation={[-0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.35, 0.08]} />
          <meshStandardMaterial color="#22251f" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.62, -0.05]} rotation={[-0.12, 0, 0]}>
          <planeGeometry args={[0.38, 0.27]} />
          <meshStandardMaterial color="#020503" emissive="#143" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ── Red emergency lamps on side walls ── */}
      {[
        [-W / 2 + 0.15, 2.8, 2],
        [W / 2 - 0.15, 2.8, 2],
      ].map(([x, y, z], i) => (
        <mesh key={`emlamp-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.08, 8, 6]} />
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
    const color = new THREE.Color();
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
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 2.2, length]} />
        <meshStandardMaterial color="#23282b" metalness={0.5} roughness={0.55} />
      </mesh>
      <instancedMesh ref={ledsRef} args={[undefined, undefined, leds.length]} frustumCulled={false}>
        <sphereGeometry args={[0.02, 4, 4]} />
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
