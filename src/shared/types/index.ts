// ============================================
// SHARED TYPES — Единая система типов игры
// ============================================
// Чистые типы без клиентской или серверной логики.
// Импортируются всеми слоями: /shared, /client, /server.

// Re-export all existing types for backward compatibility
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
} from '@/data/types';

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
} from './rpg';

export type { FactionId, FactionReputation } from './factions';
export type { ScheduleEntry } from './schedule';
