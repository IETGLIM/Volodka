/* ─── ТОЛПА / ЧК — dialogue trees ─── */

import type { DialogueNode } from '@/shared/types/game';

export const CHK_DIALOGUE_NODES: Record<string, DialogueNode> = {
  chk_ru_greeting: {
    id: 'chk_ru_greeting',
    speaker: 'Ру',
    text: 'Ты нашёл Чёрную Комнату. Днём мы — архитекторы, админы, бухгалтеры. Ночью — чекисты ТОЛПА. Садись: Басед наливает, Смерть спорит с квантовой механикой, Элис настраивает гитару.',
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
        text: 'Просто послушаю у костра.',
        next: null,
      },
    ],
  },
  chk_ru_act3_sanctuary: {
    id: 'chk_ru_act3_sanctuary',
    speaker: 'Ру',
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
    text: 'Портвейн — не для слабонервных и не для отчётов. Держи бокал. Сегодня обсуждаем: почему прод упал, а мы всё ещё живы.',
    choices: [
      {
        text: 'За uptime!',
        next: 'chk_based_oath',
      },
      {
        text: 'Я за moderation.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 2 } }],
      },
    ],
  },
  chk_based_oath: {
    id: 'chk_based_oath',
    speaker: 'Басед',
    text: 'Чекист клянётся: не пить один у монитора, делиться бутылкой и не деплоить в пятницу после полуночи. Ну... стараться.',
    choices: [
      {
        text: 'Клянусь.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tolpa_oath_taken', flagValue: true },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 5 } },
        ],
      },
    ],
  },
  chk_smert_greeting: {
    id: 'chk_smert_greeting',
    speaker: 'Смерть',
    text: 'Если наблюдатель закрывает ноутбук — коллапсирует ли волновая функция деплоя? Обсудим после второго бокала. Кстати, я не настоящая Смерть. Я бухгалтер.',
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
    ],
  },
  chk_stalker_act4_route: {
    id: 'chk_stalker_act4_route',
    speaker: 'Сталкер',
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
    text: 'Тест-кейсы зелёные — можно петь. Сегодня что-нибудь из разряда «баг в проде, но мы держимся». Слушать или попробуешь подпеть?',
    choices: [
      {
        text: 'Поём вместе.',
        next: 'chk_elis_song',
      },
      {
        text: 'Только слушаю.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'chk_elis', npcChange: { relation: 3 } }],
      },
    ],
  },
  chk_elis_song: {
    id: 'chk_elis_song',
    speaker: 'Элис',
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
    ],
  },
  chk_guest_analyst_greeting: {
    id: 'chk_guest_analyst_greeting',
    speaker: 'Гость (Аналитик)',
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
    text: '*перебирает струны, не поднимая головы* Если ты от Ру — передай, что я не потерялась. Я тут. Огни на воде лучше, чем огни на мониторе. *поднимает глаза* Ритка. ЧК, младший состав. Гитара, как видишь, при мне. Почти живая.',
    choices: [
      { text: 'Что это за место?', next: 'chk_ritka_about' },
      { text: 'Сыграешь что-нибудь?', next: 'chk_ritka_song_request' },
      {
        text: 'Свои. Клятва портвейна принята.',
        next: 'chk_ritka_tolpa',
        condition: { flag: 'tolpa_member' },
      },
      {
        text: 'Та песня у костра... спой ещё.',
        next: 'chk_ritka_after_song',
        condition: { flag: 'quiet_song_ritka' },
      },
      { text: 'Не буду мешать.', next: null },
    ],
  },
  chk_ritka_about: {
    id: 'chk_ritka_about',
    speaker: 'Ритка',
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
};
