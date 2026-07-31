/**
 * Rollup manual chunk resolver.
 *
 * Goals:
 * - Lazy UI (panels, minigames, HUD widgets, scenes) → one chunk per module.
 * - Narrative engine + narrative data share one chunk (avoids circular splits).
 * - Other data → acyclic domain buckets (npc / world / mechanics).
 * - node_modules → vendor + three only.
 * - Chunks smaller than {@link SMALL_CHUNK_BYTE_THRESHOLD} merge via Rollup
 *   `experimentalMinChunkSize` in vite.config.ts.
 */

export const SMALL_CHUNK_BYTE_THRESHOLD = 5 * 1024;

/** Rollup `experimentalMinChunkSize` — merges emitted chunks smaller than 5 KB. */
export const ROLLUP_MIN_CHUNK_SIZE = SMALL_CHUNK_BYTE_THRESHOLD;

const toPosix = (id: string) => id.replace(/\\/g, '/');

function fileBase(id: string): string {
  const name = id.split('/').pop() ?? '';
  return name.replace(/\.(tsx|ts|jsx|js|mjs|cjs)$/, '');
}

function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

const MINIGAME_MODULES = new Set([
  'CodeBreakerGame',
  'OpenStackTerminalGame',
  'BashTerminalGame',
  'PoetryCompositionGame',
  'HackingGame',
  'MemoryPuzzleGame',
  'QuizGame',
  'RhythmGame',
]);

const LAZY_GAME_UI_MODULES = new Set([
  'Inventory',
  'PoetryBook',
  'SaveSlotManager',
  'MiniGameHub',
  'CombatUI',
  'MenuScreen',
  'IntroScreen',
  'StoryRenderer',
  'DialogueRenderer',
  'QuestAcceptDialog',
  'QuestCompleteDialog',
  'KarmaPoemInfoPanel',
  'MatrixRainQuote',
  'LevelUpEffect',
  'PhotoMode',
  'ShortcutsOverlay',
]);

const LAZY_HUD_MODULES = new Set([
  'HUD',
  'MiniMap',
  'QuestNotificationSystem',
  'StoryGuidanceHUD',
]);

const DATA_STORY = new Set([
  'storyNodes',
]);

const DATA_DIALOGUE = new Set([
  'dialogueNodes',
  'expandedDialogueNodes',
]);

const DATA_QUESTS = new Set([
  'quests',
  'cutscenes',
  'questItems',
  // Colocate with quests/questItems — avoids data-quests ↔ data-misc TDZ.
  'expansionQuestStubs',
  'expansionItemStubs',
]);

const DATA_POEMS = new Set([
  'poems',
  'matrixQuotes',
  'unifiedPoemRegistry',
  // Colocate with poems — poemMargins (misc) → poems → stubs would TDZ across chunks.
  'expansionPoemStubs',
  'poemMargins',
]);

const DATA_LORE_NARRATIVE = new Set([
  'loreEntries',
  'loreSceneMap',
  // Colocate with loreEntries — avoids data-lore ↔ data-misc TDZ.
  'expansionLoreStubs',
]);

const DATA_NARRATIVE = new Set([
  ...DATA_STORY,
  ...DATA_DIALOGUE,
  ...DATA_QUESTS,
  ...DATA_POEMS,
  ...DATA_LORE_NARRATIVE,
]);

const DATA_NPC = new Set([
  'allNpcDefinitions',
  'npcDefinitions',
  'expandedNPCs',
  'npcSchedules',
  'npcGifts',
]);

const DATA_WORLD = new Set([
  'triggerZones',
  'weatherEffects',
  'ambientSounds',
  // Colocate with triggerZones — value import world→misc + type import misc→world TDZ.
  'narrativeExpansionTriggerZones',
]);

const DATA_MECHANICS = new Set([
  'items',
  'perks',
  'skillTree',
  'craftingRecipes',
  'statusEffects',
  'achievements',
  'achievementHelpers',
  'dailyMissions',
  'tradingData',
  'quizQuestions',
  'constants',
]);

const NARRATIVE_ENGINE_MODULES = new Set([
  'GuidedStoryManager',
]);

