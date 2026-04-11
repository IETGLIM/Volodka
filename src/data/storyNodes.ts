import type { StoryNode, StoryChoice, PoemLine, Interpretation, StoryEffect } from './types';

// ============================================
// КОНСТАНТЫ
// ============================================

export const TITLE_TEXT = 'ВОЛОДЬКА';
export const SUBTITLE_TEXT = '12 лет в техподдержке | История одиночества | Мемориал';

export const INTRO_POEM = `В свете уличных фонарей
Вспомнилось мне то, чего нет
В тишине ночных аллей
Искать потерянный ответ`;

// ============================================
// ПОЭТИЧЕСКИЕ СТРОКИ ДЛЯ МИНИ-ИГР
// ============================================

const poemGameLines_1: PoemLine[] = [
  { id: 'p1', text: 'В тишине ночи', value: 3 },
  { id: 'p2', text: 'Свет звёзд ведёт меня', value: 2 },
  { id: 'p3', text: 'Шум города затих', value: 2 },
  { id: 'p4', text: 'К новой надежде', value: 3 },
];

const poemGameLines_2: PoemLine[] = [
  { id: 'p1', text: 'Слова текут рекой', value: 3 },
  { id: 'p2', text: 'На бумаге остаются', value: 2 },
  { id: 'p3', text: 'Мысли о тебе', value: 2 },
  { id: 'p4', text: 'Следы потерянных дней', value: 3 },
];

// ============================================
// ИНТЕРПРЕТАЦИИ СНОВ
// ============================================

const dreamInterpretations: Interpretation[] = [
  { text: 'Это предупреждение — мой разум пытается что-то сказать', effect: { stability: -5, introspection: 5 } },
  { text: 'Просто усталость — ничего серьёзного', effect: { stability: 5, introspection: -3 } },
  { text: 'Возможно, это подсказка — я должен что-то изменить', effect: { creativity: 5, karma: 5 } },
  { text: 'Не важно — сны это просто сны', effect: { stability: 3, karma: -5 } },
];

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function createChoice(text: string, next: string, effect?: StoryEffect): StoryChoice {
  return { text, next, effect };
}

// ============================================
// УЗЛЫ ИСТОРИИ - РАСШИРЕННАЯ ВЕРСИЯ
// ============================================

