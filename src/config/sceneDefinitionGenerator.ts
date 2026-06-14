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
import { getSceneLocationCategory } from '@/config/sceneLocationCategories';

/** Top surface of the auto-generated structural floor cuboid (SceneColliderSelector). */
export const DEFAULT_FLOOR_Y = 0.01;
/** Half-height of the structural floor cuboid — keeps top at floorY, bottom below for anti-tunneling. */
export const STRUCTURAL_FLOOR_HALF_HEIGHT = 0.5;

/** Resolve walkable floor Y from spawn, explicit override, and floor collider tops. */
export function resolveSceneFloorY(def: SceneDefinition): number {
  if (def.floorY !== undefined) return def.floorY;

  const floorColliderTops = def.floors.map((f) => f.position[1] + f.size[1]);
  const colliderTop = floorColliderTops.length > 0
    ? Math.max(...floorColliderTops)
    : Number.NEGATIVE_INFINITY;

  return Math.max(def.defaultSpawn[1], colliderTop, DEFAULT_FLOOR_Y);
}

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
    floorY: resolveSceneFloorY(def),
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
    locationCategory: def.locationCategory ?? getSceneLocationCategory(def.id),
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

/** How close a wall/doorway must sit to ±w/2 / ±d/2 to count as perimeter. */
const PERIMETER_TOLERANCE = 0.35;
/** Doorways within this distance of a boundary plane cut an opening in it. */
const DOORWAY_SIDE_TOLERANCE = 0.75;
/** Extra clearance on each side of a doorway opening. */
const DOORWAY_OPEN_MARGIN = 0.15;
/** How far behind the boundary plane the alcove backstop sits. */
const DOORWAY_BACKSTOP_OFFSET = 0.6;

const STRUCTURAL_WALL_HEIGHT = 4;
const STRUCTURAL_WALL_THICKNESS = 0.5;

/** Walls that sit on the scene boundary duplicate the structural perimeter
 *  (and would block doorway openings) — SceneStructuralColliders owns those. */
function isPerimeterWall(def: SceneDefinition, wall: ColliderDef): boolean {
  const halfW = def.dimensions[0] / 2;
  const halfD = def.dimensions[2] / 2;
  const [x, , z] = wall.position;
  const onX = Math.abs(Math.abs(x) - halfW) < PERIMETER_TOLERANCE && Math.abs(z) < halfD + PERIMETER_TOLERANCE;
  const onZ = Math.abs(Math.abs(z) - halfD) < PERIMETER_TOLERANCE && Math.abs(x) < halfW + PERIMETER_TOLERANCE;
  return onX || onZ;
}

/** Generate collider arrays from a SceneDefinition.
 *  Perimeter walls are filtered out — boundary physics comes from
 *  generateBoundaryWallSegments (doorway-aware, no double walls). */
export function generateColliders(def: SceneDefinition): GeneratedColliders {
  return {
    floors: def.floors,
    walls: def.walls.filter((wall) => !isPerimeterWall(def, wall)),
    obstacles: def.obstacles,
    ceilings: def.ceilings,
  };
}

interface BoundarySide {
  /** Axis the wall plane is fixed on */
  axis: 'x' | 'z';
  sign: 1 | -1;
  label: string;
}

const BOUNDARY_SIDES: BoundarySide[] = [
  { axis: 'x', sign: -1, label: 'left' },
  { axis: 'x', sign: 1, label: 'right' },
  { axis: 'z', sign: -1, label: 'back' },
  { axis: 'z', sign: 1, label: 'front' },
];

/**
 * Doorway-aware boundary walls.
 * Each of the four boundary planes is split into solid segments around any
 * doorway that sits on that plane, plus a recessed "backstop" cuboid behind
 * each opening — the player can step into the door alcove but never leave
 * the playable area. Scenes without perimeter doorways get four solid walls
 * (identical to the previous behaviour).
 */
export function generateBoundaryWallSegments(def: SceneDefinition): ColliderDef[] {
  const halfW = def.dimensions[0] / 2;
  const halfD = def.dimensions[2] / 2;
  const halfH = STRUCTURAL_WALL_HEIGHT / 2;
  const halfT = STRUCTURAL_WALL_THICKNESS / 2;

  const segments: ColliderDef[] = [];

  for (const side of BOUNDARY_SIDES) {
    const planeCoord = (side.axis === 'x' ? halfW : halfD) * side.sign;
    const halfSpan = side.axis === 'x' ? halfD : halfW;

    const openings = def.doorways
      .filter((dw) => {
        const fixed = side.axis === 'x' ? dw.position[0] : dw.position[2];
        return Math.abs(fixed - planeCoord) < DOORWAY_SIDE_TOLERANCE;
      })
      .map((dw) => {
        const along = side.axis === 'x' ? dw.position[2] : dw.position[0];
        const half = dw.width / 2 + DOORWAY_OPEN_MARGIN;
        return [along - half, along + half] as [number, number];
      })
      .sort((a, b) => a[0] - b[0]);

    const makeSegment = (
      from: number,
      to: number,
      planeOffset: number,
      name: string,
    ): ColliderDef => {
      const length = to - from;
      const center = (from + to) / 2;
      const coord = planeCoord + planeOffset * side.sign;
      return side.axis === 'x'
        ? {
            type: 'cuboidObstacle',
            size: [halfT, halfH, length / 2],
            position: [coord, halfH, center],
            name,
          }
        : {
            type: 'cuboidObstacle',
            size: [length / 2, halfH, halfT],
            position: [center, halfH, coord],
            name,
          };
    };

    // Solid wall segments between openings
    let cursor = -halfSpan;
    let index = 0;
    for (const [openStart, openEnd] of openings) {
      if (openStart - cursor > 0.05) {
        segments.push(makeSegment(cursor, openStart, 0, `structural_wall_${side.label}_${index++}`));
      }
      cursor = Math.max(cursor, openEnd);
    }
    if (halfSpan - cursor > 0.05) {
      segments.push(makeSegment(cursor, halfSpan, 0, `structural_wall_${side.label}_${index++}`));
    }

    // Recessed backstop behind each opening (overlaps adjacent segments)
    for (const [openStart, openEnd] of openings) {
      segments.push(
        makeSegment(
          openStart - 0.4,
          openEnd + 0.4,
          DOORWAY_BACKSTOP_OFFSET,
          `structural_backstop_${side.label}`,
        ),
      );
    }
  }

  return segments;
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