const QUEST_ENGINE_MODULES = new Set([
  'QuestTracker',
]);

/** Session-scoped GPU helpers — must not live in lazy UI panel chunks (TDZ with engine-combat). */
const BOOT_SHARED_GPU_MODULES = new Set([
  'moduleGeometryRegistry',
  'moduleMaterialRegistry',
  'disposeThreeResources',
  'objectPool',
]);

/**
 * Shared leaves used by both engine-combat and engine-narrative.
 * Keep in boot-shared — otherwise Rollup parks EventBus/bridge in combat and
 * sceneInheritance/ttl helpers in narrative, recreating a combat ↔ narrative TDZ
 * (prod: Cannot access 'hn'/SCENE_DERIVED_FROM before initialization).
 */
const BOOT_SHARED_CROSS_ENGINE_MODULES = new Set([
  'EventBus',
  'eventBusDedup',
  'eventBusPriority',
  'eventBusScope',
  'emptyPayload',
  'photoEvents',
  'gameActionBridge',
  'ttlClock',
  'activeTTLFlags',
  'hmrDispose',
  'sceneInheritance',
]);

const SATELLITE_STORY_FILES: Readonly<Record<string, string>> = {
  pierStory: 'data-story-pier',
  libraryStory: 'data-story-library',
  factoryStory: 'data-story-factory',
  resistanceStory: 'data-story-resistance',
  epilogueStory: 'data-story-epilogue',
  solnyshStory: 'data-story-solnysh',
};

function resolveSatelliteStoryChunk(posix: string): string | undefined {
  for (const [file, chunk] of Object.entries(SATELLITE_STORY_FILES)) {
    if (posix.includes(`/src/data/story/${file}`)) return chunk;
  }
  return undefined;
}

function resolveStoryPackChunk(posix: string): string | undefined {
  if (!posix.includes('/src/data/chkTolpa/')) return undefined;
  // Colocate with data-npc — avoids pack-chk-npc ↔ data-npc circular chunk via schedules/npcs.
  if (posix.includes('/npcs.') || posix.includes('/schedules.')) return 'data-npc';
  if (posix.includes('/triggerZones.')) return 'pack-chk-world';
  return 'pack-chk-narrative';
}

function resolveDataChunk(posix: string): string | undefined {
  if (!posix.includes('/src/data/')) return undefined;

  // Boot-critical loader infrastructure — must NOT share a chunk with
  // contentPipelineValidator (which statically imports the full story barrel).
  // Otherwise the menu entry eagerly pulls every act chunk.
  if (
    posix.includes('/src/data/gameDataLoader') ||
    posix.includes('/src/data/narrative/')
  ) {
    return 'data-loader';
  }

  // Zero-dependency golden path tables — keep out of 'data-story' so engine
  // modules importing them don't drag the all-acts barrel into the boot graph.
  if (posix.includes('/src/data/goldenPath')) {
    return 'data-golden-path';
  }

  if (posix.includes('/src/data/poemCollectionMeta')) {
    return 'data-golden-path';
  }

  const pack = resolveStoryPackChunk(posix);
  if (pack) return pack;

  const satelliteStoryChunk = resolveSatelliteStoryChunk(posix);
  if (satelliteStoryChunk) return satelliteStoryChunk;

  if (posix.includes('/src/data/story/texts/')) {
    const actMatch = posix.match(/\/src\/data\/story\/texts\/act(\d+)\.json/);
    if (actMatch) return `data-story-act${actMatch[1]}`;
  }

  if (posix.includes('/src/data/story/structures/')) {
    const actMatch = posix.match(/\/src\/data\/story\/structures\/act(\d+)\.structure/);
    if (actMatch) return `data-story-act${actMatch[1]}`;
  }

  if (posix.includes('/src/data/story/act')) {
    const actMatch = posix.match(/\/src\/data\/story\/act(\d+)/);
    if (actMatch) return `data-story-act${actMatch[1]}`;
  }
  if (posix.includes('explorationHubTemplate')) {
    return 'data-story-act1';
  }
  if (posix.includes('/src/data/dialogue/part')) {
    const partMatch = posix.match(/\/src\/data\/dialogue\/part(\d+)/);
    if (partMatch) return `data-dialogue-part${partMatch[1]}`;
  }
  if (posix.includes('/src/data/story/')) return 'data-story';
  if (posix.includes('/src/data/quests/')) return 'data-quests';
  if (posix.includes('/src/data/dialogue/')) return 'data-dialogue';

  const base = fileBase(posix);
  if (DATA_STORY.has(base)) return 'data-story';
  if (DATA_DIALOGUE.has(base)) return 'data-dialogue';
  if (DATA_QUESTS.has(base)) return 'data-quests';
  if (DATA_POEMS.has(base)) return 'data-poems';
  if (DATA_LORE_NARRATIVE.has(base)) return 'data-lore';
  if (DATA_NARRATIVE.has(base)) return 'data-narrative';
  if (DATA_NPC.has(base)) return 'data-npc';
  if (DATA_WORLD.has(base)) return 'data-world';
  if (DATA_MECHANICS.has(base)) return 'data-mechanics';
  return 'data-misc';
}

