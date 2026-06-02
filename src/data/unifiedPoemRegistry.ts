/* ═══════════════════════════════════════════════════════════════
   Volodka RPG – Unified Poem Registry (G5 Fix)

   Single Source of Truth for poem metadata across ALL contexts.
   Each poem has ONE canonical name, plus context-specific display names
   for exploration (world) and combat.

   This registry guarantees:
   1. No naming mismatches between world and combat
   2. All poem IDs are valid (no poem_20 bugs)
   3. Easy localization — only one place to update names
   ═══════════════════════════════════════════════════════════════ */

import type { Poem } from '@/shared/types/game';
import { POEMS, getPoemById } from '@/data/poems';

/* ─── Unified Poem Descriptor ─── */
export interface UnifiedPoemDescriptor {
  /** Canonical poem ID (poem_1 – poem_35) */
  id: string;
  /** Canonical display name — used as fallback if no context-specific name */
  canonicalName: string;
  /** Name shown in exploration/world context */
  worldName: string;
  /** Name shown in combat context */
  combatName: string;
  /** Short description for world use */
  worldDescription: string;
  /** Short description for combat use */
  combatDescription: string;
  /** The poem's literary title (from poems.ts) */
  poemTitle: string;
  /** Whether this is a bonus/hidden poem */
  isBonus: boolean;
}

