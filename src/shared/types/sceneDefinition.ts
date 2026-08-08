/* ─── Volodka RPG – Scene Definition types ─── */
/* Single-source-of-truth types for defining scenes.
 * A SceneDefinition captures ALL configuration (layout, colliders, lighting, exits)
 * in one place, from which SCENE_CONFIG entries and physics colliders can be generated.
 *
 * ARCHITECTURE: SceneDefinition is the internal model; SceneConfig is generated
 * on-the-fly via sceneDefinitionGenerator.ts — no duplicate data maintenance. */

import type { SceneId } from '@/config/sceneIds';
import type { SceneAmbienceConfig } from '@/shared/types/ambientSound';
import type { LocationCategory } from '@/shared/types/locationCategory';

// ─── Floor Material ───

/** Finite set of footstep surface materials.
 *  Used by both ColliderDef.footstepMaterial (on floors) and SceneConfig.floorMaterial.
 *  Single source of truth — no "fs:" name-prefix needed. */
export type FloorMaterial = 'wood' | 'concrete' | 'metal' | 'carpet' | 'snow' | 'grass' | 'stone' | 'dream' | 'default';

/** Wall surface material (for wall colliders that aren't floors) */
export type WallMaterial = 'wood' | 'concrete' | 'metal' | 'brick' | 'default';

// ─── Visual Component Names ───

/** Finite set of scene visual component names.
 *  Provides autocomplete and prevents typos when referencing
 *  scene visuals in SceneColliderSelector. */
export type VisualComponentName =
  | 'VolodkaRoomVisual'
  | 'VolodkaCorridorVisual'
  | 'HomeEveningVisual'
  | 'StreetVisual'
  | 'StreetWinterVisual'
  | 'CafeVisual'
  | 'OfficeDayVisual'
  | 'ParkVisual'
  | 'LibraryVisual'
  | 'BattleVisual'
  | 'DreamVisual'
  | 'RooftopVisual'
  | 'FactoryVisual'
  | 'ZaremaAlbertVisual'
  | 'SolnyshRoomVisual'
  | 'ChkForestVisual'
  | 'FactoryBasementVisual'
  | 'RiverPierVisual'
  | 'GuildMainframeVisual'
  | 'CitySquareVisual'
  | 'UndergroundBunkerVisual'
  | 'LibraryBasementVisual'
  | 'AlbertBackroomVisual'
  | 'ProceduralAaaVisual';

// ─── Doorway ───

/** Physical doorway/opening in a wall.
 *  Separate from ExitDef to avoid duplicating geometry.
 *  Exits reference doorways by ID rather than embedding position/width. */
export interface DoorwayDef {
  /** Unique identifier (e.g., "room_to_corridor", "corridor_to_street") */
  id: string;
  /** Center of the doorway opening in world space */
  position: [number, number, number];
  /** Width of the doorway opening in meters */
  width: number;
  /** Height of the doorway opening in meters (default: 2.2) */
  height?: number;
}

// ─── Colliders ───

/** Collider definition for a scene.
 *
 *  IMPORTANT: In Rapier (and most physics engines), cuboid is defined by
 *  HALF-EXTENTS — the distance from the center to each face.
 *  For example, size [1, 0.5, 2] means a box that is 2m wide, 1m tall, 4m deep.
 *
 *  @remarks Values in `size` are in METRES from centre to face (half-extents),
 *  NOT full dimensions. A full 2m-wide floor slab needs size[0] = 1.0. */
export interface ColliderDef {
  /** Shape type */
  type: 'cuboid' | 'cuboidObstacle' | 'doorway';
  /**
   * Half-extents [x, y, z] — distance from centre to each face in metres.
   * For a full-width box of W metres, set size[0] = W / 2.
   * @remarks Rapier CuboidCollider uses half-extents, NOT full dimensions.
   *          A common mistake is passing the full dimension here.
   */
  size: [number, number, number];
  /** Position [x, y, z] */
  position: [number, number, number];
  /** Optional rotation in radians */
  rotation?: number;
  /** Optional name for debugging / identification */
  name?: string;
  /** Footstep material type — determines sound when walking on this surface.
   *  Only meaningful for floor colliders; optional for walls/obstacles. */
  footstepMaterial?: FloorMaterial;
}

/** Floor collider definition — footstepMaterial is REQUIRED.
 *  Use this for all floor colliders to ensure footstep sounds are always defined. */
export interface FloorColliderDef extends ColliderDef {
  type: 'cuboid';
  /** Footstep material — mandatory for floors. Determines the sound played
   *  when the player walks on this surface. */
  footstepMaterial: FloorMaterial;
}

// ─── Exits ───

/** Exit/entrance definition.
 *  Links to a DoorwayDef by ID instead of duplicating geometry.
 *  Each exit has a unique ID for validation and debugging. */
