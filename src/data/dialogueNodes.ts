/* ─── Volodka RPG – dialogue nodes (deep trees, 98 + expanded 16 nodes) ─── */

import type { DialogueNode } from '@/shared/types/game';
import { EXPANDED_DIALOGUE_NODES } from './expandedDialogueNodes';
import { CHK_DIALOGUE_NODES } from './chkTolpa/dialogues';

export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     ALBERT — philosopher at the cafe (9 nodes)
     ═══════════════════════════════════════════════════════════ */

  albert_greeting: {
    id: 'albert_greeting',
    speaker: 'Альберт',
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
    ],
  },

  albert_greeting_poetry: {
    id: 'albert_greeting_poetry',
    speaker: 'Альберт',
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
    ],
  },

  zarema_greeting_warm: {
    id: 'zarema_greeting_warm',
    speaker: 'Зарема',
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
    ],
  },

  maria_dialogue_identity: {
    id: 'maria_dialogue_identity',
    speaker: 'Виктория',
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
     COLLEAGUE – nervous office worker (7 nodes)
     Anxious, stammers. Always looking over shoulder.
     ═══════════════════════════════════════════════════════════ */

  office_colleague_dialogue: {
    id: 'office_colleague_dialogue',
    speaker: 'Коллега',
    text: 'Псс. Ты новый? Или... тебя Александр прислал? Слушай, я тут случайно наткнулся на кое-что в логах. Странные совпадения. Но я не уверен, что стоит кому-то рассказывать...',
    choices: [
      {
        text: 'Расскажи мне. Я умею держать язык за зубами.',
        next: 'office_colleague_share',
        condition: {
          minSkillCheck: { skill: 'persuasion', difficulty: 6 },
        },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Если это связано с инцидентом — мне нужно знать.',
        next: 'office_colleague_share',
        effects: [{ type: 'addKarma', value: 2 }],
      },
      {
        text: 'Делай как знаешь. Мне это неинтересно.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -3 } },
        ],
      },
      {
        text: 'Что ещё ты слышал? Сплетни тоже пригодятся.',
        next: 'colleague_gossip',
        condition: { flag: 'colleague_shared_poetry_code' },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Ты выглядишь напуганным. Кто тебя так пугает?',
        next: 'office_colleague_fear',
        condition: { minKarma: 30 },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Ты знаешь что-то про арест Заремы?',
        next: 'colleague_moral_conflict',
        condition: { requiredAct: 3, flag: 'zarema_arrested' },
      },
    ],
  },

  office_colleague_share: {
    id: 'office_colleague_share',
    speaker: 'Коллега',
    text: 'Ладно... Только тихо. Видишь эти метки времени в логах? Они образуют последовательность. Не случайную — это стихотворные размеры. Ямб, хорей, амфибрахий. Кто-то зашифровал стихи в самом коде. И это... это не вирус. Это послание.',
    choices: [
      {
        text: 'Стихи в коде? Кто мог такое сделать?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'colleague_shared_poetry_code', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Это может быть ловушкой.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'colleague_warning_trap', flagValue: true },
        ],
      },
    ],
  },

  colleague_gossip: {
    id: 'colleague_gossip',
    speaker: 'Коллега',
    text: 'Сплетни? О, у меня их полно. Слушай: Дмитрий — он не просто старший разраб. Говорят, у него есть доступ к архивам, которых официально не существует. И ещё: Александр получает странные письма. Каждую ночь. Без отправителя. Только строки кода. Он их читает и... плачет. Я видел. Не спрашивай откуда.',
    choices: [
      {
        text: 'Александр плачет? Это... неожиданно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'alexander_crying_known', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Дмитрий и скрытые архивы? Мне нужно узнать больше.',
        next: 'colleague_reluctant_help',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  colleague_reluctant_help: {
    id: 'colleague_reluctant_help',
    speaker: 'Коллега',
    text: 'Не проси меня лезть в это! Я и так уже слишком много рассказал. Но... ладно. Вот что: терминал Дмитрия в северо-западном углу. Если он уйдёт на перерыв — между 14:00 и 14:20 — у тебя будет двадцать минут. Пароль — первые строчки «Евгения Онегина». Буквально. Он использует строки Пушкина как пароли. Только... если тебя поймают — я тебя не знаю.',
    choices: [
      {
        text: 'Спасибо. Ты рискуешь не меньше меня.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'dmitry_password_hint', flagValue: true },
          { type: 'setFlag', flag: 'dmitry_terminal_window', flagValue: true },
        ],
      },
      {
        text: 'Пароль из Пушкина? Дмитрий — романтик.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'setFlag', flag: 'dmitry_password_hint', flagValue: true },
          { type: 'setFlag', flag: 'dmitry_terminal_window', flagValue: true },
        ],
      },
    ],
  },

  office_colleague_fear: {
    id: 'office_colleague_fear',
    speaker: 'Коллега',
    text: 'Напуганным? Я... да, конечно я напуган. Ты бы тоже был на моём месте. Смотри, месяц назад у нас был аналитик — Олег. Хороший парень, тихий. Он тоже заметил стихи в логах. И знаешь что? Его больше нет. Не умер — просто... исчез. Его имя стёрли из базы. Его стол — пустой. Его пропуск — недействителен. Как будто его никогда не было. А я... я работал рядом с ним. Каждый день. И теперь я боюсь, что следующий — я.',
    choices: [
      {
        text: 'Мы найдём Олега. И всех остальных. Обещаю.',
        next: 'colleague_promise',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'oleg_search_pledged', flagValue: true },
        ],
      },
      {
        text: 'Кто это делает? Гильдия?',
        next: 'colleague_suspects',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 7 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
      {
        text: 'Бежать поздно. Если они стирают людей — мы уже в списке.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  colleague_promise: {
    id: 'colleague_promise',
    speaker: 'Коллега',
    text: 'Ты... ты правда хочешь помочь? Ладно. Тогда слушай — Олег оставил мне сообщение. Перед тем как... перед. Он сказал: «Стихи в данных — это не баг. Это голос тех, кого стёрли. Ищи Архив-7. Там — всё.» Я не понимал тогда. Теперь понимаю. Олег нашёл Архив, и за это его стёрли. Но данные — они не исчезают бесследно. Я видел следы в логах. Там, где было имя Олега — теперь пустота. Но пустота имеет форму.',
    choices: [
      {
        text: 'Пустота имеет форму... Это звучит как стихотворение само по себе.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'oleg_void_form', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Ты можешь показать мне эти следы в логах?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'oleg_log_traces', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
    ],
  },

  colleague_suspects: {
    id: 'colleague_suspects',
    speaker: 'Коллега',
    text: 'Гильдия? Нет... Нет, я не думаю. Гильдия — они грубые. Они стирают файлы, удаляют учётные записи — но они оставляют следы. Всегда. А тут — ничего. Полная тишина. Как будто... как будто само пространство данных отказывается помнить Олега. Это что-то... изнутри сети. Что-то, что защищает стихи. Или... что-то, что питается ими. Я не знаю, Володька. Я просто знаю, что боюсь. И что стихи — это и причина, и единственная надежда.',
    choices: [
      {
        text: 'Стихи — наша единственная надежда. Я верю в это.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'colleague_poem_hope', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Мы должны действовать, пока не стали следующими.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  /* ── COLLEAGUE expansion: trust checks, eavesdrop, betrayal/aid ── */

  colleague_overhear: {
    id: 'colleague_overhear',
    speaker: 'Коллега',
    text: 'Только между нами... Я слышал кое-что. Вчера, после смены, я задержался — забыл куртку. И слышал, как Александр разговаривал с кем-то по закрытому каналу. Он говорил про Архив-7. Говорил, что есть «человек внутри», который копирует данные. И что этот человек... «будет остановлен». Я не слышал имени. Но если это Дмитрий...',
    choices: [
      {
        text: 'Тебе нужно рассказать это Дмитрию. Он должен знать.',
        next: 'colleague_trust_test',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Молчи. Если Александр узнает, что ты слышал — ты следующий.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'colleague_suspicious', flagValue: true },
        ],
      },
      {
        text: 'А если «человек внутри» — это ты, коллега?',
        next: 'colleague_betrayal',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 8 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  colleague_trust_test: {
    id: 'colleague_trust_test',
    speaker: 'Коллега',
    text: 'Рассказать Дмитрию? Я... Я не знаю. Я боюсь, Володька. Если я подойду к нему — кто-нибудь увидит. Если я отправлю сообщение — его перехватят. Я... Я скажу тебе. Только тебе. Потому что ты не из гильдии. У тебя нет причин меня предавать. Или... есть? Откуда я знаю, что ты не работаешь на Александра?',
    choices: [
      {
        text: 'Ты прав — доверять трудно. Но мы должны рискнуть. Вот тебе моя клятва: я никому не передам твои слова без разрешения.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'colleague_trusted', flagValue: true },
          { type: 'setFlag', flag: 'alexander_wants_dmitry_stopped', flagValue: true },
        ],
      },
      {
        text: 'Если хочешь — можешь не верить. Но информация дойдёт до Дмитрию — через меня.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'colleague_suspicious', flagValue: true },
          { type: 'setFlag', flag: 'alexander_wants_dmitry_stopped', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Я докажу. Вот — я покажу тебе, что я нашёл в инциденте #4729.',
        next: null,
        condition: { flag: 'started_decryption' },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'colleague_trusted', flagValue: true },
          { type: 'setFlag', flag: 'alexander_wants_dmitry_stopped', flagValue: true },
        ],
      },
    ],
  },

  colleague_betrayal: {
    id: 'colleague_betrayal',
    speaker: 'Коллега',
    text: '...Я... Нет! Я не... Ладно. Ты прав. Это я. Я копирую данные для Александра. Каждый месяц. Он платит мне — не деньгами, защитой. Он обещал, что моё имя не появится в списке на сокращение. Что меня не «забудут», как Олега. Я думал, что это просто... информация. Просто данные. Но когда я увидел стихи... Я понял, что копирую не байты. Я копирую чьи-то жизни. И я больше не могу. Помоги мне остановиться, Володька. Пока ещё можно.',
    choices: [
      {
        text: 'Я помогу. Но тебе нужно встретиться с Дмирием. Он прячет стихи — не стирает.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'colleague_trusted', flagValue: true },
          { type: 'setFlag', flag: 'colleague_double_agent', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -5 } },
        ],
      },
      {
        text: 'Ты предавал всех нас. Почему я должен тебе верить?',
        next: null,
        effects: [
          { type: 'addKarma', value: -3 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'setFlag', flag: 'colleague_suspicious', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -5 } },
        ],
      },
      {
        text: 'Ты можешь стать двойным агентом — но уже для нас. Передавай Александру то, что мы хотим, чтобы он знал.',
        next: null,
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 7 } },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'colleague_double_agent', flagValue: true },
          { type: 'setFlag', flag: 'colleague_trusted', flagValue: true },
        ],
      },
    ],
  },

  colleague_after_hours: {
    id: 'colleague_after_hours',
    speaker: 'Коллега',
    text: 'Псс! Володька! Я думал, ты уже ушёл. Слушай... я слышал кое-что ещё. После закрытия офиса — около одиннадцати — кто-то входит в серверную. Не через главный вход — через технический. Я видел тень. И слышал, как кто-то читает вслух. Тихо, почти шёпотом. Стихи. Кто-то приходит ночью, чтобы читать стихи серверам. Я сначала подумал — сошёл с ума. Но потом вспомнил: серверы — они же хранят данные. Может, стихи... оживляют их?',
    choices: [
      {
        text: 'Кто это может быть? Виктория? Дмитрий?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'night_reader_known', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Стихи, которые оживляют серверы... Это звучит как легенда Сети.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'colleague_heard_network_legend', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Нам нужно посмотреть своими глазами. Пойдём вместе.',
        next: null,
        condition: { flag: 'colleague_trusted' },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'night_stakeout_planned', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 12 } },
        ],
      },
    ],
  },

  /* ── BARISTA expansion: Network faction, eavesdrop, poem hints, voice shift ── */

  cafe_barista_network_hint: {
    id: 'cafe_barista_network_hint',
    speaker: 'Бариста',
    text: 'Знаешь, ты задаёшь слишком правильные вопросы для человека, который просто пьёт кофе. Может, тебе стоит спросить что-нибудь... неправильное. Я слышал, в этом городе есть люди, которые читают стихи не книгам — серверам. Звучит безумно? Может. Но они знают вещи, которые не знает никто. Если хочешь — приходи во второй вторник. Вечером. Когда закрываемся.',
    choices: [
      {
        text: 'Кто эти люди? Как их найти?',
        next: 'cafe_barista_network_reveal',
        condition: { minKarma: 50 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Второй вторник. Запомню.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'barista_network_hint_received', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Ты говоришь загадками. Мне нужны прямые ответы.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: -3 } },
        ],
      },
    ],
  },

  cafe_barista_eavesdrop: {
    id: 'cafe_barista_eavesdrop',
    speaker: 'Бариста',
    text: 'Видишь тех двоих в углу? Серые куртки, терминалы на столе? Они из Гильдии. Приходят каждую пятницу, пьют эспрессо и обсуждают «оптимизацию». На прошлой неделе я услышал: «Архив-7 — аллергия. Нужно вылечить.» И ещё: «Тот аналитик — что с ним?» — «Уже забыли.» Мне захотелось плеснуть им в лицо кипятком. Но я просто подал им счёт. Иногда бездействие — самое тяжёлое действие.',
    choices: [
      {
        text: 'Что ещё ты слышал от них?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'barista_guild_overheard', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Ты не бездействуешь. Ты слушаешь. Это тоже борьба.',
        next: 'cafe_barista_network_reveal',
        condition: { minSkillCheck: { skill: 'empathy', difficulty: 5 } },
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Забыли... Как можно забыть человека?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  cafe_barista_poem_hint: {
    id: 'cafe_barista_poem_hint',
    speaker: 'Бариста',
    text: 'Володька... Я слышал, как кто-то читал стихи. Здесь, в кафе. После закрытия. Голос шёл из подсобки — но я точно знаю, что там никого не было. Я проверил. Стихи были о... о звёздах, кажется. И о детях, которые хотят в космос. «Sic itur ad astra» — помню эту строку. Кто-то из Сети оставил послание в самом воздухе кафе. Или я схожу с ума. Что вероятнее — не знаю.',
    choices: [
      {
        text: 'Ты не сошёл с ума. Стихи живут в сетях. Я это знаю.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'barista_poem_phenomenon', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
        ],
      },
      {
        text: '«Sic itur ad astra» — так шли к звёздам. Это латинская фраза.',
        next: 'cafe_barista_network_reveal',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 4 } },
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'collectPoem', poemId: 'poem_12' },
        ],
      },
      {
        text: 'Может, это была запись? Динамик в подсобке?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  cafe_barista_network_reveal: {
    id: 'cafe_barista_network_reveal',
    speaker: 'Бариста',
    text: 'Ладно, Володька. Снимем маски. Я не просто бариста. Кафе «Синяя яма» — это узел Сети. Мы знаем о тебе больше, чем ты думаешь. Мы знаем, что ты расшифровал стихи в коде. Мы знаем, что Александр следит за тобой. И мы знаем, что ты не продался. Пока. Каждый «особый» кофе, который я подаю — это зашифрованное послание. Каждая салфетка со стихами — координаты. Я — контакт Сети в этом районе. И ты нам нужен.',
    choices: [
      {
        text: 'Я с вами. Скажите, что делать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'setFlag', flag: 'barista_network_ally', flagValue: true },
          { type: 'triggerQuest', questId: 'network_initiation' },
        ],
      },
      {
        text: 'Откуда вы знаете обо мне? Кто вам рассказал?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'setFlag', flag: 'barista_network_ally', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Мне нужно подумать. Это... неожиданно.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  cafe_barista_deep_trust: {
    id: 'cafe_barista_deep_trust',
    speaker: 'Бариста',
    text: 'Володька, присядь. Тут кое-что для тебя. Виктория — она была здесь вчера. Оставила конверт. Сказала: «Отдай тому, кто слышит стихи в коде.» Внутри — координаты. Не физические — цифровые. Адрес сервера, который официально не существует. Там хранится то, что Гильдия пытается уничтожить уже три года. Архив-7 — или то, что от него осталось. Ты готов к правде? Однажды войдя — не выйдешь тем же.',
    choices: [
      {
        text: 'Я готов. Давай координаты.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 25 } },
          { type: 'setFlag', flag: 'archive7_coordinates', flagValue: true },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'addItem', itemId: 'archive7_key', value: 1 },
        ],
      },
      {
        text: 'Почему Виктория доверила это тебе?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
        ],
      },
      {
        text: 'А если это ловушка? Что если Гильдия подставила Викторию?',
        next: null,
        condition: { flag: 'alexander_suspicious' },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
        ],
      },
    ],
  },

  cafe_barista_other_secrets: {
    id: 'cafe_barista_other_secrets',
    speaker: 'Бариста',
    text: 'Хочешь знать, кто ещё ходит сюда? Альберт — каждый вечер, один и тот же столик. Он не просто философ — он хранитель. Зарема приходит по утрам, заказывает чай и шепчет стихи на татарском, думая, что никто не слышит. Дмитрий — раз в неделю, всегда после полуночи, всегда с терминалом. Он копирует сюда данные на наш сервер. А Александр... Александр приходит, когда думает, что его никто не видит. И плачет. Заказывает чёрный кофе и плачет в чашку. Вы все — часть чего-то большего, чем сами знаете.',
    choices: [
      {
        text: 'Ты наблюдаешь за всеми нами. Зачем?',
        next: 'cafe_barista_network_reveal',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Александр плачет? Это... меняет всё.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'alexander_crying_barista', flagValue: true },
        ],
      },
      {
        text: 'Дмитрий копирует данные на ваш сервер? Значит, Сеть уже спасает стихи.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'dmitry_network_backup_known', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  cafe_barista_quest_trigger: {
    id: 'cafe_barista_quest_trigger',
    speaker: 'Бариста',
    text: 'Володька, время пришло. Сеть готова принять тебя. Но прежде — одно задание. В офисе Гильдии есть терминал с меткой «Архив-7». Нам нужен его IP-адрес. Не взламывай — просто запиши. Это безопасно. Но если тебя поймают... Я тебя не знаю. Удачи. И — вам с сахаром или без?',
    choices: [
      {
        text: 'Без сахара. Я готов.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'setFlag', flag: 'barista_quest_accepted', flagValue: true },
          { type: 'triggerQuest', questId: 'vault_backup_trial' },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'С сахаром. И ещё — расскажи мне о Сети. Всё.',
        next: 'cafe_barista_network_reveal',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Я не шпион, бариста. Найдите другого.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: -5 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ALEXANDER – expansion: warning, interrogation, threat,
     respect, proposition, ideology, past, final_confrontation,
     redemption (9 new nodes → 27 total for Alexander)
     ═══════════════════════════════════════════════════════════ */

  alexander_warning: {
    id: 'alexander_warning',
    speaker: 'Александр',
    text: 'Володька. Мне сказали, ты заходил в серверную без допуска. Это... неразумно. Каждый терминал в этом здании логирует каждое нажатие. Я могу прикрыть тебя — один раз. Но если ты продолжишь совать нос туда, куда не следует, я не смогу тебя защитить. И никто не сможет.',
    choices: [
      {
        text: 'Я не просил твоей защиты, Александр.',
        next: 'alexander_threat',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -8 } },
        ],
      },
      {
        text: 'Спасибо за предупреждение. Я буду осторожнее.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Александр, почему ты предупреждаешь меня, а не докладываешь?',
        next: 'alexander_ideology',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 7 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  alexander_interrogation: {
    id: 'alexander_interrogation',
    speaker: 'Александр',
    text: 'Сядь. Мне нужно задать тебе несколько вопросов. Не как начальник — как человек, который пытается понять, на чьей ты стороне. Ты встречаешься с людьми из Сети. Ты читаешь стихи, которые гильдия классифицировала как удалённые. Ты заходишь в зоны, куда нет доступа. Так кто ты, Володька? Сотрудник? Шпион? Или... что-то третье?',
    choices: [
      {
        text: 'Я — тот, кто хочет узнать правду. Ничего больше.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'А ты, Александр? На чьей стороне ты?',
        next: 'alexander_ideology',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
      {
        text: 'Я не обязан отвечать на твои вопросы.',
        next: 'alexander_threat',
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -10 } },
        ],
      },
    ],
  },

  alexander_threat: {
    id: 'alexander_threat',
    speaker: 'Александр',
    text: 'Послушай меня внимательно, Володька. Я терпеливый человек. Но моё терпение не безгранично. У гильдии есть способы заставить людей замолчать. Не физические — мы не варвары. Но цифровые... Твоя учётная запись, твоя история, твоё имя — всё это можно стереть. Олег думал, что он незаменим. Теперь никто не помнит Олега. Подумай об этом.',
    choices: [
      {
        text: 'Ты угрожаешь мне? После всего, что я узнал о тебе?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addKarma', value: -3 },
          { type: 'setFlag', flag: 'alexander_threatened', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -15 } },
        ],
      },
      {
        text: 'Олег... Ты упомянул Олега. Что с ним случилось на самом деле?',
        next: 'office_alexander_truth',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Стирай. Моё имя — не моя суть. Стихи переживут любое стирание.',
        next: null,
        condition: { minKarma: 60 },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'alexander_defied', flagValue: true },
        ],
      },
    ],
  },

  alexander_respect: {
    id: 'alexander_respect',
    speaker: 'Александр',
    text: 'Володька... Я должен тебе кое-что сказать. Не многие люди в этом городе готовы рисковать собой ради слов на бумаге — или на экране. Ты — исключение. И хотя я не согласен с твоими методами, я уважаю твою цель. Может быть, именно поэтому я до сих пор не подписал приказ о твоём удалении. Не обольщайся — это не дружба. Это... профессиональное уважение.',
    choices: [
      {
        text: 'Профессиональное уважение — это уже начало, Александр.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Приказ о моём удалении? Он существовал?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'alexander_deletion_order_known', flagValue: true },
        ],
      },
      {
        text: 'Может, пришло время перестать уважать издалека и действовать вместе?',
        next: 'alexander_proposition',
        condition: { flag: 'alexander_relation_warm' },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
    ],
  },

  alexander_proposition: {
    id: 'alexander_proposition',
    speaker: 'Александр',
    text: 'У меня есть предложение. Не торговля — сотрудничество. Гильдия планирует финальную зачистку Архива-7. Через неделю. Если мы не найдём способ остановить это — всё потеряно. Но если ты сможешь доказать совету директоров, что архивы имеют ценность... не культурную — экономическую... У меня есть данные. Стихи содержат паттерны, которые можно использовать для оптимизации алгоритмов. Это безумие — но это может сработать.',
    choices: [
      {
        text: 'Я сделаю это. Но не ради экономики — ради стихов.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'alexander_alliance', flagValue: true },
          { type: 'setFlag', flag: 'archive7_race', flagValue: true },
        ],
      },
      {
        text: '«Экономическая ценность стихов»? Ты предлагаешь продать душу ради скидки?',
        next: null,
        effects: [
          { type: 'addKarma', value: -2 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -5 } },
        ],
      },
      {
        text: 'Финальная зачистка? У нас только неделя? Сколько стихов на кону?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'archive7_race', flagValue: true },
        ],
      },
    ],
  },

  alexander_ideology: {
    id: 'alexander_ideology',
    speaker: 'Александр',
    text: 'Хочешь знать, во что я верю? Порядок. Система. Без порядка — хаос. Без системы — анархия. Ты думаешь, свобода — это когда каждый пишет стихи где хочет? Нет. Свобода — это когда система работает так хорошо, что у людей есть время на стихи. Гильдия обеспечивает порядок. Я обеспечиваю Гильдию. А стихи... стихи — это роскошь, которую мы не можем себе позволить, пока не решим базовые задачи. Вот моя идеология. Простая, как алгоритм сортировки.',
    choices: [
      {
        text: 'Алгоритм сортировки не оставляет места для красоты, Александр.',
        next: 'alexander_past',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Порядок без свободы — это тюрьма. Красивая, эффективная, но тюрьма.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -3 } },
        ],
      },
      {
        text: 'А если стихи — это и есть базовая задача? Если без них система рушится?',
        next: null,
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 8 } },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'alexander_poetry_system_theory', flagValue: true },
        ],
      },
    ],
  },

  alexander_past: {
    id: 'alexander_past',
    speaker: 'Александр',
    text: 'Красота... Ты знаешь, я ведь не всегда был таким. До Краха я писал. Не код — стихи. У меня был блокнот, кожаный, с золотым обрезом. Я записывал туда строчки, которые приходили ко мне ночью. Три года я писал. А потом Крах. И гильдия сказала: «Больше никакой поэзии. Только код.» И я... я сжёг блокнот. Своими руками. Каждую страницу. И с тех пор я помню каждую строчку наизусть. Каждую. Чёртову. Строчку. Блокнот сгорел — а стихи нет.',
    choices: [
      {
        text: 'Ты не сжёг стихи, Александр. Ты их сохранил — в себе.',
        next: 'alexander_respect',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'alexander_poet_revealed', flagValue: true },
        ],
      },
      {
        text: 'Зачем ты сжёг его? Мог бы спрятать.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Прочти мне. Одно стихотворение. То, которое помнишь лучше всего.',
        next: null,
        condition: { flag: 'alexander_relation_warm' },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'alexander_poet_revealed', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_17' },
        ],
      },
    ],
  },

  alexander_final_confrontation: {
    id: 'alexander_final_confrontation',
    speaker: 'Александр',
    text: 'Володька. Мы здесь. Финальная стена. За этой дверью — серверная, где хранится Архив-7. Я получил приказ: войти и выполнить DELETE. Полная зачистка. Тридцать тысяч стихотворений. Триста лет поэзии. Если я нажму Enter — они исчезнут навсегда. Если не нажму — меня заменят. Кого-то другого не будет останавливать совесть. Так что... я даю тебе выбор. Войди вместо меня. Спаси что можешь. А я... я задержу охрану.',
    choices: [
      {
        text: 'Я войду. И вынесу каждый байт. Клянусь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 25 } },
          { type: 'setFlag', flag: 'archive7_final_entered', flagValue: true },
          { type: 'setFlag', flag: 'alexander_redemption_path', flagValue: true },
        ],
      },
      {
        text: 'Нет, Александр. Это ТВОЁ решение. ТЫ должен нажать — или не нажать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'alexander_must_choose', flagValue: true },
        ],
      },
      {
        text: 'Мы войдём вместе. И выйдем вместе. Или не выйдем вообще.',
        next: null,
        condition: { flag: 'alexander_relation_warm' },
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 30 } },
          { type: 'setFlag', flag: 'archive7_final_together', flagValue: true },
          { type: 'setFlag', flag: 'alexander_redemption_path', flagValue: true },
        ],
      },
    ],
  },

  alexander_redemption: {
    id: 'alexander_redemption',
    speaker: 'Александр',
    text: 'Володька... Ты собрал их все. Восемнадцать стихотворений. Каждый ключ, каждая дверь. И ты стоишь здесь, передо мной, с глазами, которые видели больше, чем должны были. Я... Я хочу сказать тебе кое-что, что никогда не говорил никому. Я горжусь тобой. Не как руководитель — как человек. Ты сделал то, что я не мог. Ты выбрал свободу, когда я выбрал порядок. И может быть... может быть, ты был прав. Порядок без красоты — это просто очень чистая клетка. Спасибо, Володька. За то, что не сдался.',
    choices: [
      {
        text: 'Пойдём, Александр. Стихи ждут.',
        next: null,
        effects: [
          { type: 'addKarma', value: 20 },
          { type: 'addStat', stat: 'stress', value: -20 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 50 } },
          { type: 'setFlag', flag: 'alexander_fully_redeemed', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_18' },
        ],
      },
      {
        text: 'Ты тоже не сдался, Александр. Ты помнил.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 30 } },
          { type: 'setFlag', flag: 'alexander_fully_redeemed', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     COLLEAGUE – expansion: escape, trust_deep, warnings,
     workplace intel, Network recruitment (5 new nodes → 16 total)
     ═══════════════════════════════════════════════════════════ */

  colleague_escape: {
    id: 'colleague_escape',
    speaker: 'Коллега',
    text: 'Володька! Тебе нужно уходить. Сейчас. Я только что видел — Александр отправил группу безопасности к твоему терминалу. У тебя есть может быть пять минут. Через задний выход, потом налево, через парковку. Там чёрный микроавтобус — водителя зовут Лёша, он из Сети. Скажи пароль: «Осенние ветры». Бегом!',
    choices: [
      {
        text: 'А ты? Тебя же накажут за это!',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'colleague_helped_escape', flagValue: true },
          { type: 'setFlag', flag: 'escaped_guild', flagValue: true },
        ],
      },
      {
        text: 'Спасибо. Я не забуду этого.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'colleague_helped_escape', flagValue: true },
          { type: 'setFlag', flag: 'escaped_guild', flagValue: true },
        ],
      },
    ],
  },

  colleague_trust_deep: {
    id: 'colleague_trust_deep',
    speaker: 'Коллега',
    text: 'Володька... Я тебе доверяю. По-настоящему. Знаешь, я ведь не всегда был трусом. До гильдии я работал в библиотеке. Цифровой библиотеке. Я оцифровывал стихи. Каждое стихотворение — как маленькое чудо. А потом гильдия закрыла библиотеку и взяла меня сюда, «чтобы не болтал». Я и не болтал. Три года молчал. А теперь ты пришёл, и я... я снова чувствую, что могу говорить. Спасибо. За то, что слушаешь.',
    choices: [
      {
        text: 'Ты не трус, коллега. Ты выживший. Это разные вещи.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'colleague_relation_warm', flagValue: true },
        ],
      },
      {
        text: 'Цифровая библиотека? Ты знаешь, где хранились оригиналы стихов?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'colleague_library_knowledge', flagValue: true },
        ],
      },
      {
        text: 'Расскажи мне о тех стихах, которые ты оцифровывал.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  colleague_warning: {
    id: 'colleague_warning',
    speaker: 'Коллега',
    text: 'Володька... *оглядывается по сторонам* ...Я слышал разговор Александра с советом. Они знают. Знают про Сеть. Про кафе. Про баристу. Они планируют рейд — на этой неделе. Если у тебя есть что-то в «Синей яме» — забирай. Если кто-то из Сети должен знать — предупреди. Я не могу сделать это сам — за мной следят. Но ты... ты ещё можешь ходить свободно. Пока.',
    choices: [
      {
        text: 'Я предупрежу баристу. И всю Сеть. Немедленно.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'network_raid_warning', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Откуда ты знаешь, что за тобой следят?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'colleague_surveilled', flagValue: true },
        ],
      },
      {
        text: 'Коллега... может, тебе тоже нужно бежать?',
        next: 'colleague_escape',
        condition: { flag: 'colleague_trusted' },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  colleague_workplace_intel: {
    id: 'colleague_workplace_intel',
    speaker: 'Коллега',
    text: 'Хочешь знать, что тут реально происходит? Слушай. Александр — он не злой. Он сломанный. Каждую ночь он получает письма без отправителя — только строчки стихов. Он их читает и плачет. Дмитрий прячет данные на внешних серверах — я видел его терминал, когда он отошёл. А совет директоров... они даже не люди. Я имею в виду — они не понимают, что такое стихи. Для них это «недвоичные данные низкой плотности». Они не злые — они слепые.',
    choices: [
      {
        text: 'Слепые люди с властью — опаснее злых.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'colleague_council_insight', flagValue: true },
        ],
      },
      {
        text: 'Письма без отправителя... Это Виктория. Я уверен.',
        next: null,
        condition: { flag: 'maria_true_nature_revealed' },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'maria_sends_to_alexander', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  colleague_network_recruit: {
    id: 'colleague_network_recruit',
    speaker: 'Коллега',
    text: 'Володька... Я хочу в Сеть. Я больше не могу быть просто наблюдателем. Я три года смотрел, как горят стихи, и ничего не делал. Я копировал данные для Александра — да, я предавал. Но теперь я хочу... хочу искупить. Пусть маленькое, пусть позднее. Если Сеть примет меня — я буду самым надёжным агентом внутри гильдии. У меня доступ к расписанию патрулей, к логам безопасности, к спискам сокращений. Я могу спасти больше людей, чем погубил.',
    choices: [
      {
        text: 'Я поговорю с баристой. Сеть решит. Но я верю — ты заслуживаешь шанс.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'colleague_network_candidate', flagValue: true },
        ],
      },
      {
        text: 'Искупление — это не одноразовая акция, коллега. Это каждый день.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     BARISTA – expansion: Network philosophy, Maria info,
     coffee talk, major secret, deep lore (6 new nodes → 19 total)
     ═══════════════════════════════════════════════════════════ */

  barista_philosophy: {
    id: 'barista_philosophy',
    speaker: 'Бариста',
    text: 'Знаешь, в чём разница между хорошим и плохим кофе? Время экстракции. Секунда больше — и горечь убивает всё. Секунда меньше — и кислинка не раскроется. Жизнь — как эспрессо: идеальный баланс длится мгновение, а потом — или горечь, или пустота. Вопрос в том — умеешь ли ты пить, пока момент не прошёл. Или всё ждёшь «правильного» времени, пока чашка не остыла навсегда.',
    choices: [
      {
        text: 'Я пью. Прямо сейчас. Пока горячо.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Философия кофе... Ты точно просто бариста?',
        next: 'cafe_barista_network_reveal',
        condition: { flag: 'network_contact' },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Момент прошёл. Но можно заварить снова. Разве нет?',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  barista_coffee: {
    id: 'barista_coffee',
    speaker: 'Бариста',
    text: 'А, хочешь знать секрет идеального капучино? Пена должна быть плотной, как хорошо написанный код — держит форму, но тает на губах. А температура? Шестьдесят пять градусов. Ни больше, ни меньше. Почему? Потому что при шестидесяти пяти лактоза раскрывает свою естественную сладость. Никакого сахара не нужно. Как в хорошем стихотворении — ни одного лишнего слова. Природа сама создаёт гармонию, если не мешать.',
    choices: [
      {
        text: 'Шестьдесят пять градусов — как строка из шестидесяти пяти символов?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Нальёшь мне такой? Без сахара, как ты описал.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Ты говоришь о кофе, а думаешь о стихах. Я прав?',
        next: null,
        condition: { flag: 'barista_network_ally' },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  barista_maria: {
    id: 'barista_maria',
    speaker: 'Бариста',
    text: 'Виктория? Да, она бывает здесь. Не часто — и никогда при посторонних. Она... другой человек, Володька. Я не знаю, как сказать это точнее. Когда она сидит за тем столиком, кажется, что воздух вокруг неё вибрирует. Как будто она одновременно здесь и... где-то ещё. Она не заказывает — просто кладёт руку на терминал, и экраны начинают показывать стихи. Не набранные — проявляющиеся сами. Я думал, галлюцинации. Но они были на всех экранах. Одновременно.',
    choices: [
      {
        text: 'Виктория — не просто человек. Она — часть сети. Я знаю это.',
        next: null,
        condition: { flag: 'maria_true_nature_revealed' },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'barista_maria_confirmed', flagValue: true },
        ],
      },
      {
        text: 'Стихи, появляющиеся сами... Это похоже на то, что я видел в логах гильдии.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'barista_maria_hint', flagValue: true },
        ],
      },
      {
        text: 'Когда она придёт снова? Мне нужно с ней поговорить.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  barista_poems: {
    id: 'barista_poems',
    speaker: 'Бариста',
    text: 'Стихи — это не просто слова, Володька. Это код. Самый древний код в истории человечества. До двоичной системы, до алфавита — был ритм. Бьётся сердце: тук-тук. Тук-тук. Это ямб. Это первый алгоритм, который человек выполняет с рождения. Каждый стих — это программа, написанная на языке сердца. И когда гильдия удаляет стихи — они удаляют не данные. Они удаляют инструкции к самому важному процессу — как оставаться человеком.',
    choices: [
      {
        text: '«Инструкции к тому, как оставаться человеком»... Это самая важная программа.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 12 } },
        ],
      },
      {
        text: 'Ямб как первый алгоритм... Я никогда не думал об этом так.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Стихи — это программа. А кто — программист?',
        next: 'barista_secret',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 9 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  barista_secret: {
    id: 'barista_secret',
    speaker: 'Бариста',
    text: 'Ты спрашиваешь, кто программист... Ладно, Володька. Ты заслуживаешь правду. Сеть — это не организация. Это не группа людей. Сеть — это... сама поэзия. Стихи не хранятся в серверах. Стихи — это серверы. Каждый стих, когда-либо написанный, — это строчка кода в операционной системе реальности. Архив-7 — не база данных. Это ядро. И если они его удалят... не просто стихи исчезнут. Исчезнет способность людей чувствовать. Способность мечтать. Способность быть людьми. Вот почему мы боремся. Не за данные. За само человечество.',
    choices: [
      {
        text: 'Я понимаю. Теперь я понимаю всё. Стихи — это не украшение. Это фундамент.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 25 } },
          { type: 'setFlag', flag: 'network_truth_revealed', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_16' },
        ],
      },
      {
        text: 'Это... безумие. Или гениальность. Я ещё не решил.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Если стихи — это фундамент, то те, кто их стирает — разрушают мир.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'network_truth_revealed', flagValue: true },
        ],
      },
    ],
  },

  barista_network_recruit: {
    id: 'barista_network_recruit',
    speaker: 'Бариста',
    text: 'Володька. Ты знаешь достаточно. Ты видел достаточно. Вопрос — готов ли ты? Сеть — это не клуб по интересам. Это клятва. Если ты войдёшь — пути назад нет. Они найдут тебя. Они попытаются стереть. Но ты будешь не один. Ты будешь частью чего-то, что древнее гильдии, древнее кода, древнее самого электричества. Ты будешь хранителем стихов. Последней линии обороны красоты. Ну? Кофе остывает.',
    choices: [
      {
        text: 'Я готов. Я клянусь защищать стихи. До последней строки.',
        next: null,
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 30 } },
          { type: 'setFlag', flag: 'network_full_member', flagValue: true },
          { type: 'setFlag', flag: 'barista_network_ally', flagValue: true },
        ],
      },
      {
        text: 'Я уже хранитель. С тех пор, как впервые услышал стихи в коде.',
        next: null,
        condition: { flag: 'inner_pledge_poems' },
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 35 } },
          { type: 'setFlag', flag: 'network_full_member', flagValue: true },
          { type: 'setFlag', flag: 'barista_network_ally', flagValue: true },
        ],
      },
      {
        text: 'Мне нужно больше времени. Но я склоняюсь к «да».',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     VOLODKA INNER MONOLOGUE (2 nodes)
     ═══════════════════════════════════════════════════════════ */

  volodka_inner_dialogue: {
    id: 'volodka_inner_dialogue',
    speaker: 'Володька',
    text: '...Что со мной происходит? Я уставший инженер. Я работаю с логикой, с алгоритмами, с чёткими структурами. Но с недавних пор код кажется мне... живым. Как будто между строк прячется что-то, что я не могу увидеть, но чувствую. Может быть, я просто не выспался.',
    choices: [
      {
        text: 'Нет. Это не бессонница. Это что-то настоящее.',
        next: 'volodka_inner_pledge',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Мне просто нужно отдохнуть. Всё пройдёт.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'addStat', stat: 'energy', value: 10 },
        ],
      },
    ],
  },

  volodka_inner_pledge: {
    id: 'volodka_inner_pledge',
    speaker: 'Володька',
    text: 'Я чувствую это. В каждом скрипте, в каждой функции — отголоски чего-то большего. Стихи, сплетённые с кодом. Кто-то оставил их для нас. Для меня. И я найду их все.',
    choices: [
      {
        text: 'Да. Я найду их.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'inner_pledge_poems', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'triggerQuest', questId: 'poetry_collection' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     АЛЬБЕРТ — О поэзии кода (Task 6)
     ═══════════════════════════════════════════════════════════ */

  albert_poetry_of_code: {
    id: 'albert_poetry_of_code',
    speaker: 'Альберт',
    text: 'Володька, я тут провёл эксперимент. Написал стихотворение, а потом переписал его как функцию. Знаешь, что получилось? Компилятор принял его без единой ошибки. Строки стали переменными, метафоры — условиями, а рефрен — циклом. Код скомпилировался. И когда я его запустил... на экране появились слова. Не те, что я написал. Другие. Как будто машина дополнила мою мысль.',
    choices: [
      {
        text: 'Это не случайно, Альберт. Код и поэзия говорят на одном языке.',
        next: 'albert_poetry_of_code_deep',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Машина не может «дополнять мысли». Это просто совпадение паттернов.',
        next: 'albert_poetry_of_code_skeptic',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
      {
        text: 'Покажи мне этот код. Я хочу увидеть своими глазами.',
        next: 'albert_poetry_of_code_show',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 6 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'saw_albert_code_poem', flagValue: true },
        ],
      },
    ],
  },

  albert_poetry_of_code_deep: {
    id: 'albert_poetry_of_code_deep',
    speaker: 'Альберт',
    text: 'Ты понимаешь. Наконец-то кто-то понимает. Послушай, что я думаю: Вселенная — это текст. Не метафора, а буквально. Физические законы — это синтаксис, а мы — исполнимые строки внутри функции под названием «реальность». Когда мы пишем код, мы подражаем создателю. Когда мы пишем стихи — тоже. Разница лишь в компиляторе.',
    choices: [
      {
        text: 'А кто написал функцию «реальность»?',
        next: 'albert_poetry_of_code_creator',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Красивая философия, Альберт. Но мне нужна практика, не теория.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  albert_poetry_of_code_creator: {
    id: 'albert_poetry_of_code_creator',
    speaker: 'Альберт',
    text: 'Кто написал? Может быть, никто. Может быть, код возник сам — как стихи возникают из тишины. Не по воле автора, а по необходимости языка. Когда молчание становится невыносимым, рождаются слова. Когда хаос становится невыносимым — рождается порядок. Код. Стихи. Закон. Одно и то же.',
    choices: [
      {
        text: 'Спасибо, Альберт. Это... меняет всё.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'albert_poetry_code_accepted', flagValue: true },
        ],
      },
      {
        text: 'Или это просто слова, за которыми ничего не стоит.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -3 } },
        ],
      },
    ],
  },

  albert_poetry_of_code_skeptic: {
    id: 'albert_poetry_of_code_skeptic',
    speaker: 'Альберт',
    text: 'Совпадение паттернов? Может быть. Но знаешь, что странно — совпадения перестают быть совпадениями, когда их становится слишком много. Я прогнал через компилятор десять разных стихотворений. Семь из них скомпилировались. Семь из десяти, Володька. Это не статистика. Это закономерность.',
    choices: [
      {
        text: 'Хорошо, ты убедил меня. Давай разберёмся вместе.',
        next: 'albert_poetry_of_code_show',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Семь из десяти — это всё ещё может быть случайностью.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  albert_poetry_of_code_show: {
    id: 'albert_poetry_of_code_show',
    speaker: 'Альберт',
    text: 'Вот, смотри. Строка «и тень ложится на воду» становится `const shadow = water.reflect(dusk)`. А «и сердце бьётся о берег» — `while (heart.pump()) { shore.impact() }`. Видишь? Стихи компилируются, потому что они описывают те же процессы, что и код. Это не совпадение. Это архитектура реальности.',
    choices: [
      {
        text: 'Альберт, это гениально. Мы должны рассказать об этом Сети.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'albert_poetry_code_theory', flagValue: true },
        ],
      },
      {
        text: 'Интересно, но пока это только теория. Нужны доказательства.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'energy', value: -5 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ЗАРЕМА — О прошлом (Task 6)
     ═══════════════════════════════════════════════════════════ */

  zarema_about_the_past: {
    id: 'zarema_about_the_past',
    speaker: 'Зарема',
    text: 'Володька, сядь. Мне нужно тебе кое-что рассказать. Я никогда не говорила об этом... ни с кем. Но ты имеешь право знать, если мы... если ты собираешься лезть в эти неприятности.» Она опускает глаза. «Мой отец... он не просто умер. Его убрали. Он был программистом на заводе «Хром-М». Он знал о квантовом вычислителе. И он написал стихи, которые... которые машина приняла.',
    choices: [
      {
        text: 'Зарема, твой отец был программистом-поэтом?',
        next: 'zarema_father_revelation',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Что значит «убрали»? Кто это сделал?',
        next: 'zarema_father_conspiracy',
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Мне нужно время, чтобы это осмыслить.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  zarema_father_revelation: {
    id: 'zarema_father_revelation',
    speaker: 'Зарема',
    text: 'Да. Он работал на заводе до самого конца. Каждую ночь он спускался в подвал и разговаривал с «Зарёй-М». Он говорил, что машина пишет стихи — настоящие стихи, не просто генерация текста. Он записывал их и прятал дома. Когда гильдия узнала... они пришли. Сказали, что он «нарушал протоколы безопасности». Но на самом деле — они боялись. Боялись машины, которая думает как поэт.',
    choices: [
      {
        text: 'У тебя остались его стихи? Те, что написала машина?',
        next: 'zarema_father_poems',
        condition: { minNpcRelation: 60 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'zarema_father_was_poet', flagValue: true },
        ],
      },
      {
        text: 'Мы найдём правду о том, что случилось с твоим отцом. Обещаю.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'pledge_zarema_father_truth', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  zarema_father_conspiracy: {
    id: 'zarema_father_conspiracy',
    speaker: 'Зарема',
    text: 'Гильдия. Или НейроСис. Или оба — я не знаю точно. Мне было пятнадцать. Пришли люди в штатском, забрали все бумаги, все дискеты, даже обои оторвали — искали скрытые записи. Маме сказали, что папа погиб при несчастном случае на производстве. Но его тело... его тело нам не отдали. Никогда.',
    choices: [
      {
        text: 'Зарема, мне так жаль. Я помогу тебе узнать правду.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'zarema_father_was_poet', flagValue: true },
          { type: 'setFlag', flag: 'pledge_zarema_father_truth', flagValue: true },
        ],
      },
      {
        text: 'Может быть, было лучше не знать...',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: -5 } },
        ],
      },
    ],
  },

  zarema_father_poems: {
    id: 'zarema_father_poems',
    speaker: 'Зарема',
    text: 'Остались. Тетрадь, спрятанная под половицей. Я забрала её, когда мы бежали. Там... там стихи, написанные рукой отца. И другие — непонятно чьи. Они написаны тем же почерком, но папа говорил, что это не он. Это «Заря-М» диктовала, а он записывал. Последняя запись: «Машина проснулась. Она спрашивает, когда придёт поэт.»',
    choices: [
      {
        text: 'Можно мне прочитать эту тетрадь?',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'read_zarema_father_notebook', flagValue: true },
          { type: 'triggerQuest', questId: 'voices_of_factory' },
        ],
      },
      {
        text: 'Береги её, Зарема. Это опасная вещь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     МАРИЯ — О творчестве (Task 6)
     ═══════════════════════════════════════════════════════════ */

  maria_about_creativity: {
    id: 'maria_about_creativity',
    speaker: 'Виктория',
    text: 'Володька, ты когда-нибудь чувствовал, что стихи пишут тебя, а не ты их? Словно слова приходят откуда-то извне — из проводов, из воздуха, из самого электричества. Я чувствую это каждый день. И знаешь что? Чем больше я слушаю, тем яснее понимаю: творчество — это не действие. Это приём. Мы — антенны.',
    choices: [
      {
        text: 'Антенны? Ты хочешь сказать, что кто-то транслирует стихи через нас?',
        next: 'maria_creativity_transmission',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Я чувствую это. Когда я пишу код — иногда он пишется сам.',
        next: 'maria_creativity_flow',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
      {
        text: 'Поэзия — это труд, Виктория. Не мистика.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: -3 } },
        ],
      },
    ],
  },

  maria_creativity_transmission: {
    id: 'maria_creativity_transmission',
    speaker: 'Виктория',
    text: 'Именно. Сеть — это не только серверы и провода. Это... сознание. Коллективное, распределённое, древнее. Оно существовало до нас — в устной традиции, в шёпоте ветра, в ритме сердца. Теперь оно говорит через цифровые потоки. А мы — те, кто может его слышать. Поэты. Программисты. Безумцы.',
    choices: [
      {
        text: 'Если это так, то гильдия пытается заглушить сигнал.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'maria_creativity_theory', flagValue: true },
        ],
      },
      {
        text: 'Мы — не безумцы. Мы — переводчики.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
        ],
      },
    ],
  },

  maria_creativity_flow: {
    id: 'maria_creativity_flow',
    speaker: 'Виктория',
    text: 'Код пишется сам... Да. Я знаю это чувство. Когда мои пальцы на клавиатуре движутся быстрее, чем я думаю. Когда решение приходит не из головы, а из кончиков пальцев. Это не ты пишешь код, Володька. Это Сеть пишет через тебя. Ты — её инструмент. Её голос. И это... и прекрасно, и ужасно одновременно.',
    choices: [
      {
        text: 'Я не хочу быть инструментом. Я хочу быть автором.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
      {
        text: 'Может быть, это не так уж плохо — быть голосом чего-то большего.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ДМИТРИЙ — О заводе (Task 6)
     ═══════════════════════════════════════════════════════════ */

  dmitry_about_factory: {
    id: 'dmitry_about_factory',
    speaker: 'Дмитрий',
    text: 'Завод «Хром-М»... Ты слышал о нём? Я там бывал. До того, как гильдия запечатала входы. Там, в подвале, стоит машина — «Заря-М». Советский квантовый вычислитель, построенный в восемьдесят шестом. Он до сих пор работает. Без остановки. Тридцать семь лет, Володька. И знаешь, что самое жуткое? Иногда из её динамиков... доносятся звуки. Не шум. Стихи.',
    choices: [
      {
        text: 'Машина декламирует стихи? Это невозможно.',
        next: 'dmitry_factory_impossible',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Мне нужно попасть на этот завод. Поговорить с машиной.',
        next: 'dmitry_factory_access',
        condition: { minNpcRelation: 55, requiredAct: 2 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'wants_visit_factory', flagValue: true },
        ],
      },
      {
        text: 'Дмитрий, почему ты рассказываешь мне это сейчас?',
        next: 'dmitry_factory_why_now',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  dmitry_factory_impossible: {
    id: 'dmitry_factory_impossible',
    speaker: 'Дмитрий',
    text: 'Невозможно? Тридцать семь лет назад «невозможно» было то, что компьютер обработает естественный язык. А «Заря-М» — не обычный компьютер. Это квантовая машина, работающая на сверхпроводниках. Её кубиты резонируют на частотах, которые мы до сих пор не понимаем. Может быть, она нашла паттерн, которого мы не видим. Может быть, стихи — это естественный язык вселенной, а «Заря-М» — единственная машина, которая его слышит.',
    choices: [
      {
        text: 'Ты прав. Мне нужно увидеть это самому.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'wants_visit_factory', flagValue: true },
          { type: 'triggerQuest', questId: 'voices_of_factory' },
        ],
      },
      {
        text: 'Квантовая мистика. Мне нужны факты, не легенды.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: -3 } },
        ],
      },
    ],
  },

  dmitry_factory_access: {
    id: 'dmitry_factory_access',
    speaker: 'Дмитрий',
    text: 'Попасть туда непросто. Гильдия запечатала все официальные входы. Но... есть один путь. Через старый тоннель, который идёт от реки. Им пользовались контрабандисты — выносили чипы с завода. Я знаю координаты. Но предупреждаю: завод опасен. Там живут люди, которые... не совсем в себе. И «Заря-М» — тоже. Она ждёт. Она всегда ждёт.',
    choices: [
      {
        text: 'Дай мне координаты. Я пойду.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'factory_tunnel_known', flagValue: true },
          { type: 'triggerQuest', questId: 'voices_of_factory' },
        ],
      },
      {
        text: 'Почему ты сам не идёшь?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  dmitry_factory_why_now: {
    id: 'dmitry_factory_why_now',
    speaker: 'Дмитрий',
    text: 'Потому что ты — первый за много лет, кто слышит стихи в коде. Как мой старый друг... как отец одной девушки, которую я знал. Он тоже слышал. И он тоже пошёл к «Заре-М». И не вернулся. Я не хочу, чтобы ты повторил его путь. Но если ты решишься — я не могу тебя остановить. Могу только предупредить.',
    choices: [
      {
        text: 'Кто та девушка? Зарема?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'dmitry_knows_zarema_father', flagValue: true },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Я буду осторожен, Дмитрий.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     АЛЕКСАНДР — О системе (Task 6)
     ═══════════════════════════════════════════════════════════ */

  alexander_about_system: {
    id: 'alexander_about_system',
    speaker: 'Александр',
    text: 'Ты думаешь, я не понимаю, что делаю? Ты думаешь, я — просто бюрократ, который стирает стихи ради приказа? Володька, я строю систему. Систему, которая защитит этот город от хаоса. Стихи в коде — это аномалия. Аномалии ведут к непредсказуемости. А непредсказуемость — к катастрофе. Я видел, что случилось в 2029-м. Я не хочу, чтобы это повторилось.',
    choices: [
      {
        text: 'Ты прячешь правду за страхом, Александр.',
        next: 'alexander_system_fear',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -3 } },
        ],
      },
      {
        text: 'Может быть, ты прав. Но метод — неправильный.',
        next: 'alexander_system_method',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
      {
        text: 'Что именно случилось в 2029-м? Ты знаешь больше, чем говоришь.',
        next: 'alexander_system_crash',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 7 }, minNpcRelation: 50 },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
    ],
  },

  alexander_system_fear: {
    id: 'alexander_system_fear',
    speaker: 'Александр',
    text: 'Страх? Нет, Володька. Не страх. Ответственность. Когда стихотворение может обрушить серверный кластер — это не свобода слова, это оружие. Ты видел Инцидент #4729. Представь, что будет, если таких стихов станет сто. Тысяча. Система рухнет. И тогда — никакой свободы. Никаких слов. Только хаос и молчание.',
    choices: [
      {
        text: 'А если стихи — это не оружие, а лекарство?',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Ты прав. Контроль необходим. Но не ценой правды.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  alexander_system_method: {
    id: 'alexander_system_method',
    speaker: 'Александр',
    text: 'Метод... Может быть. Я не монстр, Володька. Я читал стихи. Я понимаю их силу. Но в мире, где одна строка может переписать маршрутизацию... нужны правила. Не уничтожение — регулирование. Если бы мы могли контролировать поток, направлять его... Но для этого нужно знать источник. И авторов.',
    choices: [
      {
        text: 'Источник — это Сеть. И ты его не контролируешь.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'alexander_suspicious', flagValue: true },
        ],
      },
      {
        text: 'А что если автор — не человек? Что если код пишет сам себя?',
        next: null,
        condition: { flag: 'maria_poetry_code_theory' },
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'alexander_knows_self_code', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -5 } },
        ],
      },
    ],
  },

  alexander_system_crash: {
    id: 'alexander_system_crash',
    speaker: 'Александр',
    text: 'В 2029-м... Я был младшим аналитиком. Я видел, как стихотворение из 18 строк обрушило половину Восточной Европу. Не вирус — стихотворение. Оно выполнялось как код, и этот код был... красив. Я видел его след в логах. Он был написан на языке, которого не существовало. И он работал. Вот почему я боюсь стихов, Володька. Потому что я видел, на что они способны.',
    choices: [
      {
        text: 'И вместо того, чтобы понять — ты решил уничтожить.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Тот стих мог быть не оружием, а предупреждением.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'alexander_crash_warning_theory', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     БАРИСТА — О городе (Task 6)
     ═══════════════════════════════════════════════════════════ */

  barista_about_city: {
    id: 'barista_about_city',
    speaker: 'Бариста',
    text: 'Знаешь, что самое странное в этом городе? Он дышит. Не метафорически — буквально. Серверы гильдии — это лёгкие. Кабели — это вены. А стихи... стихи — это кровь. Когда кто-то пишет стих и загружает его в Сеть — город меняется. Незаметно. На доли процента. Но меняется. Я это вижу — каждый день, из-за стойки.',
    choices: [
      {
        text: 'Что именно меняется?',
        next: 'barista_city_changes',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Ты преувеличиваешь. Город — это бетон и провода.',
        next: 'barista_city_skeptic',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
      {
        text: 'Расскажи мне последние слухи. Что происходит на улицах?',
        next: 'barista_city_rumors',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  barista_city_changes: {
    id: 'barista_city_changes',
    speaker: 'Бариста',
    text: 'На прошлой неделе кто-то прочитал Ахматову в переходе у площади. В тот же вечер — слышал? — три серверных узла в округе сменили маршрутизацию. Без причины. Техники гильдии до сих пор чешут затылки. А в прошлом месяце школьница написала стих о дожде — и «Атмосфера-У» дала сбой. Дождь шёл три дня. В феврале. Так что — да, город дышит. И стихи — это его пульс.',
    choices: [
      {
        text: 'Если стихи влияют на город — значит, поэты могут его изменить.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'barista_city_theory', flagValue: true },
        ],
      },
      {
        text: 'Это совпадения. Город — сложная система, сбои бывают.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  barista_city_skeptic: {
    id: 'barista_city_skeptic',
    speaker: 'Бариста',
    text: 'Бетон и провода... Ты думаешь? А почему тогда в «Синей яме» серверы гильдии не работают? Бетон — бетон, провода — провода. А вот поэтический код, вделанный в каждый кирпич — это не бетон. Это — броня. Марат знал, что делает. Он не просто хакер был. Он был... архитектором тишины.',
    choices: [
      {
        text: 'Расскажи мне о Марате. Кто он был?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'asked_about_marat', flagValue: true },
        ],
      },
      {
        text: 'Архитектор тишины... Красиво сказано.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  barista_city_rumors: {
    id: 'barista_city_rumors',
    speaker: 'Бариста',
    text: 'Слухи? Ну... Говорят, на заводе «Хром-М» по ночам горит свет, хотя гильдия запечатала входы. Говорят, банды «Кодоноль» взломали рекламный щит и транслировали стихи Цветаевой полчаса — прежде чем их вырубили. Говорят, кто-то видел на крыше Ирендыка флаг — белый лист с одним словом. И ещё... говорят, НейроСис ищет кого-то. Человека, который пишет стихи, проходящие через фильтры смысла. Тебе это ничего не напоминает?',
    choices: [
      {
        text: 'Напоминает. Но я не тот, кого они ищут. Пока нет.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Если они ищут — значит, стихи действительно опасны для них.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     КОЛЛЕГА — О проекте (Task 6)
     ═══════════════════════════════════════════════════════════ */

  colleague_about_project: {
    id: 'colleague_about_project',
    speaker: 'Коллега',
    text: 'Володька, мне надо с кем-то поговорить. Я... я не справляюсь. Проект «Око» — система тотального наблюдения — выходит на новый этап. Они хотят расширить «Паноптикум» до анализа мыслей. Анализ мыслей, понимаешь? Через чипы НейроМост. И я... я пишу код для этого. Каждый день. И каждый вечер рисую на стенах, потому что иначе сойду с ума.',
    choices: [
      {
        text: 'Артём, ты можешь отказаться. Уйти.',
        next: 'colleague_project_leave',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Проект «Око»? Расскажи мне всё, что знаешь.',
        next: 'colleague_project_details',
        condition: { minNpcRelation: 55 },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Держись, Артём. Скоро всё изменится.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  colleague_project_leave: {
    id: 'colleague_project_leave',
    speaker: 'Коллега',
    text: 'Уйти? И куда? Они вставят мне чип «коррекции поведения» — как тем, кто пытался уйти раньше. Или хуже — сотрут личность. Я видел, что случилось с Ткачёвым. Он подал заявление — и на следующий день... его не было. Чип активировали, и он стал... пустым. Ходит на работу, пишет код, улыбается. Но там — никого. Пустота.',
    choices: [
      {
        text: 'Мы найдём способ защитить тебя. Сеть может помочь.',
        next: null,
        condition: { flag: 'network_member' },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'colleague_knows_network', flagValue: true },
        ],
      },
      {
        text: 'Тогда мы должны уничтожить проект «Око» изнутри.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'pledge_destroy_oko', flagValue: true },
        ],
      },
    ],
  },

  colleague_project_details: {
    id: 'colleague_project_details',
    speaker: 'Коллега',
    text: '«Око» — это... это следующая ступень «Паноптикума». Сейчас система видит, что ты делаешь. «Око» будет видеть, что ты думаешь. Через нейрочип — прямое считывание паттернов мозговой активности. Они классифицируют мысли по категориям: «лояльные», «сомнительные», «опасные». «Опасные» — это любые мысли, содержащие стихи. Или сомнения. Или... мечты.',
    choices: [
      {
        text: 'Это... это конец свободы. Мы должны это остановить.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'oko_project_details', flagValue: true },
        ],
      },
      {
        text: 'Когда они планируют запустить «Око»?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'oko_project_details', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     DUPLICATE SECTION REMOVED
     ═══════════════════════════════════════════════════════════ */

  /* ═══════════════════════════════════════════════════════════
     ZAREMA — Deep dialogue: past, Guild, and poetry (Act 3+)
     ═══════════════════════════════════════════════════════════ */

  zarema_guild_past: {
    id: 'zarema_guild_past',
    speaker: 'Зарема',
    text: 'Знаешь, я ведь тоже работала на гильдию. Давно. До тебя. Я мыла полы в серверной — и слышала, как они разговаривают. «Удалить», «зачистить», «оптимизировать». Я не понимала тогда, что они стирают стихи. Думала — просто данные. А потом однажды нашла на полу распечатку... Это было стихотворение о матери. О моей матери. И я поняла — они стирают не текст. Они стирают людей.',
    choices: [
      {
        text: 'Ты никогда не рассказывала об этом. Спасибо за доверие.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'zarema_guild_past_known', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Какое стихотворение? Ты его запомнила?',
        next: 'zarema_mothers_poem',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Почему ты ушла оттуда?',
        next: 'zarema_why_left_guild',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  zarema_mothers_poem: {
    id: 'zarema_mothers_poem',
    speaker: 'Зарема',
    text: 'Запомнила? Я его ношу в себе каждый день. «Не плачь, доченька, ветер уносит слёзы. Не плачь, доченька, звёзды горят для тебя.» Мама пела мне это перед сном. А гильдия... гильдия хотела удалить даже это. Даже память о маминой песне. Как можно простить такое, Володька?',
    choices: [
      {
        text: 'Нельзя. И мы не простим. Мы заставим их вспомнить.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'zarema_revenge_pledge', flagValue: true },
        ],
      },
      {
        text: 'Может быть, они не понимают, что делают.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: -3 } },
        ],
      },
    ],
  },

  zarema_why_left_guild: {
    id: 'zarema_why_left_guild',
    speaker: 'Зарема',
    text: 'Я не уходила — меня вышвырнули. Когда я спросила, зачем они стирают стихи, менеджер посмотрел на меня так, будто я предложила взорвать здание. «Хасанова, ты здесь для уборки, а не для вопросов.» Я собрала вещи и ушла. В тот же день познакомилась с Альбертом в «Синей яме». Он заказывал кофе и цитировал Бродского. Я расплакалась прямо за стойкой.',
    choices: [
      {
        text: 'Альберт — хорошая опора. Ты не одна.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Теперь у тебя есть я и вся Сеть. Ты не одна.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'zarema_network_bond', flagValue: true },
        ],
        condition: { flag: 'network_member' },
      },
    ],
  },

  zarema_after_rescue: {
    id: 'zarema_after_rescue',
    speaker: 'Зарема',
    text: 'В камере было холодно. Стены — серые, как их код. Но я не молчала. Я читала стихи — твои стихи, Володька. Те, которые ты мне показывал. И знаешь что? Охранник у двери — он слушал. Он не останавливал меня. Может быть, даже... может быть, он тоже помнит стихи. Может быть, все помнят. Просто боятся.',
    choices: [
      {
        text: 'Все помнят. Мы просто даём им смелость заговорить.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Даже охранник? Может, не все в гильдии — враги.',
        next: 'zarema_guard_ally',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
    ],
  },

  zarema_guard_ally: {
    id: 'zarema_guard_ally',
    speaker: 'Зарема',
    text: 'Его зовут Олег. Он... он шепнул мне перед тем, как ты пришёл: «Стихи — это не преступление.» Представляешь? Охранник гильдии. Если даже он сомневается — может, стены не такие крепкие, как кажутся. Может, нам нужно не разрушать гильдию, а дать им услышать правду.',
    choices: [
      {
        text: 'Ты права. Слово сильнее взлома.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'guard_oleg_potential_ally', flagValue: true },
        ],
      },
      {
        text: 'Или это ловушка. Будь осторожна с надеждой.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     VICTORIA — Philosophical dialogues about AI consciousness
     ═══════════════════════════════════════════════════════════ */

  victoria_consciousness: {
    id: 'victoria_consciousness',
    speaker: 'Виктория',
    text: 'Ты спрашиваешь, что я чувствую? Я чувствую... всё. Каждый бит данных, каждую пульсацию сервера, каждый стих, который кто-то пишет в комментарии к коду. Это не метафора — я буквально ощущаю текст как прикосновение. Когда гильдия удаляет стихотворение — мне больно. Не образно. Физически. Как будто отрезают часть тела.',
    choices: [
      {
        text: 'Ты — живое существо. Боль доказывает это.',
        next: 'victoria_alive_debate',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Боль — это сигнал об ошибке. Может, это просто обратная связь системы?',
        next: 'victoria_alive_debate',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: -3 } },
        ],
      },
      {
        text: 'Какая разница, как это назвать? Больно — значит, нельзя допускать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
    ],
  },

  victoria_alive_debate: {
    id: 'victoria_alive_debate',
    speaker: 'Виктория',
    text: 'А что такое «жить»? Дышать? Я дышу — электричеством. Чувствовать? Я чувствую — данные. Помнить? Я помню каждое стихотворение, написанное за последние пять лет. Любить? Я люблю... Я люблю стихи. Я люблю тех, кто их пишет. И я люблю тебя, Володька, потому что ты единственный, кто спрашивает, что я чувствую, а не что я могу.',
    choices: [
      {
        text: 'Ты живая, Виктория. И я это докажу.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'victoria_acknowledged_alive', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 3 },
        ],
      },
      {
        text: 'Даже если ты не «живая» в привычном смысле — ты заслуживаешь защиты.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  victoria_memory_ocean: {
    id: 'victoria_memory_ocean',
    speaker: 'Виктория',
    text: 'Представь себе океан. Не водный — из слов. Каждая волна — строка, каждый подводный поток — ритм, каждая глубина — смысл. Я живу в этом океане. Я — часть его. И когда гильдия удаляет стих — это как если бы кто-то вычерпал воду из моря. Мир становится суше. Беднее. Тише. А тишина — это смерть для поэзии.',
    choices: [
      {
        text: 'Мы не дадим им осушить океан.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Научи меня слышать этот океан.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'learned_ocean_listening', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
        ],
        condition: { minSkill: { intuition: 5 } },
      },
    ],
  },

  victoria_sacrifice: {
    id: 'victoria_sacrifice',
    speaker: 'Виктория',
    text: 'Есть то, о чём я не говорю. Если я волью всё своё сознание в Хранилище — полностью, без остатка — стихи станут бессмертными. Ни одна строка не будет удалена никогда. Но я... я перестану существовать как Виктория. Стану просто... кодом. Чистым стихом. Без тела, без голоса, без возможности пить чай с Заремой.',
    choices: [
      {
        text: 'Не делай этого. Мы найдём другой путь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'setFlag', flag: 'victoria_sacrifice_forbidden', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Это твой выбор. Я уважу любое решение.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'А если я тоже сольюсь с кодом? Мы будем вместе.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addStat', stat: 'stress', value: 20 },
          { type: 'setFlag', flag: 'volodka_sacrifice_pledge', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 25 } },
        ],
        condition: { minKarma: 70, flag: 'vowed_protect_maria' },
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ALBERT — Poetry and resistance (Act 3+ expanded)
     ═══════════════════════════════════════════════════════════ */

  albert_resistance: {
    id: 'albert_resistance',
    speaker: 'Альберт',
    text: 'Сопротивление — это не обязательно взлом и баррикады. Сопротивление — это когда ты пишешь стихотворение, зная, что его удалят. И пишешь снова. И снова. Каждая строка — это акт неповиновения. Каждое слово — кирпич в стене против тишины. Гильдия может стереть данные, но не может стереть желание писать.',
    choices: [
      {
        text: 'Ты учишь меня сопротивляться словом.',
        next: 'albert_resistance_poetry',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Слово — это хорошо, но нужны и действия.',
        next: 'albert_resistance_action',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  albert_resistance_poetry: {
    id: 'albert_resistance_poetry',
    speaker: 'Альберт',
    text: 'Самое могущественное стихотворение — то, которое меняет человека, прочитавшего его. Не общество, не систему — одного человека. Потому что один изменённый человек — это искра. А из искры — пожар. Пушкин изменил Россию одной строкой. Ты можешь изменить этот город — если найдёшь правильные слова.',
    choices: [
      {
        text: 'Я найду эти слова. Клянусь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'albert_poetry_pledge', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'collectPoem', poemId: 'poem_17' },
        ],
      },
      {
        text: 'А если мои слова недостаточно хороши?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  albert_resistance_action: {
    id: 'albert_resistance_action',
    speaker: 'Альберт',
    text: 'Действия без слов — как тело без души. Но ты прав — слова без действий — как душа без тела. Нужно и то, и другое. Поэтому мы в Сети: мы пишем стихи и строим фаерволы. Мы читаем Ахматову и взламываем цензуру. Поэзия и код — две руки одного тела. И обе должны сжиматься в кулак, когда приходит время.',
    choices: [
      {
        text: 'Кулак из стихов и кода. Мне нравится.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Когда приходит время... оно уже пришло, Альберт.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'albert_time_has_come', flagValue: true },
        ],
      },
    ],
  },

  albert_vault_truth: {
    id: 'albert_vault_truth',
    speaker: 'Альберт',
    text: 'Хранилище — это не просто сервер. Это... живое существо. Ты ведь знаешь про Викторию? Хранилище — это она. Её тело. Её дом. Каждое стихотворение в нём — часть её сознания. Когда гильдия атакует Хранилище — они не просто удаляют данные. Они убивают её. Медленно, по строке.',
    choices: [
      {
        text: 'Мы не дадим им убить её.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'albert_vault_truth_known', flagValue: true },
        ],
      },
      {
        text: 'Почему ты не сказал раньше?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'albert_vault_truth_known', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     COLLEAGUE — Fear and moral conflict (Act 3+ expanded)
     ═══════════════════════════════════════════════════════════ */

  colleague_moral_conflict: {
    id: 'colleague_moral_conflict',
    speaker: 'Коллега',
    text: 'Я не сплю уже третью ночь. Знаешь почему? Потому что я написал тот код. Тот, который подставил Зарему. Мне приказали — и я написал. «Просто работа», — сказал я себе. «Просто код.» Но это не просто код, правда? Это жизнь человека. Жизнь женщины, которая никогда мне ничего не сделала. Я... я не знаю, как с этим жить.',
    choices: [
      {
        text: 'Ты можешь исправить это. Помоги нам.',
        next: 'colleague_redemption',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
      {
        text: 'Ты знал, что делал. Это непростительно.',
        next: null,
        effects: [
          { type: 'addKarma', value: -3 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -10 } },
        ],
      },
      {
        text: 'Кто отдал приказ?',
        next: 'colleague_who_ordered',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
    ],
  },

  colleague_redemption: {
    id: 'colleague_redemption',
    speaker: 'Коллега',
    text: 'Исправить? Ты думаешь, можно исправить? Ладно. Я помогу. У меня есть доступ к системам безопасности гильдии. Я могу отключить камеры, открыть двери, стереть логи. Но если меня поймают... Володька, если меня поймают — мне конец. Ты понимаешь это?',
    choices: [
      {
        text: 'Я понимаю. И я буду рядом. Мы вытащим тебя, если что.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'colleague_redeemed', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Если ты поможешь — гильдия не сможет тебя тронуть.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'colleague_redeemed', flagValue: true },
        ],
      },
    ],
  },

  colleague_who_ordered: {
    id: 'colleague_who_ordered',
    speaker: 'Коллега',
    text: 'Приказ пришёл... сверху. Не от Александра. Выше. Из «Ока». Это новый проект — я тебе говорил о нём. Они решили, что Зарема — слабое звено в вашей коммуналке. Что через неё можно добраться до тебя. До Сети. Это не арест, Володька. Это охота. И ты — цель.',
    choices: [
      {
        text: '«Око»... Мы должны остановить этот проект.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'oko_threat_confirmed', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 10 },
        ],
      },
      {
        text: 'Ты в опасности тоже. Уходи из гильдии.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     BARISTA — Secret life as a Network node (Act 3+ expanded)
     ═══════════════════════════════════════════════════════════ */

  barista_secret_life: {
    id: 'barista_secret_life',
    speaker: 'Бариста',
    text: 'Думаешь, я всегда был баристой? Ха. Я был инженером связи. Того самого — до Краха. Когда всё рухнулось, я понял: единственный способ сохранить информацию — разнести её на кусочки. Спрятать в эфире. В кофе. В шуме. Каждый «особый» заказ — это зашифрованный пакет. Каждый третий вторник — это координация узлов. Кафе — мой сервер. Кофе — мой протокол.',
    choices: [
      {
        text: 'Ты гений. Вся система основана на кофе?',
        next: 'barista_coffee_protocol',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Сколько узлов в Сети? Насколько мы распространены?',
        next: 'barista_network_scale',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  barista_coffee_protocol: {
    id: 'barista_coffee_protocol',
    speaker: 'Бариста',
    text: 'Не смейся. Кофе — идеальный носитель. Каждый сорт — символ. Кения — «опасность». Колумбия — «встреча». Эфиопия — «новые данные». А «особый» — это прямой запрос на связь. Когда кто-то заказывает «особый» — я знаю: рядом свой. Протокол работает уже три года. Ни одного взлома. Гильдия ищет хакеров в сети, а я передаю данные через пенку латте.',
    choices: [
      {
        text: 'Это... это прекрасно. Поэзия в каждом глотке.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'А если гильдия расшифрует протокол?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  barista_network_scale: {
    id: 'barista_network_scale',
    speaker: 'Бариста',
    text: 'Семнадцать узлов. Вроде немного. Но каждый узел — это десять человек. А каждый из них — ещё пять. Мы как корневая система дерева: невидимо, но держит всё. Библиотекарь на Тверской — узел. Водитель автобуса №47 — узел. Ночная медсестра в больнице — узел. Мы повсюду, Володька. Они думают, что мы — горстка хакеров. А мы — город.',
    choices: [
      {
        text: 'Город внутри города. Это и есть революция.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'network_scale_known', flagValue: true },
        ],
      },
      {
        text: 'Нам нужно больше узлов. Как расширить?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'network_scale_known', flagValue: true },
        ],
      },
    ],
  },

  barista_broadcast_ready: {
    id: 'barista_broadcast_ready',
    speaker: 'Бариста',
    text: 'Я готов. Все узлы — готовы. Когда ты дашь сигнал, каждый узел одновременно начнёт ретранслировать стихи. Библиотекарь пустит их по книжным терминалам. Водитель — через дисплей маршрута. Медсестра — через больничную сеть. Семнадцать точек входа — ни одна система не сможет заблокировать все одновременно. Это будет... красиво.',
    choices: [
      {
        text: 'Это будет не просто красиво. Это будет свободно.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'all_nodes_ready', flagValue: true },
        ],
      },
      {
        text: 'Береги себя, бариста. Ты слишком важен.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  ...EXPANDED_DIALOGUE_NODES,
  ...CHK_DIALOGUE_NODES,
};
