/**
 * Lazy game-data bootstrap — heavy content modules are dynamic-imported
 * so they stay out of the initial bundle until preload runs.
 *
 * Boot path (menu): preloadBootGameData — world/mechanics only.
 * Game start: preloadNarrativeGameData — story/dialogue/quests/poems.
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
type StoryModule = typeof import('@/data/storyNodes');
type DialogueModule = typeof import('@/data/dialogueNodes');
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

let questsMod: QuestsModule | null = null;
let poemsMod: PoemsModule | null = null;
let achievementsMod: AchievementsModule | null = null;
let dailyMissionsMod: DailyMissionsModule | null = null;
let loreMod: LoreModule | null = null;
let storyMod: StoryModule | null = null;
let dialogueMod: DialogueModule | null = null;
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
    });
  }
  await bootPromise;
}

/** Narrative blobs — load after menu or in parallel with canvas warm-up. */
export async function preloadNarrativeGameData(): Promise<void> {
  if (narrativeLoaded) return;
  if (!narrativePromise) {
    narrativePromise = Promise.all([
      import('@/data/quests'),
      import('@/data/poems'),
      import('@/data/storyNodes'),
      import('@/data/dialogueNodes'),
    ]).then(([quests, poems, story, dialogue]) => {
      questsMod = quests;
      poemsMod = poems;
      storyMod = story;
      dialogueMod = dialogue;
      narrativeLoaded = true;
    });
  }
  await narrativePromise;
}

/** Full preload — boot + narrative (save/load, dev tools). */
export async function preloadGameData(): Promise<void> {
  await preloadBootGameData();
  await preloadNarrativeGameData();
}

function assertBootLoaded(): void {
  if (!bootLoaded) {
    throw new Error('[gameDataLoader] Boot data not loaded — call preloadBootGameData() first');
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
  assertNarrativeLoaded();
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
  return storyMod!.STORY_NODES;
}

export function getDialogueNodes(): Record<string, DialogueNode> {
  assertNarrativeLoaded();
  return dialogueMod!.DIALOGUE_NODES;
}

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
