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

export function getTriggersForScene(sceneId: string): TriggerZone[] {
  return STORY_TRIGGERS.filter(t => t.sceneId === sceneId);
}

export function getWorldItemsForScene(sceneId: string) {
  return WORLD_ITEMS.filter(i => i.sceneId === sceneId);
}
