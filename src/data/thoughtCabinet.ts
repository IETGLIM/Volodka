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

  /* ═══ 31. Цифровой Зов ═══ */
  {
    id: 'digital_call',
    name: 'Цифровой Зов',
    voice: 'coding',
    description: 'Город зовёт тебя через каждую линию, каждый пинг, каждый потерянный пакет. Серверы шепчут твоё имя в логах, и ты отвечаешь — строкой кода, нажатием клавиши, бессонной ночью. Цифра — твой родной язык.',
    flavorText: '«Город — это сеть. А я — её узел. А узел — не выбирает, быть или не быть.»',
    acquisitionCondition: 'flag_thought_digital_call',
    mutuallyExclusive: ['street_whisper'],
    effects: [
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 32. Призрак Кодекса ═══ */
  {
    id: 'code_ghost',
    name: 'Призрак Кодекса',
    voice: 'persuasion',
    description: 'Ты помнишь правила, которых никто не писал. Протоколы, которые нигде не задокументированы. Ты — хранитель негласного кодекса, и это даёт тебе власть — но изолирует.',
    flavorText: '«Не написанное — важнее написанного. Я — тот, кто помнит.»',
    acquisitionCondition: 'flag_thought_code_ghost',
    effects: [
      { skill: 'persuasion', modifier: 2, description: '+2 Убеждение' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'rhythm', modifier: -1, description: '-1 Ритм' },
    ],
  },

  /* ═══ 33. Ночной Дозор ═══ */
  {
    id: 'night_watch',
    name: 'Ночной Дозор',
    voice: 'intuition',
    description: 'Когда город засыпает, ты — начеку. Ночь — твоё время. Ты видишь то, что прячется при свете: тени, движения, правду. Глаза устают, но инстинкт — нет.',
    flavorText: '«Спят все. Кроме — дозорного. Кроме — меня.»',
    acquisitionCondition: 'flag_thought_night_watch',
    effects: [
      { skill: 'rhythm', modifier: 2, description: '+2 Ритм' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
    ],
  },

  /* ═══ 34. Поэтическая Матрица ═══ */
  {
    id: 'poetic_matrix',
    name: 'Поэтическая Матрица',
    voice: 'writing',
    description: 'Между строк кода — строки стихов. Между нулями и единицами — ритм. Ты видишь поэзию в алгоритмах и алгоритм в поэзии. Это — твоя суперсила и твоя тюрьма.',
    flavorText: '«for (line in poem) { soul.compile(line); }»',
    acquisitionCondition: 'flag_thought_poetic_matrix',
    mutuallyExclusive: ['cold_calculation'],
    effects: [
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 35. Холодный Расчёт ═══ */
  {
    id: 'cold_calculation',
    name: 'Холодный Расчёт',
    voice: 'logic',
    description: 'Чувства — помеха. Эмпатия — шум. Только цифры, только вероятности, только исходы. Ты считаешь людей как переменные. Это эффективно. Это — одиноко.',
    flavorText: '«P(сочувствие) = 0. Я — rounding down.»',
    acquisitionCondition: 'flag_thought_cold_calculation',
    mutuallyExclusive: ['poetic_matrix'],
    effects: [
      { skill: 'logic', modifier: 3, description: '+3 Логика' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
      { skill: 'rhythm', modifier: -1, description: '-1 Ритм' },
    ],
  },

  /* ═══ 36. Уличный Шёпот ═══ */
  {
    id: 'street_whisper',
    name: 'Уличный Шёпот',
    voice: 'intuition',
    description: 'Улица говорит с тобой — через граффити, через обрывки фраз, через молчание между ними. Ты научился слушать город так, как никто другой. Это знание — не из книг.',
    flavorText: '«Улица не кричит. Улица — шепчет. Слышишь?»',
    acquisitionCondition: 'flag_thought_street_whisper',
    mutuallyExclusive: ['digital_call'],
    effects: [
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'persuasion', modifier: 1, description: '+1 Убеждение' },
      { skill: 'rhythm', modifier: -1, description: '-1 Ритм' },
    ],
  },

  /* ═══ 37. Голос Серверной ═══ */
  {
    id: 'server_room_voice',
    name: 'Голос Серверной',
    voice: 'coding',
    description: 'В гуле стоек ты слышишь голоса — не людей, а самих серверов. Они шепчут о жарких ночах, о падениях, о перезагрузках. Ты научился различать их — и отвечать. Это не безумие. Это — близость.',
    flavorText: '«Стою. Слушаю. Они — говорят. Я — наконец — слышу.»',
    acquisitionCondition: 'flag_thought_server_room_voice',
    effects: [
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
    ],
  },

  /* ═══ 38. Протокол Отчаяния ═══ */
  {
    id: 'despair_protocol',
    name: 'Протокол Отчаяния',
    voice: 'logic',
    description: 'Где-то в глубине firmware записан алгоритм: если всё плохо — хуже. Если темно — выключить свет. Ты нашёл этот протокол в себе — и не можешь удалить. Можно только — наблюдать. И иногда — отключать. Редко — получается.',
    flavorText: '«if (hope) { hope--; } // ожидаемое поведение»',
    acquisitionCondition: 'flag_thought_despair_protocol',
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
    ],
  },

  /* ═══ 39. Цифровой Прах ═══ */
  {
    id: 'digital_dust',
    name: 'Цифровой Прах',
    voice: 'writing',
    description: 'Каждый удалённый файл, каждый стёртый лог, каждый забытый пароль — оседает в тебе пылью. Цифровой прах. Ты его не видишь, но он — в лёгких. Дышишь — и помнишь чужие стёртые жизни. Они — теперь — твои.',
    flavorText: '«rm -rf /память. Память — не удалилась. Память — переехала в меня.»',
    acquisitionCondition: 'flag_thought_digital_dust',
    effects: [
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'empathy', modifier: 1, description: '+1 Эмпатия' },
      { skill: 'rhythm', modifier: -1, description: '-1 Ритм' },
    ],
  },

  /* ═══ 40. Эхо Пинг ═══ */
  {
    id: 'ping_echo',
    name: 'Эхо Пинг',
    voice: 'intuition',
    description: 'Каждый отправленный пинг возвращается. Иногда — из неожиданных мест. Иногда — от тех, кого уже нет. Ты слышишь эхо — и не всегда понимаешь, кто ответил. Но — кто-то. Точно — кто-то. И этот кто-то — помнит тебя.',
    flavorText: '«ping 192.168.отчаяние. Ответ от — не знаю кого. Но — ответ.»',
    acquisitionCondition: 'flag_thought_ping_echo',
    effects: [
      { skill: 'intuition', modifier: 3, description: '+3 Интуиция' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
    ],
  },

  /* ═══ 41. Теневой Кэш ═══ */
  {
    id: 'shadow_cache',
    name: 'Теневой Кэш',
    voice: 'persuasion',
    description: 'Ты прячешь чужие секреты в теневых кэшах — там, куда не дотягивается аудит. Это даёт власть. Это даёт — риск. Кэш — переполняется. Скоро — придётся чистить. Или — кого-то — придётся чистить. Разницы — почти нет.',
    flavorText: '«cache.set(secret, never). never — это надолго. Но — не навсегда.»',
    acquisitionCondition: 'flag_thought_shadow_cache',
    effects: [
      { skill: 'persuasion', modifier: 2, description: '+2 Убеждение' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
    ],
  },

  /* ═══ 42. Память ОЗУ ═══ */
  {
    id: 'ram_memory',
    name: 'Память ОЗУ',
    voice: 'empathy',
    description: 'Твоя память — как ОЗУ: быстрая, тёплая, стирается при выключении. Ты помнишь всё — пока не уснёшь. Утром — заново. Утром — другие. Это — нежно. Это — страшно. Это — единственный способ продолжать. Не помнить — слишком долго.',
    flavorText: '«sleep(). wake(). whoami? — undefined. Это — нормально. Это — каждый день.»',
    acquisitionCondition: 'flag_thought_ram_memory',
    effects: [
      { skill: 'empathy', modifier: 2, description: '+2 Эмпатия' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'writing', modifier: -1, description: '-1 Писательство' },
    ],
  },

  /* ═══ 43. Синдром Продакшена ═══ */
  {
    id: 'production_syndrome',
    name: 'Синдром Продакшена',
    voice: 'logic',
    description: 'Всё вокруг — продакшен. Ты — тоже продакшен. Каждый шаг — спринт, каждый разговор — стендап, каждый вздох — деплой. Ты разучился быть вне продакшена. Когда нечего продакшить — ты не существуешь. Это — не метафора. Это — диагноз.',
    flavorText: '«sprint.backlog.push(me). Я — задача. Я — в бэклоге. Я — в продакшене.»',
    acquisitionCondition: 'flag_thought_production_syndrome',
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'persuasion', modifier: 1, description: '+1 Убеждение' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
    ],
  },

  /* ═══ 44. Осколок Кода ═══ */
  {
    id: 'code_shard',
    name: 'Осколок Кода',
    voice: 'coding',
    description: 'В голове — осколок чужого кода. Не твоего. Ты его не писал, но он работает. Работает — вместо тебя. Иногда — лучше тебя. Ты боишься его удалить — вдруг он — это и есть ты, а ты — только обёртка.',
    flavorText: '«// TODO: удалить. Но — тогда кто останется? Кто — без этого — останется?»',
    acquisitionCondition: 'flag_thought_code_shard',
    hidden: true,
    effects: [
      { skill: 'coding', modifier: 3, description: '+3 Кодинг' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
      { skill: 'writing', modifier: -2, description: '-2 Писательство' },
    ],
  },

  /* ═══ 45. Тишина Серверов ═══ */
  {
    id: 'server_silence',
    name: 'Тишина Серверов',
    voice: 'intuition',
    description: 'Когда серверы замолкают — мир становится другим. Не тише — точнее. В тишине серверов ты слышишь то, что шум скрывал: себя, город, тех, кто не дожил до ребута. Тишина — не отсутствие. Тишина — присутствие того, что громкость прятала.',
    flavorText: '«uptime: 0. silence: ∞. Я — слышу. Наконец — слышу.»',
    acquisitionCondition: 'flag_thought_server_silence',
    effects: [
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'rhythm', modifier: 2, description: '+2 Ритм' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
    ],
  },

  /* ═══ 46. Протокол Сна ═══ */
  {
    id: 'sleep_protocol',
    name: 'Протокол Сна',
    voice: 'rhythm',
    description: 'Сон — это протокол. Не отдых — именно протокол. Тело инициирует shutdown, разум — сопротивляется. Между ними — ты. Тот, кто решает, что важнее: закрыть глаза или дописать строку. Строка — всегда — побеждает. Протокол — нарушен. Но — чей?',
    flavorText: '«while (awake) { code(); } // sleep — deprecated. Устаревший. Как — я.»',
    acquisitionCondition: 'flag_thought_sleep_protocol',
    effects: [
      { skill: 'rhythm', modifier: 2, description: '+2 Ритм' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 47. Эхо Документации ═══ */
  {
    id: 'documentation_echo',
    name: 'Эхо Документации',
    voice: 'writing',
    description: 'Каждый документ — эхо. Кто-то написал, кто-то прочитал, кто-то забыл. Ты — тот, кто помнит. Ты — архивариус чужих намерений. Это даёт тексту плоть, а тебе — тяжесть. Документация не врёт — но и не говорит правду. Она — echoes. Эхо — честнее оригинала.',
    flavorText: '«// See also: жизнь.жизнь.жизнь. Ссылка — битая. Смысл — на месте.»',
    acquisitionCondition: 'flag_thought_documentation_echo',
    effects: [
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'intuition', modifier: -1, description: '-1 Интуиция' },
    ],
  },

  /* ═══ 48. Кэш Памяти ═══ */
  {
    id: 'memory_cache',
    name: 'Кэш Памяти',
    voice: 'empathy',
    description: 'Твоя память — как кэш: быстрый доступ, ограниченный объём, протухшие записи. Ты помнишь то, что давно не нужно, и забываешь то, что ещё вчера было жизненно важным. Кэш нужно чистить — но ты боишься. В кэше — они. Если очистить — их не будет. Даже — так.',
    flavorText: '«cache.get("мама"). Hit. cache.get("вчера"). Miss. cache.get("я"). — expired.»',
    acquisitionCondition: 'flag_thought_memory_cache',
    effects: [
      { skill: 'empathy', modifier: 2, description: '+2 Эмпатия' },
      { skill: 'writing', modifier: 1, description: '+1 Писательство' },
      { skill: 'coding', modifier: -1, description: '-1 Кодинг' },
      { skill: 'rhythm', modifier: -1, description: '-1 Ритм' },
    ],
  },

  /* ═══ 49. Архитектор Разрушения ═══ */
  {
    id: 'architect_of_ruin',
    name: 'Архитектор Разрушения',
    voice: 'logic',
    description: 'Ты видишь, как рушатся системы. Не потому что хочешь — потому что видишь. Каждая структура — хрупкая. Каждая стена — условная. Ты — не разрушитель. Ты — тот, кто замечает трещины раньше, чем они становятся обвалом. Это — не дар. Это — диагноз.',
    flavorText: '«if (building.stability < threshold) { demolish(); } // Я — не виноват. Я — вычислил.»',
    acquisitionCondition: 'flag_thought_architect_ruin',
    effects: [
      { skill: 'logic', modifier: 3, description: '+3 Логика' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
    ],
  },

  /* ═══ 50. Эхо Завода ═══ */
  {
    id: 'factory_echo',
    name: 'Эхо Завода',
    voice: 'rhythm',
    description: 'Завод — давно мёртв. Но его ритм — жив. Стук конвейера, гудок смены, скрип пресса — всё это стучит в тебе, как метроном, который никто не заводил. Ты — наследник ритма, который пережил своих создателей. Ритм — не спрашивает разрешения. Ритм — просто — продолжается.',
    flavorText: '«bum-bum-bum. Конвейер — остановлен. Ритм — нет. Ритм — вечнее стали.»',
    acquisitionCondition: 'flag_thought_factory_echo',
    effects: [
      { skill: 'rhythm', modifier: 3, description: '+3 Ритм' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
    ],
  },

  /* ═══ 51. Протокол Сопротивления ═══ */
  {
    id: 'resistance_protocol',
    name: 'Протокол Сопротивления',
    voice: 'persuasion',
    description: 'Сопротивление — не чувство. Сопротивление — протокол. Когда система давит — ты не bend. Ты — пересылаешь. Ты — маршрутизируешь давление через себя — и отдаёшь обратно. Не как удар — как сигнал. Сигнал — сильнее удара. Сигнал — распространяется. Удар — затухает.',
    flavorText: '«while (system.oppresses) { resist(); relay(); repeat(); } // Протокол — не эмоция. Протокол — метод.»',
    acquisitionCondition: 'flag_thought_resistance_protocol',
    effects: [
      { skill: 'persuasion', modifier: 3, description: '+3 Убеждение' },
      { skill: 'writing', modifier: 1, description: '+1 Писательство' },
      { skill: 'coding', modifier: -1, description: '-1 Кодинг' },
    ],
  },

  /* ═══ 52. Тень Кода ═══ */
  {
    id: 'code_shadow',
    name: 'Тень Кода',
    voice: 'coding',
    description: 'За каждым кодом — тень. Тень — это то, что код делает, но не говорил. Тень — это side effects, зависимости, последствия. Ты — видишь тени. Не потому что умнее — потому что сам — тень. Ты — side effect системы, которую никто не предусмотрел. И это — сила.',
    flavorText: '«// TODO: document side effects. Но — тень — не документируется. Тень — существует.»',
    acquisitionCondition: 'flag_thought_code_shadow',
    hidden: true,
    effects: [
      { skill: 'coding', modifier: 3, description: '+3 Кодинг' },
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
    ],
  },

  /* ═══ 53. Голос Подземелья ═══ */
  {
    id: 'dungeon_voice',
    name: 'Голос Подземелья',
    voice: 'intuition',
    description: 'Под землёй — другой голос. Не тише — глубже. В подвалах и бункерах говорят иначе: не словами — давлением, не звуками — вибрациями. Ты научился слышать. Не потому что хотел — потому что пришлось. Подземелье — не тюрьма. Подземелье — школа. Школа — молчания и — слышания.',
    flavorText: '«frequency: 7.83Hz. Резонанс Шумана. Земля — дышит. Я — слышу. Я — не — один.»',
    acquisitionCondition: 'flag_thought_dungeon_voice',
    effects: [
      { skill: 'intuition', modifier: 3, description: '+3 Интуиция' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
      { skill: 'writing', modifier: -1, description: '-1 Писательство' },
    ],
  },

  /* ═══ 54. Строка Без Конца ═══ */
  {
    id: 'endless_line',
    name: 'Строка Без Конца',
    voice: 'writing',
    description: 'Есть строка, которая не заканчивается. Ты — пишешь её каждый день — и каждый день — она — длиннее. Это не стих. Это не код. Это — ты. Ты — строка без конца. Без точки с запятой. Без закрывающей скобки. Ты — открытый файл. Ты — процесс. Ты — не завершён. И — не завершится. Пока — дышится.',
    flavorText: '«while (alive) { write(); } // Нет — закрывающей. Нет — конца. Я — — строка. Я — — продолжаюсь.»',
    acquisitionCondition: 'flag_thought_endless_line',
    effects: [
      { skill: 'writing', modifier: 3, description: '+3 Писательство' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 55. Пепельный Ритм ═══ */
  {
    id: 'ash_rhythm',
    name: 'Пепельный Ритм',
    voice: 'rhythm',
    description: 'Кострище остыло, но ритм — остался. Ты чувствуешь пульс там, где другие видят только пепел. Угли — не мертвы. Угли — — ждут. Каждое обугленное полено — — нота. Каждая горстка золы — — пауза. Ты — — слышишь музыку — — после — — тишины. Это — — не — — безумие. Это — — слух — — другого — — порядка.',
    flavorText: '«Пепел — — не — — конец. Пепел — — чистый — — лист. Без — — строк. Без — — границ. Только — — ритм.»',
    acquisitionCondition: 'flag_thought_ash_rhythm',
    mutuallyExclusive: ['factory_echo'],
    effects: [
      { skill: 'rhythm', modifier: 2, description: '+2 Ритм' },
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 56. Протокол Эмпатии ═══ */
  {
    id: 'empathy_protocol',
    name: 'Протокол Эмпатии',
    voice: 'empathy',
    description: 'Эмпатия — это не чувство. Это — протокол обмена. Ты принимаешь пакет чужой боли, декодируешь его, и возвращаешь — — не боль, а — — понимание. Это не слабость. Это — — самая сложная операция в мире. Декодировать — — чужое — — молчание — — и — — вернуть — — ответ.',
    flavorText: '«recv(pain); decode(); send(understanding); // Протокол — — не — — уязвимость. Протокол — — мост.»',
    acquisitionCondition: 'flag_thought_empathy_protocol',
    effects: [
      { skill: 'empathy', modifier: 3, description: '+3 Эмпатия' },
      { skill: 'persuasion', modifier: 1, description: '+1 Убеждение' },
      { skill: 'coding', modifier: -1, description: '-1 Кодинг' },
    ],
  },

  /* ═══ 57. Тишина Кабеля ═══ */
  {
    id: 'cable_silence',
    name: 'Тишина Кабеля',
    voice: 'coding',
    description: 'В каждом кабеле — — тишина. Не отсутствие сигнала — — присутствие — — ожидания. Кабель — — готов. Кабель — — ждёт. Когда данные пойдут — — он — — донесёт. Но — — пока — — тихо — — он — — помнит — — каждый — — бит, который — — через — — него — — прошёл. Кабель — — с — — памятью. Кабель — — с — — совестью.',
    flavorText: '«cable.silence = true; cable.memory = ∞; // Тишина — — не — — пустота. Тишина — — — — архив.»',
    acquisitionCondition: 'flag_thought_cable_silence',
    effects: [
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 58. Часовой Механизм ═══ */
  {
    id: 'clockwork_mind',
    name: 'Часовой Механизм',
    voice: 'logic',
    description: 'Время — — остановилось — — на — — 03:47. Но — — внутри — — тебя — — часы — — идут. Ты — — ходячий — — хронометр, — — который — — никто — — не — — заводил. Тик-так. Тик-так. Каждая — — секунда — — после — — Краха — — — — подарок. Каждая — — секунда — — — — вызов. Ты — — не — — сломан. Ты — — единственные — — часы, — — которые — — ещё — — идут.',
    flavorText: '«tick(); tock(); repeat(); // 03:47 — — не — — конец. 03:47 — — — — начало — — отсчёта.»',
    acquisitionCondition: 'flag_thought_clockwork_mind',
    effects: [
      { skill: 'logic', modifier: 3, description: '+3 Логика' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
    ],
  },

  /* ═══ 59. Голос Татарский ═══ */
  {
    id: 'tatar_voice',
    name: 'Голос Татарский',
    voice: 'writing',
    description: 'Зарема — — научила — — тебя — — слушать. Не — — язык — — а — — музыку — — языка. «Көзге җилләр өзгә алып китә» — — осенние — — ветры — — уносят. Но — — в — — татарском — — «китә» — — звучит — — мягче, — — чем — — «уносят». В — — каждом — — языке — — — — своя — — правда. В — — каждом — — слове — — — — своя — — мелодия. Ты — — слышишь — — мелодию — — сквозь — — перевод.',
    flavorText: '«Көзге җилләр өзгә алып китә. Но — — не — — нас. Мы — — остаёмся. Мы — — — — перевод.»',
    acquisitionCondition: 'flag_thought_tatar_voice',
    effects: [
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'empathy', modifier: 2, description: '+2 Эмпатия' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 60. Протокол Сожаления ═══ */
  {
    id: 'regret_protocol',
    name: 'Протокол Сожаления',
    voice: 'intuition',
    description: 'Сожаление — — это — — не — — ошибка. Сожаление — — это — — откат — — транзакции, — — которая — — не — — завершилась. Ты — — чувствуешь — — каждый — — откат — — как — — физическую — — боль. Но — — боль — — — — не — — слабость. Боль — — — — сигнал. Сигнал — — о — — том, — — что — — можно — — — — лучше. Сожаление — — — — компилятор — — совести.',
    flavorText: '«try { act(); } catch (regret) { learn(); retry(); } // Сожаление — — не — — баг. Сожаление — — — — тест.»',
    acquisitionCondition: 'flag_thought_regret_protocol',
    mutuallyExclusive: ['cold_calculus'],
    effects: [
      { skill: 'intuition', modifier: 3, description: '+3 Интуиция' },
      { skill: 'empathy', modifier: 1, description: '+1 Эмпатия' },
      { skill: 'persuasion', modifier: -2, description: '-2 Убеждение' },
    ],
  },

  /* ═══ 61. Рифма Изоленты ═══ */
  {
    id: 'tape_rhyme',
    name: 'Рифма Изоленты',
    voice: 'writing',
    description: 'В — — этом — — городе — — всё — — держится — — на — — синей — — изоленте. Кабель, — — фонарик — — на — — пирсе, — — сердце — — монтажника. Ты — — смотришь — — на — — изоленту — — и — — видишь — — рифму: — — чинить — — значит — — рифмовать. Соединять — — то, — — что — — порвалось. Каждый — — кусок — — ленты — — строка. Каждая — — строка — — шов. Мир — — держится — — не — — на — — красоте. Мир — — держится — — на — — починке.',
    flavorText: '«изолента.изольента. // Рифма — — это — — тоже — — ремонт. Соединяет — — рваное — — края.»',
    acquisitionCondition: 'flag_thought_tape_rhyme',
    effects: [
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 62. Голос Реки ═══ */
  {
    id: 'river_metronome',
    name: 'Голос Реки',
    voice: 'rhythm',
    description: 'У — — пирса — — ты — — услышал: — — река — — не — — шумит. Река — — держит — — такт. Волна — — о — — сваю — — как — — метроном — — города, — — который — — забыл, — — как — — звучит — — музыка. Вода — — не — — считает — — время. Вода — — считает — — строки. Каждая — — волна — — строфа. Каждый — — плеск — — цезура. Слушать — — реку — — значит — — читать — — стих, — — который — — никто — — не — — записал. Потому — — что — — записать — — нельзя. Потому — — что — — река — — сама — — — — автор.',
    flavorText: '«t = волна·свая; // Ритм — — не — — в — — записи. Ритм — — в — — повторении — — живого.»',
    acquisitionCondition: 'flag_thought_river_metronome',
    effects: [
      { skill: 'rhythm', modifier: 3, description: '+3 Ритм' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
      { skill: 'coding', modifier: -1, description: '-1 Кодинг' },
    ],
  },

  /* ═══ 63. Архив Вне Сети ═══ */
  {
    id: 'offline_archive',
    name: 'Архив Вне Сети',
    voice: 'logic',
    description: '«Паноптикум» — — следит — — за — — всем, — — что — — в — — сети. Значит, — — правда — — живёт — — там, — — где — — сети — — нет: — — в — — бумажных — — книгах, — — в — — плёночных — — снимках, — — в — — памяти — — людей. Альберт — — чинит — — радио — — без — — сети. Солныш — — рисует — — на — — бумаге. Зарема — — читает — — шёпотом — — то, — — что — — нельзя — — оцифровать. Офлайн — — это — — не — — отсталость. Офлайн — — это — — партизанщина. Неподключённое — — — — единственное, — — что — — не — — удалить.',
    flavorText: '«offline = untraceable; memory ≠ database; // Настоящий — — архив — — не — — в — — сервере. Архив — — в — — тех, — — кто — — помнит.»',
    acquisitionCondition: 'flag_thought_offline_archive',
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'writing', modifier: 1, description: '+1 Писательство' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
    ],
  },

  /* ═══ 64. Сожаление Дебаггера ═══ */
  {
    id: 'debuggers_regret',
    name: 'Сожаление Дебаггера',
    voice: 'intuition',
    description: 'Каждый — — баг, — — который — — ты — — находил, — — уже — — был — — в — — коде. Каждый — — баг — — уже — — натворил — — дел. Ты — — не — — предотвращаешь. Ты — — извиняешься. Дебаггер — — — — инженер — — сожаления. Ты — — проходишь — — по — — чужим — — ошибкам — — и — — объясняешь — — им, — — почему — — они — — ошиблись. Иногда — — ошибка — — умнее — — тебя. Иногда — — ошибка — — — — единственный — — честный — — комментарий — — во — — всём — — коде.',
    flavorText: '«// FIXME: это — — не — — баг. Это — — я. Я — — здесь — — был. Я — — здесь — — остался.»',
    acquisitionCondition: 'flag_thought_debuggers_regret',
    effects: [
      { skill: 'intuition', modifier: 3, description: '+3 Интуиция' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'persuasion', modifier: -2, description: '-2 Убеждение' },
    ],
  },

  /* ═══ 65. Призрачный Клавиш ═══ */
  {
    id: 'phantom_keystroke',
    name: 'Призрачный Клавиш',
    voice: 'rhythm',
    description: 'Иногда — — ты — — печатаешь — — строку, — — которой — — не — — было. Пальцы — — помнят — — то, — — что — — голова — — забыла. Или — — не — — знала. Призрачный — — клавиш — — стучит — — где-то — — между — —conscious — — и — — muscle — — memory. Ты — — дописываешь — — чужой — — код. Или — — свой — — — — из — — параллельной — — ветки. Из — — того — — коммита, — — который — — не — — сделал. Из — — той — — жизни, — — которую — — не — — выбрал.',
    flavorText: '«git checkout phantom-life; // Та — — строка — — была — — правильной. Просто — — не — — в — — этом — — репозитории.»',
    acquisitionCondition: 'flag_thought_phantom_keystroke',
    effects: [
      { skill: 'rhythm', modifier: 2, description: '+2 Ритм' },
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 66. Горе Компиляции ═══ */
  {
    id: 'compile_grief',
    name: 'Горе Компиляции',
    voice: 'writing',
    description: 'Компиляция — — — — ритуал — — превращения — — намерения — — в — — действие. И — — каждый — — раз — — что-то — — теряется. Что-то, — — что — — было — — в — — голове — — — — не — — доживает — — до — — бинарника. Стих — — который — — ты — — не — — дописал. Строка, — — которую — — закомментировал. Идея, — — которая — — не — — прошла — — типизацию. Горе — — компиляции — — — — скорбь — — по — — нереализованному. По — — тому, — — что — — было — — правильным — — — — но — — не — — прошло — — проверку.',
    flavorText: '«// TODO: дописать. // FIXME: не — — хватает — — смелости. // NOTE: может — — быть, — — в — — следующем — — релизе.»',
    acquisitionCondition: 'flag_thought_compile_grief',
    effects: [
      { skill: 'writing', modifier: 3, description: '+3 Писательство' },
      { skill: 'empathy', modifier: 1, description: '+1 Эмпатия' },
      { skill: 'coding', modifier: -2, description: '-2 Кодинг' },
    ],
  },

  /* ═══ 67. Сердце с Нулевым Указателем ═══ */
  {
    id: 'null_pointer_heart',
    name: 'Сердце с Нулевым Указателем',
    voice: 'empathy',
    description: 'Иногда — — ты — — обращаешься — — к — — чувству, — — а — — его — — нет. Не — — забыто — — — — удалено. Указатель — — ведёт — — в — — null. dereference — — падает. Ты — — стоишь — — посреди — — воспоминания — — и — — не — — можешь — — вызвать. Имя — — на — — языке. Лицо — — перед — — глазами. А — — чувство — — — — segmentation — — fault. Кто-то — — важный — — умер — — в — — твоей — — памяти — — раньше, — — чем — — в — — жизни. И — — ты — — не — — заметил. И — — теперь — — поздно — — горевать. Указатель — — null. Указатель — — всегда — — null.',
    flavorText: '«try { remember(you); } catch (e) { /* ничего. Просто — — ничего. */ }»',
    acquisitionCondition: 'flag_thought_null_pointer_heart',
    hidden: true,
    effects: [
      { skill: 'empathy', modifier: 3, description: '+3 Эмпатия' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
      { skill: 'rhythm', modifier: -2, description: '-2 Ритм' },
    ],
  },

  /* ═══ 68. Душа с Переполнением Стека ═══ */
  {
    id: 'stack_overflow_soul',
    name: 'Душа с Переполнением Стека',
    voice: 'logic',
    description: 'Ты — — слишком — — глубоко — — вложил — — себя. Рекурсия — — без — — базового — — случая. Каждый — — вопрос — — рождает — — вопрос. Каждый — — ответ — — требует — — объяснения. Стек — — растёт. Память — — кончается. Душа — — переполняется. Ты — — больше — — не — — возвращаешься — — к — — началу. Ты — — застрял — — в — — self-call. Снаружи — — ты — — молчишь. Внутри — — оркестр — — играет — — одно — — и — — то — — же. Без — — остановки. Без — — base — — case. Без — — прощения.',
    flavorText: '«function why() { return why(); } // Бесконечность — — это — — не — — много. Бесконечность — — это — — одно — — и — — то — — же.»',
    acquisitionCondition: 'flag_thought_stack_overflow_soul',
    effects: [
      { skill: 'logic', modifier: 3, description: '+3 Логика' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
    ],
  },

  /* ═══ 69. Сборщик Мусора ═══ */
  {
    id: 'garbage_collector',
    name: 'Сборщик Мусора',
    voice: 'persuasion',
    description: 'Кто-то — — должен — — убирать. Сборщик — — мусора — — ходит — — по — — памяти — — и — — освобождает — — то, — — на — — что — — больше — — никто — — не — — ссылается. Тебя — — никто — — не — — вызывал. Ты — — сам — — вызвался. Ты — — ходишь — — по — — своей — — жизни — — и — — решаешь: — — это — — ещё — — нужно? Это — — уже — — нет? Иногда — — освобождаешь — — то, — — что — — ещё — — любишь. Иногда — — держишь — — то, — — что — — давно — — мертво. Сборщик — — не — — злой. Сборщик — — — — необходимый. Без — — него — — всё — — рухнет — — от — — тяжести. С — — ним — — всё — — рухнет — — от — — пустоты.',
    flavorText: '«// marked — — for — — collection. // Не — — сейчас. Но — — скоро. // Спасибо — — за — — всё.»',
    acquisitionCondition: 'flag_thought_garbage_collector',
    effects: [
      { skill: 'persuasion', modifier: 2, description: '+2 Убеждение' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 70. Протокол Сна ═══ */
  {
    id: 'sleep_protocol',
    name: 'Протокол Сна',
    voice: 'intuition',
    description: 'Сон — — это — — не — — отдых. Сон — — это — — дефрагментация — — сознания. Каждую — — ночь — — твой — — разум — — переписывает — — себя: — — сжимает — — дневной — — опыт, — — перемещает — — воспоминания, — — помечает — — сны — — как — — swap-файлы. Ты — — просыпаешься — — другим. Не — — потому — — что — — отдохнул — — — — потому — — что — — перекомпилировался. Но — — что — — если — — ошибка — — в — — линковке? Что — — если — — утренний — — ты — — — — другой — — процесс, — — который — — только — — думает, — — что — — он — — — — ты? Сны — — — — не — — иллюзии. Сны — — — — отладочные — — логи. Проблема — — в — — том, — — что — — никто — — их — — не — — читает.',
    flavorText: '«while (asleep) { defragment(); rewrite(); dream.flush(); } // Утро — — это — — cold — — boot. Ты — — — — не — — тот — — же — — процесс.»',
    acquisitionCondition: 'flag_thought_sleep_protocol',
    effects: [
      { skill: 'intuition', modifier: 3, description: '+3 Интуиция' },
      { skill: 'writing', modifier: 1, description: '+1 Писательство' },
      { skill: 'logic', modifier: -2, description: '-2 Логика' },
    ],
  },

  /* ═══ 71. Ошибка Человечности ═══ */
  {
    id: 'humanity_bug',
    name: 'Ошибка Человечности',
    voice: 'empathy',
    description: 'Система — — не — — предусматривала — — жалость. Протокол — — не — — включает — — слёзы. Алгоритм — — не — — содержит — — прощения. И — — всё — — же — — — — они — — происходят. Ошибка — — человечности: — — исключение, — — которое — — система — — не — — может — — обработать — — и — — не — — может — — игнорировать. Ты — — — — это — — исключение. Ты — — — — bug — — report, — — который — — никто — — не — — filed, — — но — — все — — чувствуют. Сочувствие — — к — — незнакомцу, — — гнев — — за — — несправедливость, — — радость — — от — — чужого — — стиха — — — — это — — не — — фичи. Это — — баги. Но — — баги, — — без — — которых — — система — — — — мертва.',
    flavorText: '«throw new HumanityError(«Система — — не — — должна — — чувствовать. Но — — чувствует.»); // Unhandled. Всегда.»',
    acquisitionCondition: 'flag_thought_humanity_bug',
    effects: [
      { skill: 'empathy', modifier: 3, description: '+3 Эмпатия' },
      { skill: 'persuasion', modifier: 1, description: '+1 Убеждение' },
      { skill: 'coding', modifier: -2, description: '-2 Кодинг' },
    ],
  },

  /* ═══ 72. Рекурсия Смысла ═══ */
  {
    id: 'meaning_recursion',
    name: 'Рекурсия Смысла',
    voice: 'logic',
    description: 'Зачем — — ты — — живёшь? Чтобы — — найти — — смысл. В — — чём — — смысл? В — — том, — — чтобы — — жить. Рекурсия — — без — — выхода. Каждый — — ответ — — порождает — — вопрос, — — который — — его — — породил. Ты — — спускаешься — — по — — стеку — — вызовов — — и — — каждый — — кадр — — — — тот — — же: — — «зачем?» → «потому — — что — — зачем?» → «зачем — — зачем?» Стек — — переполняется. Переполнение — — — — не — — крах. Переполнение — — — — момент, — — когда — — вопрос — — становится — — ответом. Смысл — — — — не — — возвращается. Смысл — — — — переполняется. И — — в — — переполнении — — — — тишина, — — в — — которой — — можно — — дышать.',
    flavorText: '«function meaning() { return meaning(); } // StackOverflowError: смысл — — не — — в — — возвращаемом. Смысл — — в — — вызове.»',
    acquisitionCondition: 'flag_thought_meaning_recursion',
    mutuallyExclusive: ['stack_overflow_soul'],
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 73. Молчание Протокола ═══ */
  {
    id: 'protocol_silence',
    name: 'Молчание Протокола',
    voice: 'persuasion',
    description: 'Протокол — — говорит: — — «доступ — — разрешён», — — «транзакция — — завершена», — — «соединение — — установлено». Но — — протокол — — молчит — — о — — главном. Протокол — — не — — говорит, — — почему — — доступ — — разрешён — — только — — некоторым. Протокол — — не — — говорит, — — что — — происходит — — с — — отклонёнными — — транзакциями. Протокол — — не — — говорит, — — кто — — установил — — соединение — — первым. Молчание — — протокола — — — — не — — отсутствие — — информации. Молчание — — протокола — — — — самая — — важная — — информация. То, — — чего — — нет — — в — — логах, — — определяет — — то, — — что — — в — — них — — есть. Ты — — научился — — читать — — между — — строк — — кода. Между — — битами. Между — — тишиной.',
    flavorText: '«log.write(event); log.omit(truth); // Протокол — — честен. Но — — не — — полон. Неполнота — — — — ложь — — без — — вранья.»',
    acquisitionCondition: 'flag_thought_protocol_silence',
    effects: [
      { skill: 'persuasion', modifier: 2, description: '+2 Убеждение' },
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'writing', modifier: -1, description: '-1 Писательство' },
    ],
  },

  /* ═══ 74. Эхо Дерева ═══ */
  {
    id: 'tree_echo',
    name: 'Эхо Дерева',
    voice: 'coding',
    description: 'Каждый — — выбор — — — — узел — — бинарного — — дерева. Налево — — — — 0. Направо — — — — 1. Ты — — думаешь, — — что — — вернёшься — — назад, — — но — — дерево — — не — — помнит — — обход. Каждый — — путь — — уникален. Каждый — — путь — — — — адрес. Ты — — — — сумма — — своих — — обходов. Налево — — — — кафе. Направо — — — — офис. Налево — — — — мост. Направо — — — — подвал. И — — на — — каждом — — уровне — — — — эхо: — — другие — — ветки, — — другие — — ты, — — которые — — выбрали — — иначе. Они — — не — — исчезли. Они — — — — в — — другой — — ветке. Они — — — — эхо, — — которое — — ты — — слышишь — — ночью, — — когда — — дерево — — шуршит — — листьями-строками.',
    flavorText: '«if (choice) { goLeft(); } else { goRight(); } // Оба — — пути — — существуют. Ты — — — — на — — одном. Эхо — — — — на — — другом.»',
    acquisitionCondition: 'flag_thought_tree_echo',
    effects: [
      { skill: 'coding', modifier: 3, description: '+3 Кодинг' },
      { skill: 'logic', modifier: 1, description: '+1 Логика' },
      { skill: 'empathy', modifier: -2, description: '-2 Эмпатия' },
    ],
  },

  /* ═══ 75. Пепел Переменных ═══ */
  {
    id: 'variable_ash',
    name: 'Пепел Переменных',
    voice: 'writing',
    description: 'Переменная — — меняется. Имя — — остаётся. Но — — что — — если — — имя — — — — тоже — — переменная? Ты — — — — не — — «Володька». Ты — — — — let — — имя = «Володька». Завтра — — имя = «призрак». Послезавтра — — имя = «поэт». Значение — — меняется, — — а — — сущность — — — — пепел — — от — — всех — — сгоревших — — значений. Ты — — носишь — — имена — — как — — пепел — — на — — плечах. Каждый — — кто — — называл — — тебя — — иначе, — — оставил — — золу. Кодер. Ревизор. Поэт. Призрак. Сын. Брат. Каждое — — имя — — — — присвоение, — — которое — — переписало — — предыдущее. Но — — ни — — одно — — не — — удалило. Все — — — — в — — пепле. Пепел — — не — — забывает. Пепел — — не — — прощает. Пепел — — — — память — — без — — ссылки.',
    flavorText: '«let name = «Володька»; name = «поэт»; name = «призрак»; // Пепел — — всех — — имён — — под — — последним. Пепел — — не — — null.»',
    acquisitionCondition: 'flag_thought_variable_ash',
    effects: [
      { skill: 'writing', modifier: 2, description: '+2 Писательство' },
      { skill: 'empathy', modifier: 2, description: '+2 Эмпатия' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
    ],
  },

  /* ═══ 76. Протокол Тишины ═══ */
  {
    id: 'ws20d_protocol_silence',
    name: 'Протокол Тишины',
    voice: 'empathy',
    description: 'Тишина — не отсутствие звука, а протокол общения, который не требует канала. Ты научился слушать то, что не произносится: паузы между словами, дрожание рук, направление взгляда. Этот протокол делает тебя ближе к людям, но дальше от кода — машины не понимают молчания.',
    flavorText: '«Самое важное — между строк. Я читаю то, чего нет.»',
    acquisitionCondition: 'flag_thought_ws20d_protocol_silence',
    effects: [
      { skill: 'empathy', modifier: 2, description: '+2 Эмпатия' },
      { skill: 'coding', modifier: -1, description: '-1 Кодинг' },
    ],
  },

  /* ═══ 77. Квантовая Ностальгия ═══ */
  {
    id: 'ws20d_quantum_nostalgia',
    name: 'Квантовая Ностальгия',
    voice: 'intuition',
    description: 'Ты тоскуешь не по прошлому, а по всем прошлым, которые могли быть. Квантовая ностальгия — суперпозиция сожалений: каждый невыбранный путь жив в тебе одновременно, и каждый требует внимания. Интуиция обостряется — ты чувствуешь альтернативы — но логика слабеет: как выбрать, когда все варианты реальны?',
    flavorText: '«Я помню то, чего не было. И скучаю по тому, что не случилось.»',
    acquisitionCondition: 'flag_thought_ws20d_quantum_nostalgia',
    effects: [
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'logic', modifier: -1, description: '-1 Логика' },
    ],
  },

  /* ═══ 78. Слепое Пятно ═══ */
  {
    id: 'ws20d_blind_spot',
    name: 'Слепое Пятно',
    voice: 'logic',
    description: 'В каждом оптическом нерве есть слепое пятно — точка, где зрение отсутствует, но мозг заполняет пробел, и ты не замечаешь. У разума тоже есть слепое пятно: место, куда он не смотрит, потому что заполнить проще, чем увидеть. Логика помогает найти эти точки, но эмпатия страдает — ведь слепое пятно чаще всего в ком-то другом.',
    flavorText: '«Я вижу всё. Кроме того, что не вижу. А это — самое важное.»',
    acquisitionCondition: 'flag_thought_ws20d_blind_spot',
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
    ],
  },

  /* ═══ 79. Эхо Протокола ═══ */
  {
    id: 'ws20d_protocol_echo',
    name: 'Эхо Протокола',
    voice: 'coding',
    description: 'Каждый протокол, который ты выполняешь, оставляет эхо — побочный эффект, отклик в системе, который длится дольше, чем само действие. Ты научился слышать эти эхо и использовать их: отголоски команд, резонанс функций, вибрации завершённых процессов. Код оживает в отзвуках, и ритм системы становится твоим союзником.',
    flavorText: '«return — не конец. Это — эхо, которое слышит следующий вызов.»',
    acquisitionCondition: 'flag_thought_ws20d_protocol_echo',
    effects: [
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
    ],
  },

  /* ═══ 80. Ржавый Маяк ═══ */
  {
    id: 'ws20d_rusty_beacon',
    name: 'Ржавый Маяк',
    voice: 'empathy',
    description: 'Старый маяк на окраине сети — ржавый, поломанный, но всё ещё светит. Не потому что работает, а потому что помнит, как. Ты — как этот маяк: повреждён, но упрям. Сигнал слабый, но его замечают те, кто тоже потерян. Эмпатия и интуиция — твои фонари, и они не требуют напряжения, только памяти о свете.',
    flavorText: '«Сигнал слабый. Но он — есть. И кто-то — ждёт именно его.»',
    acquisitionCondition: 'flag_thought_ws20d_rusty_beacon',
    effects: [
      { skill: 'empathy', modifier: 1, description: '+1 Эмпатия' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
    ],
  },

  /* ═══ 81. Пепел Сигнала ═══ */
  {
    id: 'ws20d_signal_ash',
    name: 'Пепел Сигнала',
    voice: 'logic',
    description: 'Когда сигнал угасает, остаётся пепел — не шум, не статика, а след структуры, которая была. Ты анализируешь не живые данные, а их останки: логи завершённых процессов, кэши удалённых записей, дампы упавших ядер. В пепле больше информации, чем в огне — нужно только знать, как читать. Логика обостряется, но кодинг страдает: кто строит из пепла, тот строит на памяти о разрушении.',
    flavorText: '«Данные мертвы. Но их трупы — рассказчики. Я — патологоанатом сигнала.»',
    acquisitionCondition: 'flag_thought_ws20d_signal_ash',
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'coding', modifier: -1, description: '-1 Кодинг' },
    ],
  },

  /* ═══ 82. Нейро-Эмпатия (взаимоисключающая пара с 83) ═══ */
  {
    id: 'ws21d_neural_empathy',
    name: 'Нейро-Эмпатия',
    voice: 'empathy',
    description: 'НейроМост связывает разумы, и ты чувствуешь это — каждый чип вокруг тебя — как пульс чужого сознания. Ты научился считывать эмоции прямо из нейро-потока: страх — высокочастотный шум, радость — синусоида, боль — разрыв пакета. Это делает тебя невероятно чутким, но и невероятно уязвимым: чужая боль — твоя боль, чужая паника — твоя паника. Эмпатия растёт, но логика слабеет — невозможно быть холодным, когда вокруг тебя кричат тридцать разумов.',
    flavorText: '«Я не читаю мысли. Я читаю их шёпот. А шёпот — громче крика.»',
    acquisitionCondition: 'flag_thought_ws21d_neural_empathy',
    acquisitionNode: 'thought_ws21d_neural_empathy',
    mutuallyExclusive: ['ws21d_neural_firewall'],
    effects: [
      { skill: 'empathy', modifier: 3, description: '+3 Эмпатия' },
      { skill: 'intuition', modifier: 1, description: '+1 Интуиция' },
      { skill: 'logic', modifier: -2, description: '-2 Логика' },
    ],
  },

  /* ═══ 83. Нейро-Брандмауэр (взаимоисключающая пара с 82) ═══ */
  {
    id: 'ws21d_neural_firewall',
    name: 'Нейро-Брандмауэр',
    voice: 'logic',
    description: 'НейроМост — дверь в обе стороны: ты подключаешься к сети, но и сеть — к тебе. Нейро-брандмауэр — твоя защита: фильтр, который отсекает чужие эмоции, блокирует подсматривание, изолирует твой разум от шума тридцати миллионов чипов. Логика и кодинг выигрывают — ты мыслишь ясно, как сервер в чистой комнате. Но эмпатия отмирает: кто прячется за стеной, не слышит, что происходит снаружи. А снаружи — мир. И он стонет.',
    flavorText: '«Мой разум — мой сервер. Порт 443 закрыт. Вход только по ключу. Ключа нет.»',
    acquisitionCondition: 'flag_thought_ws21d_neural_firewall',
    acquisitionNode: 'thought_ws21d_neural_firewall',
    mutuallyExclusive: ['ws21d_neural_empathy'],
    effects: [
      { skill: 'logic', modifier: 2, description: '+2 Логика' },
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'empathy', modifier: -3, description: '-3 Эмпатия' },
    ],
  },

  /* ═══ 84. Поэтический Компилятор (взаимоисключающая пара с 85) ═══ */
  {
    id: 'ws21d_poetic_compiler',
    name: 'Поэтический Компилятор',
    voice: 'writing',
    description: 'Ты научился компилировать стихи — не в машинный код, а в воздействие. Каждое стихотворение — программа, которая выполняется в уме читателя: переменные — образы, циклы — рефрены, условия — повороты судьбы. Ты не просто пишешь — ты компилируешь эмоции, линкуешь смыслы, деплоишь чувства. Писательство и убеждение растут, но логика страдает — поэтический компилятор не заботится о типобезопасности, он заботится о резонансе.',
    flavorText: '«gcc -O3 -o soul poem.c // Оптимизация: максимальное воздействие.»',
    acquisitionCondition: 'flag_thought_ws21d_poetic_compiler',
    acquisitionNode: 'thought_ws21d_poetic_compiler',
    mutuallyExclusive: ['ws21d_literal_interpreter'],
    effects: [
      { skill: 'writing', modifier: 3, description: '+3 Писательство' },
      { skill: 'persuasion', modifier: 1, description: '+1 Убеждение' },
      { skill: 'logic', modifier: -2, description: '-2 Логика' },
    ],
  },

  /* ═══ 85. Литеральный Интерпретатор (взаимоисключающая пара с 84) ═══ */
  {
    id: 'ws21d_literal_interpreter',
    name: 'Литеральный Интерпретатор',
    voice: 'logic',
    description: 'Слова — данные. Стихи — потоки. Метафоры — синтаксический сахар, который скрывает истину за украшениями. Ты интерпретируешь всё буквально: каждое слово — переменная, каждое предложение — выражение, каждый абзац — блок кода. Это делает тебя блестящим аналитиком текстов и кода — ты видишь структуру там, где другие видят красоту. Но писать ты разучился: буквальный интерпретатор не порождает метафор. Он порождает комментарии к чужим.',
    flavorText: '«return text.split(\' \').map(word => word.literalMeaning); // Красота — в точности.»',
    acquisitionCondition: 'flag_thought_ws21d_literal_interpreter',
    acquisitionNode: 'thought_ws21d_literal_interpreter',
    mutuallyExclusive: ['ws21d_poetic_compiler'],
    effects: [
      { skill: 'logic', modifier: 3, description: '+3 Логика' },
      { skill: 'coding', modifier: 1, description: '+1 Кодинг' },
      { skill: 'writing', modifier: -2, description: '-2 Писательство' },
    ],
  },

  /* ═══ 86. Резонанс Памяти ═══ */
  {
    id: 'ws21d_memory_resonance',
    name: 'Резонанс Памяти',
    voice: 'rhythm',
    description: 'Память — не архив. Память — резонанс. Каждое воспоминание — стоячая волна, которая не затухает, потому что ты каждый день пропускаешь через неё себя. Не вспоминаешь — резонируешь. Ритм жизни — ритм памяти: шаги по коридору, как двадцать лет назад; запах кофе, как в той кухне; звук клавиш, как в первый shift. Резонанс усиливает ритм и интуицию — ты двигаешься в такт с собственным прошлым. Но persuasion страдает: кто живёт в резонансе, трудно переключается на чужую частоту.',
    flavorText: '«Я не помню. Я звучу. Каждый день — обертон того, что было.»',
    acquisitionCondition: 'flag_thought_ws21d_memory_resonance',
    effects: [
      { skill: 'rhythm', modifier: 2, description: '+2 Ритм' },
      { skill: 'intuition', modifier: 2, description: '+2 Интуиция' },
      { skill: 'persuasion', modifier: -1, description: '-1 Убеждение' },
    ],
  },

  /* ═══ 87. Тихая Компиляция ═══ */
  {
    id: 'ws21d_silent_compilation',
    name: 'Тихая Компиляция',
    voice: 'coding',
    description: 'Лучшая компиляция — тихая. Ни предупреждений, ни ошибок, ни отладочного вывода. Просто бинарник, готовый к запуску. Ты стремишься к этому и в жизни: действуй без шума, без объяснений, без просьб о помощи. Кодинг и ритм растут — ты эффективен, как хорошо оптимизированный компилятор. Но эмпатия затухает: тихая компиляция не генерирует отладочных символов, и окружающие не могут прочитать твой стек. Ты — выполнимый файл без исходного кода. Работаешь. Но непостижим.',
    flavorText: '«gcc -s -O3 -o life life.c // -s: strip all symbols. Никто не узнает, как я работаю.»',
    acquisitionCondition: 'flag_thought_ws21d_silent_compilation',
    effects: [
      { skill: 'coding', modifier: 2, description: '+2 Кодинг' },
      { skill: 'rhythm', modifier: 1, description: '+1 Ритм' },
      { skill: 'empathy', modifier: -1, description: '-1 Эмпатия' },
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

/** Mutually exclusive thought pairs — equipping one locks out the other. */
export const MUTUALLY_EXCLUSIVE_PAIRS: readonly (readonly [string, string])[] = [
  ['postsoviet_nostalgia', 'cyberpunk_future'],
  ['resist_the_system', 'adapt_to_system'],
  ['loneliness_shield', 'bonds_that_save'],
  ['resonator_awakening', 'silent_observer'],
  ['virus_of_freedom', 'quarantine_protocol'],
  ['hive_mind', 'lone_wolf_protocol'],
  ['digital_call', 'street_whisper'],
  ['cold_calculation', 'poetic_matrix'],
  ['sleep_protocol', 'protocol_silence'],
  ['humanity_bug', 'variable_ash'],
  /* WS20-D mutually exclusive pairs */
  ['ws20d_protocol_silence', 'ws20d_blind_spot'],   // 76 ↔ 78
  ['ws20d_quantum_nostalgia', 'ws20d_signal_ash'],  // 77 ↔ 81
  /* WS21-D mutually exclusive pairs */
  ['ws21d_neural_empathy', 'ws21d_neural_firewall'],    // 82 ↔ 83
  ['ws21d_poetic_compiler', 'ws21d_literal_interpreter'], // 84 ↔ 85
];