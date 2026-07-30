/* ─── Volodka RPG – static GLB prop placements per scene ─── */

import type { SceneId } from '@/shared/types/game';
import { GltfPreloadPriority } from '@/engine/assets/gltfPreloadScheduler';

export type PropLoadTier = 'critical' | 'deferred';

export interface ScenePropPlacement {
  propModelId: string;
  position: [number, number, number];
  rotationY?: number;
  offset?: [number, number, number];
  /** Mount/preload priority — defaults to critical when omitted. */
  loadTier?: PropLoadTier;
}

export interface SplitScenePropDressing {
  critical: readonly ScenePropPlacement[];
  deferred: readonly ScenePropPlacement[];
}

/** Authored GLTF props placed in scene visuals (see propModelRegistry). */
export const SCENE_PROP_DRESSING: Partial<Record<SceneId, readonly ScenePropPlacement[]>> = {
  volodka_room: [
    // High/Ultra path intentionally avoids Kenney hero furniture; Poly Haven
    // dressing is preferable to low-poly placeholder beds/chairs/bookcases.
    { propModelId: 'polyhaven_bench', position: [1.58, 0, 1.82], rotationY: Math.PI, loadTier: 'deferred' },
    { propModelId: 'polyhaven_bench', position: [-1.78, 0, 0.2], rotationY: Math.PI / 2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_shutter_door', position: [0, 0, 3.36], rotationY: Math.PI, loadTier: 'deferred' },
    { propModelId: 'polyhaven_shutter_window', position: [2.43, 1.08, -2.0], rotationY: -Math.PI / 2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_shutter_window', position: [-1.0, 1.08, -3.37], loadTier: 'deferred' },
    { propModelId: 'polyhaven_industrial_lamp', position: [0.15, 2.55, -1.25], rotationY: 0.2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_barrel', position: [2.12, 0, 2.12], rotationY: -0.2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_cardboard_box', position: [-1.55, 0, 2.78], rotationY: -0.35, loadTier: 'deferred' },
    { propModelId: 'polyhaven_cardboard_box', position: [-2.0, 0.5, 2.84], rotationY: 0.25, loadTier: 'deferred' },
    { propModelId: 'polyhaven_metal_trash_can', position: [1.05, 0, -2.85], rotationY: 0.4, loadTier: 'deferred' },
    { propModelId: 'polyhaven_trashbag', position: [1.45, 0, -2.95], rotationY: -0.15, loadTier: 'deferred' },
    { propModelId: 'ai3dgen_poetic_compiler', position: [-0.35, 0.82, -2.38], rotationY: 0.25, loadTier: 'deferred' },
    { propModelId: 'ai3dgen_neural_filter', position: [0.95, 0.82, -2.55], rotationY: -0.35, loadTier: 'deferred' },
    { propModelId: 'ai3dgen_digital_amulet', position: [-2.05, 1.55, 0.05], rotationY: Math.PI / 2, loadTier: 'deferred' },
  ],
  volodka_corridor: [
    { propModelId: 'kenney_door', position: [0, 0, 7.3] },
    { propModelId: 'polyhaven_shutter_door', position: [-1.8, 0, 6.95], rotationY: Math.PI, loadTier: 'deferred' },
    { propModelId: 'polyhaven_cardboard_box', position: [1.25, 0, 5.9], rotationY: 0.2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_trashbag', position: [1.75, 0, 5.55], rotationY: -0.45, loadTier: 'deferred' },
  ],
  office_day: [
    { propModelId: 'polyhaven_painted_wooden_table', position: [-2.0, 0, -1.5], rotationY: Math.PI / 2 },
    { propModelId: 'kenney_terminal', position: [-1.2, 0.78, -1.2], offset: [0, -0.28, 0] },
    { propModelId: 'polyhaven_wooden_bookshelf_worn', position: [3.5, 0, -2.0], rotationY: -Math.PI / 2 },
    { propModelId: 'ai3dgen_server_fragment', position: [-4.0, 0.15, -4.5] },
    { propModelId: 'polyhaven_arm_chair', position: [-2.0, 0, -0.5], rotationY: Math.PI },
    { propModelId: 'polyhaven_shutter_window', position: [-3.8, 1.25, -4.85], rotationY: Math.PI, loadTier: 'deferred' },
    { propModelId: 'polyhaven_industrial_lamp', position: [-2.0, 2.55, -1.4], rotationY: -0.2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_desk_lamp_arm', position: [-2.45, 0.78, -1.35], rotationY: 0.45, loadTier: 'deferred' },
    { propModelId: 'polyhaven_painted_wooden_cabinet', position: [3.25, 0, 1.8], rotationY: -Math.PI / 2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_metal_trash_can', position: [2.35, 0, -2.85], rotationY: 0.2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_cardboard_box', position: [3.8, 0, -3.1], rotationY: -0.25, loadTier: 'deferred' },
    { propModelId: 'polyhaven_wet_floor_sign', position: [0.45, 0, 1.9], rotationY: 0.35, loadTier: 'deferred' },
  ],
  library_day: [
    { propModelId: 'polyhaven_wooden_bookshelf_worn', position: [-3.0, 0, -1.0] },
    { propModelId: 'polyhaven_wooden_bookshelf_worn', position: [3.0, 0, -1.0], rotationY: Math.PI },
    { propModelId: 'polyhaven_arm_chair', position: [0.5, 0, 1.5], rotationY: Math.PI },
    { propModelId: 'polyhaven_painted_wooden_table', position: [-1.0, 0, 2.0], rotationY: -Math.PI / 2 },
    { propModelId: 'polyhaven_cassette_player', position: [-0.72, 0.78, 2.05], rotationY: -0.35, loadTier: 'deferred' },
    { propModelId: 'polyhaven_industrial_lamp', position: [-0.8, 2.75, 1.7], rotationY: 0.4, loadTier: 'deferred' },
    { propModelId: 'polyhaven_cardboard_box', position: [-3.65, 0, 1.8], rotationY: 0.5, loadTier: 'deferred' },
    { propModelId: 'polyhaven_metal_trash_can', position: [3.7, 0, 2.2], rotationY: -0.15, loadTier: 'deferred' },
  ],
  cafe_evening: [
    { propModelId: 'polyhaven_painted_wooden_table', position: [-3.5, 0, -2.0], rotationY: Math.PI / 2 },
    { propModelId: 'kenney_city_coffee_machine', position: [2.5, 0, -1.2], rotationY: -Math.PI / 2 },
    { propModelId: 'polyhaven_painted_wooden_table', position: [-2.0, 0, 1.5], rotationY: 0.15 },
    { propModelId: 'polyhaven_arm_chair', position: [-2.0, 0, 2.3], rotationY: Math.PI },
    { propModelId: 'polyhaven_painted_wooden_table', position: [1.2, 0, 2.0], rotationY: 0.35 },
    { propModelId: 'polyhaven_arm_chair', position: [1.2, 0, 2.75], rotationY: Math.PI + 0.2 },
    { propModelId: 'polyhaven_arm_chair', position: [1.55, 0, 1.35], rotationY: 0.4 },
    { propModelId: 'polyhaven_wooden_bookshelf_worn', position: [4.2, 0, -3.2], rotationY: -Math.PI / 2 },
    { propModelId: 'kenney_city_bottle', position: [-1.85, 0.55, 1.55] },
    { propModelId: 'ai3dgen_poetic_compiler', position: [-4.0, 0.55, -3.5] },
    { propModelId: 'polyhaven_shutter_window', position: [4.7, 1.45, -2.0], rotationY: -Math.PI / 2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_industrial_lamp', position: [-2.0, 2.45, 1.5], rotationY: 0.2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_wet_floor_sign', position: [0.25, 0, -0.85], rotationY: -0.25 },
    { propModelId: 'polyhaven_metal_trash_can', position: [3.7, 0, -2.7], rotationY: 0.35, loadTier: 'deferred' },
    { propModelId: 'polyhaven_cardboard_box', position: [3.25, 0, -3.3], rotationY: -0.45, loadTier: 'deferred' },
    { propModelId: 'polyhaven_trashbag', position: [3.95, 0, -3.2], rotationY: 0.25, loadTier: 'deferred' },
  ],
  street_night: [
    // Poly Haven street setpiece owns benches/lamps/trash/utilities; avoid low-poly Kenney hero clutter.
    { propModelId: 'polyhaven_street_lamp', position: [-3.2, 0, -9.0], rotationY: 0.2 },
    { propModelId: 'polyhaven_wooden_crate', position: [-4.2, 0, 2.15], rotationY: -0.25, loadTier: 'deferred' },
    { propModelId: 'polyhaven_old_tyre', position: [-4.85, 0, 2.45], rotationY: 0.65, loadTier: 'deferred' },
    { propModelId: 'polyhaven_manhole_cover', position: [1.1, 0.02, -2.9], rotationY: 0.4, loadTier: 'deferred' },
    { propModelId: 'polyhaven_utility_box', position: [8.8, 0, -5.6], rotationY: Math.PI, loadTier: 'deferred' },
    { propModelId: 'polyhaven_power_box', position: [-9.2, 0, -3.4], rotationY: 0.08, loadTier: 'deferred' },
    { propModelId: 'polyhaven_exterior_aircon_unit', position: [-10.2, 4.6, -8.8], rotationY: 0.08, loadTier: 'deferred' },
    { propModelId: 'polyhaven_security_camera', position: [10.1, 4.9, -9.4], rotationY: Math.PI, loadTier: 'deferred' },
  ],
  rooftop_edge: [
    { propModelId: 'kenney_city_guitar', position: [-1.2, 0.05, -2.0], rotationY: 0.6 },
  ],
  river_pier: [
    { propModelId: 'kenney_city_bench', position: [3.0, 0, -1.0], rotationY: -Math.PI / 3 },
    { propModelId: 'kenney_city_guitar', position: [-2.5, 0.05, 0.5], rotationY: -0.4 },
    { propModelId: 'kenney_city_bottle', position: [3.2, 0.45, -0.8] },
  ],
  chk_forest_zorge: [
    { propModelId: 'kenney_city_campfire', position: [0, 0, -2.0] },
    { propModelId: 'kenney_city_bench', position: [2.5, 0, -1.5], rotationY: -Math.PI / 2 },
    { propModelId: 'kenney_city_guitar', position: [-2.0, 0.05, -1.0], rotationY: 0.3 },
  ],
  zarema_albert_room: [
    { propModelId: 'kenney_bed', position: [-1.5, 0, 1.5] },
    { propModelId: 'polyhaven_painted_wooden_cabinet', position: [2.0, 0, 2.0], rotationY: -Math.PI / 2 },
    { propModelId: 'polyhaven_wooden_bookshelf_worn', position: [2.2, 0, -1.4], rotationY: -Math.PI / 2 },
    { propModelId: 'polyhaven_arm_chair', position: [-0.35, 0, -1.25], rotationY: Math.PI },
    { propModelId: 'polyhaven_painted_wooden_table', position: [-2.05, 0, 1.4], rotationY: 0.3 },
    { propModelId: 'polyhaven_desk_lamp_arm', position: [-2.18, 0.78, 1.32], rotationY: -0.2, loadTier: 'deferred' },
    { propModelId: 'polyhaven_industrial_lamp', position: [-1.6, 2.45, 1.55], rotationY: -0.15, loadTier: 'deferred' },
    { propModelId: 'polyhaven_cardboard_box', position: [1.45, 0, 2.85], rotationY: 0.45, loadTier: 'deferred' },
    { propModelId: 'polyhaven_metal_trash_can', position: [-2.15, 0, -1.85], rotationY: -0.3, loadTier: 'deferred' },
  ],
  abandoned_factory: [
    { propModelId: 'ai3dgen_server_fragment', position: [-6.0, 0.25, -5.0], rotationY: 0.4 },
    { propModelId: 'kenney_city_bench', position: [2.0, 0, -3.5], rotationY: Math.PI / 3 },
    { propModelId: 'polyhaven_road_barrier', position: [-1.8, 0, -5.8], rotationY: 0.15 },
    { propModelId: 'polyhaven_barrel', position: [4.5, 0, -4.2], rotationY: -0.35, loadTier: 'deferred' },
    { propModelId: 'polyhaven_cardboard_box', position: [5.1, 0, -4.65], rotationY: 0.25, loadTier: 'deferred' },
  ],
  factory_basement: [
    { propModelId: 'ai3dgen_server_fragment', position: [-3.6, 0.55, -1.0], rotationY: -Math.PI / 2 },
    { propModelId: 'kenney_terminal', position: [1.5, 0.78, -2.0], offset: [0, -0.28, 0] },
    { propModelId: 'polyhaven_barrel', position: [-2.4, 0, 1.75], rotationY: 0.2 },
    { propModelId: 'polyhaven_cardboard_box', position: [2.65, 0, -2.65], rotationY: -0.35, loadTier: 'deferred' },
    { propModelId: 'polyhaven_trashbag', position: [3.15, 0, -2.85], rotationY: 0.5, loadTier: 'deferred' },
  ],
};

export function getScenePropDressing(sceneId: SceneId): readonly ScenePropPlacement[] {
  return SCENE_PROP_DRESSING[sceneId] ?? [];
}

export function getScenePropDressingIds(sceneId: SceneId): string[] {
  const ids = new Set<string>();
  for (const placement of getScenePropDressing(sceneId)) {
    ids.add(placement.propModelId);
  }
  return [...ids];
}

export function splitScenePropDressing(sceneId: SceneId): SplitScenePropDressing {
  const critical: ScenePropPlacement[] = [];
  const deferred: ScenePropPlacement[] = [];

  for (const placement of getScenePropDressing(sceneId)) {
    if (placement.loadTier === 'deferred') {
      deferred.push(placement);
    } else {
      critical.push(placement);
    }
  }

  return { critical, deferred };
}

export function resolvePropDressingPreloadPriority(
  placement: ScenePropPlacement,
): GltfPreloadPriority {
  return placement.loadTier === 'deferred'
    ? GltfPreloadPriority.Deferred
    : GltfPreloadPriority.High;
}
