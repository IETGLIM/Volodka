/**
 * Runtime narrative pack registry — story acts and dialogue parts load on demand
 * instead of merging ~244KB story + ~239KB dialogue at preload time.
 */

import type { DialogueNode, StoryNode } from '@/shared/types/game';
import { devWarn } from '@/shared/utils/devLog';

export type StoryPackId = 'act1' | 'act2' | 'act3' | 'act4' | 'act5' | 'act6' | 'act7' | 'chk';

/** Satellite story files merged in buildStoryNodes but not act-sized — loaded with parent acts or on demand. */
export type StorySatellitePackId =
  | 'act1Extended'
  | 'act1CafeOffice'
  | 'act1OfficeAftermath'
  | 'act1RoomExpanded'
  | 'act2Expanded'
  | 'act3Expanded'
  | 'act4Expanded'
  | 'act5Expanded'
  | 'act6Expanded'
  | 'act7Expanded'
  | 'solnysh'
  | 'act4QuietHour'
  | 'act4SideQuests'
  | 'chkExtended'
  | 'pier'
  | 'library'
  | 'factory'
  | 'resistance'
  | 'epilogue'
  | 'phase5Quests'
  | 'expansionQuests';
export type DialoguePackId =
  | 'part1'
  | 'part1AlbertExpanded'
  | 'part2'
  | 'part3'
  | 'part4'
  | 'part5'
  | 'expanded'
  | 'exploration'
  | 'chk';

export const STORY_PACK_ORDER: readonly StoryPackId[] = [
  'act1',
  'act2',
  'act3',
  'act4',
  'act5',
  'act6',
  'act7',
  'chk',
] as const;

export const DIALOGUE_PACK_ORDER: readonly DialoguePackId[] = [
  'part1',
  'part1AlbertExpanded',
  'part2',
  'part3',
  'part4',
  'part5',
  'expanded',
  'exploration',
  'chk',
] as const;

/** Minimal packs for a new game (Act 1 + early NPC / exploration dialogue). */
export const BOOTSTRAP_STORY_PACKS: readonly StoryPackId[] = ['act1'];
export const BOOTSTRAP_DIALOGUE_PACKS: readonly DialoguePackId[] = ['part1', 'part1AlbertExpanded', 'exploration'];

type PackChangeListener = () => void;

const storyLoaders: Record<StoryPackId, () => Promise<Record<string, StoryNode>>> = {
  act1: () => import('../story/act1').then((m) => m.STORY_NODES_ACT1),
  act2: () => import('../story/act2').then((m) => m.STORY_NODES_ACT2),
  act3: () => import('../story/act3').then((m) => m.STORY_NODES_ACT3),
  act4: () => import('../story/act4').then((m) => m.STORY_NODES_ACT4),
  act5: () => import('../story/act5').then((m) => m.STORY_NODES_ACT5),
  act6: () => import('../story/act6').then((m) => m.STORY_NODES_ACT6),
  act7: () => import('../story/act7').then((m) => m.STORY_NODES_ACT7),
  chk: () => import('../chkTolpa/storyNodes').then((m) => m.CHK_STORY_NODES),
};

const storySatelliteLoaders: Record<
  StorySatellitePackId,
  () => Promise<Record<string, StoryNode>>
