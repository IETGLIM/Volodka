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
  /** Upper-floor residential window band (m). */
  residentialWindowHeightM: 1.35,
  /** Poly Haven rollershutter door GLB native height at scale 1 (m). */
  storefrontShutterHeightM: 2.4,
  /** Poly Haven rollershutter window GLB native height at scale 1 (m). */
  storefrontShutterWindowHeightM: 1.85,
} as const;

/** Canonical NPC GLB fit target — same band as player humanoid. */
export const NPC_GLTF_TARGET_HEIGHT_M = PLAYER_METRIC.heightM;

/** Poly Haven rollershutter door — street multiplier ≈ 2.1 m storefront band. */
export const STREET_SHUTTER_DOOR_SCALE =
  PLAYER_METRIC.residentialDoorHeightM / PLAYER_METRIC.storefrontShutterHeightM;

/** Poly Haven upper-floor shutter windows — was ×1.5–1.75 (~2.8–3.2 m). */
export const STREET_SHUTTER_WINDOW_SCALE =
  PLAYER_METRIC.residentialWindowHeightM / PLAYER_METRIC.storefrontShutterWindowHeightM;

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
    id: 'street_shutter_door',
    domain: 'street',
    targetM: PLAYER_METRIC.residentialDoorHeightM,
    applied: `PH door × ${STREET_SHUTTER_DOOR_SCALE.toFixed(2)} ≈ 2.1 m`,
    status: 'fixed',
    note: 'Was ×1.55–1.7 (~4 m) — dwarfed 1.75 m player',
  },
  {
    id: 'street_shutter_window',
    domain: 'street',
    targetM: PLAYER_METRIC.residentialWindowHeightM,
    applied: `PH window × ${STREET_SHUTTER_WINDOW_SCALE.toFixed(2)} ≈ 1.35 m`,
    status: 'fixed',
    note: 'Was ×1.5–1.75 (~2.8–3.2 m) on upper floors',
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
    applied: 'procedural envelope; exterior Kenney shells blocked',
    status: 'fixed',
    note: 'cafe/office/library GLBs remain exterior buildings — do not AABB-stretch into walkable rooms; bedroom uses apartment_envelope.glb',
  },
  {
    id: 'volodka_room_envelope',
    domain: 'interior',
    targetM: 3,
    applied: 'VolodkaRoomVisual procedural 5×3×7 m + Rapier cuboids',
    status: 'fixed',
    note: 'AuthoredInteriorShell(room_bedroom) occluded ThinMonitors / spawned facade posts ~2.15 m at desk',
  },
  {
    id: 'npc_glb_runtime',
    domain: 'player',
    targetM: NPC_GLTF_TARGET_HEIGHT_M,
    applied: 'fitCharacterGltf → 1.75 m at runtime',
    status: 'ok',
    note: 'Quaternius/CC0 via GltfNPCModel; per-NPC scale only for story height',
  },
  {
    id: 'npc_glb_batch',
    domain: 'player',
    targetM: PLAYER_METRIC.heightM,
    applied: 'authoring pipeline (not runtime code)',
    status: 'debt',
    note: 'On-disk GLB re-export batch deferred — do not commit mass GLB',
  },
];
