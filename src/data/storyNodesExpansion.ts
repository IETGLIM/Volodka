// ============================================
// РАСШИРЕНИЕ STORY NODES
// Готовый код для интеграции в storyNodes.ts
// ============================================

import type { StoryNode, StoryChoice, PoemLine, Interpretation, StoryEffect, PlayerSkills } from './types';

// ============================================
// HELPER FUNCTIONS
// ============================================

function createChoice(
  text: string, 
  next: string, 
  effect?: Partial<StoryEffect> & { npcId?: string; npcChange?: number }
): StoryChoice {
  const choice: StoryChoice = { text, next };
  if (effect) {
    const { npcId, npcChange, ...storyEffect } = effect;
    if (Object.keys(storyEffect).length > 0) {
      choice.effect = storyEffect as StoryEffect;
    }
    if (npcId && npcChange) {
      choice.effect = { ...choice.effect, npcId, npcChange };
    }
  }
  return choice;
}

function createSkillCheckChoice(
  text: string,
  skill: keyof PlayerSkills,
  difficulty: number,
  successNext: string,
  failNext: string,
  successEffect?: Partial<StoryEffect>,
  failEffect?: Partial<StoryEffect>
): StoryChoice {
  return {
    text,
    next: successNext,
    skillCheck: {
      skill,
      difficulty,
      successNext,
      failNext,
    },
    effect: successEffect as StoryEffect | undefined,
  };
}

// ============================================
// 1. IT-МЕТАФОРЫ И "КИБЕРПАНК"
// Добавить после существующего узла 'insomnia' (заменить или расширить)
// ============================================