> = {
  act1Extended: () => import('../story/act1Extended').then((m) => m.STORY_NODES_ACT1_EXTENDED),
  act1CafeOffice: () =>
    import('../story/act1ExtendedCafeOffice').then((m) => m.STORY_NODES_ACT1_CAFE_OFFICE),
  act1OfficeAftermath: () =>
    import('../story/act1ExtendedOfficeAftermath').then((m) => m.STORY_NODES_ACT1_OFFICE_AFTERMATH),
  act1RoomExpanded: () =>
    import('../story/act1-room-expanded').then((m) => m.ACT1_ROOM_EXPANDED_NODES),
  act2Expanded: () =>
    import('../story/act2-story-expanded').then((m) => m.ACT2_STORY_EXPANDED_NODES),
  act3Expanded: () =>
    import('../story/act3-story-expanded').then((m) => m.ACT3_STORY_EXPANDED_NODES),
  act4Expanded: () =>
    import('../story/act4-story-expanded').then((m) => m.ACT4_STORY_EXPANDED_NODES),
  act5Expanded: () =>
    import('../story/act5-story-expanded').then((m) => m.ACT5_STORY_EXPANDED_NODES),
  act6Expanded: () =>
    import('../story/act6-story-expanded').then((m) => m.ACT6_STORY_EXPANDED_NODES),
  act7Expanded: () =>
    import('../story/act7-story-expanded').then((m) => m.ACT7_STORY_EXPANDED_NODES),
  solnysh: () => import('../story/solnyshStory').then((m) => m.STORY_NODES_SOLNYSH),
  act4QuietHour: () =>
    import('../story/act4QuietHour').then((m) => m.STORY_NODES_ACT4_QUIET_HOUR),
  act4SideQuests: () =>
    import('../story/act4SideQuestStory').then((m) => m.STORY_NODES_ACT4_SIDE_QUESTS),
  chkExtended: () =>
    import('../chkTolpa/storyNodesExtended').then((m) => m.CHK_STORY_NODES_EXTENDED),
  pier: () => import('../story/pierStory').then((m) => m.STORY_NODES_PIER),
  library: () => import('../story/libraryStory').then((m) => m.STORY_NODES_LIBRARY),
  factory: () => import('../story/factoryStory').then((m) => m.STORY_NODES_FACTORY),
  resistance: () => import('../story/resistanceStory').then((m) => m.STORY_NODES_RESISTANCE),
  epilogue: () => import('../story/epilogueStory').then((m) => m.STORY_NODES_EPILOGUE),
  phase5Quests: () => import('../story/phase5QuestStory').then((m) => m.STORY_NODES_PHASE5_QUESTS),
  expansionQuests: () => import('../story/expansionQuestStory').then((m) => m.STORY_NODES_EXPANSION_QUESTS),
};

/** Satellites loaded automatically when their parent act pack loads. */
const ACT_STORY_SATELLITES: Partial<Record<StoryPackId, readonly StorySatellitePackId[]>> = {
  act1: ['act1Extended', 'act1CafeOffice', 'act1OfficeAftermath', 'act1RoomExpanded', 'solnysh'],
  act2: ['act2Expanded'],
  act3: ['act3Expanded'],
  act4: ['act4QuietHour', 'act4SideQuests', 'act4Expanded'],
  act5: ['act5Expanded'],
  act6: ['act6Expanded'],
  act7: ['act7Expanded'],
  chk: ['chkExtended'],
};

/** Side-story satellites loaded on demand after main acts when resolving a node id. */
export const STANDALONE_STORY_SATELLITE_ORDER: readonly StorySatellitePackId[] = [
  'pier',
  'library',
  'factory',
  'resistance',
  'epilogue',
  'phase5Quests',
  'expansionQuests',
] as const;

const dialogueLoaders: Record<DialoguePackId, () => Promise<Record<string, DialogueNode>>> = {
  part1: () => import('../dialogue/part1-albert').then((m) => m.DIALOGUE_PART1),
  part1AlbertExpanded: () => import('../dialogue/part1-albert-expanded').then((m) => m.ALBERT_EXPANDED_DIALOGUE),
  part2: () => import('../dialogue/part2-npcs').then((m) => m.DIALOGUE_PART2),
  part3: () => import('../dialogue/part3-mid').then((m) => m.DIALOGUE_PART3),
  part4: () => import('../dialogue/part4-late').then((m) => m.DIALOGUE_PART4),
  part5: () => import('../dialogue/part5-final').then((m) => m.DIALOGUE_PART5),
  expanded: () => import('../expandedDialogueNodes').then((m) => m.EXPANDED_DIALOGUE_NODES),
  exploration: () => import('../explorationDialogueNodes').then((m) => m.EXPLORATION_DIALOGUE_NODES),
  chk: () => import('../chkTolpa/dialogues').then((m) => m.CHK_DIALOGUE_NODES),
};

const storyNodes: Record<string, StoryNode> = {};
const dialogueNodes: Record<string, DialogueNode> = {};

const loadedStoryPacks = new Set<StoryPackId>();
const loadedStorySatellitePacks = new Set<StorySatellitePackId>();
const loadedDialoguePacks = new Set<DialoguePackId>();
const loadingStoryPacks = new Map<StoryPackId, Promise<void>>();
const loadingStorySatellitePacks = new Map<StorySatellitePackId, Promise<void>>();
const loadingDialoguePacks = new Map<DialoguePackId, Promise<void>>();

