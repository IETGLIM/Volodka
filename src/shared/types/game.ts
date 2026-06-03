/* ─── Volodka RPG – shared game types ─── */

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
export type SceneId =
  | 'volodka_room'
  | 'volodka_corridor'
  | 'home_evening'
  | 'street_night'
  | 'street_winter'
  | 'cafe_evening'
  | 'office_day'
  | 'park_day'
  | 'library_day'
  | 'battle'
  | 'sleep_dream'
  | 'rooftop_edge'
  | 'abandoned_factory'
  | 'zarema_albert_room';

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
  explorationCharacterModelScale: number;
  explorationLocomotionScale: number;
  hasCeiling: boolean;
  /** Floor surface material for footstep sounds — single source of truth.
   *  Type aligned with FloorMaterial from sceneDefinition.ts */
  floorMaterial: 'wood' | 'concrete' | 'metal' | 'carpet' | 'snow' | 'grass' | 'stone' | 'dream' | 'default';
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
export type GameMode = 'menu' | 'intro' | 'visual-novel' | 'exploration' | 'cutscene' | 'combat';

export type StoryEffectType =
  | 'addStat'
  | 'addSkill'
  | 'addItem'
  | 'removeItem'
  | 'setFlag'
  | 'addKarma'
  | 'addXp'
  | 'npcChange'
  | 'triggerQuest'
  | 'collectPoem'
  | 'discoverLore'
  | 'combat';

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
}

// ─── Game Effect (reusable for triggers) ───
export type GameEffect = StoryEffect;

export interface StoryChoice {
  text: string;
  next: string;
  effects?: StoryEffect[];
  condition?: {
    minKarma?: number;
    maxKarma?: number;
    minSkill?: Partial<PlayerSkills>;
    flag?: string;
    /** Minimum act required to see this choice (1 or 2) */
    requiredAct?: number;
  };
}

export interface StoryNode {
  id: string;
  text: string;
  speaker?: string;
  sceneId: SceneId;
  choices: StoryChoice[];
  effects?: StoryEffect[];
  poemId?: string;
  cutsceneId?: string;
}

// ─── Dialogue ───
export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  effects?: StoryEffect[];
}

