/* ─── Volodka RPG – Quiz Questions for Cyberpunk Trivia Mini-game ─── */

export interface QuizQuestion {
  id: string;
  question: string;       // Russian question text
  options: string[];      // 4 Russian options
  correctIndex: number;   // Index of correct answer (0-3)
  category: 'technology' | 'society' | 'history' | 'poetry' | 'hacking' | 'city';
  difficulty: 1 | 2 | 3; // Easy / Medium / Hard
  loreId?: string;        // Optional link to lore entry
  reward: { xp: number; karma: number };
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ═══════════════════════════════════════════════════════════════
  // TECHNOLOGY — Easy (difficulty 1)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_tech_01',
    question: 'Как называется нейрочип, вживляемый в затылочную кость корпорацией «НейроСис»?',
    options: ['НейроМост', 'Синапс-7', 'Квантовый Ключ', 'Цифровой Страж'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 1,
    loreId: 'lore_neurosys_chips',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_tech_02',
    question: 'Какой побочный эффект чипа «НейроМост» называется «шёпотом»?',
    options: ['Периодическое восприятие чужих мыслей', 'Постоянный шум в ушах', 'Галлюцинации', 'Потеря памяти'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 1,
    loreId: 'lore_neurosys_chips',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_tech_03',
    question: 'Как называется ИИ-система, контролирующая городскую инфраструктуру?',
    options: ['Паноптикум', 'Аргус', 'Омниглаз', 'Смотритель'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 1,
    loreId: 'lore_ai_surveillance',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_tech_04',
    question: 'Сколько камер контролирует система «Паноптикум»?',
    options: ['72 000', '50 000', '100 000', '36 000'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 2,
    loreId: 'lore_ai_surveillance',
    reward: { xp: 15, karma: 3 },
  },

  // ═══════════════════════════════════════════════════════════════
  // TECHNOLOGY — Medium (difficulty 2)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_tech_05',
    question: 'Что НЕ умеет система «Паноптикум»?',
    options: ['Понимать стихи', 'Предсказывать преступления', 'Считывать мысли через чип', 'Отслеживать перемещения'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 2,
    loreId: 'lore_ai_surveillance',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_tech_06',
    question: 'Как называется система управления погодой, развёрнутая НейроСис в Уфе?',
    options: ['Атмосфера-У', 'Климат-Контроль', 'МетеоЩит', 'Зона-Зенит'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 2,
    loreId: 'lore_weather_control',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_tech_07',
    question: 'Сколько атмосферных вышек содержит система «Атмосфера-У»?',
    options: ['200', '150', '300', '500'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 2,
    loreId: 'lore_weather_control',
    reward: { xp: 15, karma: 3 },
  },

  // ═══════════════════════════════════════════════════════════════
  // TECHNOLOGY — Hard (difficulty 3)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_tech_08',
    question: 'Как называется советский квантовый вычислитель, работающий с 1986 года без остановки?',
    options: ['Заря-М', 'Сириус-К', 'Квант-1', 'Орион-7'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 3,
    loreId: 'lore_quantum_computer',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_tech_09',
    question: 'На чём основаны кубиты вычислителя «Заря-М»?',
    options: ['Сверхпроводящие соленоиды', 'Оптические лазеры', 'Углеродные нанотрубки', 'Графеновые плёнки'],
    correctIndex: 0,
    category: 'technology',
    difficulty: 3,
    loreId: 'lore_quantum_computer',
    reward: { xp: 25, karma: 5 },
  },

  // ═══════════════════════════════════════════════════════════════
  // HISTORY — Easy (difficulty 1)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_hist_01',
    question: 'Как называется неофициальная столица кибер-провинции?',
    options: ['Уфа', 'Казань', 'Екатеринбург', 'Новосибирск'],
    correctIndex: 0,
    category: 'history',
    difficulty: 1,
    loreId: 'lore_city_ufa',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_hist_02',
    question: 'Какую фразу говорят местные жители об Уфе?',
    options: ['«Уфа не спит — она зависает»', '«Уфа не дышит — она кэширует»', '«Уфа не ждёт — она рендерит»', '«Уфа не молчит — она транслирует»'],
    correctIndex: 0,
    category: 'history',
    difficulty: 1,
    loreId: 'lore_city_ufa',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_hist_03',
    question: 'В каком году произошёл Великий Сбой?',
    options: ['2029', '2031', '2025', '2033'],
    correctIndex: 0,
    category: 'history',
    difficulty: 1,
    loreId: 'lore_great_crash_2029',
    reward: { xp: 10, karma: 2 },
  },

  // ═══════════════════════════════════════════════════════════════
  // HISTORY — Medium (difficulty 2)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_hist_04',
    question: 'Сколько строк содержалось в стихотворении, вызвавшем Великий Сбой?',
    options: ['18', '21', '12', '7'],
    correctIndex: 0,
    category: 'history',
    difficulty: 2,
    loreId: 'lore_great_crash_2029',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_hist_05',
    question: 'За сколько минут стихотворение переписало маршрутизацию 200 000 узлов?',
    options: ['12 минут 47 секунд', '8 минут 13 секунд', '20 минут ровно', '5 минут 33 секунды'],
    correctIndex: 0,
    category: 'history',
    difficulty: 2,
    loreId: 'lore_great_crash_2029',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_hist_06',
    question: 'Как называется пространство, созданное в Сети во время Великого Сбоя?',
    options: ['Мир Снов', 'Теневые Потоки', 'Коридор', 'Архив-7'],
    correctIndex: 0,
    category: 'history',
    difficulty: 2,
    loreId: 'lore_great_crash_2029',
    reward: { xp: 15, karma: 3 },
  },

  // ═══════════════════════════════════════════════════════════════
  // SOCIETY / FACTIONS — Easy
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_soc_01',
    question: 'Какая организация контролирует 80% цифровой инфраструктуры города?',
    options: ['IT-гильдия «Кодекс»', 'Корпорация «НейроСис»', 'Цифровое Сопротивление', 'Крышное Сообщество'],
    correctIndex: 0,
    category: 'society',
    difficulty: 1,
    loreId: 'lore_it_guild',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_soc_02',
    question: 'Как называется подпольная организация, борющаяся за цифровую свободу?',
    options: ['Чёрная Чернильница', 'Красная Строка', 'Белый Шум', 'Серая Сеть'],
    correctIndex: 0,
    category: 'society',
    difficulty: 1,
    loreId: 'lore_digital_resistance',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_soc_03',
    question: 'Как называют лидера организации «Чёрная Чернильница»?',
    options: ['Редактор', 'Автор', 'Издатель', 'Шеф'],
    correctIndex: 0,
    category: 'society',
    difficulty: 1,
    loreId: 'lore_digital_resistance',
    reward: { xp: 10, karma: 2 },
  },

  // ═══════════════════════════════════════════════════════════════
  // SOCIETY — Medium
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_soc_04',
    question: 'Сколько активных членов насчитывает «Чёрная Чернильница»?',
    options: ['3 000', '500', '10 000', '1 200'],
    correctIndex: 0,
    category: 'society',
    difficulty: 2,
    loreId: 'lore_digital_resistance',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_soc_05',
    question: 'Как называют себя жители лагеря на крышах высоток Уфы?',
    options: ['Высотники', 'Воздушники', 'Небожители', 'Шпили'],
    correctIndex: 0,
    category: 'society',
    difficulty: 2,
    loreId: 'lore_rooftop_community',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_soc_06',
    question: 'Что служит «паролем» для вступления в сообщество «Высотников»?',
    options: ['Прочесть стихотворение наизусть', 'Принести квантовый чип', 'Взломать сервер гильдии', 'Прожить неделю без чипа'],
    correctIndex: 0,
    category: 'society',
    difficulty: 2,
    loreId: 'lore_rooftop_community',
    reward: { xp: 15, karma: 3 },
  },

  // ═══════════════════════════════════════════════════════════════
  // POETRY — Medium/Hard
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_poet_01',
    question: 'Сколько «стихотворений силы», по легенде, способны переписать базовую структуру Сети?',
    options: ['21', '18', '13', '7'],
    correctIndex: 0,
    category: 'poetry',
    difficulty: 2,
    loreId: 'lore_18_poems',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_poet_02',
    question: 'Сколько стихов входят в «основной цикл» стихотворений силы?',
    options: ['13', '21', '8', '10'],
    correctIndex: 0,
    category: 'poetry',
    difficulty: 3,
    loreId: 'lore_18_poems',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_poet_03',
    question: 'В каком году впервые зарегистрирован феномен «стиховируса»?',
    options: ['2031', '2029', '2033', '2027'],
    correctIndex: 0,
    category: 'poetry',
    difficulty: 2,
    loreId: 'lore_poem_virus',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_poet_04',
    question: 'Чем стихи Владимира отличаются от стихов других авторов в контексте фильтров НейроСис?',
    options: [
      'Они проходят фильтр без искажений',
      'Они отключают фильтры на 10 секунд',
      'Они невидимы для системы «Паноптикум»',
      'Они усиливают действие чипа',
    ],
    correctIndex: 0,
    category: 'poetry',
    difficulty: 3,
    loreId: 'lore_poem_virus',
    reward: { xp: 25, karma: 5 },
  },

