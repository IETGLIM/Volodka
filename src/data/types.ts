// ============================================
// БАЗОВЫЕ ТИПЫ ИГРЫ
// ============================================

// Типы узлов истории
export type NodeType = 
  | 'dialogue' 
  | 'narration' 
  | 'poem' 
  | 'poem_game' 
  | 'interpretation' 
  | 'dream' 
  | 'battle' 
  | 'ending'
  | 'minigame'
  | 'skill_check'
  | 'moral_dilemma'
  | 'random_event'
  | 'location_transition';

// Типы сцен
export type SceneId = 
  | 'kitchen_night' 
  | 'kitchen_dawn' 
  | 'home_morning' 
  | 'home_evening'
  | 'volodka_room'
  | 'volodka_corridor'
  | 'office_morning' 
  | 'server_room' 
  | 'rooftop_night' 
  | 'dream' 
  | 'battle'
  | 'street_winter'
  | 'street_night'
  | 'cafe_evening'
  | 'gallery_opening'
  | 'underground_club'
  | 'old_library'
  | 'abandoned_factory'
  | 'psychologist_office'
  | 'train_station'
  | 'memorial_park'
  | 'library'
  | 'blue_pit'
  | 'green_zone'
  | 'district'
  | 'mvd'
  | 'president_hotel'
  | 'zarema_albert_room';

export type StreamingChunkId = string & { readonly __brand?: 'StreamingChunkId' };

// Пути развития персонажа
export type PlayerPath = 
  | 'none' 
  | 'creator' 
  | 'escapist' 
  | 'observer' 
  | 'broken' 
  | 'reconciliation'
  | 'seeker'
  | 'mentor';

// ============================================
// ВИЗУАЛЬНОЕ СОСТОЯНИЕ
// ============================================

export interface VisualState {
  glitchIntensity: number;
  saturation: number;
  contrast: number;
  colorTint: string;
  particles: boolean;
}

// ============================================
// СОСТОЯНИЕ ИГРОКА
// ============================================

export interface PlayerState {
  // Базовые характеристики
  mood: number;          // 0-100
  creativity: number;    // 0-100
  stability: number;     // 0-100
  energy: number;        // 0..MAX_PLAYER_ENERGY (см. lib/energyConfig)
  karma: number;         // 0-100
  selfEsteem: number;    // 0-100 — самооценка, критично для психологии
  
  // Стресс-система (Kernel Panic)
  stress: number;        // 0-100 - при 100 срабатывает Kernel Panic
  panicMode: boolean;    // Активен ли режим паники
  
  // Прогресс
  /** Уровень персонажа (1…), классический RPG-слой поверх навыков и кармы. */
  characterLevel: number;
  /** Текущий опыт в бакете до следующего уровня. */
  experience: number;
  /** Порог до следующего уровня (денормализация для HUD/сейва). */
  experienceToNextLevel: number;
  poemsCollected: string[];
  path: PlayerPath;
  act: 1 | 2 | 3 | 4;
  visitedNodes: string[];
  playTime: number;
  
  // Новые системы
  skills: PlayerSkills;
  collections: Collections;
  flags: Record<string, boolean>;
  /** Экипировка (обход / RPG): id предметов; опционально до UI слота экипировки. */
  equippedItemIds?: string[];
  statistics: GameStatistics;
  
  // Таймеры для Kernel Panic
  panicTimers: PanicTimer[];
}

export interface PlayerSkills {
  // Творческие навыки
  writing: number;       // 0-100
  perception: number;    // 0-100
  empathy: number;       // 0-100
  imagination: number;   // 0-100 - влияет на яркость 3D сцен
  
  // IT/Логические навыки
  logic: number;         // 0-100 - взлом терминалов, аргументы в спорах
  coding: number;        // 0-100 - дебаггинг памяти
  
  // Социальные навыки
  persuasion: number;    // 0-100
  intuition: number;     // 0-100
  
  // Внутренние навыки
  resilience: number;    // 0-100 - сопротивление стрессу
  introspection: number; // 0-100
  
  // Опыт для прокачки
  skillPoints: number;
}

export interface Collections {
  poems: string[];
  memories: string[];
  secrets: string[];
  achievements: string[];
  endings: string[];
}

export interface GameStatistics {
  choicesMade: number;
  poemsCreated: number;
  npcsMet: number;
  locationsVisited: number;
  timeInDreams: number;
  moralChoices: MoralChoice[];
}

export interface PanicTimer {
  id: string;
  nodeId: string;
  startTime: number;
  duration: number;      // в миллисекундах
  onTimeout: string;     // ID узла для перехода при таймауте
}

export interface MoralChoice {
  id: string;
  nodeId: string;
  choice: 'selfless' | 'selfish' | 'neutral' | 'chaotic';
  timestamp: number;
}

// ============================================
// ЭФФЕКТЫ И УСЛОВИЯ
// ============================================

export interface StoryEffect {
  mood?: number;
  creativity?: number;
  stability?: number;
  energy?: number;
  karma?: number;
  selfEsteem?: number;
  
