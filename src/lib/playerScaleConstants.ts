/**
 * Целевая высота визуала Володьки в метрах сцены **до** множителя комнаты `explorationCharacterModelScale`,
 * если в `SCENE_CONFIG` не задано переопределение `explorationPlayerGltfTargetMeters` (см. `getExplorationPlayerGltfTargetMeters`).
 * Итоговый uniform: `computeExplorationPlayerGlbUniformFromBBox` (`PhysicsPlayer` → `GLBPlayerModel`).
 */
/** Целевая высота визуала в метрах сцены (чуть ниже реального 170 см — комнаты узкие, камера ближе). */
export const PLAYER_GLB_TARGET_VISUAL_METERS = 1.38;

/** Высота по умолчанию для спавна: «ноги» капсулы на полу (верх пола ≈ 0). */
export const PLAYER_FEET_SPAWN_Y = 0.06;

/**
 * Нижняя граница высоты bbox в делителе: SkinnedMesh в bind pose часто даёт заниженную коробку (≈0.55–0.75 м),
 * из‑за чего `(target / h) * roomScale` раздувает модель до «колосса». См. clamp у NPC в `NPC.tsx`.
 */
export const PLAYER_GLTF_BOUNDING_HEIGHT_FLOOR_M = 0.92;

/** Минимальный / максимальный uniform scale визуала игрока (защита от битого bbox и от артефактов). */
export const PLAYER_GLB_VISUAL_UNIFORM_MIN = 0.045;
export const PLAYER_GLB_VISUAL_UNIFORM_MAX = 1.62;

/**
 * Единая формула uniform для GLB игрока в обходе (метры сцены).
 */
export function computeExplorationPlayerGlbUniformFromBBox(
  bboxHeightMeters: number,
  targetVisualMeters: number,
  roomScale: number,
): number {
  const h = Math.max(bboxHeightMeters, PLAYER_GLTF_BOUNDING_HEIGHT_FLOOR_M);
  const raw = (targetVisualMeters / h) * roomScale;
  if (raw < PLAYER_GLB_VISUAL_UNIFORM_MIN) return PLAYER_GLB_VISUAL_UNIFORM_MIN;
  if (raw > PLAYER_GLB_VISUAL_UNIFORM_MAX) return PLAYER_GLB_VISUAL_UNIFORM_MAX;
  return raw;
}
