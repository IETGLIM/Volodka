
/* ─── Volodka RPG – God Rays (simulated light shafts with dust motes) ───
 *  Creates volumetric-looking light shafts using cylinder/cone meshes
 *  with emissive material and additive blending. Dust motes (Points)
 *  float inside the ray for added realism.
 */

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  finitePositive,
  sanitizeBufferGeometryPositions,
  sanitizePositionArray,
} from '@/engine/three/bufferGeometrySanitize';
import * as THREE from 'three';

/* ── Config ── */

export interface GodRayConfig {
  /** Position of the ray origin (light source end) */
  position: [number, number, number];
  /** Top radius (at origin, where light enters) */
  topRadius: number;
  /** Bottom radius (where light hits the floor) */
  bottomRadius: number;
  /** Height of the light shaft */
  height: number;
  /** Ray color */
  color: string;
  /** Base opacity (very low: 0.03–0.08) */
  opacity: number;
  /** Intensity pulsing speed (Hz) */
  pulseSpeed: number;
  /** Pulse amplitude (0–1 fraction of base opacity) */
  pulseAmp: number;
  /** Slow rotation speed (rad/s) */
  rotationSpeed: number;
  /** Initial Y rotation */
  initialRotation: number;
  /** Whether to show dust motes inside the ray */
  dustMotes: boolean;
  /** Number of dust motes */
  dustCount: number;
  /** Dust color */
  dustColor: string;
  /** Dust size range [min, max] */
  dustSizeRange: [number, number];
  /** Tilt angle (radians) — for slanted rays */
  tiltX?: number;
  tiltZ?: number;
}

const DEFAULT_RAY: GodRayConfig = {
  position: [0, 4, 0],
  topRadius: 0.15,
  bottomRadius: 0.8,
  height: 4,
  color: '#ffffcc',
  opacity: 0.06,
  pulseSpeed: 0.15,
  pulseAmp: 0.3,
  rotationSpeed: 0.02,
  initialRotation: 0,
  dustMotes: true,
  dustCount: 30,
  dustColor: '#ffeeaa',
  dustSizeRange: [0.02, 0.05],
};

/** Ensure ray dimensions are finite — invalid params yield NaN CylinderGeometry positions. */
function normalizeGodRayConfig(config: GodRayConfig): GodRayConfig {
  return {
    ...config,
    topRadius: finitePositive(config.topRadius, DEFAULT_RAY.topRadius),
    bottomRadius: finitePositive(config.bottomRadius, DEFAULT_RAY.bottomRadius),
    height: finitePositive(config.height, DEFAULT_RAY.height),
    dustCount: Math.max(0, Math.floor(Number.isFinite(config.dustCount) ? config.dustCount : 0)),
  };
}

/* ── Per-scene god ray presets ── */

