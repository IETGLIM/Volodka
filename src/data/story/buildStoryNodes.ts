import type { StoryNode } from '@/shared/types/game';
import {
  formatStoryNodeValidationErrors,
  validateStoryNodeGraph,
  type StoryNodeValidationRegistry,
} from '@/shared/validation/storyNodeValidation';
import { CHK_STORY_NODES } from '../chkTolpa/storyNodes';
import { CHK_STORY_NODES_EXTENDED } from '../chkTolpa/storyNodesExtended';
import { STORY_NODES_SOLNYSH } from './solnyshStory';
import { STORY_NODES_ACT1 } from './act1';
import { STORY_NODES_ACT1_EXTENDED } from './act1Extended';
import { STORY_NODES_ACT1_CAFE_OFFICE } from './act1ExtendedCafeOffice';
import { STORY_NODES_ACT1_OFFICE_AFTERMATH } from './act1ExtendedOfficeAftermath';
import { ACT1_ROOM_EXPANDED_NODES } from './act1-room-expanded';
import { STORY_NODES_ACT2 } from './act2';
import { ACT2_STORY_EXPANDED_NODES } from './act2-story-expanded';
import { ACT3_STORY_EXPANDED_NODES } from './act3-story-expanded';
import { STORY_NODES_ACT3 } from './act3';
import { ACT4_STORY_EXPANDED_NODES } from './act4-story-expanded';
import { STORY_NODES_ACT4 } from './act4';
import { STORY_NODES_ACT4_QUIET_HOUR } from './act4QuietHour';
import { ACT5_STORY_EXPANDED_NODES } from './act5-story-expanded';
import { STORY_NODES_ACT5 } from './act5';
import { ACT6_STORY_EXPANDED_NODES } from './act6-story-expanded';
import { STORY_NODES_ACT6 } from './act6';
import { ACT7_STORY_EXPANDED_NODES } from './act7-story-expanded';
import { STORY_NODES_ACT7 } from './act7';
import { STORY_NODES_PIER } from './pierStory';
import { STORY_NODES_LIBRARY } from './libraryStory';
import { STORY_NODES_FACTORY } from './factoryStory';
import { STORY_NODES_RESISTANCE } from './resistanceStory';
import { STORY_NODES_SCENE_EXPLORE_HUBS } from './sceneExploreHubs';
import { STORY_NODES_EPILOGUE } from './epilogueStory';
import { STORY_NODES_PHASE5_QUESTS } from './phase5QuestStory';
import { STORY_NODES_EXPANSION_QUESTS } from './expansionQuestStory';
import { STORY_NODES_ACT4_SIDE_QUESTS } from './act4SideQuestStory';
import { AAA_EXPANSION_STORY_NODES } from './aaaExpansionStory';
import { STREET_LEGENDS_STORY_NODES } from './streetLegendsStory';
import { PIER_VOICES_STORY_NODES } from './pierVoicesStory';
import { PIER_ECHO_STORY_NODES } from './pierEchoStory';
import { ZARYA_FOURTH_VOICE_STORY_NODES } from './zaryaFourthVoiceStory';
import { FACTION_CONTRACTS_STORY_NODES } from './factionContractsStory';
import { ACT5_DREAM_WORLD_STORY_NODES } from './act5DreamWorld';
import { ACT34_CASE_EXPANSION_STORY_NODES } from './act34CaseExpansions';

