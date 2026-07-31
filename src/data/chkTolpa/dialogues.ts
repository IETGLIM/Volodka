/* ─── ТОЛПА / ЧК — dialogue trees ─── */

import type { DialogueNode } from '@/shared/types/game';
import { TOTAL_UNIFIED_POEMS } from '@/data/poemCollectionMeta';

export const CHK_DIALOGUE_NODES: Record<string, DialogueNode> = {
  chk_ru_greeting: {
    id: 'chk_ru_greeting',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Ты нашёл Чёрную Комнату. Днём мы — архитекторы, админы, бухгалтеры. Ночью — чекисты ТОЛПА. Садись: Басед наливает, Смерть спорит с квантовой механикой, Элис настраивает гитару.',
    textVariants: {
      highKarma: 'Володька! Свои. Проходи — Басед наливает лучшее, Смерть ждёт дискуссии. Твоя карма говорит за тебя.',
      neutralKarma: 'Ты нашёл ЧК. Садись. Присмотрись: у нас тут не клуб, а скорее... распределённая система поддержки.',
      lowKarma: 'Стой. У костра место не покупается. Ру ответит, если карма позволит. Но чай — даже врагу.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'У костра трещат сучья. Ру сидит на перевёрнутом ящике, в шляпе, и жестом приглашает присесть.',
    choices: [
      {
        text: 'Что такое ТОЛПА?',
        next: 'chk_ru_about_tolpa',
      },
      {
        text: 'Гильдия бьёт по Хранилищу — нужен тыл.',
        next: 'chk_ru_act3_sanctuary',
        condition: { flag: 'tolpa_sanctuary_offered' },
      },
      {
        text: 'Я готов к посвящению.',
        next: 'chk_ru_initiation',
        condition: { flag: 'chk_forest_unlocked' },
      },
      {
        text: 'Кто такой Сталкер? Он проводит через лес.',
        next: 'chk_ru_stalker',
        condition: { flag: 'chk_path_known' },
      },
      {
        text: 'Нужен совет.',
        next: 'chk_ru_advice',
      },
      {
        text: 'Протокол Чистоты — что будем делать?',
        next: 'chk_ru_act4_sabotage',
        condition: { flag: 'guild_purity_protocol' },
      },
      {
        text: 'Ты собрал все мои стихи...',
        next: 'chk_ru_easter_egg_all_poems',
        condition: { minCollectedPoems: TOTAL_UNIFIED_POEMS },
      },
      {
        text: 'Просто посижу в тишине.',
        next: 'chk_silence_night',
        condition: { minTimeOfDay: 21 },
      },
      {
        text: 'Просто посижу в тишине.',
        next: 'chk_silence_night',
        condition: { maxTimeOfDay: 5 },
      },
      {
        text: 'Просто посижу в тишине.',
        next: 'chk_silence',
        condition: { minTimeOfDay: 6, maxTimeOfDay: 20 },
      },
      {
        text: 'Просто послушаю у костра.',
        next: null,
      },
    ],
  },
  chk_ru_return: {
    id: 'chk_ru_return',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Снова у костра. Хорошо. У нас сегодня: Басед тестирует новый портвейн, Смерть доказывает, что баги — это проявление свободы воли в коде, а Ритка обещала прийти с пирса.',
    textVariants: {
      highKarma: 'Володька. Твой стул всё ещё твой. Садись.',
      neutralKarma: 'Возвращение — уже традиция. Чай? Портвейн?',
      lowKarma: 'Ты вернулся. Посмотрим, изменилось ли что-то.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Знакомый костёр. Ру кивает, не вставая — как будто ты опоздал на планёрку, но тебя всё равно ждали.',
    choices: [
      { text: 'Что нового у ТОЛПА?', next: 'chk_ru_news' },
      { text: 'Нужен совет.', next: 'chk_ru_advice' },
      {
        text: 'Чекист навсегда — спасибо за тыл.',
        next: 'chk_ru_honorary_farewell',
        condition: { flag: 'tolpa_honorary_chekist' },
      },
      {
        text: 'Просто посижу в тишине.',
        next: 'chk_silence_night',
        condition: { minTimeOfDay: 21 },
      },
      {
        text: 'Просто посижу в тишине.',
        next: 'chk_silence_night',
        condition: { maxTimeOfDay: 5 },
      },
      {
        text: 'Просто посижу в тишине.',
        next: 'chk_silence',
        condition: { minTimeOfDay: 6, maxTimeOfDay: 20 },
      },
      { text: 'Просто посижу.', next: null },
    ],
  },
  chk_ru_advice: {
    id: 'chk_ru_advice',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Совет? Смотря что ищешь. Если путь — спроси Сталкера. Если правду — Смерть. Если тепла — к Элис. Если просто побыть — садись.',
    contextNote: 'Ру откладывает кружку и смотрит на огонь, как на дашборд с единственным зелёным виджетом.',
    choices: [
      {
        text: 'Где искать Хранилище Гильдии?',
        next: 'chk_ru_hint_guild',
        condition: { flag: 'seeking_guild_vault' },
      },
      { text: 'Как найти укрытие?', next: 'chk_ru_hint_sanctuary' },
      { text: 'Ничего. Просто побуду.', next: null },
    ],
  },
  chk_ru_hint_guild: {
    id: 'chk_ru_hint_guild',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Хранилище — не на карте. Спроси Сталкера про коллектор под гильдией. И не светись: у них логи дольше, чем наша память о вчерашнем портвейне.',
    choices: [{ text: 'Понял.', next: null }],
  },
  chk_ru_hint_sanctuary: {
    id: 'chk_ru_hint_sanctuary',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Лес на Зорге. Табличка «Зорге», тропа влево от скамейки. Если гильдия давит — скажи своим: у нас чай, костёр и тишина. Иногда этого хватает.',
    choices: [
      {
        text: 'Спасибо.',
        next: null,
        effects: [{ type: 'setFlag', flag: 'tolpa_sanctuary_offered', flagValue: true }],
      },
    ],
  },
  chk_ru_news: {
    id: 'chk_ru_news',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Новости? Басед нашёл бутылку без этикетки — на вкус как 2008-й. Смерть спорит с аналитиком про p-value кармы. Элис репетирует кавер на твой стих — если соберёшь «Город шепчет», попроси её.',
    contextNote: 'У костра слышны обрывки разговоров — как фоновый шум open space, только честнее.',
    choices: [{ text: 'Звучит как дом.', next: null }],
  },
  chk_ru_act4_sabotage: {
    id: 'chk_ru_act4_sabotage',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Гильдия запустила «Протокол Чистоты» — удаляют стихи из общего репозитория. У ТОЛПА есть зеркала. Но нужно физически отключить их сервер в дата-центре. Сталкер знает вход.',
    contextNote: 'Ру говорит тихо — так, как говорят о проде, когда рядом стажёр из гильдии.',
    choices: [
      {
        text: 'Я сделаю это.',
        next: null,
        effects: [
          { type: 'triggerQuest', questId: 'tolpa_act4_server_heist' },
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 10 } },
        ],
      },
      { text: 'Слишком опасно.', next: null },
    ],
  },
  chk_ru_easter_egg_all_poems: {
    id: 'chk_ru_easter_egg_all_poems',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: '*Ру встаёт и снимает шляпу* Володька. Ты собрал всё. Не гильдия, не ТОЛПА — ты. Твои стихи будут петь у костров, когда нас уже не будет в этом коде. Басед, наливай «особый» портвейн. Сегодня — праздник Поэта.',
    condition: { minCollectedPoems: TOTAL_UNIFIED_POEMS },
    contextNote: 'Костёр вспыхивает ярче. Все у огня замолкают — редкий момент, когда даже DevOps не спорит.',
    choices: [
      {
        text: 'Спасибо.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'setFlag', flag: 'tolpa_poet_honored', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_legendary_fire' },
        ],
      },
    ],
  },
  chk_ru_act3_sanctuary: {
    id: 'chk_ru_act3_sanctuary',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Значит, дошло до этого. Лес готов. Скажи своим — тропа с парка, табличка «Зорге». Мы не герои. Но чай, костёр и тишина иногда спасают больше, чем ещё один sprint.',
    choices: [
      {
        text: 'Открываю укрытие.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_sanctuary_active', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_act3_sanctuary' },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },
  chk_ru_about_tolpa: {
    id: 'chk_ru_about_tolpa',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Тайное Общество Любителей Портвейна Алкоголя. Между собой — ЧК, Чёрная Комната. Мы не революция и не гильдия. Мы — люди, которым нужен лес, металл и честный разговор без KPI.',
    choices: [
      {
        text: 'Звучит... surprisingly healthy.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 3 } },
          { type: 'triggerQuest', questId: 'tolpa_first_fire' },
        ],
      },
    ],
  },
  chk_ru_initiation: {
    id: 'chk_ru_initiation',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Посвящение простое: выпей с нами, не сливай секреты гильдии в чат начальства, и хотя бы раз спой под гитару — или честно скажи, что не умеешь.',
    choices: [
      {
        text: 'Принимаю правила ЧК.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_member', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_portwine_oath' },
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 8 } },
        ],
      },
    ],
  },
  chk_based_greeting: {
    id: 'chk_based_greeting',
    speaker: 'Басед',
    speakerId: 'chk_based',
    text: 'Портвейн — не для слабонервных и не для отчётов. Держи бокал. Сегодня обсуждаем: почему прод упал, а мы всё ещё живы.',
    contextNote: 'Басед наливает из потёртой бутылки. Запах портвейна смешивается с дымом костра.',
    choices: [
      {
        text: 'Держи «777».',
        next: 'chk_based_gift_wine',
        condition: { hasItem: 'port_wine_777' },
      },
      {
        text: 'Нужен ящик «777» для костра?',
        next: 'chk_portwine_delivery_start',
        condition: { missingFlag: 'chk_portwine_active' },
      },
      {
        text: 'Про неоновый архив на вывеске?',
        next: 'quest_act2_chk_neon_archive_start',
        condition: { missingFlag: 'chk_neon_archive_done' },
      },
      {
        text: 'Ящик донёс — жду тост.',
        next: 'chk_portwine_toast',
        condition: {
          flag: 'chk_portwine_delivery_done',
          missingFlag: 'chk_portwine_toast_shared',
        },
      },
      {
        text: 'За uptime!',
        next: 'chk_based_oath',
      },
      {
        text: 'Я за moderation.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 2 } }],
      },
      {
        text: 'Зарема прислала самиздат.',
        next: 'chk_based_samizdat_handoff',
        condition: { flag: 'street_samizdat_received', missingFlag: 'street_samizdat_delivered' },
      },
    ],
  },
  chk_based_gift_wine: {
    id: 'chk_based_gift_wine',
    speaker: 'Басед',
    speakerId: 'chk_based',
    text: 'Это... тот самый «777»? Ты знаешь, где его взять. Легенда. Садись — сегодня пьём из горла.',
    condition: { hasItem: 'port_wine_777' },
    contextNote: 'Басед берёт бутылку двумя руками — как реликвию, а не как deploy artifact.',
    choices: [
      {
        text: 'За ЧК.',
        next: null,
        effects: [
          { type: 'removeItem', itemId: 'port_wine_777' },
          { type: 'setFlag', flag: 'tolpa_legendary_wine_shared', flagValue: true },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 8 } },
          { type: 'triggerQuest', questId: 'tolpa_legendary_wine' },
        ],
      },
    ],
  },
  chk_based_oath: {
    id: 'chk_based_oath',
    speaker: 'Басед',
    speakerId: 'chk_based',
    text: 'Чекист клянётся: не пить один у монитора, делиться бутылкой и не деплоить в пятницу после полуночи. Ну... стараться.',
    contextNote: 'Басед поднимает бокал. Клятва звучит как SLA, только с душой.',
    choices: [
      {
        text: 'Клянусь.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_oath_taken', flagValue: true },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Я скорее соблюдаю кодекс молчания, чем клятву.',
        next: 'chk_based_respect',
        condition: { minSkill: { persuasion: 20 } },
        effects: [
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 7 } },
        ],
      },
    ],
  },
  chk_based_respect: {
    id: 'chk_based_respect',
    speaker: 'Басед',
    speakerId: 'chk_based',
    text: 'Хм. Читаешь людей. Ладно, без клятвы. Но портвейн — вскладчину. И деплоить в пятницу всё равно не советую.',
    choices: [
      {
        text: 'Договорились.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_oath_taken', flagValue: true },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 3 } },
        ],
      },
    ],
  },
  chk_smert_greeting: {
    id: 'chk_smert_greeting',
    speaker: 'Смерть',
    speakerId: 'chk_smert',
    text: 'Если наблюдатель закрывает ноутбук — коллапсирует ли волновая функция деплоя? Обсудим после второго бокала. Кстати, я не настоящая Смерть. Я бухгалтер.',
    contextNote: 'Смерть сидит у костра, помешивая чай ложкой. На ней старая футболка с надписью «I void warranties».',
    choices: [
      {
        text: 'Объясни квантовую запутанность для PM.',
        next: 'chk_smert_quantum',
      },
      {
        text: 'Мне хватит алкоголя без физики.',
        next: null,
      },
    ],
  },
  chk_smert_quantum: {
    id: 'chk_smert_quantum',
    speaker: 'Смерть',
    speakerId: 'chk_smert',
    text: 'Два микросервиса могут быть запутаны: упал один — второй мгновенно «знает» о катастрофе. Как мы с Баседом, когда видим алерт в 3:00. Это не магия — это distributed systems с душой.',
    choices: [
      {
        text: 'Глубоко. И страшно.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_quantum_talk', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_quantum_fire' },
          { type: 'npcChange', npcId: 'chk_smert', npcChange: { relation: 4 } },
        ],
      },
    ],
  },
  chk_stalker_greeting: {
    id: 'chk_stalker_greeting',
    speaker: 'Сталкер',
    speakerId: 'chk_stalker',
    text: 'Тропа с Зорге — не на карте fast travel. Я провожу только своих. Смотри под ноги: корни, камни и следы тех, кто «случайно» заехал на standup с похмелья.',
    choices: [
      {
        text: 'Нужен путь к гильдии — через лес.',
        next: 'chk_stalker_act4_route',
        condition: { flag: 'ready_for_infiltration' },
      },
      {
        text: 'Покажи безопасный путь обратно в город.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'chk_path_known', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_forest_guide' },
        ],
      },
      {
        text: 'Я сам найду.',
        next: null,
      },
      {
        text: 'Звезда на небе — или в коде?',
        next: 'chk_stalker_guiding_star',
        condition: { collectedPoem: 'poem_3' },
      },
    ],
  },
  chk_stalker_guiding_star: {
    id: 'chk_stalker_guiding_star',
    speaker: 'Сталкер',
    speakerId: 'chk_stalker',
    text: '*молчит, потом тихо* Тропа есть. Не на карте — в ритме шагов. Активируй «Путеводную» у костра — и увидишь, куда смотреть. Я провожу только тех, кто слышит звёзды в шуме серверов.',
    choices: [
      {
        text: 'Проведи.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'chk_stalker_star_path', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
      { text: 'Пока нет.', next: null },
    ],
  },
  chk_stalker_act4_route: {
    id: 'chk_stalker_act4_route',
    speaker: 'Сталкер',
    speakerId: 'chk_stalker',
    text: 'Коллектор под гильдией. Вход со двора, где камеры «на ремонте» уже третий год. Я проведу — но только ночью и только один раз.',
    choices: [
      {
        text: 'Договорились.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_stalker_route', flagValue: true },
          { type: 'setFlag', flag: 'guild_ally_found', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_act4_exfiltration' },
        ],
      },
    ],
  },
  chk_elis_greeting: {
    id: 'chk_elis_greeting',
    speaker: 'Элис',
    speakerId: 'chk_elis',
    text: 'Тест-кейсы зелёные — можно петь. Сегодня что-нибудь из разряда «баг в проде, но мы держимся». Слушать или попробуешь подпеть?',
    contextNote: 'Элис настраивает гитару у костра. Струны звенят тихо, между смехом и треском дров.',
    choices: [
      {
        text: 'Струна E оборвалась — помочь?',
        next: 'chk_guitar_strings_start',
        condition: { missingFlag: 'chk_guitar_strings_active' },
      },
      {
        text: 'Принёс твою струну из офиса',
        next: 'chk_guitar_return_elis',
        condition: {
          flag: 'chk_guitar_string_taken',
          missingFlag: 'chk_guitar_string_returned',
        },
      },
      {
        text: 'Слушаю аккорд — камеры ждут',
        next: 'chk_guitar_blind_song',
        condition: {
          flag: 'chk_guitar_string_returned',
          missingFlag: 'chk_guitar_song_heard',
        },
      },
      {
        text: 'Ритка с пирса просила струны',
        next: 'pier_ritka_elis_ask',
        condition: { flag: 'pier_ritka_strings_active', missingFlag: 'pier_ritka_elis_asked' },
      },
      {
        text: 'Принёс струну из офиса — для Ритки',
        next: 'pier_ritka_elis_pack',
        condition: { flag: 'pier_ritka_get_strings_done', missingFlag: 'pier_ritka_elis_pack_ready' },
      },
      {
        text: 'Поём вместе.',
        next: 'chk_elis_song',
      },
      {
        text: 'У меня есть стих «Город шепчет»...',
        next: 'chk_elis_poem_reaction',
        condition: { collectedPoem: 'poem_act6_01' },
      },
      {
        text: 'Только слушаю.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'chk_elis', npcChange: { relation: 3 } }],
      },
    ],
  },
  chk_elis_poem_reaction: {
    id: 'chk_elis_poem_reaction',
    speaker: 'Элис',
    speakerId: 'chk_elis',
    text: '*откладывает гитару* Знаешь, твои стихи... я попробовала положить «Город шепчет» на аккорды. Получилось тревожно, как будто город сам поёт. Хочешь послушать?',
    condition: { collectedPoem: 'poem_act6_01' },
    contextNote: 'Элис смотрит на гитару, потом на тебя — как на соавтора, которого ещё не добавили в репозиторий.',
    choices: [
      {
        text: 'Да.',
        next: 'chk_elis_poem_song',
        effects: [
          { type: 'npcChange', npcId: 'chk_elis', npcChange: { relation: 5 } },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      { text: 'Оставь для следующего раза.', next: null },
    ],
  },
  chk_elis_poem_song: {
    id: 'chk_elis_poem_song',
    speaker: 'Элис',
    speakerId: 'chk_elis',
    text: '*играет медленно* «Город шепчет ночью сквозь провода...» *голос ломается на полтона, и это делает песню честнее любого автотюна*',
    choices: [
      {
        text: 'Ещё раз, когда-нибудь.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_elis_poem_song', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
        ],
      },
    ],
  },
  chk_elis_song: {
    id: 'chk_elis_song',
    speaker: 'Элис',
    speakerId: 'chk_elis',
    text: '*играет на гитаре* «В лесу на Зорге горит опять / наш костёр и портвейн / а утром снова merge request / и снова мы — как один...»',
    choices: [
      {
        text: 'Браво!',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_guitar_heard', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_guitar_night' },
          { type: 'triggerQuest', questId: 'tolpa_poem_fire' },
          { type: 'npcChange', npcId: 'chk_elis', npcChange: { relation: 6 } },
        ],
      },
    ],
  },
  chk_guest_devops_greeting: {
    id: 'chk_guest_devops_greeting',
    speaker: 'Гость (DevOps)',
    speakerId: 'chk_guest_devops',
    text: 'Я на час заехал после релиза. Кто-нибудь видел мой термос? Там не чай.',
    choices: [
      {
        text: 'Расскажи war story.',
        next: 'chk_guest_devops_war',
      },
      {
        text: 'Просто отдыхай у костра.',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -2 }],
      },
    ],
  },
  chk_guest_devops_war: {
    id: 'chk_guest_devops_war',
    speaker: 'Гость (DevOps)',
    speakerId: 'chk_guest_devops',
    text: 'Прод упал в пятницу в 23:58. Rollback не помог — потому что rollback был на ту же версию. Мы три часа искали, пока Сталкер не сказал: «Вы деплоили в prod из ветки feature/party.» Мораль: даже у ТОЛПА бывают postmortem.',
    choices: [
      {
        text: 'Больно, но поучительно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'chk_guest_devops', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Ты не пробовал Chaos Engineering?',
        next: 'chk_guest_devops_chaos',
        condition: { minSkill: { logic: 25 } },
        effects: [
          { type: 'npcChange', npcId: 'chk_guest_devops', npcChange: { relation: 2 } },
        ],
      },
    ],
  },
  chk_guest_devops_chaos: {
    id: 'chk_guest_devops_chaos',
    speaker: 'Гость (DevOps)',
    speakerId: 'chk_guest_devops',
    text: 'Хаос? Мы и так живём в хаосе. Но идея хорошая. Пожалуй, на следующем ретро предложу.',
    choices: [
      {
        text: 'Удачи.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'tolpa_chaos_engineering', flagValue: true },
        ],
      },
    ],
  },
  chk_guest_analyst_greeting: {
    id: 'chk_guest_analyst_greeting',
    speaker: 'Гость (Аналитик)',
    speakerId: 'chk_guest_analyst',
    text: 'У меня гипотеза: карма коррелирует с количеством пропущенных standup-ов. Надо проверить на выборке из ЧК.',
    choices: [
      {
        text: 'Наука у костра — лучшая наука.',
        next: 'chk_guest_analyst_karma',
      },
      {
        text: 'Не мешай отдыхать.',
        next: null,
      },
    ],
  },
  chk_guest_analyst_karma: {
    id: 'chk_guest_analyst_karma',
    speaker: 'Гость (Аналитик)',
    speakerId: 'chk_guest_analyst',
    text: 'Предварительный вывод: чем выше карма, тем реже человек врёт в daily. И наоборот. Исключение — Ру: высокая карма, нулевая правда в sprint review. Шучу. Не шучу.',
    choices: [
      {
        text: 'Запиши меня в контрольную группу.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'setFlag', flag: 'tolpa_karma_study', flagValue: true },
          { type: 'npcChange', npcId: 'chk_guest_analyst', npcChange: { relation: 4 } },
        ],
      },
    ],
  },
  /* ── Ритка — бард пирса №3, младший состав ЧК (6 nodes) ── */
  chk_ritka_greeting: {
    id: 'chk_ritka_greeting',
    speaker: 'Ритка',
    speakerId: 'chk_ritka',
    text: '*перебирает струны, не поднимая головы* Если ты от Ру — передай, что я не потерялась. Я тут. Огни на воде лучше, чем огни на мониторе. *поднимает глаза* Ритка. ЧК, младший состав. Гитара, как видишь, при мне. Почти живая.',
    choices: [
      {
        text: 'Про струны — могу помочь',
        next: 'pier_ritka_strings_start',
        condition: { missingFlag: 'pier_ritka_strings_active' },
        effects: [{ type: 'triggerQuest', questId: 'pier_ritka_strings' }],
      },
      {
        text: 'Принёс струны от Элис',
        next: 'pier_ritka_strings_delivered',
        condition: { flag: 'pier_ritka_elis_pack_ready', missingFlag: 'pier_ritka_strings_done' },
      },
      { text: 'Что это за место?', next: 'chk_ritka_about' },
      { text: 'Сыграешь что-нибудь?', next: 'chk_ritka_song_request' },
      {
        text: 'На перилах мелом — стих. Твой?',
        next: 'chk_ritka_pier_poem',
        condition: { flag: 'pier_chalk_poem_seen' },
      },
      {
        text: 'Свои. Клятва портвейна принята.',
        next: 'chk_ritka_tolpa',
        condition: { flag: 'tolpa_honorary_chekist' },
      },
      {
        text: 'Та песня у костра... спой ещё.',
        next: 'chk_ritka_after_song',
        condition: { flag: 'quiet_song_ritka' },
      },
      { text: 'Не буду мешать.', next: null },
    ],
  },
  chk_ritka_pier_return: {
    id: 'chk_ritka_pier_return',
    speaker: 'Ритка',
    speakerId: 'chk_ritka',
    text: '*не поднимая головы* Снова ты. Пирс не закрывается — в отличие от офиса. Если за стихом — смотри на перила. Если за песней — принеси вдохновение.',
    choices: [
      { text: 'Сыграешь что-нибудь?', next: 'chk_ritka_song_request' },
      {
        text: 'Стих на перилах — я его прочитал.',
        next: 'chk_ritka_pier_poem',
        condition: { flag: 'pier_chalk_poem_seen' },
      },
      { text: 'Просто мимо.', next: null },
    ],
  },
  chk_ritka_pier_poem: {
    id: 'chk_ritka_pier_poem',
    speaker: 'Ритка',
    speakerId: 'chk_ritka',
    text: '*смотрит на воду* Не мой. Кто-то из Сети оставил — мелом, пока гильдия спала. Говорят, город не отпускает к двери. Я добавила аккорд. Третья струна всё равно дребезжит, но стих держится.',
    choices: [
      {
        text: 'Город и правда не отпускает.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 4 } },
          { type: 'setFlag', flag: 'ritka_pier_poem_discussed', flagValue: true },
        ],
      },
      { text: 'Понял.', next: null },
    ],
  },
  chk_ritka_about: {
    id: 'chk_ritka_about',
    speaker: 'Ритка',
    speakerId: 'chk_ritka',
    text: 'Пирс №3. Вторая точка ЧК. На Зорге — костёр и металл, тут — вода и струнные огни. Басед говорит: «у каждой системы должен быть failover». Вот пирс и есть наш failover: когда лес шумный или гильдия принюхивается — ТОЛПА собирается у воды. Трофим не против. Мы ему портвейн возим, он нам — тишину.',
    choices: [
      {
        text: 'Хорошая архитектура.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 3 } }],
      },
      { text: 'Понял.', next: null },
    ],
  },
  chk_ritka_song_request: {
    id: 'chk_ritka_song_request',
    speaker: 'Ритка',
    speakerId: 'chk_ritka',
    text: '*показывает гриф* Видишь? Третья струна узлом связана. На узле далеко не уедешь — дребезжит, как прод после хотфикса. Достань новые струны — у Трофима, говорят, от заводской самодеятельности остались. Или хотя бы портвейн для вдохновения, из ящика. Тогда спою. По-настоящему, не для галочки.',
    choices: [
      {
        text: 'Держи «777». За вдохновение.',
        next: 'chk_ritka_song',
        condition: { flag: 'pier_portwine_taken' },
        effects: [
          { type: 'removeItem', itemId: 'port_wine_777' },
          { type: 'setFlag', flag: 'ritka_gift_given', flagValue: true },
          { type: 'triggerQuest', questId: 'pier_quiet_song' },
          { type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 4 } },
        ],
      },
      {
        text: 'Струны от Трофима. Просил не рвать.',
        next: 'chk_ritka_song',
        condition: { flag: 'trofim_strings_given' },
        effects: [
          { type: 'removeItem', itemId: 'guitar_strings' },
          { type: 'setFlag', flag: 'ritka_gift_given', flagValue: true },
          { type: 'triggerQuest', questId: 'pier_quiet_song' },
          { type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 5 } },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Достану.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'ritka_needs_strings', flagValue: true },
          { type: 'triggerQuest', questId: 'pier_quiet_song' },
        ],
      },
    ],
  },
  chk_ritka_song: {
    id: 'chk_ritka_song',
    speaker: 'Ритка',
    speakerId: 'chk_ritka',
    text: '*натягивает струну, пробует, кивает. Играет тихо — не как Элис у костра на Зорге, а как будто для самой воды* «По реке плывут огни — это чьи-то сны. Город спит, и мы одни — у его спины...» *голос у неё ломкий, но честный. Костёр в бочке трещит в такт, и даже река, кажется, гудит на полтона ниже.*',
    choices: [
      {
        text: 'Молча дослушать.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'quiet_song_ritka', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 6 } },
        ],
      },
    ],
  },
  chk_ritka_after_song: {
    id: 'chk_ritka_after_song',
    speaker: 'Ритка',
    speakerId: 'chk_ritka',
    text: '*качает головой* Нет. Та песня — одноразовая, как ночь. В следующий раз будет другая. Приходи, когда город опять прижмёт: у воды все песни тише, зато честнее.',
    choices: [
      {
        text: 'Договорились.',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
    ],
  },
  chk_ritka_tolpa: {
    id: 'chk_ritka_tolpa',
    speaker: 'Ритка',
    speakerId: 'chk_ritka',
    text: '*улыбается впервые за разговор* Чекист, значит. Тогда без церемоний: если Ру спросит — я на пирсе до рассвета. И это... спасибо, что возишь старику портвейн. Он нам как дед. Только ему не говори — он расплачется и скажет, что блесна в глаз попала.',
    choices: [
      {
        text: 'ЧК своих не бросает.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 5 } },
          { type: 'addKarma', value: 2 },
          { type: 'setFlag', flag: 'ritka_chk_recognized', flagValue: true },
        ],
      },
    ],
  },
  chk_ru_stalker: {
    id: 'chk_ru_stalker',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Сталкер — наш проводник. Бывший QA, знает каждый корень на Зорге. Если нужен путь мимо камер — только через него. Не торопи: он проверяет каждого, даже меня.',
    choices: [
      {
        text: 'Понял. Найду его у костра.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'chk_stalker', npcChange: { relation: 3 } },
        ],
      },
    ],
  },
  chk_ru_honorary_farewell: {
    id: 'chk_ru_honorary_farewell',
    speaker: 'Ру',
    speakerId: 'chk_ru',
    text: 'Чекист навсегда — не звание, а обещание. Гильдия сменится, код перепишут, а костёр останется. Если новый мир снова забудет слово — вернись. Мы не революция. Мы — тыл.',
    contextNote: 'Ру снимает шляпу — редкий жест, который он делает только для своих.',
    choices: [
      {
        text: 'ЧК своих не бросает.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 5 } },
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'setFlag', flag: 'tolpa_act7_farewell_heard', flagValue: true },
        ],
      },
    ],
  },
  chk_silence: {
    id: 'chk_silence',
    speaker: '',
    text: '*Костёр трещит. Река вдали. Кто-то тихо перебирает струны. Слова не нужны.*',
    contextNote: 'Все у костра молчат. Слышен только треск дров и далёкий плеск воды.',
    choices: [
      {
        text: 'Остаться в тишине.',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -5 }],
      },
      { text: 'Встать и уйти.', next: null },
    ],
  },
  chk_silence_night: {
    id: 'chk_silence_night',
    speaker: '',
    text: '*Ночной костёр горит ниже, но дольше. Звёзды проступают сквозь ели. Кто-то тихо напевает — не для галочки, а для себя.*',
    contextNote: 'Ночь у костра. Тишина глубже, чем днём; даже металл играет тише.',
    choices: [
      {
        text: 'Остаться в тишине.',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -8 }],
      },
      { text: 'Встать и уйти.', next: null },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     RETURN DIALOGUE NODES (missing)
     ═══════════════════════════════════════════════════════════ */

  chk_based_return: {
    id: 'chk_based_return',
    speaker: 'Басед',
    speakerId: 'chk_based',
    text: 'Снова у ящика? Хорошо. Портвейн не закончился — значит, и мы тоже. Наливай. Рассказывай, что там в проде, или просто пей.',
    contextNote: 'Басед держит бутылку наготове. Рядом чистый бокал — как будто ждал именно тебя.',
    choices: [
      {
        text: 'За uptime!',
        next: 'chk_based_oath',
      },
      {
        text: 'Нужен ящик «777» для костра?',
        next: 'chk_portwine_delivery_start',
        condition: { missingFlag: 'chk_portwine_active' },
      },
      {
        text: 'Про неоновый архив на вывеске?',
        next: 'quest_act2_chk_neon_archive_start',
        condition: { missingFlag: 'chk_neon_archive_done' },
      },
      {
        text: 'Ящик донёс — жду тост.',
        next: 'chk_portwine_toast',
        condition: {
          flag: 'chk_portwine_delivery_done',
          missingFlag: 'chk_portwine_toast_shared',
        },
      },
      {
        text: 'Новый портвейн? Что за сорт?',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 2 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      {
        text: 'Держи «777».',
        next: 'chk_based_gift_wine',
        condition: { hasItem: 'port_wine_777' },
      },
      { text: 'Просто посижу.', next: null },
    ],
  },

  chk_smert_return: {
    id: 'chk_smert_return',
    speaker: 'Смерть',
    speakerId: 'chk_smert',
    text: 'А, наблюдатель вернулся. Суперпозиция разрешилась в «здесь и сейчас». Будешь чай или сразу к запутанности?',
    contextNote: 'Смерть помешивает чай и смотрит сквозь пар — как сквозь data pipeline.',
    choices: [
      {
        text: 'Объясни квантовую запутанность для PM.',
        next: 'chk_smert_quantum',
      },
      {
        text: 'Просто чай. Без физики.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'npcChange', npcId: 'chk_smert', npcChange: { relation: 1 } },
        ],
      },
      {
        text: 'Баги и свобода воли — ты в это веришь?',
        next: null,
        condition: { flag: 'tolpa_quantum_talk' },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'chk_smert', npcChange: { relation: 3 } },
        ],
      },
      { text: 'Потом, Смерть.', next: null },
    ],
  },

  chk_stalker_return: {
    id: 'chk_stalker_return',
    speaker: 'Сталкер',
    speakerId: 'chk_stalker',
    text: 'Тропа помнит шаги. Ты — уже не гость. Но тропы меняются. Спрашивай — или иди.',
    contextNote: 'Сталкер стоит на краю поляны, шарф закрывает лицо. Глаза сканируют лес, как систему мониторинга.',
    choices: [
      {
        text: 'Покажи безопасный путь обратно в город.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'chk_path_known', flagValue: true },
          { type: 'npcChange', npcId: 'chk_stalker', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Нужен путь к гильдии — через лес.',
        next: 'chk_stalker_act4_route',
        condition: { flag: 'ready_for_infiltration' },
      },
      {
        text: 'Звезда на небе — или в коде?',
        next: 'chk_stalker_guiding_star',
        condition: { collectedPoem: 'poem_3' },
      },
      { text: 'Я сам найду.', next: null },
    ],
  },

  chk_elis_return: {
    id: 'chk_elis_return',
    speaker: 'Элис',
    speakerId: 'chk_elis',
    text: 'Тест-кейсы опять зелёные — значит, можно петь. Вернулся за аккордами или за разговорами?',
    contextNote: 'Элис перебирает струны. Третья струна дребезжит, но она не обращает внимания.',
    choices: [
      {
        text: 'Струна E оборвалась — помочь?',
        next: 'chk_guitar_strings_start',
        condition: { missingFlag: 'chk_guitar_strings_active' },
      },
      {
        text: 'Принёс твою струну из офиса',
        next: 'chk_guitar_return_elis',
        condition: {
          flag: 'chk_guitar_string_taken',
          missingFlag: 'chk_guitar_string_returned',
        },
      },
      {
        text: 'Слушаю аккорд — камеры ждут',
        next: 'chk_guitar_blind_song',
        condition: {
          flag: 'chk_guitar_string_returned',
          missingFlag: 'chk_guitar_song_heard',
        },
      },
      {
        text: 'Принёс струну из офиса — для Ритки',
        next: 'pier_ritka_elis_pack',
        condition: { flag: 'pier_ritka_get_strings_done', missingFlag: 'pier_ritka_elis_pack_ready' },
      },
      {
        text: 'Поём вместе.',
        next: 'chk_elis_song',
      },
      {
        text: 'У меня есть стих «Город шепчет»...',
        next: 'chk_elis_poem_reaction',
        condition: { collectedPoem: 'poem_act6_01' },
      },
      {
        text: 'Только слушаю.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'chk_elis', npcChange: { relation: 2 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
    ],
  },

  chk_guest_devops_return: {
    id: 'chk_guest_devops_return',
    speaker: 'Гость (DevOps)',
    speakerId: 'chk_guest_devops',
    text: 'Опять заехал — релиз закончился, а спать не хочется. Кто-нибудь нашёл мой термос? Там точно не чай.',
    choices: [
      {
        text: 'Расскажи war story.',
        next: 'chk_guest_devops_war',
      },
      {
        text: 'Как CI? Всё падает?',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'chk_guest_devops', npcChange: { relation: 2 } },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Просто отдыхай у костра.',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -2 }],
      },
    ],
  },

  chk_guest_analyst_return: {
    id: 'chk_guest_analyst_return',
    speaker: 'Гость (Аналитик)',
    speakerId: 'chk_guest_analyst',
    text: 'Новая выборка! Вернулся — значит, гипотеза подтверждается: карма и упрямство коррелируют. Проверим?',
    choices: [
      {
        text: 'Наука у костра — лучшая наука.',
        next: 'chk_guest_analyst_karma',
      },
      {
        text: 'Новые графики? Что говорят метрики?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'chk_guest_analyst', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Не мешай отдыхать.',
        next: null,
      },
    ],
  },
};