export const IT_METAPHOR_NODES: Record<string, StoryNode> = {
  
  // Расширенная бессонница с IT-метафорами
  insomnia_glitch: {
    id: 'insomnia_glitch',
    type: 'narration',
    scene: 'kitchen_night',
    act: 1,
    text: `Часы показывают 3:47. Я лежу, глядя в потолок.

В голове всплывают обрывки воспоминаний. Но что-то не так.

Мысли дёргаются. Фрагментируются. Как плохо оптимизированный код, который ест всю оперативку.

Внутри — фоновый процесс. Что-то крутится в цикле, пожирая ресурсы. Но что?`,
    choices: [
      createChoice('Попытаться "убить процесс" — заставить себя не думать', 'kill_process', {
        stress: 15,
        stability: -3
      }),
      createChoice('Запустить "дебаггер" — разобраться, что происходит', 'debug_self', {
        creativity: 3,
        skillGains: { introspection: 2 }
      }),
      createChoice('Принять "утечку памяти" — пусть мысли текут', 'accept_leak', {
        stability: 2,
        stress: 5
      }),
    ],
  },

  kill_process: {
    id: 'kill_process',
    type: 'dialogue',
    scene: 'kitchen_night',
    speaker: 'Внутренний голос',
    act: 1,
    text: `"PROCESS TERMINATION FAILED

Ты не можешь просто убить то, что не понимаешь.

Ошибка 0x7F: Попытка подавления эмоций привела к критическому сбою.

Перезагрузка системы... не удалась."`,
    effect: { stress: 20, stability: -5 },
    autoNext: 'forced_sleep_glitch',
  },

  debug_self: {
    id: 'debug_self',
    type: 'narration',
    scene: 'kitchen_night',
    act: 1,
    text: `Я закрываю глаза и пытаюсь отследить.

Откуда начинается этот бесконечный цикл?

Память возвращает образы. Офис. Мигающие мониторы. Ощущение, что я — просто ресурс, который расходуют.

Строка 147: "Найдено ли то, что я ищу?"

Брейкпоинт установлен. Время исследовать.`,
    effect: { creativity: 5, skillGains: { introspection: 3, logic: 1 } },
    autoNext: 'memory_analysis',
  },

  accept_leak: {
    id: 'accept_leak',
    type: 'dialogue',
    scene: 'kitchen_night',
    speaker: 'Внутренний голос',
    act: 1,
    text: `"LEAK DETECTED

Но утечка — это не всегда ошибка.

Иногда это единственный способ освободиться от того, что больше не нужно.

garbage_collection.exe запущен...

Удалено: 3 старых сожаления, 7 неотвеченных вопросов, 1 страх."

Система стабилизируется.`,
    effect: { stress: -10, stability: 5, karma: 3 },
    autoNext: 'calm_night',
  },

  forced_sleep_glitch: {
    id: 'forced_sleep_glitch',
    type: 'dream',
    scene: 'dream',
    act: 1,
    text: `KERNEL PANIC

Система переходит в режим гибернации...

██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Сон. Но не спокойный.

В нём — фрагменты кода. Ошибки. Исключения, которые никто не обработал.

try {
  найти_смысл_жизни();
} catch (ExistentialCrisis e) {
  // Расширяемый узел — при интеграции в storyNodes.ts добавить выборы / эффекты по сюжету.
}

Ты никогда не дописал этот блок. Исключение падает. И падает. И падает...`,
    effect: { stability: -10, stress: 25, setFlag: 'had_meaningful_dream' },
    autoNext: 'dream_interpretation_glitch',
  },

  memory_analysis: {
    id: 'memory_analysis',
    type: 'dialogue',
    scene: 'kitchen_night',
    speaker: 'Внутренний голос',
    act: 1,
    text: `"АНАЛИЗ ПАМЯТИ ЗАВЕРШЁН

Обнаружены фрагментированные сектора:

Сектор 1: Творчество — 23% целостности
Сектор 2: Отношения — 41% целостности  
Сектор 3: Мечты — КРИТИЧЕСКИ НИЗКИЙ УРОВЕНЬ

Рекомендация: Дефрагментация. Объединить разрозненные части себя.

Запустить defrag.exe?"`,
    choices: [
      createChoice('Запустить дефрагментацию', 'defrag_success', {
        creativity: 5,
        stability: 5,
        skillGains: { introspection: 2 }
      }),
      createChoice('Не сейчас — система слишком нестабильна', 'defrag_skip', {
        stability: 3,
        stress: 5
      }),
    ],
  },

  defrag_success: {
    id: 'defrag_success',
    type: 'narration',
    scene: 'kitchen_night',
    act: 1,
    text: `█▓▓▓▓▓▓▓▓▓▓ DEFRAGMENTING... ▓▓▓▓▓▓▓▓▓▓█

Дефрагментация запущена.

Это больно. Обрывки воспоминаний перемещаются, соединяются, образуя новые связи.

Я вижу: то, что казалось бессвязным — на самом деле части одной истории.

Моей истории.

██████████ DEFRAGMENTATION COMPLETE ██████████

Система оптимизирована. Появилось свободное место для чего-то нового.`,
    effect: { stability: 10, creativity: 5, stress: -15, setFlag: 'had_meaningful_dream' },
    autoNext: 'morning_arrives',
  },

  defrag_skip: {
    id: 'defrag_skip',
    type: 'narration',
    scene: 'kitchen_night',
    act: 1,
    text: `Я откладываю. Не сейчас. Система слишком хрупкая.

Но фоновые процессы продолжают работать. И потреблять ресурсы.

Когда-нибудь придётся разобраться. Или система зависнет.`,
    effect: { stress: 10 },
    autoNext: 'morning_arrives',
  },

  dream_interpretation_glitch: {
    id: 'dream_interpretation_glitch',
    type: 'interpretation',
    scene: 'dream',
    act: 1,
    interpretations: [
      { 
        text: 'Мой разум — это buggy code, который нужно переписать', 
        effect: { stability: -5, introspection: 5, stress: 10 },
        insight: 'Ты видишь себя как программу с ошибками. Но кто программист?'
      },
      { 
        text: 'Нужно найти и обработать все непойманные исключения', 
        effect: { logic: 3, stability: 3, skillGains: { introspection: 2 } },
        insight: 'Проблемы не решаются игнорированием. try/catch — это принятие.'
      },
      { 
        text: 'Может, это не баг, а фича? Мои "ошибки" делают меня собой', 
        effect: { creativity: 5, karma: 5, skillGains: { resilience: 2 } },
        insight: 'Иногда несовершенство — это и есть уникальность.'
      },
      { 
        text: 'SYSTEM ERROR: Интерпретация не найдена', 
        effect: { stress: 15, stability: -3 },
        insight: 'Ты предпочёл не понимать.'
      },
    ],
    autoNext: 'morning_arrives',
  },

  calm_night: {
    id: 'calm_night',
    type: 'narration',
    scene: 'kitchen_dawn',
    act: 1,
    text: `Рассвет. Система стабилизировалась.

Я не решил все проблемы. Но хотя бы очистил немного места.

Этого хватит, чтобы пережить ещё один день.`,
    autoNext: 'morning_arrives',
  },
};


// ============================================
// 2. SKILL CHECKS - Встреча с Марией
// Заменить узел 'maria_introduction' и следующие за ним
// ============================================

