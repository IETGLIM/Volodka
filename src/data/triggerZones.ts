/* ─── Volodka RPG – trigger zones for interactive objects ─── */

import type { SceneId, GameEffect, InteractionType, ExamineData } from '@/shared/types/game';
import { CHK_TRIGGER_ZONES } from './chkTolpa/triggerZones';

export interface TriggerZone {
  id: string;
  sceneId: SceneId;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  enterToast?: string;
  linkedStoryNodeId?: string;
  linkedDialogueNodeId?: string;
  linkedQuestId?: string;
  effects?: GameEffect[];
  /** Flag that must be set for this trigger zone to be active */
  requiredFlag?: string;
  /** Context-sensitive interaction label (replaces generic [E]) */
  interactionLabel?: string;
  /** Context-sensitive interaction type — determines the [E] prompt verb */
  interactionType?: InteractionType;
  /** Data for the examination panel (shown when interactionType is 'examine') */
  examineData?: ExamineData;
  /** Linked mini-game type (replaces hardcoded ID checks in useInteractionOrchestrator) */
  linkedMinigame?: 'codebreaker' | 'openstack_terminal' | 'bash_terminal';
  /** Optional GLB prop id from propModelRegistry — rendered at zone position */
  propModelId?: string;
  /** Per-zone prop placement: offset from zone position (metres) */
  propOffset?: [number, number, number];
  /** Per-zone prop Y rotation (radians) — e.g. doors standing in X-walls */
  propRotationY?: number;
  /** Whether this trigger can only be used once per playthrough */
  isOneTime?: boolean;
  /** NPC explicitly linked to this zone (staged talk routing — no substring heuristics). */
  linkedNpcId?: string;
  /** Minimum act required for this trigger zone to be active (1 or 2) */
  requiredAct?: number;
  /** Automatically trigger effects on zone enter (for combat encounters, traps, etc.) */
  autoTrigger?: boolean;
}

/** Russian labels for each interaction type — used in [E] prompts */
export const INTERACTION_LABELS: Record<InteractionType, string> = {
  examine: 'Осмотреть',
  read: 'Прочитать',
  take: 'Взять',
  hack: 'Взломать',
  open: 'Открыть',
  talk: 'Поговорить',
  use: 'Использовать',
  push: 'Толкнуть',
  default: 'Взаимодействовать',
};

export function findTriggerZoneByNpcId(
  zones: readonly TriggerZone[],
  npcId: string,
): TriggerZone | undefined {
  return zones.find((z) => z.linkedNpcId === npcId);
}

export function findTriggerZoneByDialogueNodeId(
  zones: readonly TriggerZone[],
  dialogueNodeId: string,
): TriggerZone | undefined {
  return zones.find((z) => z.linkedDialogueNodeId === dialogueNodeId);
}

