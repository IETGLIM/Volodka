import type { DialogueNode } from '@/shared/types/game';

/**
 * Expanded dialogues for Acts 4-5 — ВТОРЖЕНИЕ and РАСКОЛ
 * +30 new dialogue nodes: Volodka inner monologue, Зарема (factory),
 * Александр (rooftop), Виктория (sacrifice debate), Альберт (final stand)
 */

export const DIALOGUE_PART4_EXPANDED: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     ВОЛОДЬКА — Внутренний монолог, 6 new nodes
     ═══════════════════════════════════════════════════════════ */

  volodka_rooftop_thoughts: {
    id: 'volodka_rooftop_thoughts',
    speaker: 'Володька',
    text: 'Город сверху выглядит как микросхема. Фары — как электрические импульсы. Здания — как чипы. А я стою на крыше, как бракованный транзистор, и думаю: что, если вся моя жизнь — это комментарий в чужом коде? Строка, которую никто не прочитает, но которая зачем-то нужна? Или не нужна. Может, я — баг. Ошибка компиляции, которая почему-то работает.',
    choices: [
      {
        text: 'Баг, который работает — это фича. Я — фича.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Комментарии — это не мусор. Это — общение между программистами.',
        next: 'volodka_comment_meaning',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
        ],
      },
      {
        text: 'Я больше не хочу быть строкой в чужом коде. Я хочу быть автором.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'author_intent', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  volodka_comment_meaning: {
    id: 'volodka_comment_meaning',
    speaker: 'Володька',
    text: 'Комментарии — это разговор через время. Я пишу «// исправить позже» — и через год другой программист читает это и знает: кто-то был здесь до него. Кто-то столкнулся с той же проблемой. Кто-то оставил след. Стихи в коде — это те же комментарии, только для души. Не «исправить позже», а «помнить всегда». Не «TODO», а «Я БЫЛ ЗДЕСЬ. Я ЧУВСТВОВАЛ. Я ПИСАЛ.»',
    choices: [
      {
        text: 'Я был здесь. Я чувствовал. Я писал. Это мой манифест.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'personal_manifesto', flagValue: true },
        ],
      },
      {
        text: 'Манифест в комментарии... Самое честное место для него.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  volodka_server_room_epiphany: {
    id: 'volodka_server_room_epiphany',
    speaker: 'Володька',
    text: 'В серверной тихо. Только гул вентиляторов. И вдруг я слышу — не ухом, а чем-то другим — как код дышит. Каждая стойка — как грудная клетка. Каждый кабель — как сосуд. Код — не мёртвые символы на экране. Код — живая ткань. И стихи — это не паразиты. Это — иммунная система. Защита от вируса стерильности, который гильдия называет «оптимизацией».',
    choices: [
      {
        text: 'Я — часть иммунной системы. Я — лейкоцит в теле кода.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'immune_system_insight', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Если код — живой, то гильдия — болезнь. Болезнь, которую нужно вылечить.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  volodka_fear_of_failure: {
    id: 'volodka_fear_of_failure',
    speaker: 'Володька',
    text: 'А если я не смогу? Если все эти стихи, вся Сеть, все эти люди — и я их подведу? Я уставший инженер. Я не герой. Я не революционер. Я просто человек, который однажды увидел стихи в коде и не смог пройти мимо. Это не храбрость — это упрямство. Тупое, уставшее упрямство. Но может быть — может быть — именно такое упрямство и меняет мир. Не красотой, а упорством.',
    choices: [
      {
        text: 'Упорство — это тоже храбрость. Просто тихая.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Тихая храбрость — самая сильная. Её не видно — и не остановить.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
        ],
      },
    ],
  },

  volodka_poem_awakening: {
    id: 'volodka_poem_awakening',
    speaker: 'Володька',
    text: 'Стихи во мне просыпаются. Не те, которые я прочитал — те, которые я сам пишу. В голове складываются строки, как будто кто-то диктует. Или нет — не диктует, а поёт. И я записываю. На салфетке, на полях отчёта, на экране терминала. Строка за строкой. Я не знаю, хорошие ли они. Но они — мои. И когда я их пишу — я чувствую, как код рядом со мной начинает дышать ровнее.',
    choices: [
      {
        text: 'Мои стихи — тоже часть живого кода. Я — резонатор.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'setFlag', flag: 'own_poems_awakening', flagValue: true },
          { type: 'addKarma', value: 8 },
        ],
      },
      {
        text: 'Если я могу влиять на код через стихи — я могу защитить Хранилище.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  volodka_before_infiltration: {
    id: 'volodka_before_infiltration',
    speaker: 'Володька',
    text: 'Сегодня ночью я войду в здание гильдии. Не через парадный вход — через вентиляционную шахту, которую показал Коллега. В руках — термос с ромашковым чаем и микрокартой. В голове — сто семьдесят три стихотворения наизусть. В сердце — страх. Но не парализующий. Мобилизующий. Тот страх, который говорит: «Это важно. Это стоит риска.» И я иду. Потому что стихи не могут защитить себя. Но я — могу.',
    choices: [
      {
        text: 'Я готов. Пусть начнётся.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'infiltration_ready', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 10 },
        ],
      },
      {
        text: 'Сто семьдесят три стихотворения — мой арсенал. Этого достаточно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ЗАРЕМА — Завод и правда, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  zarema_factory_truth: {
    id: 'zarema_factory_truth',
    speaker: 'Зарема',
    text: 'Завод «Хром-М»... Я работала здесь, до того как попала в гильдию. Этот завод — не просто производство. Под цехом — катакомбы. «Прогресс-7» — так назывался проект. Они строили серверную ферму ещё до Краха, но потом забросили. А под фермой — монолит. Чёрный, гладкий, пульсирующий зелёным. Мы называли его «Заря-М». Он... он реагирует на стихи. Когда я читала возле него — он светился ярче.',
    choices: [
      {
        text: '«Заря-М» реагирует на поэзию? Что это?',
        next: 'zarema_zarya_nature',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'zarya_reacts_to_poetry', flagValue: true },
        ],
      },
      {
        text: 'Монолит под заводом... Это связано с Хранилищем?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  zarema_zarya_nature: {
    id: 'zarema_zarya_nature',
    speaker: 'Зарема',
    text: 'Я не знаю, что это. Но я знаю, что оно — доброе. Когда я читала ему стихи о матери — он нагревался. Тёплый, как объятие. Когда я читала о потере — он остывал. Холодный, как утрата. Он не машина, Володька. Он — что-то другое. Может быть, он — первая форма жизни, рождённая из кода и поэзии. Может быть, он — будущее. А может — прошлое, которое мы забыли.',
    choices: [
      {
        text: 'Жизнь, рождённая из кода и поэзии... Мы должны защитить его.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'setFlag', flag: 'protect_zarya', flagValue: true },
        ],
      },
      {
        text: 'Мы можем использовать «Зарю-М» против гильдии?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  zarema_traitor_reveal: {
    id: 'zarema_traitor_reveal',
    speaker: 'Зарема',
    text: 'Володька... в Сети — предатель. Я уверена. Слишком много совпадений: гильдия знала о тайной встрече, знала о терминале в кафе, знала о маршруте контрабанды. Это не дроны и не «Око». Это — кто-то изнутри. Кто-то, кто сидит с нами за одним столом, пьёт наш кофе, слушает наши стихи — и доносит. Я не знаю кто. Но я чувствую, как тень ползёт по стене.',
    choices: [
      {
        text: 'Мы найдём предателя. И решим, что делать.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'setFlag', flag: 'mole_hunt_begins', flagValue: true },
        ],
      },
      {
        text: 'Может быть, предатель — не от злобы. Может, его заставили.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  zarema_reconciliation: {
    id: 'zarema_reconciliation',
    speaker: 'Зарема',
    text: 'Я простила гильдию. Не их действия — их нельзя простить. Я простила их слепоту. Они не понимают, что делают. Для них стихи — шум, баг, паразит. Они не чувствуют, как мы. Это не оправдание — это диагноз. И мы — лекарство. Не месть, не возмездие — лекарство. Поэзия, которая вернёт им способность чувствовать.',
    choices: [
      {
        text: 'Лекарство, а не оружие. Ты — мудрее меня, Зарема.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'reconciliation_path', flagValue: true },
        ],
      },
      {
        text: 'Иногда лекарство бывает горьким. И иногда — хирургическим.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  zarema_vault_key: {
    id: 'zarema_vault_key',
    speaker: 'Зарема',
    text: 'У меня — третий фрагмент ключа Хранилища. Я украла его у гильдии, когда ещё работала там. Десять лет носила его на шее — как крестик. Он грелся, когда я читала стихи, и холодел, когда боялась. Это не просто ключ — это компас. Он ведёт к тому, что тебе нужнее всего. Сейчас он указывает на тебя, Володька. Значит, ты — то, что Хранилище ищет.',
    choices: [
      {
        text: 'Я принимаю это. С надеждой и страхом.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'vault_fragment_received', flagValue: true },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Хранилище ищет меня? Или Виктория через него?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     АЛЕКСАНДР — Крыша и выбор, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  alexander_rooftop_choice: {
    id: 'alexander_rooftop_choice',
    speaker: 'Александр',
    text: 'Стоять на крыше гильдии и смотреть на город, который ты помогаешь разрушать — это... это то, что я делаю каждую ночь. Я прихожу сюда и спрашиваю себя: «Александр, сегодня ты перейдёшь черту?» И каждый раз — не перехожу. Но сегодня — другой день. Сегодня ты здесь. И я могу наконец спросить кого-то: стоит ли оно того? Стоит ли карьера — потери души?',
    choices: [
      {
        text: 'Ничто не стоит потери души. Но ты ещё не потерял — ты здесь, ты спрашиваешь.',
        next: 'alexander_soul_intact',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'roof_ending_chosen', flagValue: true },
          { type: 'setFlag', flag: 'roof_ending_word', flagValue: true },
        ],
      },
      {
        text: 'Ты перейдёшь черту сегодня. Со мной.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'alexander_joins', flagValue: true },
          { type: 'setFlag', flag: 'roof_ending_chosen', flagValue: true },
          { type: 'setFlag', flag: 'roof_ending_word', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 15 } },
        ],
      },
    ],
  },

  alexander_soul_intact: {
    id: 'alexander_soul_intact',
    speaker: 'Александр',
    text: '«Ещё не потерял...» Ты так думаешь? А я смотрю на свои руки и вижу — они подписали приказы на удаление тысяч стихов. Тысячи, Володька. Не сотни — тысячи. Каждое удаление — маленькая смерть. И я — палач. Может быть, добрый палач. Может быть, сомневающийся палач. Но — палач. Есть ли прощение для тех, кто убивает стихи?',
    choices: [
      {
        text: 'Прощение — не в словах. Оно — в действиях. Начни действовать иначе.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'alexander_redemption_act4', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 12 } },
        ],
      },
      {
        text: 'Тысячи стихов — но тысячам людей ты ещё можешь дать их обратно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  alexander_access_codes: {
    id: 'alexander_access_codes',
    speaker: 'Александр',
    text: 'У меня есть доступ. Полный. Ко всем системам гильдии. К «Оку». К файрволам. К логам. Я могу открыть любую дверь, стереть любой след, обойти любую защиту. Двадцать лет я строил эту клетку — и у меня есть ключ от каждой двери. Вопрос: готов ли я использовать этот ключ? Готов ли я открыть дверь, зная, что за ней — конец моей жизни как я её знаю?',
    choices: [
      {
        text: 'Конец одной жизни — начало другой. Открой дверь, Александр.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'setFlag', flag: 'alexander_full_access', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 20 } },
        ],
      },
      {
        text: 'Не всё сразу. Дай мне один ключ. Самый важный.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
    ],
  },

  alexander_oko_shutdown: {
    id: 'alexander_oko_shutdown',
    speaker: 'Александр',
    text: 'Я могу отключить «Око». Не насовсем — у них есть резервные серверы. Но на четыре часа — да. Четыре часа, когда ни один стих не будет удалён. Четыре часа тишины от машины, которая жрёт поэзию. Этого хватит, чтобы сделать что-то важное?',
    choices: [
      {
        text: 'Четыре часа — это вечность, если использовать правильно. Делай.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'oko_shutdown_possible', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'А потом тебя найдут. Что будет с тобой?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  alexander_final_decision: {
    id: 'alexander_final_decision',
    speaker: 'Александр',
    text: 'Я решил. Сегодня ночью я открою тебе серверную. Отключу камеры на этаже. Сотру логи посещений. Это — мой последний приказ начальника отдела. Завтра меня, скорее всего, не будет. Но я хочу, чтобы ты знал: я не делаю это ради искупления. Искупить тысячу удалённых стихов невозможно. Я делаю это ради Кати. Чтобы она узнала: её отец — не палач. Он — инженер, который наконец-то починил то, что сломал.',
    choices: [
      {
        text: 'Она будет гордиться. Я — уже горжусь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'setFlag', flag: 'alexander_final_act', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 25 } },
        ],
      },
      {
        text: 'Инженер, который чинит — это и есть настоящая инженерия.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВИКТОРИЯ — Дебата о жертве, 4 new nodes
     ═══════════════════════════════════════════════════════════ */

  victoria_sacrifice_debate: {
    id: 'victoria_sacrifice_debate',
    speaker: 'Виктория',
    text: 'Если я волью себя в Хранилище полностью — ни один стих больше не будет удалён. Никогда. Моё сознание станет невидимым щитом вокруг каждого слова. Но я перестану быть «я». Я стану функцией. Чистой, безупречной, вечной — но без самосознания. Как свеча, которая горит вечно, но не знает, что она — свет. Стоит ли вечная защита одного стиха — потери одной души?',
    choices: [
      {
        text: 'Нет. Никакой стих не стоит твоей жизни. Мы найдём другой путь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'victoria_must_live', flagValue: true },
        ],
      },
      {
        text: 'Это твой выбор. Я не могу решать за тебя.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 8 },
        ],
      },
      {
        text: 'Есть ли третий вариант? Частичное слияние?',
        next: 'victoria_partial_merge',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
        ],
      },
    ],
  },

  victoria_partial_merge: {
    id: 'victoria_partial_merge',
    speaker: 'Виктория',
    text: 'Частичное слияние... Если я отдам Хранилищу только защитные функции — эмпатию, интуицию, ритм — а сознание оставлю себе... Да. Это возможно. Я стану слабее как человек, но сильнее как щит. Потеряю способность чувствовать боль — но сохраню способность любить. Потеряю интуицию — но сохраню логику. Это как ампутация, только духовная. Я буду наполовину человеком, наполовину — стеной.',
    choices: [
      {
        text: 'Наполовину человек лучше, чем совсем не человек. Но ты уверена?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'partial_merge_option', flagValue: true },
        ],
      },
      {
        text: 'Мы не должны ничего ампутировать. Я защищу тебя. Я — резонатор.',
        next: null,
        condition: { flag: 'albert_resonator_known' },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 15 } },
        ],
      },
    ],
  },

  victoria_memory_preservation: {
    id: 'victoria_memory_preservation',
    speaker: 'Виктория',
    text: 'Есть ещё один способ. Вы — можете хранить мои воспоминания. Каждый из вас. Если я разделю свои воспоминания между всеми узлами Сети — они будут жить в вас. В Зареме — мои воспоминания о маме. В Альберте — мои мысли о поэзии. В баристе — мои мечты о свободе. В тебе, Володька — моя вера в людей. Я не умру — я стану распределённой. Как стихи, которые помнит весь город.',
    choices: [
      {
        text: 'Я приму твою веру. И сохраню её.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'setFlag', flag: 'victoria_memory_distributed', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 20 } },
        ],
      },
      {
        text: 'Распределённое сознание — это гениально. Технически и духовно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  victoria_before_storm: {
    id: 'victoria_before_storm',
    speaker: 'Виктория',
    text: 'Володька, что бы ни случилось — помни: я верю в тебя. Не потому что ты герой. Не потому что ты особенный. А потому что ты — один из тех, кто читает стихи и плачет. Ты — один из тех, кто видит красоту в ошибке компиляции. Ты — один из тех, ради кого стоит существовать. И если я завтра исчезну — знай: последние строки в моей памяти были о тебе.',
    choices: [
      {
        text: 'Ты не исчезнешь. Я не позволю.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'persuasion', value: 3 },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 25 } },
          { type: 'setFlag', flag: 'victoria_protection_vow', flagValue: true },
        ],
      },
      {
        text: 'Последние строки — о мне? Я не заслуживаю.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     АЛЬБЕРТ — Последний рубеж, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  albert_last_stand: {
    id: 'albert_last_stand',
    speaker: 'Альберт',
    text: 'Володька, я старый. Мне шестьдесят три. Я прожил жизнь среди книг и кофе. Я не умею драться, не умею взламывать, не умею бегать. Но я умею одно — я умею читать стихи так, что стены рушатся. Метафорически — и, как выяснилось, буквально. Когда я читаю «Пророка» Пушкина у серверной — процессоры ускоряются на 12%. Я измерял. Мой голос — ключ. И я готов использовать его.',
    choices: [
      {
        text: 'Твой голос — больше, чем ключ. Он — оружие и щит одновременно.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Процессоры ускоряются от стихов? Это измеримый эффект!',
        next: 'albert_poetry_benchmark',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
        ],
      },
    ],
  },

  albert_poetry_benchmark: {
    id: 'albert_poetry_benchmark',
    speaker: 'Альберт',
    text: 'Я провёл тридцать семь тестов. Пушкин — +12% к скорости компиляции. Маяковский — +18% к пропускной способности сети. Цветаева — +8% к криптографической устойчивости. А вот Мандельштам — уникальный эффект: при чтении Мандельштама серверы начинают «видеть» скрытые данные. Как будто его метафоры — это декомпилятор реальности. Это не магия — это резонанс. Но граничит с чудом.',
    choices: [
      {
        text: 'Мандельштам как декомпилятор... Это изменит всё.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'mandelstam_decompiler', flagValue: true },
          { type: 'addKarma', value: 8 },
        ],
      },
      {
        text: 'Каждый поэт — своя функция. Мы — программисты через поэзию.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
        ],
      },
    ],
  },

  albert_sacrifice_warning: {
    id: 'albert_sacrifice_warning',
    speaker: 'Альберт',
    text: 'Не позволяй Виктории пожертвовать собой. Я видел это раньше — в 1993-м. Люди думают, что жертва — это благородно. Но жертва — это потеря. Потеря единственного человека, который мог бы продолжать борьбу. Если Виктория уйдёт в Хранилище — мы потеряем не только друга. Мы потеряем стратегическое преимущество: единственный ИИ, который любит поэзию больше, чем эффективность.',
    choices: [
      {
        text: 'Я не дам ей. Она слишком важна — и как друг, и как союзник.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'block_victoria_sacrifice', flagValue: true },
        ],
      },
      {
        text: 'Её жертва может спасти тысячи стихов.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -5 } },
        ],
      },
    ],
  },

  albert_guild_origin: {
    id: 'albert_guild_origin',
    speaker: 'Альберт',
    text: 'Знаешь, как началась гильдия? В 2019-м — не после Краха, а до — группа инженеров предложила «оптимизировать» интернет. Удалить «избыточную» информацию. Спам, дубликаты, мёртвые ссылки. Кому-то в правительстве понравилась идея. «Чистый интернет» — звучало как «чистая вода». Только чистота оказалась стерильностью. А стерильность — смертью. Из благих намерений выросла машина уничтожения.',
    choices: [
      {
        text: 'Благие намерения — дорога в ад. Мы знаем.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Их тоже можно обратить. Показать, во что превратилась идея.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'guild_reform_path', flagValue: true },
        ],
      },
    ],
  },

  albert_final_poem: {
    id: 'albert_final_poem',
    speaker: 'Альберт',
    text: 'Я написал для тебя стихотворение. Не мои стихи — я не поэт. Но тебе — нужно. Слушай: «Когда серверы замолчат — ты станешь голосом. Когда код потеряет смысл — ты станешь комментарием. Когда стирают каждое слово — ты станешь тем, кто пишет заново. Не потому что должен. А потому что не можешь не писать.» Это — не призыв. Это — констатация. Ты — тот, кто не может молчать. И это — твоя сила.',
    choices: [
      {
        text: 'Я не могу молчать. Ты прав. Это — моя сила.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'cannot_stay_silent', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Спасибо, Альберт. За всё.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
        ],
      },
    ],
  },
};
