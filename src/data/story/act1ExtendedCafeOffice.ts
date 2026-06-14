import type { StoryNode } from '@/shared/types/game';

/**
 * Act 1 extended beats — cafe «Синяя яма» through IT-guild office.
 * Optional branches; golden path (cafe → barista → office → diagnosis) unchanged.
 */
export const STORY_NODES_ACT1_CAFE_OFFICE: Record<string, StoryNode> = {
  cafe_special_coffee: {
    id: 'cafe_special_coffee',
    text: 'Бариста наклоняется ближе. «Особый — для своих. Двойной эспрессо с синтаксическим сахаром и каплей чего-то, что гильдия не умеет называть.» Он ставит чашку — на пене проступает символ: свиток и единица. «Задняя комната иногда шепчет тем, кто слушает. Но сначала — офис. Инцидент не ждёт.»',
    speaker: 'Бариста',
    sceneId: 'cafe_evening',
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
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Запомнить строку и выйти в зал',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'cafe_backroom_echo_heard', flagValue: true },
          { type: 'setFlag', flag: 'noticed_cafe_backroom', flagValue: true },
          { type: 'triggerQuest', questId: 'cafe_backroom_echo' },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Пойти к баристе — пора в офис',
        next: 'cafe_barista',
        effects: [{ type: 'setFlag', flag: 'noticed_cafe_backroom', flagValue: true }],
      },
    ],
  },

  office_incident_debrief: {
    id: 'office_incident_debrief',
    text: 'Александр разворачивает на столе схему инцидента. «#4729 — не баг. Вложенный модуль, который исполняет стихи как код. Гильдия хочет стереть следы. Коллега знает о Хранилище — резервной копии, которую официально не существует. Ты — единственный, кто видит поэзию в логах и не смеётся.»',
    speaker: 'Александр',
    sceneId: 'office_day',
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
    ],
  },

  office_server_pulse: {
    id: 'office_server_pulse',
    text: 'Серверная гудит на fifty hertz — тот же ритм, что лампочка в коридоре и башня за окном. Сергей не оборачивается: «В три сорок семь гул прерывается. Каждый день. С тех пор как Крах.» Между стойками — пакеты данных, зашифрованные стихотворными метафорами. «Гильдия называет это шумом. Я — архивом, который ещё дышит.»',
    speaker: 'Сергей',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Попросить показать логи ночной смены',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'found_encrypted_packets', flagValue: true },
          { type: 'setFlag', flag: 'suspicious_logs_seen', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'sergey', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Запомнить и вернуться к инциденту',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'spotted_night_servers', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  office_vault_archive: {
    id: 'office_vault_archive',
    text: 'Терминал Хранилища открывается не сразу — слой за слоем, как строфы. В резервной копии — стих, которого нет в официальных архивах. Строки складываются в узор: «Ты держишь в руках куски того, что разбили на части...» Ты копируешь файл. На экране мигает: ACCESS LOGGED. Кто-то в гильдии уже знает, что ты здесь был.',
    speaker: 'narrator',
    sceneId: 'office_day',
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
