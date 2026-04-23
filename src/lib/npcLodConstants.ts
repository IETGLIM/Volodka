/**
 * Шаг 5 (мерцание LOD): один порог «вкл/выкл» на границе даёт дрожание при колебании дистанции.
 * Два порога — **гистерезис**: из полной модели выходим дальше, чем заходим обратно из импостора.
 *
 * Все расстояния — **XZ** от игрока до точки NPC (как в `NPC` `useFrame`).
 */

/** Уже полный GLB: переключение на импостор только если дистанция **≥** этого (м). */
export const NPC_LOD_FULL_TO_IMPOSTOR_M = 19;

/** Уже импостор: полный GLB только если дистанция **<** этого (м) — ближе, чем порог выхода. */
export const NPC_LOD_IMPOSTOR_TO_FULL_M = 11;

export function resolveNpcModelLodUseFull(options: {
  wasFull: boolean;
  distanceXZ: number;
  /** Диалог или нет пути к GLB — всегда полная/болванка без LOD-импостора. */
  forceFull: boolean;
}): boolean {
  const { wasFull, distanceXZ: d, forceFull } = options;
  if (forceFull) return true;
  if (wasFull) return d < NPC_LOD_FULL_TO_IMPOSTOR_M;
  return d < NPC_LOD_IMPOSTOR_TO_FULL_M;
}
