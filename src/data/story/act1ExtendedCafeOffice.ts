import type { StoryNode } from '@/shared/types/game';

/**
 * Act 1 extended beats — cafe «Синяя яма» through IT-guild office.
 * Optional branches; golden path (cafe → barista → office → diagnosis) unchanged.
 */
export const STORY_NODES_ACT1_CAFE_OFFICE: Record<string, StoryNode> = {
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
        next: 'office_alexander',
        effects: [{ type: 'addKarma', value: 1 }],
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
        next: 'office_alexander',
        effects: [
          { type: 'addStat', stat: 'energy', value: 25 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'asked_special_coffee', flagValue: true },
          { type: 'setFlag', flag: 'barista_maria_hint', flagValue: true },
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
          { type: 'setFlag', flag: 'cafe_backroom_echo_heard', flagValue: true },
          { type: 'setFlag', flag: 'noticed_cafe_backroom', flagValue: true },
          { type: 'triggerQuest', questId: 'cafe_backroom_echo' },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'collectPoem', poemId: 'poem_7' },
        ],
      },
      {
        text: 'Пойти к баристе — пора в офис',
        next: 'cafe_barista',
        effects: [
          { type: 'setFlag', flag: 'noticed_cafe_backroom', flagValue: true },
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
