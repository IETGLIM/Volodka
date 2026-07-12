/* Lazy store bindings */
import type { GameStoreState } from './types';
import type { PlayerSlice } from './slices/playerSlice';
import type { ExplorationSlice } from './slices/explorationSlice';
import type { WorldSlice } from './slices/worldSlice';
import type { UISlice } from './slices/uiSlice';
import type { CutsceneSlice } from './slices/cutsceneSlice';
import type { SaveSlice } from './slices/saveSlice';
type StoreGetter<T> = () => T;
let getPlayerStoreRef: StoreGetter<PlayerSlice> | null = null;
let getExplorationStoreRef: StoreGetter<ExplorationSlice> | null = null;
let getWorldStoreRef: StoreGetter<WorldSlice> | null = null;
let getUIStoreRef: StoreGetter<UISlice> | null = null;
let getCutsceneStoreRef: StoreGetter<CutsceneSlice> | null = null;
let getSaveStoreRef: StoreGetter<SaveSlice> | null = null;
export function bindSliceStores(bindings: {
  getPlayerStore: StoreGetter<PlayerSlice>;
  getExplorationStore: StoreGetter<ExplorationSlice>;
  getWorldStore: StoreGetter<WorldSlice>;
  getUIStore: StoreGetter<UISlice>;
  getCutsceneStore: StoreGetter<CutsceneSlice>;
  getSaveStore: StoreGetter<SaveSlice>;
}): void {
  getPlayerStoreRef = bindings.getPlayerStore;
  getExplorationStoreRef = bindings.getExplorationStore;
  getWorldStoreRef = bindings.getWorldStore;
  getUIStoreRef = bindings.getUIStore;
  getCutsceneStoreRef = bindings.getCutsceneStore;
  getSaveStoreRef = bindings.getSaveStore;
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

type SliceRefs = readonly [
  PlayerSlice,
  ExplorationSlice,
  WorldSlice,
  UISlice,
  CutsceneSlice,
  SaveSlice,
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
  ];
}

function sliceRefsEqual(a: SliceRefs, b: SliceRefs): boolean {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3] &&
    a[4] === b[4] &&
    a[5] === b[5]
  );
}

/** Rebuild combined facade state only when a slice store reference changes. */
export function getCombinedGameState(): GameStoreState {
  const refs = readSliceRefs();
  if (cachedCombined && cachedSliceRefs && sliceRefsEqual(cachedSliceRefs, refs)) {
    return cachedCombined;
  }

  cachedSliceRefs = refs;
  const combined = Object.assign(
    {} as GameStoreState,
    refs[0],
    refs[1],
    refs[2],
    refs[3],
    refs[4],
    refs[5],
  );
  cachedCombined = combined;
  return combined;
}

/** Drop cached combined object when slice stores change. */
export function invalidateCombinedGameStateCache(): void {
  cachedCombined = null;
  cachedSliceRefs = null;
}

/** Test harness — drop cached combined object between cases. */
export function resetCombinedGameStateCacheForTests(): void {
  invalidateCombinedGameStateCache();
}
