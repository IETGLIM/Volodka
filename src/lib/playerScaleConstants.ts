/**
 * Глобальный множитель визуала GLB в обходе (÷5) и допустимый диапазон uniform после него.
 * Конкретный базовый uniform по файлу — `src/data/modelMeta.ts` (`resolveCharacterMeshUniformScale`).
 */

/** Высота по умолчанию для спавна: «ноги» капсулы на полу (верх пола ≈ 0). */
export const PLAYER_FEET_SPAWN_Y = 0.06;

export const PLAYER_GLB_VISUAL_UNIFORM_MIN = 0.045;
export const PLAYER_GLB_VISUAL_UNIFORM_MAX = 0.92;

/** Единый множитель визуала GLB игрока и NPC в 3D-обходе. */
export const EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE = 1 / 5;

export function applyExplorationPlayerGlobalVisualScale(uniform: number): number {
  const g = EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE;
  const factor = Number.isFinite(g) && g > 0 ? g : 1;
  if (!Number.isFinite(uniform) || uniform <= 0) return PLAYER_GLB_VISUAL_UNIFORM_MIN;
  const u = uniform * factor;
  if (u < PLAYER_GLB_VISUAL_UNIFORM_MIN) return PLAYER_GLB_VISUAL_UNIFORM_MIN;
  if (u > PLAYER_GLB_VISUAL_UNIFORM_MAX) return PLAYER_GLB_VISUAL_UNIFORM_MAX;
  return u;
}
