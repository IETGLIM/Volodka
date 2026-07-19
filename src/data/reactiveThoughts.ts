/* ─── Reactive Thoughts — Volodka's inner monologue on key events ───
 *
 * Fires contextual thoughts after gameplay milestones: combat end, poem
 * collected, level up, quest completed, lore discovered. Rate-limited to
 * avoid thought spam (min 12 s between reactive thoughts).
 *
 * Thoughts are recorded in the persistent journal (thoughtHistory) via
 * the same volodka:thought → addThought pipeline as scene entry thoughts.
 */

import type { ThoughtContext } from './sceneEntryThoughts';

/** Minimum gap between reactive thoughts, in milliseconds. */
export const REACTIVE_THOUGHT_COOLDOWN_MS = 12_000;

/** Post-combat thoughts — fired on combat:end. */
export function getPostCombatThought(
  ctx: ThoughtContext,
  victorious: boolean,
): string | null {
  if (victorious) {
    if (ctx.karma <= 30) {
      return 'Победа. Руки ещё дрожат, но уже не от страха — от адреналина. Привыкну. Не хотел бы.';
    }
    if (ctx.karma >= 65) {
      return 'Победа. Но победа — это не радость. Это — облегчение. И стыд — за то, что облегчение есть.';
    }
    return 'Победа. Голова ясная, руки — нет. Это пройдёт. Это всегда проходит. Почти всегда.';
  }

  // Defeat
  if (ctx.stress >= 70) {
    return 'Поражение. Полежать бы. Полежать — и не вставать. Но — надо. «Надо» — это слово, которое не отпускает.';
  }
  if (ctx.karma <= 30) {
    return 'Поражение. Опять. Как всегда. Может, я — не для этого. Может, я — вообще ни для чего.';
  }
  return 'Поражение. Но я ещё здесь. «Ещё здесь» — это тоже результат. Иногда — единственный.';
}

/** Poem collected thoughts — fired on poem:collected. */
export function getPoemCollectedThought(
  ctx: ThoughtContext,
  poemCount: number,
): string | null {
  // First poem — special
  if (poemCount === 1) {
    return 'Первое стихотворение. Я давно не писал. Руки помнят. Голова — нет. Но — начало есть. Начало — это почти половина. Почти.';
  }

  // Milestone poems
  if (poemCount === 5) {
    return 'Пять стихов. Я — снова пишу. Не для гильдии, не для экрана — для себя. Для того, кто был до всего этого.';
  }
  if (poemCount === 10) {
    return 'Десять стихов. Я — снова поэт. Это слово — тяжёлое. Но — моё. Ношу. Не жалуюсь.';
  }
  if (poemCount === TOTAL_MAIN_POEMS_MILESTONE) {
    return 'Все стихи. Я — дописал. Я — дописал?! Я — не верю. Но — вот они. Мои. Наши. Те, ради кого.';
  }

  // Karma-reactive generic thoughts for other poems
  if (ctx.karma >= 65) {
    return 'Ещё один стих. Слова складываются — как и должны. Сегодня — легко. Завтра — посмотрим. Но сегодня — легко.';
  }
  if (ctx.karma <= 30) {
    return 'Ещё один стих. Тёмный. Как настроение. Как город. Как — я. Но — мой. Тёмный, но — мой.';
  }

  // Neutral — varied by count (deterministic)
  const variants = [
    'Ещё стих. Слова приходят — не всегда вовремя, но — приходят. Это — хорошо.',
    'Строчки ложатся. Не идеально, но — ложатся. Идеал — для других. Для меня — достаточно.',
    'Стих готов. Я — ещё здесь. Я — ещё пишу. Это — два утверждения, которые — связаны.',
    'Очередной стих. Город не замечает. Город — не обязан. Я — замечаю. Я — обязан.',
  ];
  return variants[poemCount % variants.length];
}

