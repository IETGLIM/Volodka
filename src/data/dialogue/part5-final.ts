import type { DialogueNode } from '@/shared/types/game';

export const DIALOGUE_PART5: Record<string, DialogueNode> = {
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
          { type: 'discoverLore', loreId: 'lore_maria_secret' },
          { type: 'discoverLore', loreId: 'lore_ai_surveillance' },
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
      {
        text: 'Виктория, ты не обязана жертвовать собой, чтобы доказать, что живая. Живые — выбирают себя.',
        next: null,
        condition: { minKarma: 60 },
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 18 } },
          { type: 'setFlag', flag: 'victoria_mercy_pledge', flagValue: true },
          {
            type: 'showThought',
            thought: 'Живые выбирают себя. Ты произнёс это — и понял, что говоришь не только о Виктории. О себе. О всех, кто решает остаться, когда мир просит исчезнуть.',
            thoughtDuration: 7000,
          },
        ],
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
      {
        text: 'Сопротивление — это самообман. Мы — мухи на стекле. Лучше приспособиться, чем разбиться.',
        next: null,
        condition: { maxKarma: 10 },
        effects: [
          { type: 'addKarma', value: -10 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -12 } },
          { type: 'setFlag', flag: 'albert_rebel_signal', flagValue: true },
          {
            type: 'showThought',
            thought: 'Ты сказал то, что думал. Или — то, что устал думать? Граница стёрлась. Муха на стекле. А может — муха, которая решила, что стекло — это небо.',
            thoughtDuration: 6000,
          },
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
          { type: 'discoverLore', loreId: 'lore_maria_secret' },
          { type: 'discoverLore', loreId: 'lore_network' },
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
      {
        text: 'Бариста — я начинал здесь один. С остывшим кофе и страхом. Сегодня я возвращаю это всем. Не как месть — как второй шанс. Для всех. И для себя тоже.',
        next: null,
        condition: { minKarma: 70 },
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'setFlag', flag: 'volodka_redeemed', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 20 } },
          {
            type: 'showThought',
            thought: 'Бариста отворачивается к кофемашине — якобы протереть. Но ты видишь: он плачет. Тихо, по-стариковски. Не от горя — от того, что дождался. Эфир начнётся через минуту. Ты — готов. Наконец-то — готов.',
            thoughtDuration: 7000,
          },
        ],
      },
    ],
  },
};
