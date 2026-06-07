/**
 * Runtime narrative pack registry — story acts and dialogue parts load on demand
 * instead of merging ~244KB story + ~239KB dialogue at preload time.
 */

import type { DialogueNode, StoryNode } from '@/shared/types/game';

export type StoryPackId = 'act1' | 'act2' | 'act3' | 'act4' | 'act5' | 'act6' | 'act7' | 'chk';
export type DialoguePackId =
  | 'part1'
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
export const BOOTSTRAP_DIALOGUE_PACKS: readonly DialoguePackId[] = ['part1', 'exploration'];

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

const dialogueLoaders: Record<DialoguePackId, () => Promise<Record<string, DialogueNode>>> = {
  part1: () => import('../dialogue/part1-albert').then((m) => m.DIALOGUE_PART1),
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
const loadedDialoguePacks = new Set<DialoguePackId>();
const loadingStoryPacks = new Map<StoryPackId, Promise<void>>();
const loadingDialoguePacks = new Map<DialoguePackId, Promise<void>>();

const packChangeListeners = new Set<PackChangeListener>();

/** Merge pack nodes into the session cache; later packs win (same as Object.assign). */
function mergeNodesIntoCache<T>(
  cache: Record<string, T>,
  nodes: Record<string, T>,
  packLabel: string,
  kind: 'story' | 'dialogue',
): void {
  for (const [nodeId, node] of Object.entries(nodes)) {
    if (Object.prototype.hasOwnProperty.call(cache, nodeId)) {
      console.warn(
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

async function loadStoryPackInternal(id: StoryPackId): Promise<void> {
  if (loadedStoryPacks.has(id)) return;

  let pending = loadingStoryPacks.get(id);
  if (!pending) {
    pending = storyLoaders[id]()
      .then((nodes) => {
        mergeNodesIntoCache(storyNodes, nodes, id, 'story');
        loadedStoryPacks.add(id);
        notifyPackChange();
      })
      .finally(() => {
        loadingStoryPacks.delete(id);
      });
    loadingStoryPacks.set(id, pending);
  }

  await pending;
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

export async function loadBootstrapNarrativePacks(): Promise<void> {
  await Promise.all([
    ...BOOTSTRAP_STORY_PACKS.map(loadStoryPackInternal),
    ...BOOTSTRAP_DIALOGUE_PACKS.map(loadDialoguePackInternal),
  ]);
}

export async function loadAllNarrativePacks(): Promise<void> {
  await Promise.all([
    ...STORY_PACK_ORDER.map(loadStoryPackInternal),
    ...DIALOGUE_PACK_ORDER.map(loadDialoguePackInternal),
  ]);
}

export async function ensureStoryNode(nodeId: string): Promise<void> {
  if (hasStoryNode(nodeId)) return;

  for (const pack of STORY_PACK_ORDER) {
    await loadStoryPackInternal(pack);
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
    }),
  );
}

function scheduleIdleWork(fn: () => void, fallbackMs: number): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn);
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
    })();
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
    })();
  }, 200);
}

/** Test / dev reset — not used in production hot path. */
export function resetNarrativePackRegistryForTests(): void {
  for (const key of Object.keys(storyNodes)) delete storyNodes[key];
  for (const key of Object.keys(dialogueNodes)) delete dialogueNodes[key];
  loadedStoryPacks.clear();
  loadedDialoguePacks.clear();
  loadingStoryPacks.clear();
  loadingDialoguePacks.clear();
}
