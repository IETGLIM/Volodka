/** ─── Volodka RPG — Scene Light Fixtures ───
 *  Mounts visible light fixture components (NeonSignFixture, StreetLampFixture,
 *  MonitorGlowFixture) per scene type. These add emissive meshes that physically
 *  represent light sources, complementing the abstract point lights in Lighting.tsx.
 *
 *  Quality-gated: medium+ (fixtures include meshes + point lights).
 *  Cyberpunk palette: cyan #00e5ff, amber #ffaa44, emerald #00ff88.
 */

'use client';

import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { NeonSignFixture } from './SceneLightFixture';
import { StreetLampFixture } from './SceneLightFixture';
import { MonitorGlowFixture } from './SceneLightFixture';
import type { SceneId } from '@/shared/types/game';

/** Per-scene fixture configuration — positions align with accent lights in Lighting.tsx */
interface FixtureConfig {
  type: 'neon' | 'street_lamp' | 'monitor';
  position: [number, number, number];
  color: string;
  intensity?: number;
  distance?: number;
  width?: number;
  height?: number;
  rotation?: [number, number, number];
  animated?: 'neon_flicker' | 'pulse' | 'off';
  seed?: number;
  scanlineEffect?: boolean;
  castShadow?: boolean;
}

const SCENE_FIXTURES: Partial<Record<SceneId, FixtureConfig[]>> = {
  street_night: [
    // Neon signs along the street — matching accent light positions
    { type: 'neon', position: [-6, 3, -2], color: '#d88a9c', intensity: 0.5, distance: 6, width: 0.6, height: 0.25, rotation: [0, 0.3, 0], animated: 'neon_flicker', seed: 1 },
    { type: 'neon', position: [5, 3, -3], color: '#8fb8b8', intensity: 0.5, distance: 6, width: 0.5, height: 0.2, rotation: [0, -0.5, 0], animated: 'neon_flicker', seed: 2 },
    { type: 'neon', position: [-8, 3, 5], color: '#cf8f96', intensity: 0.4, distance: 5, width: 0.55, height: 0.22, rotation: [0, 1.2, 0], animated: 'neon_flicker', seed: 3 },
    // Street lamps
    { type: 'street_lamp', position: [2, 2.5, 1], color: '#ffaa66', intensity: 1.2, distance: 8, seed: 10 },
    { type: 'street_lamp', position: [7, 2.8, 0], color: '#ffcc88', intensity: 1.0, distance: 8, seed: 11 },
  ],
  city_square: [
    { type: 'neon', position: [-8, 3.4, -6], color: '#55e8dd', intensity: 0.5, distance: 8, width: 0.7, height: 0.3, rotation: [0, 0.8, 0], animated: 'neon_flicker', seed: 4 },
    { type: 'neon', position: [8, 3.2, 7], color: '#ff6688', intensity: 0.5, distance: 7, width: 0.65, height: 0.28, rotation: [0, -1.0, 0], animated: 'neon_flicker', seed: 5 },
    { type: 'street_lamp', position: [0, 4.2, 0], color: '#ffcc88', intensity: 1.5, distance: 12, seed: 12 },
    { type: 'street_lamp', position: [-5, 3.0, 5], color: '#ffcc88', intensity: 1.2, distance: 10, seed: 13 },
  ],
  volodka_room: [
    // Monitor glow — cyan terminal on the desk
    { type: 'monitor', position: [1.2, 1.4, -2.5], color: '#00e5ff', intensity: 0.8, distance: 4, width: 0.5, height: 0.35, rotation: [0, 0, 0], scanlineEffect: true },
    // Neon accent strip above the door
    { type: 'neon', position: [0, 2.4, 3.5], color: '#00e5ff', intensity: 0.3, distance: 5, width: 0.8, height: 0.06, rotation: [0, Math.PI, 0], animated: 'pulse', seed: 6 },
  ],
  volodka_corridor: [
    { type: 'neon', position: [0, 2.5, 0], color: '#ccaa55', intensity: 0.4, distance: 6, width: 0.5, height: 0.08, rotation: [Math.PI / 2, 0, 0], animated: 'pulse', seed: 7 },
  ],
  cafe_evening: [
    { type: 'neon', position: [-3, 2.5, -1], color: '#6688cc', intensity: 0.5, distance: 6, width: 0.6, height: 0.25, rotation: [0, 0.2, 0], animated: 'neon_flicker', seed: 8 },
    { type: 'monitor', position: [2, 2.2, 2], color: '#5f74aa', intensity: 0.6, distance: 4, width: 0.4, height: 0.3, rotation: [0, -0.3, 0], scanlineEffect: true },
  ],
  guild_mainframe: [
    // Server rack monitors
    { type: 'monitor', position: [-3, 2, -2], color: '#00e5ff', intensity: 1.0, distance: 5, width: 0.5, height: 0.35, rotation: [0, 0.5, 0], scanlineEffect: true },
    { type: 'monitor', position: [3, 2, -4], color: '#44ddff', intensity: 0.9, distance: 5, width: 0.45, height: 0.32, rotation: [0, -0.4, 0], scanlineEffect: true },
    { type: 'monitor', position: [0, 2.2, -5.2], color: '#00ff88', intensity: 0.7, distance: 4, width: 0.4, height: 0.3, rotation: [0, 0, 0], scanlineEffect: true },
  ],
  abandoned_factory: [
    // Industrial warning lights
    { type: 'neon', position: [-2, 2.5, 2], color: '#ff8833', intensity: 0.6, distance: 7, width: 0.3, height: 0.15, rotation: [0, 0, 0], animated: 'neon_flicker', seed: 14 },
    { type: 'neon', position: [4, 2, -3], color: '#dd6622', intensity: 0.5, distance: 6, width: 0.25, height: 0.12, rotation: [0, 1.5, 0], animated: 'neon_flicker', seed: 15 },
  ],
  factory_basement: [
    // Emergency green strips
    { type: 'neon', position: [0, 2.6, -5], color: '#00ff88', intensity: 0.6, distance: 6, width: 0.6, height: 0.06, rotation: [Math.PI / 2, 0, 0], animated: 'pulse', seed: 16 },
    { type: 'neon', position: [2, 2, -2], color: '#44ffaa', intensity: 0.5, distance: 5, width: 0.5, height: 0.06, rotation: [Math.PI / 2, 0, 0], animated: 'pulse', seed: 17 },
  ],
  underground_bunker: [
    // Cold emergency lights
    { type: 'neon', position: [0, 2.2, -4], color: '#44ff88', intensity: 0.5, distance: 6, width: 0.7, height: 0.06, rotation: [Math.PI / 2, 0, 0], animated: 'pulse', seed: 18 },
    { type: 'neon', position: [-4, 2.0, 2], color: '#ff5544', intensity: 0.4, distance: 5, width: 0.25, height: 0.15, rotation: [0, 1.0, 0], animated: 'neon_flicker', seed: 19 },
    { type: 'monitor', position: [3.5, 1.8, 3], color: '#6688aa', intensity: 0.4, distance: 4, width: 0.35, height: 0.25, rotation: [0, -0.8, 0], scanlineEffect: true },
  ],
  home_evening: [
    // Warm window lamp
    { type: 'street_lamp', position: [0.5, 1.8, -0.5], color: '#ff9944', intensity: 0.8, distance: 6, seed: 20 },
  ],
  albert_backroom: [
    // Desk lamp glow + neon accent
    { type: 'street_lamp', position: [0, 2, -0.5], color: '#ddaa55', intensity: 0.7, distance: 5, seed: 21 },
    { type: 'neon', position: [2.2, 1.8, 0], color: '#ff4499', intensity: 0.4, distance: 4, width: 0.3, height: 0.15, rotation: [0, -1.2, 0], animated: 'neon_flicker', seed: 22 },
  ],
};

