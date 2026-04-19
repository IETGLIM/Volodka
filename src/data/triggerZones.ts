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
    position: { x: -1.8, y: 0.5, z: 0.8 },
    size: { x: 2.6, y: 2.2, z: 2.6 },
    sceneId: 'zarema_albert_room',
    type: 'npc',
    npcId: 'zarema_home',
    requiresInteraction: true,
    interactionId: 'npc_intro',
    promptText: 'Поговорить с Заремушкой',
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
