/* ─── Volodka RPG – shared game types ─── */

import type { FloorMaterial } from './sceneDefinition';
import type { SceneId } from '@/config/sceneDefinitions';

export type { SceneId };

// ─── Skills ───
export interface PlayerSkills {
  logic: number;
  coding: number;
  empathy: number;
  persuasion: number;
  intuition: number;
  writing: number;
  rhythm: number;
}

export type TrainablePlayerSkill = keyof PlayerSkills;

/** Dialogue/story skill gate; difficulty validated as integer 1–20 at runtime. */
export interface MinSkillCheck {
  skill: TrainablePlayerSkill;
  difficulty: number;
}

// ─── Karma ───
export type KarmaLevel = 'low' | 'mid' | 'high';

// ─── Items ───
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
  stackable: boolean;
  quantity: number;
  category: 'key' | 'consumable' | 'misc' | 'quest' | 'equipment';
}

// ─── Equipment Slots ───
export type EquipmentSlot = 'head' | 'body' | 'accessory';

// ─── Linked Content (for books that open poems/lore) ───
export interface LinkedContent {
  type: 'poem' | 'lore';
  id: string;
}

// ─── Scene / Location ───
// SceneId is derived from SCENE_DEFINITIONS in @/config/sceneDefinitions (re-exported above).

// ─── Scene Exit ───
export type ExitDirection = 'north' | 'south' | 'east' | 'west' | 'door';

export interface SceneExit {
  targetScene: SceneId;
  label: string;
  spawnAt: [number, number, number];
  /** World-space position of the exit indicator in the current scene */
  position: [number, number, number];
  /** Optional flag that must be set for this exit to be active (story-gated) */
  requiredFlag?: string;
  /** Optional karma range requirement */
  minKarma?: number;
  maxKarma?: number;
}

export interface SceneConfig {
  id: SceneId;
  name: string;
  size: [number, number]; // [width, depth]
  spawnPoint: [number, number, number];
  initialRotation: number;
  /** Walkable floor height — RigidBody Y when grounded (feet level). */
  floorY: number;
  explorationCharacterModelScale: number;
  explorationLocomotionScale: number;
  hasCeiling: boolean;
  /** Floor surface material for footstep sounds */
  floorMaterial: FloorMaterial;
  fogNear?: number;
  fogFar?: number;
  ambientColor?: string;
  ambientIntensity?: number;
  groundColor?: string;
  /** Exits / doors leading to other scenes */
  exits?: SceneExit[];
  /** Scene-specific point lights for atmospheric lighting */
  lights?: Array<{
    position: [number, number, number];
    intensity: number;
    color: string;
    distance: number;
  }>;
  /** Transition style used when entering this scene from another */
  transitionStyle?: 'wipe' | 'flash' | 'darken' | 'ripple' | 'dissolve';
}

// ─── Story / Narrative ───
export type GameMode = 'exploration';

/** Legacy save/migration phase names — not stored on live game mode. */
export type LegacyGamePhase = 'menu' | 'intro' | 'exploration' | 'cutscene' | 'combat';

export type StoryEffectType =
  | 'addStat'
  | 'addSkill'
  | 'addItem'
  | 'removeItem'
  | 'setFlag'
  | 'addKarma'
  | 'addXp'
  | 'addCredits'
  | 'npcChange'
  | 'triggerQuest'
  | 'collectPoem'
  | 'discoverLore'
  | 'combat'
  | 'transitionScene';

export interface StoryEffect {
  type: StoryEffectType;
  stat?: string;
  value?: number;
  skill?: TrainablePlayerSkill;
  itemId?: string;
  flag?: string;
  flagValue?: boolean;
  npcId?: string;
  npcChange?: { relation?: number };
  questId?: string;
  poemId?: string;
  /** Lore entry ID(s) to discover — can be a single ID or comma-separated list */
  loreId?: string;
  /** Enemy type for combat trigger (e.g. 'system_daemon') */
  enemyType?: string;
  /** Target scene for transitionScene effect */
  sceneId?: SceneId;
}

// ─── Game Effect (reusable for triggers) ───
export type GameEffect = StoryEffect;

/** Shared gate for story and dialogue choices. */
export interface ChoiceCondition {
  minKarma?: number;
  maxKarma?: number;
  minSkill?: Partial<PlayerSkills>;
  /** Probabilistic skill gate; difficulty is validated as integer 1–20 at runtime. */
  minSkillCheck?: MinSkillCheck;
  flag?: string;
  /** G11: Minimum NPC relationship level required to see this choice */
  minNpcRelation?: number;
  /** Minimum act required to see this choice (1 or 2) */
  requiredAct?: number;
  /** G14: Time-of-day range when this choice is visible (hour: 0-24) */
  minTimeOfDay?: number;
  /** G14: Time-of-day upper bound (hour: 0-24) */
  maxTimeOfDay?: number;
}

