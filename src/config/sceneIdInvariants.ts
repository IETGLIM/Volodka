/**
 * Cross-registry SceneId invariant checks.
 * Keeps SCENE_DEFINITIONS, visual selector, world registry, inheritance,
 * asset ownership, NPC schedules, and deploy keep-list aligned.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SceneId } from '@/config/sceneIds';
import {
  CORE_SCENE_IDS,
  EXTENSION_SCENE_IDS,
  SCENE_IDS,
} from '@/config/sceneIds';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { SCENE_CONFIG } from '@/config/scenes';
import {
  SCENE_DERIVED_FROM,
  SCENE_SCHEDULE_PARENT,
  resolveDerivedSceneId,
} from '@/config/sceneInheritance';
import {
  collectAssetOwnershipPublicUrls,
  getSceneSlotOwnership,
  SCENE_ASSET_OWNERSHIP,
} from '@/config/assetOwnership';
import { SCENE_INTERIOR_ASSETS } from '@/config/sceneInteriorAssets';
import { SCENE_PROP_DRESSING } from '@/config/scenePropDressing';
import type { VisualComponentName } from '@/shared/types/sceneDefinition';
import {
  SCENE_CHUNK_COORD,
  WORLD_CELLS,
  WORLD_LOCATIONS,
} from '@/engine/world/worldRegistry';
import { NPC_SCHEDULES, ACT_SCHEDULE_OVERRIDES } from '@/data/npcSchedules';
import type { ScheduleEntry } from '@/shared/types/game';

/** Scene roots with a dedicated VisualScene switch case (not FallbackVisual). */
export const VISUAL_COMPONENT_TO_SCENE_ROOT: Record<VisualComponentName, SceneId> = {
  VolodkaRoomVisual: 'volodka_room',
  VolodkaCorridorVisual: 'volodka_corridor',
  HomeEveningVisual: 'home_evening',
  StreetVisual: 'street_night',
  StreetWinterVisual: 'street_winter',
  CafeVisual: 'cafe_evening',
  OfficeDayVisual: 'office_day',
  ParkVisual: 'park_day',
  LibraryVisual: 'library_day',
  BattleVisual: 'battle',
  DreamVisual: 'sleep_dream',
  RooftopVisual: 'rooftop_edge',
  FactoryVisual: 'abandoned_factory',
  ZaremaAlbertVisual: 'zarema_albert_room',
  SolnyshRoomVisual: 'solnysh_room',
  ChkForestVisual: 'chk_forest_zorge',
  FactoryBasementVisual: 'factory_basement',
  RiverPierVisual: 'river_pier',
  GuildMainframeVisual: 'guild_mainframe',
  CitySquareVisual: 'city_square',
  UndergroundBunkerVisual: 'underground_bunker',
  LibraryBasementVisual: 'library_basement',
  AlbertBackroomVisual: 'albert_backroom',
  ProceduralAaaVisual: 'procedural_aaa',
};

export const VISUAL_SCENE_ROOTS = new Set<SceneId>(
  Object.values(VISUAL_COMPONENT_TO_SCENE_ROOT),
);

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC_ROOT = path.join(REPO_ROOT, 'public');

function collectScheduleSceneIds(): Set<string> {
  const ids = new Set<string>();
  const ingest = (entries: readonly ScheduleEntry[]) => {
    for (const entry of entries) ids.add(entry.sceneId);
  };
  for (const schedule of NPC_SCHEDULES) ingest(schedule.entries);
  for (const override of ACT_SCHEDULE_OVERRIDES) ingest(override.entries);
  return ids;
}

function scenesInWorldCells(): Set<SceneId> {
  const ids = new Set<SceneId>();
  for (const cell of Object.values(WORLD_CELLS)) {
    for (const sceneId of cell.locationSceneIds) ids.add(sceneId);
  }
  return ids;
}

