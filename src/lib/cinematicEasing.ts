/**
 * Сглаживание таймлайнов кат-сцен и UI: без сторонних зависимостей от Three.js.
 */

/** Smoothstep 0..1 → 0..1 (Hermite). */
export function smoothstep01(u: number): number {
  const t = Math.min(1, Math.max(0, u));
  return t * t * (3 - 2 * t);
}

/** Умеренное «вхождение / выход» сегмента (мягче линейного в середине). */
export function smoothBlend01(u: number): number {
  return smoothstep01(smoothstep01(u));
}