export interface StoryChoice {
  text: string;
  next: string | null;
  effects?: StoryEffect[];
  condition?: ChoiceCondition;
  /** Marks the canonical golden-path edge from this node (used to derive story spine). */
  goldenPath?: boolean;
}

export type StoryGuidanceObjectiveType =
  | 'talk_to_npc'
  | 'visit_location'
  | 'complete_quest'
  | 'collect_item'
  | 'make_choice';

export interface StoryNode {
  id: string;
  text: string;
  speaker?: string;
  sceneId: SceneId;
  choices: StoryChoice[];
  effects?: StoryEffect[];
  poemId?: string;
  cutsceneId?: string;
  /** Player-facing guidance hint for this step (replaces manual GOLDEN_PATH_BRANCH_HINTS entry). */
  guidanceHint?: string;
  /** NPC id for guidance HUD when this step is an NPC beat. */
  guidanceNpcId?: string;
  /** Human-readable location label for guidance HUD. */
  guidanceSceneLabel?: string;
  guidanceObjectiveType?: StoryGuidanceObjectiveType;
  /** Marks the entry node for an act (optional — ACT_TRANSITIONS remains fallback). */
  actEntry?: number;
}

// ─── Dialogue ───
export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  effects?: StoryEffect[];
  /** Sync 3D scene when this exploration dialogue opens */
  sceneId?: SceneId;
}

export interface DialogueChoice {
  text: string;
  next: string | null;
  effects?: StoryEffect[];
  condition?: ChoiceCondition;
}

// ─── NPC ───
export type NPCHeadAccessory = 'none' | 'glasses' | 'hat' | 'scarf' | 'earring';
export type NPCSilhouette = 'slim' | 'average' | 'heavy';

export interface NPCAppearance {
  /** Primary body/clothing color (hex string) */
  bodyColor: string;
  /** Accent color for details (hex string) */
  accentColor: string;
  /** Head accessory type */
  headAccessory: NPCHeadAccessory;
  /** Height scale multiplier (0.9–1.15) */
  height: number;
  /** Emissive glow color for aura */
  glowColor: string;
  /** Body width type */
  silhouette: NPCSilhouette;
}

export interface NPCDefinition {
  id: string;
  name: string;
  modelPath?: string;
  scale?: number;
  animations?: { idle?: string; walk?: string; talk?: string };
  defaultPosition: [number, number, number];
  defaultRotation?: number;
  patrolRadius?: number;
  patrolWaypoints?: [number, number, number][];
  dialogueNodeId?: string;
  scheduleId?: string;
  description?: string;
  barkTexts?: { hostile: string; neutral: string; friendly: string };
  /** Visual appearance customization (color, accessories, glow, etc.) */
  appearance?: NPCAppearance;
}

export interface NPCRelation {
  npcId: string;
  value: number; // 0-100
}

// ─── Quests ───
export type QuestType = 'main' | 'side' | 'hidden' | 'daily';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'location_visited' | 'npc_talked' | 'item_collected' | 'poem_collected' | 'flag_set' | 'minigame_completed' | 'custom';
  target?: string;
  completed: boolean;
  /** If set, this objective can be bypassed by using the specified poem power */
  poemPowerBypass?: string;
  /** Hint text shown when poemPowerBypass is available */
  poemPowerHint?: string;
}

export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  act?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  faction?: string;
  questType: QuestType;
  difficulty?: QuestDifficulty;
  /** Short hint/clue for the current objective */
  hint?: string;
  objectives: QuestObjective[];
  rewards?: StoryEffect[];
  linkedStoryNodeId?: string;
  /** Additional story nodes that also map to this quest (renamed nodes, branch variants) */
  linkedStoryNodeIds?: string[];
  /** Quest IDs that must be completed before this quest can activate */
  requiresQuests?: string[];
  /** Optional time limit in in-game hours. Quest fails if not completed in time. */
  timeLimitHours?: number;
  /** Whether this quest can be retried after failing */
  canRetry?: boolean;
  /** Flag that must be set for this quest to become available */
  requiredFlag?: string;
  /** NPC ID that gives this quest (used for quest indicators above NPCs) */
  questGiverNpcId?: string;
  /** Explicit order on the main quest golden spine (lower = earlier). */
  spineOrder?: number;
  /** Items given as rewards when quest is completed */
  rewardItems?: { itemId: string; quantity: number }[];
}

export type QuestStatus = 'inactive' | 'active' | 'completed' | 'failed';

export interface QuestState {
  questId: string;
  status: QuestStatus;
  objectives: Record<string, boolean>;
  /** In-game hour when quest was activated (for time limit tracking) */
  startedAtTime?: number;
}

