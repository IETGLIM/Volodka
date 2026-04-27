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

/**
 * Низкочастотная EMA дистанции до сравнения с порогами гистерезиса.
 * Убирает «дрожание» сэмпла, когда игрок стоит на границе зоны.
 */
export const NPC_LOD_DISTANCE_SMOOTH_LAMBDA = 10;

export function smoothNpcLodDistanceForHysteresis(
  previous: number | null,
  rawDistanceXZ: number,
  delta: number,
): { value: number; store: number } {
  if (previous == null || !Number.isFinite(previous)) {
    return { value: rawDistanceXZ, store: rawDistanceXZ };
  }
  const dt = Math.max(0, delta);
  const a = 1 - Math.exp(-NPC_LOD_DISTANCE_SMOOTH_LAMBDA * dt);
  const store = previous + a * (rawDistanceXZ - previous);
  return { value: store, store };
}

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
