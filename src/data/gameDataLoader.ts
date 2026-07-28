/**
 * Lazy game-data bootstrap — heavy content modules are dynamic-imported
 * so they stay out of the initial bundle until preload runs.
 *
 * Boot path (menu): preloadBootGameData — world/mechanics only.
 * Game start: preloadNarrativeGameData — quests/poems + bootstrap story/dialogue packs.
 * Additional acts/parts load on demand via ensureStoryNode / ensureDialogueNode.
 */

import type {
  QuestDefinition,
  Poem,
  StoryNode,
  DialogueNode,
  NPCDefinition,
} from '@/shared/types/game';
import type { LoreEntry } from '@/store/shared';
import type { GiftPreference } from '@/data/npcGifts';
import type { AchievementDefinition } from '@/data/achievements';
import type { DailyMission } from '@/data/dailyMissions';
import type { TriggerZone } from '@/data/triggerZones';
import type { ItemDefinition } from '@/data/items';

type QuestsModule = typeof import('@/data/quests');
type PoemsModule = typeof import('@/data/poems');
type AchievementsModule = typeof import('@/data/achievements');
type DailyMissionsModule = typeof import('@/data/dailyMissions');
type LoreModule = typeof import('@/data/loreEntries');
import {
  loadBootstrapNarrativePacks,
  loadAllNarrativePacks,
  ensureStoryNode,
  ensureDialogueNode,
  ensureNarrativeNodeIds,
  prefetchStoryNodes,
  prefetchRemainingStoryPacksInIdle,
  prefetchDialogueNodes,
  prefetchRemainingDialoguePacksInIdle,
  getStoryNodesCache,
  getDialogueNodesCache,
  onNarrativePacksChanged,
  hasStoryNode,
  hasDialogueNode,
  getLoadedStoryPackIds,
  getLoadedDialoguePackIds,
  resetNarrativePackRegistryForTests,
} from '@/data/narrative/narrativePackRegistry';
type TriggerModule = typeof import('@/data/triggerZones');
type ItemsModule = typeof import('@/data/items');
type NpcModule = typeof import('@/data/allNpcDefinitions');
type SkillTreeModule = typeof import('@/data/skillTree');
type PerksModule = typeof import('@/data/perks');
type NpcGiftsModule = typeof import('@/data/npcGifts');

const PRELOAD_GAME_DATA_TIMEOUT_MS = 30_000;

let bootPromise: Promise<void> | null = null;
let narrativePromise: Promise<void> | null = null;
let bootLoaded = false;
let narrativeLoaded = false;
let questsLoaded = false;

let questsMod: QuestsModule | null = null;
let poemsMod: PoemsModule | null = null;
let achievementsMod: AchievementsModule | null = null;
let dailyMissionsMod: DailyMissionsModule | null = null;
let loreMod: LoreModule | null = null;
let narrativePackListenerRegistered = false;
let triggerMod: TriggerModule | null = null;
let itemsMod: ItemsModule | null = null;
let npcMod: NpcModule | null = null;
let skillTreeMod: SkillTreeModule | null = null;
let perksMod: PerksModule | null = null;
let npcGiftsMod: NpcGiftsModule | null = null;

export interface GameDataLoadState {
  bootLoaded: boolean;
  narrativeLoaded: boolean;
  questsLoaded: boolean;
  bootModuleCount: number;
  narrativeModuleCount: number;
  storyNodeCount: number;
  dialogueNodeCount: number;
  loadedStoryPackCount: number;
  loadedDialoguePackCount: number;
}

function countBootModulesLoaded(): number {
  let count = 0;
  if (achievementsMod) count++;
  if (dailyMissionsMod) count++;
  if (loreMod) count++;
  if (triggerMod) count++;
  if (itemsMod) count++;
  if (npcMod) count++;
  if (skillTreeMod) count++;
  if (perksMod) count++;
  if (npcGiftsMod) count++;
  return count;
}

function countNarrativeModulesLoaded(): number {
  let count = 0;
  if (questsMod) count++;
  if (poemsMod) count++;
  return count;
}

export function getGameDataLoadState(): GameDataLoadState {
  return {
    bootLoaded,
    narrativeLoaded,
    questsLoaded,
    bootModuleCount: countBootModulesLoaded(),
    narrativeModuleCount: countNarrativeModulesLoaded(),
    storyNodeCount: Object.keys(getStoryNodesCache()).length,
    dialogueNodeCount: Object.keys(getDialogueNodesCache()).length,
    loadedStoryPackCount: getLoadedStoryPackIds().length,
    loadedDialoguePackCount: getLoadedDialoguePackIds().length,
  };
}

/** Test / dev reset — clears loader promises, flags, and narrative pack cache. */
export function resetGameDataLoader(): void {
  bootPromise = null;
  narrativePromise = null;
  bootLoaded = false;
  narrativeLoaded = false;
  questsLoaded = false;
  questsMod = null;
  poemsMod = null;
  achievementsMod = null;
  dailyMissionsMod = null;
  loreMod = null;
  narrativePackListenerRegistered = false;
  triggerMod = null;
  itemsMod = null;
  npcMod = null;
  skillTreeMod = null;
  perksMod = null;
  npcGiftsMod = null;
  resetNarrativePackRegistryForTests();
}