  // Стресс (Kernel Panic)
  stress?: number;  // Положительное значение добавляет стресс, отрицательное - снижает
  
  // Навыки
  skillGains?: Partial<Record<keyof PlayerSkills, number>>;
  
  // Прямые изменения навыков (для быстрых эффектов)
  perception?: number;
  introspection?: number;
  logic?: number;
  coding?: number;
  empathy?: number;
  writing?: number;
  imagination?: number;
  persuasion?: number;
  intuition?: number;
  resilience?: number;
  
  // Предметы
  itemReward?: string;
  itemRemove?: string;
  
  // Стихи и коллекции
  poemId?: string;
  memoryId?: string;
  secretId?: string;
  
  // NPC
  npcId?: string;
  npcChange?: number;
  
  // Квесты
  questStart?: string;
  questComplete?: string;
  questObjective?: { questId: string; objectiveId: string; value?: number };
  // Множественные квестовые операции (приоритет над одиночными)
  questOperations?: Array<{
    type: 'start' | 'complete' | 'objective';
    questId: string;
    objectiveId?: string;
    value?: number;
  }>;
  
  // Флаги
  setFlag?: string;
  unsetFlag?: string;
  
  // Путь
  pathShift?: PlayerPath;
  
  // Конец
  ending?: string;
}

export interface Condition {
  stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 
        'writing' | 'perception' | 'empathy' | 'persuasion' | 'intuition' | 
        'resilience' | 'introspection';
  min?: number;
  max?: number;
}

/** Фаза суток для условий (сюжет, обход, диалоги, последствия). */
export type NarrativeTimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface ChoiceCondition {
  stat?: Condition['stat'];
  min?: number;
  max?: number;
  hasFlag?: string;
  notFlag?: string;
  hasItem?: string;
  minRelation?: { npcId: string; value: number };
  visitedNode?: string;

  /** Минимальная фаза суток (линейный порядок dawn→…→night), если задана вместе с контекстом `narrativeTimeOfDay`. */
  minTimeOfDay?: NarrativeTimeOfDay;
  maxTimeOfDay?: NarrativeTimeOfDay;
  /** Хотя бы один id должен быть в списке экипировки контекста. */
  equippedAnyOf?: string[];
  
  // Квестовые условия — квесты влияют на доступные выборы
  questActive?: string;       // Квест должен быть активен
  questCompleted?: string;    // Квест должен быть завершён
  questNotStarted?: string;   // Квест ещё не начат
  questNotCompleted?: string; // Квест не завершён (для блокировки)
  minQuestCount?: number;     // Минимум завершённых квестов
}

// ============================================
// УЗЛЫ ИСТОРИИ
// ============================================

/** Запись в журнале выборов (для панели «память решений») */
export interface ChoiceLogEntry {
  id: string;
  at: number;
  fromNodeId: string;
  choiceText: string;
  toNodeId: string;
  kind: 'story' | 'skill';
  skillRollSuccess?: boolean;
}

export interface StoryChoice {
  text: string;
  next: string;
  effect?: StoryEffect;
  condition?: ChoiceCondition;
  locked?: boolean;
  lockReason?: string;

  /** Открыть дерево диалога этого NPC; по завершении разговора — переход на `next` */
  dialogueNpcId?: string;
  
  // Для моральных дилемм
  moralType?: 'selfless' | 'selfish' | 'neutral' | 'chaotic';
  
  // Для skill check
  skillCheck?: {
    skill: keyof PlayerSkills;
    difficulty: number;
    successNext: string;
    failNext: string;
    successEffect?: StoryEffect;
    failEffect?: StoryEffect;
  };
}

export interface PoemLine {
  id: string;
  text: string;
  value: number;  // Качество строки
}

export interface Interpretation {
  text: string;
  effect: StoryEffect;
  insight?: string;
}

export interface MiniGame {
  type: 'word_puzzle' | 'memory_match' | 'rhythm' | 'drawing';
  difficulty: number;
  successThreshold: number;
  successNext: string;
  failNext: string;
  successEffect?: StoryEffect;
  failEffect?: StoryEffect;
}

export interface RandomEvent {
  id: string;
  probability: number;
  conditions?: ChoiceCondition[];
  effect: StoryEffect;
  text?: string;
  nextNode?: string;
}

export interface StoryNode {
  id: string;
  type: NodeType;
  text?: string;
  speaker?: string;
  scene?: SceneId;
  
  // Акт и время
  act?: 1 | 2 | 3 | 4;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'dawn';
  
  // Выборы и переходы
  choices?: StoryChoice[];
  autoNext?: string;
  
  // Тип-специфичные поля
  poemLines?: string[];
  lines?: PoemLine[];         // Для poem_game
  interpretations?: Interpretation[];
  
  // Мини-игры
  minigame?: MiniGame;
  
  // Случайные события
  randomEvents?: RandomEvent[];
  
  // Эффекты
  onEnter?: StoryEffect;
  effect?: StoryEffect;       // Алиас для onEnter
  