export const GODRAY_PRESETS: Record<string, GodRayConfig[]> = {
  volodka_room: [
    {
      ...DEFAULT_RAY,
      position: [1.5, 2.5, -3.0],
      topRadius: 0.1,
      bottomRadius: 0.4,
      height: 2.5,
      color: '#00ff66',
      opacity: 0.04,
      pulseSpeed: 0.2,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 15,
      dustColor: '#88ff99',
      initialRotation: 0,
    },
    {
      ...DEFAULT_RAY,
      position: [0, 2.5, 0],
      topRadius: 0.08,
      bottomRadius: 0.3,
      height: 2.5,
      color: '#ffaa55',
      opacity: 0.03,
      pulseSpeed: 0.1,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 10,
      dustColor: '#ffcc88',
      initialRotation: Math.PI / 4,
    },
  ],
  volodka_corridor: [
    {
      ...DEFAULT_RAY,
      position: [0, 2.5, -2],
      topRadius: 0.1,
      bottomRadius: 0.5,
      height: 2.5,
      color: '#ffcc66',
      opacity: 0.04,
      pulseSpeed: 0.25,
      pulseAmp: 0.5, // flickering overhead ray
      rotationSpeed: 0.03,
      dustMotes: true,
      dustCount: 20,
      dustColor: '#ffdd88',
      initialRotation: 0,
    },
  ],
  street_night: [
    {
      ...DEFAULT_RAY,
      position: [4, 6, -3],
      topRadius: 0.05,
      bottomRadius: 0.6,
      height: 6,
      color: '#6666ff',
      opacity: 0.03,
      pulseSpeed: 0.1,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 25,
      dustColor: '#8888ff',
      initialRotation: 0.5,
    },
  ],
  street_winter: [
    {
      ...DEFAULT_RAY,
      position: [3, 8, 2],
      topRadius: 0.2,
      bottomRadius: 1.2,
      height: 8,
      color: '#ffffee',
      opacity: 0.05,
      pulseSpeed: 0.08,
      rotationSpeed: 0.02,
      dustMotes: true,
      dustCount: 40,
      dustColor: '#ffffdd',
      initialRotation: 0,
    },
    {
      ...DEFAULT_RAY,
      position: [-5, 7, -4],
      topRadius: 0.15,
      bottomRadius: 0.9,
      height: 7,
      color: '#ffffdd',
      opacity: 0.04,
      pulseSpeed: 0.1,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 25,
      dustColor: '#ffeecc',
      initialRotation: 1.2,
    },
  ],
  park_day: [
    {
      ...DEFAULT_RAY,
      position: [-4, 8, -3],
      topRadius: 0.15,
      bottomRadius: 1.0,
      height: 8,
      color: '#ffffcc',
      opacity: 0.05,
      pulseSpeed: 0.08,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 35,
      dustColor: '#ffeeaa',
      initialRotation: 0.3,
    },
    {
      ...DEFAULT_RAY,
      position: [5, 7, 4],
      topRadius: 0.1,
      bottomRadius: 0.7,
      height: 7,
      color: '#ffffdd',
      opacity: 0.04,
      pulseSpeed: 0.1,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 25,
      dustColor: '#ffddaa',
      initialRotation: 2.0,
    },
  ],
  rooftop_edge: [
    {
      ...DEFAULT_RAY,
      position: [-2, 6, -1],
      topRadius: 0.3,
      bottomRadius: 1.5,
      height: 6,
      color: '#ffcc88',
      opacity: 0.07,
      pulseSpeed: 0.1,
      pulseAmp: 0.4,
      rotationSpeed: 0.02,
      dustMotes: true,
      dustCount: 50,
      dustColor: '#ffddaa',
      initialRotation: 0,
    },
  ],
  abandoned_factory: [
    {
      ...DEFAULT_RAY,
      position: [3, 5, -2],
      topRadius: 0.15,
      bottomRadius: 1.0,
      height: 5,
      color: '#ffcc66',
      opacity: 0.05,
      pulseSpeed: 0.15,
      pulseAmp: 0.35,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 18,
      dustColor: '#ffbb55',
      initialRotation: 0,
    },
    {
      ...DEFAULT_RAY,
      position: [-4, 4, 3],
      topRadius: 0.1,
      bottomRadius: 0.7,
      height: 4,
      color: '#ffaa44',
      opacity: 0.04,
      pulseSpeed: 0.2,
      pulseAmp: 0.4,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 12,
      dustColor: '#ffcc66',
      initialRotation: 1.5,
    },
  ],
  battle: [
    {
      ...DEFAULT_RAY,
      position: [0, 5, 0],
      topRadius: 0.2,
      bottomRadius: 1.0,
      height: 5,
      color: '#00ff44',
      opacity: 0.04,
      pulseSpeed: 0.3,
      pulseAmp: 0.5,
      rotationSpeed: 0.05,
      dustMotes: true,
      dustCount: 40,
      dustColor: '#44ff66',
      initialRotation: 0,
    },
  ],
  sleep_dream: [
    {
      ...DEFAULT_RAY,
      position: [0, 6, 0],
      topRadius: 0.25,
      bottomRadius: 1.2,
      height: 6,
      color: '#aa66ff',
      opacity: 0.05,
      pulseSpeed: 0.05,
      pulseAmp: 0.4,
      rotationSpeed: 0.03,
      dustMotes: true,
      dustCount: 30,
      dustColor: '#cc88ff',
      initialRotation: 0,
    },
  ],
  office_day: [
    {
      ...DEFAULT_RAY,
      position: [3, 3, 0],
      topRadius: 0.1,
      bottomRadius: 0.4,
      height: 3,
      color: '#eeeeff',
      opacity: 0.03,
      pulseSpeed: 0.2,
      pulseAmp: 0.6, // fluorescent flickering
      rotationSpeed: 0.005,
      dustMotes: true,
      dustCount: 15,
      dustColor: '#ddeeff',
      initialRotation: 0,
    },
  ],
  home_evening: [
    {
      ...DEFAULT_RAY,
      position: [0, 2.5, 0],
      topRadius: 0.08,
      bottomRadius: 0.35,
      height: 2.5,
      color: '#ffaa44',
      opacity: 0.035,
      pulseSpeed: 0.1,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 12,
      dustColor: '#ffcc88',
      initialRotation: 0,
    },
  ],
  zarema_albert_room: [
    {
      ...DEFAULT_RAY,
      position: [0, 2.5, -1],
      topRadius: 0.08,
      bottomRadius: 0.3,
      height: 2.5,
      color: '#ffcc88',
      opacity: 0.03,
      pulseSpeed: 0.08,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 10,
      dustColor: '#ffddaa',
      initialRotation: 0,
    },
  ],
  chk_forest_zorge: [
    {
      ...DEFAULT_RAY,
      position: [0, 2.8, 0],
      topRadius: 0.05,
      bottomRadius: 0.55,
      height: 3.2,
      color: '#ff8833',
      opacity: 0.07,
      pulseSpeed: 0.35,
      pulseAmp: 0.45,
      rotationSpeed: 0.008,
      dustMotes: true,
      dustCount: 20,
      dustColor: '#ffaa55',
      initialRotation: 0,
    },
  ],
  factory_basement: [
    {
      // Green shaft of «Заря-М» rising over the monolith
      ...DEFAULT_RAY,
      position: [0, 2.6, -5.2],
      topRadius: 0.08,
      bottomRadius: 0.7,
      height: 2.6,
      color: '#22ff88',
      opacity: 0.06,
      pulseSpeed: 0.5,
      pulseAmp: 0.5,
      rotationSpeed: 0.004,
      dustMotes: true,
      dustCount: 16,
      dustColor: '#55ffaa',
      initialRotation: 0.4,
    },
  ],
  river_pier: [
    {
      // Warm column over the barrel fire
      ...DEFAULT_RAY,
      position: [0, 2.2, -2],
      topRadius: 0.05,
      bottomRadius: 0.5,
      height: 2.8,
      color: '#ff8833',
      opacity: 0.06,
      pulseSpeed: 0.4,
      pulseAmp: 0.5,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 14,
      dustColor: '#ffbb66',
      initialRotation: 0,
    },
  ],
  /* ── Extension scene god ray presets ── */
  solnysh_room: [
    {
      // Warm amber pendant lamp
      ...DEFAULT_RAY,
      position: [0, 2.5, 0],
      topRadius: 0.08,
      bottomRadius: 0.35,
      height: 2.5,
      color: '#ffaa55',
      opacity: 0.03,
      pulseSpeed: 0.1,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 12,
      dustColor: '#ffcc88',
      initialRotation: 0,
    },
  ],
  chk_campfire_night: [
    {
      // Campfire glow
      ...DEFAULT_RAY,
      position: [0, 1.5, -1],
      topRadius: 0.1,
      bottomRadius: 0.5,
      height: 1.5,
      color: '#ff8833',
      opacity: 0.05,
      pulseSpeed: 0.3,
      pulseAmp: 0.5,
      rotationSpeed: 0.008,
      dustMotes: true,
      dustCount: 20,
      dustColor: '#ffaa55',
      initialRotation: 0,
    },
  ],
  factory_roof: [
    {
      // Distant neon
      ...DEFAULT_RAY,
      position: [3, 6, -4],
      topRadius: 0.12,
      bottomRadius: 0.7,
      height: 6,
      color: '#4488aa',
      opacity: 0.04,
      pulseSpeed: 0.12,
      rotationSpeed: 0.015,
      dustMotes: true,
      dustCount: 15,
      dustColor: '#88aacc',
      initialRotation: 0,
    },
  ],
  library_basement: [
    {
      // Dusty lamp
      ...DEFAULT_RAY,
      position: [-2, 2.5, 0],
      topRadius: 0.08,
      bottomRadius: 0.4,
      height: 2.5,
      color: '#ffcc88',
      opacity: 0.04,
      pulseSpeed: 0.1,
      rotationSpeed: 0.008,
      dustMotes: true,
      dustCount: 20,
      dustColor: '#ffddaa',
      initialRotation: 0,
      tiltX: -0.1,
    },
  ],
  underground_bunker: [
    {
      // Green CRT glow
      ...DEFAULT_RAY,
      position: [0, 2.5, -3],
      topRadius: 0.08,
      bottomRadius: 0.4,
      height: 2.5,
      color: '#22ff88',
      opacity: 0.04,
      pulseSpeed: 0.2,
      rotationSpeed: 0.005,
      dustMotes: true,
      dustCount: 15,
      dustColor: '#55ffaa',
      initialRotation: 0,
    },
  ],
  albert_backroom: [
    {
      // Desk lamp
      ...DEFAULT_RAY,
      position: [1, 2.0, 0],
      topRadius: 0.06,
      bottomRadius: 0.3,
      height: 2.0,
      color: '#ffbb66',
      opacity: 0.03,
      pulseSpeed: 0.08,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 10,
      dustColor: '#ffcc88',
      initialRotation: 0,
    },
  ],
  // AAA Phase A: richer volumetric shafts on more hero scenes (complements ultra post godrays)
  pier_evening: [
    {
      // Warm column over the pier barrel fire + dusk
      ...DEFAULT_RAY,
      position: [0, 2.2, -2],
      topRadius: 0.05,
      bottomRadius: 0.5,
      height: 2.8,
      color: '#ff8833',
      opacity: 0.06,
      pulseSpeed: 0.4,
      pulseAmp: 0.5,
      rotationSpeed: 0.01,
      dustMotes: true,
      dustCount: 16,
      dustColor: '#ffbb66',
      initialRotation: 0,
    },
  ],
};

