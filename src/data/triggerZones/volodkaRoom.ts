/* ─── Volodka RPG – trigger zones (auto-split module) ─── */

import type { TriggerZone } from './types';

// VOLODKA ROOM
export const zones: TriggerZone[] = [
  /* ─────────────── VOLODKA ROOM ─────────────── */
  {
    id: 'room_desk',
    sceneId: 'volodka_room',
    position: [0, 0.55, -2.35],
    size: [1.85, 1.2, 0.85],
    // enterToast removed — it duplicated examineData.description and the
    // explore_room_table dialogue text. Three layers of "три монитора"
    // showed simultaneously. Now the player gets one clean description on
    // examine (E key) instead of three overlapping toasts.
    linkedDialogueNodeId: 'explore_room_table',
    interactionType: 'examine',
    examineData: {
      title: 'Рабочий стол',
      description: 'Клавиатура со стёртыми клавишами и остывший кофе в кружке «Я ♥ БАГи».',
      detailText: 'На экранах — терминальные сессии, логи ошибок и недописанное стихотворение. Кофе остыл час назад. Стандартная ночь Володьки.',
      icon: '🖥️',
      relatedLoreIds: ['lore_volodka_engineer'],
    },
    effects: [{ type: 'setFlag', flag: 'interacted_desk', flagValue: true }],
    propModelId: 'ai3dgen_encrypted_scroll',
    splashProfile: 'encrypted_scroll',
    propOffset: [0.42, 0.1, 0.12],
  },
  {
    id: 'room_bookshelf',
    sceneId: 'volodka_room',
    position: [-2.2, 1.0, 0],
    size: [0.5, 2.0, 0.6],
    requiredFlag: 'interacted_desk',
    enterToast: 'Книжная полка — стихи рядом с руководствами.',
    linkedDialogueNodeId: 'explore_room_bookshelf',
    interactionType: 'read',
    examineData: {
      title: 'Книжная полка',
      description: 'Стихотворные сборники теснятся рядом с техническими руководствами.',
      detailText: 'Пушкин, Мандельштам, Бродский... и «Руководство по Kubernetes». Книги — единственное, что здесь не глючит.',
      icon: '📚',
    },
    effects: [
      { type: 'setFlag', flag: 'interacted_bookshelf', flagValue: true },
      // Collecting poem_2 here (rather than on wake-up) gives the player
      // agency: they must examine the desk first, then read the poem on
      // the bookshelf to complete the first_reading quest.
      { type: 'collectPoem', poemId: 'poem_2' },
    ],
  },
  /* ── Center monitor poem — visible after desk examined, one-time discovery ──
       The player first examines the desk (room_desk → interacted_desk flag),
       then this smaller trigger appears on the center monitor, offering a
       terminal-boot story beat that reveals poem_2 and completes first_reading. */
  {
    id: 'room_monitor_poem',
    sceneId: 'volodka_room',
    position: [0.15, 0.95, -2.65],
    size: [0.45, 0.4, 0.2],
    enterToast: 'Средний монитор мигает — кто-то оставил запущенный скрипт.',
    interactionType: 'use',
    interactionLabel: 'Активировать монитор',
    linkedStoryNodeId: 'terminal_boot_poem',
    requiredFlag: 'interacted_desk',
    hiddenWhenFlag: 'terminal_poem_read',
    isOneTime: true,
    examineData: {
      title: 'Средний монитор',
      description: 'Экран мерцает. На нём — незаконченный процесс и обрывок текста, похожего на стихотворение.',
      detailText: 'Зелёные символы бегут по экрану. Кто-то запустил скрипт и не дождался результата. Файл называется «fragment_002.sh».',
      icon: '🖥️',
      relatedLoreIds: ['lore_volodka_engineer'],
    },
    effects: [
      { type: 'setFlag', flag: 'terminal_poem_read', flagValue: true },
    ],
  },
  {
    id: 'room_window',
    sceneId: 'volodka_room',
    position: [2.4, 1.5, -2.0],
    size: [1.0, 2.0, 0.5],
    enterToast: 'За окном — серый город и дождь.',
    linkedDialogueNodeId: 'explore_room_window',
    isOneTime: true,
    interactionType: 'examine',
    examineData: {
      title: 'Окно',
      description: 'За мутным стеклом — серый город под вечным дождём.',
      detailText: 'Панельные дома, мигающие неоном вывески, мокрые крыши. Где-то там — люди. Здесь — только терминал и тишина.',
      icon: '🪟',
    },
    effects: [
      { type: 'addSkill', skill: 'intuition', value: 1 },
      { type: 'setFlag', flag: 'looked_out_window', flagValue: true },
    ],
  },
  {
    id: 'room_door',
    sceneId: 'volodka_room',
    position: [0, 0, 3.5],
    size: [1.2, 2.2, 0.5],
    // requiredFlag removed — give the player freedom to explore.
    // The quest tracker guides them back to the desk if they leave early.
    // This is more Disco Elysium-like: player agency over gated progression.
    enterToast: 'Дверь в коридор приоткрыта.',
    linkedStoryNodeId: 'corridor_door',
    interactionType: 'open',
    examineData: {
      title: 'Дверь в коридор',
      description: 'Тяжёлая деревянная дверь, приоткрытая на щель.',
      detailText: 'Из коридора тянет холодом и запахом старого линолеума. За этой дверью — квартира, в которой ты живёшь с Заремой и Альбертом.',
      icon: '🚪',
    },
  },
  {
    id: 'room_wardrobe',
    sceneId: 'volodka_room',
    position: [-2.2, 1.0, 2.5],
    size: [0.8, 2.0, 0.6],
    enterToast: 'Старый платяной шкаф — двери скрипят.',
    interactionType: 'open',
    examineData: {
      title: 'Шкаф',
      description: 'Старый платяной шкаф у стены. Двери скрипят при открывании.',
      detailText: 'Внутри — повседневная одежда, старая куртка и почему-то стопка технических журналов. На верхней полке — пыль и забытый фотоальбом.',
      icon: '🗄️',
    },
    effects: [
      { type: 'setFlag', flag: 'examined_room_wardrobe', flagValue: true },
      { type: 'discoverLore', loreId: 'lore_volodka_childhood' },
    ],
    linkedDialogueNodeId: 'explore_room_wardrobe',
  },
  {
    id: 'room_terminal',
    sceneId: 'volodka_room',
    position: [0.72, 0.5, -2.62],
    size: [0.38, 0.9, 0.32],
    enterToast: 'Терминал — мерцает приглашение командной строки.',
    linkedMinigame: 'codebreaker',
    interactionType: 'hack',
    examineData: {
      title: 'Терминал',
      description: 'Экран мерцает зелёным приглашением: root@volodka:~$_',
      detailText: 'Последняя сессия не закрыта. На экране — обрывки кода и какие-то комментарии, похожие на стихи. Может, стоит покопаться?',
      icon: '💻',
    },
    effects: [
      { type: 'setFlag', flag: 'interacted_terminal', flagValue: true },
    ],
  },

  /* ── Password crack terminal — small secondary terminal near desk (right side).
       Requires interacted_desk flag (desk examined first). Opens DataTerminalOverlay
       instead of a full minigame — atmospheric quick-hack experience. ── */
  {
    id: 'room_password_crack',
    sceneId: 'volodka_room',
    position: [1.1, 0.5, -2.6],
    size: [0.3, 0.8, 0.25],
    enterToast: 'Второй терминал — мигает «PASSWD CRACK REQUIRED».',
    interactionType: 'hack',
    interactionLabel: 'Взломать пароль',
    requiredFlag: 'interacted_desk',
    isOneTime: true,
    examineData: {
      title: 'Терминал паролей',
      description: 'Маленький чёрный экран у правого края стола. Выводит одну строку: ACCESS DENIED — credentials required.',
      detailText: 'Кто-то явно пытался подключиться к серверу Гильдии. Остались обрывки логов и хэши паролей. Если приложить немного ума — может, получится.',
      icon: '🔐',
    },
    effects: [
      { type: 'setFlag', flag: 'room_password_crack_attempted', flagValue: true },
      { type: 'openDataTerminal', terminalDifficulty: 'easy', terminalTitle: 'CRACK PASSWORD', terminalReward: 'Данные Гильдии' },
    ],
  },

  /* ── Sync terminal — visible once morning_sync is active, hidden after completion.
       Previously required `sync_done` flag which is only set BY completing the quest,
       creating a deadlock: terminal never appears → quest never completes → terminal
       never appears. Now we use `morning_sync_active` flag set during quest activation
       (see QuestTracker / morning_sync wiring) and hide after `sync_done`. If the
       active flag is not set, the terminal simply is not visible yet — but once the
       quest activates (via CinematicTimelineRunner after wake-up), it appears.
       Position: moved to LEFT side of desk to avoid overlap with room_terminal
       (codebreaker minigame) which is at [0.72, 0.5, -2.62]. ── */
  {
    id: 'room_sync_terminal',
    sceneId: 'volodka_room',
    position: [-0.6, 0.5, -2.4],
    size: [0.5, 0.9, 0.4],
    enterToast: 'Терминал мигает: «Входящий вызов — IT-Гильдия Синк»',
    interactionType: 'use',
    interactionLabel: 'Подключиться к синку',
    // Hidden until desk is examined — avoids cluttering the first-time desk area
    // with 3+ interaction prompts (terminal, codebreaker, sync) at once.
    requiredFlag: 'interacted_desk',
    hiddenWhenFlag: 'sync_done',
    isOneTime: true,
    linkedStoryNodeId: 'sync_conference',
    examineData: {
      title: 'Синк-терминал',
      description: 'Экран мигает зелёным. Входящий вызок от IT-гильдии.',
      detailText: 'Ежедневная оперативка. Коллеги уже ждут. Нажми E для подключения.',
      icon: '📞',
    },
    effects: [
      { type: 'setFlag', flag: 'sync_terminal_approached', flagValue: true },
      { type: 'setFlag', flag: 'sync_connected', flagValue: true },
    ],
  },
  {
    id: 'room_bed',
    sceneId: 'volodka_room',
    position: [-1.8, 0.4, 1.2],
    size: [1.6, 1.0, 2.2],
    interactionType: 'examine',
    examineData: {
      title: 'Кровать',
      description: 'Неубранная постель. Подушка помята с одной стороны.',
      detailText: 'Одеяло сползло на пол. На тумбочке — стопка эстетических журналов и пустая кружка. Кровать — единственное место, где можно забыть.',
      icon: '🛏️',
    },
    effects: [
      { type: 'setFlag', flag: 'examined_room_bed', flagValue: true },
      { type: 'showThought', thought: 'Последний раз спал... когда? Три часа? Или это был вчера?' },
    ],
  },
  {
    id: 'room_fan',
    sceneId: 'volodka_room',
    position: [0, 2.8, 0],
    size: [1.5, 1.0, 1.5],
    interactionType: 'examine',
    examineData: {
      title: 'Потолочный вентилятор',
      description: 'Старый вентилятор крутится медленно, едва разгоняя спёртый воздух.',
      detailText: 'Лопасти скрипят в такт. Иногда замирает, потом снова начинает крутиться. Как жизнь — крутится-крутится, а толку мало.',
      icon: '🌀',
    },
    effects: [
      { type: 'setFlag', flag: 'examined_room_fan', flagValue: true },
      { type: 'showThought', thought: 'Крутится и крутится... как сервер в бесконечном цикле. Только без перспективы на перезагрузку.', thoughtDuration: 5000 },
    ],
  },
  {
    id: 'room_photo_frame',
    sceneId: 'volodka_room',
    position: [1.8, 1.5, 1.5],
    size: [0.5, 0.7, 0.3],
    interactionType: 'examine',
    examineData: {
      title: 'Фото в рамке',
      description: 'Фотография в простой деревянной рамке.',
      detailText: 'На фото — молодая женщина и мальчик. Они улыбаются. Рама чуть перекошена — видимо, вешали наспех. За их спинами — зелёный двор и ржавая качеля.',
      icon: '🖼️',
      relatedLoreIds: ['lore_volodka_family_photo', 'lore_volodka_childhood'],
    },
    effects: [
      { type: 'setFlag', flag: 'examined_photo_frame', flagValue: true },
      { type: 'discoverLore', loreId: 'lore_volodka_family_photo' },
      { type: 'showThought', thought: '...мама. Она бы сказала: «Володя, перестань смотреть в монитор — живи.» Легко говорить. Ей не надо было чинить Сеть.', thoughtDuration: 6000 },
    ],
  },

];
