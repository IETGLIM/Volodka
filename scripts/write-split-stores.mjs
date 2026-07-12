import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const root = join('src', 'store');
mkdirSync(join(root, 'stores'), { recursive: true });
const w = (rel, content) => { writeFileSync(join(root, rel), content, 'utf8'); console.log('wrote', rel); };

w('storeBindings.ts', `/* Lazy store bindings */
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
  if (!ref) throw new Error(\`[storeBindings] \${name} accessed before bindSliceStores()\`);
  return ref;
}
export function getPlayerStore(): PlayerSlice { return requireBinding(getPlayerStoreRef, 'getPlayerStore')(); }
export function getExplorationStore(): ExplorationSlice { return requireBinding(getExplorationStoreRef, 'getExplorationStore')(); }
export function getWorldStore(): WorldSlice { return requireBinding(getWorldStoreRef, 'getWorldStore')(); }
export function getUIStore(): UISlice { return requireBinding(getUIStoreRef, 'getUIStore')(); }
export function getCutsceneStore(): CutsceneSlice { return requireBinding(getCutsceneStoreRef, 'getCutsceneStore')(); }
export function getSaveStore(): SaveSlice { return requireBinding(getSaveStoreRef, 'getSaveStore')(); }
export function getCombinedGameState(): GameStoreState {
  return { ...getPlayerStore(), ...getExplorationStore(), ...getWorldStore(), ...getUIStore(), ...getCutsceneStore(), ...getSaveStore() };
}
`);

w('stores/bindSliceCreator.ts', `import type { StateCreator } from 'zustand';
import type { GameStoreState } from '../types';
export function bindSliceCreator<TSlice>(creator: StateCreator<GameStoreState, [], [], TSlice>): StateCreator<TSlice, [], [], TSlice> {
  return (set, get, api) => creator(set as never, get as never, api as never);
}
`);

function sliceStore(file, hook, type, slice, creator) {
  w(`stores/${file}`, `import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ${creator}, type ${type} } from '../slices/${slice}';
import { bindSliceCreator } from './bindSliceCreator';
export const ${hook} = create<${type}>()(subscribeWithSelector(bindSliceCreator(${creator})));
export function get${hook.replace('use', '')}State(): ${type} { return ${hook}.getState(); }
`);
}

sliceStore('playerStore.ts', 'usePlayerStore', 'PlayerSlice', 'playerSlice', 'createPlayerSlice');
sliceStore('explorationStore.ts', 'useExplorationStore', 'ExplorationSlice', 'explorationSlice', 'createExplorationSlice');
sliceStore('worldStore.ts', 'useWorldStore', 'WorldSlice', 'worldSlice', 'createWorldSlice');
sliceStore('uiStore.ts', 'useUIStore', 'UISlice', 'uiSlice', 'createUISlice');
sliceStore('saveStore.ts', 'useSaveStore', 'SaveSlice', 'saveSlice', 'createSaveSlice');

w('stores/cutsceneStore.ts', `import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createCutsceneSlice, type CutsceneSlice } from '../slices/cutsceneSlice';
export const useCutsceneStore = create<CutsceneSlice>()(subscribeWithSelector((...args) => ({ ...createCutsceneSlice(...args) })));
export function getCutsceneStoreState(): CutsceneSlice { return useCutsceneStore.getState(); }
`);

w('stores/index.ts', `export { usePlayerStore, getPlayerStoreState } from './playerStore';
export { useExplorationStore, getExplorationStoreState } from './explorationStore';
export { useWorldStore, getWorldStoreState } from './worldStore';
export { useUIStore, getUIStoreState } from './uiStore';
export { useCutsceneStore, getCutsceneStoreState } from './cutsceneStore';
export { useSaveStore, getSaveStoreState } from './saveStore';
import { bindSliceStores } from '../storeBindings';
import { usePlayerStore } from './playerStore';
import { useExplorationStore } from './explorationStore';
import { useWorldStore } from './worldStore';
import { useUIStore } from './uiStore';
import { useCutsceneStore } from './cutsceneStore';
import { useSaveStore } from './saveStore';
bindSliceStores({
  getPlayerStore: () => usePlayerStore.getState(),
  getExplorationStore: () => useExplorationStore.getState(),
  getWorldStore: () => useWorldStore.getState(),
  getUIStore: () => useUIStore.getState(),
  getCutsceneStore: () => useCutsceneStore.getState(),
  getSaveStore: () => useSaveStore.getState(),
});
`);

