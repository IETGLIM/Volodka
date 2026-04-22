// ============================================
// ТИПЫ ДЛЯ RPG-СИСТЕМЫ
// ============================================

import type { SceneId } from './types';

// Позиция игрока в 3D пространстве
export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
  rotation: number; // Угол поворота в радианах
}

// Состояние NPC
export interface NPCState {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  currentWaypoint: number;
  isInteracting: boolean;
  dialogueHistory: string[]; // ID пройденных диалогов
  lastInteractionTime: number;
}

// Маппинг анимаций модели
export interface AnimationMapping {
  idle: string;      // Название анимации покоя в GLB файле
  walk?: string;     // Название анимации ходьбы
  run?: string;      // Название анимации бега
  talk?: string;     // Название анимации разговора
}

// Определение NPC
export interface NPCDefinition {
  id: string;
  name: string;
  model: 'elder' | 'barista' | 'colleague' | 'shadow' | 'generic';
  modelPath?: string; // Путь к GLTF модели (например, "/models/npc_elder.glb")
  animations?: AnimationMapping; // Маппинг названий анимаций
  defaultPosition: { x: number; y: number; z: number };
  waypoints?: { x: number; y: number; z: number }[]; // Точки патрулирования
  patrolRadius?: number; // Радиус случайного блуждания
  dialogueTree?: DialogueNode | string; // Может быть объектом или ID диалога
  sceneId: SceneId;
  schedule?: NPCSchedule[]; // Расписание появления
  /** Множитель поверх автомасштаба GLB по высоте скина в обходе (`NPC.tsx`); для «карликов/гигантов» подправить 0.5–1.2. */
  scale?: number;
  storyTrigger?: string; // ID story node to trigger after dialogue ends
}

// Расписание NPC
export interface NPCSchedule {
  sceneId: SceneId;
  timeOfDay?: ('morning' | 'afternoon' | 'evening' | 'night')[];
  position: { x: number; y: number; z: number };
}

// Узел диалога
export interface DialogueNode {
  id: string;
  text: string;
  speaker?: string; // Если не указан, говорит NPC
  conditions?: DialogueCondition[];
  effects?: DialogueEffect[];
  effect?: DialogueEffect; // Разрешаем и effect (singular) для обратной совместимости
  choices?: DialogueChoice[];
  autoNext?: string; // ID следующего узла без выбора
}

// Выбор в диалоге
export interface DialogueChoice {
  text: string;
  next: string; // ID следующего узла
  condition?: DialogueCondition;
  effect?: DialogueEffect;
  skillCheck?: {
    skill: string;
    difficulty: number;
    successNext: string;
    failNext: string;
  };
  questStart?: string; // ID квеста для начала
  questObjective?: { questId: string; objectiveId: string };
}

// Условие для диалога
export interface DialogueCondition {
  hasFlag?: string;
  notFlag?: string;
  hasItem?: string;
  minRelation?: { npcId: string; value: number };
  minSkill?: { skill: string; value: number };
  visitedNode?: string;
  completedDialogue?: string; // Пройденный диалог
  minKarma?: number;
  maxKarma?: number;
}

// Эффект диалога
export interface DialogueEffect {
  mood?: number;
  creativity?: number;
  stability?: number;
  stress?: number;
  karma?: number;
  skillGains?: Record<string, number>;
  setFlag?: string;
  unsetFlag?: string;
  /** Предпочтительно `npcRelation`; плоские поля — для данных диалогов в одну строку. */
  npcId?: string;
  npcChange?: number;
  npcRelation?: { npcId: string; change: number };
  giveItem?: string;
  removeItem?: string;
  questStart?: string;
  questObjective?: { questId: string; objectiveId: string };
  unlockPoem?: string;
}

// Триггерная зона
export interface TriggerZone {
  id: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  sceneId: SceneId;
  type: 'story' | 'item' | 'npc' | 'location' | 'quest';
  
  // Для story-триггеров
  storyNodeId?: string;
  /** Полноэкранная аниме-заставка (`animeCutscenes.ts`); после окончания можно открыть `storyNodeId`. */
  cutsceneId?: string;
  
  // Для item-триггеров
  itemId?: string;
  
  // Для npc-триггеров
  npcId?: string;
  
  // Для location-триггеров
  targetSceneId?: SceneId;
  targetPosition?: { x: number; y: number; z: number };
  
  // Условия активации
  conditions?: DialogueCondition[];
  
  // Одноразовый триггер
  oneTime?: boolean;
  
  // Требует нажатия E
  requiresInteraction?: boolean;

  /** Ссылка на запись `InteractionRegistry` (обход: подсказка + E без автозапуска). */
  interactionId?: string;
  
  // Подсказка при входе
  promptText?: string;

  /** Короткий текст «голоса места» при пересечении границы зоны (тост `ui:exploration_message`). */
  enterToast?: string;
  /** Минимальный интервал между повторными показами того же тоста, мс. По умолчанию 22 с. */
  enterToastCooldownMs?: number;
}

// Состояние триггера
export interface TriggerState {
  id: string;
  triggered: boolean;
  triggeredAt?: number;
}

// Предмет в мире
export interface WorldItem {
  id: string;
  itemId: string;
  position: { x: number; y: number; z: number };
  sceneId: SceneId;
  collected: boolean;
  respawnable?: boolean;
  respawnTime?: number;
}

// Коллайдер объекта
export interface ColliderDef {
  type: 'box' | 'cylinder' | 'sphere';
  position: { x: number; y: number; z: number };
  size?: { x: number; y: number; z: number }; // Для box
  radius?: number; // Для cylinder и sphere
  height?: number; // Для cylinder
  rotation?: number;
}

// Определение коллайдеров для сцены
export interface SceneColliders {
  sceneId: SceneId;
  floor?: { size: { x: number; z: number } };
  walls?: ColliderDef[];
  furniture?: ColliderDef[];
  triggers?: TriggerZone[];
  npcs?: string[]; // ID NPC на сцене
}

// Состояние исследования локации
export interface ExplorationState {
  playerPosition: PlayerPosition;
  currentSceneId: SceneId;
  /** Игровое время суток, часы [0, 24). */
  timeOfDay: number;
  npcStates: Record<string, NPCState>;
  triggerStates: Record<string, TriggerState>;
  worldItems: WorldItem[];
  exploredAreas: string[]; // ID исследованных зон
  lastSceneTransition: number;
}

// Режим игры
export type GameMode = 'visual-novel' | 'exploration' | 'dialogue' | 'cutscene' | 'combat';

// Сообщение-подсказка
export interface InteractionPrompt {
  text: string;
  type: 'talk' | 'interact' | 'pick-up' | 'enter' | 'read';
  targetId: string;
}