export function validateSceneIdRegistryAlignment(): string[] {
  const errors: string[] = [];
  const definitionIds = Object.keys(SCENE_DEFINITIONS) as SceneId[];
  const definitionSet = new Set(definitionIds);
  const sceneIdSet = new Set(SCENE_IDS);

  for (const sceneId of SCENE_IDS) {
    if (!definitionSet.has(sceneId)) {
      errors.push(`SCENE_IDS includes "${sceneId}" but SCENE_DEFINITIONS is missing it`);
    }
  }

  for (const sceneId of definitionIds) {
    if (!sceneIdSet.has(sceneId)) {
      errors.push(`SCENE_DEFINITIONS includes "${sceneId}" but SCENE_IDS is missing it`);
    }
  }

  for (const sceneId of CORE_SCENE_IDS) {
    if (!definitionSet.has(sceneId)) {
      errors.push(`CORE_SCENE_IDS includes "${sceneId}" but SCENE_DEFINITIONS is missing it`);
    }
  }

  for (const sceneId of EXTENSION_SCENE_IDS) {
    if (!definitionSet.has(sceneId)) {
      errors.push(`EXTENSION_SCENE_IDS includes "${sceneId}" but SCENE_DEFINITIONS is missing it`);
    }
  }

  if (SCENE_IDS.length !== CORE_SCENE_IDS.length + EXTENSION_SCENE_IDS.length) {
    errors.push('SCENE_IDS length does not match CORE_SCENE_IDS + EXTENSION_SCENE_IDS');
  }

  return errors;
}

export function validateSceneVisualCoverage(): string[] {
  const errors: string[] = [];

  for (const sceneId of SCENE_IDS) {
    const def = SCENE_DEFINITIONS[sceneId];
    const visualRoot = resolveDerivedSceneId(sceneId);
    if (!VISUAL_SCENE_ROOTS.has(visualRoot)) {
      errors.push(
        `${sceneId}: resolveDerivedSceneId -> "${visualRoot}" has no VisualScene switch case`,
      );
    }

    const rootFromComponent = VISUAL_COMPONENT_TO_SCENE_ROOT[def.visualComponent];
    if (!rootFromComponent) {
      errors.push(`${sceneId}: unknown visualComponent "${def.visualComponent}"`);
      continue;
    }

    if (rootFromComponent !== visualRoot) {
      errors.push(
        `${sceneId}: visualComponent "${def.visualComponent}" maps to "${rootFromComponent}" ` +
          `but resolveDerivedSceneId -> "${visualRoot}"`,
      );
    }
  }

  for (const [child, parent] of Object.entries(SCENE_DERIVED_FROM) as [SceneId, SceneId][]) {
    if (!SCENE_IDS.includes(child)) {
      errors.push(`SCENE_DERIVED_FROM key "${child}" is not a valid SceneId`);
    }
    if (!SCENE_IDS.includes(parent)) {
      errors.push(`SCENE_DERIVED_FROM["${child}"] parent "${parent}" is not a valid SceneId`);
    }
    if (!VISUAL_SCENE_ROOTS.has(parent)) {
      errors.push(`SCENE_DERIVED_FROM["${child}"] parent "${parent}" lacks a visual root`);
    }
  }

  return errors;
}

export function validateSceneColliderCoverage(): string[] {
  const errors: string[] = [];

  for (const sceneId of SCENE_IDS) {
    const def = SCENE_DEFINITIONS[sceneId];
    if (!def.floors.length) {
      errors.push(`${sceneId}: SceneDefinition has no floor colliders`);
    }
    if (!SCENE_CONFIG[sceneId]) {
      errors.push(`${sceneId}: missing generated SCENE_CONFIG entry`);
    }

    for (const exit of def.exits) {
      if (!SCENE_IDS.includes(exit.targetScene)) {
        errors.push(
          `${sceneId}: exit "${exit.id}" targets unknown scene "${exit.targetScene}"`,
        );
      }
    }
  }

  return errors;
}

