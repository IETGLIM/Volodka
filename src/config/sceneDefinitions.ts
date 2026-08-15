/* ─── Volodka RPG – Scene Definitions ─── */
/* Single-source-of-truth definitions for scenes.
 * Each SceneDefinition captures layout, colliders, lighting, and exits in one place.
 * Use sceneDefinitionGenerator.ts to produce SCENE_CONFIG and PhysicsSceneColliders entries.
 *
 * TYPE SAFETY:
 * - FloorColliderDef requires footstepMaterial (no "fs:" prefix needed)
 * - ExitDef requires unique id and uses doorwayId to link to DoorwayDef
 * - visualComponent uses literal union VisualComponentName
 * - fogEnabled flag explicitly controls fog application
 */

import type { SceneDefinition } from '@/shared/types/sceneDefinition';
import type { SceneAmbienceConfig } from '@/shared/types/ambientSound';
import { EXTENSION_SCENE_DEFINITIONS } from './sceneExtensionDefinitions';
import type { SceneId } from './sceneIds';

/** Volodka's room — small indoor room with desk, bookshelf, bed */
export const volodka_room_def: SceneDefinition = {
  id: 'volodka_room',
  name: 'Комната Володьки',
  dimensions: [5, 3, 7],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 2],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 0.88,
  doorways: [
    { id: 'room_to_corridor', position: [0, 1, 3.5], width: 1.0, height: 2.2 },
  ],
  exits: [
    {
      id: 'room_to_corridor',
      targetScene: 'volodka_corridor',
      position: [0, 1, 3.5],
      spawnPosition: [0, 0, 4],
      spawnRotation: 0,
      label: '→ Коридор',
      doorwayId: 'room_to_corridor',
    },
  ],
  floors: [
    { type: 'cuboid', size: [2.5, 0.05, 3.5], position: [0, -0.05, 0], footstepMaterial: 'wood' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [2.5, 1.5, 0.1], position: [0, 1.5, -3.5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [2.5, 1.5, 0.1], position: [0, 1.5, 3.5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [3.5, 1.5, 0.1], position: [-2.5, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [3.5, 1.5, 0.1], position: [2.5, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
  ],
  obstacles: [
    // FIX AUDIT-R1..R4: obstacles were authored with FULL dimensions but Rapier
    // treats `size` as HALF-EXTENTS (documented in shared/types/sceneDefinition.ts:73-89).
    // Desk: visual CraftedDeskShell / PH table ~1.85×0.75×0.82 → half [0.925, 0.375, 0.41]
    { type: 'cuboidObstacle', size: [0.925, 0.375, 0.41], position: [0, 0.375, -2.5], footstepMaterial: 'wood' },
    // Bookshelf — matches visual geo_box_36 (0.8×2×0.35) at [1.65, 1.0, -2.55].
    // Was [0.28, 1.0, 0.45] — X too narrow (12cm gap each side), Z too deep.
    { type: 'cuboidObstacle', size: [0.4, 1.0, 0.2], position: [1.65, 1.0, -2.55], footstepMaterial: 'wood' },
    // Wardrobe — matches visual (scale 0.95, X span [-2.27, -1.13] → half-width 0.57).
    // Was [0.35, 1.05, 0.4] — 22cm gap each side let player walk through the cabinet.
    { type: 'cuboidObstacle', size: [0.57, 1.05, 0.4], position: [-1.7, 1.05, -2.45], footstepMaterial: 'wood' },
    // Bed — matches gothicBed visual [1.78, 0, 2.05] scale 0.92 (half-width ~0.74).
    // Was [0.5, 0.175, 1.0] at [1.8, 0.175, 2.0] — 32% too narrow (24cm gap each
    // side) and Y too low (collider [0, 0.35] vs mattress top ~0.55). Now matches
    // visual position exactly with full width and proper height.
    { type: 'cuboidObstacle', size: [0.7, 0.3, 1.0], position: [1.78, 0.3, 2.05], footstepMaterial: 'wood' },
    // Nightstand removed — only 45cm between bed (Z=3.05) and wall (Z=3.5),
    // nightstand (depth 50cm) cannot fit without overlapping bed or wall.
    // Visual nightstand was already removed (FIX S13-5 comment in VolodkaRoomVisual).
    // Bedside lighting handled by accent light at [1.98, 1.6, 2.16] + window spill.
    // Armchair — collider moved to match visual (FIX S15-CHAIR-CLIP moved
    // visual to [0, 0, -1.7], but collider stayed at [0.35, 0.4, 2.55]).
    // Now both at [0, 0.4, -1.7] — player collides where the chair actually is.
    { type: 'cuboidObstacle', size: [0.35, 0.4, 0.35], position: [0, 0.4, -1.7], footstepMaterial: 'wood' },
  ],
  ceilings: [
    { type: 'cuboid', size: [2.5, 0.1, 3.5], position: [0, 3.1, 0] },
  ],
  visualComponent: 'VolodkaRoomVisual',
  // FIX S12-A6: removed 3 duplicate scene-definition lights — VolodkaRoomVisual
  // already provides richer + animated lighting at similar positions (monitor
  // glow [0,1.15,0.1], FlickeringCeilingLight [0,2.85,-1], window spill, desk
  // lamp, bedside, etc. — 8+ inline lights incl. 1 shadow-caster on the desk
  // lamp). Removed: desk monitor glow [1.5,1.3,-3.0], warm ceiling [0,2.5,0],
  // cold moonlight [2.3,2.2,1.5]. Lighting.tsx handles lights.length===0 by
  // returning null (line 99); sceneDefinitionGenerator just maps an empty
  // array. Net effect: ~3 fewer point lights + 2 fewer shadow-casters in the
  // per-frame forward-render loop. S12-C owns VolodkaRoomVisual accent lights.
  lights: [],
  // Slightly reduced ambient to let point lights dominate more
  ambientColor: '#4a4565',
  ambientIntensity: 1.05,
  groundColor: '#222238',
  fogEnabled: true,
  // Pushed fog back so it no longer hides the desk/bed in a 5x3x7 room
  fog: { near: 8, far: 18 },
  entryText: 'Монитор мерцает. Тишина и код.',
};

/** Street at night — outdoor scene with buildings, neon, fog */
export const street_night_def: SceneDefinition = {
  id: 'street_night',
  name: 'Улица — ночь',
  dimensions: [20, 4, 20],
  type: 'outdoor',
  hasCeiling: false,
  defaultSpawn: [0, 0, 0],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 1.2,
  doorways: [
    { id: 'street_to_entrance', position: [-2.0, 1, 4.0], width: 1.2, height: 2.4 },
    { id: 'street_to_cafe', position: [4.0, 1, -2.0], width: 1.0, height: 2.2 },
    { id: 'street_to_park', position: [8.0, 1, 0], width: 2.0, height: 2.5 },
    { id: 'street_to_office', position: [0, 1, -8.0], width: 1.2, height: 2.4 },
    { id: 'street_to_rooftop', position: [-6.0, 1, -6.0], width: 0.8, height: 2.0 },
    { id: 'street_to_factory', position: [-8.0, 1, 0], width: 1.5, height: 2.5 },
  ],
  exits: [
    {
      id: 'street_to_entrance',
      targetScene: 'volodka_corridor',
      position: [-2.0, 1, 4.0],
      spawnPosition: [-2.5, 0, -1.0],
      spawnRotation: 0,
      label: '→ Подъезд',
      doorwayId: 'street_to_entrance',
    },
    {
      id: 'street_to_cafe',
      targetScene: 'cafe_evening',
      position: [4.0, 1, -2.0],
      spawnPosition: [0, 0, 4],
      spawnRotation: Math.PI,
      label: '→ Кафе «Синяя яма»',
      doorwayId: 'street_to_cafe',
    },
    {
      id: 'street_to_park',
      targetScene: 'park_day',
      position: [8.0, 1, 0],
      spawnPosition: [0, 0, 0],
      spawnRotation: 0,
      label: '→ Парк',
      doorwayId: 'street_to_park',
    },
    {
      id: 'street_to_office',
      targetScene: 'office_day',
      position: [0, 1, -8.0],
      spawnPosition: [0, 0, 4],
      spawnRotation: 0,
      label: '→ Офис',
      doorwayId: 'street_to_office',
    },
    {
      id: 'street_to_rooftop',
      targetScene: 'rooftop_edge',
      position: [-6.0, 1, -6.0],
      spawnPosition: [0, 0, 0],
      spawnRotation: 0,
      label: '→ Крыша',
      requiredFlag: 'rooftop_unlocked',
      doorwayId: 'street_to_rooftop',
    },
    {
      id: 'street_to_factory',
      targetScene: 'abandoned_factory',
      position: [-8.0, 1, 0],
      spawnPosition: [0, 0, 6],
      spawnRotation: 0,
      label: '→ Завод',
      requiredFlag: 'factory_unlocked',
      doorwayId: 'street_to_factory',
    },
  ],
  floors: [
    { type: 'cuboid', size: [10, 0.05, 10], position: [0, -0.05, 0], footstepMaterial: 'concrete' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [10, 2, 0.1], position: [-10, 2, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [10, 2, 0.1], position: [10, 2, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [4, 9, 3], position: [-12, 9, -15], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [5, 11, 3], position: [12, 11, -20], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [3.5, 7.5, 2.5], position: [-15, 7.5, 5], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [4.5, 10, 3], position: [14, 10, 8], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [6, 12.5, 4], position: [0, 12.5, -25], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.14, 2.5, 0.14], position: [-3, 1.25, -5], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.14, 2.5, 0.14], position: [3, 1.25, 5], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.14, 2.5, 0.14], position: [-3, 1.25, 12], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.14, 2.5, 0.14], position: [3, 1.25, -12], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.5, 0.5, 0.5], position: [2, 0.5, 3], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.44, 0.9, 0.44], position: [-2.5, 0.45, -8], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.8, 1.8, 0.6], position: [2.5, 0.9, -2], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [1.0, 2.4, 0.15], position: [-4, 1.2, 3], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [1.6, 0.5, 0.7], position: [0, 0.25, 0], footstepMaterial: 'wood' },
  ],
  ceilings: [],
  visualComponent: 'StreetVisual',
  lights: [
    { position: [0, 8, 2], intensity: 1.8, color: '#8899cc', distance: 40 },
    { position: [-5, 5, -6], intensity: 1.2, color: '#6688aa', distance: 28 },
    { position: [6, 5, 8], intensity: 1.2, color: '#6688aa', distance: 28 },
    { position: [0, 3, -10], intensity: 0.8, color: '#556688', distance: 22 },
    { position: [0, 6, 0], intensity: 0.6, color: '#ccbbaa', distance: 30 },
  ],
  ambientColor: '#3a3a58',
  ambientIntensity: 0.68,
  groundColor: '#28283e',
  fogEnabled: true,
  fog: { near: 12, far: 52, fogColor: '#080c16' },
  transitionStyle: 'flash',
  entryText: 'Неон и снег. Город не спит.',
};

