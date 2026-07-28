/* ─── Volodka RPG – God Rays (simulated light shafts with dust motes) ───
 *  Creates volumetric-looking light shafts using cylinder/cone meshes
 *  with emissive material and additive blending. Dust motes (Points)
 *  float inside the ray for added realism.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { DEFAULT_RAY, GODRAY_PRESETS, type GodRayConfig } from './godRayPresets';

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

  const c = { ...DEFAULT_RAY, ...config };

  // Cylinder geometry (open-ended cone for light shaft shape)
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(c.topRadius, c.bottomRadius, c.height, 8, 1, true),
    [c.topRadius, c.bottomRadius, c.height],
  );

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

  const c = { ...DEFAULT_RAY, ...config };

  const { positions, phases } = useMemo(() => {
    const count = c.dustCount;
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distribute within a cone shape matching the ray
      const t = Math.random(); // 0 = top, 1 = bottom
      const radius = c.topRadius + (c.bottomRadius - c.topRadius) * t;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;

      pos[i3] = Math.cos(angle) * r;               // X
      pos[i3 + 1] = (0.5 - t) * c.height;          // Y (centered)
      pos[i3 + 2] = Math.sin(angle) * r;            // Z

      pha[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, phases: pha };
  }, [c.dustCount, c.topRadius, c.bottomRadius, c.height]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrameTick('postfx', ({ delta }) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = c.dustCount;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Gentle floating motion
      posArray[i3] += Math.sin(t * 0.3 + phase) * 0.003 * delta;
      posArray[i3 + 1] += Math.sin(t * 0.2 + phase * 2) * 0.002 * delta;
      posArray[i3 + 2] += Math.cos(t * 0.25 + phase * 1.5) * 0.003 * delta;

      // Keep within cone bounds — soft clamp
      const y = posArray[i3 + 1];
      const normalY = (c.height / 2 - y) / c.height; // 0 at bottom, 1 at top
      const maxR = c.topRadius + (c.bottomRadius - c.topRadius) * (1 - normalY);
      const dist = Math.sqrt(posArray[i3] ** 2 + posArray[i3 + 2] ** 2);

      if (dist > maxR * 0.9) {
        const scale = (maxR * 0.85) / dist;
        posArray[i3] *= scale;
        posArray[i3 + 2] *= scale;
      }

      // Wrap Y
      if (posArray[i3 + 1] > c.height / 2) posArray[i3 + 1] = -c.height / 2;
      if (posArray[i3 + 1] < -c.height / 2) posArray[i3 + 1] = c.height / 2;
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
