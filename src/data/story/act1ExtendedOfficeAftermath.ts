import type { StoryNode } from '@/shared/types/game';

/**
 * Act 1 extended beats — after incident #4729 poem decode through Friday → Act 2.
 * Soft spine: fix_success → office politics → vault lead → balcony → Friday spleen → Albert → Act 2.
 */
export const STORY_NODES_ACT1_OFFICE_AFTERMATH: Record<string, StoryNode> = {
  /* Override: decryption opens aftermath quest and routes into guild pressure beat. */
  fix_success: {
    id: 'fix_success',
    text: 'Пальцы бегут по клавишам. Cascading логи #4729 складываются в узор — не хаос, а строфа. Дешифратор делает последний проход, и на экране проступает текст. Не баг. Стихи. Живые, спрятанные в недрах серверов гильдии. За спиной Александр молчит слишком долго. Коллега у соседней станции уже не смотрит в монитор — смотрит на тебя.',
    contextNote: 'Офис гильдии. На экране — расшифрованные строки, похожие на стихи.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    accessibilityAnnounce: 'В логах инцидента обнаружены стихи.',
    musicCue: 'discovery',
    soundEffect: 'quest_complete',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Остановись и подумай — несправедливость мира заслуживает слова.',
    guidanceObjectiveType: 'collect_item',
    effects: [
      { type: 'collectPoem', poemId: 'poem_32' },
      { type: 'triggerQuest', questId: 'code_poem_aftermath' },
      { type: 'triggerQuest', questId: 'poetry_collection' },
    ],
    choices: [
      {
        text: 'Внимательно прочитать стихотворение',
        next: 'office_poem_aftermath',
        goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_1' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'found_first_poem', flagValue: true },
          { type: 'setFlag', flag: 'read_poem_1', flagValue: true },
          { type: 'setFlag', flag: 'thread_lore_4729', flagValue: true },
          { type: 'setFlag', flag: 'solved_albert_riddle', flagValue: true },
          { type: 'setFlag', flag: 'proved_poetry_code_link', flagValue: true },
        ],
      },
      {
        text: 'Сохранить копию и доложить Александру',
        next: 'office_alexander',
        effects: [
          { type: 'collectPoem', poemId: 'poem_1' },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'found_first_poem', flagValue: true },
          { type: 'setFlag', flag: 'reported_poem_to_alexander', flagValue: true },
          { type: 'setFlag', flag: 'read_poem_1', flagValue: true },
          { type: 'setFlag', flag: 'thread_lore_4729', flagValue: true },
          { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
        ],
      },
      {
        text: 'Сразу к коллеге — он уже всё понял по твоему лицу',
        next: 'office_colleague',
        effects: [
          { type: 'collectPoem', poemId: 'poem_1' },
          { type: 'setFlag', flag: 'found_first_poem', flagValue: true },
          { type: 'setFlag', flag: 'read_poem_1', flagValue: true },
          { type: 'setFlag', flag: 'thread_lore_4729', flagValue: true },
          { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  /* After poem_1 surfaces in #4729 logs — guild pressure, then colleague. */
  office_poem_aftermath: {
    id: 'office_poem_aftermath',
    text: 'Экран ещё держит стих, а за стеклянной перегородкой уже шепчутся. Александр не смотрит на тебя — смотрит на KPI: «Аномалия задокументирована. Не распространять.» Коллега у станций делает вид, что чинит кабель, но пальцы дрожат. Чип в кармане остывает — будто знает: дальше не код, а политика.',
    contextNote: 'Офис после расшифровки #4729. Стих на экране. Гильдия уже давит.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    soundEffect: 'notify',
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Стих найден — теперь почувствуй давление гильдии и спроси коллегу.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'office_colleague',
    effects: [
      { type: 'setFlag', flag: 'found_first_poem', flagValue: true },
      { type: 'setFlag', flag: 'read_poem_1', flagValue: true },
      { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
      { type: 'setFlag', flag: 'thread_lore_4729', flagValue: true },
      { type: 'triggerQuest', questId: 'code_poem_aftermath' },
    ],
    choices: [
      {
        text: 'Подойти к коллеге — пока Александр отвернулся',
        next: 'office_colleague',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addKarma', value: 2 },
          { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
        ],
      },
      {
        text: 'Доложить Александру официально — потом к коллеге',
        next: 'office_alexander',
        effects: [
          { type: 'setFlag', flag: 'reported_poem_to_alexander', flagValue: true },
          { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Ещё раз прочитать стих — запомнить ритм',
        next: 'office_colleague',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'found_first_poem', flagValue: true },
          { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
        ],
      },
    ],
  },

  /* Override: colleague after poem — route into vault whisper on golden path. */
  office_colleague: {
    id: 'office_colleague',
    text: 'Коллега не поднимает глаз от проводов, но голос — едва слышный: «Ты тоже видел строки? Не говори вслух. После Краха стёрли целые разделы… Некоторым лучше не лезть.» Он кивает на камеры. «Если спросят громче — я откажусь. Если тише — помогу.»',
    contextNote: 'Офис гильдии. Коллега шепчет про архивы после стиха в логах.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    speaker: 'Коллега',
    sceneId: 'office_day',
    guidanceHint: 'Убеди коллегу рассказать — информация стоит усилий.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'office_colleague',
    effects: [
      { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
      { type: 'triggerQuest', questId: 'code_poem_aftermath' },
    ],
    choices: [
      {
        text: 'Убедить рассказать больше — тихо',
        next: 'office_colleague_vault_whisper',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
        ],
      },
      {
        text: 'Кивнуть — понял без лишних слов',
        next: 'office_colleague_vault_whisper',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 4 } },
          { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
        ],
      },
      {
        text: 'Поблагодарить и вернуться к Александру',
        next: 'office_alexander',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
        ],
      },
      {
        text: 'Игнорировать предупреждение — к терминалу',
        next: 'start_diagnosis',
        effects: [{ type: 'addStat', stat: 'stress', value: 5 }],
      },
    ],
  },

  office_colleague_vault_whisper: {
    id: 'office_colleague_vault_whisper',
    text: 'Коллега шепчет, не поднимая глаз от кабеля: «То, что ты вытащил из #4729 — не баг. После Краха стёрли разделы. Но копия… копия может быть в Хранилище. Официально его нет. Неофициально — старшие ходят туда по ночам.» Он суёт тебе бумажку с номером стойки. «Если спросят — ты чинил принтер. После смены — думай на воздухе. Балкон дома слышит лучше офиса.»',
    contextNote: 'Рабочие станции. Коллега даёт намёк на Хранилище.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    speaker: 'Коллега',
    sceneId: 'office_day',
    guidanceHint: 'Запомни намёк на Хранилище — это путь к испытанию.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'office_colleague',
    effects: [
      { type: 'setFlag', flag: 'vault_rumor_heard', flagValue: true },
      { type: 'setFlag', flag: 'colleague_shared_poetry_code', flagValue: true },
      { type: 'setFlag', flag: 'guild_poem_pressure', flagValue: true },
      { type: 'triggerQuest', questId: 'code_poem_aftermath' },
      { type: 'triggerQuest', questId: 'vault_backup_trial' },
      { type: 'triggerQuest', questId: 'friday_spleen' },
    ],
    choices: [
      {
        text: 'Поблагодарить и выйти на воздух — нужно подумать',
        next: 'balcony_thought',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'colleague_help_access', flagValue: true },
          { type: 'setFlag', flag: 'vault_rumor_heard', flagValue: true },
          { type: 'setFlag', flag: 'vault_access_granted', flagValue: true },
          { type: 'setFlag', flag: 'left_office_after_vault', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Спросить ещё — где именно терминал',
        next: 'colleague_persuasion_line',
        effects: [
          { type: 'setFlag', flag: 'vault_rumor_heard', flagValue: true },
          { type: 'setFlag', flag: 'left_office_after_vault', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Сразу к терминалу Хранилища',
        next: 'office_vault_archive',
        effects: [
          { type: 'setFlag', flag: 'vault_rumor_heard', flagValue: true },
          { type: 'setFlag', flag: 'vault_access_granted', flagValue: true },
          { type: 'setFlag', flag: 'colleague_help_access', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
      {
        text: 'Вернуться к Александру — слишком рискованно',
        next: 'office_alexander',
        effects: [
          { type: 'setFlag', flag: 'vault_rumor_heard', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* Override: balcony still grants poem_3, then Friday spleen beat. */
  balcony_thought: {
    id: 'balcony_thought',
    text: 'Ты выходишь на балкон. Холод бьёт в лицо, но город сегодня особенно красноречив. Серверные башни пульсируют ровным светом — как мониторы, для которых ты когда-то строил кластер. Река Белая отражает неон. В трещинах панелек — старые данные. А между ними — новые башни без памяти. Слова складываются сами. Уфа — сервер с окнами. И сейчас он передаёт тебе пакет.',
    contextNote: 'Балкон дома. Вечер. Город диктует стих.',
    ambientSound: 'sounds/ambient/city_night_distant.ogg',
    accessibilityAnnounce: 'Балкон. Город подсказывает строки.',
    speaker: 'narrator',
    sceneId: 'home_evening',
    guidanceHint: 'Взгляни на город сверху — каждый путь ведёт куда-то.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'collectPoem', poemId: 'poem_31' },
      { type: 'setFlag', flag: 'left_office_after_vault', flagValue: true },
      { type: 'triggerQuest', questId: 'friday_spleen' },
    ],
    choices: [
      {
        text: 'Записать стихотворение, родившееся в голове',
        next: 'friday_arrives',
        goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_3' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'left_office_after_vault', flagValue: true },
        ],
      },
      {
        text: 'Просто постоять в тишине',
        next: 'kitchen_table',
        effects: [
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'addStat', stat: 'energy', value: 5 },
          { type: 'setFlag', flag: 'left_office_after_vault', flagValue: true },
        ],
      },
      {
        text: 'Вернуться к терминалу — нужно работать',
        next: 'room_table',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'setFlag', flag: 'left_office_after_vault', flagValue: true },
        ],
      },
    ],
  },

  /* Override: Friday opens spleen night → Albert bridge (soft-lock safe skip). */
  friday_arrives: {
    id: 'friday_arrives',
    text: 'Пятница. Вечер. Сто сорок седьмая пятница с тех пор, как ты ушёл из гильдии — и первая, когда в логах остался стих, который ты сам увидел. Комната пустее без радио Заремы. Только гул серверов и мигание светодиодов. Строчки кода и строчки стихов сливаются. Где-то в «Синей яме» Альберт уже постукивает кружкой — будто ждёт, пока ты поймёшь: живой код не кончается в офисе.',
    contextNote: 'Комната. Пятничный сплин. Мост к Сети уже слышен.',
    accessibilityAnnounce: 'Пятница. Одиночество складывается в стих.',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'volodka_room',
    guidanceHint: 'Позволь тоске стать стихами — потом к Альберту или к Сети.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'left_office_after_vault', flagValue: true },
      { type: 'triggerQuest', questId: 'friday_spleen' },
    ],
    choices: [
      {
        text: 'Написать стихотворение об одиночестве',
        next: 'friday_spleen_night',
        goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_4' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'setFlag', flag: 'friday_spleen_written', flagValue: true },
        ],
      },
      {
        text: 'Выйти из дома — не сидеть же так',
        next: 'act2_transition',
        effects: [
          { type: 'addStat', stat: 'energy', value: 5 },
          { type: 'addKarma', value: 1 },
          { type: 'collectPoem', poemId: 'poem_4' },
          { type: 'setFlag', flag: 'friday_spleen_written', flagValue: true },
          // Soft-lock: skipping café still completes Albert bridge objective.
          { type: 'setFlag', flag: 'friday_albert_bridge_heard', flagValue: true },
        ],
      },
      {
        text: 'Позвонить Зареме',
        next: 'kitchen_table',
        effects: [
          {
            type: 'npcChange',
            npcId: 'zarema',
            npcChange: { relation: 3 },
          },
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'collectPoem', poemId: 'poem_16' },
          { type: 'setFlag', flag: 'friday_spleen_written', flagValue: true },
        ],
      },
    ],
  },

  /* Friday night — spleen already written; Albert bridge toward Act 2. */
  friday_spleen_night: {
    id: 'friday_spleen_night',
    text: 'Пятница ложится на комнату как пыль на серверы. Стих про одиночество уже на бумаге — сто сорок седьмая рекурсия без break. За стеной молчит радио Заремы. В кармане чип снова теплеет: не гильдия, не KPI — зов. Можно остаться. Можно выйти в «Синюю яму»: Альберт там почти всегда, и он говорил про «живой код», будто уже знает, что ты вытащил из #4729.',
    contextNote: 'Комната. Пятничный сплин. Стих написан. Путь к Альберту или к Сети.',
    ambientSound: 'sounds/ambient/room_hum_quiet.ogg',
    musicCue: 'emotional',
    autoSave: true,
    soundEffect: 'notify',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    guidanceHint: 'Сплин записан — зайди к Альберту в кафе или иди к Сети.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'albert',
    effects: [
      { type: 'collectPoem', poemId: 'poem_4' },
      { type: 'setFlag', flag: 'friday_spleen_written', flagValue: true },
      { type: 'setFlag', flag: 'left_office_after_vault', flagValue: true },
      { type: 'triggerQuest', questId: 'friday_spleen' },
    ],
    choices: [
      {
        text: 'Выйти в «Синюю яму» — спросить Альберта про живой код',
        next: 'cafe_albert_friday_bridge',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'setFlag', flag: 'friday_spleen_written', flagValue: true },
        ],
      },
      {
        text: 'Сразу на улицу — искать тех, кто слышит стихи',
        next: 'act2_transition',
        effects: [
          { type: 'setFlag', flag: 'friday_spleen_written', flagValue: true },
          { type: 'setFlag', flag: 'friday_albert_bridge_heard', flagValue: true },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Ещё минута тишины — потом город',
        next: 'act2_transition',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'setFlag', flag: 'friday_spleen_written', flagValue: true },
          { type: 'setFlag', flag: 'friday_albert_bridge_heard', flagValue: true },
        ],
      },
    ],
  },

  cafe_albert_friday_bridge: {
    id: 'cafe_albert_friday_bridge',
    text: 'Альберт не удивлён. Кружка уже остыла. «Ты вытащил ямб из продакшена. Гильдия назовёт это инцидентом. Я — дверью.» Он стучит пальцем по столу в ритме, который ты слышал в логах #4729. «Живой код — не метафора. Сеть уже смотрит. Виктория найдёт тебя, когда ты перестанешь прятать стих в кармане. А пока — пей. Завтра город будет говорить громче.»',
    contextNote: '«Синяя яма». Альберт даёт мост к Акту 2 — живой код и Сеть.',
    ambientSound: 'sounds/ambient/cafe_jazz_quiet.ogg',
    soundEffect: 'notify',
    speaker: 'Альберт',
    sceneId: 'cafe_evening',
    guidanceHint: 'Альберт указал на Сеть — выходи на улицу к Акту 2.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Ночная улица',
    effects: [
      { type: 'setFlag', flag: 'friday_albert_bridge_heard', flagValue: true },
      { type: 'setFlag', flag: 'friday_spleen_written', flagValue: true },
      { type: 'setFlag', flag: 'solved_albert_riddle', flagValue: true },
      { type: 'setFlag', flag: 'proved_poetry_code_link', flagValue: true },
      { type: 'triggerQuest', questId: 'friday_spleen' },
      { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
    ],
    choices: [
      {
        text: 'Выйти на улицу — город уже зовёт',
        next: 'act2_transition',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'friday_albert_bridge_heard', flagValue: true },
        ],
      },
      {
        text: 'Ещё спросить про Хранилище',
        next: 'act2_transition',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'vault_rumor_heard', flagValue: true },
          { type: 'setFlag', flag: 'friday_albert_bridge_heard', flagValue: true },
        ],
      },
      {
        text: 'Ещё минута в зале — потом улица',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: -2 },
          { type: 'setFlag', flag: 'friday_albert_bridge_heard', flagValue: true },
        ],
      },
    ],
  },
};
