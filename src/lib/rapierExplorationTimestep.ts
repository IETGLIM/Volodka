/**
 * Фиксированный шаг Rapier для обхода (`RPGGameCanvas`).
 * Больше `timeStep` → реже `world.step` при том же FPS рендера → дешевле CPU на слабых устройствах
 * (цена — грубее коллизии; визу сглаживает `interpolate` у `<Physics>`).
 */
export const RAPIER_EXPLORATION_TIMESTEP_DEFAULT = 1 / 60;

/** С `useMobileVisualPerf` / visualLite: ~30 Гц симуляции вместо 60. */
export const RAPIER_EXPLORATION_TIMESTEP_VISUAL_LITE = 1 / 30;