// ─── Poems ───
export interface Poem {
  id: string;
  title: string;
  author: string;
  lines: string[];
  themes: string[];
  unlocksAt: string; // storyNodeId where this poem is revealed
  order: number; // Display / narrative order
  intro?: string; // Проза-интро перед стихом
  subtitle?: string; // Подзаголовок стиха
  bonus?: boolean;
}

// ─── Interaction Types ───
export type InteractionType =
  | 'examine'     // "E — Осмотреть"
  | 'read'        // "E — Прочитать"
  | 'take'        // "E — Взять"
  | 'hack'        // "E — Взломать"
  | 'open'        // "E — Открыть"
  | 'talk'        // "E — Поговорить"
  | 'use'         // "E — Использовать"
  | 'push'        // "E — Толкнуть"
  | 'default';    // "E — Взаимодействовать"

/** Data for the object examination panel */
export interface ExamineData {
  title: string;
  description: string;
  detailText: string;
  icon?: string;
}

// ─── Schedule ───
export interface ScheduleEntry {
  startHour: number;
  endHour: number;
  sceneId: SceneId;
  position: [number, number, number];
  activity: 'work' | 'read' | 'rest' | 'walk' | 'talk' | 'sleep';
}

// ─── Combat ───
export type EnemyType = 'system_daemon' | 'corporate_golem' | 'shadow_agent' | 'data_phantom' | 'code_inquisitor' | 'guild_enforcer' | 'data_wraith' | 'censor_drone' | 'poetry_hunter' | 'nexus_guardian' | 'void_echo';

export type CombatAction = 'attack' | 'defend' | 'poem_power' | 'flee';

export interface CombatEnemy {
  type: EnemyType;
  name: string;
  emoji: string;
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  /** Which stat this enemy targets */
  targetsStat: 'logic' | 'energy' | 'karma' | 'empathy';
  /** Loot table — item IDs this enemy can drop */
  lootTable: string[];
  /** XP reward on victory */
  xpReward: number;
  /** Special attack cooldown remaining (0 = ready) */
  specialCooldown: number;
}

/* ─── Buff / Debuff Duration System ─── */

export type BuffTarget = 'player' | 'enemy';

export interface CombatBuff {
  /** Unique instance id (e.g. "poem_1_167890") */
  id: string;
  /** Display name for combat log */
  name: string;
  /** Source that created this buff (poemId, enemy type, etc.) */
  source: string;
  /** Whether this is a beneficial or harmful effect */
  kind: 'buff' | 'debuff';
  /** Who this buff affects */
  target: BuffTarget;
  /** Turns remaining (decremented at start of affected target's turn) */
  duration: number;
  /** Effect data — interpreted by combat system */
  effect: BuffEffect;
}

export type BuffEffect =
  | { type: 'defense_reduction'; value: number }
  | { type: 'damage_multiplier'; value: number }
  | { type: 'damage_reduction'; value: number }
  | { type: 'skip_turn' }
  | { type: 'stat_drain'; stat: 'logic' | 'energy' | 'karma'; value: number }
  | { type: 'defense_boost'; value: number }
  | { type: 'attack_boost'; value: number }
  | { type: 'hp_drain_percent'; value: number } /* Цифровая лихорадка: enemy loses % HP per turn */
  | { type: 'silence_specials' } /* Завеса тишины: enemy can't use specials */
  | { type: 'defensive_verse' } /* Защитная строка: -30% damage taken */;

/* ─── Combat Side Effects (P0-2.6) ─── */

/** Side effects emitted by execute() functions that should be applied to the
 *  Zustand store after the combat state transition is computed.
 *  This decouples pure functional state transitions from imperative mutations. */
export type SideEffect =
  | { type: 'addEnergy'; value: number }
  | { type: 'addKarma'; value: number }
  | { type: 'addStress'; value: number }
  | { type: 'addSkill'; skill: string; value: number }
  | { type: 'addXp'; value: number }
  | { type: 'setCombatActive'; active: boolean }
  | { type: 'addPoemPower'; poemId: string };

/* ─── Enemy Special Attacks ─── */

export interface EnemySpecialAttack {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description shown in combat log */
  description: string;
  /** Chance to use when available (0–1) */
  chance: number;
  /** Minimum turns between uses */
  cooldown: number;
  /** Execute the special attack, returning updated state + optional side effects */
  execute: (state: CombatState, enemy: CombatEnemy) => CombatState;
}

export interface CombatReward {
  xp: number;
  karma: number;
  credits: number;
  /** Item IDs dropped by the enemy */
  lootItems: string[];
  /** Skill experience gains: skill -> xp amount */
  skillXp: Partial<Record<TrainablePlayerSkill, number>>;
}

