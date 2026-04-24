/**
 * Стабильные ключи архетипов (SoA-таблицы). Расширяйте по мере новых наборов колонок.
 * Имена — часть контракта сохранений/replay; не переименовывать без миграции.
 */
export const SIM_ARCHETYPE_MV_HEALTH = 'sim_mv_health' as const;

export type SimArchetypeKey = typeof SIM_ARCHETYPE_MV_HEALTH;
