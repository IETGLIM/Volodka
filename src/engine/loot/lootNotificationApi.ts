import { eventBus } from '@/engine/EventBus';
import { LOOT_NOTIFICATION_EVENT } from '@/engine/loot/lootNotificationConstants';
import {
  buildCombatLootPayload,
  buildItemReceivedPayload,
  buildKarmaChangePayload,
  buildPoemCollectedPayload,
  buildSkillUpPayload,
  buildXpGainedPayload,
  getLootNotificationSfx,
} from '@/engine/loot/lootNotificationPresentation';
import type { LootNotificationPayload, LootRarity } from '@/engine/loot/lootNotificationTypes';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import { audioEngine } from '@/engine/AudioEngine';

function playLootSfx(type: LootNotificationPayload['type']): void {
  const sfx = getLootNotificationSfx(type);
  if (sfx) audioEngine.playSfx(sfx);
}

/** Publish a loot toast via EventBus (works without LootNotification mounted). */
export function pushLootNotification(payload: LootNotificationPayload): void {
  eventBus.emit(LOOT_NOTIFICATION_EVENT, payload);
  playLootSfx(payload.type);
}

/** @deprecated Alias — prefer pushLootNotification */
export const pushNotification = pushLootNotification;

export function notifySkillUp(skill: TrainablePlayerSkill, level: number): void {
  pushLootNotification(buildSkillUpPayload(skill, level));
}

export function notifyItemReceived(name: string, rarity?: LootRarity): void {
  pushLootNotification(buildItemReceivedPayload(name, rarity));
}

export function notifyCombatLoot(name: string, rarity: LootRarity): void {
  pushLootNotification(buildCombatLootPayload(name, rarity));
}

export function notifyXpGained(amount: number): void {
  pushLootNotification(buildXpGainedPayload(amount));
}

export function notifyKarmaChange(value: number): void {
  pushLootNotification(buildKarmaChangePayload(value));
}

export function notifyPoemCollected(title: string): void {
  pushLootNotification(buildPoemCollectedPayload(title));
}
