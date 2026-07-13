/**
 * Canonical poem counts for golden-path endings, achievements, and dialogue gates.
 *
 * Structure:
 * - poem_1  – poem_21  : Основные стихи Владимира (сюжет, концовка «Поэт», достижения)
 * - poem_22 – poem_35  : Расширенные стихи (бонусный сбор)
 * - poem_tolpa, poem_act6_*, poem_act7_* : Скрытые / актовые фрагменты (100% completion)
 *
 * Must stay in sync with UNIFIED_POEM_REGISTRY — enforced in contentPipelineValidator.
 * Dependency-free so goldenPath / chk dialogues never pull the poems chunk.
 */

/** Стихотворения Владимира, необходимые для сюжета (poem_1 – poem_21). */
export const TOTAL_MAIN_POEMS = 21;

/** По актам — для прогресс-трекинга в журнале и подсказках. */
export const POEMS_PER_ACT: Readonly<Record<number, number>> = {
  1: 6,
  2: 5,
  3: 4,
  4: 3,
  5: 2,
  6: 0,
  7: 1,
};

export const MAIN_POEM_IDS = Array.from(
  { length: TOTAL_MAIN_POEMS },
  (_, i) => `poem_${i + 1}`,
) as readonly string[];

const NUMBERED_BONUS_POEM_IDS = Array.from(
  { length: 14 },
  (_, i) => `poem_${TOTAL_MAIN_POEMS + i + 1}`,
) as readonly string[];

/** Скрытые / бонусные ID вне основной дуги poem_1–poem_21. */
export const SPECIAL_BONUS_POEM_IDS = [
  'poem_tolpa',
  'poem_act6_01',
  'poem_act6_02',
  'poem_act6_03',
  'poem_act6_04',
  'poem_act6_05',
  'poem_act6_06',
  'poem_act6_07',
  'poem_act6_08',
  'poem_act7_01',
  'poem_act7_ending',
] as const;

/**
 * Poems that were previously without collectPoem / quest wiring.
 * All post-launch poems have now been wired into story nodes and quest systems.
 * Kept as an empty array for backwards compatibility with imports.
 */
export const POST_LAUNCH_POEM_IDS = [] as const satisfies readonly string[];

export const HIDDEN_POEM_IDS = [
  ...NUMBERED_BONUS_POEM_IDS,
  ...SPECIAL_BONUS_POEM_IDS,
] as readonly string[];

/** Скрытые/бонусные стихи (всё после основной дуги). */
export const TOTAL_HIDDEN_POEMS = HIDDEN_POEM_IDS.length;

/** Все стихотворения в UNIFIED_POEM_REGISTRY (основные + бонусные). */
export const TOTAL_UNIFIED_POEMS = TOTAL_MAIN_POEMS + TOTAL_HIDDEN_POEMS;

export const ALL_UNIFIED_POEM_IDS = [
  ...MAIN_POEM_IDS,
  ...HIDDEN_POEM_IDS,
] as readonly string[];

export function isMainPoemId(poemId: string): boolean {
  const match = /^poem_(\d+)$/.exec(poemId);
  if (!match) return false;
  const order = Number(match[1]);
  return order >= 1 && order <= TOTAL_MAIN_POEMS;
}

export function countCollectedMainPoems(collected: readonly string[]): number {
  return MAIN_POEM_IDS.filter((id) => collected.includes(id)).length;
}

export function countCollectedHiddenPoems(collected: readonly string[]): number {
  return HIDDEN_POEM_IDS.filter((id) => collected.includes(id)).length;
}

export function countCollectedUnifiedPoems(collected: readonly string[]): number {
  return ALL_UNIFIED_POEM_IDS.filter((id) => collected.includes(id)).length;
}

/** Все 21 сюжетных стиха Владимира собраны — для ending_poet и all_poems_collected. */
export function hasAllMainPoems(collected: readonly string[]): boolean {
  return countCollectedMainPoems(collected) === TOTAL_MAIN_POEMS;
}

/** 100% completion — все записи UNIFIED_POEM_REGISTRY. */
export function hasAllUnifiedPoems(collected: readonly string[]): boolean {
  return ALL_UNIFIED_POEM_IDS.every((id) => collected.includes(id));
}

if (import.meta.env?.DEV) {
  console.assert(
    TOTAL_MAIN_POEMS + TOTAL_HIDDEN_POEMS === TOTAL_UNIFIED_POEMS,
    'poemCollectionMeta: MAIN + HIDDEN !== UNIFIED',
  );
  console.assert(
    Object.values(POEMS_PER_ACT).reduce((sum, count) => sum + count, 0) === TOTAL_MAIN_POEMS,
    'poemCollectionMeta: POEMS_PER_ACT sum !== TOTAL_MAIN_POEMS',
  );
  console.assert(
    ALL_UNIFIED_POEM_IDS.length === TOTAL_UNIFIED_POEMS,
    'poemCollectionMeta: ALL_UNIFIED_POEM_IDS length mismatch',
  );
}