const packChangeListeners = new Set<PackChangeListener>();

let sceneExploreHubsLoaded = false;

async function loadSceneExploreHubsInternal(): Promise<void> {
  if (sceneExploreHubsLoaded) return;
  const { STORY_NODES_SCENE_EXPLORE_HUBS } = await import('../story/sceneExploreHubs');
  mergeNodesIntoCache(storyNodes, STORY_NODES_SCENE_EXPLORE_HUBS, 'sceneExploreHubs', 'story');
  sceneExploreHubsLoaded = true;
  notifyPackChange();
}

/** Merge pack nodes into the session cache; later packs win (same as Object.assign). */
function mergeNodesIntoCache<T>(
  cache: Record<string, T>,
  nodes: Record<string, T>,
  packLabel: string,
  kind: 'story' | 'dialogue',
): void {
  for (const [nodeId, node] of Object.entries(nodes)) {
    if (Object.prototype.hasOwnProperty.call(cache, nodeId)) {
      if (import.meta.env.DEV) console.warn(
        `[narrativePackRegistry] ${kind} node "${nodeId}" from pack "${packLabel}" overwrites an earlier definition`,
      );
    }
    cache[nodeId] = node;
  }
}

function notifyPackChange(): void {
  for (const listener of packChangeListeners) listener();
}

/** Test hook — merge without going through dynamic import. */
export function mergeStoryNodesIntoCacheForTests(
  nodes: Record<string, StoryNode>,
  packLabel: string,
): void {
  mergeNodesIntoCache(storyNodes, nodes, packLabel, 'story');
}

export function onNarrativePacksChanged(listener: PackChangeListener): () => void {
  packChangeListeners.add(listener);
  return () => packChangeListeners.delete(listener);
}

export function getLoadedStoryPackIds(): readonly StoryPackId[] {
  return [...loadedStoryPacks];
}

export function getLoadedStorySatellitePackIds(): readonly StorySatellitePackId[] {
  return [...loadedStorySatellitePacks];
}

export function getLoadedDialoguePackIds(): readonly DialoguePackId[] {
  return [...loadedDialoguePacks];
}

export function getStoryNodesCache(): Readonly<Record<string, StoryNode>> {
  // Readonly = consumer contract; cache grows until session reset (lazy pack loads).
  return storyNodes;
}

export function getDialogueNodesCache(): Readonly<Record<string, DialogueNode>> {
  return dialogueNodes;
}

export function hasStoryNode(nodeId: string): boolean {
  return nodeId in storyNodes;
}

export function hasDialogueNode(nodeId: string): boolean {
  return nodeId in dialogueNodes;
}

async function loadStorySatellitePackInternal(id: StorySatellitePackId): Promise<void> {
  if (loadedStorySatellitePacks.has(id)) return;

  let pending = loadingStorySatellitePacks.get(id);
  if (!pending) {
    pending = storySatelliteLoaders[id]()
      .then((nodes) => {
        mergeNodesIntoCache(storyNodes, nodes, id, 'story');
        loadedStorySatellitePacks.add(id);
        notifyPackChange();
      })
      .finally(() => {
        loadingStorySatellitePacks.delete(id);
      });
    loadingStorySatellitePacks.set(id, pending);
  }

  await pending;
}

async function loadActStorySatellites(actId: StoryPackId): Promise<void> {
  const satellites = ACT_STORY_SATELLITES[actId];
  if (!satellites?.length) return;
  await Promise.all(satellites.map(loadStorySatellitePackInternal));
}

async function loadStoryPackInternal(id: StoryPackId): Promise<void> {
  if (loadedStoryPacks.has(id)) return;

  let pending = loadingStoryPacks.get(id);
  if (!pending) {
    pending = storyLoaders[id]()
      .then(async (nodes) => {
        mergeNodesIntoCache(storyNodes, nodes, id, 'story');
        loadedStoryPacks.add(id);
        notifyPackChange();
        await loadActStorySatellites(id);
      })
      .finally(() => {
        loadingStoryPacks.delete(id);
      });
    loadingStoryPacks.set(id, pending);
  }

  await pending;
}

async function loadAllStorySatellitePacksInternal(): Promise<void> {
  await Promise.all(STANDALONE_STORY_SATELLITE_ORDER.map(loadStorySatellitePackInternal));
}

