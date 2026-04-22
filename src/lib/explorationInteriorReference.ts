/**
 * Эталонные размеры интерьера в **метрах сцены** (R3F / Rapier).
 * Согласовать: процедурный визуал, `SCENE_CONFIG.interactiveObjects`, коллайдеры проёмов.
 *
 * Дверь межкомнатная: ~2.0–2.1 м по СНиП/типовым сериям; в игре чуть выше проёма коллайдера (~1.0 m),
 * чтобы кадр читался как «нормальная» дверь, а не низкая щель.
 */
export const INTERIOR_REF_DOOR_HEIGHT_M = 2.06;
export const INTERIOR_REF_DOOR_WIDTH_M = 0.92;

/** Центр двери по Y при полу y≈0 (нижний край пола визуала ~0). */
export function interiorDoorCenterYFromFloor(floorY = 0): number {
  return floorY + INTERIOR_REF_DOOR_HEIGHT_M / 2 + 0.02;
}