export function isBootGameDataLoaded(): boolean {
  return bootLoaded;
}

export function isNarrativeGameDataLoaded(): boolean {
  return narrativeLoaded;
}

export function isGameDataLoaded(): boolean {
  return bootLoaded && narrativeLoaded;
}

/** World + mechanics data for menu boot (no story/dialogue/quest blobs). */
export async function preloadBootGameData(): Promise<void> {
  if (bootLoaded) return;
  if (!bootPromise) {
    const bootStartedAt = import.meta.env?.DEV ? performance.now() : 0;
    bootPromise = (async () => {
      const { loadingPipeline } = await import('@/engine/loading/LoadingPipeline');
      loadingPipeline.reportStage('boot_data');
      try {
        const [
          achievements,
          dailyMissions,
          lore,
          triggers,
          items,
          npcs,
          skillTree,
          perks,
          npcGifts,
        ] = await Promise.all([
          import('@/data/achievements'),
          import('@/data/dailyMissions'),
          import('@/data/loreEntries'),
          import('@/data/triggerZones'),
          import('@/data/items'),
          import('@/data/allNpcDefinitions'),
          import('@/data/skillTree'),
          import('@/data/perks'),
          import('@/data/npcGifts'),
        ]);
        loadingPipeline.reportSubProgress(1);
        achievementsMod = achievements;
        dailyMissionsMod = dailyMissions;
        loreMod = lore;
        triggerMod = triggers;
        itemsMod = items;
        npcMod = npcs;
        skillTreeMod = skillTree;
        perksMod = perks;
        npcGiftsMod = npcGifts;
        bootLoaded = true;
        loadingPipeline.reportStage('boot_data');
        if (import.meta.env?.DEV) {
          console.debug(
            `[gameDataLoader] boot loaded in ${(performance.now() - bootStartedAt).toFixed(1)}ms`,
          );
        }
      } catch (error) {
        bootPromise = null;
        bootLoaded = false;
        achievementsMod = null;
        dailyMissionsMod = null;
        loreMod = null;
        triggerMod = null;
        itemsMod = null;
        npcMod = null;
        skillTreeMod = null;
        perksMod = null;
        npcGiftsMod = null;
        const { loadingPipeline: pipeline } = await import('@/engine/loading/LoadingPipeline');
        pipeline.reportError(error);
        throw error;
      }
    })();
  }
  await bootPromise;
}

export function isQuestsGameDataLoaded(): boolean {
  return questsLoaded;
}

/** Narrative blobs — quests/poems import, then bootstrap story/dialogue packs. */
export async function preloadNarrativeGameData(): Promise<void> {
  if (narrativeLoaded) return;
  if (!narrativePromise) {
    const narrativeStartedAt = import.meta.env?.DEV ? performance.now() : 0;
    narrativePromise = (async () => {
      const { loadingPipeline } = await import('@/engine/loading/LoadingPipeline');
      loadingPipeline.reportStage('narrative_data');
      try {
        const quests = await import('@/data/quests');
        const poems = await import('@/data/poems');

        if (!narrativePackListenerRegistered) {
          onNarrativePacksChanged(() => {
            void import('@/engine/guidedStory/guidedStoryPathCache').then((mod) => {
              mod.invalidateGuidedStoryPathConfig();
            });
            void import('@/engine/story/storyGraphIndex').then((mod) => {
              mod.syncStoryGraphIndexAfterNarrativeChange();
            });
          });
          narrativePackListenerRegistered = true;
        }

        await loadBootstrapNarrativePacks();
        loadingPipeline.reportStage('narrative_data');

        questsMod = quests;
        poemsMod = poems;
        questsLoaded = true;
        narrativeLoaded = true;
        prefetchRemainingStoryPacksInIdle();
        prefetchRemainingDialoguePacksInIdle();

        if (import.meta.env?.DEV) {
          console.debug(
            `[gameDataLoader] narrative loaded in ${(performance.now() - narrativeStartedAt).toFixed(1)}ms`,
          );
        }
      } catch (error) {
        narrativePromise = null;
        narrativeLoaded = false;
        questsLoaded = false;
        questsMod = null;
        poemsMod = null;
        const { loadingPipeline: pipeline } = await import('@/engine/loading/LoadingPipeline');
        pipeline.reportError(error);
        throw error;
      }
    })();
  }
  await narrativePromise;
}

/** Full preload — boot + narrative + all story/dialogue packs (save/load, dev tools). */
export async function preloadGameData(): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(new Error(`[gameDataLoader] preloadGameData timed out after ${PRELOAD_GAME_DATA_TIMEOUT_MS / 1000}s`));
    }, PRELOAD_GAME_DATA_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      (async () => {
        await preloadBootGameData();
        await preloadNarrativeGameData();
        await loadAllNarrativePacks();
      })(),
      timeoutPromise,
    ]);
  } catch (error) {
    const { loadingPipeline } = await import('@/engine/loading/LoadingPipeline');
    loadingPipeline.reportError(error);
    throw error;
  } finally {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
  }
}

