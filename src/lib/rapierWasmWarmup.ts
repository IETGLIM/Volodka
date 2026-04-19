/**
 * Ранний прогрев WASM Rapier (LCP): пока пользователь на меню/лоадере, инициализация уходит в фон,
 * к моменту входа в обход `Physics` не ждёт холодный старт модуля.
 */
let rapierWarmupPromise: Promise<void> | null = null;

export function warmupRapierWasm(): Promise<void> {
  if (rapierWarmupPromise) return rapierWarmupPromise;
  rapierWarmupPromise = import('@dimforge/rapier3d-compat')
    .then(async (RAPIER) => {
      await RAPIER.init();
    })
    .catch(() => {
      rapierWarmupPromise = null;
    });
  return rapierWarmupPromise;
}
