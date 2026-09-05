import type { DialogueNode } from '@/shared/types/game';

export const DIALOGUE_ACT3_EXPANDED: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     СТАРИК В ПАРКЕ — Ржавые Ключи
     ═══════════════════════════════════════════════════════════ */

  park_old_man_greeting: {
    id: 'park_old_man_greeting',
    speaker: 'Старик',
    text: '*поднимает потухший взгляд* Ещё один... Все ходят мимо, все спешат. Лишь бы не видеть. Как и тогда, в двадцать девятом... *пожимает плечами* Ладно. Если ты остановился — значит, что-то чувствуешь. У меня к тебе просьба. Не большая, но для меня — всё.',
    choices: [
      {
        text: 'Слушаю тебя, дедушка. Что за просьба?',
        next: 'park_old_man_keys_story',
        effects: [
          { type: 'triggerQuest', questId: 'rusty_keys' },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Мне некогда, старик.',
        next: null,
        effects: [
          { type: 'addKarma', value: -1 },
        ],
      },
    ],
  },

  park_old_man_keys_story: {
    id: 'park_old_man_keys_story',
    speaker: 'Старик',
    text: 'Ключи. Ржавые, старые, с орнаментом, который уже не делает никто. От убежища под городом. Мой отец показал мне эту дверь — единственную, которая ещё помнит, какой была земля до бетона и проводов. Я разбросал фрагменты... по глупости, по небрежности. Думал, ключ вечный. А теперь — не могу найти. Три осколка. Помоги — и я покажу тебе то, что за дверью.',
    choices: [
      {
        text: 'Где искать фрагменты?',
        next: 'park_old_man_fragment_hints',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'А что за дверью? Стоит ли оно усилий?',
        next: 'park_old_man_whats_behind',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  park_old_man_fragment_hints: {
    id: 'park_old_man_fragment_hints',
    speaker: 'Старик',
    text: '*разворачивает дрожащую ладонь с наброском* Один — у старых посылочных ячеек, те что у въезда в промзону. Я помню — бросил туда, когда искал укрытие от дождя. Второй — под киоском, где когда-то продавали газеты. Остался один столб, вот между ним и плитой. А третий... третий я потерял у входа в подвал «Хрома-М». Глупо, да? Ключ от убежища — потерян в подвале.',
    choices: [
      {
        text: 'Найду все три. Подожди меня здесь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
  },

  park_old_man_whats_behind: {
    id: 'park_old_man_whats_behind',
    speaker: 'Старик',
    text: '*тихо, с едва заметной улыбкой* Мир, который мы потеряли. Настоящая земля. Не бетон, не проводка — земля. Там хранились семена, чертежи, дневники людей, которые верили, что после Катастрофы кто-то вернётся и начнёт заново. Мой отец был одним из них. Я — нет. Я боялся. Но ключ... ключ я хранил. Пока не потерял. *вздыхает* Помоги мне, и увидишь своими глазами.',
    choices: [
      {
        text: 'Я помогу. Расскажи, где искать.',
        next: 'park_old_man_fragment_hints',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Звучит как сказка для стариков.',
        next: null,
        effects: [
          { type: 'addKarma', value: -2 },
        ],
      },
    ],
  },

  park_old_man_keys_returned: {
    id: 'park_old_man_keys_returned',
    speaker: 'Старик',
    text: '*берёт фрагменты, соединяет их дрожащими руками. Ключ ложится в ладонь целиком* Вот он. Целый. После стольких лет... *поднимает на тебя мокрые глаза* Спасибо тебе. Иди за мной — я покажу дверь. А потом... потом решишь сам, что с этим делать. *пауза* Но помни: не всё, что спрятано — спрятано навсегда.',
    choices: [
      {
        text: 'Веди, дедушка. Я готов.',
        next: null,
        effects: [
          { type: 'addXp', value: 100 },
          { type: 'setFlag', flag: 'rusty_keys_returned', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     УМИРАЮЩИЙ ПОЭТ — Последний Стих
     ═══════════════════════════════════════════════════════════ */

  dying_poet_greeting: {
    id: 'dying_poet_greeting',
    speaker: 'Поэт',
    text: '*голос — как шорох сухих листов* Ты... ты здесь. За этим стеллажом никто не бывает. Только пыль и я. *кашляет* Послушай... У меня есть к тебе просьба. Последняя. Я больше не встану с этого пола — тело решило, что пора. Но есть ещё одно дело, которое не даст мне уйти.',
    choices: [
      {
        text: 'Говори. Я слушаю.',
        next: 'dying_poet_the_request',
        effects: [
          { type: 'triggerQuest', questId: 'dying_poet_last_letter' },
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Может, лучше вызвать помощь?',
        next: 'dying_poet_no_help',
        effects: [
          { type: 'triggerQuest', questId: 'dying_poet_last_letter' },
        ],
      },
    ],
  },

  dying_poet_the_request: {
    id: 'dying_poet_the_request',
    speaker: 'Поэт',
    text: '*достаёт из-под себя помятый листок* Стих. Последний. Я писал его три дня — каждый вдох давался с трудом, но слова не отпускали. Он не для библиотеки. Не для Сети. Он для Елены. Елены Марковны. Тридцать лет назад я предал её — назвал её имя гильдии, чтобы спасти себя. Она потеряла всё: работу, дом, дочь. А я... я писал стихи для тех, кто меня не читал. *вздрагивает* Найди её. Передай. Это всё, что я могу.',
    choices: [
      {
        text: 'Я найду её и передам. Обещаю.',
        next: 'dying_poet_elena_location',
        effects: [
          { type: 'addItem', itemId: 'last_poem_letter', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'last_poem_read', flagValue: true },
        ],
      },
      {
        text: 'Тридцать лет — и только сейчас?',
        next: 'dying_poet_why_now',
        effects: [
          { type: 'addItem', itemId: 'last_poem_letter', value: 1 },
          { type: 'setFlag', flag: 'last_poem_read', flagValue: true },
        ],
      },
    ],
  },

  dying_poet_no_help: {
    id: 'dying_poet_no_help',
    speaker: 'Поэт',
    text: '*слабая улыбка* Помощь? В этом городе помощь — это роскошь. Я не болен в том смысле, в котором лечат. Время просто закончилось. Но прежде чем уйти — послушай. *протягивает листок* Это стих. Для одной женщины. Елены. Я должен был отдать его тридцать лет назад, но трусил. А теперь не могу встать. Помоги мне — и я умну смирно.',
    choices: [
      {
        text: 'Хорошо. Расскажи, где её найти.',
        next: 'dying_poet_elena_location',
        effects: [
          { type: 'addItem', itemId: 'last_poem_letter', value: 1 },
          { type: 'addKarma', value: 2 },
          { type: 'setFlag', flag: 'last_poem_read', flagValue: true },
        ],
      },
    ],
  },

  dying_poet_why_now: {
    id: 'dying_poet_why_now',
    speaker: 'Поэт',
    text: '*закрывает глаза* Потому что страх уходит вместе с дыханием. Когда тело слабеет — душа становится честной. Тридцать лет я носил это как занозу. Каждое стихотворение было попыткой искупить вину — но вину нельзя искупить стихами. Можно только признать. *открывает глаза* Она живёт на Болотной улице, дом 14. Квартира на втором этаже. Если она ещё там... если ещё помнит... *голос срывается*',
    choices: [
      {
        text: 'Я найду её. Отдохни — и жди.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  dying_poet_elena_location: {
    id: 'dying_poet_elena_location',
    speaker: 'Поэт',
    text: 'Болотная улица, дом четырнадцать, второй этаж. Она... она может не захотеть говорить. Можешь не говорить, что от меня. Просто дай ей прочитать. *хватает тебя за рукав* И если она спросит — скажи, что он знал. Всегда знал. Что не было дня, когда он не думал о ней. *отпускает руку* Иди. Время не ждёт.',
    choices: [
      {
        text: '*молча киваешь и уносишь листок*',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  poem_recipient_elena_meeting: {
    id: 'poem_recipient_elena_meeting',
    speaker: 'Елена',
    text: '*открывает дверь, в глазах — настороженность* Чего надо? Я никого не жду. *пытается закрыть дверь* Если это про долги — ко мне не имеет отношения, давно не имеет...',
    choices: [
      {
        text: '*протягиваешь листок* Это от человека, который очень сожалеет.',
        next: 'poem_recipient_elena_reads',
        effects: [
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Вас зовут Елена Марковна? У меня для вас письмо от знакомого.',
        next: 'poem_recipient_elena_hesitant',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: '*тихо* Поэт просил передать.',
        next: 'poem_recipient_elena_reacts',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  poem_recipient_elena_reads: {
    id: 'poem_recipient_elena_reads',
    speaker: 'Елена',
    text: '*берёт листок, читает. Лицо меняется — от гнева к изумлению, от изумления к боли, от боли к чему-то, похожему на прощение* ...Эти строки. Я узнаю почерк. Тридцать лет... *тихо* Тридцать лет молчания — и вот это. *поднимает глаза* Он ещё жив?',
    choices: [
      {
        text: 'Жив. Но едва. В библиотеке, за последним стеллажом.',
        next: 'poem_recipient_elena_decision',
        effects: [
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Я не знаю. Он просил только передать стих.',
        next: null,
        effects: [
          { type: 'addXp', value: 120 },
          { type: 'setFlag', flag: 'last_poem_delivered', flagValue: true },
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
  },

  poem_recipient_elena_hesitant: {
    id: 'poem_recipient_elena_hesitant',
    speaker: 'Елена',
    text: '*замирает* Письмо? От кого? *выглядывает в коридор, потом впускает тебя* Ладно. Заходи. Но если это ловушка — у меня есть neighbours, которые не спят. *закрывает дверь* Давай письмо.',
    choices: [
      {
        text: '*отдаёшь листок*',
        next: 'poem_recipient_elena_reads',
        effects: [],
      },
    ],
  },

  poem_recipient_elena_reacts: {
    id: 'poem_recipient_elena_reacts',
    speaker: 'Елена',
    text: '*бледнеет, хватается за косяк* Поэт... *шёпотом* Его имя я не произносила тридцать лет. Думала — забыла. А теперь... *вытягивает руку, берёт листок* Дай мне.',
    choices: [
      {
        text: '*отдаёшь стих*',
        next: 'poem_recipient_elena_reads',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  poem_recipient_elena_decision: {
    id: 'poem_recipient_elena_decision',
    speaker: 'Елена',
    text: '*долгая пауза. Слёзы катятся, но голос твёрдый* Тогда мне надо пойти. Сейчас. *сворачивает стих и прячет в карман* Спасибо тебе. Не знаю, кто ты и зачем согласился... но спасибо. Может, это ничего не изменит. Может, я просто скажу ему, что ненавижу его. Но я должна прийти. *открывает дверь* Иди к нему. Скажи — Елена идёт.',
    choices: [
      {
        text: 'Скажу. Торопитесь.',
        next: null,
        effects: [
          { type: 'addXp', value: 120 },
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'last_poem_delivered', flagValue: true },
        ],
      },
    ],
  },

  dying_poet_final: {
    id: 'dying_poet_final',
    speaker: 'Поэт',
    text: '*слабая улыбка* Ты вернулся... Она... она приняла? *слушает твой ответ, глаза закрываются* Значит... значит не всё было напрасно. *долгий вдох, долгий выдох* Спасибо, путник. Передай ей... нет. Она уже знает. *тихо* Стихи... они не умирают... пока кто-то... их... читает... *замирает*',
    choices: [
      {
        text: '*закрываешь ему глаза*',
        next: null,
        effects: [
          { type: 'addXp', value: 120 },
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'setFlag', flag: 'last_poem_delivered', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
    emotion: 'sad',
  },

  /* ═══════════════════════════════════════════════════════════
     МАСТЕР ЗАВОДА — Ночной Сдвиг
     ═══════════════════════════════════════════════════════════ */

  factory_foreman_greeting: {
    id: 'factory_foreman_greeting',
    speaker: 'Мастер',
    text: '*вытирает руки промасленной тряпкой* Ты — не с гильдии. Хорошо. С гильдией мне говорить не о чём — они только обещания штампуют. Слушай, мне нужен кто-то, кто не боится тьмы и знает, как обращаться с цифровым мусором. В подвале завода завелись фантомы. Не метафорические — настоящие. Куски коррумпированного кода, которые обрели форму и злобу.',
    choices: [
      {
        text: 'Крысиные бега в подвале — слышишь? Разберусь.',
        next: 'sl_rat_race_start',
        condition: { requiredAct: 4, missingFlag: 'sl_rat_race_accepted' },
      },
      {
        text: 'Фантомы? Опиши подробнее.',
        next: 'factory_foreman_phantoms',
        effects: [
          { type: 'triggerQuest', questId: 'night_shift' },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Слух по цеху: где-то за станками спрятан чертёж «Ока». Это к тебе?',
        next: null,
        condition: { requiredAct: 3, flag: 'factory_search_accepted', missingFlag: 'blueprint_quest_done' },
        effects: [
          { type: 'triggerQuest', questId: 'factory_secret_blueprint' },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'И сколько за работу?',
        next: 'factory_foreman_payment',
        effects: [
          { type: 'triggerQuest', questId: 'night_shift' },
        ],
      },
      {
        text: 'Не моё дело. Нанимай профессионалов.',
        next: null,
        effects: [
          { type: 'addKarma', value: -1 },
        ],
      },
    ],
  },

  factory_foreman_phantoms: {
    id: 'factory_foreman_phantoms',
    speaker: 'Мастер',
    text: 'Ночью серверы генерируют аномалии — какие-то старые процессы, которые гильдия забыла отключить. За годы они накопились, слиплись и стали... агрессивными. Три крупных фантома бродят по подвалу. Если их не остановить — к утру они заберутся наверх и начнут жрать рабочие терминалы. А потом — людей. Фантомы высасывают внимание, концентрацию, волю. Рабочие уже жалуются на провалы в памяти.',
    choices: [
      {
        text: 'Понял. Есть ли источник? Можно вырубить навсегда?',
        next: 'factory_foreman_source_info',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Три фантома. Справлюсь за четыре часа?',
        next: 'factory_foreman_time_pressure',
        effects: [],
      },
    ],
  },

  factory_foreman_payment: {
    id: 'factory_foreman_payment',
    speaker: 'Мастер',
    text: 'Сто кредитов. Плюс — я дам тебе доступ к складу запчастей. Там есть вещи, которые гильдия давно списала, а я... сберёг. Микрочипы, старые интерфейсы. Для человека с головой — золотая жила. Ну что, договорились?',
    choices: [
      {
        text: 'По рукам. Рассказывай про фантомов.',
        next: 'factory_foreman_phantoms',
        effects: [
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Маловато. Сто пятьдесят.',
        next: 'factory_foreman_haggle',
        effects: [],
      },
    ],
  },

  factory_foreman_haggle: {
    id: 'factory_foreman_haggle',
    speaker: 'Мастер',
    text: '*морщится* Ладно, сто двадцать. Но не копейкой больше — я не миллионер. И доступ к складу — без обсуждений, это часть сделки. Теперь слушай про фантомов...',
    choices: [
      {
        text: 'Хорошо, по рукам.',
        next: 'factory_foreman_phantoms',
        effects: [
          { type: 'addCredits', value: 20 },
        ],
      },
    ],
  },

  factory_foreman_source_info: {
    id: 'factory_foreman_source_info',
    speaker: 'Мастер',
    text: 'Источник — в самом глубоком углу подвала. Старый серверный кластер, который должен был быть отключён в тридцатом году. Но кто-то забыл, или не захотел. Он генерирует фантомов как завод — штампует и выбрасывает. Уничтожь кластер — и фантомы рассеются сами. Но он защищён. Старый фаервол, жутко агрессивный. Так что сначала три фантома — потом источник.',
    choices: [
      {
        text: 'Понял план. Ночью приступлю.',
        next: null,
        effects: [
          { type: 'addKarma', value: 1 },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  factory_foreman_time_pressure: {
    id: 'factory_foreman_time_pressure',
    speaker: 'Мастер',
    text: '*кивает* Четыре часа — хватит, если не будешь торчать на месте. Фантомы медленные днём, но ночью — быстрее. Они питаются от ночных колебаний сети. Иди, пока пик не начался. А когда закончишь — приходи, я заплачу и накормлю. У меня ещё бабушкин борщ в термосе — не промышленный, настоящий.',
    choices: [
      {
        text: 'Борщ — это серьёзный аргумент. Договорились.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
    emotion: 'calm',
  },

  factory_foreman_complete: {
    id: 'factory_foreman_complete',
    speaker: 'Мастер',
    text: '*обнимает тебя* Готово?! Серьёзно?! *отступает, смотрит на тебя с уважением* Я послал до тебя пятерых. Трое вернулись — бледные, трясущиеся, с пустыми глазами. Двое — не вернулись вообще. А ты... *качает головой* Вот. Сто двадцать кредитов, как договаривались. И доступ к складу — навсегда. Если когда-нибудь понадобится работа — приходи. Ты у меня на особом счету.',
    choices: [
      {
        text: 'Рад помочь. Если что — знаешь, где меня найти.',
        next: null,
        effects: [
          { type: 'addXp', value: 200 },
          { type: 'addCredits', value: 120 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'factory_basement_cleared', flagValue: true },
        ],
      },
    ],
    emotion: 'happy',
  },

  /* ═══════════════════════════════════════════════════════════
     КОНТАКТ ИЗ СЕТИ — Тень Смотрящего
     ═══════════════════════════════════════════════════════════ */

  surveillance_contact_meeting: {
    id: 'surveillance_contact_meeting',
    speaker: 'Контакт',
    text: '*смотрит через плечо, потом резко хватает тебя за руку* Тихо. Слушай и не задавай вопросов — потом разберёшься. Кто-то слушает весь город. Не гильдия — они слишком тупы для такой системы. Кто-то другой. Мы перехватили фрагмент трафика — он идёт на узел в промзоне, старый телекоммуникационный шкаф. Но мы не можем подойти — за нами следят. Ты — можешь.',
    choices: [
      {
        text: 'Что за узел? И почему я должен рисковать?',
        next: 'surveillance_contact_details',
        effects: [
          { type: 'triggerQuest', questId: 'watchers_shadow' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Я помогу. Город не должен быть клеткой.',
        next: 'surveillance_contact_gratitude',
        effects: [
          { type: 'triggerQuest', questId: 'watchers_shadow' },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Звучит опасно. Мне это не нужно.',
        next: null,
        effects: [
          { type: 'addKarma', value: -1 },
        ],
      },
    ],
    emotion: 'whisper',
  },

  surveillance_contact_details: {
    id: 'surveillance_contact_details',
    speaker: 'Контакт',
    text: 'Потому что если ты не рискуешь — через месяц тебя тоже будут слушать. Каждый разговор. Каждое сообщение. Даже шёпот в темноте. Узел — это точка перехвата. Он собирает всё и передаёт... мы не знаем куда. Именно поэтому его надо взломать и забрать данные. Тогда мы узнаем, кто Смотрящий. И тогда — решим, что с ним делать.',
    choices: [
      {
        text: 'Логично. Где именно узел?',
        next: 'surveillance_contact_location',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  surveillance_contact_gratitude: {
    id: 'surveillance_contact_gratitude',
    speaker: 'Контакт',
    text: '*впервые улыбается* Хорошо сказано. «Город не должен быть клеткой» — запишу. Теперь слушай: узел в промзоне, третий уровень, за вентиляционной решёткой в конце коридора. За решёткой — телекоммуникационный шкаф. Старый, советский, тяжёлый. Внутри — оборудования на миллионы, но тебе нужна только одна микросхема. Чёрная, с зелёной полосой. Вытащи — и беги. Не останавливайся.',
    choices: [
      {
        text: 'Понял. Вернусь с микросхемой.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  surveillance_contact_location: {
    id: 'surveillance_contact_location',
    speaker: 'Контакт',
    text: 'Промзона, третий уровень. Иди до конца коридора мимо цеха номер семь. Там будет вентиляционная решётка — ржавая, но сдвигается. За ней — шкаф. Внутри — серверный блок и маршрутизатор. Тебе нужна чёрная микросхема с зелёной полосой. Она хранит недельный буфер перехвата. Вытащи, принеси мне — и ты получишь шестьдесят кредитов и уважение Сети.',
    choices: [
      {
        text: 'Будет сделано.',
        next: null,
        effects: [
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'А если за шкафом кто-то следит?',
        next: 'surveillance_contact_warning',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  surveillance_contact_warning: {
    id: 'surveillance_contact_warning',
    speaker: 'Контакт',
    text: '*лицо каменеет* Тогда не медли. Смотри — взломал, вытащил, ушёл. Не осматривайся, не любуйся. Смотрящий опасен не потому, что силён — а потому, что знает. Он знает, когда ты просыпаешься. Когда выходишь из дома. С кем говоришь. Единственное, чего он пока не знает — что мы знаем о нём. Не дай ему узнать первым.',
    choices: [
      {
        text: '*киваешь* Пойду.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
    emotion: 'angry',
  },

  surveillance_contact_debrief: {
    id: 'surveillance_contact_debrief',
    speaker: 'Контакт',
    text: '*берёт микросхему, вставляет в портативный считыватель. Лицо меняется по мере чтения* Это... это больше, чем мы думали. Он слушает не только город — он слушает три города. Координаты, переписки, голосовые записи... *убирает считыватель* И имя. Одно имя — повторяется в каждом файле. Я не могу тебе его сказать. Пока не могу. Но ты только что сделал огромную вещь. Вот — шестьдесят кредитов, как договаривались. И это... *протягивает маленький чёрный жетон* ...жетон Сети. С ним к тебе будут относиться иначе.',
    choices: [
      {
        text: 'Что за имя? Я хочу знать, против кого работаю.',
        next: 'surveillance_contact_name_hint',
        effects: [
          { type: 'addXp', value: 150 },
          { type: 'addCredits', value: 60 },
          { type: 'addItem', itemId: 'network_token', value: 1 },
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'setFlag', flag: 'watchers_shadow_complete', flagValue: true },
        ],
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 8 } },
      },
      {
        text: 'Жетон принят. Буду на связи.',
        next: null,
        effects: [
          { type: 'addXp', value: 150 },
          { type: 'addCredits', value: 60 },
          { type: 'addItem', itemId: 'network_token', value: 1 },
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'watchers_shadow_complete', flagValue: true },
        ],
      },
    ],
  },

  surveillance_contact_name_hint: {
    id: 'surveillance_contact_name_hint',
    speaker: 'Контакт',
    text: '*долгая пауза* ...Олег. Имя — Олег. Но не тот Олег, которого ты знаешь. Другой. *тихо* Мы разберёмся. Ты сделал свою часть. Иди — и будь осторожен. Смотрящий ранен, но раненый хищник опаснее сытого. *разворачивается и уходит в тень*',
    choices: [
      {
        text: '*наблюдаешь, как он исчезает*',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
    emotion: 'whisper',
  },
};
