import type { SceneId } from '@/data/types';
import type { PlayerPosition } from '@/data/rpgTypes';
import { PLAYER_FEET_SPAWN_Y } from '@/lib/playerScaleConstants';

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
  /** Телепорт персонажа в этот момент времени (один раз на ключ). */
  player?: PlayerPosition;
};

/**
 * Ключевые кадры камеры (мировые координаты `volodka_room`) + подписи + телепорты по пути к лифту.
 * Интерполяция — линейная между соседними `tSec`.
 */
export const INTRO_OPENING_CAM_KEYFRAMES: IntroOpeningKeyframe[] = [
  {
    tSec: 0,
    cam: [1.62, 1.48, 2.38],
    look: [3.18, 0.98, 0.06],
    caption: 'Десятый этаж. Два монитора — два котла.',
    player: INTRO_OPENING_DESK_CHAIR,
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
    player: { x: 2.02, y: PLAYER_FEET_SPAWN_Y, z: 1.22, rotation: 0.12 },
  },
  {
    tSec: 9.4,
    cam: [3.85, 1.52, 2.15],
    look: [0.45, 1.02, 3.15],
    caption: 'К лифту. Дальше — только вниз.',
    player: { x: 1.15, y: PLAYER_FEET_SPAWN_Y, z: 2.55, rotation: Math.PI * 0.92 },
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
    player: { x: 0.35, y: PLAYER_FEET_SPAWN_Y, z: 3.15, rotation: Math.PI },
  },
];

/** Оверлей лифта: включается после этого времени (сек). */
export const INTRO_ELEVATOR_OVERLAY_START_SEC = 11.05;
/** Скрыть оверлей, подготовка к телепорту. */
export const INTRO_ELEVATOR_OVERLAY_END_SEC = 14.35;
/** Телепорт в квартиру Заремы и завершение кат-сцены. */
export const INTRO_OPENING_FINISH_SEC = 14.85;