export const MARIA_SKILL_CHECK_NODES: Record<string, StoryNode> = {

  maria_introduction_v2: {
    id: 'maria_introduction_v2',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: '???',
    act: 2,
    text: `"Это было... настоящее."

Она улыбается, слегка наклонив голову.

"Меня зовут Мария. Я тоже пишу. Иногда."

Её взгляд — внимательный, как будто она считывает что-то между строк.`,
    choices: [
      // Обычный выбор
      createChoice('"Спасибо. Твоё мнение много значит."', 'maria_warm_v2', {
        karma: 3,
        npcId: 'maria',
        npcChange: 5,
        skillGains: { empathy: 1 }
      }),
      // Skill Check: Эмпатия
      createSkillCheckChoice(
        '[Эмпатия] "Ты кажешься... грустной? Твои слова звучат иначе, чем улыбка"',
        'empathy',
        20, // сложность
        'maria_empathy_success', // успех
        'maria_empathy_fail', // провал
        { karma: 5, npcId: 'maria', npcChange: 15, skillGains: { empathy: 2 } }, // эффект успеха
        { stress: 10, karma: -3 } // эффект провала
      ),
      // Skill Check: Интуиция
      createSkillCheckChoice(
        '[Интуиция] Почувствовать, что стоит сказать',
        'intuition',
        15,
        'maria_intuition_success',
        'maria_intuition_fail',
        { creativity: 5, npcId: 'maria', npcChange: 10 },
        { stress: 5 }
      ),
      // Обычный выбор
      createChoice('"Просто наброски. Ничего особенного."', 'maria_humble_v2', {
        npcId: 'maria',
        npcChange: 2
      }),
    ],
  },

  maria_empathy_success: {
    id: 'maria_empathy_success',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: `Она замирает на секунду. Улыбка исчезает, сменяясь чем-то более настоящим.

"Ты... заметил."

Она садится напротив.

"Давно никто не видел дальше слов. Да, я пишу. Потому что иначе — я теряю себя. Каждый раз, когда не пишу — что-то умирает внутри."

Пауза.

"Ты тоже это чувствуешь, да? Эту... необходимость?"`,
    effect: { questStart: 'maria_connection', karma: 5, setFlag: 'maria_opened_up' },
    choices: [
      createChoice('"Да. Это как дыхание — перестаёшь, и начинаешь задыхаться"', 'maria_deep_bond', {
        creativity: 5,
        npcId: 'maria',
        npcChange: 10,
        skillGains: { empathy: 1 }
      }),
      createChoice('"Пока не знаю. Я только учусь это понимать"', 'maria_honest_learning', {
        stability: 3,
        npcId: 'maria',
        npcChange: 5
      }),
    ],
  },

  maria_empathy_fail: {
    id: 'maria_empathy_fail',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: `Её улыбка становится чуть более закрытой.

"Это... неожиданный вопрос."

Она отступает на полшага.

"Иногда лучше читать строки, а не между ними."

Неловкое молчание.`,
    effect: { stress: 10, karma: -3 },
    autoNext: 'maria_retreat',
  },

  maria_retreat: {
    id: 'maria_retreat',
    type: 'narration',
    scene: 'cafe_evening',
    act: 2,
    text: `Разговор не сложился. Мария вежливо кивает и отходит.

Может, я слишком много прочитал. Или слишком мало.

В любом случае — упущенный момент.`,
    effect: { mood: -5 },
    autoNext: 'cafe_evening_end',
  },

  maria_intuition_success: {
    id: 'maria_intuition_success',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: `Ты молчишь секунду. Потом говоришь:

"Некоторые стихи пишутся кровью. Этот — был таким."

Её глаза расширяются.

"Откуда ты..."

"Не знаю. Просто почувствовал."

Она медленно кивает.

"У тебя... есть это. Интуиция. Береги её."`,
    effect: { creativity: 5, npcId: 'maria', npcChange: 10, skillGains: { intuition: 2 } },
    autoNext: 'cafe_evening_end',
  },

  maria_intuition_fail: {
    id: 'maria_intuition_fail',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: `Ты пытаешься что-то сказать, но слова не приходят.

"Я... это..."

Она смотрит с ожиданием. Но момент ускользает.

"Ничего. Забудь."

Она чуть улыбается — теперь уже не так тепло.`,
    effect: { stress: 5 },
    autoNext: 'maria_humble_v2',
  },

  maria_warm_v2: {
    id: 'maria_warm_v2',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: `"Ты пишешь о том, что чувствуешь. Это редкость. Большинство прячется за красивыми словами."

Она делает паузу.

"Буду рада увидеть тебя здесь снова. Может, поговорим о... о вещах, которые имеют значение?"`,
    effect: { questStart: 'maria_connection' },
    autoNext: 'cafe_evening_end',
  },

  maria_humble_v2: {
    id: 'maria_humble_v2',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: `"Скромность — это хорошо. Но не прячься слишком сильно."

Она слегка улыбается.

"У тебя есть голос. Используй его."`,
    autoNext: 'cafe_evening_end',
  },

  maria_deep_bond: {
    id: 'maria_deep_bond',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: `Она кивает медленно. Что-то меняется в её взгляде — стены опускаются.

"Да. Именно так."

Молчание. Но не неловкое — общее.

"Редко встретишь кого-то, кто понимает. Ещё реже — того, кто не боится этого понимания."

Она протягивает руку.

"Напиши мне. Если захочешь поговорить. О чём угодно."`,
    effect: { karma: 10, creativity: 5, setFlag: 'maria_close_bond', npcId: 'maria', npcChange: 20 },
    autoNext: 'cafe_evening_end',
  },

  maria_honest_learning: {
    id: 'maria_honest_learning',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Мария',
    act: 2,
    text: `"Честный ответ."

Она улыбается — теперь тепло.

"Учиться понимать себя — это уже половина пути. Большинство даже не начинают."

"Приходи сюда. Будем учиться вместе."`,
    effect: { stability: 5, npcId: 'maria', npcChange: 10 },
    autoNext: 'cafe_evening_end',
  },
};


