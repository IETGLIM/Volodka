import type { StoryNode } from '@/shared/types/game';

/**
 * Act 1 extended beats — cafe «Синяя яма» through IT-guild office.
 * Optional branches; golden path (cafe → barista → office → diagnosis) unchanged.
 */
export const STORY_NODES_ACT1_CAFE_OFFICE: Record<string, StoryNode> = {
  /* After poem_6 / maria_chip_trust — barista hears the chip echo. */
  cafe_chip_resonance: {
    id: 'cafe_chip_resonance',
    text: 'Бариста ставит чашку и на миг замирает. Протез пальцев ловит дрожь — то ли от сервопривода, то ли от того, что теплеет в твоём кармане. «Эхо,» — почти беззвучно. «Если несёшь чужие строки — пей. Потом не к выходу на улицу. К башне. Я дам то, чего не видно на бейдже. Если чипа ещё нет… всё равно иди. Инцидент не ждёт вежливости.»',
    contextNote: 'Стойка «Синей ямы». Бариста ловит эхо — или просто гонит к гильдии.',
    ambientSound: 'sounds/ambient/cafe_jazz_quiet.ogg',
    soundEffect: 'notify',
    speaker: 'Бариста',
    sceneId: 'cafe_evening',
    guidanceHint: 'Слушай баристу — отсюда путь к пропуску и офису гильдии.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'cafe_barista',
    effects: [
      { type: 'setFlag', flag: 'chip_cafe_returned', flagValue: true },
      { type: 'setFlag', flag: 'barista_chip_resonance', flagValue: true },
      { type: 'triggerQuest', questId: 'chip_cafe_clearance' },
      { type: 'addStat', stat: 'energy', value: 10 },
    ],
    choices: [
      {
        text: 'Показать, что слышишь — ждать пропуска',
        next: 'cafe_guild_clearance',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 4 } },
        ],
      },
      {
        text: 'Спросить про заднюю комнату — вдруг там то же эхо',
        next: 'cafe_backroom_peek',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'noticed_cafe_backroom', flagValue: true },
        ],
      },
      {
        text: 'Молча допить и идти к башне',
        next: 'office_lobby_arrival',
        effects: [
          { type: 'setFlag', flag: 'guild_summons_received', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
    ],
  },

  cafe_guild_clearance: {
    id: 'cafe_guild_clearance',
    text: 'Он доливает эспрессо — на пене снова проступает свиток и единица, но теперь линия пульсирует в такт чипу. «Это не кофе. Это пропуск, который гильдия не умеет сканировать. Инцидент #4729 уже на доске в холле. Александр будет говорить про баг. Ты — слышишь стих. Не показывай чип на ресепшене. Иди.»',
    contextNote: 'Бариста даёт невидимый пропуск Сети — пена со свитком.',
    ambientSound: 'sounds/ambient/cafe_jazz_quiet.ogg',
    soundEffect: 'item_use',
    speaker: 'Бариста',
    sceneId: 'cafe_evening',
    guidanceHint: 'Пропуск получен — иди в офис IT-гильдии через холл.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Офис гильдии',
    effects: [
      { type: 'setFlag', flag: 'guild_summons_received', flagValue: true },
      { type: 'setFlag', flag: 'asked_special_coffee', flagValue: true },
      { type: 'addSkill', skill: 'intuition', value: 1 },
    ],
    choices: [
      {
        text: 'Идти к башне гильдии',
        next: 'office_lobby_arrival',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Ещё минута в зале — потом офис',
        next: 'cafe_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: -2 }],
      },
    ],
  },

  office_lobby_arrival: {
    id: 'office_lobby_arrival',
    text: 'Холл гильдии пахнет озоном и свежим тонером. У стены серверной чип в кармане теплеет — будто узнаёт родной гул. На доске объявлений: «Инцидент #4729 — приоритет. Не обсуждать вне кабинета Александра.» Коллега у турникета слишком долго смотрит на твой профиль. Не оборачивайся резко.',
    contextNote: 'Холл IT-гильдии. Чип теплеет. На доске — бриф #4729.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    accessibilityAnnounce: 'Холл офиса. Чип резонирует. Объявление об инциденте на доске.',
    soundEffect: 'notify',
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Прочти доску взглядом — затем к Александру. Коллега следит.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'office_alexander',
    effects: [
      { type: 'setFlag', flag: 'chip_cafe_returned', flagValue: true },
      { type: 'setFlag', flag: 'barista_chip_resonance', flagValue: true },
      { type: 'setFlag', flag: 'guild_summons_received', flagValue: true },
      { type: 'setFlag', flag: 'chip_office_resonance', flagValue: true },
      { type: 'setFlag', flag: 'incident_bulletin_read', flagValue: true },
      { type: 'setFlag', flag: 'lobby_colleague_noticed', flagValue: true },
      { type: 'triggerQuest', questId: 'chip_cafe_clearance' },
      { type: 'triggerQuest', questId: 'office_lobby_watch' },
      { type: 'triggerQuest', questId: 'incident_scroll_4729' },
    ],
    choices: [
      {
        text: 'Пройти к кабинету Александра',
        next: 'office_alexander',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Задержать взгляд на коллеге — пусть знает, что замечен',
        next: 'office_colleague',
        effects: [
          { type: 'setFlag', flag: 'lobby_colleague_noticed', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Ещё раз коснуться доски взглядом — запомнить формулировку',
        next: 'office_alexander',
        effects: [
          { type: 'setFlag', flag: 'incident_bulletin_read', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'discoverLore', loreId: 'lore_incident_4729' },
        ],
      },
    ],
  },

  cafe_barista_victoria_whisper: {
    id: 'cafe_barista_victoria_whisper',
    text: 'Бариста не поднимает глаз от чашки, но голос становится тише. «Ночью сюда заходит одна. Не заказывает. Смотрит в терминал так, будто читает чужие сны. Если увидишь силуэт у подъезда — не беги. Она уже знает твоё имя в логах.» Он ставит эспрессо. «А теперь пей. Или иди. Город сам вас представит.»',
    contextNote: 'Стойка «Синей ямы». Бариста намекает на Викторию.',
    ambientSound: 'sounds/ambient/cafe_jazz_quiet.ogg',
    speaker: 'Бариста',
    sceneId: 'cafe_evening',
    guidanceHint: 'Выйди на улицу — ищи силуэт у подъезда.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'cafe_barista',
    effects: [
      { type: 'setFlag', flag: 'barista_maria_hint', flagValue: true },
      { type: 'triggerQuest', questId: 'cafe_street_whisper' },
    ],
    choices: [
      {
        text: 'Выйти на улицу — искать силуэт',
        next: 'street_bench_view',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 4 } },
        ],
      },
      {
        text: 'Сначала обычный кофе — потом улица',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'addStat', stat: 'energy', value: 10 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Пора в офис гильдии',
        next: 'office_lobby_arrival',
        effects: [
          { type: 'addKarma', value: 1 },
          { type: 'setFlag', flag: 'guild_summons_received', flagValue: true },
        ],
      },
    ],
  },

  cafe_special_coffee: {
    id: 'cafe_special_coffee',
    text: 'Бариста наклоняется ближе. «Особый — для своих. Двойной эспрессо с синтаксическим сахаром и каплей чего-то, что гильдия не умеет называть.» Он ставит чашку — на пене проступает символ: свиток и единица. «Задняя комната иногда шепчет тем, кто слушает. Но сначала — офис. Инцидент не ждёт.»',
    contextNote: 'У стойки кафе. Бариста подаёт особый кофе — на пене символ свитка.',
    ambientSound: 'sounds/ambient/cafe_jazz_quiet.ogg',
    soundEffect: 'item_use',
    speaker: 'Бариста',
    sceneId: 'cafe_evening',
    guidanceHint: 'Бариста предлагает особый кофе. Возможно, стоит попробовать.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'cafe_barista',
    choices: [
      {
        text: 'Выпить и идти в гильдию',
        next: 'office_lobby_arrival',
        effects: [
          { type: 'addStat', stat: 'energy', value: 25 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'asked_special_coffee', flagValue: true },
          { type: 'setFlag', flag: 'barista_maria_hint', flagValue: true },
          { type: 'setFlag', flag: 'chip_cafe_returned', flagValue: true },
          { type: 'setFlag', flag: 'barista_chip_resonance', flagValue: true },
          { type: 'setFlag', flag: 'guild_summons_received', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Спросить про заднюю комнату',
        next: 'cafe_backroom_peek',
      },
    ],
  },

  cafe_backroom_peek: {
    id: 'cafe_backroom_peek',
    text: 'За стеллажом с зёрнами — дверь без таблички. В нише — древний терминал, розетка, которую электрик гильдии трижды не нашёл. На экране проступает строка, будто кто-то дописывает её в реальном времени: «Ты держишь в руках куски того, что стёрли. Собери остальное.» Строка исчезает. Бариста не смотрит — он знает правило: что услышал в подсобке, остаётся в подсобке.',
    contextNote: 'Вы в подсобке кафе. Древний терминал мерцает, на экране появляется строка.',
    ambientSound: 'sounds/ambient/backroom_hum.ogg',
    accessibilityAnnounce: 'Терминал показывает загадочное сообщение.',
    soundEffect: 'notify',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    guidanceHint: 'Запомни строку с терминала — или иди к баристе в офис.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Запомнить строку и выйти в зал',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'asked_special_coffee', flagValue: true },
          { type: 'setFlag', flag: 'noticed_cafe_backroom', flagValue: true },
          { type: 'setFlag', flag: 'cafe_backroom_entered', flagValue: true },
          { type: 'setFlag', flag: 'cafe_backroom_echo_heard', flagValue: true },
          { type: 'setFlag', flag: 'cafe_backroom_secret_kept', flagValue: true },
          { type: 'triggerQuest', questId: 'cafe_backroom_echo' },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'collectPoem', poemId: 'poem_7' },
        ],
      },
      {
        text: 'Пойти к баристе — пора в офис',
        next: 'cafe_barista',
        effects: [
          { type: 'setFlag', flag: 'asked_special_coffee', flagValue: true },
          { type: 'setFlag', flag: 'noticed_cafe_backroom', flagValue: true },
          { type: 'setFlag', flag: 'cafe_backroom_entered', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
    ],
  },

  office_incident_debrief: {
    id: 'office_incident_debrief',
    text: 'Александр разворачивает на столе схему инцидента. «#4729 — не баг. Вложенный модуль, который исполняет стихи как код. Гильдия хочет стереть следы. Коллега знает о Хранилище — резервной копии, которую официально не существует. Ты — единственный, кто видит поэзию в логах и не смеётся.»',
    contextNote: 'Кабинет Александра. На столе — схема инцидента #4729.',
    speaker: 'Александр',
    sceneId: 'office_day',
    guidanceHint: 'Слушай Александра — или поговори с коллегой, пока есть время.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'office_alexander',
    choices: [
      {
        text: 'Сесть за терминал — начну диагностику',
        next: 'start_diagnosis',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'asked_details_alexander', flagValue: true },
        ],
      },
      {
        text: 'Поговорить с коллегой, пока есть время',
        next: 'office_colleague',
        effects: [{ type: 'setFlag', flag: 'asked_details_alexander', flagValue: true }],
      },
      {
        text: 'Спросить, кого это ранит — не только систему',
        next: 'start_diagnosis',
        condition: { minSkill: { empathy: 2 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addKarma', value: 2 },
          { type: 'setFlag', flag: 'asked_details_alexander', flagValue: true },
          { type: 'setFlag', flag: 'alexander_empathy_debrief', flagValue: true },
        ],
      },
      {
        text: 'Убедить рассказать всё — без официоза',
        next: 'start_diagnosis',
        condition: { minSkill: { persuasion: 2 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 3 },
          { type: 'setFlag', flag: 'asked_details_alexander', flagValue: true },
          { type: 'setFlag', flag: 'alexander_full_debrief', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_incident_4729' },
        ],
      },
    ],
  },

  office_server_pulse: {
    id: 'office_server_pulse',
    text: 'Серверная гудит на fifty hertz — тот же ритм, что лампочка в коридоре и башня за окном. Сергей не оборачивается: «В три сорок семь гул прерывается. Каждый день. С тех пор как Крах.» Между стойками — пакеты данных, зашифрованные стихотворными метафорами. «Гильдия называет это шумом. Я — архивом, который ещё дышит.»',
    contextNote: 'Серверная гильдии. Гул стоек совпадает с ритмом башни за окном.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    soundEffect: 'notify',
    speaker: 'Сергей',
    sceneId: 'office_day',
    guidanceNpcId: 'sergey',
    guidanceHint: 'Сергей видит ночные логи — спроси, пока гильдия не смотрит.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Попросить показать логи ночной смены',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'found_encrypted_packets', flagValue: true },
          { type: 'setFlag', flag: 'suspicious_logs_seen', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'sergey', npcChange: { relation: 5 } },
          { type: 'triggerQuest', questId: 'night_shift_mystery' },
        ],
      },
      {
        text: 'Запомнить и вернуться к инциденту',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'spotted_night_servers', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'triggerQuest', questId: 'night_shift_mystery' },
        ],
      },
    ],
  },

  office_vault_archive: {
    id: 'office_vault_archive',
    text: 'Терминал Хранилища открывается не сразу — слой за слоем, как строфы. В резервной копии — стих, которого нет в официальных архивах. Строки складываются в узор: «Ты держишь в руках куски того, что разбили на части...» Ты копируешь файл. На экране мигает: ACCESS LOGGED. Кто-то в гильдии уже знает, что ты здесь был.',
    textVariants: {
      highKarma: 'Ты чувствуешь, что поступаешь правильно. Стихи должны быть свободны. Терминал Хранилища открывается слой за слоем — в резервной копии строки, которых нет в официальных архивах. Ты копируешь файл. ACCESS LOGGED — но страха нет, только решимость.',
      neutralKarma: 'Терминал Хранилища открывается не сразу — слой за слоем, как строфы. В резервной копии — стих, которого нет в официальных архивах. Ты копируешь файл. На экране мигает: ACCESS LOGGED.',
      lowKarma: 'Ты оглядываешься. Кажется, за тобой следят. Но стихи важнее страха. Терминал Хранилища открывается с треском — в резервной копии строки, которых гильдия давно стёрла. ACCESS LOGGED. Сердце колотится.',
    },
    karmaThresholds: { high: 65, low: 30 },
    condition: { missingFlag: 'vault_backup_archived' },
    contextNote: 'Терминал Хранилища. На экране — резервная копия стиха, не числящегося в архивах.',
    ambientSound: 'sounds/ambient/vault_terminal_hum.ogg',
    accessibilityAnnounce: 'Хранилище: скопирован запрещённый стих. Доступ залогирован.',
    musicCue: 'discovery',
    soundEffect: 'quest_complete',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'В Хранилище спрятан стих — забери копию и уходи.',
    guidanceObjectiveType: 'collect_item',
    choices: [
      {
        text: 'Сохранить стих и уйти',
        next: 'office_explore_mode',
        effects: [
          { type: 'collectPoem', poemId: 'poem_5' },
          { type: 'setFlag', flag: 'vault_backup_archived', flagValue: true },
          { type: 'setFlag', flag: 'learn_about_vault', flagValue: true },
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'coding', value: 2 },
        ],
      },
    ],
  },
};