async function loadDialoguePackInternal(id: DialoguePackId): Promise<void> {
  if (loadedDialoguePacks.has(id)) return;

  let pending = loadingDialoguePacks.get(id);
  if (!pending) {
    pending = dialogueLoaders[id]()
      .then((nodes) => {
        mergeNodesIntoCache(dialogueNodes, nodes, id, 'dialogue');
        loadedDialoguePacks.add(id);
        notifyPackChange();
      })
      .finally(() => {
        loadingDialoguePacks.delete(id);
      });
    loadingDialoguePacks.set(id, pending);
  }

  await pending;
}

export async function loadStoryPack(id: StoryPackId): Promise<void> {
  await loadStoryPackInternal(id);
}

export async function loadDialoguePack(id: DialoguePackId): Promise<void> {
  await loadDialoguePackInternal(id);
}

export async function loadSceneExploreHubs(): Promise<void> {
  await loadSceneExploreHubsInternal();
}

export async function loadBootstrapNarrativePacks(): Promise<void> {
  await Promise.all([
    ...BOOTSTRAP_STORY_PACKS.map(loadStoryPackInternal),
    ...BOOTSTRAP_DIALOGUE_PACKS.map(loadDialoguePackInternal),
    loadSceneExploreHubsInternal(),
  ]);
}

export async function loadAllNarrativePacks(): Promise<void> {
  await Promise.all([
    ...STORY_PACK_ORDER.map(loadStoryPackInternal),
    ...DIALOGUE_PACK_ORDER.map(loadDialoguePackInternal),
    loadSceneExploreHubsInternal(),
    loadAllStorySatellitePacksInternal(),
  ]);
}

export async function ensureStoryNode(nodeId: string): Promise<void> {
  if (hasStoryNode(nodeId)) return;

  for (const pack of STORY_PACK_ORDER) {
    await loadStoryPackInternal(pack);
    if (hasStoryNode(nodeId)) return;
  }

  await loadSceneExploreHubsInternal();
  if (hasStoryNode(nodeId)) return;

  for (const satellite of STANDALONE_STORY_SATELLITE_ORDER) {
    await loadStorySatellitePackInternal(satellite);
    if (hasStoryNode(nodeId)) return;
  }

  throw new Error(`[narrativePackRegistry] Story node "${nodeId}" not found`);
}

export async function ensureDialogueNode(nodeId: string): Promise<void> {
  if (hasDialogueNode(nodeId)) return;

  for (const pack of DIALOGUE_PACK_ORDER) {
    await loadDialoguePackInternal(pack);
    if (hasDialogueNode(nodeId)) return;
  }

  throw new Error(`[narrativePackRegistry] Dialogue node "${nodeId}" not found`);
}

/** Ensure every referenced node id is available (save load / journal). */
export async function ensureNarrativeNodeIds(nodeIds: readonly string[]): Promise<void> {
  const unique = [...new Set(nodeIds.filter(Boolean))];
  if (unique.length === 0) return;

  await Promise.all(
    unique.map(async (nodeId) => {
      if (hasStoryNode(nodeId) || hasDialogueNode(nodeId)) return;

      for (const pack of STORY_PACK_ORDER) {
        await loadStoryPackInternal(pack);
        if (hasStoryNode(nodeId)) return;
      }
      for (const pack of DIALOGUE_PACK_ORDER) {
        await loadDialoguePackInternal(pack);
        if (hasDialogueNode(nodeId)) return;
      }
      for (const satellite of STANDALONE_STORY_SATELLITE_ORDER) {
        await loadStorySatellitePackInternal(satellite);
        if (hasStoryNode(nodeId)) return;
      }
    }),
  );
}

function scheduleIdleWork(fn: () => void, fallbackMs: number): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn, { timeout: fallbackMs });
    return;
  }
  globalThis.setTimeout(fn, fallbackMs);
}

export function prefetchStoryNodes(nodeIds: readonly (string | null | undefined)[]): void {
  const pending = nodeIds.filter((id): id is string => !!id && !hasStoryNode(id));
  if (pending.length === 0) return;

  scheduleIdleWork(() => {
    void (async () => {
      for (const nodeId of pending) {
        try {
          await ensureStoryNode(nodeId);
        } catch {
          /* choice may point to dialogue-only id — ignore */
        }
      }
    })().catch((err) => {
      devWarn('[narrativePackRegistry] prefetchStoryNodes failed:', err);
    });
  }, 50);
}

