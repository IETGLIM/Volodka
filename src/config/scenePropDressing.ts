/* ─── Volodka RPG – static GLB prop placements per scene ─── */

import type { SceneId } from '@/shared/types/game';

export interface ScenePropPlacement {
  propModelId: string;
  position: [number, number, number];
  rotationY?: number;
  offset?: [number, number, number];
}

/** Kenney + AI3DGen props placed in scene visuals (see propModelRegistry). */
export const SCENE_PROP_DRESSING: Partial<Record<SceneId, readonly ScenePropPlacement[]>> = {
  volodka_room: [
    { propModelId: 'kenney_desk', position: [0, 0, -2.5] },
    { propModelId: 'kenney_bed', position: [1.8, 0, 2.0] },
    { propModelId: 'kenney_wardrobe', position: [-2.2, 0, 2.5] },
    { propModelId: 'kenney_terminal', position: [0.72, 0.78, -2.62], offset: [0, -0.28, 0] },
    { propModelId: 'kenney_bookshelf', position: [-2.2, 0, 0] },
    { propModelId: 'kenney_window', position: [2.4, 1.2, -2.0], rotationY: -Math.PI / 2 },
  ],
  volodka_corridor: [
    { propModelId: 'kenney_door', position: [0, 0, 7.3] },
  ],
  office_day: [
    { propModelId: 'kenney_desk', position: [-2.0, 0, -1.5] },
    { propModelId: 'kenney_terminal', position: [-1.2, 0.78, -1.2], offset: [0, -0.28, 0] },
    { propModelId: 'kenney_bookshelf', position: [3.5, 0, -2.0] },
  ],
  library_day: [
    { propModelId: 'kenney_bookshelf', position: [-3.0, 0, -1.0] },
    { propModelId: 'kenney_bookshelf', position: [3.0, 0, -1.0], rotationY: Math.PI },
  ],
  cafe_evening: [
    { propModelId: 'kenney_desk', position: [-3.5, 0, -2.0], rotationY: Math.PI / 2 },
  ],
  zarema_albert_room: [
    { propModelId: 'kenney_bed', position: [-1.5, 0, 1.5] },
    { propModelId: 'kenney_wardrobe', position: [2.0, 0, 2.0] },
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
