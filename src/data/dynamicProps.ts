/* ─── Volodka RPG – per-scene dynamic (pushable) physics props ─── */

import type { SceneId } from '@/shared/types/game';

export type DynamicPropKind = 'can' | 'bottle' | 'box' | 'barrel';

export interface DynamicPropDef {
  id: string;
  kind: DynamicPropKind;
  /** Spawn position (y = resting height offset is added by the renderer) */
  position: [number, number, number];
  /** Initial Y rotation */
  rotation?: number;
}

/** Pushable clutter per scene — kicked around by the player (KCC impulses).
 *  Keep counts low (≤6 per scene): each prop is one dynamic rigid body. */
export const DYNAMIC_PROPS: Partial<Record<SceneId, DynamicPropDef[]>> = {
  street_night: [
    { id: 'sn_can_1', kind: 'can', position: [2.4, 0, 3.6], rotation: 0.4 },
    { id: 'sn_can_2', kind: 'can', position: [-2.1, 0, -7.4], rotation: 1.2 },
    { id: 'sn_can_3', kind: 'can', position: [1.6, 0, 1.9], rotation: 2.1 },
    { id: 'sn_bottle_1', kind: 'bottle', position: [-3.8, 0, -0.9], rotation: 0.8 },
    { id: 'sn_box_1', kind: 'box', position: [3.4, 0, 0.6], rotation: 0.3 },
  ],
  abandoned_factory: [
    { id: 'af_box_1', kind: 'box', position: [-3.2, 0, -2.4], rotation: 0.5 },
    { id: 'af_box_2', kind: 'box', position: [2.8, 0, -4.6], rotation: 1.7 },
    { id: 'af_barrel_1', kind: 'barrel', position: [4.5, 0, 1.8], rotation: 0 },
    { id: 'af_can_1', kind: 'can', position: [-1.4, 0, 2.2], rotation: 2.6 },
  ],
  park_day: [
    { id: 'pd_can_1', kind: 'can', position: [3.6, 0, -2.4], rotation: 1.1 },
    { id: 'pd_bottle_1', kind: 'bottle', position: [7.5, 0, 3.6], rotation: 0.2 },
  ],
  chk_forest_zorge: [
    { id: 'chk_bottle_1', kind: 'bottle', position: [2.6, 0, 2.2], rotation: 0.9 },
    { id: 'chk_bottle_2', kind: 'bottle', position: [-2.4, 0, 1.6], rotation: 2.3 },
  ],
  rooftop_edge: [
    { id: 're_can_1', kind: 'can', position: [-1.8, 0, 1.4], rotation: 0.6 },
    { id: 're_can_2', kind: 'can', position: [2.6, 0, 0.8], rotation: 1.9 },
  ],
  river_pier: [
    { id: 'rp_bottle_1', kind: 'bottle', position: [1.1, 0, -3.2], rotation: 0.4 },
    { id: 'rp_bottle_2', kind: 'bottle', position: [-2.3, 0, -1.8], rotation: 1.8 },
    { id: 'rp_can_1', kind: 'can', position: [3.2, 0, -4.4], rotation: 2.5 },
    { id: 'rp_box_1', kind: 'box', position: [-4.2, 0, -0.6], rotation: 0.9 },
  ],
  factory_basement: [
    { id: 'fb_box_1', kind: 'box', position: [2.2, 0, 4.4], rotation: 0.7 },
    { id: 'fb_can_1', kind: 'can', position: [-1.8, 0, 2.6], rotation: 1.3 },
    { id: 'fb_bottle_1', kind: 'bottle', position: [-3.4, 0, 5.2], rotation: 2.2 },
  ],
};