/* ── Component ── */

interface GodRaysProps {
  rays?: GodRayConfig[];
  sceneId?: string;
  /** Reduce dust motes on weak GPUs */
  liteMode?: boolean;
}

export function GodRays({ rays, sceneId, liteMode = false }: GodRaysProps) {
  const configs = useMemo(() => {
    const base = rays ?? (sceneId ? GODRAY_PRESETS[sceneId] ?? [] : []);
    if (!liteMode) return base;
    return base.map((ray) => ({
      ...ray,
      dustMotes: ray.dustMotes && (ray.dustCount ?? 0) > 8,
      dustCount: Math.max(6, Math.floor((ray.dustCount ?? 0) * 0.4)),
    }));
  }, [rays, sceneId, liteMode]);

  if (configs.length === 0) return null;

  return (
    <group>
      {configs.map((config, idx) => (
        <GodRayShaft key={idx} config={config} />
      ))}
    </group>
  );
}

/* ── Single god ray shaft ── */

function GodRayShaft({ config }: { config: GodRayConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const timeRef = useRef(0);

  const c = useMemo(
    () => normalizeGodRayConfig({ ...DEFAULT_RAY, ...config }),
    [config],
  );

  // Cylinder geometry (open-ended cone for light shaft shape)
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(c.topRadius, c.bottomRadius, c.height, 8, 1, true);
    sanitizeBufferGeometryPositions(geo);
    return geo;
  }, [c.topRadius, c.bottomRadius, c.height]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrameTick('postfx', ({ delta }) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Slow rotation
    meshRef.current.rotation.y += c.rotationSpeed * delta;

    // Intensity pulsing via ref
    if (materialRef.current) {
      materialRef.current.opacity = c.opacity * (1 - c.pulseAmp + c.pulseAmp * (0.5 + 0.5 * Math.sin(t * c.pulseSpeed * Math.PI * 2)));
    }
  });

  return (
    <group position={c.position} rotation={[c.tiltX ?? 0, c.initialRotation, c.tiltZ ?? 0]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          ref={materialRef}
          color={c.color}
          transparent
          opacity={c.opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Dust motes inside the ray */}
      {c.dustMotes && <RayDustMotes config={c} />}
    </group>
  );
}

