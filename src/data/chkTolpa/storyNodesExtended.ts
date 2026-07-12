/* ─── ТОЛПА / ЧК — расширенные побочные квесты ─── */

import type { StoryNode } from '@/shared/types/game';

export const CHK_STORY_NODES_EXTENDED: Record<string, StoryNode> = {
  chk_portwine_delivery_start: {
    id: 'chk_portwine_delivery_start',
    text: 'Басед хмурится: «Портвейн «777» кончается. Без него костёр не костёр — просто огонь. В «Синей яме» у Альберта в подсобке стоит последний ящик. Донеси — и будешь чекистом не по паспорту, а по сердцу.»',
    contextNote: 'Басед просит доставить портвейн «777».',
    accessibilityAnnounce: 'Басед просит портвейн для ночного костра.',
    speaker: 'Басед',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Взять задание',
        next: 'chk_portwine_pickup',
        effects: [{ type: 'triggerQuest', questId: 'chk_portwine_delivery' }],
      },
      { text: 'Не сейчас', next: 'chk_explore_mode' },
    ],
  },

  chk_portwine_pickup: {
    id: 'chk_portwine_pickup',
    text: 'Альберт в подсобке не удивляется: «Для леса? Бери. Только не вздумай открыть по дороге — портвейн чувствует предательство.» Он протягивает ящик — тяжёлый, как вина и совесть.',
    speaker: 'Альберт',
    sceneId: 'albert_backroom',
    choices: [
      {
        text: 'Нести в ЧК',
        next: 'chk_portwine_delivered',
        effects: [{ type: 'setFlag', flag: 'chk_portwine_carried', flagValue: true }],
      },
    ],
  },

  chk_portwine_delivered: {
    id: 'chk_portwine_delivered',
    text: 'Костёр вспыхивает радостнее. Басед откупывает первым. Смерть поднимает бокал: «За суперпозицию — пока не наблюдают.» Элис настраивает гитару. Ру кивает тебе: «Свой.»',
    speaker: 'Басед',
    sceneId: 'chk_campfire_night',
    choices: [
      {
        text: 'Сесть у костра',
        next: 'chk_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'chk_portwine_delivery_done', flagValue: true },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  chk_guitar_strings_start: {
    id: 'chk_guitar_strings_start',
    text: 'Элис показывает оборванную струну: «E. Без неё — только фон. В офисе у коллеги в ящике лежит запасная — он из ТОЛПЫ, но стесняется. Принеси — спою так, что камеры забудут, зачем включались.»',
    speaker: 'Элис',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Искать струны',
        next: 'chk_guitar_strings_found',
        effects: [{ type: 'triggerQuest', questId: 'chk_guitar_strings' }],
      },
      { text: 'Позже', next: 'chk_explore_mode' },
    ],
  },

  chk_guitar_strings_found: {
    id: 'chk_guitar_strings_found',
    text: 'Коллега в офисе отдаёт струну без слов — только подмигивает. В лесу Элис натягивает её за секунду. Первый аккорд — и сосны, кажется, наклоняются ближе.',
    speaker: 'Элис',
    sceneId: 'chk_campfire_night',
    choices: [
      {
        text: 'Слушать',
        next: 'pier_ritka_strings_delivered',
        condition: { flag: 'pier_ritka_strings_active' },
      },
      {
        text: 'Поблагодарить',
        next: 'chk_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'chk_guitar_strings_done', flagValue: true },
          { type: 'setFlag', flag: 'pier_ritka_strings_done', flagValue: true },
        ],
      },
    ],
  },

  chk_campfire_night_arrival: {
    id: 'chk_campfire_night_arrival',
    text: 'Ночной костёр — отдельная сцена. Огонь выше, тени длиннее, разговоры тише. Ру говорит: «Здесь мы говорим то, что днём нельзя даже думать. Садись. Пей. Слушай.»',
    contextNote: 'Ночной костёр ЧК — отдельная поляна.',
    accessibilityAnnounce: 'Ночной костёр. Огонь выше, разговоры тише.',
    proceduralAmbientOverride: 'park',
    speaker: 'Ру',
    sceneId: 'chk_campfire_night',
    choices: [
      {
        text: 'Остаться у огня',
        next: 'chk_campfire_night_explore_mode',
      },
      {
        text: 'Вернуться к дневной поляне',
        next: 'chk_explore_mode',
      },
    ],
  },
};
