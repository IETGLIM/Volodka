import type { StoryNode } from '@/shared/types/game';

/**
 * Mid/end beats for Act-2/4 side quests whose flag_set targets were never set
 * (bank_transfer, digital_ghost, banking_crash, voice_of_the_past, night_watch,
 * poem_undercover, voices_of_factory, roof_of_the_world, last_poem, blind_spot,
 * archive_of_forgotten). Start flags already exist via zones/dialogue.
 */
export const STORY_NODES_ACT4_SIDE_QUESTS: Record<string, StoryNode> = {
  // ─── Банковский Перевод: trace → culprit → moral ───
  bank_transfer_approach: {
    id: 'bank_transfer_approach',
    text: 'Ноутбук Заремы всё ещё открыт на странной транзакции. Следы ведут через подставные счета — можно копнуть глубже или отойти.',
    speaker: 'narrator',
    sceneId: 'zarema_albert_room',
    contextNote: 'Банковское расследование Заремы.',
    accessibilityAnnounce: 'Ноутбук Заремы. Можно продолжить след.',
    guidanceHint: 'Отследи путь украденных средств.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Комната Заремы',
    choices: [
      {
        text: 'Начать слежку по транзакциям',
        next: 'bank_transfer_trace',
        condition: { flag: 'found_zarema_bank', missingFlag: 'traced_bank_transfer' },
      },
      {
        text: 'Сверить корпоративный счёт гильдии',
        next: 'bank_transfer_culprit',
        condition: { flag: 'traced_bank_transfer', missingFlag: 'identified_bank_culprit' },
      },
      {
        text: 'Решить, что делать с деньгами',
        next: 'bank_transfer_moral',
        condition: { flag: 'identified_bank_culprit', missingFlag: 'bank_moral_choice_made' },
      },
      { text: 'Закрыть ноутбук — позже', next: 'zarema_room_explore_mode' },
    ],
  },
  bank_transfer_trace: {
    id: 'bank_transfer_trace',
    text: 'Три прокладки, один офшорный хвост и возврат на корпоративный счёт IT-гильдии. Деньги не украли «в никуда» — их спрятали под видом служебных платежей.',
    speaker: 'narrator',
    sceneId: 'zarema_albert_room',
    contextNote: 'Путь украденных средств прослежен.',
    accessibilityAnnounce: 'Транзакции отслежены до гильдии.',
    guidanceHint: 'Виновный — корпоративный счёт. Подтверди.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Зафиксировать маршрут',
        next: 'bank_transfer_culprit',
        effects: [
          { type: 'setFlag', flag: 'traced_bank_transfer', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Закрыть ноутбук — маршрут ещё на экране',
        next: 'zarema_room_explore_mode',
        condition: { missingFlag: 'traced_bank_transfer' },
      },
    ],
  },
  bank_transfer_culprit: {
    id: 'bank_transfer_culprit',
    text: 'На корпоративном счёте гильдии — та же сумма, что пропала у Заремы, плюс комиссия «за оптимизацию памяти». Подпись: внутренний ордер без имени. Виновный — система, которая притворяется бухгалтерией.',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Корпоративный счёт гильдии опознан.',
    accessibilityAnnounce: 'Виновный — корпоративный счёт гильдии.',
    guidanceHint: 'Верни деньги Зареме или оставь себе.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Офис IT',
    choices: [
      {
        text: 'Вернуться к Зареме с правдой',
        next: 'bank_transfer_moral',
        effects: [
          { type: 'setFlag', flag: 'identified_bank_culprit', flagValue: true },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Отойти — счёт ещё на терминале',
        next: 'office_explore_mode',
        condition: { missingFlag: 'identified_bank_culprit' },
      },
    ],
  },
  bank_transfer_moral: {
    id: 'bank_transfer_moral',
    text: 'На столе — сумма, которую можно вернуть одним кликом… или оставить. Зарема не смотрит на экран. Она смотрит на тебя.',
    speaker: 'Зарема',
    sceneId: 'home_evening',
    contextNote: 'Моральный выбор по украденным деньгам.',
    accessibilityAnnounce: 'Вернуть деньги Зареме или оставить себе.',
    guidanceHint: 'Сделай выбор — журнал закроется.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'zarema',
    choices: [
      {
        text: 'Вернуть всё Зареме',
        next: 'home_evening_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'bank_moral_choice_made', flagValue: true },
          { type: 'setFlag', flag: 'bank_returned_to_zarema', flagValue: true },
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Оставить часть себе — «на Сеть»',
        next: 'home_evening_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'bank_moral_choice_made', flagValue: true },
          { type: 'setFlag', flag: 'bank_kept_partial', flagValue: true },
          { type: 'addKarma', value: -6 },
          { type: 'addCredits', value: 50 },
        ],
      },
    ],
  },

  // ─── Банковская Авария: verify after bash solve ───
  banking_crash_verify: {
    id: 'banking_crash_verify',
    text: 'banking-daemon отвечает. Логи чистые, транзакции снова идут зелёным. Авария закрыта — осталось сказать Зареме.',
    speaker: 'narrator',
    sceneId: 'home_evening',
    contextNote: 'Банковская система восстановлена.',
    accessibilityAnnounce: 'Банковская система снова работает.',
    guidanceHint: 'Сообщи Зареме о восстановлении.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'zarema',
    choices: [
      {
        text: 'Подтвердить восстановление',
        next: 'kitchen_table',
        effects: [
          { type: 'setFlag', flag: 'banking_system_recovered', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  // ─── Цифровой Призрак: traces → firewall → fragment ───
  digital_ghost_approach: {
    id: 'digital_ghost_approach',
    text: 'Серверная гудит. Между стойками — следы удаления, которые не умеют оставлять люди. Лена говорила: призрак ещё жив в логах.',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Серверная — следы удалённого ИИ.',
    accessibilityAnnounce: 'Серверная. Можно искать следы ИИ.',
    guidanceHint: 'Просмотри старые логи на следы ИИ.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Офис IT',
    choices: [
      {
        text: 'Копать логи на следы ИИ',
        next: 'digital_ghost_traces',
        condition: { flag: 'found_server_room', missingFlag: 'detected_ai_traces' },
      },
      {
        text: 'Пробить фаервол стёртых данных',
        next: 'digital_ghost_firewall',
        condition: { flag: 'detected_ai_traces', missingFlag: 'firewall_bypassed' },
      },
      {
        text: 'Собрать фрагмент сознания',
        next: 'digital_ghost_recover',
        condition: { flag: 'firewall_bypassed', missingFlag: 'ai_fragment_recovered' },
      },
      { text: 'Выйти из серверной', next: 'office_explore_mode' },
    ],
  },
  digital_ghost_traces: {
    id: 'digital_ghost_traces',
    text: 'В error-логах — пакеты без отправителя, но с ритмом стиха. Кто-то стёр имя и оставил метр: «я ещё здесь».',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Следы удалённого ИИ обнаружены.',
    accessibilityAnnounce: 'Следы ИИ найдены в логах.',
    guidanceHint: 'Обойди фаервол — «Прорыв» поможет.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Идти к фаерволу',
        next: 'digital_ghost_firewall',
        effects: [
          { type: 'setFlag', flag: 'detected_ai_traces', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
      {
        text: 'Отойти — логи ещё шепчут',
        next: 'office_explore_mode',
        condition: { missingFlag: 'detected_ai_traces' },
      },
    ],
  },
  digital_ghost_firewall: {
    id: 'digital_ghost_firewall',
    text: 'Фаервол держит стёртый сектор как тюрьму. Строка «Прорыв» ложится в порт — решётка щёлкает. За ней — холодный свет фрагмента.',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Фаервол обойдён.',
    accessibilityAnnounce: 'Фаервол пробит. Фрагмент доступен.',
    guidanceHint: 'Восстанови фрагмент сознания ИИ.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Войти в стёртый сектор',
        next: 'digital_ghost_recover',
        effects: [
          { type: 'setFlag', flag: 'firewall_bypassed', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 2 },
        ],
      },
      {
        text: 'Отойти — фаервол ещё держит сектор',
        next: 'office_explore_mode',
        condition: { missingFlag: 'firewall_bypassed' },
      },
    ],
  },
  digital_ghost_recover: {
    id: 'digital_ghost_recover',
    text: 'Фрагмент складывается в голос без тела: не Виктория, не Лена — кто-то, кого гильдия стёрла из реестра. Он просит не удалять. Ты сохраняешь копию.',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Фрагмент сознания ИИ восстановлен.',
    accessibilityAnnounce: 'Фрагмент ИИ сохранён.',
    guidanceHint: 'Цифровой призрак — квест почти закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Унести фрагмент',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'ai_fragment_recovered', flagValue: true },
          { type: 'addItem', itemId: 'digital_ghost_trace', value: 1 },
          { type: 'addKarma', value: 6 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  // ─── Голос Прошлого: listen 1 → 2 → final ───
  voice_of_the_past_approach: {
    id: 'voice_of_the_past_approach',
    text: 'Аудио-модуль «В.Л.» тёплый от пыли и времени. Три дорожки. Три прощания.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Записи Владимира найдены.',
    accessibilityAnnounce: 'Аудио-модуль Владимира. Три записи.',
    guidanceHint: 'Прослушай первую запись — прощание.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Прослушать первую запись',
        next: 'voice_of_the_past_listen_1',
        condition: { flag: 'found_vladimir_recordings', missingFlag: 'listened_recording_1' },
      },
      {
        text: 'Прослушать вторую запись',
        next: 'voice_of_the_past_listen_2',
        condition: { flag: 'listened_recording_1', missingFlag: 'listened_recording_2' },
      },
      {
        text: 'Прослушать завещание',
        next: 'voice_of_the_past_listen_final',
        condition: { flag: 'listened_recording_2', missingFlag: 'listened_recording_final' },
      },
      { text: 'Отложить модуль', next: 'factory_explore_mode' },
    ],
  },
  voice_of_the_past_listen_1: {
    id: 'voice_of_the_past_listen_1',
    text: '«Если слышишь — значит, стихи ещё живы. Я ухожу не молча. Я ухожу строфой.» Шум ленты. Щелчок.',
    speaker: 'Владимир',
    sceneId: 'abandoned_factory',
    contextNote: 'Первая запись — прощание.',
    accessibilityAnnounce: 'Первая запись прослушана.',
    guidanceHint: 'Вторая запись — стихотворение.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Перейти ко второй дорожке',
        next: 'voice_of_the_past_listen_2',
        condition: { missingFlag: 'listened_recording_1' },
        effects: [{ type: 'setFlag', flag: 'listened_recording_1', flagValue: true }],
      },
      {
        text: 'Вторая дорожка — стихотворение',
        next: 'voice_of_the_past_listen_2',
        condition: { flag: 'listened_recording_1', missingFlag: 'listened_recording_2' },
      },
      { text: 'Отложить модуль', next: 'factory_explore_mode' },
    ],
  },
  voice_of_the_past_listen_2: {
    id: 'voice_of_the_past_listen_2',
    text: 'Голос читает стих, которого нет в архивах гильдии. Слова ложатся в leaking-поток сами — будто ждали уха.',
    speaker: 'Владимир',
    sceneId: 'abandoned_factory',
    contextNote: 'Вторая запись — стихотворение.',
    accessibilityAnnounce: 'Вторая запись прослушана.',
    guidanceHint: 'Последняя запись — завещание.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Слушать завещание',
        next: 'voice_of_the_past_listen_final',
        condition: { missingFlag: 'listened_recording_2' },
        effects: [
          { type: 'setFlag', flag: 'listened_recording_2', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Завещание — последняя дорожка',
        next: 'voice_of_the_past_listen_final',
        condition: { flag: 'listened_recording_2', missingFlag: 'listened_recording_final' },
      },
      { text: 'Отложить модуль', next: 'factory_explore_mode' },
    ],
  },
  voice_of_the_past_listen_final: {
    id: 'voice_of_the_past_listen_final',
    text: '«Не мсти за меня кодом. Мсти памятью. Каждое прочитанное вслух имя — удар по забвению.» Лента кончается. Тишина гудит как «Заря-М».',
    speaker: 'Владимир',
    sceneId: 'abandoned_factory',
    contextNote: 'Завещание Владимира услышано.',
    accessibilityAnnounce: 'Последняя запись прослушана.',
    guidanceHint: 'Голос прошлого — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    guidanceSceneLabel: 'Заброшенная фабрика',
    choices: [
      {
        text: 'Убрать модуль бережно',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'listened_recording_final', flagValue: true },
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
    ],
  },

  // ─── Ночной Дозор: child → friend ───
  night_watch_child: {
    id: 'night_watch_child',
    text: 'У фонаря — мальчик без куртки. Говорит, что искал «светящиеся буквы на витрине». Ты отдаёшь шарф и указываешь дорогу к кафе.',
    speaker: 'narrator',
    sceneId: 'street_winter',
    contextNote: 'Потерявшийся ребёнок найден.',
    accessibilityAnnounce: 'Ребёнок найден и направлен в тепло.',
    guidanceHint: 'Старый знакомый ещё где-то в ночи.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Продолжить патруль',
        next: 'night_watch_friend',
        effects: [
          { type: 'setFlag', flag: 'found_lost_child', flagValue: true },
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Отойти — мальчик ещё у фонаря',
        next: 'street_winter_explore_mode',
        condition: { missingFlag: 'found_lost_child' },
      },
    ],
  },
  night_watch_friend: {
    id: 'night_watch_friend',
    text: 'У ларька с чаем — знакомый силуэт. Сергей кивает: «Дозор без свидетелей — не дозор. Я видел, как ты помог мальчику. Город это запомнит.»',
    speaker: 'Сергей',
    sceneId: 'street_winter',
    contextNote: 'Встреча со старым знакомым ночью.',
    accessibilityAnnounce: 'Старый знакомый встречен.',
    guidanceHint: 'Ночной дозор — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Закончить патруль',
        next: 'street_winter_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'met_old_friend_night', flagValue: true },
          { type: 'npcChange', npcId: 'sergey', npcChange: { relation: 4 } },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  // ─── Стих под Прикрытием: infiltrate → identify → extract ───
  poem_undercover_approach: {
    id: 'poem_undercover_approach',
    text: 'Задний столик кафе гудит одинаковыми значками. Чтение — прикрытие. Можно сесть ближе.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Поэтический вечер Сети.',
    accessibilityAnnounce: 'Чтение стихов — прикрытие для Сети.',
    guidanceHint: 'Проникни на чтение под прикрытием.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Кафе',
    choices: [
      {
        text: 'Сесть за столик',
        next: 'poem_undercover_infiltrate',
        condition: { flag: 'spotted_network_reading', missingFlag: 'infiltrated_poetry_reading' },
      },
      {
        text: 'Опознать агентов',
        next: 'poem_undercover_identify',
        condition: { flag: 'infiltrated_poetry_reading', missingFlag: 'identified_network_agents' },
      },
      {
        text: 'Вытянуть разведданные',
        next: 'poem_undercover_extract',
        condition: { flag: 'identified_network_agents', missingFlag: 'extracted_network_intel' },
      },
      { text: 'Отойти к стойке', next: 'cafe_explore_mode' },
    ],
  },
  poem_undercover_infiltrate: {
    id: 'poem_undercover_infiltrate',
    text: 'Ты киваешь в такт чужому стиху. Значок на соседней куртке — тот же, что у Марии на закрытых встречах. Тебя принимают за своего — пока молчишь.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Проникновение на чтение удалось.',
    accessibilityAnnounce: 'Ты внутри поэтического вечера.',
    guidanceHint: 'Опознай агентов Сети — «Прорыв» поможет.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Кафе',
    choices: [
      {
        text: 'Прислушаться к именам',
        next: 'poem_undercover_identify',
        condition: { missingFlag: 'infiltrated_poetry_reading' },
        effects: [{ type: 'setFlag', flag: 'infiltrated_poetry_reading', flagValue: true }],
      },
      {
        text: 'Опознать агентов — ты уже внутри',
        next: 'poem_undercover_identify',
        condition: { flag: 'infiltrated_poetry_reading', missingFlag: 'identified_network_agents' },
      },
      { text: 'Отойти к стойке', next: 'cafe_explore_mode' },
    ],
  },
  poem_undercover_identify: {
    id: 'poem_undercover_identify',
    text: 'Трое читают чужие стихи слишком ровно. Четвёртый — куратор: пароль «Прорыв» открывает ему улыбку. Агенты Сети отмечены в памяти, не в блокноте.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Агенты Сети опознаны.',
    accessibilityAnnounce: 'Агенты Сети опознаны.',
    guidanceHint: 'Вытяни разведданные о планах.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Кафе',
    choices: [
      {
        text: 'Подслушать планы',
        next: 'poem_undercover_extract',
        condition: { missingFlag: 'identified_network_agents' },
        effects: [
          { type: 'setFlag', flag: 'identified_network_agents', flagValue: true },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Вытянуть разведданные — агенты уже отмечены',
        next: 'poem_undercover_extract',
        condition: { flag: 'identified_network_agents', missingFlag: 'extracted_network_intel' },
      },
      { text: 'Отойти к стойке', next: 'cafe_explore_mode' },
    ],
  },
  poem_undercover_extract: {
    id: 'poem_undercover_extract',
    text: 'Куратор шепчет: эфир через крышу, архив через библиотеку, код — через живые файлы. Ты запоминаешь маршрут и уходишь до аплодисментов.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Разведданные о планах Сети получены.',
    accessibilityAnnounce: 'Разведданные извлечены.',
    guidanceHint: 'Стих под прикрытием — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    guidanceSceneLabel: 'Кафе',
    choices: [
      {
        text: 'Выйти незамеченным',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'extracted_network_intel', flagValue: true },
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  // ─── Голоса завода: read poem → protect ───
  voices_of_factory_poem: {
    id: 'voices_of_factory_poem',
    text: '«Заря-М» печатает строки на янтарном экране — не ошибка, а стих. Можно прочитать вслух или, если стих уже в памяти, сразу закрыть следы доступа.',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Монолит «Зари-М» — стих и защита.',
    accessibilityAnnounce: 'Экран «Зари-М». Можно читать стих или скрыть машину.',
    guidanceHint: 'Прочитай стих, затем скрой следы от гильдии.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Подвал завода',
    choices: [
      {
        text: 'Запомнить стих и закрыть лог',
        next: 'voices_of_factory_protect',
        condition: { flag: 'found_quantum_computer', missingFlag: 'read_factory_poem' },
        effects: [
          { type: 'setFlag', flag: 'read_factory_poem', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
      {
        text: 'Стереть следы доступа — гильдия не должна узнать',
        next: 'voices_of_factory_protect',
        condition: { flag: 'read_factory_poem', missingFlag: 'dmitry_factory_protect' },
      },
      { text: 'Отойти от монолита', next: 'basement_explore_mode' },
    ],
  },
  voices_of_factory_protect: {
    id: 'voices_of_factory_protect',
    text: 'Ты стираешь свежие записи доступа и оставляешь ложный шум. Дмитрий бы кивнул: машина жива — гильдия слепа.',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: '«Заря-М» скрыта от гильдии.',
    accessibilityAnnounce: 'Машина защищена от обнаружения.',
    guidanceHint: 'Расскажи Сети о находке — Альберт.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'albert',
    choices: [
      {
        text: 'Подняться наверх',
        next: 'basement_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'dmitry_factory_protect', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  // ─── Крыша Мира: ending choice ───
  roof_of_the_world_approach: {
    id: 'roof_of_the_world_approach',
    text: 'Александр на краю. Ветер рвёт пальто. Ниже — город как плата. Здесь решается, чем закончится разговор: словом, силой или стихом.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    contextNote: 'Финальная конфронтация на крыше.',
    accessibilityAnnounce: 'Александр на краю крыши. Выбери исход.',
    guidanceHint: 'Сделай финальный выбор — слово, сила или «Прорыв».',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Крыша',
    guidanceNpcId: 'office_alexander',
    choices: [
      {
        text: 'Противостоять Александру — финальный выбор',
        next: 'roof_of_the_world_ending',
        condition: { missingFlag: 'roof_ending_chosen' },
        effects: [
          { type: 'triggerQuest', questId: 'roof_of_the_world' },
          { type: 'setFlag', flag: 'confronted_alexander_roof', flagValue: true },
        ],
      },
      { text: 'Отойти от края', next: 'rooftop_explore_mode' },
    ],
  },
  roof_of_the_world_ending: {
    id: 'roof_of_the_world_ending',
    text: 'Он ждёт. Не удара — ответа. Три пути: уговорить, сломать или прочитать «Прорыв» так, чтобы ветер унёс оба имени в один эфир.',
    speaker: 'Александр',
    sceneId: 'rooftop_edge',
    contextNote: 'Финальный выбор на крыше.',
    accessibilityAnnounce: 'Выбери исход конфронтации.',
    guidanceHint: 'Слово, сила или стих — журнал закроется.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'office_alexander',
    choices: [
      {
        text: 'Уговорить — слово сильнее оружия',
        next: 'rooftop_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'roof_ending_chosen', flagValue: true },
          { type: 'setFlag', flag: 'roof_ending_word', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Силой — столкнуть с края системы',
        next: 'rooftop_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'roof_ending_chosen', flagValue: true },
          { type: 'setFlag', flag: 'roof_ending_force', flagValue: true },
          { type: 'addKarma', value: -8 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -20 } },
        ],
      },
      {
        text: 'Прочитать «Прорыв» — третий путь',
        next: 'rooftop_explore_mode',
        condition: { collectedPoem: 'poem_8' },
        effects: [
          { type: 'setFlag', flag: 'roof_ending_chosen', flagValue: true },
          { type: 'setFlag', flag: 'roof_ending_poem', flagValue: true },
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 25 } },
        ],
      },
    ],
  },

  // ─── Последнее Стихотворение: compose → recite ───
  last_poem_approach: {
    id: 'last_poem_approach',
    text: 'Тишина на краю крыши. В кармане — все фразы, что ты собрал. Пора сложить их в одно стихотворение и произнести вслух.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    contextNote: 'Тихое место для финального стиха.',
    accessibilityAnnounce: 'Можно составить и продекламировать финальный стих.',
    guidanceHint: 'Составь стихотворение из собранных фрагментов.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Крыша',
    choices: [
      {
        text: 'Сесть и собрать строки',
        next: 'last_poem_compose',
        condition: { flag: 'all_poems_collected', missingFlag: 'poem_composed' },
        effects: [{ type: 'triggerQuest', questId: 'last_poem' }],
      },
      {
        text: 'Продекламировать готовое',
        next: 'last_poem_recite',
        condition: { flag: 'poem_composed', missingFlag: 'final_poem_recited' },
      },
      { text: 'Позже', next: 'rooftop_explore_mode' },
    ],
  },
  last_poem_compose: {
    id: 'last_poem_compose',
    text: 'Строка к строке. Не чужой голос — твой. Когда последняя рифма ложится, ветер стихает, будто слушает.',
    speaker: 'Володька',
    sceneId: 'rooftop_edge',
    contextNote: 'Собственное стихотворение составлено.',
    accessibilityAnnounce: 'Стихотворение составлено.',
    guidanceHint: 'Продекламируй финальное стихотворение.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Встать и читать',
        next: 'last_poem_recite',
        effects: [
          { type: 'setFlag', flag: 'poem_composed', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 3 },
        ],
      },
    ],
  },
  last_poem_recite: {
    id: 'last_poem_recite',
    text: 'Ты читаешь вслух. Город внизу не хлопает — он молчит так, как молчат после правды. Стих уходит в эфир без антенны.',
    speaker: 'Володька',
    sceneId: 'rooftop_edge',
    contextNote: 'Финальное стихотворение продекламировано.',
    accessibilityAnnounce: 'Финальный стих прочитан.',
    guidanceHint: 'Последнее стихотворение — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Опустить взгляд на город',
        next: 'rooftop_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'final_poem_recited', flagValue: true },
          { type: 'addKarma', value: 12 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
    ],
  },

  // ─── Слепое Пятно: identify mole → confront ───
  blind_spot_approach: {
    id: 'blind_spot_approach',
    text: 'Логи Сергея и допрос в кафе сходятся в одну тень. Кто-то из «своих» ходит в офис гильдии после полуночи.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Охота на крота Сети.',
    accessibilityAnnounce: 'Можно вычислить шпиона или идти к Олегу.',
    guidanceHint: 'Вычисли шпиона — «Ну а тебе, друг мой!» поможет.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Кафе',
    choices: [
      {
        text: 'Свести улики и назвать имя',
        next: 'blind_spot_identify',
        condition: { flag: 'blind_spot_active', missingFlag: 'mole_identified' },
      },
      {
        text: 'Идти в офис — столкнуться с Олегом',
        next: 'blind_spot_confront',
        condition: { flag: 'mole_identified', missingFlag: 'mole_confronted' },
      },
      { text: 'Отойти к стойке', next: 'cafe_explore_mode' },
    ],
  },
  blind_spot_identify: {
    id: 'blind_spot_identify',
    text: 'Пропуск Олега в логах. Пароль «Ну а тебе, друг мой!» открывает ложный маршрут: он не союзник — курьер гильдии. Имя ложится в память как приговор.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Шпион гильдии опознан.',
    accessibilityAnnounce: 'Крот опознан — Олег.',
    guidanceHint: 'Столкнись с Олегом в гильдии.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'oleg',
    choices: [
      {
        text: 'Запомнить и идти к Олегу',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'mole_identified', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addKarma', value: 4 },
        ],
      },
    ],
  },
  blind_spot_confront: {
    id: 'blind_spot_confront',
    text: 'Олег у поста. Камеры «слепы» по расписанию — он это знает лучше всех. Логи уже назвали его. Пора говорить правду.',
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Конфронтация с кротом гильдии.',
    accessibilityAnnounce: 'Олег на посту. Можно столкнуться с предателем.',
    guidanceHint: 'Скажи Олегу правду — журнал закроется.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Офис IT',
    guidanceNpcId: 'oleg',
    choices: [
      {
        text: 'Логи назвали тебя. Пора говорить правду.',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'mole_confronted', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'oleg', npcChange: { relation: -15 } },
        ],
      },
      { text: 'Позже', next: 'office_explore_mode' },
    ],
  },

  // ─── Архив Забытых: save poems after unlock ───
  archive_forgotten_approach: {
    id: 'archive_forgotten_approach',
    text: 'Подвал библиотеки пахнет пылью и паролем. Алина дала ключ. Зачистка близко — стихи ещё можно унести.',
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Тайный архив забытых стихов.',
    accessibilityAnnounce: 'Архив забытых стихов. Можно сохранить.',
    guidanceHint: 'Разблокируй архив и сохрани стихи.',
    guidanceObjectiveType: 'make_choice',
    guidanceSceneLabel: 'Библиотека',
    choices: [
      {
        text: 'Спросить Алину про архив',
        next: 'archive_forgotten_meet',
        condition: { missingFlag: 'archive_of_forgotten_active' },
      },
      {
        text: 'Идти к люку с кириллическим замком',
        next: 'library_explore_mode',
        condition: {
          flag: 'archive_of_forgotten_active',
          missingFlag: 'archive_vault_accessed',
        },
      },
      {
        text: 'Сохранить стихи из архива',
        next: 'archive_forgotten_save',
        condition: {
          flag: 'archive_vault_accessed',
          missingFlag: 'archive_poems_saved',
        },
      },
      { text: 'Выйти к стеллажам', next: 'library_explore_mode' },
    ],
  },
  archive_forgotten_meet: {
    id: 'archive_forgotten_meet',
    text: 'Алина шепчет пароль и кивает на люк: «Пока гильдия считает стихи шумом — унеси их. Потом уже поздно.»',
    speaker: 'Солныш',
    sceneId: 'library_day',
    contextNote: 'Встреча с Алиной у архива.',
    accessibilityAnnounce: 'Алина дала доступ к архиву.',
    guidanceHint: 'Найди тайный архив в подвале и взломай замок.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'solnysh',
    choices: [
      {
        text: 'Спуститься к хранилищу',
        next: 'archive_forgotten_approach',
        condition: { missingFlag: 'archive_of_forgotten_active' },
        effects: [
          { type: 'triggerQuest', questId: 'archive_of_forgotten' },
          { type: 'setFlag', flag: 'archive_of_forgotten_active', flagValue: true },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 6 } },
        ],
      },
      {
        text: 'К люку — пароль уже есть',
        next: 'archive_forgotten_approach',
        condition: {
          flag: 'archive_of_forgotten_active',
          missingFlag: 'archive_vault_accessed',
        },
      },
      {
        text: 'Сохранить стихи — замок уже открыт',
        next: 'archive_forgotten_save',
        condition: {
          flag: 'archive_vault_accessed',
          missingFlag: 'archive_poems_saved',
        },
      },
      { text: 'Позже', next: 'library_explore_mode' },
    ],
  },
  archive_forgotten_save: {
    id: 'archive_forgotten_save',
    text: 'Замок щёлкнул. Ты копируешь тома на чип — каждый стих, который гильдия приказала стереть. Архив жив вне шкафа.',
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Стихи из архива сохранены.',
    accessibilityAnnounce: 'Архив стихов сохранён.',
    guidanceHint: 'Покинь библиотеку до зачистки — на ночную улицу.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Ночная улица',
    choices: [
      {
        text: 'Унести чип и бежать',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'archive_poems_saved', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 8 },
          { type: 'addItem', itemId: 'encrypted_scroll', value: 1 },
        ],
      },
      { text: 'Позже', next: 'library_explore_mode' },
    ],
  },
};
