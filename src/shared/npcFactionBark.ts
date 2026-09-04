/* ─── Volodka RPG – фракционные реплики при приближении (v4.8.7) ───
 *
 * Чистый модуль shared-слоя (без импортов движка и стора — граница eslint):
 * короткие «барки» NPC, отражающие уровень отношения ФРАКЦИИ к игроку.
 * Продолжение фракционной линии v4.8.5–v4.8.6 (цены торговцев → чип в
 * диалоге → реплики в мире).
 *
 * Дизайн шума: реплики только для сильных уровней (ally/hostile) — как
 * FACTION_ATTITUDE_LINES в диалоге, иначе барка повторялась бы у каждого
 * второго NPC и превращалась в спам. Подход обычных барок не трогаем:
 * фракционная реплика подмешивается с вероятностью, а не всегда.
 */

import type { FactionAttitudeTier } from '@/shared/npcFactionAttitude';

/** Вероятность фракционной барки за подход (вместо обычной барки). */
export const NPC_FACTION_BARK_CHANCE: Partial<Record<FactionAttitudeTier, number>> = {
  ally: 0.45,
  hostile: 0.6,
};

/** Шаблоны барок. «%f» заменяется на русскую метку фракции («Сеть», «Толпа»). */
const FACTION_BARK_TEMPLATES: Partial<
  Record<FactionAttitudeTier, readonly string[]>
> = {
  ally: [
    'О, своих встречаем. «%f» не забывает своих.',
    'Слышали о вас хорошего — «%f» за вас.',
    'Проходи, «%f» тебя узнала.',
    'Держись, с репутацией «%f» тут жить можно.',
    'Рады видеть. «%f» вас не подведёт.',
  ],
  hostile: [
    'Опять «%f»? Уходи, пока цел.',
    '«%f» пахнет отсюда за версту.',
    'У «%f» тут друзей не водится.',
    'Не нравишься ты мне. И «%f» тоже.',
    'Знаем мы тебя, «%f». Боком выйди — и всё.',
  ],
};

/**
 * Фракционная барка для уровня. Возвращает null, если:
 *  • уровень слабый (cordial/neutral/wary) — шум;
 *  • RNG не выпал (подход без реплики — обычная барка продолжится).
 * Отдельные броски на «сработает ли» и «какая строка» — иначе короткие
 * списки ally-барок были бы недостижимы (rng уже ограничен шансом).
 */
export function resolveNpcFactionBark(
  tier: FactionAttitudeTier,
  factionLabel: string,
  rng: () => number = Math.random,
): string | null {
  const templates = FACTION_BARK_TEMPLATES[tier];
  const chance = NPC_FACTION_BARK_CHANCE[tier];
  if (!templates || templates.length === 0 || chance === undefined) return null;
  if (rng() >= chance) return null;

  const roll = rng();
  const template = templates[Math.floor(roll * templates.length) % templates.length]!;
  return template.replace('%f', factionLabel);
}
