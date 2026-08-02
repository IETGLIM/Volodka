import type { DialogueNode } from '@/shared/types/game';

export const DIALOGUE_PART3: Record<string, DialogueNode> = {
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
      {
        text: 'Александр, ты уважаешь меня — но уважение без поступка тоже соучастие. Подпиши сегодня один отчёт «без изменений». Один. Посмотрим, что скажет совесть.',
        next: null,
        condition: { minKarma: 55 },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'alexander_one_report_pledge', flagValue: true },
          {
            type: 'showThought',
            thought: 'Ты произнёс это тихо. Так тихо, что Александр побледнел. Он понял: ты не просишь подвига — ты просишь первой царапины на лояльности. Этого достаточно. Этого всегда достаточно.',
            thoughtDuration: 6500,
          },
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
      {
        text: '«Экономическая ценность» — это щит. Согласись продать стихи гильдии — а я тайно скопирую каждое. Они получат копию. Мы — оригинал.',
        next: null,
        condition: { maxKarma: 15 },
        effects: [
          { type: 'addKarma', value: -8 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'alexander_double_agent_path', flagValue: true },
          {
            type: 'showThought',
            thought: 'Александр смотрит на тебя — и впервые не скрывает облегчения. Ему нужен был кто-то, кто скажет вслух то, о чём он думал сам. Подлый план. Удобный. Ты только что стал его соучастником — даже не успев войти в серверную.',
            thoughtDuration: 6000,
          },
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
      {
        text: 'Александр. Не входи. Не нажимай. Уходи домой к Кате — я возьму это на себя. Ты уже искупил достаточно.',
        next: null,
        condition: { minKarma: 50 },
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'alexander_spared', flagValue: true },
          {
            type: 'showThought',
            thought: 'Ты видишь, как уходит из него всё — должность, приказ, страх. Остаётся только отец, который через пятнадцать лет впервые выберет дочь, а не систему. Это и есть искупление. Не твоё — его. Ты просто — повод.',
            thoughtDuration: 7000,
          },
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
          { type: 'discoverLore', loreId: 'lore_digital_resistance' },
          { type: 'discoverLore', loreId: 'lore_cafe_blue_hole' },
          { type: 'discoverLore', loreId: 'lore_network' },
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
          { type: 'setFlag', flag: 'barista_maria_confirmed', flagValue: true },
        ],
      },
      {
        text: 'Когда она придёт снова? Мне нужно с ней поговорить.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
          { type: 'setFlag', flag: 'barista_maria_confirmed', flagValue: true },
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

};
