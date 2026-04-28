import type { TriggerZone } from './rpgTypes';

// ============================================
// ТРИГГЕРНЫЕ ЗОНЫ ДЛЯ СТОРИНОД
// Каждая зона активирует storyNode при входе
// ============================================

export const STORY_TRIGGERS: TriggerZone[] = [
  // ========== КУХНЯ / ДОМ ==========
  {
    id: 'trigger_kitchen_table',
    position: { x: 0, y: 0.5, z: -2 },
    size: { x: 2.5, y: 1.5, z: 1.5 },
    sceneId: 'kitchen_night',
    type: 'story',
    storyNodeId: 'kitchen_table',
    oneTime: true,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы сесть за стол',
    enterToast: 'Стол помнит слишком много чужих разговоров.',
  },
  /** Зона разговора с Заремой в комнате (`zarema_home`): `InteractionRegistry` id `npc_intro`. */
  {
    id: 'trigger_zarema_home_interaction',
    position: { x: -1.55, y: 0.5, z: 0.65 },
    size: { x: 2.4, y: 2.2, z: 2.4 },
    sceneId: 'zarema_albert_room',
    type: 'npc',
    npcId: 'zarema_home',
    requiresInteraction: true,
    interactionId: 'npc_intro',
    promptText: 'Поговорить с Заремушкой',
  },
  /** Зона побочного квеста «Тёплый угол» (`exploration_zarema_hearth`). */
  {
    id: 'trigger_zarema_quest_hearth',
    position: { x: 1.1, y: 0.45, z: -0.6 },
    size: { x: 2.2, y: 1.8, z: 2.2 },
    sceneId: 'zarema_albert_room',
    type: 'quest',
    requiresInteraction: true,
    interactionId: 'quest_zarema_hearth',
    promptText: 'Осмотреть угол у дивана',
  },
  /** Побочный квест «Лог подъезда» — экран у северной стены (`exploration_zarema_tv_feed`). */
  {
    id: 'trigger_zarema_quest_tv_feed',
    position: { x: 0.4, y: 0.95, z: -3.2 },
    size: { x: 2.6, y: 2.2, z: 1.8 },
    sceneId: 'zarema_albert_room',
    type: 'quest',
    requiresInteraction: true,
    interactionId: 'quest_zarema_tv',
    promptText: 'Всмотреться в настенный «лог»',
  },
  {
    id: 'trigger_kitchen_night_quest_tv_feed',
    position: { x: 0.4, y: 0.95, z: -3.2 },
    size: { x: 2.6, y: 2.2, z: 1.8 },
    sceneId: 'kitchen_night',
    type: 'quest',
    requiresInteraction: true,
    interactionId: 'quest_zarema_tv',
    promptText: 'Всмотреться в настенный «лог»',
  },
  {
    id: 'trigger_kitchen_fridge',
    position: { x: 4, y: 0.5, z: -2 },
    size: { x: 1.5, y: 2, z: 1.5 },
    sceneId: 'kitchen_night',
    type: 'story',
    storyNodeId: 'kitchen_fridge',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы открыть холодильник',
  },
  {
    id: 'trigger_kitchen_window',
    position: { x: -3, y: 1.5, z: -4.5 },
    size: { x: 2, y: 2, z: 1 },
    sceneId: 'kitchen_dawn',
    type: 'story',
    storyNodeId: 'kitchen_window',
    oneTime: true,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы посмотреть в окно',
  },

  // ========== КАФЕ ==========
  {
    id: 'trigger_cafe_stage',
    position: { x: 0, y: 0.5, z: -6 },
    size: { x: 4, y: 2, z: 2.5 },
    sceneId: 'cafe_evening',
    type: 'story',
    storyNodeId: 'cafe_stage',
    oneTime: true,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы подойти к сцене',
    enterToast: 'Здесь пахнет кофе, пылью усилителей и чужими аплодисментами.',
  },
  {
    id: 'trigger_cafe_table_left',
    position: { x: -3, y: 0.5, z: 0 },
    size: { x: 1.5, y: 1.5, z: 1.5 },
    sceneId: 'cafe_evening',
    type: 'story',
    storyNodeId: 'cafe_table',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы сесть за столик',
  },
  {
    id: 'trigger_cafe_table_center',
    position: { x: 0, y: 0.5, z: 0 },
    size: { x: 1.5, y: 1.5, z: 1.5 },
    sceneId: 'cafe_evening',
    type: 'story',
    storyNodeId: 'cafe_table_center',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы сесть за столик',
  },

  // ========== ОФИС ==========
  {
    id: 'trigger_office_desk_left',
    position: { x: -3, y: 0.5, z: 0 },
    size: { x: 2, y: 1.5, z: 1.5 },
    sceneId: 'office_morning',
    type: 'story',
    storyNodeId: 'office_desk',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы сесть за рабочий стол',
    enterToast: 'Монитор гаснет — будто офис на секунду забывает, зачем он существует.',
  },
  {
    id: 'trigger_office_desk_right',
    position: { x: 3, y: 0.5, z: 0 },
    size: { x: 2, y: 1.5, z: 1.5 },
    sceneId: 'office_morning',
    type: 'story',
    storyNodeId: 'office_desk_colleague',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы подойти к столу коллеги',
  },

  // ========== УЛИЦА ==========
  {
    id: 'trigger_street_bench_left',
    position: { x: -4, y: 0.5, z: 2 },
    size: { x: 2, y: 1.5, z: 1 },
    sceneId: 'street_night',
    type: 'story',
    storyNodeId: 'street_bench',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы сесть на скамейку',
    enterToast: 'Скамейка холодная — как всё на этой стороне города.',
  },
  {
    id: 'trigger_street_bench_right',
    position: { x: 4, y: 0.5, z: 2 },
    size: { x: 2, y: 1.5, z: 1 },
    sceneId: 'street_night',
    type: 'story',
    storyNodeId: 'street_bench_view',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы сесть на скамейку',
  },
  {
    id: 'trigger_street_lantern_memory',
    position: { x: 0, y: 0.5, z: -10 },
    size: { x: 2.5, y: 2, z: 2.5 },
    sceneId: 'street_night',
    type: 'story',
    cutsceneId: 'city_memories',
    oneTime: true,
    requiresInteraction: true,
    promptText: 'Нажмите E — короткий флешбэк о городе',
  },

  // ========== МЕМОРИАЛЬНЫЙ ПАРК ==========
  {
    id: 'trigger_park_memorial',
    position: { x: 0, y: 0.5, z: -10 },
    size: { x: 3, y: 2, z: 2 },
    sceneId: 'memorial_park',
    type: 'story',
    storyNodeId: 'memorial_main',
    oneTime: true,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы осмотреть памятник',
    enterToast: 'Тишина здесь не пустая — она кого-то помнит.',
  },
  {
    id: 'trigger_park_gazebo',
    position: { x: 0, y: 0.5, z: -6 },
    size: { x: 5, y: 3, z: 4 },
    sceneId: 'memorial_park',
    type: 'story',
    storyNodeId: 'park_gazebo',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы войти в беседку',
  },

  // ========== КРЫША ==========
  {
    id: 'trigger_rooftop_edge',
    position: { x: 0, y: 0.5, z: -7 },
    size: { x: 15, y: 2, z: 2 },
    sceneId: 'rooftop_night',
    type: 'story',
    storyNodeId: 'rooftop_edge',
    oneTime: true,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы подойти к краю',
    enterToast: 'Ветер с края крыши звучит громче любого совещания.',
  },

  // ========== РАЙОН / МВД (побочные квесты обхода) ==========
  {
    id: 'trigger_district_chronicle_quest',
    position: { x: 1.2, y: 0.45, z: -0.2 },
    size: { x: 2.8, y: 1.8, z: 2.2 },
    sceneId: 'district',
    type: 'quest',
    requiresInteraction: true,
    interactionId: 'quest_district_chronicle',
    promptText: 'E — у лавки: хроника двора',
  },
  {
    id: 'trigger_mvd_bureau_quest',
    position: { x: 0, y: 0.5, z: 0.5 },
    size: { x: 2.4, y: 1.8, z: 1.6 },
    sceneId: 'mvd',
    type: 'quest',
    requiresInteraction: true,
    interactionId: 'quest_mvd_bureau',
    promptText: 'E — стойка: печать и очередь',
  },

  // ========== АТМОСФЕРНЫЕ ЗОНЫ (только тост при входе, без узла) ==========
  {
    id: 'ambience_street_plaza',
    position: { x: 0, y: 0.6, z: 0 },
    size: { x: 16, y: 2.2, z: 16 },
    sceneId: 'street_night',
    type: 'story',
    requiresInteraction: false,
    oneTime: false,
    enterToast: 'Неон отражается в луже — город будто смотрит на себя.',
    enterToastCooldownMs: 28_000,
  },
  {
    id: 'ambience_memorial_open',
    position: { x: 0, y: 0.8, z: 2 },
    size: { x: 18, y: 2.5, z: 14 },
    sceneId: 'memorial_park',
    type: 'story',
    requiresInteraction: false,
    oneTime: false,
    enterToast: 'Трава у дорожек приглушает шаги — здесь даже время идёт тише.',
    enterToastCooldownMs: 28_000,
  },

  // ========== КОМНАТА ВОЛОДЬКИ (первая локация 3D-обхода) — заставки по E ==========
  {
    id: 'trigger_volodka_window_cutscene',
    position: { x: -4.35, y: 0.85, z: 0.35 },
    size: { x: 2.4, y: 1.7, z: 2.2 },
    sceneId: 'volodka_room',
    type: 'story',
    cutsceneId: 'volodka_window_skyline',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'E — короткая заставка у окна',
  },
  {
    id: 'trigger_volodka_desk_cutscene',
    position: { x: 3.15, y: 0.75, z: 0.05 },
    size: { x: 2.2, y: 1.5, z: 1.4 },
    sceneId: 'volodka_room',
    type: 'story',
    cutsceneId: 'volodka_desk_monitors',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'E — заставка у рабочего стола',
  },
  {
    id: 'trigger_volodka_rack_hack',
    position: { x: 3.45, y: 0.95, z: 0.08 },
    size: { x: 1.75, y: 1.45, z: 1.25 },
    sceneId: 'volodka_room',
    type: 'quest',
    requiresInteraction: true,
    interactionId: 'volodka_rack_hack',
    promptText: 'E — мини-игра: матрица узлов стойки',
  },
  {
    id: 'trigger_volodka_sofa_cutscene',
    position: { x: -3.75, y: 0.45, z: 1.15 },
    size: { x: 2.0, y: 1.2, z: 1.6 },
    sceneId: 'volodka_room',
    type: 'story',
    cutsceneId: 'volodka_sofa_static',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'E — заставка у дивана',
  },
  {
    id: 'trigger_volodka_door_cutscene',
    /** Зона вглубь комнаты: не пересекать `volodka_door_corridor` (~z 4.35), иначе E всегда уходит в заставку и дверь не открывается. */
    position: { x: 0.05, y: 0.55, z: 2.82 },
    size: { x: 1.35, y: 1.75, z: 0.72 },
    sceneId: 'volodka_room',
    type: 'story',
    cutsceneId: 'volodka_door_threshold',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'E — заставка у двери в коридор',
  },
  /** Вход в мир снов без обязательного визита к Зареме: зона у «лежака»/угла, не на диване с cutscene. */
  {
    id: 'trigger_volodka_dream_nap',
    position: { x: -2.1, y: 0.42, z: -1.5 },
    size: { x: 1.9, y: 1.1, z: 2.0 },
    sceneId: 'volodka_room',
    type: 'location',
    targetSceneId: 'dream',
    targetPosition: { x: 0, y: 1, z: 0 },
    requiresInteraction: true,
    promptText: 'E — закрыть глаза и провалиться в сон',
  },

  // ========== КОМНАТА ЗАРЕМЫ И АЛЬБЕРТА ==========
  {
    id: 'trigger_room_bed',
    position: { x: 3, y: 0.5, z: 2 },
    size: { x: 2, y: 1.5, z: 2 },
    sceneId: 'kitchen_night',
    type: 'location',
    targetSceneId: 'dream',
    targetPosition: { x: 0, y: 1, z: 0 },
    requiresInteraction: true,
    promptText: '🌙 Нажмите E чтобы лечь спать (мир снов)',
  },
  {
    id: 'trigger_room_table',
    position: { x: 0, y: 0.5, z: -1 },
    size: { x: 2, y: 1.5, z: 1.5 },
    sceneId: 'kitchen_night',
    type: 'story',
    storyNodeId: 'room_table',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы сесть за стол',
  },
  {
    id: 'trigger_room_bookshelf',
    position: { x: -4, y: 0.5, z: 1 },
    size: { x: 1.5, y: 2, z: 1 },
    sceneId: 'kitchen_night',
    type: 'story',
    storyNodeId: 'room_bookshelf',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы посмотреть книги',
  },

  // ========== МИР СНОВ ==========
  {
    id: 'trigger_dream_exit',
    position: { x: 0, y: 0.5, z: 5 },
    size: { x: 3, y: 2, z: 2 },
    sceneId: 'dream',
    type: 'location',
    targetSceneId: 'kitchen_night',
    targetPosition: { x: 0, y: 1, z: 0 },
    requiresInteraction: true,
    promptText: '☀️ Нажмите E чтобы проснуться',
  },
  {
    id: 'trigger_dream_lillian',
    position: { x: 0, y: 0.5, z: -4 },
    size: { x: 2, y: 2, z: 2 },
    sceneId: 'dream',
    type: 'story',
    storyNodeId: 'dream_lillian_meet',
    oneTime: true,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы поговорить с Лилиан',
  },
  {
    id: 'trigger_dream_galaxy',
    position: { x: 3, y: 0.5, z: -3 },
    size: { x: 2, y: 2, z: 2 },
    sceneId: 'dream',
    type: 'story',
    storyNodeId: 'dream_galaxy_meet',
    oneTime: false,
    requiresInteraction: true,
    promptText: 'Нажмите E чтобы поговорить с Астрой',
  },
];

