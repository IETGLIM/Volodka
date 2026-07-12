/* ─── Volodka RPG – «Поля»: личные заметки Володьки к собранным стихам ───
   ВАЖНО: сами стихи (src/data/poems.ts) неприкосновенны. Заметки — отдельный
   слой данных, «карандаш на полях», и никогда не трогают текст стиха.
*/

import { KARMA_HIGH_THRESHOLD, KARMA_LOW_THRESHOLD } from './constants';
import { POEMS } from './poems';
import type { Poem } from '@/shared/types/game';

export interface PoemMarginCondition {
  /** Заметка показывается при карме >= minKarma */
  minKarma?: number;
  /** Заметка показывается при карме <= maxKarma */
  maxKarma?: number;
  /** Заметка показывается, только если флаг установлен в true */
  requiredFlag?: string;
  /** Заметка показывается начиная с указанного акта */
  minAct?: number;
}

export interface PoemMargin {
  id: string;
  poemId: string;
  text: string;
  condition?: PoemMarginCondition;
}

export interface PoemMarginContext {
  karma: number;
  flags: Readonly<Record<string, boolean | undefined>>;
  currentAct: number;
}

export const POEM_MARGINS: PoemMargin[] = [
  /* ── poem_1 — «Когда в игру вступают деньги...» ── */
  {
    id: 'margin_poem_1_base',
    poemId: 'poem_1',
    text: 'Написал после того, как снесли дом с лепниной на Ленина. Утром на его месте уже висела реклама нейрочипов.',
  },
  {
    id: 'margin_poem_1_low',
    poemId: 'poem_1',
    text: 'Перечитал — злость не прошла. Может, они и правы: всё продаётся. Сегодня я тоже промолчал, когда надо было говорить.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },
  {
    id: 'margin_poem_1_high',
    poemId: 'poem_1',
    text: 'Телеграмму главе, может, никто и не прочтёт. Но если хоть один человек оглянется на старый фасад — уже не зря.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },

  /* ── poem_2 — «Смерть есть лишь начало» ── */
  {
    id: 'margin_poem_2_base',
    poemId: 'poem_2',
    text: 'Писал в самую плохую ночь. Оставляю как есть — нельзя править то, что было правдой.',
  },
  {
    id: 'margin_poem_2_zarema',
    poemId: 'poem_2',
    text: 'Перечитываю — и думаю про Зарему. Пока её нет за стеной, тишина в коммуналке весит тонну.',
    condition: { requiredFlag: 'zarema_arrested' },
  },
  {
    id: 'margin_poem_2_high',
    poemId: 'poem_2',
    text: 'Маме и папе так и не позвонил. Завтра. Честно — завтра.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },

  /* ── poem_3 — «И что-то пошло не так» ── */
  {
    id: 'margin_poem_3_base',
    poemId: 'poem_3',
    text: 'Старая бричка — это мой системник, конечно. Скрипит, но едет.',
  },
  {
    id: 'margin_poem_3_act3',
    poemId: 'poem_3',
    text: 'Чем дальше иду, тем понятнее: дело правда в том, чтобы молча править свою повозку. Остальное — шум на линии.',
    condition: { minAct: 3 },
  },
  {
    id: 'margin_poem_3_low',
    poemId: 'poem_3',
    text: 'Сегодня сам был менадой. Орфею, кажется, досталось от меня. Запомнить и не повторять.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },

  /* ── poem_4 — «Снова вечер, тоска и сплин» ── */
  {
    id: 'margin_poem_4_base',
    poemId: 'poem_4',
    text: 'Писал под Васильева. Чай остыл, за стеной Зарема гремела чайником. Почти уют.',
  },
  {
    id: 'margin_poem_4_low',
    poemId: 'poem_4',
    text: '«Прости тех, кто был с тобой» — легко написать. Сделать пока не получается.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },
  {
    id: 'margin_poem_4_high',
    poemId: 'poem_4',
    text: 'Перечитал и улыбнулся. Значит, строчки всё ещё работают. Лучше любого антидепрессанта из аптеки на углу.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },

  /* ── poem_5 — «Ты держишь в руках куски того» ── */
  {
    id: 'margin_poem_5_base',
    poemId: 'poem_5',
    text: 'После того вечера в «Синей яме». Альберт сказал бы: душа — тоже текст, просто с рваной кодировкой.',
  },
  {
    id: 'margin_poem_5_act2',
    poemId: 'poem_5',
    text: 'Семь футов под килем, Володька. Хотя бы до конца этого спринта.',
    condition: { minAct: 2 },
  },

  /* ── poem_6 — «Ну а тебе, друг мой!» ── */
  {
    id: 'margin_poem_6_base',
    poemId: 'poem_6',
    text: 'Альберт смеялся в голос. Сказал, что серебряный век закончился, а похмелье от него — нет.',
  },
  {
    id: 'margin_poem_6_low',
    poemId: 'poem_6',
    text: 'Поэзию не стоит любить — а я люблю. Вот и весь мой баг-репорт на самого себя.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },

  /* ── poem_7 — «В этом мире..» ── */
  {
    id: 'margin_poem_7_base',
    poemId: 'poem_7',
    text: 'Про крылатых детей писал дольше всего. Стирал, возвращал. Оставил.',
  },
  {
    id: 'margin_poem_7_high',
    poemId: 'poem_7',
    text: 'Если эти строки удержат кого-то на подоконнике с этой стороны — значит, всё было не зря.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },
  {
    id: 'margin_poem_7_low',
    poemId: 'poem_7',
    text: 'Перечитал. Создатель, шутка всё ещё не смешная.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },

  /* ── poem_8 — «Если знаешь куда идти» ── */
  {
    id: 'margin_poem_8_base',
    poemId: 'poem_8',
    text: 'Повесил бы эти строки над терминалом вместо иконки. Боги поперёк не встанут — а вот гильдия может.',
  },
  {
    id: 'margin_poem_8_act4',
    poemId: 'poem_8',
    text: 'Теперь я знаю, куда идти. Страшно так же, как раньше, но шаги ровнее.',
    condition: { minAct: 4 },
  },

  /* ── poem_9 — «Быть шутом в глазах людей» ── */
  {
    id: 'margin_poem_9_base',
    poemId: 'poem_9',
    text: 'На стендапе опять смеялись. Пусть. Шут видит зал лучше, чем зал — шута.',
  },
  {
    id: 'margin_poem_9_low',
    poemId: 'poem_9',
    text: 'Сегодня сам протянул кого-то плетью. Перечитал — стыдно. Суконце-то у меня крепкое.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },

  /* ── poem_10 — «Я камень» ── */
  {
    id: 'margin_poem_10_base',
    poemId: 'poem_10',
    text: 'Написал в мемориальном парке. Камень терпит дольше сервера, и логи у него честнее.',
  },
  {
    id: 'margin_poem_10_act3',
    poemId: 'poem_10',
    text: 'Иногда спрашиваю себя: я уже понял? уже смог? Дымка над землёй пока не видно.',
    condition: { minAct: 3 },
  },

  /* ── poem_11 — «Мой город не отпустит меня к тебе» ── */
  {
    id: 'margin_poem_11_base',
    poemId: 'poem_11',
    text: 'Зелёная дверь. До сих пор не знаю, существует ли она. Но искать пока не разучился.',
  },
  {
    id: 'margin_poem_11_maria',
    poemId: 'poem_11',
    text: 'Перечитал после разговора с Марией. «Кто-то просто шёл рядом» — кажется, я начинаю понимать, про кого это.',
    condition: { requiredFlag: 'met_maria' },
  },
  {
    id: 'margin_poem_11_low',
    poemId: 'poem_11',
    text: 'Город не отпускает. Сегодня я, честно говоря, и не просился.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },

  /* ── poem_12 — «Sic itur ad astra» ── */
  {
    id: 'margin_poem_12_base',
    poemId: 'poem_12',
    text: 'Старец потрясный был прав. Крейсер строится. Медленно. По ночам, после основной работы.',
  },
  {
    id: 'margin_poem_12_high',
    poemId: 'poem_12',
    text: 'Если не я — то кто заставит их снова мечтать? Сегодня, кажется, получилось. С одним человеком. Уже флот.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },

  /* ── poem_13 — «Эпитафия» ── */
  {
    id: 'margin_poem_13_base',
    poemId: 'poem_13',
    text: 'Не эпитафия. Черновик. Пока я здесь — правки ещё возможны.',
  },
  {
    id: 'margin_poem_13_act5',
    poemId: 'poem_13',
    text: 'Перечитал в конце пути. Добро существует. Я проверял. Лично.',
    condition: { minAct: 5 },
  },
  {
    id: 'margin_poem_13_low',
    poemId: 'poem_13',
    text: 'Венок можно не возлагать. Просто вспомните хоть что-нибудь хорошее. Хоть строчку.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },

  /* ── poem_14 — «Обязательно подумаю» ── */
  {
    id: 'margin_poem_14_base',
    poemId: 'poem_14',
    text: 'Нашёл между страниц в библиотеке. Лицедеям стихи и правда лучше не кидать.',
  },
  {
    id: 'margin_poem_14_low',
    poemId: 'poem_14',
    text: 'Шум вместо песни — это и про большинство моих коммитов, если честно.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },

  /* ── poem_15 — «Я отпуск - не советую вам господа» ── */
  {
    id: 'margin_poem_15_base',
    poemId: 'poem_15',
    text: 'Писал в единственный отпуск за три года. Коньяк был, Дюма был. Отдыха не было.',
  },
  {
    id: 'margin_poem_15_zarema',
    poemId: 'poem_15',
    text: 'Зарема говорит: «Володя, отдыхать надо уметь». Учусь. По Дюма.',
    condition: { minAct: 2 },
  },

  /* ── poem_16 — «Папе — вычислительный ларь-чемодан!» ── */
  {
    id: 'margin_poem_16_base',
    poemId: 'poem_16',
    text: 'Маяковским баловался. Отцу так и не показал.',
  },
  {
    id: 'margin_poem_16_high',
    poemId: 'poem_16',
    text: 'Десять лет. Надо позвонить. Запишу в TODO — там надёжнее, чем в сердце. Хотя нет. Неправда.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },

  /* ── poem_17 — «Мы стремимся ради других» ── */
  {
    id: 'margin_poem_17_base',
    poemId: 'poem_17',
    text: 'Про чёрную птицу и сыр — это про всех нас в гильдии. Слово доброе услышал — и пошёл дебажить чужое до утра.',
  },
  {
    id: 'margin_poem_17_rescued',
    poemId: 'poem_17',
    text: 'Перечитал после всего, что было с Заремой. Ради других — это не баг. Это вся моя архитектура.',
    condition: { requiredFlag: 'zarema_rescued' },
  },
  {
    id: 'margin_poem_17_low',
    poemId: 'poem_17',
    text: '«Уйдём и не ждём помина». Сегодня хотелось именно так. Завтра, надеюсь, отпустит.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },

  /* ── poem_18 — «Вся клевета - вернется в сто крат» ── */
  {
    id: 'margin_poem_18_base',
    poemId: 'poem_18',
    text: 'Отвечать устал ещё в прошлом году. Молчание, как выяснилось, тоже компилируется.',
  },
  {
    id: 'margin_poem_18_high',
    poemId: 'poem_18',
    text: 'Кто-то выбрал свой путь. Я, кажется, тоже. И мой мне нравится.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },

  /* ── poem_19 — «Неоновая Панихида» ── */
  {
    id: 'margin_poem_19_base',
    poemId: 'poem_19',
    text: 'Писал ночью на лавке, неон капал на асфальт. Кто-то правда помнит их пароли. Я, например.',
  },
  {
    id: 'margin_poem_19_act2',
    poemId: 'poem_19',
    text: 'Теперь, когда знаю про Сеть больше, перечитываю иначе: панихида — не по людям. По тому, какими мы могли быть.',
    condition: { minAct: 2 },
  },

  /* ── poem_20 — «Чип в затылке» ── */
  {
    id: 'margin_poem_20_base',
    poemId: 'poem_20',
    text: 'Шрам от отказной чешется до сих пор. Особенно на совещаниях.',
  },
  {
    id: 'margin_poem_20_low',
    poemId: 'poem_20',
    text: 'Иногда думаю: может, с чипом было бы проще? Потом перечитываю — и шрам успокаивается.',
    condition: { maxKarma: KARMA_LOW_THRESHOLD },
  },
  {
    id: 'margin_poem_20_high',
    poemId: 'poem_20',
    text: 'Мне больно думать и страшно помнить. Зато мысли — мои. Сегодня этого хватает с запасом.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },

  /* ── poem_21 — «Белая Река, Чёрный Кабель» ── */
  {
    id: 'margin_poem_21_base',
    poemId: 'poem_21',
    text: 'Стоял на берегу Белой целый час. Телефон сел. Стихи — нет.',
  },
  {
    id: 'margin_poem_21_high',
    poemId: 'poem_21',
    text: 'Река течёт. Я живой. Сегодня этого достаточно.',
    condition: { minKarma: KARMA_HIGH_THRESHOLD },
  },
  {
    id: 'margin_poem_21_rooftop',
    poemId: 'poem_21',
    text: 'С крыши видно и реку, и кабель разом. Высотники правы: сверху понятнее, кто из них переживёт кого.',
    condition: { requiredFlag: 'rooftop_unlocked', minAct: 2 },
  },
];

const POEM_IDS_WITH_DEDICATED_MARGINS = new Set(POEM_MARGINS.map((m) => m.poemId));

function buildFallbackMarginText(poem: Poem): string {
  if (poem.id === 'poem_tolpa') {
    return 'ЧК, костёр, портвейн. Этот стих не из архива — из ночи, которую не залью в репозиторий.';
  }
  if (poem.id.startsWith('poem_act6_')) {
    return 'Акт шестой. Пишу на полях, когда город уже не тот, но слова ещё держатся.';
  }
  if (poem.id.startsWith('poem_act7_')) {
    return 'Финал близко. Каждая строчка на полях — как коммит, который уже не откатишь.';
  }
  if (poem.bonus || poem.order > 21) {
    return 'Нашёл позже основной двадцатки. Записал на полях — пока память свежая. Сам стих не трогал.';
  }
  return 'Записал на полях. Перечитаю, когда снова пойму, зачем эта строчка осталась.';
}

/** Unconditional fallbacks for poems without hand-authored margin variants. */
const GENERATED_POEM_MARGIN_FALLBACKS: PoemMargin[] = POEMS.filter(
  (poem) => !POEM_IDS_WITH_DEDICATED_MARGINS.has(poem.id),
).map((poem) => ({
  id: `margin_${poem.id}_fallback`,
  poemId: poem.id,
  text: buildFallbackMarginText(poem),
}));

const ALL_POEM_MARGINS: readonly PoemMargin[] = [
  ...POEM_MARGINS,
  ...GENERATED_POEM_MARGIN_FALLBACKS,
];

/* ─── Выбор заметки ───
   Из всех подходящих по условиям вариантов берётся самый специфичный:
   чем больше заполненных полей в condition, тем выше приоритет.
   При равной специфичности побеждает первый по порядку в массиве.
   Вариант без condition — безусловный фоллбек (специфичность 0). */

function conditionSpecificity(condition?: PoemMarginCondition): number {
  if (!condition) return 0;
  let n = 0;
  if (condition.minKarma !== undefined) n++;
  if (condition.maxKarma !== undefined) n++;
  if (condition.requiredFlag !== undefined) n++;
  if (condition.minAct !== undefined) n++;
  return n;
}

function matchesCondition(condition: PoemMarginCondition | undefined, ctx: PoemMarginContext): boolean {
  if (!condition) return true;
  if (condition.minKarma !== undefined && ctx.karma < condition.minKarma) return false;
  if (condition.maxKarma !== undefined && ctx.karma > condition.maxKarma) return false;
  if (condition.requiredFlag !== undefined && ctx.flags[condition.requiredFlag] !== true) return false;
  if (condition.minAct !== undefined && ctx.currentAct < condition.minAct) return false;
  return true;
}

/** Core selection over an explicit margins list — exported for unit tests. */
export function selectPoemMargin(
  margins: readonly PoemMargin[],
  poemId: string,
  ctx: PoemMarginContext,
): PoemMargin | undefined {
  let best: PoemMargin | undefined;
  let bestSpecificity = -1;
  for (const margin of margins) {
    if (margin.poemId !== poemId) continue;
    if (!matchesCondition(margin.condition, ctx)) continue;
    const specificity = conditionSpecificity(margin.condition);
    if (specificity > bestSpecificity) {
      best = margin;
      bestSpecificity = specificity;
    }
  }
  return best;
}

/** Заметка Володьки «на полях» для стиха в текущем контексте игрока. */
export function getPoemMargin(poemId: string, ctx: PoemMarginContext): PoemMargin | undefined {
  return selectPoemMargin(ALL_POEM_MARGINS, poemId, ctx);
}