export interface DialogueChoice {
  text: string;
  next: string | null;
  effects?: StoryEffect[];
  condition?: {
    minKarma?: number;
    maxKarma?: number;
    minSkill?: Partial<PlayerSkills>;
    minSkillCheck?: { skill: TrainablePlayerSkill; difficulty: number };
    flag?: string;
    /** G11: Minimum NPC relationship level required to see this choice */
    minNpcRelation?: number;
    /** Minimum act required to see this choice (1 or 2) */
    requiredAct?: number;
    /** G14: Time-of-day range when this choice is visible (hour: 0-24) */
    minTimeOfDay?: number;
    /** G14: Time-of-day upper bound (hour: 0-24) */
    maxTimeOfDay?: number;
  };
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
  act?: 1 | 2 | 3 | 4 | 5;
  faction?: string;
  questType: QuestType;
  difficulty?: QuestDifficulty;
  /** Short hint/clue for the current objective */
  hint?: string;
  objectives: QuestObjective[];
  rewards?: StoryEffect[];
  linkedStoryNodeId?: string;
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
export type EnemyType = 'system_daemon' | 'corporate_golem' | 'shadow_agent' | 'data_phantom' | 'code_inquisitor' | 'guild_enforcer' | 'data_wraith' | 'censor_drone' | 'poetry_hunter';

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
  | { type: 'setMode'; mode: string }
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

// ─── Events ───
export interface EventMap {
  'sound:play': { type: string };
  'ui:exploration_message': { text: string };
  'exploration:footstep': { position: [number, number, number]; yaw: number };
  'quest:accepted': { questId: string; questTitle: string };
  'quest:completed': { questId: string; npcId?: string };
  'quest:reward_applied': { questId: string; questTitle: string; xpGained: number; rewards: string[] };
  'quest:failed': { questId: string; reason: string };
  'quest:objective_updated': { questId: string; objectiveId: string };
  'quest:poem_bypass': { questId: string; objectiveId: string; poemId: string };
  'loot:reward': { itemId: string; name: string };
  'skill:level_up': { skill: TrainablePlayerSkill; level: number };
  'game:saved': { timestamp: number; source: 'auto' | 'manual' };
  'game:loaded': Record<string, never>;
  'npc:talked': { npcId: string; dialogueNodeId?: string };
  'object:interact': { objectId: string; sceneId: SceneId; triggerZoneId?: string };
  'object:highlight': { triggerZoneId: string; position: [number, number, number]; size: [number, number, number] };
  'skill:check': { skill: TrainablePlayerSkill; difficulty: number; success: boolean };
  'scene:transition': { targetScene: SceneId; spawnAt: [number, number, number] };
  'scene:enter': { sceneId: SceneId; fromSceneId: SceneId };
  'quest:complete_objective': { questId: string; objectiveId: string };
  'minigame:open': { gameType: string };
  'minigame:close': Record<string, never>;
  'minigame:complete': { gameType: string; success: boolean; reward?: StoryEffect[] };
  'fx:glitch': { intensity: number; duration: number };
  'poem:power_used': { poemId: string; powerName: string };
  'poem:power_expired': { flagKey: string; poemId: string; expiredAt: number };
  'interaction:start': { npcId: string };
  'interaction:state_change': { state: number; npcId?: string };
  'interaction:end': Record<string, never>;
  'interaction:hint': { label: string; key: string; description?: string; type: 'npc' | 'object' | 'exit' | 'item' };
  'player:stand_up': Record<string, never>;
  'npc:animation': { npcId: string; state: 'idle' | 'talk' | 'listen' | 'gesture' };
  'npc:interact_staged': { npcId: string };

  /* ── Mobile interact event (from virtual HUD button) ── */
  'interact:press': { source?: string };

  /* ── Canvas lifecycle events ── */
  'canvas:first-frame': Record<string, never>;
  'canvas:context-lost': Record<string, never>;

  /* ── Camera events ── */
  'camera:cutscene_start': { cutsceneId: string; waypoints: CameraWaypointData[] };
  'camera:cutscene_end': Record<string, never>;
  'camera:npc_cutscene_start': { npcId: string; waypoints: CameraWaypointData[] };
  'camera:npc_cutscene_end': { npcId: string };
  'camera:combat_impact': { intensity: number };
  'camera:combat_shake': { intensity: number };
  'camera:dialogue_speaker': { speaker: 'npc' | 'player' | 'narrator' | 'unknown' };
  'camera:scene_flythrough': { targetPos: [number, number, number]; targetLookAt: [number, number, number] };
  'camera:cinematic_transition': { phase: 'fadeOut' | 'hold' | 'fadeIn'; sceneId: SceneId };
  'camera:recenter': Record<string, never>;
  'camera:intro_wake': Record<string, never>;

  /* ── Combat events ── */
  'combat:start': { enemyType: EnemyType };
  'combat:turn': { turn: number; isPlayerTurn: boolean };
  'combat:action': { action: CombatAction; damage?: number };
  'combat:victory': { enemyType: EnemyType; xpGained: number; karmaGained: number; lootItemId?: string };
  'combat:defeat': { enemyType: EnemyType; energyLost: number; karmaLost: number };
  'combat:fled': { enemyType: EnemyType };
  'combat:end': Record<string, never>;
  'combat:hit': { damage: number; isPlayerHit: boolean; direction?: 'left' | 'right' | 'front' | 'back'; source?: string };
  /** Explicit damage number event for floating damage display */
  'combat:damage': { amount: number; source?: string; critical?: boolean };
  /** Explicit heal number event for floating heal display */
  'combat:heal': { amount: number; source?: string };
  /** G12: Emitted when returning to a story node after combat */
  'combat:story_continue': { nodeId: string };

