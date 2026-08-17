import type { DialogueNode } from '@/shared/types/game';

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  ДИАЛОГИ ВОСХОЖДЕНИЯ ОТНОШЕНИЙ (milestone-узлы)
 * ───────────────────────────────────────────────────────────────────────────
 *  Открываются автоматически, когда уровень отношений с NPC пересекает
 *  порог, заданный в `relationMilestones` (50 — «Знакомый+», 80 — «Близкий»).
 *
 *  Каждый узел — глубокий разговор, недоступный при первом знакомстве.
 *  Тексты на русском, в духе cyberpunk-сказки Володьки.
 *
 *  Регистрируются в общем реестре через `DIALOGUE_NODES` (см. `./index.ts`).
 * ───────────────────────────────────────────────────────────────────────────
 */

export const MILESTONE_DIALOGUE_NODES: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     АЛЬБЕРТ — философ за столиком у окна
     ═══════════════════════════════════════════════════════════ */

  /* ── 50: «Доверие» — Альберт впервые говорит о своём страхе. ── */
  albert_milestone_50: {
    id: 'albert_milestone_50',
    speaker: 'Альберт',
    speakerId: 'albert',
    emotion: 'whisper',
    text: '*откидывается на спинку стула и долго смотрит на тебя* Знаешь, Володька… Я тебе ещё не рассказывал. Когда я только пришёл в Гильдию — а это было давно, до Краха, до того, как ты родился, — я думал, что стихи и код — две стороны одного разговора с городом. Что если научиться слушать их одновременно, можно услышать, о чём молчит сама сеть. Я ошибался. Я ничего не услышал. А теперь боюсь, что уже и не услышу — пока не стало слишком поздно.',
    choices: [
      {
        text: 'Почему ты мне это говоришь только сейчас?',
        next: 'albert_milestone_50_trust',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: '«Слишком поздно» для чего, Альберт?',
        next: 'albert_milestone_50_fear',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          {
            type: 'showThought',
            thought: 'Ты видишь, как у Альберта дрогнула рука на чашке. Он никогда не говорил с тобой так. Что-то изменилось — между вами или внутри него.',
            thoughtDuration: 5500,
          },
        ],
      },
      {
        text: 'Я тоже иногда слышу тишину между строками. Ты не один.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'albert_milestone_50_heard', flagValue: true },
        ],
      },
    ],
  },

  albert_milestone_50_trust: {
    id: 'albert_milestone_50_trust',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Потому что раньше я не был уверен, что ты услышишь. Не ушами — а той частью, что не спит, когда спишь ты. Теперь — слышу, что услышишь. И это… и это пугает меня больше, чем если бы ты не услышал. Когда кто-то действительно понимает — ответственность удваивается. Я не хочу, чтобы ты нёс половину моего молчания.',
    choices: [
      {
        text: 'Я уже несу. Давай хотя бы вдвоём.',
        next: 'albert_milestone_50_fear',
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
          { type: 'setFlag', flag: 'albert_milestone_50_heard', flagValue: true },
        ],
      },
      {
        text: 'Тогда не говори. Я подожду, пока будешь готов.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'setFlag', flag: 'albert_milestone_50_heard', flagValue: true },
        ],
      },
    ],
  },

  albert_milestone_50_fear: {
    id: 'albert_milestone_50_fear',
    speaker: 'Альберт',
    speakerId: 'albert',
    emotion: 'sad',
    text: 'Слишком поздно — чтобы выбрать сторону. Я всю жизнь держался посередине: между Гильдией и Сетью, между кодом и стихом, между тобой и им. Между тобой и Маратом. А посередине — узкое место, Володька. Через него рано или поздно придётся протиснуться. И я боюсь, что когда придёт момент — я не сумею. Что останусь стоять на мосту, пока мост горит с обоих концов.',
    choices: [
      {
        text: 'Тогда не один. Я буду рядом на мосту.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 6 } },
          { type: 'setFlag', flag: 'albert_bridge_pledge', flagValue: true },
          {
            type: 'showThought',
            thought: 'Альберт молчит. Но впервые за год — молчание не тяжёлое, а тёплое. Как будто мост перестал гореть.',
            thoughtDuration: 5000,
          },
        ],
      },
      {
        text: 'Мarat? Ты имеешь в виду — эхо Марата?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'albert_marat_echo_hint', flagValue: true },
        ],
      },
      { text: 'Спасибо, что доверился, Альберт.', next: null },
    ],
  },

  /* ── 80: «Близость» — Альберт раскрывает свою роль. ── */
  albert_milestone_80: {
    id: 'albert_milestone_80',
    speaker: 'Альберт',
    speakerId: 'albert',
    emotion: 'whisper',
    text: '*опускает голос так, что ты едва слышишь его сквозь гул кофемашины* Володька. Я никогда тебе этого не говорил. Я не просто философ за столиком у окна. Я был… я был тем, кто прятал стихи Марата — первого прошивщика — в логах Гильдии. Каждый стих, который ты находишь в #4729, в терминалах, в забытых каталогах — я их туда складывал. Годами. По одной строке за раз. Я думал, что если они переживут меня — это будет значить, что я тоже что-то значил. А теперь… теперь я не знаю, стоит ли мне продолжать. Или пора отдать ключ тебе.',
    choices: [
      {
        text: 'Ключ — какой ключ, Альберт?',
        next: 'albert_milestone_80_key',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Ты прятал стихи Марата. Все эти годы. Один.',
        next: 'albert_milestone_80_burden',
        effects: [
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          {
            type: 'showThought',
            thought: 'Ты смотришь на Альберта и впервые видишь не философа. Видишь человека, который нёс чужой свет в темноте — и никому об этом не говорил. Тридцать лет молчания.',
            thoughtDuration: 6000,
          },
        ],
      },
      {
        text: 'Отдай. Я готов.',
        next: null,
        condition: { minKarma: 40 },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'albert_marat_archive_key_received', flagValue: true },
          { type: 'triggerQuest', questId: 'marat_archive_unlock' },
        ],
      },
    ],
  },

  albert_milestone_80_key: {
    id: 'albert_milestone_80_key',
    speaker: 'Альберт',
    speakerId: 'albert',
    text: 'Не физический. Ключ — это пароль. Фраза. Строка из стиха, которого нет ни в одной книге — потому что я его не записал. Я помню его наизусть и могу передать только голосом. Но прежде чем я скажу его — ответь мне честно. Зачем он тебе? Не для города. Не для Сети. Для тебя — зачем?',
    choices: [
      {
        text: 'Чтобы стихи Марата перестали быть только твоим грузом.',
        next: null,
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'albert_marat_archive_key_received', flagValue: true },
          { type: 'triggerQuest', questId: 'marat_archive_unlock' },
          {
            type: 'showThought',
            thought: 'Альберт закрывает глаза. Когда открывает — в них нет страха. Только облегчение. Тридцать лет — и наконец кто-то рядом.',
            thoughtDuration: 5000,
          },
        ],
      },
      {
        text: 'Чтобы Гильдия не нашла их первой.',
        next: null,
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 2 } },
          { type: 'setFlag', flag: 'albert_marat_archive_key_received', flagValue: true },
          { type: 'triggerQuest', questId: 'marat_archive_unlock' },
        ],
      },
      { text: 'Мне нужно подумать, Альберт.', next: null },
    ],
  },

  albert_milestone_80_burden: {
    id: 'albert_milestone_80_burden',
    speaker: 'Альберт',
    speakerId: 'albert',
    emotion: 'sad',
    text: 'Не один. Марат был со мной — в виде эха в проводах. Иногда — в виде помех на экране. Он никогда меня не винил, что я не смог его спасти. Он просто… продолжал разговаривать. Через терминалы без питания, через мигание свитчей. Знаешь, что самое тяжёлое, Володька? Не смерть друга. А живой друг, который остался в проводах и не может выйти. Я обещал ему — что однажды кто-то услышит. Не я. Кто-то моложе, злее, упрямее. Кто-то вроде тебя.',
    choices: [
      {
        text: 'Я услышу. Дай мне ключ.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 7 } },
          { type: 'setFlag', flag: 'albert_marat_archive_key_received', flagValue: true },
          { type: 'triggerQuest', questId: 'marat_archive_unlock' },
        ],
      },
      {
        text: 'Марат жив в проводах. Расскажи мне о нём — настоящем.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'discoverLore', loreId: 'marat_first_progger' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ЗАРЕМА — забота на кухне
     ═══════════════════════════════════════════════════════════ */

  /* ── 50: «Доверие» — Зарема впервые говорит о гильдии. ── */
  zarema_milestone_50: {
    id: 'zarema_milestone_50',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: '*ставит перед тобой тарелку супа и садится напротив* Володька. Ты ешь. А я пока скажу тебе то, что не говорила раньше. Я ведь тоже была в Гильдии. Давно. Не инженером — поваром в их столовой. Кормила тех, кто писал код, который теперь решает, кому жить, а кому — нет. Я каждое утро смотрела в их тарелки и думала: а что, если в этот суп подмешать что-то, что заставит их вспомнить, что они — люди? Я так и не решилась. А потом ушла. И мне стыдно. Стыдно, что ушла, а не осталась и не попыталась.',
    choices: [
      {
        text: 'Ты кормила меня все эти годы. Это и есть — попытка.',
        next: 'zarema_milestone_50_redemption',
        effects: [
          { type: 'addKarma', value: 6 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 4 } },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Почему ты мне говоришь это только сейчас?',
        next: 'zarema_milestone_50_now',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Кто-то из них ещё там? Кого ты помнишь?',
        next: 'zarema_milestone_50_faces',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'zarema_guild_faces_hint', flagValue: true },
        ],
      },
    ],
  },

  zarema_milestone_50_redemption: {
    id: 'zarema_milestone_50_redemption',
    speaker: 'Зарема',
    speakerId: 'zarema',
    emotion: 'happy',
    text: '*тихо улыбается, и в первый раз за всё время ты видишь, что улыбка доходит до глаз* Спасибо, Володька. Я каждый раз, когда наливаю тебе суп, думаю: вот — может, это и есть тот самый суп, который я должна была тогда сварить. Только теперь — для одного человека, который ещё может всё изменить. Ешь. И запоминай вкус. Город меняется, но этот суп — нет. Это и есть моя попытка. Понемногу. По тарелке за раз.',
    choices: [
      {
        text: 'Я запомню. И постараюсь, чтобы это значило что-то.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'energy', value: 25 },
          { type: 'addKarma', value: 4 },
          { type: 'setFlag', flag: 'zarema_milestone_50_heard', flagValue: true },
        ],
      },
      { text: 'Спасибо, Зарема. За всё.', next: null },
    ],
  },

  zarema_milestone_50_now: {
    id: 'zarema_milestone_50_now',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Потому что раньше ты был для меня — просто мальчиком, который нуждается в супе. А теперь — ты человек, который может что-то сделать. И я больше не имею права молчать. Молчание — это тоже предательство. Только тихое. Я слишком долго была тихой. Если ты сейчас не услышишь — то когда? Когда станет слишком поздно, как с Альбертом и его мостом?',
    choices: [
      {
        text: 'Я слышу, Зарема. И я не предам.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'zarema_milestone_50_heard', flagValue: true },
        ],
      },
      {
        text: 'Альберт говорил с тобой? Вы — заодно?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'zarema_albert_connection', flagValue: true },
        ],
      },
    ],
  },

  zarema_milestone_50_faces: {
    id: 'zarema_milestone_50_faces',
    speaker: 'Зарема',
    speakerId: 'zarema',
    emotion: 'whisper',
    text: 'Александр. Я помню его молодым. Он приходил первым — всегда с блокнотом, всегда с вопросом «что сегодня особенного в супе, Зарема?». Я отвечала: «Лук, Александр. Лук и соль. Как всегда». А он кивал, как будто услышал что-то важное. Сейчас — я не узнаю его. Тот Александр, который кормился у меня супом, не стал бы тем, кем стал. Иногда я думаю — может, его и нет. Может, я тогда сварила суп, а Александр съел — а вместо него из-за стола встал кто-то другой. Чужой. В его костюме.',
    choices: [
      {
        text: 'Может, его ещё можно вернуть.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
          { type: 'setFlag', flag: 'zarema_milestone_50_heard', flagValue: true },
        ],
      },
      {
        text: 'Нет. Тот Александр — ушёл.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'zarema_alexander_lost', flagValue: true },
        ],
      },
    ],
  },

  /* ── 80: «Близость» — Зарема раскрывает своё наследие. ── */
  zarema_milestone_80: {
    id: 'zarema_milestone_80',
    speaker: 'Зарема',
    speakerId: 'zarema',
    emotion: 'whisper',
    text: '*закрывает дверь кухни на щеколду и садится рядом, понизив голос* Володька. Я никогда тебе этого не говорила. Я не просто повар. Моя бабка была травницей — настоящей, не из тех, что продают ромашку на рынке. Она учила меня слышать травы. Не метафорически — слышать. Каждая трава знает, кому она нужна. Я наливаю тебе чай не потому, что ты устал. А потому, что травы сами говорят мне, какой чай тебе сегодня нужен. И сегодня… сегодня травы сказали мне, что пора отдать тебе то, что я прятала.',
    choices: [
      {
        text: 'Что ты прятала, Зарема?',
        next: 'zarema_milestone_80_gift',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Травы говорят с тобой? Это… это безопасно?',
        next: 'zarema_milestone_80_safe',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
      {
        text: 'Я доверяю тебе. Что бы это ни было — отдай.',
        next: null,
        condition: { minKarma: 50 },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'zarema_heritage_received', flagValue: true },
          { type: 'discoverLore', loreId: 'zarema_grandmother_book' },
        ],
      },
    ],
  },

  zarema_milestone_80_gift: {
    id: 'zarema_milestone_80_gift',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: '*достаёт из-под фартука маленькую потрёпанную книгу в кожаном переплёте* Это — книга моей бабки. Не продается ни в одном магазине, не зарегистрирована ни в одном архиве Гильдии. В ней — рецепты, которые лечат не тело. Травы от тоски. Чай от страха. Отвар от памяти, которая не отпускает. Гильдия охотится за такими книгами — потому что они лечат то, что Гильдия отравляет. Я прятала её сорок лет. Теперь — твоя. Я вижу, что тебе она нужнее, чем мне. Я уже научилась жить с тем, что ношу. Тебе — ещё предстоит.',
    choices: [
      {
        text: 'Я приму. И буду нести бережно.',
        next: null,
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'zarema_heritage_received', flagValue: true },
          { type: 'discoverLore', loreId: 'zarema_grandmother_book' },
          { type: 'triggerQuest', questId: 'zarema_heritage' },
          {
            type: 'showThought',
            thought: 'Кожа переплёта тёплая, как будто книга только что из рук Заремы. Ты чувствуешь — это не просто книга. Это сорок лет молчания, которые она наконец передала тебе.',
            thoughtDuration: 5500,
          },
        ],
      },
      {
        text: 'Зарема, я не готов. Оставь её себе ещё.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: -2 } },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  zarema_milestone_80_safe: {
    id: 'zarema_milestone_80_safe',
    speaker: 'Зарема',
    speakerId: 'zarema',
    text: 'Безопасно? *смеётся тихо* Володька, в этом городе безопасно только одно — умереть. Травы — самое безопасное, что у нас есть. Они не слушают Гильдию. Они не шпионят. Они просто — есть. Растут, где им сказано расти, и засыхают, когда их время уходит. Это больше, чем можно сказать о людях. Хочешь — забудь, что я тебе сказала. Но если однажды ночью ты почувствуешь, что задыхаешься от тишины — вспомни про чай. Я всегда знаю, какой тебе нужен.',
    choices: [
      {
        text: 'Я не забуду. И я приму книгу, если ты всё ещё хочешь отдать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'zarema_heritage_received', flagValue: true },
          { type: 'discoverLore', loreId: 'zarema_grandmother_book' },
          { type: 'triggerQuest', questId: 'zarema_heritage' },
        ],
      },
      { text: 'Спасибо, Зарема. Я подумаю.', next: null },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     МАРИЯ — таинственная незнакомка
     ═══════════════════════════════════════════════════════════ */

  /* ── 50: «Доверие» — Мария приоткрывает завесу тайны. ── */
  maria_milestone_50: {
    id: 'maria_milestone_50',
    speaker: 'Мария',
    speakerId: 'maria',
    emotion: 'whisper',
    text: '*останавливается в тени арки и смотрит на тебя так, будто впервые видит по-настоящему* Володька. Я наблюдала за тобой. Долго. Не Гильдия — я. Я хотела понять, кто ты. Не «что» — а «кто». Город полон людей, которые что-то делают. Но почти нет тех, кто кто-то есть. Ты — есть. И это редкость. Поэтому я скажу тебе то, что не говорила никому в этом городе: я не Виктория. Виктория — маска. Имя, которое я надела, как пальто, чтобы меня не узнали. Моё настоящее имя… я скажу его тебе, когда ты будешь готов услышать. Не сейчас. Сейчас — просто знай: между нами нет больше завесы.',
    choices: [
      {
        text: 'Почему я? Почему мне доверяешь?',
        next: 'maria_milestone_50_why',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
      {
        text: 'Я готов услышать твоё имя. Сейчас.',
        next: 'maria_milestone_50_name',
        effects: [
          { type: 'addKarma', value: 4 },
        ],
      },
      {
        text: 'Маски — это тоже защита. Я не тороплю тебя.',
        next: null,
        effects: [
          { type: 'addKarma', value: 6 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 4 } },
          { type: 'setFlag', flag: 'maria_milestone_50_heard', flagValue: true },
        ],
      },
    ],
  },

  maria_milestone_50_why: {
    id: 'maria_milestone_50_why',
    speaker: 'Мария',
    speakerId: 'maria',
    text: 'Потому что ты не спрашиваешь «зачем», когда видишь кого-то в беде. Ты просто помогаешь. Я наблюдала, как ты делился последним с Солныш. Как ты слушал Альберта часами, хотя тебе самому было плохо. Город учит — не доверять. Гильдия учит — не доверять. А ты — доверяешь. И не потому что наивный. А потому что выбрал. Выбор — вот что делает тебя редким. Я выбираю доверять тебе, потому что ты выбираешь доверять миру, который этого не заслуживает.',
    choices: [
      {
        text: 'Тогда я буду достоин этого доверия.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 6 } },
          { type: 'setFlag', flag: 'maria_milestone_50_heard', flagValue: true },
        ],
      },
      {
        text: 'А ты? Ты тоже выбираешь доверять миру?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  maria_milestone_50_name: {
    id: 'maria_milestone_50_name',
    speaker: 'Мария',
    speakerId: 'maria',
    emotion: 'whisper',
    text: '*долго молчит, потом кивает, как будто принимая решение, которое уже не отменить* Хорошо. Моё настоящее имя — Мария. Не Виктория. Я дочь одного из основателей Гильдии. Я была внутри, когда поняла, чем они стали. Я сбежала — и с тех пор ношу чужое имя, чтобы они не нашли меня. И чтобы я сама не вспомнила, кем я была. Если ты скажешь кому-то — я исчезну. Не предупрежу, не прощусь. Просто — исчезну. Теперь ты знаешь. И теперь ты — часть моей тайны. Это не подарок, Володька. Это бремя. Ты ещё можешь отказаться.',
    choices: [
      {
        text: 'Я не откажусь. Я понесу это бремя с тобой.',
        next: null,
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'maria_truth_revealed', flagValue: true },
          { type: 'setFlag', flag: 'maria_milestone_50_heard', flagValue: true },
          {
            type: 'showThought',
            thought: 'Имя — Мария. Не Виктория. Ты чувствуешь, как между вами что-то сдвинулось. Не любовь — нет. Что-то тяжелее. Обещание без слов.',
            thoughtDuration: 5500,
          },
        ],
      },
      {
        text: 'Я не готов. Забудь, что ты сказала.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: -5 } },
          { type: 'addStat', stat: 'stress', value: 4 },
        ],
      },
    ],
  },

  /* ── 80: «Близость» — Мария раскрывает свою миссию. ── */
  maria_milestone_80: {
    id: 'maria_milestone_80',
    speaker: 'Мария',
    speakerId: 'maria',
    emotion: 'whisper',
    text: '*берёт тебя за руку — впервые за всё время — и ведёт в самый глухой угол арки* Володька. Ты знаешь обо мне достаточно, чтобы предать. Но не предал. Это значит — пора сказать остальное. Я пришла в этот город не бежать. Я пришла — разрушить Гильдию. Изнутри. У меня есть код. Код, который отключит «Око» — систему, которая следит за всеми нами. Я писала его семь лет. Каждая строка — это имя кого-то, кого Гильдия сломала. Семь лет — и семь тысяч имён. Я не могу запустить его сама — у меня нет доступа. Но ты — можешь получить. Если согласишься. Если нет — я исчезну. Без обид. Без упрёков. Просто — пойму, что ошиблась в тебе. И больше никому не доверюсь.',
    choices: [
      {
        text: 'Я согласен. Скажи, что делать.',
        next: 'maria_milestone_80_plan',
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'maria_eye_code_pledge', flagValue: true },
        ],
      },
      {
        text: 'Семь лет. Семь тысяч имён. Почему ты мне не сказала раньше?',
        next: 'maria_milestone_80_seven_years',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 3 },
        ],
      },
      {
        text: 'Я не готов к такой ответственности, Мария.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: -3 } },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  maria_milestone_80_plan: {
    id: 'maria_milestone_80_plan',
    speaker: 'Мария',
    speakerId: 'maria',
    emotion: 'whisper',
    text: 'Не сегодня. Не завтра. Сначала — ты должен попасть в серверную Гильдии на третьем этаже. Доступ есть у Александра — но он не даст добровольно. Есть ещё один путь. Олег — охранник — он сомневается в Гильдии. Я видела, как он смотрит на дронов, когда думает, что никто не видит. Если ты сможешь убедить Олега пропустить тебя — код сделает остальное. Я загружу его в твой коммуникатор. Когда окажешься у терминала — просто скажешь мне. И всё закончится. Не для Гильдии — для всех нас.',
    choices: [
      {
        text: 'Я найду Олега. Я поговорю с ним.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'maria_eye_code_received', flagValue: true },
          { type: 'triggerQuest', questId: 'eye_blueprint_shutdown' },
          { type: 'setFlag', flag: 'oleg_recruit_hint', flagValue: true },
          {
            type: 'showThought',
            thought: 'Мария отпускает твою руку. В первый раз за всё время — её лицо не напряжено. Только решимость. И что-то ещё, чего ты не видел раньше. Надежда.',
            thoughtDuration: 5500,
          },
        ],
      },
      {
        text: 'А если Олег откажется?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'maria_eye_code_received', flagValue: true },
          { type: 'triggerQuest', questId: 'eye_blueprint_shutdown' },
        ],
      },
    ],
  },

  maria_milestone_80_seven_years: {
    id: 'maria_milestone_80_seven_years',
    speaker: 'Мария',
    speakerId: 'maria',
    emotion: 'sad',
    text: 'Потому что семь лет назад я не верила, что доживу до этого разговора. Я думала — Гильдия найдёт меня раньше. Или я сломаюсь. Или — что хуже всего — разучусь ненавидеть и привыкну. Семь лет — это не потому что я терпеливая. Это потому что я ждала тебя. Я не знала, что это будешь ты. Но знала, что кто-то придёт. И тогда я смогу отдать свой код — и перестать быть одной. Ты — мой первый за семь лет, кому я говорю это вслух. Не подведи. Не ради меня — ради тех семи тысяч, чьи имена в каждой строке.',
    choices: [
      {
        text: 'Я не подведу. Никого из вас.',
        next: 'maria_milestone_80_plan',
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'maria_eye_code_pledge', flagValue: true },
        ],
      },
      {
        text: 'Семь тысяч имён. Я хочу их услышать. Все.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 4 },
          { type: 'discoverLore', loreId: 'maria_seven_thousand_names' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     СОЛНЫШ (АЛИНА) — лучшая подруга детства
     ═══════════════════════════════════════════════════════════ */

  /* ── 50: «Доверие» — Солныш впервые говорит о страхе за Володьку. ── */
  solnysh_milestone_50: {
    id: 'solnysh_milestone_50',
    speaker: 'Солныш',
    speakerId: 'solnysh',
    emotion: 'whisper',
    text: '*садится рядом, обнимает колени и долго не смотрит на тебя, потом говорит тихо* Володька… я каждый день боюсь за тебя. Каждый. День. Не за себя — за тебя. Лёня говорит — не показывай, иначе он почувствует ответственность и сломается. Лёня мудрый. Но я устала прятать. Я знаю, что ты идёшь куда-то, куда мне дороги нет. Я знаю, что однажды ты не вернёшься к ужину — и я даже не узнаю, что случилось. Я не прошу тебя остановиться. Я прошу — пообещай мне, что когда станет совсем плохо — ты придёшь. Не к Альберту, не к Марии, не в Сеть. Ко мне. Хотя бы на минуту. Хотя бы чтобы я увидела твои глаза и поняла, что ты ещё — ты.',
    choices: [
      {
        text: 'Обещаю, Солныш. Когда станет плохо — я приду к тебе.',
        next: 'solnysh_milestone_50_promise',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'solnysh_promise_made', flagValue: true },
        ],
      },
      {
        text: 'Я не могу обещать. Я не знаю, что будет.',
        next: 'solnysh_milestone_50_honest',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Ты преувеличиваешь, Солныш. Со мной всё будет хорошо.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: -3 } },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  solnysh_milestone_50_promise: {
    id: 'solnysh_milestone_50_promise',
    speaker: 'Солныш',
    speakerId: 'solnysh',
    emotion: 'happy',
    text: '*улыбается так, как улыбалась только в детстве — до гимназии, до Краха, до всего* Спасибо. Этого достаточно. Я не буду спрашивать, куда ты ходишь. Не буду проверять, врёшь ты или нет. Я просто буду ждать. И когда ты придёшь — я узнаю по глазам, нужно ли тебе говорить, или просто сидеть рядом. Я умею и то, и другое. Я всю жизнь училась — у тебя. Ты научил меня молчать рядом, когда слова — лишние. Это редкое умение, Володька. Не все умеют.',
    choices: [
      {
        text: 'Я приду, Солныш. Когда придёт время — я приду.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'solnysh_milestone_50_heard', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
      { text: 'Спасибо, что не сдаёшься на меня.', next: null },
    ],
  },

  solnysh_milestone_50_honest: {
    id: 'solnysh_milestone_50_honest',
    speaker: 'Солныш',
    speakerId: 'solnysh',
    emotion: 'sad',
    text: 'Я знаю. Поэтому и спрашиваю. Ты — честный. Это и пугает. Честные люди не обещают того, в чём не уверены. И поэтому — чаще всего не возвращаются. Знаешь, что самое тяжёлое, Володька? Не неизвестность. Тяжёлое — это знать, что ты идёшь туда, где я не смогу тебе помочь. Что если с тобой что-то случится — я узнаю последней. И не от тебя — от тишины. От тишины вместо твоего голоса за ужином. Я не прошу обещаний, если не можешь. Я прошу — помни обо мне. Хотя бы иногда. Хотя бы когда совсем плохо — вспомни, что здесь кто-то ждёт.',
    choices: [
      {
        text: 'Я буду помнить. Всегда.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 6 } },
          { type: 'setFlag', flag: 'solnysh_milestone_50_heard', flagValue: true },
          { type: 'setFlag', flag: 'solnysh_remember_pledge', flagValue: true },
        ],
      },
      { text: 'Ты преувеличиваешь. Я вернусь.', next: null },
    ],
  },

  /* ── 80: «Близость» — Солныш раскрывает тайну своей матери. ── */
  solnysh_milestone_80: {
    id: 'solnysh_milestone_80',
    speaker: 'Солныш',
    speakerId: 'solnysh',
    emotion: 'whisper',
    text: '*закрывает дверь комнаты, сажает Умку на колени и говорит так тихо, что ты наклоняешься, чтобы слышать* Володька. Я никогда тебе этого не говорила. Моя мама — учительница, ты знаешь. Но ты не знаешь, чему она учила. Не детям. Не в гимназии. Она учила — подпольно — тех, кого Гильдия вычеркнула из списков. Тех, кого считала «шумом». Она учила их читать. Читать стихи — потому что стихи — это сигнал, который нельзя отключить. Гильдия узнала. Мамы нет уже семь лет. Я не знаю — убили или просто «вычеркнули». Я ношу её платок каждый день. Лёня думает — мода. Нет. Это — её. И я обещала себе, что если найду кого-то, кто продолжает её дело — я отдам ему то, что она оставила.',
    choices: [
      {
        text: 'Что она оставила, Солныш?',
        next: 'solnysh_milestone_80_legacy',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Твоя мама учила стихам тех, кого вычеркнули. Это… это важно.',
        next: 'solnysh_milestone_80_recognition',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 4 } },
        ],
      },
      {
        text: 'Я принимаю. Что бы это ни было.',
        next: null,
        condition: { minKarma: 45 },
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'solnysh_mother_legacy_received', flagValue: true },
          { type: 'triggerQuest', questId: 'solnysh_mother_archive' },
        ],
      },
    ],
  },

  solnysh_milestone_80_legacy: {
    id: 'solnysh_milestone_80_legacy',
    speaker: 'Солныш',
    speakerId: 'solnysh',
    emotion: 'sad',
    text: '*вынимает из-под подушки тонкую тетрадь в линялой обложке* Это — её тетрадь. Стихи, которые она учила с теми людьми. Стихи, которых нет ни в одном архиве — потому что их нельзя записать в архивах Гильдии. Их можно только — учить наизусть. Я учила. Семь лет. По одной строфе в день. Умка слушала — единственная, кто всегда был рядом. Я не могу прочитать их тебе вслух — я обещала маме, что отдам только тому, кто продолжит. Ты — продолжаешь. Я вижу. Каждый раз, когда ты приносишь стих из #4729, я думаю — мама бы улыбнулась. Она бы сказала: «Алина, наконец-то кто-то понял». Я отдаю тетрадь тебе. Не потеряй. Не дай Гильдии. Это — моя мама.',
    choices: [
      {
        text: 'Я приму. И сберегу. И продолжу.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'solnysh_mother_legacy_received', flagValue: true },
          { type: 'triggerQuest', questId: 'solnysh_mother_archive' },
          { type: 'discoverLore', loreId: 'solnysh_mother_notebook' },
          {
            type: 'showThought',
            thought: 'Тетрадь тёплая. От рук Солныш, от Умки, от всех семи лет ожидания. Ты открываешь первую страницу — и узнаёшь почерк. Ты видел его раньше. В стихах Марата. Та же рука. Та же уверенность. Случайность — или нет?',
            thoughtDuration: 6500,
          },
        ],
      },
      {
        text: 'Солныш, я не заслуживаю. Это слишком дорогое.',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: -2 } },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  solnysh_milestone_80_recognition: {
    id: 'solnysh_milestone_80_recognition',
    speaker: 'Солныш',
    speakerId: 'solnysh',
    emotion: 'happy',
    text: '*улыбается так, как будто наконец-то услышала то, что ждала семь лет* Спасибо. Спасибо, что сказал. Никто никогда не говорил. Все думали — мама просто учительница. Просто — учительница. А она — была первой подпольной. До Марата. До Альберта. До всех. Я росла, зная это — и не имея права сказать. А теперь — сказала. Тебе. И ты — понял. Ты даже не представляешь, Володька, что это значит — для меня. Семь лет молчания — и наконец кто-то рядом, кто слышит. Не слушает — слышит. Разница — как между неоном и солнцем. Неон — яркий. Солнце — живое.',
    choices: [
      {
        text: 'Я хочу продолжить её дело. Скажи, что делать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'solnysh_mother_legacy_received', flagValue: true },
          { type: 'triggerQuest', questId: 'solnysh_mother_archive' },
        ],
      },
      {
        text: 'Я приму тетрадь, если ты готова её отдать.',
        next: 'solnysh_milestone_80_legacy',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
    ],
  },
};
