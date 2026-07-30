/**
 * Metric scale coherence — single source for 1 u = 1 m player-relative targets.
 * Cascade anchor: volodka_room wake cutscene (1.75 m humanoid, 2.8 m ceiling).
 */

import { PLAYER_GLB_TARGET_VISUAL_METERS } from '@/data/constants';
import { FIRST_PERSON_EYE_HEIGHT } from '@/engine/camera/cameraConstants';

/** Canonical human metric used across props, camera, and NPC fit. */
export const PLAYER_METRIC = {
  heightM: PLAYER_GLB_TARGET_VISUAL_METERS,
  eyeHeightM: FIRST_PERSON_EYE_HEIGHT,
  /** Seated at desk — eye line for wake sit/monitor phases. */
  seatedEyeHeightM: 1.05,
  deskHeightM: 0.76,
  chairSeatHeightM: 0.45,
  residentialDoorHeightM: 2.1,
  storefrontShutterHeightM: 2.6,
} as const;

/** Poly Haven rollershutter door GLB ≈ 2.6 m tall at scale 1 — street multiplier band. */
export const STREET_SHUTTER_DOOR_SCALE = 0.88;

/** Urban facade backdrop — ~3 m shell × multiplier ≈ 7–8 m (2–3 storeys). */
export const STREET_FACADE_SCALE = {
  hero: 2.38,
  mid: 1.96,
  side: 1.78,
} as const;

/** Plaza monument — human-scale obelisk/statue (~1.6 m), not cathedral scale. */
export const PLAZA_MONUMENT_SCALE = 0.88;

export type ScaleAuditRow = {
  id: string;
  domain: 'player' | 'interior' | 'street' | 'plaza' | 'prop';
  targetM: number;
  applied: string;
  status: 'ok' | 'fixed' | 'debt';
  note: string;
};

/** Living audit table — update when adjusting scale cascade. */
export const METRIC_SCALE_AUDIT: readonly ScaleAuditRow[] = [
  {
    id: 'player_glb',
    domain: 'player',
    targetM: PLAYER_METRIC.heightM,
    applied: 'gltfScale fit → 1.75 m',
    status: 'ok',
    note: 'Volodka + NPC humanoids',
  },
  {
    id: 'wake_camera_eye',
    domain: 'interior',
    targetM: PLAYER_METRIC.eyeHeightM,
    applied: 'wakeUpCinematic lookAt ≈ 1.48–1.58 m standing',
    status: 'fixed',
    note: 'Intro timeline camera vs 1.75 m actor',
  },
  {
    id: 'volodka_room_door',
    domain: 'interior',
    targetM: PLAYER_METRIC.residentialDoorHeightM,
    applied: 'kenney_door targetSizeM 2.1 m',
    status: 'ok',
    note: 'Replaced polyhaven_shutter_door in room/corridor',
  },
  {
    id: 'office_desk',
    domain: 'prop',
    targetM: PLAYER_METRIC.deskHeightM,
    applied: 'polyhaven_painted_wooden_table 0.78 m H',
    status: 'ok',
    note: 'Office/library/cafe tables via propModelRegistry',
  },
  {
    id: 'office_chair',
    domain: 'prop',
    targetM: 0.92,
    applied: 'kenney_city_chair 0.92 m H',
    status: 'ok',
    note: 'Seating uses Kenney city chair, not oversized PH armchair in hero desks',
  },
  {
    id: 'street_shutter',
    domain: 'street',
    targetM: PLAYER_METRIC.storefrontShutterHeightM,
    applied: `PH shutter × ${STREET_SHUTTER_DOOR_SCALE} ≈ 2.3 m`,
    status: 'fixed',
    note: 'Was ×1.55–1.7 (~4 m) — dwarfed 1.75 m player',
  },
  {
    id: 'street_facade',
    domain: 'street',
    targetM: 8,
    applied: `PH urbanFacade × ${STREET_FACADE_SCALE.hero}`,
    status: 'ok',
    note: 'Backdrop shells, not walkable interior',
  },
  {
    id: 'plaza_monument',
    domain: 'plaza',
    targetM: 1.65,
    applied: `gothicStatue × ${PLAZA_MONUMENT_SCALE} ≈ 1.6 m`,
    status: 'fixed',
    note: 'City square centrepiece vs player silhouette',
  },
  {
    id: 'interior_shells',
    domain: 'interior',
    targetM: 3,
    applied: 'interiorShellScale.ts footprint fit',
    status: 'ok',
    note: 'room/cafe/corridor/office/library shells',
  },
  {
    id: 'npc_glb_batch',
    domain: 'player',
    targetM: PLAYER_METRIC.heightM,
    applied: 'authoring pipeline (not runtime code)',
    status: 'debt',
    note: 'GLB height normalization pending art pass — do not commit mass GLB',
  },
];
