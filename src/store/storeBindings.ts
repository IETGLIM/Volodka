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

/** Мутабельный кортеж для переиспользуемых буферов ссылок (этап 108). */
type SliceRefsBuffer = [
  PlayerSlice | null,
  ExplorationSlice | null,
  WorldSlice | null,
  UISlice | null,
  CutsceneSlice | null,
  SaveSlice | null,
  DialogueHistorySlice | null,
  AchievementSlice | null,
  DifficultySlice | null,
];

let cachedCombined: GameStoreState | null = null;
// perf (v4.25, этап 108): ссылки слайсов хранятся в ПЕРЕИСПОЛЬЗУЕМЫХ буферах.
// Раньше каждый вызов getCombinedGameState() аллоцировал массив из 9 слайсов
// только для того, чтобы сравнить его с кэшем — а вызовов сотни за кадр
// (все useGameStore.getState() в движке). Теперь collectSliceRefs заполняет
// постоянный буфер по месту, сравнение — поэлементное, без аллокаций.
// cachedSliceRefs — копия ссылок, на которых построен cachedCombined.
const EMPTY_SLICE_REFS: SliceRefsBuffer = [null, null, null, null, null, null, null, null, null];
const refsBuffer: SliceRefsBuffer = [...EMPTY_SLICE_REFS] as SliceRefsBuffer;
const cachedSliceRefs: SliceRefsBuffer = [...EMPTY_SLICE_REFS] as SliceRefsBuffer;
let cachedSliceRefsFilled = false;

function collectSliceRefs(buffer: SliceRefsBuffer): void {
  buffer[0] = getPlayerStore();
  buffer[1] = getExplorationStore();
  buffer[2] = getWorldStore();
  buffer[3] = getUIStore();
  buffer[4] = getCutsceneStore();
  buffer[5] = getSaveStore();
  buffer[6] = getDialogueHistoryStore();
  buffer[7] = getAchievementStore();
  buffer[8] = getDifficultyStore();
}

function sliceRefsEqual(a: SliceRefs | SliceRefsBuffer, b: SliceRefs | SliceRefsBuffer): boolean {
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
  collectSliceRefs(refsBuffer);
  if (cachedCombined && cachedSliceRefsFilled && sliceRefsEqual(cachedSliceRefs, refsBuffer)) {
    return cachedCombined;
  }

  // Кэш ссылок обновляется ПОЭЛЕМЕНТНО в постоянный буфер — без аллокаций.
  for (let i = 0; i < refsBuffer.length; i++) {
    cachedSliceRefs[i] = refsBuffer[i];
  }
  cachedSliceRefsFilled = true;
  // Shallow-merge all 9 Zustand slice stores into the facade state.
  //
  // IMPORTANT: we keep BOTH data AND action functions. The previous
  // implementation filtered out functions + structuredClone'd the rest,
  // which (a) stripped every action (setFlag, addKarma, addSkill,
  // setExplorationNPCStates, pushNotification, ~50+ more) — breaking 98
  // call-sites that do `useGameStore.getState().someAction(...)` — and
  // (b) structuredClone cannot clone functions anyway.
  //
  // Shallow merge is safe because Zustand slice stores enforce immutable
  // updates: every `set()` creates a new state object. The facade therefore
  // never holds a stale reference to a slice's *previous* state — when a
  // slice changes, `subscribeAllStores` invalidates the cache (see
  // gameStore.ts syncMarkFacadeDirty → invalidateCombinedGameStateCache),
  // and the next getState() rebuilds from fresh slice refs.
  //
  // Nested objects (e.g. playerState.inventory) are shared by reference
  // with the owning slice store — but Zustand immutability means those
  // references are replaced, never mutated in place. Direct mutation of
  // facade state is an architectural error that must be fixed at the
  // call-site, not papered over with deep cloning.
  const combined = Object.assign(
    {} as GameStoreState,
    refsBuffer[0],
    refsBuffer[1],
    refsBuffer[2],
    refsBuffer[3],
    refsBuffer[4],
    refsBuffer[5],
    refsBuffer[6],
    refsBuffer[7],
    refsBuffer[8],
  );
  cachedCombined = combined;
  return combined;
}

/** Drop cached combined object when slice stores change. */
export function invalidateCombinedGameStateCache(): void {
  cachedCombined = null;
  cachedSliceRefsFilled = false;
}

/**
 * Invalidate the combined-state cache only if the current slice refs differ
 * from the cached ones. If the facade was already synchronously flushed
 * (e.g. by `useGameStore.setState`'s `flushFacadeState()`), the cached refs
 * match the live refs and this is a no-op — avoids the double-rebuild that
 * happens when the `subscribeAllStores` microtask fires after a sync flush.
 */
export function invalidateCombinedGameStateCacheIfStale(): void {
  if (!cachedCombined || !cachedSliceRefsFilled) return; // already invalidated
  collectSliceRefs(refsBuffer);
  if (sliceRefsEqual(cachedSliceRefs, refsBuffer)) return; // cache still fresh
  cachedCombined = null;
  cachedSliceRefsFilled = false;
}

/** Test harness — drop cached combined object between cases. */
export function resetCombinedGameStateCacheForTests(): void {
  invalidateCombinedGameStateCache();
}
