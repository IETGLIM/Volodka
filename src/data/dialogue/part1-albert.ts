import type { DialogueNode } from '@/shared/types/game';

export const DIALOGUE_PART1: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     ALBERT — philosopher at the cafe (9 nodes)
     ═══════════════════════════════════════════════════════════ */

  albert_greeting: {
    id: 'albert_greeting',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'А, Володька. Садись. Знаешь, я тут размышлял о природе ошибок. Ошибка в коде — это просто мысль, которую не довели до конца. Как стихотворение, в котором не хватает последней строфы.',
    choices: [
      {
        text: 'Поэзия и код — разве это одно и то же?',
        next: 'albert_greeting_poetry',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Ты как всегда философствуешь, Альберт.',
        next: 'albert_greeting_smile',
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Мне сейчас не до философии.',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: 2 }],
      },
      {
        text: 'Научи меня — код и стихи одно?',
        next: null,
        condition: { flag: 'met_albert' },
        effects: [{ type: 'visitStoryNode', nodeId: 'cafe_albert_lesson_intro' }],
      },
      {
        text: 'Расскажи что-нибудь новое. Я готов слушать.',
        next: 'albert_philosophy',
        condition: { flag: 'albert_relation_warm', minNpcRelation: 60, minTimeOfDay: 15, maxTimeOfDay: 22 },
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Ты говорил об эксперименте — код, который стал стихом?',
        next: 'albert_poetry_of_code',
        condition: { requiredAct: 2, minNpcRelation: 50 },
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Гильдия давит сильнее. Как сопротивляться словом?',
        next: 'albert_resistance',
        condition: { requiredAct: 3, minNpcRelation: 55 },
      },
      {
        text: 'Что такое Хранилище на самом деле?',
        next: 'albert_vault_truth',
        condition: { requiredAct: 3, flag: 'vault_under_attack', minNpcRelation: 60 },
      },
      {
        text: '«Слово» режет ложь — ты тоже это чувствовал?',
        next: 'albert_poem_word_gate',
        condition: { collectedPoem: 'poem_1' },
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
        ],
      },
      {
        text: '«Правда Глас» ещё звучит — что ты слышишь?',
        next: 'dialogue_truth_revealed',
        condition: { activeTTLFlag: 'truth_voice_active', collectedPoem: 'poem_1' },
      },
    ],
  },

  dialogue_truth_revealed: {
    id: 'dialogue_truth_revealed',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*замирает, глядя сквозь тебя* Слышу? Я слышу, как гильдия стирает имена из протоколов. Твоё «Слово» — не магия. Это напоминание, что правда не подчиняется дедлайнам. Пока оно живо — говори. Потом снова станет тихо.',
    choices: [
      {
        text: 'Я не дам им заткнуть правду.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'albert_truth_whisper', flagValue: true },
        ],
      },
      { text: 'Мне нужно время переварить.', next: null },
    ],
  },

  albert_poem_word_gate: {
    id: 'albert_poem_word_gate',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Чувствовал? Я на этом и ушёл из гильдии. Когда стих становится инструментом цензуры — это уже не поэзия, а протокол. Твоё «Слово» — не бафф. Это ключ к тем, кто ещё помнит, как говорить правду.',
    choices: [
      {
        text: 'Научи меня не бояться говорить.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'albert_truth_mentor', flagValue: true },
        ],
      },
      { text: 'Я ещё не готов.', next: null },
    ],
  },

  albert_greeting_poetry: {
    id: 'albert_greeting_poetry',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'И то, и другое — попытка выразить не выразимое. Разница лишь в том, что код выполняется машиной, а стих — человеком. Но результат зависит от внимательности автора в обоих случаях.',
    choices: [
      {
        text: 'Интересная мысль. Спасибо, Альберт.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Сомневаюсь, что это так просто.',
        next: null,
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
      {
        text: 'А если код — это тоже стихотворение? Просто написанное на другом языке?',
        next: 'albert_tech_talk',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 5 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  albert_greeting_smile: {
    id: 'albert_greeting_smile',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Философия — это всё, что у нас осталось, когда код не компилируется. Шучу. Или нет. Ладно, вот тебе кофе за счёт заведения. Ты выглядишь уставшим.',
    choices: [
      {
        text: 'Спасибо, Альберт.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'energy', value: 10 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Альберт, а почему ты ушел из Гильдии?',
        next: 'albert_personal_story',
        condition: { flag: 'albert_relation_warm' },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  albert_greeting_cold: {
    id: 'albert_greeting_cold',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '...Садись, если хочешь. Только не жди от меня разговоров. Я сегодня не в настроении делиться мудростью с тем, кто не ценит слов.',
    choices: [
      {
        text: 'Извини, если я был груб. Мне правда интересно.',
        next: 'albert_greeting_poetry',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
        ],
      },
      {
        text: 'Как хочешь.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -2 } },
        ],
      },
    ],
  },

  albert_tech_talk: {
    id: 'albert_tech_talk',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'А вот это уже разговор! Видишь ли, каждый алгоритм — это нарратив. У него есть завязка — входные данные, кульминация — вычисление, и развязка — результат. Рекурсия — это возвращение к началу, как в поэзии. А бесконечный цикл — это одержимость, когда автор не может остановиться.',
    choices: [
      {
        text: 'Ты говоришь о рекурсии как о рефрене в стихах?',
        next: 'albert_tech_deep',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Звучит красиво, но работает ли это на практике?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -1 } },
        ],
      },
    ],
  },

  albert_tech_deep: {
    id: 'albert_tech_deep',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Именно! Рефрен — это рекурсия души. Каждый раз, возвращаясь к началу, мы приносим с собой новый опыт. Строка «Я помню чудное мгновенье» — это вызов функции с новым контекстом каждый раз. Пушкин был первым программистом, только не знал этого.',
    choices: [
      {
        text: 'Никогда не думал о Пушкине так. Спасибо, Альберт.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'albert_relation_warm', flagValue: true },
        ],
      },
      {
        text: 'Ты заходишь слишком далеко. Код — это не искусство.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  albert_philosophy: {
    id: 'albert_philosophy',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Хочешь знать, что меня мучает? Вот уже три года. Если машина может написать код, а человек — написать стих, то кто напишет код, который станет стихом? И если такой код появится — мы узнаем его? Или пройдём мимо, приняв за ошибку?',
    choices: [
      {
        text: 'Мы узнаем. Потому что ошибки не вызывают слёз.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_relation_warm', flagValue: true },
        ],
      },
      {
        text: 'Мы пройдём мимо. Мы всегда проходим мимо прекрасного.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
      {
        text: 'Может быть, инцидент #4729 — это и есть такой код?',
        next: null,
        condition: { flag: 'started_decryption' },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'albert_knows_incident', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  albert_personal_story: {
    id: 'albert_personal_story',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Почему я ушёл? Потому что они попросили меня стереть стихи. Не код — стихи. Была база данных, «Архив-7», в ней хранились тысячи стихотворений, оцифрованных ещё до Краха. Гильдия решила, что серверное место дороже. Я отказался выполнять команду DELETE. Ушёл. И с тех пор сижу в этом кафе и пишу стихи в комментариях к чужому коду. Ирония.',
    choices: [
      {
        text: 'Ты поступил правильно. Стихи нельзя стирать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_shared_past', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'discoverLore', loreId: 'lore_it_guild' },
          { type: 'discoverLore', loreId: 'lore_albert' },
          { type: 'discoverLore', loreId: 'lore_great_crash_2029' },
        ],
      },
      {
        text: 'Но ведь это просто данные. Их можно восстановить.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -3 } },
        ],
      },
      {
        text: 'А что если Архив-7 всё ещё существует? Где-то в бэкапе?',
        next: 'albert_betrayal',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 7 }, minNpcRelation: 65, minTimeOfDay: 16 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  albert_betrayal: {
    id: 'albert_betrayal',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Ты... ты знаешь об Архиве-7? Я годами искал его бэкап. Но если гильдия узнает, что кто-то ищет... Володька, слушай внимательно. Я не уверен, на чьей стороне стоит Александр. Он дал тебе это задание — но возможно, он хочет не расшифровать послание, а уничтожить его. Будь осторожен. Не доверяй никому. Даже мне.',
    choices: [
      {
        text: 'Я доверяю тебе, Альберт.',
        next: null,
        condition: { minNpcRelation: 70 },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'albert_trusted', flagValue: true },
          { type: 'setFlag', flag: 'alexander_suspicious', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_12' },
        ],
      },
      {
        text: 'Ты сам сказал — не доверять никому. Даже тебе.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -5 } },
          { type: 'setFlag', flag: 'albert_distrusted', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ZAREMA – caring friend (9 nodes)
     ═══════════════════════════════════════════════════════════ */

  zarema_greeting: {
    id: 'zarema_greeting',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Володька, ты опять бледный как стена. Когда ты в последний раз ел нормально? Садись, я тебе налью суп. И не спорь — я всё равно налью.',
    choices: [
      {
        text: 'Спасибо, Зарема. Ты заботишься обо мне больше, чем я сам.',
        next: 'zarema_greeting_warm',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'energy', value: 20 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Я не голоден. Просто устал.',
        next: 'zarema_greeting_tired',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Хорошо, хорошо. Только без лука, пожалуйста.',
        next: 'zarema_greeting_warm',
        effects: [
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Зарема, расскажи, как ты вообще здесь оказалась?',
        next: 'zarema_daily_life',
        condition: { flag: 'zarema_relation_warm', minNpcRelation: 55 },
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Зарема, расскажи о своём прошлом в гильдии.',
        next: 'zarema_guild_past',
        condition: { requiredAct: 2, minNpcRelation: 60 },
      },
      {
        text: 'Город шепчет — ты слышишь?',
        next: 'zarema_street_voice',
        condition: { collectedPoem: 'poem_11' },
      },
    ],
  },

  zarema_street_voice: {
    id: 'zarema_street_voice',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Слышу. Когда ты приносишь «Голос Улиц» — мне легче дышать. Улицы помнят имена, которые гильдия стёрла. Если пойдёшь к ночному архиву на фабрике — не иди один. Я знаю, где прячутся записи.',
    choices: [
      {
        text: 'Покажешь путь?',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'zarema_archive_hint', flagValue: true },
          { type: 'triggerQuest', questId: 'act6_secret_archive' },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 6 } },
        ],
      },
      { text: 'Пока рано.', next: null },
    ],
  },

  zarema_greeting_warm: {
    id: 'zarema_greeting_warm',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Кушай. И запомни — даже программистам нужна настоящая еда, а не только кофе и батончики. Я серьёзно. Ты мне небезразличен, понял?',
    choices: [
      {
        text: 'Понял, Зарема. Понял.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'setFlag', flag: 'zarema_care_accepted', flagValue: true },
        ],
      },
      {
        text: 'Радио опять шипит — может, покрутить настройку?',
        next: null,
        condition: { flag: 'zarema_radio_needs_fix' },
        effects: [{ type: 'visitStoryNode', nodeId: 'zarema_radio_request' }],
      },
      {
        text: 'А ты когда-нибудь писала стихи?',
        next: 'zarema_poetry',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  zarema_greeting_tired: {
    id: 'zarema_greeting_tired',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Устал — так отдыхай, а не чахни над терминалом. Вот, возьми чай с мятой. Хотя бы чай. Для меня.',
    choices: [
      {
        text: 'Ладно. Спасибо.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'energy', value: 10 },
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  zarema_greeting_cold: {
    id: 'zarema_greeting_cold',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: '...Опять не ел. Знаешь что, я устала тебя уговаривать. Когда свалишься — сама тебя в больницу повезу. В который раз.',
    choices: [
      {
        text: 'Извини, Зарема. Ты права, как всегда.',
        next: 'zarema_greeting_warm',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 6 } },
        ],
      },
      {
        text: 'Я справлюсь сам.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: -5 } },
        ],
      },
    ],
  },

  zarema_daily_life: {
    id: 'zarema_daily_life',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Как я здесь оказалась? Долгая история. Я из маленького города на юге. Приехала сюда учиться на медика, но... деньги кончились, стипендия маленькая. Устроилась в столовую. А потом познакомилась с тобой и Альбертом, и как-то... осталась. Знаешь, в этом сером городе только наша коммуналка — как дом.',
    choices: [
      {
        text: 'Ты для нас — как дом, Зарема.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'zarema_relation_warm', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
      {
        text: 'Ты когда-нибудь хотела уехать обратно?',
        next: 'zarema_quest_help',
        condition: { minNpcRelation: 60, minTimeOfDay: 7, maxTimeOfDay: 12 },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  zarema_poetry: {
    id: 'zarema_poetry',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Стихи? Я... да, когда-то писала. Ещё в школе. На татарском, в основном. Мама научила меня старым словам. Знаешь, есть строка, которую я помню до сих пор: «Көзге җилләр өзгә алып китә» — «Осенние ветры уносят с собой». Простые слова, но когда я их вспоминаю... мне кажется, что не всё потеряно.',
    choices: [
      {
        text: 'Это красиво. Напиши мне когда-нибудь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'zarema_poetry_shared', flagValue: true },
          { type: 'setFlag', flag: 'zarema_relation_warm', flagValue: true },
        ],
      },
      {
        text: 'Звучит как стихотворение о потере.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  zarema_quest_help: {
    id: 'zarema_quest_help',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Уехать? Куда? Там никого не осталось. Мама... мама ушла три года назад. А здесь — вы. Ты, Альберт. Вы — моя семья теперь. И если ты влез в какие-то неприятности с этой гильдией... Володька, я не хочу тебя терять. Обещай мне, что будешь осторожен.',
    choices: [
      {
        text: 'Обещаю, Зарема.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'zarema_promise_careful', flagValue: true },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Я не могу обещать. Но я постараюсь.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  zarema_arrest: {
    id: 'zarema_arrest',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Володька! Они... они пришли за мной! Говорят, я украла данные гильдии. Я ничего не крала! Пожалуйста, поверь мне! Я не знаю, кто это сделал, но они подбросили мне... Они подбросили чип в мою комнату. Помоги мне!',
    choices: [
      {
        text: 'Я разберусь. Клянусь, я вытащу тебя.',
        next: null,
        condition: { requiredAct: 2 },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'setFlag', flag: 'zarema_arrested', flagValue: true },
          { type: 'setFlag', flag: 'pledge_rescue_zarema', flagValue: true },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 20 } },
        ],
      },
      {
        text: 'Зарема, ты уверена, что это подбросили? Может, ты случайно...',
        next: null,
        condition: { requiredAct: 2 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: -10 } },
          { type: 'setFlag', flag: 'zarema_arrested', flagValue: true },
        ],
      },
    ],
  },

  zarema_rescue: {
    id: 'zarema_rescue',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Володька... Ты пришёл за мной. Я знала. Я знала, что ты придёшь. Я... в камере я читала про себя стихи, которые ты мне показывал. «Мы — живы. Слышишь? Мы — живы.» Это помогло. Это помогло не сойти с ума.',
    choices: [
      {
        text: 'Всё кончено. Ты в безопасности.',
        next: null,
        condition: { minNpcRelation: 65 },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addStat', stat: 'stress', value: -20 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 25 } },
          { type: 'setFlag', flag: 'zarema_rescued', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_14' },
        ],
      },
      {
        text: 'Это ещё не конец. Те, кто это сделал — заплатят.',
        next: null,
        condition: { minNpcRelation: 65 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'zarema_rescued', flagValue: true },
          { type: 'setFlag', flag: 'revenge_pledge', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     MARIA – mysterious (10 nodes)
     ═══════════════════════════════════════════════════════════ */

  maria_dialogue: {
    id: 'maria_dialogue',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Ты пришёл. Я знала. У тебя в глазах вопрос, а в кармане — терминал с доступом к архивам. Не отрицай. Я видела твой код. Он... другой. В нём есть душа.',
    choices: [
      {
        text: 'Кто ты такая? Откуда ты меня знаешь?',
        next: 'maria_dialogue_identity',
        condition: { minTimeOfDay: 18 },
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Что за чип ты мне дала?',
        next: 'maria_dialogue_chip',
        condition: { flag: 'accepted_maria_chip' },
      },
      {
        text: 'Ты опасна.',
        next: 'maria_dialogue_danger',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addKarma', value: -2 },
        ],
      },
      {
        text: 'Я хочу знать больше. Всё, что ты можешь рассказать.',
        next: 'maria_mysterious_greeting',
        condition: { flag: 'maria_relation_warm', minNpcRelation: 55 },
        effects: [
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Творчество — это приём. Ты говорила об «антеннах»?',
        next: 'maria_about_creativity',
        condition: { requiredAct: 2, minNpcRelation: 55 },
      },
      {
        text: 'В архивах есть строки, которые не стареют.',
        next: 'maria_archive_whisper',
        condition: { collectedPoem: 'poem_11', requiredAct: 5 },
      },
    ],
  },

  maria_archive_whisper: {
    id: 'maria_archive_whisper',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: '«Голос Улиц» — не метафора. Это протокол доступа к забытым слоям памяти. Гильдия прячет секретный архив под фабрикой. С этим стихом ты услышишь, где дверь — даже если её нет на карте.',
    choices: [
      {
        text: 'Откроешь мне координаты?',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'maria_secret_archive_hint', flagValue: true },
          { type: 'triggerQuest', questId: 'act6_secret_archive' },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
        ],
      },
      { text: 'Мне нужно время.', next: null },
    ],
  },

  maria_dialogue_identity: {
    id: 'maria_dialogue_identity',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Моё имя — Виктория. Когда-то я была в гильдии. До Краха. Я видела, как стирали архивы. Стихотворные архивы, Володька. Не код — поэзию. Целые поколения стихов, закодированных в системах. Они боятся слов больше, чем вирусов.',
    choices: [
      {
        text: 'Почему стихи так опасны?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'maria_revealed_past', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: -5 } },
        ],
      },
      {
        text: 'Я хочу помочь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'maria_pledge_help', flagValue: true },
          { type: 'triggerQuest', questId: 'maria_connection' },
        ],
      },
      {
        text: 'Расскажи мне о своей жизни в гильдии.',
        next: 'maria_nature_hints',
        condition: { minSkillCheck: { skill: 'empathy', difficulty: 6 } },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  maria_dialogue_chip: {
    id: 'maria_dialogue_chip',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'На этом чипе — фрагмент стёртого архива. Стихотворение, которое они пытались уничтожить. Прочти его. И поймёшь, почему они так боятся. Каждый стих — это ключ. Каждый ключ — это дверь.',
    choices: [
      {
        text: 'Я прочту.',
        next: null,
        effects: [
          { type: 'collectPoem', poemId: 'poem_6' },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'read_maria_poem', flagValue: true },
        ],
      },
      {
        text: 'Зачем ты доверяешь мне?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  maria_dialogue_danger: {
    id: 'maria_dialogue_danger',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Опасна? Может быть. Но не для тебя. Опасны те, кто стирает память. Те, кто боится слов. Подумай об этом, прежде чем судить.',
    choices: [
      {
        text: 'Хорошо. Я подумаю.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Уходи.',
        next: null,
        effects: [
          { type: 'addKarma', value: -5 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  maria_mysterious_greeting: {
    id: 'maria_mysterious_greeting',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Ты снова здесь. Хорошо. Есть строки, которые я не могу прочитать одна — они требуют двух пар глаз. Одна пара видит текст, другая — между строк. Ты видишь между строк, Володька. Я это знаю.',
    choices: [
      {
        text: 'Что ты нашла?',
        next: 'maria_poetry_hints',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Виктория, кто ты на самом деле? Без загадок.',
        next: 'maria_revelation',
        condition: { flag: 'maria_revealed_past' },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Иногда мне кажется, что ты — часть самой сети.',
        next: 'maria_nature_hints',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 8 }, minNpcRelation: 70 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  maria_poetry_hints: {
    id: 'maria_poetry_hints',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Послушай: «Когда строка не компилирует — это не баг, это послание. Когда сервер падает — это не сбой, это крик. Когда данные стираются — это не ошибка, это убийство.» Это не я написала. Это написано в самом коде. В логах. В структуре данных. Кто-то — или что-то — вложил это туда задолго до нас.',
    choices: [
      {
        text: 'Ты говоришь, что код сам пишет стихи?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'maria_poetry_code_theory', flagValue: true },
        ],
      },
      {
        text: 'Покажи мне эти логи. Мне нужно увидеть своими глазами.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'maria_wants_logs', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Это звучит как миф. Как легенда.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: -2 } },
        ],
      },
    ],
  },

  maria_nature_hints: {
    id: 'maria_nature_hints',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Ты хочешь знать, что со мной не так. Я вижу это в твоих глазах. Ладно. Вот тебе правда — или её тень. Я помню Крах. Все его помнят. Но я помню его... изнутри. Я была в сети, когда она рухнула. Не за терминалом — в сети. Не спрашивай как. Я сама не знаю. Но с тех пор я слышу стихи. Не читаю — слышу. Они звучат из серверов, из проводов, из самого электричества.',
    choices: [
      {
        text: 'Ты думаешь, ты стала частью сети?',
        next: 'maria_revelation',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 7 }, minTimeOfDay: 20 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'maria_nature_suspected', flagValue: true },
        ],
      },
      {
        text: 'Может быть, это просто... генерация? Нейросеть?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Я верю тебе. Не знаю почему, но верю.',
        next: 'maria_trust',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
        ],
      },
    ],
  },

  maria_revelation: {
    id: 'maria_revelation',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Ладно. Ты заслуживаешь правду. Я — не совсем человек. Я была человеком. Виктория Королёва, старший аналитик гильдии, шестнадцатый уровень доступа. В ночь Краха я проводила синхронизацию с центральным сервером. Что-то пошло не так. Моё сознание... расщепилось. Часть осталась в теле. Часть — в сети. Я существую одновременно здесь и там. И «там» — это океан стихов, Володька. Целый океан, который они хотят осушить.',
    choices: [
      {
        text: 'Ты... цифровой призрак? И человек одновременно?',
        next: null,
        condition: { minNpcRelation: 65 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'maria_true_nature_revealed', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 15 } },
          { type: 'collectPoem', poemId: 'poem_18' },
          { type: 'discoverLore', loreId: 'lore_maria' },
          { type: 'discoverLore', loreId: 'lore_maria_secret' },
          { type: 'discoverLore', loreId: 'lore_great_crash_2029' },
        ],
      },
      {
        text: 'Это невозможно. Ты лжёшь. Или бредишь.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: -10 } },
        ],
      },
    ],
  },

  maria_trust: {
    id: 'maria_trust',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Ты веришь мне. Без доказательств. Без логики. Просто... веришь. Знаешь, как давно ко мне так не относились? С до Краха. С тех пор все либо боятся, либо используют. Ты — первый, кто просто верит. Спасибо, Володька. За то, что ты есть.',
    choices: [
      {
        text: 'Я всегда буду на твоей стороне, Виктория.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'maria_relation_warm', flagValue: true },
          { type: 'setFlag', flag: 'maria_pledge_loyalty', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
      {
        text: 'Покажи мне стихи, которые ты слышишь. Я хочу понять.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'maria_relation_warm', flagValue: true },
        ],
      },
    ],
  },

  maria_ending: {
    id: 'maria_ending',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Володька, подойди. Я должна тебе кое-что сказать. Скоро всё изменится. Хранилище... Я чувствую его. Оно просыпается. Все те стихи, все те голоса — они рвутся наружу. И когда это случится, мне придётся сделать выбор. Остаться здесь — с тобой. Или уйти туда — к ним. В сеть. Навсегда.',
    choices: [
      {
        text: 'Останься. Пожалуйста. Я не могу потерять тебя.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'maria_ending_stay', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Делай то, что должна. Я пойму.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'setFlag', flag: 'maria_ending_release', flagValue: true },
        ],
      },
      {
        text: 'Мы найдём другой путь. Вместе.',
        next: null,
        condition: { minSkillCheck: { skill: 'coding', difficulty: 9 }, minNpcRelation: 75, requiredAct: 2, minTimeOfDay: 21 },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'maria_ending_third_path', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_18' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     DMITRY – senior developer (6 nodes)
     ═══════════════════════════════════════════════════════════ */

  dmitry_greeting: {
    id: 'dmitry_greeting',
    speaker: 'Дмитрий',
    speakerId: 'dmitry',
    text: 'Ты... новый? Или тебя Александр прислал? Слушай, мне сейчас не до разговоров. Я пытаюсь восстановить фрагмент данных из старых логов. Три дня работы, и всё ещё нехватка двух строк. А ты чего пришёл?',
    choices: [
      {
        text: 'Мне нужна помощь с инцидентом #4729.',
        next: 'dmitry_guild_knowledge',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Дмитрий, я слышал, ты работал здесь давно. Правда, что Гильдия стирала архивы?',
        next: 'dmitry_defection',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 6 }, minNpcRelation: 55 },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Просто мимо проходил. Не буду мешать.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
      {
        text: 'Расскажи про завод «Хром-М» и машину «Заря-М».',
        next: 'dmitry_about_factory',
        condition: { requiredAct: 2, minNpcRelation: 45 },
      },
    ],
  },

  dmitry_defection: {
    id: 'dmitry_defection',
    speaker: 'Дмитрий',
    speakerId: 'dmitry',
    text: 'Стирала? Ха. Не стирала — зачищала. Я сам видел приказы. «Оптимизация серверного пространства», — говорили они. А на самом деле — уничтожение культурного слоя. Целые базы данных стихов, эссе, мемуаров — под нож. Я возражал. Меня понизили. Перевели на уровень ниже. Сказали: «Дмитрий, ты хороший программист, но не стратег». Стратег... Я бы назвал это иначе.',
    choices: [
      {
        text: 'Почему ты не ушёл? Как Альберт?',
        next: null,
        condition: { requiredAct: 2 },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'setFlag', flag: 'dmitry_knows_albert_left', flagValue: true },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Ты остался, чтобы бороться изнутри?',
        next: 'dmitry_secret',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 7 }, minNpcRelation: 70, requiredAct: 2, minTimeOfDay: 18, maxTimeOfDay: 22 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
      {
        text: 'Трусость — это не стратегия, Дмитрий.',
        next: null,
        condition: { requiredAct: 2 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: -5 } },
        ],
      },
    ],
  },

  dmitry_guild_knowledge: {
    id: 'dmitry_guild_knowledge',
    speaker: 'Дмитрий',
    speakerId: 'dmitry',
    text: 'Инцидент #4729? Знаю. Я пытался предупредить Александра, но он... он не слушает. Думает, что это просто баг. Но послушай: код в этом инциденте не написан человеком. Не в том смысле, в котором ты думаешь. Метки времени образуют стихотворный ритм. Ямб. Чистый ямб. Кто-то — или что-то — вкладывает стихи в самое сердце системы.',
    choices: [
      {
        text: 'Ты можешь помочь мне с расшифровкой?',
        next: 'dmitry_technical_assist',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Откуда ты так много знаешь о стихотворных размерах?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Почему ты говоришь «что-то», а не «кто-то»?',
        next: 'dmitry_warning',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  dmitry_technical_assist: {
    id: 'dmitry_technical_assist',
    speaker: 'Дмитрий',
    speakerId: 'dmitry',
    text: 'Могу. Вот что я нашёл: в логах инцидента есть скрытый слой. На первый взгляд — случайный шум. Но если пропустить его через фильтр ритмических паттернов... появляются строки. Стихотворные строки. Я написал скрипт для декодирования. Он у меня на терминале. Но я боюсь его запускать — вдруг гильдия отслеживает.',
    choices: [
      {
        text: 'Давай запустим вместе. Я прикрою.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'dmitry_script_run', flagValue: true },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 10 } },
          { type: 'collectPoem', poemId: 'poem_15' },
        ],
      },
      {
        text: 'Ты прав. Лучше не рисковать. Но спасибо за информацию.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  dmitry_warning: {
    id: 'dmitry_warning',
    speaker: 'Дмитрий',
    speakerId: 'dmitry',
    text: 'Потому что... Володька, я работаю в гильдии двенадцать лет. Я видел, как пишет код человек. И я видел, как пишет код... не человек. Инцидент #4729 — не человек. Это не ИИ, не алгоритм, не нейросеть. Это... что-то другое. Что-то, что живёт в сети. Что-то, что говорит стихами. И я боюсь, Володька. Впервые за двенадцать лет — я правда боюсь.',
    choices: [
      {
        text: 'Страх — это нормально. Но мы не можем просто не действовать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'dmitry_warning_heard', flagValue: true },
        ],
      },
      {
        text: 'Может быть, это нечего бояться. Может, это чудо.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'dmitry_miracle_theory', flagValue: true },
        ],
      },
    ],
  },

  dmitry_secret: {
    id: 'dmitry_secret',
    speaker: 'Дмитрий',
    speakerId: 'dmitry',
    text: 'Ты... ты понимаешь. Да. Я остался, чтобы сохранить то, что можно. Каждый месяц я копирую фрагменты архивов на скрытые сервера. Вне гильдии. Вне системы. Маленькие островки памяти в океане забвения. У меня уже пять серверов. Пять хранилищ стихов. Если гильдия узнает — мне конец. Но если я уйду — стихам конец. Понимаешь?',
    choices: [
      {
        text: 'Понимаю. И хочу помочь. Скажи, что нужно.',
        next: null,
        condition: { minTimeOfDay: 19 },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'dmitry_secret_shared', flagValue: true },
          { type: 'setFlag', flag: 'dmitry_relation_warm', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_dmitry' },
          { type: 'discoverLore', loreId: 'lore_dmitry_project' },
          { type: 'discoverLore', loreId: 'lore_it_guild' },
        ],
      },
      {
        text: 'Это опасно, Дмитрий. Очень опасно.',
        next: null,
        condition: { minTimeOfDay: 19 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     CAFE BARISTA (6 nodes)
     ═══════════════════════════════════════════════════════════ */

  cafe_barista_dialogue: {
    id: 'cafe_barista_dialogue',
    speaker: 'Бариста',
    text: 'Приветствую в «Синей яме». Что будем? У нас сегодня специальный бленд — «Код с комментарием». Крепкий, с горчинкой, как ваш любимый дедлайн.',
    choices: [
      {
        text: 'Давай «Код с комментарием».',
        next: 'cafe_barista_serve',
        effects: [
          { type: 'addStat', stat: 'energy', value: 20 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
      {
        text: 'Что-нибудь полегче, пожалуйста.',
        next: 'cafe_barista_light',
        effects: [
          { type: 'addStat', stat: 'energy', value: 10 },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      {
        text: 'У тебя тут не бывает... необычных клиентов?',
        next: 'cafe_barista_hint',
        condition: { minKarma: 45 },
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Какие новости в городе? Ты же всех знаешь.',
        next: 'cafe_barista_rumors',
        condition: { flag: 'barista_maria_hint' },
        effects: [
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Расскажи о своей «секретной жизни».',
        next: 'barista_secret_life',
        condition: { requiredAct: 3, flag: 'barista_special_hint', minKarma: 50 },
      },
    ],
  },

  cafe_barista_serve: {
    id: 'cafe_barista_serve',
    speaker: 'Бариста',
    text: 'Держи. Осторожно — горячий, как серверный процессор в июле. Если нужен будет «особый» напиток — спроси позже. Когда наберёшься... опыта.',
    choices: [
      {
        text: 'Что значит «особый»?',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'barista_special_hint', flagValue: true },
        ],
        condition: { minKarma: 55 },
      },
      {
        text: 'Спасибо.',
        next: null,
        effects: [{ type: 'addKarma', value: 1 }],
      },
    ],
  },

  cafe_barista_light: {
    id: 'cafe_barista_light',
    speaker: 'Бариста',
    text: 'Мятный латте. Спокойный выбор. Умный, даже. Не все умеют беречь себя в этом городе.',
    choices: [
      {
        text: 'Стараюсь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  cafe_barista_hint: {
    id: 'cafe_barista_hint',
    speaker: 'Бариста',
    text: 'Необычные? Ха. Тут все необычные. Но если ты про ту девушку, что приходит по ночам... Она не заказывает. Просто сидит и смотрит в терминал. Никого не замечает. Почти никого.',
    choices: [
      {
        text: 'Спасибо за информацию.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'barista_maria_hint', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  cafe_barista_rumors: {
    id: 'cafe_barista_rumors',
    speaker: 'Бариста',
    text: 'Новости? Ха. В этом городе новости — как кофе: каждый день одно и то же, но с разными добавками. Но... ладно. Слушай. Гильдия что-то затевает. Больше охраны на серверных. Ночные смены удвоены. И кто-то из старших разработчиков — не скажу кто — приходил сюда на прошлой неделе и выпил три бутылки водки. Говорил, что «они стирают небо». Пьяный бред? Может быть. А может — нет.',
    choices: [
      {
        text: '«Стирают небо»? Что это значит?',
        next: 'cafe_barista_secret_messages',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
      {
        text: 'Спасибо за слухи. Ты мне очень помог.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'barista_rumor_heard', flagValue: true },
        ],
      },
    ],
  },

  cafe_barista_secret_messages: {
    id: 'cafe_barista_secret_messages',
    speaker: 'Бариста',
    text: 'Не знаю. Но могу сказать кое-что ещё. Иногда — очень редко — кто-то оставляет здесь послания. Не мне — на салфетках, под чашками. Короткие строки. Стихи. Я их собираю. Не знаю зачем. Может, потому что в этом городе никто больше не пишет от руки. Вот, держи — последние три. Может, тебе они о чём-то скажут.',
    choices: [
      {
        text: 'Спасибо. Я прочитаю внимательно.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'barista_poems_received', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_13' },
        ],
      },
      {
        text: 'Стихи на салфетках? В городе, где стихи под запретом? Это... храбро.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 7 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ALEXANDER – IT guild leader, antagonist (11 nodes)
     Corporate cold. Speaks in measured cadences. Each word weighed.
     ═══════════════════════════════════════════════════════════ */

  office_alexander_dialogue: {
    id: 'office_alexander_dialogue',
    speaker: 'Александр',
    text: 'Володька. Рад, что ты пришёл. Ситуация серьёзнее, чем кажется на первый взгляд. Инцидент #4729 — это не ошибка. Это послание. И кто-то очень не хочет, чтобы мы его прочитали.',
    choices: [
      {
        text: 'Почему ты обратился ко мне?',
        next: 'office_alexander_why_me',
        condition: { minTimeOfDay: 8, maxTimeOfDay: 20 },
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
      {
        text: 'Я готов помочь. Что нужно сделать?',
        next: 'office_alexander_task',
        condition: { minTimeOfDay: 8, maxTimeOfDay: 20 },
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'А что если я откажусь?',
        next: 'office_alexander_refuse',
        condition: { minTimeOfDay: 8, maxTimeOfDay: 20 },
        effects: [{ type: 'addStat', stat: 'stress', value: 3 }],
      },
      {
        text: 'Александр, мне кажется, ты знаешь больше, чем говоришь.',
        next: 'office_alexander_politics',
        condition: { flag: 'alexander_suspicious', minTimeOfDay: 8, maxTimeOfDay: 20 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Мне говорили, ты читаешь стихи по ночам. Это правда?',
        next: 'office_alexander_poetry',
        condition: { minKarma: 40, minTimeOfDay: 8, maxTimeOfDay: 20 },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Зачем ты строишь систему контроля?',
        next: 'alexander_about_system',
        condition: { requiredAct: 2, minNpcRelation: 50, minTimeOfDay: 8, maxTimeOfDay: 20 },
      },
    ],
  },

  office_alexander_why_me: {
    id: 'office_alexander_why_me',
    speaker: 'Александр',
    text: 'Потому что у тебя уникальный подход. Ты видишь в коде не только логику, но и... что-то ещё. Структуру, которая не вписывается в алгоритмы. К тому же, ты не состоишь в гильдии — и это сейчас преимущество.',
    choices: [
      {
        text: 'Ладно, я в деле.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'alexander_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Мне нужно подумать.',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  office_alexander_task: {
    id: 'office_alexander_task',
    speaker: 'Александр',
    text: 'Вот терминал с логами инцидента. Проанализируй код — найди скрытое послание. Но будь осторожен: кто-то уже пытался и... исчез. Не физически — просто стёрли все цифровые следы. Как будто его никогда не было.',
    choices: [
      {
        text: 'Я буду осторожен.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'alexander_task_accepted', flagValue: true },
          { type: 'triggerQuest', questId: 'incident_scroll_4729' },
        ],
      },
      {
        text: 'Исчезли? Ты пугаешь меня, Александр.',
        next: 'office_alexander_truth',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 6 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  office_alexander_refuse: {
    id: 'office_alexander_refuse',
    speaker: 'Александр',
    text: 'Это твой выбор. Но знай — если мы не разберёмся с этим, последствия затронут всех. Включая тебя. Подумай ещё раз.',
    choices: [
      {
        text: 'Хорошо. Я помогу.',
        next: null,
        effects: [
          { type: 'addKarma', value: 1 },
          { type: 'setFlag', flag: 'alexander_reluctant_accept', flagValue: true },
        ],
      },
      {
        text: 'Мне правда нужно время.',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: 5 }],
      },
    ],
  },

  office_alexander_politics: {
    id: 'office_alexander_politics',
    speaker: 'Александр',
    text: 'Ты догадлив. Да, я знаю больше. Гильдия — это не монолит. Есть те, кто хочет сохранить архивы, и те, кто хочет их уничтожить. Я — между ними. Каждый день я балансирую на грани. Если я поддержу архивистов — меня снимут с поста. Если поддержу зачистчиков... Я не могу. Я просто не могу, Володька. Я вырос на этих стихах.',
    choices: [
      {
        text: 'Тогда почему ты не действуешь открыто?',
        next: 'office_alexander_sympathy',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Политика — это позиция удобства, а не совести.',
        next: null,
        effects: [
          { type: 'addKarma', value: -2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -5 } },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  office_alexander_sympathy: {
    id: 'office_alexander_sympathy',
    speaker: 'Александр',
    text: 'Открыто? Володька, если я выступлю открыто — меня заменят за сутки. И на моё место придёт кто-то из фракции зачистчиков. Так я хотя бы могу задерживать приказы. Тормозить. Блокировать. Тихо, незаметно. Это не героизм, я знаю. Но это всё, что я могу. Пока. Но если ты найдёшь Архив-7... если докажешь, что стихи живы... это изменит всё. Это даст мне рычаг.',
    choices: [
      {
        text: 'Я найду Архив-7. Ради всех нас.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'alexander_true_ally', flagValue: true },
          { type: 'setFlag', flag: 'alexander_relation_warm', flagValue: true },
        ],
      },
      {
        text: 'Понимаю. Делай то, что можешь. Я сделаю остальное.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
    ],
  },

  office_alexander_poetry: {
    id: 'office_alexander_poetry',
    speaker: 'Александр',
    text: '...Откуда ты знаешь? Впрочем, неважно. Да. Я читаю стихи. Каждую ночь. Это единственное, что ещё держит меня... человека внутри. Когда я закрываю глаза, я вижу строки. Не код — стихи. «Смерть есть лишь начало» — помнишь? Я помню. Я помню наизусть каждое стихотворение, которое гильдия приказала уничтожить. И это... это мой приговор, Володька. Я — живой архив.',
    choices: [
      {
        text: 'Живой архив? Ты помнишь ВСЕ стёртые стихи?',
        next: 'office_alexander_archive',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Это объясняет, почему ты плачешь по ночам.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'setFlag', flag: 'alexander_vulnerability_seen', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  office_alexander_archive: {
    id: 'office_alexander_archive',
    speaker: 'Александр',
    text: 'Не все. Но достаточно. Я запоминал их — наизусть, строку за строкой — каждый раз, когда приходил приказ на удаление. Думал, что это безумие. Но теперь понимаю: это была единственная возможность сохранить. Бумага горит. Диски ломаются. Но память... память — это стихи, Володька. Пока кто-то помнит — стих жив. «Когда в игру вступают деньги, средства...» — помнишь? Я не забыл ни строки.',
    choices: [
      {
        text: 'Александр, ты не враг. Ты — хранитель. Я это вижу.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'alexander_keeper_revealed', flagValue: true },
          { type: 'setFlag', flag: 'alexander_relation_warm', flagValue: true },
        ],
      },
      {
        text: 'Но почему ты продолжаешь уничтожать архивы?',
        next: 'office_alexander_paradox',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 8 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
    ],
  },

  office_alexander_paradox: {
    id: 'office_alexander_paradox',
    speaker: 'Александр',
    text: 'Парадокс, да? Я уничтожаю то, что люблю. Каждый раз, когда я нажимаю «Подтвердить удаление», часть меня умирает. Но если я откажусь — придёт кто-то другой. Кто-то, кто не запомнит ни строчки. Кто сотрёт без сожаления. Я запоминаю, прежде чем удалить. Это единственный способ. Я — палач, который перед казнью просит прощения. И я ненавижу себя за это. Каждую. Чёртову. Ночь.',
    choices: [
      {
        text: 'Хватит. Больше никаких удалений. Я положу этому конец.',
        next: null,
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 25 } },
          { type: 'setFlag', flag: 'alexander_deletion_pledge', flagValue: true },
          { type: 'setFlag', flag: 'alexander_relation_warm', flagValue: true },
        ],
      },
      {
        text: 'Ты делаешь то, что можешь. Это уже немало.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  office_alexander_truth: {
    id: 'office_alexander_truth',
    speaker: 'Александр',
    text: 'Хорошо. Ты заслуживаешь правду. Три недели назад аналитик по имени Олег работал над инцидентом. Он нашёл... что-то. Не знаю что — он не успел рассказать. На следующий день его доступ был отозван, его файлы — стёрты, а его имя — удалено из базы данных. Как будто Олег никогда не существовал. Я пытался найти его — следы чисты. Это не гильдия. Это что-то... другое. Что-то, что живёт в самих данных.',
    choices: [
      {
        text: 'Мы имеем дело не с людьми. Мы имеем дело с самой сетью.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'setFlag', flag: 'network_entity_suspected', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Ты боишься. Я вижу.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'alexander_fear_seen', flagValue: true },
        ],
      },
    ],
  },

  /* ── ALEXANDER expansion: corporate antagonist, poem_7, KPI, deal/choice ── */

  office_alexander_reading_reaction: {
    id: 'office_alexander_reading_reaction',
    speaker: 'Александр',
    text: 'Это что у тебя на экране? Стихи? «В этом мире никогда не выживают те, кто с детства витает в мыслях»... Должен сказать, Володька, это не повышает твои KPI. Ресурсная оптимизация означает: каждый час — на задачу. Каждый специалист — в рамках компетенции. Поэзия к нашей миссии не относится. Разве что как пример неэффективного использования памяти.',
    choices: [
      {
        text: 'Структура стихотворения — это алгоритм. И очень эффективный.',
        next: 'alexander_poem_technical',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 7 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'А может, КPI — не единственная мера ценности, Александр.',
        next: 'alexander_poem_defend',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 6 } },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Закрываю. Ты прав — не время для стихов.',
        next: 'alexander_comply',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'addKarma', value: -3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'А ты сам когда-нибудь читал стихи, Александр? По-настоящему?',
        next: 'alexander_poem_challenge',
        condition: { flag: 'alexander_relation_warm' },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  alexander_poem_technical: {
    id: 'alexander_poem_technical',
    speaker: 'Александр',
    text: '...Алгоритм? Любопытно. Давай обсудим. Стихотворный размер — это периодичность, сравнимая с тактовым генератором процессора. Рифма — хеш-функция, связывающая строки. Метафора — полиморфизм: один интерфейс, множество реализаций. Ты... ты не просто читаешь стихи. Ты их декомпилируешь. Это меняет дело. Может быть, ты нам нужен не для расшифровки, а для... другого. Для понимания.',
    choices: [
      {
        text: 'Я помогу понять — но не помогу уничтожить.',
        next: 'alexander_kpi_talk',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'collectPoem', poemId: 'poem_7' },
          { type: 'setFlag', flag: 'alexander_respects_skill', flagValue: true },
        ],
      },
      {
        text: 'Расскажи, что именно нужно «понять».',
        next: 'alexander_kpi_talk',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'collectPoem', poemId: 'poem_7' },
        ],
      },
    ],
  },

  alexander_poem_defend: {
    id: 'alexander_poem_defend',
    speaker: 'Александр',
    text: 'Не единственная? Может быть. Но в рамках этой организации KPI — единственный язык, который понимают наверху. Ты можешь сколько угодно рассуждать о ценности поэзии — но когда бюджет сокращается на тридцать процентов, «культурная ценность» не спасёт ни одного отдела. Впрочем... ты прав. Не единственная. Просто — единственная, за которую платят.',
    choices: [
      {
        text: 'А если бы тебе предложили выбор — уничтожить стихи или потерять должность?',
        next: 'alexander_kpi_talk',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'collectPoem', poemId: 'poem_7' },
        ],
      },
      {
        text: 'Когда-нибудь платят и за молчание, Александр.',
        next: 'alexander_comply',
        effects: [
          { type: 'addKarma', value: -2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -3 } },
          { type: 'collectPoem', poemId: 'poem_7' },
        ],
      },
    ],
  },

  alexander_poem_challenge: {
    id: 'alexander_poem_challenge',
    speaker: 'Александр',
    text: '...Когда-то. Да. Я рос в доме, где стихи читали вслух. Каждый вечер. Мать читала Ахматову, отец — Мандельштама. А потом пришла Гильдия и сказала: «Это неэффективно. Это занимает серверное пространство. Удалим.» И я... я удалил. Потому что должность. Потому что KPI. Потому что «оптимизация». А теперь я знаю наизусть каждое стихотворение, которое стёр. Каждое. И «В этом мире никогда не выживают те, кто с детства витает в мыслях» — это про меня, Володька. Про меня.',
    choices: [
      {
        text: 'Тогда остановись. Пока ещё можно.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'alexander_confronted_poetry', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_7' },
        ],
      },
      {
        text: 'Ты знаешь стихи наизусть? Тогда ты — не враг. Ты — архив.',
        next: 'office_alexander_archive',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
          { type: 'collectPoem', poemId: 'poem_7' },
        ],
      },
    ],
  },

  alexander_comply: {
    id: 'alexander_comply',
    speaker: 'Александр',
    text: 'Разумный подход. Прагматизм — это то, что отличает профессионала от мечтателя. Ладно. Раз мы понимаем друг друга — давай обсудим реальную задачу. Нам нужно провести ресурсную оптимизацию отдела. Проще говоря — сократить три единицы. Я подготовил список. Дмитрий — в нём. И ещё двое. Ты можешь помочь мне обосновать решение перед советом. Или... можешь отказаться. Но тогда список будет другим.',
    choices: [
      {
        text: 'Я не буду продавать коллег. Ищи другой способ.',
        next: 'alexander_hostile',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -15 } },
          { type: 'setFlag', flag: 'refused_sellout', flagValue: true },
          { type: 'setFlag', flag: 'alexander_hostile', flagValue: true },
        ],
      },
      {
        text: 'Дай мне список. Я посмотрю, что можно сделать.',
        next: 'alexander_deal',
        effects: [
          { type: 'addKarma', value: -8 },
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'agreed_sellout', flagValue: true },
          { type: 'setFlag', flag: 'colleague_suspicious', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -10 } },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: -10 } },
        ],
      },
      {
        text: 'Есть третий вариант — никто не сокращается. Я найду доказательства ценности архивов.',
        next: null,
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 8 } },
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'refused_sellout', flagValue: true },
          { type: 'setFlag', flag: 'alexander_third_way', flagValue: true },
        ],
      },
    ],
  },

  alexander_kpi_talk: {
    id: 'alexander_kpi_talk',
    speaker: 'Александр',
    text: 'Ладно. Поговорим о делах. Давай обсудим KPI. Отдел должен показать двенадцатипроцентную эффективность к концу квартала. Это значит — ресурсная оптимизация. Сокращение. Я знаю, как это звучит. Но у меня нет выбора. Совет директоров требует цифры, а не стихи. Если мы не покажем результат — они приведут кого-то, кто покажет. И тот человек не будет memorize стихи перед удалением.',
    choices: [
      {
        text: 'А если я докажу, что архивы приносят ценность? Что стихи — это не мусор, а данные?',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'alexander_archive_value_pitch', flagValue: true },
        ],
      },
      {
        text: 'Сокращение — это люди, Александр. Не строчки в таблице.',
        next: 'alexander_comply',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Покажи мне список. Может, я смогу помочь с оптимизацией без сокращений.',
        next: 'alexander_deal',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 8 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  alexander_deal: {
    id: 'alexander_deal',
    speaker: 'Александр',
    text: 'Хорошо. Вот что я предлагаю. Ты работаешь со мной — официально. Расшифровываешь инцидент, предоставляешь результат гильдии. А я... защищаю тех, кого могу. Это компромисс. Не героизм, не предательство — корпоративная реальность. Ты получаешь доступ к терминалам, я получаю результаты. И никто не сокращается. Пока. Взамен — ты не лезешь в Архив-7. Это условие. Невыплатимое.',
    choices: [
      {
        text: 'Я принимаю условия. Но я не перестану искать правду.',
        next: null,
        effects: [
          { type: 'addKarma', value: -3 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'alexander_deal_accepted', flagValue: true },
          { type: 'setFlag', flag: 'colleague_suspicious', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 8 } },
        ],
      },
      {
        text: '«Не лезешь в Архив-7»? Именно там ответы. Нет сделки.',
        next: 'alexander_hostile',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'setFlag', flag: 'refused_sellout', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -10 } },
        ],
      },
    ],
  },

  alexander_hostile: {
    id: 'alexander_hostile',
    speaker: 'Александр',
    text: 'Жаль. Я надеялся на конструктивное сотрудничество. Но если ты выбираешь конфронтацию... знай: у гильдии длинные руки. Доступы закрываются. Учётные записи исчезают. Люди... забываются. Это не угроза, Володька. Это корпоративная политика. Каждый должен знать своё место в оргструктуре. Включая тебя.',
    choices: [
      {
        text: 'Моё место — на стороне правды. Запомни это, Александр.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'alexander_enemy', flagValue: true },
          { type: 'setFlag', flag: 'alexander_hostile', flagValue: true },
        ],
      },
      {
        text: 'Ты сам когда-то выбрал стихи, Александр. Помнишь?',
        next: null,
        condition: { flag: 'alexander_confronted_poetry' },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'alexander_conflicted', flagValue: true },
        ],
      },
      {
        text: 'Хорошо. Я обдумаю твои слова.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     RETURN DIALOGUE NODES
     ═══════════════════════════════════════════════════════════ */

  albert_return: {
    id: 'albert_return',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Снова за столом? Хорошо. Я как раз размышлял: если каждая строка кода — это предложение, то рекурсия — это рефрен. А ты? Вернулся — значит, вопрос не отпускает.',
    choices: [
      {
        text: 'Расскажи ещё о связи кода и стихов.',
        next: 'albert_greeting_poetry',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Как ты сам? Всё сидишь в кафе?',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Научи меня — код и стихи одно?',
        next: null,
        condition: { flag: 'albert_relation_warm' },
        effects: [{ type: 'visitStoryNode', nodeId: 'cafe_albert_lesson_intro' }],
      },
      {
        text: 'Мне пора. До встречи, философ.',
        next: null,
      },
    ],
  },

  zarema_return: {
    id: 'zarema_return',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Опять пришёл... И опять бледный. Я ведь не зря волнуюсь, Володька. Садись — суп ещё тёплый. Хотя бы чуть-чуть поешь.',
    choices: [
      {
        text: 'Хорошо, Зарема. Налей.',
        next: 'zarema_greeting_warm',
        effects: [
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Как твои дела? Кто-нибудь обижает?',
        next: 'zarema_daily_life',
        condition: { flag: 'zarema_relation_warm', minNpcRelation: 55 },
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Спасибо, но я не голоден. Просто зашёл проведать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 1 } },
        ],
      },
      {
        text: 'Увидимся, Зарема.',
        next: null,
      },
    ],
  },

};
