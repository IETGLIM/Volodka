/**
 * Шаг 6 / Г (мерцание теней / «плывёт» персонаж): слишком маленькая **shadow-mapSize** даёт шумную карту;
 * **shadow-bias** / **normalBias** подбираются под персонажей и пол.
 */

/** Полный размер на десктопе (не narrow и не visualLite). Шаг Г: 2048. */
export const EXPLORATION_SHADOW_MAP_DESKTOP = 2048;

/** Узкий экран или `visualLite`: шаг Г — 1024 (компромисс с FPS; десктоп 2048). */
export const EXPLORATION_SHADOW_MAP_MOBILE_LITE = 1024;

export function getExplorationDirectionalShadowMapSize(narrow: boolean, visualLite: boolean): number {
  return narrow || visualLite ? EXPLORATION_SHADOW_MAP_MOBILE_LITE : EXPLORATION_SHADOW_MAP_DESKTOP;
}

/**
 * Отрицательный bias слегка отодвигает тень от поверхности (меньше shadow acne).
 * Шаг Г: −0.0005; при peter-panning можно ослабить (например −0.00025).
 */
export const EXPLORATION_DIRECTIONAL_SHADOW_BIAS = -0.0005;

/** Шаг Г: 0.02 — меньше «ползания» по касательной при крупной карте теней. */
export const EXPLORATION_DIRECTIONAL_SHADOW_NORMAL_BIAS = 0.02;

/** `OptimizedSceneEnvironment`: directional с тенями — тот же порядок размера, что и обход (шаг Г). */
export const SCENE_ENVIRONMENT_SHADOW_MAP_SIZE = 2048;