export interface CombatState {
  enemy: CombatEnemy;
  playerHp: number;
  playerMaxHp: number;
  turn: number;
  isPlayerTurn: boolean;
  playerDefending: boolean;
  enemyDefending: boolean;
  log: CombatLogEntry[];
  status: 'active' | 'victory' | 'defeat' | 'fled';
  /** Poem powers cooldowns: poemId → turns remaining (0 = available) */
  powerCooldowns: Record<string, number>;
  /** Defense reduction applied to enemy (from poem_1 Правда Глас) */
  enemyDefenseReduction: number;
  /** Double attack active (from poem_6 Слово Мощь) */
  doubleAttack: boolean;
  /** Active buffs/debuffs with duration */
  buffs: CombatBuff[];
  /** Number of failed flee attempts this combat (cumulative +15% per attempt) */
  fleeAttempts: number;
  /** Counter for generating unique buff ids */
  _nextBuffId: number;
  /** Side effects to apply to the Zustand store after computing state transition.
   *  Consumed and cleared by the calling code — never persists in stored state. */
  _sideEffects?: SideEffect[];

   /* ── Enhanced Combat: Combo System ── */
  /** Current combo count (consecutive attacks without taking damage) */
  comboCount: number;
  /** Maximum combo achieved this combat (for scoring) */
  maxCombo: number;

  /* ── Enhanced Combat: Critical Hits ── */
  /** Whether the last attack was a critical hit (for UI animation) */
  lastCritical: boolean;

  /* ── Enhanced Combat: Combat Rewards ── */
  /** Rewards earned on victory (set when combat ends) */
  rewards?: CombatReward;

  /* ── Enhanced Combat: Poem Power Combo Tracking ── */
  /** IDs of the last two poem powers used, for combo detection */
  lastPoemPowersUsed: [string | null, string | null];
}

export interface CombatLogEntry {
  turn: number;
  text: string;
  type: 'player_attack' | 'enemy_attack' | 'enemy_special' | 'player_defend' | 'player_power' | 'player_flee' | 'info' | 'victory' | 'defeat' | 'buff_expire' | 'critical_hit' | 'combo_hit' | 'status_effect' | 'poem_combo';
  damage?: number;
  /** Whether this was a critical hit */
  isCritical?: boolean;
  /** Current combo count at the time of this log entry */
  comboCount?: number;
}

// ─── Daily Missions ───
export interface AcceptedDailyMission {
  missionId: string;
  acceptedAt: number; // timestamp
  progress: Record<string, number>; // objectiveId -> current count
  completed: boolean;
  claimed: boolean; // reward claimed?
}

// ─── Progression ───
export type SkillBranch = 'technical' | 'social' | 'spiritual';

export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  branch: SkillBranch;
  tier: number; // 1-5
  /** Skills required before this can be unlocked */
  requires: string[];
  /** Effect description for UI */
  effect: string;
}

export interface PlayerProgression {
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  /** Set of unlocked skill tree node IDs */
  unlockedSkills: string[];
  /** Current act (1 or 2) — gates late-game content */
  currentAct: number;
  /** Perk points — gained every 3 levels (3, 6, 9, etc.) */
  perkPoints: number;
  /** IDs of acquired perks */
  unlockedPerks: string[];
}

// ─── Player State ───
export interface PlayerState {
  name: string;
  skills: PlayerSkills;
  karma: number; // 0-100
  energy: number; // 0-100
  stress: number; // 0-100
  credits: number; // credits (кредиты) — the underground digital currency
  inventory: InventoryItem[];
  equippedItems: Record<EquipmentSlot, InventoryItem | null>;
  flags: Record<string, boolean>;
  visitedNodes: string[];
  choiceLog: string[];
  moralChoices: string[];
  interactions: string[];
  progression: PlayerProgression;
}

// ─── Exploration State ───
export interface ExplorationState {
  currentSceneId: SceneId;
  playerPosition: [number, number, number];
  playerRotation: number;
  timeOfDay: number; // 0-24
  npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>;
  weatherEnabled: boolean;
  rainIntensity: number;
}

// ─── Game State ───
export interface GameState {
  mode: GameMode;
  currentNodeId: string;
  playerState: PlayerState;
  exploration: ExplorationState;
  quests: QuestState[];
  collectedPoems: string[];
  tutorialFlags: {
    tutorial_seen_movement: boolean;
    tutorial_seen_interact: boolean;
    tutorial_seen_controls: boolean;
    tutorialsDisabled: boolean;
    tutorialsCompleted: boolean;
  };
  lastSaveTimestamp: number | null;
}

// ─── Weather (for events) ───
export type EventWeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm';

// EventMap / CameraWaypointData: import from '@/engine/events' (no re-export here — avoids cycle).
