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
  getStoryNodesCache,
  getDialogueNodesCache,
  onNarrativePacksChanged,
  hasStoryNode,
  hasDialogueNode,
} from '@/data/narrative/narrativePackRegistry';
import { invalidateGuidedStoryPathConfig } from '@/engine/guidedStory/guidedStoryPath';
import { syncStoryGraphIndexAfterNarrativeChange } from '@/engine/story/storyGraphIndex';
type TriggerModule = typeof import('@/data/triggerZones');
type ItemsModule = typeof import('@/data/items');
type NpcModule = typeof import('@/data/allNpcDefinitions');
type SkillTreeModule = typeof import('@/data/skillTree');
type PerksModule = typeof import('@/data/perks');
type NpcGiftsModule = typeof import('@/data/npcGifts');

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
    const { loadingPipeline } = await import('@/engine/loading/LoadingPipeline');
    loadingPipeline.reportStage('boot_data');
    bootPromise = Promise.all([
      import('@/data/achievements'),
      import('@/data/dailyMissions'),
      import('@/data/loreEntries'),
      import('@/data/triggerZones'),
      import('@/data/items'),
      import('@/data/allNpcDefinitions'),
      import('@/data/skillTree'),
      import('@/data/perks'),
      import('@/data/npcGifts'),
    ]).then(([
      achievements,
      dailyMissions,
      lore,
      triggers,
      items,
      npcs,
      skillTree,
      perks,
      npcGifts,
    ]) => {
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
    });
  }
  await bootPromise;
}

export function isQuestsGameDataLoaded(): boolean {
  return questsLoaded;
}

/** Narrative blobs — quests first, then story/dialogue/poems in parallel. */
export async function preloadNarrativeGameData(): Promise<void> {
  if (narrativeLoaded) return;
  if (!narrativePromise) {
    narrativePromise = (async () => {
      const quests = await import('@/data/quests');
      questsMod = quests;
      questsLoaded = true;

      const poems = await import('@/data/poems');
      poemsMod = poems;

      if (!narrativePackListenerRegistered) {
        onNarrativePacksChanged(() => {
          invalidateGuidedStoryPathConfig();
          syncStoryGraphIndexAfterNarrativeChange();
        });
        narrativePackListenerRegistered = true;
      }

      await loadBootstrapNarrativePacks();
      prefetchRemainingStoryPacksInIdle();
      narrativeLoaded = true;
    })();
  }
  await narrativePromise;
}

/** Full preload — boot + narrative + all story/dialogue packs (save/load, dev tools). */
export async function preloadGameData(): Promise<void> {
  await preloadBootGameData();
  await preloadNarrativeGameData();
  await loadAllNarrativePacks();
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

function assertLoaded(): void {
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

export function getStoryNodes(): Record<string, StoryNode> {
  assertNarrativeLoaded();
  return getStoryNodesCache() as Record<string, StoryNode>;
}

export function getDialogueNodes(): Record<string, DialogueNode> {
  assertNarrativeLoaded();
  return getDialogueNodesCache() as Record<string, DialogueNode>;
}

export {
  ensureStoryNode,
  ensureDialogueNode,
  ensureNarrativeNodeIds,
  prefetchStoryNodes,
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

export function resolveNpcIdFromSpeaker(speaker: string): string | undefined {
  assertBootLoaded();
  return npcMod!.resolveNpcIdFromSpeaker(speaker);
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
