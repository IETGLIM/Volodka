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
  NPCModelType,
  NPCBehaviorState,
  NPCSpawnConfig,
  TriggerZone,
  WorldItem,
  PortalTrigger,
} from './rpgTypes';

// Константы
export {
  CHARACTER_STATS,
  PATH_THRESHOLDS,
  STRESS_THRESHOLDS,
  TIME_CONSTANTS,
  SAVE_VERSION,
} from './constants';

// Достижения
export {
  achievements,
  achievementCategories,
  checkAchievement,
  getAchievementsByRarity,
  getHiddenAchievements,
} from './achievements';

// Аниме-заставки
export {
  animeCutscenes,
  getCutsceneById,
  getCutscenesByType,
  getCutscenesByAct,
} from './animeCutscenes';

// NPC определения
export {
  npcDefinitions,
  getNPCById,
  getNPCsByLocation,
  getNPCsByAct,
  getNPCsByRole,
  getAllNPCs,
} from './npcDefinitions';

// Стихи (НЕ ИЗМЕНЯТЬ!)
export {
  poems,
  getPoemById,
  getPoemsByTheme,
  getPoemsByAct,
} from './poems';

// Квесты
export {
  quests,
  getQuestById,
  getQuestsByType,
  getQuestsByStatus,
  getActiveQuests,
  getMainQuests,
  getSideQuests,
  getHiddenQuests,
} from './quests';

// Узлы истории
export {
  storyNodes,
  getStoryNode,
  getNodesByAct,
  getNodesByScene,
  getNodesByType,
  getStartingNode,
  getNextNodes,
  validateStoryGraph,
} from './storyNodes';

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

// Расширение Story Nodes (дополнительные узлы для интеграции)
export {
  IT_METAPHOR_NODES,
  MARIA_SKILL_CHECK_NODES,
  QUEST_NODES,
  ACT3_CRISIS_NODES,
} from './storyNodesExpansion';
