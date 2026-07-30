import type { StoryNode } from '@/shared/types/game';

/** Story nodes for expansion hub quests + Albert/Archive-7 completion beats. */
export const STORY_NODES_EXPANSION_QUESTS: Record<string, StoryNode> = {
  /* ─── Albert alliance / Archive-7 resolution ─── */
  act1_albert_alliance_start: {
    id: 'act1_albert_alliance_start',
    text: 'Альберт смотрит на тебя поверх чашки — не как на коллегу, а как на соавтора, которого ещё нужно убедить. «Союз — это не подпись. Это когда ты возвращаешься, даже если страшно.»',
    speaker: 'Альберт',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Продолжить глубокий разговор',
        next: 'cafe_explore_mode',
        effects: [{ type: 'setFlag', flag: 'act1_albert_alliance_active', flagValue: true }],
      },
    ],
  },

  act2_archive_seven_start: {
    id: 'act2_archive_seven_start',
    text: 'Чип Архива-7 лежит в кармане тяжелее данных. Альберт шепнул: «Точка входа — не дверь. Это три места, где город ещё помнит исходник: подвал ЧК, стена кафе, лог серверной. Собери след — и архив откроется.»',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Искать следы Архива-7',
        next: 'street_bench_view',
        effects: [
          { type: 'setFlag', flag: 'act2_archive_seven_active', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_archive_7_hint' },
        ],
      },
    ],
  },

  act2_archive_seven_resolve: {
    id: 'act2_archive_seven_resolve',
    text: [
      'Три фрагмента сходятся, как строки в одном файле: подвал ЧК дал архивную строку, стена кафе — ритм, серверная — timestamp с ямбом. Чип в кармане нагревается — не буквально, но ты чувствуешь: checksum совпал.',
      '',
      'На экране телефона — не приложение. Текст, которого не было секунду назад: «Архив-7 открыт тем, кто читает, а не сканирует. W.»',
      '',
      'Альберт был прав. Город построен на поэзии. И ты — не пользователь. Ты — reader с правами на запись.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Чип Архива-7 активирован. Три фрагмента сходятся.',
    musicCue: 'discovery',
    choices: [
      {
        text: 'Запомнить — и идти дальше',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'act2_archive_seven_done', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_archive_seven_truth' },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addXp', value: 100 },
        ],
      },
    ],
  },

  /* ─── Cafe ↔ Office relay ─── */
  act2_cafe_office_relay_start: {
    id: 'act2_cafe_office_relay_start',
    text: 'Бариста кладёт на стойку конверт без маркировки. «Для твоего коллеги. Серверная, не KPI-доска. Если спросят — ты ничего не знаешь. Если не спросят — тем лучше. Гильдия читает почту. Улица — пока нет.»',
    speaker: 'Бариста',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Взять конверт',
        next: 'street_bench_view',
        effects: [
          { type: 'setFlag', flag: 'cafe_relay_envelope_taken', flagValue: true },
          { type: 'addItem', itemId: 'sealed_relay_envelope' },
          { type: 'discoverLore', loreId: 'lore_cafe_telegraph' },
        ],
      },
      {
        text: 'Отказаться — слишком рискованно',
        next: 'cafe_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: 2 }],
      },
    ],
  },

  act2_cafe_office_relay_deliver: {
    id: 'act2_cafe_office_relay_deliver',
    text: 'Коллега хватает конверт, не глядя в глаза. «Тише. Камера моргнула — у нас три минуты.» Внутри — не приказ. Строка: «4729 — не баг. Root access — совесть.» Он кивает на серверную: «Там второй лист. Но только если ты уже видел стих на экране.»',
    speaker: 'Коллега',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Принято. Я видел.',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'cafe_relay_envelope_delivered', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 6 } },
          { type: 'discoverLore', loreId: 'lore_hub_relay_network' },
          { type: 'addXp', value: 45 },
        ],
      },
    ],
  },

  /* ─── Street ↔ CHK samizdat ─── */
  act2_street_chk_samizdat_start: {
    id: 'act2_street_chk_samizdat_start',
    text: 'Зарема садится рядом на мокрую скамейку. «Не оглядывайся. В пакете — не наркотики и не оружие. Стихи. Для костра. Гильдия их сожжёт, если найдёт в облаке. Донеси до Баседа. Если остановят — скажи, что несёшь пустую упаковку.»',
    speaker: 'Зарема',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Забрать пакет',
        next: 'act2_exp_street_rain',
        effects: [
          { type: 'setFlag', flag: 'street_samizdat_received', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Не сейчас — слишком горячо',
        next: 'street_bench_view',
        effects: [{ type: 'addStat', stat: 'stress', value: 3 }],
      },
    ],
  },

  act2_street_chk_samizdat_deliver: {
    id: 'act2_street_chk_samizdat_deliver',
    text: [
      'Басед принимает пакет у огня, не задавая вопросов. «Зарема знает протокол.» Он вытаскивает лист — почерк разный, ритм один. «Это пойдёт на стену. И в архив. Спасибо, что ногами, а не VPN. Гильдия VPN любит.»',
      '',
      'Он складывает лист обратно, но не в пакет — в жестяную кружку, как будто металл тоже хранит текст. «Если спросят на улице — ты нёс пустую упаковку. Если спросят в кафе — ты искал кофе. Если спросят в офисе — ты опоздал. Три версии. Одна правда.»',
    ].join('\n'),
    speaker: 'Басед',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Рад помочь',
        next: 'chk_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'street_samizdat_delivered', flagValue: true },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 4 } },
          { type: 'collectPoem', poemId: 'poem_wall_handwritten' },
          { type: 'discoverLore', loreId: 'lore_banned_poetry_tapes' },
          { type: 'addXp', value: 70 },
        ],
      },
    ],
  },

  /* ─── Pier ↔ Cafe frequency ─── */
  act2_pier_cafe_frequency_start: {
    id: 'act2_pier_cafe_frequency_start',
    text: 'Трофим тычет пальцем в воду: «Слышишь? Не ушами — здесь.» Он пишет на крышке от бутылки цифры — частота, которую река несёт с завода. «Отнеси бариста. Он на стене кафе держит такую же. Если совпадёт — город ответит.»',
    speaker: 'Трофим',
    sceneId: 'river_pier',
    choices: [
      {
        text: 'Записать частоту',
        next: 'act2_exp_pier_sunrise_poem',
        effects: [
          { type: 'setFlag', flag: 'pier_frequency_heard', flagValue: true },
          { type: 'addItem', itemId: 'node_coords_paper' },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act2_pier_cafe_frequency_match: {
    id: 'act2_pier_cafe_frequency_match',
    text: [
      'Бариста проводит пальцем по салфетке на стене — те же цифры, что на пирсе, спрятаны между строками стиха. «Трофим снова прав. Река и кафе — один канал.»',
      '',
      'На секунду jukebox замирает. Потом — тихий такт, как heartbeat. Частота совпала. Город — не набор локаций. Это сеть, которая помнит ритм.',
    ].join('\n'),
    speaker: 'Бариста',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Запомнить ритм',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'pier_cafe_frequency_matched', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_river_frequency' },
          { type: 'discoverLore', loreId: 'lore_frequency_poem' },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addXp', value: 65 },
        ],
      },
    ],
  },

  /* ─── Night city watch (Albert) ─── */
  act2_night_city_watch_start: {
    id: 'act2_night_city_watch_start',
    text: 'Альберт рисует на салфетке три кружка — скамейка, пирс, костёр. «Обойди. Не как турист — как relay. Если везде тихо — напиши «0». Если что-то шепчет — «1». Вернись сюда. Не в телефон. На салфетке. Я сожгу после прочтения.»',
    speaker: 'Альберт',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Начать обход',
        next: 'street_bench_view',
        effects: [{ type: 'setFlag', flag: 'act2_night_city_watch_active', flagValue: true }],
      },
    ],
  },

  act2_night_city_watch_report: {
    id: 'act2_night_city_watch_report',
    text: 'Ты кладёшь салфетку на стол. Альберт читает: «1-1-1». Улыбается — устало, но по-настоящему. «Значит, релей жив. Город ещё говорит. Теперь слушай: следующий пакет пойдёт через офис. Но это — другая история.» Он поджигает салфетку у свечи-LED. Пепел — как deleted log.',
    speaker: 'Альберт',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Понял. Продолжаем.',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'night_city_watch_reported', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'discoverLore', loreId: 'lore_hub_relay_network' },
          { type: 'addXp', value: 90 },
        ],
      },
    ],
  },
};
