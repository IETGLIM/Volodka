// ============================================
// ЭКСПОРТЫ ВСЕХ МОДУЛЕЙ ДАННЫХ
// ============================================

// Типы
export type {
  NodeType,
  SceneId,
  PlayerPath,
  VisualState,
  PlayerState,
  PlayerSkills,
  Collections,
  GameStatistics,
  PanicTimer,
  MoralChoice,
  StoryEffect,
  Condition,
  ChoiceCondition,
  StoryChoice,
  PoemLine,
  Interpretation,
  MiniGame,
  RandomEvent,
  StoryNode,
  NPCRelation,
  NPCInteraction,
  QuestObjective,
  QuestReward,
  Quest,
  ExtendedQuest,
  AchievementRarity,
  Achievement,
  AchievementCondition,
  AchievementState,
  ItemType,
  ItemRarity,
  Item,
  InventoryItem,
  SaveData,
  GameSettings,
} from './types';

// RPG Типы
export type {
  PlayerPosition,
  NPCState,
  AnimationMapping,
  NPCDefinition,
  NPCSchedule,
  DialogueNode,
  DialogueChoice,
  DialogueCondition,
  DialogueEffect,
  TriggerZone,
  TriggerState,
  WorldItem,
  ColliderDef,
  SceneColliders,
  ExplorationState,
  GameMode,
  InteractionPrompt,
} from './rpgTypes';

// Константы
export {
  INITIAL_SKILLS,
  INITIAL_COLLECTIONS,
  INITIAL_STATISTICS,
  INITIAL_STATE,
  INITIAL_NPC_RELATIONS,
} from './constants';

// Достижения
export {
  ACHIEVEMENTS,
  RARITY_COLORS,
  RARITY_GLOW,
  getRarityColor,
  checkAchievement,
  getUnlockedAchievements,
  getAchievementProgress,
  getTotalPoints,
} from './achievements';

// Аниме-заставки
export {
  ANIME_CUTSCENES,
  getCutsceneById,
  SCENE_TO_CUTSCENE,
} from './animeCutscenes';

// NPC определения
export {
  NPC_DEFINITIONS,
  DIALOGUE_NODES,
} from './npcDefinitions';

// Стихи (НЕ ИЗМЕНЯТЬ!)
export type { Poem } from './poems';

export {
  POEMS,
  GAME_INTRO,
  MAIN_ARCHIVE_POEM_COUNT,
  getPoemById,
  getPoemsByTheme,
  getOrderedPoems,
  getMainPoems,
  getHiddenPoems,
  isBonusPoem,
} from './poems';

// Квесты
export {
  QUEST_DEFINITIONS,
  updateObjective,
  activateQuest,
  failQuest,
  checkQuestAvailability,
  getActiveQuests,
  getCompletedQuests,
  getQuestProgress,
  getNextObjective,
} from './quests';

// Узлы истории
export {
  STORY_NODES,
  TITLE_TEXT,
  SUBTITLE_TEXT,
  INTRO_POEM,
} from './storyNodes';

export { VERTICAL_SLICE_ENTRY_NODE_ID } from './verticalSliceStoryNodes';

// Триггерные зоны
export {
  STORY_TRIGGERS,
  WORLD_ITEMS,
  getTriggersForScene,
  getWorldItemsForScene,
} from './triggerZones';

// Предметы
export {
  items,
  itemCategories,
  itemCategoryIcons,
  rarityColors,
  rarityNames,
  rarityGlow,
  getItemById,
  getItemsByType,
  getItemsByRarity,
  getItemsWithValue,
  getUsableItems,
  getDroppableItems,
  getItemsWithLore,
  canUseItem,
  useItem,
  canStackItems,
  canDropItem,
  createInventorySlot,
  addToInventory,
  removeFromInventory,
  hasItem,
  getItemCount,
  getInventoryValue,
  sortInventoryByRarity,
  sortInventoryByType,
  filterInventoryByType,
  getTotalPassiveEffect,
  getItemDisplayName,
  getItemDescription,
  getItemIcon,
  formatItemRarity,
  formatItemType,
  getItemRarityColor,
  getAllItems,
  getItemCount as getTotalItemCount,
} from './items';

export type { InventorySlot } from './items';
