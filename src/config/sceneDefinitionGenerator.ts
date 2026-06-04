/* ─── Volodka RPG – Scene Definition Generator ─── */
/* Utility functions that produce SCENE_CONFIG entries, physics collider data,
 * and SceneColliderSelector mappings from a single SceneDefinition.
 * This eliminates the need to maintain duplicate data across multiple config files.
 *
 * ARCHITECTURE: SceneDefinition is the internal model; SceneConfig is generated
 * on-the-fly — no duplicate data maintenance needed. */

import type { SceneDefinition, ColliderDef, ExitDef, LightDef, FloorMaterial, FogConfig } from '@/shared/types/sceneDefinition';
import { FOG_DEFAULTS } from '@/shared/types/sceneDefinition';
import type { SceneConfig, SceneExit } from '@/shared/types/game';

/** Generate a SCENE_CONFIG entry from a SceneDefinition.
 *  Resolves fog defaults, derives floorMaterial from first floor collider. */
export function generateSceneConfig(def: SceneDefinition): SceneConfig {
  // Derive floor material from the first floor collider (required by FloorColliderDef)
  const floorMaterial: FloorMaterial = def.floors.length > 0
    ? def.floors[0].footstepMaterial
    : 'default';

  // Resolve fog: use explicit config, or defaults if fogEnabled but no config
  const effectiveFog = def.fogEnabled
    ? (def.fog ?? FOG_DEFAULTS)
    : undefined;

  return {
    id: def.id,
    name: def.name,
    size: [def.dimensions[0], def.dimensions[2]], // [width, depth]
    spawnPoint: def.defaultSpawn,
    initialRotation: def.defaultSpawnRotation,
    explorationCharacterModelScale: def.characterModelScale,
    explorationLocomotionScale: def.locomotionScale,
    hasCeiling: def.hasCeiling,
    floorMaterial,
    fogNear: effectiveFog?.near,
    fogFar: effectiveFog?.far,
    ambientColor: def.ambientColor,
    ambientIntensity: def.ambientIntensity,
    groundColor: def.groundColor,
    exits: def.exits.map(generateSceneExit),
    lights: def.lights.map(generateLightConfig),
    ...(def.transitionStyle && { transitionStyle: def.transitionStyle }),
  };
}

/** Generate a SceneExit from an ExitDef.
 *  Resolves doorwayId to position if needed. */
export function generateSceneExit(exit: ExitDef): SceneExit {
  return {
    targetScene: exit.targetScene,
    position: exit.position,
    spawnAt: exit.spawnPosition,
    label: exit.label,
    ...(exit.requiredFlag && { requiredFlag: exit.requiredFlag }),
    ...(exit.minKarma !== undefined && { minKarma: exit.minKarma }),
    ...(exit.maxKarma !== undefined && { maxKarma: exit.maxKarma }),
  };
}

/** Generate a light config from a LightDef */
export function generateLightConfig(light: LightDef): {
  position: [number, number, number];
  intensity: number;
  color: string;
  distance: number;
} {
  return {
    position: light.position,
    intensity: light.intensity,
    color: light.color,
    distance: light.distance,
  };
}

/** Categorized collider arrays generated from a SceneDefinition */
export interface GeneratedColliders {
  floors: ColliderDef[];
  walls: ColliderDef[];
  obstacles: ColliderDef[];
  ceilings: ColliderDef[];
}

/** Generate collider arrays from a SceneDefinition */
export function generateColliders(def: SceneDefinition): GeneratedColliders {
  return {
    floors: def.floors,
    walls: def.walls,
    obstacles: def.obstacles,
    ceilings: def.ceilings,
  };
}

/** Generate all SCENE_CONFIG entries from a map of SceneDefinitions */
export function generateAllSceneConfigs(
  definitions: Record<string, SceneDefinition>,
): Partial<Record<string, SceneConfig>> {
  const configs: Partial<Record<string, SceneConfig>> = {};
  for (const [key, def] of Object.entries(definitions)) {
    configs[key] = generateSceneConfig(def);
  }
  return configs;
}

/** Generate all collider data from a map of SceneDefinitions */
export function generateAllColliders(
  definitions: Record<string, SceneDefinition>,
): Record<string, GeneratedColliders> {
  const colliders: Record<string, GeneratedColliders> = {};
  for (const [key, def] of Object.entries(definitions)) {
    colliders[key] = generateColliders(def);
  }
  return colliders;
}
