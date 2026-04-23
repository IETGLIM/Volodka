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
 * Единый множитель визуала GLB игрока и NPC в 3D-обходе (включая интро: тот же `PhysicsPlayer` / цепочка NPC).
 * Применяется к уже рассчитанному uniform после `applyExplorationPlayerGlbVisualUniformMultiplier`.
 */
export const EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE = 1 / 5;

/**
 * Финальный uniform визуала: глобальное уменьшение/увеличение сцены с reclamp в допустимый диапазон.
 */
export function applyExplorationPlayerGlobalVisualScale(uniform: number): number {
  const g = EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE;
  const factor = Number.isFinite(g) && g > 0 ? g : 1;
  if (!Number.isFinite(uniform) || uniform <= 0) return PLAYER_GLB_VISUAL_UNIFORM_MIN;
  const u = uniform * factor;
  if (u < PLAYER_GLB_VISUAL_UNIFORM_MIN) return PLAYER_GLB_VISUAL_UNIFORM_MIN;
  if (u > PLAYER_GLB_VISUAL_UNIFORM_MAX) return PLAYER_GLB_VISUAL_UNIFORM_MAX;
  return u;
}

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

/**
 * После расчёта по bbox — множитель из `SCENE_CONFIG.explorationPlayerGlbVisualUniformMultiplier` (явное «сделай меньше в кадре»).
 */
export function applyExplorationPlayerGlbVisualUniformMultiplier(
  baseUniform: number,
  multiplier: number | undefined,
): number {
  const m =
    multiplier != null && Number.isFinite(multiplier) && multiplier > 0 ? Math.min(2.5, Math.max(0.12, multiplier)) : 1;
  const u = baseUniform * m;
  if (u < PLAYER_GLB_VISUAL_UNIFORM_MIN) return PLAYER_GLB_VISUAL_UNIFORM_MIN;
  if (u > PLAYER_GLB_VISUAL_UNIFORM_MAX) return PLAYER_GLB_VISUAL_UNIFORM_MAX;
  return u;
}
