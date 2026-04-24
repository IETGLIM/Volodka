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

/** Высота столешницы письменного стола от пола (м) — типовой диапазон 0.72–0.76. */
export const INTERIOR_REF_DESK_SURFACE_Y_M = 0.75;

/** Толщина визуального столешницы в `VolodkaRoomVisual` (м). */
export const INTERIOR_REF_DESK_TOP_THICKNESS_VISUAL_M = 0.08;

/** Центр группы главного/бокового стола в визуале: столешница касается `INTERIOR_REF_DESK_SURFACE_Y_M`. */
export function interiorDeskVisualGroupCenterY(floorY = 0): number {
  return floorY + INTERIOR_REF_DESK_SURFACE_Y_M - INTERIOR_REF_DESK_TOP_THICKNESS_VISUAL_M / 2;
}

/** Центр по Y для `interactiveObjects` / Rapier с толщиной столешницы `topThicknessM`. */
export function interiorDeskColliderCenterY(topThicknessM: number, floorY = 0): number {
  const t =
    Number.isFinite(topThicknessM) && topThicknessM > 0 ? Math.min(0.14, topThicknessM) : 0.06;
  return floorY + INTERIOR_REF_DESK_SURFACE_Y_M - t / 2;
}

/** Высота типового шкафа в комнате (м), укладывается в потолок ~2.85. */
export const INTERIOR_REF_WARDROBE_HEIGHT_M = 2.0;

/** Центр шкафа по Y (стоит на полу). */
export function interiorWardrobeCenterYFromFloor(floorY = 0): number {
  return floorY + INTERIOR_REF_WARDROBE_HEIGHT_M / 2 + 0.02;
}

/** Высота сиденья стула от пола (м) — типовой диапазон 0.42–0.48 (визуал / интерактивы). */
export const INTERIOR_REF_CHAIR_SEAT_SURFACE_Y_M = 0.45;

/** Типовая высота оконного проёма (м) — визуал «окно» в `ZaremaAlbertExplorationVisual` и проверка читаемости. */
export const INTERIOR_REF_WINDOW_HEIGHT_M = 1.35;

/** Ширина оконного блока в узкой гостиной (м). */
export const INTERIOR_REF_WINDOW_WIDTH_M = 3.2;

/** Низкий журнальный стол / тумба под ТВ в гостиной (м) — ниже письменного. */
export const INTERIOR_REF_COFFEE_TABLE_SURFACE_Y_M = 0.52;

/**
 * Минимальный габарит **CuboidCollider** у вертикальных стен (`PhysicsWall`):
 * тоньше 0.1–0.12 м капсула игрока может «просочиться» в углах Rapier.
 */
export const INTERIOR_PHYSICS_COLLIDER_WALL_MIN_EXTENT_M = 0.12;

export function interiorCoffeeTableGroupCenterY(floorY = 0): number {
  const topT = 0.08;
  return floorY + INTERIOR_REF_COFFEE_TABLE_SURFACE_Y_M - topT / 2;
}

/** Центр группы дивана (низкая посадка ~0.42 м к подушке). */
export const INTERIOR_REF_SOFA_GROUP_CENTER_Y_M = 0.48;

/** Диван/тахта в узкой гостиной (квартира Заремы) — чуть ниже письменного стола. */
export const INTERIOR_REF_COMPACT_SOFA_GROUP_CENTER_Y_M = 0.41;
