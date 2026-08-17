'use client';

/* ─── Volodka RPG – Lightweight Screen-Space Rain Effect ───
 *
 * GPU-efficient rain using Three.js Points/BufferGeometry — single draw call.
 * Fades in/out based on weather state from explorationStore.
 * Complements the existing RainSystem with a denser, more atmospheric layer.
 */

import { useRef, useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useExplorationStore } from '@/store/stores/explorationStore';

interface RainEffectProps {
  /** Number of rain drops (default 3000). Range: 1000-5000. */
  density?: number;
  /** Fall speed multiplier (default 1.0) */
  speed?: number;
  /** Wind angle in radians (default 0.2 — slight diagonal) */
  windAngle?: number;
  /** Bounding box dimensions [width, height, depth] */
  bounds?: [number, number, number];
}

const DEFAULT_BOUNDS: [number, number, number] = [40, 20, 40];

const RAIN_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uWindAngle;
  uniform float uFade;
  uniform vec3 uBounds;

  varying float vAlpha;

  void main() {
    float t = uTime * uSpeed;
    float bx = uBounds.x;
    float by = uBounds.y;
    float bz = uBounds.z;

    // Wrap Y position cyclically
    float y = mod(position.y - t * 8.0, by) - by * 0.5;

    // Wind drift
    float windX = sin(uWindAngle) * t * 1.5;
    float windZ = cos(uWindAngle) * t * 0.5;
    float x = mod(position.x + windX + bx * 0.5, bx) - bx * 0.5;
    float z = mod(position.z + windZ + bz * 0.5, bz) - bz * 0.5;

    vec4 mvPos = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // Distance-based size + fade
    float dist = -mvPos.z;
    gl_PointSize = max(1.0, 2.5 - dist * 0.04);

    // Vertical fade: dimmer near top, brighter near bottom
    float vertFade = smoothstep(-by * 0.5, -by * 0.1, y);
    vAlpha = vertFade * uFade * 0.6;
  }
`;

const RAIN_FRAGMENT = /* glsl */ `
  varying float vAlpha;

  void main() {
    // Elongated raindrop shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float d = length(center * vec2(1.0, 0.25));

    if (d > 0.5) discard;

    float edge = 1.0 - smoothstep(0.3, 0.5, d);
    gl_FragColor = vec4(0.6, 0.85, 1.0, edge * vAlpha);
  }
`;

export function RainEffect({
  density = 3000,
  speed = 1.0,
  windAngle = 0.2,
  bounds = DEFAULT_BOUNDS,
}: RainEffectProps) {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const fadeRef = useRef(0);

  const weatherEnabled = useExplorationStore((s) => s.weatherEnabled);
  const rainIntensity = useExplorationStore((s) => s.rainIntensity);

  const clampedDensity = Math.max(1000, Math.min(5000, density));

  // Build rain drop positions — spread across bounding box
  const geometry = useMemo(() => {
    const positions = new Float32Array(clampedDensity * 3);
    const [bx, by, bz] = bounds;

    for (let i = 0; i < clampedDensity; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * bx;
      positions[i3 + 1] = (Math.random() - 0.5) * by;
      positions[i3 + 2] = (Math.random() - 0.5) * bz;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    return geo;
  }, [clampedDensity, bounds[0], bounds[1], bounds[2]]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uWindAngle: { value: windAngle },
      uFade: { value: 0 },
      uBounds: { value: new Vector3(bounds[0], bounds[1], bounds[2]) },
    }),
    [speed, windAngle, bounds[0], bounds[1], bounds[2]],
  );

  // Animate: update time + smooth fade in/out
  useFrameTick('misc', (ctx) => {
    if (!materialRef.current) return;

    const mat = materialRef.current;
    const dt = ctx.delta;
    mat.uniforms.uTime.value += dt;

    // Target fade based on weather state
    const targetFade = weatherEnabled && rainIntensity > 0 ? rainIntensity : 0;
    // Smooth interpolation
    fadeRef.current += (targetFade - fadeRef.current) * Math.min(1, dt * 2);
    mat.uniforms.uFade.value = fadeRef.current;

    // Hide completely when faded out
    if (pointsRef.current) {
      pointsRef.current.visible = fadeRef.current > 0.01;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={RAIN_VERTEX}
        fragmentShader={RAIN_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
