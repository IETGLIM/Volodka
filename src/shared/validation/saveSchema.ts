/* ─── Volodka RPG – Save file Zod validation schema ─── */
/* Validates the structure of save data loaded from localStorage.
 * Replaces raw JSON.parse + ?? fallbacks with proper runtime type checking,
 * providing clear error messages when save files are corrupted or outdated. */

import { z } from 'zod';
import { SCENE_IDS } from '@/config/sceneDefinitions';
import { sanitizeExplorationSceneId } from '@/config/scenes';
import { MAX_STORY_ACT } from '@/data/constants';
import type { SceneId } from '@/shared/types/game';
import { migrateSave } from './saveMigrations';

/* ─── Constants ─── */

/**
 * Current save format version — bump when adding a migrator in saveMigrations.ts.
 * Load path: migrateSave → Zod validate (see validateSaveData).
 */
export const SAVE_VERSION = 3;

/* ─── Primitive helpers ─── */

const boundedNumber = (min: number, max: number) =>
  z.number().min(min).max(max);

/* ─── Sub-schemas ─── */

const PlayerSkillsSchema = z.object({
  logic: z.number().min(0),
  coding: z.number().min(0),
  empathy: z.number().min(0),
  persuasion: z.number().min(0),
  intuition: z.number().min(0),
  writing: z.number().min(0),
  rhythm: z.number().min(0).optional().default(5),
});

const PlayerProgressionSchema = z.object({
  level: z.number().int().min(1),
  xp: z.number().min(0),
  xpToNextLevel: z.number().min(1),
  skillPoints: z.number().int().min(0),
  unlockedSkills: z.array(z.string()),
  /** Current act (1–MAX_STORY_ACT) — gates late-game content */
  currentAct: z.number().int().min(1).max(MAX_STORY_ACT).optional().default(1),
  /** Perk points — gained every 3 levels */
  perkPoints: z.number().int().min(0).optional().default(0),
  /** IDs of acquired perks */
  unlockedPerks: z.array(z.string()).optional().default([]),
});

const NonStackableInventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string().optional(),
  stackable: z.literal(false),
  quantity: z.literal(1),
  category: z.enum(['key', 'consumable', 'misc', 'quest', 'equipment']),
});

const StackableInventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string().optional(),
  stackable: z.literal(true),
  quantity: z.number().int().min(1),
  category: z.enum(['key', 'consumable', 'misc', 'quest', 'equipment']),
});

const InventoryItemSchema = z.discriminatedUnion('stackable', [
  NonStackableInventoryItemSchema,
  StackableInventoryItemSchema,
]);

const EquippedItemsSchema = z.object({
  head: InventoryItemSchema.nullable(),
  body: InventoryItemSchema.nullable(),
  legs: InventoryItemSchema.nullable().optional().default(null),
  feet: InventoryItemSchema.nullable().optional().default(null),
  hands: InventoryItemSchema.nullable().optional().default(null),
  accessory: InventoryItemSchema.nullable(),
});

const PlayerStateSchema = z.object({
  name: z.string().min(1),
  skills: PlayerSkillsSchema,
  karma: boundedNumber(0, 100),
  energy: boundedNumber(0, 100),
  stress: boundedNumber(0, 100),
  /** Credits (кредиты) — the underground digital currency */
  credits: z.number().min(0).optional().default(100),
  inventory: z.array(InventoryItemSchema),
  equippedItems: EquippedItemsSchema,
  flags: z.record(z.string(), z.boolean()),
  visitedNodes: z.array(z.string()),
  visitedNodeTimestamps: z.record(z.string(), z.number()).optional().default({}),
  choiceLog: z.array(z.string()),
  moralChoices: z.array(z.string()),
  interactions: z.array(z.string()),
  progression: PlayerProgressionSchema,
  rngSeed: z.number().int().min(0).optional(),
  combatEncounterSeq: z.number().int().min(0).optional().default(0),
});