export function validateSceneWorldRegistryCoverage(): string[] {
  const errors: string[] = [];
  const cellScenes = scenesInWorldCells();

  for (const sceneId of SCENE_IDS) {
    if (!WORLD_LOCATIONS[sceneId]) {
      errors.push(`${sceneId}: missing WORLD_LOCATIONS entry`);
    }
    if (!SCENE_CHUNK_COORD[sceneId]) {
      errors.push(`${sceneId}: missing SCENE_CHUNK_COORD entry`);
    }
    if (!cellScenes.has(sceneId)) {
      errors.push(`${sceneId}: not listed in any WORLD_CELLS.locationSceneIds`);
    }
  }

  for (const sceneId of Object.keys(SCENE_CHUNK_COORD) as SceneId[]) {
    if (!SCENE_IDS.includes(sceneId)) {
      errors.push(`SCENE_CHUNK_COORD includes orphan scene "${sceneId}"`);
    }
  }

  return errors;
}

export function validateSceneScheduleParents(): string[] {
  const errors: string[] = [];

  for (const [child, parent] of Object.entries(SCENE_SCHEDULE_PARENT) as [SceneId, SceneId][]) {
    if (!SCENE_IDS.includes(child)) {
      errors.push(`SCENE_SCHEDULE_PARENT key "${child}" is not a valid SceneId`);
    }
    if (!SCENE_IDS.includes(parent)) {
      errors.push(`SCENE_SCHEDULE_PARENT["${child}"] parent "${parent}" is not a valid SceneId`);
    }
  }

  const scheduleSceneIds = collectScheduleSceneIds();
  for (const sceneId of scheduleSceneIds) {
    if (!SCENE_IDS.includes(sceneId as SceneId)) {
      errors.push(`NPC schedule references unknown scene "${sceneId}"`);
    }
  }

  return errors;
}

export function validateSceneAssetOwnershipCoverage(): string[] {
  const errors: string[] = [];

  for (const sceneId of Object.keys(SCENE_INTERIOR_ASSETS) as SceneId[]) {
    const ownership = getSceneSlotOwnership(sceneId, 'interior_shell');
    if (!ownership.length) {
      errors.push(`${sceneId}: SCENE_INTERIOR_ASSETS declared but interior_shell ownership missing`);
    }
  }

  for (const entry of SCENE_ASSET_OWNERSHIP) {
    if (entry.owner === 'authored_shell' && entry.systems.includes('prune-deploy-assets')) {
      if (!entry.publicUrls?.length) {
        errors.push(`${entry.sceneId}: authored_shell missing prune-deploy publicUrls`);
      }
    }
  }

  for (const sceneId of Object.keys(SCENE_PROP_DRESSING) as SceneId[]) {
    const streetOwnership = getSceneSlotOwnership(sceneId, 'street_setpiece');
    if (
      streetOwnership.some((entry) => entry.exclusive) &&
      !streetOwnership.some((entry) => entry.systems.includes('ScenePropDressing'))
    ) {
      errors.push(`${sceneId}: street_setpiece ownership blocks ScenePropDressing`);
    }
  }

  return errors;
}

export function validateAssetOwnershipDeployUrls(options?: { checkDisk?: boolean }): string[] {
  const errors: string[] = [];
  const checkDisk = options?.checkDisk ?? true;

  for (const url of collectAssetOwnershipPublicUrls()) {
    if (!url.startsWith('/')) {
      errors.push(`deploy keep-list url "${url}" must be an absolute public path`);
      continue;
    }
    if (!checkDisk) continue;
    const diskPath = path.join(PUBLIC_ROOT, url.replace(/^\//, ''));
    if (!existsSync(diskPath)) {
      errors.push(`deploy keep-list url "${url}" missing on disk at public/${url.slice(1)}`);
    }
  }

  return errors;
}

export function validateAllSceneIdInvariants(options?: { checkDeployDisk?: boolean }): string[] {
  return [
    ...validateSceneIdRegistryAlignment(),
    ...validateSceneVisualCoverage(),
    ...validateSceneColliderCoverage(),
    ...validateSceneWorldRegistryCoverage(),
    ...validateSceneScheduleParents(),
    ...validateSceneAssetOwnershipCoverage(),
    ...validateAssetOwnershipDeployUrls({ checkDisk: options?.checkDeployDisk ?? true }),
  ];
}