/**
 * Explicit override contract for story node packs (P2 fix, v4.48.13).
 *
 * Merge semantics — deterministic and ORDER-INVARIANT:
 *  1. Every ID defined by exactly one source goes into the registry as-is.
 *  2. For an ID defined by several sources, the winner is ALWAYS the
 *     definition from the pack declared in {@link INTENTIONAL_STORY_NODE_OVERRIDES}
 *     — regardless of the order in which packs are imported/merged.
 *  3. An ID redefined by multiple packs WITHOUT a declared override is an
 *     undeclared conflict: hard error in dev/test (CI gate), deterministic
 *     last-in-declared-order fallback in production builds.
 *  4. Declared overrides that do not correspond to a real multi-source
 *     conflict (stale entries) are also errors in dev/test.
 *
 * CANONICAL DECISIONS for the five historical conflicts (the override pack
 * is the refined, integration-complete version; the base-pack copies are
 * legacy first drafts kept only because both bundles ship separately):
 *  - fix_success / office_colleague / balcony_thought / friday_arrives:
 *      canonical = `act1OfficeAftermath` (adds ambient/accessibility/guidance,
 *      quest triggers, NPC relations; rewires exit choices to the act-1
 *      aftermath graph). Base copies in `act1` are shadowed by design.
 *  - vladimir_secret_room:
 *      canonical = `phase5Quests` (wires the poem-unlock minigame flags
 *      final_poem_unlocked / final_poem_read and the library_explore_mode
 *      exits). Base copy in `act5` is shadowed by design.
 */
const INTENTIONAL_STORY_NODE_OVERRIDES: Record<string, readonly string[]> = {
  act1OfficeAftermath: ['fix_success', 'office_colleague', 'balcony_thought', 'friday_arrives'],
  phase5Quests: ['vladimir_secret_room'],
};

export interface StoryNodeSource {
  readonly name: string;
  readonly nodes: Record<string, StoryNode>;
}

/** One story ID defined by more than one pack, with the resolved winner. */
export interface StoryNodeConflict {
  readonly id: string;
  /** All packs that define this ID, in canonical source order. */
  readonly sources: readonly string[];
  /** Pack whose definition wins the merge (declared override). */
  readonly winnerSource: string;
  /** Pack that declared the override, when a declared one exists. */
  readonly declaredOverrideSource: string | null;
  /** True when at least two packs provide byte-different definitions. */
  readonly definitionsDiffer: boolean;
}

export interface StoryRegistryResult {
  readonly registry: Record<string, StoryNode>;
  /** Every multi-defined ID (declared or not). */
  readonly conflicts: readonly StoryNodeConflict[];
  /** Multi-defined IDs with no declared override — must be empty in CI. */
  readonly undeclaredConflicts: readonly StoryNodeConflict[];
  /** Declared override entries that match no real conflict or missing source. */
  readonly staleOverrides: readonly string[];
}

const isStrictEnv = (): boolean =>
  import.meta.env?.DEV === true ||
  import.meta.env?.MODE === 'test' ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

