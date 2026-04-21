/**
 * Целевая высота визуала Володьки в метрах сцены **до** множителя комнаты `explorationCharacterModelScale`,
 * если в `SCENE_CONFIG` не задано переопределение `explorationPlayerGltfTargetMeters` (см. `getExplorationPlayerGltfTargetMeters`).
 * GLB: `uniformScale = (targetMeters / bboxY) * roomScale` (`PhysicsPlayer` → `GLBPlayerModel`).
 */
/** Целевая высота визуала в метрах сцены (чуть ниже реального 170 см — комнаты узкие, камера ближе). */
export const PLAYER_GLB_TARGET_VISUAL_METERS = 1.38;

/** Высота по умолчанию для спавна: «ноги» капсулы на полу (верх пола ≈ 0). */
export const PLAYER_FEET_SPAWN_Y = 0.06;
