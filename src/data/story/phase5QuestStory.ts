import type { StoryNode } from '@/shared/types/game';

/** Стартовые + completion-биты для QUESTS_PHASE5_SIDE — без soft-lock на flag_set. */
export const STORY_NODES_PHASE5_QUESTS: Record<string, StoryNode> = {
  quest_act2_server_poem_hunt_start: {
    id: 'quest_act2_server_poem_hunt_start',
    text: 'Три сервера города шепчут одни и те же строки в логах ошибок. Гильдейский автоскрипт уже запущен — у тебя мало времени, чтобы снять фрагменты до затирания.',
    speaker: 'narrator',
    sceneId: 'office_day',
    accessibilityAnnounce: 'Три сервера города хранят стихи в логах ошибок.',
    guidanceHint: 'Сканируй офисный сервер — первый фрагмент.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Офис',
    choices: [
      {
        text: 'Сканировать офисный сервер',
        next: 'quest_act2_server_poem_office',
        effects: [
          { type: 'triggerQuest', questId: 'quest_act2_server_poem_hunt' },
          { type: 'setFlag', flag: 'quest_act2_server_poem_hunt_active', flagValue: true },
        ],
      },
      { text: 'Позже — автоскрипт ещё не дошёл', next: 'office_explore_mode' },
    ],
  },
  quest_act2_server_poem_office: {
    id: 'quest_act2_server_poem_office',
    text: 'В логах офисного сервера — не стек-трейс, а строфа: «Пауза — тоже код.» Ты снимаешь фрагмент до того, как гильдейский автоскрипт затрёт строку шумом.',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Первый серверный фрагмент снят в офисе.',
    accessibilityAnnounce: 'Офисный сервер отсканирован. Первый фрагмент у тебя.',
    guidanceHint: 'Второй фрагмент — на пирсе.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Пирс',
    effects: [
      { type: 'setFlag', flag: 'quest_act2_server_poem_office_open', flagValue: true },
    ],
    choices: [
      {
        text: 'Бежать на пирс — второй сервер',
        next: 'quest_act2_server_poem_pier',
        effects: [
          { type: 'setFlag', flag: 'server_poem_office_done', flagValue: true },
          { type: 'setFlag', flag: 'quest_act2_server_poem_office_open', flagValue: false },
          { type: 'transitionScene', sceneId: 'pier_evening' },
        ],
      },
      { text: 'Отойти — логи подождут у стойки', next: 'office_explore_mode' },
    ],
  },
  quest_act2_server_poem_pier: {
    id: 'quest_act2_server_poem_pier',
    text: 'Под сваей пирса гудит старый узел. В логах ошибок — вторая строка, мокрая от брызг: «Вода помнит частоту.» Фрагмент ложится рядом с первым.',
    speaker: 'narrator',
    sceneId: 'pier_evening',
    contextNote: 'Второй серверный фрагмент снят на пирсе.',
    accessibilityAnnounce: 'Пирсный сервер отсканирован. Второй фрагмент у тебя.',
    guidanceHint: 'Третий фрагмент — в ЧК на Зорге.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'ЧК',
    effects: [
      { type: 'setFlag', flag: 'quest_act2_server_poem_pier_open', flagValue: true },
    ],
    choices: [
      {
        text: 'К ЧК — третий сервер у костра',
        next: 'quest_act2_server_poem_chk',
        effects: [
          { type: 'setFlag', flag: 'server_poem_pier_done', flagValue: true },
          { type: 'setFlag', flag: 'quest_act2_server_poem_pier_open', flagValue: false },
          { type: 'transitionScene', sceneId: 'chk_forest_zorge' },
        ],
      },
      { text: 'Отойти — узел под сваей подождёт', next: 'pier_evening_explore_mode' },
    ],
  },
  quest_act2_server_poem_chk: {
    id: 'quest_act2_server_poem_chk',
    text: 'У костра ЧК сервер греется от бочки. Третья строка вспыхивает в логе: три фрагмента складываются в стих, которого нет в реестре. Автоскрипт гильдии опаздывает на удар сердца.',
    speaker: 'narrator',
    sceneId: 'chk_forest_zorge',
    contextNote: 'Три серверных фрагмента собраны. Охота закрыта.',
    accessibilityAnnounce: 'Третий фрагмент снят. Серверные стихи собраны.',
    guidanceHint: 'Три фрагмента у тебя — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    effects: [
      { type: 'setFlag', flag: 'quest_act2_server_poem_chk_open', flagValue: true },
    ],
    choices: [
      {
        text: 'Собрать стих и отойти от костра',
        next: 'chk_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'server_poem_chk_done', flagValue: true },
          { type: 'setFlag', flag: 'quest_act2_server_poem_chk_open', flagValue: false },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'collectPoem', poemId: 'poem_3' },
        ],
      },
      { text: 'Отойти — лог у костра подождёт', next: 'chk_explore_mode' },
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
    effects: [
      { type: 'setFlag', flag: 'quest_act2_chk_neon_archive_hack_open', flagValue: true },
    ],
    choices: [
      {
        text: 'Унести архив',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'chk_neon_archive_done', flagValue: true },
          { type: 'setFlag', flag: 'quest_act2_chk_neon_archive_hack_open', flagValue: false },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 4 },
        ],
      },
      { text: 'Отойти — интерфейс подождёт у вывески', next: 'cafe_explore_mode' },
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
      { text: 'Отойти — строка α ещё дрожит в лепестках', next: 'park_explore_mode' },
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
      { text: 'Отойти — нить β подождёт у аллеи', next: 'park_explore_mode' },
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
      { text: 'Отойти — узел ещё качает свидетельства', next: 'library_basement_explore_mode' },
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
    effects: [
      { type: 'setFlag', flag: 'quest_act4_rooftop_broadcast_repair_open', flagValue: true },
    ],
    choices: [
      {
        text: 'Зафиксировать несущую и спуститься',
        next: 'rooftop_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'quest_act4_rooftop_broadcast_setup_done', flagValue: true },
          { type: 'setFlag', flag: 'rooftop_broadcast_ready', flagValue: true },
          { type: 'setFlag', flag: 'quest_act4_rooftop_broadcast_repair_open', flagValue: false },
          { type: 'addSkill', skill: 'coding', value: 2 },
        ],
      },
      { text: 'Отойти — паяльник остынет', next: 'rooftop_explore_mode' },
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
    effects: [
      { type: 'setFlag', flag: 'quest_act4_street_samizdat_pier_open', flagValue: true },
    ],
    choices: [
      {
        text: 'Бежать в ЧК',
        next: 'quest_act4_street_samizdat_chk',
        effects: [
          { type: 'setFlag', flag: 'samizdat_pier_done', flagValue: true },
          { type: 'setFlag', flag: 'quest_act4_street_samizdat_pier_open', flagValue: false },
          { type: 'transitionScene', sceneId: 'chk_forest_zorge' },
        ],
      },
      { text: 'Отойти — листок подождёт в щели', next: 'pier_evening_explore_mode' },
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
    effects: [
      { type: 'setFlag', flag: 'quest_act4_street_samizdat_chk_open', flagValue: true },
    ],
    choices: [
      {
        text: 'К библиотеке — последний листок',
        next: 'quest_act4_street_samizdat_library',
        effects: [
          { type: 'setFlag', flag: 'samizdat_chk_done', flagValue: true },
          { type: 'setFlag', flag: 'quest_act4_street_samizdat_chk_open', flagValue: false },
          { type: 'transitionScene', sceneId: 'library_day' },
        ],
      },
      { text: 'Отойти — камень у гитары подождёт', next: 'chk_explore_mode' },
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
    effects: [
      { type: 'setFlag', flag: 'quest_act4_street_samizdat_library_open', flagValue: true },
    ],
    choices: [
      {
        text: 'Уйти с улицы',
        next: 'street_bench_view',
        effects: [
          { type: 'setFlag', flag: 'samizdat_library_done', flagValue: true },
          { type: 'setFlag', flag: 'quest_act4_street_samizdat_library_open', flagValue: false },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 6 },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
      { text: 'Отойти — щель в объявлении подождёт', next: 'library_explore_mode' },
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
      { text: 'Отойти — тень подождёт у паяльной', next: 'factory_explore_mode' },
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
      { text: 'Отойти — leaking ещё шумит', next: 'basement_explore_mode' },
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
      {
        text: 'Отойти — третий образ ещё не на шине',
        next: 'factory_explore_mode',
        condition: { missingFlag: 'zarya_memory_fragment_3_done' },
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
      { text: 'Отойти — строка ещё мерцает в шуме', next: 'basement_explore_mode' },
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
      {
        text: 'Отойти — ключ ещё не подставлен',
        next: 'bunker_explore_mode',
        condition: { missingFlag: 'quest_act5_bunker_code_poem_break_done' },
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
      {
        text: 'Отойти — люк ещё не открыт',
        next: 'bunker_explore_mode',
        condition: { missingFlag: 'defector_infiltrate_done' },
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
      {
        text: 'Отойти — Олег ещё в нейромосте',
        next: 'bunker_explore_mode',
        condition: { missingFlag: 'defector_freed_from_cell' },
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
      {
        text: 'Отойти — сток ещё не пройден',
        next: 'bunker_explore_mode',
        condition: { missingFlag: 'quest_act6_defector_rescue_expanded_done' },
      },
    ],
  },

  // ─── Исповедь «Зари-М»: mid-router thread / familiar / base ───
  machine_confession_approach: {
    id: 'machine_confession_approach',
    text: 'Монолит пульсирует ровнее, когда ты близко. Баба Зина не поднимает глаз: «Слушай до конца — или уйди и вернись. Машина не обижается. Люди обижаются.»',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Подвал. «Заря-М» ждёт исповеди или решения.',
    accessibilityAnnounce: 'Монолит «Зари-М». Можно слушать или решить судьбу.',
    guidanceHint: 'Слушай исповедь — потом освободи или отключи машину.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Подвал завода',
    choices: [
      {
        text: 'Слушать исповедь — нить из 18 строк',
        next: 'machine_confession_scene_thread',
        condition: { flag: 'thread_18_complete', missingFlag: 'machine_fate_decided' },
        effects: [
          { type: 'triggerQuest', questId: 'machine_confession' },
          { type: 'setFlag', flag: 'zarya_confession_requested', flagValue: true },
        ],
      },
      {
        text: 'Слушать исповедь — знакомый гул',
        next: 'machine_confession_scene_familiar',
        condition: { flag: 'zarya_monolith_examined', missingFlag: 'machine_fate_decided' },
        effects: [
          { type: 'triggerQuest', questId: 'machine_confession' },
          { type: 'setFlag', flag: 'zarya_confession_requested', flagValue: true },
        ],
      },
      {
        text: 'Слушать исповедь машины',
        next: 'machine_confession_scene',
        condition: { missingFlag: 'machine_fate_decided' },
        effects: [
          { type: 'triggerQuest', questId: 'machine_confession' },
          { type: 'setFlag', flag: 'zarya_confession_requested', flagValue: true },
        ],
      },
      { text: 'Отойти от монолита', next: 'basement_explore_mode' },
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
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Войти и искать ключ-строки',
        next: 'act6_secret_archive_decode',
        condition: { missingFlag: 'act6_secret_archive_opened' },
        effects: [{ type: 'setFlag', flag: 'act6_secret_archive_opened', flagValue: true }],
      },
      {
        text: 'Расшифровать уличные записи',
        next: 'act6_secret_archive_decode',
        condition: {
          flag: 'act6_secret_archive_opened',
          missingFlag: 'act6_secret_archive_decoded',
        },
      },
      { text: 'Отойти — цех ещё шумит', next: 'factory_explore_mode' },
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
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Снять копии на носитель',
        next: 'act6_secret_archive_extract',
        condition: { missingFlag: 'act6_secret_archive_decoded' },
        effects: [{ type: 'setFlag', flag: 'act6_secret_archive_decoded', flagValue: true }],
      },
      {
        text: 'Вынести спасённые стихи',
        next: 'act6_secret_archive_extract',
        condition: {
          flag: 'act6_secret_archive_decoded',
          missingFlag: 'act6_secret_archive_saved',
        },
      },
      { text: 'Отойти — зачистка близко', next: 'factory_explore_mode' },
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
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Запечатать люк и стереть следы',
        next: 'act6_secret_archive_seal',
        condition: { missingFlag: 'act6_secret_archive_saved' },
        effects: [{ type: 'setFlag', flag: 'act6_secret_archive_saved', flagValue: true }],
      },
      {
        text: 'Запечатать архив до зачистки',
        next: 'act6_secret_archive_seal',
        condition: {
          flag: 'act6_secret_archive_saved',
          missingFlag: 'act6_secret_archive_sealed',
        },
      },
      { text: 'Отойти — печать подождёт', next: 'factory_explore_mode' },
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
    guidanceSceneLabel: 'Заброшенная фабрика',
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

  // ─── Последний Код: rally → virus → core → deploy ───
  final_code_approach: {
    id: 'final_code_approach',
    text: '«Занавес» уже считает секунды до тотальной зачистки. На экране — план операции: собрать союзников у Алберта, написать вирус свободы из стихов, прорваться в ядро гильдии и запустить код. Один выход из оверлея — и цепочка рвётся, если некуда вернуться.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    contextNote: 'Крыша. Финальная операция «Последний Код».',
    accessibilityAnnounce: 'Последний Код. Собрать союзников, написать вирус, дойти до ядра.',
    guidanceHint: 'Сначала к Алберту — план. Потом терминал в кафе, ядро в офисе, запуск.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Крыша',
    effects: [
      { type: 'triggerQuest', questId: 'final_code' },
      { type: 'setFlag', flag: 'final_code_started', flagValue: true },
    ],
    choices: [
      {
        text: 'К Алберту — собрать союзников на операцию',
        next: 'final_code_rally',
        condition: { missingFlag: 'final_code_allies_rallied' },
      },
      {
        text: 'Терминал в «Синей яме» — писать вирус свободы',
        next: 'final_code_virus',
        condition: {
          flag: 'final_code_allies_rallied',
          missingFlag: 'freedom_virus_written',
        },
      },
      {
        text: 'В офис гильдии — к центральному серверу',
        next: 'final_code_core',
        condition: {
          flag: 'freedom_virus_written',
          missingFlag: 'final_code_core_reached',
        },
      },
      {
        text: 'Ядро открыто — запустить вирус свободы',
        next: 'final_code_deploy',
        condition: {
          flag: 'final_code_core_reached',
          missingFlag: 'freedom_virus_deployed',
        },
      },
      {
        text: 'Код уже в системе — к ночи перед рассветом',
        next: 'night_before_dawn_approach',
        condition: {
          flag: 'final_code_completed',
          missingFlag: 'all_allies_confirmed',
        },
      },
      { text: 'Спуститься с крыши — город ещё дышит', next: 'rooftop_explore_mode' },
    ],
  },
  final_code_rally: {
    id: 'final_code_rally',
    text: 'Алберт раскладывает салфетки как схемы. «Зарема держит периметр у дома. Мария — канал. Дмитрий откроет дверь в башню, если ты не опоздаешь.» Он стучит пальцем по кружке. «Собери их словом — не приказом. Потом пиши вирус. Без стиха «Занавес» сожрёт код как шум.»',
    speaker: 'Алберт',
    sceneId: 'albert_backroom',
    contextNote: 'Алберт собирает союзников на финальную операцию.',
    accessibilityAnnounce: 'Алберт подтверждает план сбора союзников.',
    guidanceHint: 'План принят — к терминалу в кафе писать вирус свободы.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'albert',
    guidanceSceneLabel: 'Подсобка Алберта',
    choices: [
      {
        text: 'Принять план и идти писать вирус',
        next: 'albert_backroom_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'final_code' },
          { type: 'setFlag', flag: 'final_code_started', flagValue: true },
          { type: 'setFlag', flag: 'final_code_allies_rallied', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Позже — сначала другие дела',
        next: 'albert_backroom_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'final_code' },
          { type: 'setFlag', flag: 'final_code_started', flagValue: true },
        ],
      },
    ],
  },
  final_code_virus: {
    id: 'final_code_virus',
    text: 'В подсобке «Синей ямы» терминал уже тёплый — кто-то оставил сессию под «Занавес». Стихи ложатся в пакеты как payload: ритм вместо checksum, метафора вместо обфускации. Нужен OpenStack — или «Белая Река, Чёрный Кабель», если пальцы дрожат.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Терминал в кафе. Вирус свободы ещё не скомпилирован.',
    accessibilityAnnounce: 'Терминал для вируса свободы. Нужен OpenStack или стих-ключ.',
    guidanceHint: 'Открой терминал в подсобке [E] — или используй poem_21.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Кафе',
    effects: [
      { type: 'triggerQuest', questId: 'final_code' },
      { type: 'setFlag', flag: 'final_code_started', flagValue: true },
    ],
    choices: [
      {
        text: 'К терминалу в подсобке — писать вирус',
        next: 'cafe_explore_mode',
        condition: { missingFlag: 'freedom_virus_written' },
      },
      {
        text: 'Вирус готов — к ядру гильдии',
        next: 'final_code_core',
        condition: {
          flag: 'freedom_virus_written',
          missingFlag: 'final_code_core_reached',
        },
      },
      { text: 'Отойти в зал — компиляция подождёт', next: 'cafe_explore_mode' },
    ],
  },
  final_code_core: {
    id: 'final_code_core',
    text: 'Офис гудит тише обычного — Дмитрий отвёл глаза камер. За стеклом серверного блока пульсирует красным то, что гильдия зовёт «ядром». Ты уже был здесь в эфире «Занавеса», но сейчас в кармане лежит вирус свободы. Один шаг — и ты внутри.',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Офис. Вход к центральному серверу гильдии.',
    accessibilityAnnounce: 'Центральный сервер гильдии. Можно войти в ядро.',
    guidanceHint: 'Войди в ядро — потом запусти вирус.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Офис',
    choices: [
      {
        text: 'Войти в серверное ядро',
        next: 'office_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'final_code' },
          { type: 'setFlag', flag: 'final_code_started', flagValue: true },
          { type: 'setFlag', flag: 'final_code_core_reached', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Ядро уже открыто — запускать вирус',
        next: 'final_code_deploy',
        condition: {
          flag: 'final_code_core_reached',
          missingFlag: 'freedom_virus_deployed',
        },
      },
      {
        text: 'Позже — сначала выдохнуть у терминалов',
        next: 'office_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'final_code' },
          { type: 'setFlag', flag: 'final_code_started', flagValue: true },
        ],
      },
    ],
  },
  final_code_deploy: {
    id: 'final_code_deploy',
    text: 'Терминал ядра принимает пакет без вопроса — стихи узнают свой дом. Красный пульс «Занавеса» дёргается, потом зеленеет, потом гаснет слоями. Серверы гильдии роняют тишину, как провода роняют искру. Ты ещё здесь. Системы падают вокруг — но ты стоишь.',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Ядро. Запуск вируса свободы и отключение систем.',
    accessibilityAnnounce: 'Вирус свободы запущен. Системы гильдии гаснут.',
    guidanceHint: 'Код в системе — можно к союзникам на крышу или в город.',
    guidanceObjectiveType: 'complete_quest',
    guidanceSceneLabel: 'Офис',
    autoSave: true,
    musicCue: 'danger',
    choices: [
      {
        text: 'Удержать позицию, пока гаснут экраны',
        next: 'office_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'final_code' },
          { type: 'setFlag', flag: 'freedom_virus_deployed', flagValue: true },
          { type: 'setFlag', flag: 'survived_shutdown', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addStat', stat: 'energy', value: -10 },
        ],
      },
      {
        text: 'Бежать на крышу — ночь перед рассветом ещё ждёт',
        next: 'night_before_dawn_approach',
        condition: { missingFlag: 'all_allies_confirmed' },
        effects: [
          { type: 'triggerQuest', questId: 'final_code' },
          { type: 'setFlag', flag: 'freedom_virus_deployed', flagValue: true },
          { type: 'setFlag', flag: 'survived_shutdown', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  // ─── Ночь Перед Рассветом: mid-router Albert → Зарема → Мария → Дмитрий ───
  night_before_dawn_approach: {
    id: 'night_before_dawn_approach',
    text: 'Последняя ночь перед развязкой. Сообщения союзников ещё горят на экране — но слова с экрана не заменяют лицо. Нужно обойти каждого: Алберт, Зарема, Мария, Дмитрий. Их ответы определят, с кем ты войдёшь в рассвет.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    contextNote: 'Крыша. Подтверди сторону каждого союзника.',
    accessibilityAnnounce: 'Ночь перед рассветом. Нужно подтвердить союзников.',
    guidanceHint: 'Обойди Алберта, Зарему, Марию и Дмитрия — каждый должен сказать «да».',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Крыша',
    effects: [
      { type: 'triggerQuest', questId: 'night_before_dawn' },
      { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
    ],
    choices: [
      {
        text: 'К Алберту — он с тобой до конца?',
        next: 'night_before_dawn_albert',
        condition: { missingFlag: 'albert_final_confirmed' },
      },
      {
        text: 'К Зареме — верит ли она?',
        next: 'night_before_dawn_zarema',
        condition: { missingFlag: 'zarema_final_confirmed' },
      },
      {
        text: 'К Марии — готова ли к финалу?',
        next: 'night_before_dawn_maria',
        condition: { missingFlag: 'maria_final_confirmed' },
      },
      {
        text: 'К Дмитрию в офис — не отступит?',
        next: 'night_before_dawn_dmitry',
        condition: { missingFlag: 'dmitry_final_confirmed' },
      },
      {
        text: 'Все подтвердили — к финальному выбору на краю',
        next: 'act4_final_choice',
        condition: { flag: 'all_allies_confirmed' },
      },
      { text: 'Спуститься с крыши — обойти город', next: 'rooftop_explore_mode' },
    ],
  },
  night_before_dawn_albert: {
    id: 'night_before_dawn_albert',
    text: 'Алберт крутит кружку, не глядя в глаза. «До конца — это не геройство. Это привычка не бросать людей на полпути.» Он ставит кружку. «Я с тобой. Даже если «Занавес» сотрёт моё имя из реестра.»',
    speaker: 'Алберт',
    sceneId: 'albert_backroom',
    contextNote: 'Алберт подтверждает сторону.',
    accessibilityAnnounce: 'Алберт с тобой до конца.',
    guidanceHint: 'Алберт подтвердил — дальше Зарема, Мария, Дмитрий.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'albert',
    guidanceSceneLabel: 'Подсобка Алберта',
    choices: [
      {
        text: 'Принять его слово и идти дальше',
        next: 'albert_backroom_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'night_before_dawn' },
          { type: 'setFlag', flag: 'albert_final_confirmed', flagValue: true },
          { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Позже — сначала другие',
        next: 'albert_backroom_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'night_before_dawn' },
          { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
        ],
      },
    ],
  },
  night_before_dawn_zarema: {
    id: 'night_before_dawn_zarema',
    text: 'Зарема закрывает книгу пальцем. «Вера — не кнопка. Но я видела, как ты выбирал людей, а не удобный лог.» Короткая пауза. «Я верю. Не в победу — в то, что ты не продашь нас за тишину.»',
    speaker: 'Зарема',
    sceneId: 'zarema_albert_room',
    contextNote: 'Зарема подтверждает веру.',
    accessibilityAnnounce: 'Зарема верит в тебя.',
    guidanceHint: 'Зарема подтвердила — дальше Мария и Дмитрий.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'zarema',
    guidanceSceneLabel: 'Комната Заремы',
    choices: [
      {
        text: 'Поблагодарить и уйти',
        next: 'zarema_room_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'night_before_dawn' },
          { type: 'setFlag', flag: 'zarema_final_confirmed', flagValue: true },
          { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 4 } },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Позже — сначала другие',
        next: 'zarema_room_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'night_before_dawn' },
          { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
        ],
      },
    ],
  },
  night_before_dawn_maria: {
    id: 'night_before_dawn_maria',
    text: 'Мария (Виктория) поправляет наушник. «Финал — это не кнопка „отправить“. Это люди, которые останутся после сигнала.» Она кивает. «Я готова. Сеть держит периметр, пока ты говоришь с остальными.»',
    speaker: 'Мария',
    sceneId: 'cafe_evening',
    contextNote: 'Мария подтверждает готовность к финалу.',
    accessibilityAnnounce: 'Мария готова к финалу.',
    guidanceHint: 'Мария подтвердила — ещё Дмитрий в офисе.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'maria',
    guidanceSceneLabel: 'Кафе',
    choices: [
      {
        text: 'Принять её готовность',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'night_before_dawn' },
          { type: 'setFlag', flag: 'maria_final_confirmed', flagValue: true },
          { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 4 } },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Позже — сначала другие',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'night_before_dawn' },
          { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
        ],
      },
    ],
  },
  night_before_dawn_dmitry: {
    id: 'night_before_dawn_dmitry',
    text: 'Дмитрий смотрит на архив, будто там уже написан приговор. «Отступить — значит оставить код тем, кто его боится.» Он закрывает терминал. «Я не отступлю. Даже если гильдия сотрёт мой логин.»',
    speaker: 'Дмитрий',
    sceneId: 'office_day',
    contextNote: 'Дмитрий подтверждает, что не отступит.',
    accessibilityAnnounce: 'Дмитрий не отступит.',
    guidanceHint: 'Все союзники подтверждены — можно вернуться на крышу к финалу.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'office_dmitry',
    guidanceSceneLabel: 'Офис',
    choices: [
      {
        text: 'Пожать руку и уйти',
        next: 'office_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'night_before_dawn' },
          { type: 'setFlag', flag: 'dmitry_final_confirmed', flagValue: true },
          { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 3 } },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Позже — сначала другие',
        next: 'office_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'night_before_dawn' },
          { type: 'setFlag', flag: 'night_before_dawn_started', flagValue: true },
        ],
      },
    ],
  },

  // ─── Эхо Владимира: Катя → тайник → unlock (poetry) → read ───
  echo_of_vladimir_approach: {
    id: 'echo_of_vladimir_approach',
    text: 'Библиотека пахнет бумагой и секретом. Катя шептала про дверь за стеллажом — или ты уже стоишь у неё. Эхо Владимира не кричит. Оно ждёт, пока ты дочитаешь.',
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Тайник Владимира в библиотеке. Катя знает ключ.',
    accessibilityAnnounce: 'Тайник Владимира. Можно спросить Катю или войти.',
    guidanceHint: 'Спроси Катю про тайник — потом открой тетрадь за стеллажом.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Библиотека',
    choices: [
      {
        text: 'Спросить Катю про тайник Владимира',
        next: 'echo_of_vladimir_kate',
        condition: { flag: 'vladimir_echo_started', missingFlag: 'kate_echo_clue_given' },
        effects: [{ type: 'triggerQuest', questId: 'echo_of_vladimir' }],
      },
      {
        text: 'К двери за стеллажом — ключ уже есть',
        next: 'vladimir_secret_room',
        condition: {
          flag: 'kate_echo_clue_given',
          missingFlag: 'echo_secret_room_reached',
        },
      },
      {
        text: 'Тетрадь ждёт — открыть замок строфой',
        next: 'library_explore_mode',
        condition: {
          flag: 'echo_secret_room_reached',
          missingFlag: 'final_poem_unlocked',
        },
      },
      {
        text: 'Прочитать последнее стихотворение',
        next: 'vladimir_secret_room_read',
        condition: {
          flag: 'final_poem_unlocked',
          missingFlag: 'final_poem_read',
        },
      },
      { text: 'Отойти к стеллажам', next: 'library_explore_mode' },
    ],
  },
  echo_of_vladimir_kate: {
    id: 'echo_of_vladimir_kate',
    text: 'Катя достаёт ключ из-за корешка «Стихов о Москве». «За стеллажом с довоенными журналами — дверь, которой нет на планах. Владимир прятал туда последнее. Не читай вслух у окон — стены здесь всё ещё слушают гильдию.»',
    speaker: 'Катя',
    sceneId: 'library_day',
    contextNote: 'Катя даёт ключ к тайнику Владимира.',
    accessibilityAnnounce: 'Катя указала на тайник за стеллажом.',
    guidanceHint: 'Найди дверь за стеллажом с довоенными журналами.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'kate',
    guidanceSceneLabel: 'Библиотека',
    choices: [
      {
        text: 'Взять ключ и идти к стеллажу',
        next: 'vladimir_secret_room',
        condition: { missingFlag: 'kate_echo_clue_given' },
        effects: [
          { type: 'triggerQuest', questId: 'echo_of_vladimir' },
          { type: 'setFlag', flag: 'kate_echo_clue_given', flagValue: true },
        ],
      },
      {
        text: 'Ключ уже есть — к тайнику',
        next: 'vladimir_secret_room',
        condition: {
          flag: 'kate_echo_clue_given',
          missingFlag: 'final_poem_read',
        },
      },
      {
        text: 'Позже — сначала дочитаю каталог',
        next: 'library_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'echo_of_vladimir' },
          { type: 'setFlag', flag: 'kate_echo_clue_given', flagValue: true },
        ],
      },
    ],
  },
  vladimir_secret_room: {
    id: 'vladimir_secret_room',
    text: 'За стеллажом с подшивками довоенных журналов — дверь, которой нет на планах. Ключ Кати поворачивается с тихим щелчком, как закрывающая скобка. Маленькая комната: стол, лампа, тетрадь в потёртой обложке. Последняя тетрадь Владимира Лебедева. Строки не открываются сразу — нужен ритм, который знает только тот, кто писал код как стих.',
    ambientSound: 'sounds/ambient/library_hush.ogg',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Секретная комната. Тетрадь Владимира ждёт разблокировки.',
    accessibilityAnnounce: 'Тайник Владимира. Тетрадь на столе.',
    guidanceHint: 'Разблокируй стихотворение у тетради — мини-игра поэзии.',
    guidanceObjectiveType: 'collect_item',
    guidanceSceneLabel: 'Библиотека',
    effects: [{ type: 'setFlag', flag: 'echo_secret_room_reached', flagValue: true }],
    choices: [
      {
        text: 'Прочитать последнее стихотворение',
        next: 'vladimir_secret_room_read',
        condition: {
          flag: 'final_poem_unlocked',
          missingFlag: 'final_poem_read',
        },
      },
      {
        text: 'Отойти — тетрадь подождёт у стеллажа',
        next: 'library_explore_mode',
        condition: { missingFlag: 'final_poem_read' },
      },
      {
        text: 'Выйти к стеллажам',
        next: 'library_explore_mode',
        condition: { flag: 'final_poem_read' },
      },
    ],
  },
  vladimir_secret_room_read: {
    id: 'vladimir_secret_room_read',
    text: 'Тетрадь открывается. На первой странице — строки, которые никогда не попадали в сеть. Ты читаешь — и понимаешь: это стихотворение не о конце. Оно о том, что после конца всегда есть продолжение. Эхо Владимира больше не прячется.',
    ambientSound: 'sounds/ambient/library_hush.ogg',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Последнее стихотворение Владимира прочитано. Тетрадь шепчет о Мире Снов.',
    accessibilityAnnounce: 'Финальное стихотворение Владимира прочитано. За строками открываются ещё две двери.',
    guidanceHint: 'За страницами ждут Мир Снов и Пустота — можно вернуться к тетради позже.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Библиотека',
    // FIX (v4.10.0, soft-lock): флаг final_poem_read перенесён из единственного
    // выбора в ЭФФЕКТЫ ВИЗИТА — visit-эффекты применяются рендером при входе в
    // узел, поэтому сон больше не блокирует «Эхо Владимира», а два хука
    // активации остаются доступны при повторном открытии тетради.
    effects: [{ type: 'setFlag', flag: 'final_poem_read', flagValue: true }],
    choices: [
      {
        // Хук активации «Мира Снов» (dreamworld_lost_child): гейт-инвариант —
        // флаг dream_world_opened выставляется ОДНОВРЕМЕННО с активацией, все
        // зоны-сеттеры целей гейтятся именно им.
        text: 'Перевернуть последнюю страницу — тетрадь дышит сном, где теряется дитя',
        next: 'act5_dream_descent',
        condition: { missingFlag: 'dream_world_opened' },
        effects: [
          { type: 'triggerQuest', questId: 'dreamworld_lost_child' },
          { type: 'setFlag', flag: 'dream_world_opened', flagValue: true },
        ],
      },
      {
        // Хук активации «Эха из Пустоты» (void_echo_poem): флаг
        // void_echo_quest_started гейтит все зоны эха и зону поэта.
        text: 'Ответить на шёпот из пустоты, сочащийся между строк',
        next: 'void_poet_gate',
        condition: { missingFlag: 'void_echo_quest_started' },
        effects: [
          { type: 'triggerQuest', questId: 'void_echo_poem' },
          { type: 'setFlag', flag: 'void_echo_quest_started', flagValue: true },
        ],
      },
      {
        text: 'Закрыть тетрадь и выйти',
        next: 'library_explore_mode',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 3 },
        ],
      },
    ],
  },

  // ─── Предатель в гильдии: mid-router factory logs → discovery → office ───
  act6_traitor_approach: {
    id: 'act6_traitor_approach',
    text: 'Цех помнит Александра лучше, чем реестр гильдии. Тайник с логами ещё тёплый — или уже расшифрован, и имя крота жжёт экран. Можно уйти и вернуться: правда не остывает.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Расследование предателя на заброшенной фабрике.',
    accessibilityAnnounce: 'Тайник Александра. Логи или след крота.',
    guidanceHint: 'Расшифруй логи — потом иди в офис к Дмитрию.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Тайник Александра — логи гильдии',
        next: 'act6_factory_investigation',
        condition: { missingFlag: 'alexander_logs_decrypted' },
        effects: [{ type: 'triggerQuest', questId: 'traitor_in_the_guild' }],
      },
      {
        text: 'Расшифрованные логи — кто крот?',
        next: 'act6_traitor_discovery',
        condition: {
          flag: 'alexander_logs_decrypted',
          missingFlag: 'traitor_revealed',
        },
      },
      {
        text: 'Имя найдено — к офису за правдой',
        next: 'factory_explore_mode',
        condition: {
          flag: 'traitor_revealed',
          missingFlag: 'traitor_fate_decided',
        },
      },
      { text: 'Отойти — цех ещё шумит', next: 'factory_explore_mode' },
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
      {
        text: 'Отойти — табличка ещё на камне',
        next: 'park_explore_mode',
        condition: { missingFlag: 'quest_act7_poets_monument_plate_cleared' },
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
      {
        text: 'Отойти — имена ещё не собраны',
        next: 'park_explore_mode',
        condition: { missingFlag: 'quest_act7_poets_monument_names_recalled' },
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
      {
        text: 'Отойти — резьба ещё не закончена',
        next: 'park_explore_mode',
        condition: { missingFlag: 'quest_act7_poets_monument_carved' },
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
      {
        text: 'Отойти — строка ещё не дописана',
        next: 'park_explore_mode',
        condition: { missingFlag: 'quest_act7_poets_monument_inscription_done' },
      },
    ],
  },
};