function resolveVendorChunk(posix: string): string | undefined {
  if (!posix.includes('node_modules')) return undefined;

  // Split Rapier into two chunks:
  // - 'physics-wasm': the @dimforge/rapier3d-compat WASM wrapper (2.2 MB JS +
  //   1.5 MB WASM). This is the heavy part — lazy-loaded only when physics
  //   actually initializes (exploration mode), not during menu boot.
  // - 'physics-r3f': the @react-three/rapier React bindings (~72 KB). Small,
  //   but kept separate so it doesn't drag the WASM wrapper into boot.
  if (posix.includes('/@dimforge/rapier')) {
    return 'physics-wasm';
  }
  if (posix.includes('/@react-three/rapier')) {
    return 'physics-r3f';
  }

  if (
    posix.includes('/postprocessing/') ||
    posix.includes('/@react-three/postprocessing')
  ) {
    return 'postfx';
  }

  if (posix.includes('/@react-three/drei/')) {
    return 'drei';
  }

  if (posix.includes('/@react-three/fiber/')) {
    return 'r3f';
  }

  // Split three.js into core + examples:
  // - 'three': the core three.module.js (~575 KB). Loaded on boot.
  // - 'three-examples': examples/jsm/ (loaders, controls, postprocessing,
  //   shaders — 14 MB on disk, but only imported modules are bundled).
  //   Separating avoids pulling examples code into the core chunk.
  if (posix.includes('/node_modules/three/examples/')) {
    return 'three-examples';
  }
  if (posix.includes('/node_modules/three/')) {
    return 'three';
  }

  if (
    posix.includes('/react-dom/') ||
    posix.includes('/react/') ||
    posix.includes('/zustand/') ||
    posix.includes('/framer-motion/') ||
    posix.includes('/@radix-ui/') ||
    posix.includes('/lucide-react/') ||
    posix.includes('/recharts/') ||
    posix.includes('/cmdk/') ||
    posix.includes('/vaul/') ||
    posix.includes('/embla-carousel/')
  ) {
    return 'vendor';
  }

  return undefined;
}

function resolveBootSharedChunk(posix: string): string | undefined {
  if (
    posix.includes('/src/engine/performance/') ||
    posix.includes('/src/engine/visualSettings')
  ) {
    return 'boot-shared';
  }

  if (posix.includes('/src/engine/three/')) {
    const base = fileBase(posix);
    if (BOOT_SHARED_GPU_MODULES.has(base)) {
      return 'boot-shared';
    }
  }

  const base = fileBase(posix);
  if (BOOT_SHARED_CROSS_ENGINE_MODULES.has(base)) {
    return 'boot-shared';
  }

  return undefined;
}

/** Narrative engine modules — separate from narrative data for lazy loading. */
function resolveNarrativeChunk(posix: string): string | undefined {
  const base = fileBase(posix);
  if (QUEST_ENGINE_MODULES.has(base) && posix.includes('/src/engine/')) {
    return 'engine-quest';
  }
  if (NARRATIVE_ENGINE_MODULES.has(base) && posix.includes('/src/engine/')) {
    return 'engine-narrative';
  }
  if (posix.includes('/src/shared/validation/contentPipelineValidator')) {
    // Own chunk: statically imports the all-acts story barrel — must never be
    // colocated with boot-critical modules (gameDataLoader lives in data-loader).
    return 'content-validator';
  }
  return undefined;
}

