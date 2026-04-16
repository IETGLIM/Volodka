/**
 * Единая конфигурация энергии сюжета (стоимость выборов, максимум, восстановление).
 * Поднятый потолок и пассивная регенерация дают время опробовать квесты, фракции и терминал.
 */

export const MAX_PLAYER_ENERGY = 24;

export const INITIAL_PLAYER_ENERGY = MAX_PLAYER_ENERGY;

export const ENERGY_COSTS = {
  choice: 1,
  skillCheck: 2,
  poemGame: 1,
  dialogue: 0,
} as const;

/** Восстановление на узлах со «sleep» в id */
export const SLEEP_ENERGY_REGEN = 6;

/** Пассивно +энергия раз в интервал, пока ниже максимума (игрок не застревает) */
export const PASSIVE_ENERGY_REGEN_MS = 72_000;
export const PASSIVE_ENERGY_AMOUNT = 1;
