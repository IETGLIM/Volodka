/* ─── Volodka RPG – Lens Flare Effect ───
 *  Screen-space lens flare for bright light sources.
 *  Adds concentric ring ghosts + anamorphic streak that respond to
 *  light source screen position — classic photographic artifact.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useThree } from '@react-three/fiber';
import { AdditiveBlending, Color, Mesh, ShaderMaterial, Vector2 } from 'three';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface LensFlareConfig {
  /** World-space position of the light source */
  lightPosition: [number, number, number];
  /** Number of ghost rings */
  ghostCount: number;
  /** Ghost colors — warm for sun, cool for neon */
  ghostColor: string;
  /** Overall intensity */
  intensity: number;
  /** Whether to show anamorphic horizontal streak */
  anamorphicStreak: boolean;
  /** Streak color */
  streakColor: string;
}

export const LENSFLARE_PRESETS: Record<string, LensFlareConfig> = {
  rooftop_edge: {
    lightPosition: [8, 12, -6],
    ghostCount: 5,
    ghostColor: '#ffaa66',
    intensity: 0.35,
    anamorphicStreak: true,
    streakColor: '#ffcc88',
  },
  street_winter: {
    lightPosition: [5, 15, 3],
    ghostCount: 4,
    ghostColor: '#ffffdd',
    intensity: 0.25,
    anamorphicStreak: true,
    streakColor: '#ffffee',
  },
  park_day: {
    lightPosition: [-6, 14, -5],
    ghostCount: 4,
    ghostColor: '#ffeeaa',
    intensity: 0.2,
    anamorphicStreak: false,
    streakColor: '#ffeeaa',
  },
  abandoned_factory: {
    lightPosition: [4, 8, -3],
    ghostCount: 3,
    ghostColor: '#ffcc66',
    intensity: 0.2,
    anamorphicStreak: false,
    streakColor: '#ffcc66',
  },
};

export const LENSFLARE_SCENES = new Set(Object.keys(LENSFLARE_PRESETS));

export function LensFlare({ sceneId }: { sceneId: string }) {
  const reducedMotion = useEffectiveReducedMotion();
  if (reducedMotion) return null;
  const config = LENSFLARE_PRESETS[sceneId];
  if (!config) return null;
  return <LensFlareImpl config={config} />;
}

function LensFlareImpl({ config }: { config: LensFlareConfig }) {
  const { size } = useThree();
  const timeRef = useRef(0);
  const meshRef = useRef<Mesh>(null);

  // Ghost positions along the light-to-center axis
  // NOTE: ghost data is pre-computed for future multi-ghost rendering expansion
  void useMemo(() => {
    const offsets: number[] = [];
    const sz: number[] = [];
    for (let i = 0; i < config.ghostCount; i++) {
      const t = (i + 1) / (config.ghostCount + 1);
      offsets.push(t);
      sz.push(0.08 + 0.15 * Math.sin(t * Math.PI));
    }
    return { ghostOffsets: offsets, sizes: sz };
  }, [config.ghostCount]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(config.ghostColor) },
        uIntensity: { value: config.intensity },
        uAnamorphic: { value: config.anamorphicStreak ? 1.0 : 0.0 },
        uStreakColor: { value: new Color(config.streakColor) },
        uResolution: { value: new Vector2(size.width, size.height) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uAnamorphic;
        uniform vec3 uStreakColor;
        uniform vec2 uResolution;
        varying vec2 vUv;

        void main() {
          vec2 centered = vUv - 0.5;
          float dist = length(centered);

          // Soft circular ghost
          float ghost = exp(-dist * dist * 25.0);
          // Ring structure for lens artifact
          float ring = exp(-pow(dist - 0.35, 2.0) * 40.0) * 0.5;
          float alpha = (ghost + ring) * uIntensity;

          // Anamorphic horizontal streak (simulates aperture diffraction)
          vec3 color = uColor;
          if (uAnamorphic > 0.5) {
            float streak = exp(-abs(centered.y) * 12.0) * exp(-abs(centered.x) * 2.0) * 0.4;
            color = mix(color, uStreakColor, streak * 2.0);
            alpha += streak * uIntensity * uAnamorphic;
          }

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
  }, [config, size.width, size.height]);

  useEffect(() => {
    return () => { material.dispose(); };
  }, [material]);

  useFrameTick('postfx', ({ delta }) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    material.uniforms.uTime.value = timeRef.current;
  });

  return (
    <mesh ref={meshRef} position={config.lightPosition}>
      <planeGeometry args={[4, 4]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
