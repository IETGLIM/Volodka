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

  factory_zarya_memory_start: {
    id: 'factory_zarya_memory_start',
    text: '«Заря-М» помнит не даты — образы,» — говорит Зина. «Первый снег на крыше, запах озона после грозы, голос девочки, которая читала стихи у станка. Гильдия стёрла логи — но машина хранит в частоте 50 герц. Нужно вернуть ей три образа. Тогда она снова заговорит.»',
    contextNote: 'Баба Зина объясняет память «Зари-М».',
    proceduralAmbientOverride: 'basement',
    speaker: 'Баба Зина',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Спуститься к машине',
        next: 'factory_zarya_memory_restore',
        goldenPath: true,
      },
    ],
  },

  factory_zarya_memory_restore: {
    id: 'factory_zarya_memory_restore',
    text: 'Ты приносишь три вещи: снежинку с зимней улицы, кассету с записью грозы, фотографию Солныш с гимназии. Баба Зина кладёт их на шину питания. «Заря-М» гудит — 50, 50, 50 — и на экране проступают строки, которых не было в базе: «Я помню вас. Помните меня.»',
    contextNote: 'Восстановление памяти «Зари-М». Три образа, гул 50 Гц.',
    accessibilityAnnounce: 'Машина «Заря-М» оживает. Гул пятьдесят герц.',
    proceduralAmbientOverride: 'basement',
    speaker: 'Заря-М',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Записать строки в тетрадь',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'factory_zarya_memory_done', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_16' },
          { type: 'npcChange', npcId: 'npc_baba_zina', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  factory_baba_zina_tea_start: {
    id: 'factory_baba_zina_tea_start',
    text: 'Чайник свистит — крепкий чай с мятой и чем-то горьким. «Пей,» — говорит Зина. «Герои без чая — просто уставшие функции.» Вы сидите молча. Она рассказывает, как в 1987-м паяла платы для первой поэтической нейросети — «глупой, как голубь, но честной».',
    contextNote: 'Чаепитие с Бабой Зиной у паяльной станции.',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Допить и поблагодарить',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'factory_baba_zina_tea_done', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'addStat', stat: 'energy', value: 5 },
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
