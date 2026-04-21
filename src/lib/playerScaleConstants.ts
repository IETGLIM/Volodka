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
 * Минимальный / максимальный uniform scale визуала игрока (как clamp у NPC в `NPC.tsx`):
 * заниженный bbox SkinnedMesh даёт большой raw — ограничиваем сверху, **не** подменяя делитель константой
 * (пол в делителе завышал модель там, где bbox уже был корректным ~0.6–0.8 м).
 */
export const PLAYER_GLB_VISUAL_UNIFORM_MIN = 0.045;
/** Верхний clamp: заниженный bbox SkinnedMesh иначе даёт raw 2+ и «ботинок на весь экран» (см. Vercel / volodka_room). */
export const PLAYER_GLB_VISUAL_UNIFORM_MAX = 0.92;

/**
 * Единая формула uniform для GLB игрока в обходе (метры сцены).
 */
export function computeExplorationPlayerGlbUniformFromBBox(
  bboxHeightMeters: number,
  targetVisualMeters: number,
  roomScale: number,
): number {
  const rsSafe = Number.isFinite(roomScale) ? Math.max(0.28, Math.min(1.25, roomScale)) : 1;
  if (!Number.isFinite(bboxHeightMeters) || !Number.isFinite(targetVisualMeters) || !Number.isFinite(roomScale)) {
    return 0.12 * rsSafe;
  }
  const h = Math.max(bboxHeightMeters, 1e-4);
  const raw = (targetVisualMeters / h) * roomScale;
  if (raw < PLAYER_GLB_VISUAL_UNIFORM_MIN) return PLAYER_GLB_VISUAL_UNIFORM_MIN;
  if (raw > PLAYER_GLB_VISUAL_UNIFORM_MAX) return PLAYER_GLB_VISUAL_UNIFORM_MAX;
  return raw;
}