  // ═══════════════════════════════════════════════════════════════
  // HACKING — Medium/Hard
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_hack_01',
    question: 'Как называется децентрализованная сеть для общения хакеров и поэтов?',
    options: ['Теневые Потоки', 'Тёмная Паутина', 'Глубинная Сеть', 'Нулевой Протокол'],
    correctIndex: 0,
    category: 'hacking',
    difficulty: 2,
    loreId: 'lore_network',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_hack_02',
    question: 'Что становится «узлом» в Сети «Теневые Потоки»?',
    options: ['Каждое загруженное стихотворение', 'Каждый серверный кластер', 'Каждый чип «НейроМост»', 'Каждая камера «Паноптикума»'],
    correctIndex: 0,
    category: 'hacking',
    difficulty: 2,
    loreId: 'lore_network',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_hack_03',
    question: 'Какой прозвище носил бывший хакер — владелец кафе «Синяя яма»?',
    options: ['Глубина', 'Тень', 'Призрак', 'Скрипт'],
    correctIndex: 0,
    category: 'hacking',
    difficulty: 2,
    loreId: 'lore_cafe_history',
    reward: { xp: 15, karma: 3 },
  },

  // ═══════════════════════════════════════════════════════════════
  // CITY — Easy/Medium
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_city_01',
    question: 'Как называется единственное место в городе, где серверы гильдии не работают?',
    options: ['Кафе «Синяя яма»', 'Библиотека имени Ленина', 'Завод «Хром-М»', 'Башня «Ирендык»'],
    correctIndex: 0,
    category: 'city',
    difficulty: 1,
    loreId: 'lore_cafe_blue_hole',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_city_02',
    question: 'Где находится филиал корпорации «НейроСис» в Уфе?',
    options: ['Три верхних этажа башни «Ирендык»', 'Подвал завода «Хром-М»', 'Здание гильдии «Кодекс»', 'Крышный лагерь «Высотников»'],
    correctIndex: 0,
    category: 'city',
    difficulty: 1,
    loreId: 'lore_neurosys_corp',
    reward: { xp: 10, karma: 2 },
  },
  {
    id: 'q_city_03',
    question: 'Сколько пользователей чипа «НейроМост» по всему миру?',
    options: ['340 миллионов', '100 миллионов', '1 миллиард', '50 миллионов'],
    correctIndex: 0,
    category: 'city',
    difficulty: 2,
    loreId: 'lore_neurosys_corp',
    reward: { xp: 15, karma: 3 },
  },
  {
    id: 'q_city_04',
    question: 'Что изображено на флаге мачты самого высокого здания «Высотников»?',
    options: ['Белый лист бумаги со словом «ЖИВЫ»', 'Чёрный ворон на фоне луны', 'Красная молния', 'Зелёный глаз'],
    correctIndex: 0,
    category: 'city',
    difficulty: 2,
    loreId: 'lore_rooftop_community',
    reward: { xp: 15, karma: 3 },
  },

  // ═══════════════════════════════════════════════════════════════
  // HARD — Mixed categories
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'q_hard_01',
    question: 'Как называется проект Дмитрия — параллельная база данных, зашифрованная в ДНК бактерий?',
    options: ['Архив-7', 'Кодекс-0', 'Семя-М', 'Геном-Х'],
    correctIndex: 0,
    category: 'hacking',
    difficulty: 3,
    loreId: 'lore_dmitry_project',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_hard_02',
    question: 'Какое пятое и самое опасное правило Мира Снов?',
    options: ['Нельзя заснуть во сне', 'Нельзя смотреть в зеркала', 'Нельзя читать стихи вслух', 'Нельзя возвращаться дважды'],
    correctIndex: 0,
    category: 'poetry',
    difficulty: 3,
    loreId: 'lore_dream_rules',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_hard_03',
    question: 'Как называют сущностей из потерянных данных, обитающих в глубинах Мира Снов?',
    options: ['Глуши', 'Тени', 'Эхо', 'Фантомы'],
    correctIndex: 0,
    category: 'poetry',
    difficulty: 3,
    loreId: 'lore_dream_rules',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_hard_04',
    question: 'Что произошло с Маратом «Глубина» Галиевым в 2033 году?',
    options: [
      'Он загрузил себя в Сеть целиком',
      'Он был арестован НейроСис',
      'Он эмигрировал в Шэньчжэнь',
      'Он стал главой гильдии «Кодекс»',
    ],
    correctIndex: 0,
    category: 'society',
    difficulty: 3,
    loreId: 'lore_cafe_history',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_hard_05',
    question: 'Какой уличной банде принадлежит прозвище «Кодоноль»?',
    options: ['Подросткам-хакерам из канализации', 'Сборщикам металлолома с востока', 'Носителям термокостюмов с шипами', 'Граффитчикам с наночернилами'],
    correctIndex: 0,
    category: 'society',
    difficulty: 3,
    loreId: 'lore_street_gangs',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_hard_06',
    question: 'С какой частотой мигает лампочка в коридоре коммуналки — лиминальном пространстве?',
    options: ['432 герца', '256 герц', '528 герц', '396 герц'],
    correctIndex: 0,
    category: 'city',
    difficulty: 3,
    loreId: 'lore_corridor_liminal',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_hard_07',
    question: 'Какое кодовое имя носит Виктория-бариста в Сети?',
    options: ['Руслана', 'Тень', 'Фантом', 'Глушь'],
    correctIndex: 0,
    category: 'hacking',
    difficulty: 3,
    loreId: 'lore_maria_secret',
    reward: { xp: 25, karma: 5 },
  },
  {
    id: 'q_hard_08',
    question: 'Сколько терабайт данных о Проекте «Лотос» вынесла Виктория из серверов НейроСис?',
    options: ['2 терабайта', '500 гигабайт', '10 терабайт', '1 петабайт'],
    correctIndex: 0,
    category: 'hacking',
    difficulty: 3,
    loreId: 'lore_maria_secret',
    reward: { xp: 25, karma: 5 },
  },
];

/**
 * Select a random pool of quiz questions filtered by max difficulty.
 * @param difficulty - 1=Новичок (easy), 2=Оператор (mixed), 3=Мастер (hard)
 * @param count - Number of questions to return
 */
export function getQuizPool(difficulty: number, count: number): QuizQuestion[] {
  let pool: QuizQuestion[];

  if (difficulty === 1) {
    // Новичок: only easy questions
    pool = QUIZ_QUESTIONS.filter((q) => q.difficulty === 1);
  } else if (difficulty === 2) {
    // Оператор: easy + medium
    pool = QUIZ_QUESTIONS.filter((q) => q.difficulty <= 2);
  } else {
    // Мастер: all difficulties, but weighted toward hard
    pool = [...QUIZ_QUESTIONS];
  }

  // Shuffle (Fisher-Yates) and take `count`
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
