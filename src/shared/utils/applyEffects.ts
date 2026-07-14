import { createInventoryItem } from '@/data/items';
import { emitAppEvent } from '@/shared/events/appEventBus';
import { playSfx } from '@/engine/audio/interactionSfx';
import {
  dispatchStateAction,
  tryAddInventoryItem,
} from '@/shared/gameBridge/stateDispatcher';
import { requestSceneTransitionFromBridge } from '@/shared/gameBridge/sceneTransitionBridge';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';
import { eventBus } from '@/engine/EventBus';
import type { StoryEffect, TrainablePlayerSkill, EnemyType, SceneId } from '@/shared/types/game';
import { getGameStore } from '@/store/gameStore';

/**
 * Apply story/dialogue effects via StateDispatcher — no direct store/engine imports.
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
          dispatchStateAction({
            type: 'player/addSkill',
            skill: fx.skill as TrainablePlayerSkill,
            amount: fx.value,
          });
        }
        break;
      case 'addKarma':
        if (fx.value) dispatchStateAction({ type: 'player/addKarma', amount: fx.value });
        break;
      case 'addXp':
        if (fx.value) dispatchStateAction({ type: 'player/addXp', amount: fx.value });
        break;
      case 'addCredits':
        if (fx.value) dispatchStateAction({ type: 'player/addCredits', amount: fx.value });
        break;
      case 'addStat':
        if (fx.stat === 'stress' && fx.value) {
          dispatchStateAction({ type: 'player/addStress', amount: fx.value });
        }
        if (fx.stat === 'energy' && fx.value) {
          dispatchStateAction({ type: 'player/addEnergy', amount: fx.value });
        }
        break;
      case 'setFlag':
        if (fx.flag) {
          dispatchStateAction({ type: 'player/setFlag', key: fx.flag, value: fx.flagValue ?? true });
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
          dispatchStateAction({
            type: 'inventory/removeItem',
            itemId: fx.itemId,
            quantity: fx.value ?? 1,
          });
        }
        break;
      case 'npcChange':
        if (fx.npcId && fx.npcChange?.relation) {
          const npcId = resolveCanonicalNpcId(fx.npcId);
          dispatchStateAction({
            type: 'player/setNpcRelation',
            npcId,
            delta: fx.npcChange.relation,
          });
          if (Math.abs(fx.npcChange.relation) >= 5) {
            emitAppEvent('choice:made', {
              karmaChange: 0,
              npcId,
              relationChange: fx.npcChange.relation,
            });
          }
        }
        break;
      case 'triggerQuest':
        if (fx.questId) {
          if (callbacks?.shouldActivateQuest ? callbacks.shouldActivateQuest(fx.questId) : true) {
            dispatchStateAction({ type: 'quest/activate', questId: fx.questId });
          }
        }
        break;
      case 'collectPoem':
        if (fx.poemId) dispatchStateAction({ type: 'world/collectPoem', poemId: fx.poemId });
        break;
      case 'discoverLore':
        if (fx.loreId) {
          const loreIds = fx.loreId.split(',').map((s) => s.trim()).filter(Boolean);
          for (const loreId of loreIds) {
            dispatchStateAction({ type: 'lore/discover', entryId: loreId });
          }
        }
        break;
      case 'combat':
        if (fx.enemyType) {
          callbacks?.startCombat?.(fx.enemyType as EnemyType);
        }
        break;
      case 'transitionScene':
        if (fx.sceneId) {
          requestSceneTransitionFromBridge(fx.sceneId as SceneId);
        }
        break;
      case 'visitStoryNode':
        if (fx.nodeId) {
          dispatchStateAction({ type: 'story/visitNode', nodeId: fx.nodeId });
          dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: fx.nodeId });
        }
        break;
      case 'showThought':
        if (fx.thought) {
          playSfx('examine');
          eventBus.emit('volodka:thought', {
            text: fx.thought,
            duration: fx.thoughtDuration,
          });
          // Record thought in persistent journal history
          try {
            const state = getGameStore();
            state.addThought(fx.thought, state.exploration.currentSceneId);
          } catch { /* store may not be ready */ }
        }
        break;
      case 'openDataTerminal':
        playSfx('examine');
        eventBus.emit('ui:data_terminal', {
          difficulty: fx.terminalDifficulty ?? 'easy',
          title: fx.terminalTitle ?? 'UNKNOWN TERMINAL',
          reward: fx.terminalReward,
        });
        break;
    }
  }
}