export const STORY_NODES: Record<string, StoryNode> = {
  
  // ========== ПРОЛОГ: НАЧАЛО ==========
  
  start: {
    id: 'start',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: 'Офис облачного сервиса. 9:00 утра.\n\nТри монитора. Открытые тикеты. Кофе остывает в чашке.\n\n"Критическая проблема: банковский клиент не может авторизовать пользователей"\n\n12 лет в техподдержке. Тысячи тикетов.\n\nЗа окном — серый уфимский день. Снег начинает падать.',
    autoNext: 'start_2',
  },
  
  start_2: {
    id: 'start_2',
    type: 'dialogue',
    scene: 'office_morning',
    speaker: 'Система мониторинга',
    act: 1,
    text: '🔴 ALERT: Product ID 4729 — Authentication Service Down\n\nБанк "Северный Капитал" — 5000+ пользователей не могут войти.\n\nSLA: 15 минут до эскалации на L2.\n\nОбычный день. Обычный тикет.',
    choices: [
      createChoice('Начать диагностику', 'start_diagnosis', { stability: 3 }),
      createChoice('Эскалировать на L2', 'escalate_now', { stability: 5, karma: -2 }),
      createChoice('Посмотреть, что с базой', 'check_database', { skillGains: { coding: 2 } }),
    ],
  },
  
  start_diagnosis: {
    id: 'start_diagnosis',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: 'Kibana открывается на среднем мониторе. Логи текут рекой.\n\nError: Connection refused to auth-db-prod-03\nError: Pool exhausted\nError: Timeout waiting for connection\n\nЗнакомая картина. Я это уже видел. Много раз.',
    autoNext: 'database_analysis',
  },
  
  escalate_now: {
    id: 'escalate_now',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: 'Тикет эскалирован. L2 разберутся.\n\nЯ откидываюсь в кресле.\n\nЕщё один тикет. Ещё один день. Ещё один год.',
    autoNext: 'lunch_time',
  },
  
  check_database: {
    id: 'check_database',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: 'SSH-терминал. Привычные команды.\n\nSHOW PROCESSLIST — 847 активных соединений. Максимум — 800.\n\nНовый микросервис "loyalty-points" не возвращает соединения.\n\nДеплой был в 3:47 ночи. Автоматический CI/CD.\n\nРазработчики спят. Я один.',
    autoNext: 'fix_choice',
  },
  
  database_analysis: {
    id: 'database_analysis',
    type: 'dialogue',
    scene: 'office_morning',
    speaker: 'Внутренний голос',
    act: 1,
    text: '"12 лет ты это делаешь. Проблемы повторяются.\n\nТолько банки другие. Только облака крупнее.\n\nТы устал? Или просто привык?"',
    choices: [
      createChoice('Устал — но это моя работа', 'fix_choice', { stability: 2, stress: 5 }),
      createChoice('Привык — мне нравится решать проблемы', 'fix_choice', { mood: 3 }),
      createChoice('Не знаю уже', 'fix_choice', { stability: -2, stress: 10 }),
    ],
  },
  
  fix_choice: {
    id: 'fix_choice',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: 'Решение очевидно. Откатить деплой.\n\nkubectl rollout undo deployment/loyalty-points -n banking-prod\n\n"deployment.apps/loyalty-points rolled back"\n\n8 минут. SLA соблюдён.',
    choices: [
      createChoice('Закрыть тикет и двигаться дальше', 'fix_success', { stability: 5 }),
      createChoice('Написать патч на будущее', 'fix_success', { skillGains: { coding: 5 } }),
    ],
  },
  
  fix_success: {
    id: 'fix_success',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: 'Тикет закрыт. Банки работают. Пользователи входят.\n\nЯ смотрю на экран. 11:47.\n\nНа краю стола — старый блокнот. Страницы пожелтели. Там — мои стихи. Не все. Многие потерялись.\n\nОбед скоро.',
    effect: { stability: 5, mood: 3 },
    autoNext: 'lunch_time',
  },
  
  // ========== ОБЕД И КОЛЛЕГИ ==========
  
  lunch_time: {
    id: 'lunch_time',
    type: 'narration',
    scene: 'cafe_evening',
    act: 1,
    text: 'Столовая на первом этаже. Очередь, подносы, запах еды.\n\nЯ сажусь за край стола. Коллеги рядом.\n\nНа столе напротив — книга. "Серебряный век русской поэзии". Странно видеть такое здесь.\n\nРазговоры о Kubernetes, о новых фичах, о планах на выходные.\n\nЯ ем молча, иногда поглядывая на книгу.',
    autoNext: 'colleagues_talk',
  },
  
  colleagues_talk: {
    id: 'colleagues_talk',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Коллега',
    act: 1,
    text: '"Володя! Ты же у нас 12 лет уже? Ни разу не видел тебя на корпоративах.\n\nСемья? Дети? Ты ж ещё молодой."',
    choices: [
      createChoice('"Нет, я один живу"', 'neutral_answer', { stability: 2 }),
      createChoice('"Были отношения. Долго. Закончилось"', 'honest_answer', { karma: 5, stress: 10 }),
      createChoice('"Не люблю корпоративы"', 'avoid_answer', { stability: 3 }),
    ],
  },
  
  neutral_answer: {
    id: 'neutral_answer',
    type: 'narration',
    scene: 'cafe_evening',
    act: 1,
    text: '"Понятно." — кивают и возвращаются к разговору.\n\nЯ ем дальше.\n\nВнутри — привычная пустота.',
    autoNext: 'after_lunch',
  },
  
  honest_answer: {
    id: 'honest_answer',
    type: 'narration',
    scene: 'cafe_evening',
    act: 1,
    text: 'Несколько секунд тишины.\n\n"Ого... Сочувствую, мужик."\n\n"Это было 8 лет назад." — говорю я.\n\n"Справился."\n\nВру.',
    autoNext: 'after_lunch',
  },
  
  avoid_answer: {
    id: 'avoid_answer',
    type: 'narration',
    scene: 'cafe_evening',
    act: 1,
    text: '"Ясно. Ну, если захочешь — приходи как-нибудь."\n\nКивают. Возвращаются к разговору.\n\nЯ не приду. Они знают.',
    autoNext: 'after_lunch',
  },
  
  after_lunch: {
    id: 'after_lunch',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: 'Вечер. 18:00. Конец рабочего дня.\n\nЗа окном — огни ночного города. Снег падает.\n\nСнова домой. Снова один.',
    choices: [
      createChoice('Домой — там привычно', 'go_home', { stability: 3 }),
      createChoice('Прогуляться по парку', 'park_walk', { mood: 3 }),
      createChoice('Посмотреть старые фото', 'old_photos_trigger', { stress: 15 }),
    ],
  },
  
  // ========== ВОСПОМИНАНИЕ О ДЕТСТВЕ ==========
  
  park_walk: {
    id: 'park_walk',
    type: 'narration',
    scene: 'memorial_park',
    act: 1,
    text: 'Мемориальный парк. Старые деревья, заснеженные дорожки.\n\nЗдесь тихо. Здесь можно думать.\n\nЯ иду по аллее. Снег хрустит под ногами.\n\nНа стене у входа — афиша. "Литературный вечер. Кафе \'Синий кот\'. Пятница, 19:00."\n\nЯ прохожу мимо. Но что-то внутри задерживается на мгновение.\n\nНа скамейке — семья. Отец, мать, ребёнок. Лепят снеговика.',
    autoNext: 'childhood_trigger',
  },
  
  childhood_trigger: {
    id: 'childhood_trigger',
    type: 'dialogue',
    scene: 'memorial_park',
    speaker: 'Внутренний голос',
    act: 1,
    text: '"Помнишь детство? Лето в деревне.\n\nБабушкин дом. Печь. Запах хлеба.\n\nТогда ты был счастлив. Почему?"',
    choices: [
      createChoice('Бабушка — она меня понимала', 'grandmother_memory', { creativity: 5, mood: 3 }),
      createChoice('Свобода — целый мир принадлежал мне', 'freedom_memory', { mood: 5 }),
      createChoice('Не помню — давно это было', 'no_childhood_memory', { stress: 10 }),
    ],
  },
  
  grandmother_memory: {
    id: 'grandmother_memory',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    cutscene: 'childhood_memories',
    text: 'Бабушкин дом. Большая печь. Запах дров.\n\nМы печём картошку в золе. Она рассказывает сказки — про Ивана-Царевича, про Жар-птицу.\n\n"Володенька, ты вырастешь большим и добрым человеком."\n\nОна умерла, когда мне было 15.\n\nЕё слова я помню до сих пор.',
    autoNext: 'childhood_continue',
  },
  
  freedom_memory: {
    id: 'freedom_memory',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Поле за огородом. Бегу босиком по траве.\n\nНебо — огромное, без конца и края.\n\nНикто не кричит. Никто не говорит "садись за уроки".\n\nПросто я и мир. И всё возможно.\n\nКогда это закончилось? Когда я стал взрослым?',
    autoNext: 'childhood_continue',
  },
  
  no_childhood_memory: {
    id: 'no_childhood_memory',
    type: 'narration',
    scene: 'memorial_park',
    act: 1,
    text: 'Детство — как чужой фильм.\n\nЛица, голоса, события. Но чувств — нет.\n\nБудто это был не я.\n\nМожет, защитный механизм. Может, просто время.',
    autoNext: 'go_home',
  },
  
  childhood_continue: {
    id: 'childhood_continue',
    type: 'narration',
    scene: 'memorial_park',
    act: 1,
    text: 'Я смотрю на семью на скамейке.\n\nРебёнок смеётся. Отец поднимает его на руки. Мать улыбается.\n\nЭто могла быть моя жизнь.\n\nНо не стала.',
    choices: [
      createChoice('Жизнь сложилась иначе', 'life_happened', { stability: 2 }),
      createChoice('Я доверял не тем людям', 'trusted_wrong', { stress: 10 }),
    ],
  },
  
  life_happened: {
    id: 'life_happened',
    type: 'narration',
    scene: 'memorial_park',
    act: 1,
    text: 'Жизнь складывается. Не всегда так, как планировал.\n\nЯ хотел семью. Детей. Дом.\n\nНо это — не моя история.',
    autoNext: 'go_home',
  },
  
  trusted_wrong: {
    id: 'trusted_wrong',
    type: 'narration',
    scene: 'memorial_park',
    act: 1,
    text: 'Доверял. Десять лет.\n\nИ другу. Ближайшему.\n\nОни забрали всё. И ушли вместе.\n\nА я остался с вопросами.',
    autoNext: 'go_home',
  },
  
  // ========== ДОМ И ОДИНОЧЕСТВО ==========
  
  go_home: {
    id: 'go_home',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Квартира встречает тишиной. Я включаю свет.\n\nНа столе — недопитая чашка с утра.\n\nНа стене — календарь. Декабрь 2026.\n\nВосемь лет.',
    autoNext: 'home_alone',
  },
  
  home_alone: {
    id: 'home_alone',
    type: 'dialogue',
    scene: 'home_evening',
    speaker: 'Внутренний голос',
    act: 1,
    text: '"Восемь лет один.\n\nТы смирился? Или просто устал бороться?"',
    choices: [
      createChoice('Смирился — это моя жизнь', 'accepted_fate', { stability: 5 }),
      createChoice('Не смирился — но сил нет', 'no_strength', { stress: 10, creativity: 3 }),
      createChoice('Каждый день по-разному', 'every_day_different', { stability: 2 }),
    ],
  },
  
  accepted_fate: {
    id: 'accepted_fate',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Может, это и есть судьба.\n\nОдин. Работа. Стихи, которые никто не читает.\n\nНеплохая жизнь. Могло быть хуже.',
    autoNext: 'evening_choice',
  },
  
  no_strength: {
    id: 'no_strength',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Сил нет. Но что-то держит.\n\nМожет, привычка. Может, надежда.\n\nИли просто страх закончить всё.',
    autoNext: 'evening_choice',
  },
  
  every_day_different: {
    id: 'every_day_different',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Иногда — спокойно. Иногда — невыносимо.\n\nСегодня — средне. Можно жить.',
    autoNext: 'evening_choice',
  },
  
  evening_choice: {
    id: 'evening_choice',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Вечер ahead.\n\nЗа окном — шум города. В голове — тишина.\n\nНа столе — старый блокнот. Рядом — ручка.\n\nЯ вспоминаю афишу в парке. "Литературный вечер. Кафе \'Синий кот\'."\n\nПятница. 19:00.\n\nЭто завтра.\n\nЧем заняться?',
    choices: [
      createChoice('Писать — настроение подходящее', 'write_evening', { creativity: 5 }),
      createChoice('Посмотреть старые фото', 'old_photos_trigger', { stress: 15 }),
      createChoice('Просто лечь спать', 'sleep_alone', { energy: 2 }),
    ],
  },
  
  write_evening: {
    id: 'write_evening',
    type: 'poem_game',
    scene: 'home_evening',
    act: 1,
    lines: poemGameLines_1,
    autoNext: 'write_evening_result',
  },
  
  write_evening_result: {
    id: 'write_evening_result',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Слова выходят тяжело. Но выходят.\n\nВпервые за долгое время я чувствую, что могу выразить боль.\n\nМожет, в этом есть смысл.',
    effect: { creativity: 10, stress: -20 },
    autoNext: 'sleep_alone',
  },
  
  // ========== ВОСПОМИНАНИЯ ОБ ОТНОШЕНИЯХ ==========
  
  old_photos_trigger: {
    id: 'old_photos_trigger',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Я открываю галерею в телефоне.\n\nПрокручиваю назад.\n\n2026. 2025. 2024...\n\n2018. Вот они.',
    autoNext: 'relationship_start',
  },
  
  relationship_start: {
    id: 'relationship_start',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    cutscene: 'love_beginning',
    text: 'Мы на фото. Я и она.\n\nМне 18. Ей 17. Лето, школа закончилась.\n\nМы только начали встречаться.\n\nЯ помню тот день. Она улыбалась и держала меня за руку.\n\n"Навсегда" — сказала она.',
    autoNext: 'relationship_develop',
  },
  
  relationship_develop: {
    id: 'relationship_develop',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Следующее фото. Год спустя.\n\nИнститут. Мы вместе готовимся к экзаменам.\n\nОна помогает мне с историей. Я ей — с математикой.\n\nМы планировали будущее. Семью. Дом. Детей.\n\nВсё было возможно.',
    autoNext: 'relationship_middle',
  },
  
  relationship_middle: {
    id: 'relationship_middle',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Ещё фото. Мне 25. Ей 24.\n\nМы снимаем квартиру вместе. Первая общая квартира.\n\nОна готовит ужин. Я читаю вслух свои стихи.\n\nОна смеётся и говорит: "Ты станешь великим поэтом."\n\nЯ верил ей.',
    autoNext: 'andrey_appears',
  },
  
  andrey_appears: {
    id: 'andrey_appears',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Я листаю дальше.\n\nВот фото с работы. Я и Андрей.\n\nМы вместе работали над проектом. Писали код, пили пиво после работы.\n\nОн был моим другом. Ближайшим.\n\nЯ рассказывал ему всё. Про неё. Про нас. Про планы.\n\nОн слушал и кивал.',
    autoNext: 'breakup_memory',
  },
  
  breakup_memory: {
    id: 'breakup_memory',
    type: 'dialogue',
    scene: 'home_evening',
    speaker: 'Голос в памяти',
    act: 1,
    text: '"Володя, нам нужно поговорить."\n\nТелефон в руке. Её голос.\n\n"Я встретила кого-то. Это... это Андрей. Он понимает меня так, как ты не можешь."\n\nМир остановился.',
    choices: [
      createChoice('Вспомнить дальше', 'remember_all', { stress: 30 }),
      createChoice('Хватит — закрыть', 'close_gallery', { stability: 3 }),
    ],
  },
  
  remember_all: {
    id: 'remember_all',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: '10 лет. С 18 до 28.\n\nШкола. Институт. Первая работа. Первая квартира.\n\nОна была всем. Я планировал семью.\n\nА потом — один телефонный звонок.\n\n"Андрей понимает меня."\n\nОн был моим другом.\n\nОн знал всё. И забрал её.',
    autoNext: 'friends_betrayal',
  },
  
  close_gallery: {
    id: 'close_gallery',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Я закрываю телефон.\n\nДостаточно.\n\nНа сегодня — достаточно.',
    autoNext: 'sleep_alone',
  },
  
  friends_betrayal: {
    id: 'friends_betrayal',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    cutscene: 'betrayal',
    text: 'После расставания я пытался говорить с друзьями.\n\n"Мужик, хватит ныть. Прошло уже полгода."\n\n"Она счастлива с Андреем. Тусить с ней весело."\n\n"Ты душница. Иди выпей."\n\nОдин за другим они уходили.\n\nК 30 годам я остался один.',
    autoNext: 'alone_years',
  },
  
  alone_years: {
    id: 'alone_years',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    cutscene: 'loneliness_years',
    text: '8 лет. Год за годом.\n\n2019 — учился жить один. Пытался забыть.\n\n2020 — работа, работа, работа. Тикеты, тикеты, тикеты.\n\n2021 — первые стихи. Никто не читал.\n\n2022 — мир изменился. Одиночество стало нормой.\n\n2023, 2024, 2025 — рутина. Работа. Дом. Работа.\n\n2026 — я всё ещё здесь.',
    choices: [
      createChoice('Написать об этом', 'write_about_it', { creativity: 10 }),
      createChoice('Просто лечь спать', 'sleep_alone', { energy: 2 }),
    ],
  },
  
  write_about_it: {
    id: 'write_about_it',
    type: 'poem_game',
    scene: 'home_evening',
    act: 1,
    lines: poemGameLines_2,
    autoNext: 'writing_helped',
  },
  
  writing_helped: {
    id: 'writing_helped',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Слова выходят тяжело. Но выходят.\n\nВпервые за долгое время — я чувствую, что могу выразить.\n\nМожет, в этом есть смысл.\n\nМожет, кто-то услышит.',
    effect: { creativity: 10, stress: -20 },
    autoNext: 'sleep_alone',
  },
  
  sleep_alone: {
    id: 'sleep_alone',
    type: 'narration',
    scene: 'home_evening',
    act: 1,
    text: 'Я ложусь в кровать. Холодные простыни.\n\nТишина квартиры давит на уши.\n\nСон приходит медленно.\n\nЗавтра снова работа. Снова тикеты.\n\nСнова жизнь.',
    effect: { energy: 2 },
    autoNext: 'friday_arrives',
  },
  
  // ========== АКТ 2: ПЯТНИЦА ==========
  
  friday_arrives: {
    id: 'friday_arrives',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Пятница. Конец рабочей недели.\n\nКоллеги расходятся — кто домой, кто в бары.\n\nЯ выхожу из офиса.\n\nГород живёт — огни, музыка, смех, пары.\n\nКуда пойти?',
    choices: [
      createChoice('Домой — там привычно', 'home_friday', { stability: 3 }),
      createChoice('В кафе "Синий кот" — литературный вечер', 'blue_cat_cafe', { creativity: 3 }),
      createChoice('Пройти по набережной', 'waterfront_walk', { mood: 3 }),
    ],
  },
  
  home_friday: {
    id: 'home_friday',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Дом. Чай. Книга.\n\nОбычный вечер обычного человека.\n\nЯ открываю книгу. Читаю.\n\nСлова проходят мимо.\n\nВсё в порядке.',
    autoNext: 'sleep_alone_act2',
  },
  
  waterfront_walk: {
    id: 'waterfront_walk',
    type: 'narration',
    scene: 'street_night',
    act: 2,
    text: 'Нева. Чёрная вода. Огни мостов.\n\nЯ иду по набережной. Холодный ветер.\n\nГород прекрасен ночью.\n\nНо он не мой.',
    autoNext: 'waterfront_thought',
  },
  
  waterfront_thought: {
    id: 'waterfront_thought',
    type: 'dialogue',
    scene: 'street_night',
    speaker: 'Внутренний голос',
    act: 2,
    text: '"12 лет в техподдержке. 10 лет отношений. 8 лет одиночества.\n\nЧто дальше?"',
    choices: [
      createChoice('Дальше — жить', 'keep_living', { stability: 5 }),
      createChoice('Дальше — писать', 'keep_writing', { creativity: 10 }),
      createChoice('Не знаю. Но я всё ещё здесь', 'still_here', { stability: 3 }),
    ],
  },
  
  keep_living: {
    id: 'keep_living',
    type: 'narration',
    scene: 'street_night',
    act: 2,
    text: 'Один день за другим.\n\nТикет за тикетом.\n\nЭто жизнь. Моя жизнь.\n\nИ в ней есть смысл — даже если я его не всегда вижу.',
    autoNext: 'sleep_alone_act2',
  },
  
  keep_writing: {
    id: 'keep_writing',
    type: 'narration',
    scene: 'street_night',
    act: 2,
    text: 'Слова. Они всегда были моим убежищем.\n\nМожет, теперь — и моим голосом.\n\nЯ достаю блокнот и начинаю писать.\n\nПрямо здесь. На набережной.',
    autoNext: 'sleep_alone_act2',
  },
  
  still_here: {
    id: 'still_here',
    type: 'narration',
    scene: 'street_night',
    act: 2,
    text: 'Я здесь. После всего.\n\nЭто что-то значит.\n\nМожет, не всё потеряно.',
    autoNext: 'sleep_alone_act2',
  },
  
  sleep_alone_act2: {
    id: 'sleep_alone_act2',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Я возвращаюсь домой.\n\nКровать. Холодные простыни. Тишина.\n\nЗавтра — выходной.\n\nМожно поспать подольше.',
    autoNext: 'saturday_morning',
  },
  
  saturday_morning: {
    id: 'saturday_morning',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Суббота. Утро.\n\nСолнце пробивается через шторы.\n\nЯ лежу и смотрю в потолок.\n\nЧто делать с выходным?',
    choices: [
      createChoice('Остаться дома', 'stay_home_saturday', { stability: 3 }),
      createChoice('Пойти в кафе "Синий кот"', 'blue_cat_cafe', { creativity: 3 }),
    ],
  },
  
  stay_home_saturday: {
    id: 'stay_home_saturday',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Дом. Кофе. Книга.\n\nСуббота проходит медленно.\n\nЯ читаю. Пишу. Думаю.\n\nНеплохой день.',
    autoNext: 'evening_choice_act2',
  },
  
  // ========== КАФЕ "СИНИЙ КОТ" ==========
  
  blue_cat_cafe: {
    id: 'blue_cat_cafe',
    type: 'narration',
    scene: 'cafe_evening',
    act: 2,
    text: 'Кафе "Синий кот" в подвале старого дома.\n\nТёплый свет. Запах кофе. Приглушённая музыка.\n\nНа маленькой сцене — микрофон.\n\nЛюди сидят группами, слушают.\n\nОдин за другим выходят читать стихи.',
    autoNext: 'cafe_atmosphere',
  },
  
  cafe_atmosphere: {
    id: 'cafe_atmosphere',
    type: 'narration',
    scene: 'cafe_evening',
    act: 2,
    text: 'Я выбираю столик у стены. Заказываю кофе.\n\nСлушаю. Чужие слова, чужие боли.\n\nОни не так уж отличаются от моих.\n\nМожет, я не так одинок, как думал.',
    autoNext: 'open_mic',
  },
  
  open_mic: {
    id: 'open_mic',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Ведущий',
    act: 2,
    text: '"Есть ли кто-то ещё, кто хотел бы прочитать?"\n\nОн обводит взглядом зал.\n\nТишина.\n\nЯ смотрю на блокнот в рюкзаке.\n\nТам — мои стихи. Моя жизнь.',
    choices: [
      createChoice('Поднять руку', 'read_poetry', { creativity: 10, stress: 15 }),
      createChoice('Не сейчас', 'not_now', { stability: 3 }),
    ],
  },
  
  read_poetry: {
    id: 'read_poetry',
    type: 'narration',
    scene: 'cafe_evening',
    act: 2,
    text: 'Микрофон в руках. Свет софита в глаза.\n\nСердце колотится. Руки дрожат.\n\nЯ начинаю читать.\n\nОдиночество. Потеря. Детство. IT-поддержка.\n\nОна. Он. Друзья. 8 лет.\n\nВсё выходит.',
    autoNext: 'after_reading',
  },
  
  after_reading: {
    id: 'after_reading',
    type: 'narration',
    scene: 'cafe_evening',
    act: 2,
    text: 'Тишина.\n\nСекунда. Две.\n\nПотом — аплодисменты.\n\nНе бурные, но искренние.\n\nКто-то улыбается. Кто-то кивает.\n\nКо мне подходит женщина с тёмными волосами.',
    effect: { mood: 10, karma: 5 },
    autoNext: 'stranger_approach',
  },
  
  stranger_approach: {
    id: 'stranger_approach',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: '"Это было... настоящее."\n\nОна улыбается.\n\n"Ты пишешь о том, что чувствуешь. Это редкость.\n\nМеня зовут Мария. Я тоже пишу. Иногда."',
    choices: [
      createChoice('"Спасибо. Твои слова много значат."', 'maria_thanks', { karma: 5 }),
      createChoice('"Просто записал то, что внутри."', 'maria_humble', { npcId: 'maria', npcChange: 5 }),
      createChoice('"Ты тоже читаешь здесь?"', 'maria_curious', { creativity: 3 }),
    ],
  },
  
  maria_thanks: {
    id: 'maria_thanks',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: '"Не многие решаются говорить о боли. О настоящей боли.\n\nБольшинство прячется за красивыми фразами.\n\nБуду рада увидеть тебя здесь снова."',
    effect: { npcId: 'maria', npcChange: 10 },
    autoNext: 'cafe_end',
  },
  
  maria_humble: {
    id: 'maria_humble',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: '"Не принижай. То, что ты делаешь — важно.\n\nДля тебя. И для тех, кто слушает.\n\nУ тебя есть голос. Используй его."',
    autoNext: 'cafe_end',
  },
  
  maria_curious: {
    id: 'maria_curious',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: '"Иногда. Но я больше слушаю. Наблюдаю.\n\nТвои слова... о восьми годах одиночества. О предательстве.\n\nЯ тоже знаю, как это."\n\nОна не уточняет. Я не спрашиваю.',
    autoNext: 'cafe_end',
  },
  
  not_now: {
    id: 'not_now',
    type: 'narration',
    scene: 'cafe_evening',
    act: 2,
    text: 'Я остаюсь в тени.\n\nНе готов. Не сейчас.\n\nНо слушаю. И что-то внутри шевелится.\n\nМожет, в следующий раз.',
    autoNext: 'cafe_end',
  },
  
  cafe_end: {
    id: 'cafe_end',
    type: 'narration',
    scene: 'street_night',
    act: 2,
    text: 'Вечер заканчивается.\n\nЯ выхожу из кафе.\n\nНочной город. Снег. Тишина.\n\nНо что-то изменилось.\n\nВпервые за 8 лет — кто-то услышал.',
    autoNext: 'evening_choice_act2',
  },
  
  evening_choice_act2: {
    id: 'evening_choice_act2',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Воскресенье.\n\nЯ просыпаюсь. За окном — серый день.\n\nНа столе — недописанные стихи.\n\nВ телефоне — напоминание о работе завтра.\n\nНо что-то другое.',
    autoNext: 'reflection',
  },
  
  reflection: {
    id: 'reflection',
    type: 'dialogue',
    scene: 'home_evening',
    speaker: 'Внутренний голос',
    act: 2,
    text: '"Ты прочитал свои стихи перед людьми.\n\nКто-то услышал.\n\nЭто что-то меняет?"',
    choices: [
      createChoice('Не знаю. Но я попробую ещё', 'try_again', { creativity: 5 }),
      createChoice('Может. Один раз — не считается', 'one_time', { stability: 3 }),
      createChoice('Это было... не так страшно', 'not_scary', { stability: 5, creativity: 3 }),
    ],
  },
  
  try_again: {
    id: 'try_again',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Я открываю блокнот.\n\nНовые слова приходят.\n\nМожет, в этом есть смысл.\n\nМожет, кто-то ещё услышит.',
    autoNext: 'ending',
  },
  
  one_time: {
    id: 'one_time',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Один раз. Может, и последний.\n\nНо это был хороший вечер.\n\nЯ не жалею.',
    autoNext: 'ending',
  },
  
  not_scary: {
    id: 'not_scary',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: 'Не страшно.\n\nСтранно.\n\nЯ думал, будет хуже.\n\nОказалось — можно.',
    autoNext: 'ending',
  },
  
  // ========== ФИНАЛ ==========
  
  ending: {
    id: 'ending',
    type: 'ending',
    scene: 'rooftop_night',
    act: 3,
    cutscene: 'finale',
    text: '12 лет в техподдержке.\n10 лет любви, которая закончилась.\n8 лет одиночества.\n\nЯ всё ещё здесь.\n\nЯ пишу эти строки, потому что — должен.\nПотому что кто-то должен услышать.\n\nМожет, это ты.\n\nСпасибо, что был со мной.\n\n— Володька\n\n"Смерть есть лишь начало. Верить бы в это хотелось."',
  },
  
  // ========== РЕЖИМ ИССЛЕДОВАНИЯ ==========
  // Этот узел используется когда игрок хочет свободно исследовать мир
  // Панель повествования будет скрыта
  
  explore_mode: {
    id: 'explore_mode',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: '', // Пустой текст - панель не будет показана
    // Нет autoNext и нет choices - позволяет свободно исследовать
  },
  
  // ========== NPC STORY TRIGGERS ==========
  // Story nodes triggered after talking to specific NPCs
  
  // kitchen_maria trigger - insomnia/night thoughts
  story_maria_insomnia: {
    id: 'story_maria_insomnia',
    type: 'narration',
    scene: 'kitchen_night',
    act: 1,
    text: 'Ночь. Тишина квартиры.\n\nЯ сижу на кухне, смотрю на остывший чай.\n\nМысли не дают покоя. Бессонница — давний спутник.\n\nВ окне — свет фонарей. Где-то там — другие жизни. Другие истории.\n\nА здесь — только я и тишина.',
    choices: [
      createChoice('Попытаться уснуть', 'explore_mode', { stability: 5, energy: 1 }),
      createChoice('Написать несколько строк', 'explore_mode', { creativity: 10 }),
      createChoice('Просто сидеть и думать', 'explore_mode', { mood: -5, stability: -5 }),
    ],
  },
  
  // cafe_barista trigger - about the cafe
  story_cafe_barista: {
    id: 'story_cafe_barista',
    type: 'narration',
    scene: 'cafe_evening',
    act: 1,
    text: 'Кафе "Синий кот".\n\nМесто, где собираются те, кто ищет смысл в словах.\n\nЗапах кофе, приглушённый свет, шум разговоров.\n\nЗдесь можно быть собой. Здесь слушают.\n\nИногда мне кажется, что это единственное место в городе, где я действительно дышу.',
    choices: [
      createChoice('Заказать кофе и остаться', 'explore_mode', { mood: 10, stress: -10 }),
      createChoice('Послушать выступающих', 'explore_mode', { creativity: 5 }),
      createChoice('Уйти', 'explore_mode'),
    ],
  },
  
  // cafe_poet trigger - about poetry
  story_cafe_poet: {
    id: 'story_cafe_poet',
    type: 'narration',
    scene: 'cafe_evening',
    act: 1,
    text: 'Поэзия.\n\nСлова, которые становятся больше, чем просто буквы.\n\nЯ пишу, потому что не могу не писать.\n\nКаждая строка — крик. Каждое слово — попытка быть услышанным.\n\nМожет, кто-то узнает себя в этих строках. Может, кто-то почувствует, что не одинок.',
    choices: [
      createChoice('Продолжить писать', 'explore_mode', { creativity: 15, mood: 5 }),
      createChoice('Поделиться стихами', 'explore_mode', { karma: 5 }),
      createChoice('Спрятать блокнот', 'explore_mode', { stability: 5 }),
    ],
  },
  
  // office_colleague trigger - about work
  story_office_colleague: {
    id: 'story_office_colleague',
    type: 'narration',
    scene: 'office_morning',
    act: 1,
    text: 'Офис. Мониторы. Тикеты.\n\n12 лет в техподдержке.\n\nИногда мне кажется, что я мог бы быть кем-то другим. Делать что-то другое.\n\nНо это — моя работа. Моя стабильность. Мой якорь.\n\nВ этом есть своя поэзия. Помогать людям решать их проблемы.',
    choices: [
      createChoice('Вернуться к работе', 'explore_mode', { stability: 5, stress: 5 }),
      createChoice('Подумать о переменах', 'explore_mode', { creativity: 5, stability: -5 }),
      createChoice('Просто принять как есть', 'explore_mode', { karma: 5 }),
    ],
  },
  
  // park_elder trigger - about memories
  story_park_elder: {
    id: 'story_park_elder',
    type: 'narration',
    scene: 'memorial_park',
    act: 1,
    text: 'Мемориальный парк.\n\nМесто памяти. Место тишины.\n\nЗдесь хранятся истории тех, кто ушёл.\n\nЯ смотрю на памятники и думаю о своём.\n\nО бабушке. О детстве. О том, что было потеряно.',
    choices: [
      createChoice('Почтить память', 'explore_mode', { karma: 10, mood: 5 }),
      createChoice('Вспомнить прошлое', 'explore_mode', { creativity: 10, stress: 10 }),
      createChoice('Продолжить путь', 'explore_mode'),
    ],
  },
  
  // dream_lillian trigger - about dreams
  story_dream_lillian: {
    id: 'story_dream_lillian',
    type: 'narration',
    scene: 'dream',
    act: 1,
    text: 'Мир снов.\n\nЗдесь реальность другая. Здесь возможно то, что невозможно.\n\nЛилиан говорила о потерянных воспоминаниях.\n\nМожет, здесь я найду то, что потерял.\n\nМожет, здесь я встречу тех, кого больше нет.',
    choices: [
      createChoice('Исследовать мир снов', 'explore_mode', { creativity: 15, stability: -5 }),
      createChoice('Искать ответы', 'explore_mode', { karma: 5 }),
      createChoice('Проснуться', 'explore_mode', { stability: 10 }),
    ],
  },
};
