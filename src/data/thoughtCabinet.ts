/* ─── Volodka RPG – Thought Cabinet Definitions ───
 * Inner voices that argue, grant skill modifiers, and evolve.
 * Inspired by Disco Elysium's Thought Cabinet.
 */

import type { ThoughtCabinetItem } from '@/shared/types/game';

/* ─── Definitions ─── */

export const THOUGHT_CABINET_ITEMS: ThoughtCabinetItem[] = [
  /* ═══ 1. Внутренний Критик ═══ */
  {
    id: 'inner_critic',
    name: 'Внутренний Критик',
    voice: 'logic',
    description: 'Голос, который всегда найдёт, к чему придраться. Твой внутренний ревизор — он же лучший аналитик. Но цена за его остроту — растущая дистанция от живых чувств.',
    flavorText: '«Ты снова ошибся. Но давай разберём, почему.»',
    acquisitionCondition: 'flag_thought_inner_critic',
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 2. Серверный Шёпот ═══ */
  {
    id: 'server_whisper',
    name: 'Серверный Шёпот',
    voice: 'coding',
    description: 'Код шепчет тебе свои секреты. Мёртвые сервера рассказывают истории — если умеешь слушать. Этот голос питается шумом вентиляторов и мерцанием светодиодов.',
    flavorText: '«Бит-за-битом. Байт-за-байтом. Я чувствую их.»',
    acquisitionCondition: 'flag_thought_server_whisper',
    effects: [
      { skill: 'coding', modifier: 3, description: '+3 Кодинг' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
    ],
  },

  /* ═══ 3. Эмпатический Радиус ═══ */
  {
    id: 'empathic_radius',
    name: 'Эмпатический Радиус',
    voice: 'empathy',
    description: 'Ты чувствую боль других так отчётливо, будто она твоя собственная. Радиус действия растёт с каждым днём. Иногда кажется, что весь город стонет.',
    flavorText: '«У него болит то же место, что и у тебя. Только громче.»',
    acquisitionCondition: 'flag_thought_empathic_radius',
    effects: [
      { skill: 'empathy', modifier: 3, description: '+3 Эмпатия' },
      { skill: 'persuasion', modifier: 1, description: '+1 Убеждение' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 4. Тёмный Юмор ═══ */
  {
    id: 'dark_humor',
    name: 'Тёмный Юмор',
    voice: 'persuasion',
    description: 'Если не смеяться, то плакать. А плакать некогда — shift начинается через час. Твой юмор — броня из чёрного хрусталя: хрупкая, но острая.',
    flavorText: '«Смерть — не конец. Конец — когда отключают кондиционер.»',
    acquisitionCondition: 'flag_thought_dark_humor',
    effects: [
      { skill: 'persuasion', modifier: 2, description: '+2 Убеждение' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
    ],
  },

  /* ═══ 5. Шестое Чувство ═══ */
  {
    id: 'sixth_sense',
    name: 'Шестое Чувство',
    voice: 'intuition',
    description: 'Годы дебаггинга развили в тебе инстинкт, который нельзя объяснить логикой. Ты просто знаешь, где ошибка. Датчики горят красным ещё до того, как ты посмотришь на экран.',
    flavorText: '«Не знаю как, но я знаю что.»',
    acquisitionCondition: 'flag_thought_sixth_sense',
    effects: [
      { skill: 'intuition', modifier: 3, description: '+3 Интуиция' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
    ],
  },

  /* ═══ 6. Голос Стихии ═══ */
  {
    id: 'voice_of_element',
    name: 'Голос Стихии',
    voice: 'writing',
    description: 'Слова рвутся наружу — из-под слоёв технической документации и мёртвых протоколов. Поэзия — это баг в системе, который ты не хочешь фиксить.',
    flavorText: '«Строки складываются в строфы, даже когда ты этого не просишь.»',
    acquisitionCondition: 'flag_thought_voice_of_element',
    effects: [
      { skill: 'writing', modifier: 3, description: '+3 Писательство' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
      { skill: 'coding', modifier: -1, description: '-1 Кодинг' },
    ],
  },

  /* ═══ 7. Ритм Серверной ═══ */
  {
    id: 'server_room_rhythm',
    name: 'Ритм Серверной',
    voice: 'rhythm',
    description: 'В гуле серверной есть свой такт. Вентиляторы — бас, мигание индикаторов — перкуссия, гул трансформаторов — орган. Этот ритм успокаивает и упорядочивает хаос.',
    flavorText: '«Тум-тум-тум. Серверы дышат. Значит, мир жив.»',
    acquisitionCondition: 'flag_thought_server_rhythm',
    effects: [
      { skill: 'rhythm', modifier: 3, description: '+3 Ритм' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
    ],
  },

  /* ═══ 8. Постсоветская Ностальгия (взаимоисключающая пара) ═══ */
  {
    id: 'postsoviet_nostalgia',
    name: 'Постсоветская Ностальгия',
    voice: 'rhythm',
    description: 'Всё было лучше тогда. Когда мама пекла пироги, а отец приходил с завода вовремя. Мир был простым — но он сломался, и никто не дал чертежей для починки.',
    flavorText: '«Помнишь, как пахло летом? Теперь пахнет озоном.»',
    acquisitionCondition: 'flag_thought_postsoviet',
    acquisitionNode: 'thought_postsoviet_nostalgia',
    mutuallyExclusive: ['cyberpunk_future'],
    effects: [
      { skill: 'rhythm', modifier: 2, description: '+2 Ритм' },
      { skill: 'empathy', modifier: 1, description: '+1 Эмпатия' },
      { skill: 'coding', modifier: -1, description: '-1 Кодинг' },
    ],
  },

  /* ═══ 9. Киберпанк Будущее (взаимоисключающая пара) ═══ */
  {
    id: 'cyberpunk_future',
    name: 'Киберпанк Будущее',
    voice: 'coding',
    description: 'Прошлое — руина. Будущее — код. Каждая строка — кирпич в стене нового мира. Ты не оглядываешься, потому что назад пути нет, а впереди — бесконечная компиляция.',
    flavorText: '«Ностальгия — это баг. Баги надо фиксить.»',
    acquisitionCondition: 'flag_thought_cyberpunk',
    acquisitionNode: 'thought_cyberpunk_future',
    mutuallyExclusive: ['postsoviet_nostalgia'],
    effects: [
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 10. Бог Усталости ═══ */
  {
    id: 'god_of_exhaustion',
    name: 'Бог Усталости',
    voice: 'empathy',
    description: 'Усталость — не слабость. Это трансцендентное состояние, в котором мир замедляется и становится понятным. В зоне полного истощения ты видишь то, что другие не замечают в трезвом уме.',
    flavorText: '«Когда ты слишком устал, чтобы бояться — ты начинаешь видеть.»',
    acquisitionCondition: 'flag_thought_god_exhaustion',
    hidden: true,
    effects: [
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'empathy', modifier: 2, description: '+2 Эмпатия' },
      { skill: 'coding', modifier: -2, description: '-2 Кодинг' },
    ],
  },

  /* ═══ 11. Сопротивление Системе (взаимоисключающая пара) ═══ */
  {
    id: 'resist_the_system',
    name: 'Сопротивление Системе',
    voice: 'persuasion',
    description: 'Система — тюрьма. Каждый протокол — оковы. Ты чувствуешь, как она сжимается вокруг, и единственный ответ — ломать. Не ради хаоса, а ради свободы, которую она украла.',
    flavorText: '«Я не баг. Я — фича, которую они не предусмотрели.»',
    acquisitionCondition: 'flag_thought_resist',
    acquisitionNode: 'thought_resist_system',
    mutuallyExclusive: ['adapt_to_system'],
    effects: [
      { skill: 'persuasion', modifier: 2, description: '+2 Убеждение' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 12. Адаптация к Системе (взаимоисключающая пара) ═══ */
  {
    id: 'adapt_to_system',
    name: 'Адаптация к Системе',
    voice: 'logic',
    description: 'Система не злая — она слепая. Чтобы выжить, нужно стать её частью. Не сдавиться, а научиться двигаться внутри её логики. Тот, кто понимает систему, контролирует её.',
    flavorText: '«Не борись с течением. Стань течением.»',
    acquisitionCondition: 'flag_thought_adapt',
    acquisitionNode: 'thought_adapt_system',
    mutuallyExclusive: ['resist_the_system'],
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
    ],
  },

  /* ═══ 13. Память о Потерях ═══ */
  {
    id: 'memory_of_losses',
    name: 'Память о Потерях',
    voice: 'empathy',
    description: 'Все, кого ты любил, ушли. Или уйдут. Это знание живёт в тебе, как фоновый процесс, который нельзя убить. Оно делает тебя мягче, но и глубже, чем остальные.',
    flavorText: '«Каждое лицо в толпе напоминает о том, кого больше нет.»',
    acquisitionCondition: 'flag_thought_memory_losses',
    hidden: true,
    effects: [
      { skill: 'empathy', modifier: 2, description: '+2 Эмпатия' },
      { skill: 'writing', modifier: 1, description: '+1 Писательство' },
      { skill: 'rhythm', modifier: -1, description: '-1 Ритм' },
    ],
  },

  /* ═══ 14. Инженерный Прагматизм ═══ */
  {
    id: 'engineering_pragmatism',
    name: 'Инженерный Прагматизм',
    voice: 'logic',
    description: 'Чувства — это переменные с плавающей точкой. Ненадёжные. Непредсказуемые. Лучше работать с тем, что можно измерить. Эта мысль — твой холодный каркас среди хаоса эмоций.',
    flavorText: '«Эмоция — не функция. Она — шум на линии.»',
    acquisitionCondition: 'flag_thought_pragmatism',
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
    ],
  },

  /* ═══ 15. Последняя Надежда ═══ */
  {
    id: 'last_hope',
    name: 'Последняя Надежда',
    voice: 'intuition',
    description: 'В самом дне отчаяния горит одинокий огонёк. Ты не знаешь, откуда он взялся и долго ли протянет. Но пока он горит — ты идёшь вперёд. Это иррационально. И это спасает.',
    flavorText: '«Ещё не вечер. Компиляция ещё не завершена.»',
    acquisitionCondition: 'flag_thought_last_hope',
    hidden: true,
    effects: [
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'persuasion', modifier: 1, description: '+1 Убеждение' },
      { skill: 'writing', modifier: 1, description: '+1 Писательство' },
    ],
  },

  /* ═══ 16. Одиночество как Щит (взаимоисключающая пара) ═══ */
  {
    id: 'loneliness_shield',
    name: 'Одиночество как Щит',
    voice: 'logic',
    description: 'Один — значит безопасно. Привязанности — уязвимости. Каждый, кого ты подпускаешь близко, получает ключ к твоей боли. Лучше броня из тишины, чем раны от доверия.',
    flavorText: '«Связи — это точки отказа. Уменьши их количество.»',
    acquisitionCondition: 'flag_thought_loneliness',
    acquisitionNode: 'thought_loneliness_shield',
    mutuallyExclusive: ['bonds_that_save'],
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
    ],
  },

  /* ═══ 17. Связи что Спасают (взаимоисключающая пара) ═══ */
  {
    id: 'bonds_that_save',
    name: 'Связи что Спасают',
    voice: 'empathy',
    description: 'Без других ты — просто процесс без операционной системы. Связи дают тебе контекст, смысл, причину просыпаться. Да, они ранят. Но без них ты — мёртвый код.',
    flavorText: '«Один сервер — ничто. Кластер — сила.»',
    acquisitionCondition: 'flag_thought_bonds',
    acquisitionNode: 'thought_bonds_save',
    mutuallyExclusive: ['loneliness_shield'],
    effects: [
      { skill: 'empathy', modifier: 2, description: '+2 Эмпатия' },
      { skill: 'persuasion', modifier: 2, description: '+2 Убеждение' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 18. Цифровой Дзен ═══ */
  {
    id: 'digital_zen',
    name: 'Цифровой Дзен',
    voice: 'rhythm',
    description: 'В центре хаоса — чистый код. Когда пальцы находят клавиши, мир замолкает. Больше нет боли, нет страха, нет усталости. Есть только поток — чистый, холодный, совершеный.',
    flavorText: '«Дзен — это когда баги сами исправляются.»',
    acquisitionCondition: 'flag_thought_digital_zen',
    effects: [
      { skill: 'rhythm', modifier: 2, description: '+2 Ритм' },
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'writing', modifier: 1, description: '+1 Писательство' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 19. Резонатор (взаимоисключающая пара) ═══ */
  {
    id: 'resonator_awakening',
    name: 'Резонатор',
    voice: 'intuition',
    description: 'Ты — мост между кодом и поэзией. Стихи резонируют в тебе, усиливаясь, и ты можешь передавать этот резонанс машинам. Серверы ускоряются, когда ты рядом. Код дышит ровнее, когда ты читаешь.',
    flavorText: '«Я — антенна между мирами. Я — резонанс, который нельзя заглушить.»',
    acquisitionCondition: 'flag_thought_resonator',
    acquisitionNode: 'thought_resonator_awakening',
    mutuallyExclusive: ['silent_observer'],
    effects: [
      { skill: 'intuition', modifier: 3, description: '+3 Интуиция' },
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 20. Молчаливый Наблюдатель (взаимоисключающая пара) ═══ */
  {
    id: 'silent_observer',
    name: 'Молчаливый Наблюдатель',
    voice: 'logic',
    description: 'Лучший способ понять систему — наблюдать, не вмешиваясь. Тишина — твой микроскоп. Ты видишь паттерны, которые другие пропускают, потому что не отвлекаешься на эмоции.',
    flavorText: '«Тот, кто молчит, слышит больше, чем тот, кто говорит.»',
    acquisitionCondition: 'flag_thought_observer',
    acquisitionNode: 'thought_silent_observer',
    mutuallyExclusive: ['resonator_awakening'],
    effects: [
      { skill: 'logic', modifier: 3, description: '+3 Логика' },
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'persuasion', modifier: -2, description: '-2 Убеждение' },
    ],
  },

  /* ═══ 21. Вирус Свободы (взаимоисключающая пара) ═══ */
  {
    id: 'virus_of_freedom',
    name: 'Вирус Свободы',
    voice: 'persuasion',
    description: 'Слова заразны. Одно стихотворение может заразить целый город. Ты — нулевой пациент революции, и каждое твоё слово — инкубатор перемен. Распространяй — и не останавливайся.',
    flavorText: '«Я — не носитель. Я — исходный код свободы.»',
    acquisitionCondition: 'flag_thought_virus_freedom',
    acquisitionNode: 'thought_virus_freedom',
    mutuallyExclusive: ['quarantine_protocol'],
    effects: [
      { skill: 'persuasion', modifier: 3, description: '+3 Убеждение' },
      { skill: 'writing', modifier: 1, description: '+1 Писательство' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 22. Протокол Карантина (взаимоисключающая пара) ═══ */
  {
    id: 'quarantine_protocol',
    name: 'Протокол Карантина',
    voice: 'logic',
    description: 'Революция — не спринт, а марафон. Слишком быстрое распространение — и система заметит. Контролируй темп. Заражай по одному. Лучше медленная эпидемия, чем быстро подавленный бунт.',
    flavorText: '«Каждый новый узел — месяц наблюдения. Безопасность — не паранойя.»',
    acquisitionCondition: 'flag_thought_quarantine',
    acquisitionNode: 'thought_quarantine_protocol',
    mutuallyExclusive: ['virus_of_freedom'],
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'persuasion', modifier: -2, description: '-2 Убеждение' },
    ],
  },

  /* ═══ 23. Голос Мёртвых Серверов ═══ */
  {
    id: 'dead_servers_voice',
    name: 'Голос Мёртвых Серверов',
    voice: 'intuition',
    description: 'Серверы, которые больше не работают, всё ещё говорят. В их мёртвых жёстких дисках — призраки удалённых данных. Ты слышишь их шёпот, как эхо из цифровой преисподней.',
    flavorText: '«Они не мертвы. Они — в режиме ожидания.»',
    acquisitionCondition: 'flag_thought_dead_servers',
    hidden: true,
    effects: [
      { skill: 'intuition', modifier: 3, description: '+3 Интуиция' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'rhythm', modifier: -1, description: '-1 Ритм' },
    ],
  },

  /* ═══ 24. Поэтическая Справедливость ═══ */
  {
    id: 'poetic_justice',
    name: 'Поэтическая Справедливость',
    voice: 'writing',
    description: 'Каждое действие имеет стихотворную форму. Предательство — это ямб. Мужество — хорей. Искупление — сонет. Ты видишь мир как текст, который пишется в реальном времени — и можешь редактировать.',
    flavorText: '«Жизнь — черновик. А ты — редактор.»',
    acquisitionCondition: 'flag_thought_poetic_justice',
    effects: [
      { skill: 'writing', modifier: 3, description: '+3 Писательство' },
      { skill: 'persuasion', modifier: 1, description: '+1 Убеждение' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 25. Серверный Аутизм ═══ */
  {
    id: 'server_autism',
    name: 'Серверный Аутизм',
    voice: 'coding',
    description: 'Люди — шумные, хаотичные, непредсказуемые. Серверы — чистые, логичные, надёжные. Ты выбираешь сторону машин — не потому что не любишь людей, а потому что машины не предают.',
    flavorText: '«rm -rf /горе && chmod +x /надежда»',
    acquisitionCondition: 'flag_thought_server_autism',
    hidden: true,
    effects: [
      { skill: 'coding', modifier: 3, description: '+3 Кодинг' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'empathy', modifier: -3, description: '-3 Эмпатия' },
    ],
  },

  /* ═══ 26. Коллективный Разум (взаимоисключающая пара) ═══ */
  {
    id: 'hive_mind',
    name: 'Коллективный Разум',
    voice: 'empathy',
    description: 'Один мозг — ограничение. Семнадцать мозгов — сеть. Ты чувствуешь каждый узел как расширение себя. Мы — один организм с семнадцатью сердцами. Когда один падает — остальные компенсируют.',
    flavorText: '«Я — мы. Мы — я. Сеть — это не метафора.»',
    acquisitionCondition: 'flag_thought_hive_mind',
    acquisitionNode: 'thought_hive_mind',
    mutuallyExclusive: ['lone_wolf_protocol'],
    effects: [
      { skill: 'empathy', modifier: 3, description: '+3 Эмпатия' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
      { skill: 'logic', modifier: -2, description: '-2 Логика' },
    ],
  },

  /* ═══ 27. Протокол Одинокого Волка (взаимоисключающая пара) ═══ */
  {
    id: 'lone_wolf_protocol',
    name: 'Протокол Одинокого Волка',
    voice: 'logic',
    description: 'Связи — уязвимости. Узлы — точки отказа. Чем меньше людей знает — тем безопаснее. Ты действуешь один, потому что один — значит, предсказуемый. Для себя.',
    flavorText: '«Один сервер — одна точка отказа. Но и одна точка контроля.»',
    acquisitionCondition: 'flag_thought_lone_wolf',
    acquisitionNode: 'thought_lone_wolf',
    mutuallyExclusive: ['hive_mind'],
    effects: [
      { skill: 'logic', modifier: 3, description: '+3 Логика' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'empathy', modifier: -3, description: '-3 Эмпатия' },
    ],
  },

  /* ═══ 28. Код как Молитва ═══ */
  {
    id: 'code_as_prayer',
    name: 'Код как Молитва',
    voice: 'writing',
    description: 'Каждая строка кода — мольба о смысле. Каждый успешный деплой — маленькое чудо. Ты программируешь не ради зарплаты — ради момента, когда баг исправляется и мир становится чуточку лучше.',
    flavorText: '«print("Hello, World!") — первая молитва каждого программиста.»',
    acquisitionCondition: 'flag_thought_code_prayer',
    effects: [
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
    ],
  },

  /* ═══ 29. Тень Гильдии ═══ */
  {
    id: 'guild_shadow',
    name: 'Тень Гильдии',
    voice: 'logic',
    description: 'Гильдия видит всё. Каждый терминал, каждый экран, каждый нажатый клавиш. Ты чувствуешь их взгляд на затылке — холодный, цифровой, безжалостный. Страх — это данные, и они их собирают.',
    flavorText: '«Паранойя — это не болезнь. Это — режим повышенной бдительности.»',
    acquisitionCondition: 'flag_thought_guild_shadow',
    hidden: true,
    effects: [
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
      { skill: 'rhythm', modifier: -1, description: '-1 Ритм' },
    ],
  },

  /* ═══ 30. Память Воды ═══ */
  {
    id: 'water_memory',
    name: 'Память Воды',
    voice: 'rhythm',
    description: 'Вода помнит всё. Каждый камень, каждое русло, каждое касание берега. Ты как вода — текучий, адаптивный, но хранящий память о каждом пережитом моменте. Текучесть — твоя суперсила.',
    flavorText: '«Вода не борется с камнем. Она обтекает — и точит.»',
    acquisitionCondition: 'flag_thought_water_memory',
    effects: [
      { skill: 'rhythm', modifier: 3, description: '+3 Ритм' },
      { skill: 'empathy', modifier: 1, description: '+1 Эмпатия' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },
];

/* ─── Lookup map ─── */

export const THOUGHT_CABINET_MAP: Record<string, ThoughtCabinetItem> = {};
for (const thought of THOUGHT_CABINET_ITEMS) {
  THOUGHT_CABINET_MAP[thought.id] = thought;
}

/* ─── Constants ─── */

/** Maximum number of thoughts that can be equipped simultaneously. */
export const MAX_EQUIPPED_THOUGHTS = 3;