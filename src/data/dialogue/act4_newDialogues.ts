import type { DialogueNode } from '@/shared/types/game';

export const DIALOGUE_ACT4_NEW: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     ТОРГОВЕЦ БОРИС — Затерянный груз
     ═══════════════════════════════════════════════════════════ */

  merchant_boris_greeting: {
    id: 'merchant_boris_greeting',
    speaker: 'Борис',
    text: 'О, путник! Как раз тебя искал. Видишь ли, дело такое... Я вёз груз из столицы — редкие зелья и ткани. Но на лесной дороге телега перевернулась, а я еле ноги унёс. Груз остался там. Если найдёшь — щедро заплачу. Ящик с синей печатью, не спутаешь.',
    choices: [
      {
        text: 'Конечно, помогу. Какой маршрут ты держал?',
        next: 'merchant_boris_route_details',
        condition: { missingFlag: 'lost_shipment_started' },
        effects: [
          { type: 'triggerQuest', questId: 'lost_shipment' },
          { type: 'setFlag', flag: 'lost_shipment_started', flagValue: true },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'А сколько заплатишь?',
        next: 'merchant_boris_payment',
        condition: { missingFlag: 'lost_shipment_started' },
        effects: [
          { type: 'triggerQuest', questId: 'lost_shipment' },
          { type: 'setFlag', flag: 'lost_shipment_started', flagValue: true },
        ],
      },
      {
        text: 'Ящик с синей печатью — вот он, целый. Держи.',
        next: 'merchant_boris_thankyou',
        condition: { hasItem: 'boris_shipment_crate' },
        effects: [
          { type: 'removeItem', itemId: 'boris_shipment_crate', value: 1 },
        ],
      },
      {
        text: 'Не моё дело. Ищи сам.',
        next: null,
        effects: [
          { type: 'addKarma', value: -1 },
        ],
      },
    ],
  },

  merchant_boris_route_details: {
    id: 'merchant_boris_route_details',
    speaker: 'Борис',
    text: 'Благодарю! Дорога идёт на северо-запад, мимо старого дуба. Примерно через милю должен быть поворот — там дорога огибает овраг. Телега перевернулась именно там. Будь осторожен: в тех местах бродят бандиты, да и зверьё шило.',
    choices: [
      {
        text: 'Понял. Скоро вернусь.',
        next: null,
        effects: [],
      },
    ],
  },

  merchant_boris_payment: {
    id: 'merchant_boris_payment',
    speaker: 'Борис',
    text: 'Пятьдесят монет — честная цена. Плюс два зелья ночного зрения из того же груза. Согласен? Груз стоит втрое дороже, но я человек справедливый.',
    choices: [
      {
        text: 'По рукам.',
        next: 'merchant_boris_route_details',
        effects: [
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Маловато. Сто.',
        next: 'merchant_boris_haggle',
        effects: [],
      },
    ],
  },

  merchant_boris_haggle: {
    id: 'merchant_boris_haggle',
    speaker: 'Борис',
    text: 'Хм... Ладно, семьдесят. Но это мой последний предел. Торговец я, но не дурак. Дорога на северо-запад, мимо старого дуба, затем налево у оврага.',
    choices: [
      {
        text: 'Согласен.',
        next: null,
        effects: [
          { type: 'addCredits', value: 20 },
        ],
      },
    ],
  },

  merchant_boris_thankyou: {
    id: 'merchant_boris_thankyou',
    speaker: 'Борис',
    text: 'Ты нашёл мой ящик! Благодарю, путник. Вот, как и договаривались — твоё вознаграждение. Если когда-нибудь понадобится что-то из моего товара — для тебя скидка. И ещё... будь осторожен в том лесу. Там не всё так просто, как кажется.',
    choices: [
      {
        text: 'Рад помочь. Увидимся.',
        next: null,
        // FIX (v4.10.0): награды квеста (100 XP / 50 кредитов / 2 зелья) выдаёт
        // автокомплит квеста lost_shipment — цель npc_talked срабатывает при
        // ОТКРЫТИИ диалога. Дубликаты грантов в узле вычищены: награда —
        // единый источник (дефиниция квеста).
        effects: [],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ИНФОРМАНТ СЕРГЕЙ — Взятка страже
     ═══════════════════════════════════════════════════════════ */

  informant_seryozha_corruption: {
    id: 'informant_seryozha_corruption',
    speaker: 'Сергей',
    text: '*озирается* Тише, тише... Слышал про капитана Гарольда? Всем кажется, что он образцовый стражник. А вот я знаю правду. Он берёт мзду с каждого торговца, который проезжает через город. И не только деньги — информацию тоже. Если кто-то подаст ему — все проверки проходят гладко. А если нет... *щёлкает пальцами* ...проблемы начинаются.',
    choices: [
      {
        text: 'У тебя есть доказательства?',
        next: 'informant_seryozha_evidence_location',
        effects: [
          { type: 'triggerQuest', questId: 'guard_bribe_evidence' },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Зачем мне это знать?',
        next: 'informant_seryozha_why_care',
        effects: [
          { type: 'triggerQuest', questId: 'guard_bribe_evidence' },
        ],
      },
      {
        text: 'Про катакомбы под старой мельницей — что там, во тьме?',
        next: null,
        condition: { requiredAct: 4, missingFlag: 'catacombs_cleared' },
        effects: [
          { type: 'triggerQuest', questId: 'catacombs_shadows' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Документы у меня. Гарольд — где он?',
        next: null,
        condition: { hasItem: 'corruption_document_1' },
        effects: [
          { type: 'visitStoryNode', nodeId: 'captain_garold_confrontation' },
        ],
      },
      {
        text: 'Не хочу ввязываться в политику.',
        next: null,
        effects: [],
      },
    ],
  },

  informant_seryozha_evidence_location: {
    id: 'informant_seryozha_evidence_location',
    speaker: 'Сергей',
    text: 'Есть. Гарольд ведёт учёт в двух местах. Первый — в казарме, в ящике стола. Второй — в его кабинете, за портретом бывшего командира. Каждый документ — это сделка. Имена, суммы, даты. Достаточно, чтобы его судили. Но будь осторожен — в казарме всегда дежурные, а кабинет заперт.',
    choices: [
      {
        text: 'Понял. Я справлюсь.',
        next: null,
        effects: [],
      },
    ],
  },

  informant_seryozha_why_care: {
    id: 'informant_seryozha_why_care',
    speaker: 'Сергей',
    text: 'Потому что от этого зависит всё. Если стража коррумпирована — городу не на кого опереться. Бандиты чувствуют безнаказанность, торговцы разорены, а простые люди страдают. Ты можешь изменить это. Или пройти мимо. Выбор за тобой.',
    choices: [
      {
        text: 'Хорошо, расскажи подробнее.',
        next: 'informant_seryozha_evidence_location',
        effects: [
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Ладно, не настаивай.',
        next: null,
        effects: [],
      },
    ],
  },

  captain_garold_confrontation: {
    id: 'captain_garold_confrontation',
    speaker: 'Капитан Гарольд',
    text: '*встаёт из-за стола, рука ложится на эфес* Ты кто такой и как попал в мой кабинет? Говори быстро, или я вызову стражу. И советую выбирать слова с умом — здесь мои правила.',
    choices: [
      {
        text: 'Я знаю о твоих сделках, Гарольд. Вот доказательства.',
        next: 'captain_garold_cornered',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
      {
        text: 'Предлагаю сделку: молчишь — и я молчу. Но платишь.',
        next: 'captain_garold_bribe',
        effects: [
          { type: 'addKarma', value: -8 },
          { type: 'addCredits', value: 100 },
        ],
      },
      {
        text: 'Ошибся дверью. Извини, ухожу.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
    ],
  },

  captain_garold_cornered: {
    id: 'captain_garold_cornered',
    speaker: 'Капитан Гарольд',
    text: '*бледнеет, убирает руку от меча* ...Откуда? Кто тебе это дал? *долгая пауза* Ладно. Ты выиграл. Но подумай — если меня уберут, кто займёт моё место? Кто-то хуже. Гораздо хуже. Я держал этот город от хаоса. Это... это сложнее, чем ты думаешь.',
    choices: [
      {
        text: 'Тогда начни делать свою работу честно. Это твой единственный шанс.',
        next: null,
        // FIX (v4.10.0): 200 XP и флаг corruption_exposed выдаёт автокомплит
        // квеста guard_bribe_evidence (цель npc_talked срабатывает при открытии
        // диалога). Здесь остаются только веточные различия кармы/навыка.
        effects: [
          { type: 'addKarma', value: 8 },
        ],
      },
      {
        text: 'Мне всё равно. Доказательства пойдут в совет.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
    ],
  },

  captain_garold_bribe: {
    id: 'captain_garold_bribe',
    speaker: 'Капитан Гарольд',
    text: '*усмехается* Хитёр. Ладно, сто монет — и ты никогда меня не видел. Но запомни: если эти документы появятся где-либо, я узнаю, от кого. И тогда деньги тебе не помогут.',
    choices: [
      {
        text: 'По рукам.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'corruption_bribed', flagValue: true },
          { type: 'addXp', value: 150 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     КУЗНЕЦ ИГНАТ — Оружейник
     ═══════════════════════════════════════════════════════════ */

  blacksmith_ignat_greeting: {
    id: 'blacksmith_ignat_greeting',
    speaker: 'Игнат',
    text: '*стучит молотом по наковальне, потом оборачивается* А, путник! Подожди, дай доплавлю... *вдыхает* Так и быть. Слушай, у меня к тебе дело. Хочу выковать клинок — такой, чтобы песни о нём пели. Но для этого нужны три вещи, которые я сам не достану.',
    choices: [
      {
        text: 'Что за материалы? Рассказывай.',
        next: 'blacksmith_ignat_materials',
        condition: { missingFlag: 'blacksmith_special_done' },
        effects: [
          { type: 'triggerQuest', questId: 'blacksmith_special' },
        ],
      },
      {
        text: 'И что мне за это будет?',
        next: 'blacksmith_ignat_reward',
        condition: { missingFlag: 'blacksmith_special_done' },
        effects: [
          { type: 'triggerQuest', questId: 'blacksmith_special' },
        ],
      },
      {
        text: 'Материалы собраны. Руда, кристалл, чешуя — прими, мастер.',
        next: 'blacksmith_ignat_complete',
        condition: {
          hasItem: 'rare_iron_ore',
          missingFlag: 'blacksmith_special_done',
        },
        effects: [{ type: 'npcChange', npcId: 'blacksmith_ignat', npcChange: { relation: 5 } }],
      },
    ],
  },

  blacksmith_ignat_materials: {
    id: 'blacksmith_ignat_materials',
    speaker: 'Игнат',
    text: 'Три компонента. Во-первых — редкая руда. Она добывается только в заброшенных шахтах на востоке. Синеватая, тяжёлая, пахнет грозой. Во-вторых — осколок кристалла. Есть в пещере за водопадом на севере. И в-третьих — драконья чешуя. Ящеры на болотах иногда линяют, но достать чешую — тот ещё подвиг.',
    choices: [
      {
        text: 'Сложно, но попробую. Буду искать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 1 },
        ],
      },
    ],
  },

  blacksmith_ignat_reward: {
    id: 'blacksmith_ignat_reward',
    speaker: 'Игнат',
    text: '*глаза загораются* Для тебя? Клинок, который режет туман. Лезвие из сплава кристалла и драконьей чешуи — лёгкое, как перо, прочное, как Bulldozer. Плюс я дам тебе пару советов по ремеслу. Ну что, договорились?',
    choices: [
      {
        text: 'Договорились. Начинаю поиск.',
        next: 'blacksmith_ignat_materials',
        effects: [
          { type: 'addKarma', value: 1 },
        ],
      },
    ],
  },

  blacksmith_ignat_complete: {
    id: 'blacksmith_ignat_complete',
    speaker: 'Игнат',
    text: '*бережно принимает материалы, рассматривает каждый* Великолепно... Эта руда — идеальная. Кристалл — без единой трещины. А чешуя... *протирает глаза* Такая чистота бывает раз в жизни. Сейчас начну. *разжигает горн* Через час клинок будет готов. Иди погуляй, а когда вернёшься — мир изменится.',
    choices: [
      {
        text: 'Жду с нетерпением, мастер.',
        next: 'blacksmith_ignat_blade_done',
        effects: [],
      },
    ],
  },

  blacksmith_ignat_blade_done: {
    id: 'blacksmith_ignat_blade_done',
    speaker: 'Игнат',
    text: '*протягивает сверкающий клинок* Готово. Кристальный клинок. Он лёгкий, но бьёт как молот. Режет броню, как масло. И ещё... *понижает голос* ...он светится в темноте. Не спрашивай как — это свойство сплава. Береги его.',
    choices: [
      {
        text: 'Это... потрясающе. Спасибо, Игнат.',
        next: null,
        // FIX (v4.10.0): клинок / 120 XP / навык coding выдаёт автокомплит
        // квеста blacksmith_special (npc_talked срабатывает при открытии
        // диалога). Флаг blacksmith_special_done оставлен здесь намеренно —
        // он уникален: гейтит выборы приветствия Игната.
        effects: [
          { type: 'setFlag', flag: 'blacksmith_special_done', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     УМИРАЮЩИЙ СТАРИК — Последнее желание
     ═══════════════════════════════════════════════════════════ */

  dying_old_man_request: {
    id: 'dying_old_man_request',
    speaker: 'Старик',
    text: '*хриплым голосом* Путник... подойди... *кашляет* Не уходи, прошу тебя... Я... мне нужно... *протягивает конверт с дрожащими руками* Письмо. Для Марины. Моей дочери. Она живёт за рекой, в доме с красной крышей. Десять лет... десять лет я не видел её... *голос срывается* Передай, пожалуйста...',
    choices: [
      {
        text: 'Конечно. Я передам письмо. Обещаю.',
        next: 'dying_old_man_gratitude',
        condition: { missingFlag: 'last_wish_completed' },
        effects: [
          { type: 'triggerQuest', questId: 'last_wish' },
          { type: 'addItem', itemId: 'sealed_letter', value: 1 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Расскажи о ней. Где именно дом?',
        next: 'dying_old_man_details',
        condition: { missingFlag: 'last_wish_completed' },
        effects: [
          { type: 'triggerQuest', questId: 'last_wish' },
          { type: 'addItem', itemId: 'sealed_letter', value: 1 },
        ],
      },
    ],
  },

  dying_old_man_gratitude: {
    id: 'dying_old_man_gratitude',
    speaker: 'Старик',
    text: '*слёзы текут по морщинистым щекам* Благодарю тебя... Благодарю... Скажи ей... скажи, что отец... что он всегда любил... *закрывает глаза* ...её...',
    choices: [
      {
        text: '*молча киваешь*',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  dying_old_man_details: {
    id: 'dying_old_man_details',
    speaker: 'Старик',
    text: 'Марина... ей сейчас около тридцати. Дом за мостом, через реку, потом налево вдоль берега. Крыша красная, у крыльца растёт старая яблоня. Она... она врачевательница. Лечит людей травами. Хорошая девочка... *кашляет* Возьми письмо. И... будь с ней поосторожнее. Она не знает, что я... что я жив.',
    choices: [
      {
        text: 'Понял. Найду её.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Она думает, что ты мёртв?',
        next: 'dying_old_man_explanation',
        effects: [],
      },
    ],
  },

  dying_old_man_explanation: {
    id: 'dying_old_man_explanation',
    speaker: 'Старик',
    text: '*тихо* Я сбежал. От долгов. От позора. Думал — так будет лучше для всех. Но годы идут, а совесть... совесть не отпускает. Письмо — это всё, что у меня есть. Десять слов, написанных дрожащей рукой. Но в них — вся моя жизнь. Передай, прошу.',
    choices: [
      {
        text: 'Передам. Обещаю.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  marina_receive_letter: {
    id: 'marina_receive_letter',
    speaker: 'Марина',
    text: '*останавливается, замечает конверт, бледнеет* Откуда... откуда у тебя это? Этот почерк... *руки дрожат* Это... это письмо от... Нет. Не может быть. Он умер. Десять лет назад. Я видела... мне говорили... *тихо* Отдай мне его. Немедленно.',
    choices: [
      {
        text: '*протягиваешь письмо молча*',
        next: 'marina_reads_letter',
        // FIX (v4.10.0): 80 XP и флаг last_wish_completed выдаёт автокомплит
        // квеста last_wish (npc_talked срабатывает при открытии диалога).
        effects: [],
      },
      {
        text: 'Человек, который дал мне это письмо, ещё жив. Но едва.',
        next: 'marina_father_alive',
        // Карма +5 — веточное различие («отец жив»), не дубликат квестовой награды.
        effects: [
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  marina_reads_letter: {
    id: 'marina_reads_letter',
    speaker: 'Марина',
    text: '*распечатывает письмо, читает. Слёзы катятся по щекам, но она улыбается* «Марина, дочка... прости меня... я был трусом... но я любил тебя каждый день...» *закрывает письмо, прижимает к груди* Спасибо тебе, незнакомец. Спасибо. Ты вернул мне отца. Даже если только в словах.',
    choices: [
      {
        text: 'Он любил тебя. Это главное.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
  },

  marina_father_alive: {
    id: 'marina_father_alive',
    speaker: 'Марина',
    text: '*вздрогивает* Жив?! Где он?! *хватывает тебя за плечи* Скажи мне! Пожалуйста! Десять лет... десять лет я думала... *отпускает, хватается за рот* Где он?',
    choices: [
      {
        text: 'На окраине города. У перекрёстка. Торопись.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'marina_reunited', flagValue: true },
        ],
      },
    ],
  },
};