  /* ── Weather events ── */
  'weather:rain': { active: boolean; intensity: number };
  'weather:snow': { active: boolean; intensity: number };
  'weather:changed': { weatherType: EventWeatherType; temperature: number; debuffs?: string[] };

  /* ── NPC gift events ── */
  'npc:gift': { npcId: string; itemId: string; preference: string; affinityChange: number };

  /* ── Choice reactivity events ── */
  'choice:made': { karmaChange: number; npcId?: string; relationChange?: number };

  /* ── Poem events ── */
  'poem:collected': { poemId: string };

  /* ── Lore discovery events ── */
  'lore:discovered': { id: string; title: string; rarity: string };

  /* ── Cutscene events ── */
  'cutscene:overlay': { text: string; subtitle?: string; accentColor: string; durationMs: number; type?: 'act_transition' | 'character_intro' | 'story_moment' | 'revelation'; letterboxStyle?: 'full' | 'thin' | 'none'; showEmbers?: boolean; glitchIntensity?: number };
  'cutscene:overlay_end': Record<string, never>;

  /* ── Game notification events ── */
  'game:notification': { title: string; subtitle?: string; type: 'combat' | 'scene' | 'achievement' | 'quest' | 'info' };

  /* ── Player level-up events ── */
  'player:levelup': { newLevel: number; prevLevel: number; perkPointGained?: boolean };

  /* ── Player heal events ── */
  'player:heal': { amount: number };

  /* ── Screen effect events ── */
  'fx:flash': { color: string; opacity: number; duration: number };
  'fx:shake': { intensity: number; duration: number };
  'fx:vignette': { intensity: number; duration: number };
  'fx:chromatic': { intensity: number; duration: number };
  'fx:slowmo': { duration: number };
  'fx:achievement': { title: string; description: string; icon?: string };
  'achievement:unlocked': { achievementId: string; title: string; description: string; icon: string; category: string };
  'fx:xp_gain': { amount: number; source?: string };
  'fx:stat_change': { stat: string; delta: number; type: 'positive' | 'negative' };

  /* ── Crafting discovery events ── */
  'crafting:discovered': { recipeId: string; recipeName: string; rarity: import('@/data/items').ItemRarity };
  'item:crafted': { recipeId: string; recipeName: string; category: string };

  /* ── Photo mode events ── */
  'photo:toggle': Record<string, never>;
  'photo:active': Record<string, never>;
  'photo:inactive': Record<string, never>;

  /* ── World Clock events ── */
  /** Emitted when the world clock ticks (time advances organically or via action) */
  'world:hour_changed': { hour: number; previousHour: number; npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }> };
  /** Emitted when the world clock performs a periodic tick */
  'world:tick': { hour: number; deltaHours: number };

  /* ── Guided Story events ── */
  /** Emitted when the player needs guidance (next objective) */
  'story:guidance_update': { objectiveText: string; objectiveType: 'talk_to_npc' | 'visit_location' | 'complete_quest' | 'collect_item' | 'make_choice'; targetId: string; urgency: 'optional' | 'recommended' | 'required'; actNumber: number; chapterTitle: string };
  /** Emitted when transitioning between acts */
  'story:act_transition': { fromAct: number; toAct: number; chapterTitle: string };
  /** Emitted when a new quest should be offered to the player */
  'story:quest_available': { questId: string; questTitle: string; questType: string; npcId?: string };
  /** Emitted when completing a golden path quest unlocks the next one in the chain */
  'story:quest_chain_unlock': {
    completedQuestId: string;
    completedQuestTitle: string;
    nextQuestId: string;
    nextQuestTitle: string;
    nextQuestType: string;
    npcId?: string;
    actNumber: number;
  };
}

/** Waypoint data for cutscene camera (serializable) */
export interface CameraWaypointData {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  duration: number;
  controlPoint?: [number, number, number];
}