/** All story sources in their canonical declaration order. */
export const STORY_NODE_SOURCES: readonly StoryNodeSource[] = [
  { name: 'act1', nodes: STORY_NODES_ACT1 },
  { name: 'act1Extended', nodes: STORY_NODES_ACT1_EXTENDED },
  { name: 'act1CafeOffice', nodes: STORY_NODES_ACT1_CAFE_OFFICE },
  { name: 'act1OfficeAftermath', nodes: STORY_NODES_ACT1_OFFICE_AFTERMATH },
  { name: 'act1RoomExpanded', nodes: ACT1_ROOM_EXPANDED_NODES },
  { name: 'solnysh', nodes: STORY_NODES_SOLNYSH },
  { name: 'sceneExploreHubs', nodes: STORY_NODES_SCENE_EXPLORE_HUBS },
  { name: 'act2', nodes: STORY_NODES_ACT2 },
  { name: 'act2Expanded', nodes: ACT2_STORY_EXPANDED_NODES },
  { name: 'act3', nodes: STORY_NODES_ACT3 },
  { name: 'act3Expanded', nodes: ACT3_STORY_EXPANDED_NODES },
  { name: 'act4', nodes: STORY_NODES_ACT4 },
  { name: 'act4Expanded', nodes: ACT4_STORY_EXPANDED_NODES },
  { name: 'act4QuietHour', nodes: STORY_NODES_ACT4_QUIET_HOUR },
  { name: 'act5', nodes: STORY_NODES_ACT5 },
  { name: 'act5Expanded', nodes: ACT5_STORY_EXPANDED_NODES },
  { name: 'act5DreamWorld', nodes: ACT5_DREAM_WORLD_STORY_NODES },
  { name: 'act6', nodes: STORY_NODES_ACT6 },
  { name: 'act6Expanded', nodes: ACT6_STORY_EXPANDED_NODES },
  { name: 'act7', nodes: STORY_NODES_ACT7 },
  { name: 'act7Expanded', nodes: ACT7_STORY_EXPANDED_NODES },
  { name: 'chkTolpa', nodes: CHK_STORY_NODES },
  { name: 'chkTolpaExtended', nodes: CHK_STORY_NODES_EXTENDED },
  { name: 'pier', nodes: STORY_NODES_PIER },
  { name: 'library', nodes: STORY_NODES_LIBRARY },
  { name: 'factory', nodes: STORY_NODES_FACTORY },
  { name: 'resistance', nodes: STORY_NODES_RESISTANCE },
  { name: 'epilogue', nodes: STORY_NODES_EPILOGUE },
  { name: 'phase5Quests', nodes: STORY_NODES_PHASE5_QUESTS },
  { name: 'expansionQuests', nodes: STORY_NODES_EXPANSION_QUESTS },
  { name: 'act4SideQuests', nodes: STORY_NODES_ACT4_SIDE_QUESTS },
  { name: 'aaaExpansion', nodes: AAA_EXPANSION_STORY_NODES },
  { name: 'streetLegends', nodes: STREET_LEGENDS_STORY_NODES },
  { name: 'pierVoices', nodes: PIER_VOICES_STORY_NODES },
  { name: 'pierEcho', nodes: PIER_ECHO_STORY_NODES },
  { name: 'zaryaFourthVoice', nodes: ZARYA_FOURTH_VOICE_STORY_NODES },
  { name: 'factionContracts', nodes: FACTION_CONTRACTS_STORY_NODES },
  { name: 'act34CaseExpansions', nodes: ACT34_CASE_EXPANSION_STORY_NODES },
];

function stableNodeJson(node: StoryNode): string {
  return JSON.stringify(node, Object.keys(node).sort());
}

/**
 * Pure, order-invariant registry builder. Accepts ANY source order and
 * always yields the same registry (declared overrides win by contract,
 * not by merge position).
 */