// ============================================
// 3. КВЕСТЫ - Hidden Meaning & Estranged Friend
// Новые узлы для продвижения по скрытым квестам
// ============================================

export const QUEST_NODES: Record<string, StoryNode> = {

  // Квест: hidden_meaning - Скрытый смысл снов
  dream_remember: {
    id: 'dream_remember',
    type: 'dream',
    scene: 'dream',
    act: 2,
    text: `Снова этот сон.

Но сегодня что-то иначе. Ты замечаешь детали, которые раньше ускользали.

В углу комнаты — старый компьютер. Экран мерцает.

На нём — текст. Твои собственные строки, но в другом порядке. Как будто кто-то переставил слова.

try {
  помнить();
} catch (Невозвратимо e) {
  // backup не существует
}

Это... послание?`,
    effect: { 
      setFlag: 'had_meaningful_dream',
      questObjective: { questId: 'hidden_meaning', objectiveId: 'remember_dreams', value: 1 }
    },
    choices: [
      createSkillCheckChoice(
        '[Восприятие] Разглядеть скрытый текст на экране',
        'perception',
        25,
        'dream_hidden_text_success',
        'dream_hidden_text_fail',
        { skillGains: { perception: 3 } },
        { stress: 5 }
      ),
      createChoice('Запомнить образ и проснуться', 'dream_wake_remember', {
        stability: 3,
        questObjective: { questId: 'hidden_meaning', objectiveId: 'interpret_dreams', value: 1 }
      }),
    ],
  },

  dream_hidden_text_success: {
    id: 'dream_hidden_text_success',
    type: 'narration',
    scene: 'dream',
    act: 2,
    text: `Ты вглядываешься. Текст расплывается, потом становится чётче.

Это не просто слова. Это карта.

Битые сектора памяти — это не ошибки. Это места, где ты спрятал то, что не хотел помнить.

Старый друг. Потерянная мечта. Обещание, которое не сдержал.

Теперь ты знаешь, где искать.`,
    effect: { 
      skillGains: { perception: 3, introspection: 2 },
      questObjective: { questId: 'hidden_meaning', objectiveId: 'find_pattern', value: 1 },
      setFlag: 'found_memory_map'
    },
    autoNext: 'morning_arrives',
  },

  dream_hidden_text_fail: {
    id: 'dream_hidden_text_fail',
    type: 'narration',
    scene: 'dream',
    act: 2,
    text: `Текст расплывается. Экран гаснет.

Что-то было там. Но ты не успел прочитать.

Просыпаешься с ощущением упущенного.`,
    effect: { stress: 5 },
    autoNext: 'morning_arrives',
  },

  dream_wake_remember: {
    id: 'dream_wake_remember',
    type: 'narration',
    scene: 'home_morning',
    act: 2,
    text: `Утро. Ты записываешь всё, что помнишь.

Слова складываются в странный узор. Как будто твой подсознательный "сервер" пытается отправить тебе сообщение через сбои системы.

Интересно, что ещё он хочет сказать?`,
    effect: { stability: 3 },
    autoNext: 'morning_arrives',
  },

  // Квест: estranged_friend - Потерянный друг
  old_photo_found: {
    id: 'old_photo_found',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: `Перебирая старые вещи, натыкаешься на фотографию.

Трое на ней. Ты, Денис... и кто-то ещё.

Андрей. Ты не думал о нём годами.

Старый друг. Ближайший, когда-то. Потом — работа, разные города, жизнь...

Как он сейчас?`,
    effect: { 
      questObjective: { questId: 'estranged_friend', objectiveId: 'remember_friend', value: 1 },
      setFlag: 'remembered_andrei'
    },
    choices: [
      createChoice('Попробовать найти его в соцсетях', 'search_andrei', {
        karma: 3
      }),
      createChoice('Отложить фото — прошлое должно оставаться прошлым', 'ignore_andrei', {
        stability: 2,
        karma: -2
      }),
      createSkillCheckChoice(
        '[Интуиция] Вспомнить, о чём вы мечтали вместе',
        'intuition',
        20,
        'andrei_dream_success',
        'andrei_dream_fail',
        { creativity: 5, skillGains: { introspection: 2 } },
        { stress: 5 }
      ),
    ],
  },

  search_andrei: {
    id: 'search_andrei',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: `Вводишь имя. Несколько результатов.

Один профиль — частный. Фотография профиля — горы.

Другой — открыт. Последняя активность три года назад.

Третий... не Андрей, но в друзьях — он.

Профиль: Андрей "Дрей" Морозов. Город: другой, но не так далеко.

Статус: "Иногда нужно потеряться, чтобы найтись."`,
    effect: { 
      questObjective: { questId: 'estranged_friend', objectiveId: 'find_contact', value: 1 },
      setFlag: 'found_andrei_online'
    },
    choices: [
      createChoice('Написать сообщение', 'message_andrei', {
        karma: 5
      }),
      createChoice('Посмотреть, подождать', 'wait_andrei', {
        stability: 2
      }),
    ],
  },

  ignore_andrei: {
    id: 'ignore_andrei',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: `Фотография возвращается в коробку. В прошлое.

Но что-то остаётся. Вопрос без ответа.

Что, если ты мог бы что-то изменить?`,
    effect: { karma: -2, stress: 5 },
    autoNext: 'home_evening_choices',
  },

  andrei_dream_success: {
    id: 'andrei_dream_success',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: `Память возвращается.

Вы сидели на крыше. Смотрели на звёзды. Андрей говорил:

"Представь, что мы можем сделать что угодно. Не ограничение — только мы сами. Что бы ты сделал?"

Ты не ответил тогда. Но сейчас...

Может, ответ в том, что ты делаешь сейчас. Пишешь. Ищешь.

Андрей понял бы.`,
    effect: { 
      creativity: 5, 
      skillGains: { introspection: 2 },
      setFlag: 'remembered_shared_dream'
    },
    autoNext: 'search_andrei',
  },

  andrei_dream_fail: {
    id: 'andrei_dream_fail',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: `Лицо знакомое. Но воспоминания — как повреждённый файл.

Фрагменты есть, но完整ное не складывается.

Странно, как память работает. Одни вещи яркие, другие — как чужие.`,
    effect: { stress: 5 },
    autoNext: 'home_evening_choices',
  },

  message_andrei: {
    id: 'message_andrei',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: `Пальцы замирают над клавиатурой.

Что написать? "Привет, давно не виделись"?

"Нашёл старую фотографию, вспомнил"?

"Как ты? Я... пишу теперь. Стихи."

Отправляешь. Простое:

"Андрей. Это я. Нашёл старую фотку — решил написать. Надеюсь, у тебя всё хорошо. Если будет время — буду рад услышать."

Три точки... Он печатает?`,
    effect: { 
      karma: 5, 
      questObjective: { questId: 'estranged_friend', objectiveId: 'reach_out', value: 1 },
      setFlag: 'messaged_andrei'
    },
    autoNext: 'home_evening_choices',
  },

  wait_andrei: {
    id: 'wait_andrei',
    type: 'narration',
    scene: 'home_evening',
    act: 2,
    text: `Профиль открыт. Можно вернуться позже.

Иногда нужно время, чтобы решиться.`,
    autoNext: 'home_evening_choices',
  },
};


