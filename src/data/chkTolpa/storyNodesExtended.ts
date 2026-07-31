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
    guidanceHint: 'Возьми поручение — путь через «Синюю яму» и Альберта.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'chk_based',
    choices: [
      {
        text: 'Взять задание',
        next: 'chk_portwine_promise',
        effects: [
          { type: 'triggerQuest', questId: 'chk_portwine_delivery' },
          { type: 'setFlag', flag: 'chk_portwine_active', flagValue: true },
        ],
      },
      { text: 'Не сейчас', next: 'chk_explore_mode' },
    ],
  },

  chk_portwine_promise: {
    id: 'chk_portwine_promise',
    text: 'Басед кивает на север: «Альберт знает. Скажи — для леса. И не вздумай откупорить по дороге: портвейн чувствует предательство. Мы — тоже.»',
    contextNote: 'Поручение принято. Путь — в подсобку Альберта.',
    accessibilityAnnounce: 'Иди в Синюю яму за ящиком «777».',
    speaker: 'Басед',
    sceneId: 'chk_forest_zorge',
    guidanceHint: 'Найди Альберта в подсобке «Синей ямы».',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Подсобка Альберта',
    choices: [
      {
        text: 'Идти в Синюю яму',
        next: 'chk_portwine_albert_ask',
        effects: [{ type: 'transitionScene', sceneId: 'albert_backroom' }],
      },
      { text: 'Сначала ещё у костра', next: 'chk_explore_mode' },
    ],
  },

  chk_portwine_albert_ask: {
    id: 'chk_portwine_albert_ask',
    text: 'Альберт в подсобке не удивляется: «Для леса? Значит, Басед снова пугает костёр тишиной.» Он кивает на ящик в углу — тяжёлый, с тремя семёрками на боку. «Бери. Только не открывай по дороге.»',
    contextNote: 'Альберт указывает на ящик «777».',
    accessibilityAnnounce: 'Альберт готов отдать ящик портвейна.',
    speaker: 'Альберт',
    sceneId: 'albert_backroom',
    guidanceHint: 'Забери ящик и неси к ночному костру ЧК.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Попросить ящик',
        next: 'chk_portwine_pickup',
        effects: [{ type: 'setFlag', flag: 'chk_portwine_albert_asked', flagValue: true }],
      },
    ],
  },

  chk_portwine_pickup: {
    id: 'chk_portwine_pickup',
    text: 'Ящик холодит ладони — как вина и совесть. Альберт хлопает тебя по плечу: «Скажи Баседу: следующий раз — сам тащит. Я не курьер гильдии.»',
    speaker: 'Альберт',
    sceneId: 'albert_backroom',
    guidanceHint: 'Донеси ящик до ЧК — не открывая на улице.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'ЧК / костёр',
    choices: [
      {
        text: 'Нести в ЧК',
        next: 'chk_portwine_street',
        effects: [
          { type: 'setFlag', flag: 'chk_portwine_carried', flagValue: true },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
    ],
  },

  chk_portwine_street: {
    id: 'chk_portwine_street',
    text: 'На мокром асфальте рука сама тянется к крышке — запах «777» знает каждый, кто ночевал у костра. Ты оставляешь печать целой. Портвейн, кажется, одобряет.',
    contextNote: 'Улица. Ящик не открыт.',
    accessibilityAnnounce: 'Ты донёс ящик, не открывая его.',
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Отнеси ящик к ночному костру — Басед ждёт.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'chk_based',
    choices: [
      {
        text: 'Донести до костра',
        next: 'chk_portwine_delivered',
        effects: [
          { type: 'setFlag', flag: 'chk_portwine_street_safe', flagValue: true },
          { type: 'transitionScene', sceneId: 'chk_campfire_night' },
        ],
      },
    ],
  },

  chk_portwine_delivered: {
    id: 'chk_portwine_delivered',
    text: 'Костёр вспыхивает радостнее. Басед откупоривает первым. Смерть поднимает бокал: «За суперпозицию — пока не наблюдают.» Элис настраивает гитару. Ру кивает тебе: «Свой.»',
    speaker: 'Басед',
    sceneId: 'chk_campfire_night',
    guidanceHint: 'Сядь у костра — тост за доставку.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Сесть у костра',
        next: 'chk_portwine_toast',
        effects: [
          { type: 'setFlag', flag: 'chk_portwine_delivery_done', flagValue: true },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  chk_portwine_toast: {
    id: 'chk_portwine_toast',
    text: 'Бокалы стукаются. Басед тихо: «За тех, кто таскает ящики, а не только пишет манифесты.» Огонь щёлкает. Ты — свой не по паспорту.',
    contextNote: 'Тост у ночного костра после доставки «777».',
    accessibilityAnnounce: 'Тост у костра. Портвейн доставлен.',
    speaker: 'Басед',
    sceneId: 'chk_campfire_night',
    guidanceHint: 'Доставка закрыта — можно остаться у огня.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Остаться у огня',
        next: 'chk_explore_mode',
        effects: [{ type: 'setFlag', flag: 'chk_portwine_toast_shared', flagValue: true }],
      },
    ],
  },

  chk_guitar_strings_start: {
    id: 'chk_guitar_strings_start',
    text: 'Элис показывает оборванную струну: «E. Без неё — только фон. В офисе у коллеги в ящике лежит запасная — он из ТОЛПЫ, но стесняется. Принеси — спою так, что камеры забудут, зачем включались.»',
    contextNote: 'Элис просит запасную струну E из офиса.',
    accessibilityAnnounce: 'Элис просит струну E у коллеги в офисе.',
    speaker: 'Элис',
    sceneId: 'chk_forest_zorge',
    guidanceHint: 'Возьми поручение — путь через офис гильдии.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'chk_elis',
    choices: [
      {
        text: 'Искать струну',
        next: 'chk_guitar_strings_brief',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'chk_guitar_strings' },
          { type: 'setFlag', flag: 'chk_guitar_strings_active', flagValue: true },
        ],
      },
      {
        text: 'Это для Ритки с пирса',
        next: 'pier_ritka_elis_ask',
        condition: { flag: 'pier_ritka_strings_active' },
        effects: [{ type: 'setFlag', flag: 'pier_ritka_elis_asked', flagValue: true }],
      },
      { text: 'Позже', next: 'chk_explore_mode' },
    ],
  },

  chk_guitar_strings_brief: {
    id: 'chk_guitar_strings_brief',
    text: 'Элис кивает на город: «Коллега — тихий. Скажи «для костра» — отдаст без протокола. И не свети струну на ресепшене: гильдия любит металлический блеск.»',
    contextNote: 'Маршрут: офис → ящик коллеги → обратно к костру.',
    accessibilityAnnounce: 'Иди в офис за струной E.',
    speaker: 'Элис',
    sceneId: 'chk_forest_zorge',
    guidanceHint: 'Найди коллегу в офисе гильдии.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Офис',
    choices: [
      {
        text: 'Идти в офис',
        next: 'chk_guitar_office_pickup',
        effects: [
          { type: 'setFlag', flag: 'chk_guitar_office_reached', flagValue: true },
          { type: 'transitionScene', sceneId: 'office_day' },
        ],
      },
      {
        text: 'Запомнить и уйти своим путём',
        next: 'chk_explore_mode',
        effects: [{ type: 'setFlag', flag: 'chk_guitar_office_reached', flagValue: true }],
      },
    ],
  },

  chk_guitar_office_pickup: {
    id: 'chk_guitar_office_pickup',
    text: 'Коллега открывает ящик, достаёт свёрток в газетной бумаге и подмигивает — ни слова. Струна холодит ладонь. На этикетке: «Для тех, кто играет тихо.»',
    contextNote: 'Офис. Коллега отдаёт запасную струну E.',
    accessibilityAnnounce: 'Коллега отдал струну без слов.',
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Вернись к Элис в ЧК — натянуть E.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'chk_elis',
    choices: [
      {
        text: 'Нести струну Элис',
        next: 'chk_guitar_return_elis',
        effects: [
          { type: 'setFlag', flag: 'chk_guitar_string_taken', flagValue: true },
          // Same physical string helps Ritka's office beat without skipping her pack/song.
          { type: 'setFlag', flag: 'pier_ritka_get_strings_done', flagValue: true },
          { type: 'transitionScene', sceneId: 'chk_campfire_night' },
        ],
      },
    ],
  },

  chk_guitar_return_elis: {
    id: 'chk_guitar_return_elis',
    text: 'Элис берёт струну двумя пальцами, как fragile deploy. «E.» Натягивает за секунду. «Сейчас — не для Ритки. Для камер.»',
    contextNote: 'Элис принимает струну у ночного костра.',
    accessibilityAnnounce: 'Элис натягивает новую струну E.',
    speaker: 'Элис',
    sceneId: 'chk_campfire_night',
    guidanceHint: 'Слушай первый аккорд — камеры должны «забыть».',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Слушать',
        next: 'chk_guitar_blind_song',
        effects: [{ type: 'setFlag', flag: 'chk_guitar_string_returned', flagValue: true }],
      },
    ],
  },

  chk_guitar_blind_song: {
    id: 'chk_guitar_blind_song',
    text: 'Первый аккорд — и сосны, кажется, наклоняются ближе. Где-то над лесом мигает камера и гаснет, как будто забыла задачу. Элис улыбается уголком: «Вот. Теперь можно петь.»',
    contextNote: 'Аккорд Элис. Камеры «слепнут».',
    accessibilityAnnounce: 'Аккорд Элис. Камеры, кажется, забыли зачем включались.',
    speaker: 'Элис',
    sceneId: 'chk_campfire_night',
    guidanceHint: 'Поблагодари Элис — струны закрыты.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Поблагодарить',
        next: 'chk_guitar_strings_found',
        effects: [{ type: 'setFlag', flag: 'chk_guitar_song_heard', flagValue: true }],
      },
    ],
  },

  chk_guitar_strings_found: {
    id: 'chk_guitar_strings_found',
    text: 'Элис крутит колок: «Если Ритка ещё ждёт комплект — скажи: E уже проверена. Я соберу свёрток.» Костёр щёлкает. Ты — курьер тишины.',
    contextNote: 'Струны Элис закрыты. Опциональный мост к Ритке.',
    accessibilityAnnounce: 'Дело струн Элис закрыто.',
    speaker: 'Элис',
    sceneId: 'chk_campfire_night',
    guidanceHint: 'Можно остаться у костра или отнести комплект Ритке.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Собрать комплект для Ритки',
        next: 'pier_ritka_elis_pack',
        condition: {
          flag: 'pier_ritka_strings_active',
          missingFlag: 'pier_ritka_elis_pack_ready',
        },
        effects: [
          { type: 'setFlag', flag: 'chk_guitar_strings_done', flagValue: true },
          { type: 'setFlag', flag: 'pier_ritka_elis_asked', flagValue: true },
          { type: 'npcChange', npcId: 'chk_elis', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Остаться у огня',
        next: 'chk_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'chk_guitar_strings_done', flagValue: true },
          { type: 'npcChange', npcId: 'chk_elis', npcChange: { relation: 5 } },
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
        effects: [{ type: 'transitionScene', sceneId: 'chk_forest_zorge' }],
      },
    ],
  },
};