/* ─── The Registry ─── */
const UNIFIED_POEM_REGISTRY: Record<string, UnifiedPoemDescriptor> = {
  poem_1: {
    id: 'poem_1',
    canonicalName: 'Правда Глас',
    worldName: 'Правда Глас',
    combatName: 'Правда Глас',
    worldDescription: 'Обнажить скрытую правду в диалоге. Следующая проверка убеждения автоматически проходит.',
    combatDescription: 'Обнажить слабость врага. Снижает защиту на 50% на 2 хода.',
    poemTitle: 'Когда в игру вступают деньги...',
    isBonus: false,
  },
  poem_2: {
    id: 'poem_2',
    canonicalName: 'Второе Дыхание',
    worldName: 'Второе Дыхание',
    combatName: 'Второе Дыхание',
    worldDescription: 'Возродиться из отчаяния. Восстанавливает 30 энергии и снимает 20 стресса.',
    combatDescription: 'Исцеление. Восстанавливает 40% максимального HP.',
    poemTitle: 'Смерть есть лишь начало',
    isBonus: false,
  },
  poem_3: {
    id: 'poem_3',
    canonicalName: 'Путеводная Звезда',
    worldName: 'Путеводная Звезда',
    combatName: 'Путеводная Звезда',
    worldDescription: 'Найти путь сквозь тьму. Показывает скрытые выходы и подсказки.',
    combatDescription: 'Ослепить врага. Пропускает следующий ход врага.',
    poemTitle: 'И что-то пошло не так',
    isBonus: false,
  },
  poem_4: {
    id: 'poem_4',
    canonicalName: 'Память Сердец',
    worldName: 'Память Сердец',
    combatName: 'Память Сердец',
    worldDescription: 'Укрепить связь с союзником. +15 к отношению ближайшего NPC.',
    combatDescription: 'Укрепить дух. Восстанавливает 25% HP и +5 кармы.',
    poemTitle: 'Снова вечер, тоска и сплин',
    isBonus: false,
  },
  poem_5: {
    id: 'poem_5',
    canonicalName: 'Штормовой Ветер',
    worldName: 'Штормовой Ветер',
    combatName: 'Штормовой Ветер',
    worldDescription: 'Прорвать преграды. +5 к интуиции и логике на 30 секунд.',
    combatDescription: 'Мощный удар. Наносит 200% урона от атаки.',
    poemTitle: 'Ты держишь в руках куски того',
    isBonus: false,
  },
  poem_6: {
    id: 'poem_6',
    canonicalName: 'Слово Мощь',
    worldName: 'Слово Мощь',
    combatName: 'Слово Мощь',
    worldDescription: 'Сила поэтического слова. +4 к навыку письма и убеждения.',
    combatDescription: 'Усилить атаку. Следующая атака нанесёт +50% урона (2 хода).',
    poemTitle: 'Ну а тебе, друг мой!',
    isBonus: false,
  },
  poem_7: {
    id: 'poem_7',
    canonicalName: 'Детский Взгляд',
    worldName: 'Детский Взгляд',
    combatName: 'Детский Взгляд',
    worldDescription: 'Увидеть мир глазами ребёнка. Раскрывает скрытые стихи в текущей локации.',
    combatDescription: 'Увидеть уязвимость. Снижает защиту врага на 30% на 2 хода и +3 интуиции.',
    poemTitle: 'В этом мире..',
    isBonus: false,
  },
  poem_8: {
    id: 'poem_8',
    canonicalName: 'Прорыв',
    worldName: 'Прорыв',
    combatName: 'Прорыв',
    worldDescription: 'Свершить невозможное. Следующая проверка кодинга проходит автоматически.',
    combatDescription: 'Прорвать оборону. Игнорирует защиту врага, наносит чистый урон.',
    poemTitle: 'Если знаешь куда идти',
    isBonus: false,
  },
  poem_9: {
    id: 'poem_9',
    canonicalName: 'Шутово Слово',
    worldName: 'Шутово Слово',
    combatName: 'Шутово Слово',
    worldDescription: 'Обернуть насмешку в оружие. Враги теряют уверенность, +3 кармы.',
    combatDescription: 'Двойная атака. Атакует дважды за этот ход.',
    poemTitle: 'Быть шутом в глазах людей',
    isBonus: false,
  },
  poem_10: {
    id: 'poem_10',
    canonicalName: 'Каменная Кожа',
    worldName: 'Каменная Кожа',
    combatName: 'Каменная Кожа',
    worldDescription: 'Стать твёрже камня. Снижает входящий стресс на 50% на 60 секунд.',
    combatDescription: 'Укрепить защиту. Получаемый урон снижен на 50% на 2 хода.',
    poemTitle: 'Я камень',
    isBonus: false,
  },
  poem_11: {
    id: 'poem_11',
    canonicalName: 'Голос Улиц',
    worldName: 'Голос Улиц',
    combatName: 'Голос Улиц',
    worldDescription: 'Услышать шёпот города. Раскрывает слухи и подсказки о квестах.',
    combatDescription: 'Отнять энергию врага. Враг теряет 25% HP, вы получаете 15 энергии.',
    poemTitle: 'Мой город не отпустит меня к тебе',
    isBonus: false,
  },
  poem_12: {
    id: 'poem_12',
    canonicalName: 'Звездный Путь',
    worldName: 'Звездный Путь',
    combatName: 'Звездный Путь',
    worldDescription: 'Путеводная звезда ведёт к цели. Автоматически завершает одно задание квеста.',
    combatDescription: 'Космический удар. Наносит урон, зависящий от кармы.',
    poemTitle: 'Sic itur ad astra',
    isBonus: false,
  },
  poem_13: {
    id: 'poem_13',
    canonicalName: 'Последнее Слово',
    worldName: 'Последнее Слово',
    combatName: 'Последнее Слово',
    worldDescription: 'Произнести финальное слово. +8 кармы, но +10 стресса от тяжести правды.',
    combatDescription: 'Финальный удар. +8 кармы, мощная атака.',
    poemTitle: 'Эпитафия',
    isBonus: false,
  },
  poem_14: {
    id: 'poem_14',
    canonicalName: 'Глубокое Размышление',
    worldName: 'Глубокое Размышление',
    combatName: 'Глубокое Размышление',
    worldDescription: 'Погрузиться в глубокое раздумье. +5 к письму и логике, но +5 стресса.',
    combatDescription: 'Полностью восстанавливает HP, но +15 стресса.',
    poemTitle: 'Обязательно подумаю',
    isBonus: true,
  },
  poem_15: {
    id: 'poem_15',
    canonicalName: 'Ироничный Шёпот',
    worldName: 'Ироничный Шёпот',
    combatName: 'Ироничный Шёпот',
    worldDescription: 'Прошептать иронию и раскрыть скрытые смыслы. +4 к убеждению.',
    combatDescription: 'Враг теряет ход и получает 20% урона от замешательства.',
    poemTitle: 'Я отпуск - не советую вам господа',
    isBonus: true,
  },
  poem_16: {
    id: 'poem_16',
    canonicalName: 'Эхо Памяти',
    worldName: 'Эхо Детства',
    combatName: 'Эхо Памяти',
    worldDescription: 'Вспомнить детство и обрести силы. +40 энергии и +3 эмпатии.',
    combatDescription: 'Повторяет последнее использованное стихотворение.',
    poemTitle: 'Папе — вычислительный ларь-чемодан!',
    isBonus: true,
  },
  poem_17: {
    id: 'poem_17',
    canonicalName: 'Невидимая Связь',
    worldName: 'Невидимая Связь',
    combatName: 'Невидимая Связь',
    worldDescription: 'Почувствовать невидимую нить между людьми. +10 к отношению NPC и -10 стресса.',
    combatDescription: 'Крадёт 30% максимального HP врага и восстанавливает ваше здоровье.',
    poemTitle: 'Мы стремимся ради других',
    isBonus: true,
  },
  poem_18: {
    id: 'poem_18',
    canonicalName: 'Возвращение Правды',
    worldName: 'Возвращение Правды',
    combatName: 'Возвращение Правды',
    worldDescription: 'Клевета вернётся в сто крат. +12 кармы и -25 стресса — истина приносит покой.',
    combatDescription: 'Мощнейшая атака. Урон = (атака + карма×0.5) × 1.5. Трата 50% HP и 30 энергии.',
    poemTitle: 'Вся клевета - вернется в сто крат',
    isBonus: true,
  },
  poem_19: {
    id: 'poem_19',
    canonicalName: 'Неоновая Панихида',
    worldName: 'Неоновая Панихида',
    combatName: 'Неоновая Панихида',
    worldDescription: 'Панихида по забытым. +8 кармы, раскрывает скрытые имена в архивах.',
    combatDescription: 'Неоновый удар. Призрачный свет повреждает врагов, нанося 150% урона спектральным сиянием.',
    poemTitle: 'Неоновая Панихида',
    isBonus: true,
  },
  poem_20: {
    id: 'poem_20',
    canonicalName: 'Чип в затылке',
    worldName: 'Чип в затылке',
    combatName: 'Чип в затылке',
    worldDescription: 'Шёпот свободы. Снимает 15 стресса и +5 к интуиции.',
    combatDescription: 'Взлом врага. Снижает защиту врага на 40% на 2 хода, пропускает его следующий ход.',
    poemTitle: 'Чип в затылке',
    isBonus: true,
  },
  poem_21: {
    id: 'poem_21',
    canonicalName: 'Белая Река, Чёрный Кабель',
    worldName: 'Белая Река, Чёрный Кабель',
    combatName: 'Белая Река',
    worldDescription: 'Гул машины. +5 к кодингу и логике на 30 секунд.',
    combatDescription: 'Поток исцеления. Белая река восстанавливает 35% HP и снимает 10 стресса.',
    poemTitle: 'Белая Река, Чёрный Кабель',
    isBonus: true,
  },
  poem_22: {
    id: 'poem_22',
    canonicalName: 'Бесконечный Коридор',
    worldName: 'Коридор',
    combatName: 'Бесконечный Коридор',
    worldDescription: 'Шагнуть между стенами. Снимает 12 стресса и +3 к интуиции.',
    combatDescription: 'Затягивает врага в бесконечный коридор. Пропускает ход врага и снижает его защиту на 25% на 2 хода.',
    poemTitle: 'Коридор',
    isBonus: true,
  },
  poem_23: {
    id: 'poem_23',
    canonicalName: 'Ветер Высот',
    worldName: 'Высотники',
    combatName: 'Ветер Высот',
    worldDescription: 'Ветер с крыш. +6 к интуиции и убеждению на 30 секунд.',
    combatDescription: 'Ветер свободы обрушивается на врага. Наносит 180% урона и +4 к интуиции.',
    poemTitle: 'Высотники',
    isBonus: true,
  },
  poem_24: {
    id: 'poem_24',
    canonicalName: 'Ночная Смена',
    worldName: 'Ночная Смена',
    combatName: 'Ночной Код',
    worldDescription: 'Сила ночной работы. +5 к кодингу и логике, но +8 стресса от усталости.',
    combatDescription: 'Ночной штурм. Наносит 160% урона, но +10 стресса от переработки.',
    poemTitle: 'Ночная смена',
    isBonus: true,
  },
  poem_25: {
    id: 'poem_25',
    canonicalName: 'Пауза',
    worldName: 'Между Сменами',
    combatName: 'Передышка',
    worldDescription: 'Мгновение покоя. Снимает 15 стресса и восстанавливает 20 энергии.',
    combatDescription: 'Момент отдыха. Восстанавливает 20% HP и снимает 10 стресса.',
    poemTitle: 'Между сменами',
    isBonus: true,
  },
  poem_26: {
    id: 'poem_26',
    canonicalName: 'Срыв Цикла',
    worldName: 'Переработка',
    combatName: 'Срыв Цикла',
    worldDescription: 'Прорвать бесконечный цикл. +8 к кодингу, но +15 стресса от выгорания.',
    combatDescription: 'Перегрузка системы. Наносит 200% урона, но вы получаете 20% урона от отдачи.',
    poemTitle: 'Переработка',
    isBonus: true,
  },
  poem_27: {
    id: 'poem_27',
    canonicalName: 'Непрочитанное',
    worldName: 'Сообщения',
    combatName: 'Сигнал',
    worldDescription: 'Шёпот через провода. +6 к убеждению и эмпатии на 30 секунд.',
    combatDescription: 'Электромагнитный импульс. Пропускает ход врага и снижает его атаку на 30%.',
    poemTitle: 'Сообщения',
    isBonus: true,
  },
  poem_28: {
    id: 'poem_28',
    canonicalName: 'Потерянный Пакет',
    worldName: 'Потерянный Пакет',
    combatName: '404',
    worldDescription: 'Исчезнуть из сети. Снижает стресс на 10, +3 к интуиции, но −2 к убеждению.',
    combatDescription: 'Ошибка 404. Враг теряет цель, пропускает ход и получает 25% урона.',
    poemTitle: 'Потерянный пакет',
    isBonus: true,
  },
  poem_29: {
    id: 'poem_29',
    canonicalName: 'Черновик',
    worldName: 'Непосланное',
    combatName: 'Черновик',
    worldDescription: 'Честность непосланного. +8 к письму, +4 к интуиции, но +5 стресса.',
    combatDescription: 'Неотправленная атака. Наносит 170% урона, игнорируя 20% защиты врага.',
    poemTitle: 'Непосланное',
    isBonus: true,
  },
  poem_30: {
    id: 'poem_30',
    canonicalName: 'Чистилище',
    worldName: 'Метро',
    combatName: 'Чистилище',
    worldDescription: 'Шум толпы и тишина внутри. +4 к эмпатии, −5 стресса, раскрывает слухи.',
    combatDescription: 'Давление толпы. Снижает атаку врага на 25% на 2 хода и восстанавливает 15 энергии.',
    poemTitle: 'Метро',
    isBonus: true,
  },
  poem_31: {
    id: 'poem_31',
    canonicalName: 'Радуга на Бетоне',
    worldName: 'Дождь на Вышках',
    combatName: 'Неоновый Дождь',
    worldDescription: 'Красота в сером городе. +5 к интуиции и письму, снимает 12 стресса.',
    combatDescription: 'Неоновый ливень. Наносит 150% урона и восстанавливает 10% HP.',
    poemTitle: 'Дождь на вышках',
    isBonus: true,
  },
  poem_32: {
    id: 'poem_32',
    canonicalName: 'return void',
    worldName: 'return void',
    combatName: 'Пустой Возврат',
    worldDescription: 'Принять пустоту. +10 к кодингу и логике на 30 секунд, но +5 стресса.',
    combatDescription: 'Пустой возврат. Обнуляет баффы врага и наносит 140% чистого урона.',
    poemTitle: 'return void',
    isBonus: true,
  },
  poem_33: {
    id: 'poem_33',
    canonicalName: 'След в Коде',
    worldName: 'Комментарий',
    combatName: 'След в Коде',
    worldDescription: 'Найти след другого человека. +6 к эмпатии, +4 к убеждению, раскрывает скрытые данные.',
    combatDescription: 'Унаследованная сила. Повторяет последнее использованное стихотворение с +20% мощности.',
    poemTitle: 'Комментарий',
    isBonus: true,
  },
  poem_34: {
    id: 'poem_34',
    canonicalName: 'Вне Сети',
    worldName: 'Мёртвый Телефон',
    combatName: 'Вне Сети',
    worldDescription: 'Память без батареи. +8 к интуиции, снимает 20 стресса, +3 к письму.',
    combatDescription: 'Аналоговая атака. Наносит 160% урона, игнорируя цифровые щиты врага.',
    poemTitle: 'Мёртвый телефон',
    isBonus: true,
  },
  poem_35: {
    id: 'poem_35',
    canonicalName: 'До Башен',
    worldName: 'До Башен',
    combatName: 'Древний Город',
    worldDescription: 'Память о том, что было до. +10 к убеждению и эмпатии, −15 стресса.',
    combatDescription: 'Сила прошлого. Восстанавливает 40% HP, снимает 15 стресса и +5 к интуиции.',
    poemTitle: 'До башен',
    isBonus: true,
  },
};