// ============================================
// 4. АКТ 3 - КРИЗИС (Конфликт)
// Цепочка из 6 узлов для кульминации
// ============================================

export const ACT3_CRISIS_NODES: Record<string, StoryNode> = {

  // Начало кризиса - день финального выступления
  crisis_day: {
    id: 'crisis_day',
    type: 'narration',
    scene: 'office_morning',
    act: 3,
    text: `Вечер пятницы. Сегодня — финальное выступление в "Синем коте".

Жюри из столичного журнала. Твой шанс. То, ради чего ты писал все эти месяцы.

Ты почти готов уйти с работы пораньше, когда...

Монитор вспыхивает красным.

CRITICAL ERROR: Server cluster failure
Data center: DC-03 (primary)
Impact: ALL SERVICES DOWN
Required: Immediate intervention

Рядом появляется коллега — бледный.

"Сервера упали. Все. Нужна помощь. Прямо сейчас."`,
    effect: { stress: 20, mood: -10 },
    choices: [
      createChoice('Остаться и чинить — это моя работа', 'stay_fix_servers', {
        karma: -5,
        stability: 3,
        stress: 10
      }),
      createChoice('Уйти — выступление важнее', 'leave_for_performance', {
        karma: 5,
        stress: 15,
        setFlag: 'chose_art_over_work'
      }),
      createSkillCheckChoice(
        '[Логика] Быстро диагностировать проблему',
        'logic',
        30,
        'quick_diagnosis_success',
        'quick_diagnosis_fail',
        { skillGains: { logic: 3 }, stress: 5 },
        { stress: 20, stability: -5 }
      ),
    ],
  },

  stay_fix_servers: {
    id: 'stay_fix_servers',
    type: 'narration',
    scene: 'office_morning',
    act: 3,
    text: `Ты откладываешь всё. Это — работа. Ответственность.

Часы бегут. 18:00. 19:00. 20:00.

Сервера поднимаются к 20:30. Ты вытираешь пот.

Коллега жмёт руку: "Спас нас. Серьёзно."

Но за окном — ночь. "Синий кот" далеко. Выступление — без тебя.

Ты открываешь телефон. Сообщения от Марии: "Ты где? Они спрашивают о тебе."

Ты не отвечаешь.`,
    effect: { karma: -10, stability: 5, creativity: -10, setFlag: 'missed_performance' },
    autoNext: 'post_crisis_empty',
  },

  post_crisis_empty: {
    id: 'post_crisis_empty',
    type: 'dialogue',
    scene: 'office_morning',
    speaker: 'Внутренний голос',
    act: 3,
    text: `"OPERATION SUCCESSFUL. PATIENT DEAD.

Ты сохранил сервера. Но что с тобой?

Ты — надёжный сотрудник. Это важно.

Но ты — ещё и тот, кто пишет. Что с ним?

system.gc() не работает. Мусор копится."`,
    effect: { stress: 15 },
    choices: [
      createChoice('"Работа — это реальность. Мечты — роскошь"', 'accept_reality', {
        stability: 5,
        karma: -5,
        stress: 10
      }),
      createChoice('"Я сделал ошибку. Нужно было уйти"', 'regret_choice', {
        creativity: 5,
        stress: 5,
        setFlag: 'regretted_staying'
      }),
    ],
  },

  accept_reality: {
    id: 'accept_reality',
    type: 'narration',
    scene: 'home_evening',
    act: 3,
    text: `Реальность. Рутина. Стабильность.

Ты пишешь ночью, в свободное время. Это тоже что-то.

Но что-то — изменилось. Слова приходят труднее. Строки — короче.

Может, это временно. Может.

Или может — ты только что убил ту часть себя, которая умела мечтать.`,
    effect: { creativity: -15, stability: 10, pathShift: 'broken' },
    autoNext: 'broken_ending_setup',
  },

  regret_choice: {
    id: 'regret_choice',
    type: 'narration',
    scene: 'home_evening',
    act: 3,
    text: `Ошибка. Ты понимаешь это сейчас.

Сервера можно было поднять завтра. Или кто-то другой справился бы.

Выступление — было только сегодня.

Ты берёшь блокнот. Пишешь.

Не стихи. Что-то другое. Гнев? Сожаление?

Слова выходят, как кровь из раны.`,
    effect: { creativity: 10, stress: 10, setFlag: 'wrote_from_regret' },
    autoNext: 'redemption_chance',
  },

  redemption_chance: {
    id: 'redemption_chance',
    type: 'dialogue',
    scene: 'home_evening',
    speaker: 'Мария (сообщение)',
    act: 3,
    text: `Телефон вибрирует.

"Они спрашивали о тебе. Я сказала, что ты бы пришёл, если бы мог. Они оставили контакт. Хотят прочитать твои работы.

Не всё потеряно. Приходи в воскресенье. Будет ещё одно чтение — камерное.

Только не исчезай."

Три точки.

"Пожалуйста."`,
    choices: [
      createChoice('Пойти в воскресенье — второй шанс', 'second_chance', {
        creativity: 5,
        karma: 5
      }),
      createChoice('Отказаться — я упустил момент', 'give_up_chance', {
        stability: -5,
        stress: 10
      }),
    ],
  },

  second_chance: {
    id: 'second_chance',
    type: 'narration',
    scene: 'cafe_evening',
    act: 3,
    text: `Воскресенье. Камерное чтение. Десять человек.

Ты читаешь. Не то, что готовил. То, что написал ночью после провала.

Сырое. Настоящее. Болезненное.

Когда заканчиваешь — тишина.

Потом один из жюри кивает.

"Это было... честно. Больше, чем любое выступление в пятницу."

Он протягивает визитку.

"Напишите мне. Хочу посмотреть на ваши другие работы."`,
    effect: { creativity: 15, karma: 10, setFlag: 'got_second_chance' },
    autoNext: 'act3_reflection',
  },

  give_up_chance: {
    id: 'give_up_chance',
    type: 'narration',
    scene: 'home_evening',
    act: 3,
    text: `Ты не отвечаешь.

Второй шанс... Но разве ты заслужил?

Слова не приходят. Страницы пустые.

Может, это и был конец истории.`,
    effect: { creativity: -10, stability: -5, karma: -5, pathShift: 'broken' },
    autoNext: 'broken_ending_setup',
  },

  leave_for_performance: {
    id: 'leave_for_performance',
    type: 'narration',
    scene: 'office_morning',
    act: 3,
    text: `Ты снимаешь бейдж. Кладёшь на стол.

"Извини. Мне нужно идти."

Коллега смотрит с недоверием.

"Что?! Ты серьёзно? Мы на грани!"

"Я знаю. Но есть вещи важнее серверов."

Ты уходишь. За спиной — крики, паника, красные экраны.

Но перед тобой — ночь. И "Синий кот".`,
    effect: { karma: 10, stress: 20, stability: -5, setFlag: 'chose_art_over_work' },
    autoNext: 'rushing_to_performance',
  },

  rushing_to_performance: {
    id: 'rushing_to_performance',
    type: 'narration',
    scene: 'street_night',
    act: 3,
    text: `Ты бежишь. Такси не ловится. Город кажется враждебным.

Фонари, светофоры, толпа — всё против тебя.

Прибытие. 20:55. Пять минут до конца.

Ведущий уже объявляет:

"...и наш последний участник на сегодня..."

Ты врываешься в дверь.`,
    choices: [
      createSkillCheckChoice(
        '[Убеждение] Попросить дать тебе выступить',
        'persuasion',
        25,
        'persuade_success',
        'persuade_fail',
        { karma: 5, skillGains: { persuasion: 2 } },
        { stress: 15, karma: -3 }
      ),
      createChoice('Выйти на сцену молча — пусть стихи говорят', 'silent_entrance', {
        creativity: 5
      }),
    ],
  },

  persuade_success: {
    id: 'persuade_success',
    type: 'narration',
    scene: 'cafe_evening',
    act: 3,
    text: `"Подождите!"

Все оборачиваются. Ведущий хмурится.

"Я должен был быть в списке. Я... задержался. Но мне нужно это. Пожалуйста."

Секунда тишины. Кто-то из жюри шепчет ведущему.

"Хорошо. Две минуты. Удиви нас."

Ты берёшь микрофон.`,
    effect: { karma: 5, skillGains: { persuasion: 2 } },
    autoNext: 'performance_climax',
  },

  persuade_fail: {
    id: 'persuade_fail',
    type: 'narration',
    scene: 'cafe_evening',
    act: 3,
    text: `"Подождите —"

Ведущий неумолим.

"Извините, программа окончена. Правила есть правила."

Ты стоишь посреди зала. Все смотрят. Мария — с жалостью.

И тут — один из жюри встаёт.

"Я слышал его раньше. Дайте ему шанс."

Ведущий колеблется.

"...Две минуты. Удиви нас."`,
    effect: { stress: 15, karma: -3 },
    autoNext: 'performance_climax',
  },

  silent_entrance: {
    id: 'silent_entrance',
    type: 'narration',
    scene: 'cafe_evening',
    act: 3,
    text: `Ты не говоришь ни слова. Просто идёшь к сцене.

Микрофон стоит. Ты берёшь его.

Тишина в зале. Ждут.

И ты читаешь.

Не то, что готовил. То, что чувствуешь сейчас.

Спешка. Страх. Решимость. Выбор между двумя жизнями.

Всё — в словах.`,
    effect: { creativity: 10 },
    autoNext: 'performance_climax',
  },

  performance_climax: {
    id: 'performance_climax',
    type: 'narration',
    scene: 'cafe_evening',
    act: 3,
    text: `Ты читаешь.

О серверах, которые падают, как надежды.
О словах, которые важнее стабильности.
О выборе между "должен" и "хочу".

Это не идеально. Это — честно.

Когда заканчиваешь — тишина.

Потом — аплодисменты. Не громкие. Но настоящие.

Мария улыбается. Жюри перешёптываются.

Ты сделал это.`,
    effect: { creativity: 20, karma: 15, mood: 15, setFlag: 'performed_at_final' },
    autoNext: 'after_performance',
  },

  after_performance: {
    id: 'after_performance',
    type: 'dialogue',
    scene: 'cafe_evening',
    speaker: 'Представитель жюри',
    act: 3,
    text: `"То, что вы сделали сегодня..."

Он делает паузу.

"Это было... незапланировано. И именно поэтому — настоящее."

"Мы хотели бы опубликовать ваши работы. Не все — но те, что вы читали сегодня."

"Особенно... про сервера."

Улыбка.

"Есть в этом что-то. Для нашего времени."`,
    effect: { creativity: 10, karma: 10, setFlag: 'offered_publication' },
    choices: [
      createChoice('Принять предложение', 'accept_publication_v2', {
        creativity: 5,
        karma: 5
      }),
      createChoice('Попросить время подумать', 'think_publication', {
        stability: 3
      }),
    ],
  },

  accept_publication_v2: {
    id: 'accept_publication_v2',
    type: 'narration',
    scene: 'cafe_evening',
    act: 3,
    text: `"Да. Я согласен."

Простые слова. Но что-то меняется.

Ты — не просто тот, кто пишет в стол. Ты — тот, кого будут читать.

Это пугает. И вдохновляет одновременно.`,
    effect: { creativity: 10, karma: 10, setFlag: 'published' },
    autoNext: 'act3_reflection',
  },

  think_publication: {
    id: 'think_publication',
    type: 'narration',
    scene: 'cafe_evening',
    act: 3,
    text: `"Можно подумать?"

"Конечно. У вас есть неделя."

Неделя. Семь дней, чтобы решить — кто ты.

Тот, кто работает с серверами? Или тот, кто пишет о падениях?`,
    autoNext: 'act3_reflection',
  },

  quick_diagnosis_success: {
    id: 'quick_diagnosis_success',
    type: 'narration',
    scene: 'office_morning',
    act: 3,
    text: `Ты вглядываешься в логи. Паттерн.

"Это не сбой. Это DDoS. Источник — внешний. Нужно просто заблокировать IP-диапазон."

30 минут. Сервера встают.

Коллега смотрит с уважением.

"Как ты...?"

"Опыт. И немного удачи."

Время: 18:45. Ты успеваешь.`,
    effect: { skillGains: { logic: 3, coding: 2 }, stress: 5 },
    autoNext: 'rushing_to_performance',
  },

  quick_diagnosis_fail: {
    id: 'quick_diagnosis_fail',
    type: 'narration',
    scene: 'office_morning',
    act: 3,
    text: `Ты пытаешься. Но логи — хаос. Ошибки, исключения, cascade failures.

Это сложнее, чем казалось.

Время идёт. 19:00. 20:00.

Ты всё ещё здесь. Выступление — без тебя.`,
    effect: { stress: 20, stability: -5 },
    autoNext: 'post_crisis_empty',
  },

  broken_ending_setup: {
    id: 'broken_ending_setup',
    type: 'narration',
    scene: 'home_evening',
    act: 3,
    text: `Дни проходят. Слова не приходят.

Ты работаешь. Ешь. Спишь. Работаешь.

"Синий кот" — где-то там. Мария — где-то там. Стихи — где-то там.

А ты — здесь. В рутине. В безопасном.

Это жизнь?

Или это — kernel panic, который ты просто научился игнорировать?`,
    effect: { stability: -10, creativity: -20 },
    autoNext: 'final_choices',
  },
};