/** Low-priority sequential prefetch of unloaded story acts after bootstrap. */
export function prefetchRemainingStoryPacksInIdle(): void {
  scheduleIdleWork(() => {
    void (async () => {
      for (const pack of STORY_PACK_ORDER) {
        if (loadedStoryPacks.has(pack)) continue;
        await loadStoryPackInternal(pack);
      }
    })().catch((err) => {
      devWarn('[narrativePackRegistry] prefetchRemainingStoryPacksInIdle failed:', err);
    });
  }, 200);
}

/** Warm dialogue choice targets so the next talk does not hitch on pack load. */
export function prefetchDialogueNodes(nodeIds: readonly (string | null | undefined)[]): void {
  const pending = nodeIds.filter((id): id is string => !!id && !hasDialogueNode(id));
  if (pending.length === 0) return;

  scheduleIdleWork(() => {
    void (async () => {
      for (const nodeId of pending) {
        try {
          await ensureDialogueNode(nodeId);
        } catch {
          /* choice may point to story-only id — ignore */
        }
      }
    })().catch((err) => {
      devWarn('[narrativePackRegistry] prefetchDialogueNodes failed:', err);
    });
  }, 50);
}

const DEFAULT_DIALOGUE_FRONTIER_DEPTH = 2;
const DEFAULT_DIALOGUE_FRONTIER_MAX_NODES = 24;

/**
 * BFS prefetch of dialogue choice frontiers (depth 2 by default).
 * Safe: caps node count, ignores missing/story-only ids, idle-scheduled.
 */
export function prefetchDialogueFrontier(
  rootNodeIds: readonly (string | null | undefined)[],
  depth: number = DEFAULT_DIALOGUE_FRONTIER_DEPTH,
  maxNodes: number = DEFAULT_DIALOGUE_FRONTIER_MAX_NODES,
): void {
  const seeds = [...new Set(rootNodeIds.filter((id): id is string => !!id))];
  if (seeds.length === 0 || depth < 1) return;

  scheduleIdleWork(() => {
    void (async () => {
      const visited = new Set<string>();
      let frontier = seeds;
      let remaining = Math.max(1, Math.floor(depth));

      while (frontier.length > 0 && remaining > 0 && visited.size < maxNodes) {
        const nextFrontier: string[] = [];
        for (const nodeId of frontier) {
          if (visited.has(nodeId) || visited.size >= maxNodes) continue;
          visited.add(nodeId);
          try {
            await ensureDialogueNode(nodeId);
          } catch {
            continue;
          }
          const node = dialogueNodes[nodeId];
          if (!node?.choices?.length) continue;
          for (const choice of node.choices) {
            if (choice.next && !visited.has(choice.next)) {
              nextFrontier.push(choice.next);
            }
          }
        }
        frontier = nextFrontier;
        remaining -= 1;
      }
    })().catch((err) => {
      devWarn('[narrativePackRegistry] prefetchDialogueFrontier failed:', err);
    });
  }, 50);
}

/** Low-priority sequential prefetch of unloaded dialogue packs after bootstrap. */
export function prefetchRemainingDialoguePacksInIdle(): void {
  scheduleIdleWork(() => {
    void (async () => {
      for (const pack of DIALOGUE_PACK_ORDER) {
        if (loadedDialoguePacks.has(pack)) continue;
        await loadDialoguePackInternal(pack);
      }
    })().catch((err) => {
      devWarn('[narrativePackRegistry] prefetchRemainingDialoguePacksInIdle failed:', err);
    });
  }, 250);
}

/** Test / dev reset — not used in production hot path. */
export function resetNarrativePackRegistryForTests(): void {
  for (const key of Object.keys(storyNodes)) delete storyNodes[key];
  for (const key of Object.keys(dialogueNodes)) delete dialogueNodes[key];
  loadedStoryPacks.clear();
  loadedStorySatellitePacks.clear();
  loadedDialoguePacks.clear();
  loadingStoryPacks.clear();
  loadingStorySatellitePacks.clear();
  loadingDialoguePacks.clear();
  sceneExploreHubsLoaded = false;
}
