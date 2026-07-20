/**
 * Store layer side effects — slices commit state first, then call these helpers.
 * Centralizes AppEventBus emissions so slices never import event bus directly.
 */

import { emitAppEvent, onAppEvent } from '@/shared/events/appEventBus';
import type { ApplicationEventMap, ApplicationEventName } from '@/shared/events/applicationEventMap';
import type { SceneId } from '@/shared/types/game';

/** Run side effects after Zustand set() completes (same macrotask, after sync subscribers). */
export function runAfterStoreCommit(effect: () => void): void {
  queueMicrotask(effect);
}

export function emitStoreEvent<E extends ApplicationEventName>(
  event: E,
  payload: ApplicationEventMap[E],
): void {
  emitAppEvent(event, payload);
}

/* ─── UI / music ─── */

export function emitMusicVolumeChanged(volume: number): void {
  emitAppEvent('ui:music_volume', { volume });
  try {
    localStorage.setItem('volodka_music_volume', String(Math.round(volume * 100)));
  } catch {
    /* private browsing */
  }
}

export function scheduleMusicVolumeChanged(volume: number): void {
  runAfterStoreCommit(() => emitMusicVolumeChanged(volume));
}

export function emitMusicEnabledChanged(enabled: boolean, sceneId: SceneId): void {
  emitAppEvent('ui:music_enabled', { enabled, sceneId });
}

export function scheduleMusicEnabledChanged(enabled: boolean, sceneId: SceneId): void {
  runAfterStoreCommit(() => emitMusicEnabledChanged(enabled, sceneId));
}

export function emitLoreDiscovered(payload: ApplicationEventMap['lore:discovered']): void {
  emitAppEvent('lore:discovered', payload);
}

/* ─── Quests / world ─── */

export function emitQuestAccepted(questId: string, questTitle: string): void {
  emitAppEvent('quest:accepted', { questId, questTitle });
}

export function emitQuestObjectiveUpdated(questId: string, objectiveId: string): void {
  emitAppEvent('quest:objective_updated', { questId, objectiveId });
}

export function scheduleQuestAccepted(questId: string, questTitle: string): void {
  runAfterStoreCommit(() => emitQuestAccepted(questId, questTitle));
}

export function scheduleQuestObjectiveUpdated(questId: string, objectiveId: string): void {
  runAfterStoreCommit(() => emitQuestObjectiveUpdated(questId, objectiveId));
}

export function scheduleQuestCompleted(questId: string, npcId?: string): void {
  runAfterStoreCommit(() => emitQuestCompleted(questId, npcId));
}

export function emitQuestCompleted(questId: string, npcId?: string): void {
  emitAppEvent('quest:completed', { questId, npcId });
}

export function emitQuestFailed(payload: ApplicationEventMap['quest:failed']): void {
  emitAppEvent('quest:failed', payload);
}

export function scheduleQuestFailed(payload: ApplicationEventMap['quest:failed']): void {
  runAfterStoreCommit(() => emitQuestFailed(payload));
}

export function emitQuestRetried(questId: string, questTitle: string): void {
  emitAppEvent('quest:retried', { questId, questTitle });
}

export function scheduleQuestRetried(questId: string, questTitle: string): void {
  runAfterStoreCommit(() => emitQuestRetried(questId, questTitle));
}

export function emitQuestRewardApplied(payload: ApplicationEventMap['quest:reward_applied']): void {
  emitAppEvent('quest:reward_applied', payload);
}

export function scheduleQuestRewardApplied(payload: ApplicationEventMap['quest:reward_applied']): void {
  runAfterStoreCommit(() => emitQuestRewardApplied(payload));
}

export function emitPoemCollected(poemId: string): void {
  emitAppEvent('poem:collected', { poemId });
}

export function emitPoemResetAllEffects(): void {
  emitAppEvent('poem:reset_all_effects', {});
}

export function emitAchievementUnlocked(payload: ApplicationEventMap['achievement:unlocked']): void {
  emitAppEvent('achievement:unlocked', payload);
}

/* ─── Player / progression ─── */

export function emitChoiceMade(payload: ApplicationEventMap['choice:made']): void {
  emitAppEvent('choice:made', payload);
}

export function scheduleLevelUpEvent(event: ApplicationEventMap['player:levelup']): void {
  runAfterStoreCommit(() => emitAppEvent('player:levelup', event));
}

export function scheduleChoiceMade(payload: ApplicationEventMap['choice:made']): void {
  runAfterStoreCommit(() => emitChoiceMade(payload));
}

export function scheduleNpcGift(payload: ApplicationEventMap['npc:gift']): void {
  runAfterStoreCommit(() => emitNpcGift(payload));
}

export function emitNpcGift(payload: ApplicationEventMap['npc:gift']): void {
  emitAppEvent('npc:gift', payload);
}

/* ─── Economy / crafting ─── */

export function emitCraftingDiscovered(payload: ApplicationEventMap['crafting:discovered']): void {
  emitAppEvent('crafting:discovered', payload);
}

export function emitItemCrafted(payload: ApplicationEventMap['item:crafted']): void {
  emitAppEvent('item:crafted', payload);
}

export function scheduleCraftingDiscovered(payload: ApplicationEventMap['crafting:discovered']): void {
  runAfterStoreCommit(() => emitCraftingDiscovered(payload));
}

export function scheduleItemCrafted(payload: ApplicationEventMap['item:crafted']): void {
  runAfterStoreCommit(() => emitItemCrafted(payload));
}

/* ─── Exploration ─── */

export function emitWorldHourChanged(payload: ApplicationEventMap['world:hour_changed']): void {
  emitAppEvent('world:hour_changed', payload);
}

export function scheduleWorldHourChanged(payload: ApplicationEventMap['world:hour_changed']): void {
  runAfterStoreCommit(() => emitWorldHourChanged(payload));
}

export function emitSoundPlay(type: string): void {
  emitAppEvent('sound:play', { type });
}

/* ─── FX ─── */

export function emitXpGainFx(amount: number, source?: string): void {
  emitAppEvent('fx:xp_gain', { amount, source });
}

export function scheduleXpGainFx(amount: number, source?: string): void {
  runAfterStoreCommit(() => emitXpGainFx(amount, source));
}

/* ─── Save lifecycle ─── */

export function emitGameSaved(timestamp: number, source: 'auto' | 'manual'): void {
  emitAppEvent('game:saved', { timestamp, source });
}

/* ─── Perks ─── */

/** Fire perk:unlocked — used by playerProgressionSlice to trigger Volodka's reactive monologue. */
export function emitPerkUnlocked(
  perkId: string,
  perkName: string,
  category: string,
): void {
  emitAppEvent('perk:unlocked', { perkId, perkName, category });
}

export function schedulePerkUnlocked(
  perkId: string,
  perkName: string,
  category: string,
): void {
  runAfterStoreCommit(() => emitPerkUnlocked(perkId, perkName, category));
}

export function emitGameLoaded(): void {
  emitAppEvent('game:loaded', {});
}

export function emitGameSystemAlert(payload: ApplicationEventMap['game:system_alert']): void {
  emitAppEvent('game:system_alert', payload);
}

export function subscribeGameSaved(listener: () => void): () => void {
  return onAppEvent('game:saved', listener);
}
