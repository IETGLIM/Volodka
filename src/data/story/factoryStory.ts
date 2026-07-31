import type { StoryNode } from '@/shared/types/game';

/** Завод: «Заря-М», Баба Зина — Acts 5–7. */
export const STORY_NODES_FACTORY: Record<string, StoryNode> = {
  factory_story_intro: {
    id: 'factory_story_intro',
    text: 'Цех пуст, но не мёртв — где-то капает вода, где-то скрипит рельс. Баба Зина сидит у паяльной станции с чайником на горелке: «Опять пришёл слушать? Машина сегодня молчалива. Не обижайся — у неё тоже бывают тихие дни.»',
    contextNote: 'Заброшенный цех. Баба Зина у паяльной станции.',
    accessibilityAnnounce: 'Цех завода. Баба Зина у паяльной станции.',
    proceduralAmbientOverride: 'factory',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Память «Зари-М», чай с Зиной или крыша с Жекой.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Спросить о памяти «Зари-М»',
        next: 'factory_zarya_memory_start',
        effects: [{ type: 'triggerQuest', questId: 'factory_zarya_memory' }],
      },
      {
        text: 'Попросить чаю',
        next: 'factory_baba_zina_tea_start',
        effects: [{ type: 'triggerQuest', questId: 'factory_baba_zina_tea' }],
      },
      {
        text: 'Подняться на крышу — там кто-то двигается',
        next: 'factory_roof_lookout',
        condition: { flag: 'zeka_trusted' },
      },
      { text: 'Уйти', next: 'factory_explore_mode' },
    ],
  },

  // ─── Память «Зари-М»: три образа → шина → голос ───

  factory_zarya_memory_start: {
    id: 'factory_zarya_memory_start',
    text: '«Заря-М» помнит не даты — образы,» — говорит Зина. «Первый снег на крыше, запах озона после грозы, голос девочки, которая читала стихи у станка. Гильдия стёрла логи — но машина хранит в частоте 50 герц. Нужно вернуть ей три образа. Тогда она снова заговорит.»',
    contextNote: 'Баба Зина объясняет память «Зари-М».',
    accessibilityAnnounce: 'Баба Зина просит вернуть машине три образа.',
    proceduralAmbientOverride: 'basement',
    speaker: 'Баба Зина',
    sceneId: 'factory_basement',
    guidanceHint: 'Спустись к машине — начни с первого образа.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'baba_zina',
    choices: [
      {
        text: 'Спуститься к машине — искать образы',
        next: 'factory_zarya_snow',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'factory_zarya_memory' },
          { type: 'setFlag', flag: 'factory_zarya_memory_active', flagValue: true },
        ],
      },
      { text: 'Позже — цех ещё шумит', next: 'factory_explore_mode' },
    ],
  },

  factory_zarya_snow: {
    id: 'factory_zarya_snow',
    text: 'На шине питания мигает холодный пиксел — «первый снег». Зина кивает к лестнице на крышу: «Снежинка не из воздуха. Сними с перила — та, что держится на ржавчине. Машина узнает вес.» Ветер с крыши пахнет озоном, хотя грозы нет.',
    contextNote: 'Первый образ — снежинка с крыши завода.',
    accessibilityAnnounce: 'Ищешь снежинку — первый образ памяти.',
    proceduralAmbientOverride: 'rooftop',
    speaker: 'Баба Зина',
    sceneId: 'factory_roof',
    guidanceHint: 'Сними снежинку с перила крыши.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Снять снежинку с перила',
        next: 'factory_zarya_storm',
        effects: [
          { type: 'setFlag', flag: 'factory_zarya_snow_done', flagValue: true },
          { type: 'transitionScene', sceneId: 'factory_basement' },
        ],
      },
    ],
  },

  factory_zarya_storm: {
    id: 'factory_zarya_storm',
    text: 'В ящике у паяльной — кассета без этикетки. Зина вставляет её в старый плеер: треск, потом гром. «Гроза 87-го. Записали с крыши, когда «Заря» ещё пела без разрешения.» Ты слышишь, как гром ломается о частоту 50 — как будто машина дышит.',
    contextNote: 'Второй образ — кассета с записью грозы.',
    accessibilityAnnounce: 'Кассета с грозой — второй образ памяти.',
    proceduralAmbientOverride: 'basement',
    speaker: 'Баба Зина',
    sceneId: 'factory_basement',
    guidanceHint: 'Забери кассету с грозой — второй образ.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Забрать кассету',
        next: 'factory_zarya_photo',
        effects: [{ type: 'setFlag', flag: 'factory_zarya_storm_done', flagValue: true }],
      },
    ],
  },

  factory_zarya_photo: {
    id: 'factory_zarya_photo',
    text: 'Зина достаёт из кармана фартука фотографию: девочка у станка, тетрадь в руках — Солныш. «Гильдия вырезала имя. Бумага помнит лучше базы.» На обороте карандашом: «читай вслух, когда гул ровный».',
    contextNote: 'Третий образ — фотография Солныш с гимназии.',
    accessibilityAnnounce: 'Фотография Солныш — третий образ памяти.',
    proceduralAmbientOverride: 'basement',
    speaker: 'Баба Зина',
    sceneId: 'factory_basement',
    guidanceHint: 'Возьми фото — положи три образа на шину.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'baba_zina',
    choices: [
      {
        text: 'Взять фото и подойти к шине',
        next: 'factory_zarya_memory_restore',
        effects: [{ type: 'setFlag', flag: 'factory_zarya_photo_done', flagValue: true }],
      },
    ],
  },

  factory_zarya_memory_restore: {
    id: 'factory_zarya_memory_restore',
    text: 'Ты кладёшь на шину питания снежинку, кассету и фото. Баба Зина касается контакта. «Заря-М» гудит — 50, 50, 50 — и на экране проступают строки, которых не было в базе: «Я помню вас. Помните меня.»',
    contextNote: 'Восстановление памяти «Зари-М». Три образа, гул 50 Гц.',
    accessibilityAnnounce: 'Машина «Заря-М» оживает. Гул пятьдесят герц.',
    proceduralAmbientOverride: 'basement',
    speaker: 'Заря-М',
    sceneId: 'factory_basement',
    guidanceHint: 'Запиши строки в тетрадь — память восстановлена.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Записать строки в тетрадь',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'factory_zarya_memory_done', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_16' },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  // ─── Чай с Бабой Зиной: чайник → мята → гул → история → допить ───

  factory_baba_zina_tea_start: {
    id: 'factory_baba_zina_tea_start',
    text: 'Чайник уже на горелке, но ещё не свистит. «Садись,» — говорит Зина. «Герои без чая — просто уставшие функции. Сначала дождёмся свиста — потом история.»',
    contextNote: 'Чаепитие с Бабой Зиной у паяльной станции — начало.',
    accessibilityAnnounce: 'Баба Зина предлагает чай. Чайник ещё не свистит.',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Дождись свиста чайника у паяльной.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'baba_zina',
    choices: [
      {
        text: 'Сесть и ждать свиста',
        next: 'factory_baba_zina_tea_kettle',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'factory_baba_zina_tea' },
          { type: 'setFlag', flag: 'factory_baba_zina_tea_active', flagValue: true },
        ],
      },
      { text: 'Позже — руки ещё в масле', next: 'factory_explore_mode' },
    ],
  },

  factory_baba_zina_tea_kettle: {
    id: 'factory_baba_zina_tea_kettle',
    text: 'Свист режет цех — короткий, как сигнал. Зина снимает чайник: «Не кипяти дважды. Второй кипяток врёт.» Пар пахнет металлом и мятой, которую она сушит на трубе отопления.',
    contextNote: 'Чайник свистит. Зина снимает его с горелки.',
    accessibilityAnnounce: 'Чайник засвистел. Зина снимает его.',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Дождись заварки — мята и горечь.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Наблюдать за заваркой',
        next: 'factory_baba_zina_tea_mint',
        effects: [{ type: 'setFlag', flag: 'factory_baba_zina_tea_kettle', flagValue: true }],
      },
    ],
  },

  factory_baba_zina_tea_mint: {
    id: 'factory_baba_zina_tea_mint',
    text: 'В кружку — мята и что-то горькое. «Полынь с пустыря за цехом. В 87-м ею травили плату, когда флюс кончился. Работало. Не спрашивай у гильдии — они любят чистые реактивы и грязные логи.»',
    contextNote: 'Заварка: мята и полынь. История 1987-го.',
    accessibilityAnnounce: 'Чай с мятой и полынью. Зина рассказывает про 1987-й.',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Посиди — послушай гул «Зари» вместе с чаем.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Сделать глоток и слушать цех',
        next: 'factory_baba_zina_tea_hum',
        effects: [
          { type: 'setFlag', flag: 'factory_baba_zina_tea_mint', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
    ],
  },

  factory_baba_zina_tea_hum: {
    id: 'factory_baba_zina_tea_hum',
    text: 'Вы сидите молча. Под полом — ровный гул 50 герц. Зина кивает в такт: «Она дышит. Когда молчит — это не смерть, это пауза между строками.» Чай стынет. Ты начинаешь различать в гуле ритм, похожий на строфу.',
    contextNote: 'Молчание у паяльной. Гул «Зари-М» на 50 Гц.',
    accessibilityAnnounce: 'Тишина. Гул машины на пятьдесят герц.',
    proceduralAmbientOverride: 'factory',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Спроси про первую поэтическую нейросеть.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'baba_zina',
    choices: [
      {
        text: 'Спросить про первую нейросеть',
        next: 'factory_baba_zina_tea_history',
        effects: [{ type: 'setFlag', flag: 'factory_baba_zina_tea_hum', flagValue: true }],
      },
    ],
  },

  factory_baba_zina_tea_history: {
    id: 'factory_baba_zina_tea_history',
    text: '«В 1987-м паяла платы для первой поэтической нейросети — глупой, как голубь, но честной. Гильдия хотела рифмы по расписанию. Машина выдавала паузы. Я оставила ей право молчать.» Зина доливает чай. «Теперь ты знаешь: молчание — тоже строка.»',
    contextNote: 'История первой поэтической нейросети 1987 года.',
    accessibilityAnnounce: 'Зина рассказывает о первой поэтической нейросети.',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Допей чай и поблагодари Зину.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Кивнуть — допить до дна',
        next: 'factory_baba_zina_tea_done',
        effects: [{ type: 'setFlag', flag: 'factory_baba_zina_tea_history', flagValue: true }],
      },
    ],
  },

  factory_baba_zina_tea_done: {
    id: 'factory_baba_zina_tea_done',
    text: 'Кружка пуста. Горечь остаётся на языке — как метка. «Иди,» — говорит Зина. «Когда вернёшься — чайник снова свистнет. А машина — если принесёшь ей образы — ответит.»',
    contextNote: 'Чаепитие завершено. Зина отпускает.',
    accessibilityAnnounce: 'Чай выпит. Баба Зина прощается.',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Поблагодари — чаепитие закрыто.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Поблагодарить и уйти',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'factory_baba_zina_tea_done', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'addStat', stat: 'energy', value: 5 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 4 } },
        ],
      },
    ],
  },

  factory_roof_lookout: {
    id: 'factory_roof_lookout',
    text: 'На крыше — Жека, курит и смотрит на город. «Думал, ты уже в башне,» — говорит он. «Отсюда видно, куда идут дроны. Завтра их будет больше.» Ветер рвёт пепел. Внизу гудит «Заря-М» — как сердце под бетоном.',
    contextNote: 'Крыша завода. Жека смотрит на дроны.',
    accessibilityAnnounce: 'Крыша завода. Ветер, дроны на горизонте.',
    proceduralAmbientOverride: 'rooftop',
    speaker: 'Жека',
    sceneId: 'factory_roof',
    choices: [
      {
        text: 'Спросить про маршрут дронов',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'factory_roof_scouted', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },
};