export interface ExitDef {
  /** Unique identifier for this exit (e.g., "room_to_corridor", "street_to_cafe").
   *  Prevents duplicate exits and simplifies debugging. */
  id: string;
  /** Target scene ID */
  targetScene: SceneId;
  /** Position of the exit trigger in this scene */
  position: [number, number, number];
  /** Player spawn position in target scene */
  spawnPosition: [number, number, number];
  /** Player spawn rotation in target scene */
  spawnRotation: number;
  /** Label shown at exit marker */
  label: string;
  /** Optional flag that must be set for this exit to be active */
  requiredFlag?: string;
  /** Optional minimum karma required */
  minKarma?: number;
  /** Optional maximum karma allowed */
  maxKarma?: number;
  /** Reference to a DoorwayDef.id — links exit to physical doorway geometry.
   *  When set, the doorway position/width come from the DoorwayDef,
   *  avoiding duplication and reducing risk of geometry drift. */
  doorwayId?: string;
}

// ─── Lights ───

/** Light definition for a scene */
export interface LightDef {
  /** Light position [x, y, z] */
  position: [number, number, number];
  /** Light intensity */
  intensity: number;
  /** Light color (hex string) */
  color: string;
  /** Light distance/falloff */
  distance: number;
}

// ─── Fog ───

/** Fog configuration with defaults.
 *  When fogEnabled is true but fog is not specified, global defaults are used. */
export interface FogConfig {
  /** Near clip distance for fog (default: 10) */
  near: number;
  /** Far clip distance for fog (default: 50) */
  far: number;
  /** Optional fog color override (hex string). Falls back to SCENE_FOG_COLORS then ambientColor. */
  fogColor?: string;
}

/** Default fog values used when fog is enabled but not explicitly configured */
export const FOG_DEFAULTS: FogConfig = {
  near: 10,
  far: 50,
} as const;

// ─── Scene Definition ───

/** Complete scene definition — single source of truth.
 *  SceneConfig is generated from this via sceneDefinitionGenerator.ts,
 *  eliminating the need to maintain duplicate data in scenes.ts. */
export interface SceneDefinition {
  /** Unique scene identifier */
  id: SceneId;
  /** Human-readable name */
  name: string;
  /** Scene dimensions [width, height, depth] */
  dimensions: [number, number, number];
  /** Scene type */
  type: 'indoor' | 'outdoor' | 'underground' | 'dream';
  /** Whether the scene has a ceiling */
  hasCeiling: boolean;
  /** Default player spawn position */
  defaultSpawn: [number, number, number];
  /** Default player spawn rotation */
  defaultSpawnRotation: number;
  /** RigidBody Y when standing on the walkable floor (feet level). Defaults from defaultSpawn[1]. */
  floorY?: number;
  /** Character model scale in this scene */
  characterModelScale: number;
  /** Locomotion scale in this scene */
  locomotionScale: number;
  /** Doorway openings in walls — referenced by exits via doorwayId */
  doorways: DoorwayDef[];
  /** Exits to other scenes — each has unique id and optional doorwayId link */
  exits: ExitDef[];
  /** Floor colliders — footstepMaterial is mandatory */
  floors: FloorColliderDef[];
  /** Wall colliders (CuboidObstacle) */
  walls: ColliderDef[];
  /** Object/obstacle colliders */
  obstacles: ColliderDef[];
  /** Ceiling colliders */
  ceilings: ColliderDef[];
  /** Visual component name — literal union for autocomplete and type safety */
  visualComponent: VisualComponentName;
  /** Point lights for atmospheric lighting */
  lights: LightDef[];
  /** Ambient light color */
  ambientColor: string;
  /** Ambient light intensity */
  ambientIntensity: number;
  /** Ground color */
  groundColor: string;
  /** Whether fog is enabled for this scene.
   *  When true, fog settings come from `fog` or FOG_DEFAULTS if not specified.
   *  When false or undefined, no fog is applied.
   *  This explicit flag prevents post-processing from applying undefined params. */
  fogEnabled?: boolean;
  /** Fog settings — used when fogEnabled is true.
   *  If omitted while fogEnabled is true, FOG_DEFAULTS are used. */
  fog?: FogConfig;
  /** Transition style used when entering this scene from another.
   *  Defaults to 'wipe' if not specified. */
  transitionStyle?: 'wipe' | 'flash' | 'darken' | 'ripple' | 'dissolve' | 'film_burn' | 'glitch_cut' | 'breathe' | 'crossfade' | 'breathe_zoom' | 'data_stream' | 'glitch_reveal' | 'poem_dissolve';
  /** Optional override for schedule timeline location coloring. */
  locationCategory?: LocationCategory;
  /** Procedural ambient sound profile for this scene (day/night). */
  ambience?: SceneAmbienceConfig;
  /** Optional atmospheric text shown briefly when entering this scene (movie title card).
   *  Displayed as a slow fade-in/fade-out overlay with the scene name. */
  entryText?: string;
}
