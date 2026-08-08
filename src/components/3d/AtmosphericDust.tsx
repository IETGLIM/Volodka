/** ─── Volodka RPG — Atmospheric Dust Particles ───
 *  Floating dust motes visible in light beams for interior scenes.
 *  Uses Three.js Points with a small sprite texture for performance.
 *  Particles drift slowly and respond to the scene's light direction.
 *
 *  Only visible in interior scenes (rooms, underground, bunkers).
 *  Fades in/out based on scene transitions via EventBus.
 *  Density scales with quality preset.
 *
 *  Cyberpunk palette: subtle cool-white dust with cyan tint near monitors.
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';

/** Interior scenes where dust particles are visible */
const DUST_SCENES = new Set([
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'cafe_evening',
  'office_day',
  'library_day',
  'library_basement',
  'abandoned_factory',
  'factory_basement',
  'guild_mainframe',
  'albert_backroom',
  'underground_bunker',
  'solnysh_room',
  'zarema_albert_room',
]);

/** Particle count per quality tier */
const DUST_COUNTS: Record<string, number> = {
  low: 0,
  medium: 60,
  high: 150,
  ultra: 300,
};

/** Max opacity when fully visible */
const MAX_DUST_OPACITY = 0.4;

/** Creates a small circular sprite texture for dust particles */
function createDustTexture(): THREE.Texture {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Soft circular gradient — center bright, edges transparent
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(220, 230, 240, 0.9)');
  gradient.addColorStop(0.3, 'rgba(200, 210, 225, 0.5)');
  gradient.addColorStop(0.7, 'rgba(180, 190, 210, 0.15)');
  gradient.addColorStop(1, 'rgba(160, 170, 190, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function AtmosphericDust() {
  const { preset } = useGraphicsQuality();
  const reducedMotion = useEffectiveReducedMotion();
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const config = getSceneConfig(sceneId);
  const isIndoor = DUST_SCENES.has(sceneId);

  // Count
  const count = DUST_COUNTS[preset.id] ?? 0;

  // Material ref for imperative opacity updates (avoids re-renders)
  const matRef = useRef<THREE.PointsMaterial>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const targetOpacityRef = useRef(0);
  const currentOpacityRef = useRef(0);
  const velocitiesRef = useRef<Float32Array | null>(null);

  // Texture (shared, created once)
  const texture = useMemo(() => createDustTexture(), []);

  // Scene dimensions for bounds
  const dims = useMemo(() => config.dimensions ?? [10, 3, 10], [config.dimensions]);

  // Initialize velocities and geometry
  useEffect(() => {
    if (count === 0 || !isIndoor) return;

    const w = dims[0] * 0.8;
    const h = dims[1] * 0.8;
    const d = dims[2] * 0.8;

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    velocitiesRef.current = velocities;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * w;
      positions[i * 3 + 1] = Math.random() * h * 0.5 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * d;

      // Slow random drift velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.008 + 0.003;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    const geo = geoRef.current;
    if (!geo) return;

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.attributes.position.needsUpdate = true;

    return () => {
      velocitiesRef.current = null;
    };
  }, [count, isIndoor, dims]);

  // Geometry (created once, updated imperatively)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // Initialize with empty attributes — filled in useEffect
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));
    return geo;
  }, [count]);

  // Track geometry ref
  useEffect(() => {
    geoRef.current = geometry;
  }, [geometry]);

  // Determine target opacity
  useEffect(() => {
    targetOpacityRef.current = isIndoor && !reducedMotion && count > 0 ? MAX_DUST_OPACITY : 0;
  }, [isIndoor, reducedMotion, count]);

  // Fade in/out on scene transitions
  useEffect(() => {
    const unsubStart = eventBus.on('scene:transition_start', () => {
      targetOpacityRef.current = 0;
    });
    const unsubLoaded = eventBus.on('scene:loaded', () => {
      const newSceneId = useGameStore.getState().exploration.currentSceneId;
      targetOpacityRef.current = DUST_SCENES.has(newSceneId) && !reducedMotion && count > 0 ? MAX_DUST_OPACITY : 0;
    });
    return () => {
      unsubStart();
      unsubLoaded();
    };
  }, [count, reducedMotion]);

  // Animate particles
  useFrameTick('misc', ({ delta }) => {
    if (!matRef.current || !geoRef.current) return;

    const velocities = velocitiesRef.current;
    if (!velocities) return;

    // Smooth opacity transition
    const target = targetOpacityRef.current;
    currentOpacityRef.current += (target - currentOpacityRef.current) * Math.min(1, delta * 3);
    matRef.current.opacity = currentOpacityRef.current;

    if (currentOpacityRef.current < 0.005) return;

    const posAttr = geoRef.current.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const halfW = dims[0] * 0.4;
    const halfH = dims[1] * 0.4;
    const halfD = dims[2] * 0.4;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Apply drift velocity
      posArray[i3] += velocities[i3] * delta * 10;
      posArray[i3 + 1] += velocities[i3 + 1] * delta * 10;
      posArray[i3 + 2] += velocities[i3 + 2] * delta * 10;

      // Add subtle sine-wave wobble for organic feel
      posArray[i3] += Math.sin(posArray[i3 + 1] * 2 + i) * 0.0005;
      posArray[i3 + 2] += Math.cos(posArray[i3 + 1] * 1.7 + i * 0.5) * 0.0005;

      // Wrap around scene bounds
      if (posArray[i3] > halfW) posArray[i3] = -halfW;
      if (posArray[i3] < -halfW) posArray[i3] = halfW;
      if (posArray[i3 + 1] > halfH) {
        posArray[i3 + 1] = 0.2;
        posArray[i3] = (Math.random() - 0.5) * dims[0] * 0.8;
        posArray[i3 + 2] = (Math.random() - 0.5) * dims[2] * 0.8;
      }
      if (posArray[i3 + 1] < 0.1) posArray[i3 + 1] = halfH;
      if (posArray[i3 + 2] > halfD) posArray[i3 + 2] = -halfD;
      if (posArray[i3 + 2] < -halfD) posArray[i3 + 2] = halfD;
    }

    posAttr.needsUpdate = true;
  });

  // Don't render at all if no particles or not indoor
  if (count === 0 || !isIndoor) return null;

  return (
    <points
      geometry={geometry}
      frustumCulled={false}
      renderOrder={998}
    >
      <pointsMaterial
        ref={matRef}
        map={texture}
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#c8d0e0"
        toneMapped={false}
      />
    </points>
  );
}
