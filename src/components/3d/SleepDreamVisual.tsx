
/* ─── Volodka RPG – Dreamscape procedural 3D visual (v2.1 — FastNoiseLite) ─── */

import { useMemo, useRef, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
  getSharedSphereGeometry,
} from '@/engine/three/moduleGeometryRegistry';

import FastNoiseLite from 'fastnoise-lite';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import {
  createDreamGalaxySkyTexture,
  createDreamGalaxyStarGeometry,
} from '@/engine/graphics/proceduralSkyTextures';

/** Dark Fantasy/Psychonauts2 dreamscape (50×50m) — flat walkable floor aligned with physics */
export function SleepDreamVisual() {
  const W = 50;
  const D = 50;
  const { lod } = useEnvironmentLod();

  const groundGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(W, D, 64, 64);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [W, D]);

  const groundTexture = useCachedCanvasTexture('sleep_dream:ground', createDreamGroundTexture);

  return (
    <group>
      {/* ── Galaxy sky dome (fog-exempt; scene skybox disabled for dream) ── */}
      <GalaxySkyDome />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── FLAT DREAM FLOOR (matches physics plane) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <mesh geometry={groundGeometry} receiveShadow>
        <meshStandardMaterial
          map={groundTexture}
          color="#0a0515"
          roughness={0.95}
          metalness={0.05}
          transparent
          opacity={0.9}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Secondary terrain layer — glowing vein network ── */}
      <VeinOverlay width={W} depth={D} segments={64} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── FLOATING ISLANDS ──                          */}
      {/* ═══════════════════════════════════════════════ */}
      <FloatingIsland position={[-12, 6, -10]} scale={2.5} />
      <FloatingIsland position={[15, 8, -8]} scale={1.8} />
      <FloatingIsland position={[-8, 10, 12]} scale={2.0} />
      <FloatingIsland position={[10, 5, 14]} scale={1.5} />
      <FloatingIsland position={[0, 12, -18]} scale={3.0} />
      <FloatingIsland position={[-18, 7, 0]} scale={1.3} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── IMPOSSIBLE GEOMETRY ──                       */}
      {/* ═══════════════════════════════════════════════ */}
      <ImpossibleStructure position={[8, 2, -5]} />
      <ImpossibleStructure position={[-15, 3, 8]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── FLOATING POEM TEXT ──                        */}
      {/* ═══════════════════════════════════════════════ */}
      <FloatingPoemFragment position={[-5, 5, -12]} text="СМЕРТЬ" />
      <FloatingPoemFragment position={[12, 7, 5]} text="СВЕТ" />
      <FloatingPoemFragment position={[-10, 4, 15]} text="ПАМЯТЬ" />
      <FloatingPoemFragment position={[6, 9, -15]} text="ТИШИНА" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── MEMORY FRAGMENTS (glowing cubes) ──          */}
      {/* ═══════════════════════════════════════════════ */}
      {MEMORY_FRAGMENT_DATA.map((data, i) => (
        <MemoryFragment key={`mem-${i}`} position={data.pos} color={data.color} />
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SPIRAL PILLARS ──                            */}
      {/* ═══════════════════════════════════════════════ */}
      {SPIRAL_PILLAR_POSITIONS.map((pos, i) => (
        <SpiralPillar key={`pillar-${i}`} position={pos} />
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ETHEREAL FOG LAYERS ──                       */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatedFogLayer y={0.3} speed={0.1} />
      <AnimatedFogLayer y={3.0} speed={0.06} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ──                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <pointLight position={[0, 6, 0]} color="#00cccc" intensity={3.5} distance={30} />
      <pointLight position={[-3, 2, -6]} color="#ffcc44" intensity={2.0} distance={10} />
      <pointLight position={[4, 4, 8]} color="#ff44aa" intensity={1.5} distance={10} />
      <pointLight position={[0, 0.5, 0]} color="#2a1a50" intensity={1.0} distance={30} />
      <pointLight position={[-15, 5, -10]} color="#00cccc" intensity={2.0} distance={18} />
      <pointLight position={[15, 5, 10]} color="#00cccc" intensity={2.0} distance={18} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER ──                     */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
      <FloatingClock position={[5, 6, -3]} />
      <GlowingOrbs />
      <TornPhoto position={[-6, 4, 8]} />
      <MeltingChair position={[2, 0, -8]} />
      <InvertedDoorFrame position={[-10, 4, -5]} />
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── PARTICLE DUST (noise-driven density) ──      */}
      {/* ═══════════════════════════════════════════════ */}
      <DreamDustField width={W} depth={D} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DATA CONSTANTS                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

const MEMORY_FRAGMENT_DATA = [
  { pos: [-3, 1.5, -6] as [number, number, number], color: '#ffcc44' },
  { pos: [7, 2.0, -3] as [number, number, number], color: '#00cccc' },
  { pos: [-8, 1.0, 4] as [number, number, number], color: '#ffcc44' },
  { pos: [4, 3.0, 8] as [number, number, number], color: '#ff44aa' },
  { pos: [-14, 2.5, -3] as [number, number, number], color: '#00cccc' },
  { pos: [0, 1.8, -10] as [number, number, number], color: '#ffcc44' },
  { pos: [16, 1.2, -2] as [number, number, number], color: '#00cccc' },
  { pos: [-5, 4.0, -18] as [number, number, number], color: '#ffcc44' },
];

const SPIRAL_PILLAR_POSITIONS: [number, number, number][] = [
  [-6, 0, -3],
  [10, 0, -8],
  [-4, 0, 10],
  [0, 0, -15],
];

/** Inward-facing dome: galaxy gradient + slow-drifting starfield. */
function GalaxySkyDome() {
  const skyTexture = useCachedCanvasTexture('sleep_dream:galaxy-sky', createDreamGalaxySkyTexture);
  const starGeometry = useMemo(() => createDreamGalaxyStarGeometry(), []);
  const starsRef = useRef<THREE.Points>(null);

  useFrameTick('misc', ({ state }) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.006;
    }
  });

  return (
    <group renderOrder={-10}>
      <mesh position={[0, 6, 0]}>
        <sphereGeometry args={[58, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
        />
      </mesh>
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial
          color="#dde8ff"
          size={1.4}
          sizeAttenuation={false}
          transparent
          opacity={0.88}
          fog={false}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  VEIN OVERLAY — glowing crack network using FastNoiseLite         */
/* ═══════════════════════════════════════════════════════════════════ */

function VeinOverlay({ width, depth, segments }: { width: number; depth: number; segments: number }) {
  const geometry = useMemo(() => {
    const noise = new FastNoiseLite(42 + 500);
    noise.SetNoiseType(FastNoiseLite.NoiseType.Cellular);
    noise.SetFrequency(0.08);
    noise.SetCellularDistanceFunction(FastNoiseLite.CellularDistanceFunction.Euclidean);
    noise.SetCellularReturnType(FastNoiseLite.CellularReturnType.Distance2Div);

    const halfW = width / 2;
    const halfD = depth / 2;
    const stepX = width / segments;
    const stepZ = depth / segments;

    const positions = new Float32Array((segments + 1) * (segments + 1) * 3);
    const colors = new Float32Array((segments + 1) * (segments + 1) * 3);
    let idx = 0;

    for (let iz = 0; iz <= segments; iz++) {
      for (let ix = 0; ix <= segments; ix++) {
        const x = -halfW + ix * stepX;
        const z = -halfD + iz * stepZ;

        // Cellular noise creates vein-like patterns
        const val = noise.GetNoise(x, z);
        const veinIntensity = Math.max(0, 1 - Math.abs(val * 3));

        // Slightly above the terrain to prevent z-fighting
        positions[idx] = x;
        positions[idx + 1] = 0.05;
        positions[idx + 2] = z;

        // Cyan glow color for veins
        colors[idx] = 0 * veinIntensity;
        colors[idx + 1] = 0.8 * veinIntensity;
        colors[idx + 2] = 0.8 * veinIntensity;

        idx += 3;
      }
    }

    // Build indices
    const indices = new Uint32Array(segments * segments * 6);
    let iidx = 0;
    for (let iz = 0; iz < segments; iz++) {
      for (let ix = 0; ix < segments; ix++) {
        const a = iz * (segments + 1) + ix;
        const b = a + 1;
        const c = a + (segments + 1);
        const d = c + 1;
        indices[iidx++] = a;
        indices[iidx++] = c;
        indices[iidx++] = b;
        indices[iidx++] = b;
        indices[iidx++] = c;
        indices[iidx++] = d;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [width, depth, segments]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2}>
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.4}
        emissive="#00cccc"
        emissiveIntensity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DREAM DUST — particles with noise-driven spawn density           */
/* ═══════════════════════════════════════════════════════════════════ */

function DreamDustField({ width, depth }: { width: number; depth: number }) {
  const { count, positions, colors } = useMemo(() => {
    const noise = new FastNoiseLite(42 + 200);
    noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2S);
    noise.SetFrequency(0.04);
    noise.SetFractalType(FastNoiseLite.FractalType.FBm);
    noise.SetFractalOctaves(3);

    const maxParticles = 300;
    const posArr: number[] = [];
    const colArr: number[] = [];
    const halfW = width / 2;
    const halfD = depth / 2;

    // Spawn particles with density proportional to noise value
    for (let i = 0; i < maxParticles * 3 && posArr.length < maxParticles * 3; i++) {
      const x = (Math.random() - 0.5) * width;
      const z = (Math.random() - 0.5) * depth;

      const density = (noise.GetNoise(x, z) + 1) / 2; // 0..1

      // Higher noise = more likely to spawn a particle (creates clusters)
      if (Math.random() > density * 0.7) continue;

      const y = Math.random() * 5 + 0.5;

      posArr.push(x, y, z);

      // Color variation based on position
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        colArr.push(0, 0.8, 0.8); // cyan
      } else if (colorChoice < 0.7) {
        colArr.push(1, 0.8, 0.27); // gold
      } else {
        colArr.push(1, 0.27, 0.67); // pink
      }
    }

    return {
      count: posArr.length / 3,
      positions: new Float32Array(posArr),
      colors: new Float32Array(colArr),
    };
  }, [width, depth]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrameTick('misc', ({ state }) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    pointsRef.current.rotation.y = t * 0.01;

    // Gentle floating motion
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const oy = positions[i * 3 + 1];
      posAttr.setY(i, oy + Math.sin(t * 0.3 + i * 0.1) * 0.2);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  EXISTING COMPONENTS (preserved from original)                    */
/* ═══════════════════════════════════════════════════════════════════ */

/** Floating island with impossible terrain */
function FloatingIsland({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrameTick('misc', ({ state }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, -0.5, 0]} scale={scale} castShadow geometry={getSharedCylinderGeometry(0.3, 1.2, 1.5, 6)}>
        <meshStandardMaterial color="#1a0a30" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.25, 0]} scale={scale} castShadow geometry={getSharedCylinderGeometry(1.2, 1.2, 0.1, 6)}>
        <meshStandardMaterial color="#2a1a40" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0]} scale={scale * 0.4} geometry={getSharedSphereGeometry(1, 6, 6)}>
        <meshStandardMaterial color="#1a2a1a" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Impossible geometry structure */
function ImpossibleStructure({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0.5]} castShadow geometry={getSharedBoxGeometry(0.15, 3, 0.15)}>
        <meshStandardMaterial color="#2a1a40" emissive="#00cccc" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
      <mesh position={[0.7, 1.5, 0]} rotation={[0, 0, -0.5]} castShadow geometry={getSharedBoxGeometry(0.15, 3, 0.15)}>
        <meshStandardMaterial color="#2a1a40" emissive="#00cccc" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
      <mesh position={[0.35, 2.8, 0]} rotation={[0, 0, 0]} castShadow geometry={getSharedBoxGeometry(1.4, 0.15, 0.15)}>
        <meshStandardMaterial color="#2a1a40" emissive="#00cccc" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Floating poem text fragment */
function FloatingPoemFragment({ position, text }: { position: [number, number, number]; text: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = '#00cccc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text]);

  useFrameTick('misc', ({ state }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.5;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2 + position[2]) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={getSharedPlaneGeometry(2.5, 0.6)}>
        <meshStandardMaterial map={texture} transparent opacity={0.7} side={THREE.DoubleSide} emissive="#00cccc" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/** Glowing memory fragment cube */
function MemoryFragment({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrameTick('misc', ({ state }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + position[0];
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3 + position[2];
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position} geometry={getSharedBoxGeometry(0.3, 0.3, 0.3)}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.8} />
    </mesh>
  );
}

/** Spiral pillar */
function SpiralPillar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow geometry={getSharedCylinderGeometry(0.15, 0.15, 4, 8)}>
        <meshStandardMaterial color="#2a1a40" emissive="#1a0a30" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 3;
        const y = (i / 8) * 3.5 + 0.3;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.5, y, Math.sin(angle) * 0.5]} rotation={[0, -angle, 0]} geometry={getSharedBoxGeometry(0.4, 0.08, 0.12)}>
            <meshStandardMaterial color="#1a0a30" emissive="#00cccc" emissiveIntensity={0.15} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Animated fog layer — now with subtle drift */
function AnimatedFogLayer({ y, speed }: { y: number; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrameTick('misc', ({ state }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, y, 0]} rotation-x={-Math.PI / 2} geometry={getSharedPlaneGeometry(50, 50)}>
      <meshStandardMaterial color="#1a0a30" transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  EXTRACTED CLUTTER COMPONENTS                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function FloatingClock({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrameTick('misc', ({ state }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={getSharedCylinderGeometry(0.3, 0.3, 0.04, 16)}>
        <meshStandardMaterial color="#1a0a30" emissive="#ffcc44" emissiveIntensity={0.5} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[0, 0, 0.8]} geometry={getSharedBoxGeometry(0.15, 0.01, 0.005)}>
        <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[0, 0, -0.3]} geometry={getSharedBoxGeometry(0.1, 0.01, 0.005)}>
        <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function GlowingOrbs() {
  return (
    <>
      {[[-3, 3, 5], [8, 7, -12], [-12, 2, -8]].map((pos, i) => (
        <mesh key={`orb-${i}`} position={pos as [number, number, number]} geometry={getSharedSphereGeometry(0.15, 8, 8)}>
          <meshStandardMaterial
            color={['#ff44aa', '#00cccc', '#ffcc44'][i]}
            emissive={['#ff44aa', '#00cccc', '#ffcc44'][i]}
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </>
  );
}

function TornPhoto({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0.2, 0.4, 0.1]} geometry={getSharedPlaneGeometry(0.2, 0.15)}>
        <meshStandardMaterial color="#c8b8a0" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.08, -0.04, 0]} rotation={[0.2, 0.4, 0.3]} geometry={getSharedPlaneGeometry(0.08, 0.06)}>
        <meshStandardMaterial color="#c8b8a0" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function MeltingChair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow scale={[1, 0.6, 1]} geometry={getSharedBoxGeometry(0.4, 0.04, 0.4)}>
        <meshStandardMaterial color="#2a1a40" emissive="#1a0a30" emissiveIntensity={0.1} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, -0.15]} scale={[1, 1.3, 0.5]} geometry={getSharedBoxGeometry(0.4, 0.4, 0.04)}>
        <meshStandardMaterial color="#2a1a40" emissive="#1a0a30" emissiveIntensity={0.1} roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.1, 0.15]} geometry={getSharedCylinderGeometry(0.015, 0.008, 0.25, 4)}>
        <meshStandardMaterial color="#2a1a40" emissive="#00cccc" emissiveIntensity={0.15} roughness={0.9} />
      </mesh>
    </group>
  );
}

function InvertedDoorFrame({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[Math.PI, 0.3, 0]}>
      <mesh geometry={getSharedBoxGeometry(0.9, 2.2, 0.08)}>
        <meshStandardMaterial color="#2a1a40" emissive="#1a0a30" emissiveIntensity={0.15} roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  GROUND TEXTURE (enhanced with noise-based patterns)              */
/* ═══════════════════════════════════════════════════════════════════ */

function createDreamGroundTexture(): THREE.CanvasTexture {
  const size = 512; // Increased from 256 for better detail on hilly terrain
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep purple base
  ctx.fillStyle = '#0a0515';
  ctx.fillRect(0, 0, size, size);

  // Use FastNoiseLite for coherent swirl patterns (replaces Math.random)
  const swirlNoise = new FastNoiseLite(42 + 300);
  swirlNoise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2S);
  swirlNoise.SetFrequency(0.015);
  swirlNoise.SetFractalType(FastNoiseLite.FractalType.FBm);
  swirlNoise.SetFractalOctaves(4);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const noiseVal = (swirlNoise.GetNoise(x, y) + 1) / 2; // 0..1

      // Mix purple base with cyan/gold highlights based on noise
      const cyanMix = Math.pow(noiseVal, 3) * 0.15;
      const goldMix = Math.pow(1 - noiseVal, 4) * 0.08;

      data[idx] = Math.min(255, data[idx] + cyanMix * 0 + goldMix * 255);     // R
      data[idx + 1] = Math.min(255, data[idx + 1] + cyanMix * 200 + goldMix * 180); // G
      data[idx + 2] = Math.min(255, data[idx + 2] + cyanMix * 200 + goldMix * 50);  // B
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Subtle cracks (noise-driven paths instead of random lines)
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#ffcc44';
  ctx.lineWidth = 0.5;
  const crackNoise = new FastNoiseLite(42 + 400);
  crackNoise.SetNoiseType(FastNoiseLite.NoiseType.Cellular);
  crackNoise.SetFrequency(0.03);
  crackNoise.SetFractalType(FastNoiseLite.FractalType.Ridged);
  crackNoise.SetFractalOctaves(3);

  for (let i = 0; i < 12; i++) {
    const startX = (i * 43) % size;
    const startY = (i * 67) % size;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let cx = startX;
    let cy = startY;
    for (let step = 0; step < 20; step++) {
      const angle = crackNoise.GetNoise(cx * 0.1, cy * 0.1) * Math.PI;
      cx += Math.cos(angle) * 5;
      cy += Math.sin(angle) * 5;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8); // Reduced repeat since texture is now 512px
  return tex;
}