/** Renders a single fixture config as the appropriate component */
function FixtureRenderer({ config }: { config: FixtureConfig }) {
  switch (config.type) {
    case 'neon':
      return (
        <NeonSignFixture
          position={config.position}
          color={config.color}
          intensity={config.intensity ?? 0.5}
          distance={config.distance ?? 6}
          width={config.width ?? 0.6}
          height={config.height ?? 0.25}
          rotation={config.rotation ?? [0, 0, 0]}
          animated={config.animated ?? 'neon_flicker'}
          seed={config.seed ?? 0}
        />
      );
    case 'street_lamp':
      return (
        <StreetLampFixture
          position={config.position}
          color={config.color}
          intensity={config.intensity ?? 1.0}
          distance={config.distance ?? 8}
          castShadow={config.castShadow}
          seed={config.seed ?? 0}
        />
      );
    case 'monitor':
      return (
        <MonitorGlowFixture
          position={config.position}
          color={config.color}
          intensity={config.intensity ?? 0.8}
          distance={config.distance ?? 4}
          width={config.width ?? 0.5}
          height={config.height ?? 0.35}
          rotation={config.rotation ?? [0, 0, 0]}
          scanlineEffect={config.scanlineEffect}
        />
      );
  }
}

/**
 * SceneLightFixtures — mounts visible light fixture meshes per scene.
 * Quality-gated: medium+ only (adds point lights + meshes per scene).
 */
export function SceneLightFixtures() {
  const { preset } = useGraphicsQuality();
  const sceneId = useGameStore((s) => s.exploration.currentSceneId) as SceneId;

  // Skip on low quality — fixtures add point lights that impact mobile GPUs
  if (preset.id === 'low') return null;

  const fixtures = SCENE_FIXTURES[sceneId];
  if (!fixtures || fixtures.length === 0) return null;

  // On medium quality, limit to first 3 fixtures
  const effectiveFixtures = preset.id === 'medium' ? fixtures.slice(0, 3) : fixtures;

  return (
    <group>
      {effectiveFixtures.map((config, i) => (
        <FixtureRenderer
          key={`fixture-${sceneId}-${i}`}
          config={config}
        />
      ))}
    </group>
  );
}
