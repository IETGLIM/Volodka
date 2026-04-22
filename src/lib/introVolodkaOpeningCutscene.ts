import type { SceneId } from '@/data/types';
import type { PlayerPosition } from '@/data/rpgTypes';
import * as THREE from 'three';
import { PLAYER_FEET_SPAWN_Y } from '@/lib/playerScaleConstants';
import { smoothBlend01 } from '@/lib/cinematicEasing';

/**
 * Целевая высота GLB (м сцены) в `intro_cutscene`: ниже, чем в `volodka_room` геймплее (**0.96**),
 * иначе при близкой кинокамере силуэт всё равно доминирует кадр.
 */
export const INTRO_OPENING_PLAYER_GLTF_TARGET_METERS = 0.74;

/**
 * Дополнительный множитель к `explorationPlayerGlbVisualUniformMultiplier` только на фазе `intro_cutscene`
 * (после bbox и целевой высоты выше).
 */
export const INTRO_OPENING_PLAYER_GLB_VISUAL_UNIFORM_EXTRA_MULTIPLIER = 0.5;

/** Сцена до финала 3D-интро (комната Володьки). */
export const INTRO_OPENING_SCENE_ID: SceneId = 'volodka_room';

/** Финал: квартира Заремы и Альберта (3-й этаж). */
export const INTRO_OPENING_END_SCENE_ID: SceneId = 'zarema_albert_room';

/** Старт за столом, лицом к мониторам (+X). */
export const INTRO_OPENING_DESK_CHAIR: PlayerPosition = {
  x: 2.05,
  y: PLAYER_FEET_SPAWN_Y,
  z: 0.26,
  rotation: -0.92,
};

/** После интро — у порога «гостевой», смотрим вглубь комнаты к NPC. */
export const INTRO_OPENING_ZAREMA_SPAWN: PlayerPosition = {
  x: 0,
  y: PLAYER_FEET_SPAWN_Y,
  z: 1.35,
  rotation: 0,
};

export type IntroOpeningKeyframe = {
  tSec: number;
  cam: [number, number, number];
  look: [number, number, number];
  /**
   * Подпись с этого момента до следующего кадра, где поле задано.
   * `undefined` — не менять текущую; `''` — скрыть.
   */
  caption?: string;
};

/** Ключевые точки пути игрока (только поза); интерполяция линейная по времени между соседними `tSec`. */
export type IntroPlayerPathKeyframe = {
  tSec: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
};

export const INTRO_PLAYER_PATH_KEYFRAMES: IntroPlayerPathKeyframe[] = [
  { tSec: 0, ...INTRO_OPENING_DESK_CHAIR },
  { tSec: 2.4, x: 2.08, y: PLAYER_FEET_SPAWN_Y, z: 0.55, rotation: -0.45 },
  { tSec: 4.8, x: 2.04, y: PLAYER_FEET_SPAWN_Y, z: 0.95, rotation: 0.08 },
  { tSec: 7.2, x: 1.72, y: PLAYER_FEET_SPAWN_Y, z: 1.72, rotation: 0.42 },
  { tSec: 9.2, x: 1.05, y: PLAYER_FEET_SPAWN_Y, z: 2.45, rotation: Math.PI * 0.55 },
  { tSec: 10.6, x: 0.52, y: PLAYER_FEET_SPAWN_Y, z: 2.92, rotation: Math.PI * 0.88 },
  { tSec: 11, x: 0.35, y: PLAYER_FEET_SPAWN_Y, z: 3.15, rotation: Math.PI },
];

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function lerpAngle(a: number, b: number, u: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * u;
}

/**
 * Сглаженная поза игрока на таймлайне интро (м/с по XZ в `horizontalSpeed` для анимации шага).
 */
export function sampleIntroPlayerPose(elapsedSec: number): { pose: PlayerPosition; horizontalSpeed: number } {
  const kf = INTRO_PLAYER_PATH_KEYFRAMES;
  if (elapsedSec <= kf[0].tSec) {
    const p = kf[0];
    return {
      pose: { x: p.x, y: p.y, z: p.z, rotation: p.rotation },
      horizontalSpeed: 0,
    };
  }
  if (elapsedSec >= kf[kf.length - 1].tSec) {
    const p = kf[kf.length - 1];
    return {
      pose: { x: p.x, y: p.y, z: p.z, rotation: p.rotation },
      horizontalSpeed: 0,
    };
  }
  let i = 0;
  while (i < kf.length - 1 && kf[i + 1].tSec < elapsedSec) i += 1;
  const a = kf[i];
  const b = kf[i + 1];
  const span = Math.max(1e-4, b.tSec - a.tSec);
  const uLinear = THREE.MathUtils.clamp((elapsedSec - a.tSec) / span, 0, 1);
  const u = smoothBlend01(uLinear);
  const x = THREE.MathUtils.lerp(a.x, b.x, u);
  const y = THREE.MathUtils.lerp(a.y, b.y, u);
  const z = THREE.MathUtils.lerp(a.z, b.z, u);
  const rotation = lerpAngle(a.rotation, b.rotation, u);

  tmpA.set(a.x, 0, a.z);
  tmpB.set(b.x, 0, b.z);
  const horizontalSpeed = tmpA.distanceTo(tmpB) / span;

  return { pose: { x, y, z, rotation }, horizontalSpeed };
}

/**
 * Ключевые кадры камеры (мировые координаты `volodka_room`) + подписи.
 * Интерполяция — линейная между соседними `tSec` (`IntroCutsceneCinematicDirector`).
 */
export const INTRO_OPENING_CAM_KEYFRAMES: IntroOpeningKeyframe[] = [
  {
    tSec: 0,
    cam: [1.62, 1.48, 2.38],
    look: [3.18, 0.98, 0.06],
    caption: 'Десятый этаж. Два монитора — два котла.',
  },
  {
    tSec: 3.8,
    cam: [2.15, 1.58, 1.72],
    look: [3.05, 1.02, -0.15],
    caption: 'Встать. Кофе остынет быстрее, чем ретро-инцидент.',
  },
  {
    tSec: 6.6,
    cam: [3.35, 1.42, 1.05],
    look: [2.0, 1.08, 0.95],
    caption: 'Шаг к двери. Руки помнят раскладку — ноги вспоминают медленнее.',
  },
  {
    tSec: 9.4,
    cam: [3.85, 1.52, 2.15],
    look: [0.45, 1.02, 3.15],
    caption: 'К лифту. Дальше — только вниз.',
  },
  {
    tSec: 10.85,
    cam: [3.98, 1.5, 2.72],
    look: [0.12, 1.02, 3.48],
    caption: '',
  },
  {
    tSec: 11,
    cam: [4.05, 1.48, 2.85],
    look: [0.05, 1.0, 3.55],
  },
];

/** Оверлей лифта: включается после этого времени (сек). */
export const INTRO_ELEVATOR_OVERLAY_START_SEC = 11.05;
/** Скрыть оверлей, подготовка к телепорту. */
export const INTRO_ELEVATOR_OVERLAY_END_SEC = 14.35;
/** Телепорт в квартиру Заремы и завершение кат-сцены. */
export const INTRO_OPENING_FINISH_SEC = 14.85;
