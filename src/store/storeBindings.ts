/* Lazy store bindings */
import type { GameStoreState } from './types';
import type { PlayerSlice } from './slices/playerSlice';
import type { ExplorationSlice } from './slices/explorationSlice';
import type { WorldSlice } from './slices/worldSlice';
import type { UISlice } from './slices/uiSlice';
import type { CutsceneSlice } from './slices/cutsceneSlice';
import type { SaveSlice } from './slices/saveSlice';
import type { DialogueHistorySlice } from './slices/dialogueHistorySlice';
import type { AchievementSlice } from './slices/achievementSlice';
import type { DifficultySlice } from './slices/difficultySlice';
type StoreGetter<T> = () => T;
let getPlayerStoreRef: StoreGetter<PlayerSlice> | null = null;
let getExplorationStoreRef: StoreGetter<ExplorationSlice> | null = null;
let getWorldStoreRef: StoreGetter<WorldSlice> | null = null;
let getUIStoreRef: StoreGetter<UISlice> | null = null;
let getCutsceneStoreRef: StoreGetter<CutsceneSlice> | null = null;
let getSaveStoreRef: StoreGetter<SaveSlice> | null = null;
let getDialogueHistoryStoreRef: StoreGetter<DialogueHistorySlice> | null = null;
let getAchievementStoreRef: StoreGetter<AchievementSlice> | null = null;
let getDifficultyStoreRef: StoreGetter<DifficultySlice> | null = null;
export function bindSliceStores(bindings: {
  getPlayerStore: StoreGetter<PlayerSlice>;
  getExplorationStore: StoreGetter<ExplorationSlice>;
  getWorldStore: StoreGetter<WorldSlice>;
  getUIStore: StoreGetter<UISlice>;
  getCutsceneStore: StoreGetter<CutsceneSlice>;
  getSaveStore: StoreGetter<SaveSlice>;
  getDialogueHistoryStore: StoreGetter<DialogueHistorySlice>;
  getAchievementStore: StoreGetter<AchievementSlice>;
  getDifficultyStore: StoreGetter<DifficultySlice>;
}): void {
  getPlayerStoreRef = bindings.getPlayerStore;
  getExplorationStoreRef = bindings.getExplorationStore;
  getWorldStoreRef = bindings.getWorldStore;
  getUIStoreRef = bindings.getUIStore;
  getCutsceneStoreRef = bindings.getCutsceneStore;
  getSaveStoreRef = bindings.getSaveStore;
  getDialogueHistoryStoreRef = bindings.getDialogueHistoryStore;
  getAchievementStoreRef = bindings.getAchievementStore;
  getDifficultyStoreRef = bindings.getDifficultyStore;
}
function requireBinding<T>(ref: StoreGetter<T> | null, name: string): StoreGetter<T> {
  if (!ref) throw new Error(`[storeBindings] ${name} accessed before bindSliceStores()`);
  return ref;
}
export function getPlayerStore(): PlayerSlice { return requireBinding(getPlayerStoreRef, 'getPlayerStore')(); }
export function getExplorationStore(): ExplorationSlice { return requireBinding(getExplorationStoreRef, 'getExplorationStore')(); }
export function getWorldStore(): WorldSlice { return requireBinding(getWorldStoreRef, 'getWorldStore')(); }
export function getUIStore(): UISlice { return requireBinding(getUIStoreRef, 'getUIStore')(); }
export function getCutsceneStore(): CutsceneSlice { return requireBinding(getCutsceneStoreRef, 'getCutsceneStore')(); }
export function getSaveStore(): SaveSlice { return requireBinding(getSaveStoreRef, 'getSaveStore')(); }
export function getDialogueHistoryStore(): DialogueHistorySlice { return requireBinding(getDialogueHistoryStoreRef, 'getDialogueHistoryStore')(); }
export function getAchievementStore(): AchievementSlice { return requireBinding(getAchievementStoreRef, 'getAchievementStore')(); }
export function getDifficultyStore(): DifficultySlice { return requireBinding(getDifficultyStoreRef, 'getDifficultyStore')(); }

type SliceRefs = readonly [
  PlayerSlice,
  ExplorationSlice,
  WorldSlice,
  UISlice,
  CutsceneSlice,
  SaveSlice,
  DialogueHistorySlice,
  AchievementSlice,
  DifficultySlice,
];

let cachedCombined: GameStoreState | null = null;
let cachedSliceRefs: SliceRefs | null = null;

function readSliceRefs(): SliceRefs {
  return [
    getPlayerStore(),
    getExplorationStore(),
    getWorldStore(),
    getUIStore(),
    getCutsceneStore(),
    getSaveStore(),
    getDialogueHistoryStore(),
    getAchievementStore(),
    getDifficultyStore(),
  ];
}

function sliceRefsEqual(a: SliceRefs, b: SliceRefs): boolean {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3] &&
    a[4] === b[4] &&
    a[5] === b[5] &&
    a[6] === b[6] &&
    a[7] === b[7] &&
    a[8] === b[8]
  );
}

/** Rebuild combined facade state only when a slice store reference changes. */
export function getCombinedGameState(): GameStoreState {
  const refs = readSliceRefs();
  if (cachedCombined && cachedSliceRefs && sliceRefsEqual(cachedSliceRefs, refs)) {
    return cachedCombined;
  }

  cachedSliceRefs = refs;
  // Zustand slice stores contain action functions alongside data.
  // structuredClone cannot clone functions — strip them first, keeping only
  // plain serializable data for the facade cache.
  const raw = Object.assign(
    {} as Record<string, unknown>,
    refs[0],
    refs[1],
    refs[2],
    refs[3],
    refs[4],
    refs[5],
    refs[6],
    refs[7],
    refs[8],
  );
  const dataOnly = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => typeof v !== 'function'),
  );
  const combined = structuredClone(dataOnly) as unknown as GameStoreState;
  cachedCombined = combined;
  return combined;
}

/** Drop cached combined object when slice stores change. */
export function invalidateCombinedGameStateCache(): void {
  cachedCombined = null;
  cachedSliceRefs = null;
}

/**
 * Invalidate the combined-state cache only if the current slice refs differ
 * from the cached ones. If the facade was already synchronously flushed
 * (e.g. by `useGameStore.setState`'s `flushFacadeState()`), the cached refs
 * match the live refs and this is a no-op — avoids the double-rebuild that
 * happens when the `subscribeAllStores` microtask fires after a sync flush.
 */
export function invalidateCombinedGameStateCacheIfStale(): void {
  if (!cachedCombined || !cachedSliceRefs) return; // already invalidated
  const refs = readSliceRefs();
  if (sliceRefsEqual(cachedSliceRefs, refs)) return; // cache still fresh
  cachedCombined = null;
  cachedSliceRefs = null;
}

/** Test harness — drop cached combined object between cases. */
export function resetCombinedGameStateCacheForTests(): void {
  invalidateCombinedGameStateCache();
}
