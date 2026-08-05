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
import { generateAllSceneConfigs, getSceneWalkableBounds, type SceneWalkableBounds } from '@/config/sceneDefinitionGenerator';
import { checkStoryCondition } from '@/shared/storyConditions';
import type { StoryConditionContext } from '@/shared/storyConditions';
import { DEFAULT_SKILLS } from '@/data/constants';

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

/** Walkable floor footprint for SimplePlayer boundary clamp (floor colliders, not scene dimensions). */
export function getExplorationWalkableBounds(sceneId: SceneId): SceneWalkableBounds {
  const def = SCENE_DEFINITIONS[sceneId] ?? SCENE_DEFINITIONS.volodka_room;
  return getSceneWalkableBounds(def);
}

/** Acceleration / damping multipliers for tight indoor spaces. */
export interface ExplorationMovementTuning {
  accel: number;
  damping: number;
}

const DEFAULT_MOVEMENT_TUNING: ExplorationMovementTuning = { accel: 22, damping: 11 };

const SCENE_MOVEMENT_TUNING: Partial<Record<SceneId, ExplorationMovementTuning>> = {
  volodka_room: { accel: 28, damping: 13 },
  volodka_corridor: { accel: 26, damping: 12 },
  home_evening: { accel: 24, damping: 12 },
  cafe_evening: { accel: 24, damping: 11.5 },
  office_day: { accel: 25, damping: 12 },
  library_day: { accel: 24, damping: 12 },
  library_basement: { accel: 27, damping: 13 },
  guild_mainframe: { accel: 23, damping: 11 },
  albert_backroom: { accel: 26, damping: 13 },
  underground_bunker: { accel: 25, damping: 12 },
  factory_basement: { accel: 24, damping: 11 },
  abandoned_factory: { accel: 20, damping: 10 },
  zarema_albert_room: { accel: 26, damping: 12.5 },
  solnysh_room: { accel: 25, damping: 12 },
  street_night: { accel: 18, damping: 9 },
  city_square: { accel: 18, damping: 9 },
  street_winter: { accel: 19, damping: 9.5 },
  park_day: { accel: 17, damping: 8.5 },
  river_pier: { accel: 19, damping: 9 },
  pier_evening: { accel: 19, damping: 9 },
  rooftop_edge: { accel: 20, damping: 9.5 },
  factory_roof: { accel: 20, damping: 9.5 },
  chk_forest_zorge: { accel: 18, damping: 9 },
  chk_campfire_night: { accel: 20, damping: 10 },
  sleep_dream: { accel: 16, damping: 8 },
};

/** Tighter accel/damping in cramped interiors — less ice-skating, more AAA weight */
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

/** Optional context for exit condition gates beyond flags/karma. */
export type SceneExitFilterExtras = Partial<
  Omit<StoryConditionContext, 'karma' | 'flags'>
>;

/**
 * Get the exits for a given scene, filtered by player flags and karma.
 * Returns only exits the player can currently use.
 */
export function getSceneExits(
  sceneId: SceneId,
  playerFlags: Record<string, boolean>,
  playerKarma: number,
  extras: SceneExitFilterExtras = {},
): SceneExit[] {
  const config = getSceneConfig(sceneId);
  const exits = config.exits ?? [];
  const conditionContext: StoryConditionContext = {
    karma: playerKarma,
    flags: playerFlags,
    skills: extras.skills ?? DEFAULT_SKILLS,
    collectedPoems: extras.collectedPoems ?? [],
    currentAct: extras.currentAct ?? 1,
    npcRelations: extras.npcRelations,
    npcId: extras.npcId,
    timeOfDay: extras.timeOfDay,
  };

  return exits.filter((exit) => {
    if (exit.condition) {
      return checkStoryCondition(exit.condition, conditionContext).pass;
    }

    if (exit.requiredFlag && !playerFlags[exit.requiredFlag]) {
      return false;
    }
    if (exit.minKarma !== undefined && playerKarma < exit.minKarma) {
      return false;
    }
    if (exit.maxKarma !== undefined && playerKarma > exit.maxKarma) {
      return false;
    }
    return true;
  });
}