function assertBootLoaded(): void {
  if (!bootLoaded) {
    throw new Error('[gameDataLoader] Boot data not loaded — call preloadBootGameData() first');
  }
}

function assertQuestsLoaded(): void {
  if (!questsLoaded) {
    throw new Error('[gameDataLoader] Quest data not loaded — call preloadNarrativeGameData() first');
  }
}

function assertNarrativeLoaded(): void {
  if (!narrativeLoaded) {
    throw new Error('[gameDataLoader] Narrative data not loaded — call preloadNarrativeGameData() first');
  }
}

function _assertLoaded(): void {
  if (!isGameDataLoaded()) {
    throw new Error('[gameDataLoader] Game data not loaded — call preloadGameData() first');
  }
}

export function getQuestDefinitions(): QuestDefinition[] {
  assertQuestsLoaded();
  return questsMod!.QUEST_DEFINITIONS;
}

export function getPoemById(poemId: string): Poem | undefined {
  assertNarrativeLoaded();
  return poemsMod!.getPoemById(poemId);
}

export function getPoems(): Poem[] {
  assertNarrativeLoaded();
  return poemsMod!.POEMS;
}

export function getAchievementMap(): Record<string, AchievementDefinition> {
  assertBootLoaded();
  return achievementsMod!.ACHIEVEMENT_MAP;
}

export function getTotalAchievements(): number {
  assertBootLoaded();
  return achievementsMod!.TOTAL_ACHIEVEMENTS;
}

export function getDailyMissionById(id: string): DailyMission | undefined {
  assertBootLoaded();
  return dailyMissionsMod!.getDailyMissionById(id);
}

export function getInitialLoreEntries(): LoreEntry[] {
  assertBootLoaded();
  return loreMod!.INITIAL_LORE_ENTRIES;
}

/**
 * Returns the in-memory story node cache. After preloadNarrativeGameData only bootstrap
 * packs (Act 1 + early dialogue) are present; later acts load via ensureStoryNode or
 * prefetchRemainingStoryPacksInIdle. Use ensureStoryNode(id) when a specific node is required.
 */
export function getStoryNodes(): Record<string, StoryNode> {
  assertNarrativeLoaded();
  return getStoryNodesCache() as Record<string, StoryNode>;
}

/**
 * Returns the in-memory dialogue node cache. Bootstrap dialogue packs load at narrative
 * preload; remaining parts load on demand via ensureDialogueNode.
 */
export function getDialogueNodes(): Record<string, DialogueNode> {
  assertNarrativeLoaded();
  return getDialogueNodesCache() as Record<string, DialogueNode>;
}

export {
  ensureStoryNode,
  ensureDialogueNode,
  ensureNarrativeNodeIds,
  prefetchStoryNodes,
  prefetchDialogueNodes,
  loadAllNarrativePacks,
  hasStoryNode,
  hasDialogueNode,
};

export function getTriggerZones(): TriggerZone[] {
  assertBootLoaded();
  return triggerMod!.TRIGGER_ZONES;
}

export function getItemDefinition(itemId: string): ItemDefinition | undefined {
  assertBootLoaded();
  return itemsMod!.getItemDefinition(itemId);
}

export function createInventoryItem(itemId: string, quantity?: number) {
  assertBootLoaded();
  return itemsMod!.createInventoryItem(itemId, quantity);
}

export function getEquipmentSlot(itemId: string) {
  assertBootLoaded();
  return itemsMod!.getEquipmentSlot(itemId);
}

export function findNpcById(npcId: string): NPCDefinition | undefined {
  assertBootLoaded();
  return npcMod!.findNpcById(npcId);
}

export function findNpcByName(name: string): NPCDefinition | undefined {
  assertBootLoaded();
  return npcMod!.findNpcByName(name);
}

export function resolveNpcIdFromSpeaker(speaker: string, speakerId?: string): string | undefined {
  assertBootLoaded();
  return npcMod!.resolveNpcIdFromSpeaker(speaker, speakerId);
}

export function getSkillTreeMap() {
  assertBootLoaded();
  return skillTreeMod!.SKILL_TREE_MAP;
}

export function getSkillEffectMap() {
  assertBootLoaded();
  return skillTreeMod!.SKILL_EFFECT_MAP;
}

export function getPerksMap() {
  assertBootLoaded();
  return perksMod!.PERKS_MAP;
}

export function getItemPreference(npcId: string, itemId: string): GiftPreference {
  assertBootLoaded();
  return npcGiftsMod!.getItemPreference(npcId, itemId);
}

export function getAffinityChange(preference: GiftPreference): number {
  assertBootLoaded();
  return npcGiftsMod!.getAffinityChange(preference);
}

export function getGiftXpReward(preference: GiftPreference): number {
  assertBootLoaded();
  return npcGiftsMod!.getGiftXpReward(preference);
}

export function getGiftReactionText(npcName: string, preference: GiftPreference): string {
  assertBootLoaded();
  return npcGiftsMod!.getGiftReactionText(npcName, preference);
}