/** Derived from SCENE_DEFINITIONS — stays in sync with scene registry. */
const SceneIdSchema = z.enum(SCENE_IDS as [string, ...string[]]);

const NpcPositionSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  sceneId: SceneIdSchema,
});

export type SaveNpcPosition = {
  position: [number, number, number];
  sceneId: SceneId;
};

/** Validate one NPC save entry; strips unknown fields and rejects invalid shapes. */
export function validateNpcState(value: unknown): SaveNpcPosition | null {
  const result = NpcPositionSchema.safeParse(value);
  if (!result.success) return null;
  return {
    position: result.data.position,
    sceneId: sanitizeExplorationSceneId(result.data.sceneId),
  };
}

/** Build store-safe npcStates; drops entries that fail per-field validation. */
export function parseNpcStatesFromSave(
  raw: Record<string, unknown>,
): Record<string, SaveNpcPosition> {
  return Object.fromEntries(
    Object.entries(raw).flatMap(([npcId, value]) => {
      const state = validateNpcState(value);
      return state ? [[npcId, state]] : [];
    }),
  );
}

const ExplorationStateSchema = z.object({
  currentSceneId: SceneIdSchema,
  playerPosition: z.tuple([z.number(), z.number(), z.number()]),
  playerRotation: z.number(),
  timeOfDay: boundedNumber(0, 24),
  npcStates: z.record(z.string(), NpcPositionSchema),
});

const QuestStatusSchema = z.enum(['inactive', 'active', 'completed', 'failed']);

const QuestStateSchema = z.object({
  questId: z.string().min(1),
  status: QuestStatusSchema,
  objectives: z.record(z.string(), z.boolean()),
  startedAtTime: z.number().optional(),
  hoursElapsed: z.number().min(0).optional(),
  startedAtWallMs: z.number().min(0).optional(),
});

const NPCRelationSchema = z.object({
  npcId: z.string().min(1),
  value: boundedNumber(0, 100),
});

const TutorialFlagsSchema = z.object({
  tutorial_seen_movement: z.boolean(),
  tutorial_seen_interact: z.boolean(),
  tutorial_seen_controls: z.boolean(),
  /** Added in sessions 3-4 — poem power tutorial */
  tutorial_seen_poem_power: z.boolean().optional().default(false),
  /** Added in session 5 — first combat tutorial */
  tutorial_seen_combat: z.boolean().optional().default(false),
  /** Added in session 6 — quest board tutorial */
  tutorial_seen_quest_board: z.boolean().optional().default(false),
  tutorialsDisabled: z.boolean(),
  tutorialsCompleted: z.boolean().optional().default(false),
});

const LoreCategorySchema = z.enum(['history', 'factions', 'technology', 'culture', 'mysteries']);

const LoreRaritySchema = z.enum(['common', 'uncommon', 'rare', 'legendary']);

const LoreEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: LoreCategorySchema.optional().default('history'),
  body: z.string(),
  sceneId: z.string(),
  discoveryScene: z.string().optional(),
  discoveryCondition: z.string().optional(),
  rarity: LoreRaritySchema.optional().default('common'),
  relatedEntries: z.array(z.string()).optional(),
  discovered: z.boolean(),
});

const ConversationLogEntrySchema = z.object({
  speaker: z.string(),
  text: z.string(),
  timestamp: z.number(),
});

/** Volodka's inner monologue entry — persisted so the journal survives reload. */
const ThoughtHistoryEntrySchema = z.object({
  id: z.string(),
  text: z.string(),
  timestamp: z.number(),
  sceneId: z.string(),
});

/** Notification log entry — persisted for journal history continuity. */
const NotificationHistoryEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  message: z.string(),
  delta: z.number().optional(),
  timestamp: z.number(),
});

const PoemPowerSchema = z.object({
  lastUsed: z.number(),
  cooldownMs: z.number().min(0),
});

const ActiveTTLFlagSchema = z.object({
  key: z.string().min(1),
  /** poemId — required since v1, optional for pre-v1 saves */
  poemId: z.string().optional().default(''),
  expiryTimestamp: z.number(),
});

