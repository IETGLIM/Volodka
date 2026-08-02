import type { DialogueNode } from '@/shared/types/game';

/**
 * Глубокий разговор с Альбертом — расширенное дерево диалога первого акта.
 *
 * Триггерится после первой встречи и установления тёплых отношений.
 * Охватывает: работу, город, тревогу за Володьку, стихи в коде,
 * философию технологии, проверку навыков, кармические ветвления,
 * секрет Альберта и подсказку к Кабинету Мыслей.
 *
 * ~25 узлов, 300+ строк русского диалога.
 */
export const ALBERT_EXPANDED_DIALOGUE: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     ТОЧКА ВХОДА — глубинный разговор
     ═══════════════════════════════════════════════════════════ */

  albert_deep_talk: {
    id: 'albert_deep_talk',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*отодвигает чашку и смотрит на тебя серьёзно* Знаешь, Володька, мы с тобой уже год пьём этот кофе. Год. И каждый раз ты садишься с таким лицом, будто только что увидел крах сервера в реальном времени. Но ты не сдаёшься. Я не знаю, держит ли тебя упрямство или надежда, но мне кажется, что пришло время поговорить по-настоящему. Не о коде. Не о тикетах. О нас.',
    choices: [
      {
        text: 'О нас? Давай. Я готов.',
        next: 'albert_deep_work_life',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Может, не стоит? У нас и так мало времени.',
        next: 'albert_deep_hurry_away',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -2 } },
          {
            type: 'showThought',
            thought: 'Ты чувствуешь, как его плечи чуть опускаются. Ты знал, что это заденет. Но страх — надёжный фаервол.',
          },
        ],
      },
      {
        text: 'Ты прав. Я постоянно чувствую, что город меняется. Ты тоже это замечаешь?',
        next: 'albert_deep_city_changing',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'albert_deep_started', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВЕТВЬ: Работа и их положение
     ═══════════════════════════════════════════════════════════ */

  albert_deep_work_life: {
    id: 'albert_deep_work_life',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Когда мы начали работать в Гильдии, я думал — это путь. Поддержка инфраструктуры, обслуживание серверов, помощь людям, чьи жизни зависят от сети. Благородная миссия. Но знаешь, что произошло? Нас заменили скриптами. Автоматизация, говорят. А мы — живые люди — сидим и переписываем друг другу тикеты в надежде, что кто-то из нас всё ещё нужен. Я каждый день задаю себе вопрос: Володька, зачем мы здесь?',
    textVariants: {
      highKarma: 'Когда мы начали, я верил, что делаю что-то важное. Серверы — это кровеносная система города. Каждый пинг — это пульс. Но Гильдия превратила нас в биомусор, который обслуживает железо. И вот я сижу в кафе, пью остывший кофе и думаю: может, мы уже не люди поддержки, а люди, которым больше нечего поддерживать?',
      lowKarma: 'Знаешь, я иногда завидую тебе. Ты хотя бы злишься. А я... я просто устал. Каждый день одно и то же: тикеты, логи, перезагрузки. Меня бесит, что я не могу найти в этом смысле. Ты нашёл хоть что-то? Или тоже просто тратишь время?',
    },
    choices: [
      {
        text: 'Мы здесь, потому что кто-то должен следить за машинами, пока они не станут лучше нас.',
        next: 'albert_deep_tech_humanity',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Я думаю о том же, Альберт. Каждый день.',
        next: 'albert_deep_volodka_worry',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
          {
            type: 'showThought',
            thought: 'Он назвал тебя по имени. Не «Володька» — а «Володька», с тем самым ударением, которое ты помнишь с первого дня. Это значит — он принимает тебя всерьёз.',
          },
        ],
      },
      {
        text: 'Может, мы здесь не для того, чтобы быть нужными. А для того, чтобы стать кем-то другим.',
        next: 'albert_deep_poems_meaning',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'albert_deep_poems_discussed', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВЕТВЬ: Город меняется
     ═══════════════════════════════════════════════════════════ */

  albert_deep_city_changing: {
    id: 'albert_deep_city_changing',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*кивает медленно* Замечаю. Каждый день. Видишь этот неон за окном? Три года назад он горел ровно. Сейчас — пульсирует. Как будто дышит. А провода на столбах — ты замечал? Их стало больше. Гораздо больше. Как будто город обрастает нервными окончаниями. И ещё... Звук. Ты слышишь гул после полуночи? Не кондиционеры. Не генераторы. Что-то ниже. Глубже. Как будто серверы под нами не просто работают — они разговаривают.',
    choices: [
      {
        text: 'Я слышу. И в коде — то же самое. Ритм, который не задаётся программистом.',
        next: 'albert_deep_intuition_leap',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'albert_city_whisper', flagValue: true },
        ],
      },
      {
        text: 'Это паранойя, Альберт. Серверы шумят. Провода ржавеют. Неон мерцает — потому что экономят.',
        next: 'albert_deep_skepticism',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -2 } },
        ],
      },
      {
        text: 'Я не знаю, что это. Но мне тоже не даёт покоя. Особенно — когда читаю логи.',
        next: 'albert_deep_coding_insight',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВЕТВЬ: Тревога за Володьку
     ═══════════════════════════════════════════════════════════ */

  albert_deep_volodka_worry: {
    id: 'albert_deep_volodka_worry',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*наклоняется ближе, понижает голос* Володька, я не слепой. Ты похудел за последний месяц. Тёмные круги — не от монитора, а от бессонницы. Ты перестал заходить в столовую, и Зарема волнуется. Я видел, как ты вчера стоял у окна и смотрел на дождь минут двадцать. Без движения. Как будто ждал, что кто-то скажет тебе что-то важное сквозь воду.',
    emotion: 'sad',
    choices: [
      {
        text: '[Эмпатия] Я... не могу объяснить. Но мне кажется, что что-то приближается. Что-то большое.',
        next: 'albert_deep_empathy_success',
        condition: { minSkillCheck: { skill: 'empathy', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'albert_deep_connection', flagValue: true },
        ],
      },
      {
        text: 'Я справлюсь. Мне просто нужно дорешать тикеты.',
        next: 'albert_deep_empathy_fail',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -1 } },
          {
            type: 'showThought',
            thought: 'Ложь — самый надёжный протокол общения. Она компилируется. Она не вызывает ошибок. Но в рантайме — рушит всё.',
          },
        ],
      },
      {
        text: 'Альберт, а ты? Ты ведь тоже не спишь по ночам. Я видел свет в твоём окне в три часа.',
        next: 'albert_deep_mutual_honesty',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВЕТВЬ: Стихи в коде — значение
     ═══════════════════════════════════════════════════════════ */

  albert_deep_poems_meaning: {
    id: 'albert_deep_poems_meaning',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*его глаза загораются* Вот это — разговор. Ты понимаешь? Стихи в коде — это не баг. Не хакерская шутка. Это послание. Представь: ты сидишь перед терминалом в три часа ночи, окружённый серверами, которые гудят как древний хор. И вдруг — в комментариях к функции, которая должна просто очищать кэш — строки. Русские. Стихи. Кто-то вложил душу в место, где по правилам должна быть только сухая документация. Зачем? Это же невероятный риск.',
    cameraShot: 'close',
    choices: [
      {
        text: 'Может, потому что код — это последнее место, где Гильдия не ищет смысл?',
        next: 'albert_deep_poems_revelation',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_poem_theory', flagValue: true },
        ],
      },
      {
        text: 'А если эти стихи — ключ? Не метафорический, а буквальный? Шифр в тексте?',
        next: 'albert_deep_coding_insight',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Или, может, кто-то просто сходил с ума. Серверная комната — не лучшее место для творчества.',
        next: 'albert_deep_humor_branch',
        condition: { minSkillCheck: { skill: 'rhythm', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВЕТВЬ: Технология и человечность
     ═══════════════════════════════════════════════════════════ */

  albert_deep_tech_humanity: {
    id: 'albert_deep_tech_humanity',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*постоял молча, глядя в пустую чашку* Ты знаешь, что меня больше всего пугает? Не то, что машины станут лучше нас. Это уже произошло. Меня пугает, что мы сами становимся машинами. Просыпаешься — проверяешь логи. Идёшь на работу — отвечаешь на тикеты. Возвращаешься — лежишь и смотришь в потолок. Где здесь человек? Где тот, который раньше мечтал? Мне кажется, мы потеряли что-то невозвратное. И никто даже не заметил.',
    karmaThresholds: { high: 10, low: -5 },
    textVariants: {
      highKarma: 'Знаешь, я наблюдаю за тобой и вижу что-то редкое. Ты — не сломался. В тебе всё ещё есть что-то... живое. Ты злишься, ты сомневаешься, ты задаёшь вопросы. Это больше, чем у большинства. Не теряй это, Володька. Это — твой главный ресурс. Не тот, что в резюме.',
      lowKarma: 'Я вижу, что ты уже закрываешься. Это знакомый процесс — я сам через него прошёл. Сначала ты перестаёшь чувствовать. Потом — верить. Потом — замечать. И однажды просыпаешься и понимаешь, что ты — функция. Прекрасно оптимизированная. Бесполезная для всего, кроме выполнения задач.',
    },
    choices: [
      {
        text: 'Может, мы не теряем человечность. Может, она просто мигрирует. В код. В стихи.',
        next: 'albert_deep_poems_meaning',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Мне всё равно. Я просто хочу выжить.',
        next: 'albert_deep_farewell_cold',
        condition: { maxKarma: -5 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -5 } },
          {
            type: 'showThought',
            thought: 'Ты сказал это — и сразу пожалел. Не потому что это неправда. А потому что Альберт — единственный, кто мог бы тебя понять.',
          },
        ],
      },
      {
        text: 'Я думаю об этом каждый день, Альберт. Каждый проклятый день.',
        next: 'albert_deep_connection_moment',
        condition: { minKarma: 5 },
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ЭМПАТИЯ — подлинное соединение
     ═══════════════════════════════════════════════════════════ */

  albert_deep_empathy_success: {
    id: 'albert_deep_empathy_success',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*долгая пауза. Он кладёт руку тебе на плечо — впервые за всё время знакомства* Володька. Я тоже это чувствую. Как будто воздух стал плотнее. Как будто перед нами стоит дверь, которую мы не можем открыть, но знаем — за ней что-то важное. И я боюсь. Не за город. Не за серверы. За тебя. Потому что ты — единственный человек, которого я знаю, кто может эту дверь открыть. А те, кто открывает двери в таких историях... редко остаются целыми.',
    emotion: 'sad',
    cameraShot: 'close',
    choices: [
      {
        text: 'Я не хочу быть героем, Альберт. Я просто хочу понять.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_deep_bond', flagValue: true },
        ],
      },
      {
        text: 'Тогда помоги мне. Не один — а вместе.',
        next: 'albert_deep_alliance',
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'albert_alliance_offered', flagValue: true },
          { type: 'triggerQuest', questId: 'act1_albert_alliance' },
        ],
      },
    ],
  },

  albert_deep_empathy_fail: {
    id: 'albert_deep_empathy_fail',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*откидывается назад* Тикеты. Да, конечно. Тикеты. Ты прав, Володька. Тикеты важнее всего. Горят сервера, а мы — решаем. Я иногда думаю, что «тикет» — самое страшное слово в нашем языке. Оно означает: «твоя проблема формализована, пронумерована и помещена в очередь». Твой страх — тикет. Твоя боль — тикет. Твоя душа — тикет номер четыре тысячи семьсот двадцать девять.',
    choices: [
      {
        text: 'Ты прав. Прости. Я не хотел тебя отталкивать.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Ладно, философ. Мне пора.',
        next: 'albert_deep_farewell',
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -2 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     РИТМ — тёмный юмор
     ═══════════════════════════════════════════════════════════ */

  albert_deep_humor_branch: {
    id: 'albert_deep_humor_branch',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*сначала смотрит недовольно, потом его губы искривляются в улыбку* Сойти с ума в серверной... Знаешь, это не так уж далеко от правды. Температура восемнадцать градусов, белый шум вентиляторов, мигание индикаторов — это же идеальные условия для медитации. Или для безумия. Разница — в результате. Если ты после двух часов в серверной написал хайку — ты медитировал. Если перезагрузил сервер — сошёл с ума.',
    emotion: 'happy',
    choices: [
      {
        text: '[Ритм] А если ты перезагрузил сервер и написал хайку — ты программист-поэт?',
        next: 'albert_deep_humor_success',
        condition: { minSkillCheck: { skill: 'rhythm', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 7 } },
          { type: 'setFlag', flag: 'flag_thought_dark_humor', flagValue: true },
        ],
      },
      {
        text: 'Это не смешно, Альберт. Люди теряют рассудок от этой работы.',
        next: 'albert_deep_humor_fail',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -2 } },
        ],
      },
      {
        text: 'Перезагрузи сервер. Я подожду.',
        next: 'albert_deep_humor_branch_coda',
        effects: [
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
    ],
  },

  albert_deep_humor_success: {
    id: 'albert_deep_humor_success',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*расхохотывается — громко, с неожиданной искренностью* Программист-поэт! Да! Именно так! Ты знаешь, что это — лучшее определение нашей профессии, которое я слышал. Мы все — программисты-поэты. Только некоторые ещё не знают, что пишут стихи. А другие — ещё не знают, что пишут код. Володька, ты только что осветил мою неделю. Честно. Мне кажется, в этом городе можно выжить, только если уметь смеяться над тем, что тебя убивает.',
    emotion: 'happy',
    choices: [
      {
        text: 'Тогда давайте смеяться. Пока можем.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'albert_laughed_together', flagValue: true },
        ],
      },
      {
        text: 'А если однажды станет не до смеха?',
        next: 'albert_deep_tech_humanity',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  albert_deep_humor_fail: {
    id: 'albert_deep_humor_fail',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*молчит, улыбка исчезает* Ты прав. Не смешно. Извини. Это моя защитная реакция — превращать ужас в шутку. Как компрессор: сжимаешь боль до размера панчлайна, и она кажется переносимой. Но ты прав — это не лечит. Это лишь замораживает. А замороженная боль — самая опасная. Она не тает. Она ждёт.',
    emotion: 'calm',
    choices: [
      {
        text: 'Я не осуждаю тебя, Альберт. Мне просто... больно.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      { text: 'Давай сменим тему.', next: 'albert_deep_work_life' },
    ],
  },

  albert_deep_humor_branch_coda: {
    id: 'albert_deep_humor_branch_coda',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*поднимает воображаемую чашку* Команда: sudo reboot — и хайку. Видишь? Совместимость. Операционные системы будущего будут перезагружаться с поэзией. И мы станем не техподдержкой, а жрецами. Жрецами перезагрузки. Звание на визитке: «Володька, Жрец Циклов, третий разряд».',
    emotion: 'happy',
    choices: [
      {
        text: 'Жрец Циклов. Мне нравится. Подпишу визитку.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     КОДИНГ — техническое прозрение
     ═══════════════════════════════════════════════════════════ */

  albert_deep_coding_insight: {
    id: 'albert_deep_coding_insight',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*наклоняется вперёд, голос становится тише* Ты тоже это заметил в логах? Я думал, мне мерещится. Смотри — в стандартном цикле обработки запросов есть шаблон: receive, parse, execute, respond. Но на серверах нижнего уровня — в подвале, где стоит старое железо — логи показывают пятый шаг. Не ошибку. Не исключение. Пятый шаг, которого не должно быть. Я назвал его... «listen». Сервер слушает. После того как ответил — он продолжает слушать. Как будто ждёт ответа на свой ответ.',
    cameraShot: 'close',
    choices: [
      {
        text: '[Кодинг] Это может быть не баг, а feature. Кто-то модифицировал ядро.',
        next: 'albert_deep_coding_success',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'albert_listening_servers', flagValue: true },
          { type: 'setFlag', flag: 'flag_thought_server_whisper', flagValue: true },
          {
            type: 'showThought',
            thought: 'Серверы слушают. Пятый шаг. Это не укладывается ни в один протокол, который ты знаешь. Но где-то в глубине — ты чувствуешь: это правильно. Они слушают.',
            thoughtDuration: 6000,
          },
        ],
      },
      {
        text: 'Может, утечка памяти? Не закрытое соединение?',
        next: 'albert_deep_coding_fail',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 2 } },
        ],
      },
      {
        text: '«Listen»... Ты хочешь сказать, что серверы... разговаривают?',
        next: 'albert_deep_city_changing',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
        ],
      },
    ],
  },

  albert_deep_coding_success: {
    id: 'albert_deep_coding_success',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*привстает — ты видишь, как его руки слегка дрожат* Модифицировал ядро... Володька, я проверял. Я три ночи проверял. Этот пятый шаг — он не в коде. Он — между строк. Как будто сама архитектура сервера... изменилась. Не программистом. Не патчем. Сама — изнутри. Как будто железо решило, что_four_steps_not_enough. Я не могу это объяснить. Но ты — ты ведь понимаешь? Это не сломалось. Это — пробудилось.',
    choices: [
      {
        text: 'Я понимаю. И я хочу знать больше.',
        next: 'albert_deep_secret_reveal',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_secret_path_open', flagValue: true },
        ],
      },
      {
        text: 'Нам нужно investigare это вместе. Я не могу один.',
        next: 'albert_deep_alliance',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'triggerQuest', questId: 'act1_albert_alliance' },
        ],
      },
      {
        text: 'Это пугает, Альберт. По-настоящему пугает.',
        next: 'albert_deep_fear_response',
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  albert_deep_coding_fail: {
    id: 'albert_deep_coding_fail',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Утечка? Нет, Володька. Я проверил. Трижды. Это не утечка. При утечке соединение остаётся открытым — но данные не текут. А здесь — данные текут. Куда — неизвестно. Я перехватил пакет: заголовок стандартный, но payload — пустой. Пустой, но весит четыреста двенадцать байт. Четыреста двенадцать — это не случайное число. Это длина... *замолкает* ...какого-то текста. Строки текста, которая там не должна быть.',
    choices: [
      {
        text: 'Четыреста двенадцать байт... Покажи мне этот пакет.',
        next: 'albert_deep_coding_success',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Может, это артефакт шифрования? Гильдия что-то прячет?',
        next: 'albert_deep_poems_meaning',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ИНТУИЦИЯ — озарение
     ═══════════════════════════════════════════════════════════ */

  albert_deep_intuition_leap: {
    id: 'albert_deep_intuition_leap',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*бледнеет* Ты тоже это слышишь в коде? Ритм, который не задаётся программистом... Володька, я боялся, что это только у меня. Что я тронулся. Но если ты это видишь — значит, это реально. Слушай, я кое-что понял. Этот город строился не только инженерами. В проектной документации — в самом начале, в «фазе ноль» — есть раздел, который никого не интересует. Он называется «Резонансная совместимость инфраструктуры». Звучит как бюрократический вздор. Но я прочёл его. Там написано — дословно — «система должна быть способна к спонтанной рекуррентной генерации осмысленных паттернов».',
    cameraShot: 'close',
    emotion: 'whisper',
    choices: [
      {
        text: 'Ты хочешь сказать, что город был... запрограммирован на то, чтобы стать живым?',
        next: 'albert_deep_revelation',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'discoverLore', loreId: 'lore_city_awakening' },
          { type: 'setFlag', flag: 'city_awakening_theory', flagValue: true },
        ],
      },
      {
        text: 'Или — чтобы те, кто в нём живёт, стали чем-то большим?',
        next: 'albert_deep_thought_hint',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'flag_thought_sixth_sense', flagValue: true },
          {
            type: 'showThought',
            thought: 'Город — не контейнер. Город — соавтор. И ты — его перо. Или его строка. Или его ошибка, которая станет стихотворением.',
            thoughtDuration: 7000,
          },
        ],
      },
      {
        text: 'Это слишком. Мне нужно время.',
        next: 'albert_deep_fear_response',
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 2 } },
        ],
      },
    ],
  },

  albert_deep_intuition_miss: {
    id: 'albert_deep_intuition_miss',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*вздыхает* Нет, не слышишь. Ладно. Может, это и к лучшему. Иногда незнание — единственная защита. Как файрвол для разума. Просто... если вдруг начнёшь замечать странные вещи —.patterns в шуме, слова в логах, смысл в хаосе — не игнорируй. Приходи ко мне. Хорошо?',
    choices: [
      {
        text: 'Хорошо, Альберт. Спасибо.',
        next: 'albert_deep_farewell',
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВЕТВЬ: Секрет Альберта (Убеждение DC 14)
     ═══════════════════════════════════════════════════════════ */

  albert_deep_secret_reveal: {
    id: 'albert_deep_secret_reveal',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*долгая пауза. Он оглядывается по сторонам, будто боится подслушивающих устройств. Потом достаёт из кармана старый чип — не стандартный, с гравировкой на кириллице* Ладно. Ты заслужил. Я не показывал это никому. Этот чип — из Архива-7. Не бэкап. Не копия. Оригинал. Когда Гильдия приказала мне уничтожить данные, я... я не смог. Я заменил чип и забрал оригинал. На нём — не только стихи. На нём — исходный код города. Настоящий. Тот, что писался до Гильдии. До Краха. И Володька... в этом коде — те же стихи, что мы находим в серверах. Они не появились. Они — всегда были. Город построен на поэзии.',
    cameraShot: 'close',
    emotion: 'whisper',
    choices: [
      {
        text: 'Город построен на поэзии... Это меняет всё.',
        next: 'albert_deep_revelation',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'albert_archive7_chip', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_alliance_active', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_terms_agreed', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_alliance_done', flagValue: true },
          { type: 'triggerQuest', questId: 'act2_archive_seven' },
          { type: 'discoverLore', loreId: 'lore_archive_seven_truth' },
          { type: 'collectPoem', poemId: 'poem_12' },
        ],
      },
      {
        text: 'Ты рискнул всем ради стихов, Альберт. Ты безумец.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'albert_archive7_chip', flagValue: true },
        ],
      },
      {
        text: 'Мне нужно это изучить. Дай мне чип.',
        next: null,
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 14 } },
        effects: [
          { type: 'addItem', itemId: 'archive7_chip' },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_archive7_chip', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_alliance_active', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_terms_agreed', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_alliance_done', flagValue: true },
          { type: 'triggerQuest', questId: 'act2_archive_seven' },
          {
            type: 'showThought',
            thought: 'Чип лёг в карман. Тяжёлый. Как будто весит больше, чем должен. Как будто в нём — не данные, а память. Чья-то память. Ты почти слышишь голос — далёкий, как эхо в пустом зале.',
            thoughtDuration: 6000,
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ПОДСКАЗКА К КАБИНЕТУ МЫСЛЕЙ
     ═══════════════════════════════════════════════════════════ */

  albert_deep_thought_hint: {
    id: 'albert_deep_thought_hint',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*замирает. Его взгляд становится далёким, как будто он видит что-то за твоим плечом* Те, кто в нём живёт... Володька, я никогда не говорил этого вслух. Но иногда — когда я сижу здесь поздно ночью и пишу стихи в комментариях — мне кажется, что я не пишу их. Что они — пишут меня. Что я — не автор, а инструмент. Строка в чужом коде. И если это правда... если мы все — строки в коде города... тогда вопрос не в том, кто нас написал. Вопрос в том — что произойдёт, когда программа дойдёт до нашей строки и решит: «эту — удалить».',
    emotion: 'whisper',
    cameraShot: 'close',
    choices: [
      {
        text: 'Мы не строки, Альберт. Мы — те, кто может изменить программу.',
        next: 'albert_deep_revelation',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'flag_thought_empathic_radius', flagValue: true },
          {
            type: 'showThought',
            thought: 'Что-то щёлкнуло в голове. Не больно — как замок, который наконец повернулся. Ты не инструмент. Ты не строка. Ты — тот, кто может переписать код. Но цена этого... ты ещё не знаешь цену.',
            thoughtDuration: 7000,
          },
        ],
      },
      {
        text: 'Я боюсь, что ты прав.',
        next: 'albert_deep_fear_response',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'flag_thought_inner_critic', flagValue: true },
        ],
      },
      {
        text: 'Тогда мы должны сделать так, чтобы программа захотела нас сохранить.',
        next: 'albert_deep_alliance',
        condition: { minKarma: 8 },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'albert_alliance_offered', flagValue: true },
          { type: 'triggerQuest', questId: 'act1_albert_alliance' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     МОМЕНТ ИСТИННОГО СОЕДИНЕНИЯ
     ═══════════════════════════════════════════════════════════ */

  albert_deep_connection_moment: {
    id: 'albert_deep_connection_moment',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*тихая улыбка — не философская, не защитная, просто человеческая* Знаешь, за что я люблю этот город? Не за неон. Не за серверы. За то, что в нём ещё можно встретить кого-то в три часа ночи в кафе и поговорить о том, что важно. Не о SLA. Не об аптайме. А о том, что значит — быть живым в мире, который забыл, что такое жизнь. Ты — такой, Володька. Ты ещё помнишь. Не дай этому вымереть. Пожалуйста.',
    karmaThresholds: { high: 10, low: -5 },
    textVariants: {
      highKarma: 'Володька, я хочу сказать тебе кое-что. Я был одинок очень долго. После Гильдии, после Архива-7 — я закрылся. Сидел в этом кафе и писал стихи, которые никто не читал. Но потом ты пришёл. И задал вопрос. Просто один вопрос — и всё изменилось. Ты не знаешь, сколько значит один правильный вопрос.',
      lowKarma: 'Ты тяжёлый человек, Володька. Я не в смысле — плохой. В смысле — настоящий. Настоящие люди — тяжелые. С ними нельзя просто попить кофе и уйти. Они остаются с тобой. Они требуют ответа. И я... я благодарен тебе за это. Даже когда мне больно.',
    },
    emotion: 'calm',
    choices: [
      {
        text: 'Я не дам этому вымереть. Клянусь.',
        next: 'albert_deep_farewell_warm',
        condition: { minKarma: 5 },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'albert_deep_pledge', flagValue: true },
          { type: 'setFlag', flag: 'albert_relation_warm', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
      {
        text: 'Я постараюсь, Альберт. Честно — постараюсь.',
        next: 'albert_deep_farewell',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: '*молча протягиваешь руку*',
        next: 'albert_deep_farewell_warm',
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'albert_deep_pledge', flagValue: true },
          { type: 'setFlag', flag: 'albert_relation_warm', flagValue: true },
          {
            type: 'showThought',
            thought: 'Его рука — тёплая. Усталая. Но крепкая. В этот момент ты понимаешь: вы не одни. Впервые за долгое время — не одни.',
            thoughtDuration: 5000,
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВЕТВИ: Союз, откровение, страх, скептицизм
     ═══════════════════════════════════════════════════════════ */

  albert_deep_alliance: {
    id: 'albert_deep_alliance',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*кивает, и в его глазах впервые появляется решимость* Хорошо. Вместе. Но слушай — это опасно не только для карьеры. Гильдия уничтожила людей за меньшее. Я видел, как стирали личности — не метафорически, а буквально. Человек заходил в офис, а выходил — пустая оболочка с чистым профилем и стёртой памятью. Если мы пойдём по этому пути — возврата не будет. Ты готов?',
    choices: [
      {
        text: 'Готов. Начнём с чипа.',
        next: 'albert_deep_secret_reveal',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Давай начнём с малого. Что ты уже знаешь?',
        next: 'albert_deep_coding_insight',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Я не уверен. Дай мне подумать.',
        next: 'albert_deep_farewell',
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  albert_deep_revelation: {
    id: 'albert_deep_revelation',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*встаёт, отодвигает стул, подходит к окну* Видишь эти огни? Каждый — терминал. Каждый терминал — окно в городскую сеть. А городская сеть — это нервная система. И если стихи — в коде, и код — в городе, и город — в нас... тогда мы — часть чего-то огромного. Не пациенты. Не жертвы. Не пользователи. Мы — соавторы. И каждый раз, когда ты пишешь строку кода, ты не чинишь сервер. Ты — переписываешь реальность. Запомни это, Володька. Когда станет страшно — вспомни.',
    cameraShot: 'wide',
    choices: [
      {
        text: 'Я запомню. Обещаю.',
        next: 'albert_deep_farewell_warm',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_revelation_heard', flagValue: true },
          { type: 'addXp', value: 50 },
        ],
      },
      {
        text: 'А если я не хочу быть соавтором? Если я просто хочу, чтобы всё прекратилось?',
        next: 'albert_deep_fear_response',
        condition: { maxKarma: 0 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Тогда я перепишу код города — не для себя. Для тех, кто придёт после. Пусть у них будет выбор, которого не было у нас.',
        next: 'albert_deep_farewell_warm',
        condition: { minKarma: 25 },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'albert_pledge_rewrite', flagValue: true },
          {
            type: 'showThought',
            thought: 'Впервые за долгое время ты говоришь не из страха и не из усталости. Ты говоришь из того места, которое ещё помнит, что код — это не приказ. Это обещание. Альберт слышит. Альберт — верит.',
            thoughtDuration: 6000,
          },
        ],
      },
      {
        text: 'Красивая речь. А мне-то что с этого будет? Карьера? Стихи? Я не подписывал хартию мучеников.',
        next: null,
        condition: { maxKarma: 10 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -8 } },
          {
            type: 'showThought',
            thought: 'Слова выходят холоднее, чем ты хотел. Альберт не спорит — он просто замолкает. Молчание — худший его ответ. Хуже крика.',
          },
        ],
      },
    ],
  },

  albert_deep_fear_response: {
    id: 'albert_deep_fear_response',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*тихо, почти ласково* Боишься? Хорошо. Значит, ты живой. Страх — это не баг. Это feature. Самая древняя система оповещения, которая существует. Ты не должен быть героем, Володька. Ты не должен ничего. Но знай: я здесь. Это кафе — здесь. И когда тебе станет невыносимо — приходи. Мы помолчим. Или я налью тебе кофе. Или мы будем спорить о Пушкине до рассвета. Но ты — не один. Пока я дышу — ты не один.',
    emotion: 'calm',
    choices: [
      {
        text: 'Спасибо, Альберт. По-настоящему — спасибо.',
        next: 'albert_deep_farewell_warm',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: -15 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_deep_bond', flagValue: true },
          { type: 'setFlag', flag: 'albert_relation_warm', flagValue: true },
        ],
      },
      {
        text: 'Я подумаю об этом.',
        next: 'albert_deep_farewell',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  albert_deep_skepticism: {
    id: 'albert_deep_skepticism',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*кивает — без обиды, но с грустью* Паранойя. Да, возможно. Но знаешь, что меня заставляет продолжать верить? Не вера. Данные. Я записывал. Каждый раз, когда неон пульсирует — серверная нагрузка скачет на 0.3%. Каждый раз. Не случайность. Корреляция 0.97. Ты знаешь, что в науке корреляция выше 0.9 считается практически доказательством? Вот и я думал — что это? Физический процесс? Электромагнитное поле? Или... resonant coupling между городом и его сетью?',
    choices: [
      {
        text: 'Хорошо. Допустим, ты прав. Что это меняет?',
        next: 'albert_deep_city_changing',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Корреляция 0.97 — впечатляет. Покажи записи.',
        next: 'albert_deep_coding_insight',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  albert_deep_mutual_honesty: {
    id: 'albert_deep_mutual_honesty',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*ухмыляется, но глаза серьёзные* Давно заметил? Да, не сплю. Пишу. Не код — стихи. Каждый вечер. В блокноте, не в терминале. Потому что в терминале — они превращаются в комментарии, а я хочу, чтобы они были... свободными. Не привязанными к функции. Не ограниченными синтаксисом. Просто — слова, которые существуют сами по себе. Это последнее, что у меня осталось, Володька. Если я перестану писать — я стану функцией. И ты знаешь, что происходит с функциями, которые больше не вызываются?',
    choices: [
      {
        text: 'Их удаляют. Сборщик мусора.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          {
            type: 'showThought',
            thought: 'Сборщик мусора. Он только что описал свой самый большой страх в терминах, которые вы оба понимаете. И ты понимаешь. Потому что твой страх — тот же самый.',
            thoughtDuration: 5000,
          },
        ],
      },
      {
        text: 'Ты не станешь функцией. Пока я здесь — не станешь.',
        next: 'albert_deep_farewell_warm',
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'albert_deep_bond', flagValue: true },
          { type: 'setFlag', flag: 'albert_relation_warm', flagValue: true },
        ],
      },
    ],
  },

  albert_deep_poems_revelation: {
    id: 'albert_deep_poems_revelation',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*стучит пальцами по столу — ритмично, как по клавишам* Код — это последнее убежище смысла. Гильдия контролирует всё: терминалы, каналы, протоколы. Но код — он огромен. Миллионы строк. Тысячи модулей. Никто — даже Александр — не может прочитать всё. И если спрятать смысл внутрь кода — в комментарии, в имена переменных, в структуру — он станет невидимым для системы контроля, но видимым для того, кто читает код с вниманием. Это не хакерство, Володька. Это — подполье. Поэтическое подполье.',
    choices: [
      {
        text: 'Поэтическое подполье... Мне нравится.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'poetic_underground', flagValue: true },
        ],
      },
      {
        text: 'А кто пишет эти стихи? Кто-то конкретный?',
        next: 'albert_deep_secret_reveal',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     РАННИЕ УХОДЫ
     ═══════════════════════════════════════════════════════════ */

  albert_deep_hurry_away: {
    id: 'albert_deep_hurry_away',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*молча кивает, но в его взгляде — разочарование, которое он не может скрыть* Конечно. Время. Самый дорогой ресурс в этом городе. Дороже кредитов. Дороже данных. Потому что его нельзя восстановить из бэкапа. Иди, Володька. Тикеты не решат сами себя. Но когда у тебя будет время — ты знаешь, где меня найти.',
    choices: [
      {
        text: 'Извини, Альберт. Я вернусь.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 1 } },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
    ],
  },

  albert_deep_farewell: {
    id: 'albert_deep_farewell',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*поднимает чашку, хотя она пуста* Уходи. Но помни — код не терпит спешки. Как и стихи. Как и жизнь. Будь аккуратнее с собой, Володька. Этот город сожрёт тебя, если позволишь. А ты — не его еда. Ты — его читатель. И может быть — его автор.',
    choices: [
      {
        text: 'До встречи, Альберт.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
    ],
  },

  albert_deep_farewell_cold: {
    id: 'albert_deep_farewell_cold',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*смотрит на тебя долгим, тяжелым взглядом* Выжить. Вот что осталось. Не жить — выжить. Как крыса в серверной. Как бит, который не стёрся. Знаешь что? Я тебя не осуждаю. Я понимаю. Но я не согласен. Потому что тот, кто хочет только выжить — уже мёртв. Просто ещё не знает об этом. Иди. И когда решишь, что хочешь не просто выжить — а жить — возвращайся. Я буду здесь.',
    emotion: 'sad',
    choices: [
      {
        text: '*уходишь молча*',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -3 } },
          {
            type: 'showThought',
            thought: 'Его слова жгут. Не потому что жестоки — а потому что правдивы. Ты чувствуешь, как что-то внутри сжимается. Но ты не поворачиваешься назад. Пока не поворачиваешься.',
          },
        ],
      },
      {
        text: '...Может, ты прав. Может, я хочу жить.',
        next: 'albert_deep_connection_moment',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'albert_won_back', flagValue: true },
        ],
      },
    ],
  },

  albert_deep_farewell_warm: {
    id: 'albert_deep_farewell_warm',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: '*улыбается — по-настоящему, как ты редко его видел* Вот это — другое дело. Иди, Володька. Делай что должен. Но помни: что бы ни случилось — ты не один. Этот город огромный и безжалостный, но в нём есть кафе с остывшим кофе и человек, который верит в тебя. Это не много. Но иногда — достаточно.',
    emotion: 'calm',
    cameraShot: 'wide',
    choices: [
      {
        text: 'Спасибо, друг.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'addStat', stat: 'energy', value: 10 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'albert_deep_completed', flagValue: true },
          { type: 'setFlag', flag: 'albert_relation_warm', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_alliance_active', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_terms_agreed', flagValue: true },
          { type: 'setFlag', flag: 'act1_albert_alliance_done', flagValue: true },
        ],
      },
      {
        text: 'До завтра, Альберт.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'setFlag', flag: 'albert_deep_completed', flagValue: true },
        ],
      },
    ],
  },
};