// ============================================
// ИНСТРУКЦИИ ПО ИНТЕГРАЦИИ
// ============================================

/*
Чтобы интегрировать эти узлы в основной файл storyNodes.ts:

1. IT-МЕТАФОРЫ:
   - Добавить IT_METAPHOR_NODES после существующего узла 'insomnia'
   - Изменить autoNext у 'too_tired' с 'insomnia' на 'insomnia_glitch'
   - Или использовать 'insomnia_glitch' как альтернативный путь

2. SKILL CHECKS:
   - Заменить 'maria_introduction' на 'maria_introduction_v2'
   - Добавить все MARIA_SKILL_CHECK_NODES в конец файла

3. КВЕСТЫ:
   - Добавить QUEST_NODES в конец файла
   - Добавить триггеры для 'dream_remember' и 'old_photo_found'
     в случайные события или сны

4. АКТ 3 КРИЗИС:
   - Заменить 'act2_bridge' autoNext на 'crisis_day'
   - Добавить все ACT3_CRISIS_NODES
   - Убедиться, что 'act3_reflection' ведёт к 'final_choices'

Для использования createSkillCheckChoice - убедитесь, что 
в типах StoryChoice есть поле skillCheck:
  skillCheck?: {
    skill: keyof PlayerSkills;
    difficulty: number;
    successNext: string;
    failNext: string;
  };
*/
