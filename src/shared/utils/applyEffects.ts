import { useGameStore } from '@/store/gameStore';
import { createInventoryItem } from '@/data/items';
import { eventBus } from '@/engine/EventBus';
import type { StoryEffect, TrainablePlayerSkill, EnemyType } from '@/shared/types/game';

/**
 * Apply story/dialogue effects to the game store.
 * Unified version handling ALL effect types:
 * - Common: setFlag, addSkill, addKarma, addStat, addItem, npcChange, collectPoem, triggerQuest
 * - From shared version: discoverLore
 * - From orchestrator version: removeItem, combat
 *
 * Optional callbacks:
 * - onItemAdded: called when an item is added (for loot notification)
 * - startCombat: called when a combat effect is encountered
 * - shouldActivateQuest: predicate that gates quest activation; if omitted quest always activates
 */
export function applyEffects(
  effects: StoryEffect[],
  callbacks?: {
    onItemAdded?: (itemId: string, quantity: number) => void;
    startCombat?: (enemyType: EnemyType) => void;
    shouldActivateQuest?: (questId: string) => boolean;
  },
) {
  const store = useGameStore.getState();
  for (const fx of effects) {
    switch (fx.type) {
      case 'addSkill':
        if (fx.skill && fx.value) {
          store.addSkill(fx.skill as TrainablePlayerSkill, fx.value);
        }
        break;
      case 'addKarma':
        if (fx.value) store.addKarma(fx.value);
        break;
      case 'addXp':
        if (fx.value) store.addXp(fx.value);
        break;
      case 'addCredits':
        if (fx.value) store.addCredits(fx.value);
        break;
      case 'addStat':
        if (fx.stat === 'stress' && fx.value) store.addStress(fx.value);
        if (fx.stat === 'energy' && fx.value) store.addEnergy(fx.value);
        break;
      case 'setFlag':
        if (fx.flag) store.setFlag(fx.flag, fx.flagValue ?? true);
        break;
      case 'addItem':
        if (fx.itemId) {
          const added = store.addItem(createInventoryItem(fx.itemId, fx.value ?? 1));
          if (added) {
            callbacks?.onItemAdded?.(fx.itemId, fx.value ?? 1);
          }
        }
        break;
      case 'removeItem':
        if (fx.itemId) store.removeItem(fx.itemId, fx.value ?? 1);
        break;
      case 'npcChange':
        if (fx.npcId && fx.npcChange?.relation) {
          store.setNpcRelation(fx.npcId, fx.npcChange.relation);
          // Emit choice:made for 3D visual feedback on significant relation changes
          if (Math.abs(fx.npcChange.relation) >= 5) {
            eventBus.emit('choice:made', {
              karmaChange: 0,
              npcId: fx.npcId,
              relationChange: fx.npcChange.relation,
            });
          }
        }
        break;
      case 'triggerQuest':
        if (fx.questId) {
          // If a guard callback is provided, only activate when it returns true
          if (callbacks?.shouldActivateQuest ? callbacks.shouldActivateQuest(fx.questId) : true) {
            store.activateQuest(fx.questId);
          }
        }
        break;
      case 'collectPoem':
        if (fx.poemId) store.collectPoem(fx.poemId);
        break;
      case 'discoverLore':
        if (fx.loreId) {
          // Support comma-separated list of lore IDs
          const loreIds = fx.loreId.split(',').map((s) => s.trim()).filter(Boolean);
          for (const loreId of loreIds) {
            store.discoverLoreEntry(loreId);
          }
        }
        break;
      // advanceAct removed from applyEffects to prevent double-advance bug.
      // Act advancement is handled exclusively by GuidedStoryManager.
      case 'combat':
        if (fx.enemyType) {
          callbacks?.startCombat?.(fx.enemyType as EnemyType);
        }
        break;
    }
  }
}
