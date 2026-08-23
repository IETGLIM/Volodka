import type { QuestDefinition } from '@/shared/types/game';

/**
 * «Голоса Пирса» — 5 побочных квестов (Акт 2 → Акт 4), v4.8.0.
 *
 * Тема: река помнит больше, чем городские архивы. Пирс — место, где
 * заканчивается асфальт и начинается вода: здесь ловят рыбу и ловят
 * слова, здесь оставляют то, что не жалко, и то, что очень жалко.
 * Каждый квест — один голос с реки: сторожа, старухи, эха, бардовой
 * девчонки и женщины, которая ждёт тридцать лет.
 *
 * Пять механик: доставка с развилкой (подождать/успеть), сбор трёх
 * голосов-записей, бой с «речным» крипом + трофей, наблюдение на
 * рассвете (время суток) и выбор-развязка чужой тайны.
 *
 * Все ID NPC, сцен и врагов сверены с реестрами (allNpcDefinitions,
 * sceneIds, engine/combat/enemies). Сюжетные ноды — в
 * src/data/story/pierVoicesStory.ts. Тематически дополняет пак
 * «Уличные легенды» (город) водной линией (река).
 */
export const PIER_VOICES_QUESTS: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════
     АКТ 2 — «Радиogramма для Зины»
     Баба Зина просит передать жестяную коробку Марине на другой
     берег. Развилка: паром утром / мост в обход.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'pv_zina_tin_box',
    title: 'Радиограмма для Зины',
    description:
      'Баба Зина — хранительница «Зари-М» — суёт тебе в руки жестяную коробку из-под чая. Внутри что-то тихо перекатывается. «Марине отнеси. Дом за мостом, у самой воды. Скажешь: окончание — "е", не "я". Она поймёт». Паром ходит только утром, мост — в обход через полгорода. Выбирай.',
    act: 2,
    faction: 'neutral',
    questType: 'side',
    difficulty: 'easy',
    hint: 'Баба Зина у «Зари-М» → паром утром ИЛИ обходной мост → Марина, дом за мостом.',
    objectives: [
      {
        id: 'take_zina_box',
        description: 'Взять жестяную коробку у Бабы Зины',
        type: 'npc_talked',
        target: 'baba_zina',
        completed: false,
      },
      {
        id: 'reach_marina_house',
        description: 'Добраться до дома Марины за мостом',
        type: 'location_visited',
        target: 'river_pier',
        completed: false,
      },
      {
        id: 'deliver_zina_box',
        description: 'Передать коробку и слово-ключ Марине',
        type: 'npc_talked',
        target: 'marina',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addCredits', value: 40 },
      { type: 'addKarma', value: 3 },
    ],
    questGiverNpcId: 'baba_zina',
    linkedStoryNodeId: 'pv_zina_box_start',
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 2 — «Три голоса реки»
     Трофим-сторож собирает звуки реки на старый магнитофон. Три
     записи: скрип причала, гудок далёкого буксира, песня Ритки.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'pv_three_voices',
    title: 'Три голоса реки',
    description:
      'У Трофима — сторожа пирса — есть старый ленточный магнитофон и идея: записать реку, пока её не «облагородили» до бетонного лотка. Три голоса нужны: скрип причала на рассвете, гудок ночного буксира и Ритку — она поёт так, что даже датчики гильдии сбиваются с ритма.',
    act: 2,
    faction: 'neutral',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['pv_zina_tin_box'],
    hint: 'Трофим на пирсе → рассвет на причале → ночной гудок (пирс вечером) → Ритка на пирсе.',
    objectives: [
      {
        id: 'hear_trofim_idea',
        description: 'Услышать идею Трофима о записи реки',
        type: 'npc_talked',
        target: 'fisherman_trofim',
        completed: false,
      },
      {
        id: 'record_dawn_creak',
        description: 'Записать скрип причала на рассвете',
        type: 'flag_set',
        target: 'pv_recorded_dawn_creak',
        completed: false,
      },
      {
        id: 'record_tug_horn',
        description: 'Записать гудок ночного буксира',
        type: 'flag_set',
        target: 'pv_recorded_tug_horn',
        completed: false,
      },
      {
        id: 'record_ritka_song',
        description: 'Договориться с Риткой о записи песни',
        type: 'npc_talked',
        target: 'chk_ritka',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addCredits', value: 60 },
      { type: 'addKarma', value: 5 },
    ],
    questGiverNpcId: 'fisherman_trofim',
    linkedStoryNodeId: 'pv_three_voices_start',
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «То, что гильдия утопила»
     Марат-эхо просит поднять со дна серверный блок. Речные крипы
     охраняют. Боевая задача + трофей.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'pv_drowned_server',
    title: 'То, что гильдия утопила',
    description:
      'Марат-эхо — цифровой след, живущий в отражениях воды — нашёл то, что гильдия «утилизировала» в реке три года назад: серверный блок с невыключенными разумами. Он не может поднять его сам: у эха нет рук. У тебя — есть. Но у блока завелись «сторожа»: речные крипы, которых подпитывает утечка.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['pv_three_voices'],
    hint: 'Марат-эхо на пирсе → зачистить речных крипов (2 боя) → поднять серверный блок.',
    objectives: [
      {
        id: 'talk_marat_echo',
        description: 'Поговорить с Маратом-эхом о затопленном сервере',
        type: 'npc_talked',
        target: 'marat_echo',
        completed: false,
      },
      {
        id: 'defeat_river_creeps',
        description: 'Разогнать речных крипов-сторожей',
        type: 'flag_set',
        target: 'pv_river_creeps_cleared',
        completed: false,
      },
      {
        id: 'raise_server_block',
        description: 'Поднять серверный блок со дна',
        type: 'flag_set',
        target: 'pv_server_block_raised',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addCredits', value: 90 },
      { type: 'addXp', value: 60 },
    ],
    questGiverNpcId: 'marat_echo',
    linkedStoryNodeId: 'pv_drowned_server_start',
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Ожидание на причале»
     Марина тридцать лет приходит на причал в одно и то же число.
     Наблюдение + расследование: кого она ждёт?
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'pv_waiting_on_pier',
    title: 'Ожидание на причале',
    description:
      'Марина — женщина из дома за мостом — приходит на причал каждое девятнадцатое число. Сидит час, уходит. Тридцать лет подряд. Ни писем, ни вестей — просто сидит. Ритка говорит: «Она ждёт того, кто обещал вернуться с того берега». Разберись, кого она ждёт — и можно ли это ожидание закрыть.',
    act: 4,
    faction: 'neutral',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['pv_zina_tin_box'],
    hint: 'Ритка → наблюдение за Мариной на причале → старый билет → развязка.',
    objectives: [
      {
        id: 'hear_ritka_story',
        description: 'Услышать от Ритки про Марину',
        type: 'npc_talked',
        target: 'chk_ritka',
        completed: false,
      },
      {
        id: 'watch_marina_pier',
        description: 'Понаблюдать за Мариной на причале',
        type: 'flag_set',
        target: 'pv_watched_marina',
        completed: false,
      },
      {
        id: 'find_old_ticket',
        description: 'Найти старый билет на паром в её доме',
        type: 'flag_set',
        target: 'pv_found_ferry_ticket',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addKarma', value: 8 },
      { type: 'addXp', value: 45 },
    ],
    questGiverNpcId: 'chk_ritka',
    linkedStoryNodeId: 'pv_waiting_start',
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Голос из водостока» (финал линии)
     Магнитофон Трофима записал четвёртый голос, которого никто
     не просил. Что делать с записью — выбор игрока.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'pv_fourth_voice',
    title: 'Четвёртый голос',
    description:
      'Лента Трофима записала четвёртый голос — тот, которого никто не просил и никто не слышал живьём. На записи — разговор, который не должен был сохраниться: чьё-то чужое признание, старое и тяжёлое. Гильдия заплатит за ленту. Сеть — поможет обнародовать. А можно просто отдать её тому, чей это голос. Лента одна.',
    act: 4,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['pv_drowned_server', 'pv_waiting_on_pier'],
    hint: 'Трофим с лентой → выслушать все три стороны → финальный выбор.',
    objectives: [
      {
        id: 'receive_fourth_voice',
        description: 'Получить от Трофима ленту с четвёртым голосом',
        type: 'npc_talked',
        target: 'fisherman_trofim',
        completed: false,
      },
      {
        id: 'hear_all_sides',
        description: 'Выслушать все три заинтересованные стороны',
        type: 'flag_set',
        target: 'pv_heard_all_sides',
        completed: false,
      },
      {
        id: 'resolve_fourth_voice',
        description: 'Решить судьбу записи',
        type: 'flag_set',
        target: 'pv_fourth_voice_resolved',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addCredits', value: 70 },
      { type: 'addKarma', value: 6 },
      { type: 'addXp', value: 50 },
    ],
    questGiverNpcId: 'fisherman_trofim',
    linkedStoryNodeId: 'pv_fourth_voice_start',
  },
];
