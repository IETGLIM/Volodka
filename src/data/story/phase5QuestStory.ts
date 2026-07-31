import type { StoryNode } from '@/shared/types/game';

/** Стартовые + completion-биты для QUESTS_PHASE5_SIDE — без soft-lock на flag_set. */
export const STORY_NODES_PHASE5_QUESTS: Record<string, StoryNode> = {
  quest_act2_server_poem_hunt_start: {
    id: 'quest_act2_server_poem_hunt_start',
    text: 'Три сервера города шепчут одни и те же строки в логах ошибок. Гильдейский автоскрипт уже запущен — у тебя мало времени, чтобы снять фрагменты до затирания.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Начать охоту на серверные стихи',
        next: 'office_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act2_server_poem_hunt' },
          { type: 'setFlag', flag: 'quest_act2_server_poem_hunt_active', flagValue: true },
        ],
      },
    ],
  },
  quest_act2_chk_neon_archive_start: {
    id: 'quest_act2_chk_neon_archive_start',
    text: 'Басед кивает на вывеску «Синяя яма»: под неоном спрятан архив, который гильдия списала. Нужно добраться до скрытого хранилища через биллиардный интерфейс.',
    speaker: 'Басед',
    sceneId: 'chk_forest_zorge',
    contextNote: 'Басед указывает на неоновую вывеску «Синяя яма».',
    accessibilityAnnounce: 'Басед просит вытащить неоновый архив из вывески.',
    guidanceHint: 'Иди к вывеске «Синяя яма» — биллиардный интерфейс.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Синяя яма / кафе',
    choices: [
      {
        text: 'Искать неоновый архив',
        next: 'quest_act2_chk_neon_archive_hack',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act2_chk_neon_archive' },
          { type: 'setFlag', flag: 'quest_act2_chk_neon_archive_active', flagValue: true },
          { type: 'transitionScene', sceneId: 'cafe_evening' },
        ],
      },
      { text: 'Позже', next: 'chk_explore_mode' },
    ],
  },
  quest_act2_chk_neon_archive_hack: {
    id: 'quest_act2_chk_neon_archive_hack',
    text: 'Вывеска «Синяя яма» гудит на частоте, которую гильдия назвала помехой. Биллиардный интерфейс — три касания, чужой PIN, чужая память. Архив сыплется в карман: файлы без имён, стихи без разрешения.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Скрытое хранилище вывески вскрыто.',
    accessibilityAnnounce: 'Неоновый архив вытащен из вывески.',
    guidanceHint: 'Архив у тебя — можно вернуться к Баседу.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Унести архив',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'chk_neon_archive_done', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 4 },
        ],
      },
    ],
  },

  // ─── Кибер-цветение: α → β → γ ───
  quest_act3_park_cyber_bloom_start: {
    id: 'quest_act3_park_cyber_bloom_start',
    text: 'Кибер-цветы в парке раскрываются только рядом с живым голосом, читающим строки. Три узла ждут стиха.',
    speaker: 'narrator',
    sceneId: 'park_day',
    accessibilityAnnounce: 'В парке три кибер-цветка ждут голоса.',
    guidanceHint: 'Прочти стих у первого кибер-цветка α.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Подойти к цветку α',
        next: 'quest_act3_park_cyber_bloom_alpha',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act3_park_cyber_bloom' },
          { type: 'setFlag', flag: 'quest_act3_park_cyber_bloom_active', flagValue: true },
        ],
      },
      { text: 'Позже', next: 'park_explore_mode' },
    ],
  },
  quest_act3_park_cyber_bloom_alpha: {
    id: 'quest_act3_park_cyber_bloom_alpha',
    text: 'Цветок α дрожит оптоволокном. Ты читаешь вслух — лепестки вспыхивают неоном, камера на столбе моргает и слепнет на секунду.',
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Кибер-цветок α раскрыт голосом.',
    accessibilityAnnounce: 'Цветок альфа расцвёл после чтения.',
    guidanceHint: 'Иди к цветку β — следующая строка.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Идти к цветку β',
        next: 'quest_act3_park_cyber_bloom_beta',
        effects: [{ type: 'setFlag', flag: 'park_cyber_bloom_alpha_done', flagValue: true }],
      },
    ],
  },
  quest_act3_park_cyber_bloom_beta: {
    id: 'quest_act3_park_cyber_bloom_beta',
    text: 'У цветка β нити тоньше — почти шёпот. Строка ложится в частоту; парк пахнет озоном и мокрой травой из leaking-потока.',
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Кибер-цветок β раскрыт.',
    accessibilityAnnounce: 'Цветок бета расцвёл.',
    guidanceHint: 'Последний узел — цветок γ.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Идти к цветку γ',
        next: 'quest_act3_park_cyber_bloom_gamma',
        effects: [{ type: 'setFlag', flag: 'park_cyber_bloom_beta_done', flagValue: true }],
      },
    ],
  },
  quest_act3_park_cyber_bloom_gamma: {
    id: 'quest_act3_park_cyber_bloom_gamma',
    text: 'Цветок γ раскрывается последним — три узла синхронизируются. Неон заливает аллею; гильдейские камеры белеют шумом. Парк на минуту принадлежит стиху.',
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Все три кибер-цветка раскрыты.',
    accessibilityAnnounce: 'Кибер-цветение завершено. Камеры ослепли.',
    guidanceHint: 'Парк расцвёл — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Уйти, пока камеры слепы',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'park_cyber_bloom_gamma_done', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  // ─── Свидетельство Заремы ───
  quest_act3_zarema_evidence_run_start: {
    id: 'quest_act3_zarema_evidence_run_start',
    text: 'Зарема сжимает пакет свидетельств. Гильдия уже стёрла два узла — третий в подвале библиотеки под охраной Кати.',
    speaker: 'Зарема',
    sceneId: 'library_day',
    accessibilityAnnounce: 'Зарема просит провести её в подвал библиотеки.',
    guidanceHint: 'Проведи Зарему в подвал — загрузи свидетельства.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Подвал библиотеки',
    guidanceNpcId: 'zarema',
    choices: [
      {
        text: 'Провести Зарему в подвал',
        next: 'quest_act3_zarema_evidence_secure',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act3_zarema_evidence_run' },
          { type: 'setFlag', flag: 'quest_act3_zarema_evidence_run_active', flagValue: true },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
      { text: 'Позже — периметр горячий', next: 'library_explore_mode' },
    ],
  },
  quest_act3_zarema_evidence_secure: {
    id: 'quest_act3_zarema_evidence_secure',
    text: 'В подвале Катя кивает на защищённый узел. Зарема вставляет носитель — прогресс-бар ползёт, как вина. «Готово,» — шепчет она. «Теперь гильдия не сотрёт это без шума.»',
    speaker: 'Зарема',
    sceneId: 'library_basement',
    contextNote: 'Свидетельства загружены в защищённый узел.',
    accessibilityAnnounce: 'Свидетельства Заремы загружены в защищённый узел.',
    guidanceHint: 'Узел защищён — можно уйти.',
    guidanceObjectiveType: 'complete_quest',
    guidanceNpcId: 'zarema',
    choices: [
      {
        text: 'Закрыть узел и выйти',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'quest_act3_zarema_evidence_run_done', flagValue: true },
          { type: 'setFlag', flag: 'zarema_evidence_secure', flagValue: true },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'transitionScene', sceneId: 'library_day' },
        ],
      },
    ],
  },

  // ─── Антенна свободы ───
  quest_act4_rooftop_broadcast_setup_start: {
    id: 'quest_act4_rooftop_broadcast_setup_start',
    text: 'Александр указывает на крышу заброшенного блока: старая радиомачта ещё жива. Если перепаять схему — стихи пойдут в эфир.',
    speaker: 'Александр',
    sceneId: 'rooftop_edge',
    accessibilityAnnounce: 'Александр просит перепаять радиомачту на крыше.',
    guidanceHint: 'Перепаяй мачту и настрой стих-модулятор.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'office_alexander',
    choices: [
      {
        text: 'Подняться к мачте',
        next: 'quest_act4_rooftop_broadcast_repair',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act4_rooftop_broadcast_setup' },
          { type: 'setFlag', flag: 'quest_act4_rooftop_broadcast_setup_active', flagValue: true },
        ],
      },
      { text: 'Позже', next: 'rooftop_explore_mode' },
    ],
  },
  quest_act4_rooftop_broadcast_repair: {
    id: 'quest_act4_rooftop_broadcast_repair',
    text: 'Паяльник щёлкает. Модулятор ловит несущую — вместо шума в эфир ложится строка. Антенна гудит; в квартале терминалы на секунду показывают чужой текст.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    contextNote: 'Радиомачта перепаяна. Стих-модулятор в эфире.',
    accessibilityAnnounce: 'Антенна настроена. Стихи идут в эфир.',
    guidanceHint: 'Эфир открыт — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Зафиксировать несущую и спуститься',
        next: 'rooftop_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'quest_act4_rooftop_broadcast_setup_done', flagValue: true },
          { type: 'setFlag', flag: 'rooftop_broadcast_ready', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 2 },
        ],
      },
    ],
  },

  // ─── Самиздат: пирс → ЧК → библиотека ───
  quest_act4_street_samizdat_start: {
    id: 'quest_act4_street_samizdat_start',
    text: 'Комендантский час. Под снегом — три точки, куда можно положить самиздат, пока сканеры слепы.',
    speaker: 'narrator',
    sceneId: 'street_night',
    accessibilityAnnounce: 'Нужно разложить самиздат в трёх точках города.',
    guidanceHint: 'Первая точка — пирс.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Пирс',
    choices: [
      {
        text: 'Идти к пирсу с листками',
        next: 'quest_act4_street_samizdat_pier',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act4_street_samizdat' },
          { type: 'setFlag', flag: 'quest_act4_street_samizdat_active', flagValue: true },
          { type: 'transitionScene', sceneId: 'pier_evening' },
        ],
      },
      { text: 'Позже — патруль близко', next: 'street_bench_view' },
    ],
  },
  quest_act4_street_samizdat_pier: {
    id: 'quest_act4_street_samizdat_pier',
    text: 'У столба на пирсе — щель под ржавчиной. Листок ложится тихо. Вода бьёт о сваи; сканер на набережной смотрит мимо.',
    speaker: 'narrator',
    sceneId: 'pier_evening',
    contextNote: 'Самиздат у пирса разложен.',
    accessibilityAnnounce: 'Листок оставлен у пирса.',
    guidanceHint: 'Вторая точка — ЧК на Зорге.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'ЧК',
    choices: [
      {
        text: 'Бежать в ЧК',
        next: 'quest_act4_street_samizdat_chk',
        effects: [
          { type: 'setFlag', flag: 'samizdat_pier_done', flagValue: true },
          { type: 'transitionScene', sceneId: 'chk_forest_zorge' },
        ],
      },
    ],
  },
  quest_act4_street_samizdat_chk: {
    id: 'quest_act4_street_samizdat_chk',
    text: 'У костра ЧК кто-то отворачивается — не мешает. Листок под камень у гитары. Пепел падает на запрещённые строки.',
    speaker: 'narrator',
    sceneId: 'chk_forest_zorge',
    contextNote: 'Самиздат в ЧК разложен.',
    accessibilityAnnounce: 'Листок оставлен у костра ЧК.',
    guidanceHint: 'Третья точка — у библиотеки.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Библиотека',
    choices: [
      {
        text: 'К библиотеке — последний листок',
        next: 'quest_act4_street_samizdat_library',
        effects: [
          { type: 'setFlag', flag: 'samizdat_chk_done', flagValue: true },
          { type: 'transitionScene', sceneId: 'library_day' },
        ],
      },
    ],
  },
  quest_act4_street_samizdat_library: {
    id: 'quest_act4_street_samizdat_library',
    text: 'У входа в библиотеку — щель в объявлении гильдии. Листок вместо плаката. Готово. Бегом домой, пока сканеры не пересчитали квартал.',
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Самиздат у библиотеки разложен. Три точки закрыты.',
    accessibilityAnnounce: 'Последний листок у библиотеки. Самиздат разложен.',
    guidanceHint: 'Три точки закрыты — уходи с улицы.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Уйти с улицы',
        next: 'street_bench_view',
        effects: [
          { type: 'setFlag', flag: 'samizdat_library_done', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 6 },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
    ],
  },

  // ─── Память Зари-М (phase5): три фрагмента ───
  quest_act5_factory_zarya_memory_restore_start: {
    id: 'quest_act5_factory_zarya_memory_restore_start',
    text: '«Заря-М» молчит — три образа памяти рассеялись по leaking-потоку. Баба Зина ждёт у паяльной станции.',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    accessibilityAnnounce: 'Баба Зина ждёт восстановления трёх образов памяти.',
    guidanceHint: 'Найди первую цифровую тень у паяльной.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'baba_zina',
    choices: [
      {
        text: 'Искать первую тень у паяльной',
        next: 'quest_act5_zarya_fragment_1',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act5_factory_zarya_memory_restore' },
          { type: 'setFlag', flag: 'quest_act5_factory_zarya_memory_restore_active', flagValue: true },
        ],
      },
      { text: 'Позже', next: 'factory_explore_mode' },
    ],
  },
  quest_act5_zarya_fragment_1: {
    id: 'quest_act5_zarya_fragment_1',
    text: 'У паяльной станции — цифровая тень: первый снег, записанный как пиксел. Ты возвращаешь её в шину. Машина щёлкает раз.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Первый фрагмент памяти «Зари-М» восстановлен.',
    accessibilityAnnounce: 'Первый образ памяти восстановлен.',
    guidanceHint: 'Второй образ — в серверных обрывках leaking-потока.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Искать второй фрагмент в leaking-потоке',
        next: 'quest_act5_zarya_fragment_2',
        effects: [
          { type: 'setFlag', flag: 'zarya_memory_fragment_1_done', flagValue: true },
          { type: 'transitionScene', sceneId: 'factory_basement' },
        ],
      },
    ],
  },
  quest_act5_zarya_fragment_2: {
    id: 'quest_act5_zarya_fragment_2',
    text: 'В подвале leaking-поток шепчет грозой. Ты выдёргиваешь второй образ из шума — озон и треск кассеты — и кладёшь рядом с первым.',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Второй фрагмент памяти восстановлен.',
    accessibilityAnnounce: 'Второй образ памяти восстановлен.',
    guidanceHint: 'Третий образ — верни на паяльную станцию.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Нести третий образ к паяльной',
        next: 'quest_act5_zarya_fragment_3',
        effects: [
          { type: 'setFlag', flag: 'zarya_memory_fragment_2_done', flagValue: true },
          { type: 'transitionScene', sceneId: 'abandoned_factory' },
        ],
      },
    ],
  },
  quest_act5_zarya_fragment_3: {
    id: 'quest_act5_zarya_fragment_3',
    text: 'Третий образ — голос девочки у станка — встаёт на место. «Заря-М» гудит ровно и читает стих, которого нет ни в одном файле. Зина закрывает глаза: «Она помнит.»',
    speaker: 'Заря-М',
    sceneId: 'abandoned_factory',
    contextNote: 'Три фрагмента памяти на месте. Машина заговорила.',
    accessibilityAnnounce: 'Память «Зари-М» полностью восстановлена.',
    guidanceHint: 'Машина заговорила — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    guidanceNpcId: 'baba_zina',
    choices: [
      {
        text: 'Записать стих и отойти',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'zarya_memory_fragment_3_done', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_16' },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  // ─── Шифр-стих: ключ в leaking → пробой шифра ───
  quest_act5_bunker_code_poem_break_start: {
    id: 'quest_act5_bunker_code_poem_break_start',
    text: 'Архив «Солныш» зашифрован не числом, а строкой. Максим кивает на терминал: «Ключ — в leaking-потоке. Один неверный ритм — и архив схлопнется.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    accessibilityAnnounce: 'Максим у терминала гильдейского шифра. Нужен стих-ключ.',
    guidanceHint: 'Ищи стихотворную строку-ключ в leaking-потоке.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Нырнуть в leaking за строкой-ключом',
        next: 'quest_act5_bunker_poem_key',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act5_bunker_code_poem_break' },
          { type: 'setFlag', flag: 'quest_act5_bunker_code_poem_break_active', flagValue: true },
          { type: 'transitionScene', sceneId: 'factory_basement' },
        ],
      },
      { text: 'Позже — ритм ещё не готов', next: 'bunker_explore_mode' },
    ],
  },
  quest_act5_bunker_poem_key: {
    id: 'quest_act5_bunker_poem_key',
    text: 'В leaking-потоке строка вспыхивает, как хеш: «Пауза — тоже код.» Ты выдёргиваешь её из шума и несёшь к терминалу — не число, а ритм.',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Стихотворная строка-ключ найдена в leaking-потоке.',
    accessibilityAnnounce: 'Стих-ключ извлечён из leaking-потока.',
    guidanceHint: 'Вернись к терминалу — подставь ключ и пробей шифр.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Нести ключ к терминалу шифра',
        next: 'quest_act5_bunker_code_break',
        effects: [
          { type: 'setFlag', flag: 'bunker_poem_key_found', flagValue: true },
          { type: 'transitionScene', sceneId: 'underground_bunker' },
        ],
      },
    ],
  },
  quest_act5_bunker_code_break: {
    id: 'quest_act5_bunker_code_break',
    text: 'Ты подставляешь строку. Терминал молчит секунду — потом стена шифра сыплется, как рифма без опоры. Архив «Солныш» открыт. Максим выдыхает: «Логика и чутьё. Вместе.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    contextNote: 'Шифр гильдии пробит стих-ключом.',
    accessibilityAnnounce: 'Шифр пробит. Архив «Солныш» открыт.',
    guidanceHint: 'Архив открыт — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Сохранить доступ и отойти',
        next: 'bunker_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'quest_act5_bunker_code_poem_break_done', flagValue: true },
          { type: 'setFlag', flag: 'guild_encryption_broken', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
    ],
  },

  // ─── Перебежчик: коллектор → камера → сток ───
  quest_act6_defector_rescue_expanded_start: {
    id: 'quest_act6_defector_rescue_expanded_start',
    text: 'Инженер гильдии схвачен на КПП. Максим шепчет: «Коллектор под периметром — камеры слепы. Два часа до цифрового стирания.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    accessibilityAnnounce: 'Максим даёт маршрут через коллектор под КПП.',
    guidanceHint: 'Спустись в коллектор — путь к КПП в темноте.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Бункер / коллектор',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Спуститься в коллектор',
        next: 'quest_act6_defector_infiltrate',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act6_defector_rescue_expanded' },
          { type: 'setFlag', flag: 'quest_act6_defector_rescue_expanded_active', flagValue: true },
        ],
      },
      { text: 'Позже — патруль слишком плотный', next: 'bunker_explore_mode' },
    ],
  },
  quest_act6_defector_infiltrate: {
    id: 'quest_act6_defector_infiltrate',
    text: 'Коллектор пахнет озоном и сыростью. Ты идёшь по трубе под КПП — камеры сверху не видят. Впереди — люк в камеру удержания.',
    speaker: 'narrator',
    sceneId: 'underground_bunker',
    contextNote: 'Маршрут через коллектор под КПП пройден.',
    accessibilityAnnounce: 'Коллектор пройден. Впереди камера удержания.',
    guidanceHint: 'Вытащи инженера из камеры до цифрового стирания.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Открыть люк в камеру',
        next: 'quest_act6_defector_free_cell',
        effects: [{ type: 'setFlag', flag: 'defector_infiltrate_done', flagValue: true }],
      },
    ],
  },
  quest_act6_defector_free_cell: {
    id: 'quest_act6_defector_free_cell',
    text: 'Инженер в нейромосте — глаза пустые. Ты рвёшь кабель и шепчешь строку из «Солныш». Он моргает: «Олег… Я Олег.» В коридоре — шаги патруля.',
    speaker: 'narrator',
    sceneId: 'underground_bunker',
    contextNote: 'Инженер вытащен из камеры удержания.',
    accessibilityAnnounce: 'Инженер свободен. Патруль близко.',
    guidanceHint: 'Уходи через подземный сток к бункеру.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Увести через сток',
        next: 'quest_act6_defector_escape_sewers',
        effects: [{ type: 'setFlag', flag: 'defector_freed_from_cell', flagValue: true }],
      },
    ],
  },
  quest_act6_defector_escape_sewers: {
    id: 'quest_act6_defector_escape_sewers',
    text: 'Сток выносит вас к люку бункера. Аня принимает инженера. Максим сжимает плечо: «Ты вернул человека — не запись.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    contextNote: 'Побег через сток завершён. Перебежчик в бункере.',
    accessibilityAnnounce: 'Побег успешен. Перебежчик спасён.',
    guidanceHint: 'Рейд закрыт — человек в безопасности.',
    guidanceObjectiveType: 'complete_quest',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Закрыть люк и отдышаться',
        next: 'bunker_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'quest_act6_defector_rescue_expanded_done', flagValue: true },
          { type: 'setFlag', flag: 'guild_defector_saved', flagValue: true },
          { type: 'addKarma', value: 8 },
        ],
      },
    ],
  },

  // ─── Секретный архив: люк → дверь «Голоса» → расшифровка → вынос → печать ───
  act6_secret_archive_approach: {
    id: 'act6_secret_archive_approach',
    text: 'Под цехом — люк, которого нет на схемах гильдии. Рядом с ним воздух гудит на частоте, которую слышит только «Голос Улиц». Архив ждёт — или зачистка.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Скрытый люк к незарегистрированному архиву гильдии.',
    accessibilityAnnounce: 'Скрытый люк под цехом. Архив за дверью.',
    guidanceHint: 'Спустись к двери — «Голос Улиц» откроет её.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Спуститься к скрытому люку',
        next: 'act6_secret_archive_start',
        condition: { missingFlag: 'act6_secret_archive_active' },
      },
      {
        text: 'Дверь ещё молчит — подставить «Голос Улиц»',
        next: 'act6_secret_archive_door',
        condition: {
          flag: 'act6_secret_archive_active',
          missingFlag: 'act6_secret_archive_opened',
        },
      },
      {
        text: 'Расшифровать уличные записи',
        next: 'act6_secret_archive_decode',
        condition: {
          flag: 'act6_secret_archive_opened',
          missingFlag: 'act6_secret_archive_decoded',
        },
      },
      {
        text: 'Вынести спасённые стихи',
        next: 'act6_secret_archive_extract',
        condition: {
          flag: 'act6_secret_archive_decoded',
          missingFlag: 'act6_secret_archive_saved',
        },
      },
      {
        text: 'Запечатать архив до зачистки',
        next: 'act6_secret_archive_seal',
        condition: {
          flag: 'act6_secret_archive_saved',
          missingFlag: 'act6_secret_archive_sealed',
        },
      },
      { text: 'Отойти — цех ещё шумит', next: 'factory_explore_mode' },
    ],
  },
  act6_secret_archive_start: {
    id: 'act6_secret_archive_start',
    text: 'Люк открывается без скрипа — кто-то смазал петли недавно. Внизу коридор без камер: гильдия не вносит в реестр то, чего стыдится. Впереди — дверь без ручки, только решётка микрофонов.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Спуск к секретному архиву. Дверь без ручки впереди.',
    accessibilityAnnounce: 'Спуск к секретному архиву. Дверь без ручки.',
    guidanceHint: 'Открой дверь стихом «Голос Улиц».',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Подойти к двери без ручки',
        next: 'act6_secret_archive_door',
        effects: [
          { type: 'triggerQuest', questId: 'act6_secret_archive' },
          { type: 'setFlag', flag: 'act6_secret_archive_active', flagValue: true },
        ],
      },
      { text: 'Позже — патруль наверху', next: 'factory_explore_mode' },
    ],
  },
  act6_secret_archive_door: {
    id: 'act6_secret_archive_door',
    text: 'Ты шепчешь «Голос Улиц». Решётка вспыхивает — дверь слышит. Замок щёлкает изнутри, как рифма, которую долго прятали. За порогом — стеллажи с катушками и бумагой без инвентарных номеров.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Дверь архива открыта стихом «Голос Улиц».',
    accessibilityAnnounce: 'Дверь архива открыта. Внутри стеллажи с записями.',
    guidanceHint: 'Расшифруй уличные записи — ключ в строках.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Войти и искать ключ-строки',
        next: 'act6_secret_archive_decode',
        effects: [{ type: 'setFlag', flag: 'act6_secret_archive_opened', flagValue: true }],
      },
    ],
  },
  act6_secret_archive_decode: {
    id: 'act6_secret_archive_decode',
    text: 'Записи — не логи, а уличные строфы, нарезанные по частотам. Ты складываешь их в порядке, который знает только тот, кто ходил ночными дворами. Шифр сыплется: имена, даты чисток, стихи, которые гильдия назвала «помехой».',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Уличные записи архива расшифрованы.',
    accessibilityAnnounce: 'Записи расшифрованы. Можно вынести стихи.',
    guidanceHint: 'Скопируй спасённые стихи до зачистки.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Снять копии на носитель',
        next: 'act6_secret_archive_extract',
        effects: [{ type: 'setFlag', flag: 'act6_secret_archive_decoded', flagValue: true }],
      },
    ],
  },
  act6_secret_archive_extract: {
    id: 'act6_secret_archive_extract',
    text: 'Катушки тихонько щёлкают, пока ты пишешь. В карман — три стиха без разрешения и список имён, которых нет в «Паноптикуме». Сверху гул: зачистка близко. Архив нельзя оставить открытым.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Стихи извлечены из секретного архива.',
    accessibilityAnnounce: 'Стихи сохранены. Нужно запечатать архив.',
    guidanceHint: 'Запечатай люк — не оставляй след для гильдии.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Запечатать люк и стереть следы',
        next: 'act6_secret_archive_seal',
        effects: [{ type: 'setFlag', flag: 'act6_secret_archive_saved', flagValue: true }],
      },
    ],
  },
  act6_secret_archive_seal: {
    id: 'act6_secret_archive_seal',
    text: 'Люк закрывается. Пыль ложится ровно — будто никого не было. Архив снова не существует для реестра. Для тебя — существует. Стихи в кармане тяжелеют смыслом, не граммами.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Секретный архив запечатан до зачистки.',
    accessibilityAnnounce: 'Архив запечатан. Стихи спасены.',
    guidanceHint: 'Архив закрыт — квест выполнен.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Подняться в цех',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'act6_secret_archive_sealed', flagValue: true },
          { type: 'setFlag', flag: 'act6_secret_archive_done', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 6 },
        ],
      },
    ],
  },

  // ─── Имена на камне: обелиск → табличка → память → резьба → тишина ───
  quest_act7_poets_monument_inscription_start: {
    id: 'quest_act7_poets_monument_inscription_start',
    text: 'Обелиск в парке восстановлен, но имена стёрты. Поверх камня — тонкая гильдейская табличка: «Оптимизация памяти». Ты знаешь другие имена — каждый стих в leaking-потоке был подписан.',
    speaker: 'narrator',
    sceneId: 'park_day',
    accessibilityAnnounce: 'Обелиск с гильдейской табличкой. Нужно вернуть имена поэтов.',
    guidanceHint: 'Подойди к обелиску — сначала сними чужую табличку.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Парк',
    choices: [
      {
        text: 'Подойти к обелиску',
        next: 'quest_act7_poets_monument_plate',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act7_poets_monument_inscription' },
          { type: 'setFlag', flag: 'quest_act7_poets_monument_inscription_active', flagValue: true },
        ],
      },
      { text: 'Позже — имена ещё горят', next: 'park_explore_mode' },
    ],
  },
  quest_act7_poets_monument_plate: {
    id: 'quest_act7_poets_monument_plate',
    text: 'Ногтем поддеваешь край таблички. Металл тонкий, как ложь. Она отходит со скрипом — под ней серый камень, ещё тёплый от дневного света. Место для имён снова пустое — и честное.',
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Гильдейская табличка соскребена с обелиска.',
    accessibilityAnnounce: 'Табличка снята. Камень открыт для имён.',
    guidanceHint: 'Вспомни подписи из leaking-потока — кого стёрли.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Закрыть глаза и вспомнить подписи',
        next: 'quest_act7_poets_monument_recall',
        effects: [{ type: 'setFlag', flag: 'quest_act7_poets_monument_plate_cleared', flagValue: true }],
      },
    ],
  },
  quest_act7_poets_monument_recall: {
    id: 'quest_act7_poets_monument_recall',
    text: 'Имена приходят не списком — строфами. Кто прятал стих в сервере. Кто молчал у костра. Кто исчез в чистке, оставив только хэш. Ты шепчешь их вслух, чтобы камень услышал до резца.',
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Имена из leaking-потока восстановлены в памяти.',
    accessibilityAnnounce: 'Имена вспомнены. Можно резать камень.',
    guidanceHint: 'Вырежи первые имена собственной рукой.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Взять осколок и начать резьбу',
        next: 'quest_act7_poets_monument_carve',
        effects: [{ type: 'setFlag', flag: 'quest_act7_poets_monument_names_recalled', flagValue: true }],
      },
    ],
  },
  quest_act7_poets_monument_carve: {
    id: 'quest_act7_poets_monument_carve',
    text: 'Осколок стекла ведёт по камню — не гильдейской гравировкой, а собственной рукой. Первые буквы ложатся криво и честно. Пыль на пальцах. Парк не вмешивается.',
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Первые имена вырезаны на обелиске.',
    accessibilityAnnounce: 'Имена вырезаны. Осталось принять тишину.',
    guidanceHint: 'Допиши строфу и отойди — память тоже код.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Дописать последнюю строку',
        next: 'quest_act7_poets_monument_inscribe',
        effects: [{ type: 'setFlag', flag: 'quest_act7_poets_monument_carved', flagValue: true }],
      },
    ],
  },
  quest_act7_poets_monument_inscribe: {
    id: 'quest_act7_poets_monument_inscribe',
    text: 'Последнее имя ложится, как закрывающая строфа. Обелиск больше не «оптимизация» — он помнит. Парк молчит. Память — тоже код.',
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Имена погибших поэтов вписаны на обелиск.',
    accessibilityAnnounce: 'Имена вписаны на камень. Памятник завершён.',
    guidanceHint: 'Имена на камне — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Отойти и запомнить тишину',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'quest_act7_poets_monument_inscription_done', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_17' },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },
};
