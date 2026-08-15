/** ─── Volodka RPG — Light Fixture Components ───
 *  Reusable 3D light fixtures for neon signs, street lamps, monitor glow.
 *  Each fixture combines a point light with a small emissive mesh (the
 *  visible bulb/sign) that matches the light's color, giving scene
 *  props a sense of physical light emission.
 *
 *  Cyberpunk palette: cyan #00e5ff, amber #ffaa44, emerald #00ff88.
 */

'use client';

import { useRef, useMemo, type ReactNode } from 'react';
import { DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, PointLight, SphereGeometry } from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { getShadowMapResolution } from '@/engine/graphics/TimeOfDayLighting';

export type FixtureType = 'neon_sign' | 'street_lamp' | 'monitor_glow' | 'candle' | 'industrial';

interface LightFixtureBaseProps {
  position: [number, number, number];
  color: string;
  intensity: number;
  distance: number;
  decay?: number;
  castShadow?: boolean;
  /** Optional emissive mesh — rendered as the visible light source */
  emissiveMesh?: ReactNode;
  /** Animation type */
  animated?: 'neon_flicker' | 'candle_flicker' | 'pulse' | 'off';
  /** Animation seed for variation */
  seed?: number;
}

/** Neon sign fixture — colored point light + emissive plane.
 *  Typical use: bar signs, shop windows, cyberpunk advertising. */
export function NeonSignFixture({
  position,
  color = '#ff6688',
  intensity = 2,
  distance = 8,
  castShadow = false,
  width = 0.6,
  height = 0.3,
  rotation = [0, 0, 0] as [number, number, number],
  animated = 'neon_flicker',
  seed = 0,
}: Omit<LightFixtureBaseProps, 'emissiveMesh'> & {
  width?: number;
  height?: number;
  rotation?: [number, number, number];
}) {
  const { preset } = useGraphicsQuality();
  const lightRef = useRef<PointLight>(null);
  const meshRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  const shadowRes = getShadowMapResolution(preset.id as any);

  const geometry = useMemo(
    () => new PlaneGeometry(width, height),
    [width, height],
  );

  useFrameTick('misc', ({ delta }) => {
    if (!lightRef.current || !meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const mat = meshRef.current.material as MeshBasicMaterial;

    switch (animated) {
      case 'neon_flicker': {
        // Cyberpunk neon flicker — occasional sharp drop then recovery
        const flicker = Math.sin(t * 12 + seed * 3) > 0.92
          ? 0.3 + Math.random() * 0.2
          : 0.85 + 0.15 * Math.sin(t * 0.8 + seed);
        lightRef.current.intensity = intensity * flicker;
        mat.opacity = flicker;
        break;
      }
      case 'pulse': {
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.5 + seed);
        lightRef.current.intensity = intensity * pulse;
        mat.opacity = pulse;
        break;
      }
      default:
        break;
    }
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        distance={distance}
        decay={2}
        castShadow={castShadow && shadowRes > 0}
        shadow-mapSize-width={shadowRes}
        shadow-mapSize-height={shadowRes}
        shadow-bias={-0.002}
        shadow-normalBias={0.04}
      />
      <mesh
        ref={meshRef}
        rotation={rotation}
        geometry={geometry}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Street lamp fixture — warm point light + small emissive sphere at the top.
 *  Typical use: street_night, city_square, park paths. */
export function StreetLampFixture({
  position,
  color = '#ffcc88',
  intensity = 3,
  distance = 12,
  castShadow = true,
  animated = 'pulse',
  seed = 0,
}: Omit<LightFixtureBaseProps, 'emissiveMesh'>) {
  void animated;
  const { preset } = useGraphicsQuality();
  const lightRef = useRef<PointLight>(null);
  const meshRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  const shadowRes = getShadowMapResolution(preset.id as any);

  const geometry = useMemo(() => new SphereGeometry(0.12, 8, 6), []);

  useFrameTick('misc', ({ delta }) => {
    if (!lightRef.current || !meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const mat = meshRef.current.material as MeshBasicMaterial;

    // Warm sodium-vapor flicker
    const flicker = 0.9 + 0.1 * Math.sin(t * 8 + seed * 2) * Math.sin(t * 3.7 + seed);
    lightRef.current.intensity = intensity * flicker;
    mat.opacity = 0.8 + 0.2 * flicker;
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        distance={distance}
        decay={2}
        castShadow={castShadow && shadowRes > 0}
        shadow-mapSize-width={shadowRes}
        shadow-mapSize-height={shadowRes}
        shadow-bias={-0.002}
        shadow-normalBias={0.04}
      />
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Monitor glow fixture — dim colored point light + emissive plane.
 *  Simulates CRT/LCD screen glow on nearby surfaces.
 *  Cyberpunk: cyan #00e5ff for terminals, green for Заря-М. */
export function MonitorGlowFixture({
  position,
  color = '#00e5ff',
  intensity = 1.5,
  distance = 5,
  width = 0.5,
  height = 0.35,
  rotation = [0, 0, 0] as [number, number, number],
  scanlineEffect = false,
}: {
  position: [number, number, number];
  color?: string;
  intensity?: number;
  distance?: number;
  width?: number;
  height?: number;
  rotation?: [number, number, number];
  /** Add subtle scanline shimmer to the glow */
  scanlineEffect?: boolean;
}) {
  const lightRef = useRef<PointLight>(null);
  const meshRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  const geometry = useMemo(
    () => new PlaneGeometry(width, height),
    [width, height],
  );

  useFrameTick('misc', ({ delta }) => {
    if (!lightRef.current || !meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const mat = meshRef.current.material as MeshBasicMaterial;

    // Subtle screen flicker (refresh-rate shimmer)
    if (scanlineEffect) {
      const shimmer = 0.92 + 0.08 * Math.sin(t * 30 + position[0] * 5);
      mat.opacity = shimmer;
      lightRef.current.intensity = intensity * shimmer;
    }
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        distance={distance}
        decay={2}
      />
      <mesh
        ref={meshRef}
        rotation={rotation}
        geometry={geometry}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