export function buildStoryRegistryFrom(
  sources: readonly StoryNodeSource[],
  options: { readonly strict?: boolean } = {},
): StoryRegistryResult {
  const strict = options.strict ?? false;
  const sourceByName = new Map(sources.map((s) => [s.name, s] as const));

  // Group every definition by story ID.
  const defsById = new Map<string, Array<{ source: string; node: StoryNode }>>();
  for (const source of sources) {
    for (const [id, node] of Object.entries(source.nodes)) {
      const bucket = defsById.get(id);
      if (bucket) bucket.push({ source: source.name, node });
      else defsById.set(id, [{ source: source.name, node }]);
    }
  }

  const registry: Record<string, StoryNode> = {};
  const conflicts: StoryNodeConflict[] = [];
  const undeclaredConflicts: StoryNodeConflict[] = [];
  const errorLines: string[] = [];

  for (const [id, defs] of defsById) {
    if (defs.length === 1) {
      registry[id] = defs[0].node;
      continue;
    }

    // Multi-defined ID — resolve the winner by explicit contract.
    const declaringSources = defs
      .filter((d) => (INTENTIONAL_STORY_NODE_OVERRIDES[d.source] ?? []).includes(id))
      .map((d) => d.source);

    let winnerSource: string;
    let declaredOverrideSource: string | null;
    if (declaringSources.length === 1) {
      declaredOverrideSource = declaringSources[0];
      winnerSource = declaredOverrideSource;
    } else if (declaringSources.length > 1) {
      // Ambiguous policy — always an error, even in production.
      errorLines.push(
        `"${id}" declared as override by multiple packs: ${declaringSources.join(', ')}`,
      );
      declaredOverrideSource = declaringSources[0];
      winnerSource = declaredOverrideSource;
    } else {
      declaredOverrideSource = null;
      // Undeclared conflict: deterministic fallback = last in DECLARED
      // source order (legacy last-wins semantics, but static — no runtime
      // import order can change it).
      const canonicalOrder = STORY_NODE_SOURCES.map((s) => s.name);
      const ranked = [...defs].sort(
        (a, b) => canonicalOrder.indexOf(a.source) - canonicalOrder.indexOf(b.source),
      );
      winnerSource = ranked[ranked.length - 1].source;
      errorLines.push(`"${id}" redefined by ${defs.map((d) => d.source).join(', ')} without a declared override`);
    }

    const winnerDef = defs.find((d) => d.source === winnerSource) ?? defs[defs.length - 1];
    registry[id] = winnerDef.node;

    const canonicalOrderNames = new Set(STORY_NODE_SOURCES.map((s) => s.name));
    const sortedDefs = [...defs].sort((a, b) => {
      const ia = canonicalOrderNames.has(a.source) ? STORY_NODE_SOURCES.findIndex((s) => s.name === a.source) : 999;
      const ib = canonicalOrderNames.has(b.source) ? STORY_NODE_SOURCES.findIndex((s) => s.name === b.source) : 999;
      return ia - ib;
    });
    const definitionsDiffer = new Set(defs.map((d) => stableNodeJson(d.node))).size > 1;
    const conflict: StoryNodeConflict = {
      id,
      sources: sortedDefs.map((d) => d.source),
      winnerSource,
      declaredOverrideSource,
      definitionsDiffer,
    };
    conflicts.push(conflict);
    if (declaredOverrideSource === null) undeclaredConflicts.push(conflict);
  }

  // Deterministic report order — independent of the incoming source order.
  conflicts.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  undeclaredConflicts.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // Stale override entries — declared but not backed by a real conflict.
  const staleOverrides: string[] = [];
  for (const [sourceName, ids] of Object.entries(INTENTIONAL_STORY_NODE_OVERRIDES)) {
    if (!sourceByName.has(sourceName)) {
      staleOverrides.push(`${sourceName} (unknown source)`);
      errorLines.push(`override source "${sourceName}" is not in the pack list`);
    }
    for (const id of ids) {
      const defs = defsById.get(id);
      if (!defs || defs.length < 2) {
        staleOverrides.push(`${sourceName}→${id} (no conflicting definitions)`);
      } else if (!defs.some((d) => d.source === sourceName)) {
        staleOverrides.push(`${sourceName}→${id} (source does not define this ID)`);
      }
    }
  }

  if (errorLines.length > 0) {
    const message = `[STORY_NODES] ${errorLines.length} story-node registry error(s):\n${errorLines.join('\n')}`;
    if (strict || isStrictEnv()) throw new Error(message);
    console.error(message);
  }
  if (staleOverrides.length > 0 && (strict || isStrictEnv())) {
    throw new Error(
      `[STORY_NODES] stale override entries (no real conflict behind them):\n${staleOverrides.join('\n')}`,
    );
  }

  return { registry, conflicts, undeclaredConflicts, staleOverrides };
}

/**
 * Master story node registry. Order-invariant merge with an explicit
 * override contract — see {@link INTENTIONAL_STORY_NODE_OVERRIDES}.
 */
export function buildStoryNodes(): Record<string, StoryNode> {
  return buildStoryRegistryFrom(STORY_NODE_SOURCES).registry;
}

export function validateStoryNodes(
  nodes: Record<string, StoryNode>,
  registry?: StoryNodeValidationRegistry,
): string[] {
  if (registry) {
    return formatStoryNodeValidationErrors(validateStoryNodeGraph(nodes, registry));
  }

  const errors: string[] = [];
  for (const [id, node] of Object.entries(nodes)) {
    for (const choice of node.choices) {
      if (choice.next !== null && !nodes[choice.next]) {
        errors.push(`"${id}" → "${choice.next}" (not found)`);
      }
    }
  }
  return errors;
}