/* ── Dust motes floating within a god ray ── */

function RayDustMotes({ config }: { config: GodRayConfig }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  const c = useMemo(
    () => normalizeGodRayConfig({ ...DEFAULT_RAY, ...config }),
    [config],
  );

  const { positions, phases } = useMemo(() => {
    const count = c.dustCount;
    if (count <= 0) {
      return { positions: new Float32Array(0), phases: new Float32Array(0) };
    }

    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const safeHeight = c.height;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distribute within a cone shape matching the ray
      const t = Math.random(); // 0 = top, 1 = bottom
      const radius = c.topRadius + (c.bottomRadius - c.topRadius) * t;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;

      pos[i3] = Math.cos(angle) * r;               // X
      pos[i3 + 1] = (0.5 - t) * safeHeight;        // Y (centered)
      pos[i3 + 2] = Math.sin(angle) * r;            // Z

      pha[i] = Math.random() * Math.PI * 2;
    }

    sanitizePositionArray(pos);
    return { positions: pos, phases: pha };
  }, [c.dustCount, c.topRadius, c.bottomRadius, c.height]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    sanitizeBufferGeometryPositions(geo);
    return geo;
  }, [positions]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrameTick('postfx', ({ delta }) => {
    if (!pointsRef.current || c.dustCount <= 0) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = c.dustCount;
    const halfHeight = c.height / 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Gentle floating motion
      posArray[i3] += Math.sin(t * 0.3 + phase) * 0.003 * delta;
      posArray[i3 + 1] += Math.sin(t * 0.2 + phase * 2) * 0.002 * delta;
      posArray[i3 + 2] += Math.cos(t * 0.25 + phase * 1.5) * 0.003 * delta;

      // Keep within cone bounds — soft clamp (guard div-by-zero / NaN blow-up)
      const y = posArray[i3 + 1];
      const normalY = (halfHeight - y) / c.height; // 0 at bottom, 1 at top
      const maxR = Math.max(
        0,
        c.topRadius + (c.bottomRadius - c.topRadius) * (1 - normalY),
      );
      const dist = Math.hypot(posArray[i3], posArray[i3 + 2]);

      if (dist > maxR * 0.9 && dist > 1e-6) {
        const scale = (maxR * 0.85) / dist;
        posArray[i3] *= scale;
        posArray[i3 + 2] *= scale;
      }

      // Wrap Y
      if (posArray[i3 + 1] > halfHeight) posArray[i3 + 1] = -halfHeight;
      if (posArray[i3 + 1] < -halfHeight) posArray[i3 + 1] = halfHeight;
    }

    if (sanitizePositionArray(posArray)) {
      sanitizeBufferGeometryPositions(pointsRef.current.geometry);
    }

    posAttr.needsUpdate = true;

    // Pulsing opacity via ref
    if (materialRef.current) {
      materialRef.current.opacity = 0.3 + 0.15 * Math.sin(t * 0.8);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={c.dustColor}
        size={(c.dustSizeRange[0] + c.dustSizeRange[1]) / 2}
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