const ActiveTTLFlagMapSchema = z.record(z.string(), ActiveTTLFlagSchema);

/** Accept legacy array saves; normalize to keyed map on load. */
const ActiveTTLFlagsSchema = z
  .union([z.array(ActiveTTLFlagSchema), ActiveTTLFlagMapSchema])
  .transform((value) => {
    if (Array.isArray(value)) {
      const map: Record<string, z.infer<typeof ActiveTTLFlagSchema>> = {};
      for (const flag of value) {
        map[flag.key] = flag;
      }
      return map;
    }
    return value;
  });

/** Unlocked achievement entry with timestamp */
const UnlockedAchievementSchema = z.object({
  id: z.string().min(1),
  unlockedAt: z.number(),
});

/** Persisted achievement tracking data (survives page refresh) */
const AchievementProgressSchema = z.object({
  visitedScenes: z.array(z.string()).optional().default([]),
  combatVictories: z.number().min(0).optional().default(0),
  consecutiveVictories: z.number().min(0).optional().default(0),
  maxComboAchieved: z.number().min(0).optional().default(0),
  hasCriticalHit: z.boolean().optional().default(false),
  defeatedEnemyTypes: z.array(z.string()).optional().default([]),
  nightTimeHours: z.number().min(0).optional().default(0),
  poemPowerUsedInCombat: z.boolean().optional().default(false),
  goodKarmaStreak: z.number().min(0).optional().default(0),
  badKarmaStreak: z.number().min(0).optional().default(0),
});

const LegacyGameModeSchema = z.enum([
  'menu',
  'intro',
  'exploration',
  'cutscene',
  'combat',
]);

const GameModeSchema = z.literal('exploration');

const JournalTabSchema = z.enum(['notes', 'skills', 'poems', 'lore', 'thoughts', 'cabinet', 'clothing', 'statistics']);

/* ─── Full save payload schema ─── */
/* When adding a persisted field: extend this schema, then add its default in
 * store/persistedState.ts → createDefaultPersistedState().
 * saveGame/loadGame derive field lists from SavePayloadSchema automatically. */

