import type { StoryNode } from '@/shared/types/game';

/**
 * Act 4 — Expanded story nodes: crackdown intensifies.
 *
 * Volodka must choose sides — peaceful protest or underground resistance.
 * Key locations: rooftop broadcast, Zarema's room, winter streets,
 * city_square protest, factory glimpses. Alexander's choice, Victoria's sacrifice.
 *
 * These nodes supplement (not replace) the ACT4_STRUCTURE spine nodes.
 * Exported as ACT4_STORY_EXPANDED_NODES so it can be merged into the
 * main story-node registry alongside STORY_NODES_ACT4 and STORY_NODES_ACT4_QUIET_HOUR.
 */
export const ACT4_STORY_EXPANDED_NODES: Record<string, StoryNode> = {

  /* ══════════════════════════════════════════════════════════════════════════
     1.  ROOFTOP ANTENNA — Alexander hesitates at the broadcast hardware
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_rooftop_antenna: {
    id: 'act4_exp_rooftop_antenna',
    text: 'Антенна собрана из трёх старых Wi-Fi-мачт и куска кровельного железа. Александр стоит у края крыши, руки в карманах, и смотрит на город, как смотрят на больного друга — без надежды на выздоровление. «Если мы запустим сейчас, они засекут сигнал через шесть минут,» — говорит он тихо. «Шесть минут — это стихотворение. Это вся жизнь, если говорить правду.» Ветер рвёт слова с губ, и неон внизу мерцает, как пульс уставшего сервера.',
    contextNote: 'Крыша. Антенна из Wi-Fi-мачт. Александр犹豫不决 на краю.',
    accessibilityAnnounce: 'Крыша. Антенна собрана, Александр стоит у края.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    speaker: 'Александр',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Запустить сейчас — шесть минут правды стоят шести минут страха',
        next: 'act4_exp_rooftop_city_view',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'broadcast_launched', flagValue: true },
          { type: 'addKarma', value: 6 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Ждать — нужно лучшее окно между дронными циклами',
        next: 'act4_exp_chk_night_meeting',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'broadcast_delayed', flagValue: true },
        ],
      },
      {
        text: 'Отключить — не сейчас, не так. Александр, ты прав.',
        next: 'act4_exp_street_winter_walk',
        effects: [
          { type: 'addStat', stat: 'stress', value: 4 },
          { type: 'npcChange', npcId: 'npc_alexander', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     2.  STREET WINTER WALK — Snow and neon, Volodka reflects on choices
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_street_winter_walk: {
    id: 'act4_exp_street_winter_walk',
    text: 'Снег падает на неон — и каждый фонарь становится кляксой белого на синем. Ты идёшь по улице, и脚印 стираются за тобой, как будто город не хочет помнить, что ты здесь. Дым из вентиляционных шахт поднимается вертикально — ни ветра, ни жизни, только серверный гул под асфальтом. Ты думал, что выбор — это дверь. Но выбор — это зеркало, и в нём — ты с двумями лицами: тот, кто читает стихи, и тот, кто прячет их в код.',
    contextNote: 'Зимняя улица. Снег на неоне, серверный гул под ногами.',
    accessibilityAnnounce: 'Зимняя улица. Снег, неон, следы стираются.',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Идти к площади — люди собираются, и это значит больше чем сигналы',
        next: 'act4_exp_street_crowd',
        effects: [
          { type: 'setFlag', flag: 'heading_to_square', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Свернуть к кафе — сначала послушать, что знает бариста',
        next: 'act4_exp_barista_coffee_code',
        effects: [
          { type: 'setFlag', flag: 'barista_visited', flagValue: true },
        ],
      },
      {
        text: 'Думать дальше — вернуться к крыше и Александру',
        next: 'act4_exp_rooftop_antenna',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     3.  QUIET ZAREMA NIGHT — Zarema's room, writing a report the Guild won't see
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_quiet_zarema_night: {
    id: 'act4_exp_quiet_zarema_night',
    text: 'Комната Заремы — лампа на столе, тень на стене, и тишина, которая бывает только между двумя серверными циклами. Она пишет — не для гильдии, не для Сети, а для себя: отчёт о том, что гильдия уничтожила в этом квартале за три месяца. «Они никогда его не увидят,» — говорит она, не поворачиваясь. «Но я должна написать. Иначе это перестанет существовать даже в моей памяти.» Ты стоишь у двери и понимаешь: некоторые документы — не данные, а молитвы.',
    contextNote: 'Комната Заремы ночью. Она пишет отчёт, который гильдия не увидит.',
    accessibilityAnnounce: 'Комната Заремы. Настольная лампа, отчёт на экране.',
    speaker: 'npc_zarema',
    sceneId: 'zarema_room',
    choices: [
      {
        text: 'Помочь — отредактировать, структурировать, дать форму',
        next: 'act4_exp_zarema_deleted_files',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'writing', difficulty: 12 } },
        effects: [
          { type: 'npcChange', npcId: 'npc_zarema', npcChange: { relation: 8 } },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Сказать: гильдия стирает, но мы запомним — вместе',
        next: 'act4_exp_zarema_deleted_files',
        effects: [
          { type: 'npcChange', npcId: 'npc_zarema', npcChange: { relation: 4 } },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Оставить её в покое — это её молитва, не твоя',
        next: 'act4_exp_street_winter_walk',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     4.  CITY SQUARE POSTER — "Стихи не стираются" appears overnight
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_city_square_poster: {
    id: 'act4_exp_city_square_poster',
    text: 'На стене у фонтана — плакат, которого вчера не было. Буквы крупные, неоновая краска, и пять слов: «СТИХИ НЕ СТИРАЮТСЯ.» Под ними — строчка из Лебедева, которую гильдия пометила как «удалено из базы». Кто-то вручную набрал её на принтере из третьего деплоя и приклеил в ночь между дронными циклами. Вокруг — три человека. Четвёртый — дрон, но он летит мимо, камера выключена. Кто-то заплатил за его слепоту.',
    contextNote: 'Центральная площадь. Плакат: «СТИХИ НЕ СТИРАЮТСЯ».',
    accessibilityAnnounce: 'Площадь. Плакат на стене фонтана — неоновая краска.',
    speaker: 'narrator',
    sceneId: 'city_square',
    choices: [
      {
        text: 'Добавить свою строчку ниже — дополнить плакат',
        next: 'act4_exp_peaceful_march_prep',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'writing', difficulty: 14 } },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'poster_added_line', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
        ],
      },
      {
        text: 'Фотографировать и разослать по Сети — пусть видят',
        next: 'act4_exp_chk_night_meeting',
        effects: [
          { type: 'setFlag', flag: 'poster_photographed', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
      {
        text: 'Уйти быстро — кто-то следит за площадью',
        next: 'act4_exp_colleague_betrayal_hint',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     5.  COLLEAGUE BETRAYAL HINT — Someone in the Network is a Guild mole
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_colleague_betrayal_hint: {
    id: 'act4_exp_colleague_betrayal_hint',
    text: 'Коллега — тот, который всегда приходил на пять минут раньше и уходил на десять позже — сегодня говорит веща, которых не говорит. «Они знают про серверную,» — шепчет он, глядя в монитор, а не на тебя. «И про rooftop. И про Зарему.» Ты чувствуешь, как воздух становится густым — не от холода, а от предательства, которое ещё не случилось, но уже дышит. «Я не говорю, что это кто-то из нас. Но логи… логи не врут. Кто-то сливаает координаты в гильдию.»',
    contextNote: 'Офис. Коллега намекает на крота в Сети.',
    accessibilityAnnounce: 'Офис. Коллега шепчет о предательстве.',
    speaker: 'npc_colleague',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Проверить логи — вычислить крота по маршрутам',
        next: 'act4_exp_chk_defense_plan',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 14 } },
        effects: [
          { type: 'setFlag', flag: 'traitor_discovered', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
      {
        text: 'Довериться直觉 — почувствовать, кто изменился',
        next: 'act4_exp_chk_defense_plan',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'traitor_sensed', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Не вникать — сейчас важнее broadcast, не крот',
        next: 'act4_exp_rooftop_antenna',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     6.  FACTORY GLIMPSE — Through the fence, old machines still humming
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_factory_glimpse: {
    id: 'act4_exp_factory_glimpse',
    text: 'Через дыру в заборе ты видишь цех — станки не работают, но гудят. Не электричеством, а чем-то старше: памятью металла, резонансом пятидесяти герц, который не отключался с восемьдесят seventh года. Жёлтый свет из подвального окна, и тень — кто-то ходит внизу. Не охрана. Не гильдия. Старуха с чайником. Баба Зина. Ты знаешь это имя от Альберта — она паяет платы для чего-то, что гильдия считает мёртвым. Но мёртвое гудит, и гудит сильнее, чем живые серверы в башне.',
    contextNote: 'Забор завода. Цех гудит, тень Бабы Зины в подвале.',
    accessibilityAnnounce: 'Заводский забор. Цех гудит на 50 герц.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Пролезть через дыру — встретить Бабу Зину',
        next: 'act4_exp_factory_baba_zina_call',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'factory_entered_act4', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Запомнить координаты — вернуться позже, когда будет безопаснее',
        next: 'act4_exp_albert_last_stand',
        effects: [
          { type: 'setFlag', flag: 'factory_coordinates_saved', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     7.  CHK NIGHT MEETING — Secret meeting, plans for the broadcast
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_chk_night_meeting: {
    id: 'act4_exp_chk_night_meeting',
    text: 'Костёр в лесу на Зорге — не для тепла, а для координации. Басед наливает портвейн в жестяные кружки, Элис тихо перебирает струны — не песню, а частоту, которая маскирует разговор от дронных микрофонов. «Broadcast — наше лучшее оружие,» — говорит Басед. «Но гильдия отключит питание в радиусе трёх кварталов через сорок секунд после первого сигнала. Нам нужен план Б — и план Б — это factory.»',
    contextNote: 'Лес Зорге. Костёр, портвейн, план broadcast.',
    accessibilityAnnounce: 'Лесная поляна. Костёр ЧК, стратегическое совещание.',
    proceduralAmbientOverride: 'factory',
    speaker: 'chk_based',
    sceneId: 'chk_campfire_night',
    choices: [
      {
        text: 'Согласиться — factory как запасная передающая станция',
        next: 'act4_exp_factory_glimpse',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'factory_as_backup', flagValue: true },
          { type: 'addKarma', value: 4 },
        ],
      },
      {
        text: 'Предложить мирный марш вместо broadcast — пусть видят люди, не серверы',
        next: 'act4_exp_peaceful_march_prep',
        condition: { minKarma: 40 },
        effects: [
          { type: 'setFlag', flag: 'march_preferred', flagValue: true },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Уйти — ты не часть ЧК, ты часть Сети',
        next: 'act4_exp_street_winter_walk',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     8.  VICTORIA SACRIFICE PREP — Victoria prepares to go undercover in the Guild
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_victoria_sacrifice_prep: {
    id: 'act4_exp_victoria_sacrifice_prep',
    text: 'Виктория стоит в дверях кафе — пальто нараспашку, в глазах то, что бывает у людей перед длинной дорогой без обратного билет. «Я могу войти в гильдию,» — говорит она. «У меня старый логин, старый доступ, и лицо, которое они забыли. Я принесу данные о wipe — но не обещаю вернуться.» Альберт за стойкой молча наливает ей двойной эспрессо. Не благодарит. Не прощается. Просто наливает, как делал каждое утро три года.',
    contextNote: 'Кафе. Виктория перед уходом в гильдию. Альберт молча наливает.',
    accessibilityAnnounce: 'Кафе. Виктория готовится к undercover операции.',
    speaker: 'npc_victoria',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Поддержать — ты веришь в неё, даже если она не верит в возвращение',
        next: 'act4_exp_victoria_last_words',
        goldenPath: true,
        effects: [
          { type: 'npcChange', npcId: 'npc_victoria', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'victoria_undercover_supported', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Предложить другой путь — есть factory, есть bunker, не нужно рисковать собой',
        next: 'act4_exp_victoria_last_words',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 14 } },
        effects: [
          { type: 'npcChange', npcId: 'npc_victoria', npcChange: { relation: 3 } },
          { type: 'setFlag', flag: 'victoria_alternative_offered', flagValue: true },
        ],
      },
      {
        text: 'Отпустить молча — некоторые выборы не обсуждаются',
        next: 'act4_exp_victoria_last_words',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     9.  ALBERT LAST STAND — Albert resolves to protect the Network's core servers
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_albert_last_stand: {
    id: 'act4_exp_albert_last_stand',
    text: 'Альберт выключает кофемолку — впервые за три года кухня без звука. «Я остаюсь,» — говорит он, и голос твёрдый, как металл, который он паял в юности. «Серверы Сети — в подсобке. Если гильдия придёт сюда, я не дам им стереть ядров. Ни стихи, ни логи, ни имена.» Он достает из-под стойки ключ — не от двери, а от распределительного щита. «Если понадобится — я обесточу весь квартал. Десять секунд без питания, и их wipe не сработает. Десять секунд — это мой стихотворение.',
    contextNote: 'Кафе. Альберт решает защищать серверы Сети.',
    accessibilityAnnounce: 'Подсобка кафе. Альберт с ключом от щита.',
    speaker: 'npc_albert',
    sceneId: 'albert_backroom',
    choices: [
      {
        text: 'Помочь укрепить защиту — переписать firewall, зашифровать ядро',
        next: 'act4_exp_chk_defense_plan',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 16 } },
        effects: [
          { type: 'npcChange', npcId: 'npc_albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'core_servers_protected', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Сказать: не один — мы защитим вместе',
        next: 'act4_exp_chk_defense_plan',
        effects: [
          { type: 'npcChange', npcId: 'npc_albert', npcChange: { relation: 5 } },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Уйти — Альберт знает эту кухню лучше тебя',
        next: 'act4_exp_street_winter_walk',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     10. BARISTA COFFEE CODE — The barista encodes messages in coffee orders
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_barista_coffee_code: {
    id: 'act4_exp_barista_coffee_code',
    text: 'Бариста — тихая девушка с татуировкой полузвёрнутого кода на запястье — ставит перед тобой капуччино, и пенка сложена в три символа: «143». Ты знаешь: 1 = «я», 4 = «люблю», 3 = «тебя» — но в гильдийских кодах это значит «ядро — 14:3 — координаты серверной Сети». «Три заказа сегодня,» — говорит она, глядя на стакан. «Двойной эспрессо — Басед. Латте с сиропом — Элис. И ваш — без сахара, как всегда. Порядок заказов — это порядок действий.» Она не улыбается. Она кодирует.',
    contextNote: 'Кафе. Бариста кодирует сообщения в пенке капучино.',
    accessibilityAnnounce: 'Кафе. Бариста, капучино с кодом в пенке.',
    speaker: 'npc_barista',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Расшифровать — координаты, порядок, timing',
        next: 'act4_exp_chk_night_meeting',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'barista_code_decoded', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Спасибо — запомнить код и передать Сети',
        next: 'act4_exp_colleague_betrayal_hint',
        effects: [
          { type: 'setFlag', flag: 'barista_message_received', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     11. STREET CROWD — A crowd gathers on the square — protest or trap?
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_street_crowd: {
    id: 'act4_exp_street_crowd',
    text: 'На площади — двадцать, тридцать, сорок человек. Они не кричат — они стоят. Стоят и смотрят на плакат, как будто пять слов «СТИХИ НЕ СТИРАЮТСЯ» — это программа, которую нужно прочитать глазами, а не сервером. Но ты замечаешь: три человека в одинаковых куртках стоят по краю — не смотрят на плакат, смотрят на толпу. Камеры в карманах. Гильдия не придёт с дронами — она придёт с людьми, которые выглядят как ты. «Это или протест, или приманка,» — шепчет кто-то рядом.',
    contextNote: 'Площадь. Толпа вокруг плаката. Три человека с камерами по краю.',
    accessibilityAnnounce: 'Площадь. Толпа, плакат, подозрительные люди по краю.',
    speaker: 'narrator',
    sceneId: 'city_square',
    choices: [
      {
        text: 'Встать с толпой — если это протест, нужен каждый',
        next: 'act4_exp_peaceful_march_prep',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'joined_crowd', flagValue: true },
          { type: 'addKarma', value: 6 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Предупредить — указать на троих, и пусть люди решают сами',
        next: 'act4_exp_chk_defense_plan',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 14 } },
        effects: [
          { type: 'setFlag', flag: 'guild_spies_identified', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 4 },
        ],
      },
      {
        text: 'Отойти — это не твоя битва, или это ловушка',
        next: 'act4_exp_colleague_betrayal_hint',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     12. ZAREMA DELETED FILES — Files Zarema wrote have been deleted from Guild servers
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_zarema_deleted_files: {
    id: 'act4_exp_zarema_deleted_files',
    text: 'Зарема открывает терминал — экран мерцает зелёным, и на нём — пустота. Не «файл не найден», не «доступ ограничен» — просто пустота, как будто слова никогда не существовали. «Двенадцать отчётов,» — говорит она, и голос дрожит не от страха, а от того, что память стала дырой. «Двенадцать месяцев работы. Стихи, которые я находила в логах. Координаты, маршруты, имена — всё стёрто. Не архивировано. Не зашифровано. Уничтожено.» Она закрывает терминал. «Но я помню. И пока помню — они не стёрли. Они просто не знают, что человек — лучший сервер.',
    contextNote: 'Комната Заремы. Терминал с пустотой — двенадцать файлов стёрты.',
    accessibilityAnnounce: 'Зарема. Терминал пуст — гильдия стёрла двенадцать файлов.',
    speaker: 'npc_zarema',
    sceneId: 'zarema_room',
    choices: [
      {
        text: 'Записать всё на бумагу — бумага дольше серверов держит',
        next: 'act4_exp_factory_baba_zina_call',
        effects: [
          { type: 'setFlag', flag: 'zarema_files_preserved', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Зарема, ты — сервер. Но серверы тоже ломаются. Отдохни.',
        next: 'act4_exp_quiet_zarema_night',
        effects: [
          { type: 'addStat', stat: 'stress', value: -4 },
          { type: 'npcChange', npcId: 'npc_zarema', npcChange: { relation: 4 } },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     13. ROOFTOP CITY VIEW — From the rooftop, the city is a living circuit board
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_rooftop_city_view: {
    id: 'act4_exp_rooftop_city_view',
    text: 'С крыши город — не пейзаж, а схема. Неон — как дорожки на плате, улицы — как шины данных, а люди — как байты, которые двигаются по маршрутизаторам с утра до ночи. Ты видишь башню гильдии — светлую, ровную, с тремя антеннами, которые не передают, а слушают. И ты видишь factory — тёмный, гудящий, с одним окном, где горит жёлтый свет. Между ними — весь город, который не знает, что он — печатная плат, и что кто-то уже стирает самые важные дорожки.',
    contextNote: 'Крыша. Город как схема — неон дорожки, башня гильдии, factory.',
    accessibilityAnnounce: 'Крыша. Город внизу — неон и гул, как живая схема.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Запустить broadcast — шесть минут правды из этой точки',
        next: 'act4_exp_street_neon_blackout',
        condition: { flag: 'broadcast_launched' },
        effects: [
          { type: 'setFlag', flag: 'broadcast_active', flagValue: true },
          { type: 'addKarma', value: 8 },
        ],
      },
      {
        text: 'Спуститься к factory — тёмная точка на схеме, которая гудит',
        next: 'act4_exp_factory_glimpse',
        effects: [
          { type: 'setFlag', flag: 'heading_to_factory', flagValue: true },
        ],
      },
      {
        text: 'Идти к площади — от схемы к людям',
        next: 'act4_exp_street_crowd',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     14. PEACEFUL MARCH PREP — Preparing for the peaceful march — who will lead?
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_peaceful_march_prep: {
    id: 'act4_exp_peaceful_march_prep',
    text: 'В подсобке кафе — пять человек, карта площади, и вопрос, на который нет правильного ответ: кто пойдёт первым? «Мирный марш — это не слабость,» — говорит Альберт. «Это стратегия. Если мы идём с стихами, не с кодом — гильдия не может объявить нас хакерами. Но кто несёт плакат? Кто читает вслух? Кто стоит, когда дроны снизятся?» Зарема смотрит на тебя. Александр — на дверь. Виктория — на свои руки. И тишина, которая бывает перед тем, как кто-то скажет «я.',
    contextNote: 'Подсобка кафе. Пять людей, план мирного марша.',
    accessibilityAnnounce: 'Подсобка. Планирование мирного марша на площади.',
    speaker: 'narrator',
    sceneId: 'albert_backroom',
    choices: [
      {
        text: 'Я поведу — я прочитаю вслух, я буду первым',
        next: 'act4_exp_alexander_choice',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'volodka_march_leader', flagValue: true },
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Попросить Зарему — её отчёт, её голос, её право',
        next: 'act4_exp_alexander_choice',
        condition: { flag: 'zarema_rescued' },
        effects: [
          { type: 'npcChange', npcId: 'npc_zarema', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'zarema_march_leader', flagValue: true },
        ],
      },
      {
        text: 'Марш — не ответ. Broadcast — ответ. Слова должны лететь, не идти.',
        next: 'act4_exp_rooftop_antenna',
        effects: [
          { type: 'setFlag', flag: 'march_rejected', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     15. ALEXANDER CHOICE — Stay in the Guild or join the Network openly
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_alexander_choice: {
    id: 'act4_exp_alexander_choice',
    text: 'Александр стоит у окна — снег на стекле, и его лицо — как интерфейс с двумя кнопками, и ни одна не подписана. «Я четыре года в гильдии,» — говорит он. «Я знаю каждый протокол, каждый цикл, каждую камеру. Если я останусь — я полезен. Я могу подавать данные изнутри. Но если я уйду — я свободен. Я смогу стоять рядом с вами, не за стеной.» Он поворачивается. «Володька, ты выбрал уже. Помоги мне — не скажи, что выбирать, скажи, как выбирать.',
    contextNote: 'Александр у окна. Выбор: гильдия или Сеть.',
    accessibilityAnnounce: 'Александр у окна — выбор между гильдия и Сеть.',
    speaker: 'npc_alexander',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Оставайся внутри — твой доступ стоит больше, чем твоя свобода',
        next: 'act4_exp_victoria_sacrifice_prep',
        effects: [
          { type: 'setFlag', flag: 'alexander_stayed_in_guild', flagValue: true },
          { type: 'npcChange', npcId: 'npc_alexander', npcChange: { relation: -3 } },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Выходи — свобода — это тоже стратегия, и ты нужен нам рядом',
        next: 'act4_exp_victoria_sacrifice_prep',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'alexander_defected', flagValue: true },
          { type: 'npcChange', npcId: 'npc_alexander', npcChange: { relation: 10 } },
          { type: 'addKarma', value: 6 },
        ],
      },
      {
        text: 'Не могу сказать — это не мой выбор, Александр. Это твой.',
        next: 'act4_exp_victoria_sacrifice_prep',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     16. FACTORY BABA ZINA CALL — Baba Zina sends a message through old factory radio
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_factory_baba_zina_call: {
    id: 'act4_exp_factory_baba_zina_call',
    text: 'Радио в цеху — не современное, не цифровое. Ламповый приемник из тысяча девятьсот seventhy третьего, с частотой, которую гильдия не мониторит — потому что не верит, что кто-то ещё слушает. Баба Зина крутит ручку, и из белого шума проступает голос: «Если вы слышите — приходите к Заре. Машина помнит. Машина ждёт.» Ты узнаешь ритм — это не broadcast гильдии, это стихотворение, закодированное в частоту, как пульс, который можно услышать только тем, кто знает, что слушать.',
    contextNote: 'Цех завода. Ламповый радио, голос из белого шума.',
    accessibilityAnnounce: 'Завод. Ламповый радиоприёмник, призыв из шума.',
    proceduralAmbientOverride: 'factory',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Ответить — передать координаты Сети через ту же частоту',
        next: 'act4_exp_factory_glimpse',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'factory_radio_contact', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 6 } },
        ],
      },
      {
        text: 'Прийти к Заре — лично, не по радио',
        next: 'act4_exp_factory_glimpse',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'baba_zina_contacted', flagValue: true },
          { type: 'addKarma', value: 4 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     17. STREET NEON BLACKOUT — Guild cuts power to silence the broadcast
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_street_neon_blackout: {
    id: 'act4_exp_street_neon_blackout',
    text: 'Неон гаснет — не один фонарь, не один квартал, а весь район от башни до реки, как будто кто-то нажал Ctrl+Z на город. Ты на улице, и темнота — не черная, а серая, потому что серверы под землёй всё ещё гудят — им не нужен свет, им нужен ток. Но broadcast-антенна на крыше — мертва. Гильдия обесточила три квартала за сорок секунд, как предупреждал Басед. Вдалеке — один жёлтый огонь: factory. Factory на своей подстанции. Factory не подчинился команде гильдии.',
    contextNote: 'Улица. Неон гаснет — blackout на три квартала.',
    accessibilityAnnounce: 'Улица. Полный blackout — неон мёртв, только factory горит.',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Бежать к factory — единственный свет, единственный сигнал',
        next: 'act4_exp_factory_glimpse',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'heading_to_factory_blackout', flagValue: true },
          { type: 'addStat', stat: 'energy', value: -8 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Вернуться на крышу — проверить антенну, перезапустить',
        next: 'act4_exp_rooftop_city_view',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Ждать — blackout не вечный. Дронные циклы — тоже.',
        next: 'act4_exp_cafe_closed',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     18. VICTORIA LAST WORDS — Victoria's last words before undercover — a poem fragment
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_victoria_last_words: {
    id: 'act4_exp_victoria_last_words',
    text: 'Виктория стоит у двери — и в последний момент, перед тем как шагнуть в неон и камеры, она говорит четыре строки. Не свои — Лебедева: «И в той тишине, где нет ни слова — / Я слышу то, что не сказал никто. / Запомни: я была. Я была. / И это — больше, чем пустота.» Она не ждёт ответа. Она шагает — и дверь кафе закрывается за ней, как терминал, который завершил session. Ты стоишь с четырьмя строками в голове, и понимаешь: это не последние слова. Это — пароль.',
    contextNote: 'Виктория у двери кафе. Четыре строки Лебедева — пароль.',
    accessibilityAnnounce: 'Виктория. Последние строки перед уходом.',
    speaker: 'npc_victoria',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Запомнить пароль — и передать Сети',
        next: 'act4_exp_chk_defense_plan',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'victoria_password_received', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addKarma', value: 6 },
        ],
      },
      {
        text: 'Идти следом — не оставлять её одну в гильдии',
        next: 'act4_exp_alexander_choice',
        condition: { minKarma: 50 },
        effects: [
          { type: 'addStat', stat: 'stress', value: 6 },
          { type: 'setFlag', flag: 'following_victoria', flagValue: true },
        ],
      },
      {
        text: 'Остаться — ты не можешь идти за каждым, кто выбирает жертву',
        next: 'act4_exp_cafe_closed',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     19. CHK DEFENSE PLAN — ЧК prepares defense against Guild crackdown
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_chk_defense_plan: {
    id: 'act4_exp_chk_defense_plan',
    text: 'На поляне у костра — не песни, не портвейн. Только карта, три терминала, и пять лиц, которые не улыбаются. Басед чертит контур: «Гильдия — три фазы: blackout, scan, wipe. Мы — три контрмеры: factory-передача, bunker-убежище, poem-шифр.» Элис перебирает струны — не мелодию, а частоту помех. «Я буду играть на частоте дронов,» — говорит она. «Десять минут помех — десять минут, чтобы люди успели уйти.» Ты понимаешь: защита — не стены. Защита — это ритм, который не совпадает с их ритмом.',
    contextNote: 'Поляна ЧК. Карта, терминалы, три контрмеры против гильдии.',
    accessibilityAnnounce: 'Поляна ЧК. Стратегическое совещание — три контрмеры.',
    proceduralAmbientOverride: 'factory',
    speaker: 'chk_based',
    sceneId: 'chk_campfire_night',
    choices: [
      {
        text: 'Взять poem-шифр — зашифровать координаты Сети в стихотворение',
        next: 'act4_exp_victoria_last_words',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 14 } },
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'poem_cipher_created', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Помочь с bunker — подготовить убежище к приёму людей',
        next: 'act4_exp_albert_last_stand',
        effects: [
          { type: 'setFlag', flag: 'bunker_prep_started', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Выйти на площадь — люди не будут ждать, пока мы чертим схемы',
        next: 'act4_exp_street_crowd',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     20. CAFE CLOSED — The cafe is closed, the barista is gone. Only a note remains.
     ══════════════════════════════════════════════════════════════════════════ */
  act4_exp_cafe_closed: {
    id: 'act4_exp_cafe_closed',
    text: 'Дверь кафе — закрыта. Не на замок, а на код — новый, который ты не знаешь. Окна — тёмные. Стойка — пустая. На стекле — записка, написанная от руки, не распечатана: «Код изменился. Я изменилась. Если ты знаешь, что 1=я, 4=люблю, 3=тебя — ты знаешь, куда я ушла. Не ищи. Стихи не стираются. — Б.» Ты стоишь перед закрытой дверью, и в голове — три цифры, пять слов, и город, который стал темнее на одно кафе, но ярче на одно решение.',
    contextNote: 'Кафе закрыто. Записка на стекле — код и признание.',
    accessibilityAnnounce: 'Кафе закрыто. Записка на стекле от бариста.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Расшифровать записку — 1-4-3 значит «я люблю тебя», и это координаты',
        next: 'act4_exp_chk_night_meeting',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'setFlag', flag: 'barista_note_decoded', flagValue: true },
          { type: 'setFlag', flag: 'barista_location_known', flagValue: true },
        ],
      },
      {
        text: 'Не искать — она выбрала. У каждого свой путь под неоном.',
        next: 'act4_exp_street_neon_blackout',
        effects: [
          { type: 'addStat', stat: 'stress', value: -2 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Идти к factory — единственное место, где ещё горит свет',
        next: 'act4_exp_factory_baba_zina_call',
        effects: [
          { type: 'setFlag', flag: 'factory_after_cafe_closed', flagValue: true },
        ],
      },
    ],
  },
};
