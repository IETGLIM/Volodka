/**
 * Ранний прогрев WASM Rapier (LCP): пока пользователь на меню/лоадере, инициализация уходит в фон,
 * к моменту входа в обход `Physics` не ждёт холодный старт модуля.
 */
let rapierWarmupPromise: Promise<void> | null = null;

export function warmupRapierWasm(): Promise<void> {
  if (rapierWarmupPromise) return rapierWarmupPromise;
  rapierWarmupPromise = import('@dimforge/rapier3d-compat')
    .then(async (RAPIER) => {
      // wasm-bindgen ожидает объект; типы `@dimforge/rapier3d-compat` пока без перегрузки (см. rapier.js#341).
      await (RAPIER as { init: (config?: object) => Promise<void> }).init({});
    })
    .catch((error: unknown) => {
      console.error('[rapierWasmWarmup] Rapier WASM warmup failed:', error);
      rapierWarmupPromise = null;
    });
  return rapierWarmupPromise;
}