export const SavePayloadSchema = z.object({
  /** Save format version for future migration support */
  saveVersion: z.number().int().optional().default(SAVE_VERSION),

  /** Stored as `'exploration'` in new saves; legacy phase values migrated on load. */
  mode: z.union([GameModeSchema, LegacyGameModeSchema]).optional().default('exploration'),
  mainMenuOpen: z.boolean().optional(),
  introActive: z.boolean().optional(),
  combatActive: z.boolean().optional(),
  currentNodeId: z.string().min(1),
  playerState: PlayerStateSchema,
  exploration: ExplorationStateSchema,
  quests: z.array(QuestStateSchema),
  collectedPoems: z.array(z.string()),
  npcRelations: z.array(NPCRelationSchema),
  tutorialFlags: TutorialFlagsSchema,
  interactiveObjectStates: z.record(z.string(), z.boolean()),
  loreEntries: z.array(LoreEntrySchema),
  conversationLog: z.record(z.string(), z.array(ConversationLogEntrySchema)),
  /** Volodka's inner monologue history (journal → thoughts tab) — persisted. */
  thoughtHistory: z.array(ThoughtHistoryEntrySchema).optional().default([]),
  /** Thought Cabinet: acquired thought ids (Disco Elysium internal-voices). Persisted —
   *  was previously dropped on save/load (CRITICAL data loss: equipped thought bonuses
   *  vanished after reload, breaking combat balance + narrative choices). */
  acquiredThoughtIds: z.array(z.string()).optional().default([]),
  /** Thought Cabinet: currently equipped thought ids (max MAX_EQUIPPED_THOUGHTS). Persisted. */
  equippedThoughtIds: z.array(z.string()).optional().default([]),
  /** Notification log history — persisted for journal continuity. */
  notificationHistory: z.array(NotificationHistoryEntrySchema).optional().default([]),
  poemPowers: z.record(z.string(), PoemPowerSchema),
  activeTTLFlags: ActiveTTLFlagsSchema,
  journalTab: JournalTabSchema,
  weatherEnabled: z.boolean(),
  rainIntensity: boundedNumber(0, 1),
  musicEnabled: z.boolean(),
  musicVolume: boundedNumber(0, 1),
  introSeen: z.boolean().optional().default(false),
  /** Whether the story overlay is currently shown (P5-FIX: was missing, caused mid-chain save loss) */
  showStoryOverlay: z.boolean().optional().default(false),
  narrativeKind: z.enum(['story', 'dialogue']).nullable().optional().default(null),
  /** Achievement IDs that have been unlocked, with timestamps */
  unlockedAchievements: z.array(UnlockedAchievementSchema).optional().default([]),
  /** Scene IDs that have been visited/discovered */
  discoveredScenes: z.array(z.string()).optional().default(['volodka_room']),
  /** Cutscene IDs that have already played (prevents re-triggering on load) */
  triggeredCutscenes: z.array(z.string()).optional().default([]),
  /** NPC affinity scores (gift system) */
  npcAffinity: z.record(z.string(), z.number()).optional().default({}),
  /** Accepted daily/weekly missions (P5-FIX: was missing from save payload) */
  acceptedDailyMissions: z.array(z.unknown()).optional().default([]),
  /** Timestamp of last daily mission reset */
  lastDailyReset: z.number().optional().default(0),
  /** Persisted achievement tracking data (survives page refresh) */
  achievementProgress: AchievementProgressSchema.optional().default({
    visitedScenes: [],
    combatVictories: 0,
    consecutiveVictories: 0,
    maxComboAchieved: 0,
    hasCriticalHit: false,
    defeatedEnemyTypes: [],
    nightTimeHours: 0,
    poemPowerUsedInCombat: false,
    goodKarmaStreak: 0,
    badKarmaStreak: 0,
  }),
  /** Quick-use hotbar: 4 slots with item IDs (null = empty) */
  hotbarSlots: z.tuple([z.string().nullable(), z.string().nullable(), z.string().nullable(), z.string().nullable()]).optional().default([null, null, null, null]),
  /** Persisted inventory sort preference */
  inventorySortOption: z.string().optional().default('name'),
  /** Persisted inventory filter preference */
  inventoryFilterCategory: z.string().optional().default('all'),
  savedAt: z.number(),
  /** Optional slot-manager metadata (not applied to game state) */
  playTimeSeconds: z.number().min(0).optional(),
});

/** Inferred TypeScript type from the Zod schema — matches the save payload shape */
export type SavePayload = z.infer<typeof SavePayloadSchema>;

/* ─── Validation result type (discriminated union for type safety) ─── */

export type SaveValidationResult =
  | { success: true; data: SavePayload }
  | { success: false; error: string };

/* ─── Validation function ─── */

/**
 * Validates a raw JSON string from localStorage against the save schema.
 *
 * Pipeline: JSON.parse → migrateSave (versioned) → Zod safeParse.
 * Returns `{ success: true, data }` on valid saves,
 * or `{ success: false, error }` with a human-readable message on failure.
 */
export function validateSaveData(raw: string): SaveValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      success: false,
      error: 'Сохранение повреждено: не удалось прочитать JSON-данные.',
    };
  }

  const migrated = migrateSave(parsed, SAVE_VERSION);
  if (!migrated.success) {
    return { success: false, error: migrated.error };
  }

  const result = SavePayloadSchema.safeParse(migrated.data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into a readable message
  const issues = result.error.issues;
  const errorParts = issues.slice(0, 5).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });

  const summary =
    issues.length <= 5
      ? errorParts.join('; ')
      : `${errorParts.join('; ')}; ...и ещё ${issues.length - 5} ошибок`;

  return {
    success: false,
    error: `Сохранение повреждено: ${summary}`,
  };
}