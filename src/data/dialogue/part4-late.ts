import type { DialogueNode } from '@/shared/types/game';

export const DIALOGUE_PART4: Record<string, DialogueNode> = {
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

};
