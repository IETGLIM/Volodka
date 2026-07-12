/* ─── Volodka RPG – data barrel export ─── */

// Constants
export {
  INITIAL_PLAYER_NAME,
  INITIAL_KARMA,
  INITIAL_ENERGY,
  INITIAL_STRESS,
  KARMA_HIGH_THRESHOLD,
  KARMA_LOW_THRESHOLD,
  PLAYER_GLB_TARGET_VISUAL_METERS,
  PLAYER_VISUAL_HEIGHT_FALLBACK_M,
  PLAYER_FEET_SPAWN_Y,
  MAX_INVENTORY_SLOTS,
  AUTO_SAVE_INTERVAL_MS,
  DEFAULT_SKILLS,
} from './constants';

// Story & dialogue nodes: use getStoryNodes() / getDialogueNodes() from './gameDataLoader'.
// Do NOT re-export STORY_NODES / DIALOGUE_NODES — eager merge defeats lazy narrative packs.

// NPCs
export { NPC_DEFINITIONS } from './npcDefinitions';
export {
  ALL_NPC_DEFINITIONS,
  ALL_NPC_IDS,
  NPC_BY_ID,
  NPC_BY_DIALOGUE_NODE,
  NPCS_BY_FACTION,
  findNpcById,
  findNpcByName,
  findNpcByDialogueNodeId,
  findNpcByQuestId,
  resolveNpcIdFromSpeaker,
} from './allNpcDefinitions';
export { EXPANDED_NPCS, EXPANDED_NPC_BARK_TEXTS, EXPANDED_NPC_QUEST_LINKS } from './expandedNPCs';

// Quests
export { QUEST_DEFINITIONS } from './quests';

// Poems
export { POEMS } from './poems';

// Golden path
export {
  GOLDEN_PATH_STORY_SPINE,
  GOLDEN_PATH_BRANCH_HINTS,
  STORY_NODE_GUIDANCE,
  GOLDEN_PATH_QUEST_SPINE,
  ACT1_SOLNYSH_QUEST_SPINE,
} from './goldenPath';

// Trigger zones
export { TRIGGER_ZONES } from './triggerZones';
export type { TriggerZone } from './triggerZones';

// NPC schedules
export { NPC_SCHEDULES, NPC_SCHEDULES_MAP } from './npcSchedules';
export type { NPCSchedule } from './npcSchedules';

// Weather effects
export {
  WEATHER_EFFECTS,
  WEATHER_EFFECT_CLEAR,
  WEATHER_EFFECT_RAIN,
  WEATHER_EFFECT_SNOW,
  WEATHER_EFFECT_FOG,
  WEATHER_EFFECT_STORM,
  determineWeatherType,
  getWeatherEffect,
} from './weatherEffects';
export type { WeatherType, WeatherEffect } from './weatherEffects';

// Perks
export {
  PERKS,
  PERKS_MAP,
  PERKS_BY_CATEGORY,
  PERK_CATEGORY_META,
} from './perks';
export type { PerkCategory, PerkDefinition, PerkEffect, PerkCategoryMeta } from './perks';

// Daily Missions
export {
  DAILY_MISSION_POOL,
  DAILY_MISSION_CATEGORY_META,
  getDailyMissionPool,
  getWeeklyMissionPool,
  getDaySeed,
  getWeekSeed,
  getDailyMissionById,
} from './dailyMissions';
export type { DailyMission, DailyMissionCategory, DailyMissionDifficulty, DailyMissionResetSchedule, DailyMissionObjective } from './dailyMissions';

// NPC Gift Preferences & Affinity
export {
  NPC_GIFT_PREFERENCES,
  NPC_AFFINITY_LEVELS,
  getNPCGiftPreference,
  getItemPreference,
  getAffinityChange,
  getGiftXpReward,
  getAffinityLevel,
  getGiftReactionText,
  getGiftPreferenceColor,
  getGiftPreferenceBg,
  getGiftPreferenceGlow,
  getGiftPreferenceIcon,
} from './npcGifts';
export type { NPCGiftPreference, NPCAffinityLevel, GiftPreference } from './npcGifts';

// Ambient Sounds
export {
  AMBIENT_SOUNDS,
  getAmbienceForScene,
  getAmbientTransitionDuration,
  resolveAmbienceForScene,
  getAmbientSoundDef,
  getAmbienceAccessibilityText,
  getPlaybackAmbientDef,
  applyWeatherAmbienceOverride,
  validateAmbientSoundDefs,
  validateSceneAmbienceCoverage,
} from './ambientSounds';
export type {
  AmbientSoundType,
  AmbientSoundDef,
  SceneAmbience,
  SceneAmbienceConfig,
  AmbienceResolveOptions,
  ResolvedSceneAmbience,
} from './ambientSounds';

// Status Effects
export {
  STATUS_EFFECTS,
  getStatusEffectById,
} from './statusEffects';
export type { StatusEffectType, StatusEffectCategory, StatusEffectDef } from './statusEffects';
