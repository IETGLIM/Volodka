import { createInventoryItem } from '@/data/items';
import { eventBus } from '@/engine/EventBus';
import {
  dispatchGameAction,
  tryAddInventoryItem,
} from '@/engine/GameActionDispatcher';
import type { StoryEffect, TrainablePlayerSkill, EnemyType, SceneId } from '@/shared/types/game';

/**
 * Apply story/dialogue effects via GameActionDispatcher (+ scene transition).
 * Unified version handling ALL effect types:
 * - Common: setFlag, addSkill, addKarma, addStat, addItem, npcChange, collectPoem, triggerQuest
 * - From shared version: discoverLore
 * - From orchestrator version: removeItem, combat
 *
 * Scene travel emits scene:request_transition (binder → requestSceneTransition).
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
  for (const fx of effects) {
    switch (fx.type) {
      case 'addSkill':
        if (fx.skill && fx.value) {
          dispatchGameAction({
            type: 'player/addSkill',
            skill: fx.skill as TrainablePlayerSkill,
            amount: fx.value,
          });
        }
        break;
      case 'addKarma':
        if (fx.value) {
          dispatchGameAction({ type: 'player/addKarma', amount: fx.value });
        }
        break;
      case 'addXp':
        if (fx.value) {
          dispatchGameAction({ type: 'player/addXp', amount: fx.value });
        }
        break;
      case 'addCredits':
        if (fx.value) {
          dispatchGameAction({ type: 'player/addCredits', amount: fx.value });
        }
        break;
      case 'addStat':
        if (fx.stat === 'stress' && fx.value) {
          dispatchGameAction({ type: 'player/addStress', amount: fx.value });
        }
        if (fx.stat === 'energy' && fx.value) {
          dispatchGameAction({ type: 'player/addEnergy', amount: fx.value });
        }
        break;
      case 'setFlag':
        if (fx.flag) {
          dispatchGameAction({
            type: 'player/setFlag',
            key: fx.flag,
            value: fx.flagValue ?? true,
          });
        }
        break;
      case 'addItem':
        if (fx.itemId) {
          const added = tryAddInventoryItem(createInventoryItem(fx.itemId, fx.value ?? 1));
          if (added) {
            callbacks?.onItemAdded?.(fx.itemId, fx.value ?? 1);
          }
        }
        break;
      case 'removeItem':
        if (fx.itemId) {
          dispatchGameAction({
            type: 'inventory/removeItem',
            itemId: fx.itemId,
            quantity: fx.value ?? 1,
          });
        }
        break;
      case 'npcChange':
        if (fx.npcId && fx.npcChange?.relation) {
          dispatchGameAction({
            type: 'player/setNpcRelation',
            npcId: fx.npcId,
            delta: fx.npcChange.relation,
          });
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
            dispatchGameAction({ type: 'quest/activate', questId: fx.questId });
          }
        }
        break;
      case 'collectPoem':
        if (fx.poemId) {
          dispatchGameAction({ type: 'poem/collect', poemId: fx.poemId });
        }
        break;
      case 'discoverLore':
        if (fx.loreId) {
          // Support comma-separated list of lore IDs
          const loreIds = fx.loreId.split(',').map((s) => s.trim()).filter(Boolean);
          for (const loreId of loreIds) {
            dispatchGameAction({ type: 'lore/discover', entryId: loreId });
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
      case 'transitionScene':
        if (fx.sceneId) {
          eventBus.emit('scene:request_transition', {
            targetScene: fx.sceneId as SceneId,
          });
        }
        break;
    }
  }
}
