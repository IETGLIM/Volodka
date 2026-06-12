/* ─── Volodka RPG – scene configuration (generated) ─── */
/* SCENE_CONFIG is now generated from SceneDefinitions via the generator.
 * This eliminates duplicate data maintenance between scenes.ts and sceneDefinitions.ts.
 *
 * ARCHITECTURE: SceneDefinition (sceneDefinitions.ts) is the single source of truth.
 * SceneConfig entries are generated on import via sceneDefinitionGenerator.ts.
 *
 * Helper functions (getSceneConfig, sanitizeExplorationSceneId, getSceneExits,
 * getExplorationCharacterModelScale, getExplorationLocomotionScale) remain here
 * for backward compatibility with all existing imports. */

import type { SceneConfig, SceneExit } from '@/shared/types/game';
import { SCENE_DEFINITIONS, SCENE_IDS, type SceneId } from '@/config/sceneDefinitions';
import { generateSceneConfig, generateAllSceneConfigs } from '@/config/sceneDefinitionGenerator';

/** Complete scene configuration map — GENERATED from SceneDefinitions.
 *  No more hardcoded data — all scene config derives from sceneDefinitions.ts. */
export const SCENE_CONFIG: Record<SceneId, SceneConfig> = generateAllSceneConfigs(
  SCENE_DEFINITIONS,
) as Record<SceneId, SceneConfig>;

/**
 * Get the scene configuration for a given scene ID.
 * Falls back to volodka_room if the scene ID is not found.
 */
export function getSceneConfig(sceneId: SceneId): SceneConfig {
  return SCENE_CONFIG[sceneId] ?? SCENE_CONFIG['volodka_room'];
}

/** All valid SceneId values — derived from SCENE_DEFINITIONS keys. */
const VALID_SCENE_IDS: SceneId[] = SCENE_IDS;

/**
 * Sanitize an exploration scene ID to ensure it's a valid SceneId.
 * Returns the input if valid, or 'volodka_room' as a safe default.
 */
export function sanitizeExplorationSceneId(sceneId: string): SceneId {
  if ((VALID_SCENE_IDS as string[]).includes(sceneId)) {
    return sceneId as SceneId;
  }
  return 'volodka_room';
}

/**
 * Get the character model scale for a given exploration scene.
 * Accounts for scene-specific proportions (e.g., larger outdoor scenes).
 */
export function getExplorationCharacterModelScale(sceneId: SceneId): number {
  const config = getSceneConfig(sceneId);
  return config.explorationCharacterModelScale;
}

/**
 * Get the locomotion scale for a given exploration scene.
 * Larger outdoor scenes may need faster movement.
 */
export function getExplorationLocomotionScale(sceneId: SceneId): number {
  const config = getSceneConfig(sceneId);
  return config.explorationLocomotionScale;
}

/** Acceleration / damping multipliers for tight indoor spaces. */
export interface ExplorationMovementTuning {
  accel: number;
  damping: number;
}

const DEFAULT_MOVEMENT_TUNING: ExplorationMovementTuning = { accel: 20, damping: 10 };

const SCENE_MOVEMENT_TUNING: Partial<Record<SceneId, ExplorationMovementTuning>> = {
  volodka_room: { accel: 26, damping: 11 },
  volodka_corridor: { accel: 22, damping: 10 },
};

/** Tighter accel/damping in cramped interiors — less ice-skating between furniture. */
export function getExplorationMovementTuning(sceneId: SceneId): ExplorationMovementTuning {
  return SCENE_MOVEMENT_TUNING[sceneId] ?? DEFAULT_MOVEMENT_TUNING;
}

/** Slightly slower walk/run on coarse-pointer devices for tighter touch control. */
export function getTouchLocomotionFactor(): number {
  if (typeof window === 'undefined') return 1;
  return window.matchMedia('(pointer: coarse)').matches ? 0.94 : 1;
}

/** Walkable floor height for a scene (RigidBody Y when grounded). */
export function getSceneFloorY(sceneId: SceneId): number {
  return getSceneConfig(sceneId).floorY;
}

/**
 * Get the exits for a given scene, filtered by player flags and karma.
 * Returns only exits the player can currently use.
 */
export function getSceneExits(
  sceneId: SceneId,
  playerFlags: Record<string, boolean>,
  playerKarma: number,
): SceneExit[] {
  const config = getSceneConfig(sceneId);
  const exits = config.exits ?? [];
  return exits.filter((exit) => {
    // Check required flag
    if (exit.requiredFlag && !playerFlags[exit.requiredFlag]) {
      return false;
    }
    // Check karma requirements
    if (exit.minKarma !== undefined && playerKarma < exit.minKarma) {
      return false;
    }
    if (exit.maxKarma !== undefined && playerKarma > exit.maxKarma) {
      return false;
    }
    return true;
  });
}
