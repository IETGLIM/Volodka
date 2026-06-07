/**
 * Rollup manual chunk resolver.
 *
 * Goals:
 * - Lazy UI (panels, minigames, HUD widgets, scenes) → one chunk per module.
 * - Narrative engine + narrative data share one chunk (avoids circular splits).
 * - Other data → acyclic domain buckets (npc / world / mechanics).
 * - node_modules → vendor + three only.
 */

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
  'goldenPath',
]);

const DATA_DIALOGUE = new Set([
  'dialogueNodes',
  'expandedDialogueNodes',
]);

const DATA_QUESTS = new Set([
  'quests',
  'cutscenes',
  'npcCutscenes',
  'questItems',
]);

const DATA_POEMS = new Set([
  'poems',
  'matrixQuotes',
  'unifiedPoemRegistry',
]);

const DATA_LORE_NARRATIVE = new Set([
  'loreEntries',
  'loreSceneMap',
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
]);

const DATA_MECHANICS = new Set([
  'items',
  'perks',
  'skillTree',
  'craftingRecipes',
  'statusEffects',
  'achievements',
  'dailyMissions',
  'tradingData',
  'unifiedPoemRegistry',
  'quizQuestions',
  'constants',
]);

const NARRATIVE_ENGINE_MODULES = new Set([
  'GuidedStoryManager',
]);

const QUEST_ENGINE_MODULES = new Set([
  'QuestTracker',
]);

function resolveStoryPackChunk(posix: string): string | undefined {
  if (!posix.includes('/src/data/chkTolpa/')) return undefined;
  if (posix.includes('/npcs.')) return 'pack-chk-npc';
  if (posix.includes('/schedules.')) return 'pack-chk-npc';
  if (posix.includes('/triggerZones.')) return 'pack-chk-world';
  return 'pack-chk-narrative';
}

function resolveDataChunk(posix: string): string | undefined {
  if (!posix.includes('/src/data/')) return undefined;

  const pack = resolveStoryPackChunk(posix);
  if (pack) return pack;

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

  if (
    posix.includes('/@dimforge/rapier') ||
    posix.includes('/@react-three/rapier')
  ) {
    return 'physics';
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
    return 'data-misc';
  }
  return undefined;
}

export function resolveManualChunk(id: string): string | undefined {
  const posix = toPosix(id);

  const vendor = resolveVendorChunk(posix);
  if (vendor) return vendor;

  if (!posix.includes('/src/')) return undefined;

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

  if (base.endsWith('Panel') && posix.includes('/src/components/game/')) {
    return `panel-${toKebab(base.replace(/Panel$/, ''))}`;
  }

  if (LAZY_HUD_MODULES.has(base) && posix.includes('/src/components/game/')) {
    return `game-ui-${toKebab(base)}`;
  }

  if (LAZY_GAME_UI_MODULES.has(base) && posix.includes('/src/components/game/')) {
    return `game-ui-${toKebab(base)}`;
  }

  if (base === 'RPGGameCanvas') return 'game-canvas';

  if (base === 'PhysicsSceneInner') return 'physics-scene';

  if (base.endsWith('Visual') && posix.includes('/src/components/3d/')) {
    return `scene-${toKebab(base.replace(/Visual$/, ''))}`;
  }

  if (base === 'InteriorModels' && posix.includes('/src/components/3d/')) {
    return 'scene-shared-interior';
  }

  return resolveDataChunk(posix);
}
