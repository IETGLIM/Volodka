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

/** Urban facade backdrop — Poly Haven modular_urban_apartments_facade.
 *  FIX v4.36.0: натив ИЗМЕРЕН по GLB (accessor min/max × node-TRS):
 *  51.53 × 17.0 × 6.66 м, minY −2.0. Прежние ×1.78–2.38 рассчитывались из
 *  неверной посылки «~3 м shell» и давали башни 30–41 м высоты и до 123 м
 *  длины при процедурном силуэте тех же слотов 15–25 м. Новые множители
 *  согласуют силуэт: hero ×1.18 ≈ 20.1 м (5–6 этажей), mid ×1.03 ≈ 17.5 м,
 *  side ×0.88 ≈ 15.0 м. Размещение фасадов обязано включать groundAnchor
 *  (minY −2.0 без якоря топит наземный этаж на −2.36…−4.76 м). */
export const STREET_FACADE_SCALE = {
  hero: 1.18,
  mid: 1.03,
  side: 0.88,
} as const;

/** Измеренная нативная высота фасадного GLB (м) — якорь для тестов масштаба. */
export const URBAN_FACADE_NATIVE_HEIGHT_M = 17.0;

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
    targetM: 20,
    applied: `PH urbanFacade × ${STREET_FACADE_SCALE.hero} ≈ ${(URBAN_FACADE_NATIVE_HEIGHT_M * STREET_FACADE_SCALE.hero).toFixed(1)} м (натив 17.0 м)`,
    status: 'fixed',
    note: 'Было ×2.38 → 40.5 м из посылки «~3 м shell»; натив измерен 51.5×17.0 м. Силуэт согласован с процедурным бэкдропом 15–25 м; фасадам добавлен groundAnchor (minY −2.0 топил наземный этаж до −4.76 м).',
  },
  {
    id: 'street_lamp_alt',
    domain: 'street',
    targetM: 4.2,
    applied: 'street_lamp_02 (натив 1.68 м, minY −0.395) × 2.6 + groundAnchor ≈ 4.37 м',
    status: 'fixed',
    note: 'Было ×1.0–1.05 → 1.28–1.35 м над землёй — фонарь ниже игрока 1.75 м. Registry-путь (targetSizeM 3.4, height-fit) был корректен — сломан только manualScale-путь.',
  },
  {
    id: 'bench_scale',
    domain: 'street',
    targetM: 0.9,
    applied: 'painted_wooden_bench (натив 1.16×0.89 м) height-fit 0.9 м',
    status: 'fixed',
    note: 'Было: InstancedProp ×1.35 → 1.20 м ростом; registry width-fit [2.05, 0.88] → скамья 1.57 м ростом. Нативные пропорции корректны при scale ≈ 1.',
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