/* ─── Public API ─── */

/** Get the unified descriptor for a poem ID */
export function getUnifiedPoem(poemId: string): UnifiedPoemDescriptor | undefined {
  return UNIFIED_POEM_REGISTRY[poemId];
}

/** Get display name for a specific context */
export function getPoemDisplayName(poemId: string, context: 'world' | 'combat'): string {
  const desc = UNIFIED_POEM_REGISTRY[poemId];
  if (!desc) return poemId;
  return context === 'world' ? desc.worldName : desc.combatName;
}

/** Get description for a specific context */
export function getPoemDescription(poemId: string, context: 'world' | 'combat'): string {
  const desc = UNIFIED_POEM_REGISTRY[poemId];
  if (!desc) return '';
  return context === 'world' ? desc.worldDescription : desc.combatDescription;
}

/** Get all unified poem descriptors */
export function getAllUnifiedPoems(): UnifiedPoemDescriptor[] {
  return Object.values(UNIFIED_POEM_REGISTRY);
}

/** Validate that a poem ID exists in the registry */
export function isValidPoemId(poemId: string): boolean {
  return poemId in UNIFIED_POEM_REGISTRY;
}

/** Get the poem's literary text from poems.ts */
export function getPoemText(poemId: string): Poem | undefined {
  if (!isValidPoemId(poemId)) return undefined;
  return getPoemById(poemId);
}
