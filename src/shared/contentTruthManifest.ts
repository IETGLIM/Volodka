/* ═══════════════════════════════════════════════════════════════
   Volodka RPG – Content Truth Manifest

   Single documented line for where each content domain lives.
   UI and engine code should resolve display prose through the
   helpers here instead of reading parallel registries directly.
   ═══════════════════════════════════════════════════════════════ */

import type { NarrativeKind } from '@/shared/types/narrativeKind';
import type { StoryNode } from '@/shared/types/game';
import { STORY_NODES as STATIC_STORY_NODES } from '@/data/story';
import { getStoryNodes } from '@/data/gameDataLoader';
import { getExploreHubDef } from '@/shared/sceneExploreHubRegistry';

function resolveStoryNodesForProse(
  storyNodes?: Readonly<Record<string, StoryNode>>,
): Readonly<Record<string, StoryNode>> {
  if (storyNodes) return storyNodes;
  try {
    return getStoryNodes();
  } catch {
    return STATIC_STORY_NODES;
  }
}

/** Canonical source-of-truth registry — documentation + lint anchor. */
export const CONTENT_TRUTH = {
  /** Runtime narrative graph (lazy packs). CI parity: story/index STORY_NODES. */
  storyNodes: 'narrativePackRegistry → gameDataLoader.getStoryNodes()',
  /** Dialogue graph (lazy packs). */
  dialogueNodes: 'narrativePackRegistry → gameDataLoader.getDialogueNodes()',
  /** Literary poem lines — immutable author text. */
  poemText: 'data/poems.ts',
  /** Poem display names & world/combat blurbs. */
  poemDisplay: 'data/unifiedPoemRegistry.ts',
  /** Poem collection counts & taxonomy. */
  poemCollection: 'data/poemCollectionMeta.ts',
  /** Poem world-power mechanics (effect impl only; display from poemDisplay). */
  poemWorldMechanics: 'engine/PoemPowerSystem.ts',
  /** Poem combat mechanics (effect impl only; display from poemDisplay). */
  poemCombatMechanics: 'engine/combat/actions.ts',
  /** Achievement definitions. */
  achievements: 'data/achievements.ts',
  /** Achievement unlock state. */
  achievementState: 'store/worldSlice.achievements',
  /** Scene ↔ explore-hub topology (not prose when story node owns copy). */
  exploreHubTopology: 'shared/sceneExploreHubRegistry.ts',
  /** Explore-hub story nodes auto-generated from topology. */
  exploreHubGeneratedNodes: 'data/story/sceneExploreHubs.ts',
  /** Narrative UI routing (VN / diegetic / hub). */
  narrativePresentation: 'engine/narrative/presentNarrativeBeat.ts',
  /** Stackable HUD panels. */
  hudPanels: 'components/game/orchestrator/types.ts PANEL_IDS',
  /** Playthrough story visit log. */
  storyHistory: 'playerState.visitedNodes → journal/buildJournalNotes',
  /** NPC conversation transcript (runtime). */
  dialogueHistory: 'uiSlice.conversationLog → DialogueHistoryPanel',
  /** Lore codex entries. */
  loreCodex: 'data/loreEntries.ts',
  /** Golden-path guidance (derived spine + migration fallback). */
  goldenPath: 'engine/story/deriveGoldenPath.ts (+ goldenPath.ts fallback)',
} as const;

export type ContentTruthDomain = keyof typeof CONTENT_TRUTH;

/** Story-defined explore hubs — prose lives in act*.json, not hub registry. */
export const STORY_DEFINED_EXPLORE_HUB_IDS = new Set([
  'explore_mode',
  'corridor_explore_mode',
  'street_bench_view',
  'pier_explore_mode',
  'factory_explore_mode',
  'basement_explore_mode',
  'solnysh_explore_mode',
]);

/**
 * First-visit location toast when entering a closed-overlay explore hub.
 * Priority: story node hubIntroText → registry hubText.
 */
export function resolveExploreHubIntroText(
  hubId: string,
  storyNodes?: Readonly<Record<string, StoryNode>>,
): string | undefined {
  const nodes = resolveStoryNodesForProse(storyNodes);
  const node = nodes[hubId];
  if (node?.hubIntroText) return node.hubIntroText;
  if (STORY_DEFINED_EXPLORE_HUB_IDS.has(hubId) && node?.text) return node.text;
  return getExploreHubDef(hubId)?.hubText;
}

/**
 * Revisit toast for explore hubs.
 * Priority: story node hubRevisitText → contextNote → registry hubTextRevisit.
 */
export function resolveExploreHubRevisitText(
  hubId: string,
  storyNodes?: Readonly<Record<string, StoryNode>>,
): string | undefined {
  const nodes = resolveStoryNodesForProse(storyNodes);
  const node = nodes[hubId];
  if (node?.hubRevisitText) return node.hubRevisitText;
  if (node?.contextNote) return node.contextNote;
  return getExploreHubDef(hubId)?.hubTextRevisit;
}

/** Narrative beats must enter through presentNarrativeBeat — not raw overlay dispatch. */
export const NARRATIVE_OPEN_ENTRY = 'presentNarrativeBeat' as const;

export function assertNarrativeKind(kind: NarrativeKind): NarrativeKind {
  return kind;
}
