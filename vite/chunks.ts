/**
 * [VITE-8] Rolldown code splitting configuration.
 *
 * Replaces the old Rollup `manualChunks` function (removed in Vite 8).
 * Rolldown uses `build.rolldownOptions.output.codeSplitting.groups`
 * with `test` (regex or function), `name`, `priority`, `minSize`, `maxSize`.
 *
 * Migration from chunks.ts:
 * - Each `resolveManualChunk` case → a group with `test` regex + `name`
 * - `priority`: higher = matched first (like the early-return order in the old function)
 * - `minSize`: replaces `experimentalMinChunkSize` (5 KB)
 * - Rolldown auto-creates a `runtime.js` chunk when groups are used
 */

export interface CodeSplittingGroup {
  name: string;
  test: RegExp;
  priority: number;
  minSize?: number;
  maxSize?: number;
}

/** 5 KB — same as old experimentalMinChunkSize */
export const MIN_CHUNK_SIZE = 5 * 1024;

/**
 * Code splitting groups, ordered by priority (highest first).
 * Mirrors the exact chunk structure from the old chunks.ts manualChunks function.
 *
 * Priority semantics:
 * - 1000: vendor (node_modules) — highest priority, matched first
 * - 900: boot-shared (engine/three shared GPU modules)
 * - 800: engine combat/narrative/quest
 * - 700: game UI (panels, HUD, minigames)
 * - 600: scene visuals + canvas
 * - 500: data (story/dialogue/quests/poems/npc/world/mechanics)
 * - 100: default catch-all
 */
