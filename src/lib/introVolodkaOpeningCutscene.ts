import type { SceneId } from '@/data/types';
import type { PlayerPosition } from '@/data/rpgTypes';
import * as THREE from 'three';
import { PLAYER_FEET_SPAWN_Y } from '@/lib/playerScaleConstants';
import { smoothBlend01 } from '@/lib/cinematicEasing';

/**
 * Целевая высота GLB (м сцены) в `intro_cutscene`: ниже, чем в `volodka_room` геймплее,
 * иначе при близкой кинокамере силуэт всё равно доминирует кадр (лифт / стол — маленькая площадка в кадре).
 */
export const INTRO_OPENING_PLAYER_GLTF_TARGET_METERS = 0.085;

/**
 * Дополнительный множитель к `explorationPlayerGlbVisualUniformMultiplier` только на фазе `intro_cutscene`
 * (после bbox и целевой высоты выше). Держим сильно ниже геймплея — иначе фигура перекрывает «площадку» интро.
 */
/** Доп. ужатие на интро-камере (TPS + киношный dolly); с глобальным `EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE` не дублировать прежние 0.2+0.2 без нужды. */
export const INTRO_OPENING_PLAYER_GLB_VISUAL_UNIFORM_EXTRA_MULTIPLIER = 0.02;

/**
 * Финальный потолок uniform GLB **только** на фазе `intro_cutscene` (`PhysicsPlayer` → `GLBPlayerModel`).
 * Кинокамера ближе, чем TPS в геймплее; без этого при сбое bbox/кэша снова «макро на ноги».
 * Ниже геймплея `volodka_room` (**0.14** после `clampExplorationHumanoidGlbUniformForScene`).
 */
export const INTRO_OPENING_GLTF_VISUAL_UNIFORM_HARD_MAX = 0.055;

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
    /** Чуть дальше и выше стола — кинокамера не лезет под силуэт при 60° FOV. */
    cam: [1.38, 1.62, 2.58],
    look: [3.05, 1.12, 0.18],
    caption: 'Десятый этаж. Два монитора — два котла.',
  },
  {
    tSec: 3.8,
    cam: [2.62, 1.78, 1.52],
    look: [2.92, 1.22, -0.02],
    caption: 'Встать. Кофе остынет быстрее, чем ретро-инцидент.',
  },
  {
    tSec: 6.6,
    /** Кадр «Шаг к двери»: раньше камера была ~2.4 м от трассы — доминировали голени; отодвигаем по +X / −Z, look выше. */
    cam: [4.55, 1.9, 0.38],
    look: [1.72, 1.62, 1.38],
    caption: 'Шаг к двери. Руки помнят раскладку — ноги вспоминают медленнее.',
  },
  {
    tSec: 9.4,
    /** Дальше от траектории игрока, чуть выше — иначе при 60° FOV кадр «съедают» голени (макро на ноги). */
    cam: [5.35, 2.12, 1.32],
    look: [0.58, 1.32, 3.1],
    caption: 'К лифту. Дальше — только вниз.',
  },
  {
    tSec: 10.85,
    cam: [5.28, 2.0, 2.22],
    look: [0.22, 1.2, 3.38],
    caption: '',
  },
  {
    tSec: 11,
    cam: [5.35, 1.98, 2.32],
    look: [0.12, 1.18, 3.45],
  },
];

/** Оверлей лифта: включается после этого времени (сек). */
export const INTRO_ELEVATOR_OVERLAY_START_SEC = 11.05;
/** Скрыть оверлей, подготовка к телепорту. */
export const INTRO_ELEVATOR_OVERLAY_END_SEC = 14.35;
/** Телепорт в квартиру Заремы и завершение кат-сцены. */
export const INTRO_OPENING_FINISH_SEC = 14.85;