/** Cafe "Blue Hole" — indoor cafe with bar counter and tables */
export const cafe_evening_def: SceneDefinition = {
  id: 'cafe_evening',
  name: 'Кафе «Синяя яма»',
  dimensions: [10, 3, 10],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 4],
  defaultSpawnRotation: Math.PI,
  characterModelScale: 1.0,
  locomotionScale: 1.0,
  doorways: [
    { id: 'cafe_to_street', position: [0, 1, 4.5], width: 1.0, height: 2.2 },
  ],
  exits: [
    {
      id: 'cafe_to_street',
      targetScene: 'street_night',
      position: [0, 1, 4.5],
      spawnPosition: [4.0, 0, -2.0],
      spawnRotation: 0,
      label: '→ Улица',
      doorwayId: 'cafe_to_street',
    },
  ],
  floors: [
    { type: 'cuboid', size: [5, 0.05, 5], position: [0, -0.05, 0], footstepMaterial: 'wood' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [5, 1.5, 0.1], position: [0, 1.5, -5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [5, 1.5, 0.1], position: [0, 1.5, 5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [5, 1.5, 0.1], position: [-5, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [5, 1.5, 0.1], position: [5, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [2.5, 0.55, 0.4], position: [0, 0.55, -4.0], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.75, 0.35, 0.75], position: [-3.0, 0.35, -2.0], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.75, 0.35, 0.75], position: [3.0, 0.35, 0], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.75, 0.35, 0.75], position: [0, 0.35, 2.5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.75, 0.35, 0.75], position: [-3.0, 0.35, 1.5], footstepMaterial: 'wood' },
  ],
  ceilings: [
    { type: 'cuboid', size: [5, 0.1, 5], position: [0, 3.1, 0] },
  ],
  visualComponent: 'CafeVisual',
  lights: [
    { position: [-3, 2, 0], intensity: 2.2, color: '#3377ee', distance: 9 },
    { position: [2, 1.5, 1], intensity: 1.35, color: '#ff9955', distance: 7 },
    { position: [0, 2.5, -2], intensity: 0.6, color: '#886644', distance: 8 },
    { position: [3, 2.2, -3], intensity: 1.0, color: '#2266cc', distance: 8 },
  ],
  ambientColor: '#141e35',
  ambientIntensity: 0.55,
  groundColor: '#181828',
  fogEnabled: true,
  fog: { near: 5, far: 14 },
  entryText: 'Кофе, синий свет и тихие разговоры.',
};