w('patchState.ts', `import type { GameStoreState } from './types';
import type { PlayerSlice } from './slices/playerSlice';
import type { ExplorationSlice } from './slices/explorationSlice';
import type { WorldSlice } from './slices/worldSlice';
import type { UISlice } from './slices/uiSlice';
import type { CutsceneSlice } from './slices/cutsceneSlice';
import { usePlayerStore } from './stores/playerStore';
import { useExplorationStore } from './stores/explorationStore';
import { useWorldStore } from './stores/worldStore';
import { useUIStore } from './stores/uiStore';
import { useCutsceneStore } from './stores/cutsceneStore';
const PLAYER_KEYS = new Set<keyof PlayerSlice>(['playerState','notifications','activeTTLFlags','visitNode','addSkill','addKarma','addStress','addEnergy','setFlag','pushNotification','dismissNotification','restAtHome','autoRegenBetweenScenes','upsertActiveTTLFlag','upsertActiveTTLFlags','removeActiveTTLFlags','clearActiveTTLFlags','advanceAct','applyPlayerRewardBatch','addItem','removeItem','equipItem','unequipItem','addXp','addCredits','unlockSkillTreeNode','canUnlockSkill','acquirePerk','canAcquirePerk','getActivePerkEffects','craftItem','canCraft','buyItem','sellItem','canBuyItem','canSellItem','giftItemToNPC','completeQuestAndApplyRewards']);
const EXPLORATION_KEYS = new Set<keyof ExplorationSlice>(['exploration','weatherEnabled','rainIntensity','interactiveObjectStates','discoveredScenes','setExplorationScene','setPlayerPosition','setPlayerRotation','advanceTime','toggleWeather','setRainIntensity','toggleInteractiveObject','discoverScene','fastTravelTo','setExplorationTimeOfDay','setExplorationNPCStates']);
const WORLD_KEYS = new Set<keyof WorldSlice>(['quests','collectedPoems','npcRelations','poemPowers','unlockedAchievements','acceptedDailyMissions','lastDailyReset','npcAffinity','achievementProgress','activateQuest','completeQuestObjective','completeQuest','failQuest','collectPoem','setNpcRelation','activatePoemPower','getAvailablePowers','unlockAchievement','isAchievementUnlocked','getUnlockedAchievementIds','acceptDailyMission','abandonDailyMission','updateDailyMissionProgress','claimDailyMissionReward','checkDailyMissionResets','adjustNpcAffinity','getNpcAffinity','trackSceneVisit','trackNightHour','trackCombatVictory','resetConsecutiveVictories','trackMaxCombo','trackCriticalHit','trackPoemPowerInCombat']);
const UI_KEYS = new Set<keyof UISlice>(['mode','mainMenuOpen','introActive','combatActive','currentNodeId','lastSaveTimestamp','lastAutoSaveTimestamp','showStoryOverlay','narrativeKind','devToolsArmed','matrixRainEnabled','glitchIntensity','noirMode','tutorialFlags','musicVolume','musicEnabled','journalOpen','journalTab','loreEntries','conversationLog','introSeen','setMainMenuOpen','setIntroActive','setCombatActive','setCurrentNodeId','setShowStoryOverlay','openNarrativeOverlay','closeNarrativeOverlay','setNarrativeKind','armDevTools','toggleMatrixRain','setGlitchIntensity','toggleNoirMode','setMusicVolume','toggleMusic','toggleJournal','setJournalTab','setJournalOpen','addLoreEntry','discoverLoreEntry','addConversationLog','setIntroSeen']);
const CUTSCENE_KEYS = new Set<keyof CutsceneSlice>(['activeCutsceneId','cutsceneWaypoints','triggeredCutscenes','setCutscene','markCutsceneTriggered','isCutsceneTriggered']);
function pickPatch<T extends object>(patch: Partial<GameStoreState>, keys: Set<keyof T>): Partial<T> {
  const slicePatch: Partial<T> = {};
  for (const key of keys) if (key in patch) (slicePatch as Record<string, unknown>)[key as string] = patch[key as keyof GameStoreState];
  return slicePatch;
}
export function applyCombinedPatch(patch: Partial<GameStoreState>): void {
  const pp = pickPatch<PlayerSlice>(patch, PLAYER_KEYS); if (Object.keys(pp).length) usePlayerStore.setState(pp);
  const ep = pickPatch<ExplorationSlice>(patch, EXPLORATION_KEYS); if (Object.keys(ep).length) useExplorationStore.setState(ep);
  const wp = pickPatch<WorldSlice>(patch, WORLD_KEYS); if (Object.keys(wp).length) useWorldStore.setState(wp);
  const up = pickPatch<UISlice>(patch, UI_KEYS); if (Object.keys(up).length) useUIStore.setState(up);
  const cp = pickPatch<CutsceneSlice>(patch, CUTSCENE_KEYS); if (Object.keys(cp).length) useCutsceneStore.setState(cp);
}
`);

w('combinedState.ts', `export { getCombinedGameState } from './storeBindings';
export { applyCombinedPatch } from './patchState';
import type { StoreApi } from 'zustand';
import { usePlayerStore } from './stores/playerStore';
import { useExplorationStore } from './stores/explorationStore';
import { useWorldStore } from './stores/worldStore';
import { useUIStore } from './stores/uiStore';
import { useCutsceneStore } from './stores/cutsceneStore';
import { useSaveStore } from './stores/saveStore';
const SLICE_STORES: Array<StoreApi<unknown>> = [usePlayerStore, useExplorationStore, useWorldStore, useUIStore, useCutsceneStore, useSaveStore];
export function subscribeAllStores(listener: () => void): () => void {
  const unsubs = SLICE_STORES.map((store) => store.subscribe(() => listener()));
  return () => { for (const unsub of unsubs) unsub(); };
}
`);

console.log('done');
