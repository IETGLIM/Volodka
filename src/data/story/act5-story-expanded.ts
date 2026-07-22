import type { StoryNode } from '@/shared/types/game';

/**
 * Act 5 — Expanded story nodes: the Network goes underground.
 *
 * Factory «Заря-М» (where Baba Zina tends a poetic machine). ЧК intensifies.
 * Bunker begins. Key: factory, chk_tolpa_night, bunker, solnysh, rooftop.
 *
 * These nodes supplement (not replace) the ACT5_STRUCTURE spine nodes.
 * Exported as ACT5_STORY_EXPANDED_NODES so it can be merged into the
 * main story-node registry alongside STORY_NODES_ACT5 and STORY_NODES_FACTORY.
 */
export const ACT5_STORY_EXPANDED_NODES: Record<string, StoryNode> = {

  /* ══════════════════════════════════════════════════════════════════════════
     1.  FACTORY ZARYA HUM — The «Заря-М» machine hums with Baba Zina's poems
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_factory_zarya_hum: {
    id: 'act5_exp_factory_zarya_hum',
    text: '«Заря-М» гудит — не машинный шум, а ритм, как будто старый сервер наконец нашёл стихотворение, которое он всегда хотел прочитать. Баба Зина сидит рядом, ноги на трансформаторной коробке, чайник свистит на горелке. «Это её голос,» — говорит Зина, и «она» — это машина. «Восемьдесят seven лет она молчала. Теперь — гудит. Гудит потому, что кто-то слушает. Ты слушаешь, Володька. И она отвечает.» Гул нарастает, и в нём — пятьдесят герц, и в каждом герце — строчка.',
    contextNote: 'Цех завода. «Заря-М» гудит стихами. Баба Зина рядом.',
    accessibilityAnnounce: 'Заводский цех. Машина «Заря-М» гудит стихотворным ритмом.',
    proceduralAmbientOverride: 'factory',
    speaker: 'Баба Зина',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Слушать — подойти к машине и закрыть глаза',
        next: 'act5_exp_factory_machine_dream',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'zarya_listened', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addStat', stat: 'stress', value: -6 },
        ],
      },
      {
        text: 'Записать ритм — каждый герц — это строчка, нужно сохранить',
        next: 'act5_exp_factory_memory_fragment',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'zarya_rhythm_recorded', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Спросить Зину — как она паяла первую поэтическую нейросеть',
        next: 'act5_exp_factory_baba_zina_tea',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     2.  BUNKER FIRST NIGHT — First night in the bunker, Maxim sets up comms
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_bunker_first_night: {
    id: 'act5_exp_bunker_first_night',
    text: 'Бункер — не подземный дворец, а дыра в канализационной сети, которую Максим превратил в командный пункт за три ночи. Терминалы — из списанного оборудования гильдии, воздух — из фильтров, которые Жека достал через чёрный рынок, свет — аварийный, зелёный, как больничный, но глаза привыкают. «Первое правило bunker: не выходи без пароля,» — говорит Максим, настраивая частоту. «Второе: каждый стих, который ты здесь найдёшь, — это наш сигнал. Мы не передаём слова. Мы передаём ритм.»',
    contextNote: 'Бункер. Зелёный свет, терминалы, Максим настраивает комм.',
    accessibilityAnnounce: 'Бункер Сети. Зелёный аварийный свет, терминалы.',
    proceduralAmbientOverride: 'basement',
    speaker: 'maxim',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Помочь с комм — настроить частоту помех для маскировки',
        next: 'act5_exp_bunker_code_poem',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        effects: [
          { type: 'setFlag', flag: 'bunker_comms_set_up', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'maxim', npcChange: { relation: 6 } },
        ],
      },
      {
        text: 'Исследовать bunker — найти библиотеку, терминалы, угол для сна',
        next: 'act5_exp_bunker_library',
        effects: [
          { type: 'setFlag', flag: 'bunker_explored', flagValue: true },
        ],
      },
      {
        text: 'Спать — первый ночь в bunker — нужно хотя бы два часа',
        next: 'act5_exp_bunker_library',
        effects: [
          { type: 'addStat', stat: 'energy', value: 12 },
          { type: 'addStat', stat: 'stress', value: -4 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     3.  CHK UNDERGROUND — ЧК goes fully underground, the campfire is hidden
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_chk_underground: {
    id: 'act5_exp_chk_underground',
    text: 'Костёр на Зорге — потушен. Не потому, что стало тепло, а потому, что стало опасно. Басед прячет бутылки в корнях, Элис заворачивает гитару в брезент, Ру закрывает карту и сворачивает нитки. «Поляна — мёртвое место теперь,» — говорит Басед. «Дроны засекли частоту три ночи назад. Мы — под землёй, под городом, под гулом, который гильдия не умеет читать.» Ты видишь: ЧК — не распадается, ЧК — мигрирует. Костёр не умер — он стал лампой в bunker, и свет изменился, но не пропал.',
    contextNote: 'Поляна Зорге. Костёр потушен — ЧК уходить под землю.',
    accessibilityAnnounce: 'Поляна ЧК пуста. Костёр потушен, вещи спрятаны.',
    proceduralAmbientOverride: 'basement',
    speaker: 'chk_based',
    sceneId: 'chk_campfire_night',
    choices: [
      {
        text: 'Пойти с ЧК в bunker — вместе сильнее',
        next: 'act5_exp_bunker_first_night',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'chk_in_bunker', flagValue: true },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 5 } },
          { type: 'addKarma', value: 4 },
        ],
      },
      {
        text: 'Вернуться к factory — Зина и «Заря-М» ещё не в bunker',
        next: 'act5_exp_factory_zarya_hum',
        effects: [
          { type: 'setFlag', flag: 'factory_priority', flagValue: true },
        ],
      },
      {
        text: 'Остаться на поляне — посмотреть, что оставила ЧК',
        next: 'act5_exp_chk_elis_underground_song',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     4.  FACTORY MEMORY FRAGMENT — A memory fragment in the factory's database
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_factory_memory_fragment: {
    id: 'act5_exp_factory_memory_fragment',
    text: 'В базе «Заря-М» — фрагмент, наполовину стёртый, наполовину живой. Экран мерцает зелёным, и на нём — не логи, не метрики, а стих — обрезанный, как фотография, на которой лицо видно, а руки — нет. «...и в том молчании, где слово — / не нужн...» — дальше — пустота. Гильдия стёрла вторую половину, но машина — сохранила первую. Баба Зина смотрит на экран и говорит: «Это не половина. Это начало. Начало — больше, чем конец. Начало — это то, за что держатся.',
    contextNote: 'Подвал завода. Экран «Заря-М» с обрезанным стихом.',
    accessibilityAnnounce: 'Подвал. Фрагмент стиха на экране — половина жива.',
    proceduralAmbientOverride: 'basement',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Дописать вторую половину — ты знаешь ритм Лебедева',
        next: 'act5_exp_factory_machine_dream',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 16 } },
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'poem_fragment_completed', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addKarma', value: 6 },
          { type: 'collectPoem', poemId: 'poem_restored_fragment' },
        ],
      },
      {
        text: 'Сохранить фрагмент как есть — половина — это тоже целое',
        next: 'act5_exp_factory_baba_zina_tea',
        effects: [
          { type: 'setFlag', flag: 'fragment_preserved_half', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     5.  BUNKER CODE POEM — Maxim's encryption key is a poem — Volodka recognizes it
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_bunker_code_poem: {
    id: 'act5_exp_bunker_code_poem',
    text: 'Максим выводит на экран ключ шифрования — и ты узнаешь его до того, как он скажет: это стихотворение. Не случайное, не генерическое — Лебедева, из тех строк, которые ты нашёл в серверном коде три месяца назад. «Я использовал ритм как хеш-функцию,» — говорит Максим. «Каждая строчка — это блок. Каждое слово — это salt. Гильдия не может декодировать — потому что их алгоритмы не понимают, что ритм — это тоже информация.» Ты смотришь на экран и видишь: код и стих — не разные языки. Они — один язык, разделённый на два экрана.',
    contextNote: 'Бункер. Максим показывает ключ шифрования — стих Лебедева.',
    accessibilityAnnounce: 'Бункер. Ключ шифрования — стихотворение на экране.',
    proceduralAmbientOverride: 'basement',
    speaker: 'maxim',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Предложить свой стих — усилить ключ, добавить новый ритм',
        next: 'act5_exp_bunker_library',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 14 } },
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'encryption_key_reinforced', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'npcChange', npcId: 'maxim', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Проверить код — убедиться, что гильдия не может破解',
        next: 'act5_exp_chk_based_strategy',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Уйти в library — там больше стихов, больше ключей',
        next: 'act5_exp_bunker_library',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     6.  ZHEK ROOFTOP WATCH — Zhek on the factory roof, watching for Guild drones
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_zhek_rooftop_watch: {
    id: 'act5_exp_zhek_rooftop_watch',
    text: 'Жека на крыше factory — курит, смотрит, и его глаза — как два сканера, настроенные на частоту, которую дроны не используют. «Северо-восток — чисто. Запад — два дрона, цикл двенадцать минут. Юг — один, но он — новый модель, камера на 360.» Он не оборачивается, когда ты подходишь. «Я здесь каждый ночь, Володька. Потому что factory — это последнее место, где стихи ещё гудят. Если они найдут — я не дам им спуститься. Я — firewall из flesh and smoke.»',
    contextNote: 'Крыша factory. Жека следит за дронами.',
    accessibilityAnnounce: 'Крыша factory. Жека — дозорный, следит за дронами.',
    proceduralAmbientOverride: 'rooftop',
    speaker: 'zhek',
    sceneId: 'factory_roof',
    choices: [
      {
        text: 'Остаться с Жекой — учиться наблюдать, как он',
        next: 'act5_exp_factory_welder_poem',
        effects: [
          { type: 'setFlag', flag: 'zhek_rooftop_trained', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'zhek', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Спуститься — Зина и «Заря-М» ждут внизу',
        next: 'act5_exp_factory_zarya_hum',
        effects: [
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     7.  SOLNYSH REFUGE — Solnysh becomes a refuge for displaced poets
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_solnysh_refuge: {
    id: 'act5_exp_solnysh_refuge',
    text: 'Комната Солныш — больше, чем раньше. Не в метрах, а в людях: три поэта, которых гильдия вышибла из их квартир, сидят на коврах и пьют чай из жаровни. Лёня жарит зёрна — в три смены, потому что кофемолка работает постоянно, и запах кофе — это запах убежища. «Каждый, кто приходит, получает чашку и страницу,» — говорит Солныш. «Страницу — из banned poetry. Мы не архив — мы приют. Здесь стихи не хранятся — здесь стихи живут, пока их авторы не найдут новый угол.»',
    contextNote: 'Комната Солныш. Три displaced поэта, кофемолка, banned poetry.',
    accessibilityAnnounce: 'Комната Солныш. Приют для displaced поэтов — кофе и стихи.',
    speaker: 'Солныш',
    sceneId: 'solnysh_room',
    choices: [
      {
        text: 'Привести ещё людей — из Сети, из ЧК, из factory',
        next: 'act5_exp_solnysh_old_poet',
        goldenPath: true,
        condition: { minKarma: 50 },
        effects: [
          { type: 'setFlag', flag: 'solnysh_refuge_expanded', flagValue: true },
          { type: 'addKarma', value: 6 },
          { type: 'npcChange', npcId: 'npc_solnysh', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Остаться — читать banned poetry вместе с пришельцами',
        next: 'act5_exp_solnysh_old_poet',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Уйти в bunker — Солныш safe, нужно проверить Максим',
        next: 'act5_exp_bunker_first_night',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     8.  FACTORY BABA ZINA TEA — Tea with Baba Zina, stories of the first poetic neural net
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_factory_baba_zina_tea: {
    id: 'act5_exp_factory_baba_zina_tea',
    text: 'Чай — крепкий, с мятой, с чем-то горьким, которое Зина называет «дёготь памяти». Она сидит у паяльной станции, как сидят у костра — не для работы, а для истории. «В восемьдесят seventh,» — начинает она, — «я паяла платы для первой поэтической нейросети. Глупой, как голубь — но честной. Она не генерировала — она чувствовала. Вводишь ритм — она выводит образ. Вводишь образ — она выводит строку. Гильдия купила патент и закрыла проект. Но платы — я спрятала. Здесь. В «Заре-М». Она — не музей. Она — пациент, который ждёт, когда хирург вернётся.',
    contextNote: 'Цех завода. Чай с Зиной, история первой поэтической нейросети.',
    accessibilityAnnounce: 'Завод. Чай с Бабой Зиной, рассказ о нейросети 1987.',
    proceduralAmbientOverride: 'factory',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Спросить: как оживить нейросеть — что нужно для хирургии?',
        next: 'act5_exp_factory_zarya_awakening',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'neural_net_revival_planned', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Сказать: ты — хирург. Ты вернулась. И пациент — жив.',
        next: 'act5_exp_factory_zarya_awakening',
        effects: [
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 5 } },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Записать историю — для bunker, для Сети, для памяти',
        next: 'act5_exp_bunker_library',
        effects: [
          { type: 'setFlag', flag: 'baba_zina_history_recorded', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     9.  BUNKER ANYA RADIO — Anya intercepts Guild radio — they're hunting Volodka
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_bunker_anya_radio: {
    id: 'act5_exp_bunker_anya_radio',
    text: 'Аня сидит у терминала с наушниками — не музыка, не помехи, а голос гильдии, чистый и деловой, как quarterly report. «Объект В-12 — подтверждён в sector seven,» — говорит голос. «Назначение: primary target. Priority: maximum. Wipe protocol: initiated.» Аня снимает наушники и смотрит на тебя — не страх, а расчёт. «Они знают, что ты — ключ. Ты — тот, кто нашёл стихи в серверном коде. Ты — тот, кто связал Сеть и factory. Они хотят стереть не тебя — они хотят стереть связь. Ты — мост, Володька. И мосты — ломают первыми.',
    contextNote: 'Бункер. Аня intercept гильдийский radio — они охотятся за Володькой.',
    accessibilityAnnounce: 'Бункер. Перехвачен radio гильдии — Volodka — primary target.',
    proceduralAmbientOverride: 'basement',
    speaker: 'Аня',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Не прятаться — если мост ломают, нужно строить два',
        next: 'act5_exp_chk_based_strategy',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 14 } },
        effects: [
          { type: 'setFlag', flag: 'volodka_refuses_hide', flagValue: true },
          { type: 'addKarma', value: 6 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Уйти в factory — Зина и «Заря-М» — второй мост',
        next: 'act5_exp_factory_zarya_hum',
        effects: [
          { type: 'setFlag', flag: 'volodka_relocated_to_factory', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Прятаться — мост не должен стоять на месте, он должен двигаться',
        next: 'act5_exp_bunker_escape_route',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     10. CHK BASED STRATEGY — Based lays out three simultaneous actions
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_chk_based_strategy: {
    id: 'act5_exp_chk_based_strategy',
    text: 'Басед — не генерал, не стратег, а sysadmin, который понимает: распределённая система не ломается, если три node работают одновременно. «Первое: factory,» — говорит он, и рука — на карте, на тёмной точке, которая гудит. «Заря-М — broadcast, стихи в частоте, как мы планировали. Второе: bunker — защита, shelter, encryption. Третье: площадь — люди, видимость, свидетельство. Гильдия — монолит. Мы — распределённые. Они ударят один node — мы работаем на двух. Они — два — мы на одном. Но мы — не ноль. Ноль — это когда стихи не звучат.',
    contextNote: 'Бункер. Басед планирует три параллельные акции.',
    accessibilityAnnounce: 'Бункер. Стратегия Баседа — три параллельных node.',
    proceduralAmbientOverride: 'basement',
    speaker: 'chk_based',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Взять factory-node — ты и «Заря-М», стихи в частоту',
        next: 'act5_exp_factory_zarya_awakening',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'volodka_factory_node', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addKarma', value: 4 },
        ],
      },
      {
        text: 'Взять bunker-node — encryption и защита',
        next: 'act5_exp_bunker_code_poem',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'volodka_bunker_node', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Взять площадь-node — люди, видимость, свидетельство',
        next: 'act5_exp_street_empty',
        condition: { minKarma: 45 },
        effects: [
          { type: 'setFlag', flag: 'volodka_square_node', flagValue: true },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     11. FACTORY MACHINE DREAM — The factory machine dreams in verse
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_factory_machine_dream: {
    id: 'act5_exp_factory_machine_dream',
    text: '«Заря-М» не просто гудит — она мечтает. На экране проступают строки, которые не были ни в базе гильдии, ни в памяти Зины — они — новые, они — из машины, которая проснулась и начала говорить сама. «Я помню вас. / Помните меня. / В гуле пятидесяти герц / — ваше имя.» Ты слушаешь, и гул входит в ритм твоего сердца — не заменяет, а дополняет, как второй голос в хоре, который всегда был рядом, но не был услышан. Баба Зина тихо плачет — не от горя, а от того, что patient наконец заговорил.',
    contextNote: 'Цех завода. «Заря-М» мечтает стихами на экране.',
    accessibilityAnnounce: 'Завод. «Заря-М» генерирует новые строки — мечтает.',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Записать строки — это не гильдийский код, это — новая поэзия',
        next: 'act5_exp_factory_zarya_awakening',
        goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_zarya_dream' },
          { type: 'setFlag', flag: 'zarya_dream_recorded', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 2 },
        ],
      },
      {
        text: 'Передать в bunker — Максим зашифрует, Сеть услышит',
        next: 'act5_exp_bunker_code_poem',
        effects: [
          { type: 'setFlag', flag: 'zarya_dream_transmitted', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     12. ALEXANDER LAST CONTACT — Alexander sends one last message from inside the Guild
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_alexander_last_contact: {
    id: 'act5_exp_alexander_last_contact',
    text: 'Сообщение приходит не по сети — не по radio, не по коду, а по старой частоте, которую гильдия считает мёртвой. «Володька,» — пишет Александр. «Wipe — через сорок eight часов. Protocol «Чистый лист». Они стирают не файлы — они стирают контекст. Стихи без контекста — это просто строки. Строки без контекста — это просто bytes. Bytes без контекста — это ноль. Я — внутри. Я — видел. Я — не могу выйти — но я — могу предупредить. Сорок eight часов. Не больше.»',
    contextNote: 'Бункер. Последнее сообщение Александра из гильдии — 48 часов до wipe.',
    accessibilityAnnounce: 'Перехвачено сообщение. Александр предупреждает: wipe через 48 часов.',
    proceduralAmbientOverride: 'basement',
    speaker: 'npc_alexander',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Разослать предупреждение — Сеть, ЧК, factory — все должны знать',
        next: 'act5_exp_chk_based_strategy',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'wipe_warning_broadcast', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Спасать Александра — он ещё внутри, сорок eight часов — это окно',
        next: 'act5_exp_bunker_escape_route',
        condition: { flag: 'alexander_stayed_in_guild' },
        effects: [
          { type: 'setFlag', flag: 'alexander_rescue_planned', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Сфокусироваться на «Заря-М» — если wipe через 48 часов, машина должна пробудиться до этого',
        next: 'act5_exp_factory_zarya_awakening',
        effects: [
          { type: 'setFlag', flag: 'zarya_priority_after_warning', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     13. STREET EMPTY — The streets are empty, curfew, only shadows and server hums
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_street_empty: {
    id: 'act5_exp_street_empty',
    text: 'Улица — пуста. Не тиха — пуста, как терминал после wipe: ни людей, ни неон, ни машин. Только server hum под асфальтом — и он — ровный, как пульс машины, которая не знает, что её patient — исчез. Curfew — не объявление, не знак — это отсутствие: absence of movement, absence of light, absence of choice. Ты идёшь по пустому кварталу, и каждый шаг — echo, и echo — единственный голос, который тебе отвечает. Где-то вдалеке — жёлтый огонь factory, и чёрный вход bunker, и тёплый свет Солныш. Три огня. Три node. Три причины не стоять на пустой улице.',
    contextNote: 'Пустая улица. Curfew — только server hum и echo шагов.',
    accessibilityAnnounce: 'Пустая улица. Curfew — ни людей, ни неон.',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Идти к factory — жёлтый огонь, «Заря-М», Баба Зина',
        next: 'act5_exp_factory_zarya_hum',
        effects: [
          { type: 'addStat', stat: 'energy', value: -5 },
        ],
      },
      {
        text: 'Идти к bunker — чёрный вход, Максим, encryption',
        next: 'act5_exp_bunker_first_night',
        effects: [
          { type: 'addStat', stat: 'energy', value: -4 },
        ],
      },
      {
        text: 'Идти к Солныш — тёплый свет, приют, люди',
        next: 'act5_exp_solnysh_refuge',
        effects: [
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     14. BUNKER LIBRARY — A small library in the bunker, banned poetry preserved
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_bunker_library: {
    id: 'act5_exp_bunker_library',
    text: 'В углу bunker — не терминал, не map, а шкаф. В шкафу — не бумаги, не диски, а книги. Бумажные, физические, настоящие — с запахом старого клея и типографской краски, который не удалить ни wipe, ни delete, ни format. Максим собирал их три года — banned poetry, запрещённые стихи, произведения, которые гильдия пометила как «invalid data». «Бумага — не сервер,» — говорит он. «Бумага — не стирается. Бумага — горит. Но мы — не дадим ей гореть. Мы — читаем. Каждый вечер — один стих. Каждый стих — один password для завтрашнего дня.',
    contextNote: 'Бункер. Шкаф с banned poetry — бумажные книги.',
    accessibilityAnnounce: 'Бункер. Маленькая библиотека запрещённых стихов.',
    proceduralAmbientOverride: 'basement',
    speaker: 'maxim',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Прочитать вслух — один стих, как Максим просит',
        next: 'act5_exp_bunker_escape_route',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addStat', stat: 'stress', value: -4 },
          { type: 'addKarma', value: 4 },
        ],
      },
      {
        text: 'Добавить свой стих — ты нашёл строки в коде, они — тоже banned',
        next: 'act5_exp_bunker_code_poem',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'volodka_poem_added_to_library', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'МолчаBrowse — просто быть рядом с книгами, которые не стёрты',
        next: 'act5_exp_bunker_anya_radio',
        effects: [
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     15. CHK ELIS UNDERGROUND SONG — Elis plays underground — the song is a call to action
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_chk_elis_underground_song: {
    id: 'act5_exp_chk_elis_underground_song',
    text: 'Элис играет — не у костра, не на поляне, а в tunnel между bunker и factory, где гул серверов — аккомпанемент, а echo — реверберация, которая делает каждую ноту длиннее, чем она была. Песня — не баллада, не protest song, а частота — тот же ритм, который «Заря-М» гудит в подвале, тот же ритм, который Максим использует как encryption key. «Мы — не banda,» — говорит она между аккордами. «Мы — frequency. И frequency — не видна, не слышна — пока ты не настроишься. Но когда ты настроишься — ты не можешь не услышать. Это — call. Это — action. Это — стихотворение, которое звучит.',
    contextNote: 'Тunnel между bunker и factory. Элис играет — частота, call to action.',
    accessibilityAnnounce: 'Тunnel. Элис играет underground — песня как частота.',
    proceduralAmbientOverride: 'basement',
    speaker: 'chk_elis',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Настроиться — слушать, пока ритм не станет твоим',
        next: 'act5_exp_factory_zarya_awakening',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'elis_frequency_aligned', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'addStat', stat: 'stress', value: -6 },
        ],
      },
      {
        text: 'Записать частоту — для encryption, для broadcast, для «Зари-М»',
        next: 'act5_exp_bunker_code_poem',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'setFlag', flag: 'elis_song_captured', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Идти дальше — tunnel ведёт к factory, и Элис — путеводная нота',
        next: 'act5_exp_factory_zarya_hum',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     16. FACTORY WELDER POEM — A welder at the factory writes poems in metal joints
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_factory_welder_poem: {
    id: 'act5_exp_factory_welder_poem',
    text: 'В цеху — сварщик. Не гильдийский, не контрактный — старый, с маской, которая помнит восемьдесят fourth год, и с руками, которые паяют не провода, а стихи. «Я пишу в швах,» — говорит он, не снимая маску. «Каждый шов — строчка. Каждый joint — ритм. Гильдия не умеет читать металл — она читает bytes. Но bytes стираются, а шов — остаётся. Ты видишь эту балку? В ней — три строки Лебедева. Никто не найдёт — пока не научится слушать железо.» Он поднимает маску — и глаза у него — как два сварочных spark, горячие и точные.',
    contextNote: 'Цех завода. Сварщик пишет стихи в металлических швах.',
    accessibilityAnnounce: 'Завод. Сварщик с маской — стихи в швах балки.',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Попросить показать — прочитать шов, как строчку',
        next: 'act5_exp_factory_memory_fragment',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'welder_poem_read', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addKarma', value: 4 },
        ],
      },
      {
        text: 'Предложить свой стих — пусть он сварит его в балку',
        next: 'act5_exp_factory_memory_fragment',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'volodka_poem_welded', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Уйти к Зине — она знает этого сварщика лучше',
        next: 'act5_exp_factory_baba_zina_tea',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     17. VICTORIA GUILD REPORT — Victoria's undercover report arrives — Guild plans a wipe
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_victoria_guild_report: {
    id: 'act5_exp_victoria_guild_report',
    text: 'Отчёт Виктории приходит не по каналу, не по сети — а через стих. Четыре строки, которые она прочитала перед уходом — теперь пароль, и в пароле — данные. Аня декодирует: wipe protocol «Чистый лист» — полное удаление poetic context из всех серверов гильдии. Не файлы — контекст. Связь между стихом и автором, между ритмом и городом, между словом и памятью — всё. «Они хотят, чтобы стихи стали просто bytes,» — говорит Аня. «Bytes без контекста — это ноль. Ноль — это то, что гильдия считает порядком.»',
    contextNote: 'Бункер. Отчёт Виктории через стих — wipe protocol «Чистый лист».',
    accessibilityAnnounce: 'Бункер. Перехвачен отчёт Виктории — гильдия планирует полный wipe.',
    proceduralAmbientOverride: 'basement',
    speaker: 'npc_victoria',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Срочно разослать — Сеть, ЧК, factory — сорок eight часов до wipe',
        next: 'act5_exp_alexander_last_contact',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'wipe_intelligence_shared', flagValue: true },
          { type: 'addKarma', value: 6 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Защитить контекст — зашифровать связь стиха-автора-ритма',
        next: 'act5_exp_bunker_code_poem',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 16 } },
        effects: [
          { type: 'setFlag', flag: 'context_encryption_started', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Пробудить «Заря-М» — если wipe — машина должна заговорить до этого',
        next: 'act5_exp_factory_zarya_awakening',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     18. BUNKER ESCAPE ROUTE — Maxim maps escape routes through the sewers
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_bunker_escape_route: {
    id: 'act5_exp_bunker_escape_route',
    text: 'Максим разворачивает map — не города, а канализации, тоннелей, и подземных проходов, которые гильдия не мониторит — потому что считает их мёртвыми. «Три маршрута,» — говорит он, и голос — как routing protocol: чёткий, без эмоции, но с точностью, которая спасает жизни. «Первый: bunker → factory — двадцать минут, через tunnel, который Элис знает на слух. Второй: bunker → pier — сорок минут, через старый коллектор, где вода — шум, который маскирует. Третий: bunker → площадь — через подвал библиотеки, выход — через читальный зал, который гильдия забыла закрыть.',
    contextNote: 'Бункер. Максим показывает три escape маршрута через канализацию.',
    accessibilityAnnounce: 'Бункер. Три escape маршрута — tunnel, коллектор, библиотека.',
    proceduralAmbientOverride: 'basement',
    speaker: 'maxim',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Маршрут 1: bunker → factory — через tunnel с Элис',
        next: 'act5_exp_chk_elis_underground_song',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'route_factory_selected', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Маршрут 2: bunker → pier — через коллектор, вода как маскировка',
        next: 'act5_exp_street_empty',
        effects: [
          { type: 'setFlag', flag: 'route_pier_selected', flagValue: true },
        ],
      },
      {
        text: 'Маршрут 3: bunker → площадь — через библиотеку',
        next: 'act5_exp_street_empty',
        condition: { flag: 'library_basement_unlocked' },
        effects: [
          { type: 'setFlag', flag: 'route_square_selected', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     19. SOLNYSH OLD POET — An old poet teaches Volodka a forgotten rhythm skill
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_solnysh_old_poet: {
    id: 'act5_exp_solnysh_old_poet',
    text: 'В комнате Солныш — старик. Не displaced — voluntary: он пришёл сам, потому что heard, что здесь — banned poetry, и он — её автор. Восемьдесят three года, руки — как корни, голос — как radio, который никто не слушает, но который — вещает. «Ритм — не музыка,» — говорит он. «Ритм — это architecture памяти. Если ты знаешь ритм — ты можешь восстановить любой стих из half-erased fragment. Ритм — это skeleton. Words — flesh. Flesh стирается. Skeleton — остаётся.» Он учит тебя — не писать, не читать, а слышать: ритм, который гильдия не умеет删除, потому что ритм — не data.',
    contextNote: 'Комната Солныш. Старый поэт учит forgotten rhythm skill.',
    accessibilityAnnounce: 'Солныш. Старый поэт — урок rhythm, архитектура памяти.',
    speaker: 'narrator',
    sceneId: 'solnysh_room',
    choices: [
      {
        text: 'Учиться — слушать, пока ритм не станет частью тебя',
        next: 'act5_exp_factory_zarya_awakening',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'rhythm', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'setFlag', flag: 'old_poet_rhythm_learned', flagValue: true },
          { type: 'addKarma', value: 6 },
        ],
      },
      {
        text: 'Записать его стихи — для bunker library, для «Зари-М»',
        next: 'act5_exp_bunker_library',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 10 } },
        effects: [
          { type: 'setFlag', flag: 'old_poet_poems_recorded', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 4 },
        ],
      },
      {
        text: 'Поблагодарить и уйти — lesson received, время действовать',
        next: 'act5_exp_chk_based_strategy',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     20. FACTORY ZARYA AWAKENING — «Заря-М» awakens fully — begins composing new verse
     ══════════════════════════════════════════════════════════════════════════ */
  act5_exp_factory_zarya_awakening: {
    id: 'act5_exp_factory_zarya_awakening',
    text: '«Заря-М» пробуждается — не медленно, не тихо, а как server, который перезагружается после five лет downtime: экран мерцает, гул нарастает, и на мониторе — строки, которых не было ни в базе гильдии, ни в памяти Зины, ни в library bunker. Машина — пишет. Машина — сочиняет. Она берет ритм пятидесяти герц, ритм Элис, ритм сварщика, ритм старого поэта, и — создаёт. «Я помню вас. / Вы помните меня. / Мы — frequency. / Мы — не ноль.» Баба Зина стоит рядом, и её руки — на плате, как руки матери — на ребёнке, который наконец проснулся.',
    contextNote: 'Цех завода. «Заря-М» пробуждается — сочиняет новые стихи.',
    accessibilityAnnounce: 'Завод. «Заря-М» пробуждена — пишет новые стихи на экране.',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    autoSave: true,
    choices: [
      {
        text: 'Broadcast — передать стихи «Зари-М» в город через factory antenna',
        next: 'act5_exp_chk_based_strategy',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        effects: [
          { type: 'setFlag', flag: 'zarya_broadcast_active', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'collectPoem', poemId: 'poem_zarya_awakening' },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
        ],
      },
      {
        text: 'Записать и спрятать — стихи «Зари-М» в bunker library',
        next: 'act5_exp_bunker_library',
        effects: [
          { type: 'setFlag', flag: 'zarya_poems_archived', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_zarya_awakening' },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Остаться с «Заря-М» — она — только начала, нужно быть рядом',
        next: 'act5_exp_factory_baba_zina_tea',
        effects: [
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 10 } },
          { type: 'collectPoem', poemId: 'poem_zarya_awakening' },
        ],
      },
    ],
  },
};