/** Level up thoughts — fired on player:levelup. */
export function getLevelUpThought(
  ctx: ThoughtContext,
  newLevel: number,
): string | null {
  // Milestone levels
  if (newLevel === 3) {
    return 'Третий уровень. Я — становлюсь. Кем — не знаю. Но — становлюсь. Это — уже что-то.';
  }
  if (newLevel === 7) {
    return 'Седьмой уровень. Я — научился. Чему — не скажу. Но — научился. Голова — тяжелее. Это — от знаний. Наверное.';
  }
  if (newLevel === 10) {
    return 'Десятый уровень. Круглая цифра. Я — дожил. Это — тоже — уровень. Может — главный.';
  }

  // Generic — karma-reactive
  if (ctx.karma >= 65) {
    return `Уровень ${newLevel}. Сильнее. Не — лучше. Сильнее — это другое. Но — полезное.`;
  }
  if (ctx.karma <= 30) {
    return `Уровень ${newLevel}. Сильнее. Но — зачем? Вопрос — без ответа. Уровень — с ответом. Идем дальше.`;
  }
  return `Уровень ${newLevel}. Опыт — капает. Я — капаю. В город. В историю. В — что-то.`;
}

/** Quest completed thoughts — fired on quest:completed. */
export function getQuestCompletedThought(
  ctx: ThoughtContext,
  _questId: string,
): string | null {
  if (ctx.karma >= 65) {
    return 'Дело сделано. Не идеально, но — сделано. Иногда — достаточно. Иногда — это и есть — идеально.';
  }
  if (ctx.karma <= 30) {
    return 'Дело сделано. Ради чего — не помню. Но — сделано. Это — привычка. Привычка — сильнее смысла.';
  }
  return 'Дело сделано. Галочка поставлена. Город — не изменился. Я — почти. «Почти» — это надолго.';
}

/** Lore discovered thoughts — fired on lore:discovered. */
export function getLoreDiscoveredThought(
  ctx: ThoughtContext,
  rarity: string,
): string | null {
  // Only fire for rare+ lore to avoid spam
  if (!['rare', 'epic', 'legendary'].includes(rarity.toLowerCase())) {
    return null;
  }

  if (rarity.toLowerCase() === 'legendary') {
    return 'Легендарная находка. Город забыл — я — вспомнил. Это — ответственность. Тяжелее, чем казалось.';
  }
  if (rarity.toLowerCase() === 'epic') {
    return 'Эпическая запись. Чужая память — теперь моя. Но — что я с ней делаю? Вопрос — на потом.';
  }
  // Rare
  if (ctx.karma >= 65) {
    return 'Редкая запись. Я — узнаю город. Город — не знает меня. Это — честный обмен. Почти.';
  }
  return 'Редкая запись. Ещё одна деталь. Ещё — пазл. Когда — картина? Может — никогда. Может — это и есть — картина.';
}

/** Story choice made thoughts — fired on choice:made. Rate-limited heavily. */
export function getChoiceMadeThought(
  ctx: ThoughtContext,
  karmaChange: number,
): string | null {
  // Only fire for significant karma changes
  if (Math.abs(karmaChange) < 10) return null;

  if (karmaChange > 0) {
    if (ctx.karma >= 65) {
      return 'Правильный выбор. Я — знаю, что правильный. Это — редкое чувство. Запомню. Или — попытаюсь.';
    }
    return 'Правильный выбор. Может — правильный. Голова — сомневается. Руки — уверены. Руки — честнее.';
  }

  // Negative karma
  if (ctx.karma <= 30) {
    return 'Тёмный выбор. Я — знаю. Город — знает. Молчим оба. Молчание — это тоже — согласие.';
  }
  return 'Трудный выбор. Или — плохой. Граница — тонкая. Я — на ней. Как всегда.';
}

/* ─── Helpers ─── */

/** Total number of main poems — milestone for the "all poems" thought. */
const TOTAL_MAIN_POEMS_MILESTONE = 18;

/**
 * Rate limiter — returns true if a reactive thought can be shown now
 * (i.e., enough time has passed since the last one). Mutates the internal
 * timestamp to enforce the cooldown.
 */
let _lastReactiveThoughtTs = 0;

export function canShowReactiveThought(now: number = Date.now()): boolean {
  if (now - _lastReactiveThoughtTs < REACTIVE_THOUGHT_COOLDOWN_MS) {
    return false;
  }
  _lastReactiveThoughtTs = now;
  return true;
}

/** Reset the rate limiter (for testing or new game). */
export function resetReactiveThoughtCooldown(): void {
  _lastReactiveThoughtTs = 0;
}
