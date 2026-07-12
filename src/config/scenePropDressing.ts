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

/** Kenney + AI3DGen props placed in scene visuals (see propModelRegistry). */
export const SCENE_PROP_DRESSING: Partial<Record<SceneId, readonly ScenePropPlacement[]>> = {
  volodka_room: [
    { propModelId: 'kenney_desk', position: [0, 0, -2.5], loadTier: 'critical' },
    { propModelId: 'kenney_bed', position: [1.8, 0, 2.0], loadTier: 'critical' },
    { propModelId: 'kenney_terminal', position: [0.72, 0.78, -2.62], offset: [0, -0.28, 0], loadTier: 'critical' },
    { propModelId: 'kenney_door_open', position: [0, 0, 3.45], loadTier: 'critical' },
    { propModelId: 'kenney_wardrobe', position: [-2.2, 0, 2.5], loadTier: 'deferred' },
    { propModelId: 'kenney_bookshelf', position: [-2.2, 0, 0], loadTier: 'deferred' },
    { propModelId: 'kenney_window', position: [2.4, 1.2, -2.0], rotationY: -Math.PI / 2, loadTier: 'deferred' },
    { propModelId: 'ai3dgen_poetic_compiler', position: [-0.35, 0.82, -2.38], rotationY: 0.25, loadTier: 'deferred' },
    { propModelId: 'ai3dgen_neural_filter', position: [0.95, 0.82, -2.55], rotationY: -0.35, loadTier: 'deferred' },
    { propModelId: 'ai3dgen_digital_amulet', position: [-2.05, 1.55, 0.05], rotationY: Math.PI / 2, loadTier: 'deferred' },
  ],
  volodka_corridor: [
    { propModelId: 'kenney_door', position: [0, 0, 7.3] },
  ],
  office_day: [
    { propModelId: 'kenney_desk', position: [-2.0, 0, -1.5] },
    { propModelId: 'kenney_terminal', position: [-1.2, 0.78, -1.2], offset: [0, -0.28, 0] },
    { propModelId: 'kenney_bookshelf', position: [3.5, 0, -2.0] },
    { propModelId: 'ai3dgen_server_fragment', position: [-4.0, 0.15, -4.5] },
    { propModelId: 'kenney_city_chair', position: [-2.0, 0, -0.5], rotationY: Math.PI },
  ],
  library_day: [
    { propModelId: 'kenney_bookshelf', position: [-3.0, 0, -1.0] },
    { propModelId: 'kenney_bookshelf', position: [3.0, 0, -1.0], rotationY: Math.PI },
    { propModelId: 'kenney_city_chair', position: [0.5, 0, 1.5], rotationY: Math.PI },
    { propModelId: 'kenney_desk', position: [-1.0, 0, 2.0], rotationY: -Math.PI / 2 },
  ],
  cafe_evening: [
    { propModelId: 'kenney_desk', position: [-3.5, 0, -2.0], rotationY: Math.PI / 2 },
    { propModelId: 'kenney_city_coffee_machine', position: [2.5, 0, -1.2], rotationY: -Math.PI / 2 },
    { propModelId: 'kenney_city_table_small', position: [-2.0, 0, 1.5] },
    { propModelId: 'kenney_city_chair', position: [-2.0, 0, 2.3], rotationY: Math.PI },
    { propModelId: 'kenney_city_bottle', position: [-1.85, 0.55, 1.55] },
    { propModelId: 'ai3dgen_poetic_compiler', position: [-4.0, 0.55, -3.5] },
  ],
  street_night: [
    { propModelId: 'kenney_city_bench', position: [-4.5, 0, 2.0], rotationY: Math.PI / 2 },
    { propModelId: 'kenney_city_lamp_post', position: [-6.0, 0, -1.5] },
    { propModelId: 'kenney_city_lamp_post', position: [5.5, 0, 3.0], rotationY: Math.PI / 4 },
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
    { propModelId: 'kenney_wardrobe', position: [2.0, 0, 2.0] },
  ],
  abandoned_factory: [
    { propModelId: 'ai3dgen_server_fragment', position: [-6.0, 0.25, -5.0], rotationY: 0.4 },
    { propModelId: 'kenney_city_bench', position: [2.0, 0, -3.5], rotationY: Math.PI / 3 },
  ],
  factory_basement: [
    { propModelId: 'ai3dgen_server_fragment', position: [-3.6, 0.55, -1.0], rotationY: -Math.PI / 2 },
    { propModelId: 'kenney_terminal', position: [1.5, 0.78, -2.0], offset: [0, -0.28, 0] },
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