// ============================================
// ПРЕДМЕТЫ В МИРЕ
// ============================================

export const WORLD_ITEMS: Array<{
  id: string;
  itemId: string;
  position: { x: number; y: number; z: number };
  sceneId: string;
}> = [
  // Заметки на кухне
  {
    id: 'item_note_kitchen',
    itemId: 'note_draft',
    position: { x: -0.4, y: 0.98, z: -2 },
    sceneId: 'kitchen_night',
  },
  
  // Предметы в кафе
  {
    id: 'item_poem_cafe',
    itemId: 'poem_fragment_1',
    position: { x: -3, y: 0.9, z: 0 },
    sceneId: 'cafe_evening',
  },
  
  // Предметы в парке
  {
    id: 'item_letter_park',
    itemId: 'old_letter',
    position: { x: -5, y: 0.7, z: 0 },
    sceneId: 'memorial_park',
  },
];

// ============================================
// ФУНКЦИИ ПОЛУЧЕНИЯ
// ============================================

/**
 * Сцены 3D с тем же лейаутом/триггерами, что и базовая (комната Заремы = бывший «kitchen» сетап).
 * Триггеры в данных остаются на `kitchen_night`, чтобы не дублировать координаты.
 */
const SCENE_TRIGGER_FALLBACK: Record<string, string> = {
  zarema_albert_room: 'kitchen_night',
};

const SCENE_WORLD_ITEMS_FALLBACK: Record<string, string> = {
  zarema_albert_room: 'kitchen_night',
};

/** Сцены, по которым фильтруем триггеры в рантайме (сама сцена + «наследие» kitchen для Заремы). */
export function explorationRuntimeTriggerSceneIds(sceneId: string): Set<string> {
  const fallback = SCENE_TRIGGER_FALLBACK[sceneId];
  return new Set(fallback != null ? [sceneId, fallback] : [sceneId]);
}

export function getTriggersForScene(sceneId: string): TriggerZone[] {
  const fallback = SCENE_TRIGGER_FALLBACK[sceneId];
  return STORY_TRIGGERS.filter(
    (t) => t.sceneId === sceneId || (fallback !== undefined && t.sceneId === fallback),
  );
}

export function getWorldItemsForScene(sceneId: string) {
  const fallback = SCENE_WORLD_ITEMS_FALLBACK[sceneId];
  return WORLD_ITEMS.filter(
    (i) => i.sceneId === sceneId || (fallback !== undefined && i.sceneId === fallback),
  );
}
