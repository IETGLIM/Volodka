/**
 * Lazy game-data bootstrap — heavy content modules are dynamic-imported
 * so they stay out of the initial bundle until preloadGameData() runs.
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

let loadPromise: Promise<void> | null = null;
let loaded = false;

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

export function isGameDataLoaded(): boolean {
  return loaded;
}

export async function preloadGameData(): Promise<void> {
  if (loaded) return;
  if (!loadPromise) {
    loadPromise = Promise.all([
      import('@/data/quests'),
      import('@/data/poems'),
      import('@/data/achievements'),
      import('@/data/dailyMissions'),
      import('@/data/loreEntries'),
      import('@/data/storyNodes'),
      import('@/data/dialogueNodes'),
      import('@/data/triggerZones'),
      import('@/data/items'),
      import('@/data/allNpcDefinitions'),
      import('@/data/skillTree'),
      import('@/data/perks'),
      import('@/data/npcGifts'),
    ]).then(([
      quests,
      poems,
      achievements,
      dailyMissions,
      lore,
      story,
      dialogue,
      triggers,
      items,
      npcs,
      skillTree,
      perks,
      npcGifts,
    ]) => {
      questsMod = quests;
      poemsMod = poems;
      achievementsMod = achievements;
      dailyMissionsMod = dailyMissions;
      loreMod = lore;
      storyMod = story;
      dialogueMod = dialogue;
      triggerMod = triggers;
      itemsMod = items;
      npcMod = npcs;
      skillTreeMod = skillTree;
      perksMod = perks;
      npcGiftsMod = npcGifts;
      loaded = true;
    });
  }
  await loadPromise;
}

function assertLoaded(): void {
  if (!loaded) {
    throw new Error('[gameDataLoader] Game data not loaded — call preloadGameData() first');
  }
}

export function getQuestDefinitions(): QuestDefinition[] {
  assertLoaded();
  return questsMod!.QUEST_DEFINITIONS;
}

export function getPoemById(poemId: string): Poem | undefined {
  assertLoaded();
  return poemsMod!.getPoemById(poemId);
}

export function getPoems(): Poem[] {
  assertLoaded();
  return poemsMod!.POEMS;
}

export function getAchievementMap(): Record<string, AchievementDefinition> {
  assertLoaded();
  return achievementsMod!.ACHIEVEMENT_MAP;
}

export function getTotalAchievements(): number {
  assertLoaded();
  return achievementsMod!.TOTAL_ACHIEVEMENTS;
}

export function getDailyMissionById(id: string): DailyMission | undefined {
  assertLoaded();
  return dailyMissionsMod!.getDailyMissionById(id);
}

export function getInitialLoreEntries(): LoreEntry[] {
  assertLoaded();
  return loreMod!.INITIAL_LORE_ENTRIES;
}

export function getStoryNodes(): Record<string, StoryNode> {
  assertLoaded();
  return storyMod!.STORY_NODES;
}

export function getDialogueNodes(): Record<string, DialogueNode> {
  assertLoaded();
  return dialogueMod!.DIALOGUE_NODES;
}

export function getTriggerZones(): TriggerZone[] {
  assertLoaded();
  return triggerMod!.TRIGGER_ZONES;
}

export function getItemDefinition(itemId: string): ItemDefinition | undefined {
  assertLoaded();
  return itemsMod!.getItemDefinition(itemId);
}

export function createInventoryItem(itemId: string, quantity?: number) {
  assertLoaded();
  return itemsMod!.createInventoryItem(itemId, quantity);
}

export function getEquipmentSlot(itemId: string) {
  assertLoaded();
  return itemsMod!.getEquipmentSlot(itemId);
}

export function findNpcById(npcId: string): NPCDefinition | undefined {
  assertLoaded();
  return npcMod!.findNpcById(npcId);
}

export function getSkillTreeMap() {
  assertLoaded();
  return skillTreeMod!.SKILL_TREE_MAP;
}

export function getSkillEffectMap() {
  assertLoaded();
  return skillTreeMod!.SKILL_EFFECT_MAP;
}

export function getPerksMap() {
  assertLoaded();
  return perksMod!.PERKS_MAP;
}

export function getItemPreference(npcId: string, itemId: string): GiftPreference {
  assertLoaded();
  return npcGiftsMod!.getItemPreference(npcId, itemId);
}

export function getAffinityChange(preference: GiftPreference): number {
  assertLoaded();
  return npcGiftsMod!.getAffinityChange(preference);
}

export function getGiftXpReward(preference: GiftPreference): number {
  assertLoaded();
  return npcGiftsMod!.getGiftXpReward(preference);
}

export function getGiftReactionText(npcName: string, preference: GiftPreference): string {
  assertLoaded();
  return npcGiftsMod!.getGiftReactionText(npcName, preference);
}