/** Corridor of the communal apartment — widened indoor hallway */
export const volodka_corridor_def: SceneDefinition = {
  id: 'volodka_corridor',
  name: 'Коридор коммуналки',
  dimensions: [6, 3, 16],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 5],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 0.95,
  doorways: [
    { id: 'corridor_to_room', position: [0, 1, 7.3], width: 1.0, height: 2.1 },
    { id: 'corridor_to_kitchen', position: [2.7, 0.5, -2.0], width: 0.9, height: 2.0 },
    { id: 'corridor_to_street', position: [-2.7, 0.5, -2.0], width: 1.0, height: 2.2 },
    { id: 'corridor_to_solnysh_room', position: [2.7, 0.5, 4.0], width: 0.9, height: 2.0 },
    { id: 'corridor_to_zarema_room', position: [-2.7, 0.5, 4.0], width: 0.9, height: 2.0 },
    // FIX S12-A5: bathroom doorway — cuts a hole in the right wall so the player
    // can approach the visible bathroom door (VolodkaCorridorVisual.tsx line 632
    // at [W/2-0.02, 0, 2.0]). No matching exit (no bathroom scene exists) — the
    // doorway is just a niche; the corridor_bathroom_door trigger shows a locked-
    // door flavor examine panel. Without this doorway, the structural wall at
    // X=3 was solid → player hit an invisible wall at the visible door.
    // FIX S13-4: y 0.5 → 1.0 (half of height 2.0). The y=0.5 convention on
    // corridor_to_kitchen/street is pre-existing and likely wrong (opening cut
    // half below floor if generator uses y=center). Using y=1.0 matches the
    // room_to_corridor / corridor_to_room convention (y ≈ height/2).
    { id: 'corridor_to_bathroom', position: [2.7, 1.0, 2.0], width: 0.9, height: 2.0 },
  ],
  exits: [
    {
      id: 'corridor_to_room',
      targetScene: 'volodka_room',
      position: [0, 1, 7.3],
      spawnPosition: [0, 0, 2],
      spawnRotation: 0,
      label: '→ Комната',
      doorwayId: 'corridor_to_room',
    },
    {
      id: 'corridor_to_kitchen',
      targetScene: 'home_evening',
      position: [2.7, 0.5, -2.0],
      spawnPosition: [0, 0, 2],
      spawnRotation: Math.PI,
      label: '→ Кухня',
      doorwayId: 'corridor_to_kitchen',
    },
    {
      id: 'corridor_to_street',
      targetScene: 'street_night',
      position: [-2.7, 0.5, -2.0],
      spawnPosition: [0, 0, 0],
      spawnRotation: 0,
      label: '→ Улица',
      doorwayId: 'corridor_to_street',
    },
    {
      id: 'corridor_to_solnysh_room',
      targetScene: 'solnysh_room',
      position: [2.7, 0.5, 4.0],
      spawnPosition: [0, 0, 2],
      spawnRotation: Math.PI,
      label: '→ Солныш и Лёня',
      doorwayId: 'corridor_to_solnysh_room',
    },
    {
      id: 'corridor_to_zarema_room',
      targetScene: 'zarema_albert_room',
      position: [-2.7, 0.5, 4.0],
      spawnPosition: [0, 0, 2],
      spawnRotation: Math.PI,
      label: '→ Зарема и Альберт',
      doorwayId: 'corridor_to_zarema_room',
    },
  ],
  floors: [
    { type: 'cuboid', size: [3, 0.05, 8], position: [0, -0.05, 0], footstepMaterial: 'wood' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [3, 1.5, 0.1], position: [0, 1.5, -8], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [3, 1.5, 0.1], position: [0, 1.5, 8], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [8, 1.5, 0.1], position: [-3, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [8, 1.5, 0.1], position: [3, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
  ],
  obstacles: [
    // FIX AUDIT-C4/C5: obstacles were authored with FULL dimensions but Rapier treats
    // `size` as HALF-EXTENTS. Converted to true half-extents matching visual geometry.
    // Shoe rack: visual geo_box_5 Box(0.5, 0.7, 0.4) → half [0.25, 0.35, 0.2], center Y=0.35
    { type: 'cuboidObstacle', size: [0.25, 0.35, 0.2], position: [-2.4, 0.35, 4.8], footstepMaterial: 'wood' },
    // Radiator: visual geo_box_7 Box(0.08, 0.8, 0.6) → half [0.04, 0.4, 0.3], center Y=0.4
    { type: 'cuboidObstacle', size: [0.04, 0.4, 0.3], position: [2.92, 0.4, -2.0], footstepMaterial: 'wood' },
    // FIX S12-A5: visible props with no colliders — player walked through them.
    // Mailboxes: visual group at [W/2-0.15, 0, 6.0]=[2.85, 0, 6.0], panel + 4 slots
    // span Y=[0.6, 1.35], Z=[~5.4, 6.6] after -90° Y rotation. Generous half-extents.
    { type: 'cuboidObstacle', size: [0.15, 0.6, 0.2], position: [2.85, 1.0, 6.0], footstepMaterial: 'wood' },
    // Intercom: visual group at [-W/2+0.02, 1.5, 6.0]=[-2.98, 1.5, 6.0], small panel.
    { type: 'cuboidObstacle', size: [0.05, 0.25, 0.15], position: [-2.95, 1.5, 6.0], footstepMaterial: 'wood' },
    // Mirror: visual group at [W/2-0.02, 1.4, -4.0]=[2.98, 1.4, -4.0] (corrected Z
    // per S12-A3 — was -5.5 in triggerZones). Narrow vertical frame.
    { type: 'cuboidObstacle', size: [0.05, 0.35, 0.2], position: [2.95, 1.4, -4.0], footstepMaterial: 'wood' },
    // Bathroom door panel (closed): visual group at [W/2-0.02, 0, 2.0]=[2.98, 0, 2.0],
    // door pivot at [0.02, 0, 0.35], panel mesh at [0, 1.0, -0.35] → world ~[3.0, 1.0, 2.0].
    // Thin tall collider for the closed door.
    { type: 'cuboidObstacle', size: [0.05, 0.95, 0.4], position: [2.95, 1.0, 2.0], footstepMaterial: 'wood' },
  ],
  ceilings: [
    { type: 'cuboid', size: [3, 0.1, 8], position: [0, 3.1, 0] },
  ],
  visualComponent: 'VolodkaCorridorVisual',
  lights: [
    { position: [0, 2.5, 0], intensity: 0.7, color: '#ccaa55', distance: 10 },
    { position: [0, 2.5, -5], intensity: 0.3, color: '#4466aa', distance: 8 },
    { position: [0, 2.5, 5], intensity: 0.2, color: '#334488', distance: 7 },
  ],
  ambientColor: '#1e1a28',
  ambientIntensity: 0.48,
  groundColor: '#15131e',
  fogEnabled: true,
  fog: { near: 4, far: 12 },
  entryText: 'Пустой коридор. Эхо чужих шагов.',
};

/** Kitchen — evening — warm indoor family space */
export const home_evening_def: SceneDefinition = {
  id: 'home_evening',
  name: 'Кухня — вечер',
  dimensions: [14, 3, 14],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 2],
  defaultSpawnRotation: Math.PI,
  characterModelScale: 1.0,
  locomotionScale: 1.0,
  doorways: [
    { id: 'kitchen_to_corridor', position: [0, 1, 3.5], width: 0.9, height: 2.1 },
  ],
  exits: [
    {
      id: 'kitchen_to_corridor',
      targetScene: 'volodka_corridor',
      position: [0, 1, 3.5],
      spawnPosition: [0, 0, 4],
      spawnRotation: 0,
      label: '→ Коридор',
      doorwayId: 'kitchen_to_corridor',
    },
  ],
  floors: [
    { type: 'cuboid', size: [7, 0.05, 7], position: [0, -0.05, 0], footstepMaterial: 'wood' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [7, 1.5, 0.1], position: [0, 1.5, -7], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [7, 1.5, 0.1], position: [0, 1.5, 7], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [7, 1.5, 0.1], position: [-7, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [7, 1.5, 0.1], position: [7, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [1.2, 0.45, 0.5], position: [0, 0.45, -5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.5, 0.8, 0.5], position: [-5, 0.8, -5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [1.0, 0.35, 0.5], position: [4, 0.35, 2], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.4, 0.3, 0.4], position: [-3, 0.3, 4], footstepMaterial: 'wood' },
  ],
  ceilings: [
    { type: 'cuboid', size: [7, 0.1, 7], position: [0, 3.1, 0] },
  ],
  visualComponent: 'HomeEveningVisual',
  lights: [
    { position: [0, 2.5, 0], intensity: 1.6, color: '#ffaa44', distance: 9 },
    { position: [-1.5, 1.5, -1], intensity: 0.9, color: '#ff9933', distance: 6 },
    { position: [1, 1.8, 2], intensity: 0.5, color: '#ffcc88', distance: 5 },
  ],
  ambientColor: '#4a3520',
  ambientIntensity: 0.68,
  groundColor: '#3a2a1a',
  fogEnabled: true,
  fog: { near: 5, far: 11 },
  entryText: 'Тёплый свет. Запах домашнего хлеба.',
};

/** Street — winter — cold outdoor scene with snow */
export const street_winter_def: SceneDefinition = {
  id: 'street_winter',
  name: 'Улица — зима',
  dimensions: [25, 4, 25],
  type: 'outdoor',
  hasCeiling: false,
  defaultSpawn: [0, 0, 0],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 1.1,
  doorways: [
    { id: 'winter_to_entrance', position: [0, 1, 10.0], width: 1.2, height: 2.4 },
  ],
  exits: [
    {
      id: 'winter_to_entrance',
      targetScene: 'volodka_corridor',
      position: [0, 1, 10.0],
      spawnPosition: [-2.5, 0, -1.0],
      spawnRotation: 0,
      label: '→ Подъезд',
      doorwayId: 'winter_to_entrance',
    },
  ],
  floors: [
    { type: 'cuboid', size: [12.5, 0.05, 12.5], position: [0, -0.05, 0], footstepMaterial: 'snow' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [12.5, 2, 0.1], position: [-12.5, 2, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [12.5, 2, 0.1], position: [12.5, 2, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [3, 8, 2.5], position: [-14, 8, -12], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [4, 10, 3], position: [15, 10, -8], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [2.5, 6, 2], position: [-16, 6, 8], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [3.5, 9, 2.5], position: [13, 9, 10], footstepMaterial: 'concrete' },
  ],
  ceilings: [],
  visualComponent: 'StreetWinterVisual',
  lights: [
    { position: [0, 3, 0], intensity: 1.2, color: '#c8d8f0', distance: 20 },
    { position: [-6, 2, -6], intensity: 0.5, color: '#aabbdd', distance: 12 },
    { position: [6, 2, 6], intensity: 0.5, color: '#aabbdd', distance: 12 },
  ],
  ambientColor: '#c0c8d8',
  ambientIntensity: 0.6,
  groundColor: '#d0d8e8',
  fogEnabled: true,
  fog: { near: 12, far: 42 },
  transitionStyle: 'flash',
  entryText: 'Метель. Белая пелена скрывает небо.',
};

/** IT Guild Office — bright indoor workspace */
export const office_day_def: SceneDefinition = {
  id: 'office_day',
  name: 'Офис IT-гильдии',
  dimensions: [14, 3, 12],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 4],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 1.0,
  doorways: [
    { id: 'office_to_street', position: [0, 1, 5.5], width: 1.2, height: 2.4 },
  ],
  exits: [
    {
      id: 'office_to_street',
      targetScene: 'street_night',
      position: [0, 1, 5.5],
      spawnPosition: [0, 0, -8.0],
      spawnRotation: 0,
      label: '→ Улица',
      doorwayId: 'office_to_street',
    },
  ],
  floors: [
    { type: 'cuboid', size: [7, 0.05, 6], position: [0, -0.05, 0], footstepMaterial: 'carpet' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [7, 1.5, 0.1], position: [0, 1.5, -6], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [7, 1.5, 0.1], position: [0, 1.5, 6], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [6, 1.5, 0.1], position: [-7, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [6, 1.5, 0.1], position: [7, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [1.2, 0.35, 0.6], position: [-4, 0.35, -3], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [1.2, 0.35, 0.6], position: [-2, 0.35, -3], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [1.2, 0.35, 0.6], position: [2, 0.35, -3], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [1.2, 0.35, 0.6], position: [4, 0.35, -3], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [2.0, 0.8, 0.5], position: [0, 0.8, 0], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.8, 0.35, 0.8], position: [-5, 0.35, 3], footstepMaterial: 'wood' },
    // Glass meeting room partitions (front-right, group at [4.5, 0, 4.0])
    { type: 'cuboidObstacle', size: [3.0, 1.6, 0.1], position: [4.5, 1.6, 2.5], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.1, 1.6, 3.0], position: [6.0, 1.6, 4.0], footstepMaterial: 'concrete' },
  ],
  ceilings: [
    { type: 'cuboid', size: [7, 0.1, 6], position: [0, 3.1, 0] },
  ],
  visualComponent: 'OfficeDayVisual',
  lights: [
    { position: [0, 2.8, 0], intensity: 2.0, color: '#ffffff', distance: 12 },
    { position: [-4, 2.5, -2], intensity: 1.0, color: '#eef4ff', distance: 8 },
    { position: [4, 2.5, -2], intensity: 1.0, color: '#eef4ff', distance: 8 },
  ],
  ambientColor: '#dce4ec',
  ambientIntensity: 0.65,
  groundColor: '#c8d0d8',
  fogEnabled: true,
  fog: { near: 8, far: 20 },
  entryText: 'Флуоресцентные лампы. Бумажные горы.',
};

/** Park — day — open outdoor green space */
export const park_day_def: SceneDefinition = {
  id: 'park_day',
  name: 'Парк — день',
  dimensions: [30, 4, 30],
  type: 'outdoor',
  hasCeiling: false,
  defaultSpawn: [0, 0, 0],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 1.3,
  doorways: [
    { id: 'park_to_street', position: [-12.0, 1, 0], width: 2.0, height: 2.5 },
    { id: 'park_to_library', position: [0, 1, -12.0], width: 1.0, height: 2.2 },
    { id: 'park_to_chk', position: [0, 1, -14.0], width: 2.0, height: 2.5 },
    { id: 'park_to_pier', position: [12.0, 1, 7.0], width: 2.0, height: 2.5 },
  ],
  exits: [
    {
      id: 'park_to_street',
      targetScene: 'street_night',
      position: [-12.0, 1, 0],
      spawnPosition: [8.0, 0, 0],
      spawnRotation: 0,
      label: '→ Улица',
      doorwayId: 'park_to_street',
    },
    {
      id: 'park_to_library',
      targetScene: 'library_day',
      position: [0, 1, -12.0],
      spawnPosition: [0, 0, 5],
      spawnRotation: Math.PI,
      label: '→ Библиотека',
      doorwayId: 'park_to_library',
    },
    {
      id: 'park_to_chk',
      targetScene: 'chk_forest_zorge',
      position: [0, 1, -14.0],
      spawnPosition: [0, 0, -12],
      spawnRotation: 0,
      label: '→ Лес · Зорге (ЧК)',
      requiredFlag: 'chk_forest_unlocked',
      doorwayId: 'park_to_chk',
    },
    {
      id: 'park_to_pier',
      targetScene: 'river_pier',
      position: [12.0, 1, 7.0],
      spawnPosition: [0, 0, 7],
      spawnRotation: Math.PI,
      label: '→ Пирс у реки',
      doorwayId: 'park_to_pier',
    },
  ],
  floors: [
    { type: 'cuboid', size: [15, 0.05, 15], position: [0, -0.05, 0], footstepMaterial: 'grass' },
  ],
  walls: [],
  obstacles: [
    { type: 'cuboidObstacle', size: [1.0, 2.5, 1.0], position: [-6, 2.5, -4], footstepMaterial: 'grass' },
    { type: 'cuboidObstacle', size: [0.8, 3.0, 0.8], position: [4, 3.0, -8], footstepMaterial: 'grass' },
    { type: 'cuboidObstacle', size: [1.2, 2.0, 1.2], position: [10, 2.0, 6], footstepMaterial: 'grass' },
    { type: 'cuboidObstacle', size: [0.9, 2.8, 0.9], position: [-10, 2.8, 8], footstepMaterial: 'grass' },
    { type: 'cuboidObstacle', size: [1.5, 0.4, 1.5], position: [0, 0.4, 5], footstepMaterial: 'stone' },
    { type: 'cuboidObstacle', size: [3.0, 0.35, 1.0], position: [-3, 0.35, 0], footstepMaterial: 'stone' },
  ],
  ceilings: [],
  visualComponent: 'ParkVisual',
  lights: [
    { position: [0, 3.5, 0], intensity: 2.0, color: '#ffffee', distance: 30 },
    { position: [-8, 3, -5], intensity: 0.8, color: '#aaffaa', distance: 15 },
    { position: [8, 3, 5], intensity: 0.8, color: '#aaffaa', distance: 15 },
  ],
  ambientColor: '#a0c0a0',
  ambientIntensity: 0.65,
  groundColor: '#3a5a2a',
  fogEnabled: true,
  fog: { near: 10, far: 40 },
  transitionStyle: 'flash',
  entryText: 'Листва шуршит. Город далеко.',
};

/** Library — day — quiet indoor study space with bookshelves */
export const library_day_def: SceneDefinition = {
  id: 'library_day',
  name: 'Библиотека',
  dimensions: [16, 3, 14],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 5],
  defaultSpawnRotation: Math.PI,
  characterModelScale: 1.0,
  locomotionScale: 0.9,
  doorways: [
    { id: 'library_to_park', position: [0, 1, 6.0], width: 1.0, height: 2.2 },
  ],
  exits: [
    {
      id: 'library_to_park',
      targetScene: 'park_day',
      position: [0, 1, 6.0],
      spawnPosition: [0, 0, -12.0],
      spawnRotation: 0,
      label: '→ Парк',
      doorwayId: 'library_to_park',
    },
  ],
  floors: [
    { type: 'cuboid', size: [8, 0.05, 7], position: [0, -0.05, 0], footstepMaterial: 'wood' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [8, 1.5, 0.1], position: [0, 1.5, -7], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [8, 1.5, 0.1], position: [0, 1.5, 7], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [7, 1.5, 0.1], position: [-8, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [7, 1.5, 0.1], position: [8, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [2.5, 1.2, 0.4], position: [-5, 1.2, -4], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [2.5, 1.2, 0.4], position: [-5, 1.2, 0], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [2.5, 1.2, 0.4], position: [5, 1.2, -4], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [2.5, 1.2, 0.4], position: [5, 1.2, 0], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [1.5, 0.35, 0.8], position: [0, 0.35, 3], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [1.5, 0.35, 0.8], position: [0, 0.35, -2], footstepMaterial: 'wood' },
  ],
  ceilings: [
    { type: 'cuboid', size: [8, 0.1, 7], position: [0, 3.1, 0] },
  ],
  visualComponent: 'LibraryVisual',
  lights: [
    { position: [0, 2.8, 0], intensity: 1.5, color: '#ffeecc', distance: 12 },
    { position: [-5, 2.0, -2], intensity: 0.8, color: '#ffddaa', distance: 8 },
    { position: [5, 2.0, -2], intensity: 0.8, color: '#ffddaa', distance: 8 },
  ],
  ambientColor: '#d8c8a0',
  ambientIntensity: 0.5,
  groundColor: '#8a7a50',
  fogEnabled: true,
  fog: { near: 6, far: 16 },
  entryText: 'Пыль и мудрость. Стеллажи до потолка.',
};

/** Battle arena — combat encounter space */
export const battle_def: SceneDefinition = {
  id: 'battle',
  name: 'Бой',
  dimensions: [12, 3, 12],
  type: 'outdoor',
  hasCeiling: false,
  defaultSpawn: [0, 0, 3],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 1.0,
  doorways: [
    { id: 'battle_to_street', position: [0, 1, 5.5], width: 1.2, height: 2.4 },
  ],
  exits: [
    {
      id: 'battle_to_street',
      targetScene: 'street_night',
      position: [0, 1, 5.5],
      spawnPosition: [0, 0, 0],
      spawnRotation: 0,
      label: '→ Улица',
      doorwayId: 'battle_to_street',
    },
  ],
  floors: [
    { type: 'cuboid', size: [6, 0.05, 6], position: [0, -0.05, 0], footstepMaterial: 'concrete' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [6, 1.5, 0.1], position: [0, 1.5, -6], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [6, 1.5, 0.1], position: [0, 1.5, 6], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [6, 1.5, 0.1], position: [-6, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [6, 1.5, 0.1], position: [6, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [0.8, 0.5, 0.8], position: [-3, 0.5, -3], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.8, 0.5, 0.8], position: [3, 0.5, -3], footstepMaterial: 'concrete' },
  ],
  ceilings: [],
  visualComponent: 'BattleVisual',
  lights: [
    { position: [0, 2.5, 0], intensity: 2.5, color: '#ff4444', distance: 10 },
    { position: [-4, 2.0, -4], intensity: 0.8, color: '#ff6644', distance: 8 },
    { position: [4, 2.0, -4], intensity: 0.8, color: '#ff6644', distance: 8 },
  ],
  ambientColor: '#3a1a1a',
  ambientIntensity: 0.5,
  groundColor: '#1a0a0a',
  fogEnabled: true,
  fog: { near: 5, far: 15 },
  entryText: 'Стихии сталкиваются. Слово — оружие.',
};

/** Dream — surreal subconscious landscape */
export const sleep_dream_def: SceneDefinition = {
  id: 'sleep_dream',
  name: 'Сон',
  dimensions: [50, 4, 50],
  type: 'dream',
  hasCeiling: false,
  defaultSpawn: [0, 0, 0],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 1.5,
  doorways: [],
  exits: [
    {
      id: 'dream_to_room',
      targetScene: 'volodka_room',
      position: [0, 1, 0],
      spawnPosition: [0, 0, 2],
      spawnRotation: 0,
      label: '→ Проснуться',
    },
  ],
  floors: [
    { type: 'cuboid', size: [25, 0.05, 25], position: [0, -0.05, 0], footstepMaterial: 'dream' },
  ],
  walls: [],
  obstacles: [
    { type: 'cuboidObstacle', size: [2, 4, 2], position: [-10, 4, -10], footstepMaterial: 'dream' },
    { type: 'cuboidObstacle', size: [3, 6, 1], position: [15, 6, -15], footstepMaterial: 'dream' },
    { type: 'cuboidObstacle', size: [1.5, 3, 1.5], position: [8, 3, 12], footstepMaterial: 'dream' },
    { type: 'cuboidObstacle', size: [2, 5, 2], position: [-18, 5, 8], footstepMaterial: 'dream' },
  ],
  ceilings: [],
  visualComponent: 'DreamVisual',
  lights: [
    { position: [0, 3, 0], intensity: 1.5, color: '#aa44ff', distance: 25 },
    { position: [-12, 2, -12], intensity: 0.6, color: '#44aaff', distance: 15 },
    { position: [12, 2, 12], intensity: 0.6, color: '#44aaff', distance: 15 },
    { position: [0, 2, 0], intensity: 0.4, color: '#ff44aa', distance: 10 },
  ],
  ambientColor: '#2a1a40',
  ambientIntensity: 0.4,
  groundColor: '#1a1525',
  fogEnabled: true,
  fog: { near: 2, far: 30 },
  transitionStyle: 'ripple',
  entryText: 'Грани реальности тают. Ты между мирами.',
};

/** Rooftop edge — precarious outdoor perch above the city */
export const rooftop_edge_def: SceneDefinition = {
  id: 'rooftop_edge',
  name: 'Край крыши',
  dimensions: [10, 3, 8],
  type: 'outdoor',
  hasCeiling: false,
  defaultSpawn: [0, 0, 0],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 0.8,
  doorways: [
    { id: 'rooftop_to_street', position: [0, 1, 3.5], width: 0.8, height: 2.0 },
  ],
  exits: [
    {
      id: 'rooftop_to_street',
      targetScene: 'street_night',
      position: [0, 1, 3.5],
      spawnPosition: [-6.0, 0, -6.0],
      spawnRotation: 0,
      label: '→ Улица',
      requiredFlag: 'rooftop_unlocked',
      doorwayId: 'rooftop_to_street',
    },
  ],
  floors: [
    { type: 'cuboid', size: [5, 0.05, 4], position: [0, -0.05, -1], footstepMaterial: 'concrete' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [5, 1.0, 0.1], position: [0, 1.0, 3.5], footstepMaterial: 'concrete' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [1.0, 0.6, 0.6], position: [-3, 0.6, -2], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.6, 0.4, 0.6], position: [3, 0.4, 0], footstepMaterial: 'concrete' },
  ],
  ceilings: [],
  visualComponent: 'RooftopVisual',
  lights: [
    { position: [0, 2.5, -1], intensity: 0.5, color: '#ff8844', distance: 10 },
    { position: [-4, 1, -3], intensity: 0.3, color: '#4488ff', distance: 8 },
    { position: [4, 1, -3], intensity: 0.3, color: '#4488ff', distance: 8 },
  ],
  ambientColor: '#2a2040',
  ambientIntensity: 0.3,
  groundColor: '#1a1a2e',
  fogEnabled: true,
  fog: { near: 15, far: 80 },
  transitionStyle: 'darken',
  entryText: 'Ветер с высоты. Город как на ладони.',
};

/** Abandoned factory — dark industrial interior */
export const abandoned_factory_def: SceneDefinition = {
  id: 'abandoned_factory',
  name: 'Заброшенный завод',
  dimensions: [20, 4, 18],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 6],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 1.1,
  doorways: [
    { id: 'factory_to_street', position: [0, 1, 8.0], width: 1.5, height: 2.5 },
    { id: 'factory_to_basement', position: [-9, 1, -6], width: 1.4, height: 2.2 },
  ],
  exits: [
    {
      id: 'factory_to_street',
      targetScene: 'street_night',
      position: [0, 1, 8.0],
      spawnPosition: [-8.0, 0, 0],
      spawnRotation: 0,
      label: '→ Улица',
      doorwayId: 'factory_to_street',
    },
    {
      id: 'factory_to_basement',
      targetScene: 'factory_basement',
      position: [-9, 1, -6],
      spawnPosition: [0, 0, 5],
      spawnRotation: Math.PI,
      label: '→ Подвал',
      requiredFlag: 'basement_key_found',
      doorwayId: 'factory_to_basement',
    },
  ],
  floors: [
    { type: 'cuboid', size: [10, 0.05, 9], position: [0, -0.05, 0], footstepMaterial: 'concrete' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [10, 2, 0.1], position: [0, 2, -9], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [10, 2, 0.1], position: [0, 2, 9], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [9, 2, 0.1], position: [-10, 2, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [9, 2, 0.1], position: [10, 2, 0], rotation: Math.PI / 2, footstepMaterial: 'concrete' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [2.5, 1.5, 1.5], position: [-6, 1.5, -5], footstepMaterial: 'metal' },
    { type: 'cuboidObstacle', size: [3.0, 2.0, 2.0], position: [5, 2.0, -4], footstepMaterial: 'metal' },
    { type: 'cuboidObstacle', size: [1.5, 1.0, 1.0], position: [-3, 1.0, 3], footstepMaterial: 'metal' },
    { type: 'cuboidObstacle', size: [4.0, 0.4, 1.0], position: [2, 0.4, 4], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [1.0, 3.0, 1.0], position: [7, 3.0, 2], footstepMaterial: 'metal' },
  ],
  ceilings: [
    { type: 'cuboid', size: [10, 0.1, 9], position: [0, 4.1, 0] },
  ],
  visualComponent: 'FactoryVisual',
  lights: [
    { position: [0, 3.5, 0], intensity: 0.8, color: '#ffaa44', distance: 14 },
    { position: [-6, 2, -4], intensity: 0.5, color: '#ff6622', distance: 8 },
    { position: [6, 2, 4], intensity: 0.4, color: '#ff8844', distance: 8 },
  ],
  ambientColor: '#2a2520',
  ambientIntensity: 0.55,
  groundColor: '#25221e',
  fogEnabled: true,
  fog: { near: 4, far: 16, fogColor: '#1a1408' },
  transitionStyle: 'darken',
  entryText: 'Ржавчина и гул. Призраки конвейера.',
};

/** Солныш & Лёня — cozy room with carpets, art and coffee */
export const solnysh_room_def: SceneDefinition = {
  id: 'solnysh_room',
  name: 'Комната Солныш и Лёни',
  dimensions: [8, 3, 8],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 2],
  defaultSpawnRotation: Math.PI,
  characterModelScale: 1.0,
  locomotionScale: 1.0,
  doorways: [
    { id: 'solnysh_to_corridor', position: [0, 1, 3.5], width: 0.9, height: 2.1 },
  ],
  exits: [
    {
      id: 'solnysh_to_corridor',
      targetScene: 'volodka_corridor',
      position: [0, 1, 3.5],
      spawnPosition: [2.0, 0, 3.6],
      spawnRotation: 0,
      label: '→ Коридор',
      doorwayId: 'solnysh_to_corridor',
    },
  ],
  floors: [
    { type: 'cuboid', size: [4, 0.05, 4], position: [0, -0.05, 0], footstepMaterial: 'carpet' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [4, 1.5, 0.1], position: [0, 1.5, -4], footstepMaterial: 'carpet' },
    { type: 'cuboidObstacle', size: [4, 1.5, 0.1], position: [0, 1.5, 4], footstepMaterial: 'carpet' },
    { type: 'cuboidObstacle', size: [4, 1.5, 0.1], position: [-4, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'carpet' },
    { type: 'cuboidObstacle', size: [4, 1.5, 0.1], position: [4, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'carpet' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [0.9, 0.375, 0.4], position: [-1.5, 0.375, 0.5], footstepMaterial: 'carpet' },
    { type: 'cuboidObstacle', size: [0.5, 0.9, 0.5], position: [-2.4, 0.45, -2.2], footstepMaterial: 'carpet' },
    { type: 'cuboidObstacle', size: [0.7, 0.6, 0.08], position: [2.2, 0.9, -2.0], footstepMaterial: 'carpet' },
    { type: 'cuboidObstacle', size: [0.8, 0.75, 0.45], position: [-2.6, 0.375, 1.6], footstepMaterial: 'carpet' },
  ],
  ceilings: [
    { type: 'cuboid', size: [4, 0.1, 4], position: [0, 3.1, 0] },
  ],
  visualComponent: 'SolnyshRoomVisual',
  lights: [
    { position: [0, 2.5, 0], intensity: 1.0, color: '#ffccaa', distance: 8 },
    { position: [-2, 1.5, -2], intensity: 0.6, color: '#ffaa88', distance: 5 },
    { position: [2, 1.5, 0], intensity: 0.5, color: '#eeddcc', distance: 5 },
  ],
  ambientColor: '#3a3028',
  ambientIntensity: 0.65,
  groundColor: '#2e2820',
  fogEnabled: true,
  fog: { near: 5, far: 12 },
  entryText: 'Ковры, кофе и акварели. Дом внутри дома.',
};

/** Zarema & Albert's room — cozy indoor shared room */
export const zarema_albert_room_def: SceneDefinition = {
  id: 'zarema_albert_room',
  name: 'Комната Заремы и Альберта',
  dimensions: [8, 3, 8],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 2],
  defaultSpawnRotation: Math.PI,
  characterModelScale: 1.0,
  locomotionScale: 1.0,
  doorways: [
    { id: 'zarema_to_corridor', position: [0, 1, 3.5], width: 0.9, height: 2.1 },
  ],
  exits: [
    {
      id: 'zarema_to_corridor',
      targetScene: 'volodka_corridor',
      position: [0, 1, 3.5],
      spawnPosition: [-2.0, 0, 3.6],
      spawnRotation: 0,
      label: '→ Коридор',
      doorwayId: 'zarema_to_corridor',
    },
  ],
  floors: [
    { type: 'cuboid', size: [4, 0.05, 4], position: [0, -0.05, 0], footstepMaterial: 'wood' },
  ],
  walls: [
    { type: 'cuboidObstacle', size: [4, 1.5, 0.1], position: [0, 1.5, -4], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [4, 1.5, 0.1], position: [0, 1.5, 4], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [4, 1.5, 0.1], position: [-4, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [4, 1.5, 0.1], position: [4, 1.5, 0], rotation: Math.PI / 2, footstepMaterial: 'wood' },
  ],
  obstacles: [
    { type: 'cuboidObstacle', size: [0.9, 0.375, 0.4], position: [-2, 0.375, -2.5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.9, 0.375, 0.4], position: [2, 0.375, -2.5], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.4, 1.0, 0.175], position: [3.2, 1.0, 0], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.5, 0.175, 1.0], position: [-3.0, 0.175, 2.0], footstepMaterial: 'wood' },
  ],
  ceilings: [
    { type: 'cuboid', size: [4, 0.1, 4], position: [0, 3.1, 0] },
  ],
  visualComponent: 'ZaremaAlbertVisual',
  lights: [
    { position: [0, 2.5, 0], intensity: 1.0, color: '#ffcc88', distance: 8 },
    { position: [-2, 1.5, -2], intensity: 0.6, color: '#ffaa66', distance: 5 },
    { position: [2, 1.5, -2], intensity: 0.6, color: '#ffaa66', distance: 5 },
  ],
  ambientColor: '#3a3028',
  ambientIntensity: 0.65,
  groundColor: '#2e2820',
  fogEnabled: true,
  fog: { near: 5, far: 12 },
  entryText: 'Два мира под одной крышей. Шёлк и схемы.',
};

/** ЧК · Лес · Зорге — secret TOLPA gathering in the forest (night) */
export const chk_forest_zorge_def: SceneDefinition = {
  id: 'chk_forest_zorge',
  name: 'ЧК · Лес · Зорге',
  dimensions: [36, 6, 36],
  type: 'outdoor',
  hasCeiling: false,
  defaultSpawn: [0, 0, -12],
  defaultSpawnRotation: 0,
  characterModelScale: 1.0,
  locomotionScale: 1.2,
  doorways: [
    { id: 'chk_to_park', position: [0, 1, -16], width: 2.5, height: 2.5 },
  ],
  exits: [
    {
      id: 'chk_to_park',
      targetScene: 'park_day',
      position: [0, 1, -16],
      spawnPosition: [0, 0, -12],
      spawnRotation: Math.PI,
      label: '→ Тропа к парку',
      doorwayId: 'chk_to_park',
    },
  ],
  floors: [
    { type: 'cuboid', size: [18, 0.05, 18], position: [0, -0.05, 0], footstepMaterial: 'grass' },
  ],
  walls: [],
  obstacles: [
    { type: 'cuboidObstacle', size: [0.8, 2.5, 0.8], position: [-8, 2.5, -6], footstepMaterial: 'grass' },
    { type: 'cuboidObstacle', size: [0.9, 2.8, 0.9], position: [9, 2.8, -7], footstepMaterial: 'grass' },
    { type: 'cuboidObstacle', size: [1.0, 2.2, 1.0], position: [-10, 2.2, 5], footstepMaterial: 'grass' },
    { type: 'cuboidObstacle', size: [0.7, 2.0, 0.7], position: [7, 2.0, 8], footstepMaterial: 'grass' },
    { type: 'cuboidObstacle', size: [0.5, 0.3, 0.5], position: [0, 0.3, 0], footstepMaterial: 'stone' },
  ],
  ceilings: [],
  visualComponent: 'ChkForestVisual',
  lights: [
    { position: [0, 3.5, 0], intensity: 1.2, color: '#556644', distance: 24 },
    { position: [0, 4, -6], intensity: 0.6, color: '#8899aa', distance: 30 },
  ],
  ambientColor: '#3a5040',
  ambientIntensity: 0.55,
  groundColor: '#2a4a22',
  fogEnabled: true,
  fog: { near: 10, far: 36 },
  transitionStyle: 'dissolve',
  entryText: 'Тени между сосен. Тихий заговор.',
};

/** Factory basement — the reliquary of «Заря-М», dense industrial catacombs */
export const factory_basement_def: SceneDefinition = {
  id: 'factory_basement',
  name: 'Подвал завода',
  dimensions: [16, 4, 14],
  type: 'indoor',
  hasCeiling: true,
  defaultSpawn: [0, 0, 5],
  defaultSpawnRotation: Math.PI,
  characterModelScale: 1.0,
  locomotionScale: 1.0,
  doorways: [
    { id: 'basement_to_factory', position: [0, 1, 7], width: 1.4, height: 2.4 },
  ],
  exits: [
    {
      id: 'basement_to_factory',
      targetScene: 'abandoned_factory',
      position: [0, 1, 7],
      spawnPosition: [-8.5, 0, -5],
      spawnRotation: Math.PI,
      label: '→ Цех завода',
      doorwayId: 'basement_to_factory',
    },
  ],
  floors: [
    { type: 'cuboid', size: [8, 0.05, 7], position: [0, -0.05, 0], footstepMaterial: 'concrete' },
  ],
  walls: [],
  obstacles: [
    // Server rack rows flanking the central aisle
    { type: 'cuboidObstacle', size: [0.5, 1.1, 2.6], position: [-4.5, 1.1, -1], footstepMaterial: 'metal' },
    { type: 'cuboidObstacle', size: [0.5, 1.1, 2.6], position: [4.5, 1.1, -1], footstepMaterial: 'metal' },
    { type: 'cuboidObstacle', size: [0.5, 1.1, 1.8], position: [-4.5, 1.1, 3.5], footstepMaterial: 'metal' },
    { type: 'cuboidObstacle', size: [0.5, 1.1, 1.8], position: [4.5, 1.1, 3.5], footstepMaterial: 'metal' },
    // «Заря-М» monolith at the far wall
    { type: 'cuboidObstacle', size: [1.2, 1.6, 0.8], position: [0, 1.6, -5.2], footstepMaterial: 'metal' },
    // Support columns
    { type: 'cuboidObstacle', size: [0.3, 2, 0.3], position: [-2.5, 2, 0], footstepMaterial: 'concrete' },
    { type: 'cuboidObstacle', size: [0.3, 2, 0.3], position: [2.5, 2, 0], footstepMaterial: 'concrete' },
  ],
  ceilings: [
    { type: 'cuboid', size: [8, 0.1, 7], position: [0, 3.4, 0] },
  ],
  visualComponent: 'FactoryBasementVisual',
  lights: [
    { position: [0, 2.2, -5], intensity: 2.6, color: '#22ff88', distance: 12 },
    { position: [-4, 2.8, 2], intensity: 0.9, color: '#ff3322', distance: 8 },
    { position: [4, 2.8, 2], intensity: 0.9, color: '#ff3322', distance: 8 },
    { position: [0, 2.5, 5], intensity: 0.7, color: '#8899aa', distance: 9 },
  ],
  ambientColor: '#1a2a24',
  ambientIntensity: 0.45,
  groundColor: '#1c2220',
  fogEnabled: true,
  fog: { near: 4, far: 14 },
  transitionStyle: 'dissolve',
  entryText: 'Под землёй. Шёпот машин и старых тайн.',
};

/** River pier at night — second ЧК hangout: barrel fire, port wine, guitar, water */
export const river_pier_def: SceneDefinition = {
  id: 'river_pier',
  name: 'Пирс у реки',
  dimensions: [26, 4, 20],
  type: 'outdoor',
  hasCeiling: false,
  defaultSpawn: [0, 0, 7],
  defaultSpawnRotation: Math.PI,
  characterModelScale: 1.0,
  locomotionScale: 1.2,
  doorways: [
    { id: 'pier_to_park', position: [0, 1, 9], width: 2.0, height: 2.5 },
  ],
  exits: [
    {
      id: 'pier_to_park',
      targetScene: 'park_day',
      position: [0, 1, 9],
      spawnPosition: [11, 0, 7],
      spawnRotation: Math.PI,
      label: '→ Парк',
      doorwayId: 'pier_to_park',
    },
  ],
  floors: [
    { type: 'cuboid', size: [13, 0.05, 10], position: [0, -0.05, 0], footstepMaterial: 'wood' },
  ],
  walls: [],
  obstacles: [
    // Barrel fire
    { type: 'cuboidObstacle', size: [0.35, 0.5, 0.35], position: [0, 0.5, -2], footstepMaterial: 'metal' },
    // Crates / seats around the fire
    { type: 'cuboidObstacle', size: [0.35, 0.25, 0.35], position: [-1.6, 0.25, -1.2], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.35, 0.25, 0.35], position: [1.7, 0.25, -1.4], footstepMaterial: 'wood' },
    { type: 'cuboidObstacle', size: [0.35, 0.25, 0.35], position: [0.4, 0.25, -3.6], footstepMaterial: 'wood' },
    // Old boat hull on the bank
    { type: 'cuboidObstacle', size: [1.4, 0.4, 0.5], position: [-6, 0.4, 3], footstepMaterial: 'wood' },
    // Pier railing leaves a 2 m opening at the authored fishing spot (x 3.5..5.5).
    { type: 'cuboidObstacle', size: [5.0, 0.5, 0.1], position: [-1.5, 0.5, -8.5], footstepMaterial: 'metal' },
    { type: 'cuboidObstacle', size: [0.5, 0.5, 0.1], position: [6.0, 0.5, -8.5], footstepMaterial: 'metal' },
  ],
  ceilings: [],
  visualComponent: 'RiverPierVisual',
  lights: [
    // Cold river key only; warm practicals are owned by SceneAccentLights.
    { position: [0, 6, -14], intensity: 0.9, color: '#8a9ab0', distance: 30 },
  ],
  ambientColor: '#2a3448',
  ambientIntensity: 0.6,
  groundColor: '#2c2c38',
  fogEnabled: true,
  fog: { near: 10, far: 44 },
  transitionStyle: 'dissolve',
  entryText: 'Плеск воды. Костёр и гитара.',
};

/** Per-scene procedural ambient profiles — merged into SceneDefinition at export. */
const SCENE_AMBIENCE_BY_ID: Record<string, SceneAmbienceConfig> = {
  volodka_room: { daySound: 'home', nightSound: 'home', transitionDuration: 2000 },
  home_evening: { daySound: 'home', nightSound: 'home', transitionDuration: 2000 },
  zarema_albert_room: { daySound: 'home', nightSound: 'home', transitionDuration: 2000 },
  solnysh_room: { daySound: 'home', nightSound: 'home', transitionDuration: 2000 },
  volodka_corridor: { daySound: 'corridor', nightSound: 'corridor', transitionDuration: 2000 },
  cafe_evening: { daySound: 'cafe', nightSound: 'cafe', transitionDuration: 2000 },
  office_day: { daySound: 'office', nightSound: 'corridor', transitionDuration: 2000 },
  park_day: { daySound: 'park', nightSound: 'park', transitionDuration: 2000 },
  chk_forest_zorge: { daySound: 'park', nightSound: 'corridor', transitionDuration: 2500 },
  library_day: { daySound: 'library', nightSound: 'library', transitionDuration: 2000 },
  street_night: { daySound: 'street', nightSound: 'street', transitionDuration: 2000 },
  street_winter: { daySound: 'snow', nightSound: 'snow', transitionDuration: 2000 },
  rooftop_edge: { daySound: 'rooftop', nightSound: 'rooftop', transitionDuration: 2000 },
  abandoned_factory: { daySound: 'factory', nightSound: 'factory', transitionDuration: 2000 },
  factory_basement: { daySound: 'basement', nightSound: 'basement', transitionDuration: 2500 },
  river_pier: { daySound: 'pier', nightSound: 'pier', transitionDuration: 2500 },
  battle: { daySound: 'combat', nightSound: 'combat', transitionDuration: 1500 },
  sleep_dream: { daySound: 'rain', nightSound: 'rain', transitionDuration: 3000 },
};

function withSceneAmbience(def: SceneDefinition): SceneDefinition {
  if (def.ambience) return def;
  const ambience = SCENE_AMBIENCE_BY_ID[def.id];
  return ambience ? { ...def, ambience } : def;
}

/** Map of all scene definitions — single source of truth */
export const SCENE_DEFINITIONS = {
  volodka_room: withSceneAmbience(volodka_room_def),
  volodka_corridor: withSceneAmbience(volodka_corridor_def),
  home_evening: withSceneAmbience(home_evening_def),
  street_night: withSceneAmbience(street_night_def),
  street_winter: withSceneAmbience(street_winter_def),
  cafe_evening: withSceneAmbience(cafe_evening_def),
  office_day: withSceneAmbience(office_day_def),
  park_day: withSceneAmbience(park_day_def),
  library_day: withSceneAmbience(library_day_def),
  battle: withSceneAmbience(battle_def),
  sleep_dream: withSceneAmbience(sleep_dream_def),
  rooftop_edge: withSceneAmbience(rooftop_edge_def),
  abandoned_factory: withSceneAmbience(abandoned_factory_def),
  zarema_albert_room: withSceneAmbience(zarema_albert_room_def),
  solnysh_room: withSceneAmbience(solnysh_room_def),
  chk_forest_zorge: withSceneAmbience(chk_forest_zorge_def),
  factory_basement: withSceneAmbience(factory_basement_def),
  river_pier: withSceneAmbience(river_pier_def),
  chk_campfire_night: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.chk_campfire_night),
  pier_evening: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.pier_evening),
  factory_roof: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.factory_roof),
  library_basement: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.library_basement),
  city_square: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.city_square),
  underground_bunker: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.underground_bunker),
  guild_mainframe: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.guild_mainframe),
  zarema_room: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.zarema_room),
  albert_backroom: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.albert_backroom),
  procedural_aaa: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.procedural_aaa),
  forest_clearing: withSceneAmbience(EXTENSION_SCENE_DEFINITIONS.forest_clearing),
} as const satisfies Record<SceneId, SceneDefinition>;

export type { SceneId, ExtensionSceneId, CoreSceneId } from './sceneIds';
export { SCENE_IDS, EXTENSION_SCENE_IDS, CORE_SCENE_IDS } from './sceneIds';