  // Аниме-заставка (показывается перед текстом)
  cutscene?: string;          // ID заставки из animeCutscenes.ts
  
  // Для endings
  endingType?: string;
  endingTitle?: string;
}

// ============================================
// NPC И ОТНОШЕНИЯ
// ============================================

export interface NPCRelation {
  id: string;
  name: string;
  value: number;  // -100 to 100
  stage: 'stranger' | 'acquaintance' | 'friend' | 'close' | 'estranged';
  
  // Новые поля
  trust: number;      // 0-100
  respect: number;    // 0-100
  intimacy: number;   // 0-100
  
  // Флаги
  flags: Record<string, boolean>;
  
  // История взаимодействий
  interactions: NPCInteraction[];
}

export interface NPCInteraction {
  nodeId: string;
  choice: string;
  effect: number;
  timestamp: number;
}

// ============================================
// КВЕСТЫ
// ============================================

export interface QuestObjective {
  id: string;
  text: string;
  completed: boolean;
  targetValue?: number;
  currentValue?: number;
  hidden?: boolean;

  // Подсказки для игрока
  hint?: string;           // Подсказка что делать (например, "Поговори с Алисой в кафе")
  targetLocation?: string; // Где искать (например, "cafe_evening")
  targetNPC?: string;      // С кем говорить (например, "cafe_college_girl")
  /** Якорь метки на миникарте обхода (мир XZ), если есть `targetLocation` без `targetNPC`. */
  mapHint?: { x: number; z: number };
  targetItem?: string;     // Какой предмет нужен

  /** Тип шага для UX (трекер, журнал) */
  stageType?: 'minigame' | 'narration' | 'exploration' | 'dialogue' | 'terminal';
  /** Узел сюжета, к которому привязан шаг (подсказка «где это») */
  linkedStoryNodeId?: string;
}

export interface QuestReward {
  /** Опыт персонажа (XP) за завершение квеста. */
  experience?: number;
  creativity?: number;
  mood?: number;
  stability?: number;
  karma?: number;
  skillPoints?: number;
  itemRewards?: string[];
  unlockFlags?: string[];
  
  // Навыки
  perception?: number;
  introspection?: number;
  writing?: number;
  empathy?: number;
  persuasion?: number;
  intuition?: number;
  resilience?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'hidden' | 'personal';
  /** Подгруппа в журнале квестов (например «Работа · IT»); без поля — общий список */
  faction?: string;
  status: 'locked' | 'available' | 'active' | 'completed' | 'failed';
  objectives: QuestObjective[];
  reward: QuestReward;
  
  // Условия
  prerequisite?: string;  // ID другого квеста
  requiredFlags?: string[];
  
  // Дедлайны (в игровом времени)
  timeLimit?: number;
  startNode?: string;
  completeNode?: string;
  
  // Для скрытых квестов
  discoveryCondition?: ChoiceCondition;
}

export interface ExtendedQuest extends Quest {
  startTime?: number;
  completedTime?: number;
  hidden?: boolean;
}

// ============================================
// ДОСТИЖЕНИЯ
// ============================================

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: AchievementRarity;
  hidden?: boolean;
  
  // Условия разблокировки
  condition: AchievementCondition;
  
  // Награда
  reward?: QuestReward;
}

export interface AchievementCondition {
  type: 'poems' | 'karma' | 'quests' | 'relations' | 'locations' | 'endings' | 'time' | 'flags' | 'choices';
  target?: number;
  specificIds?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface AchievementState {
  poemsCount: number;
  karma: number;
  completedQuests: string[];
  relations: Record<string, number>;
  visitedLocations: string[];
  endingsSeen: string[];
  playTime: number;
  flags: Record<string, boolean>;
  poemsCollected: string[];
  moralChoices?: MoralChoice[];
}

// ============================================
// ПРЕДМЕТЫ
// ============================================

export type ItemType = 'consumable' | 'key' | 'artifact' | 'memory' | 'document' | 'gift';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  
  // Эффекты при использовании
  useEffect?: StoryEffect;
  
  // Можно ли выбросить
  droppable: boolean;
  
  // Стакается ли
  stackable: boolean;
  
  // Максимальное количество в стаке
  maxStack: number;
  
  // Стоимость (для торговли, если будет)
  value?: number;
  
  // Условия использования
  useCondition?: ChoiceCondition;
  
  // Лор
  lore?: string;
}

export interface InventoryItem {
  item: Item;
  quantity: number;
  obtainedAt: number;
  source?: string;
}

// ============================================
// СОХРАНЕНИЕ
// ============================================

export interface SaveData {
  version: number;
  savedAt: number;
  playerState: PlayerState;
  currentNodeId: string;
  npcRelations: NPCRelation[];
  quests: Record<string, ExtendedQuest>;
  inventory: { itemId: string; quantity: number; obtainedAt: number }[];
  unlockedAchievements: string[];
  settings: GameSettings;
}

export interface GameSettings {
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  musicVolume: number;
  sfxVolume: number;
  showTutorial: boolean;
  language: 'ru' | 'en';
}
