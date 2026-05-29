/* ─── Volodka RPG – Save file Zod validation schema ─── */
/* Validates the structure of save data loaded from localStorage.
 * Replaces raw JSON.parse + ?? fallbacks with proper runtime type checking,
 * providing clear error messages when save files are corrupted or outdated. */

import { z } from 'zod';

/* ─── Constants ─── */

/** Current save format version — bump when breaking changes are made */
export const SAVE_VERSION = 1;

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
});

const PlayerProgressionSchema = z.object({
  level: z.number().int().min(1),
  xp: z.number().min(0),
  xpToNextLevel: z.number().min(1),
  skillPoints: z.number().int().min(0),
  unlockedSkills: z.array(z.string()),
  /** Current act (1–5) — gates late-game content */
  currentAct: z.number().int().min(1).max(5).optional().default(1),
  /** Perk points — gained every 3 levels */
  perkPoints: z.number().int().min(0).optional().default(0),
  /** IDs of acquired perks */
  unlockedPerks: z.array(z.string()).optional().default([]),
});

const InventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string().optional(),
  stackable: z.boolean(),
  quantity: z.number().int().min(1),
  category: z.enum(['key', 'consumable', 'misc', 'quest', 'equipment']),
});

const EquippedItemsSchema = z.object({
  head: InventoryItemSchema.nullable(),
  body: InventoryItemSchema.nullable(),
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
  choiceLog: z.array(z.string()),
  moralChoices: z.array(z.string()),
  interactions: z.array(z.string()),
  progression: PlayerProgressionSchema,
});

const SceneIdSchema = z.enum([
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'street_night',
  'street_winter',
  'cafe_evening',
  'office_day',
  'park_day',
  'library_day',
  'battle',
  'sleep_dream',
  'rooftop_edge',
  'abandoned_factory',
  'zarema_albert_room',
]);

const NpcPositionSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  sceneId: SceneIdSchema,
});

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
});

const NPCRelationSchema = z.object({
  npcId: z.string().min(1),
  value: boundedNumber(0, 100),
});

const TutorialFlagsSchema = z.object({
  tutorial_seen_movement: z.boolean(),
  tutorial_seen_interact: z.boolean(),
  tutorial_seen_controls: z.boolean(),
  tutorialsDisabled: z.boolean(),
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

/** Unlocked achievement entry with timestamp */
const UnlockedAchievementSchema = z.object({
  id: z.string().min(1),
  unlockedAt: z.number(),
});

const AcceptedDailyMissionSchema = z.object({
  missionId: z.string().min(1),
  acceptedAt: z.number(),
  progress: z.record(z.string(), z.number()),
  completed: z.boolean(),
  claimed: z.boolean(),
});

const GameModeSchema = z.enum([
  'menu',
  'intro',
  'visual-novel',
  'exploration',
  'cutscene',
  'combat',
]);

const JournalTabSchema = z.enum(['notes', 'skills', 'poems', 'lore']);

/* ─── Full save payload schema ─── */

export const SavePayloadSchema = z.object({
  /** Save format version for future migration support */
  saveVersion: z.number().int().optional().default(SAVE_VERSION),

  mode: GameModeSchema,
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
  poemPowers: z.record(z.string(), PoemPowerSchema),
  activeTTLFlags: z.array(ActiveTTLFlagSchema),
  journalTab: JournalTabSchema,
  weatherEnabled: z.boolean(),
  rainIntensity: boundedNumber(0, 1),
  musicEnabled: z.boolean(),
  musicVolume: boundedNumber(0, 1),
  introSeen: z.boolean().optional().default(false),
  /** Achievement IDs that have been unlocked, with timestamps */
  unlockedAchievements: z.array(UnlockedAchievementSchema).optional().default([]),
  /** Scene IDs that have been visited/discovered */
  discoveredScenes: z.array(z.string()).optional().default(['volodka_room']),
  acceptedDailyMissions: z.array(AcceptedDailyMissionSchema).optional().default([]),
  lastDailyReset: z.number().optional().default(0),
  npcAffinity: z.record(z.string(), z.number()).optional().default({}),
  triggeredCutscenes: z.array(z.string()).optional().default([]),
  savedAt: z.number(),
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

  const result = SavePayloadSchema.safeParse(parsed);

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