export function resolveManualChunk(id: string): string | undefined {
  const posix = toPosix(id);

  const vendor = resolveVendorChunk(posix);
  if (vendor) return vendor;

  if (!posix.includes('/src/')) return undefined;

  const bootShared = resolveBootSharedChunk(posix);
  if (bootShared) return bootShared;

  if (
    posix.includes('/src/components/game/DevPanel') ||
    posix.includes('/src/engine/RendererInfoState') ||
    posix.includes('/src/components/3d/RendererInfoBridge')
  ) {
    return 'game-dev';
  }

  if (posix.includes('/src/engine/combat/') || posix.includes('/src/engine/CombatSystem')) {
    return 'engine-combat';
  }

  const narrative = resolveNarrativeChunk(posix);
  if (narrative) return narrative;

  const base = fileBase(posix);

  if (MINIGAME_MODULES.has(base) && posix.includes('/src/components/game/')) {
    return `minigame-${toKebab(base.replace(/Game$/, ''))}`;
  }

  // Avoid panel-* chunk for toasts — ErrorBoundary pulls WebGL cleanup; combat imports shared geometry.
  if (base === 'NotificationToastsPanel' && posix.includes('/src/components/game/')) {
    return 'game-ui-notification-toasts';
  }

  if (base.endsWith('Panel') && posix.includes('/src/components/game/')) {
    return `panel-${toKebab(base.replace(/Panel$/, ''))}`;
  }

  if (LAZY_HUD_MODULES.has(base) && posix.includes('/src/components/game/')) {
    return `game-ui-${toKebab(base)}`;
  }

  if (LAZY_GAME_UI_MODULES.has(base) && posix.includes('/src/components/game/')) {
    return `game-ui-${toKebab(base)}`;
  }

  // Main WebGL shell — isolated so menu boot does not pull three.js via colocation.
  if (base === 'RPGGameCanvas') return 'game-canvas';

  if (base === 'PhysicsSceneInner') return 'physics-scene';

  if (base.endsWith('Visual') && posix.includes('/src/components/3d/')) {
    return `scene-${toKebab(base.replace(/Visual$/, ''))}`;
  }

  if (base === 'InteriorModels' && posix.includes('/src/components/3d/')) {
    return 'scene-shared-interior';
  }

  if (posix.includes('/src/components/3d/sceneChunks/') && base.endsWith('Chunk')) {
    const folder = posix.split('/sceneChunks/')[1]?.split('/')[0];
    if (folder) return `scene-chunk-${toKebab(folder)}`;
  }

  return resolveDataChunk(posix);
}

const DATA_MODULE_SETS: ReadonlyArray<{ readonly name: string; readonly set: ReadonlySet<string> }> = [
  { name: 'DATA_STORY', set: DATA_STORY },
  { name: 'DATA_DIALOGUE', set: DATA_DIALOGUE },
  { name: 'DATA_QUESTS', set: DATA_QUESTS },
  { name: 'DATA_POEMS', set: DATA_POEMS },
  { name: 'DATA_LORE_NARRATIVE', set: DATA_LORE_NARRATIVE },
  { name: 'DATA_NPC', set: DATA_NPC },
  { name: 'DATA_WORLD', set: DATA_WORLD },
  { name: 'DATA_MECHANICS', set: DATA_MECHANICS },
];

/** CI/dev guard: detect module ids listed in more than one DATA_* bucket. */
export function validateChunkConfig(): string[] {
  const warnings: string[] = [];
  const owner = new Map<string, string>();

  for (const { name, set } of DATA_MODULE_SETS) {
    for (const moduleId of set) {
      const prev = owner.get(moduleId);
      if (prev) {
        warnings.push(`[chunks] "${moduleId}" listed in both ${prev} and ${name}`);
      }
      owner.set(moduleId, name);
    }
  }

  return warnings;
}
