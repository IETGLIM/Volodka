/**
 * Шаг 6 (мерцание теней / «плывёт» персонаж): слишком маленькая **shadow-mapSize** даёт шумную карту;
 * **shadow-bias** / **normalBias** подбираются под персонажей и пол.
 */

/** Полный размер на десктопе (не narrow и не visualLite). */
export const EXPLORATION_SHADOW_MAP_DESKTOP = 1024;

/** Узкий экран или `visualLite`: раньше было 256 — сильное «плавание»; 512 — компромисс с FPS. */
export const EXPLORATION_SHADOW_MAP_MOBILE_LITE = 512;

export function getExplorationDirectionalShadowMapSize(narrow: boolean, visualLite: boolean): number {
  return narrow || visualLite ? EXPLORATION_SHADOW_MAP_MOBILE_LITE : EXPLORATION_SHADOW_MAP_DESKTOP;
}

/**
 * Отрицательный bias слегка отодвигает тень от поверхности (меньше полос / acne на лице и мелких деталях).
 * При появлении peter-panning можно чуть уменьшить по модулю (например -0.00015).
 */
export const EXPLORATION_DIRECTIONAL_SHADOW_BIAS = -0.00025;

/** Подмешивание нормали — стабильнее контакт тени с капсулой/скином при низком bias. */
export const EXPLORATION_DIRECTIONAL_SHADOW_NORMAL_BIAS = 0.045;

/** `OptimizedSceneEnvironment`: один directional, без ветки mobile в этом файле — фиксированный разумный размер. */
export const SCENE_ENVIRONMENT_SHADOW_MAP_SIZE = 1536;