export const TRIGGER_ZONES: TriggerZone[] = [
  /* ─────────────── VOLODKA ROOM ─────────────── */
  {
    id: 'room_desk',
    sceneId: 'volodka_room',
    position: [0, 0.55, -2.35],
    size: [1.85, 1.2, 0.85],
    enterToast: 'Рабочий стол — три монитора и остывший кофе.',
    linkedDialogueNodeId: 'explore_room_table',
    interactionType: 'examine',
    examineData: {
      title: 'Рабочий стол',
      description: 'Три монитора, клавиатура со стёртыми клавишами и остывший кофе в кружке «Я ♥ БАГи».',
      detailText: 'На экранах — терминальные сессии, логи ошибок и недописанное стихотворение. Кофе остыл час назад. Стандартная ночь Володьки.',
      icon: '🖥️',
    },
    effects: [{ type: 'setFlag', flag: 'interacted_desk', flagValue: true }],
  },
  {
    id: 'room_bookshelf',
    sceneId: 'volodka_room',
    position: [-2.2, 1.0, 0],
    size: [0.5, 2.0, 0.6],
    enterToast: 'Книжная полка — стихи рядом с руководствами.',
    linkedDialogueNodeId: 'explore_room_bookshelf',
    interactionType: 'read',
    examineData: {
      title: 'Книжная полка',
      description: 'Стихотворные сборники теснятся рядом с техническими руководствами.',
      detailText: 'Пушкин, Мандельштам, Бродский... и «Руководство по Kubernetes». Книги — единственное, что здесь не глючит.',
      icon: '📚',
    },
    effects: [{ type: 'setFlag', flag: 'interacted_bookshelf', flagValue: true }],
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
    ],
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

  /* ─────────────── CORRIDOR ─────────────── */
  {
    id: 'corridor_kitchen_door',
    sceneId: 'volodka_corridor',
    position: [2.7, 0, -2.0],
    size: [1.2, 2.2, 0.5],
    enterToast: 'Из кухни пахнет чаем.',
    linkedStoryNodeId: 'kitchen_table',
    interactionType: 'open',
    examineData: {
      title: 'Дверь на кухню',
      description: 'Из-за двери доносится аромат чая и домашней еды.',
      detailText: 'Зарема, наверное, снова готовит. Тепло и свет пробиваются из щели под дверью.',
      icon: '🚪',
    },
  },
  {
    id: 'corridor_street_door',
    sceneId: 'volodka_corridor',
    position: [-2.7, 0, -2.0],
    size: [1.2, 2.2, 0.5],
    enterToast: 'Дверь на лестничную клетку — оттуда тянет холодом.',
    linkedStoryNodeId: 'street_bench',
    interactionType: 'open',
    examineData: {
      title: 'Входная дверь',
      description: 'Металлическая дверь на лестничную клетку.',
      detailText: 'Оттуда тянет холодом и пахнет сыростью. За этой дверью — подъезд, улица, весь этот серый город.',
      icon: '🚪',
    },
  },
  {
    id: 'corridor_room_door',
    sceneId: 'volodka_corridor',
    position: [0, 0, 7.3],
    size: [1.2, 2.2, 0.5],
    enterToast: 'Твоя комната.',
    linkedStoryNodeId: 'go_home',
    interactionType: 'open',
    examineData: {
      title: 'Дверь в комнату',
      description: 'Твоя комната. Здесь всё как всегда.',
      detailText: 'За этой дверью — твоя крепость. Мониторы, код, тишина. И остывший кофе на столе.',
      icon: '🚪',
    },
  },
  {
    id: 'corridor_mailboxes',
    sceneId: 'volodka_corridor',
    position: [2.6, 1.0, 6.0],
    size: [0.9, 1.4, 0.4],
    enterToast: 'Почтовые ящики — четыре квартиры, четыре судьбы.',
    interactionType: 'examine',
    examineData: {
      title: 'Почтовые ящики',
      description: 'Ржавые ящики с потёртыми табличками. Твой — третий сверху.',
      detailText: 'Внутри — счета, реклама и одно письмо без обратного адреса. Ты ещё не решился его открыть.',
      icon: '📬',
    },
    effects: [{ type: 'setFlag', flag: 'examined_corridor_mailboxes', flagValue: true }],
  },
  {
    id: 'corridor_intercom',
    sceneId: 'volodka_corridor',
    position: [-2.85, 1.5, 6.0],
    size: [0.4, 0.5, 0.3],
    enterToast: 'Домофон — красная кнопка мигает.',
    interactionType: 'examine',
    examineData: {
      title: 'Домофон',
      description: 'Старый домофон с потрескавшимся динамиком и камерой, которая, кажется, давно не работает.',
      detailText: 'Кто-то звонил вчера ночью. Ты не открыл. Сейчас в динамике только тихое электрическое жужжание.',
      icon: '🔔',
    },
    effects: [{ type: 'setFlag', flag: 'examined_corridor_intercom', flagValue: true }],
  },
  {
    id: 'corridor_mirror',
    sceneId: 'volodka_corridor',
    position: [2.85, 1.4, -5.5],
    size: [0.5, 0.7, 0.3],
    enterToast: 'Зеркало в потёртой раме.',
    interactionType: 'examine',
    examineData: {
      title: 'Зеркало',
      description: 'Узкое зеркало в деревянной раме. Отражение чуть запаздывает.',
      detailText: 'Ты смотришь на себя — усталые глаза, худи, вечная тень под глазами. Зеркало знает все твои ночи.',
      icon: '🪞',
    },
    effects: [{ type: 'setFlag', flag: 'examined_corridor_mirror', flagValue: true }],
  },
  {
    id: 'corridor_graffiti',
    sceneId: 'volodka_corridor',
    position: [-2.85, 1.4, 0.5],
    size: [1.3, 0.8, 0.3],
    enterToast: 'На стене — кто-то оставил след.',
    interactionType: 'read',
    examineData: {
      title: 'Граффити на стене',
      description: 'Красные и синие теги на облупившейся штукатурке.',
      detailText: '«ВОЛОДЬКА ЖИВЁТ ЗДЕСЬ» — написано не твоим почерком. Кто-то из соседей? Или ты сам в другой жизни?',
      icon: '🎨',
    },
    effects: [{ type: 'setFlag', flag: 'read_corridor_graffiti', flagValue: true }],
  },
  {
    id: 'corridor_solnysh_door',
    sceneId: 'volodka_corridor',
    position: [2.7, 0, 4.0],
    size: [1.2, 2.2, 0.5],
    enterToast: 'Из комнаты Солныш и Лёни тянет кофе и краской.',
    linkedStoryNodeId: 'solnysh_door',
    interactionType: 'open',
    examineData: {
      title: 'Комната Солныш и Лёни',
      description: 'За дверью — ковры, мольберт и запах обжаренного кофe.',
      detailText: 'Ты знаешь эту комнату с детства — столько раз заходил сюда после школы. Солныш и Лёня.',
      icon: '🚪',
    },
  },
  {
    id: 'corridor_solnysh',
    sceneId: 'volodka_corridor',
    position: [0, 0, 1.5],
    size: [1.4, 2.0, 1.4],
    enterToast: 'Солныш поправляет платок у зеркала. Умка крутится у ног.',
    linkedNpcId: 'vera',
    linkedDialogueNodeId: 'solnysh_corridor_greeting',
    interactionType: 'talk',
    examineData: {
      title: 'Солныш (Алина)',
      description: 'Блондинка с голубыми глазами — лучшая подруга с детства.',
      detailText: 'Алина — её настоящее имя; Солныш — прозвище с гимназии. Одноклассница, дочь учительницы. Дизайнер и художник. Рядом — Умка.',
      icon: '☀️',
    },
  },

  /* ─────────────── SOLNYSH ROOM ─────────────── */
  {
    id: 'solnysh_wine_closet',
    sceneId: 'solnysh_room',
    position: [-2.6, 0.5, 1.6],
    size: [0.8, 1.4, 0.5],
    enterToast: 'За шкафом — что-то стеклянное.',
    interactionType: 'take',
    isOneTime: true,
    examineData: {
      title: 'Шкаф у стены',
      description: 'Старый платяной шкаф. Лёня говорил про нижнюю полку…',
      detailText: 'Тёмная бутылка вина с потёртой этикеткой — «на особый случай».',
      icon: '🍷',
    },
    effects: [
      { type: 'addItem', itemId: 'solnysh_wine_bottle', value: 1 },
      { type: 'setFlag', flag: 'has_solnysh_wine', flagValue: true },
      { type: 'triggerQuest', questId: 'solnysh_roof_wine' },
    ],
  },
  {
    id: 'solnysh_vera_talk',
    sceneId: 'solnysh_room',
    position: [1.0, 0, -1.0],
    size: [1.4, 2.0, 1.4],
    linkedNpcId: 'vera',
    linkedStoryNodeId: 'solnysh_room_talk',
    interactionType: 'talk',
    enterToast: 'Солныш работает над макетом.',
  },
  {
    id: 'solnysh_lyonya_talk',
    sceneId: 'solnysh_room',
    position: [-2.0, 0, -1.5],
    size: [1.4, 2.0, 1.4],
    linkedNpcId: 'lyonya',
    linkedDialogueNodeId: 'lyonya_greeting',
    interactionType: 'talk',
    enterToast: 'Лёня возится с кофейной жаровней.',
  },
  {
    id: 'solnysh_to_corridor',
    sceneId: 'solnysh_room',
    position: [0, 0, 3.5],
    size: [1.2, 2.2, 0.5],
    linkedStoryNodeId: 'corridor_explore_mode',
    interactionType: 'open',
    enterToast: 'Дверь в коридор.',
  },

  /* ─────────────── HOME EVENING / KITCHEN ─────────────── */
  {
    id: 'kitchen_table',
    sceneId: 'home_evening',
    position: [0, 0.4, 0],
    size: [2.0, 1.0, 1.5],
    enterToast: 'На столе — хлеб, варенье и горячий чай.',
    linkedDialogueNodeId: 'zarema_greeting',
    linkedNpcId: 'zarema',
    linkedQuestId: 'first_reading',
    interactionType: 'talk',
    examineData: {
      title: 'Кухонный стол',
      description: 'На столе — хлеб, варенье и горячий чай. Зарема хлопочет у плиты.',
      detailText: 'Простая еда, но с любовью. Запах домашнего чая смешивается с электрическим гулом холодильника.',
      icon: '🍽️',
    },
  },
  {
    id: 'kitchen_window',
    sceneId: 'home_evening',
    position: [3.0, 1.0, -2.5],
    size: [1.5, 2.0, 0.5],
    enterToast: 'За окном — панельные дома и неон.',
    linkedDialogueNodeId: 'explore_kitchen_window',
    isOneTime: true,
    interactionType: 'examine',
    examineData: {
      title: 'Окно на кухне',
      description: 'За мутным стеклом — панельные дома и мигающий неон.',
      detailText: 'Ночной город мерцает за окном. Где-то там, за рядами одинаковых окон, живут другие люди. Или не живут.',
      icon: '🪟',
    },
    effects: [
      { type: 'addSkill', skill: 'intuition', value: 1 },
      { type: 'setFlag', flag: 'looked_out_kitchen_window', flagValue: true },
    ],
  },
  {
    id: 'kitchen_radio',
    sceneId: 'home_evening',
    position: [-2.0, 0.8, -1.5],
    size: [0.5, 0.5, 0.5],
    enterToast: 'Старый радиоприёмник шипит статикой.',
    linkedDialogueNodeId: 'explore_volodka_inner',
    interactionType: 'use',
    examineData: {
      title: 'Радиоприёмник',
      description: 'Старый радиоприёмник с треснувшим корпусом.',
      detailText: 'Между станциями — статика, обрывки голосов, иногда — музыка. Может, это не радио, а что-то другое говорит с тобой из белого шума.',
      icon: '📻',
    },
    effects: [
      { type: 'addStat', stat: 'stress', value: 3 },
      { type: 'addSkill', skill: 'intuition', value: 1 },
    ],
  },
  {
    id: 'kitchen_wardrobe',
    sceneId: 'home_evening',
    position: [-6.5, 1.0, 0],
    size: [1.0, 2.0, 0.6],
    enterToast: 'Старый шкаф у стены — двери не закрываются до конца.',
    interactionType: 'open',
    examineData: {
      title: 'Шкаф',
      description: 'Старый платяной шкаф. Двери не закрываются до конца.',
      detailText: 'Внутри — зимние куртки, старые фотографии и запах нафталина. На верхней полке что-то шуршит, но тебе не хочется лезть туда.',
      icon: '🗄️',
    },
    effects: [
      { type: 'setFlag', flag: 'examined_wardrobe', flagValue: true },
    ],
  },
  {
    id: 'kitchen_fridge',
    sceneId: 'home_evening',
    position: [6.5, 0.9, -5.0],
    size: [0.7, 1.8, 0.7],
    enterToast: 'Холодильник гудит. На нём — фотографии магнитами.',
    interactionType: 'open',
    examineData: {
      title: 'Холодильник',
      description: 'Белый холодильник, увешанный магнитами и фотографиями.',
      detailText: 'На дверце — фотографии happier times. Зарема с Альбертом на море. Ты на выпускном. Магнит из города, которого больше нет на картах.',
      icon: '🧲',
    },
    effects: [
      { type: 'addStat', stat: 'stress', value: -2 },
      { type: 'setFlag', flag: 'examined_fridge', flagValue: true },
    ],
  },

  /* ─────────────── CAFE ─────────────── */
  {
    id: 'cafe_counter',
    sceneId: 'cafe_evening',
    position: [0, 0.5, -4.0],
    size: [4.0, 1.5, 1.0],
    enterToast: 'Стойка бара — бариста протирает чашку.',
    linkedDialogueNodeId: 'cafe_barista_dialogue',
    linkedNpcId: 'cafe_barista',
    interactionType: 'talk',
  },
  {
    id: 'cafe_albert_corner',
    sceneId: 'cafe_evening',
    position: [-3.0, 0, -2.5],
    size: [2.0, 2.0, 2.0],
    enterToast: 'В углу сидит Альберт — философ с кружкой.',
    linkedDialogueNodeId: 'albert_greeting',
    linkedNpcId: 'albert',
    interactionType: 'talk',
    effects: [
      { type: 'setFlag', flag: 'met_albert', flagValue: true },
      { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
    ],
  },
  {
    id: 'cafe_table_free',
    sceneId: 'cafe_evening',
    position: [2.5, 0, 0],
    size: [1.5, 1.0, 1.5],
    enterToast: 'Свободный столик у стены.',
    linkedDialogueNodeId: 'explore_cafe_enter',
    examineData: {
      title: 'Свободный столик',
      description: 'Пустой столик у стены. На столе — следы от кружки и меню.',
      detailText: 'Тихий уголок. Отсюда видно весь зал, но тебя не замечают. Идеальное место для наблюдений.',
      icon: '☕',
    },
    effects: [{ type: 'addStat', stat: 'energy', value: 5 }],
  },
  {
    id: 'cafe_exit',
    sceneId: 'cafe_evening',
    position: [0, 0, 4.5],
    size: [1.5, 2.2, 0.5],
    enterToast: 'Выход из кафе — обратно на улицу.',
    linkedDialogueNodeId: 'explore_cafe_exit',
    interactionType: 'open',
    examineData: {
      title: 'Выход из кафе',
      description: 'Дверь на улицу. За ней — дождь и городской шум.',
      detailText: 'Неоновая вывеска «Синяя яма» мигает над дверью. Холодный воздух пробивается сквозь щели.',
      icon: '🚪',
    },
  },

  /* ─────────────── STREET NIGHT ─────────────── */
  {
    id: 'street_bench_zone',
    sceneId: 'street_night',
    position: [0, 0, 0],
    size: [2.0, 1.0, 1.5],
    enterToast: 'Скамейка — влажная от дождя, но сидеть можно.',
    linkedDialogueNodeId: 'explore_street_bench_view',
    interactionType: 'examine',
    examineData: {
      title: 'Скамейка',
      description: 'Мокрая скамейка под уличным фонарём.',
      detailText: 'Дождевые капли на крашеном дереве. Кто-то вырезал «В+З» на спинке. Здесь хорошо думается.',
      icon: '🪑',
    },
  },
  {
    id: 'street_cafe_entrance',
    sceneId: 'street_night',
    position: [4.0, 0, -2.0],
    size: [1.5, 2.5, 1.0],
    enterToast: 'Вывеска «Синяя яма» мигает неоном.',
    linkedDialogueNodeId: 'explore_cafe_enter',
    interactionType: 'open',
    examineData: {
      title: 'Вход в кафе',
      description: 'Неоновая вывеска «Синяя яма» мигает над дверью.',
      detailText: 'Тёплый свет и запах кофе пробиваются сквозь приоткрытую дверь. Здесь можно согреться.',
      icon: '🏪',
    },
  },
  {
    id: 'street_alley_shadow',
    sceneId: 'street_night',
    position: [-4.0, 0, -1.5],
    size: [2.0, 2.0, 2.0],
    enterToast: 'В переулке кто-то сидит в тени.',
    linkedDialogueNodeId: 'maria_dialogue',
    linkedNpcId: 'maria',
    linkedQuestId: 'maria_connection',
    interactionType: 'talk',
    effects: [
      { type: 'setFlag', flag: 'spotted_maria', flagValue: true },
      { type: 'addKarma', value: 2 },
    ],
  },
  {
    id: 'street_home_entrance',
    sceneId: 'street_night',
    position: [-2.0, 0, 4.0],
    size: [1.5, 2.5, 1.0],
    enterToast: 'Подъезд — можно вернуться домой.',
    linkedDialogueNodeId: 'explore_go_home',
    interactionType: 'open',
    examineData: {
      title: 'Подъезд',
      description: 'Знакомый подъезд. Дом.',
      detailText: 'Домой. К тёплому свету, к остывшему ужину, к Зареме. Или сначала — ещё один круг по городу?',
      icon: '🏠',
    },
    effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
  },

  /* ─────────────── OFFICE DAY ─────────────── */
  {
    id: 'office_alexander_desk',
    sceneId: 'office_day',
    position: [3.0, 0, -2.0],
    size: [2.0, 1.5, 1.5],
    enterToast: 'Александр ждёт у своего стола.',
    linkedDialogueNodeId: 'office_alexander_dialogue',
    linkedNpcId: 'office_alexander',
    linkedQuestId: 'incident_scroll_4729',
    interactionType: 'talk',
  },
  {
    id: 'office_colleague_desk',
    sceneId: 'office_day',
    position: [1.0, 0, 0.5],
    size: [1.5, 1.5, 1.5],
    enterToast: 'Коллега нервно перебирает провода.',
    linkedDialogueNodeId: 'office_colleague_dialogue',
    linkedNpcId: 'office_colleague',
    interactionType: 'talk',
  },
  {
    id: 'office_terminal',
    sceneId: 'office_day',
    position: [-1.5, 0.5, -3.0],
    size: [1.0, 1.5, 1.0],
    enterToast: 'Терминал с логами инцидента #4729.',
    linkedDialogueNodeId: 'explore_start_diagnosis',
    linkedQuestId: 'vault_backup_trial',
    interactionType: 'hack',
    examineData: {
      title: 'Терминал инцидента',
      description: 'Экран терминала показывает логи инцидента #4729.',
      detailText: 'ERROR: СТИХ_НЕ_НАЙДЕН... Данные повреждены. Кто-то — или что-то — стёр строку за строкой. Код ошибки ведёт в серверную.',
      icon: '💻',
    },
    effects: [
      { type: 'setFlag', flag: 'accessed_terminal', flagValue: true },
      // Ensure first_reading quest can complete even if the VN overlay
      // was already visited (alreadyVisited skips re-showing the VN).
      // These effects are applied every time the terminal is interacted with,
      // and are idempotent — collectPoem/setFlag are no-ops if already done.
      { type: 'collectPoem', poemId: 'poem_1' },
      { type: 'setFlag', flag: 'read_poem_1', flagValue: true },
      { type: 'setFlag', flag: 'found_first_poem', flagValue: true },
    ],
  },
  {
    id: 'office_dmitry_area',
    sceneId: 'office_day',
    position: [-2.0, 0, 1.5],
    size: [2.0, 1.5, 1.5],
    enterToast: 'Дмитрий — старший разработчик — что-то ищет в архивах.',
    linkedDialogueNodeId: 'dmitry_greeting',
    linkedNpcId: 'office_dmitry',
    interactionType: 'talk',
    effects: [
      { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 2 } },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     NEW TRIGGER ZONES — Quest & Interaction Overhaul (Task 8-d)
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────────── OFFICE SERVER ROOM — Цифровой Призрак ─────────────── */
  {
    id: 'office_server_room',
    sceneId: 'office_day',
    position: [-4.0, 0.5, -4.5],
    size: [1.5, 2.0, 1.5],
    enterToast: 'Серверная — за стойками мерцает зелёный свет. Следы удалённого ИИ?',
    linkedQuestId: 'digital_ghost',
    interactionType: 'examine',
    interactionLabel: 'Осмотреть серверную',
    examineData: {
      title: 'Серверная',
      description: 'Рёв серверных стоек и зелёный мерцающий свет.',
      detailText: 'Между стойками — следы чьего-то присутствия. Не человеческого. Кто-то — или что-то — удалило данные и оставило после себя только мерцание.',
      icon: '🖧',
    },
    effects: [
      { type: 'setFlag', flag: 'found_server_room', flagValue: true },
    ],
  },

  /* ─────────────── OFFICE TERMINALS — Сломанный Терминал ─────────────── */
  {
    id: 'office_terminal_1',
    sceneId: 'office_day',
    position: [1.5, 0.5, -3.5],
    size: [0.8, 1.2, 0.6],
    enterToast: 'Терминал #1 — экран мерцает. Ошибка: «СТИХ_НЕ_НАЙДЕН».',
    linkedQuestId: 'broken_terminal',
    interactionType: 'hack',
    interactionLabel: 'Починить терминал',
    examineData: {
      title: 'Терминал #1',
      description: 'Экран мерцает красным. Критическая ошибка: «СТИХ_НЕ_НАЙДЕН».',
      detailText: 'Системные логи повреждены. Кто-то стёр целые блоки данных, оставив только обрывки стихотворных строк в error-логах.',
      icon: '🖥️',
    },
    effects: [
      { type: 'setFlag', flag: 'terminal_1_examined', flagValue: true },
    ],
  },
  {
    id: 'office_terminal_2',
    sceneId: 'office_day',
    position: [-0.5, 0.5, -1.0],
    size: [0.8, 1.2, 0.6],
    enterToast: 'Терминал #2 — на экране обрывки стихотворных строк.',
    linkedQuestId: 'broken_terminal',
    interactionType: 'hack',
    interactionLabel: 'Починить терминал',
    examineData: {
      title: 'Терминал #2',
      description: 'На экране — обрывки стихотворных строк среди системного кода.',
      detailText: '«...и слово стало кодом, и код стал плотью...» — это не стандартное сообщение об ошибке. Кто-то вшил стихи в логи.',
      icon: '🖥️',
    },
    effects: [
      { type: 'setFlag', flag: 'terminal_2_examined', flagValue: true },
    ],
  },
  {
    id: 'office_terminal_3',
    sceneId: 'office_day',
    position: [3.5, 0.5, 0.5],
    size: [0.8, 1.2, 0.6],
    enterToast: 'Терминал #3 — системный журнал содержит фрагмент скрытого стиха.',
    linkedQuestId: 'broken_terminal',
    interactionType: 'hack',
    interactionLabel: 'Починить терминал',
    examineData: {
      title: 'Терминал #3',
      description: 'Системный журнал терминала содержит фрагмент скрытого стихотворения.',
      detailText: 'В глубине логов — спрятанная строка: «...и каждый удалённый байт кричит из пустоты...» Это не баг. Это послание.',
      icon: '🖥️',
    },
    effects: [
      { type: 'setFlag', flag: 'terminal_3_examined', flagValue: true },
    ],
  },

  /* ─────────────── FACTORY RECORDINGS — Голос Прошлого ─────────────── */
  {
    id: 'factory_recordings',
    sceneId: 'abandoned_factory',
    position: [-2.0, 1.0, -3.0],
    size: [1.0, 1.0, 1.0],
    enterToast: 'На полке — старый аудио-модуль. На нём надпись: «В.Л. — последняя запись».',
    linkedQuestId: 'voice_of_the_past',
    interactionType: 'use',
    interactionLabel: 'Прослушать запись',
    examineData: {
      title: 'Аудио-модуль',
      description: 'Старый аудио-модуль с надписью: «В.Л. — последняя запись».',
      detailText: 'Пыльный модуль, покрытый ржавчиной. Кто такой В.Л.? Голос на записи может раскрыть тайну этого места.',
      icon: '🎙️',
    },
    effects: [
      { type: 'setFlag', flag: 'found_vladimir_recordings', flagValue: true },
    ],
  },

  {
    id: 'factory_ghost_lights',
    sceneId: 'abandoned_factory',
    position: [5.0, 1.0, -6.0],
    size: [1.2, 2.0, 1.2],
    enterToast: 'В глубине цеха мигают огни — в ритме, похожем на стихотворение.',
    requiredAct: 2,
    isOneTime: true,
    interactionType: 'examine',
    interactionLabel: 'Всмотреться в мигание',
    examineData: {
      title: 'Огни в ритме',
      description: 'Короткие замыкания — так говорят охранники. Инженеры гильдии — остаточные сигналы.',
      detailText: 'Но если стоять достаточно долго, огни складываются в слова. Те самые. Станки молчат, трубы капают — а свет на стене читает стих, которого не должно быть в архивах.',
      icon: '✨',
    },
    effects: [
      { type: 'discoverLore', loreId: 'lore_factory_ghosts' },
      { type: 'setFlag', flag: 'factory_ghosts_seen', flagValue: true },
      { type: 'addSkill', skill: 'intuition', value: 2 },
    ],
  },

  /* ─────────────── ROOFTOP ALEXANDER — Крыша Мира ─────────────── */
  {
    id: 'rooftop_alexander',
    sceneId: 'rooftop_edge',
    position: [0, 0, -4.0],
    size: [2.0, 2.0, 1.0],
    enterToast: 'Александр стоит на самом краю крыши. Ветер треплет его пальто.',
    linkedQuestId: 'roof_of_the_world',
    linkedNpcId: 'office_alexander',
    requiredFlag: 'rooftop_unlocked',
    requiredAct: 2,
    interactionType: 'talk',
    interactionLabel: 'Подойти к Александру',
    effects: [
      { type: 'setFlag', flag: 'confronted_alexander_roof', flagValue: true },
    ],
  },

  /* ─────────────── CAFE POETRY READING — Стих под Прикрытием ─────────────── */
  {
    id: 'cafe_poetry_reading',
    sceneId: 'cafe_evening',
    position: [3.5, 0, -2.5],
    size: [2.0, 2.0, 2.0],
    enterToast: 'Задний столик — чтение стихов. Но почему у всех одинаковые значки на куртках?',
    linkedQuestId: 'poem_undercover',
    requiredAct: 2,
    interactionType: 'use',
    interactionLabel: 'Присесть за столик',
    examineData: {
      title: 'Чтение стихов',
      description: 'Задний столик — читают стихи. Странная компания.',
      detailText: 'Они слушают стихи, но их глаза холодны. Одинаковые значки на куртках. Это не литературный клуб — это что-то другое.',
      icon: '📖',
    },
    effects: [
      { type: 'setFlag', flag: 'spotted_network_reading', flagValue: true },
    ],
  },

  /* ─────────────── STREET WINTER MUGGER — Ночной Дозор ─────────────── */
  {
    id: 'street_winter_mugger',
    sceneId: 'street_winter',
    position: [-3.5, 0, -2.0],
    size: [1.5, 2.0, 1.5],
    enterToast: 'Тёмный переулок — кто-то прячется в тени.',
    linkedQuestId: 'night_watch',
    requiredAct: 2,
    interactionType: 'examine',
    interactionLabel: 'Осмотреть переулок',
    examineData: {
      title: 'Тёмный переулок',
      description: 'В тени между домами кто-то прячется.',
      detailText: 'Шорох, блик ножа, тяжёлое дыхание. Ты не один в этом переулке. Может, стоит уйти, пока не поздно?',
      icon: '🔪',
    },
    effects: [
      { type: 'setFlag', flag: 'spotted_mugger_alley', flagValue: true },
    ],
  },

  /* ─────────────── PARK MEMORIAL ─────────────── */
  {
    id: 'park_memorial',
    sceneId: 'park_day',
    position: [0, 0, -3.0],
    size: [1.5, 2.0, 1.5],
    enterToast: 'Обелиск памяти — имена тех, кого стёрли после Краха. Ты знал некоторых.',
    interactionType: 'read',
    interactionLabel: 'Прочитать имена',
    examineData: {
      title: 'Обелиск памяти',
      description: 'Имена тех, кого стёрли после Краха. Ты знал некоторых.',
      detailText: 'Высеченные в камне имена — всё, что осталось от людей. Некоторые строки затёрты специально. Кто-то не хочет, чтобы их помнили.',
      icon: '🪦',
    },
    effects: [
      { type: 'addKarma', value: 5 },
      { type: 'setFlag', flag: 'visited_memorial', flagValue: true },
      { type: 'setFlag', flag: 'thread_lore_crash', flagValue: true },
      { type: 'triggerQuest', questId: 'thread_of_18_lines' },
    ],
  },

  /* ─────────────── LIBRARY HIDDEN POEM ─────────────── */
  {
    id: 'library_hidden_poem',
    sceneId: 'library_day',
    position: [-3.0, 1.0, -2.0],
    size: [0.8, 2.0, 2.0],
    enterToast: 'За книжной полкой — спрятанный листок с текстом. Это стихотворение.',
    isOneTime: true,
    interactionType: 'take',
    interactionLabel: 'Достать стихотворение',
    examineData: {
      title: 'Спрятанное стихотворение',
      description: 'За книжной полкой — листок с рукописным текстом. Стихи.',
      detailText: 'Аккуратный почерк, знакомые обороты... Это стихотворение не из книг. Кто-то написал его вручную и спрятал здесь. Может, для тебя.',
      icon: '📜',
    },
    effects: [
      { type: 'collectPoem', poemId: 'poem_14' },
      { type: 'setFlag', flag: 'found_library_poem', flagValue: true },
    ],
  },

  /* ─────────────── HOME KITCHEN LETTER ─────────────── */
  {
    id: 'home_kitchen_letter',
    sceneId: 'home_evening',
    position: [1.5, 0.5, -1.5],
    size: [0.5, 0.5, 0.5],
    enterToast: 'На стойке — конверт с почерком Заремы. «Володька, прочти, когда будешь готов.»',
    interactionType: 'read',
    interactionLabel: 'Прочитать письмо',
    examineData: {
      title: 'Письмо от Заремы',
      description: 'Конверт с почерком Заремы: «Володька, прочти, когда будешь готов.»',
      detailText: 'Знакомый почерк, немного дрожащий. Зарема никогда не пишет писем, если можно сказать в лицо. Это что-то важное.',
      icon: '✉️',
    },
    effects: [
      // Fix: the letter is from Zarema — flag was misnamed read_maria_letter
      { type: 'setFlag', flag: 'read_zarema_letter', flagValue: true },
      { type: 'addKarma', value: 3 },
    ],
  },

  /* ─────────────── ZAREMA BANK ACCOUNT — Банковский Перевод ─────────────── */
  {
    id: 'zarema_bank_account',
    sceneId: 'zarema_albert_room',
    position: [0, 0.5, -2.0],
    size: [1.0, 1.0, 0.8],
    enterToast: 'Ноутбук Заремы — на экране банковское приложение. Сумма подозрительно велика.',
    linkedQuestId: 'bank_transfer',
    requiredAct: 2,
    interactionType: 'hack',
    interactionLabel: 'Проверить счёт',
    examineData: {
      title: 'Ноутбук Заремы',
      description: 'На экране банковское приложение. Сумма подозрительно велика.',
      detailText: 'Транзакции, которые не сходятся. Деньги приходят и уходят странными маршрутами. Это не просто переводы — это отмывание.',
      icon: '💰',
    },
    effects: [
      { type: 'setFlag', flag: 'found_zarema_bank', flagValue: true },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     NEW TRIGGER ZONES — OpenStack & Bash Terminal Mini-games
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────────── OFFICE OPENSTACK TERMINAL ─────────────── */
  {
    id: 'office_openstack_terminal',
    sceneId: 'office_day',
    position: [-3.5, 0.5, -1.0],
    size: [0.8, 1.2, 0.6],
    enterToast: 'Терминал OpenStack — серверы в критическом состоянии!',
    linkedQuestId: 'openstack_crisis',
    linkedMinigame: 'openstack_terminal',
    interactionType: 'hack',
    interactionLabel: 'Открыть OpenStack',
    examineData: {
      title: 'Терминал OpenStack',
      description: 'Критическое состояние серверов. Нужна диагностика!',
      detailText: 'Красные алерты по всему дашборду. Серверы падают каскадом. Если не вмешаться — потеряем всё.',
      icon: '🔥',
    },
    effects: [
      { type: 'setFlag', flag: 'openstack_terminal_accessed', flagValue: true },
    ],
  },

  /* ─────────────── OFFICE BASH TERMINAL — BANKING CRASH ─────────────── */
  {
    id: 'office_bash_terminal',
    sceneId: 'office_day',
    position: [2.5, 0.5, -1.0],
    size: [0.8, 1.2, 0.6],
    enterToast: 'Терминал банковской системы — КРИТИЧЕСКИЙ СБОЙ!',
    linkedQuestId: 'banking_crash',
    linkedMinigame: 'bash_terminal',
    interactionType: 'hack',
    interactionLabel: 'Диагностика Bash',
    examineData: {
      title: 'Банковский терминал',
      description: 'КРИТИЧЕСКИЙ СБОЙ банковской системы!',
      detailText: 'Транзакции зависли. База данных не отвечает. Каждая секунда простоя — миллионы убытка. Нужен bash-доступ.',
      icon: '⚠️',
    },
    effects: [
      { type: 'setFlag', flag: 'bash_terminal_accessed', flagValue: true },
    ],
  },

  /* ─────────────── CAFE BACKROOM TERMINAL — OpenStack ─────────────── */
  {
    id: 'cafe_backroom_terminal',
    sceneId: 'cafe_evening',
    position: [-4.0, 0.5, -4.0],
    size: [0.8, 1.2, 0.6],
    enterToast: 'Задняя комната — старый терминал с доступом к OpenStack.',
    requiredFlag: 'safehouse_terminal_installed',
    linkedMinigame: 'openstack_terminal',
    interactionType: 'hack',
    interactionLabel: 'Подключиться к OpenStack',
    examineData: {
      title: 'Терминал в подсобке',
      description: 'Старый терминал с доступом к OpenStack из безопасного места.',
      detailText: 'Кто-то настроил этот терминал для удалённого доступа. Экран мерцает приглашением. Здесь можно работать незаметно.',
      icon: '🖧',
    },
    effects: [
      { type: 'setFlag', flag: 'cafe_openstack_accessed', flagValue: true },
    ],
  },

  /* ─────────────── HOME LAPTOP — Banking Crash Investigation ─────────────── */
  {
    id: 'home_banking_laptop',
    sceneId: 'home_evening',
    position: [-1.0, 0.5, -2.0],
    size: [0.8, 0.8, 0.6],
    enterToast: 'Ноутбук — банковское приложение пульсирует красным. Авария!',
    linkedQuestId: 'banking_crash',
    requiredFlag: 'found_zarema_bank',
    requiredAct: 2,
    linkedMinigame: 'bash_terminal',
    interactionType: 'hack',
    interactionLabel: 'Расследовать аварию',
    examineData: {
      title: 'Ноутбук',
      description: 'Банковское приложение пульсирует красным. Критическая авария!',
      detailText: 'Счёт Заремы. Странные транзакции. Деньги утекают через подставные компании. Нужно копнуть глубже — через bash-терминал.',
      icon: '💻',
    },
    effects: [
      { type: 'setFlag', flag: 'home_banking_investigated', flagValue: true },
    ],
  },
  /* ═══════════════════════════════════════════════════════════════════
     RIVER PIER — ночная набережная, вторая точка ЧК
     ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'pier_trofim_spot',
    sceneId: 'river_pier',
    position: [4.0, 0.5, -7.2],
    size: [1.8, 2.0, 1.8],
    enterToast: 'Старик с удочкой у перил. Дым от самокрутки висит над чёрной водой.',
    linkedDialogueNodeId: 'trofim_greeting',
    linkedNpcId: 'fisherman_trofim',
    linkedQuestId: 'pier_watchman_key',
    interactionType: 'talk',
  },
  {
    id: 'pier_barrel_fire',
    sceneId: 'river_pier',
    position: [0, 0.5, -2.0],
    size: [1.6, 2.0, 1.6],
    enterToast: 'Костёр в ржавой бочке. Искры улетают к струнным огням и гаснут над рекой.',
    interactionType: 'use',
    interactionLabel: 'Погреться у костра',
    examineData: {
      title: 'Костёр в бочке',
      description: 'Ржавая бочка, в которой горят обломки ящиков. Вокруг — ящики-сиденья.',
      detailText: 'Огонь здесь не для тепла — для разговора. У такого костра молчать так же легко, как говорить. Дым пахнет смолой и чуть-чуть — портвейном.',
      icon: '🔥',
    },
    effects: [
      { type: 'addStat', stat: 'stress', value: -6 },
      { type: 'addStat', stat: 'energy', value: 5 },
      { type: 'setFlag', flag: 'pier_fire_warmed', flagValue: true },
    ],
  },
  {
    id: 'pier_portwine_crate',
    sceneId: 'river_pier',
    position: [2.6, 0.4, -0.6],
    size: [0.9, 1.0, 0.9],
    enterToast: 'Ящик с бутылками. На боку маркером: «ЧК. Брать по совести.»',
    interactionType: 'take',
    interactionLabel: 'Взять бутылку «777»',
    examineData: {
      title: 'Ящик с портвейном',
      description: 'Деревянный ящик, в нём — тёмные бутылки с тремя семёрками на этикетке.',
      detailText: 'Чекисты привозят его по пятницам и оставляют без замка. «Брать по совести» — это и есть замок. Работает лучше любого шифрования.',
      icon: '🍷',
    },
    effects: [
      { type: 'addItem', itemId: 'port_wine_777' },
      { type: 'setFlag', flag: 'pier_portwine_taken', flagValue: true },
    ],
  },
  {
    id: 'pier_guitar',
    sceneId: 'river_pier',
    position: [-1.8, 0.5, -2.9],
    size: [1.5, 2.0, 1.5],
    enterToast: 'Девчонка с гитарой перебирает струны у огня. Третья струна связана узлом.',
    linkedDialogueNodeId: 'chk_ritka_greeting',
    linkedNpcId: 'chk_ritka',
    linkedQuestId: 'pier_quiet_song',
    interactionType: 'talk',
  },
  {
    id: 'pier_fishing_rod',
    sceneId: 'river_pier',
    position: [-4.0, 0.5, -7.4],
    size: [1.4, 1.5, 1.2],
    enterToast: 'Запасная удочка прислонена к перилам. Поплавок ждёт в банке из-под кофе.',
    interactionType: 'use',
    interactionLabel: 'Тихая рыбалка',
    examineData: {
      title: 'Удочка у перил',
      description: 'Бамбуковая удочка, леска, поплавок из винной пробки. Всё, что нужно.',
      detailText: 'Рыбалка ночью — это не про рыбу. Это про то, чтобы смотреть на чёрную воду и слушать, как город за спиной перестаёт иметь значение. Иногда клюёт. Чаще — отпускает.',
      icon: '🎣',
    },
    effects: [
      { type: 'addStat', stat: 'stress', value: -8 },
      { type: 'addSkill', skill: 'intuition', value: 1 },
      { type: 'setFlag', flag: 'pier_fished_once', flagValue: true },
    ],
  },
  {
    id: 'pier_old_boat',
    sceneId: 'river_pier',
    position: [-6.0, 0.5, 4.3],
    size: [1.6, 1.2, 1.2],
    enterToast: 'Старая лодка на берегу. Краска облезла до имени: «...ря».',
    isOneTime: true,
    interactionType: 'examine',
    interactionLabel: 'Осмотреть лодку',
    examineData: {
      title: 'Старая лодка',
      description: 'Деревянная плоскодонка, вытащенная на берег килем вверх. Под ней кто-то спит — судя по запаху, Трофим.',
      detailText: 'На корме под слоями облезшей краски читаются последние буквы имени: «...ря». «Заря»? Река стёрла остальное. Река вообще много чего стёрла — но, говорят, ничего не забыла.',
      icon: '🛶',
    },
    effects: [
      { type: 'discoverLore', loreId: 'lore_river_remembers' },
      { type: 'addSkill', skill: 'intuition', value: 1 },
      { type: 'setFlag', flag: 'pier_boat_examined', flagValue: true },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     FACTORY BASEMENT — «Прогресс-7», реликварий «Зари-М»
     ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'basement_entry_terminal',
    sceneId: 'factory_basement',
    position: [3.0, 0.5, 5.6],
    size: [0.9, 1.2, 0.7],
    enterToast: 'Пультовая у входа. Экран жив — кто-то платит за это электричество тридцать лет.',
    linkedQuestId: 'basement_hum',
    linkedMinigame: 'codebreaker',
    interactionType: 'hack',
    interactionLabel: 'Взломать пульт',
    examineData: {
      title: 'Терминал «Прогресс-7»',
      description: 'Пульт допуска с кириллической клавиатурой и янтарным экраном: «ВВЕДИТЕ КОД СМЕНЫ».',
      detailText: 'Журнал доступа не очищался с 1991 года. Последняя запись: «Смена сдана. Объект работает. Объект всегда работает.» Ниже — тысячи пустых строк. И одна свежая попытка входа. Не твоя.',
      icon: '🖥️',
    },
    effects: [
      { type: 'setFlag', flag: 'basement_terminal_accessed', flagValue: true },
    ],
  },
  {
    id: 'basement_zarya_monolith',
    sceneId: 'factory_basement',
    position: [0, 0.8, -3.8],
    size: [2.6, 2.0, 1.4],
    enterToast: 'Монолит «Зари-М» пульсирует зелёным. Гул проходит сквозь подошвы — и выше, до затылка.',
    interactionType: 'examine',
    interactionLabel: 'Подойти к машине',
    examineData: {
      title: 'Монолит «Заря-М»',
      description: 'Чёрный шкаф высотой в два человеческих роста. Зелёная пульсация — ровная, как дыхание спящего.',
      detailText: 'Она молчит. Но это молчание комнаты, в которой кто-то есть. Иней на трубах гелиевого охлаждения, гул на 50 герц — и странное чувство, что пульсация чуть-чуть подстраивается под твой пульс. Не наоборот. Трофим говорил: «не трогай — послушай». Ты слушаешь. По коже — мурашки, как от строчки, которую ещё не написал.',
      icon: '🟩',
    },
    effects: [
      { type: 'setFlag', flag: 'zarya_monolith_examined', flagValue: true },
      { type: 'discoverLore', loreId: 'lore_zarya_project_early' },
      { type: 'addSkill', skill: 'intuition', value: 1 },
      { type: 'addStat', stat: 'stress', value: 4 },
    ],
  },
  {
    id: 'basement_server_rack',
    sceneId: 'factory_basement',
    position: [-3.6, 0.6, -1.0],
    size: [1.0, 1.5, 2.2],
    enterToast: 'Серверная стойка с распахнутой дверцей. Внутри — платы, пыль и что-то бумажное.',
    isOneTime: true,
    interactionType: 'open',
    interactionLabel: 'Обыскать стойку',
    examineData: {
      title: 'Серверная стойка',
      description: 'Советская стойка серии «Эльбрус-К». Половина плат вынута, остальные тёплые на ощупь.',
      detailText: 'Между блоками кто-то аккуратно сложил перфокарты — как закладки в книге, которую читают десятилетиями. Одна торчит чуть выше остальных. Как будто её оставили на виду. Для кого-то.',
      icon: '🗄️',
    },
    effects: [
      { type: 'addItem', itemId: 'zarya_punch_card' },
      { type: 'setFlag', flag: 'basement_server_searched', flagValue: true },
      { type: 'addXp', value: 25 },
    ],
  },
  {
    id: 'basement_watchman_desk',
    sceneId: 'factory_basement',
    position: [-6.3, 0.5, 5.4],
    size: [1.2, 1.0, 1.0],
    enterToast: 'Стол сторожа: кружка, журнал смен и записка, прижатая гайкой.',
    isOneTime: true,
    interactionType: 'read',
    interactionLabel: 'Прочитать записку',
    examineData: {
      title: 'Стол сторожа',
      description: 'Конторский стол у входа. Пыль легла ровно, как снег, — кроме угла, где лежит записка.',
      detailText: 'Почерк крупный, старательный: «Сменщику. Ночью из-под пола гудит — это НЕ авария, не звони. Свет внизу не выключать. Если услышишь, что гул стал ПЕСНЕЙ, — уходи и не оборачивайся. Трофим.» Дата — двадцать лет назад. Гайка на записке отполирована пальцами до блеска.',
      icon: '📜',
    },
    effects: [
      { type: 'discoverLore', loreId: 'lore_watchman_trofim' },
      { type: 'setFlag', flag: 'trofim_note_found', flagValue: true },
      { type: 'addKarma', value: 2 },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     COMBAT ENCOUNTERS — replaced by visible patrolling creeps
     (src/data/creepPatrols.ts + PatrollingCreeps.tsx). The old invisible
     autoTrigger zones fired combat with no warning; creeps give the player
     a vision cone to sneak around instead.
     ═══════════════════════════════════════════════════════════════════ */

  ...CHK_TRIGGER_ZONES,
];