export const CODE_SPLITTING_GROUPS: CodeSplittingGroup[] = [
  // ── Vendor (priority 1000) ──
  {
    name: 'physics-wasm',
    test: /[\\/]node_modules[\\/]@dimforge[\\/]rapier/,
    priority: 1000,
  },
  {
    name: 'physics-r3f',
    test: /[\\/]node_modules[\\/]@react-three[\\/]rapier/,
    priority: 999,
  },
  {
    name: 'postfx',
    test: /[\\/]node_modules[\\/](postprocessing|@react-three[\\/]postprocessing)/,
    priority: 998,
  },
  {
    name: 'drei',
    test: /[\\/]node_modules[\\/]@react-three[\\/]drei/,
    priority: 997,
  },
  {
    name: 'r3f',
    test: /[\\/]node_modules[\\/]@react-three[\\/]fiber/,
    priority: 996,
  },
  {
    name: 'three-examples',
    test: /[\\/]node_modules[\\/]three[\\/]examples/,
    priority: 995,
  },
  {
    name: 'three',
    test: /[\\/]node_modules[\\/]three[\\/]/,
    priority: 994,
  },
  {
    name: 'vendor',
    test: /[\\/](react|react-dom|zustand|framer-motion|@radix-ui|lucide-react|recharts|cmdk|vaul|embla-carousel)[\\/]/,
    priority: 993,
  },

  // ── Boot shared (priority 900) ──
  {
    name: 'boot-shared',
    test: /[\\/]src[\\/]engine[\\/](performance[\\/]|visualSettings|three[\\/](moduleGeometryRegistry|moduleMaterialRegistry|disposeThreeResources|objectPool))/,
    priority: 900,
  },

  // ── Engine (priority 800) ──
  {
    name: 'engine-combat',
    test: /[\\/]src[\\/]engine[\\/](combat[\\/]|CombatSystem)/,
    priority: 800,
  },
  {
    name: 'engine-quest',
    test: /[\\/]src[\\/]engine[\\/]QuestTracker/,
    priority: 799,
  },
  {
    name: 'engine-narrative',
    test: /[\\/]src[\\/]engine[\\/]GuidedStoryManager/,
    priority: 798,
  },
  {
    name: 'content-validator',
    test: /[\\/]src[\\/]shared[\\/]validation[\\/]contentPipelineValidator/,
    priority: 797,
  },

  // ── Game UI (priority 700) ──
  {
    name: 'game-dev',
    test: /[\\/]src[\\/](components[\\/]game[\\/]DevPanel|engine[\\/]RendererInfoState|components[\\/]3d[\\/]RendererInfoBridge)/,
    priority: 700,
  },
  {
    name: 'game-ui-notification-toasts',
    test: /[\\/]src[\\/]components[\\/]game[\\/]NotificationToastsPanel/,
    priority: 699,
  },

  // ── Scene + Canvas (priority 600) ──
  {
    name: 'game-canvas',
    test: /[\\/]src[\\/]components[\\/]3d[\\/]RPGGameCanvas/,
    priority: 600,
  },
  {
    name: 'physics-scene',
    test: /[\\/]src[\\/]components[\\/]3d[\\/]PhysicsSceneInner/,
    priority: 599,
  },

  // ── Data (priority 500) ──
  {
    name: 'data-loader',
    test: /[\\/]src[\\/]data[\\/](gameDataLoader|narrative[\\/])/,
    priority: 500,
  },
  {
    name: 'data-golden-path',
    test: /[\\/]src[\\/]data[\\/](goldenPath|poemCollectionMeta)/,
    priority: 499,
  },
  {
    name: 'pack-chk-world',
    test: /[\\/]src[\\/]data[\\/]chkTolpa[\\/]triggerZones/,
    priority: 498,
  },
  {
    name: 'pack-chk-narrative',
    test: /[\\/]src[\\/]data[\\/]chkTolpa[\\/]/,
    priority: 497,
  },
  {
    name: 'data-story-pier',
    test: /[\\/]src[\\/]data[\\/]story[\\/]pierStory/,
    priority: 496,
  },
  {
    name: 'data-story-library',
    test: /[\\/]src[\\/]data[\\/]story[\\/]libraryStory/,
    priority: 495,
  },
  {
    name: 'data-story-factory',
    test: /[\\/]src[\\/]data[\\/]story[\\/]factoryStory/,
    priority: 494,
  },
  {
    name: 'data-story-resistance',
    test: /[\\/]src[\\/]data[\\/]story[\\/]resistanceStory/,
    priority: 493,
  },
  {
    name: 'data-story-epilogue',
    test: /[\\/]src[\\/]data[\\/]story[\\/]epilogueStory/,
    priority: 492,
  },
  {
    name: 'data-story-solnysh',
    test: /[\\/]src[\\/]data[\\/]story[\\/]solnyshStory/,
    priority: 491,
  },
  {
    name: 'data-story-act1',
    test: /[\\/]src[\\/]data[\\/]story[\\/](act1|act1Extended|act1ExtendedCafeOffice|explorationHubTemplate)/,
    priority: 490,
  },
  {
    name: 'data-story-act2',
    test: /[\\/]src[\\/]data[\\/]story[\\/](act2|structures[\\/]act2\.structure|texts[\\/]act2\.json)/,
    priority: 489,
  },
  {
    name: 'data-story-act3',
    test: /[\\/]src[\\/]data[\\/]story[\\/](act3|structures[\\/]act3\.structure|texts[\\/]act3\.json)/,
    priority: 488,
  },
  {
    name: 'data-story-act4',
    test: /[\\/]src[\\/]data[\\/]story[\\/](act4|act4QuietHour|structures[\\/]act4\.structure|texts[\\/]act4\.json)/,
    priority: 487,
  },
  {
    name: 'data-story-act5',
    test: /[\\/]src[\\/]data[\\/]story[\\/](act5|structures[\\/]act5\.structure|texts[\\/]act5\.json)/,
    priority: 486,
  },
  {
    name: 'data-story-act6',
    test: /[\\/]src[\\/]data[\\/]story[\\/](act6|structures[\\/]act6\.structure|texts[\\/]act6\.json)/,
    priority: 485,
  },
  {
    name: 'data-story-act7',
    test: /[\\/]src[\\/]data[\\/]story[\\/](act7|structures[\\/]act7\.structure|texts[\\/]act7\.json)/,
    priority: 484,
  },
  {
    name: 'data-story',
    test: /[\\/]src[\\/]data[\\/]story[\\/]/,
    priority: 483,
  },
  {
    name: 'data-dialogue-part1',
    test: /[\\/]src[\\/]data[\\/]dialogue[\\/]part1/,
    priority: 482,
  },
  {
    name: 'data-dialogue-part2',
    test: /[\\/]src[\\/]data[\\/]dialogue[\\/]part2/,
    priority: 481,
  },
  {
    name: 'data-dialogue-part3',
    test: /[\\/]src[\\/]data[\\/]dialogue[\\/]part3/,
    priority: 480,
  },
  {
    name: 'data-dialogue-part4',
    test: /[\\/]src[\\/]data[\\/]dialogue[\\/]part4/,
    priority: 479,
  },
  {
    name: 'data-dialogue-part5',
    test: /[\\/]src[\\/]data[\\/]dialogue[\\/]part5/,
    priority: 478,
  },
  {
    name: 'data-dialogue',
    test: /[\\/]src[\\/]data[\\/]dialogue[\\/]/,
    priority: 477,
  },
  {
    name: 'data-quests',
    test: /[\\/]src[\\/]data[\\/](quests[\\/]|quests\.|cutscenes|npcCutscenes|questItems)/,
    priority: 476,
  },
  {
    name: 'data-poems',
    test: /[\\/]src[\\/]data[\\/](poems|matrixQuotes|unifiedPoemRegistry)/,
    priority: 475,
  },
  {
    name: 'data-lore',
    test: /[\\/]src[\\/]data[\\/](loreEntries|loreSceneMap)/,
    priority: 474,
  },
  {
    name: 'data-npc',
    test: /[\\/]src[\\/]data[\\/](allNpcDefinitions|npcDefinitions|expandedNPCs|npcSchedules|npcGifts)/,
    priority: 473,
  },
  {
    name: 'data-world',
    test: /[\\/]src[\\/]data[\\/](triggerZones|weatherEffects|ambientSounds)/,
    priority: 472,
  },
  {
    name: 'data-mechanics',
    test: /[\\/]src[\\/]data[\\/](items|perks|skillTree|craftingRecipes|statusEffects|achievements|achievementHelpers|dailyMissions|tradingData|quizQuestions|constants)/,
    priority: 471,
  },
  {
    name: 'data-misc',
    test: /[\\/]src[\\/]data[\\/]/,
    priority: 470,
  },
];

/**
 * Convert groups to Rolldown's codeSplitting format.
 * Usage in vite.config.ts:
 * ```ts
 * build: {
 *   rolldownOptions: {
 *     output: {
 *       codeSplitting: {
 *         groups: toRolldownGroups(CODE_SPLITTING_GROUPS),
 *         minSize: MIN_CHUNK_SIZE,
 *       },
 *     },
 *   },
 * },
 * ```
 */
export function toRolldownGroups(
  groups: CodeSplittingGroup[],
): Array<{ name: string; test: RegExp; priority: number; minSize?: number; maxSize?: number }> {
  return groups.map((g) => ({
    name: g.name,
    test: g.test,
    priority: g.priority,
    ...(g.minSize !== undefined ? { minSize: g.minSize } : {}),
    ...(g.maxSize !== undefined ? { maxSize: g.maxSize } : {}),
  }));
}
