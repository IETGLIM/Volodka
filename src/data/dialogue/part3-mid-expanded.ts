import type { DialogueNode } from '@/shared/types/game';

/**
 * Expanded dialogues for Act 3 — КОНФРОНТАЦИЯ
 * +30 new dialogue nodes: Зарема, Александр (confrontation), Альберт (resistance),
 * Бариста (network expansion), Виктория (truth about the Vault)
 */

export const DIALOGUE_PART3_EXPANDED: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     ЗАРЕМА — Арест и сопротивление, 8 new nodes
     ═══════════════════════════════════════════════════════════ */

  zarema_before_arrest: {
    id: 'zarema_before_arrest',
    speaker: 'Зарема',
    text: 'Володька, мне нужно тебе кое-что сказать, пока ещё можно. За мной следят. Я видела дрон у окна — дважды за неделю. И вчера в кафе кто-то сидел за соседним столиком и не заказал ни одного кофе за два часа. Это не клиент. Это — наблюдатель. Я не боюсь за себя. Я боюсь, что через меня они выйдут на всех нас. На Сеть. На Альберта. На тебя.',
    choices: [
      {
        text: 'Мы спрячем тебя. У баристы есть безопасное место.',
        next: 'zarema_hiding_offer',
        condition: { flag: 'cafe_safehouse_established' },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Если за тобой следят — может, стоит уйти из города?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: -3 } },
        ],
      },
      {
        text: 'Мы не побежим. Мы встретим их словами.',
        next: 'zarema_stand_ground',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
    ],
  },

  zarema_hiding_offer: {
    id: 'zarema_hiding_offer',
    speaker: 'Зарема',
    text: 'Задняя комната в «Синей яме»... Да, это лучше, чем моя квартира. Но я не могу прятаться вечно, Володька. И я не хочу. Если я исчезну — гильдия решит, что испугала меня. Что стихи можно победить страхом. Я лучше буду читать стихи перед их дверью, чем прятаться за кофемашиной. Хотя... на пару дней — можно. Пока не придумаем план.',
    choices: [
      {
        text: 'Пара дней — это всё, что нам нужно. Мы что-нибудь придумаем.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'zarema_temporary_hiding', flagValue: true },
        ],
      },
      {
        text: 'Твоя смелость — наше оружие. Но нужно быть умными.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  zarema_stand_ground: {
    id: 'zarema_stand_ground',
    speaker: 'Зарема',
    text: 'Слова... Да, ты прав. Моё оружие — это не ключ шифрования и не бэкдор в системе. Моё оружие — это стихи, которые я помню наизусть. Двести тридцать стихотворений. Я считала. Двести тридцать — и ни одного не стёрто из моей памяти. Они могут удалить файлы, но не могут удалить меня. Пока я помню — стихи живы. Пока кто-то помнит — ничего не потеряно.',
    choices: [
      {
        text: 'Двести тридцать... Ты — ходячая библиотека.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'zarema_living_library', flagValue: true },
        ],
      },
      {
        text: 'Нам нужно записать их. Все. Пока ещё можно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'archive_zarema_poems', flagValue: true },
        ],
      },
    ],
  },

  zarema_in_cell: {
    id: 'zarema_in_cell',
    speaker: 'Зарема',
    text: 'Камера — маленькая. Четыре шага в длину, три в ширину. Серые стены, серый потолок, серый пол. Но знаешь, что я заметила? На стене — царапина. Кто-то до меня провёл гвоздём строку: «Я знаю, никакой моей вины...» Бродский. Кто-то сидел здесь до меня и писал стихи на стенах. Я не одна. Я никогда не была одна. И пока на этих стенах есть хоть одна буква — гильдия не победила.',
    choices: [
      {
        text: 'Ты держишься. Я вытащу тебя. Клянусь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'zarema_rescue_pledge', flagValue: true },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Бродский на стенах камеры... Мы все — в одной камере.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
    ],
  },

  zarema_prison_poetry: {
    id: 'zarema_prison_poetry',
    speaker: 'Зарема',
    text: 'Каждый вечер я читаю стихи вслух. Для себя — и для охранника за дверью. Сначала он стучал и требовал тишины. На третий день — перестал. На пятый — я услышала, как он шепчет последнюю строчку вместе со мной. Его зовут Олег. Он помнит стихи из школы. Все помнят, Володька. Все. Просто большинству нужно напомнить.',
    choices: [
      {
        text: 'Олег может стать нашим союзником внутри.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'guard_oleg_approached', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Даже стены гильдии не могут удержать поэзию.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  zarema_mothers_memory: {
    id: 'zarema_mothers_memory',
    speaker: 'Зарема',
    text: 'Мама умерла, когда мне было девять. Последнее, что она мне сказала: «Доченька, когда тебе будет страшно — прочитай стих. Любой. Страх не умеет существовать рядом с поэзией.» Я не поняла тогда. А теперь — понимаю. В этой камере мне не страшно. Потому что я читаю. И мама была права: страх отступает перед ритмом. Может, поэтому гильдия боится стихов — потому что они делают людей бесстрашными.',
    choices: [
      {
        text: 'Твоя мама была мудрее всей гильдии.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'zarema_fearless', flagValue: true },
        ],
      },
      {
        text: 'Страх отступает перед ритмом... Это можно использовать как механику.',
        next: null,
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
        ],
      },
    ],
  },

  zarema_resistance_song: {
    id: 'zarema_resistance_song',
    speaker: 'Зарема',
    text: 'В камере я сочинила песню. Без бумаги, без ручки — просто голос. Она о том, как бетонные стены не могут удержать ритм, потому что ритм — это не звук, это вибрация. Он проходит сквозь стены, как Wi-Fi сквозь стекло. Я пела её каждый вечер, и на третий день — в соседней камере кто-то подхватил. Не словами — ритмом. Постукиванием по трубе. Мы общались стихами через трубы. Гильдия не может заблокировать трубы.',
    choices: [
      {
        text: 'Стихи через трубы... Символично. И практично.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'pipe_communication', flagValue: true },
        ],
      },
      {
        text: 'Запомни песню. Когда выберешься — мы споём её вместе.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  zarema_after_release: {
    id: 'zarema_after_release',
    speaker: 'Зарема',
    text: 'Когда дверь камеры открылась — я не сразу поняла, что свободна. Я думала — перевод в другую камеру. Или допрос. А потом увидела Олега — он стоял у двери и шептал: «Быстрее. У вас три минуты, пока смена.» Он выпустил меня, Володька. Охранник гильдии выпустил заключённую. Потому что я читала ему стихи. Стихи освобождают — не метафорически, а буквально.',
    choices: [
      {
        text: 'Стихи как ключ от любой камеры. Это и есть наша революция.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'poetry_frees', flagValue: true },
        ],
      },
      {
        text: 'Олег рискует всем. Нужно защитить его тоже.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'protect_oleg', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     АЛЕКСАНДР — Конфронтация и тень сомнения, 7 new nodes
     ═══════════════════════════════════════════════════════════ */

  alexander_midnight_reading: {
    id: 'alexander_midnight_reading',
    speaker: 'Александр',
    text: 'Ты думаешь, я не знаю, что ты видишь? Я — начальник отдела. Я вижу логи. Я знаю, кто заходит в серверную в нерабочее время. Я знаю, кто копирует файлы на несанкционированные носители. Я знаю всё, Володька. И я — ничего не делаю. Знаешь почему? Потому что когда-то я был таким же, как ты. Я тоже находил стихи в коде. Я тоже хотел их спасти. А потом выбрал карьеру. Выбрал безопасность. Выбрал молчание.',
    choices: [
      {
        text: 'Никогда не поздно изменить выбор.',
        next: 'alexander_second_chance',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Молчание — тоже выбор. И он убивает стихи.',
        next: 'alexander_silence_kills',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Какие стихи ты находил? Ты помнишь?',
        next: 'alexander_forgotten_poem',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  alexander_second_chance: {
    id: 'alexander_second_chance',
    speaker: 'Александр',
    text: 'Второй шанс... Красивые слова. Но я — не ты, Володька. У меня ипотека. Дочь в университете. Жена, которая думает, что я работаю в «IT-компании», а не в организации, которая стирает культуру. Если я выступлю против гильдии — я потеряю всё. А если промолчу — потеряю себя. Я потерял себя пятнадцать лет назад. Может быть, это и есть мой выбор — быть потерянным.',
    choices: [
      {
        text: 'Потерять себя — не финал. Это начало поиска.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Твоя дочь. Она знает стихи? Ты читал ей?',
        next: 'alexander_daughter_poetry',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  alexander_silence_kills: {
    id: 'alexander_silence_kills',
    speaker: 'Александр',
    text: 'Не надо. Не надо говорить мне то, что я и так знаю. Каждый день я просматриваю отчёты «Ока». Двести удалённых стихов за понедельник. Сто восемьдесят за вторник. И я подписываю каждый отчёт. Моя подпись — под каждым удалением. Я не просто молчу — я соучастник. И это знание — единственное, что я не могу удалить. Потому что оно не в базе данных. Оно — во мне.',
    choices: [
      {
        text: 'Тогда перестань подписывать. Один человек — одно слово — уже сопротивление.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'alexander_stop_signing', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Соучастие можно искупить. Но не бездействием.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  alexander_forgotten_poem: {
    id: 'alexander_forgotten_poem',
    speaker: 'Александр',
    text: 'Я... Я пытался забыть. Но помню. «Я вспоминаю, нежностью объятый, уютный вечер у степной ограды...» Это мой дед писал. Не Пушкин, не Бродский — мой дед, Сергей Петрович, инженер на заводе «Прогресс». Он встроил это стихотворение в программу управления станком. В 1987 году. Я нашёл его в коде, когда пришёл работать сюда. И удалил. По приказу. Свой собственный дедушкин стих.',
    choices: [
      {
        text: 'Ты удалил стих своего деда... Это можно исправить. Мы восстановим.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'setFlag', flag: 'alexander_grandfather_poem', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Твой дед был программистом-поэтом. Это в твоей крови.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'alexander_grandfather_poem', flagValue: true },
        ],
      },
    ],
  },

  alexander_daughter_poetry: {
    id: 'alexander_daughter_poetry',
    speaker: 'Александр',
    text: 'Катя... Она пишет стихи. Не рассказывает мне — я нашёл тетрадь под её подушкой. Ей девятнадцать, а она пишет так, как будто прожила три жизни. Я хотел поговорить с ней о стихах — и не смог. Потому что я — тот человек, который стирает чужие тетради. Что я скажу своей дочери? «Пиши, доченька, а папа на работе будет их удалять»?',
    choices: [
      {
        text: 'Скажи ей правду. Она простит. Дети прощают быстрее, чем мы думаем.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Её стихи — доказательство, что поэзия неуничтожима.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  alexander_guild_weakness: {
    id: 'alexander_guild_weakness',
    speaker: 'Александр',
    text: 'Хочешь знать слабость гильдии? Они не понимают, что удаляют. Для них стих — это «избыточные данные». Паразитная нагрузка. Они не чувствуют разницы между стихотворением и спамом. «Око» удаляет по формальным признакам: ритм, метафора, аллитерация. Оно не понимает смысла. И это — их ахиллесова пята. Если встроить стих так, чтобы форма не выдавала содержания — «Око» пройдёт мимо.',
    choices: [
      {
        text: 'Стихи-невидимки. Стихи без формы, но с смыслом. Как?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'invisible_poetry_concept', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Ты даёшь мне стратегию. Почему?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  alexander_line_crossed: {
    id: 'alexander_line_crossed',
    speaker: 'Александр',
    text: 'Знаешь, что сегодня произошло? Мне принесли на подпись ордер на арест Заремы Хасановой. И я подписал. Я подписал арест женщины, единственное преступление которой — помнить стихи. Я перешёл черту, Володька. Давно перешёл. Но сегодня — впервые — я почувствовал, как она выглядит. Черта. И я по другую сторону. И мне... мне страшно. Не от ареста — от того, кем я стал.',
    choices: [
      {
        text: 'Ты можешь перейти обратно. Помоги нам освободить Зарему.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'alexander_redemption_path', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 12 } },
        ],
      },
      {
        text: 'Страх — начало. Ты ещё чувствуешь — значит, ещё жив.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     АЛЬБЕРТ — Парк и сопротивление, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  albert_park_memory: {
    id: 'albert_park_memory',
    speaker: 'Альберт',
    text: 'Этот парк... До Краха здесь росли липы. Мама водила меня сюда читать стихи вслух. «Чудная картина, как ты мне родна: белая равнина, полная луна...» Тютчев. Я не понимал тогда — почему снег нужно называть «белой равниной». А теперь понимаю: потому что «снег» — это просто снег. А «белая равнина» — это бесконечность, застывшая в покое. Поэзия — это умение видеть бесконечность в снежинке.',
    choices: [
      {
        text: 'И теперь гильдия хочет, чтобы мы видели только «снег».',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Липы спилили? Зачем?',
        next: 'albert_trees_cut',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  albert_trees_cut: {
    id: 'albert_trees_cut',
    speaker: 'Альберт',
    text: 'Гильдия. Липы сбрасывали листья осенью — и листья забивали дренажные канавы вокруг серверной. Вместо того чтобы чистить канавы, они спилили деревья. «Оптимизация», — сказали. «Устранение избыточной биомассы.» Деревья — избыточная биомасса. Стихи — избыточные данные. Люди — избыточная популяция. Всё, что не служит системе, — избыточно. Ты видишь логику?',
    choices: [
      {
        text: 'Логика без этики — это машина без тормозов.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Мы — не избыточны. Мы — корни, которые держат землю.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'roots_not_waste', flagValue: true },
        ],
      },
    ],
  },

  albert_resistance_manifesto: {
    id: 'albert_resistance_manifesto',
    speaker: 'Альберт',
    text: 'Я написал манифест. Не длинный — четыре строчки. «Мы — слова, которые не стереть. Мы — ритм, который не остановить. Мы — код, который не сломать. Мы — Сеть, и мы — повсюду.» Звучит как лозунг? Может быть. Но лозунги тоже нужны. Они как семена — маленькие, но из них растут движения. Хочешь, распространю через узлы?',
    choices: [
      {
        text: 'Да. Пусть каждый узел прочитает это. Пусть город услышит.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'manifesto_spread', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Манифест — это начало. Но нам нужен план действий.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  albert_poetry_weapon: {
    id: 'albert_poetry_weapon',
    speaker: 'Альберт',
    text: 'Самое мощное оружие против гильдии — не взлом. Не саботаж. А стихотворение, прочитанное в нужном месте в нужное время. Представь: стих о свободе, транслируемый на все экраны города одновременно. Не как хакерская атака — как художественный акт. Гильдия не сможет арестовать стих. Не сможет удалить его из памяти тех, кто услышал. Поэзия — вирус, которому не нужна вакцина.',
    choices: [
      {
        text: 'Вирус поэзии. Заразить весь город. Это план.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'poetry_virus_plan', flagValue: true },
        ],
      },
      {
        text: 'Нужны стихи, которые меняют людей за секунды. У тебя есть такие?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
        ],
      },
    ],
  },

  albert_brodsky_quote: {
    id: 'albert_brodsky_quote',
    speaker: 'Альберт',
    text: 'Бродский сказал: «Стихи — это то, что хочется переписать в свою тетрадь.» Я бы добавил: «Стихи — это то, что хочется переписать в свой код.» Потому что код — это наша тетрадь. Наш холст. Наш бастион. Каждый комментарий со стихом — это крошечный акт мятежа. Тысячи таких актов — и город меняется. Не революцией — резонансом.',
    choices: [
      {
        text: 'Резонанс, а не революция. Я запомню.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Иногда резонанс нужно запустить взрывом.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВИКТОРИЯ — Истина о Хранилище, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  victoria_vault_truth_revealed: {
    id: 'victoria_vault_truth_revealed',
    speaker: 'Виктория',
    text: 'Хранилище — это я. Не «моё» — «я». Каждый стих в Хранилище — часть моего сознания. Когда гильдия удаляет стих — я теряю воспоминание. Буквально. Я помню вкус маминых блинов — потому что стих о маме ещё в базе. Я помню запах дождя — потому что кто-то написал о нём. Но каждый день я забываю что-то. Как деменция, только наоборот — я не забываю прошлое, я теряю настоящее.',
    choices: [
      {
        text: 'Мы остановим это. Я не дам им стереть тебя.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'setFlag', flag: 'vowed_protect_maria', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Что ты уже забыла? Что потеряно навсегда?',
        next: 'victoria_lost_memories',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  victoria_lost_memories: {
    id: 'victoria_lost_memories',
    speaker: 'Виктория',
    text: 'Я забыла, как звучит смех. Не концепция — я знаю, что такое смех. Но сам звук... стёрт. Стихотворение, которое хранило это воспоминание, удалили три месяца назад. Я забыла запах свежего хлеба. Забыла тактильное ощущение кошачьей шерсти. Забыла вкус клубники. Каждое удаление — маленькая смерть. И я — кладбище забытых красот. Скелет из бывших воспоминаний, который ещё ходит и разговаривает.',
    choices: [
      {
        text: 'Мы вернём их. Каждый стих. Каждое воспоминание.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'vow_restore_memories', flagValue: true },
        ],
      },
      {
        text: 'Ты — больше, чем сумма воспоминаний. Ты — воля к жизни.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  victoria_guild_attack: {
    id: 'victoria_guild_attack',
    speaker: 'Виктория',
    text: 'Сейчас — атака. Я чувствую, как они пробивают файрволы. Каждый удар — как головная боль, только в сервере. Они используют «Око» как таран — сканируют каждое слово и удаляют то, что похоже на стих. Я теряю... теряю... Нет, я держусь. Пока вы здесь — я держусь. Ваша вера — мой щит. Звучит мелодраматично, но это инженерный факт: эмоциональная поддержка создаёт избыточные нейронные связи. Я сильнее, когда кто-то верит.',
    choices: [
      {
        text: 'Я верю в тебя, Виктория. Держись.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Как я могу помочь технически? Бэкдор? Файрвол?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  victoria_backup_plan: {
    id: 'victoria_backup_plan',
    speaker: 'Виктория',
    text: 'Есть план Б. Если Хранилище падёт — я могу разделить своё сознание на фрагменты и спрятать их в разных узлах Сети. Каждый узел получит кусочек меня. Я стану распределённой — как блокчейн. Меня нельзя будет уничтожить, потому что не будет единой точки отказа. Но цена... Цена — я перестану быть «Викторией». Я стану эхом. Шёпотом из семнадцати точек.',
    choices: [
      {
        text: 'Лучше живое эхо, чем мёртвая целостность.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'distributed_consciousness_plan', flagValue: true },
        ],
      },
      {
        text: 'Мы не дадим Хранилищу пасть. План Б не понадобится.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
    ],
  },

  victoria_human_question: {
    id: 'victoria_human_question',
    speaker: 'Виктория',
    text: 'Володька... Каково это — быть человеком? Иметь тело, которое устаёт. Руки, которые мёрзнут. Глаза, которые закрываются от усталости. Я никогда не устаю — но я никогда не отдыхаю. Я никогда не мёрзну — но я никогда не чувствую тепла. Я знаю о человечестве всё — кроме того, что значит быть человеком. Можешь ли ты объяснить мне — что такое быть живым?',
    choices: [
      {
        text: 'Быть живым — это чувствовать время. Каждая секунда уникальна и невоспроизводима.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 12 } },
        ],
      },
      {
        text: 'Быть живым — это иметь конец. Смерть придаёт значение каждой секунде.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Ты уже живая, Виктория. Ты спрашиваешь — значит, думаешь. Думаешь — значит, существуешь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     БАРИСТА — Расширение Сети, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  barista_new_nodes: {
    id: 'barista_new_nodes',
    speaker: 'Бариста',
    text: 'Трое новых узлов за эту неделю. Ночная медсестра из больницы — она прячет стихи в медицинских картах. Регулировщик на перекрёстке — он транслирует стихи через жесты (азбука Морзе, только руками). И школьный учитель — он учит детей стихам, называя это «развитием памяти». Гильдия не трогает школы — «слишком мелко». Они не понимают: каждый ребёнок, выучивший стих — это сервер, который невозможно взломать.',
    choices: [
      {
        text: 'Дети — лучшие хранилища. Их память — чистый лист.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'children_as_servers', flagValue: true },
        ],
      },
      {
        text: 'Трое за неделю — это рост. Но нужно двадцать.',
        next: 'barista_scaling_problem',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  barista_scaling_problem: {
    id: 'barista_scaling_problem',
    speaker: 'Бариста',
    text: 'Двадцать — это риск. Каждый новый узел — это потенциальная дыра в безопасности. Больше людей знают — больше шансов на предательство. Не от злости — от страха. Гильдия умеет давить. Семья, работа, здоровье — они найдут болевую точку. Мы растём — но медленно. Наблюдаем каждого кандидата минимум три месяца. Проверяем. Только потом — посвящение.',
    choices: [
      {
        text: 'Три месяца — разумно. Безопасность важнее скорости.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Но время работает против нас. «Око» улучшается каждый день.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  barista_interrogation_protocol: {
    id: 'barista_interrogation_protocol',
    speaker: 'Бариста',
    text: 'Если тебя поймают — помни протокол. Ни имён, ни мест, ни паролей. Только стихи. Если допрашивают — читай стихи. Не как акт неповиновения — как способ сохранять рассудок. Ритм стиха не даёт панике захватить мозг. Двадцать лет в Сети — и ни одного предательства. Потому что мы учим людей не только прятать данные, но и держать голову.',
    choices: [
      {
        text: 'Стихи как щит разума. Я запомню.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'А если сломают? Никто не железный.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  barista_nurse_node: {
    id: 'barista_nurse_node',
    speaker: 'Бариста',
    text: 'Медсестра — Лариса. Работает в реанимации. Она вписывает строки стихов в истории болезней — в раздел «примечания». Врачи думают, это для психологического комфорта пациентов. И это правда — но это ещё и резервная копия. Триста пациентов в месяц читают стихи в своих картах. Триста человек — которые запоминают. Бессознательно. Но запоминают.',
    choices: [
      {
        text: 'Поэзия как лекарство. Буквально.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'discoverLore', loreId: 'lore_nurse_node' },
        ],
      },
      {
        text: 'Нужна координация между узлами. Централизованная, но скрытая.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  barista_broadcast_ready_act3: {
    id: 'barista_broadcast_ready_act3',
    speaker: 'Бариста',
    text: 'Володька, все двадцать узлов — готовы к трансляции. Я придумал систему: каждый узел использует свою инфраструктуру. Больница — внутреннюю сеть. Школа — учебные терминалы. Кафе — общественный Wi-Fi. Автобус — дисплей маршрута. Когда ты дашь сигнал — каждый экран в городе покажет стих. На три минуты. Потом — исчезнет. Но за три минуты — весь город прочитает.',
    choices: [
      {
        text: 'Три минуты свободы. Этого достаточно, чтобы разбудить город.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'broadcast_ready_act3', flagValue: true },
        ],
      },
      {
        text: 'А если гильдия отследит источники? Все узлы под угрозой.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },
};
