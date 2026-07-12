import type { AudioEvents } from './audioEvents';
import type { UiEvents } from './uiEvents';
import type { ExplorationEvents } from './explorationEvents';
import type { QuestEvents } from './questEvents';
import type { PlayerEvents } from './playerEvents';
import type { GameLifecycleEvents } from './gameLifecycleEvents';
import type { NpcEvents } from './npcEvents';
import type { InteractionEvents } from './interactionEvents';
import type { SceneEvents } from './sceneEvents';
import type { MinigameEvents } from './minigameEvents';
import type { FxEvents } from './fxEvents';
import type { PoemEvents } from './poemEvents';
import type { CameraEvents } from './cameraEvents';
import type { IntroEvents } from './introEvents';
import type { CombatEvents } from './combatEvents';
import type { WeatherEvents } from './weatherEvents';
import type { LoreEvents } from './loreEvents';
import type { CutsceneEvents } from './cutsceneEvents';
import type { AchievementEvents } from './achievementEvents';
import type { CraftingEvents } from './craftingEvents';
import type { PhotoEvents } from './photoEvents';
import type { WorldEvents } from './worldEvents';
import type { StoryEvents } from './storyEvents';
import type { AccessibilityEvents } from './accessibilityEvents';
import type { CinematicTimelineEvents } from './cinematicTimelineEvents';

export type { MergeEventMaps, DomainEventKeys } from './merge';
export type { AudioEvents } from './audioEvents';
export type { UiEvents } from './uiEvents';
export type { ExplorationEvents } from './explorationEvents';
export type { QuestEvents } from './questEvents';
export type { PlayerEvents } from './playerEvents';
export type { GameLifecycleEvents } from './gameLifecycleEvents';
export type { NpcEvents } from './npcEvents';
export type { InteractionEvents } from './interactionEvents';
export type { SceneEvents } from './sceneEvents';
export type { MinigameEvents } from './minigameEvents';
export type { FxEvents } from './fxEvents';
export type { PoemEvents } from './poemEvents';
export type { CameraEvents, CameraWaypointData } from './cameraEvents';
export type { IntroEvents } from './introEvents';
export type { CombatEvents } from './combatEvents';
export type { WeatherEvents } from './weatherEvents';
export type { LoreEvents } from './loreEvents';
export type { CutsceneEvents } from './cutsceneEvents';
export type { AchievementEvents } from './achievementEvents';
export type { CraftingEvents } from './craftingEvents';
export type { PhotoEvents, PhotoEventKey } from './photoEvents';
export type { WorldEvents } from './worldEvents';
export type { StoryEvents } from './storyEvents';
export type { AccessibilityEvents } from './accessibilityEvents';
export type { CinematicTimelineEvents } from './cinematicTimelineEvents';

export { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from './photoEvents';
export type { EmptyEventPayload } from './emptyPayload';
export { EMPTY_EVENT_PAYLOAD } from './emptyPayload';

/** Flat typed event map — single bus, domain-organized source. */
export type EventMap =
  AudioEvents &
  UiEvents &
  ExplorationEvents &
  QuestEvents &
  PlayerEvents &
  GameLifecycleEvents &
  NpcEvents &
  InteractionEvents &
  SceneEvents &
  MinigameEvents &
  FxEvents &
  PoemEvents &
  CameraEvents &
  IntroEvents &
  CombatEvents &
  WeatherEvents &
  LoreEvents &
  CutsceneEvents &
  AchievementEvents &
  CraftingEvents &
  PhotoEvents &
  WorldEvents &
  StoryEvents &
  AccessibilityEvents &
  CinematicTimelineEvents;

/** All registered event names on the singleton bus. */
export type EventName = keyof EventMap;

/** Registry of domain prefixes for DevPanel / documentation. */
export const EVENT_DOMAINS = {
  audio: 'sound',
  ui: 'ui',
  exploration: 'exploration',
  quest: 'quest',
  player: 'player',
  game: 'game',
  npc: 'npc',
  object: 'object',
  interaction: 'interaction',
  scene: 'scene',
  canvas: 'canvas',
  minigame: 'minigame',
  fx: 'fx',
  poem: 'poem',
  camera: 'camera',
  intro: 'intro',
  combat: 'combat',
  weather: 'weather',
  lore: 'lore',
  cutscene: 'cutscene',
  achievement: 'achievement',
  crafting: 'crafting',
  item: 'item',
  photo: 'photo',
  world: 'world',
  story: 'story',
  accessibility: 'accessibility',
  cinematic: 'cinematic',
  loot: 'loot',
  skill: 'skill',
  choice: 'choice',
  toast: 'toast',
  interact: 'interact',
} as const;
